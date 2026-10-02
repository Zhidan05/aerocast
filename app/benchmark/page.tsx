import type { Metadata } from 'next';
import { BenchmarkPageClient } from './page-client';

export const metadata: Metadata = {
  title: 'Model Benchmarking | AeroCast',
  description: 'Evaluate and compare AeroCast prediction models against naive baselines.',
};

export default function BenchmarkPage() {
  return (
    <div className="page-stack">
      <BenchmarkPageClient />
    </div>
  );
}
