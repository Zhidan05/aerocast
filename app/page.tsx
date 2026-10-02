import { DashboardView } from "@/components/dashboard/dashboard-view";
import { getRecentSimulations } from "@/lib/repositories/simulations";
import { getDatasetSummary } from "@/lib/repositories/flight-prices";
import { getAccuracySummary } from "@/lib/repositories/accuracy-tests";

export const dynamic = 'force-dynamic';

export default async function Home() {
  const recentRuns = await getRecentSimulations(5);
  const datasetSummary = await getDatasetSummary();
  const accuracySummary = await getAccuracySummary();
  return <DashboardView recentRuns={recentRuns} datasetSummary={datasetSummary} accuracySummary={accuracySummary} />;
}
