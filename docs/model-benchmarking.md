# AeroCast Model Benchmarking

## A. Current Monte Carlo Baseline

AeroCast saat ini menggunakan **Monte Carlo Simulation** sebagai baseline (titik tolak) dalam mengeksplorasi pergerakan harga penerbangan. Metode ini bekerja melalui tahapan berikut:

1. **Input**: Parameter skenario penerbangan (Source City, Destination City, Flight Class, Days Before Departure, Days Tolerance).
2. **Historical Calibration Data**: Data historis yang ditarik dari database sesuai dengan parameter input, dan dikurangi porsi *Evaluation Set* (misal 20%). Sisanya (misal 80%) menjadi *Calibration Set*.
3. **Distribution Construction**: *Calibration Set* digunakan untuk menyusun distribusi frekuensi (histogram) berdasar Aturan Sturges (Sturges' Rule). Probabilitas setiap interval harga dihitung dari frekuensi kemunculannya.
4. **Random Sampling**: Menggunakan nilai acak tersandi (Seeded PRNG) untuk mensimulasikan ribuan iterasi probabilitas harga tiket, memilih ember (bucket) sesuai dengan kumulatif probabilitas.
5. **Expected Price**: Nilai rata-rata (mean) dari hasil ribuan sampel acak pada tahap simulasi.
6. **Prediction Interval**: Didefinisikan secara probabilistik dari persentil sampel; lazimnya persentil ke-2.5 dan ke-97.5 digunakan untuk membentuk rentang interval 95%.
7. **Evaluation Process**: Mengukur kualitas rentang prediksi dan estimasi *Expected Price* tersebut menggunakan sisa *Evaluation Set* yang tidak pernah dilihat oleh Monte Carlo.

## B. Accuracy Metrics

Semua eksperimen dievaluasi dengan menggunakan rumusan error yang deterministik dan matematis murni.
Semua metrik dievaluasi pada tiap baris di *Evaluation Set*, lalu dirata-rata.

- **MAE (Mean Absolute Error)**: `mean(|Predicted - Actual|)`
- **MAPE (Mean Absolute Percentage Error)**: `mean(|(Predicted - Actual) / Actual|) * 100%`. Kasus `Actual = 0` tidak diizinkan mendisrupsi komputasi; nilainya diamankan dengan fallback 0.
- **RMSE (Root Mean Squared Error)**: `sqrt(mean((Predicted - Actual)^2))`
- **Bias (Mean Error)**: `mean(Predicted - Actual)`
- **Interval Coverage**: Persentase dari data *Evaluation* yang harga riilnya jatuh di dalam Prediction Interval `[P2.5, P97.5]`.
- **Interval Width**: Jarak absolut antara batas atas dan batas bawah dari interval simulasi (`P97.5 - P2.5`).

*Catatan: Metode prediksi titik tunggal murni (seperti Mean historis atau Median historis) tidak memiliki variansi probabilistik, sehingga **tidak memiliki Interval Coverage maupun Interval Width**.*

## C. Data Split

Pemisahan data sangat kritikal untuk mencegah **Data Leakage** (di mana model menguji performanya pada data yang dia hafal). AeroCast melakukan pemisahan ini secara deterministik.

- **Calibration Ratio**: Proporsi (contoh 0.8 / 80%) data yang dialokasikan untuk mempelajari distribusi historis.
- **Evaluation Ratio**: Sisa proporsi (contoh 0.2 / 20%) data yang diamati ketepatannya terhadap estimasi simulasi.
- **Split Seed**: Nilai integer deterministik untuk modul pengacak urutan Array. Ini menjamin alokasi *Calibration* dan *Evaluation* selalu jatuh di data yang sama persis bila skenarionya berulang.
- **Monte Carlo Seed**: Nilai integer untuk modul pengacak angka probabilitas pada mesin Monte Carlo. Berpengaruh ke variasi *simulation buckets*, tidak berpengaruh pada pembagian set kalibrasi dan evaluasi.
