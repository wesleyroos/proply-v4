import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const formatter = new Intl.NumberFormat('en-ZA', {
  style: 'currency',
  currency: localStorage.getItem('selectedCurrency') || 'ZAR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export const getCurrencySymbol = () => {
  return localStorage.getItem('currencySymbol') || 'R';
};

export const formatCurrency = (value: number | undefined | null): string => {
  if (value === undefined || value === null) {
    return 'N/A';
  }
  return formatter.format(value);
};