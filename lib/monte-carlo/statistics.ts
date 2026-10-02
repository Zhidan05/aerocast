export function calculatePercentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  if (p <= 0) return sorted[0];
  if (p >= 1) return sorted[sorted.length - 1];
  const index = (sorted.length - 1) * p;
  const lower = Math.floor(index);
  const upper = lower + 1;
  const weight = index % 1;
  if (upper >= sorted.length) return sorted[lower];
  return sorted[lower] * (1 - weight) + sorted[upper] * weight;
}

export function calculateStatistics(prices: number[]) {
  const sorted = [...prices].sort((a, b) => a - b);
  const n = sorted.length;
  if (n === 0) {
    return {
      mean: 0, median: 0, min: 0, max: 0, stdDev: 0,
      percentiles: { p2_5: 0, p25: 0, p50: 0, p75: 0, p97_5: 0 }
    };
  }

  const min = sorted[0];
  const max = sorted[n - 1];
  const mean = sorted.reduce((a, b) => a + b, 0) / n;
  
  const variance = sorted.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / n;
  const stdDev = Math.sqrt(variance);

  return {
    mean, median: calculatePercentile(sorted, 0.5), min, max, stdDev,
    percentiles: {
      p2_5: calculatePercentile(sorted, 0.025),
      p25: calculatePercentile(sorted, 0.25),
      p50: calculatePercentile(sorted, 0.5),
      p75: calculatePercentile(sorted, 0.75),
      p97_5: calculatePercentile(sorted, 0.975)
    }
  };
}
