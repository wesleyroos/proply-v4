import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

// ES Module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define the provinces we want to crawl (can be expanded)
const provinces = [
  { name: 'western-cape', label: 'Western Cape' },
  { name: 'gauteng', label: 'Gauteng' },
  { name: 'kwazulu-natal', label: 'KwaZulu-Natal' },
  { name: 'eastern-cape', label: 'Eastern Cape' },
  { name: 'free-state', label: 'Free State' },
  { name: 'mpumalanga', label: 'Mpumalanga' },
  { name: 'limpopo', label: 'Limpopo' },
  { name: 'north-west', label: 'North West' },
  { name: 'northern-cape', label: 'Northern Cape' }
];

// Define types
interface City {
  name: string;
  url: string;
  code?: string;
}

interface Suburb {
  name: string;
  url: string;
  code: string;
  city: string;
  province: string;
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

// Function to extract cities from a province page
async function extractCities(provinceUrl: string, provinceName: string): Promise<City[]> {
  const html = await fetchHtml(provinceUrl);
  if (!html) return [];

  const $ = cheerio.load(html);
  const cities: City[] = [];
  
  // Look for city links - adjust selectors based on actual HTML structure
  $('a[href*="/for-sale/"]').each((_, element) => {
    const $el = $(element);
    const href = $el.attr('href');
    const cityName = $el.text().trim();
    
    // Filter out non-city links and ensure we have a proper URL
    if (href && cityName && 
        href.includes(`/${provinceName}/`) && 
        !href.includes('?') && 
        !href.includes('/south-africa/') &&
        !href.includes('/#') && 
        cityName !== 'For Sale' && 
        cityName !== 'To Rent') {
      
      // Build the full URL if it's relative
      const url = href.startsWith('http') ? href : `https://www.property24.com${href}`;
      
      // Check if this city already exists in our list
      if (!cities.some(city => city.name === cityName)) {
        cities.push({ name: cityName, url });
      }
    }
  });

  console.log(`Found ${cities.length} cities in ${provinceName}`);
  return cities;
}

// Function to extract suburbs from a city page
async function extractSuburbs(city: City, provinceName: string): Promise<Suburb[]> {
  const html = await fetchHtml(city.url);
  if (!html) return [];

  const $ = cheerio.load(html);
  const suburbs: Suburb[] = [];
  
  // Look for suburb links - adjust selectors based on actual HTML structure
  $('a[href*="/for-sale/"]').each((_, element) => {
    const $el = $(element);
    const href = $el.attr('href');
    const suburbName = $el.text().trim();
    
    // Only interested in suburb links that have a numeric code at the end
    if (href && suburbName && href.match(/\/\d+$/)) {
      // Build the full URL if it's relative
      const url = href.startsWith('http') ? href : `https://www.property24.com${href}`;
      
      // Extract the suburb code
      const code = extractCodeFromUrl(url);
      
      if (code) {
        suburbs.push({
          name: suburbName,
          url,
          code,
          city: city.name,
          province: provinceName
        });
      }
    }
  });

  console.log(`Found ${suburbs.length} suburbs in ${city.name}, ${provinceName}`);
  return suburbs;
}

// Main function to crawl all provinces, cities, and suburbs
async function crawlSuburbCodes() {
  const allSuburbs: Suburb[] = [];

  for (const province of provinces) {
    console.log(`Crawling province: ${province.label}`);
    
    // Construct the province URL
    const provinceUrl = `https://www.property24.com/for-sale/${province.name}/south-africa`;
    
    // Get all cities in this province
    const cities = await extractCities(provinceUrl, province.name);
    await delay(1000); // Small delay between requests to be polite to the server
    
    // Process each city to get its suburbs
    for (const city of cities) {
      console.log(`Crawling city: ${city.name}`);
      
      const citySuburbs = await extractSuburbs(city, province.label);
      allSuburbs.push(...citySuburbs);
      
      await delay(1000); // Small delay between requests
    }
  }

  // When we're done, save all the data
  const jsonOutput = JSON.stringify(allSuburbs, null, 2);
  fs.writeFileSync(path.join(__dirname, '..', 'data', 'suburb_codes.json'), jsonOutput);
  
  // Also generate a TypeScript map object for direct use in code
  const tsMap = generateTypeScriptMap(allSuburbs);
  fs.writeFileSync(path.join(__dirname, '..', 'data', 'suburb_code_map.ts'), tsMap);
  
  console.log(`Done! Collected ${allSuburbs.length} suburbs.`);
}

// Function to generate a TypeScript map for direct use in code
function generateTypeScriptMap(suburbs: Suburb[]): string {
  let ts = `// Auto-generated suburb code map from Property24\n\n`;
  ts += `export const suburbCodeMap: Record<string, string> = {\n`;
  
  // Group by province and city for better organization
  const grouped: Record<string, Record<string, Suburb[]>> = {};
  
  for (const suburb of suburbs) {
    if (!grouped[suburb.province]) {
      grouped[suburb.province] = {};
    }
    
    if (!grouped[suburb.province][suburb.city]) {
      grouped[suburb.province][suburb.city] = [];
    }
    
    grouped[suburb.province][suburb.city].push(suburb);
  }
  
  // Generate the map with comments for organization
  for (const province in grouped) {
    ts += `  // ${province}\n`;
    
    for (const city in grouped[province]) {
      ts += `  // ${city}\n`;
      
      for (const suburb of grouped[province][city]) {
        // Add the suburb name in lowercase as the key
        ts += `  '${suburb.name.toLowerCase()}': '${suburb.code}',\n`;
        
        // Add common variations if they might exist
        if (suburb.name.includes(' ')) {
          // No spaces version
          ts += `  '${suburb.name.toLowerCase().replace(/\s+/g, '')}': '${suburb.code}',\n`;
        }
      }
      
      ts += '\n';
    }
  }
  
  ts += `};\n\n`;
  ts += `export default suburbCodeMap;\n`;
  
  return ts;
}

// Create the data directory if it doesn't exist
if (!fs.existsSync(path.join(__dirname, '..', 'data'))) {
  fs.mkdirSync(path.join(__dirname, '..', 'data'));
}

// Run the crawler
crawlSuburbCodes().catch(console.error);