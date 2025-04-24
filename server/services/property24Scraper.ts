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
  
  // Build search URL with suburb code if available
  let url;
  if (suburbCode) {
    // Use the suburb code format (correct format for Property24 codes)
    // Instead of suburb name, just use the suburb code directly
    url = `https://www.property24.com/${category}/cape-town/western-cape/${suburbCode}`;
  } else {
    // Fallback to the suburb name format
    const formattedSuburb = suburb
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');
    
    url = `https://www.property24.com/${category}/${formattedSuburb}/western-cape/`;
  }
  
  // Add search parameters
  const params = new URLSearchParams();
  params.append('PropertyTypes', propertyType);
  params.append('MinPrice', minPrice.toString());
  params.append('MaxPrice', maxPrice.toString());
  params.append('MinBeds', minBedrooms.toString());
  params.append('MaxBeds', maxBedrooms.toString());
  params.append('MinBaths', minBathrooms.toString());
  params.append('MaxBaths', maxBathrooms.toString());
  if (minArea > 0) params.append('MinFloorSize', minArea.toString());
  if (maxArea > 0) params.append('MaxFloorSize', maxArea.toString());
  
  return `${url}?${params.toString()}`;
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
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Referer': 'https://www.property24.com/',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Cache-Control': 'max-age=0',
      },
      timeout: 30000,
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch page: ${response.status} ${response.statusText}`);
    }
    
    const html = await response.text();
    const $ = cheerio.load(html);
    const listings: PropertyListing[] = [];
    
    // Extract listing data from search results
    $('.p24_results .p24_content .p24_regularTile').each((i, element) => {
      try {
        // Extract listing ID
        const listingPath = $(element).find('a.p24_title').attr('href') || '';
        const listingId = listingPath.split('/').pop() || '';
        if (!listingId) return;
        
        // Extract basic information
        const title = $(element).find('a.p24_title').text().trim();
        const address = $(element).find('span.p24_location').text().trim();
        const fullAddress = `${title}, ${address}`;
        
        // Extract suburb and city
        const addressParts = address.split(',').map(part => part.trim());
        const suburb = addressParts[0] || '';
        const city = addressParts[1] || 'Cape Town';
        
        // Extract price
        const priceText = $(element).find('span.p24_price').text().trim();
        const priceMatch = priceText.match(/R\s*([\d\s,]+)/);
        const price = priceMatch 
          ? Number(priceMatch[1].replace(/[\s,]/g, '')) 
          : 0;
        
        // Extract bedrooms, bathrooms, and garage
        const bedrooms = Number($(element).find('.p24_featureDetails .p24_icons.p24_bedroomIcon + span').text().trim()) || 0;
        const bathrooms = Number($(element).find('.p24_featureDetails .p24_icons.p24_bathroomIcon + span').text().trim()) || 0;
        const parking = Number($(element).find('.p24_featureDetails .p24_icons.p24_garageIcon + span').text().trim()) || undefined;
        
        // Extract floor area
        const areaText = $(element).find('.p24_size').text().trim();
        const areaMatch = areaText.match(/(\d+)m²/);
        const area = areaMatch ? Number(areaMatch[1]) : undefined;
        
        // Extract property type
        const propertyTypeMatch = title.toLowerCase().match(/(house|apartment|flat|duplex|townhouse|studio)/);
        const propertyType = propertyTypeMatch 
          ? propertyTypeMatch[0] 
          : (title.toLowerCase().includes('for sale') ? 'house' : 'flat');
        
        // Determine category
        const category = url.includes('for-sale') ? 'For Sale' : 'For Rent';
        
        // Extract image URLs
        const mainImage = $(element).find('.p24_imageSlider img').attr('src') || '';
        const imageUrls = mainImage ? [mainImage] : undefined;
        
        // Build full URL
        const baseUrl = 'https://www.property24.com';
        const fullUrl = listingPath.startsWith('http') 
          ? listingPath 
          : `${baseUrl}${listingPath}`;
        
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
            
          // Save new listing with properly typed values
          await db.insert(propertyListings).values({
            listing_id: listing.listingId,
            title: listing.title,
            address: listing.address,
            suburb: listing.suburb,
            city: listing.city,
            price: priceValue.toString(), // Convert to string for decimal field
            bedrooms: listing.bedrooms,
            bathrooms: listing.bathrooms,
            parking: listing.parking ?? null,
            property_type: listing.propertyType,
            category: listing.category,
            area: listing.area ? listing.area.toString() : null,
            image_urls: listing.imageUrls || [],
            url: listing.url,
            source: "property24",
            scraped_at: new Date(),
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
            
            await db.update(propertyListings)
              .set({
                price: newPrice,
                imageUrls: listing.imageUrls || existing[0].imageUrls,
                updatedAt: new Date(),
                priceHistory: JSON.stringify(priceHistory)
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
      
      if (scrapingResult.success) {
        // Re-query the database after scraping
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
        
        // Adjust score based on bedrooms difference
        const bedroomsDiff = Math.abs(listingBedrooms - bedrooms);
        similarityScore -= bedroomsDiff * 10;
        
        // Adjust score based on size difference
        const listingArea = listing.area ? (typeof listing.area === 'number' ? listing.area : Number(listing.area)) : null;
        
        if (listingArea && propertySize) {
          const sizeDiffPercent = Math.abs(listingArea - propertySize) / propertySize;
          similarityScore -= Math.min(30, sizeDiffPercent * 100);
        } else {
          similarityScore -= 15; // Penalty for missing size
        }
        
        // Adjust score based on property type match
        const listingPropertyType = listing.propertyType || '';
        if (listingPropertyType.toLowerCase() !== searchPropertyType.toLowerCase()) {
          similarityScore -= 10;
        }
        
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