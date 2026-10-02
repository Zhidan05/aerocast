import type { Metadata } from "next";
import { AccuracyEvaluation } from "@/components/accuracy/accuracy-evaluation";

export const metadata: Metadata = { title: "Akurasi Prediksi" };

export default async function AccuracyPage(props: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const searchParams = await props.searchParams;
  const simulationId = typeof searchParams.simulationId === 'string' ? searchParams.simulationId : undefined;
  return <AccuracyEvaluation simulationId={simulationId} />;
}
