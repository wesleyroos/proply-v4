
import { faker } from '@faker-js/data';

const CPT_SUBURBS = [
  'Sea Point', 'Green Point', 'Camps Bay', 'Clifton', 'Bantry Bay',
  'Fresnaye', 'Gardens', 'Tamboerskloof', 'Oranjezicht', 'Vredehoek',
  'Century City', 'Cape Town City Centre'
];

const JHB_SUBURBS = [
  'Sandton', 'Rosebank', 'Melrose', 'Hyde Park', 'Bryanston',
  'Morningside', 'Parkhurst', 'Illovo', 'Melville', 'Houghton',
  'Fourways', 'Randburg'
];

export function generateMockPropertyData() {
  const city = Math.random() > 0.5 ? 'Cape Town' : 'Johannesburg';
  const suburbs = city === 'Cape Town' ? CPT_SUBURBS : JHB_SUBURBS;
  const suburb = suburbs[Math.floor(Math.random() * suburbs.length)];
  
  // Generate base property price based on city and add random variance
  const basePrice = city === 'Cape Town' ? 3500000 : 2800000;
  const priceVariance = basePrice * 0.4; // 40% variance
  const purchasePrice = Math.round(basePrice + (Math.random() * priceVariance - priceVariance/2));
  
  // Generate size based on price
  const baseSize = purchasePrice / 45000;
  const sizeVariance = baseSize * 0.2;
  const floorArea = Math.round(baseSize + (Math.random() * sizeVariance - sizeVariance/2));
  
  // Generate nightly rate based on area and price
  const baseNightlyRate = (purchasePrice * 0.0007);
  const nightlyVariance = baseNightlyRate * 0.3;
  const airbnbNightlyRate = Math.round(baseNightlyRate + (Math.random() * nightlyVariance - nightlyVariance/2));
  
  return {
    address: `${faker.number.int({ min: 1, max: 200 })} ${faker.location.street()}, ${suburb}, ${city}`,
    purchasePrice: purchasePrice,
    floorArea: floorArea,
    bedrooms: Math.floor(floorArea / 30) + 1,
    bathrooms: Math.floor(floorArea / 40) + 1,
    parkingSpaces: Math.floor(Math.random() * 3) + 1,
    depositType: 'percentage',
    depositPercentage: Math.random() > 0.5 ? 10 : 20,
    interestRate: 11.75 + (Math.random() * 1 - 0.5),
    loanTerm: 20,
    monthlyLevies: Math.round((purchasePrice * 0.0008) + (Math.random() * 1000)),
    monthlyRatesTaxes: Math.round((purchasePrice * 0.0006) + (Math.random() * 800)),
    otherMonthlyExpenses: Math.round(1000 + (Math.random() * 1000)),
    maintenancePercent: Math.floor(Math.random() * 5) + 8,
    managementFee: Math.floor(Math.random() * 10) + 15,
    airbnbNightlyRate: airbnbNightlyRate,
    occupancyRate: Math.floor(Math.random() * 20) + 55,
    longTermRental: Math.round((purchasePrice * 0.007) + (Math.random() * 5000)),
    leaseCycleGap: Math.floor(Math.random() * 5) + 5,
    annualIncomeGrowth: Math.floor(Math.random() * 3) + 7,
    annualExpenseGrowth: Math.floor(Math.random() * 2) + 6,
    annualPropertyAppreciation: Math.floor(Math.random() * 3) + 5,
    cmaRatePerSqm: Math.round((purchasePrice / floorArea) * (1 + (Math.random() * 0.2 - 0.1))),
    comments: `${Math.random() > 0.5 ? 'Modern' : 'Recently renovated'} ${Math.floor(floorArea)}m² property in ${suburb}. ${Math.random() > 0.5 ? 'Close to amenities and public transport.' : 'Excellent location with great views.'}`
  };
}
