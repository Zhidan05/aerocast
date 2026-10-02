import { v4 as uuidv4 } from 'uuid';

async function testIdempotency() {
  const payload1 = {
    sourceCity: "Mumbai",
    destinationCity: "Delhi",
    flightClass: "Economy",
    daysLeft: 7,
    tolerance: 1,
    iterations: 1000
  };

  const res1 = await fetch("http://localhost:3000/api/monte-carlo", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload1)
  });
  const data1 = await res1.json();
  console.log("Run #1 clientRunId:", data1.clientRunId);

  const payload2 = {
    sourceCity: "Hyderabad",
    destinationCity: "Delhi",
    flightClass: "Business",
    daysLeft: 10,
    tolerance: 1,
    iterations: 1000
  };

  const res2 = await fetch("http://localhost:3000/api/monte-carlo", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload2)
  });
  const data2 = await res2.json();
  console.log("Run #2 clientRunId:", data2.clientRunId);
}

testIdempotency();
