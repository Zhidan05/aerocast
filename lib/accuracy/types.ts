export interface AccuracyParameters {
  sourceCity: string;
  destinationCity: string;
  flightClass: string;
  daysLeft: number;
  tolerance: number;
  calibrationRatio: number;
  iterations: number;
  splitSeed: number;
  monteCarloSeed: number;
}

export interface AccuracyObservation {
  id: string | number;
  actualPrice: number;
  predictedPrice: number;
  error: number;
  absoluteError: number;
  percentageError: number;
  inside95Interval: boolean;
}

export interface AccuracyMetrics {
  mae: number;
  mape: number;
  rmse: number;
  bias: number;
  intervalCoverage: number;
  intervalWidth: number;
  insideIntervalCount: number;
  outsideIntervalCount: number;
}

export interface AccuracyHistogramBin {
  range: string;
  min: number;
  max: number;
  frequency: number;
}

export interface AccuracyEvaluationResult {
  parameters: AccuracyParameters;
  split: {
    totalCount: number;
    calibrationCount: number;
    evaluationCount: number;
  };
  monteCarlo: {
    expectedPrice: number;
    median: number;
    p2_5: number;
    p25: number;
    p75: number;
    p97_5: number;
    interval95: [number, number];
    iterations: number;
    seed: number;
  };
  metrics: AccuracyMetrics;
  observations: AccuracyObservation[];
  errorHistogram: AccuracyHistogramBin[];
}
