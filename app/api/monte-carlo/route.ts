import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { getHistoricalSubset } from '@/lib/repositories/flight-prices';
import { runMonteCarlo } from '@/lib/monte-carlo';
import type { MonteCarloParameters } from '@/lib/monte-carlo';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // 1. Validate Input
    const sourceCity = typeof body.sourceCity === 'string' ? body.sourceCity.trim() : '';
    const destinationCity = typeof body.destinationCity === 'string' ? body.destinationCity.trim() : '';
    const flightClass = typeof body.flightClass === 'string' ? body.flightClass.trim() : '';
    const daysLeft = Number(body.daysLeft);
    const tolerance = Number(body.tolerance);
    const iterations = Number(body.iterations);
    const seed = body.seed ? Number(body.seed) : undefined;

    if (!sourceCity || !destinationCity || !flightClass) {
      return NextResponse.json({ error: 'Missing required string parameters' }, { status: 400 });
    }
    if (sourceCity === destinationCity) {
      return NextResponse.json({ error: 'Source and destination cannot be the same' }, { status: 400 });
    }
    if (isNaN(daysLeft) || daysLeft < 1 || daysLeft > 49) {
      return NextResponse.json({ error: 'Days left must be between 1 and 49' }, { status: 400 });
    }
    if (isNaN(tolerance) || tolerance < 0 || tolerance > 10) {
      return NextResponse.json({ error: 'Tolerance must be between 0 and 10' }, { status: 400 });
    }
    if (!Number.isInteger(iterations) || iterations < 100 || iterations > 100000) {
      return NextResponse.json({ error: 'Iterations must be an integer between 100 and 100,000' }, { status: 400 });
    }

    const params: MonteCarloParameters = {
      sourceCity,
      destinationCity,
      flightClass,
      daysLeft,
      tolerance,
      iterations,
      seed
    };

    // 2. Query historical subset
    const subsetData = (await getHistoricalSubset({
      sourceCity,
      destinationCity,
      flightClass,
      daysLeft,
      daysTolerance: tolerance
    })) as { price: number; days_left: number; airline: string; }[];

    const historicalPrices = subsetData.map(row => row.price);

    if (historicalPrices.length < 30) {
      return NextResponse.json(
        { error: 'Insufficient historical data.', suggestion: 'Increase Days Tolerance.', sampleCount: historicalPrices.length },
        { status: 422 }
      );
    }

    // 3. Run Monte Carlo Engine
    const result = runMonteCarlo(params, historicalPrices);
    
    // 4. Truncate heavy arrays for browser payload
    result.randomSamples = result.randomSamples.slice(0, 50);

    // 5. Assign clientRunId for full simulations (>=1000)
    if (iterations >= 1000) {
      result.clientRunId = body.clientRunId || uuidv4();
    }

    // 6. Return
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Monte Carlo Simulation Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
