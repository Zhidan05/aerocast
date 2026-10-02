import Link from "next/link";
import { ArrowDown, ArrowRight, BarChart3, BookOpen, Database, Dices, FlaskConical, Info, Layers, ListOrdered, Percent, Play, Target, TrendingUp } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader } from "@/components/ui/card";

const methodSteps = [
  { title: "Historical Data", description: "Select past fares that match the route, cabin class, and days before departure. A tolerance widens the matching day range.", detail: "Delhi → Mumbai · Economy · 7 ± 1 days", icon: Database },
  { title: "Frequency Distribution", description: "Group the matched ticket prices into intervals and count the observations in each price range.", detail: "₹5,000–₹7,000: 102 of 842 observations", icon: BarChart3 },
  { title: "Probability", description: "Divide each interval’s frequency by the total number of matched observations.", detail: "102 ÷ 842 ≈ 0.1211, or 12.11%", icon: Percent },
  { title: "Cumulative Probability", description: "Add probabilities in order. The final cumulative probability is 1, covering every possible bucket.", detail: "0.1211 → 0.4062 → … → 1.0000", icon: TrendingUp },
  { title: "Random Number Interval", description: "Map the cumulative probabilities to non-overlapping integer intervals from 0000 to 9999.", detail: "First interval: 0000–1210", icon: ListOrdered },
  { title: "Random Sampling", description: "Draw a pseudo-random number, find its probability interval, and select a representative price from the matched bucket.", detail: "1834 → ₹7,001–₹9,000 → sampled price", icon: Dices },
  { title: "Monte Carlo Simulation", description: "Repeat the sampling process many times. More iterations usually reduce random variation in the estimated mean.", detail: "100 → 1,000 → 10,000 → 100,000 iterations", icon: FlaskConical },
  { title: "Prediction Distribution", description: "Summarize the simulated prices using the mean, median, percentiles, and probability ranges.", detail: "A distribution of possible outcomes", icon: Layers },
];

const formulas = [
  { label: "Probability", abbreviation: "P(x)", formula: "P(x) = f(x) / Σf", description: "The relative frequency of a price bucket. Here, f(x) is its observation count and Σf is the total count.", example: "Example: 102 / 842 ≈ 12.11%", tone: "blue" },
  { label: "Mean Absolute Error", abbreviation: "MAE", formula: "MAE = (1/n) Σ |Aᵢ − Pᵢ|", description: "The average absolute difference between actual and predicted fares. Measured in ₹; lower is better.", example: "MAE of ₹1,324 means an average error of ₹1,324.", tone: "indigo" },
  { label: "Mean Absolute Percentage Error", abbreviation: "MAPE", formula: "MAPE = (100/n) Σ |(Aᵢ − Pᵢ) / Aᵢ|", description: "The average absolute error relative to the actual fare, expressed as a percentage. Lower is better.", example: "MAPE of 11.8% means an average relative error of 11.8%.", tone: "blue" },
  { label: "Root Mean Squared Error", abbreviation: "RMSE", formula: "RMSE = √[(1/n) Σ (Aᵢ − Pᵢ)²]", description: "Squares the prediction errors before averaging, so larger misses have more influence. Measured in ₹.", example: "Compare RMSE with MAE to understand larger errors.", tone: "indigo" },
];

export function MethodOverview() {
  return <div className="page-stack">
    <PageHeader eyebrow="UNDERSTAND THE MODEL" title="Monte Carlo Simulation Method" description="From historical observations to a distribution of possible fares — one transparent step at a time." actions={<Link href="/monte-carlo" className="button button-primary"><Play size={16} />Explore the Workflow</Link>} />

    <section className="relative overflow-hidden rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-6 sm:p-8">
      <div className="grid items-center gap-8 xl:grid-cols-[1.35fr_1fr]">
        <div><Badge tone="blue"><BookOpen size={12} />THE METHOD, EXPLAINED</Badge><h2 className="mt-4 max-w-xl text-2xl font-semibold leading-snug tracking-tight text-slate-900">Model uncertainty.<br />Understand the possibilities.</h2><p className="mt-4 max-w-xl text-sm leading-7 text-slate-600">Monte Carlo simulation uses repeated random sampling to explore possible outcomes. AeroCast uses historical flight fare frequencies to illustrate how likely different price ranges may be for a selected route.</p></div>
        <div className="rounded-xl border border-white bg-white/80 p-5 shadow-sm">
          <div className="flex items-center justify-between gap-2 text-center"><div className="flex flex-1 flex-col items-center gap-3"><span className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600"><Database size={23} /></span><span className="text-xs font-semibold text-slate-600">Historical fares</span></div><ArrowRight size={16} className="mb-6 shrink-0 text-slate-300" /><div className="flex flex-1 flex-col items-center gap-3"><span className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600"><Dices size={24} /></span><span className="text-xs font-semibold text-slate-600">Random sampling</span></div><ArrowRight size={16} className="mb-6 shrink-0 text-slate-300" /><div className="flex flex-1 flex-col items-center gap-3"><span className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white"><BarChart3 size={24} /></span><span className="text-xs font-semibold text-slate-600">Price distribution</span></div></div>
          <p className="mt-6 border-t border-slate-100 pt-4 text-center text-xs leading-relaxed text-slate-500">One set of inputs. Thousands of possible outcomes.</p>
        </div>
      </div>
    </section>

    <div className="grid items-start gap-6 xl:grid-cols-[1.08fr_1fr]">
      <Card>
        <CardHeader title="How this application works" description="Follow the data through all eight stages." icon={Layers} />
        <ol className="px-5 pb-6 sm:px-6">{methodSteps.map((step, index) => <li key={step.title} className="relative flex gap-4 pb-6 last:pb-0">
          {index < methodSteps.length - 1 && <span aria-hidden="true" className="absolute top-11 bottom-1 left-5 flex w-px justify-center bg-slate-200"><ArrowDown size={12} className="absolute bottom-0 shrink-0 bg-white text-slate-300" /></span>}
          <span className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${index === 7 ? "bg-blue-600 text-white shadow-sm shadow-blue-200" : "bg-blue-50 text-blue-600"}`}><step.icon size={19} /></span>
          <div className="min-w-0 pt-0.5"><h3 className="text-sm font-semibold text-slate-800"><span className="mr-2 font-mono text-[11px] text-slate-400">{String(index + 1).padStart(2, "0")}</span>{step.title}</h3><p className="mt-1.5 text-xs leading-5 text-slate-500">{step.description}</p><p className="mt-2 inline-block rounded-md bg-slate-50 px-2 py-1 font-mono text-[10px] leading-4 text-slate-600">{step.detail}</p></div>
        </li>)}</ol>
      </Card>

      <div className="space-y-4">
        <div className="flex items-center gap-3 px-1 py-2"><span className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600"><Target size={19} /></span><div><h2 className="text-base font-semibold text-slate-900">The mathematics behind it</h2><p className="mt-1 text-xs text-slate-500">Probability and evaluation, made readable.</p></div></div>
        {formulas.map((formula) => <Card key={formula.abbreviation} className="p-5 sm:p-6"><div className="mb-4 flex items-center justify-between gap-3"><h3 className="text-sm font-semibold text-slate-800">{formula.label}</h3><span className={`rounded-md px-2 py-1 font-mono text-[11px] font-semibold ${formula.tone === "blue" ? "bg-blue-50 text-blue-700" : "bg-indigo-50 text-indigo-700"}`}>{formula.abbreviation}</span></div><div className="overflow-x-auto rounded-lg border border-slate-100 bg-slate-50 px-4 py-4 text-center font-mono text-sm whitespace-nowrap text-slate-800" tabIndex={0} aria-label={formula.formula}>{formula.formula}</div><p className="mt-3 text-xs leading-5 text-slate-500">{formula.description}</p><p className="mt-3 border-t border-slate-100 pt-3 text-xs leading-5 text-blue-700">{formula.example}</p></Card>)}
        <p className="px-1 text-xs leading-5 text-slate-500"><span className="font-semibold text-slate-700">Notation:</span> Aᵢ = actual fare, Pᵢ = predicted fare, n = number of evaluated samples. The sum runs from i = 1 to n. MAPE requires nonzero actual fares; any exclusions should be reported.</p>
      </div>
    </div>

    <div className="grid gap-5 lg:grid-cols-3">
      <Card className="p-6"><Database size={21} className="mb-4 text-blue-600" /><h3 className="text-sm font-semibold">Start with relevant data</h3><p className="mt-2 text-xs leading-6 text-slate-500">The selected historical subset shapes every probability. Small samples or a wide day tolerance can change how representative the result is.</p><Link href="/dataset" className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800">Explore the dataset<ArrowRight size={13} /></Link></Card>
      <Card className="p-6"><TrendingUp size={21} className="mb-4 text-indigo-600" /><h3 className="text-sm font-semibold">Read the full distribution</h3><p className="mt-2 text-xs leading-6 text-slate-500">The mean is one summary. Percentiles and the 95% simulation interval describe variability across simulated outcomes; they are not a guaranteed future fare.</p><Link href="/experiments" className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800">Compare experiments<ArrowRight size={13} /></Link></Card>
      <Card className="p-6"><Target size={21} className="mb-4 text-blue-600" /><h3 className="text-sm font-semibold">Evaluate on reserved data</h3><p className="mt-2 text-xs leading-6 text-slate-500">MAE, MAPE, and RMSE compare predictions with held-out observations. More simulations can improve stability without necessarily improving predictive accuracy.</p><Link href="/accuracy" className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800">Understand evaluation<ArrowRight size={13} /></Link></Card>
    </div>

    <div className="flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50/70 px-5 py-4"><Info size={18} className="mt-0.5 shrink-0 text-blue-600" /><p className="text-xs leading-6 text-slate-600"><span className="font-semibold text-slate-800">Live Prediction Model.</span> The entire application workflow is fully connected to the real dataset, processing historical data on-demand through the deterministic Monte Carlo simulation engine.</p></div>
  </div>;
}
