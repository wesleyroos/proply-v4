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
    // Create parameter string for signature - PayFast specific format
    // Important: Do NOT URL encode values in signature string, only in final URL
    const sortedKeys = Object.keys(data).sort();
    let paramString = '';
    
    for (const key of sortedKeys) {
      const value = data[key];
      if (value !== '' && value !== null && value !== undefined) {
        paramString += `${key}=${value.toString().trim()}&`;
      }
    }
    
    // Remove trailing &
    paramString = paramString.slice(0, -1);
    
    // Add passphrase if provided (without URL encoding for signature)
    if (this.config.passphrase && this.config.passphrase.trim()) {
      paramString += `&passphrase=${this.config.passphrase.trim()}`;
    }
    
    console.log('PayFast signature string:', paramString);
    
    // Generate MD5 hash
    const signature = crypto.createHash('md5').update(paramString).digest('hex');
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

  async createTokenizeUrl(returnUrl: string, cancelUrl: string, amount: number = 5.00): Promise<string> {
    const data = {
      merchant_id: this.config.merchantId,
      merchant_key: this.config.merchantKey,
      return_url: returnUrl,
      cancel_url: cancelUrl,
      notify_url: `${process.env.BASE_URL || 'http://localhost:5000'}/api/payfast/notify`,
      amount: amount.toFixed(2),
      item_name: 'Payment Method Setup',
      item_description: 'Setup payment method for agency billing',
      payment_method: 'cc',
      subscription_type: '2' // Ad-hoc subscription
    };

    const signature = this.generateSignature(data);
    const params = new URLSearchParams({ ...data, signature });

    const tokenizeUrl = this.config.isTestMode
      ? `https://sandbox.payfast.co.za/eng/process?${params.toString()}`
      : `https://www.payfast.co.za/eng/process?${params.toString()}`;

    return tokenizeUrl;
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