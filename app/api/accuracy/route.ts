import { NextResponse } from 'next/server';
import { getHistoricalSubset } from '@/lib/repositories/flight-prices';
import { evaluateAccuracy } from '@/lib/accuracy/evaluation';
import { createServerClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();

    let sourceCity = body.sourceCity;
    let destinationCity = body.destinationCity;
    let flightClass = body.flightClass;
    let daysLeft = parseInt(body.daysLeft, 10);
    let tolerance = parseInt(body.tolerance, 10);
    let iterations = parseInt(body.iterations, 10) || 10000;
    let monteCarloSeed = parseInt(body.monteCarloSeed, 10) || 123456;
    
    const calibrationRatio = parseFloat(body.calibrationRatio) || 0.8;
    const splitSeed = parseInt(body.splitSeed, 10) || 2026;
    const simulationId = body.simulationId;

    if (simulationId) {
      const supabase = createServerClient();
      const { data, error } = await supabase
        .from('simulations')
        .select('*')
        .eq('id', simulationId)
        .single() as any;
        
      const simulation = data;
        
      if (error || !simulation) {
        return NextResponse.json({ error: 'Linked simulation not found.' }, { status: 404 });
      }

      sourceCity = simulation.source_city;
      destinationCity = simulation.destination_city;
      flightClass = simulation.class;
      daysLeft = simulation.days_left;
      tolerance = simulation.days_tolerance;
      iterations = simulation.iteration_count;
      monteCarloSeed = simulation.seed || 123456;
    }

    // Validate Input
    if (!sourceCity || !destinationCity || !flightClass || isNaN(daysLeft) || isNaN(tolerance)) {
      return NextResponse.json({ error: 'Missing or invalid required parameters.' }, { status: 400 });
    }
    if (sourceCity === destinationCity) {
      return NextResponse.json({ error: 'Source and destination cannot be the same.' }, { status: 400 });
    }
    if (daysLeft < 1 || daysLeft > 49) {
      return NextResponse.json({ error: 'Days left must be between 1 and 49.' }, { status: 400 });
    }
    if (tolerance < 0 || tolerance > 10) {
      return NextResponse.json({ error: 'Tolerance must be between 0 and 10.' }, { status: 400 });
    }
    if (calibrationRatio < 0.5 || calibrationRatio > 0.95) {
      return NextResponse.json({ error: 'Calibration ratio must be between 0.5 and 0.95.' }, { status: 400 });
    }
    if (iterations < 1000 || iterations > 100000) {
      return NextResponse.json({ error: 'Iterations must be between 1,000 and 100,000.' }, { status: 400 });
    }

    const t0 = performance.now();

    // 1. Fetch Real Data
    const subset = await getHistoricalSubset({
      sourceCity,
      destinationCity,
      flightClass,
      daysLeft,
      daysTolerance: tolerance
    });

    if (!subset || subset.length < 50) {
      return NextResponse.json({ 
        error: `Insufficient historical data for evaluation. Found ${subset?.length || 0} records.`,
        suggestion: 'Minimum 50 records required. Try increasing Days Tolerance.'
      }, { status: 400 });
    }

    // 2. Map data
    const historicalData = (subset as any[]).map(s => ({ id: s.id, price: s.price }));

    // 3. Evaluate
    const result = evaluateAccuracy({
      sourceCity,
      destinationCity,
      flightClass,
      daysLeft,
      tolerance,
      calibrationRatio,
      iterations,
      splitSeed,
      monteCarloSeed
    }, historicalData);

    // Don't send large array of observations to client if there are too many
    if (result.observations.length > 100) {
      result.observations = result.observations.slice(0, 100);
    }

    const t1 = performance.now();
    console.log(`[Accuracy] Route evaluated in ${(t1-t0).toFixed(2)}ms`);

    return NextResponse.json(result);

  } catch (err: any) {
    console.error('Accuracy Evaluation Error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
