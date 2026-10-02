export type BaselineMethod = 'Monte Carlo' | 'Historical Mean' | 'Historical Median';

export interface BenchmarkMetrics {
  mae: number;
  mape: number;
  rmse: number;
  bias: number;
  intervalCoverage: number | null; // null if method has no interval
  intervalWidth: number | null;    // null if method has no interval
}

export interface BaselineResult {
  method: BaselineMethod;
  expectedPrice: number;
  metrics: BenchmarkMetrics;
  observations: BenchmarkObservation[];
  errorDistribution: { range: string; min: number; max: number; frequency: number }[];
  p2_5: number | null;
  p97_5: number | null;
}

export interface BenchmarkObservation {
  id: string | number;
  actualPrice: number;
  predictedPrice: number;
  error: number;           // predicted - actual
  absoluteError: number;   // |predicted - actual|
  percentageError: number; // |predicted - actual| / actual
  inside95Interval: boolean | null; // null if method has no interval
}

export interface BenchmarkResult {
  scenario: {
    sourceCity: string;
    destinationCity: string;
    flightClass: string;
    daysLeft: number;
    daysTolerance: number;
    calibrationRatio: number;
    splitSeed: number;
    monteCarloSeed: number;
    iterations: number;
  };
  dataSplit: {
    totalCount: number;
    calibrationCount: number;
    evaluationCount: number;
  };
  baselines: BaselineResult[];
}
