import type { Metadata } from "next";
import { MethodOverview } from "@/components/about/method-overview";

export const metadata: Metadata = { title: "About Method" };

export default function AboutPage() {
  return <MethodOverview />;
}
