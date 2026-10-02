"use client";

import { useState } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { BenchmarkForm } from '@/components/benchmark/benchmark-form';
import { BenchmarkResults } from '@/components/benchmark/benchmark-results';
import type { RunBenchmarkParameters, BenchmarkResult } from '@/lib/benchmarking/benchmark';
import { Scale } from 'lucide-react';

export function BenchmarkPageClient() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<BenchmarkResult | null>(null);

  const initialParams: RunBenchmarkParameters = {
    sourceCity: 'Delhi',
    destinationCity: 'Hyderabad',
    flightClass: 'Business',
    daysLeft: 10,
    tolerance: 1,
    calibrationRatio: 0.8,
    splitSeed: 2026,
    monteCarloSeed: 123456,
    iterations: 10000
  };

  async function handleRun(params: RunBenchmarkParameters) {
    setLoading(true);
    setError(null);
    setResult(null);
    
    try {
      const res = await fetch('/api/benchmark', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to run benchmark');
      }
      
      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <PageHeader 
        eyebrow="MODEL EVALUATION" 
        title="Baseline Benchmarking" 
        description="Compare the Monte Carlo distribution engine against naive historical baselines to evaluate prediction accuracy." 
      />
      
      <BenchmarkForm 
        initialParams={initialParams} 
        onSubmit={handleRun} 
        loading={loading} 
      />
      
      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
          <strong>Error:</strong> {error}
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center p-12 text-slate-400">
          <div className="animate-pulse flex flex-col items-center gap-2">
            <Scale size={32} className="animate-bounce" />
            <p>Running baselines on historical data...</p>
          </div>
        </div>
      )}

      {result && <BenchmarkResults result={result} />}
    </>
  );
}
