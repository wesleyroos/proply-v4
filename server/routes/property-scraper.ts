import express from 'express';
import { scrapeProperty24 } from '../services/property-scraper';

const router = express.Router();

router.post('/scrape', async (req, res) => {
  try {
    const { url } = req.body;
    console.log('Received scraping request for URL:', url);

    if (!url) {
      return res.status(400).json({ 
        error: 'URL is required',
        details: 'Please provide a valid Property24 URL'
      });
    }

    if (!url.includes('property24.com')) {
      return res.status(400).json({ 
        error: 'Invalid URL',
        details: 'Only Property24 URLs are supported'
      });
    }

    const scrapedData = await scrapeProperty24(url);
    console.log("Scraped property data:", scrapedData);

    // Check if we got any meaningful data
    if (!scrapedData.price && !scrapedData.address) {
      return res.status(404).json({
        error: 'No data found',
        details: 'Could not find property data on the page. Please verify the URL is correct.'
      });
    }

    res.json(scrapedData);
  } catch (error) {
    console.error('Scraping error:', error);

    // Provide more specific error messages
    if (error.message.includes('anti-scraping protection')) {
      res.status(403).json({
        error: 'Access Blocked',
        details: 'The website is blocking automated access. This is a common anti-scraping measure.'
      });
    } else if (error.message.includes('website structure might have changed')) {
      res.status(500).json({
        error: 'Scraping Failed',
        details: 'The website structure has changed. Please try again later.'
      });
    } else {
      res.status(500).json({
        error: 'Scraping Failed',
        details: error.message || 'Failed to scrape property data'
      });
    }
  }
});

export default router;