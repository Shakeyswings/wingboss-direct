import type { PriceValue } from '../types/app';

export const PRICE_REQUIRED = 'PRICE_REQUIRED_FROM_MENU';

export function isVerifiedPrice(value: PriceValue | undefined | null): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

export function formatPrice(value: PriceValue | undefined | null): string {
  if (isVerifiedPrice(value)) return `$${value.toFixed(2)}`;
  return 'Staff will confirm';
}

export function sumVerified(values: Array<PriceValue | undefined | null>): { total: number; verified: boolean } {
  let total = 0;
  let verified = true;
  for (const value of values) {
    if (isVerifiedPrice(value)) total += value;
    else verified = false;
  }
  return { total, verified };
}
