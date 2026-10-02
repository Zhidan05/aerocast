import type { Bucket } from './types';

export function calculateBuckets(historicalPrices: number[]): Bucket[] {
  const n = historicalPrices.length;
  if (n === 0) return [];
  
  const min = Math.min(...historicalPrices);
  const max = Math.max(...historicalPrices);
  
  if (min === max) {
    return [{
      min, max, frequency: n, probability: 1, cumulativeProbability: 1,
      intervalStart: 0, intervalEnd: 9999, historicalPrices: [...historicalPrices]
    }];
  }

  // Sturges' Rule
  let k = Math.ceil(1 + 3.322 * Math.log10(n));
  k = Math.max(5, Math.min(20, k));
  
  const uniquePrices = new Set(historicalPrices).size;
  if (uniquePrices < k) {
    k = Math.max(1, uniquePrices);
  }

  const width = Math.ceil((max - min) / k);
  
  const rawBuckets = Array.from({length: k}, (_, i) => {
    const bMin = min + i * width;
    const bMax = (i === k - 1) ? Math.max(bMin + width - 1, max) : bMin + width - 1;
    return { min: bMin, max: bMax, frequency: 0, historicalPrices: [] as number[] };
  });

  for (const p of historicalPrices) {
    const idx = rawBuckets.findIndex(b => p >= b.min && p <= b.max);
    if (idx !== -1) {
      rawBuckets[idx].frequency++;
      rawBuckets[idx].historicalPrices.push(p);
    } else {
      rawBuckets[k-1].frequency++;
      rawBuckets[k-1].historicalPrices.push(p);
    }
  }

  const activeBuckets = rawBuckets.filter(b => b.frequency > 0);
  const result: Bucket[] = [];
  
  const totalFrequency = activeBuckets.reduce((sum, b) => sum + b.frequency, 0);
  let cumulativeFrequency = 0;
  
  for (let i = 0; i < activeBuckets.length; i++) {
    const b = activeBuckets[i];
    cumulativeFrequency += b.frequency;
    
    const prob = b.frequency / totalFrequency;
    let cumProb = cumulativeFrequency / totalFrequency;
    
    // Final bucket guarantee
    if (i === activeBuckets.length - 1) {
      cumProb = 1;
    }
    
    const start = i === 0 ? 0 : result[i-1].intervalEnd + 1;
    // To ensure exact 9999 at the end without floating point gaps
    const end = i === activeBuckets.length - 1 ? 9999 : Math.max(start, Math.round(cumProb * 9999));
    
    result.push({
      ...b,
      probability: prob,
      cumulativeProbability: cumProb,
      intervalStart: start,
      intervalEnd: end
    });
  }
  return result;
}
