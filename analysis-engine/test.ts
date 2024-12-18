import fetch from 'node-fetch';

async function testAnalysisEngine() {
  console.log("\n=== Property Analysis Engine Test ===");
  console.log("This test calculates the gross yield for a property investment");
  console.log("Gross Yield = (Annual Rental Income / Purchase Price) × 100");
  
  // Get test data from command line arguments or use defaults
  const purchasePrice = process.argv[2] ? parseInt(process.argv[2]) : 1000000;
  const monthlyRent = process.argv[3] ? parseInt(process.argv[3]) : 8000;
  
  if (isNaN(purchasePrice) || isNaN(monthlyRent)) {
    console.error("\n❌ Error: Please provide valid numbers for purchase price and monthly rent");
    console.log("\nUsage:");
    console.log("npx tsx analysis-engine/test.ts PURCHASE_PRICE MONTHLY_RENT");
    console.log("Example: npx tsx analysis-engine/test.ts 2000000 15000");
    process.exit(1);
  }
  
  if (process.argv.length < 4) {
    console.log("\nℹ️  Using default test values. To test your own numbers, run:");
    console.log("npx tsx analysis-engine/test.ts PURCHASE_PRICE MONTHLY_RENT");
    console.log("Example: npx tsx analysis-engine/test.ts 2000000 15000");
  }
  
  const testData = {
    purchasePrice,
    monthlyRent
  };
  
  console.log("\n📊 Property Details:");
  console.log("------------------");
  console.log("Purchase Price: R", testData.purchasePrice.toLocaleString());
  console.log("Monthly Rent: R", testData.monthlyRent.toLocaleString());
  console.log("Annual Rent: R", (testData.monthlyRent * 12).toLocaleString());
  
  try {
    console.log("\n🔄 Calculating gross yield...");
    const response = await fetch('http://localhost:3001/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testData)
    });
    
    if (!response.ok) {
      throw new Error(`Server error: ${response.status} ${response.statusText}`);
    }
    
    const result = await response.json();
    
    if (!result.grossYield) {
      throw new Error("Invalid response from server: missing gross yield calculation");
    }
    
    console.log("\n📈 Analysis Results:");
    console.log("------------------");
    console.log("Gross Yield:", result.grossYield.toFixed(2) + "%");
    console.log("Annual Rental Income: R", result.analysis.annualRent.toLocaleString());
    console.log("\nFormula Used:");
    console.log("Step 1: Calculate Annual Rent");
    console.log(`Monthly Rent × 12 = R${testData.monthlyRent.toLocaleString()} × 12 = R${(testData.monthlyRent * 12).toLocaleString()}`);
    console.log("\nStep 2: Calculate Gross Yield");
    console.log(`(Annual Rent ÷ Purchase Price) × 100`);
    console.log(`(R${result.analysis.annualRent.toLocaleString()} ÷ R${testData.purchasePrice.toLocaleString()}) × 100 = ${result.grossYield.toFixed(2)}%`);
    
    console.log("\n✅ Test completed successfully!");
  } catch (error) {
    console.error("\n❌ Test failed:", error.message);
    console.log("\nTo run this test properly:");
    console.log("1. First start the analysis engine server in a new terminal:");
    console.log("   npx tsx analysis-engine/server.ts");
    console.log("\n2. Then in another terminal, run this test script:");
    console.log("   npx tsx analysis-engine/test.ts");
    console.log("\nOr test with your own numbers:");
    console.log("   npx tsx analysis-engine/test.ts 3000000 20000");
    console.log("   (This would test a R3M property with R20K monthly rent)");
  }
}

testAnalysisEngine();
