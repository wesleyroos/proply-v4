
// Deal score calculation service
export function calculateDealScore(
  priceDiff: number,
  propertyCondition: string,
  propertyRate: number,
  areaRate: number,
  rentalYield: number | null
): {
  score: number;
  rating: string;
  color: string;
} {
  // Price Factor (40%): 0-100 based on price difference
  let priceScore = 0;
  if (priceDiff <= -15) priceScore = 100;
  else if (priceDiff <= -10) priceScore = 90;
  else if (priceDiff <= -5) priceScore = 80;
  else if (priceDiff <= 0) priceScore = 70;
  else if (priceDiff <= 5) priceScore = 60;
  else if (priceDiff <= 10) priceScore = 50;
  else if (priceDiff <= 15) priceScore = 40;
  else if (priceDiff <= 20) priceScore = 30;
  else priceScore = 20;

  // Condition & Age Factor (20%): 0-100
  const conditionScore = (propertyCondition: string, propertyAge: number) => {
    // New builds (0-2 years) get premium scoring
    if (propertyAge <= 2) {
      return 110; // Premium for new builds
    }
    
    return propertyCondition === "excellent" ? 100 :
           propertyCondition === "good" ? 80 :
           propertyCondition === "fair" ? 60 :
           40; // poor
  };

  // Rate Comparison (20%): 0-100
  let rateScore = 0;
  const rateDiff = ((propertyRate - areaRate) / areaRate) * 100;

  if (rateDiff <= -15) rateScore = 100;
  else if (rateDiff <= -10) rateScore = 90;
  else if (rateDiff <= -5) rateScore = 80;
  else if (rateDiff <= 0) rateScore = 70;
  else if (rateDiff <= 5) rateScore = 60;
  else if (rateDiff <= 10) rateScore = 50;
  else if (rateDiff <= 15) rateScore = 40;
  else rateScore = 30;

  // Yield Factor (20%): 0-100
  let yieldScore = 0;
  if (rentalYield !== null) {
    if (rentalYield >= 8) yieldScore = 100;
    else if (rentalYield >= 7) yieldScore = 80;
    else if (rentalYield >= 6) yieldScore = 60;
    else if (rentalYield >= 5) yieldScore = 40;
    else yieldScore = 20;
  }

  // Calculate final score
  const finalScore = Math.round(
    (priceScore * 0.4) + 
    (conditionScore * 0.2) + 
    (rateScore * 0.2) + 
    (yieldScore * 0.2)
  );

  // Determine rating and color
  let rating: string;
  let color: string;
  if (finalScore >= 90) {
    rating = "Excellent Deal";
    color = "bg-green-500";
  } else if (finalScore >= 70) {
    rating = "Good Deal";
    color = "bg-blue-500";
  } else if (finalScore >= 50) {
    rating = "Fair Deal";
    color = "bg-yellow-500";
  } else {
    rating = "Poor Deal";
    color = "bg-red-500";
  }

  return { score: finalScore, rating, color };
}
