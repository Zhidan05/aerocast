import Link from "next/link";
import { ArrowDown, ArrowRight, BarChart3, BookOpen, Database, Dices, FlaskConical, Info, Layers, ListOrdered, Percent, Play, Target, TrendingUp } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader } from "@/components/ui/card";

const methodSteps = [
  { title: "Data Historis", description: "Pilih tarif masa lalu yang sesuai dengan rute, kelas kabin, dan hari sebelum keberangkatan. Toleransi memperlebar rentang hari pencocokan.", detail: "Delhi → Mumbai · Ekonomi · 7 ± 1 hari", icon: Database },
  { title: "Distribusi Frekuensi", description: "Kelompokkan harga tiket yang cocok ke dalam interval dan hitung observasi di setiap rentang harga.", detail: "₹5.000–₹7.000: 102 dari 842 observasi", icon: BarChart3 },
  { title: "Probabilitas", description: "Bagi frekuensi setiap interval dengan jumlah total observasi yang cocok.", detail: "102 ÷ 842 ≈ 0,1211, atau 12,11%", icon: Percent },
  { title: "Probabilitas Kumulatif", description: "Tambahkan probabilitas secara berurutan. Probabilitas kumulatif akhir adalah 1, mencakup setiap bucket yang memungkinkan.", detail: "0,1211 → 0,4062 → … → 1,0000", icon: TrendingUp },
  { title: "Interval Angka Acak", description: "Petakan probabilitas kumulatif ke interval bilangan bulat yang tidak tumpang tindih dari 0000 hingga 9999.", detail: "Interval pertama: 0000–1210", icon: ListOrdered },
  { title: "Pengambilan Sampel Acak", description: "Tarik angka acak semu, temukan interval probabilitasnya, dan pilih harga perwakilan dari bucket yang cocok.", detail: "1834 → ₹7.001–₹9.000 → harga sampel", icon: Dices },
  { title: "Simulasi Monte Carlo", description: "Ulangi proses pengambilan sampel berkali-kali. Lebih banyak iterasi biasanya mengurangi variasi acak pada rata-rata estimasi.", detail: "100 → 1.000 → 10.000 → 100.000 iterasi", icon: FlaskConical },
  { title: "Distribusi Prediksi", description: "Rangkum harga yang disimulasikan menggunakan rata-rata, median, persentil, dan rentang probabilitas.", detail: "Distribusi kemungkinan hasil", icon: Layers },
];

const formulas = [
  { label: "Probabilitas", abbreviation: "P(x)", formula: "P(x) = f(x) / Σf", description: "Frekuensi relatif bucket harga. Di sini, f(x) adalah jumlah observasi dan Σf adalah jumlah total.", example: "Contoh: 102 / 842 ≈ 12,11%", tone: "blue" },
  { label: "Rata-rata Kesalahan Absolut", abbreviation: "MAE", formula: "MAE = (1/n) Σ |Aᵢ − Pᵢ|", description: "Rata-rata perbedaan absolut antara tarif aktual dan prediksi. Diukur dalam ₹; lebih rendah lebih baik.", example: "MAE sebesar ₹1.324 berarti rata-rata kesalahan sebesar ₹1.324.", tone: "indigo" },
  { label: "Rata-rata Persentase Kesalahan Absolut", abbreviation: "MAPE", formula: "MAPE = (100/n) Σ |(Aᵢ − Pᵢ) / Aᵢ|", description: "Rata-rata kesalahan absolut relatif terhadap tarif aktual, dinyatakan sebagai persentase. Lebih rendah lebih baik.", example: "MAPE sebesar 11,8% berarti rata-rata kesalahan relatif sebesar 11,8%.", tone: "blue" },
  { label: "Akar Kuadrat Rata-rata Kesalahan", abbreviation: "RMSE", formula: "RMSE = √[(1/n) Σ (Aᵢ − Pᵢ)²]", description: "Mengkuadratkan kesalahan prediksi sebelum dirata-ratakan, sehingga kesalahan yang lebih besar memiliki pengaruh lebih besar. Diukur dalam ₹.", example: "Bandingkan RMSE dengan MAE untuk memahami kesalahan yang lebih besar.", tone: "indigo" },
];

export function MethodOverview() {
  return <div className="page-stack">
    <PageHeader eyebrow="PAHAMI MODEL" title="Metode Simulasi Monte Carlo" description="Dari observasi historis ke distribusi tarif yang memungkinkan — selangkah demi selangkah yang transparan." actions={<Link href="/monte-carlo" className="button button-primary"><Play size={16} />Jelajahi Alur Kerja</Link>} />

    <section className="relative overflow-hidden rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-6 sm:p-8">
      <div className="grid items-center gap-8 xl:grid-cols-[1.35fr_1fr]">
        <div><Badge tone="blue"><BookOpen size={12} />METODE, DIJELASKAN</Badge><h2 className="mt-4 max-w-xl text-2xl font-semibold leading-snug tracking-tight text-slate-900">Ketidakpastian model.<br />Pahami kemungkinannya.</h2><p className="mt-4 max-w-xl text-sm leading-7 text-slate-600">Simulasi Monte Carlo menggunakan sampel acak berulang untuk mengeksplorasi kemungkinan hasil. AeroCast menggunakan frekuensi tarif penerbangan historis untuk mengilustrasikan seberapa besar kemungkinan rentang harga yang berbeda untuk rute yang dipilih.</p></div>
        <div className="rounded-xl border border-white bg-white/80 p-5 shadow-sm">
          <div className="flex items-center justify-between gap-2 text-center"><div className="flex flex-1 flex-col items-center gap-3"><span className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600"><Database size={23} /></span><span className="text-xs font-semibold text-slate-600">Tarif historis</span></div><ArrowRight size={16} className="mb-6 shrink-0 text-slate-300" /><div className="flex flex-1 flex-col items-center gap-3"><span className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600"><Dices size={24} /></span><span className="text-xs font-semibold text-slate-600">Pengambilan sampel acak</span></div><ArrowRight size={16} className="mb-6 shrink-0 text-slate-300" /><div className="flex flex-1 flex-col items-center gap-3"><span className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white"><BarChart3 size={24} /></span><span className="text-xs font-semibold text-slate-600">Distribusi harga</span></div></div>
          <p className="mt-6 border-t border-slate-100 pt-4 text-center text-xs leading-relaxed text-slate-500">Satu set input. Ribuan kemungkinan hasil.</p>
        </div>
      </div>
    </section>

    <div className="grid items-start gap-6 xl:grid-cols-[1.08fr_1fr]">
      <Card>
        <CardHeader title="Cara kerja aplikasi ini" description="Ikuti data melalui kedelapan tahap." icon={Layers} />
        <ol className="px-5 pb-6 sm:px-6">{methodSteps.map((step, index) => <li key={step.title} className="relative flex gap-4 pb-6 last:pb-0">
          {index < methodSteps.length - 1 && <span aria-hidden="true" className="absolute top-11 bottom-1 left-5 flex w-px justify-center bg-slate-200"><ArrowDown size={12} className="absolute bottom-0 shrink-0 bg-white text-slate-300" /></span>}
          <span className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${index === 7 ? "bg-blue-600 text-white shadow-sm shadow-blue-200" : "bg-blue-50 text-blue-600"}`}><step.icon size={19} /></span>
          <div className="min-w-0 pt-0.5"><h3 className="text-sm font-semibold text-slate-800"><span className="mr-2 font-mono text-[11px] text-slate-400">{String(index + 1).padStart(2, "0")}</span>{step.title}</h3><p className="mt-1.5 text-xs leading-5 text-slate-500">{step.description}</p><p className="mt-2 inline-block rounded-md bg-slate-50 px-2 py-1 font-mono text-[10px] leading-4 text-slate-600">{step.detail}</p></div>
        </li>)}</ol>
      </Card>

      <div className="space-y-4">
        <div className="flex items-center gap-3 px-1 py-2"><span className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600"><Target size={19} /></span><div><h2 className="text-base font-semibold text-slate-900">Matematika di baliknya</h2><p className="mt-1 text-xs text-slate-500">Probabilitas dan evaluasi, dibuat agar mudah dibaca.</p></div></div>
        {formulas.map((formula) => <Card key={formula.abbreviation} className="p-5 sm:p-6"><div className="mb-4 flex items-center justify-between gap-3"><h3 className="text-sm font-semibold text-slate-800">{formula.label}</h3><span className={`rounded-md px-2 py-1 font-mono text-[11px] font-semibold ${formula.tone === "blue" ? "bg-blue-50 text-blue-700" : "bg-indigo-50 text-indigo-700"}`}>{formula.abbreviation}</span></div><div className="overflow-x-auto rounded-lg border border-slate-100 bg-slate-50 px-4 py-4 text-center font-mono text-sm whitespace-nowrap text-slate-800" tabIndex={0} aria-label={formula.formula}>{formula.formula}</div><p className="mt-3 text-xs leading-5 text-slate-500">{formula.description}</p><p className="mt-3 border-t border-slate-100 pt-3 text-xs leading-5 text-blue-700">{formula.example}</p></Card>)}
        <p className="px-1 text-xs leading-5 text-slate-500"><span className="font-semibold text-slate-700">Notasi:</span> Aᵢ = tarif aktual, Pᵢ = estimasi tarif, n = jumlah sampel yang dievaluasi. Penjumlahan berjalan dari i = 1 hingga n. MAPE memerlukan tarif aktual yang tidak nol; pengecualian apa pun harus dilaporkan.</p>
      </div>
    </div>

    <div className="grid gap-5 lg:grid-cols-3">
      <Card className="p-6"><Database size={21} className="mb-4 text-blue-600" /><h3 className="text-sm font-semibold">Mulai dengan data relevan</h3><p className="mt-2 text-xs leading-6 text-slate-500">Subset historis yang dipilih membentuk setiap probabilitas. Sampel kecil atau toleransi hari yang lebar dapat mengubah seberapa representatif hasilnya.</p><Link href="/dataset" className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800">Jelajahi dataset<ArrowRight size={13} /></Link></Card>
      <Card className="p-6"><TrendingUp size={21} className="mb-4 text-indigo-600" /><h3 className="text-sm font-semibold">Baca distribusi lengkap</h3><p className="mt-2 text-xs leading-6 text-slate-500">Rata-rata hanyalah salah satu ringkasan. Persentil dan interval simulasi 95% menggambarkan variabilitas pada hasil yang disimulasikan; ini bukan tarif masa depan yang dijamin.</p><Link href="/experiments" className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800">Bandingkan eksperimen<ArrowRight size={13} /></Link></Card>
      <Card className="p-6"><Target size={21} className="mb-4 text-blue-600" /><h3 className="text-sm font-semibold">Evaluasi pada data yang dicadangkan</h3><p className="mt-2 text-xs leading-6 text-slate-500">MAE, MAPE, dan RMSE membandingkan prediksi dengan observasi yang ditahan. Lebih banyak simulasi dapat meningkatkan stabilitas tanpa selalu meningkatkan akurasi prediksi.</p><Link href="/accuracy" className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800">Pahami evaluasi<ArrowRight size={13} /></Link></Card>
    </div>

    <div className="flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50/70 px-5 py-4"><Info size={18} className="mt-0.5 shrink-0 text-blue-600" /><p className="text-xs leading-6 text-slate-600"><span className="font-semibold text-slate-800">Model Prediksi Langsung.</span> Seluruh alur kerja aplikasi terhubung sepenuhnya dengan dataset nyata, memproses data historis sesuai permintaan melalui engine simulasi Monte Carlo deterministik.</p></div>
  </div>;
}
