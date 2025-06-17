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
          // Fetch real card details from PayFast API
          const { PayFastService } = await import('../services/payfast');
          const payfast = new PayFastService(false); // Use live mode
          
          let cardLastFour = data.token.slice(-4); // Fallback to token digits
          let cardBrand = 'PayFast Card';
          let expiryMonth = null;
          let expiryYear = null;
          
          try {
            const tokenDetails = await payfast.getTokenDetails(data.token);
            if (tokenDetails.data?.card) {
              // Extract real card details from PayFast API
              const maskedNumber = tokenDetails.data.card.masked_number;
              if (maskedNumber) {
                // Extract last 4 digits from masked number (e.g., "****1234" -> "1234")
                const lastFourMatch = maskedNumber.match(/(\d{4})$/);
                if (lastFourMatch) {
                  cardLastFour = lastFourMatch[1];
                }
              }
              cardBrand = tokenDetails.data.card.scheme || 'PayFast Card';
              
              // Parse expiry date if available (format: MM/YY)
              if (tokenDetails.data.card.expiry_date) {
                const expiryMatch = tokenDetails.data.card.expiry_date.match(/(\d{2})\/(\d{2})/);
                if (expiryMatch) {
                  expiryMonth = parseInt(expiryMatch[1]);
                  expiryYear = 2000 + parseInt(expiryMatch[2]);
                }
              }
            }
          } catch (apiError) {
            console.error('❌ Failed to fetch card details from PayFast API:', apiError);
            // Continue with fallback values
          }
          
          console.log('Card details extracted:', { cardLastFour, cardBrand, expiryMonth, expiryYear });
          
          // Create new payment method record with session details
          await db.insert(agencyPaymentMethods).values({
            agencyBranchId: tokenizationSession.agencyBranchId,
            payfastToken: data.token,
            cardLastFour: cardLastFour,
            expiryMonth: expiryMonth,
            expiryYear: expiryYear,
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