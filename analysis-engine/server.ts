import express from "express";
import { calculateYields, type PropertyData } from "./calculations";

const app = express();
app.use(express.json());

// Enable CORS for development
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  res.header("Access-Control-Allow-Methods", "POST, OPTIONS");
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

app.post("/analyze", (req, res) => {
  try {
    console.log("\nReceived property analysis request:", JSON.stringify(req.body, null, 2));
    
    // Validate and convert all input fields
    const propertyData: PropertyData = {
      purchasePrice: Number(req.body.purchasePrice),
      shortTermNightlyRate: req.body.shortTermNightlyRate ? Number(req.body.shortTermNightlyRate) : undefined,
      annualOccupancy: req.body.annualOccupancy ? Number(req.body.annualOccupancy) : undefined,
      longTermRental: req.body.longTermRental ? Number(req.body.longTermRental) : undefined,
      leaseCycleGap: req.body.leaseCycleGap ? Number(req.body.leaseCycleGap) : undefined,
      propertyDescription: req.body.propertyDescription || null,
      deposit: Number(req.body.deposit || 0),
      interestRate: Number(req.body.interestRate || 0),
      floorArea: Number(req.body.floorArea || 0),
      ratePerSquareMeter: Number(req.body.ratePerSquareMeter || 0)
    };

    // Log the converted data for debugging
    console.log('Property data after conversion:', JSON.stringify(propertyData, null, 2));

    // Validate required fields manually before calculation
    const requiredFields = ['purchasePrice', 'deposit', 'interestRate', 'floorArea', 'ratePerSquareMeter'];
    const missingFields = requiredFields.filter(field => {
      const value = propertyData[field as keyof PropertyData];
      return value === undefined || value === null || isNaN(value as number) || (value as number) <= 0;
    });

    if (missingFields.length > 0) {
      throw new Error(`Missing or invalid required fields: ${missingFields.join(', ')}`);
    }
    
    const analysisResult = calculateYields(propertyData);
    console.log("Analysis result:", JSON.stringify(analysisResult, null, 2));

    res.json(analysisResult);
  } catch (error) {
    console.error("Analysis error:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to analyze property data";
    console.error("Detailed error:", errorMessage);
    res.status(500).json({ error: errorMessage });
  }
});

const PORT = Number(process.env.PORT) || 3001;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Analysis engine running on port ${PORT}`);
});