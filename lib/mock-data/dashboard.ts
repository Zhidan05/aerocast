import type { ProbabilityBand, SimulationParameters } from "@/lib/types";
import { initialExperiments } from "@/lib/mock-data/experiments";
import { formatNumber, formatPrice } from "@/lib/format";

export const defaultParameters: SimulationParameters = {
  source: "Delhi", destination: "Mumbai", cabinClass: "Economy",
  daysLeft: 7, daysTolerance: 1, iterations: 10000,
};

export const dashboardStats = [
  { label: "Total Records", value: "300,153", helper: "Historical observations", icon: "database" },
  { label: "Airlines", value: "6", helper: "Available airlines", icon: "plane" },
  { label: "Routes", value: "30", helper: "Source–destination pairs", icon: "route" },
  { label: "Average Price", value: "₹20,889", helper: "Across all cabin classes", icon: "price" },
] as const;

export const predictionMetrics = [
  { label: "Expected Price", value: 9850, helper: "Mean of the example distribution", tooltip: "The average simulated fare, not a guaranteed future price." },
  { label: "Median Price", value: 9620, helper: "Middle of the distribution · P50", tooltip: "Half of simulated prices fall below this value." },
  { label: "Minimum", value: 5100, helper: "Lowest example simulated fare", tooltip: "Minimum observed in the illustrative simulation." },
  { label: "Maximum", value: 18700, helper: "Highest example simulated fare", tooltip: "Maximum observed in the illustrative simulation." },
];

export const probabilityBands: ProbabilityBand[] = [
  { label: "Below ₹7,000", probability: 12.4, color: "#16a34a" },
  { label: "₹7,000 – ₹10,000", probability: 51.7, color: "#2563eb" },
  { label: "₹10,000 – ₹15,000", probability: 29.3, color: "#6366f1" },
  { label: "Above ₹15,000", probability: 6.6, color: "#d97706" },
];

// Presentation fixtures only. No fares are calculated from user parameters.
export const priceHistogram = [
  { price: 5500, frequency: 420 }, { price: 6500, frequency: 820 },
  { price: 7500, frequency: 1190 }, { price: 8500, frequency: 1780 },
  { price: 9500, frequency: 2200 }, { price: 10500, frequency: 980 },
  { price: 11500, frequency: 760 }, { price: 12500, frequency: 560 },
  { price: 13500, frequency: 370 }, { price: 14500, frequency: 260 },
  { price: 15500, frequency: 210 }, { price: 16500, frequency: 180 },
  { price: 17500, frequency: 150 }, { price: 18500, frequency: 120 },
];

export const recentRuns = initialExperiments
  .filter((experiment) => ["EXP-008", "EXP-004", "EXP-003"].includes(experiment.id))
  .map((experiment) => ({
    id: experiment.id,
    route: `${experiment.source} → ${experiment.destination}`,
    cabinClass: experiment.cabinClass,
    days: experiment.daysLeft,
    iterations: formatNumber(experiment.iterations),
    mean: formatPrice(experiment.expectedPrice),
    median: formatPrice(experiment.median),
    status: "Example",
  }));
