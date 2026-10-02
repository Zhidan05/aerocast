"use client";

import { FlightPricesQueryOptions } from "@/lib/repositories/flight-prices";
import { useCallback, useEffect, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { ArrowDown, ArrowUpDown, ArrowUp, Building2, CheckCheck, ChevronLeft, ChevronRight, Database, Download, Plane, Search, ShieldCheck, SlidersHorizontal, Users } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardHeader } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import { DatasetCharts, type ChartData } from "./dataset-charts";
import { downloadFile } from "@/lib/format";
import { PriceDisplay } from "@/components/ui/price-display";

import type { FlightPrice } from "@/lib/database/types";

interface DatasetExplorerProps {
  summary: Record<string, number>;
  uniqueFilters: Record<string, string[]>;
  flights: { data: FlightPrice[]; count: number };
  chartData: ChartData;
  currentParams: FlightPricesQueryOptions;
}

export function DatasetExplorer({ summary, uniqueFilters, flights, chartData, currentParams }: DatasetExplorerProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [localSearch, setLocalSearch] = useState(currentParams.search || "");
  const [notice, setNotice] = useState("");

  const pageLimit = currentParams.limit || 20;
  const pageNum = currentParams.page || 1;
  const totalPages = Math.max(1, Math.ceil(flights.count / pageLimit));
  
  const activeFilterCount = (['airline', 'source', 'destination', 'travelClass', 'daysRange', 'priceRange'] as (keyof FlightPricesQueryOptions)[]).filter(
    k => currentParams[k] && currentParams[k] !== "all"
  ).length + (currentParams.search ? 1 : 0);

  const updateUrl = useCallback((updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value === null || value === "all" || value === "") {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    }
    if (!('page' in updates)) {
      params.set('page', '1');
    }
    router.push(`${pathname}?${params.toString()}`);
  }, [searchParams, pathname, router]);

  useEffect(() => {
    const handler = setTimeout(() => {
      if (localSearch !== currentParams.search && !(localSearch === "" && !currentParams.search)) {
        updateUrl({ search: localSearch, page: "1" });
      }
    }, 300);
    return () => clearTimeout(handler);
  }, [localSearch, currentParams.search, updateUrl]);

  function changeSort(key: string) {
    const isAsc = currentParams.sortKey === key && currentParams.sortDir === "asc";
    updateUrl({ sortKey: key, sortDir: isAsc ? "desc" : "asc", page: "1" });
  }

  function exportRows() {
    const columns = ["airline", "flight", "source_city", "destination_city", "class", "departure_time", "arrival_time", "stops", "duration", "days_left", "price"];
    const csv = ["Maskapai,Penerbangan,Kota Asal,Kota Tujuan,Kelas,Keberangkatan,Kedatangan,Transit,Durasi (jam),Hari Tersisa,Harga (INR)", 
      ...flights.data.map((row) => columns.map((key) => `"${String(row[key as keyof FlightPrice] || '').replaceAll('"', '""')}"`).join(","))
    ].join("\r\n");
    downloadFile("aerocast-flight-preview.csv", `\uFEFF${csv}`, "text/csv;charset=utf-8;");
    setNotice(`Mengekspor ${flights.data.length} data halaman ini.`);
  }

  function sortHeading(label: string, field: string) {
    const isCurrent = currentParams.sortKey === field;
    const Icon = isCurrent ? (currentParams.sortDir === "asc" ? ArrowUp : ArrowDown) : ArrowUpDown;
    return <button className="inline-flex items-center gap-1.5 whitespace-nowrap hover:text-blue-700" onClick={() => changeSort(field)}>{label}<Icon size={13} aria-hidden="true" /></button>;
  }

  return (
    <div className="page-stack [&_.card-header]:p-0">
      <PageHeader eyebrow="DATA DI BALIK PREDIKSI" title="Penjelajah Dataset" description="Periksa harga historis, temukan pola harga, dan jelajahi data di balik setiap simulasi." actions={<button className="button button-primary" onClick={exportRows} disabled={flights.data.length === 0}><Download size={16} /> Ekspor halaman ini</button>} />
      
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        <StatCard label="Total rekam data" value={summary.total_records?.toLocaleString("id-ID") || "0"} helper="Korpus referensi" icon={Database} />
        <StatCard label="Maskapai" value={summary.airlines?.toLocaleString("id-ID") || "0"} helper="Maskapai domestik" icon={Plane} tone="indigo" />
        <StatCard label="Kota" value={summary.cities?.toLocaleString("id-ID") || "0"} helper={`${summary.routes || 0} rute aktif`} icon={Building2} />
        <StatCard label="Nilai hilang" value="0" helper="Data referensi bersih" icon={CheckCheck} tone="green" />
        <StatCard label="Data ekonomi" value={summary.total_economy?.toLocaleString("id-ID") || "0"} helper="Opsi penerbangan" icon={Users} tone="indigo" />
        <StatCard label="Data bisnis" value={summary.total_business?.toLocaleString("id-ID") || "0"} helper="Opsi penerbangan" icon={Users} />
      </div>

      <DatasetCharts data={chartData} />

      <Card className="overflow-hidden">
        <div className="p-5 sm:p-6">
          <CardHeader title="Jelajahi data penerbangan" description={`Menampilkan data aktual dari public.flight_prices.`} icon={SlidersHorizontal} action={<Badge tone="blue">Data aktual</Badge>} />
          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative min-w-0 flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} aria-hidden="true" /><input aria-label="Cari data penerbangan" className="input w-full pl-10" value={localSearch} placeholder="Cari maskapai, kode penerbangan, atau kota…" onChange={(event) => setLocalSearch(event.target.value)} /></div>
            <button className="button button-ghost shrink-0" onClick={() => { setLocalSearch(""); router.push(pathname); }} disabled={!localSearch && activeFilterCount === 0}>Atur ulang saringan{activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}</button>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
            <label className="field"><span className="field-label">Maskapai</span><select className="select" value={currentParams.airline} onChange={(event) => updateUrl({ airline: event.target.value })}><option value="all">Semua maskapai</option>{uniqueFilters.airlines?.map((v) => <option key={v}>{v}</option>)}</select></label>
            <label className="field"><span className="field-label">Kota Asal</span><select className="select" value={currentParams.source} onChange={(event) => updateUrl({ source: event.target.value })}><option value="all">Semua kota asal</option>{uniqueFilters.source_cities?.map((v) => <option key={v}>{v}</option>)}</select></label>
            <label className="field"><span className="field-label">Kota Tujuan</span><select className="select" value={currentParams.destination} onChange={(event) => updateUrl({ destination: event.target.value })}><option value="all">Semua kota tujuan</option>{uniqueFilters.destination_cities?.map((v) => <option key={v}>{v}</option>)}</select></label>
            <label className="field"><span className="field-label">Kelas</span><select className="select" value={currentParams.travelClass} onChange={(event) => updateUrl({ travelClass: event.target.value })}><option value="all">Semua kelas</option>{uniqueFilters.classes?.map((v) => <option key={v}>{v}</option>)}</select></label>
            <label className="field"><span className="field-label">Hari tersisa</span><select className="select" value={currentParams.daysRange} onChange={(event) => updateUrl({ days: event.target.value })}><option value="all">1–49 hari</option><option value="7">1–7 hari</option><option value="14">8–14 hari</option><option value="49">15–49 hari</option></select></label>
            <label className="field"><span className="field-label">Rentang harga</span><select className="select" value={currentParams.priceRange} onChange={(event) => updateUrl({ price: event.target.value })}><option value="all">Semua harga</option><option value="10000">Di bawah ₹10.000</option><option value="30000">₹10.000–29.999</option><option value="above">₹30.000 ke atas</option></select></label>
          </div>
        </div>
        <DataTable label="Data rekam penerbangan">
          <thead><tr>
            <th aria-sort={currentParams.sortKey === "airline" ? currentParams.sortDir === "asc" ? "ascending" : "descending" : "none"}>{sortHeading("Maskapai", "airline")}</th>
            <th>Penerbangan</th><th>Kota Asal</th><th>Kota Tujuan</th><th>Kelas</th><th>Keberangkatan</th><th>Kedatangan</th><th>Transit</th>
            <th>Durasi</th>
            <th aria-sort={currentParams.sortKey === "daysLeft" ? currentParams.sortDir === "asc" ? "ascending" : "descending" : "none"}>{sortHeading("Hari Tersisa", "daysLeft")}</th>
            <th aria-sort={currentParams.sortKey === "price" ? currentParams.sortDir === "asc" ? "ascending" : "descending" : "none"}>{sortHeading("Harga (₹)", "price")}</th>
          </tr></thead>
          <tbody>{flights.data.map((row) => <tr key={row.id}>
            <td><div className="flex items-center gap-2.5 whitespace-nowrap"><span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-blue-50 font-mono text-[10px] text-blue-700">{(row.flight || '').split("-")[0]}</span><span className="font-medium">{row.airline}</span></div></td>
            <td className="font-mono text-xs text-slate-500">{row.flight}</td><td>{row.source_city}</td><td>{row.destination_city}</td><td><Badge tone={row.class === "Business" ? "blue" : "slate"}>{row.class}</Badge></td><td className="font-mono text-xs">{row.departure_time}</td><td className="font-mono text-xs">{row.arrival_time}</td><td className="whitespace-nowrap text-slate-500">{row.stops}</td><td className="whitespace-nowrap font-mono text-xs">{Math.floor(row.duration || 0)}j {Math.round(((row.duration || 0) % 1) * 60)}m</td><td><Badge tone={row.days_left <= 7 ? "amber" : "slate"}>{row.days_left} hari</Badge></td><td className="text-right font-mono font-medium"><PriceDisplay amount={row.price} inline /></td>
          </tr>)}</tbody>
        </DataTable>
        {flights.data.length === 0 && <div className="px-6 py-12 text-center"><Search size={26} className="mx-auto mb-3 text-slate-300" /><p className="font-medium text-slate-700">Tidak ada data penerbangan yang cocok dengan saringan.</p><p className="mt-1 text-sm text-slate-500">Coba kota, maskapai, atau rentang harga lain.</p></div>}
        <div className="table-footer flex-wrap gap-4">
          <p aria-live="polite" className="text-xs text-slate-500">Menampilkan <span className="font-medium text-slate-800">{flights.count === 0 ? 0 : (pageNum - 1) * pageLimit + 1}–{Math.min(pageNum * pageLimit, flights.count)}</span> dari {flights.count.toLocaleString("id-ID")} rekam data</p>
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 text-xs text-slate-500">Baris per halaman<select className="select py-1.5" value={pageLimit} onChange={(event) => updateUrl({ limit: event.target.value, page: "1" })}><option>20</option><option>50</option><option>100</option></select></label>
            <button aria-label="Halaman sebelumnya" className="button button-secondary p-2" onClick={() => updateUrl({ page: String(pageNum - 1) })} disabled={pageNum <= 1}><ChevronLeft size={16} /></button>
            <span className="text-xs text-slate-600">{pageNum} / {totalPages}</span>
            <button aria-label="Halaman berikutnya" className="button button-secondary p-2" onClick={() => updateUrl({ page: String(pageNum + 1) })} disabled={pageNum >= totalPages}><ChevronRight size={16} /></button>
          </div>
        </div>
      </Card>
      <div className="flex items-start gap-3 rounded-xl border border-emerald-100 bg-emerald-50/60 p-4"><ShieldCheck size={19} className="mt-0.5 shrink-0 text-emerald-600" /><p className="text-xs leading-5 text-slate-600"><strong className="font-semibold text-slate-800">Database Langsung Terhubung.</strong> UI sekarang ditenagai langsung oleh database Supabase. Agregasi sisi server dan paginasi nyata telah aktif.</p></div>
      <p className="sr-only" role="status">{notice}</p>
    </div>
  );
}
