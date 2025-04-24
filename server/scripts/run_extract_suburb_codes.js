// This script runs the TypeScript suburb code extractor
// Execute with: node server/scripts/run_extract_suburb_codes.js

require('tsx/cjs').register();
require('./extract_suburb_codes.ts');

console.log('Starting suburb code extraction...');
console.log('This process may take several minutes as it crawls Property24 to collect all suburb codes.');
console.log('Please be patient - the script will not impact Property24\'s servers by adding delays between requests.');
console.log('The results will be saved to server/data/suburb_codes.json and server/data/suburb_code_map.ts');