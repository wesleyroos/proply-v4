import axios from 'axios';
import * as cheerio from 'cheerio';

interface Property24LevyData {
  monthlyLevy?: number;
  sectionalTitleLevy?: number;
  specialLevy?: number;
  ratesAndTaxes?: number;
}

export class Property24Scraper {
  private baseUrl = 'https://www.property24.com';

  async searchPropertyByAddress(address: string): Promise<string | null> {
    try {
      // Clean and format address for search
      const searchQuery = address
        .replace(/,\s*/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      const searchUrl = `${this.baseUrl}/for-sale/search?sp=${encodeURIComponent(searchQuery)}`;
      
      const response = await axios.get(searchUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        },
        timeout: 10000
      });

      const $ = cheerio.load(response.data);
      
      // Look for property links in search results
      const propertyLinks = $('.p24_listingResult a[href*="/for-sale/"]');
      
      if (propertyLinks.length > 0) {
        const firstLink = $(propertyLinks[0]).attr('href');
        return firstLink ? `${this.baseUrl}${firstLink}` : null;
      }

      return null;
    } catch (error) {
      console.error('Error searching Property24:', error.message);
      return null;
    }
  }

  async scrapeLevyData(propertyUrl: string): Promise<Property24LevyData | null> {
    try {
      const response = await axios.get(propertyUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        },
        timeout: 10000
      });

      const $ = cheerio.load(response.data);
      const levyData: Property24LevyData = {};

      // Look for levy information in various possible locations
      const infoSections = [
        '.p24_propertyDetails',
        '.p24_monthlyExpenses',
        '.p24_costBreakdown',
        '.js_expensesSection',
        '[data-test="monthly-expenses"]'
      ];

      for (const section of infoSections) {
        $(section).find('*').each((_, element) => {
          const text = $(element).text().toLowerCase();
          const value = this.extractCurrencyValue(text);

          if (value > 0) {
            if (text.includes('levy') && !text.includes('special')) {
              levyData.monthlyLevy = value;
            } else if (text.includes('sectional') && text.includes('levy')) {
              levyData.sectionalTitleLevy = value;
            } else if (text.includes('special') && text.includes('levy')) {
              levyData.specialLevy = value;
            } else if (text.includes('rates') || text.includes('municipal')) {
              levyData.ratesAndTaxes = value;
            }
          }
        });
      }

      // Alternative: Look for structured data or JSON-LD
      $('script[type="application/ld+json"]').each((_, script) => {
        try {
          const data = JSON.parse($(script).html() || '{}');
          if (data.monthlyExpenses || data.levy) {
            // Extract from structured data if available
            if (data.monthlyExpenses?.levy) {
              levyData.monthlyLevy = parseFloat(data.monthlyExpenses.levy);
            }
          }
        } catch (e) {
          // Ignore JSON parsing errors
        }
      });

      return Object.keys(levyData).length > 0 ? levyData : null;
    } catch (error) {
      console.error('Error scraping Property24 levy data:', error.message);
      return null;
    }
  }

  private extractCurrencyValue(text: string): number {
    // Extract currency values like "R 3,900", "R3900", "3900.00", etc.
    const matches = text.match(/r?\s*([0-9,\s]+(?:\.[0-9]{2})?)/i);
    if (matches && matches[1]) {
      const numberStr = matches[1].replace(/[,\s]/g, '');
      const value = parseFloat(numberStr);
      return !isNaN(value) ? value : 0;
    }
    return 0;
  }

  async fetchLevyDataByAddress(address: string): Promise<Property24LevyData | null> {
    try {
      console.log(`Searching Property24 for levy data: ${address}`);
      
      const propertyUrl = await this.searchPropertyByAddress(address);
      if (!propertyUrl) {
        console.log('Property not found on Property24');
        return null;
      }

      console.log(`Found Property24 URL: ${propertyUrl}`);
      const levyData = await this.scrapeLevyData(propertyUrl);
      
      if (levyData) {
        console.log('Successfully scraped levy data from Property24:', levyData);
      } else {
        console.log('No levy data found on Property24');
      }

      return levyData;
    } catch (error) {
      console.error('Error fetching levy data from Property24:', error.message);
      return null;
    }
  }
}