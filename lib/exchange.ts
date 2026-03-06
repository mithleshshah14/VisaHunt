import { getCached, setCache } from "@/lib/redis";

export const FALLBACK_RATES: Record<string, number> = {
  USD: 83.5,
  EUR: 91.0,
  GBP: 106.0,
  CAD: 61.5,
  AUD: 54.0,
  SGD: 62.5,
  SEK: 8.1,
  DKK: 12.2,
  NOK: 8.0,
  CHF: 95.0,
  JPY: 0.56,
};

/**
 * Get exchange rates to INR. Cached 24h in Redis.
 */
export async function getExchangeRates(): Promise<Record<string, number>> {
  const cached = await getCached<Record<string, number>>("exchange:rates:latest");
  if (cached) return cached;
  return FALLBACK_RATES;
}

/**
 * Convert a salary to INR.
 */
export async function convertToINR(
  amount: number,
  currency: string
): Promise<number> {
  if (currency === "INR") return amount;
  const rates = await getExchangeRates();
  const rate = rates[currency.toUpperCase()];
  if (!rate) return 0;
  return Math.round(amount * rate);
}
