export type RouteAccuracy = {
  route: string;
  travelClass: "Economy" | "Business";
  samples: number;
  mae: number;
  mape: number;
  rmse: number;
};

export const accuracySummary = { mae: 1324, mape: 11.8, rmse: 1762, testSamples: 12450, training: 240122, testing: 60031 };

export const routeAccuracy: RouteAccuracy[] = [
  { route: "Delhi → Mumbai", travelClass: "Economy", samples: 320, mae: 1130, mape: 10.2, rmse: 1510 },
  { route: "Delhi → Bangalore", travelClass: "Economy", samples: 280, mae: 1215, mape: 11.1, rmse: 1630 },
  { route: "Mumbai → Chennai", travelClass: "Economy", samples: 215, mae: 1410, mape: 12.4, rmse: 1820 },
  { route: "Kolkata → Delhi", travelClass: "Economy", samples: 190, mae: 1290, mape: 11.5, rmse: 1690 },
  { route: "Delhi → Mumbai", travelClass: "Business", samples: 145, mae: 2840, mape: 13.6, rmse: 3410 },
  { route: "Bangalore → Hyderabad", travelClass: "Economy", samples: 210, mae: 980, mape: 9.4, rmse: 1290 },
  { route: "Hyderabad → Kolkata", travelClass: "Business", samples: 165, mae: 3040, mape: 14.1, rmse: 3680 },
  { route: "Chennai → Delhi", travelClass: "Economy", samples: 240, mae: 1180, mape: 10.8, rmse: 1570 },
  { route: "Mumbai → Bangalore", travelClass: "Economy", samples: 305, mae: 1070, mape: 9.8, rmse: 1430 },
  { route: "Kolkata → Chennai", travelClass: "Business", samples: 130, mae: 2940, mape: 13.2, rmse: 3540 },
  { route: "Delhi → Hyderabad", travelClass: "Economy", samples: 265, mae: 1240, mape: 11.2, rmse: 1610 },
  { route: "Bangalore → Mumbai", travelClass: "Business", samples: 185, mae: 2680, mape: 12.8, rmse: 3290 },
];

export const actualVsPredicted = Array.from({ length: 56 }, (_, index) => {
  const actual = 3800 + index * 650;
  const residual = Math.sin(index * 2.3) * (600 + index * 28) + Math.cos(index * 0.7) * 480;
  return { actual, predicted: Math.round(actual - residual) };
});

export const errorDistribution = [
  { error: -3500, frequency: 80 }, { error: -3000, frequency: 170 },
  { error: -2500, frequency: 341 }, { error: -2000, frequency: 591 },
  { error: -1500, frequency: 954 }, { error: -1000, frequency: 1374 },
  { error: -500, frequency: 1704 }, { error: 0, frequency: 1850 },
  { error: 500, frequency: 1727 }, { error: 1000, frequency: 1420 },
  { error: 1500, frequency: 1000 }, { error: 2000, frequency: 613 },
  { error: 2500, frequency: 364 }, { error: 3000, frequency: 182 },
  { error: 3500, frequency: 80 },
];
