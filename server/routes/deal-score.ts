
import express from 'express';
import { z } from 'zod';
import { dealCalculationSchema, type DealCalculation, type DealScoreResult } from '../../shared/schema';

const router = express.Router();

router.post('/calculate-deal-score', async (req, res) => {
  try {
    // Validate the request body
    const data = dealCalculationSchema.parse(req.body);
    
    // Calculate the deal score
    const result = calculateDealScore(data);
    
    res.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid input data', details: error.errors });
    } else {
      console.error('Error calculating deal score:', error);
      res.status(500).json({ error: 'Failed to calculate deal score' });
    }
  }
});

// Helper function to calculate deal score
function calculateDealScore(data: DealCalculation): DealScoreResult {
  // This is a simplified algorithm - in a real app, you'd have more complex logic
  const { price, propertyType, bedrooms } = data;
  
  // Mock market value calculation (in reality, this would use real data)
  let estimatedValue = price;
  let modifier = 1.0;
  
  // Apply modifiers based on property type
  switch (propertyType) {
    case 'house': modifier *= 1.05; break;
    case 'apartment': modifier *= 0.95; break;
    case 'townhouse': modifier *= 1.0; break;
    case 'land': modifier *= 1.1; break;
  }
  
  // Apply modifiers based on bedrooms
  switch (bedrooms) {
    case '1': modifier *= 0.9; break;
    case '2': modifier *= 0.95; break;
    case '3': modifier *= 1.05; break;
    case '4': modifier *= 1.1; break;
    case '5+': modifier *= 1.15; break;
  }
  
  // Calculate estimated value
  estimatedValue = price * modifier;
  
  // Calculate percentage difference (positive means below market value)
  const percentageDifference = ((estimatedValue - price) / price) * 100;
  
  // Calculate score (0-100)
  let score = 50 + percentageDifference;
  if (score < 0) score = 0;
  if (score > 100) score = 100;
  
  // Determine rating and color based on score
  let rating;
  let color;
  
  if (score >= 90) {
    rating = "Excellent Deal";
    color = "bg-green-500";
  } else if (score >= 75) {
    rating = "Great Deal";
    color = "bg-green-400";
  } else if (score >= 60) {
    rating = "Good Deal";
    color = "bg-green-300";
  } else if (score >= 40) {
    rating = "Average Deal";
    color = "bg-yellow-400";
  } else if (score >= 25) {
    rating = "Below Average";
    color = "bg-orange-400";
  } else {
    rating = "Poor Deal";
    color = "bg-red-500";
  }
  
  return {
    score: Math.round(score),
    rating,
    color,
    percentageDifference,
    askingPrice: price,
    estimatedValue,
  };
}

export default router;
