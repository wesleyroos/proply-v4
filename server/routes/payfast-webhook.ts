import express from 'express';
import { db } from '@db';
import { agencyPaymentMethods } from '@db/schema';
import { eq } from 'drizzle-orm';

const router = express.Router();

// PayFast webhook notification handler
router.post('/notify', express.raw({ type: 'application/x-www-form-urlencoded' }), async (req, res) => {
  console.log('\n=== PAYFAST WEBHOOK RECEIVED ===');
  console.log('Headers:', req.headers);
  console.log('Raw body:', req.body?.toString());
  
  try {
    const { payfastTokenizationSessions } = await import('@db/schema');
    
    // Parse the form data
    const bodyStr = req.body?.toString() || '';
    const params = new URLSearchParams(bodyStr);
    const data: Record<string, string> = {};
    
    params.forEach((value, key) => {
      data[key] = value;
    });
    
    console.log('Parsed webhook data:', data);
    
    // Check if this is a tokenization response
    if (data.token && data.payment_status && data.m_payment_id) {
      console.log('Tokenization webhook received:', {
        token: data.token,
        payment_status: data.payment_status,
        m_payment_id: data.m_payment_id,
        signature: data.signature
      });
      
      // Find the tokenization session using m_payment_id (which is our session ID)
      const tokenizationSession = await db.query.payfastTokenizationSessions.findFirst({
        where: eq(payfastTokenizationSessions.sessionId, data.m_payment_id),
        with: {
          user: true,
          agencyBranch: true
        }
      });
      
      if (!tokenizationSession) {
        console.log('❌ No tokenization session found for m_payment_id:', data.m_payment_id);
        res.status(200).send('OK');
        return;
      }
      
      console.log('✅ Found tokenization session for user:', tokenizationSession.user.email, 'branch:', tokenizationSession.agencyBranch.branchName);
      
      // Store the token if tokenization was successful
      if (data.payment_status === 'COMPLETE' && data.token) {
        console.log('Tokenization successful, storing token for branch:', tokenizationSession.agencyBranchId);
        
        try {
          // Extract card details from webhook data
          const cardLastFour = data.token.slice(-4) || '0000'; // Use last 4 digits of token as fallback
          const cardBrand = data.card_scheme || 'Unknown';
          
          // Create new payment method record with session details
          await db.insert(agencyPaymentMethods).values({
            agencyBranchId: tokenizationSession.agencyBranchId,
            payfastToken: data.token,
            cardLastFour: cardLastFour,
            expiryMonth: 12, // Will be updated when we get card details
            expiryYear: 2030, // Will be updated when we get card details
            cardBrand: cardBrand,
            isActive: true,
            addedBy: tokenizationSession.userId
          });
          
          // Update tokenization session status
          await db.update(payfastTokenizationSessions)
            .set({
              status: 'completed',
              payfastToken: data.token,
              cardLastFour: cardLastFour,
              cardBrand: cardBrand,
              completedAt: new Date(),
              updatedAt: new Date()
            })
            .where(eq(payfastTokenizationSessions.sessionId, data.m_payment_id));
          
          console.log('✅ Payment method and session updated successfully');
        } catch (dbError) {
          console.error('❌ Error storing payment method:', dbError);
          
          // Update session to failed status
          await db.update(payfastTokenizationSessions)
            .set({
              status: 'failed',
              updatedAt: new Date()
            })
            .where(eq(payfastTokenizationSessions.sessionId, data.m_payment_id));
        }
      } else {
        console.log('❌ Tokenization failed or incomplete, status:', data.payment_status);
        
        // Update session to failed status
        await db.update(payfastTokenizationSessions)
          .set({
            status: 'failed',
            updatedAt: new Date()
          })
          .where(eq(payfastTokenizationSessions.sessionId, data.m_payment_id));
      }
    }
    
    // Always respond with 200 OK to acknowledge receipt
    res.status(200).send('OK');
    
  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(200).send('OK'); // Still acknowledge to prevent retries
  }
  
  console.log('=== WEBHOOK PROCESSED ===\n');
});

export default router;