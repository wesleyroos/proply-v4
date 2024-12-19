// Cost calculation utilities
export const findCostFromTable = (value: number, table: any[]) => {
  // Find the first entry where the table value is greater than or equal to the property value
  const entry = table.find(entry => entry.value >= value);
  // If no entry found, use the last entry in the table
  return entry || table[table.length - 1];
};

export const bondCostsTable = [
    { value: 500000, bondFee: 13910, disbursements: 2000, vat: 2086.50, deedsFee: 850, total: 18846.50 },
    { value: 550000, bondFee: 15795, disbursements: 2000, vat: 2369.25, deedsFee: 850, total: 21014.25 },
    { value: 600000, bondFee: 15795, disbursements: 2000, vat: 2369.25, deedsFee: 850, total: 21014.25 },
    { value: 650000, bondFee: 17680, disbursements: 2000, vat: 2652.00, deedsFee: 1196, total: 23528.00 },
    { value: 700000, bondFee: 17680, disbursements: 2000, vat: 2652.00, deedsFee: 1196, total: 23528.00 },
    { value: 750000, bondFee: 19565, disbursements: 2000, vat: 2934.75, deedsFee: 1196, total: 25695.75 },
    { value: 800000, bondFee: 19565, disbursements: 2000, vat: 2934.75, deedsFee: 1196, total: 25695.75 },
    { value: 850000, bondFee: 21450, disbursements: 2000, vat: 3217.50, deedsFee: 1374, total: 28041.50 },
    { value: 900000, bondFee: 21450, disbursements: 2000, vat: 3217.50, deedsFee: 1374, total: 28041.50 },
    { value: 1000000, bondFee: 23335, disbursements: 2000, vat: 3500.25, deedsFee: 1374, total: 30209.25 },
    { value: 3500000, bondFee: 47840, disbursements: 2000, vat: 7176.00, deedsFee: 2140, total: 59156.00 }
];

export const transferCostsTable = [
    { value: 500000, transferFee: 13910, disbursements: 3500, vat: 2086.50, deedsFee: 850, transferDuty: 0, total: 20346.50 },
    { value: 550000, transferFee: 15795, disbursements: 3500, vat: 2369.25, deedsFee: 850, transferDuty: 0, total: 22514.25 },
    { value: 600000, transferFee: 15795, disbursements: 3500, vat: 2369.25, deedsFee: 850, transferDuty: 0, total: 22514.25 },
    { value: 650000, transferFee: 17680, disbursements: 3500, vat: 2652.00, deedsFee: 1196, transferDuty: 0, total: 25028.00 },
    { value: 700000, transferFee: 17680, disbursements: 3500, vat: 2652.00, deedsFee: 1196, transferDuty: 0, total: 25028.00 },
    { value: 750000, transferFee: 19565, disbursements: 3500, vat: 2934.75, deedsFee: 1196, transferDuty: 0, total: 27195.75 },
    { value: 800000, transferFee: 19565, disbursements: 3500, vat: 2934.75, deedsFee: 1196, transferDuty: 0, total: 27195.75 },
    { value: 850000, transferFee: 21450, disbursements: 3500, vat: 3217.50, deedsFee: 1374, transferDuty: 0, total: 29541.50 },
    { value: 900000, transferFee: 21450, disbursements: 3500, vat: 3217.50, deedsFee: 1374, transferDuty: 0, total: 29541.50 },
    { value: 1000000, transferFee: 23335, disbursements: 3500, vat: 3500.25, deedsFee: 1374, transferDuty: 0, total: 31709.25 },
    { value: 3500000, transferFee: 47840, disbursements: 3500, vat: 7176.00, deedsFee: 2140, transferDuty: 182600, total: 243256.00 }
];
