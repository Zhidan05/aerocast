import type { Metadata } from "next";
import { DatasetExplorer } from "@/components/dataset/dataset-explorer";
import { getDatasetSummary, getFlightPrices, getUniqueFilters, getAveragePriceByDaysLeft, getAveragePriceByAirline, getClassPriceSummary } from "@/lib/repositories/flight-prices";

export const metadata: Metadata = { title: "Eksplorasi Dataset" };

export default async function DatasetPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | undefined }> }) {
  const sp = await searchParams;
  const page = parseInt(sp.page || "1", 10);
  const limit = parseInt(sp.limit || "10", 10);
  const search = sp.search || "";
  const airline = sp.airline || "all";
  const source = sp.source || "all";
  const destination = sp.destination || "all";
  const travelClass = sp.travelClass || "all";
  const daysRange = sp.days || "all";
  const priceRange = sp.price || "all";
  const sortKey = sp.sortKey || "id";
  const sortDir = ((sp.sortDir === "asc" || sp.sortDir === "desc") ? sp.sortDir : "asc") as "asc" | "desc";

  const options = { page, limit, search, airline, source, destination, travelClass, daysRange, priceRange, sortKey, sortDir };

  // Fetch all data concurrently
  const [
    summary,
    uniqueFilters,
    flights,
    avgPriceDays,
    avgPriceAirline,
    classSummary
  ] = await Promise.all([
    getDatasetSummary(),
    getUniqueFilters(),
    getFlightPrices(options),
    getAveragePriceByDaysLeft(),
    getAveragePriceByAirline(),
    getClassPriceSummary()
  ]);

  return <DatasetExplorer 
    summary={summary}
    uniqueFilters={uniqueFilters}
    flights={flights}
    chartData={{ avgPriceDays, avgPriceAirline, classSummary }}
    currentParams={options}
  />;
}
