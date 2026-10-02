import { createSeededRandom } from '../monte-carlo/prng';

/**
 * Deterministically splits an array into calibration and evaluation sets.
 * Uses a Fisher-Yates shuffle with a seeded PRNG.
 */
export function splitDataset<T>(
  data: T[],
  calibrationRatio: number,
  seed: number
): { calibration: T[]; evaluation: T[] } {
  if (data.length === 0) return { calibration: [], evaluation: [] };

  const prng = createSeededRandom(seed);
  
  // Clone to avoid mutating original array
  const shuffled = [...data];
  
  // Seeded Fisher-Yates shuffle
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(prng() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  
  const splitIndex = Math.floor(shuffled.length * calibrationRatio);
  
  return {
    calibration: shuffled.slice(0, splitIndex),
    evaluation: shuffled.slice(splitIndex)
  };
}
