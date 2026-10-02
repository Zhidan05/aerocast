import { runMonteCarlo } from '../monte-carlo/simulation';
import { calculateBenchmarkMetrics, generateBenchmarkErrorHistogram } from './metrics';
import type { BaselineResult, BenchmarkObservation } from './types';
import type { MonteCarloParameters } from '../monte-carlo/types';

interface ObservationRaw {
  id?: string | number;
  price: number;
}

function createObservations(
  evaluation: ObservationRaw[], 
  expectedPrice: number, 
  p2_5: number | null, 
  p97_5: number | null
): BenchmarkObservation[] {
  return evaluation.map((r, i) => {
    const actual = r.price;
    const error = expectedPrice - actual; // Bias = predicted - actual
    const percentageError = actual === 0 ? 0 : Math.abs(error) / actual;
    
    let inside95Interval = null;
    if (p2_5 !== null && p97_5 !== null) {
      inside95Interval = actual >= p2_5 && actual <= p97_5;
    }

    return {
      id: r.id ?? i,
      actualPrice: actual,
      predictedPrice: expectedPrice,
      error,
      absoluteError: Math.abs(error),
      percentageError,
      inside95Interval
    };
  });
}

export function evaluateMonteCarlo(
  calibration: ObservationRaw[],
  evaluation: ObservationRaw[],
  params: MonteCarloParameters
): BaselineResult {
  const calibrationPrices = calibration.map(c => c.price);
  const mcResult = runMonteCarlo(params, calibrationPrices);
  
  const expectedPrice = mcResult.statistics.mean;
  const p2_5 = mcResult.statistics.percentiles.p2_5;
  const p97_5 = mcResult.statistics.percentiles.p97_5;

  const observations = createObservations(evaluation, expectedPrice, p2_5, p97_5);
  const metrics = calculateBenchmarkMetrics(observations, p2_5, p97_5);
  const errorDistribution = generateBenchmarkErrorHistogram(observations);

  return {
    method: 'Monte Carlo',
    expectedPrice,
    metrics,
    observations,
    errorDistribution,
    p2_5,
    p97_5
  };
}

export function evaluateHistoricalMean(
  calibration: ObservationRaw[],
  evaluation: ObservationRaw[]
): BaselineResult {
  const calibrationPrices = calibration.map(c => c.price);
  
  let expectedPrice = 0;
  if (calibrationPrices.length > 0) {
    const sum = calibrationPrices.reduce((a, b) => a + b, 0);
    expectedPrice = sum / calibrationPrices.length;
  }

  const observations = createObservations(evaluation, expectedPrice, null, null);
  const metrics = calculateBenchmarkMetrics(observations, null, null);
  const errorDistribution = generateBenchmarkErrorHistogram(observations);

  return {
    method: 'Historical Mean',
    expectedPrice,
    metrics,
    observations,
    errorDistribution,
    p2_5: null,
    p97_5: null
  };
}

export function evaluateHistoricalMedian(
  calibration: ObservationRaw[],
  evaluation: ObservationRaw[]
): BaselineResult {
  const calibrationPrices = calibration.map(c => c.price);
  
  let expectedPrice = 0;
  if (calibrationPrices.length > 0) {
    calibrationPrices.sort((a, b) => a - b);
    const mid = Math.floor(calibrationPrices.length / 2);
    if (calibrationPrices.length % 2 === 0) {
      expectedPrice = (calibrationPrices[mid - 1] + calibrationPrices[mid]) / 2;
    } else {
      expectedPrice = calibrationPrices[mid];
    }
  }

  const observations = createObservations(evaluation, expectedPrice, null, null);
  const metrics = calculateBenchmarkMetrics(observations, null, null);
  const errorDistribution = generateBenchmarkErrorHistogram(observations);

  return {
    method: 'Historical Median',
    expectedPrice,
    metrics,
    observations,
    errorDistribution,
    p2_5: null,
    p97_5: null
  };
}
