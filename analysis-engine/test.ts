import { calculateGrossYield } from "./calculations";

// Test case
const testData = {
  purchasePrice: 1000000,
  monthlyRent: 8000
};

const grossYield = calculateGrossYield(testData);
console.log("Test Results:");
console.log("Input:", testData);
console.log("Gross Yield:", grossYield, "%");

// Expected: (8000 * 12 / 1000000) * 100 = 9.6%
const expectedYield = 9.6;
if (grossYield === expectedYield) {
  console.log("✅ Test passed!");
} else {
  console.log("❌ Test failed! Expected:", expectedYield, "Got:", grossYield);
}
