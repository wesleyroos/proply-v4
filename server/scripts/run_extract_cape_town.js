// This script runs the TypeScript Cape Town suburb code extractor
// Execute with: npx tsx server/scripts/extract_cape_town_suburbs.ts

console.log('Starting Cape Town suburb code extraction...');
console.log('This is a quick version that only extracts Cape Town suburbs.');
console.log('The results will be saved to server/data/cape_town_suburbs.json and server/data/cape_town_suburb_codes.ts');

// Forward to the actual script
import './extract_cape_town_suburbs.ts';