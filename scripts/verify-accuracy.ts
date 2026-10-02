import { evaluateAccuracy } from '../lib/accuracy/evaluation';

async function main() {
  console.log("=== Accuracy Evaluation Verification ===");
  
  // Create mock historical data
  const mockData = Array.from({ length: 548 }, (_, i) => ({
    id: i + 1,
    price: 5000 + Math.floor(Math.random() * 15000)
  }));

  const params = {
    sourceCity: 'Delhi',
    destinationCity: 'Mumbai',
    flightClass: 'Economy',
    daysLeft: 7,
    tolerance: 1,
    calibrationRatio: 0.8,
    iterations: 10000,
    splitSeed: 2026,
    monteCarloSeed: 123456
  };

  const result1 = evaluateAccuracy(params, mockData);
  const result2 = evaluateAccuracy(params, mockData);

  const diffSplitSeed = evaluateAccuracy({ ...params, splitSeed: 9999 }, mockData);
  const diffMcSeed = evaluateAccuracy({ ...params, monteCarloSeed: 9999 }, mockData);

  let passed = 0;
  let total = 0;
  function assert(condition: boolean, msg: string) {
    total++;
    if (condition) {
      console.log(`✅ PASS: ${msg}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${msg}`);
    }
  }

  assert(result1.split.calibrationCount === Math.floor(548 * 0.8), "Split 80/20 valid (Calibration count)");
  assert(result1.split.evaluationCount === 548 - Math.floor(548 * 0.8), "Split 80/20 valid (Evaluation count)");
  assert(result1.split.calibrationCount + result1.split.evaluationCount === 548, "Union = total input");

  assert(result1.metrics.mae >= 0, "MAE >= 0");
  assert(result1.metrics.mape >= 0, "MAPE >= 0");
  assert(result1.metrics.rmse >= 0, "RMSE >= 0");
  assert(Number.isFinite(result1.metrics.bias), "Bias is finite");

  assert(result1.metrics.intervalCoverage >= 0 && result1.metrics.intervalCoverage <= 100, "Coverage between 0 and 100");
  assert(result1.metrics.insideIntervalCount + result1.metrics.outsideIntervalCount === result1.split.evaluationCount, "Inside + outside = evaluation count");
  assert(result1.monteCarlo.p2_5 <= result1.monteCarlo.p97_5, "Interval low <= interval high");
  assert(result1.metrics.intervalWidth === result1.monteCarlo.p97_5 - result1.monteCarlo.p2_5, "Interval width matches P97.5 - P2.5");

  // Reproducibility
  assert(result1.monteCarlo.expectedPrice === result2.monteCarlo.expectedPrice, "Same seeds -> identical result (Expected Price)");
  assert(result1.metrics.mae === result2.metrics.mae, "Same seeds -> identical result (MAE)");
  assert(result1.split.evaluationCount === result2.split.evaluationCount, "Same seeds -> identical result (Evaluation Count)");
  
  // Seed changes
  assert(result1.monteCarlo.expectedPrice !== diffSplitSeed.monteCarlo.expectedPrice || result1.metrics.mae !== diffSplitSeed.metrics.mae, "Changed splitSeed alters evaluation");
  assert(result1.monteCarlo.expectedPrice !== diffMcSeed.monteCarlo.expectedPrice || result1.metrics.mae !== diffMcSeed.metrics.mae, "Changed monteCarloSeed alters evaluation");

  console.log(`\nVerification Score: ${passed}/${total}`);
}

main().catch(console.error);
