import type { Metadata } from 'next';
import { BenchmarkPageClient } from './page-client';

export const metadata: Metadata = {
  title: 'Benchmarking Model | AeroCast',
  description: 'Evaluasi dan bandingkan model prediksi AeroCast dengan baseline naif.',
};

export default function BenchmarkPage() {
  return (
    <div className="page-stack">
      <BenchmarkPageClient />
    </div>
  );
}
