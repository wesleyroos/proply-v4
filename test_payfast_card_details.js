import fetch from 'node-fetch';
import crypto from 'crypto';

// PayFast API test to fetch real card details
async function testPayFastCardDetails() {
  const merchantId = '24039609';
  const merchantKey = 'uwchc9jpjsqgn';
  const passphrase = '1nvest1ng_1n_Pr0perty_1s_W1se';
  
  // Token from the latest payment method
  const token = 'ce05fd95-dc48-4559-8f33-377a2c50064d';
  
  // Create authentication headers
  const timestamp = new Date().toISOString();
  const version = 'v1';
  
  // Create signature for API authentication
  const signatureData = {
    'merchant-id': merchantId,
    'version': version,
    'timestamp': timestamp,
    'passphrase': passphrase
  };
  
  const signatureString = Object.entries(signatureData)
    .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
    .join('&');
  
  const signature = crypto.createHash('md5').update(signatureString).digest('hex');
  
  console.log('PayFast API Test - Fetching card details for token:', token);
  console.log('Authentication:', { merchantId, timestamp, signature });
  
  try {
    const response = await fetch(`https://api.payfast.co.za/subscriptions/${token}/fetch`, {
      method: 'GET',
      headers: {
        'merchant-id': merchantId,
        'version': version,
        'timestamp': timestamp,
        'signature': signature
      }
    });
    
    const data = await response.json();
    
    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(data, null, 2));
    
    if (data.data?.card) {
      const card = data.data.card;
      console.log('\n=== CARD DETAILS ===');
      console.log('Masked Number:', card.masked_number);
      console.log('Scheme:', card.scheme);
      console.log('Expiry Date:', card.expiry_date);
      
      // Extract last 4 digits
      if (card.masked_number) {
        const lastFourMatch = card.masked_number.match(/(\d{4})$/);
        if (lastFourMatch) {
          console.log('Last 4 digits:', lastFourMatch[1]);
        }
      }
    }
    
  } catch (error) {
    console.error('Error fetching card details:', error);
  }
}

testPayFastCardDetails();