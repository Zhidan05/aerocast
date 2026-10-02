export type FlightRecord = {
  id: string;
  airline: string;
  flight: string;
  source: string;
  destination: string;
  travelClass: "Economy" | "Business";
  departure: string;
  arrival: string;
  stops: string;
  duration: number;
  daysLeft: number;
  price: number;
};

export const flightCities = ["Delhi", "Mumbai", "Bangalore", "Kolkata", "Hyderabad", "Chennai"];
export const flightAirlines = ["Vistara", "Air India", "IndiGo", "SpiceJet", "AirAsia", "GO FIRST"];
const airlineCodes = ["UK", "AI", "6E", "SG", "I5", "G8"];

// A small deterministic preview, independent of the reference corpus summary.
export const flights: FlightRecord[] = Array.from({ length: 48 }, (_, index) => {
  const carrier = index % flightAirlines.length;
  const sourceIndex = (index + Math.floor(index / 6)) % flightCities.length;
  const destinationIndex = (sourceIndex + 1 + (Math.floor(index / 6) % 5)) % flightCities.length;
  const travelClass = carrier < 2 && Math.floor(index / 6) % 4 !== 3 ? "Business" : "Economy";
  const departureHour = 5 + ((index * 3) % 17);
  const departureMinutes = index % 2 === 0 ? 15 : 40;
  const hasStop = index % 7 === 0;
  const duration = 95 + ((index * 17) % 130) + (hasStop ? 125 : 0);
  const totalArrivalMinutes = departureHour * 60 + departureMinutes + duration;
  const arrivalMinutes = totalArrivalMinutes % 1440;
  const daysLeft = 1 + ((index * 11) % 49);
  return {
    id: `flight-${index + 1}`,
    airline: flightAirlines[carrier],
    flight: `${airlineCodes[carrier]}-${814 + index * 13}`,
    source: flightCities[sourceIndex],
    destination: flightCities[destinationIndex],
    travelClass,
    departure: `${String(departureHour).padStart(2, "0")}:${departureMinutes}`,
    arrival: `${String(Math.floor(arrivalMinutes / 60)).padStart(2, "0")}:${String(arrivalMinutes % 60).padStart(2, "0")}${totalArrivalMinutes >= 1440 ? " (+1)" : ""}`,
    stops: hasStop ? "1 stop" : "Non-stop",
    duration,
    daysLeft,
    price: travelClass === "Business" ? 38600 + ((index * 2137) % 30000) : 3250 + ((index * 571) % 6500) + (daysLeft < 7 ? 4300 : 0),
  };
});

export const priceByDays = [
  { days: 49, price: 6240 }, { days: 45, price: 6500 }, { days: 40, price: 6810 },
  { days: 35, price: 7220 }, { days: 30, price: 7680 }, { days: 25, price: 8130 },
  { days: 20, price: 8900 }, { days: 15, price: 10240 }, { days: 10, price: 12630 },
  { days: 7, price: 14200 }, { days: 3, price: 17720 }, { days: 1, price: 19800 },
];

export const priceByAirline = [
  { airline: "Vistara", price: 30396 }, { airline: "Air India", price: 23507 },
  { airline: "IndiGo", price: 5324 }, { airline: "SpiceJet", price: 6179 },
  { airline: "AirAsia", price: 4091 }, { airline: "GO FIRST", price: 5652 },
];

export const classComparison = [
  { name: "Economy", price: 6572, records: 206666, share: "68.9%", color: "#818cf8" },
  { name: "Business", price: 52540, records: 93487, share: "31.1%", color: "#2563eb" },
];
