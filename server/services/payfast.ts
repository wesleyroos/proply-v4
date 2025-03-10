import crypto from 'crypto';

interface PayFastHeaders {
  'merchant-id': string;
  version: string;
  timestamp: string;
  signature: string;
}

export function generatePayFastSignature(
  merchantId: string,
  version: string,
  timestamp: string,
  token: string,
  action: 'cancel' | 'pause' | 'unpause'
): PayFastHeaders {
  // PayFast signature is a concatenation of all values in alphabetical order
  const values = [
    action,
    merchantId,
    timestamp,
    token,
    version
  ].join('');

  // Create MD5 hash of the values
  const signature = crypto
    .createHash('md5')
    .update(values)
    .digest('hex');

  return {
    'merchant-id': merchantId,
    version,
    timestamp,
    signature
  };
}

export function getPayFastHeaders(token: string, action: 'cancel' | 'pause' | 'unpause'): PayFastHeaders {
  const merchantId = process.env.VITE_PAYFAST_MERCHANT_ID || '';
  const version = "v1";
  const timestamp = new Date().toISOString();

  return generatePayFastSignature(merchantId, version, timestamp, token, action);
}
