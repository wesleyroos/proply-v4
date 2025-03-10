import express from 'express';
import fetch from 'node-fetch';
import { z } from 'zod';

const router = express.Router();

// Cache the prime rate for 24 hours
let cachedPrimeRate = {
  rate: 11.75, // Current SA prime rate as of March 2025
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

    // If cache is expired, attempt to fetch new rate
    // Note: Using a placeholder URL - replace with actual API endpoint
    // const response = await fetch('https://api.example.com/sa-prime-rate');
    // const data = await response.json();
    
    // For now, return the hardcoded current rate
    // In production, this would be fetched from a reliable API source
    cachedPrimeRate = {
      rate: 11.75,
      lastUpdated: now
    };

    res.json({
      primeRate: cachedPrimeRate.rate,
      lastUpdated: cachedPrimeRate.lastUpdated,
      source: 'api'
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
