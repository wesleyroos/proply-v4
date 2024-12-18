import express from "express";
import { calculateGrossYield, type PropertyData } from "./calculations";

const app = express();
app.use(express.json());

// Enable CORS for our main application
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "http://localhost:5000");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  res.header("Access-Control-Allow-Methods", "POST, OPTIONS");
  next();
});

// Property analysis endpoint
app.post("/analyze", (req, res) => {
  try {
    const propertyData: PropertyData = req.body;
    
    // Validate required fields
    if (!propertyData.purchasePrice || !propertyData.monthlyRent) {
      return res.status(400).json({
        error: "Missing required fields: purchasePrice and monthlyRent are required"
      });
    }

    // Calculate gross yield
    const grossYield = calculateGrossYield(propertyData);

    res.json({
      grossYield,
      analysis: {
        purchasePrice: propertyData.purchasePrice,
        monthlyRent: propertyData.monthlyRent,
        annualRent: propertyData.monthlyRent * 12
      }
    });
  } catch (error) {
    console.error("Analysis error:", error);
    res.status(500).json({ error: "Failed to analyze property data" });
  }
});

const PORT = 3001;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Analysis engine running on port ${PORT}`);
});
