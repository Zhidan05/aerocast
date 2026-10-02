"use client";

import { useId } from "react";
import type { SimulationParameters } from "@/lib/types";
export function validateSimulationParameters(params: SimulationParameters) {
  if (params.source === params.destination) return "Source and destination cannot be the same city.";
  if (!Number.isFinite(params.daysLeft) || params.daysLeft < 1 || params.daysLeft > 49) return "Days before departure must be between 1 and 49.";
  return null;
}

const simulationCities = ["Delhi", "Mumbai", "Bangalore", "Chennai", "Hyderabad", "Kolkata"];
const toleranceOptions = [0, 1, 2, 3, 5, 7];
const iterationOptions = [100, 1000, 10000, 100000];

export function SimulationFields({ value, onChange, includeTolerance = false, disabled = false, compact = false }: {
  value: SimulationParameters;
  onChange: (value: SimulationParameters) => void;
  includeTolerance?: boolean;
  disabled?: boolean;
  compact?: boolean;
}) {
  const id = useId();
  const update = <K extends keyof SimulationParameters>(key: K, next: SimulationParameters[K]) => onChange({ ...value, [key]: next });
  return (
    <div className={`grid gap-4 sm:grid-cols-2 ${compact ? "xl:grid-cols-5" : "lg:grid-cols-3"}`}>
      <label className="field" htmlFor={`${id}-source`}>
        <span className="field-label">Source City</span>
        <select id={`${id}-source`} className="select" value={value.source} onChange={(event) => update("source", event.target.value)} disabled={disabled}>
          {simulationCities.map((city) => <option key={city}>{city}</option>)}
        </select>
      </label>
      <label className="field" htmlFor={`${id}-destination`}>
        <span className="field-label">Destination City</span>
        <select id={`${id}-destination`} className="select" value={value.destination} onChange={(event) => update("destination", event.target.value)} disabled={disabled}>
          {simulationCities.map((city) => <option key={city}>{city}</option>)}
        </select>
      </label>
      <label className="field" htmlFor={`${id}-class`}>
        <span className="field-label">Cabin Class</span>
        <select id={`${id}-class`} className="select" value={value.cabinClass} onChange={(event) => update("cabinClass", event.target.value as SimulationParameters["cabinClass"])} disabled={disabled}>
          <option>Economy</option><option>Business</option>
        </select>
      </label>
      <label className="field" htmlFor={`${id}-days`}>
        <span className="field-label">Days Before Departure</span>
        <input id={`${id}-days`} className="input" type="number" min={1} max={49} step={1} required value={Number.isFinite(value.daysLeft) ? value.daysLeft : ""} onChange={(event) => update("daysLeft", event.target.value === "" ? Number.NaN : Number(event.target.value))} disabled={disabled} aria-describedby={`${id}-days-hint`} />
        <span id={`${id}-days-hint`} className="text-xs text-slate-500">Dataset range: 1–49 days</span>
      </label>
      {includeTolerance && <label className="field" htmlFor={`${id}-tolerance`}>
        <span className="field-label">Days Tolerance</span>
        <select id={`${id}-tolerance`} className="select" value={value.daysTolerance} onChange={(event) => update("daysTolerance", Number(event.target.value))} disabled={disabled}>
          {toleranceOptions.map((days) => <option key={days} value={days}>± {days} {days === 1 ? "day" : "days"}</option>)}
        </select>
      </label>}
      <label className="field" htmlFor={`${id}-iterations`}>
        <span className="field-label">Number of Simulations</span>
        <select id={`${id}-iterations`} className="select" value={value.iterations} onChange={(event) => update("iterations", Number(event.target.value))} disabled={disabled}>
          {iterationOptions.map((count) => <option key={count} value={count}>{count.toLocaleString("en-US")}</option>)}
        </select>
      </label>
    </div>
  );
}
