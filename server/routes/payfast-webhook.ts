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
    // Parse the form data
    const bodyStr = req.body?.toString() || '';
    const params = new URLSearchParams(bodyStr);
    const data: Record<string, string> = {};
    
    params.forEach((value, key) => {
      data[key] = value;
    });
    
    console.log('Parsed webhook data:', data);
    
    // Check if this is a tokenization response
    if (data.token && data.payment_status) {
      console.log('Tokenization webhook received:', {
        token: data.token,
        payment_status: data.payment_status,
        signature: data.signature
      });
      
      // Store the token if tokenization was successful
      if (data.payment_status === 'COMPLETE' && data.token) {
        // You would store this token associated with the user/agency
        console.log('Tokenization successful, token received:', data.token);
        
        // Store token in database - we'll need to implement user session tracking
        try {
          // For now, we'll store with a placeholder until we implement proper session tracking
          const existingMethod = await db.query.agencyPaymentMethods.findFirst({
            where: eq(agencyPaymentMethods.agencyBranchId, 1) // Placeholder agency
          });

          if (existingMethod) {
            // Update existing token
            await db.update(agencyPaymentMethods)
              .set({ 
                payfastToken: data.token, 
                isActive: true,
                updatedAt: new Date()
              })
              .where(eq(agencyPaymentMethods.id, existingMethod.id));
          } else {
            // Create new payment method record
            await db.insert(agencyPaymentMethods).values({
              agencyBranchId: 1, // Placeholder - will need proper session tracking
              payfastToken: data.token,
              cardLastFour: '0000', // Will be updated via separate webhook
              expiryMonth: 12,
              expiryYear: 2025,
              isActive: true,
              createdAt: new Date(),
              updatedAt: new Date()
            });
          }
          
          console.log('✅ Token stored successfully in database');
        } catch (dbError) {
          console.error('❌ Error storing token in database:', dbError);
        }
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