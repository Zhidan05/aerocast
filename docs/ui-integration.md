# Integrasi UI AeroCast

Dokumen ini mencatat integrasi desain Google Stitch ke aplikasi Next.js AeroCast yang sudah ada. Lingkup tahap ini adalah antarmuka analytics, interaksi lokal, visualisasi, serta alur edukasi Monte Carlo.

## Audit dan keputusan desain

`DESIGN.md` menjadi sumber kebutuhan konten, struktur halaman, navigasi, parameter simulasi, dan metrik evaluasi. Folder `stitch-design/` menjadi referensi tampilan. Dokumentasi Next.js yang terpasang di `node_modules/next/dist/docs/` digunakan sebelum implementasi App Router dan batas Server/Client Components.

Project awal menggunakan Next.js 16.3.8, React 19.2.8, TypeScript, dan Tailwind CSS 4. Struktur project dan framework dipertahankan. Dependensi visualisasi serta font ditambahkan sesuai kebutuhan UI.

| Referensi yang diaudit | Penggunaan dalam aplikasi |
| --- | --- |
| `stitch-design/flight_fare_prediction_dashboard/` | Hierarki dashboard, sidebar, KPI, form simulasi ringkas, histogram, probability bars, tabel eksperimen terbaru. |
| `stitch-design/dataset_explorer/` | Summary cards, filter, tabel data padat, visualisasi harga berdasarkan hari dan maskapai. |
| `stitch-design/monte_carlo_simulation_workflow/` | Stepper lima tahap, panel parameter, probabilitas, random numbers, progres, dan hasil. |
| `stitch-design/prediction_accuracy_evaluation/` | Konfigurasi train/test, metrik error, scatter plot, histogram error, dan evaluasi per rute. |
| `stitch-design/aerocast_predictive_analytics/DESIGN.md` | Token visual tambahan: warna, tipografi, spacing, radius, dan gaya analytics. |
| `stitch-design/aerocast_logo/` | Logo pesawat dan grafik dari markup SVG asli di `code.html`, disalin menjadi asset lokal. |
| `stitch-design/professional_corporate_user_avatar_of_a_data_scientist_clean_studio_lighting/` | Ditinjau sebagai referensi profil; foto avatar tidak digunakan karena belum ada fitur akun. |

Desain memakai latar slate `#F8FAFC`, kartu putih, border halus, aksen biru `#2563EB` dan indigo, serta whitespace yang konsisten. Heading memakai Plus Jakarta Sans, isi memakai Inter, dan angka memakai JetBrains Mono. Font disajikan secara lokal dari dependensi npm.

Konten visual Stitch yang mengesankan model produksi aktif, harga pasti, strategi pembelian tiket, atau metode stokastik di luar kebutuhan diganti dengan keterangan demo yang sesuai `DESIGN.md`. Semua harga menggunakan INR (₹), dan keluaran disebut estimasi atau distribusi kemungkinan.

## Mapping route dan fungsi

| Route | Halaman | Implementasi |
| --- | --- | --- |
| `/` | Dashboard | Empat KPI, form simulasi cepat, validasi input, demo progres, ringkasan hasil, histogram, probability bars, eksperimen terbaru, ekspor JSON. |
| `/dataset` | Dataset Explorer | Summary corpus, 48 record lokal, search, enam filter, sort, pagination, pilihan jumlah baris, ekspor CSV, tiga kelompok grafik. |
| `/monte-carlo` | Monte Carlo Simulation | Input Data → Probability → Random Numbers → Simulation → Result, contoh historical subset, interval probabilitas, sampel random, progres demo, hasil dan ekspor. |
| `/experiments` | Experiment History | Delapan contoh eksperimen, search/filter/sort, detail input dan hasil, perbandingan, grafik convergence untuk parameter yang cocok, duplicate, delete/undo, ekspor. |
| `/accuracy` | Prediction Accuracy | Train/test 80/20, MAE/MAPE/RMSE, actual vs predicted, error distribution, tabel evaluasi rute dengan pencarian, filter, sort, pagination, dan ekspor CSV. |
| `/about` | About Method | Alur delapan tahap, penjelasan probabilitas, formula MAE/MAPE/RMSE, interpretasi distribusi dan batasan contoh. |

Sidebar memiliki active state dan hover state. Pada desktop sidebar tetap tampil, ukuran tablet tertentu menggunakan navigasi ringkas, dan layar kecil memakai drawer. Kartu statistik beradaptasi dari empat ke dua lalu satu kolom. Grafik menjadi satu kolom di layar kecil dan tabel dapat digulir horizontal.

## Inventaris file

### File baru

| Kelompok | File |
| --- | --- |
| Route | `app/dataset/page.tsx`, `app/monte-carlo/page.tsx`, `app/experiments/page.tsx`, `app/accuracy/page.tsx`, `app/about/page.tsx` |
| App shell | `components/layout/app-sidebar.tsx`, `components/layout/app-header.tsx`, `components/layout/page-header.tsx`, `components/layout/dashboard-shell.tsx` |
| Komponen UI | `components/ui/card.tsx`, `components/ui/stat-card.tsx`, `components/ui/badge.tsx`, `components/ui/data-table.tsx`, `components/ui/probability-bars.tsx` |
| Dashboard dan grafik bersama | `components/dashboard/dashboard-view.tsx`, `components/charts/price-distribution.tsx` |
| Dataset | `components/dataset/dataset-explorer.tsx`, `components/dataset/dataset-charts.tsx` |
| Workflow Monte Carlo | `components/monte-carlo/simulation-workflow.tsx`, `components/monte-carlo/simulation-fields.tsx`, `components/monte-carlo/probability-step.tsx`, `components/monte-carlo/random-step.tsx`, `components/monte-carlo/result-step.tsx`, `components/monte-carlo/workflow-charts.tsx` |
| Accuracy | `components/accuracy/accuracy-evaluation.tsx`, `components/accuracy/accuracy-charts.tsx` |
| Experiments | `components/experiments/experiment-history.tsx`, `components/experiments/experiment-detail.tsx`, `components/experiments/experiment-comparison.tsx` |
| About | `components/about/method-overview.tsx` |
| Tipe dan helper | `lib/types.ts`, `lib/format.ts` |
| Data contoh | `lib/mock-data/dashboard.ts`, `lib/mock-data/flights.ts`, `lib/mock-data/monte-carlo.ts`, `lib/mock-data/accuracy.ts`, `lib/mock-data/experiments.ts` |
| Asset | `public/images/aerocast/logo.svg`, `app/icon.svg` |
| Dokumentasi | `docs/ui-integration.md` |

### File utama yang diubah

- `app/page.tsx`: halaman dashboard utama.
- `app/layout.tsx`: dashboard shell bersama, metadata, dan identitas AeroCast.
- `app/globals.css`: design tokens, font lokal, app shell, komponen bersama, responsive layout, dan focus states.
- `package.json` dan `package-lock.json`: penambahan dependensi visualisasi, ikon, dan font.

`DESIGN.md` dan seluruh `stitch-design/` tetap dipertahankan sebagai referensi. Konfigurasi framework yang tidak memerlukan perubahan tetap digunakan.

## Dependensi baru

| Dependensi | Versi di package.json | Kegunaan |
| --- | --- | --- |
| `recharts` | `^3.10.1` | Histogram, line chart, scatter plot, dan grafik perbandingan. |
| `lucide-react` | `^1.49.0` | Ikon outline konsisten tanpa emoji. |
| `@fontsource-variable/inter` | `^5.3.0` | Font isi dan kontrol UI yang di-host lokal. |
| `@fontsource-variable/plus-jakarta-sans` | `^5.3.0` | Font heading sesuai referensi Stitch. |
| `@fontsource-variable/jetbrains-mono` | `^5.3.0` | Font angka, harga, ID, dan istilah matematis. |

## Komponen reusable

- `DashboardShell`, `AppHeader`, dan `AppSidebar`: kerangka semua halaman dan navigasi responsive.
- `PageHeader`: eyebrow, judul, deskripsi, dan tindakan utama.
- `Card` dan `CardHeader`: container dan judul panel yang konsisten.
- `StatCard`: metrik, helper text, warna aksen, ikon, dan tooltip statistik.
- `Badge`: status, kelas, dan penanda demo.
- `DataTable`: tabel dengan container scroll dan label aksesibilitas.
- `ProbabilityBars`: probabilitas per rentang harga.
- `SimulationFields`: parameter form dan validasi bersama pada dashboard/workflow.
- `PriceDistribution`: histogram contoh bersama dengan marker statistik.
- `lib/format.ts`: formatter harga/angka dan helper download.

## Asset Stitch

Logo pesawat + analytics disalin dari SVG asli `stitch-design/aerocast_logo/code.html` menjadi `public/images/aerocast/logo.svg` dan ikon aplikasi di `app/icon.svg`. Tidak ada asset produksi yang dibaca langsung dari `stitch-design/`. Screenshot penuh dan file HTML Stitch berfungsi sebagai referensi desain, bukan halaman aplikasi terpisah. Foto avatar referensi tidak dipakai.

## Batasan mock dan konsistensi data

1. Angka corpus 300.153 record serta KPI utama mengikuti brief. Dataset Explorer hanya menampilkan 48 record contoh lokal; filter dan ekspor bekerja pada preview tersebut.
2. Dashboard dan workflow menggunakan hasil ilustratif. Menjalankan demo menampilkan progres dan parameter terpilih, tanpa menjalankan backend prediksi atau algoritma Monte Carlo penuh.
3. Probabilitas, random number sample, histogram, metrik, dan hasil accuracy adalah fixture untuk presentasi UI. Nilai-nilai ini belum berasal dari dataset aktual atau pengujian model.
4. Experiments berisi delapan fixture lokal. View, Compare, Duplicate, Delete/Undo, dan Export berfungsi di sisi klien. Perubahan belum disimpan ke database.
5. Tiga recent runs pada dashboard diambil dari fixture Experiments yang sama: `EXP-008`, `EXP-004`, dan `EXP-003`, sehingga ID, iterasi, mean, dan median konsisten antarlayar.
6. Run Again membawa enam parameter eksperimen melalui query URL; halaman Monte Carlo memvalidasi parameter sebelum menggunakan nilai awal.
7. Perbandingan convergence hanya digunakan ketika route, class, days left, dan tolerance sama serta jumlah iterasi berbeda. Kombinasi lainnya ditampilkan sebagai perbandingan harga antar eksperimen.
8. Belum ada Supabase, API, authentication, import dataset, pembayaran, booking, atau penyimpanan eksperimen permanen.

## Verifikasi

- `npm run build`: pemeriksaan akhir **berhasil**, exit code 0; TypeScript lolos. Lima halaman statis dan `/monte-carlo` dirender sesuai request agar dapat membaca parameter Run Again.
- `npm run lint`: pemeriksaan akhir **berhasil**, exit code 0; tidak ada error atau warning ESLint.
- `npx tsc --noEmit`: **berhasil**.
- Konsistensi delapan fixture Experiments: total frekuensi histogram sesuai iteration count, interval random berurutan tanpa gap, dan cakupan lengkap `0000–9999`.
- Fixture workflow: total frekuensi historical 842, cakupan interval `0000–9999` tanpa gap, serta 1.000 contoh mapping berada dalam bucket yang benar.
- Browser: keenam route dibuka; validasi source = destination, submit demo, pencarian kosong, filter maskapai/kelas, regenerasi random sample, kelima tahap workflow, progres sampai 100%, View/Compare/Delete/Undo, serta parameter Run Again diperiksa.
- Responsiveness: desktop 1440 px, navigasi ringkas tablet 1024 px, mobile 390 px. Keenam halaman tidak menyebabkan overflow horizontal halaman pada mobile; tabel tetap dapat digulir di dalam container. Drawer berhasil membuka, menutup, dan menavigasi.
- Console browser: tidak ada error atau warning selama pemeriksaan rute dan interaksi di atas.
- Ekspor CSV/JSON tersedia melalui helper browser Blob; UI ekspor dataset melaporkan 48 record. Penerimaan file melalui event download browser otomatis tidak terverifikasi karena alat preview mengalami timeout; penyimpanan file download belum menjadi bagian dari bukti QA.

## Rekomendasi tahap berikutnya

Tahap selanjutnya adalah merancang schema Supabase untuk `flight_prices`, `simulations`, `simulation_results` atau ringkasan bucket, dan `accuracy_tests`. Setelah itu, import dataset aktual dengan validasi tipe, kelengkapan field, dan rentang nilai. Hubungkan penyaringan historical subset ke parameter UI yang sudah tersedia.

Implementasikan pipeline Monte Carlo yang dapat direproduksi: pembentukan bucket, probabilitas, cumulative probability, interval random, seed, sampling, hasil agregat, dan evaluasi pada held-out data. Pisahkan estimasi, metadata parameter, dan hasil accuracy agar transparan. Untuk 100.000 iterasi, prioritaskan penyimpanan ringkasan, bucket, dan contoh random numbers sesuai kebutuhan, kemudian tambahkan pengujian integritas probabilitas dan metrik sebelum mengganti fixture UI.

Pekerjaan backend tersebut belum dikerjakan pada tahap integrasi UI ini.
