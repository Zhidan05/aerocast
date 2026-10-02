import { createSeededRandom } from './prng';
import { calculateBuckets } from './distribution';
import { calculateStatistics } from './statistics';
import type { MonteCarloParameters, MonteCarloResult, RandomSample, HistogramBin, Bucket } from './types';

export function runMonteCarlo(
  params: MonteCarloParameters,
  historicalPrices: number[]
): MonteCarloResult {
  if (historicalPrices.length < 30) {
    throw new Error('Insufficient historical data. Minimum 30 records required.');
  }

  const buckets = calculateBuckets(historicalPrices);
  const histStats = calculateStatistics(historicalPrices);
  
  const seed = params.seed ?? Math.floor(Math.random() * 1000000);
  const prng = createSeededRandom(seed);
  
  const simulatedPrices: number[] = new Array(params.iterations);
  const randomSamples: RandomSample[] = [];
  const simulationCounts: number[] = new Array(buckets.length).fill(0);

  for (let i = 0; i < params.iterations; i++) {
    const r = Math.floor(prng() * 10000); // 0-9999
    
    // find bucket
    let selectedBucketIdx = -1;
    let selectedBucket: Bucket | null = null;
    for (let j = 0; j < buckets.length; j++) {
      const b = buckets[j];
      if (r >= b.intervalStart && r <= b.intervalEnd) {
        selectedBucket = b;
        selectedBucketIdx = j;
        break;
      }
    }
    // safety fallback
    if (!selectedBucket || selectedBucketIdx === -1) {
      selectedBucketIdx = buckets.length - 1;
      selectedBucket = buckets[selectedBucketIdx];
    }

    simulationCounts[selectedBucketIdx]++;

    // sample from historical prices within bucket
    const hPrices = selectedBucket.historicalPrices;
    const priceIdx = Math.floor(prng() * hPrices.length);
    const sampledPrice = hPrices[priceIdx];

    simulatedPrices[i] = sampledPrice;

    if (i < 50) {
      randomSamples.push({
        iteration: i + 1,
        randomNumber: r,
        bucketMin: selectedBucket.min,
        bucketMax: selectedBucket.max,
        sampledPrice
      });
    }
  }

  const finalBuckets = buckets.map((b, i) => ({
    ...b,
    simulatedFrequency: simulationCounts[i]
  }));

  const simStats = calculateStatistics(simulatedPrices);
  
  // Histogram (10 bins for UI charting)
  const histBins = Math.max(5, Math.min(20, Math.ceil(1 + 3.322 * Math.log10(params.iterations))));
  const histWidth = Math.ceil((simStats.max - simStats.min) / histBins);
  const rawHistBuckets = Array.from({length: histBins}, (_, i) => ({
    min: simStats.min + i * histWidth,
    max: i === histBins - 1 ? simStats.max : simStats.min + (i + 1) * histWidth - 1,
    frequency: 0
  }));
  
  for (const p of simulatedPrices) {
    const idx = rawHistBuckets.findIndex(b => p >= b.min && p <= b.max);
    if (idx !== -1) rawHistBuckets[idx].frequency++;
    else rawHistBuckets[histBins - 1].frequency++;
  }

  const histogram: HistogramBin[] = rawHistBuckets.map(b => ({
    range: `₹${b.min.toLocaleString('en-IN')}–₹${b.max.toLocaleString('en-IN')}`,
    min: b.min,
    max: b.max,
    frequency: b.frequency
  }));

  // Probability Insights
  let countBelowP25 = 0, countP25P50 = 0, countP50P75 = 0, countAboveP75 = 0;
  for (const p of simulatedPrices) {
    if (p < simStats.percentiles.p25) countBelowP25++;
    else if (p < simStats.percentiles.p50) countP25P50++;
    else if (p < simStats.percentiles.p75) countP50P75++;
    else countAboveP75++;
  }

  const insights = {
    belowP25: { label: `Below ₹${Math.round(simStats.percentiles.p25).toLocaleString('en-IN')}`, percentage: countBelowP25 / params.iterations },
    p25ToP50: { label: `₹${Math.round(simStats.percentiles.p25).toLocaleString('en-IN')}–₹${Math.round(simStats.percentiles.p50).toLocaleString('en-IN')}`, percentage: countP25P50 / params.iterations },
    p50ToP75: { label: `₹${Math.round(simStats.percentiles.p50).toLocaleString('en-IN')}–₹${Math.round(simStats.percentiles.p75).toLocaleString('en-IN')}`, percentage: countP50P75 / params.iterations },
    aboveP75: { label: `Above ₹${Math.round(simStats.percentiles.p75).toLocaleString('en-IN')}`, percentage: countAboveP75 / params.iterations }
  };

  return {
    parameters: params,
    historicalSampleCount: historicalPrices.length,
    historicalSummary: { min: histStats.min, max: histStats.max, mean: histStats.mean, stdDev: histStats.stdDev },
    bucketCount: buckets.length,
    buckets: finalBuckets,
    seed,
    iterations: params.iterations,
    randomSamples,
    statistics: simStats,
    probabilityInsights: insights,
    histogram
  };
}
