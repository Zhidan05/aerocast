import { NextResponse } from 'next/server';
import { getHistoricalSubset } from '@/lib/repositories/flight-prices';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    const sourceCity = typeof body.sourceCity === 'string' ? body.sourceCity.trim() : '';
    const destinationCity = typeof body.destinationCity === 'string' ? body.destinationCity.trim() : '';
    const flightClass = typeof body.flightClass === 'string' ? body.flightClass.trim() : '';
    const daysLeft = Number(body.daysLeft);
    const tolerance = Number(body.tolerance);

    if (!sourceCity || !destinationCity || !flightClass) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const subsetData = (await getHistoricalSubset({
      sourceCity,
      destinationCity,
      flightClass,
      daysLeft,
      tolerance
    })) as { price: number; days_left: number; airline: string; }[];

    const count = subsetData.length;
    if (count === 0) {
      return NextResponse.json({ count: 0 });
    }

    const prices = subsetData.map(r => r.price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const mean = prices.reduce((a, b) => a + b, 0) / count;
    const stdDev = Math.sqrt(prices.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / count);

    return NextResponse.json({
      count,
      summary: { min, max, mean, stdDev }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
