import crypto from 'crypto';

// Test with the exact PayFast example from their documentation
function testPayFastSignature() {
  console.log('=== TESTING PAYFAST SIGNATURE GENERATION ===\n');
  
  // Test with minimal data first
  const testData = {
    merchant_id: "10036450",
    merchant_key: "8dafsqrcr99g5",
    amount: "0.00",
    item_name: "Card-on-file",
    subscription_type: "2"
  };
  
  const passphrase = "1nvest1ng_1n_Pr0perty_1s_W1se";
  
  console.log('1. Test data:', JSON.stringify(testData, null, 2));
  console.log('2. Passphrase:', passphrase);
  
  // Sort alphabetically
  const sortedKeys = Object.keys(testData).sort();
  console.log('3. Sorted keys:', sortedKeys);
  
  // Build string exactly like PayFast documentation
  let signatureString = '';
  for (const key of sortedKeys) {
    if (testData[key] !== undefined && testData[key] !== '' && testData[key] !== null) {
      const value = testData[key].toString().trim();
      const encodedValue = encodeURIComponent(value).replace(/%20/g, '+');
      signatureString += `${key}=${encodedValue}&`;
      console.log(`   ${key}=${encodedValue}`);
    }
  }
  
  // Remove trailing &
  signatureString = signatureString.slice(0, -1);
  
  // Add passphrase
  const encodedPassphrase = encodeURIComponent(passphrase.trim()).replace(/%20/g, '+');
  signatureString += `&passphrase=${encodedPassphrase}`;
  
  console.log('\n4. Final signature string:');
  console.log(signatureString);
  
  // Generate MD5
  const signature = crypto.createHash('md5').update(signatureString).digest('hex');
  console.log('\n5. Generated MD5 signature:', signature);
  
  // Test with different encoding approaches
  console.log('\n=== TESTING DIFFERENT ENCODING APPROACHES ===');
  
  // Approach 1: No encoding for signature string (raw values)
  let rawSignatureString = '';
  for (const key of sortedKeys) {
    if (testData[key] !== undefined && testData[key] !== '' && testData[key] !== null) {
      const value = testData[key].toString().trim();
      rawSignatureString += `${key}=${value}&`;
    }
  }
  rawSignatureString = rawSignatureString.slice(0, -1);
  rawSignatureString += `&passphrase=${passphrase.trim()}`;
  
  const rawSignature = crypto.createHash('md5').update(rawSignatureString).digest('hex');
  console.log('Raw values signature string:', rawSignatureString);
  console.log('Raw values MD5:', rawSignature);
  
  // Approach 2: Standard URL encoding (%20 for spaces)
  let standardEncoded = '';
  for (const key of sortedKeys) {
    if (testData[key] !== undefined && testData[key] !== '' && testData[key] !== null) {
      const value = testData[key].toString().trim();
      const encodedValue = encodeURIComponent(value); // Keep %20
      standardEncoded += `${key}=${encodedValue}&`;
    }
  }
  standardEncoded = standardEncoded.slice(0, -1);
  standardEncoded += `&passphrase=${encodeURIComponent(passphrase.trim())}`;
  
  const standardSignature = crypto.createHash('md5').update(standardEncoded).digest('hex');
  console.log('Standard encoded signature string:', standardEncoded);
  console.log('Standard encoded MD5:', standardSignature);
}

testPayFastSignature();