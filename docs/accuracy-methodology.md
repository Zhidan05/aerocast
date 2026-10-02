# AeroCast Accuracy Evaluation Methodology

## Overview

AeroCast's core engine menggunakan **Monte Carlo simulation**. Perlu diingat bahwa Monte Carlo dalam konteks ini **bukanlah model Machine Learning** (seperti Random Forest atau Neural Network) yang memprediksi harga pasti untuk satu tiket.

Alih-alih, Monte Carlo membangun sebuah **Distribusi Probabilitas** (Probability Distribution) dari kemungkinan harga tiket masa depan berdasarkan frekuensi kemunculan harga di masa lalu untuk kondisi penerbangan yang sama (Rute, Kelas, dan Sisa Waktu).

Dokumen ini menjelaskan bagaimana kami mengevaluasi "akurasi" dari pendekatan simulasi ini.

---

## 1. Parameter Evaluasi

Untuk melakukan pengujian akurasi yang adil, kami membagi data dan melakukan simulasi menggunakan beberapa parameter kunci:

### Calibration Ratio (Rasio Kalibrasi)
Contoh: `80/20`
Ini berarti **80% data historis** digunakan untuk membentuk distribusi Monte Carlo (Calibration set), dan sisa **20% data historis** disimpan atau disembunyikan (Evaluation set). Data 20% ini sama sekali tidak digunakan untuk membentuk distribusi, melainkan digunakan di akhir untuk mengukur seberapa akurat hasil simulasi kita. Hal ini mencegah "data leakage" (kebocoran data).

### Split Seed
Angka sembarang (misal: `2026`) yang digunakan untuk memastikan pembagian 80% dan 20% di atas bersifat **deterministik** (dapat diulang). Jika Anda menggunakan Split Seed yang sama, data yang masuk ke kelompok 80% dan 20% akan persis sama setiap kali Anda menjalankan eksperimen. **Catatan:** Seed ini bukanlah parameter "pintar" model atau tingkat "akurasi", melainkan sekadar kunci pengacakan.

### Monte Carlo Seed
Angka sembarang (misal: `123456`) yang digunakan untuk mengontrol urutan bilangan acak saat mesin Monte Carlo melakukan simulasi ribuan kali (misalnya 10.000 iterasi). Dengan seed yang sama, urutan harga acak yang ditarik akan persis sama, sehingga hasil akhirnya 100% identik jika diulang. Sama seperti Split Seed, ini bukan indikator kecerdasan model, melainkan untuk *reproducibility* (keterulangan).

---

## 2. Expected Price (Harga Ekspektasi)

Monte Carlo menghasilkan sebuah **Expected Price**, yaitu nilai rata-rata (mean) dari seluruh hasil simulasi (misalnya rata-rata dari 10.000 harga yang dihasilkan). 

Karena model ini mensimulasikan "skenario harga" secara umum dan bukan menebak harga tiket per individu, maka **Expected Price adalah tebakan level-skenario yang berlaku untuk semua tiket**. Pada saat evaluasi, satu Expected Price ini akan dibandingkan dengan harga asli dari masing-masing tiket di dalam himpunan 20% Evaluation set.

---

## 3. Metrik Akurasi (Error Metrics)

Kami mengukur seberapa dekat harga ekspektasi (Expected) dengan harga riil di dunia nyata (Actual) menggunakan metrik regresi standar:

### MAE (Mean Absolute Error)
`MAE = rata-rata dari | Predicted - Actual |`
Rata-rata selisih mutlak antara harga tebakan dan harga riil. Diukur dalam satuan mata uang (₹). Semakin kecil nilainya, semakin baik.

### RMSE (Root Mean Squared Error)
`RMSE = akar dari rata-rata (Predicted - Actual)²`
Seperti MAE, tetapi error dikuadratkan sebelum dirata-rata. Hal ini membuat RMSE lebih sensitif (memberikan penalti lebih besar) jika ada kesalahan tebakan yang sangat jauh/ekstrem.

### Bias (Mean Error)
`Bias = rata-rata dari (Predicted - Actual)`
Menunjukkan kecenderungan sistematis apakah sistem kita "over-predicting" atau "under-predicting".
- **Bias Positif**: Harga tebakan rata-rata lebih mahal daripada harga asli (Sistem *overestimates*).
- **Bias Negatif**: Harga tebakan rata-rata lebih murah daripada harga asli (Sistem *underestimates*).

### MAPE (Mean Absolute Percentage Error)
`MAPE = rata-rata dari | (Predicted - Actual) / Actual | × 100%`
Rata-rata persentase kesalahan tebakan relatif terhadap harga aslinya. Semakin kecil semakin baik. *(Catatan: Nilai actual yang persis 0 akan dianggap menghasilkan MAPE 0% untuk mencegah error pembagian oleh nol, meski kasus ini jarang terjadi di harga tiket).*

---

## 4. Probabilistic Metrics (Metrik Probabilistik)

Karena Monte Carlo berbasis probabilitas, menebak tepat satu harga (point-estimate) tidaklah cukup. Kekuatan utama simulasi ini ada pada estimasi interval (rentang harga).

### 95% Simulation Interval (Interval Simulasi 95%)
Rentang harga yang memuat bagian tengah terbanyak dari hasil simulasi, diambil dari persentil ke-2.5 hingga persentil ke-97.5 dari seluruh harga simulasi: `[P2.5, P97.5]`.

### Coverage (Cakupan)
`Coverage = (Jumlah Harga Riil di Dalam Interval / Total Harga Riil Evaluasi) × 100%`
Mengukur berapa persen harga dunia nyata (dari data 20% evaluasi) yang ternyata benar-benar jatuh di dalam rentang *95% Simulation Interval*. Idealnya, distribusi yang sangat baik akan memiliki angka cakupan mendekati 95%.

### Interval Width (Lebar Interval)
`Width = P97.5 - P2.5`
Digunakan untuk menyeimbangkan Coverage. Coverage 100% tidak ada gunanya jika rentang harganya terlalu lebar (misal ₹0 hingga ₹100,000). Kita menginginkan rentang yang sesempit mungkin namun tetap mampu menangkap ~95% data asli.

---

## 5. Batasan Sistem

- **Homogeneous Expected Price**: Sistem ini memberikan tebakan tunggal untuk seluruh tiket pada satu skenario (hari H, kelas tertentu).
- **Keterbatasan Data**: Evaluasi baru bisa berjalan optimal jika data historis mencukupi (minimal 50 data untuk evaluasi).
- **Asumsi Kondisi Statis**: Simulasi menganggap bahwa frekuensi harga masa lalu masih relevan untuk masa depan. Kejadian luar biasa yang belum pernah terjadi (misal kebangkrutan maskapai) tidak akan terpantau oleh simulasi.
