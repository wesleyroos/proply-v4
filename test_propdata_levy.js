import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

async function testPropdataLevyData() {
  const baseUrl = process.env.PROPDATA_SERVER_URL || 'https://staging.api-gw.propdata.net';
  const username = process.env.PROPDATA_API_USERNAME;
  const password = process.env.PROPDATA_API_PASSWORD;
  
  // Test properties that should have levy data according to Property24
  const testProperties = ['2380259', '2380001', '2380134', '2380909'];
  
  for (const propertyId of testProperties) {
    try {
      console.log(`\n=== Testing Property ${propertyId} ===`);
      
      // First authenticate to get Bearer token
      const authResponse = await fetch(`${baseUrl}/accounts/login/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'proply'
        },
        body: JSON.stringify({
          username: username,
          password: password
        })
      });
      
      const authData = await authResponse.json();
      const token = authData.clients?.[0]?.token;
      
      if (!token) {
        console.log(`No token received for property ${propertyId}`);
        continue;
      }
      
      const response = await fetch(`${baseUrl}/listings/api/v1/residential/${propertyId}/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'User-Agent': 'proply'
        }
      });
      
      if (!response.ok) {
        console.log(`Error: ${response.status} - ${response.statusText}`);
        continue;
      }
      
      const data = await response.json();
      
      console.log(`Address: ${data.street_number} ${data.street_name}, ${data.suburb}, ${data.city}`);
      console.log(`Property Type: ${data.property_type}`);
      console.log(`Price: R${data.asking_price || data.price}`);
      
      // Check all levy-related fields
      const levyFields = {
        'levy': data.levy,
        'monthly_levy': data.monthly_levy,
        'sectional_title_levy': data.sectional_title_levy,
        'home_owner_levy': data.home_owner_levy,
        'special_levy': data.special_levy,
        'monthly_rates': data.monthly_rates,
        'body_corp_name': data.body_corp_name,
        'body_corp_email': data.body_corp_email,
        'body_corp_telephone_number': data.body_corp_telephone_number
      };
      
      console.log('Levy-related fields:');
      Object.entries(levyFields).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          console.log(`  ${key}: ${value}`);
        }
      });
      
      // Look for any field containing levy, rate, or expense
      const allFields = Object.keys(data);
      const potentialLevyFields = allFields.filter(field => 
        field.toLowerCase().includes('levy') || 
        field.toLowerCase().includes('rate') || 
        field.toLowerCase().includes('expense') ||
        field.toLowerCase().includes('cost') ||
        field.toLowerCase().includes('fee')
      );
      
      if (potentialLevyFields.length > 0) {
        console.log('All potential levy/cost fields:');
        potentialLevyFields.forEach(field => {
          console.log(`  ${field}: ${data[field]}`);
        });
      }
      
    } catch (error) {
      console.error(`Error fetching property ${propertyId}:`, error.message);
    }
  }
}

testPropdataLevyData();