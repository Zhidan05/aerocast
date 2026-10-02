# Desain UI/UX — Web Monte Carlo Prediksi Harga Tiket Pesawat

## Judul Proyek

**Sistem Prediksi Harga Tiket Pesawat Berbasis Web Menggunakan Metode Monte Carlo**

Subjudul opsional:

> Simulasi probabilistik harga tiket berdasarkan rute, kelas penerbangan, dan jarak hari sebelum keberangkatan.

Nama aplikasi / working title:

**AeroCast**
> Airline Fare Forecasting with Monte Carlo Simulation

Alternatif nama:
- FareCast
- FlightPrice MC
- AeroPredict
- MonteFare

---

## 1. Tujuan Aplikasi

Aplikasi web ini digunakan untuk mensimulasikan dan memprediksi distribusi kemungkinan harga tiket pesawat berdasarkan data historis menggunakan metode Monte Carlo.

Pengguna memilih parameter penerbangan seperti:
- kota asal,
- kota tujuan,
- kelas penerbangan,
- jumlah hari sebelum keberangkatan,
- jumlah simulasi.

Sistem kemudian:
1. mengambil data historis yang relevan,
2. membentuk distribusi frekuensi harga,
3. menghitung probabilitas dan probabilitas kumulatif,
4. membentuk interval bilangan acak,
5. menghasilkan bilangan acak,
6. menjalankan eksperimen Monte Carlo,
7. menampilkan hasil prediksi,
8. menghitung metrik evaluasi seperti MAE, MAPE, dan RMSE.

---

## 2. Teknologi

### Frontend
- React.js
- Next.js
- TypeScript
- Tailwind CSS
- shadcn/ui
- Recharts atau Apache ECharts
- Lucide Icons

### Backend / Database
- Supabase
  - PostgreSQL
  - Supabase Auth jika autentikasi dibutuhkan
  - Supabase Storage bila dataset atau hasil eksperimen perlu disimpan

### Dataset
Dataset historis harga tiket pesawat dengan atribut utama:
- airline
- flight
- source_city
- departure_time
- stops
- arrival_time
- destination_city
- class
- duration
- days_left
- price

---

# 3. Prinsip Desain

Aplikasi harus terasa seperti **dashboard data science modern**, bukan website travel booking.

Karakter visual:
- clean,
- profesional,
- modern,
- data-oriented,
- mudah dipahami saat presentasi,
- tidak terlalu ramai,
- grafik menjadi elemen utama.

Jangan membuat UI terlihat seperti Traveloka, Tiket.com, atau website pembelian tiket.

Fokus utama adalah:
> Analisis data + simulasi Monte Carlo + hasil prediksi.

---

# 4. Tema Visual

## Style

Gunakan gaya:
- modern analytics dashboard,
- rounded cards,
- subtle borders,
- sedikit shadow,
- white / slate background,
- aksen biru-indigo,
- chart yang bersih,
- banyak whitespace.

## Warna

Suggested palette:

- Background: `#F8FAFC`
- Card: `#FFFFFF`
- Primary: `#2563EB`
- Secondary: `#4F46E5`
- Success: `#16A34A`
- Warning: `#F59E0B`
- Error: `#DC2626`
- Text Primary: `#0F172A`
- Text Secondary: `#64748B`
- Border: `#E2E8F0`

Dark mode dapat ditambahkan nanti, tetapi desain awal fokus light mode.

---

# 5. Layout Utama

Desktop-first responsive dashboard.

Struktur:

```text
┌──────────────────────────────────────────────────────────────┐
│ Top Navbar                                                   │
├───────────────┬──────────────────────────────────────────────┤
│               │                                              │
│   Sidebar     │             Main Content                     │
│               │                                              │
│               │                                              │
└───────────────┴──────────────────────────────────────────────┘
```

## Navbar

Isi:
- logo AeroCast,
- judul kecil "Monte Carlo Fare Forecasting",
- dataset status,
- optional profile/avatar.

Contoh:

```text
AeroCast
Monte Carlo Fare Forecasting

Dataset: 300,153 records
```

## Sidebar

Menu:

```text
Dashboard
Dataset
Monte Carlo
Experiments
Accuracy
History
About Method
```

Gunakan icon Lucide.

Suggested icons:
- Dashboard → LayoutDashboard
- Dataset → Database
- Monte Carlo → Dices
- Experiments → FlaskConical
- Accuracy → Target
- History → History
- About Method → BookOpen

---

# 6. Dashboard

Dashboard adalah halaman pertama setelah aplikasi dibuka.

Tujuannya memberikan ringkasan dataset dan akses cepat menjalankan prediksi.

---

## Dashboard Header

```text
Flight Fare Prediction Dashboard

Explore historical airline fares and run Monte Carlo simulations
to estimate possible ticket price distributions.
```

Di kanan:

```text
[ Run New Simulation ]
```

---

## Statistik Utama

Empat KPI cards:

### Total Records
`300,153`

### Airlines
jumlah maskapai unik.

### Routes
jumlah kombinasi source_city → destination_city.

### Average Price
rata-rata seluruh harga dataset.

Contoh:

```text
300,153
Total Records

6
Airlines

30
Routes

₹20,889
Average Price
```

Tambahkan small helper text, misalnya:
- "Historical observations"
- "Available airlines"
- "Source-destination pairs"
- "Across all classes"

---

# 7. Quick Simulation

Bagian paling penting dari dashboard.

Card besar:

```text
Quick Monte Carlo Simulation
```

Form:

```text
Source City
[ Delhi ▼ ]

Destination City
[ Mumbai ▼ ]

Class
[ Economy ▼ ]

Days Before Departure
[ 7 ]

Number of Simulations
[ 10,000 ▼ ]
```

Preset jumlah simulasi:
- 100
- 1,000
- 10,000
- 100,000

Button:

```text
[ Run Monte Carlo Simulation ]
```

Validation:
- source dan destination tidak boleh sama,
- simulations minimal 100,
- days_left harus berada dalam rentang dataset.

---

# 8. Preview Result di Dashboard

Setelah simulasi selesai, tampilkan quick result.

Empat metric cards:

```text
Expected Price
₹9,850

Median Price
₹9,620

Minimum Simulation
₹5,100

Maximum Simulation
₹18,700
```

Di bawahnya ada:

## Price Distribution

Histogram hasil Monte Carlo.

X-axis:
`Ticket Price`

Y-axis:
`Simulation Frequency`

Tambahkan garis vertikal untuk:
- expected price,
- median.

---

# 9. Probability Summary

Card:

```text
Probability Range
```

Contoh:

```text
Below ₹7,000        12.4%
₹7,000 – ₹10,000    51.7%
₹10,000 – ₹15,000   29.3%
Above ₹15,000        6.6%
```

Visual:
horizontal probability bars.

---

# 10. Dataset Page

Halaman untuk menjelaskan data yang digunakan.

Header:

```text
Dataset Explorer
```

Summary cards:
- total records,
- missing values,
- airlines,
- cities,
- economy records,
- business records.

---

## Dataset Table

Kolom:

```text
Airline
Flight
Source
Destination
Class
Departure
Arrival
Stops
Duration
Days Left
Price
```

Fitur:
- search,
- pagination,
- filter,
- sort,
- rows per page.

Filter:
- Airline
- Source City
- Destination City
- Class
- Days Left
- Price Range

---

## Dataset Distribution

Charts:

### Price by Class
Economy vs Business.

### Average Price by Airline

### Average Price by Days Left

Grafik `days_left` harus menjadi visual utama karena sangat relevan terhadap perubahan harga tiket.

---

# 11. Monte Carlo Page

Ini adalah halaman inti aplikasi.

Gunakan stepper di bagian atas:

```text
1. Input Data
2. Probability
3. Random Numbers
4. Simulation
5. Result
```

---

# 12. Step 1 — Input Data

Panel kiri:

```text
Simulation Parameters
```

Field:

```text
Source City
Destination City
Class
Days Before Departure
Simulation Count
```

Tambahkan opsi:

```text
Days Tolerance
± 0
± 1
± 3
± 5
```

Contoh:

`days_left = 7 ± 1`

berarti sistem dapat memakai data historis hari 6–8 untuk mendapatkan sampel lebih banyak.

---

## Historical Sample Summary

Panel kanan:

```text
Matched Historical Data

Records     842
Average     ₹9,927
Minimum     ₹5,420
Maximum     ₹18,930
Std Dev     ₹2,114
```

Tambahkan pesan jika sampel terlalu kecil:

```text
Low sample size.
Consider increasing the Days Tolerance.
```

---

# 13. Step 2 — Distribusi Frekuensi dan Probabilitas

Tampilkan tabel:

```text
Price Range
Frequency
Probability
Cumulative Probability
Random Interval
```

Contoh:

```text
₹5,000–7,000
102
0.1211
0.1211
0000–1210

₹7,001–9,000
240
0.2850
0.4061
1211–4060
```

Tambahkan grafik:
- histogram historical price distribution,
- cumulative probability chart.

---

# 14. Step 3 — Random Number Process

Halaman ini penting untuk menunjukkan proses Monte Carlo secara transparan.

Cards:

```text
Random Generator
Pseudo Random Number Generator
Range: 0000–9999
Seed: Auto
```

Button:

```text
Generate Sample
```

Tampilkan 10–20 random number contoh:

```text
Random     Interval       Predicted Range
1834       1211–4060      ₹7,001–9,000
7241       6540–8120      ₹10,001–12,000
...
```

Tambahkan visual flow:

```text
Random Number
      ↓
Probability Interval
      ↓
Price Range
      ↓
Sampled Price
```

---

# 15. Step 4 — Experiment

Bagian eksperimen menjalankan simulasi Monte Carlo.

Header:

```text
Monte Carlo Experiment
```

Info:

```text
Route
Delhi → Mumbai

Class
Economy

Days Left
7

Historical Samples
842

Simulations
10,000
```

Progress bar saat simulasi dijalankan.

Setelah selesai:

```text
Simulation Completed
10,000 iterations
```

---

# 16. Step 5 — Prediction Result

Hero result:

```text
Estimated Ticket Price
₹9,850
```

Supporting text:

```text
Based on 10,000 Monte Carlo simulations
for Delhi → Mumbai, Economy, 7 days before departure.
```

---

## Prediction Metrics

Cards:

```text
Expected Price
₹9,850

Median
₹9,620

P25
₹8,100

P75
₹11,200
```

Tambahkan:

```text
Minimum
Maximum
Standard Deviation
95% Simulation Interval
```

Contoh:

```text
95% Simulation Interval
₹6,800 – ₹14,900
```

---

# 17. Distribution Visualization

Grafik terbesar di halaman hasil:

```text
Monte Carlo Price Distribution
```

Histogram.

Tambahkan markers:
- mean,
- median,
- P25,
- P75.

---

# 18. Probability Insights

Contoh:

```text
Probability Insights

Price below ₹8,000
18.2%

Price below ₹10,000
57.4%

Price above ₹15,000
5.8%
```

---

# 19. Experiment Comparison

User dapat membandingkan beberapa jumlah simulasi:

```text
100
1,000
10,000
100,000
```

Table:

```text
Iterations | Mean | Median | Std Dev | Runtime
100        | ...
1,000      | ...
10,000     | ...
100,000    | ...
```

Visual:
line chart convergence.

X:
Number of Iterations

Y:
Estimated Mean Price

Tujuannya menunjukkan bahwa hasil simulasi semakin stabil ketika jumlah iterasi bertambah.

---

# 20. Accuracy Page

Halaman khusus evaluasi model.

Header:

```text
Prediction Accuracy
```

Penjelasan kecil:

```text
Evaluate Monte Carlo predictions against reserved historical test data.
```

---

## Train-Test Configuration

```text
Training Data
80%

Testing Data
20%
```

Tambahkan informasi jumlah record.

---

## Accuracy Metrics

Cards:

```text
MAE
₹1,324

MAPE
11.8%

RMSE
₹1,762

Test Samples
12,450
```

Jangan hanya menampilkan "Accuracy = 100 - MAPE".

MAPE tetap menjadi metrik utama.

---

## Actual vs Predicted

Scatter plot:

X:
Actual Price

Y:
Predicted Price

Tambahkan diagonal reference line.

---

## Error Distribution

Histogram:

```text
Prediction Error
Actual - Predicted
```

---

## Accuracy by Route

Table:

```text
Route
Class
Samples
MAE
MAPE
RMSE
```

Contoh:

```text
Delhi → Mumbai
Economy
320
₹1,130
10.2%
₹1,510
```

---

# 21. Experiments Page

Menyimpan riwayat eksperimen.

Table:

```text
ID
Route
Class
Days Left
Iterations
Expected Price
MAPE
Created At
Action
```

Actions:
- View
- Compare
- Delete

---

# 22. Experiment Detail

Detail satu eksperimen.

Tampilkan:
- parameter input,
- historical subset,
- probability distribution,
- random number sample,
- hasil simulasi,
- charts,
- metrics,
- accuracy.

Button:

```text
Run Again
Duplicate Experiment
Export Result
```

---

# 23. History Page

Jika diperlukan, History bisa digabung dengan Experiments.

Jika dipisah:

History berisi aktivitas:

```text
Simulation executed
Dataset imported
Accuracy test executed
Experiment deleted
```

Tidak wajib untuk MVP.

---

# 24. About Method

Halaman edukasi untuk menjelaskan Monte Carlo.

Sections:

```text
What is Monte Carlo Simulation?
```

```text
How This Application Works
```

Flow diagram:

```text
Historical Data
      ↓
Frequency Distribution
      ↓
Probability
      ↓
Cumulative Probability
      ↓
Random Number Interval
      ↓
Random Sampling
      ↓
Thousands of Experiments
      ↓
Prediction Distribution
```

Tambahkan formula:

```text
P(x) = f(x) / Σf
```

MAE:

```text
MAE = 1/n Σ |Actual - Predicted|
```

MAPE:

```text
MAPE = 100/n Σ |(Actual - Predicted) / Actual|
```

RMSE:

```text
RMSE = √(1/n Σ(Actual - Predicted)²)
```

Halaman ini berguna saat aplikasi dipresentasikan ke dosen.

---

# 25. Supabase Data Model — Draft

Belum perlu diimplementasikan pada tahap desain, tetapi UI sebaiknya mendukung struktur berikut.

## `flight_prices`

```text
id
airline
flight
source_city
departure_time
stops
arrival_time
destination_city
class
duration
days_left
price
created_at
```

## `simulations`

```text
id
source_city
destination_city
class
days_left
days_tolerance
iteration_count
historical_sample_count
mean_price
median_price
minimum_price
maximum_price
std_deviation
created_at
```

## `simulation_results`

```text
id
simulation_id
iteration
random_number
price_range
simulated_price
```

Tidak perlu menyimpan seluruh 100,000 hasil simulasi jika tidak dibutuhkan.

Untuk produksi lebih efisien, simpan:
- ringkasan hasil,
- bucket distribusi,
- sample random numbers.

## `accuracy_tests`

```text
id
simulation_id
test_samples
mae
mape
rmse
created_at
```

---

# 26. MVP Priority

Untuk versi pertama, fokus hanya pada:

1. Dashboard
2. Dataset Explorer
3. Monte Carlo Simulation
4. Prediction Result
5. Accuracy
6. Experiment History

Tidak perlu dahulu:
- login,
- role,
- admin panel,
- upload dataset oleh user,
- mobile app native,
- notification,
- payment.

---

# 27. Responsiveness

Prioritas:

1. Desktop / Laptop
2. Tablet
3. Mobile

Dashboard desktop menggunakan 12-column grid.

Di mobile:
- sidebar berubah menjadi drawer,
- KPI cards menjadi 2 columns,
- charts full width,
- form menjadi single column.

---

# 28. UX Rules

- Jangan menyembunyikan proses Monte Carlo.
- User harus dapat melihat dari mana probabilitas berasal.
- Random numbers harus dapat ditampilkan sebagai sample.
- Hasil utama harus mudah dipahami dalam 5 detik.
- Hindari istilah statistik tanpa tooltip.
- Semua chart harus punya label dan satuan.
- Harga selalu menggunakan simbol ₹ karena dataset memakai harga India.
- Jangan menyebut output sebagai harga pasti.
- Gunakan istilah:
  - Estimated Price
  - Expected Price
  - Probability
  - Simulation Range
  - Prediction Distribution

---

# 29. Dashboard Wireframe

```text
┌────────────────────────────────────────────────────────────────────┐
│ AeroCast                                      Dataset: 300K records │
├───────────────┬────────────────────────────────────────────────────┤
│ Dashboard     │ Flight Fare Prediction Dashboard                  │
│ Dataset       │                                                    │
│ Monte Carlo   │ [300K] [6 Airlines] [30 Routes] [₹ Avg Price]     │
│ Experiments   │                                                    │
│ Accuracy      │ ┌───────────────────────────────────────────────┐  │
│ About         │ │ Quick Monte Carlo Simulation                  │  │
│               │ │                                               │  │
│               │ │ From     To       Class      Days Left       │  │
│               │ │ Delhi    Mumbai   Economy    7               │  │
│               │ │                                               │  │
│               │ │ Simulations: 10,000                          │  │
│               │ │                     [ Run Simulation ]        │  │
│               │ └───────────────────────────────────────────────┘  │
│               │                                                    │
│               │ [Expected] [Median] [Minimum] [Maximum]           │
│               │                                                    │
│               │ ┌────────────────────┐ ┌──────────────────────┐   │
│               │ │ Price Distribution│ │ Probability Summary  │   │
│               │ │                    │ │                      │   │
│               │ │ Histogram          │ │ Progress Bars        │   │
│               │ │                    │ │                      │   │
│               │ └────────────────────┘ └──────────────────────┘   │
└───────────────┴────────────────────────────────────────────────────┘
```

---

# 30. Prompt untuk Google Stitch

Gunakan prompt berikut sebagai prompt utama.

## Stitch Prompt

Design a complete modern responsive web application UI called **AeroCast — Monte Carlo Flight Fare Forecasting**.

This is NOT an airline booking website. It is a professional data analytics and simulation dashboard used to analyze historical airline ticket prices and predict possible future price distributions using Monte Carlo simulation.

The application will later be built using **React.js, Next.js, TypeScript, Tailwind CSS, shadcn/ui, charts, and Supabase**. For now, focus only on the UI/UX design and dashboard experience.

Use a clean professional light theme with:
- off-white/slate background,
- white cards,
- subtle borders,
- soft shadows,
- rounded corners,
- blue and indigo as the main accent colors,
- modern typography,
- generous spacing,
- clean analytics-dashboard visual language.

Do not make it look like Traveloka, Expedia, airline booking, or an e-commerce travel site. It should look like a modern data-science analytics platform.

Create a desktop-first responsive dashboard with a left sidebar and top navigation.

### Application identity

Product name:
**AeroCast**

Subtitle:
**Monte Carlo Fare Forecasting**

Use a minimal airplane + analytics/chart inspired logo.

### Sidebar navigation

Include:
- Dashboard
- Dataset
- Monte Carlo
- Experiments
- Accuracy
- About Method

Use simple outline icons.

---

## Dashboard Page

Create a page titled:

**Flight Fare Prediction Dashboard**

Subtitle:

"Explore historical airline fares and run Monte Carlo simulations to estimate possible ticket price distributions."

At the top show four KPI cards:

1. Total Records — 300,153
2. Airlines — 6
3. Routes — 30
4. Average Price — ₹20,889

Each KPI card should have a small icon, primary metric, label, and subtle helper text.

---

## Quick Monte Carlo Simulation

Create a large main card titled:

**Quick Monte Carlo Simulation**

Include form controls:

- Source City — dropdown, example Delhi
- Destination City — dropdown, example Mumbai
- Class — Economy / Business
- Days Before Departure — numeric input, example 7
- Number of Simulations — dropdown:
  - 100
  - 1,000
  - 10,000
  - 100,000

Add a strong blue primary button:

**Run Monte Carlo Simulation**

Make the form compact and professional, suitable for an analytics dashboard.

---

## Prediction Summary

Below the simulation form show four metric cards:

- Expected Price — ₹9,850
- Median Price — ₹9,620
- Minimum Simulation — ₹5,100
- Maximum Simulation — ₹18,700

---

## Main Dashboard Charts

Create a two-column section.

Left side:
**Monte Carlo Price Distribution**

Display a professional histogram representing 10,000 simulated ticket prices.

X axis:
Ticket Price

Y axis:
Frequency

Include vertical markers for:
- Mean
- Median

Right side:
**Probability Summary**

Show horizontal probability bars:

- Below ₹7,000 — 12.4%
- ₹7,000 – ₹10,000 — 51.7%
- ₹10,000 – ₹15,000 — 29.3%
- Above ₹15,000 — 6.6%

---

## Dataset Page

Create a page named:

**Dataset Explorer**

At the top show summary cards:
- Total Records
- Airlines
- Cities
- Routes
- Economy Records
- Business Records

Create a large filterable data table.

Columns:
- Airline
- Flight
- Source
- Destination
- Class
- Departure
- Arrival
- Stops
- Duration
- Days Left
- Price

Add:
- search,
- filter dropdowns,
- sorting,
- pagination.

Below or above the table create analytics charts:

1. Average Price by Days Before Departure
2. Average Price by Airline
3. Economy vs Business Price Distribution

The "Price by Days Before Departure" chart should be visually prominent.

---

## Monte Carlo Page

Create a detailed simulation workflow page.

At the top use a horizontal stepper:

1. Input Data
2. Probability
3. Random Numbers
4. Simulation
5. Result

### Input Data Step

Left side:
Simulation Parameters form.

Fields:
- Source City
- Destination City
- Class
- Days Before Departure
- Days Tolerance
- Simulation Count

Right side:
Historical Sample Summary.

Show:
- Matched Records — 842
- Average — ₹9,927
- Minimum — ₹5,420
- Maximum — ₹18,930
- Standard Deviation — ₹2,114

---

## Probability Step

Display a large table with:

- Price Range
- Frequency
- Probability
- Cumulative Probability
- Random Interval

Example rows:

₹5,000–7,000 | 102 | 0.1211 | 0.1211 | 0000–1210

₹7,001–9,000 | 240 | 0.2850 | 0.4061 | 1211–4060

Include:
- historical price histogram,
- cumulative probability chart.

Make this page educational and visually clear so a student can explain the Monte Carlo process during a presentation.

---

## Random Number Step

Create a panel titled:

**Random Number Generation**

Show:

Generator:
Pseudo Random Number Generator

Range:
0000–9999

Seed:
Auto

Add a button:

**Generate Sample**

Display a table:

- Iteration
- Random Number
- Probability Interval
- Price Range
- Sampled Price

Show around 10 sample rows.

Also add a compact process visualization:

Random Number → Probability Interval → Price Range → Sampled Price

---

## Simulation Step

Create a professional experiment-running screen.

Show selected parameters:

Delhi → Mumbai
Economy
7 Days Before Departure
842 Historical Samples
10,000 Simulations

Include a progress bar and visual simulation status.

After completion show:

**Simulation Completed**
10,000 iterations processed

---

## Result Page

Create a prominent result header:

**Estimated Ticket Price**

₹9,850

Supporting text:

"Based on 10,000 Monte Carlo simulations for Delhi → Mumbai, Economy, 7 days before departure."

Create metric cards:

- Expected Price
- Median
- P25
- P75
- Minimum
- Maximum
- Standard Deviation
- 95% Simulation Interval

Create a large histogram:
**Monte Carlo Price Distribution**

Show mean, median, P25, and P75 markers.

Add Probability Insights cards:

- Probability below ₹8,000
- Probability below ₹10,000
- Probability above ₹15,000

---

## Experiments Page

Create a table of saved Monte Carlo experiments.

Columns:
- Experiment ID
- Route
- Class
- Days Left
- Iterations
- Expected Price
- MAPE
- Created At
- Actions

Actions:
- View
- Compare
- Delete

Add a primary button:

**New Experiment**

---

## Accuracy Page

Create a page titled:

**Prediction Accuracy**

Subtitle:

"Evaluate Monte Carlo predictions against reserved historical test data."

Show a Train/Test configuration card:

Training Data — 80%
Testing Data — 20%

Create four KPI cards:

- MAE — ₹1,324
- MAPE — 11.8%
- RMSE — ₹1,762
- Test Samples — 12,450

Create:

1. Actual vs Predicted scatter plot
2. Prediction Error histogram
3. Accuracy by Route table

Accuracy by Route table columns:
- Route
- Class
- Samples
- MAE
- MAPE
- RMSE

---

## About Method Page

Create an educational page titled:

**Monte Carlo Simulation Method**

Explain the process visually using this flow:

Historical Data
→ Frequency Distribution
→ Probability
→ Cumulative Probability
→ Random Number Interval
→ Random Sampling
→ Thousands of Simulations
→ Prediction Distribution

Include formula cards for:
- Probability
- MAE
- MAPE
- RMSE

Keep formulas readable and presentation-friendly.

---

## UI Requirements

- Desktop-first but responsive.
- 12-column dashboard grid.
- Sidebar collapses into a drawer on mobile.
- Use modern charts with clear labels.
- Never hide the Monte Carlo calculation process.
- Keep important values easy to scan.
- Use tooltips for statistical terms.
- Always display prices using ₹.
- Avoid claiming a guaranteed future price.
- Use terminology such as:
  - Estimated Price
  - Expected Price
  - Simulation Range
  - Probability
  - Prediction Distribution
- Include realistic mock data.
- Keep spacing and card hierarchy consistent.
- Make the UI suitable for a university software engineering / simulation project presentation.

Generate all major screens with a consistent design system and reusable component style.
