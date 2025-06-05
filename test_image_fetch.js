// Test script to fetch images for property 2520145
const fetch = require('node-fetch');

async function testImageFetch() {
  try {
    // Trigger a specific property sync
    const response = await fetch('http://localhost:5000/api/propdata/listings/sync?force=true&property_id=2520145', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const result = await response.text();
    console.log('Sync response:', result);
  } catch (error) {
    console.error('Error:', error);
  }
}

testImageFetch();