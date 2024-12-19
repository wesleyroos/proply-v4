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
    console.log("\nReceived property analysis request:", req.body);
    
    const propertyData: PropertyData = {
      purchasePrice: Number(req.body.purchasePrice),
      shortTermNightlyRate: req.body.airbnbNightlyRate ? Number(req.body.airbnbNightlyRate) : undefined,
      annualOccupancy: req.body.occupancyRate ? Number(req.body.occupancyRate) : undefined,
      longTermRental: req.body.longTermRental ? Number(req.body.longTermRental) : undefined,
      leaseCycleGap: req.body.leaseCycleGap ? Number(req.body.leaseCycleGap) : undefined,
      propertyDescription: req.body.propertyDescription || null,
      deposit: Number(req.body.deposit),
      interestRate: Number(req.body.interestRate),
      floorArea: Number(req.body.floorArea),
      ratePerSquareMeter: Number(req.body.ratePerSquareMeter)
    };
    
    console.log('Property data after conversion:', propertyData);
    
    const analysisResult = calculateYields(propertyData);
    console.log("Analysis result:", analysisResult);

    res.json(analysisResult);
  } catch (error) {
    console.error("Analysis error:", error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : "Failed to analyze property data" 
    });
  }
});

const PORT = Number(process.env.PORT) || 3001;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Analysis engine running on port ${PORT}`);
});