import express from 'express';
import fetch from 'node-fetch';
import { z } from 'zod';

const router = express.Router();

// Cache the prime rate for 24 hours
let cachedPrimeRate = {
  rate: 11.00, // Current SA prime rate as requested
  lastUpdated: new Date()
};

const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

router.get('/', async (req, res) => {
  try {
    const now = new Date();

    // Check if cache is still valid
    if (now.getTime() - cachedPrimeRate.lastUpdated.getTime() < CACHE_DURATION) {
      return res.json({ 
        primeRate: cachedPrimeRate.rate,
        lastUpdated: cachedPrimeRate.lastUpdated,
        source: 'cache'
      });
    }

    // If cache is expired, use the default rate
    cachedPrimeRate = {
      rate: 11.00,
      lastUpdated: now
    };

    res.json({
      primeRate: cachedPrimeRate.rate,
      lastUpdated: cachedPrimeRate.lastUpdated,
      source: 'default'
    });

  } catch (error) {
    console.error('Error fetching prime rate:', error);
    // Return cached rate if we have it, otherwise return current known rate
    res.json({
      primeRate: cachedPrimeRate.rate,
      lastUpdated: cachedPrimeRate.lastUpdated,
      source: 'fallback'
    });
  }
});

export default router;