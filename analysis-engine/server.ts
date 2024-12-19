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
    
    // Convert and validate the incoming data
    const propertyData: PropertyData = {
      purchasePrice: Number(req.body.purchasePrice),
      shortTermNightlyRate: req.body.airbnbNightlyRate ? Number(req.body.airbnbNightlyRate) : undefined,
      annualOccupancy: req.body.occupancyRate ? Number(req.body.occupancyRate) : undefined,
      longTermRental: req.body.longTermRental ? Number(req.body.longTermRental) : undefined,
      leaseCycleGap: req.body.leaseCycleGap ? Number(req.body.leaseCycleGap) : undefined,
      propertyDescription: req.body.propertyDescription || null,
      deposit: req.body.deposit ? Number(req.body.deposit) : undefined,
      interestRate: req.body.interestRate ? Number(req.body.interestRate) : undefined,
      floorArea: req.body.floorArea ? Number(req.body.floorArea) : undefined,
      ratePerSquareMeter: req.body.cmaRatePerSqm ? Number(req.body.cmaRatePerSqm) : undefined
    };
    
    console.log('Property data after conversion:', propertyData);
    
    // Validate required fields
    if (!propertyData.purchasePrice) {
      console.error("Validation error: Missing required fields");
      return res.status(400).json({
        error: "Missing required field: purchasePrice is required"
      });
    }

    if (isNaN(propertyData.purchasePrice) || propertyData.purchasePrice <= 0) {
      console.error("Validation error: Invalid purchase price");
      return res.status(400).json({
        error: "Purchase price must be a positive number"
      });
    }

    // Calculate yields and get analysis results
    console.log("Calculating yields for property:", {
      purchasePrice: `R${propertyData.purchasePrice.toLocaleString()}`,
      shortTermRate: propertyData.shortTermNightlyRate ? `R${propertyData.shortTermNightlyRate.toLocaleString()}` : 'N/A',
      longTermRental: propertyData.longTermRental ? `R${propertyData.longTermRental.toLocaleString()}` : 'N/A'
    });
    
    const analysisResult = calculateYields(propertyData);
    console.log("Analysis result:", analysisResult);

    res.json(analysisResult);
  } catch (error) {
    console.error("Analysis error:", error);
    res.status(500).json({ error: "Failed to analyze property data" });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Analysis engine running on port ${PORT}`);
});
