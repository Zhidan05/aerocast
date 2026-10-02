import { NextResponse } from 'next/server';

let cachedRate: number | null = null;
let lastUpdated: string | null = null;
let isFetching = false;

// We use the free Open Exchange Rates API or Exchangerate API which doesn't need a key
// Using https://open.er-api.com/v6/latest/INR
export async function GET() {
  try {
    // Cache validation: fetch new if older than 1 hour or null
    const oneHour = 60 * 60 * 1000;
    const now = new Date();
    
    if (!cachedRate || !lastUpdated || (now.getTime() - new Date(lastUpdated).getTime() > oneHour)) {
      if (!isFetching) {
        isFetching = true;
        try {
          const res = await fetch('https://open.er-api.com/v6/latest/INR', { 
            next: { revalidate: 3600 } 
          });
          const data = await res.json();
          if (data && data.rates && data.rates.IDR) {
            cachedRate = data.rates.IDR;
            lastUpdated = new Date().toISOString();
          }
        } catch (fetchError) {
          console.error("Failed to fetch exchange rate:", fetchError);
          // If we fail but have a stale cache, we'll just keep using the stale cache
        } finally {
          isFetching = false;
        }
      }
    }

    return NextResponse.json({
      rate: cachedRate,
      lastUpdated,
      source: 'open.er-api.com'
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to handle currency request' }, { status: 500 });
  }
}
