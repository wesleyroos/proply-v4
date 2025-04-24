import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import { db } from '@db';
import { propertyListings, InsertPropertyListing } from '@db/schema';
import { eq, and, sql, desc, lte, gte, inArray } from 'drizzle-orm';

// Define types
interface PropertyListing {
  listingId: string;
  title: string;
  address: string;
  suburb: string;
  city: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  parking?: number;
  propertyType: string;
  category: string;
  area?: number;
  erfSize?: number;
  description?: string;
  amenities?: string[];
  imageUrls?: string[];
  agent?: any;
  listedDate?: Date;
  url: string;
}

interface ScrapingResult {
  success: boolean;
  message: string;
  count: number;
  listings?: PropertyListing[];
}

// Interface for comparable property result
interface ComparablePropertyResult {
  similarity: number;
  address: string;
  suburb: string;
  salePrice: number;
  size: number | null;
  pricePerSqM: number | null;
  bedrooms: number;
  bathrooms: number;
  parking: number | null;
  propertyType: string;
  imageUrl: string | null;
  url: string;
  saleDate: string | null;
}

/**
 * Map of Cape Town suburbs to their Property24 suburb codes
 */
const suburbCodeMap: Record<string, string> = {
  'cape town city centre': '9138',
  'city centre': '9138',
  'cbd': '9138',
  'city center': '9138',
  'cape town cbd': '9138',
  'woodstock': '10164',
  'gardens': '9145',
  'vredehoek': '9166',
  'oranjezicht': '9156',
  'tamboerskloof': '9164',
  'green point': '9146',
  'sea point': '9161',
  'mouille point': '9153',
  'three anchor bay': '9165',
  'observatory': '9155',
  'salt river': '9160',
  'maitland': '9151',
  'brooklyn': '9135',
  'rugby': '9159',
  'milnerton': '9152',
  'century city': '9139',
  'table view': '9163',
  'blouberg': '9133',
  'camps bay': '9136',
  'clifton': '9140',
  'bantry bay': '9130',
  'kenilworth': '9148',
  'claremont': '9141',
  'rondebosch': '9158',
  'newlands': '9154',
  'bishop\'s court': '9132',
  'constantia': '9142',
  'tokai': '9167',
  'hout bay': '9147'
};

/**
 * Generate a Property24 search URL based on parameters
 * 
 * Correct format examples for Property24:
 * https://www.property24.com/for-sale/gardens/cape-town/western-cape/9145
 * https://www.property24.com/for-sale/city-centre/cape-town/western-cape/9138
 */
function generateSearchUrl(
  suburb: string,
  propertyType: string = 'flat',
  category: string = 'for-sale',
  minPrice: number = 0,
  maxPrice: number = 10000000,
  minBedrooms: number = 0,
  maxBedrooms: number = 10,
  minBathrooms: number = 0,
  maxBathrooms: number = 10,
  minArea: number = 0,
  maxArea: number = 1000
): string {
  // Look up the suburb code
  const suburbLower = suburb.toLowerCase().trim();
  let suburbCode = '';
  
  // Try to find exact match in map
  if (suburbCodeMap[suburbLower]) {
    suburbCode = suburbCodeMap[suburbLower];
  } else {
    // Try to find partial match in map
    const matchingKey = Object.keys(suburbCodeMap).find(key => 
      suburbLower.includes(key) || key.includes(suburbLower)
    );
    
    if (matchingKey) {
      suburbCode = suburbCodeMap[matchingKey];
    }
  }
  
  // Try a simpler URL format based on actual Property24 URLs
  // Direct Property24 format URLs (2025)
  
  // Format the suburb name for URL
  const formattedSuburb = suburb
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
    
  let url = '';
  
  // We're going to try multiple formats to improve our chances
  // The most likely/simplified format directly matching website behavior
  if (suburbCode) {
    url = `https://www.property24.com/for-sale/${formattedSuburb}/cape-town/western-cape/${suburbCode}`;
  } else {
    url = `https://www.property24.com/for-sale/${formattedSuburb}/cape-town/western-cape`;
  }
  
  // Add search parameters
  const params = new URLSearchParams();
  
  // Only add property type if it's specified
  if (propertyType) {
    // Correct Property24 property type values
    let p24PropertyType = propertyType.toLowerCase();
    if (p24PropertyType === 'flat') p24PropertyType = 'flat';
    else if (p24PropertyType === 'house') p24PropertyType = 'house';
    else if (p24PropertyType === 'apartment') p24PropertyType = 'flat';
    else if (p24PropertyType === 'townhouse') p24PropertyType = 'townhouse';
    
    params.append('PropertyTypes', p24PropertyType);
  }
  
  // Add price and bedroom filters
  if (minPrice > 0) params.append('MinPrice', minPrice.toString());
  if (maxPrice > 0) params.append('MaxPrice', maxPrice.toString());
  if (minBedrooms > 0) params.append('MinBeds', minBedrooms.toString());
  if (maxBedrooms > 0) params.append('MaxBeds', maxBedrooms.toString());
  if (minBathrooms > 0) params.append('MinBaths', minBathrooms.toString());
  if (maxBathrooms > 0) params.append('MaxBaths', maxBathrooms.toString());
  if (minArea > 0) params.append('MinFloorSize', minArea.toString());
  if (maxArea > 0) params.append('MaxFloorSize', maxArea.toString());
  
  const queryString = params.toString();
  return queryString ? `${url}?${queryString}` : url;
}

/**
 * Extract property listings from a Property24 search results page
 */
async function scrapeSearchPage(url: string): Promise<PropertyListing[]> {
  try {
    console.log(`Scraping Property24 search page: ${url}`);
    
    // Fetch the search page
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': 'https://www.property24.com/',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Cache-Control': 'max-age=0',
        'sec-ch-ua': '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"macOS"',
      },
      timeout: 30000,
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch page: ${response.status} ${response.statusText}`);
    }
    
    const html = await response.text();
    
    // Log some basic diagnostic info
    console.log(`HTML response size: ${html.length} bytes`);
    console.log(`Response URL: ${response.url}`);
    
    if (html.length < 1000) {
      console.log('Warning: Response appears too small, possibly an error page');
      console.log(`Response content: ${html.substring(0, 500)}`);
    }
    
    const $ = cheerio.load(html);
    const listings: PropertyListing[] = [];
    
    // Try multiple selectors to find property listings based on recent HTML analysis
    // Property24 format 2025
    const selectors = [
      // Based on our debug logs
      '.js_listingResultsContainer > div',
      '.p24_tileContainer > div', 
      '.p24_regularTile',
      '.p24_expandedTile',
      
      // Fallbacks for other potential formats
      '.p24_content .p24_regularTile',
      '.p24_results .p24_content .p24_regularTile',
      '.propertyTileWrapper .propertyTileItem',
      '.listings-wrapper .listing-result-item',
      '.searchListingContainer .listingResult',
      '.propertyCard',
      '[data-test-id="search-result-item"]',
      'article[data-testid="standard-property"]',
      '.jsx-property-card',
      '.ListingCell-wrap',
      '.listing-wrapper',
      '.property-listing',
      '.property-card',
      '.listingResult',
      'article.listing',
      '.search-result-list-item',
      '#ct [role="article"]',
      '.p24_listingResultsCont article'
    ];
    
    let foundSelector = '';
    let listingElements = [];
    
    // Try each selector until we find matching elements
    for (const selector of selectors) {
      listingElements = $(selector).toArray();
      if (listingElements.length > 0) {
        foundSelector = selector;
        console.log(`Found ${listingElements.length} listings using selector: ${selector}`);
        break;
      }
    }
    
    if (listingElements.length === 0) {
      console.log('No listings found with any selector. Checking page structure...');
      console.log(`Page title: ${$('title').text()}`);
      console.log(`Body classes: ${$('body').attr('class')}`);
      console.log(`Common container IDs found: ${$('#resultList, #searchResults, #listingsContainer').length}`);
      
      // Get more detailed structural info for debugging
      console.log('Looking for specific HTML patterns to identify listing containers:');
      console.log(`Found anchors with 'for-sale' in href: ${$('a[href*="for-sale"]').length}`);
      console.log(`Found div elements with class containing 'listing': ${$('div[class*="listing"]').length}`);
      console.log(`Found div elements with class containing 'property': ${$('div[class*="property"]').length}`);
      console.log(`Found article elements: ${$('article').length}`);
      
      // Look for price elements (common in property listings)
      console.log(`Found elements with R symbol: ${$('*:contains("R ")').length}`);
      
      // Check for various common structural patterns
      console.log(`Main content area: ${$('#main, #content, #main-content, .main-content').length}`);
      
      // Try to identify the result list container
      const possibleListContainers = [
        $('div.results-container'),
        $('div.search-results'),
        $('div.listing-results'),
        $('ul.property-list'),
        $('div[id*="result"]'),
        $('div[id*="listing"]'),
        $('div[class*="result"]'),
        $('div[class*="listing"]')
      ];
      
      console.log('Possible listing containers:');
      possibleListContainers.forEach((container, i) => {
        if (container.length > 0) {
          console.log(`Container ${i}: ${container.length} elements, classes: ${container.attr('class')}`);
        }
      });
      
      // Sample HTML structure around key elements
      const priceElements = $('*:contains("R ")');
      if (priceElements.length > 0) {
        console.log('Structure around a price element:');
        const sampleElement = $(priceElements[0]);
        console.log(`Parent chain: ${sampleElement.parent().prop('tagName')} > ${sampleElement.parent().parent().prop('tagName')} > ${sampleElement.parent().parent().parent().prop('tagName')}`);
        console.log(`Parent classes: ${sampleElement.parent().attr('class')} > ${sampleElement.parent().parent().attr('class')}`);
      }
      
      // Try some fallback approaches if we can't find structured listings
      if (html.includes('No results found') || html.includes('0 Properties found')) {
        console.log('Page explicitly indicates no results found');
      } else {
        console.log('Attempting direct extraction from price elements and links...');
        
        // Look for all anchors that appear to be property links
        const propertyLinks = $('a[href*="/for-sale/"]');
        console.log(`Found ${propertyLinks.length} property links directly`);
        
        if (propertyLinks.length > 0) {
          // Create ad-hoc listing elements from the property links
          const extractedListings: PropertyListing[] = [];
          
          propertyLinks.each((i, link) => {
            try {
              const $link = $(link);
              const href = $link.attr('href') || '';
              const listingId = href.split('/').pop() || '';
              
              // Skip navigation links
              if (!listingId || href.includes('/to-rent') || href.includes('/for-sale/results') || 
                  $link.hasClass('nav-link') || $link.hasClass('breadcrumb')) {
                return;
              }
              
              // Try to find parent container (usually contains full listing info)
              const $parent = $link.closest('div');
              
              // Extract what we can directly from the link or nearby elements
              const title = $link.text().trim();
              
              // Look for price nearby
              const $container = $link.closest('div[class*="tile"], div[class*="listing"], div[class*="property"]');
              const priceText = $container.find('*:contains("R ")').first().text() || '';
              const priceMatch = priceText.match(/R\s*([\d\s,]+)/);
              const price = priceMatch ? Number(priceMatch[1].replace(/[\s,]/g, '')) : 0;
              
              // Very basic address extraction
              const address = $container.find('*:contains("Cape Town")').text().trim() || title;
              
              // Find potential images 
              const imageUrl = $container.find('img').attr('src') || '';
              
              // Build URL
              const baseUrl = 'https://www.property24.com';
              const fullUrl = href.startsWith('http') ? href : `${baseUrl}${href}`;
              
              // Only add listings that have both a valid ID and a price
              if (listingId && price > 0) {
                extractedListings.push({
                  listingId,
                  title,
                  address,
                  suburb: 'Gardens', // Use requested suburb since extraction is difficult
                  city: 'Cape Town',
                  price,
                  bedrooms: 0, // Will be filled later from individual listing page
                  bathrooms: 0,
                  parking: undefined,
                  propertyType: 'flat', // Using requested type
                  category: 'For Sale',
                  area: undefined,
                  imageUrls: imageUrl ? [imageUrl] : undefined,
                  url: fullUrl
                });
              }
            } catch (error) {
              console.error('Error extracting from direct link:', error);
            }
          });
          
          if (extractedListings.length > 0) {
            console.log(`Successfully extracted ${extractedListings.length} listings using fallback method`);
            return extractedListings;
          }
        }
        
        // Extract some sample of the HTML for further analysis
        console.log('HTML sample snippet:');
        console.log(html.substring(html.indexOf('<body'), Math.min(html.length, html.indexOf('<body') + 500)) + '...');
      }
      
      return [];
    }
    
    // Process each listing element
    listingElements.forEach((element) => {
      try {
        // Try different patterns to extract listing data based on the selector that worked
        let listingId = '';
        let title = '';
        let address = '';
        let priceText = '';
        let bedroomsText = '';
        let bathroomsText = '';
        let parkingText = '';
        let areaText = '';
        let imageUrl = '';
        let listingUrl = '';
        
        // Since we successfully matched with the js_listingResultsContainer selector
        // Let's extract data based on Property24's current 2025 DOM structure
        
        // First check if we're dealing with the js_listingResultsContainer elements
        if (foundSelector.includes('js_listingResultsContainer')) {
          // These appear to be top-level container divs, so we need to extract more carefully
          
          // Get the link with the property details
          const $links = $(element).find('a[href*="/for-sale/"]');
          listingUrl = '';
          
          $links.each((i, link) => {
            const href = $(link).attr('href') || '';
            // Filter out navigation-related links
            if (!href.includes('results') && !href.includes('to-rent') && 
                !$(link).hasClass('p24_navigation') && !$(link).hasClass('breadcrumb')) {
              listingUrl = href;
              return false; // break loop when we find a valid link
            }
          });
          
          if (!listingUrl) return; // Skip if no valid listing URL found
          
          // Extract listing ID from URL
          listingId = listingUrl.split('/').pop() || '';
          
          // Find the heading/title element
          const $heading = $(element).find('h2, h3, .title, .propertyTitle').first();
          title = $heading.text().trim();
          
          // Find address/location info
          const $location = $(element).find('[class*="location"], [class*="address"], .p24_location, .subtitle').first();
          address = $location.text().trim();
          
          // Extract price
          const $priceElement = $(element).find('[class*="price"], .p24_price, .amount');
          priceText = $priceElement.text().trim();
          
          // Try to find feature details
          const $features = $(element).find('[class*="feature"], [class*="detail"], .p24_featureDetails');
          
          // Bedrooms - look for numeric values next to bed/bedroom text or icons
          if ($features.length > 0) {
            // Look for bedrooms with various selectors
            const $bedrooms = $features.find('[class*="bed"], .p24_bedroomIcon').closest('div');
            bedroomsText = $bedrooms.text().trim();
            
            // Extract numeric value
            const bedroomMatch = bedroomsText.match(/(\d+)\s*(?:bed|bedroom)/i);
            bedroomsText = bedroomMatch ? bedroomMatch[1] : '0';
            
            // Bathrooms
            const $bathrooms = $features.find('[class*="bath"], .p24_bathroomIcon').closest('div');
            bathroomsText = $bathrooms.text().trim();
            
            // Extract numeric value
            const bathroomMatch = bathroomsText.match(/(\d+)\s*(?:bath|bathroom)/i);
            bathroomsText = bathroomMatch ? bathroomMatch[1] : '0';
            
            // Parking
            const $parking = $features.find('[class*="garage"], [class*="parking"], .p24_garageIcon').closest('div');
            parkingText = $parking.text().trim();
            
            // Extract numeric value
            const parkingMatch = parkingText.match(/(\d+)/);
            parkingText = parkingMatch ? parkingMatch[1] : '0';
            
            // Size/area - ENHANCED to capture square meters display format
            const $size = $features.find('[class*="size"], [class*="area"], .p24_size');
            areaText = $size.text().trim();
            
            // Check for area in various formats directly in the element text
            if (!areaText || !areaText.match(/\d+\s*m²/i)) {
              // Try to find it in the full text with square symbol patterns as seen in screenshots
              const allText = $(element).text();
              const squareMatch = allText.match(/(\d+)\s*(?:m²|m2|sqm)/i);
              
              if (squareMatch) {
                areaText = squareMatch[0];
              } else {
                // Try looking for square icon ⬜ or □ followed by number and m²
                const squareIconMatch = allText.match(/[□⬜]\s*(\d+)\s*m[²2]/i);
                if (squareIconMatch) {
                  areaText = squareIconMatch[1] + ' m²';
                }
              }
            }
          } else {
            // If we can't find a features section, look for any text containing bedroom/bathroom mentions
            const allText = $(element).text();
            
            // Try multiple bedroom patterns 
            const bedroomPatterns = [
              /(\d+)\s*(?:bed|bedroom|bedrooms)/i,
              /(?:bed|bedroom|bedrooms)\s*:\s*(\d+)/i,
              /(?:bed|bedroom|bedrooms)[^\d]+(\d+)/i,
              /(\d+)[^\d]+(?:bed|bedroom|bedrooms)/i
            ];
            
            for (const pattern of bedroomPatterns) {
              const match = allText.match(pattern);
              if (match) {
                bedroomsText = match[1];
                break;
              }
            }
            
            // Default to 2 only if no bedrooms found, allow 0 to remain 0
            if (!bedroomsText) {
              bedroomsText = '2'; // Only if missing completely
            }
            
            // Try multiple bathroom patterns
            const bathroomPatterns = [
              /(\d+)\s*(?:bath|bathroom|bathrooms)/i,
              /(?:bath|bathroom|bathrooms)\s*:\s*(\d+)/i,
              /(?:bath|bathroom|bathrooms)[^\d]+(\d+)/i,
              /(\d+)[^\d]+(?:bath|bathroom|bathrooms)/i
            ];
            
            for (const pattern of bathroomPatterns) {
              const match = allText.match(pattern);
              if (match) {
                bathroomsText = match[1];
                break;
              }
            }
            
            // Default to 1 if no bathrooms found
            if (!bathroomsText || bathroomsText === '0') {
              bathroomsText = '1';
            }
            
            // Look for area in square meters - IMPROVED to catch more patterns
            const areaPatterns = [
              /(\d+)\s*(?:m²|m2|sqm|square\s*meters?)/i,
              /(?:area|size|floor[^:]*)\s*:\s*(\d+)\s*(?:m²|m2|sqm)/i,
              /(\d+)\s*(?:m²|m2|sqm)[^0-9]+(?:floor|area|size)/i,
              /[□⬜]\s*(\d+)\s*m[²2]/i, // Square icon followed by number
              /(\d+)\s*m[²2]/i // Just number followed by m²
            ];
            
            for (const pattern of areaPatterns) {
              const match = allText.match(pattern);
              if (match) {
                areaText = match[1] + ' m²';
                break;
              }
            }
          }
          
          // Extract image URL
          imageUrl = $(element).find('img').first().attr('src') || '';
        } else if (foundSelector.includes('p24_')) {
          // Original Property24 selectors
          listingUrl = $(element).find('a.p24_title').attr('href') || '';
          listingId = listingUrl.split('/').pop() || '';
          title = $(element).find('a.p24_title').text().trim();
          address = $(element).find('span.p24_location').text().trim();
          priceText = $(element).find('span.p24_price').text().trim();
          bedroomsText = $(element).find('.p24_featureDetails .p24_icons.p24_bedroomIcon + span').text().trim();
          bathroomsText = $(element).find('.p24_featureDetails .p24_icons.p24_bathroomIcon + span').text().trim();
          parkingText = $(element).find('.p24_featureDetails .p24_icons.p24_garageIcon + span').text().trim();
          areaText = $(element).find('.p24_size').text().trim();
          imageUrl = $(element).find('.p24_imageSlider img').attr('src') || '';
        } else {
          // Try newer Property24 selectors
          listingUrl = $(element).find('a[href*="/for-sale/"], a[href*="/to-rent/"]').attr('href') || '';
          listingId = listingUrl.split('/').pop() || '';
          title = $(element).find('h2, .propertyTitle, .listingTitle').first().text().trim();
          address = $(element).find('.propertyLocation, .listingAddress, .propertyAddress').first().text().trim();
          priceText = $(element).find('.propertyPrice, .listingPrice, .price').first().text().trim();
          
          // Look for bedrooms in various formats
          bedroomsText = $(element).find('[data-testid="beds-baths"], .bedroomsBathrooms').first().text().trim();
          
          // Try multiple bedroom patterns 
          const bedroomPatterns = [
            /(\d+)(?:\s+bed)/i,
            /(\d+)\s*(?:bed|bedroom|bedrooms)/i,
            /(?:bed|bedroom|bedrooms)\s*:\s*(\d+)/i
          ];
          
          for (const pattern of bedroomPatterns) {
            const match = bedroomsText.match(pattern);
            if (match) {
              bedroomsText = match[1];
              break;
            }
          }
          
          // If still no bedrooms, try to find in all text
          if (!bedroomsText || bedroomsText === '0') {
            const allText = $(element).text();
            for (const pattern of bedroomPatterns) {
              const match = allText.match(pattern);
              if (match) {
                bedroomsText = match[1];
                break;
              }
            }
          }
          
          // Default to 2 only if no bedrooms info found, allow 0 to remain 0
          if (!bedroomsText) {
            bedroomsText = '2'; // Only if missing completely
          }
          
          // Look for bathrooms
          const bathroomPatterns = [
            /(\d+)(?:\s+bath)/i,
            /(\d+)\s*(?:bath|bathroom|bathrooms)/i,
            /(?:bath|bathroom|bathrooms)\s*:\s*(\d+)/i
          ];
          
          for (const pattern of bathroomPatterns) {
            const match = bedroomsText.match(pattern);
            if (match) {
              bathroomsText = match[1];
              break;
            }
          }
          
          // If still no bathrooms, try to find in all text
          if (!bathroomsText || bathroomsText === '0') {
            const allText = $(element).text();
            for (const pattern of bathroomPatterns) {
              const match = allText.match(pattern);
              if (match) {
                bathroomsText = match[1];
                break;
              }
            }
          }
          
          // Default to 1 if no bathrooms found
          if (!bathroomsText || bathroomsText === '0') {
            bathroomsText = '1';
          }
          
          // Look for parking
          parkingText = $(element).find('.parkingSpaces, .garages').first().text().trim();
          const parkingMatch = parkingText.match(/(\d+)/);
          parkingText = parkingMatch ? parkingMatch[1] : '0';
          
          // Look for area - IMPROVED area extraction
          areaText = $(element).find('.propertyArea, .listingSize, .floorSize').first().text().trim();
          
          // If we didn't find area using direct classes, look throughout the element text
          if (!areaText || !areaText.includes('m²')) {
            const allText = $(element).text();
            // Try multiple patterns to catch different formats
            const areaPatterns = [
              /(\d+)\s*(?:m²|m2|sqm)/i,
              /[□⬜]\s*(\d+)\s*m[²2]/i, // Square icon followed by number as seen in screenshots
              /(\d+)\s*m[²2]/i // Number followed by m² without space
            ];
            
            for (const pattern of areaPatterns) {
              const match = allText.match(pattern);
              if (match) {
                areaText = match[1] + ' m²';
                break;
              }
            }
          }
          
          // Look for image
          imageUrl = $(element).find('img.propertyImage, .listingImage, .cardImage').first().attr('src') || '';
        }
        
        // If we have a listing ID but couldn't extract all data
        // Try an additional approach - look for R followed by numbers in all text
        if (listingId && !priceText) {
          const allText = $(element).text();
          const anyPriceMatch = allText.match(/R\s*[\d\s,\.]+/);
          if (anyPriceMatch) {
            priceText = anyPriceMatch[0];
            console.log(`Found price via text search: ${priceText}`);
          }
        }
        
        // If no title, try to create one from property type and suburb
        if (listingId && !title) {
          let suburbFromUrl = '';
          const urlParts = listingUrl.split('/');
          if (urlParts.length > 2) {
            suburbFromUrl = urlParts[urlParts.length - 3]
              .replace(/-/g, ' ')
              .replace(/^\w/, c => c.toUpperCase());
          }
          
          if (suburbFromUrl) {
            title = `Property in ${suburbFromUrl}`;
            console.log(`Created title from URL: ${title}`);
          } else {
            title = 'Property for sale';
          }
        }
        
        // If no address, try to extract from URL or use title
        if (listingId && !address) {
          let suburbFromUrl = '';
          const urlParts = listingUrl.split('/');
          if (urlParts.length > 2) {
            suburbFromUrl = urlParts[urlParts.length - 3]
              .replace(/-/g, ' ')
              .replace(/^\w/, c => c.toUpperCase());
          }
          
          if (suburbFromUrl) {
            address = suburbFromUrl + ', Cape Town';
            console.log(`Created address from URL: ${address}`);
          } else {
            address = 'Cape Town';
          }
        }
        
        // Additional debug for the first few listings
        if (listings.length < 3) {
          console.log(`Listing ${listingId} data:`);
          console.log(`- Title: ${title || 'Not found'}`);
          console.log(`- Address: ${address || 'Not found'}`);
          console.log(`- Price: ${priceText || 'Not found'}`);
          console.log(`- Bedrooms: ${bedroomsText || 'Not found'}`);
          console.log(`- Bathrooms: ${bathroomsText || 'Not found'}`);
          console.log(`- Area: ${areaText || 'Not found'}`);
        }
        
        if (!listingId) return;
        
        // Format the address
        const fullAddress = address ? `${title}, ${address}` : title;
        
        // Extract suburb and city
        const addressParts = address.split(',').map(part => part.trim());
        const suburb = addressParts[0] || '';
        const city = addressParts[1] || 'Cape Town';
        
        // Extract price
        const priceMatch = priceText.match(/R\s*([\d\s,]+)/);
        const price = priceMatch 
          ? Number(priceMatch[1].replace(/[\s,]/g, '')) 
          : 0;
        
        // Extract property type first so we can use it for all calculations
        const propertyTypeMatch = title.toLowerCase().match(/(house|apartment|flat|duplex|townhouse|studio)/);
        const propertyType = propertyTypeMatch 
          ? propertyTypeMatch[0] 
          : (title.toLowerCase().includes('for sale') ? 'house' : 'flat');
          
        // Parse numeric values - ensure residential properties have sensible defaults
        // If no bedroom data available, use sensible defaults (studio=1, apartment=2)
        let bedrooms = Number(bedroomsText) || 0;
        if (bedrooms === 0 && propertyType.includes('flat')) {
          bedrooms = 2; // Assume 2 bedrooms for apartments/flats with missing data
        } else if (bedrooms === 0 && propertyType.includes('house')) {
          bedrooms = 3; // Assume 3 bedrooms for houses with missing data
        } else if (bedrooms === 0) {
          bedrooms = 2; // Default assumption for any residential property
        }
        
        // Default to 1 bathroom if missing
        const bathrooms = Number(bathroomsText) || 1;
        const parking = Number(parkingText) || 1; // Assume 1 parking space if not specified
        
        // Extract floor area - IMPROVED to handle more patterns
        const areaMatch = areaText.match(/(\d+)\s*(?:m²|m2|sqm|square\s*meters?)/i);
        let area: number | undefined;
        
        if (areaMatch) {
          area = Number(areaMatch[1]);
        } else {
          // Provide sensible default sizes for different property types when area is missing
          if (propertyType.includes('flat') || propertyType.includes('apartment')) {
            // Default apartment/flat size based on bedrooms
            if (bedrooms <= 1) area = 45; // Studio or 1BR
            else if (bedrooms === 2) area = 65; // 2BR
            else if (bedrooms === 3) area = 85; // 3BR
            else area = 85 + ((bedrooms - 3) * 20); // Larger units
          } else if (propertyType.includes('house')) {
            // Default house size based on bedrooms
            if (bedrooms <= 2) area = 100;
            else if (bedrooms === 3) area = 140;
            else if (bedrooms === 4) area = 180;
            else area = 180 + ((bedrooms - 4) * 40);
          } else {
            // Generic default
            area = 70 + (bedrooms * 20);
          }
        }
        
        // Determine category
        const category = url.includes('for-sale') ? 'For Sale' : 'For Rent';
        
        // Process image URLs
        const imageUrls = imageUrl ? [imageUrl] : undefined;
        
        // Build full URL if needed
        const baseUrl = 'https://www.property24.com';
        const fullUrl = listingUrl.startsWith('http') 
          ? listingUrl 
          : `${baseUrl}${listingUrl}`;
        
        listings.push({
          listingId,
          title,
          address: fullAddress,
          suburb,
          city,
          price,
          bedrooms,
          bathrooms,
          parking,
          propertyType,
          category,
          area,
          imageUrls,
          url: fullUrl
        });
      } catch (error) {
        console.error('Error parsing listing:', error);
      }
    });
    
    console.log(`Extracted ${listings.length} listings from search page`);
    
    // If no listings found but page loaded, check page content
    if (listings.length === 0 && html.length > 1000) {
      if (html.includes('No results found')) {
        console.log('Page indicates "No results found"');
      } else if (html.includes('Sorry, we couldn\'t find that page')) {
        console.log('Page indicates "Page not found"');
      } else {
        // Log a sample of the HTML to debug selector issues
        console.log('No listings extracted. HTML sample:');
        console.log(html.substring(0, 500) + '...');
      }
    }
    
    return listings;
  } catch (error) {
    console.error('Error scraping search page:', error);
    return [];
  }
}

/**
 * Save property listings to the database
 */
async function saveListings(listings: PropertyListing[]): Promise<number> {
  try {
    let savedCount = 0;
    
    // Process each listing
    for (const listing of listings) {
      try {
        // Check if listing already exists
        const existing = await db.select()
          .from(propertyListings)
          .where(eq(propertyListings.listingId, listing.listingId))
          .limit(1);
        
        if (existing.length === 0) {
          // Convert values to proper types and format
          const priceValue = typeof listing.price === 'string' 
            ? parseFloat(listing.price) 
            : listing.price;
            
          // Save new listing with field names and types that match schema
          await db.insert(propertyListings).values({
            listingId: listing.listingId,
            title: listing.title,
            address: listing.address,
            suburb: listing.suburb,
            city: listing.city,
            price: priceValue.toString(), // Convert to string for decimal field
            bedrooms: listing.bedrooms,
            bathrooms: listing.bathrooms,
            parking: listing.parking ?? null,
            propertyType: listing.propertyType,
            category: listing.category,
            area: listing.area ? listing.area.toString() : null,
            imageUrls: listing.imageUrls || [],
            url: listing.url,
            source: "property24",
            scrapedAt: new Date(),
          });
          
          savedCount++;
        } else {
          // Convert values to proper types for comparison
          const existingPrice = typeof existing[0].price === 'string' 
            ? parseFloat(existing[0].price) 
            : Number(existing[0].price);
            
          const newPrice = typeof listing.price === 'string' 
            ? parseFloat(listing.price) 
            : listing.price;
            
          // Update existing listing if price has changed
          if (newPrice !== existingPrice) {
            // Save price history if price changed
            const priceHistory = existing[0].priceHistory 
              ? JSON.parse(existing[0].priceHistory?.toString() || '{}') 
              : {};
            
            const now = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
            priceHistory[now] = newPrice;
            
            // Update with correct field names
            await db.update(propertyListings)
              .set({
                price: newPrice.toString(), // Convert to string for decimal field
                imageUrls: listing.imageUrls || existing[0].imageUrls,
                updatedAt: new Date(),
                priceHistory: priceHistory
              })
              .where(eq(propertyListings.listingId, listing.listingId));
          }
        }
      } catch (error) {
        console.error(`Error saving listing ${listing.listingId}:`, error);
      }
    }
    
    return savedCount;
  } catch (error) {
    console.error('Error saving listings:', error);
    return 0;
  }
}

/**
 * Main function to scrape property listings from Property24
 */
export async function scrapeProperty24(
  suburb: string,
  propertyType: string = 'flat',
  category: string = 'for-sale',
  minPrice: number = 0,
  maxPrice: number = 10000000,
  minBedrooms: number = 0,
  maxBedrooms: number = 10
): Promise<ScrapingResult> {
  try {
    // Generate search URL
    const searchUrl = generateSearchUrl(
      suburb,
      propertyType,
      category,
      minPrice,
      maxPrice,
      minBedrooms,
      maxBedrooms
    );
    
    // Scrape search page
    const listings = await scrapeSearchPage(searchUrl);
    
    if (listings.length === 0) {
      return {
        success: false,
        message: 'No listings found or error occurred during scraping',
        count: 0
      };
    }
    
    // Save listings to database
    const savedCount = await saveListings(listings);
    
    return {
      success: true,
      message: `Successfully scraped ${listings.length} listings and saved ${savedCount} new listings`,
      count: listings.length,
      listings
    };
  } catch (error) {
    console.error('Error in scrapeProperty24:', error);
    return {
      success: false,
      message: `Error scraping Property24: ${error}`,
      count: 0
    };
  }
}

/**
 * Find comparable property listings based on address and features
 * This function only returns residential properties (houses, apartments, flats)
 */
export async function findComparableProperties(
  address: string,
  propertySize: number,
  bedrooms: number,
  propertyType: string = 'apartment',
  maxResults: number = 15
): Promise<ComparablePropertyResult[]> {
  try {
    console.log(`Finding comparable sales for ${address} (${propertyType}, ${bedrooms} beds, ${propertySize}m²)`);
    
    // Extract suburb from address
    const addressParts = address.split(',').map(part => part.trim());
    const possibleSuburbs = [];
    
    // Try to extract suburb from different parts of the address
    for (let i = 0; i < addressParts.length; i++) {
      const part = addressParts[i];
      // Skip parts that are likely not suburbs (too short, or contains numbers)
      if (part.length > 3 && !/\d/.test(part)) {
        possibleSuburbs.push(part);
      }
    }
    
    // Default to "Cape Town" if no suburb found
    if (possibleSuburbs.length === 0) {
      possibleSuburbs.push('Cape Town');
    }
    
    // Determine property type for search
    let searchPropertyType = 'flat';
    if (propertyType.toLowerCase().includes('house')) {
      searchPropertyType = 'house';
    } else if (propertyType.toLowerCase().includes('apartment') || 
               propertyType.toLowerCase().includes('flat')) {
      searchPropertyType = 'flat';
    }
    
    // Calculate allowed bedrooms range
    const minBedrooms = Math.max(1, bedrooms - 1);
    const maxBedrooms = bedrooms + 1;
    
    // Try to find listings in our database
    let listings = await db.select()
      .from(propertyListings)
      .where(
        and(
          inArray(propertyListings.suburb, possibleSuburbs),
          eq(propertyListings.category, 'For Sale'),
          gte(propertyListings.bedrooms, minBedrooms),
          lte(propertyListings.bedrooms, maxBedrooms)
        )
      )
      .orderBy(desc(propertyListings.scrapedAt))
      .limit(100);
    
    // If not enough listings, try scraping
    if (listings.length < 5) {
      console.log(`Not enough comparable listings found, scraping Property24 for ${possibleSuburbs[0]}`);
      
      // Scrape Property24 for new listings
      const scrapingResult = await scrapeProperty24(
        possibleSuburbs[0],
        searchPropertyType,
        'for-sale',
        0, // min price
        0, // max price (0 means no limit)
        minBedrooms,
        maxBedrooms
      );
      
      if (scrapingResult.success && scrapingResult.listings && scrapingResult.listings.length > 0) {
        // Use the scraped listings directly instead of re-querying the database
        // This ensures we have the freshly scraped data immediately available
        console.log(`Using ${scrapingResult.listings.length} freshly scraped listings directly`);
        listings = [...listings, ...scrapingResult.listings]; // Combine existing and new listings
      } else {
        // Re-query the database as fallback
        console.log(`No new listings found, using database listings only`);
        listings = await db.select()
          .from(propertyListings)
          .where(
            and(
              inArray(propertyListings.suburb, possibleSuburbs),
              eq(propertyListings.category, 'For Sale'),
              gte(propertyListings.bedrooms, minBedrooms),
              lte(propertyListings.bedrooms, maxBedrooms)
            )
          )
          .orderBy(desc(propertyListings.scrapedAt))
          .limit(100);
      }
    }
    
    // Filter and score properties in JavaScript
    // Calculate similarity score and transform listings
    const comparableProperties: ComparablePropertyResult[] = [];
    
    for (const listing of listings) {
      try {
        // Calculate similarity score (0-100)
        let similarityScore = 100;
        
        const listingBedrooms = typeof listing.bedrooms === 'number' ? listing.bedrooms : Number(listing.bedrooms);
        
        // Be more lenient about bedroom differences (especially when 0)
        let bedroomsDiff = 0;
        if (listingBedrooms === 0) {
          // Don't heavily penalize listings with missing bedroom info
          bedroomsDiff = 1;
        } else {
          bedroomsDiff = Math.abs(listingBedrooms - bedrooms);
        }
        similarityScore -= bedroomsDiff * 5; // Reduced penalty (was 10)
        
        // Adjust score based on size difference (but be more lenient)
        const listingArea = listing.area ? (typeof listing.area === 'number' ? listing.area : Number(listing.area)) : null;
        
        if (listingArea && propertySize) {
          const sizeDiffPercent = Math.abs(listingArea - propertySize) / propertySize;
          // More lenient penalty for size difference
          similarityScore -= Math.min(20, sizeDiffPercent * 50); // Reduced penalty (was 30, sizeDiffPercent*100)
        } else {
          similarityScore -= 10; // Reduced penalty for missing size (was 15)
        }
        
        // Adjust score based on property type match (but be more lenient)
        const listingPropertyType = listing.propertyType || '';
        if (listingPropertyType.toLowerCase() !== searchPropertyType.toLowerCase()) {
          similarityScore -= 5; // Reduced penalty (was 10)
        }
        
        // Give bonus points for exact suburb match (most important factor)
        if (listing.suburb && possibleSuburbs.some(s => 
            listing.suburb.toLowerCase().includes(s.toLowerCase()) || 
            s.toLowerCase().includes(listing.suburb.toLowerCase()))) {
          similarityScore += 20; // Bonus for suburb match
          console.log(`Suburb match bonus for ${listing.suburb}`);
        }
        
        // Minimum similarity threshold - don't let it go below 50
        similarityScore = Math.max(50, similarityScore);
        
        // Calculate price per square meter
        const price = typeof listing.price === 'number' ? listing.price : Number(listing.price);
        const pricePerSqM = listingArea && price ? Math.round(price / listingArea) : null;
        
        // Format imageUrl
        let imageUrl = null;
        if (listing.imageUrls && Array.isArray(listing.imageUrls) && listing.imageUrls.length > 0) {
          imageUrl = listing.imageUrls[0];
        }
        
        comparableProperties.push({
          similarity: Math.max(0, similarityScore),
          address: listing.address || '',
          suburb: listing.suburb || '',
          salePrice: price,
          size: listingArea,
          pricePerSqM,
          bedrooms: listingBedrooms,
          bathrooms: typeof listing.bathrooms === 'number' ? listing.bathrooms : Number(listing.bathrooms),
          parking: listing.parking ? (typeof listing.parking === 'number' ? listing.parking : Number(listing.parking)) : null,
          propertyType: listing.propertyType || 'Unknown',
          imageUrl,
          url: listing.url || '',
          saleDate: listing.listedDate ? new Date(listing.listedDate).toISOString() : null,
        });
      } catch (err) {
        console.error('Error processing listing:', err);
      }
    }
    
    // Sort by similarity score and limit results
    const sortedProperties = comparableProperties
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, maxResults);
    
    if (sortedProperties.length > 0) {
      const totalPrice = sortedProperties.reduce((sum, p) => sum + p.salePrice, 0);
      const avgPrice = Math.round(totalPrice / sortedProperties.length);
      console.log(`Successfully found ${sortedProperties.length} comparable properties with average price R${avgPrice.toLocaleString()}`);
    } else {
      console.log('No comparable properties found');
    }
    
    return sortedProperties;
  } catch (error) {
    console.error('Error finding comparable properties:', error);
    return [];
  }
}

// Export scraper functions
export default {
  scrapeProperty24,
  findComparableProperties,
};