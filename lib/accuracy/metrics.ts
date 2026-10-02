import { AccuracyObservation, AccuracyMetrics, AccuracyHistogramBin } from './types';

export function calculateMetrics(
  observations: AccuracyObservation[],
  p2_5: number,
  p97_5: number
): AccuracyMetrics {
  const n = observations.length;
  if (n === 0) {
    return {
      mae: 0, mape: 0, rmse: 0, bias: 0,
      intervalCoverage: 0, intervalWidth: p97_5 - p2_5,
      insideIntervalCount: 0, outsideIntervalCount: 0
    };
  }

  let sumAbsoluteError = 0;
  let sumPercentageError = 0;
  let sumSquaredError = 0;
  let sumError = 0; // Bias
  let insideIntervalCount = 0;

  for (const obs of observations) {
    sumAbsoluteError += obs.absoluteError;
    sumPercentageError += obs.percentageError;
    sumSquaredError += obs.error * obs.error;
    sumError += obs.error;

    if (obs.inside95Interval) {
      insideIntervalCount++;
    }
  }

  const mae = sumAbsoluteError / n;
  const mape = (100 / n) * sumPercentageError;
  const rmse = Math.sqrt(sumSquaredError / n);
  const bias = sumError / n;

  return {
    mae,
    mape,
    rmse,
    bias,
    intervalCoverage: (insideIntervalCount / n) * 100,
    intervalWidth: p97_5 - p2_5,
    insideIntervalCount,
    outsideIntervalCount: n - insideIntervalCount
  };
}

export function generateErrorHistogram(
  observations: AccuracyObservation[],
  numBins: number = 10
): AccuracyHistogramBin[] {
  if (observations.length === 0) return [];

  const errors = observations.map(o => o.error);
  const minError = Math.min(...errors);
  const maxError = Math.max(...errors);

  // If min and max are the same, just return one bin
  if (minError === maxError) {
    return [{
      range: `₹${Math.round(minError).toLocaleString('en-IN')}`,
      min: minError,
      max: maxError,
      frequency: errors.length
    }];
  }

  const binWidth = (maxError - minError) / numBins;
  const bins: AccuracyHistogramBin[] = Array.from({ length: numBins }, (_, i) => ({
    range: '',
    min: minError + i * binWidth,
    max: i === numBins - 1 ? maxError : minError + (i + 1) * binWidth,
    frequency: 0
  }));

  for (const e of errors) {
    const idx = bins.findIndex(b => e >= b.min && e <= b.max);
    if (idx !== -1) bins[idx].frequency++;
    else bins[numBins - 1].frequency++; // Safety for floating point
  }

  for (const b of bins) {
    b.range = `₹${Math.round(b.min).toLocaleString('en-IN')} to ₹${Math.round(b.max).toLocaleString('en-IN')}`;
  }

  return bins;
}
