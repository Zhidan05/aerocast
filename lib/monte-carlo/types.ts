export interface MonteCarloParameters {
  sourceCity: string;
  destinationCity: string;
  flightClass: string;
  daysLeft: number;
  tolerance: number;
  iterations: number;
  seed?: number;
}

export interface Bucket {
  min: number;
  max: number;
  frequency: number;
  probability: number;
  cumulativeProbability: number;
  intervalStart: number;
  intervalEnd: number;
  historicalPrices: number[];
  simulatedFrequency?: number;
}

export interface RandomSample {
  iteration: number;
  randomNumber: number; // 0-9999
  bucketMin: number;
  bucketMax: number;
  sampledPrice: number;
}

export interface Percentiles {
  p2_5: number;
  p25: number;
  p50: number; // median
  p75: number;
  p97_5: number;
}

export interface Statistics {
  mean: number;
  median: number;
  min: number;
  max: number;
  stdDev: number;
  percentiles: Percentiles;
}

export interface ProbabilityInsights {
  belowP25: { label: string; percentage: number };
  p25ToP50: { label: string; percentage: number };
  p50ToP75: { label: string; percentage: number };
  aboveP75: { label: string; percentage: number };
}

export interface HistogramBin {
  range: string;
  min: number;
  max: number;
  frequency: number;
}

export interface MonteCarloResult {
  parameters: MonteCarloParameters;
  historicalSampleCount: number;
  historicalSummary: { min: number; max: number; mean: number; stdDev: number };
  bucketCount: number;
  buckets: Bucket[];
  seed: number;
  iterations: number;
  randomSamples: RandomSample[];
  statistics: Statistics;
  probabilityInsights: ProbabilityInsights;
  histogram: HistogramBin[];
  clientRunId?: string;
}
