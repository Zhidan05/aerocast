import { AccuracyParameters, AccuracyEvaluationResult, AccuracyObservation } from './types';
import { splitDataset } from './split';
import { calculateMetrics, generateErrorHistogram } from './metrics';
import { runMonteCarlo } from '../monte-carlo/simulation';

export function evaluateAccuracy(
  params: AccuracyParameters,
  historicalData: { id?: string | number; price: number }[]
): AccuracyEvaluationResult {
  if (historicalData.length < 50) {
    throw new Error('Insufficient historical data for evaluation. Minimum 50 records required.');
  }

  // 1. Split Data deterministically
  const { calibration, evaluation } = splitDataset(historicalData, params.calibrationRatio, params.splitSeed);

  // 2. Run Monte Carlo on Calibration Data
  const calibrationPrices = calibration.map(r => r.price);
  
  const mcParams = {
    sourceCity: params.sourceCity,
    destinationCity: params.destinationCity,
    flightClass: params.flightClass,
    daysLeft: params.daysLeft,
    tolerance: params.tolerance,
    iterations: params.iterations,
    seed: params.monteCarloSeed
  };

  const mcResult = runMonteCarlo(mcParams, calibrationPrices);

  // 3. Expected Price & Intervals
  const expectedPrice = mcResult.statistics.mean;
  const p2_5 = mcResult.statistics.percentiles.p2_5;
  const p97_5 = mcResult.statistics.percentiles.p97_5;

  // 4. Generate Observations
  const observations: AccuracyObservation[] = evaluation.map((r, i) => {
    const actual = r.price;
    const error = expectedPrice - actual; // Bias: predicted - actual
    
    // Prevent Infinity/NaN for MAPE when actual price is 0
    const percentageError = actual === 0 ? 0 : Math.abs(error) / actual;

    return {
      id: r.id ?? i,
      actualPrice: actual,
      predictedPrice: expectedPrice,
      error,
      absoluteError: Math.abs(error),
      percentageError,
      inside95Interval: actual >= p2_5 && actual <= p97_5
    };
  });

  // 5. Calculate Metrics
  const metrics = calculateMetrics(observations, p2_5, p97_5);
  const errorHistogram = generateErrorHistogram(observations);

  // 6. Return Result
  return {
    parameters: params,
    split: {
      totalCount: historicalData.length,
      calibrationCount: calibration.length,
      evaluationCount: evaluation.length
    },
    monteCarlo: {
      expectedPrice,
      median: mcResult.statistics.median,
      p2_5,
      p25: mcResult.statistics.percentiles.p25,
      p75: mcResult.statistics.percentiles.p75,
      p97_5,
      interval95: [p2_5, p97_5],
      iterations: params.iterations,
      seed: mcResult.seed
    },
    metrics,
    observations,
    errorHistogram
  };
}
