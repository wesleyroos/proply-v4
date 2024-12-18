export interface PropertyData {
  purchasePrice: number;
  monthlyRent: number;
}

export function calculateGrossYield(data: PropertyData): number {
  const annualRent = data.monthlyRent * 12;
  const grossYield = (annualRent / data.purchasePrice) * 100;
  return Number(grossYield.toFixed(2));
}
