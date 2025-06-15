import crypto from 'crypto';

// Test with PayFast's exact documented example
function testPayFastOfficialExample() {
  console.log('=== TESTING WITH PAYFAST OFFICIAL EXAMPLE ===\n');
  
  // Using PayFast's exact test credentials from their documentation
  const data = {
    merchant_id: "10000100",
    merchant_key: "46f0cd694581a",
    amount: "100.00",
    item_name: "Test Item"
  };
  
  const passphrase = "jt7NOE43FZPn";
  
  console.log('Test data (PayFast official example):', data);
  console.log('Passphrase:', passphrase);
  
  // Build signature string exactly as documented
  let signatureString = '';
  const sortedKeys = Object.keys(data).sort();
  
  for (const key of sortedKeys) {
    if (data[key] !== undefined && data[key] !== '' && data[key] !== null) {
      const value = data[key].toString().trim();
      // PayFast docs: use urlencode (spaces become +)
      const encodedValue = encodeURIComponent(value).replace(/%20/g, '+');
      signatureString += `${key}=${encodedValue}&`;
    }
  }
  
  // Remove trailing &
  signatureString = signatureString.slice(0, -1);
  
  // Add passphrase (also encoded)
  const encodedPassphrase = encodeURIComponent(passphrase.trim()).replace(/%20/g, '+');
  signatureString += `&passphrase=${encodedPassphrase}`;
  
  console.log('\nSignature string:', signatureString);
  
  // Generate MD5
  const signature = crypto.createHash('md5').update(signatureString).digest('hex');
  console.log('Generated signature:', signature);
  
  return signature;
}

// Test with our actual data but PayFast's exact method
function testWithOurData() {
  console.log('\n=== TESTING WITH OUR DATA ===\n');
  
  const data = {
    merchant_id: "10036450",
    merchant_key: "8dafsqrcr99g5",
    amount: "0.00",
    item_name: "Card-on-file",
    subscription_type: "2"
  };
  
  const passphrase = "1nvest1ng_1n_Pr0perty_1s_W1se";
  
  console.log('Our data:', data);
  console.log('Our passphrase:', passphrase);
  
  // Build signature string exactly as PayFast documents
  let signatureString = '';
  const sortedKeys = Object.keys(data).sort();
  
  for (const key of sortedKeys) {
    if (data[key] !== undefined && data[key] !== '' && data[key] !== null) {
      const value = data[key].toString().trim();
      const encodedValue = encodeURIComponent(value).replace(/%20/g, '+');
      signatureString += `${key}=${encodedValue}&`;
    }
  }
  
  signatureString = signatureString.slice(0, -1);
  const encodedPassphrase = encodeURIComponent(passphrase.trim()).replace(/%20/g, '+');
  signatureString += `&passphrase=${encodedPassphrase}`;
  
  console.log('\nOur signature string:', signatureString);
  
  const signature = crypto.createHash('md5').update(signatureString).digest('hex');
  console.log('Our generated signature:', signature);
  
  return signature;
}

testPayFastOfficialExample();
testWithOurData();