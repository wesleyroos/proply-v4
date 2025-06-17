import crypto from 'crypto';
import fetch from 'node-fetch';

// PayFast configuration from environment
const config = {
  merchantId: '24039609',
  merchantKey: process.env.PAYFAST_MERCHANT_KEY || 'uwchc5hNp2fZfqhVhOJKcF',
  passphrase: process.env.PAYFAST_PASSPHRASE || '1nvestmentPr0p3rty@2024!',
  isTestMode: false
};

const token = 'ce05fd95-dc48-4559-8f33-377a2c50064d';

// Test 1: Token Validation
async function testTokenValidation() {
  console.log('\n=== TEST 1: TOKEN VALIDATION ===');
  
  const timestamp = new Date().toISOString().replace('Z', '+02:00');
  
  // Create signature for token validation
  const signatureData = {
    'merchant-id': config.merchantId,
    'version': 'v1',
    'timestamp': timestamp,
    'passphrase': config.passphrase
  };
  
  const sortedKeys = Object.keys(signatureData).sort();
  const sortedParams = sortedKeys.map(key => 
    `${encodeURIComponent(key)}=${encodeURIComponent(signatureData[key])}`
  ).join('&');
  
  const signature = crypto.createHash("md5").update(sortedParams.toLowerCase()).digest("hex");
  
  console.log('Token Validation Request:');
  console.log('URL:', `https://api.payfast.co.za/subscriptions/${token}`);
  console.log('Headers:', {
    'merchant-id': config.merchantId,
    'version': 'v1',
    'timestamp': timestamp,
    'signature': signature
  });
  
  try {
    const response = await fetch(`https://api.payfast.co.za/subscriptions/${token}`, {
      method: 'GET',
      headers: {
        'merchant-id': config.merchantId,
        'version': 'v1',
        'timestamp': timestamp,
        'signature': signature
      }
    });
    
    const data = await response.json();
    console.log('Response Status:', response.status, response.statusText);
    console.log('Response Data:', JSON.stringify(data, null, 2));
    
    return response.ok;
  } catch (error) {
    console.error('Token validation error:', error.message);
    return false;
  }
}

// Test 2: Ad-hoc Charge with Different Signature Methods
async function testAdHocCharge() {
  console.log('\n=== TEST 2: AD-HOC CHARGE ===');
  
  const timestamp = new Date().toISOString().replace('Z', '+02:00');
  const requestBody = {
    amount: 10,
    item_name: 'Test Payment',
    item_description: 'Comprehensive PayFast Test',
    m_payment_id: `test-${Date.now()}-comprehensive`
  };
  
  // Method 1: Include all fields as per documentation
  console.log('\n--- Method 1: All Fields in Signature ---');
  const signatureData1 = {
    ...requestBody,
    'merchant-id': config.merchantId,
    'version': 'v1',
    'timestamp': timestamp,
    'passphrase': config.passphrase
  };
  
  const sortedKeys1 = Object.keys(signatureData1).sort();
  const sortedParams1 = sortedKeys1.map(key => 
    `${encodeURIComponent(key)}=${encodeURIComponent(signatureData1[key])}`
  ).join('&');
  
  const signature1 = crypto.createHash("md5").update(sortedParams1.toLowerCase()).digest("hex");
  
  console.log('Signature Data Keys:', sortedKeys1);
  console.log('Sorted Params:', sortedParams1.replace(/passphrase=[^&]+/, 'passphrase=***'));
  console.log('Generated Signature:', signature1);
  
  await makeAdHocRequest(timestamp, signature1, requestBody, 'Method 1');
  
  // Method 2: Only headers in signature (alternative approach)
  console.log('\n--- Method 2: Headers Only in Signature ---');
  const signatureData2 = {
    'merchant-id': config.merchantId,
    'version': 'v1',
    'timestamp': timestamp,
    'passphrase': config.passphrase
  };
  
  const sortedKeys2 = Object.keys(signatureData2).sort();
  const sortedParams2 = sortedKeys2.map(key => 
    `${encodeURIComponent(key)}=${encodeURIComponent(signatureData2[key])}`
  ).join('&');
  
  const signature2 = crypto.createHash("md5").update(sortedParams2.toLowerCase()).digest("hex");
  
  console.log('Signature Data Keys:', sortedKeys2);
  console.log('Sorted Params:', sortedParams2.replace(/passphrase=[^&]+/, 'passphrase=***'));
  console.log('Generated Signature:', signature2);
  
  await makeAdHocRequest(timestamp, signature2, requestBody, 'Method 2');
}

async function makeAdHocRequest(timestamp, signature, requestBody, method) {
  const headers = {
    'merchant-id': config.merchantId,
    'version': 'v1',
    'timestamp': timestamp,
    'signature': signature,
    'Content-Type': 'application/json'
  };
  
  console.log(`${method} Request:`)
  console.log('URL:', `https://api.payfast.co.za/subscriptions/${token}/adhoc`);
  console.log('Headers:', headers);
  console.log('Body:', JSON.stringify(requestBody, null, 2));
  
  try {
    const response = await fetch(`https://api.payfast.co.za/subscriptions/${token}/adhoc`, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(requestBody)
    });
    
    const data = await response.json();
    console.log(`${method} Response Status:`, response.status, response.statusText);
    console.log(`${method} Response Data:`, JSON.stringify(data, null, 2));
    
    return response.ok;
  } catch (error) {
    console.error(`${method} error:`, error.message);
    return false;
  }
}

// Test 3: Simple Direct Concatenation (fallback method)
async function testSimpleConcatenation() {
  console.log('\n=== TEST 3: SIMPLE CONCATENATION ===');
  
  const timestamp = new Date().toISOString().replace('Z', '+02:00');
  const signatureString = config.merchantId + config.passphrase + timestamp;
  const signature = crypto.createHash("md5").update(signatureString).digest("hex");
  
  console.log('Simple Concatenation:');
  console.log('Signature String:', config.merchantId + '***' + timestamp);
  console.log('Generated Signature:', signature);
  
  const requestBody = {
    amount: 10,
    item_name: 'Test Payment Simple',
    item_description: 'Simple concatenation test',
    m_payment_id: `test-${Date.now()}-simple`
  };
  
  await makeAdHocRequest(timestamp, signature, requestBody, 'Simple Concatenation');
}

// Run all tests
async function runComprehensiveTest() {
  console.log('PAYFAST COMPREHENSIVE INTEGRATION TEST');
  console.log('=====================================');
  console.log('Config:', {
    merchantId: config.merchantId,
    merchantKey: config.merchantKey.substring(0, 5) + '***',
    passphrase: config.passphrase.substring(0, 5) + '***',
    token: token
  });
  
  const tokenValid = await testTokenValidation();
  console.log('\nToken Validation Result:', tokenValid ? 'PASS' : 'FAIL');
  
  if (tokenValid) {
    await testAdHocCharge();
  } else {
    console.log('Skipping ad-hoc tests due to token validation failure');
  }
  
  await testSimpleConcatenation();
  
  console.log('\n=== TEST COMPLETE ===');
}

runComprehensiveTest().catch(console.error);