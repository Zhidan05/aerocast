import { NextResponse } from 'next/server';
import { getHistoricalSubset } from '@/lib/repositories/flight-prices';
import { runBenchmark } from '@/lib/benchmarking';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const sourceCity = typeof body.sourceCity === 'string' ? body.sourceCity.trim() : '';
    const destinationCity = typeof body.destinationCity === 'string' ? body.destinationCity.trim() : '';
    const flightClass = typeof body.flightClass === 'string' ? body.flightClass.trim() : '';
    const daysLeft = Number(body.daysLeft);
    const daysTolerance = Number(body.daysTolerance || body.tolerance);
    const calibrationRatio = Number(body.calibrationRatio);
    const splitSeed = Number(body.splitSeed);
    const monteCarloSeed = Number(body.monteCarloSeed);
    const iterations = Number(body.iterations);

    if (!sourceCity || !destinationCity || !flightClass) {
      return NextResponse.json({ error: 'Missing required string parameters' }, { status: 400 });
    }
    if (isNaN(daysLeft) || daysLeft < 1 || daysLeft > 49) {
      return NextResponse.json({ error: 'Days left must be between 1 and 49' }, { status: 400 });
    }
    if (isNaN(daysTolerance) || daysTolerance < 0 || daysTolerance > 10) {
      return NextResponse.json({ error: 'Tolerance must be between 0 and 10' }, { status: 400 });
    }
    if (isNaN(calibrationRatio) || calibrationRatio < 0.1 || calibrationRatio > 0.9) {
      return NextResponse.json({ error: 'Calibration ratio must be between 0.1 and 0.9' }, { status: 400 });
    }
    if (isNaN(splitSeed) || isNaN(monteCarloSeed)) {
      return NextResponse.json({ error: 'Invalid seeds provided' }, { status: 400 });
    }
    if (!Number.isInteger(iterations) || iterations < 100 || iterations > 100000) {
      return NextResponse.json({ error: 'Iterations must be an integer between 100 and 100,000' }, { status: 400 });
    }

    const subsetData = (await getHistoricalSubset({
      sourceCity,
      destinationCity,
      flightClass,
      daysLeft,
      daysTolerance
    })) as { id: string; price: number; days_left: number; airline: string; }[];

    if (subsetData.length < 50) {
      return NextResponse.json(
        { error: 'Insufficient historical data for benchmarking.', sampleCount: subsetData.length },
        { status: 422 }
      );
    }

    const result = runBenchmark({
      sourceCity,
      destinationCity,
      flightClass,
      daysLeft,
      daysTolerance,
      calibrationRatio,
      splitSeed,
      monteCarloSeed,
      iterations
    }, subsetData);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Benchmark Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
