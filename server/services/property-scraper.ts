import fetch from 'node-fetch';
import { load } from 'cheerio';

interface ScrapedProperty {
  address?: string;
  price?: number;
  floorArea?: number;
  bedrooms?: number;
  bathrooms?: number;
  parkingSpaces?: number;
  levies?: number;
  ratesTaxes?: number;
  propertyType?: string;
  description?: string;
  features?: string[];
  images?: string[];
}

export async function scrapePrivateProperty(url: string): Promise<ScrapedProperty> {
  try {
    console.log('Starting scraping for URL:', url);
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Failed to fetch property page');
    }

    const html = await response.text();
    const $ = load(html);
    console.log('Successfully loaded HTML');

    const scrapedData: ScrapedProperty = {};

    // Extract price
    const priceText = $('.p24_price').text().trim();
    if (priceText) {
      scrapedData.price = Number(priceText.replace(/[^0-9]/g, ''));
      console.log('Found price:', scrapedData.price);
    }

    // Extract address
    scrapedData.address = $('.p24_location').text().trim();
    console.log('Found address:', scrapedData.address);

    // Extract property details
    $('.p24_features .p24_featureDetails').each((_, element) => {
      const text = $(element).text().trim();
      console.log('Processing feature:', text);

      if (text.includes('Bedroom')) {
        scrapedData.bedrooms = Number(text.replace(/[^0-9]/g, ''));
      }
      if (text.includes('Bathroom')) {
        scrapedData.bathrooms = Number(text.replace(/[^0-9]/g, ''));
      }
      if (text.includes('Parking')) {
        scrapedData.parkingSpaces = Number(text.replace(/[^0-9]/g, ''));
      }
      if (text.includes('Floor Size')) {
        scrapedData.floorArea = Number(text.replace(/[^0-9]/g, ''));
      }
    });

    // Extract levies and rates
    $('.p24_propertyInfo').each((_, element) => {
      const text = $(element).text().trim();
      console.log('Processing property info:', text);
      if (text.includes('Levy')) {
        scrapedData.levies = Number(text.replace(/[^0-9]/g, ''));
      }
      if (text.includes('Rates')) {
        scrapedData.ratesTaxes = Number(text.replace(/[^0-9]/g, ''));
      }
    });

    // Extract property type
    scrapedData.propertyType = $('.p24_propertyType').text().trim();
    console.log('Found property type:', scrapedData.propertyType);

    // Extract description
    scrapedData.description = $('.p24_description').text().trim();

    // Extract features
    scrapedData.features = $('.p24_features li').map((_, el) => $(el).text().trim()).get();

    // Extract images
    scrapedData.images = $('.p24_imageGallery img').map((_, el) => $(el).attr('src')).get();

    console.log('Final scraped data:', scrapedData);
    return scrapedData;
  } catch (error) {
    console.error('Error scraping property:', error);
    throw new Error('Failed to scrape property data');
  }
}