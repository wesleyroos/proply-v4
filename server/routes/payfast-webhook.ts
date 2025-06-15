import express from 'express';
import { db } from '../../db/index.js';
import { paymentMethods } from '../../db/schema.js';

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
    
    for (const [key, value] of params.entries()) {
      data[key] = value;
    }
    
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
        
        // TODO: Store token in database associated with agency
        // await db.insert(paymentMethods).values({
        //   agencyId: /* get from context */,
        //   token: data.token,
        //   type: 'payfast_token',
        //   isActive: true
        // });
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