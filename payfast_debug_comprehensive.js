import crypto from 'crypto';

// Comprehensive PayFast signature debugging
function debugPayFastSignature() {
  console.log('=== COMPREHENSIVE PAYFAST SIGNATURE DEBUG ===\n');

  // Our actual data from the logs
  const ourData = {
    amount: '0.00',
    cancel_url: 'http://localhost:5000/payment-setup-cancel',
    item_description: 'Setup payment method for agency billing',
    item_name: 'Card-on-file',
    merchant_id: '10036450',
    merchant_key: '8dafsqrcr99g5',
    notify_url: 'http://localhost:5000/api/payfast/notify',
    return_url: 'http://localhost:5000/payment-setup-success',
    subscription_type: '2'
  };
  
  const passphrase = '1nvest1ng_1n_Pr0perty_1s_W1se';

  console.log('Testing multiple signature approaches for tokenization:\n');

  // Method 1: PayFast's documented standard approach (all fields, raw values)
  console.log('METHOD 1: All fields, raw values, alphabetical');
  let method1String = '';
  const sortedKeys = Object.keys(ourData).sort();
  
  for (const key of sortedKeys) {
    const value = ourData[key].toString().trim();
    method1String += `${key}=${value}&`;
  }
  method1String = method1String.slice(0, -1);
  method1String += `&passphrase=${passphrase}`;
  
  const method1Signature = crypto.createHash('md5').update(method1String).digest('hex');
  console.log('String:', method1String);
  console.log('Signature:', method1Signature);
  console.log();

  // Method 2: Only core payment fields (minimal approach)
  console.log('METHOD 2: Core fields only (minimal for tokenization)');
  const coreData = {
    merchant_id: ourData.merchant_id,
    merchant_key: ourData.merchant_key,
    amount: ourData.amount,
    item_name: ourData.item_name,
    subscription_type: ourData.subscription_type
  };
  
  let method2String = '';
  const coreSortedKeys = Object.keys(coreData).sort();
  
  for (const key of coreSortedKeys) {
    const value = coreData[key].toString().trim();
    method2String += `${key}=${value}&`;
  }
  method2String = method2String.slice(0, -1);
  method2String += `&passphrase=${passphrase}`;
  
  const method2Signature = crypto.createHash('md5').update(method2String).digest('hex');
  console.log('String:', method2String);
  console.log('Signature:', method2Signature);
  console.log();

  // Method 3: Exclude URLs (some systems don't include return/notify URLs in signature)
  console.log('METHOD 3: Exclude URLs from signature');
  const noUrlData = {
    amount: ourData.amount,
    item_description: ourData.item_description,
    item_name: ourData.item_name,
    merchant_id: ourData.merchant_id,
    merchant_key: ourData.merchant_key,
    subscription_type: ourData.subscription_type
  };
  
  let method3String = '';
  const noUrlSortedKeys = Object.keys(noUrlData).sort();
  
  for (const key of noUrlSortedKeys) {
    const value = noUrlData[key].toString().trim();
    method3String += `${key}=${value}&`;
  }
  method3String = method3String.slice(0, -1);
  method3String += `&passphrase=${passphrase}`;
  
  const method3Signature = crypto.createHash('md5').update(method3String).digest('hex');
  console.log('String:', method3String);
  console.log('Signature:', method3Signature);
  console.log();

  // Method 4: PayFast's official Node.js SDK approach (if different)
  console.log('METHOD 4: Official SDK style (URL encoded spaces only)');
  let method4String = '';
  
  for (const key of sortedKeys) {
    let value = ourData[key].toString().trim();
    // Only encode spaces as + (PayFast style)
    value = value.replace(/ /g, '+');
    method4String += `${key}=${value}&`;
  }
  method4String = method4String.slice(0, -1);
  method4String += `&passphrase=${passphrase.replace(/ /g, '+')}`;
  
  const method4Signature = crypto.createHash('md5').update(method4String).digest('hex');
  console.log('String:', method4String);
  console.log('Signature:', method4Signature);
  console.log();

  // Method 5: Test with PayFast's documented test credentials
  console.log('METHOD 5: PayFast test credentials (validation)');
  const testData = {
    merchant_id: '10000100',
    merchant_key: '46f0cd694581a',
    amount: '100.00',
    item_name: 'Test Item'
  };
  const testPassphrase = 'jt7NOE43FZPn';
  
  let testString = '';
  const testSortedKeys = Object.keys(testData).sort();
  
  for (const key of testSortedKeys) {
    const value = testData[key].toString().trim();
    testString += `${key}=${value}&`;
  }
  testString = testString.slice(0, -1);
  testString += `&passphrase=${testPassphrase}`;
  
  const testSignature = crypto.createHash('md5').update(testString).digest('hex');
  console.log('String:', testString);
  console.log('Signature:', testSignature);
  console.log('Expected for PayFast test: Should match their documentation');
  console.log();

  console.log('=== SUMMARY ===');
  console.log('Method 1 (all fields):', method1Signature);
  console.log('Method 2 (core only):', method2Signature);
  console.log('Method 3 (no URLs):', method3Signature);
  console.log('Method 4 (space encoding):', method4Signature);
  console.log('Method 5 (test validation):', testSignature);
}

debugPayFastSignature();