export function cn(...inputs: (string | undefined | null | false)[]) {
  return inputs.filter(Boolean).join(" ");
}

/**
 * Format salary for display.
 * formatSalary(65000, "EUR") → "€65,000"
 */
export function formatSalary(amount: number, currency: string): string {
  const symbols: Record<string, string> = {
    USD: "$", EUR: "€", GBP: "£", CAD: "CA$", AUD: "A$",
    SGD: "S$", SEK: "kr", DKK: "kr", NOK: "kr", CHF: "CHF",
    INR: "₹", JPY: "¥",
  };
  const symbol = symbols[currency.toUpperCase()] || currency;
  return `${symbol}${amount.toLocaleString("en-IN")}`;
}

/**
 * Format INR salary in lakhs.
 * formatINR(5600000) → "₹56L"
 * formatINR(12300000) → "₹1.23Cr"
 */
export function formatINR(amount: number): string {
  if (amount >= 10000000) {
    return `₹${(amount / 10000000).toFixed(2)}Cr`;
  }
  if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(0)}L`;
  }
  return `₹${amount.toLocaleString("en-IN")}`;
}

/**
 * Format relative time.
 * "2 days ago", "3 hours ago", "Just now"
 */
export function timeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay === 1) return "Yesterday";
  if (diffDay < 30) return `${diffDay}d ago`;
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

/**
 * Truncate text safely.
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3).replace(/\s\S*$/, "") + "...";
}

/**
 * Batch an array into chunks.
 */
export function chunk<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

/**
 * Sleep helper for rate limiting.
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
