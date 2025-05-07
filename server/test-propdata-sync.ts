import { ListingsClient } from "./services/propdata/listingsClient";
import { AgentsClient } from "./services/propdata/agentsClient";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Verify required environment variables
const requiredEnvVars = [
  "PROPDATA_SERVER_URL",
  "PROPDATA_API_USERNAME",
  "PROPDATA_API_PASSWORD"
];

const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
if (missingVars.length > 0) {
  console.error(`Missing required environment variables: ${missingVars.join(", ")}`);
  process.exit(1);
}

async function testPropdataAPI() {
  console.log("Testing PropData API connection...");
  
  // Test listings API
  try {
    console.log("Authenticating and fetching listings...");
    const listingsClient = new ListingsClient();
    const listings = await listingsClient.fetchListings({ limit: 5 });
    
    console.log(`Successfully fetched ${listings.count} total listings`);
    console.log("Sample of the first listing:");
    console.log(JSON.stringify(listings.results[0], null, 2).substring(0, 500) + "...");
    
    // Test fetching metadata
    console.log("\nFetching listing metadata...");
    await listingsClient.fetchListingMetadata();
    
    console.log("\nPropData API integration test successful!");
  } catch (error) {
    console.error("Error testing PropData API:", error);
    process.exit(1);
  }
}

// Run the test
testPropdataAPI();