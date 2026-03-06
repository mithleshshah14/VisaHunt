import { NextRequest, NextResponse } from "next/server";
import { setCache } from "@/lib/redis";

export const dynamic = "force-dynamic";

const CURRENCIES = ["USD", "EUR", "GBP", "CAD", "AUD", "SGD", "SEK", "DKK", "NOK", "CHF", "JPY"];

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Use exchangerate-api.com (free tier: 1500/month)
    const apiKey = process.env.EXCHANGE_RATE_API_KEY;
    if (!apiKey) {
      // No API key — cache fallback rates and succeed
      const { FALLBACK_RATES } = await import("@/lib/exchange");
      await setCache("exchange:rates:latest", FALLBACK_RATES, 86400);
      return NextResponse.json({ success: true, rates: FALLBACK_RATES, source: "fallback" });
    }

    const res = await fetch(
      `https://v6.exchangerate-api.com/v6/${apiKey}/latest/INR`
    );

    if (!res.ok) {
      return NextResponse.json({ error: "Exchange API failed" }, { status: 502 });
    }

    const data = await res.json();
    const inrRates: Record<string, number> = {};

    // Convert: we need 1 CURRENCY = X INR, but API gives 1 INR = X CURRENCY
    for (const currency of CURRENCIES) {
      const rate = data.conversion_rates?.[currency];
      if (rate && rate > 0) {
        inrRates[currency] = Math.round((1 / rate) * 100) / 100;
      }
    }

    // Cache for 24h
    await setCache("exchange:rates:latest", inrRates, 86400);

    return NextResponse.json({ success: true, rates: inrRates });
  } catch (err) {
    console.error("[Exchange] Error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
