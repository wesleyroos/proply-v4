import express from 'express';
import { scrapePrivateProperty } from '../services/property-scraper';

const router = express.Router();

router.post('/scrape', async (req, res) => {
  try {
    const { url } = req.body;
    console.log('Received scraping request for URL:', url);

    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    if (!url.includes('privateproperty.co.za')) {
      return res.status(400).json({ error: 'Only Private Property URLs are supported' });
    }

    const scrapedData = await scrapePrivateProperty(url);
    console.log("Scraped property data:", scrapedData); 
    res.json(scrapedData);
  } catch (error) {
    console.error('Scraping error:', error);
    res.status(500).json({ error: 'Failed to scrape property data' });
  }
});

export default router;