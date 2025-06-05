import { FilesClient } from './server/services/propdata/filesClient.js';

async function testImageFetch() {
  try {
    console.log('Testing PropData Files API with credentials...');
    
    const filesClient = new FilesClient();
    
    // Test with one of the image IDs from property 2520145
    const testImageId = 49332587;
    console.log(`Testing file ID: ${testImageId}`);
    
    const result = await filesClient.fetchFileDetails(testImageId);
    console.log('File details result:', result);
    
    if (result) {
      console.log('SUCCESS: Image URL found:', result.file || result.image);
    } else {
      console.log('FAILED: No image URL returned');
    }
    
  } catch (error) {
    console.error('Error testing PropData Files API:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testImageFetch();