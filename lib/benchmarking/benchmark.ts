import { splitDataset } from '../accuracy/split';
import { evaluateMonteCarlo, evaluateHistoricalMean, evaluateHistoricalMedian } from './baselines';
export type { BenchmarkResult } from './types';
import type { BenchmarkResult } from './types';

export interface RunBenchmarkParameters {
  sourceCity: string;
  destinationCity: string;
  flightClass: string;
  daysLeft: number;
  daysTolerance: number;
  calibrationRatio: number;
  splitSeed: number;
  monteCarloSeed: number;
  iterations: number;
}

export function runBenchmark(
  params: RunBenchmarkParameters,
  historicalData: { id?: string | number; price: number }[]
): BenchmarkResult {
  if (historicalData.length < 50) {
    throw new Error('Insufficient historical data for benchmarking. Minimum 50 records required.');
  }

  // 1. Split Data deterministically
  const { calibration, evaluation } = splitDataset(historicalData, params.calibrationRatio, params.splitSeed);

  // 2. Run Baselines
  const monteCarloBaseline = evaluateMonteCarlo(calibration, evaluation, {
    sourceCity: params.sourceCity,
    destinationCity: params.destinationCity,
    flightClass: params.flightClass,
    daysLeft: params.daysLeft,
    tolerance: params.daysTolerance,
    iterations: params.iterations,
    seed: params.monteCarloSeed
  });

  const historicalMeanBaseline = evaluateHistoricalMean(calibration, evaluation);
  const historicalMedianBaseline = evaluateHistoricalMedian(calibration, evaluation);

  // 3. Return results
  return {
    scenario: params,
    dataSplit: {
      totalCount: historicalData.length,
      calibrationCount: calibration.length,
      evaluationCount: evaluation.length
    },
    baselines: [
      monteCarloBaseline,
      historicalMeanBaseline,
      historicalMedianBaseline
    ]
  };
}
