import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import * as fs from 'fs';
import * as path from 'path';

// Define types
interface Suburb {
  name: string;
  url: string;
  code: string;
}

// Add delay function to avoid overloading the server
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Function to extract the code from a URL
function extractCodeFromUrl(url: string): string | null {
  // Match the last segment which is a number
  const match = url.match(/\/(\d+)(?:\?.*)?$/);
  return match ? match[1] : null;
}

// Function to fetch HTML from a URL
async function fetchHtml(url: string): Promise<string> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'max-age=0'
      },
      timeout: 30000,
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
    }

    return await response.text();
  } catch (error) {
    console.error(`Error fetching ${url}:`, error);
    return '';
  }
}

// Main function to extract Cape Town suburbs
async function extractCapeTownSuburbs() {
  console.log('Extracting Cape Town suburb codes...');
  
  // URL for Cape Town properties 
  const url = 'https://www.property24.com/for-sale/cape-town/western-cape/432';
  
  const html = await fetchHtml(url);
  if (!html) {
    console.error('Failed to fetch the Cape Town page');
    return;
  }
  
  const $ = cheerio.load(html);
  const suburbs: Suburb[] = [];
  
  // Look for suburb links - these should be links to areas in Cape Town
  console.log('Parsing HTML for suburb links...');
  
  $('a[href*="/for-sale/"]').each((_, element) => {
    const $el = $(element);
    const href = $el.attr('href');
    const suburbName = $el.text().trim();
    
    // Only interested in suburb links that have a numeric code at the end
    // This will match links like /for-sale/sea-point/cape-town/western-cape/11021
    if (href && suburbName && href.match(/\/\d+$/)) {
      // Build the full URL if it's relative
      const url = href.startsWith('http') ? href : `https://www.property24.com${href}`;
      
      // Extract the suburb code
      const code = extractCodeFromUrl(url);
      
      if (code) {
        suburbs.push({
          name: suburbName,
          url,
          code
        });
      }
    }
  });
  
  console.log(`Found ${suburbs.length} suburbs in Cape Town`);
  
  // Ensure the data directory exists
  const dataDir = path.join(__dirname, '..', 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir);
  }
  
  // Save the JSON file
  const jsonOutput = JSON.stringify(suburbs, null, 2);
  fs.writeFileSync(path.join(dataDir, 'cape_town_suburbs.json'), jsonOutput);
  
  // Generate a TypeScript map for easy imports
  let ts = `// Cape Town suburb codes extracted from Property24\n\n`;
  ts += `export const capeTownSuburbCodes: Record<string, string> = {\n`;
  
  for (const suburb of suburbs) {
    // Add the suburb name in lowercase as the key
    ts += `  '${suburb.name.toLowerCase()}': '${suburb.code}', // ${suburb.url}\n`;
    
    // Add common variations if they might exist
    if (suburb.name.includes(' ')) {
      // No spaces version
      ts += `  '${suburb.name.toLowerCase().replace(/\s+/g, '')}': '${suburb.code}',\n`;
    }
  }
  
  ts += `};\n\n`;
  ts += `export default capeTownSuburbCodes;\n`;
  
  fs.writeFileSync(path.join(dataDir, 'cape_town_suburb_codes.ts'), ts);
  
  console.log('Done! Saved Cape Town suburbs to:');
  console.log(`- ${path.join(dataDir, 'cape_town_suburbs.json')}`);
  console.log(`- ${path.join(dataDir, 'cape_town_suburb_codes.ts')}`);
}

// Run the extractor
extractCapeTownSuburbs().catch(console.error);