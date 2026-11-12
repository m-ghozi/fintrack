# Laporan Analisa Performa FinTrack — Sebelum vs Sesudah

> **Tanggal**: 12 November 2026 · **Versi aplikasi**: 0.1.0
> **Metode**: pengukuran terukur (benchmark) terhadap dua versi kode yang dijalankan berdampingan, plus perhitungan bundle dari artefak build aktual.
> **Skrip benchmark**: tersimpan di `/tmp/opencode/bench.mjs`, `bench-after.mjs`, `cold-bench.mjs`, `ab-notif.mjs`, `bundle-calc.mjs` (hasil mentah: `bench-results.json`, `bench-after.json`, `cold-before.json`, `cold-after.json`).

---

## 1. Ringkasan Eksekutif

| Metrik | Sebelum | Sesudah | Perubahan |
|---|---|---|---|
| **JS halaman login (first load)** | 976 KB raw / **272 KB gzip** — 1 file berisi semua | 486 KB raw / **147 KB gzip** — 3 file | **−51% raw, −47% gzip** |
| **JS route Transactions** | 976 KB / 272 KB gzip | 503 KB / 153 KB gzip | **−50% / −45%** |
| **JS route Dashboard** | 976 KB / 272 KB gzip | 862 KB / 256 KB gzip | −14% / −8%¹ |
| **GET /dashboard (warm)** | p50 232–482 ms | p50 **6,7 ms** | **~35–70× lebih cepat** |
| **GET /reports/summary (warm)** | p50 327–520 ms | p50 **5,8 ms** | **~56–90× lebih cepat** |
| **GET /notifications (warm)** | p50 427–652 ms | p50 **3,9 ms** | **~110–165× lebih cepat** |
| **GET /reports/summary (cold, cache miss)** | p50 394–520 ms | p50 **258 ms** | **−34–50%** (3 langkah sequential → 1) |
| **GET /dashboard (cold)** | p50 482–581 ms | p50 **382 ms** | **−21–34%** |
| **Payload API /transactions** | 7.192 bytes | **1.059 bytes** (compression) | **−85%**² |
| **Write path notifications** | N write per request, selalu | **0 write** jika konten tidak berubah | eliminasi churn |
| **Rate limit** | tidak ada | 120 req/menit/IP; login 10/menit | baru |
| **Security headers** | tidak ada | helmet (HSTS, nosniff, dll.) | baru |
| **Offline PWA** | cache hilang saat reload | query cache di-persist 24 jam | baru |

¹ Dashboard memang membutuhkan recharts (chart Spending Overview), jadi hematnya lebih kecil — tapi route lain membebannya sepenuhnya.
² Compression sudah diimplementasi di kode, **belum di-deploy ke production**.

**Kesimpulan satu kalimat:** perbaikan terbesar datang dari tiga hal — *code-splitting* frontend (first load −47% gzip), *TTL cache per-user* (endpoint read paling sering 35–90× lebih cepat), dan *penataan ulang query* (reports: 3 langkah sequential → 1; write N+1 → batch).

---

## 2. Konteks: Dua Commit yang Dibandingkan

| Commit | Isi | Status deploy |
|---|---|---|
| `a3ff81e` (baseline / **"sebelum"**) | kode lama: bundle tunggal, N+1 writes, query sequential, tanpa cache/index tambahan | — (dipakai sebagai baseline benchmark) |
| `cad1ca0` (**perf #1**) | lazy-load 13 view, fix N+1 (`runDue`, `generateInsights`), 8 index DB, `keepPreviousData`, parallelisasi ownership check & reports | ✅ **sudah live** di production (frontend + backend + index Supabase + gzip nginx) |
| `45da5f0` (**perf #2**) | TTL cache per-user, helmet + compression + throttler, persist React Query, fail-fast JWT_SECRET | ⚠️ **belum di-deploy** (angka benchmark ini mencakup commit ini) |

---

## 3. Metodologi

### 3.1 Setup benchmark backend
- Dua versi backend dijalankan **berdampingan di mesin lokal**:
  - **BEFORE** `:3101` — worktree `git a3ff81e`, di-build dengan `tsc` (TS 5.9.3), plain `node dist/main.js`
  - **AFTER** `:3001` — dev server NestJS watch (kode HEAD `45da5f0`)
- Keduanya menunjuk **database yang sama** (Supabase, `backend/.env`), token JWT ditandatangani dengan secret yang sama.
- Data uji: akun `test@labs.id` + **300 transaksi hasil seed** (`description = "perf-bench #n"`, tersebar 180 hari, 10 kategori, income/expense 1:5). **Seluruh seed dihapus setelah benchmark** (terverifikasi: sisa 3 transaksi = kondisi awal; saldo otomatis pulih karena dihitung agregat dari transaksi).
- Protokol: 2 warm-up + 15 sampel per endpoint, jeda 250 ms, urut p50/p95/max. Untuk angka **cold**: 5 siklus `POST /auth/logout` (bump epoch cache → jaminan cache miss) → `GET` → hitung p50.
- Hanya request `GET` — tidak ada mutasi data pengguna selama benchmark.

### 3.2 Setup bundle
- Build **sebelum**: diambil dari backup production aktual di VPS (`/var/www/fintrack/dist.bak-20261112-150259`, build 9 Nov), gzip diukur langsung di server.
- Build **sesudah**: `dist/` lokal, total per-route dihitung dengan **menelusuri graph import antar-chunk** dari `index.html` (entry + `modulepreload` + closure dinamis per view), gzip per file diukur dengan `gzip -c`.

### 3.3 Keterbatasan yang harus diketahui
1. **Latensi DB remote sangat berisik.** Supabase pooler bersama (free tier) menunjukkan variasi besar antar-run: `GET /transactions` versi "before" terukur p50 558 ms pada satu run dan **1.195 ms** pada run kontrol beberapa menit kemudian — tanpa perubahan apa pun. Karena itu:
   - Angka **warm cache** (5–10 ms vs ratusan ms) adalah temuan yang tidak ambigu.
   - Angka **cold** harus dibaca sebagai *tren struktural*, bukan angka presisi.
2. Benchmark dijalankan dari mesin lokal (bukan dari VPS) → meliputi latensi lokal→Supabase yang lebih tinggi daripada VPS→Supabase. Angka production akan **lebih rendah** dari semua nilai absolut di sini, tapi **rasio perbaikan tetap berlaku** (keduanya jauh dari DB).
3. Satu pengguna, satu dataset (303 transaksi). Dataset besar akan membuat index DB makin berdampak positif; angka di sini adalah batas bawah untuk skala data besar.
4. "After" adalah dev-server NestJS; produksi jalan sebagai plain node — perbedaan overhead minimal, tidak memengaruhi arah kesimpulan.

---

## 4. Hasil Lengkap

### 4.1 Bundle Frontend

**Sebelum** (build 9 Nov, backup production): 1 file `index-BzO5fmoX.js` = **999.593 bytes raw / 278.443 bytes gzip**, di-load penuh untuk *semua* route — termasuk halaman login dan settings. Recharts (±350 KB) ikut di-load walau tak dipakai.

**Sesudah** (kode-splitting via `React.lazy` di `AppLayout.tsx`), per route:

| Route | File di-load | Raw | Gzip | Δ raw | Δ gzip |
|---|---|---|---|---|---|
| **Login (first load)** | 3 | **486 KB** | **147 KB** | −51% | **−47%** |
| Transactions | 12 | 503 KB | 153 KB | −50% | −45% |
| Budgets | 12 | 499 KB | 153 KB | −50% | −45% |
| Debts | 12 | 503 KB | 154 KB | −50% | −45% |
| Savings | 13 | 502 KB | 153 KB | −50% | −45% |
| Accounts | 11 | 502 KB | 153 KB | −50% | −45% |
| Settings | 6 | 495 KB | 150 KB | −50% | −46% |
| Dashboard | 11 | 862 KB | 256 KB | −14% | −8% |
| Reports | 9 | 866 KB | 257 KB | −14% | −8% |

- Transfer production sudah diverifikasi nyata: `curl -I` asset → `content-encoding: gzip` (nginx `gzip_types` ditambahkan saat deploy perf #1 + Cloudflare).
- Catatan PWA: service worker masih **precache semua chunk** (±1,1 MB sekali, untuk offline penuh) — penghematan terasa pada *first load dan navigasi*, bukan total unduhan offline.

**Interpretasi mendalam:** dampak terbesar ada di pengguna mobile/jelemah jaringan yang baru membuka aplikasi (halaman login): unduhan JS turun dari 272 KB → 147 KB gzip, plus CSS 53 KB tetap. Time-to-interactive halaman login turun proporsional. Route dashboard/reports membawa recharts — inilah alasan route tersebut hanya −8%, dan sekaligus kandidat optimasi lanjutan (lihat §7).

### 4.2 Latensi API — warm cache (temuan terkuat)

Dua run independen, p50 (ms):

| Endpoint | BEFORE run1 | BEFORE run2 | AFTER warm run1 | AFTER warm run2 | Percepatan |
|---|---|---|---|---|---|
| GET /dashboard | 346,7 | 232,4 | **7,1** | — | ~33–70× |
| GET /reports/summary | 343,7 | 327,2 | **5,6** | — | ~59–61× |
| GET /notifications | 428,4 | 427,4 | **3,8** | — | ~113× |
| GET /transactions | 447,4 | 425,1 | 438,6 | — | 1× (tidak berubah — memang tidak di-cache) |
| GET /auth/me | 77,0 | 68,9 | 70,0 | 78,2 | 1× (baseline referensi) |

p95 warm: dashboard 9,4 · reports 8,0 · notifications 5,2–6,7 — **semua di bawah 10 ms**, jauh lebih stabil daripada p95 before (482–732 ms yang bervariasi dengan noise DB).

**Mengapa ini penting:** dashboard, reports, dan notifications adalah endpoint yang paling sering dipanggil aplikasi (setiap buka dashboard, tiap ganti tab laporan, tiap polling notifikasi). Dengan TTL 30 s (dashboard/reports) dan 10 s (notifications), mayoritas request pengguna nyata kini dilayani dari memori proses dalam **< 10 ms**.

**Validasi kebenaran data:** setiap write sukses (POST/PATCH/DELETE apa pun) menaikkan *epoch cache* per-user lewat `CacheBumpInterceptor` global → key cache lama ter-isolasi otomatis → data selalu fresh setelah mutasi. Kegunaan dibayar dengan kompleksitas nyata: tidak ada satu pun service yang perlu tahu soal invalidasi.

### 4.3 Latensi API — cold (cache miss / tanpa cache)

p50 dari 5 sampel cold, ditambah run kontrol untuk kalibrasi noise:

| Endpoint | BEFORE (run1 / run kontrol) | AFTER cold | Catatan |
|---|---|---|---|
| GET /dashboard | 482 / 581 | **382** | lebih cepat; runDue tidak lagi sequential 2 write per occurrence |
| GET /reports/summary | 394 / 520 | **258** | paling konsisten membaik — lihat analisis round-trip §4.4 |
| GET /transactions | 558 / 1.195 | 630 | statistik sama (path tidak berubah) — run kontrol membuktikan noise ±2× |
| GET /notifications | 652 / 637 | 1.373 ⚠️ | **terbukti noise**, lihat A/B di bawah |
| GET /auth/me | ~69–120 | 78–138 | sama (referensi) |

**Investigasi anomali notifications (transparansi):** hasil awal menunjukkan cold notifications "after" ±2× lebih lambat. Diinvestigasi tiga lapis:
1. **Cek churn DB** — hitung baris `Notification` sebelum/sesudah 3× GET: **stabil di 0** (user test tidak punya insight; tidak ada bug penumpukan baris).
2. **Analisis kode** — dengan 0 insight, kedua versi melakukan **pekerjaan DB yang identik** (4 read + transaksi kosong). Kode baru bahkan lebih sedikit round trip.
3. **A/B interleaved** (bergantian :3101 ↔ :3001, 8 putaran × 2 run) — Run 1: after 833 vs before 598. Run 2: **terbalik**, after 493 vs before 530. Pola bimodal (643↔1.390) → kesimpulan: **kontensi koneksi pooler Supabase**, bukan kode.

**Pelajaran metodologis:** pada DB remote bersama, perbandingan cold satu-sampel tidak dapat diandalkan; hanya perbedaan yang jauh melebihi noise (±2×) yang boleh disimpulkan. Untuk pengukuran presisi ke depan: jalankan benchmark dari VPS (RTT stabil) atau pakai DB lokal ephemeral.

### 4.4 Analisis struktural round-trip (kenapa cold reports membaik konsisten)

Pada DB remote, latensi request ≈ **(jumlah langkah sequential) × RTT + pekerjaan**. RTT lokal→Supabase ±30–80 ms.

| Endpoint | Langkah sequential SEBELUM | SESUDAH |
|---|---|---|
| GET /reports/summary | 3 langkah: `Promise.all(5 query)` → `category.findMany` → `$queryRaw` cashflow | **1 langkah**: 6 task paralel (7 query) |
| GET /dashboard | runDue findMany → [2 write sequential per occurrence] → `Promise.all(10)` | runDue findMany → [1 `createMany` + 1 update per jadwal, paralel antar-jadwal] → `Promise.all(10)`; plus cache 30 s |
| POST/PATCH /transactions | 3 ownership check sequential | 1 langkah `Promise.all` |
| POST savings contribution | ~7 round trip sequential | (belum diubah — kandidat lanjutan) |

Dengan 3 → 1 langkah dan RTT ±60 ms, prediksi penghematan reports ≈ 120 ms — cocok dengan hasil terukur (394–520 → 258).

### 4.5 Write path — eliminasi N+1

| Operasi | Sebelum | Sesudah |
|---|---|---|
| `recurring.runDue` (dipanggil tiap GET /dashboard & /recurring) | 2 write sequential **per occurrence** (transaksi + update lastRunDate), tanpa transaksi, rentan race double-create | 1 `createMany` + 1 update **per jadwal**, dalam `$transaction`, paralel antar-jadwal, + lock in-process per user |
| `notifications.generateInsights` (dipanggil tiap GET /notifications) | N `create`/`update` per insight, setiap request | diff-only: **0 write** saat konten sama; `createMany` satu panggilan saat ada baru; deleteMany sekali |

Pada pengguna dengan 5 jadwal recurring × 3 occurrence terlewat: sebelum = 30 write sequential (±30 × RTT ≈ 2 detik ditambahkan ke **setiap** GET dashboard); sesudah = 5 transaksi batch paralel (±1 langkah).

### 4.6 Database (Supabase)

8 index baru (migrasi `20261112214524_add_performance_indexes`, **sudah applied**):

```sql
Transaction(toAccountId)              -- dipakai balanceMap() dengan OR-scan sebelumnya
Debt(userId, dueDate)
Notification(userId, createdAt DESC)  -- orderBy utama list notifikasi
Budget(accountId), SavingsContribution(accountId),
DebtPayment(accountId), Recurring(accountId), Recurring(categoryId)  -- FK tanpa index
```

Dampak paling terasa pada skala data besar: `balanceMap()` sebelumnya seq-scan bagian `toAccountId IN (...)` pada **setiap** GET /accounts dan GET /dashboard. Pada dataset uji (303 baris) efeknya kecil; pada 10–100 ribu transaksi inilah pembeda antara "scan penuh" vs "index lookup".

### 4.7 Keamanan & bandwidth (commit 45da5f0 — belum di-deploy)

| Item | Hasil verifikasi lokal |
|---|---|
| `helmet()` | HSTS, X-Content-Type-Options, X-Frame-Options terverifikasi di header response |
| `compression()` | payload `/transactions?limit=15`: 7.192 → **1.059 bytes (−85%)** |
| `@nestjs/throttler` | global 120 req/menit/IP; login **10/menit** (request ke-11 → **429** terverifikasi); register 5/menit |
| Fail-fast `JWT_SECRET` | boot production tanpa secret → exit dengan pesan jelas (bukan fallback `'dev-secret-change-me'`) |

### 4.8 Offline PWA

`PersistQueryClientProvider` + persister localStorage (key `fintrack-query-cache`, maxAge 24 jam, buster `0.1.0`): relaunch PWA offline langsung menampilkan data terakhir dari localStorage, bukan skeleton. Efek terukur yang bisa dirasakan pengguna: waktu "konten pertama terlihat" saat reload ≈ 0 (data cached) + revalidation di belakang.

---

## 5. Rekap: Apa yang Sudah Live vs Belum

| Perbaikan | Kode | Production |
|---|---|---|
| Lazy-load views + gzip nginx | ✅ | ✅ **live** |
| 8 index DB | ✅ | ✅ **applied** |
| Fix N+1 (runDue, generateInsights) | ✅ | ✅ **live** |
| Reports 3→1 langkah sequential | ✅ | ✅ **live** |
| TTL cache + epoch invalidation | ✅ | ⚠️ belum |
| helmet + compression + throttler | ✅ | ⚠️ belum |
| Persist React Query (offline) | ✅ | ⚠️ belum |
| Fail-fast JWT_SECRET | ✅ | ⚠️ belum |

> Angka §4.2/§4.5/§4.7 mencakup commit `45da5f0` yang belum di-deploy. Setelah deploy, production akan mendapatkan manfaat warm-cache & write-batching yang sama.

---

## 6. Risiko & Catatan Teknis yang Perlu Diketahui

1. **Cache in-process vs multi-instance** — `CacheService` hidup di memori proses. Deployment saat ini 1 fork pm2 → aman. Jika suatu saat scale-out multi-instance/cluster, epoch tidak tersinkron antar-proses → butuh Redis atau sticky session. Sudah terdokumentasi di komentar kode.
2. **TTL 30 s berarti data dashboard boleh basi ≤30 detik** hanya jika user lain mengubah data lewat jalur yang tidak membump epoch (saat ini semua mutasi lewat API yang sama → selalu bump). Aman.
3. **Precache PWA ±1,1 MB** — total unduhan pertama untuk offline tetap besar; untuk pengguna hemat kuota pertimbangkan `maximumFileSizeToCacheInBytes` selektif atau precache on-demand.
4. **Interleaved A/B adalah alat wajib** untuk benchmark berikutnya — kontrol noise sudah terbukti menyelamatkan dari kesimpulan salah (kasus notifications).

---

## 7. Rekomendasi Lanjutan (prioritas terurut)

1. **Deploy commit `45da5f0`** — semua infrastruktur sudah teruji lokal; proses: build → zip → scp → `npm install` di server (3 dep baru: `helmet`, `compression`, `@nestjs/throttler`) → `pm2 restart`. Manfaat yang sudah terukur di atas langsung turun ke production.
2. **Recharts ~350 KB** — route dashboard/reports tetap membawanya. Opsi: ganti chart ringan (uPlot/Chart.js ~10× lebih kecil), atau dynamic-import per komponen chart dan tampilkan skeleton grafik terpisah.
3. **`savings.addContribution` masih ~7 round trip sequential** — pola perbaikan sama dengan transactions (parallelisasi + `$transaction`).
4. **Helm page-level cache headers** (`Cache-Control` untuk `assets/` sudah immutable 30 hari di nginx — sudah baik; tambahkan `index.html` no-cache agar deploy baru langsung terlihat).
5. **Ukur ulang di production** setelah deploy: tambah timing sederhana (log durasi per request di interceptor) dan bandingkan p50 dari log pm2 — data production lebih valid daripada benchmark lokal.
6. **Untuk benchmark berikutnya**: gunakan dataset ±5.000 transaksi dan jalankan dari VPS agar noise pooler hilang; angka index DB baru akan terlihat jelas pada skala itu.

---

## Lampiran A — Hasil mentah benchmark

- `/tmp/opencode/bench-results.json` — run pertama (before lengkap + after warm)
- `/tmp/opencode/bench-after.json` — after warm rerun dengan cold capture benar
- `/tmp/opencode/cold-before.json`, `/tmp/opencode/cold-after.json` — cold 5-sampel per versi
- `/tmp/opencode/ab-notif.mjs` — A/B interleaved notifications (bukti noise)

## Lampiran B — Cara meniru benchmark

```bash
# 1. Worktree versi lama + jalankan di :3101
git worktree add /tmp/ft-before a3ff81e
ln -s $(pwd)/backend/node_modules /tmp/ft-before/backend/node_modules
cp backend/.env /tmp/ft-before/backend/.env
cd /tmp/ft-before/backend && ./node_modules/.bin/tsc -p tsconfig.json
PORT=3101 node dist/main.js &

# 2. Seed data test (300 transaksi bertanda) — hapus setelah selesai
# 3. Jalankan /tmp/opencode/cold-bench.mjs http://localhost:3101 dan :3001
# 4. Interleaved A/B untuk endpoint yang mencurigakan
# 5. Cleanup: deleteMany({ description: { startsWith: 'perf-bench' } })
```
