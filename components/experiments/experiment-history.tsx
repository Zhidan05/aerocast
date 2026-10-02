"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { ArrowDownToLine, ArrowRight, Beaker, Check, FlaskConical, GitCompareArrows, Plus, Route, Search, Trash2, Undo2, ChevronLeft, ChevronRight } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { StatCard } from "@/components/ui/stat-card";
import { ExperimentDetail } from "@/components/experiments/experiment-detail";
import { ExperimentComparison } from "@/components/experiments/experiment-comparison";
import { downloadFile, formatNumber, formatPrice } from "@/lib/format";
import { PriceDisplay } from "@/components/ui/price-display";

const createdDate = new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric", timeZone: "Asia/Jakarta" });

export function ExperimentHistory({ 
  initialExperiments, 
  totalCount, 
  page, 
  search: initialSearch, 
  cabinClass: initialCabinClass, 
  sort: initialSort 
}: {
  initialExperiments: any[];
  totalCount: number;
  page: number;
  search: string;
  cabinClass: string;
  sort: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [searchState, setSearchState] = useState(initialSearch);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [viewedId, setViewedId] = useState<string | null>(null);
  const [comparing, setComparing] = useState(false);
  const [notice, setNotice] = useState("");
  
  const detailRef = useRef<HTMLDivElement>(null);
  const comparisonRef = useRef<HTMLDivElement>(null);

  const viewed = initialExperiments.find((experiment) => experiment.id === viewedId);
  const selected = initialExperiments.filter((experiment) => selectedIds.includes(experiment.id));

  const totalPages = Math.ceil(totalCount / 20) || 1;

  function updateUrl(params: Record<string, string | null>) {
    const next = new URLSearchParams(searchParams.toString());
    Object.entries(params).forEach(([key, value]) => {
      if (value === null) next.delete(key);
      else next.set(key, value);
    });
    router.push(`${pathname}?${next.toString()}`);
  }

  function handleSearch(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      updateUrl({ search: searchState || null, page: "1" });
    }
  }

  function selectExperiment(id: string, openComparison = false) {
    const next = selectedIds.includes(id) ? selectedIds.filter((value) => value !== id) : [...selectedIds, id];
    if (next.length > 4) {
      setNotice("Bandingkan maksimal empat eksperimen sekaligus. Hapus pilihan satu untuk menambahkan yang lain.");
      return;
    }
    setSelectedIds(next);
    if (openComparison) {
      if (next.length >= 2) showComparison();
      else setNotice("Eksperimen dipilih. Pilih satu lagi untuk membandingkan hasil.");
    }
  }

  function showComparison() {
    setComparing(true);
    setTimeout(() => comparisonRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  }

  function viewExperiment(id: string) {
    setViewedId(viewedId === id ? null : id);
    if (viewedId !== id) setTimeout(() => detailRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  }

  async function deleteExperiment(experiment: any) {
    if (!confirm(`Apakah Anda yakin ingin menghapus eksperimen ${experiment.id.split('-')[0]}?`)) return;
    
    try {
      const res = await fetch(`/api/experiments/${experiment.id}`, { method: 'DELETE' });
      if (res.ok) {
        setNotice(`Eksperimen dihapus.`);
        setSelectedIds(selectedIds.filter((value) => value !== experiment.id));
        if (viewedId === experiment.id) setViewedId(null);
        router.refresh();
      } else {
        setNotice(`Gagal menghapus eksperimen.`);
      }
    } catch (err) {
      setNotice(`Terjadi kesalahan jaringan saat menghapus.`);
    }
  }

  function duplicateExperiment(experiment: any) {
    // "Duplicate / Re-run -> membuka Monte Carlo form dengan parameter experiment tersebut."
    const params = new URLSearchParams({
      source: experiment.source_city,
      destination: experiment.destination_city,
      class: experiment.class,
      daysLeft: String(experiment.days_left),
      tolerance: String(experiment.days_tolerance),
      iterations: String(experiment.iteration_count),
    });
    if (experiment.seed) {
      params.set('seed', String(experiment.seed));
    }
    router.push(`/monte-carlo?${params.toString()}`);
  }

  return <div className="page-stack">
    <PageHeader eyebrow="RUANG KERJA PENELITIAN ANDA" title="Riwayat Eksperimen" description="Lihat kembali hasil simulasi, bandingkan hasil, dan pelajari bagaimana estimasi Anda konvergen." actions={<Link className="button button-primary" href="/monte-carlo"><Plus size={17} />Eksperimen Baru</Link>} />
    <div className="stat-grid">
      <StatCard label="Eksperimen" value={totalCount} helper="Tersimpan di database" icon={FlaskConical} />
      <StatCard label="Data Aktual" value="Aktual" helper="Hasil simulasi aktual" icon={Check} tone="green" />
    </div>

    <Card className="overflow-hidden">
      <CardHeader title="Eksperimen tersimpan" description="Pilih maksimal 4 eksperimen untuk membandingkan hasilnya." icon={FlaskConical} action={<button className="button button-secondary" disabled={selected.length < 2} onClick={showComparison}><GitCompareArrows size={16} />Bandingkan{selected.length > 0 ? ` (${selected.length})` : ""}</button>} />
      <div className="flex flex-wrap items-center gap-3 border-t border-slate-100 px-5 py-4 sm:px-6">
        <div className="relative min-w-48 flex-1">
          <Search aria-hidden="true" size={16} className="absolute top-1/2 left-3 -translate-y-1/2 text-slate-400" />
          <input className="input !pl-10" aria-label="Search experiment ID or route" placeholder="Cari ID atau rute dan tekan Enter…" value={searchState} onChange={(event) => setSearchState(event.target.value)} onKeyDown={handleSearch} />
        </div>
        <select className="select !w-auto" aria-label="Filter experiments by cabin class" value={initialCabinClass} onChange={(event) => updateUrl({ class: event.target.value === "Semua kelas" ? null : event.target.value, page: "1" })}><option>Semua kelas</option><option value="Economy">Ekonomi</option><option value="Business">Bisnis</option></select>
        <select className="select !w-auto" aria-label="Sort experiments" value={initialSort} onChange={(event) => updateUrl({ sort: event.target.value, page: "1" })}><option value="newest">Terbaru</option><option value="oldest">Terlama</option><option value="price-high">Estimasi harga tertinggi</option><option value="price-low">Estimasi harga terendah</option><option value="iterations">Iterasi terbanyak</option></select>
      </div>
      <DataTable label="Eksperimen Monte Carlo tersimpan">
        <thead><tr><th><span className="sr-only">Select</span></th><th>ID Eksperimen</th><th>Rute</th><th>Kelas</th><th>Hari tersisa</th><th className="text-right">Iterasi</th><th className="text-right">Estimasi harga</th><th className="text-right">Akurasi</th><th>Dibuat pada</th><th>Tindakan</th></tr></thead>
        <tbody>{initialExperiments.map((experiment) => {
          const accTest = experiment.accuracy_tests && experiment.accuracy_tests[0];
          return <tr key={experiment.id} className={selectedIds.includes(experiment.id) ? "!bg-blue-50/60" : ""}>
          <td><input type="checkbox" className="h-4 w-4 cursor-pointer accent-blue-600" aria-label={`Select ${experiment.id} for comparison`} checked={selectedIds.includes(experiment.id)} onChange={() => selectExperiment(experiment.id)} /></td>
          <td><span className="font-mono text-xs font-semibold text-slate-600" title={experiment.id}>{experiment.id.split('-')[0]}</span></td>
          <td><span className="flex items-center gap-2 whitespace-nowrap font-medium">{experiment.source_city}<ArrowRight size={13} className="text-slate-400" />{experiment.destination_city}</span></td>
          <td><Badge tone={experiment.class === "Business" ? "blue" : "slate"}>{experiment.class === "Business" ? "Bisnis" : "Ekonomi"}</Badge></td>
          <td>{experiment.days_left} hari</td><td className="text-right font-mono text-xs">{formatNumber(experiment.iteration_count)}</td>
          <td className="text-right font-mono font-semibold text-blue-600"><PriceDisplay amount={experiment.mean_price} inline /></td>
          <td className="text-right font-mono text-xs">{accTest ? `${accTest.mape.toFixed(1)}% MAPE` : <span className="text-slate-400">Belum dievaluasi</span>}</td>
          <td className="whitespace-nowrap text-xs text-slate-500"><time dateTime={experiment.created_at}>{createdDate.format(new Date(experiment.created_at))}</time></td>
          <td><div className="flex items-center gap-1">
            <button className="rounded-md px-2 py-2 text-xs font-semibold text-blue-600 hover:bg-blue-50" aria-label={`View ${experiment.id}`} aria-expanded={viewedId === experiment.id} onClick={() => viewExperiment(experiment.id)}>Lihat</button>
            <button className="rounded-md p-2 text-slate-500 hover:bg-blue-50 hover:text-blue-600" title={`Compare ${experiment.id}`} aria-label={`Compare ${experiment.id}`} aria-pressed={selectedIds.includes(experiment.id)} onClick={() => selectExperiment(experiment.id, true)}><GitCompareArrows size={16} /></button>
            <button className="rounded-md p-2 text-slate-400 hover:bg-red-50 hover:text-red-600" title={`Delete ${experiment.id}`} aria-label={`Delete ${experiment.id}`} onClick={() => deleteExperiment(experiment)}><Trash2 size={15} /></button>
          </div></td>
        </tr>
        })}</tbody>
      </DataTable>
      {initialExperiments.length === 0 && <div className="px-6 py-14 text-center"><FlaskConical size={30} className="mx-auto mb-3 text-slate-300" /><h3 className="font-semibold text-slate-800">{totalCount === 0 && !initialSearch && initialCabinClass === "All classes" ? "Belum ada eksperimen tersimpan." : "Tidak ada eksperimen yang cocok"}</h3><p className="mt-2 text-sm text-slate-500">{totalCount === 0 && !initialSearch && initialCabinClass === "All classes" ? "Jalankan simulasi Monte Carlo dan simpan hasilnya untuk membangun riwayat eksperimen Anda." : "Coba rute, ID eksperimen, atau kelas lain."}</p>{(initialSearch || initialCabinClass !== "All classes") && <button className="button button-secondary mt-4" onClick={() => updateUrl({ search: null, class: null })}>Atur ulang saringan</button>}
      {totalCount === 0 && !initialSearch && initialCabinClass === "All classes" && <Link href="/monte-carlo" className="button button-primary mt-4">Jalankan Simulasi</Link>}
      </div>}
      <div className="table-footer flex-wrap gap-3">
        <p className="text-xs text-slate-500" aria-live="polite">Menampilkan {initialExperiments.length === 0 ? 0 : (page - 1) * 20 + 1}–{Math.min(page * 20, totalCount)} dari {totalCount} eksperimen</p>
        <div className="flex items-center gap-3">
          <button className="button button-secondary p-2" aria-label="Previous page" onClick={() => updateUrl({ page: String(page - 1) })} disabled={page === 1}><ChevronLeft size={16} /></button>
          <span className="text-xs text-slate-600">{page} / {totalPages}</span>
          <button className="button button-secondary p-2" aria-label="Next page" onClick={() => updateUrl({ page: String(page + 1) })} disabled={page >= totalPages}><ChevronRight size={16} /></button>
        </div>
      </div>
    </Card>

    {notice && <div role="status" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-blue-100 bg-blue-50 px-5 py-3 text-sm text-blue-800"><span>{notice}</span><button className="text-blue-800 hover:text-blue-900" onClick={() => setNotice("")}>Tutup</button></div>}
    {comparing && <div ref={comparisonRef} className="scroll-mt-24"><ExperimentComparison experiments={selected} onClose={() => setComparing(false)} /></div>}
    {viewed && <div ref={detailRef} className="scroll-mt-24"><ExperimentDetail experiment={viewed} onClose={() => setViewedId(null)} onDuplicate={() => duplicateExperiment(viewed)} /></div>}
  </div>;
}
