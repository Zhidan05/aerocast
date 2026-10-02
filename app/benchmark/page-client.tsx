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
    daysTolerance: 1,
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
        eyebrow="EVALUASI MODEL" 
        title="Benchmarking Baseline" 
        description="Bandingkan engine distribusi Monte Carlo dengan baseline historis naif untuk mengevaluasi akurasi prediksi." 
      />
      
      <BenchmarkForm 
        initialParams={initialParams} 
        onSubmit={handleRun} 
        loading={loading} 
      />
      
      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
          <strong>Kesalahan:</strong> {error}
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center p-12 text-slate-400">
          <div className="animate-pulse flex flex-col items-center gap-2">
            <Scale size={32} className="animate-bounce" />
            <p>Menjalankan baseline pada data historis...</p>
          </div>
        </div>
      )}

      {result && <BenchmarkResults result={result} />}
    </>
  );
}
