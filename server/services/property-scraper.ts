import fetch from 'node-fetch';
import { load } from 'cheerio';

interface ScrapedProperty {
  address?: string;
  price?: number;
}

export async function scrapePrivateProperty(url: string): Promise<ScrapedProperty> {
  try {
    console.log('Starting scraping for URL:', url);

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    // Log response details to check for blocking
    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers.raw());

    if (!response.ok) {
      throw new Error(`Failed to fetch property page: ${response.status} ${response.statusText}`);
    }

    const html = await response.text();

    // Check if we got a valid HTML response
    if (html.includes('Access Denied') || html.includes('blocked') || html.includes('captcha')) {
      throw new Error('Access blocked by Private Property. They may be using anti-scraping protection.');
    }

    console.log('HTML length:', html.length);
    console.log('First 500 chars of HTML:', html.substring(0, 500));

    const $ = load(html);
    const scrapedData: ScrapedProperty = {};

    // Extract price - log the element we're trying to find
    const priceElement = $('.p24_price');
    console.log('Price element found:', priceElement.length > 0);

    const priceText = priceElement.text().trim();
    console.log('Raw price text:', priceText);

    if (priceText) {
      scrapedData.price = Number(priceText.replace(/[^0-9]/g, ''));
      console.log('Extracted price:', scrapedData.price);
    }

    // Extract address - log the element we're trying to find
    const addressElement = $('.p24_location');
    console.log('Address element found:', addressElement.length > 0);

    const addressText = addressElement.text().trim();
    console.log('Raw address text:', addressText);

    if (addressText) {
      scrapedData.address = addressText;
      console.log('Extracted address:', scrapedData.address);
    }

    // If we didn't find either price or address, the selectors might have changed
    if (!scrapedData.price && !scrapedData.address) {
      console.log('No data found with current selectors. Website structure might have changed.');
      throw new Error('Unable to find property data. The website structure might have changed.');
    }

    console.log('Final scraped data:', scrapedData);
    return scrapedData;
  } catch (error) {
    console.error('Error scraping property:', error);
    throw error;
  }
}