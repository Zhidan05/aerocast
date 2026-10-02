import type { Metadata } from "next";
import { Suspense } from "react";
import { LoaderCircle } from "lucide-react";
import { ExperimentHistory } from "@/components/experiments/experiment-history";
import { getExperiments } from "@/lib/repositories/simulations";

export const metadata: Metadata = { title: "Experiments" };

export default async function ExperimentsPage(props: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const searchParams = await props.searchParams;
  const page = searchParams.page ? parseInt(searchParams.page as string, 10) : 1;
  const search = searchParams.search ? (searchParams.search as string) : undefined;
  const cabinClass = searchParams.class ? (searchParams.class as string) : "All classes";
  const sort = searchParams.sort ? (searchParams.sort as string) : "newest";

  const { data, count } = await getExperiments({
    page,
    pageSize: 20,
    search,
    cabinClass: cabinClass === "All classes" ? undefined : cabinClass,
    sort
  });

  return (
    <Suspense fallback={<div className="flex items-center justify-center p-20"><LoaderCircle className="animate-spin text-blue-500" /></div>}>
      <ExperimentHistory 
        initialExperiments={data as any} 
        totalCount={count} 
        page={page} 
        search={search || ""} 
        cabinClass={cabinClass} 
        sort={sort} 
      />
    </Suspense>
  );
}
