import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const CHR_DECIMALS = 6;
export const CHR_MULTIPLIER = Math.pow(10, CHR_DECIMALS);

export function chrToSmallestUnit(chrAmount: string | number): number {
  const amount = typeof chrAmount === 'string' ? parseFloat(chrAmount) : chrAmount;
  return Math.round(amount * CHR_MULTIPLIER);
}

export function smallestUnitToChr(smallestUnitAmount: number): string {
  return (smallestUnitAmount / CHR_MULTIPLIER).toFixed(CHR_DECIMALS);
}
