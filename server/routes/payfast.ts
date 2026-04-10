import { Router } from 'express';
import { db } from '@db/index';
import { agencyPaymentMethods, agencyBranches } from '@db/schema';
import { eq, and } from 'drizzle-orm';
import { PayFastService } from '../services/payfast';

const router = Router();

// Get PayFast configuration for client-side integration
router.get('/config', async (req, res) => {
  try {
    const user = req.user;
    if (!user || (user.role !== 'branch_admin' && user.role !== 'franchise_admin')) {
      return res.status(403).json({ error: 'Access denied. Branch or franchise admin required.' });
    }

    // For now, default to test mode - in production this would be a system setting
    const isTestMode = true;
    
    // PayFast doesn't use public keys like Yoco - tokenization happens server-side
    res.json({ 
      isTestMode,
      message: 'PayFast tokenization requires server-side processing'
    });

  } catch (error) {
    console.error('Error getting PayFast config:', error);
    res.status(500).json({ error: 'Failed to get payment configuration' });
  }
});

// Create PayFast tokenization URL
router.post('/create-tokenize-url', async (req, res) => {
  try {
    const user = req.user;
    if (!user || (user.role !== 'branch_admin' && user.role !== 'franchise_admin' && user.role !== 'system_admin' && user.role !== 'admin')) {
      return res.status(403).json({ error: 'Access denied. Admin required.' });
    }

    // Get the user's agency branch — system admins can pass branchId in body
    let branchId = req.body.branchId || user.branchId;

    if (user.role === 'franchise_admin' && user.franchiseId) {
      const [firstBranch] = await db
        .select()
        .from(agencyBranches)
        .where(eq(agencyBranches.id, user.franchiseId))
        .limit(1);
      
      if (firstBranch) {
        branchId = firstBranch.id;
      }
    }

    if (!branchId) {
      return res.status(400).json({ error: "No branch associated with user" });
    }

    // Initialize PayFast service (test mode for setup)
    const payfast = new PayFastService(true);
    
    const baseUrl = process.env.APP_URL || 'https://app.proply.co.za';
    const returnUrl = `${baseUrl}/settings?token=success`;
    const cancelUrl = `${baseUrl}/settings?token=cancelled`;
    
    // Create tokenization URL
    const tokenizeUrl = await payfast.createTokenizeUrl(returnUrl, cancelUrl, 5.00);
    
    res.json({ 
      success: true,
      tokenizeUrl,
      message: 'Redirect user to this URL to setup payment method'
    });

  } catch (error) {
    console.error('Error creating PayFast tokenize URL:', error);
    res.status(500).json({ error: 'Failed to create tokenization URL' });
  }
});

// Handle PayFast webhook notifications
router.post('/webhook', async (req, res) => {
  try {
    console.log('PayFast webhook received:', req.body);
    
    // PayFast sends webhook data as form-encoded
    const webhookData = req.body;
    
    // Initialize PayFast service
    const payfast = new PayFastService(true); // Use test mode for webhook validation
    
    // Validate webhook signature
    const receivedSignature = webhookData.signature;
    delete webhookData.signature; // Remove signature from data before validation
    
    const isValid = payfast.validateWebhookSignature(webhookData, receivedSignature);
    
    if (!isValid) {
      console.error('Invalid PayFast webhook signature');
      return res.status(400).json({ error: 'Invalid signature' });
    }
    
    // Handle successful tokenization
    if (webhookData.payment_status === 'COMPLETE' && webhookData.subscription_type === '2') {
      console.log('PayFast tokenization successful:', webhookData);
      
      // Extract card details from webhook
      const token = webhookData.token;
      const lastFour = webhookData.card_number ? webhookData.card_number.slice(-4) : '****';
      const cardBrand = webhookData.card_type || 'unknown';
      
      // For now, we'll need to handle the token storage when user returns to success page
      // PayFast doesn't provide card details in webhook for tokenization
    }
    
    res.status(200).send('OK');
    
  } catch (error) {
    console.error('Error processing PayFast webhook:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// Save PayFast token (called from success page)
router.post('/save-token', async (req, res) => {
  try {
    const user = req.user;
    if (!user || (user.role !== 'branch_admin' && user.role !== 'franchise_admin')) {
      return res.status(403).json({ error: 'Access denied. Branch or franchise admin required.' });
    }

    const { token, cardType, lastFour, expiryMonth, expiryYear } = req.body;

    if (!token || !cardType || !lastFour || !expiryMonth || !expiryYear) {
      return res.status(400).json({ error: 'Missing required token data' });
    }

    // Get the user's agency branch
    let branchId = user.branchId;
    
    if (user.role === 'franchise_admin' && user.franchiseId) {
      const [firstBranch] = await db
        .select()
        .from(agencyBranches)
        .where(eq(agencyBranches.id, user.franchiseId))
        .limit(1);
      
      if (firstBranch) {
        branchId = firstBranch.id;
      }
    }

    if (!branchId) {
      return res.status(400).json({ error: "No branch associated with user" });
    }

    // Save the tokenized payment method
    await db.insert(agencyPaymentMethods).values({
      agencyBranchId: branchId,
      payfastToken: token,
      cardLastFour: lastFour,
      cardBrand: cardType,
      expiryMonth: parseInt(expiryMonth),
      expiryYear: parseInt(expiryYear),
      addedBy: user.id
    });

    res.json({ 
      success: true,
      message: 'Payment method saved successfully' 
    });

  } catch (error) {
    console.error('Error saving PayFast token:', error);
    res.status(500).json({ error: 'Failed to save payment method' });
  }
});

export default router;