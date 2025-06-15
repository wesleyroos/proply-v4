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
    this.config = {
      merchantId: isTestMode 
        ? process.env.PAYFAST_TEST_MERCHANT_ID! 
        : process.env.PAYFAST_MERCHANT_ID!,
      merchantKey: isTestMode 
        ? process.env.PAYFAST_TEST_MERCHANT_KEY! 
        : process.env.PAYFAST_MERCHANT_KEY!,
      passphrase: isTestMode 
        ? process.env.PAYFAST_TEST_PASSPHRASE! 
        : process.env.PAYFAST_PASSPHRASE!,
      isTestMode
    };

    this.baseUrl = isTestMode 
      ? 'https://api.payfast.co.za' 
      : 'https://api.payfast.co.za';

    if (!this.config.merchantId || !this.config.merchantKey || !this.config.passphrase) {
      throw new Error(`Missing PayFast ${isTestMode ? 'test' : 'live'} credentials`);
    }
  }

  private generateSignature(data: Record<string, any>): string {
    // PayFast official signature generation - exact implementation
    // Arrange the array by key alphabetically
    let ordered_data: Record<string, any> = {};
    Object.keys(data).sort().forEach(key => {
      ordered_data[key] = data[key];
    });
    data = ordered_data;

    // Create the get string
    let getString = '';
    for (let key in data) {
      if (data[key] !== '' && data[key] !== null && data[key] !== undefined) {
        getString += key + '=' + encodeURIComponent(data[key]).replace(/%20/g, '+') + '&';
      }
    }

    // Remove the last '&'
    getString = getString.substring(0, getString.length - 1);
    
    // Add passphrase if provided
    if (this.config.passphrase) {
      getString += `&passphrase=${encodeURIComponent(this.config.passphrase.trim()).replace(/%20/g, "+")}`;
    }

    console.log('PayFast signature string (official format):', getString);

    // Hash the data and create the signature
    const signature = crypto.createHash("md5").update(getString).digest("hex");
    console.log('PayFast generated signature:', signature);
    
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
    // For tokenization, amount should be 0 as per PayFast docs
    const data = {
      merchant_id: this.config.merchantId,
      merchant_key: this.config.merchantKey,
      return_url: returnUrl,
      cancel_url: cancelUrl,
      notify_url: `${process.env.BASE_URL || 'http://localhost:5000'}/api/payfast/notify`,
      amount: '0.00', // Tokenization requires 0 amount
      item_name: 'Card-on-file',
      item_description: 'Setup payment method for agency billing',
      subscription_type: '2' // Ad-hoc subscription for tokenization
    };

    // Generate signature using the official PayFast format
    const signature = this.generateSignature(data);
    
    // Create URL manually to ensure proper encoding
    const baseUrl = this.config.isTestMode
      ? 'https://sandbox.payfast.co.za/eng/process'
      : 'https://www.payfast.co.za/eng/process';
    
    // Build query string manually to match signature generation
    const sortedKeys = Object.keys(data).sort();
    let queryString = '';
    
    for (const key of sortedKeys) {
      const value = data[key as keyof typeof data];
      if (value !== '' && value !== null && value !== undefined) {
        queryString += `${key}=${encodeURIComponent(value.toString().trim())}&`;
      }
    }
    
    // Add signature to query string
    queryString += `signature=${signature}`;
    
    const tokenizeUrl = `${baseUrl}?${queryString}`;
    
    console.log('Final PayFast tokenize URL:', tokenizeUrl);
    
    return tokenizeUrl;
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