import type { SimulationParameters } from "@/lib/types";

export const simulationCities = ["Delhi", "Mumbai", "Bangalore", "Kolkata", "Hyderabad", "Chennai"];
export const iterationOptions = [100, 1_000, 10_000, 100_000];
export const toleranceOptions = [0, 1, 3, 5];

export function validateSimulationParameters(value: SimulationParameters): string | null {
  if (!simulationCities.includes(value.source) || !simulationCities.includes(value.destination)) return "Select an available source and destination city.";
  if (value.source === value.destination) return "Source and destination must be different cities.";
  if (value.cabinClass !== "Economy" && value.cabinClass !== "Business") return "Select Economy or Business class.";
  if (!Number.isInteger(value.daysLeft) || value.daysLeft < 1 || value.daysLeft > 49) return "Days before departure must be a whole number between 1 and 49.";
  if (!iterationOptions.includes(value.iterations)) return "Select a simulation count of 100, 1,000, 10,000, or 100,000.";
  if (!toleranceOptions.includes(value.daysTolerance)) return "Select a days tolerance of ±0, ±1, ±3, or ±5.";
  return null;
}

export const historicalSummary = {
  records: 842,
  mean: 9_927,
  minimum: 5_420,
  maximum: 18_930,
  standardDeviation: 2_114,
};

const priceBuckets = [
  { lower: 5_000, upper: 7_000, frequency: 102, label: "₹5,000 – ₹7,000", shortLabel: "₹5–7k" },
  { lower: 7_001, upper: 9_000, frequency: 240, label: "₹7,001 – ₹9,000", shortLabel: "₹7–9k" },
  { lower: 9_001, upper: 11_000, frequency: 288, label: "₹9,001 – ₹11,000", shortLabel: "₹9–11k" },
  { lower: 11_001, upper: 14_000, frequency: 148, label: "₹11,001 – ₹14,000", shortLabel: "₹11–14k" },
  { lower: 14_001, upper: 20_000, frequency: 64, label: "₹14,001 – ₹20,000", shortLabel: "₹14–20k" },
];

export const probabilityDistribution = priceBuckets.map((bucket, index) => {
  const previousCount = priceBuckets.slice(0, index).reduce((sum, row) => sum + row.frequency, 0);
  const cumulative = (previousCount + bucket.frequency) / historicalSummary.records;
  const intervalStart = Math.round((previousCount / historicalSummary.records) * 10_000);
  const intervalEnd = Math.round(cumulative * 10_000) - 1;
  return {
    ...bucket,
    probability: bucket.frequency / historicalSummary.records,
    cumulative,
    intervalStart,
    intervalEnd,
    interval: `${String(intervalStart).padStart(4, "0")} – ${String(intervalEnd).padStart(4, "0")}`,
  };
});

export type RandomSample = {
  iteration: number;
  random: number;
  interval: string;
  priceRange: string;
  sampledPrice: number;
};

function mapSample(random: number, index: number, pricePosition: number): RandomSample {
  const bucket = probabilityDistribution.find((row) => random >= row.intervalStart && random <= row.intervalEnd)!;
  return {
    iteration: index + 1,
    random,
    interval: bucket.interval,
    priceRange: bucket.label,
    sampledPrice: Math.round(bucket.lower + pricePosition * (bucket.upper - bucket.lower)),
  };
}

export const initialRandomSamples = [1834, 7241, 8912, 412, 5530, 9644, 3102, 6755, 8046, 1120].map(
  (random, index) => mapSample(random, index, [0.425, 0.2, 0.383, 0.6, 0.475, 0.39, 0.55, 0.22, 0.73, 0.85][index]),
);

/** Generates ten illustrative mappings only; it does not run the prediction model. */
export function generateRandomSamples(): RandomSample[] {
  return Array.from({ length: 10 }, (_, index) => mapSample(Math.floor(Math.random() * 10_000), index, Math.random()));
}

export const resultMetrics = [
  { label: "Expected Price", value: "₹9,850", helper: "Mean of example simulations", tooltip: "The arithmetic average of all simulated ticket prices." },
  { label: "Median", value: "₹9,620", helper: "50th percentile", tooltip: "Half of simulated prices fall below the median." },
  { label: "P25", value: "₹8,100", helper: "25th percentile", tooltip: "25% of simulated prices fall below this value." },
  { label: "P75", value: "₹11,200", helper: "75th percentile", tooltip: "75% of simulated prices fall below this value." },
  { label: "Minimum", value: "₹5,100", helper: "Lowest example outcome", tooltip: "The lowest value in the illustrative simulation sample." },
  { label: "Maximum", value: "₹18,700", helper: "Highest example outcome", tooltip: "The highest value in the illustrative simulation sample." },
  { label: "Standard Deviation", value: "₹2,087", helper: "Spread of simulated prices", tooltip: "A measure of how far simulated prices typically fall from the mean." },
  { label: "95% Simulation Interval", value: "₹6,800 – ₹14,900", helper: "2.5th–97.5th percentiles", tooltip: "The middle 95% of simulated prices, not a guarantee or confidence interval for the mean." },
];

export const probabilityInsights = [
  { label: "Price below ₹8,000", probability: 18.2, note: "Lower fare opportunity" },
  { label: "Price below ₹10,000", probability: 57.4, note: "Most likely budget range" },
  { label: "Price above ₹15,000", probability: 5.8, note: "Upper-tail price risk" },
];

export const iterationComparison = [
  { iterations: 100, mean: 10_124, median: 9_850, standardDeviation: 2_302, runtime: "3 ms" },
  { iterations: 1_000, mean: 9_902, median: 9_674, standardDeviation: 2_145, runtime: "18 ms" },
  { iterations: 10_000, mean: 9_850, median: 9_620, standardDeviation: 2_087, runtime: "142 ms" },
  { iterations: 100_000, mean: 9_858, median: 9_628, standardDeviation: 2_092, runtime: "1.21 s" },
];

export const convergenceData = [
  { iterations: 100, mean: 10_124 },
  { iterations: 300, mean: 9_765 },
  { iterations: 500, mean: 9_967 },
  { iterations: 1_000, mean: 9_902 },
  { iterations: 3_000, mean: 9_871 },
  { iterations: 10_000, mean: 9_850 },
  { iterations: 30_000, mean: 9_863 },
  { iterations: 100_000, mean: 9_858 },
];
