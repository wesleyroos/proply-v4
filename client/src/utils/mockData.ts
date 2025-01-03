
import { faker } from '@faker-js/faker';

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
  
  // Adjust base prices by city
  const basePrice = city === 'Cape Town' 
    ? Math.random() > 0.5 ? 4500000 : 3800000  // Higher in CPT
    : Math.random() > 0.5 ? 3200000 : 2500000; // Lower in JHB
  
  const priceVariance = basePrice * 0.3;
  const purchasePrice = Math.round(basePrice + (Math.random() * priceVariance - priceVariance/2));
  
  // Generate size based on price and location
  const baseSize = city === 'Cape Town'
    ? purchasePrice / 55000  // CPT typically has smaller units
    : purchasePrice / 35000; // JHB typically has larger units
  
  const floorArea = Math.round(baseSize + (Math.random() * 20 - 10));
  
  // Generate nightly rate based on area, price and city
  const baseNightlyRate = city === 'Cape Town'
    ? (purchasePrice * 0.00085)  // Higher rates in CPT
    : (purchasePrice * 0.00065); // Lower rates in JHB
  
  const airbnbNightlyRate = Math.round(baseNightlyRate * (1 + (Math.random() * 0.4 - 0.2)));
  
  // Generate long term rental based on city averages
  const monthlyRentalYield = city === 'Cape Town' ? 0.008 : 0.007;
  const longTermRental = Math.round((purchasePrice * monthlyRentalYield) * (1 + (Math.random() * 0.2 - 0.1)));

  return {
    address: `${faker.number.int({ min: 1, max: 200 })} ${faker.location.street()}, ${suburb}, ${city}`,
    purchasePrice,
    floorArea,
    bedrooms: Math.floor(floorArea / 35) + 1,
    bathrooms: Math.floor(floorArea / 40) + 1,
    parkingSpaces: Math.floor(Math.random() * 2) + 1,
    depositType: 'percentage',
    depositPercentage: Math.random() > 0.5 ? 10 : 20,
    interestRate: 11.75 + (Math.random() * 1 - 0.5),
    loanTerm: 20,
    monthlyLevies: Math.round((purchasePrice * 0.001) + (Math.random() * 800)),
    monthlyRatesTaxes: Math.round((purchasePrice * 0.0007) + (Math.random() * 600)),
    otherMonthlyExpenses: Math.round(800 + (Math.random() * 1200)),
    maintenancePercent: Math.floor(Math.random() * 3) + 8,
    managementFee: Math.floor(Math.random() * 5) + 15,
    airbnbNightlyRate,
    occupancyRate: city === 'Cape Town' 
      ? Math.floor(Math.random() * 15) + 65  // Higher in CPT
      : Math.floor(Math.random() * 15) + 55, // Lower in JHB
    longTermRental,
    leaseCycleGap: Math.floor(Math.random() * 3) + 5,
    annualIncomeGrowth: Math.floor(Math.random() * 2) + 7,
    annualExpenseGrowth: Math.floor(Math.random() * 2) + 5,
    annualPropertyAppreciation: city === 'Cape Town' ? 8 : 6,
    cmaRatePerSqm: Math.round((purchasePrice / floorArea) * (1 + (Math.random() * 0.15 - 0.075))),
    comments: `${Math.random() > 0.5 ? 'Modern' : 'Recently renovated'} ${Math.floor(floorArea)}m² property in ${suburb}. ${Math.random() > 0.5 ? 'Close to amenities and public transport.' : 'Excellent location with great views.'}`
  };
}
