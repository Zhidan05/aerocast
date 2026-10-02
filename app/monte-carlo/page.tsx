import type { Metadata } from "next";
import { SimulationWorkflow } from "@/components/monte-carlo/simulation-workflow";
import { defaultParameters } from "@/lib/mock-data/dashboard";
import { validateSimulationParameters } from "@/lib/mock-data/monte-carlo";
import type { SimulationParameters } from "@/lib/types";

export const metadata: Metadata = { title: "Monte Carlo Simulation" };

export default async function MonteCarloPage({ searchParams }: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await searchParams;
  const textValue = (key: string, fallback: string) => typeof query[key] === "string" ? query[key] : fallback;
  const numberValue = (key: string, fallback: number) => typeof query[key] === "string" ? Number(query[key]) : fallback;
  const candidate: SimulationParameters = {
    source: textValue("source", defaultParameters.source),
    destination: textValue("destination", defaultParameters.destination),
    cabinClass: textValue("cabinClass", defaultParameters.cabinClass) as SimulationParameters["cabinClass"],
    daysLeft: numberValue("daysLeft", defaultParameters.daysLeft),
    daysTolerance: numberValue("daysTolerance", defaultParameters.daysTolerance),
    iterations: numberValue("iterations", defaultParameters.iterations),
  };
  const initialParameters = validateSimulationParameters(candidate) ? defaultParameters : candidate;
  return <SimulationWorkflow key={JSON.stringify(initialParameters)} initialParameters={initialParameters} />;
}
