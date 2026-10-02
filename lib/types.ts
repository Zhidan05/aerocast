export type CabinClass = "Economy" | "Business";

export interface SimulationParameters {
  source: string;
  destination: string;
  cabinClass: CabinClass;
  daysLeft: number;
  daysTolerance: number;
  iterations: number;
  seed?: number;
}

export interface ProbabilityBand {
  label: string;
  probability: number;
  color: string;
}
