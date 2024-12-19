import express from "express";
import { calculateGrossYield, type PropertyData } from "./calculations";

const app = express();
app.use(express.json());

// Enable CORS for our main application
app.use((req, res, next) => {
  // Allow requests from any origin in development
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  res.header("Access-Control-Allow-Methods", "POST, OPTIONS");
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

// Property analysis endpoint
app.post("/analyze", (req, res) => {
  try {
    console.log("\nReceived property analysis request:", req.body);
    
    const propertyData: PropertyData = req.body;
    
    // Validate required fields
    if (!propertyData.purchasePrice || !propertyData.monthlyRent) {
      console.error("Validation error: Missing required fields");
      return res.status(400).json({
        error: "Missing required fields: purchasePrice and monthlyRent are required"
      });
    }

    if (isNaN(propertyData.purchasePrice) || isNaN(propertyData.monthlyRent)) {
      console.error("Validation error: Invalid number format");
      return res.status(400).json({
        error: "Purchase price and monthly rent must be valid numbers"
      });
    }

    if (propertyData.purchasePrice <= 0 || propertyData.monthlyRent <= 0) {
      console.error("Validation error: Values must be positive");
      return res.status(400).json({
        error: "Purchase price and monthly rent must be positive numbers"
      });
    }

    // Calculate gross yield
    console.log("Calculating gross yield for:", {
      purchasePrice: `R${propertyData.purchasePrice.toLocaleString()}`,
      monthlyRent: `R${propertyData.monthlyRent.toLocaleString()}`
    });
    
    const grossYield = calculateGrossYield(propertyData);
    console.log("Calculation result: Gross Yield =", grossYield.toFixed(2) + "%");

    const response = {
      grossYield,
      analysis: {
        purchasePrice: propertyData.purchasePrice,
        monthlyRent: propertyData.monthlyRent,
        annualRent: propertyData.monthlyRent * 12
      }
    };

    console.log("Sending response:", response);
    res.json(response);
  } catch (error) {
    console.error("Analysis error:", error);
    res.status(500).json({ error: "Failed to analyze property data" });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Analysis engine running on port ${PORT}`);
});
