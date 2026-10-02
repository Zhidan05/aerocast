export type Experiment = {
  id: string;
  source: string;
  destination: string;
  cabinClass: "Economy" | "Business";
  daysLeft: number;
  daysTolerance: number;
  iterations: number;
  expectedPrice: number;
  median: number;
  minimum: number;
  maximum: number;
  stdDev: number;
  p25: number;
  p75: number;
  lower95: number;
  upper95: number;
  historicalSamples: number;
  mae: number;
  mape: number;
  rmse: number;
  runtime: number;
  createdAt: string;
};

type ExperimentInput = Pick<Experiment, "id" | "source" | "destination" | "cabinClass" | "daysLeft" | "iterations" | "expectedPrice" | "mape" | "createdAt" | "runtime">;

// Presentation fixtures only. These are not calculated predictions or test results.
function demoExperiment(input: ExperimentInput): Experiment {
  const scale = input.expectedPrice / 9850;
  const fare = (value: number) => Math.round(value * scale);
  return {
    ...input,
    daysTolerance: 1,
    median: fare(9620),
    minimum: fare(5100),
    maximum: fare(18700),
    stdDev: fare(2114),
    p25: fare(8100),
    p75: fare(11200),
    lower95: fare(6800),
    upper95: fare(14900),
    historicalSamples: 842,
    mae: fare(1324),
    rmse: fare(1762),
  };
}

export const initialExperiments: Experiment[] = [
  demoExperiment({ id: "EXP-008", source: "Delhi", destination: "Mumbai", cabinClass: "Economy", daysLeft: 7, iterations: 10000, expectedPrice: 9850, mape: 11.8, runtime: 0.42, createdAt: "2026-10-01T02:42:00Z" }),
  demoExperiment({ id: "EXP-007", source: "Delhi", destination: "Mumbai", cabinClass: "Economy", daysLeft: 7, iterations: 100000, expectedPrice: 9863, mape: 11.7, runtime: 2.86, createdAt: "2026-10-01T02:36:00Z" }),
  demoExperiment({ id: "EXP-006", source: "Delhi", destination: "Mumbai", cabinClass: "Economy", daysLeft: 7, iterations: 1000, expectedPrice: 9987, mape: 12.2, runtime: 0.08, createdAt: "2026-10-01T02:30:00Z" }),
  demoExperiment({ id: "EXP-005", source: "Delhi", destination: "Mumbai", cabinClass: "Economy", daysLeft: 7, iterations: 100, expectedPrice: 10342, mape: 14.6, runtime: 0.02, createdAt: "2026-10-01T02:24:00Z" }),
  demoExperiment({ id: "EXP-004", source: "Delhi", destination: "Bangalore", cabinClass: "Economy", daysLeft: 14, iterations: 10000, expectedPrice: 8340, mape: 10.4, runtime: 0.39, createdAt: "2026-09-30T08:15:00Z" }),
  demoExperiment({ id: "EXP-003", source: "Mumbai", destination: "Kolkata", cabinClass: "Economy", daysLeft: 3, iterations: 10000, expectedPrice: 17210, mape: 13.6, runtime: 0.44, createdAt: "2026-09-30T07:20:00Z" }),
  demoExperiment({ id: "EXP-002", source: "Delhi", destination: "Mumbai", cabinClass: "Business", daysLeft: 7, iterations: 10000, expectedPrice: 33100, mape: 9.8, runtime: 0.48, createdAt: "2026-09-29T05:40:00Z" }),
  demoExperiment({ id: "EXP-001", source: "Chennai", destination: "Hyderabad", cabinClass: "Economy", daysLeft: 21, iterations: 1000, expectedPrice: 6480, mape: 10.7, runtime: 0.07, createdAt: "2026-09-29T03:12:00Z" }),
];

const probabilityFixtures = [
  { lower: 5000, upper: 7000, frequency: 102 },
  { lower: 7001, upper: 9000, frequency: 240 },
  { lower: 9001, upper: 11000, frequency: 215 },
  { lower: 11001, upper: 13000, frequency: 168 },
  { lower: 13001, upper: 15000, frequency: 78 },
  { lower: 15001, upper: 19000, frequency: 39 },
];

export function experimentProbability(experiment: Experiment) {
  let cumulative = 0;
  let previousEnd = -1;
  const scale = experiment.expectedPrice / 9850;
  return probabilityFixtures.map((bucket, index) => {
    cumulative += bucket.frequency;
    const intervalStart = previousEnd + 1;
    const intervalEnd = Math.round(cumulative / 842 * 10000) - 1;
    previousEnd = intervalEnd;
    return {
      lower: index === 0 ? Math.round(bucket.lower * scale) : Math.round(probabilityFixtures[index - 1].upper * scale) + 1,
      upper: Math.round(bucket.upper * scale),
      frequency: bucket.frequency,
      probability: bucket.frequency / 842,
      cumulativeProbability: cumulative / 842,
      intervalStart,
      intervalEnd,
      simulatedFrequency: Math.round(cumulative / 842 * experiment.iterations) - Math.round((cumulative - bucket.frequency) / 842 * experiment.iterations),
    };
  });
}

const exampleRandomNumbers = [1834, 7241, 402, 9012, 5338];

export function experimentRandomSamples(experiment: Experiment) {
  const buckets = experimentProbability(experiment);
  return exampleRandomNumbers.map((randomNumber, index) => {
    const bucket = buckets.find((entry) => randomNumber >= entry.intervalStart && randomNumber <= entry.intervalEnd)!;
    return { iteration: index + 1, randomNumber, ...bucket, sampledPrice: Math.round((bucket.lower + bucket.upper) / 2) };
  });
}
