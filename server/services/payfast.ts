import crypto from 'crypto';

interface PayFastConfig {
  merchantId: string;
  merchantKey: string;
  passphrase: string;
  isTestMode: boolean;
}

interface PayFastTokenizeResponse {
  code: number;
  status: string;
  data?: {
    token: string;
    card: {
      masked_number: string;
      expiry_date: string;
      scheme: string;
    };
  };
  message?: string;
}

interface PayFastAdHocChargeRequest {
  amount: number;
  item_name: string;
  item_description: string;
  m_payment_id: string;
}

interface PayFastAdHocChargeResponse {
  code: number;
  status: string;
  data?: {
    pf_payment_id: string;
    payment_status: string;
    amount_gross: string;
  };
  message?: string;
}

export class PayFastService {
  private config: PayFastConfig;
  private baseUrl: string;

  constructor(isTestMode: boolean = false) {
    // Use live PayFast credentials for better reliability
    const useLive = true; // Force live mode
    
    this.config = {
      merchantId: useLive 
        ? process.env.PAYFAST_MERCHANT_ID!
        : process.env.PAYFAST_TEST_MERCHANT_ID!,
      merchantKey: useLive 
        ? process.env.PAYFAST_MERCHANT_KEY!
        : process.env.PAYFAST_TEST_MERCHANT_KEY!,
      passphrase: useLive 
        ? process.env.PAYFAST_PASSPHRASE!
        : process.env.PAYFAST_TEST_PASSPHRASE!,
      isTestMode: false // Always use live mode
    };

    console.log('PayFast Service Config (LIVE MODE):', {
      merchantId: this.config.merchantId,
      merchantKey: this.config.merchantKey?.substring(0, 5) + '***',
      passphrase: this.config.passphrase?.substring(0, 5) + '***',
      isTestMode: this.config.isTestMode
    });

    // Use live PayFast URLs
    this.baseUrl = 'https://api.payfast.co.za';

    if (!this.config.merchantId || !this.config.merchantKey || !this.config.passphrase) {
      throw new Error('Missing PayFast live credentials');
    }
  }

  private generateSignature(data: Record<string, any>): string {
    // Use the new unified method for consistency
    const { signature } = this.generateSignatureAndParams(data);
    return signature;
  }

  private createAuthHeaders(): Record<string, string> {
    const timestamp = new Date().toISOString();
    const signature = this.generateSignature({
      'merchant-id': this.config.merchantId,
      version: 'v1',
      timestamp: timestamp
    });

    return {
      'merchant-id': this.config.merchantId,
      'version': 'v1',
      'timestamp': timestamp,
      'signature': signature
    };
  }

  async createTokenizeUrl(returnUrl: string, cancelUrl: string, amount: number = 0): Promise<string> {
    // For tokenization, use minimum R1.00 and subscription_type 2 (ad-hoc)
    const data = {
      merchant_id: this.config.merchantId,
      merchant_key: this.config.merchantKey,
      return_url: returnUrl,
      cancel_url: cancelUrl,
      notify_url: `${process.env.BASE_URL || 'http://localhost:5000'}/api/payfast/notify`,
      amount: '1.00', // Minimum R1.00 required for tokenization
      item_name: 'Payment Method Setup',
      item_description: 'Setup card for recurring billing',
      subscription_type: '2', // Ad-hoc subscription for tokenization
      frequency: '3', // Monthly (required for subscriptions)
      cycles: '0' // Unlimited cycles for ad-hoc billing
    };

    // Generate signature and URL parameters using identical encoding
    const { signature, encodedParams } = this.generateSignatureAndParams(data);
    
    // Always use live PayFast for production reliability
    const baseUrl = 'https://www.payfast.co.za/eng/process';
    
    // Use the exact same encoded parameters that were used for signature generation
    const tokenizeUrl = `${baseUrl}?${encodedParams}&signature=${signature}`;
    
    console.log('Final PayFast LIVE tokenize URL (with R1.00):', tokenizeUrl);
    
    return tokenizeUrl;
  }

  private generateSignatureAndParams(data: Record<string, any>): { signature: string; encodedParams: string } {
    console.log('\n=== PAYFAST OFFICIAL SIGNATURE METHOD ===');
    
    // Use PayFast's exact official method from their documentation
    let ordered_data: Record<string, any> = {};
    Object.keys(data).sort().forEach(key => {
      ordered_data[key] = data[key];
    });

    let getString = '';
    for (let key in ordered_data) {
      const encodedValue = encodeURIComponent(ordered_data[key]).replace(/%20/g, '+');
      getString += key + '=' + encodedValue + '&';
      console.log(`${key}: "${ordered_data[key]}" -> "${encodedValue}"`);
    }

    getString = getString.slice(0, -1); // Remove trailing &
    
    if (this.config.passphrase) {
      const encodedPassphrase = encodeURIComponent(this.config.passphrase.trim()).replace(/%20/g, '+');
      getString += `&passphrase=${encodedPassphrase}`;
      console.log('Added passphrase (encoded):', encodedPassphrase);
    }
    
    console.log('Final signature string:', getString);
    
    // Generate MD5 signature
    const signature = crypto.createHash("md5").update(getString).digest("hex");
    console.log('Generated signature:', signature);
    console.log('=== END ===\n');
    
    // For URL params, use the same encoded string (without passphrase)
    let encodedParams = '';
    for (let key in ordered_data) {
      const encodedValue = encodeURIComponent(ordered_data[key]).replace(/%20/g, '+');
      encodedParams += key + '=' + encodedValue + '&';
    }
    encodedParams = encodedParams.slice(0, -1);
    
    return { signature, encodedParams };
  }



  validateWebhookSignature(data: Record<string, any>, receivedSignature: string): boolean {
    // Generate signature for webhook validation using the same method as forms
    const calculatedSignature = this.generateSignature(data);
    return calculatedSignature === receivedSignature;
  }

  async chargeToken(token: string, request: PayFastAdHocChargeRequest): Promise<PayFastAdHocChargeResponse> {
    const headers = this.createAuthHeaders();
    
    const response = await fetch(`${this.baseUrl}/subscriptions/${token}/adhoc`, {
      method: 'POST',
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request)
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(`PayFast charge failed: ${data.message || 'Unknown error'}`);
    }

    return data;
  }

  async validateToken(token: string): Promise<boolean> {
    try {
      const headers = this.createAuthHeaders();
      
      const response = await fetch(`${this.baseUrl}/subscriptions/${token}/fetch`, {
        method: 'GET',
        headers
      });

      const data = await response.json();
      return response.ok && data.status === 'success';
    } catch (error) {
      console.error('PayFast token validation error:', error);
      return false;
    }
  }

  async cancelToken(token: string): Promise<boolean> {
    try {
      const headers = this.createAuthHeaders();
      
      const response = await fetch(`${this.baseUrl}/subscriptions/${token}/cancel`, {
        method: 'PUT',
        headers
      });

      const data = await response.json();
      return response.ok && data.status === 'success';
    } catch (error) {
      console.error('PayFast token cancellation error:', error);
      return false;
    }
  }

  // Webhook signature validation
  validateWebhookSignature(postData: Record<string, any>, receivedSignature: string): boolean {
    const calculatedSignature = this.generateSignature(postData);
    return calculatedSignature === receivedSignature;
  }

  // Calculate tiered pricing
  static calculateTieredPricing(reportCount: number): number {
    let totalCost = 0;
    let remainingReports = reportCount;

    // Tier 1: 1-50 reports at R200 each
    if (remainingReports > 0) {
      const tier1Reports = Math.min(remainingReports, 50);
      totalCost += tier1Reports * 200;
      remainingReports -= tier1Reports;
    }

    // Tier 2: 51-100 reports at R180 each
    if (remainingReports > 0) {
      const tier2Reports = Math.min(remainingReports, 50);
      totalCost += tier2Reports * 180;
      remainingReports -= tier2Reports;
    }

    // Tier 3: 101-150 reports at R160 each
    if (remainingReports > 0) {
      const tier3Reports = Math.min(remainingReports, 50);
      totalCost += tier3Reports * 160;
      remainingReports -= tier3Reports;
    }

    // Tier 4: 151-200 reports at R140 each
    if (remainingReports > 0) {
      const tier4Reports = Math.min(remainingReports, 50);
      totalCost += tier4Reports * 140;
      remainingReports -= tier4Reports;
    }

    // Tier 5: 200+ reports at R140 each
    if (remainingReports > 0) {
      totalCost += remainingReports * 140;
    }

    return totalCost;
  }
}