import { ArrowRight, Dices, RefreshCw } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import { formatPrice } from "@/lib/format";
import { PriceDisplay } from "@/components/ui/price-display";
import type { MonteCarloResult } from "@/lib/monte-carlo";

const pipeline = [
  { label: "Angka Acak", detail: "Tarik nilai dari 0000–9999" },
  { label: "Interval Probabilitas", detail: "Temukan interval yang cocok" },
  { label: "Rentang Harga", detail: "Temukan bucket harga historis" },
  { label: "Harga Sampel", detail: "Pilih nilai di dalam bucket tersebut" },
];

export function RandomStep({ result, onRegenerate }: { result: MonteCarloResult; onRegenerate: () => void }) {
  const samples = result.randomSamples.slice(0, 10);
  return <Card className="p-5 sm:p-6 [&>.card-header]:px-0 [&>.card-header]:pt-0">
    <CardHeader title="Pembuatan Angka Acak" description="Ikuti setiap penarikan acak melalui pemetaan probabilitas." icon={Dices} action={<button type="button" className="button button-secondary" onClick={onRegenerate}><RefreshCw size={16} /> Buat Sampel</button>} />
    <div className="mb-6 flex flex-wrap gap-3 rounded-xl bg-slate-50 p-4 text-xs text-slate-600">
      <span><span className="font-semibold text-slate-800">Generator:</span> Generator Angka Acak Semu</span><span className="font-mono">Rentang: 0000–9999</span><span className="font-mono">Seed: {result.seed}</span><Badge tone="slate">10 penarikan ilustratif</Badge>
    </div>
    <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {pipeline.map((item, index) => <div key={item.label} className="rounded-xl bg-indigo-50 p-4">
        <div className="mb-2 flex items-center justify-between text-blue-600"><span className="font-mono text-[11px] font-semibold">0{index + 1} · {index === 0 ? "BUAT" : index === 1 ? "PARTISI" : index === 2 ? "PETAKAN" : "SAMPEL"}</span>{index < pipeline.length - 1 && <ArrowRight size={14} />}</div>
        <p className="text-sm font-semibold text-slate-900">{item.label}</p><p className="mt-1 text-xs leading-5 text-slate-500">{item.detail}</p>
      </div>)}
    </div>
    <DataTable label="Sepuluh pemetaan sampel angka acak">
      <thead><tr><th>Iterasi</th><th>Angka Acak</th><th>Interval Probabilitas</th><th>Rentang Harga</th><th className="text-right">Harga Sampel</th></tr></thead>
      <tbody>{samples.map((row) => {
        // find bucket for this sample
        const bucket = result.buckets.find(b => b.min === row.bucketMin && b.max === row.bucketMax);
        return <tr key={row.iteration}>
          <td className="font-mono text-slate-500">#{String(row.iteration).padStart(4, "0")}</td><td className="font-mono font-semibold text-blue-600">{String(row.randomNumber).padStart(4, "0")}</td><td className="font-mono text-xs">{bucket ? `${String(bucket.intervalStart).padStart(4, '0')}–${String(bucket.intervalEnd).padStart(4, '0')}` : ''}</td><td><span className="flex items-center gap-1"><PriceDisplay amount={row.bucketMin} inline /> – <PriceDisplay amount={row.bucketMax} inline /></span></td><td className="text-right font-mono font-semibold"><PriceDisplay amount={row.sampledPrice} inline /></td>
        </tr>
      })}</tbody>
    </DataTable>
    <p className="mt-4 text-xs leading-5 text-slate-500">Sampel ini membuat proses pemetaan terlihat. Membuatnya kembali akan menggunakan seed acak baru. Seed memungkinkan simulasi direproduksi.</p>
  </Card>;
}
