import crypto from 'crypto';
import fetch from 'node-fetch';

// Test PayFast authentication with different signature methods
const config = {
  merchantId: process.env.PAYFAST_MERCHANT_ID || '24039609',
  merchantKey: process.env.PAYFAST_MERCHANT_KEY || 'uwchc5hNp2fZfqhVhOJKcF',
  passphrase: process.env.PAYFAST_PASSPHRASE || '1nvestmentPr0p3rty@2024!'
};

console.log('Testing PayFast API Authentication');
console.log('==================================');
console.log('Merchant ID:', config.merchantId);
console.log('Merchant Key:', config.merchantKey.substring(0, 5) + '***');
console.log('Passphrase:', config.passphrase.substring(0, 5) + '***');

// Test 1: Simple API call to validate credentials
async function testBasicAuth() {
  console.log('\n=== TEST 1: Basic API Authentication ===');
  
  const timestamp = new Date().toISOString().replace('Z', '+02:00');
  
  // Method 1: Simple concatenation
  const signatureString1 = config.merchantId + config.passphrase + timestamp;
  const signature1 = crypto.createHash("md5").update(signatureString1).digest("hex");
  
  console.log('Method 1 - Simple Concatenation:');
  console.log('Signature String:', config.merchantId + '***' + timestamp);
  console.log('Generated Signature:', signature1);
  
  try {
    const response = await fetch('https://api.payfast.co.za/ping', {
      method: 'GET',
      headers: {
        'merchant-id': config.merchantId,
        'version': 'v1',
        'timestamp': timestamp,
        'signature': signature1
      }
    });
    
    const data = await response.json();
    console.log('Response Status:', response.status, response.statusText);
    console.log('Response Data:', JSON.stringify(data, null, 2));
    
    if (response.ok) {
      console.log('✅ Basic authentication SUCCESSFUL');
      return true;
    } else {
      console.log('❌ Basic authentication FAILED');
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
  
  return false;
}

// Test 2: Parameter-based signature
async function testParameterAuth() {
  console.log('\n=== TEST 2: Parameter-based Authentication ===');
  
  const timestamp = new Date().toISOString().replace('Z', '+02:00');
  
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
  
  const signature2 = crypto.createHash("md5").update(sortedParams.toLowerCase()).digest("hex");
  
  console.log('Method 2 - Parameter-based:');
  console.log('Sorted Params:', sortedParams.replace(/passphrase=[^&]+/, 'passphrase=***'));
  console.log('Generated Signature:', signature2);
  
  try {
    const response = await fetch('https://api.payfast.co.za/ping', {
      method: 'GET',
      headers: {
        'merchant-id': config.merchantId,
        'version': 'v1',
        'timestamp': timestamp,
        'signature': signature2
      }
    });
    
    const data = await response.json();
    console.log('Response Status:', response.status, response.statusText);
    console.log('Response Data:', JSON.stringify(data, null, 2));
    
    if (response.ok) {
      console.log('✅ Parameter authentication SUCCESSFUL');
      return true;
    } else {
      console.log('❌ Parameter authentication FAILED');
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
  
  return false;
}

// Test 3: Alternative signature without lowercase
async function testAlternativeAuth() {
  console.log('\n=== TEST 3: Alternative Authentication (No Lowercase) ===');
  
  const timestamp = new Date().toISOString().replace('Z', '+02:00');
  
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
  
  // Don't convert to lowercase
  const signature3 = crypto.createHash("md5").update(sortedParams).digest("hex");
  
  console.log('Method 3 - No Lowercase:');
  console.log('Sorted Params:', sortedParams.replace(/passphrase=[^&]+/, 'passphrase=***'));
  console.log('Generated Signature:', signature3);
  
  try {
    const response = await fetch('https://api.payfast.co.za/ping', {
      method: 'GET',
      headers: {
        'merchant-id': config.merchantId,
        'version': 'v1',
        'timestamp': timestamp,
        'signature': signature3
      }
    });
    
    const data = await response.json();
    console.log('Response Status:', response.status, response.statusText);
    console.log('Response Data:', JSON.stringify(data, null, 2));
    
    if (response.ok) {
      console.log('✅ Alternative authentication SUCCESSFUL');
      return true;
    } else {
      console.log('❌ Alternative authentication FAILED');
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
  
  return false;
}

// Run all tests
async function runAuthTests() {
  console.log('Starting PayFast authentication tests...\n');
  
  const test1 = await testBasicAuth();
  const test2 = await testParameterAuth();
  const test3 = await testAlternativeAuth();
  
  console.log('\n=== SUMMARY ===');
  console.log('Basic Auth:', test1 ? 'PASS' : 'FAIL');
  console.log('Parameter Auth:', test2 ? 'PASS' : 'FAIL');
  console.log('Alternative Auth:', test3 ? 'PASS' : 'FAIL');
  
  if (!test1 && !test2 && !test3) {
    console.log('\n❌ ALL AUTHENTICATION METHODS FAILED');
    console.log('This indicates either:');
    console.log('1. Incorrect PayFast merchant credentials');
    console.log('2. PayFast API access is not enabled for this merchant');
    console.log('3. Different signature method required');
  } else {
    console.log('\n✅ At least one authentication method works');
  }
}

runAuthTests().catch(console.error);