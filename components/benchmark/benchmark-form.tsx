"use client";

import { useState } from 'react';
import { Card, CardHeader } from '@/components/ui/card';
import { Settings } from 'lucide-react';
import type { RunBenchmarkParameters } from '@/lib/benchmarking/benchmark';

export function BenchmarkForm({
  initialParams,
  onSubmit,
  loading
}: {
  initialParams: RunBenchmarkParameters;
  onSubmit: (params: RunBenchmarkParameters) => void;
  loading: boolean;
}) {
  const [params, setParams] = useState(initialParams);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit(params);
  }

  return (
    <Card>
      <CardHeader title="Benchmark Configuration" icon={Settings} />
      <form onSubmit={handleSubmit} className="px-5 pb-5 sm:px-6 sm:pb-6 space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <label className="block text-sm font-medium">
            Source City
            <input 
              type="text" 
              className="mt-1 block w-full rounded-md border-slate-300 shadow-sm text-sm" 
              value={params.sourceCity}
              onChange={e => setParams({...params, sourceCity: e.target.value})}
              required
            />
          </label>
          <label className="block text-sm font-medium">
            Destination City
            <input 
              type="text" 
              className="mt-1 block w-full rounded-md border-slate-300 shadow-sm text-sm" 
              value={params.destinationCity}
              onChange={e => setParams({...params, destinationCity: e.target.value})}
              required
            />
          </label>
          <label className="block text-sm font-medium">
            Class
            <select 
              className="mt-1 block w-full rounded-md border-slate-300 shadow-sm text-sm"
              value={params.flightClass}
              onChange={e => setParams({...params, flightClass: e.target.value})}
            >
              <option value="Economy">Economy</option>
              <option value="Business">Business</option>
            </select>
          </label>
          <label className="block text-sm font-medium">
            Days Left
            <input 
              type="number" 
              className="mt-1 block w-full rounded-md border-slate-300 shadow-sm text-sm" 
              value={params.daysLeft}
              onChange={e => setParams({...params, daysLeft: Number(e.target.value)})}
              min="1" max="49" required
            />
          </label>
          <label className="block text-sm font-medium">
            Tolerance (Days)
            <input 
              type="number" 
              className="mt-1 block w-full rounded-md border-slate-300 shadow-sm text-sm" 
              value={params.tolerance}
              onChange={e => setParams({...params, tolerance: Number(e.target.value)})}
              min="0" max="10" required
            />
          </label>
        </div>

        <div className="pt-4 border-t border-slate-100">
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Advanced Settings</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <label className="block text-sm font-medium">
              Calibration Ratio
              <select 
                className="mt-1 block w-full rounded-md border-slate-300 shadow-sm text-sm"
                value={params.calibrationRatio}
                onChange={e => setParams({...params, calibrationRatio: Number(e.target.value)})}
              >
                <option value="0.7">70% / 30%</option>
                <option value="0.8">80% / 20%</option>
                <option value="0.9">90% / 10%</option>
              </select>
            </label>
            <label className="block text-sm font-medium">
              Split Seed
              <input 
                type="number" 
                className="mt-1 block w-full rounded-md border-slate-300 shadow-sm text-sm font-mono" 
                value={params.splitSeed}
                onChange={e => setParams({...params, splitSeed: Number(e.target.value)})}
                required
              />
            </label>
            <label className="block text-sm font-medium">
              Monte Carlo Seed
              <input 
                type="number" 
                className="mt-1 block w-full rounded-md border-slate-300 shadow-sm text-sm font-mono" 
                value={params.monteCarloSeed}
                onChange={e => setParams({...params, monteCarloSeed: Number(e.target.value)})}
                required
              />
            </label>
            <label className="block text-sm font-medium">
              MC Iterations
              <select 
                className="mt-1 block w-full rounded-md border-slate-300 shadow-sm text-sm"
                value={params.iterations}
                onChange={e => setParams({...params, iterations: Number(e.target.value)})}
              >
                <option value="1000">1,000</option>
                <option value="10000">10,000</option>
                <option value="100000">100,000</option>
              </select>
            </label>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button 
            type="submit" 
            className="button button-primary"
            disabled={loading}
          >
            {loading ? 'Running Benchmark...' : 'Run Benchmark'}
          </button>
        </div>
      </form>
    </Card>
  );
}
