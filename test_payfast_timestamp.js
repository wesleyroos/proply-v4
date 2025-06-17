import crypto from 'crypto';
import fetch from 'node-fetch';

const config = {
  merchantId: process.env.PAYFAST_MERCHANT_ID || '24039609',
  merchantKey: process.env.PAYFAST_MERCHANT_KEY || 'uwchc5hNp2fZfqhVhOJKcF',
  passphrase: process.env.PAYFAST_PASSPHRASE || '1nvestmentPr0p3rty@2024!'
};

const token = 'ce05fd95-dc48-4559-8f33-377a2c50064d';

function createSignature(data) {
  const sortedKeys = Object.keys(data).sort();
  const sortedParams = sortedKeys.map(key => 
    `${encodeURIComponent(key)}=${encodeURIComponent(data[key])}`
  ).join('&');
  
  return crypto.createHash("md5").update(sortedParams).digest("hex");
}

async function testTimestampFormat(name, timestamp) {
  console.log(`\n=== ${name} ===`);
  console.log('Timestamp:', timestamp);
  
  const signatureData = {
    'merchant-id': config.merchantId,
    'version': 'v1',
    'timestamp': timestamp,
    'passphrase': config.passphrase
  };
  
  const signature = createSignature(signatureData);
  
  const headers = {
    'merchant-id': config.merchantId,
    'version': 'v1',
    'timestamp': timestamp,
    'signature': signature
  };
  
  console.log('Signature:', signature);
  
  try {
    const response = await fetch(`https://api.payfast.co.za/subscriptions/${token}/fetch`, {
      method: 'GET',
      headers
    });
    
    const data = await response.json();
    console.log('Status:', response.status, response.statusText);
    console.log('Response:', JSON.stringify(data, null, 2));
    
    if (response.ok) {
      console.log('✅ SUCCESS');
      return true;
    } else {
      console.log('❌ FAILED');
      return false;
    }
  } catch (error) {
    console.error('Error:', error.message);
    return false;
  }
}

async function runTimestampTests() {
  console.log('Testing PayFast Subscription API Timestamp Formats');
  console.log('==================================================');
  
  const now = new Date();
  
  // Test CORRECTED FORMAT: ISO-8601 without milliseconds and with explicit timezone offset
  const correctedFormat = now.toISOString().replace(/\.\d{3}Z$/, '+00:00');
  await testTimestampFormat('CORRECTED: ISO without milliseconds (+00:00)', correctedFormat);
  
  // Test 3: Unix timestamp
  const unix = Math.floor(now.getTime() / 1000).toString();
  await testTimestampFormat('Unix timestamp', unix);
  
  // Test 4: Simple date format YYYY-MM-DD HH:mm:ss
  const simple = now.toISOString().replace('T', ' ').replace(/\.\d{3}Z$/, '');
  await testTimestampFormat('Simple format (YYYY-MM-DD HH:mm:ss)', simple);
  
  // Test 5: RFC 3339 format
  const rfc3339 = now.toISOString().replace('Z', '+00:00');
  await testTimestampFormat('RFC 3339 (+00:00)', rfc3339);
  
  // Test 6: Local SA time format
  const saTime = new Date(now.getTime() + (2 * 60 * 60 * 1000)).toISOString().replace('Z', '');
  await testTimestampFormat('SA Local Time (no timezone)', saTime);
  
  console.log('\n=== SUMMARY ===');
  console.log('Testing complete. Check which format returned success.');
}

runTimestampTests().catch(console.error);