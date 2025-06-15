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
        ? (import.meta.env.PAYFAST_TEST_MERCHANT_ID || process.env.PAYFAST_TEST_MERCHANT_ID)!
        : (import.meta.env.PAYFAST_MERCHANT_ID || process.env.PAYFAST_MERCHANT_ID)!,
      merchantKey: isTestMode 
        ? (import.meta.env.PAYFAST_TEST_MERCHANT_KEY || process.env.PAYFAST_TEST_MERCHANT_KEY)!
        : (import.meta.env.PAYFAST_MERCHANT_KEY || process.env.PAYFAST_MERCHANT_KEY)!,
      passphrase: isTestMode 
        ? (import.meta.env.PAYFAST_TEST_PASSPHRASE || process.env.PAYFAST_TEST_PASSPHRASE)!
        : (import.meta.env.PAYFAST_PASSPHRASE || process.env.PAYFAST_PASSPHRASE)!,
      isTestMode
    };

    console.log('PayFast Service Config:', {
      merchantId: this.config.merchantId,
      merchantKey: this.config.merchantKey?.substring(0, 5) + '***',
      passphrase: this.config.passphrase?.substring(0, 5) + '***',
      isTestMode: this.config.isTestMode
    });

    this.baseUrl = isTestMode 
      ? 'https://api.payfast.co.za' 
      : 'https://api.payfast.co.za';

    if (!this.config.merchantId || !this.config.merchantKey || !this.config.passphrase) {
      throw new Error(`Missing PayFast ${isTestMode ? 'test' : 'live'} credentials`);
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

    // Generate signature and URL parameters using identical encoding
    const { signature, encodedParams } = this.generateSignatureAndParams(data);
    
    const baseUrl = this.config.isTestMode
      ? 'https://sandbox.payfast.co.za/eng/process'
      : 'https://www.payfast.co.za/eng/process';
    
    // Use the exact same encoded parameters that were used for signature generation
    const tokenizeUrl = `${baseUrl}?${encodedParams}&signature=${signature}`;
    
    console.log('Final PayFast tokenize URL:', tokenizeUrl);
    
    return tokenizeUrl;
  }

  private generateSignatureAndParams(data: Record<string, any>): { signature: string; encodedParams: string } {
    console.log('\n=== PAYFAST FORM SIGNATURE DEBUG ===');
    console.log('1. Input data:', JSON.stringify(data, null, 2));
    
    // For tokenization (subscription_type=2), use only core fields for signature
    // URLs and descriptions might not be needed in signature generation
    const coreFields: Record<string, any> = {
      merchant_id: data.merchant_id,
      merchant_key: data.merchant_key,
      amount: data.amount,
      item_name: data.item_name,
      subscription_type: data.subscription_type
    };
    
    console.log('2. Using core tokenization fields only for signature:');
    console.log(JSON.stringify(coreFields, null, 2));
    
    // Sort keys alphabetically like PayFast's official Node.js code
    const sortedKeys = Object.keys(coreFields).sort();
    
    // Build signature string using PayFast's exact approach
    let signatureString = '';
    let encodedParams = '';
    
    console.log('3. Processing core parameters in alphabetical order:');
    for (const key of sortedKeys) {
      if (coreFields[key] !== undefined && coreFields[key] !== '' && coreFields[key] !== null) {
        const rawValue = coreFields[key].toString().trim();
        
        // For signature: use raw values (no encoding needed for core fields)
        signatureString += `${key}=${rawValue}&`;
        
        console.log(`   ${key}: "${rawValue}" (raw for signature)`);
      }
    }
    
    // Build full URL parameters (all fields, encoded)
    console.log('4. Building full URL parameters (all fields):');
    const allSortedKeys = Object.keys(data).sort();
    for (const key of allSortedKeys) {
      if (data[key] !== undefined && data[key] !== '' && data[key] !== null) {
        const rawValue = data[key].toString().trim();
        const encodedValue = encodeURIComponent(rawValue).replace(/%20/g, '+');
        encodedParams += `${key}=${encodedValue}&`;
        console.log(`   ${key}: "${rawValue}" -> "${encodedValue}" (URL-encoded)`);
      }
    }
    
    // Remove trailing &
    signatureString = signatureString.slice(0, -1);
    encodedParams = encodedParams.slice(0, -1);
    
    // Add passphrase to signature (raw value for core fields approach)
    if (this.config.passphrase) {
      signatureString += `&passphrase=${this.config.passphrase.trim()}`;
      console.log('5. Added passphrase (raw):', this.config.passphrase.trim());
    }
    
    console.log('6. Final signature string (core fields + raw passphrase):', signatureString);
    console.log('7. Final URL parameters (all fields encoded):', encodedParams);
    
    // Generate MD5 hash
    const signature = crypto.createHash("md5").update(signatureString).digest("hex");
    console.log('7. Generated form signature:', signature);
    console.log('=== END FORM DEBUG ===\n');
    
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