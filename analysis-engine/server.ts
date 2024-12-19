import express from "express";
import { calculateYields, type PropertyData } from "./calculations";

// Define the response type to include term
interface AnalyzerResponse {
  shortTermGrossYield: number;
  longTermGrossYield: number;
  monthlyBondRepayment: number;
  depositPercentage: number;
  propertyDescription: string | null;
  address: string;
  deposit: number;
  interestRate: number;
  term: number;
  floorArea: number;
  ratePerSquareMeter: number;
  analysis: {
    shortTermAnnualRevenue: number;
    longTermAnnualRevenue: number;
    purchasePrice: number;
  };
}

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
    console.log("\n=== Starting Property Analysis ===");
    console.log("Raw request body:", JSON.stringify(req.body, null, 2));
    
    // First validate that all required fields are present in the request
    const requiredFields = ['purchasePrice', 'deposit', 'interestRate', 'floorArea', 'ratePerSquareMeter'];
    const missingFields = requiredFields.filter(field => !(field in req.body));
    
    if (missingFields.length > 0) {
      console.error("Missing required fields in request:", missingFields);
      return res.status(400).json({ 
        error: `Missing required fields: ${missingFields.join(', ')}`,
        details: { missingFields }
      });
    }

    // Convert and validate all input fields
    console.log("Converting and validating input fields...");
    console.log("Raw term value:", req.body.term, typeof req.body.term);
    console.log("Converted term value:", Number(req.body.term) || 20);
    const propertyData: PropertyData = {
      purchasePrice: Number(req.body.purchasePrice),
      shortTermNightlyRate: req.body.shortTermNightlyRate ? Number(req.body.shortTermNightlyRate) : undefined,
      annualOccupancy: req.body.annualOccupancy ? Number(req.body.annualOccupancy) : undefined,
      longTermRental: req.body.longTermRental ? Number(req.body.longTermRental) : undefined,
      leaseCycleGap: req.body.leaseCycleGap ? Number(req.body.leaseCycleGap) : undefined,
      propertyDescription: req.body.propertyDescription || null,
      address: req.body.address,
      deposit: Number(req.body.deposit),
      interestRate: Number(req.body.interestRate),
      term: Number(req.body.term) || 20, // Default to 20 years if not specified
      floorArea: Number(req.body.floorArea),
      ratePerSquareMeter: Number(req.body.ratePerSquareMeter)

    };

    // Validate numeric fields
    console.log("Converted property data:", JSON.stringify(propertyData, null, 2));
    
    const invalidFields = Object.entries(propertyData)
      .filter(([key, value]) => {
        if (typeof value === 'number') {
          return isNaN(value) || value <= 0;
        }
        return false;
      })
      .map(([key]) => key);

    if (invalidFields.length > 0) {
      console.error("Invalid numeric fields:", invalidFields);
      return res.status(400).json({ 
        error: `Invalid values for fields: ${invalidFields.join(', ')}`,
        details: { invalidFields }
      });
    }

    console.log("All validations passed, calculating yields...");
    const analysisResult = calculateYields(propertyData);
    // Construct the response with proper typing
    const response: AnalyzerResponse = {
      ...analysisResult,
      term: propertyData.term || 20, // Use the validated term from propertyData
      deposit: propertyData.deposit,
      interestRate: propertyData.interestRate,
      floorArea: propertyData.floorArea,
      ratePerSquareMeter: propertyData.ratePerSquareMeter,
      propertyDescription: propertyData.propertyDescription,
      address: propertyData.address,
    };

    console.log("Analysis complete. Result:", JSON.stringify(response, null, 2));

    return res.json(response);
  } catch (error) {
    console.error("=== Analysis Error ===");
    console.error("Error details:", error);
    
    let errorMessage = "Failed to analyze property data";
    let errorDetails = {};
    
    if (error instanceof Error) {
      errorMessage = error.message;
      errorDetails = {
        name: error.name,
        stack: error.stack,
      };
    }
    
    console.error("Sending error response:", { error: errorMessage, details: errorDetails });
    return res.status(500).json({ error: errorMessage, details: errorDetails });
  }
});

const PORT = Number(process.env.PORT) || 3001;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Analysis engine running on port ${PORT}`);
});