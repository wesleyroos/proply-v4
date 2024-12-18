import fetch from 'node-fetch';

async function testAnalysisEngine() {
  console.log("🏠 Property Analysis Engine Test");
  console.log("===============================");
  
  // Get test data from command line arguments or use defaults
  const purchasePrice = process.argv[2] ? parseInt(process.argv[2]) : 1000000;
  const monthlyRent = process.argv[3] ? parseInt(process.argv[3]) : 8000;
  
  const testData = {
    purchasePrice,
    monthlyRent
  };
  
  console.log("\n📊 Test Data:");
  console.log("Purchase Price: R", testData.purchasePrice.toLocaleString());
  console.log("Monthly Rent: R", testData.monthlyRent.toLocaleString());
  
  try {
    console.log("\n🔄 Sending request to analysis engine...");
    const response = await fetch('http://localhost:3001/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testData)
    });
    
    const result = await response.json();
    
    console.log("\n📈 Analysis Results:");
    console.log("Gross Yield:", result.grossYield.toFixed(2) + "%");
    console.log("Annual Rent: R", result.analysis.annualRent.toLocaleString());
    
    console.log("\n✅ Test completed successfully!");
  } catch (error) {
    console.error("\n❌ Test failed:", error.message);
    console.log("\nMake sure the analysis engine server is running on port 3001");
  }
}

testAnalysisEngine();
