# Survey Report & Risk Grading — Property Risk Management

Aplikasi web internal profesional untuk mengelola survei risiko properti, peninjauan teknis *Risk Engineering*, dan keputusan akseptasi *Underwriting*, dibangun dengan **Next.js (App Router) + TypeScript + SQLite + Prisma**.

---

## 🌟 Fitur Utama

1. **Autentikasi & Role-Based Access Control (RBAC)**:
   - Sesi berbasis token JWT HttpOnly yang aman (`jose`).
   - 4 Role pengguna: **Surveyor**, **Risk Engineering**, **Underwriter**, dan **Super Admin**.
   - Otorisasi ketat di sisi server (Server Actions & Route Handlers).

2. **Katalog Formulir Lengkap (208 Pertanyaan & 12 Bagian)**:
   - Ditranskripsikan secara komprehensif dari `survey report percobaan.html`.
   - **Bagian A — Informasi Umum Survey**: Data tertanggung, alamat, kode pos (5 digit), koordinat GPS, TSI, tanggal, cabang.
   - **Bagian B — Survey Umum**: Karyawan, jam operasional, rencana ekspansi.
   - **Bagian C — Survey Khusus Okupansi**:
     - *Pabrik / Manufaktur*: Bahan baku, proses produksi, produk akhir, mesin utama, sistem penyimpanan.
     - *Gudang*: Klasifikasi komoditas, kepemilikan, 22 pertanyaan mendalam khusus Gudang Tembakau (asal, kemasan, rotasi tumpukan, suhu stok, ventilasi, foto), cold storage, forklift charging, lampu merkuri.
     - *Commercial / Residential*: Sub-tipe (Perkantoran, F&B / Restoran, Hotel, Rumah Sakit dengan peralatan medis bernilai tinggi, Apartemen, Data Center dengan 31 pertanyaan terstruktur).
     - *Lainnya*: Catatan khusus usaha.
   - **Bagian D — Upload Dokumen & Foto**: Foto tampak depan/samping/dalam, site layout, layout proteksi, permit kerja panas.
   - **Bagian E — Management**: 5 checklist utama (`m1`, `m2`, `m3`, `m4`, `m7`), riwayat klaim, perbaikan klaim, rekomendasi Aswata.
   - **Bagian F — Construction**: Kelas 1–3 konstruksi beton/baja/kayu, jumlah lantai, sandwich panel, ACP.
   - **Bagian G — Occupancy**: Lookup 365 referensi kode okupansi Aswata dengan autofill skor dan kategori hazard.
   - **Bagian H — Protection**: Penilaian berbobot APAR (25%), Hidran (30%), Detektor (25%), Sprinkler (10%), Pemadam Publik (10%), serta deteksi otomatis hidran wajib.
   - **Bagian I — Exposure**: Penilaian jarak dan fasilitas sekitar.
   - **Bagian J — Natural Hazards**: Kombinasi Gempa (zona 1–5), Banjir (5 kriteria), dan Petir.
   - **Bagian K — Loss Estimate & Other Perils**: Pemisah bangunan, jumlah bangunan, risiko khusus.
   - **Bagian L — Hasil Risk Grading**: Kalkulasi otomatis skor 55 poin, rating Good/Average/Marginal/Poor, dan rekomendasi surveyor.

3. **Penyimpanan Draft & Workflow Mutlak**:
   - **Simpan Draft**: Bebas menyimpan kapan pun tanpa memaksakan validasi wajib.
   - **Kirim untuk Review**: Validasi komprehensif seluruh kolom wajib dan aturan kondisional sebelum mengubah status menjadi `SUBMITTED`.
   - **Review Teknis**: Risk Engineering menyetujui (`RISK_APPROVED`) atau meminta revisi (`REVISION_REQUIRED`) dengan catatan alasan wajib.
   - **Keputusan Underwriting**: Underwriter mencatat keputusan akseptasi (*Layak dicover*, *Layak dengan syarat*, *Perlu review lebih lanjut*, atau *Tidak layak dicover*) hingga status `COMPLETED`.

4. **Super Admin Console**:
   - Manajemen User (CRUD, reset password, aktivasi/nonaktif).
   - Pengaturan Cabang perusahaan.
   - Form Builder berversi untuk mengelola label, help text, status required, dan kondisi tampil.
   - Audit Log real-time melacak setiap login, modifikasi data, submit, dan review.

---

## 👥 Akun Uji Coba Cepat (Testing Credentials)

Akun berikut dibuat otomatis melalui *seed script*. Password development seragam: **`SurveyDev!2026`**

| Role | Nama Pengguna | Email | Password |
|---|---|---|---|
| **Super Admin** | Admin Survey | `admin.survey@example.test` | `SurveyDev!2026` |
| **Surveyor** | Budi Surveyor | `surveyor@example.test` | `SurveyDev!2026` |
| **Risk Engineering** | Rina Risk Engineering | `risk.engineering@example.test` | `SurveyDev!2026` |
| **Underwriter** | Andi Underwriter | `underwriter@example.test` | `SurveyDev!2026` |

> *Catatan Keamanan*: Kredensial ini khusus untuk lingkungan pengembangan lokal. Pada production, password wajib diganti sebelum rilis.

---

## 🚀 Cara Menjalankan Aplikasi

### 1. Prasyarat
- Node.js versi 18+ atau 22+
- npm

### 2. Instalasi Dependensi
```bash
npm install
```

### 3. Setup Database SQLite & Seeding
```bash
# Sinkronkan schema database SQLite (dev.db)
npm run db:push

# Jalankan idempotent seed (membuat cabang, akun pengujian, dan 208 pertanyaan v1.0)
npm run db:seed
```

### 4. Menjalankan Server Pengembangan
```bash
npm run dev
```
Akses aplikasi melalui browser di **`http://localhost:3000`**.

---

## 📁 Struktur Direktori Penting

```
survey-report/
├── prisma/
│   ├── schema.prisma          # Model ORM (User, Branch, Survey, Answer, Review, dll.)
│   ├── seed.ts                # Idempotent database seeder
│   ├── form_v1_data.json      # Definisi 12 bagian & 208 pertanyaan formulir v1.0
│   └── occ_breakdown.json     # 365 data referensi okupansi Aswata
├── src/
│   ├── app/                   # Next.js App Router (Halaman & Server Actions)
│   │   ├── login/             # Layar Login
│   │   ├── dashboard/         # Dashboard monitoring sesuai Role
│   │   ├── surveys/           # Detail & Form Editor Stepper survey
│   │   ├── reviews/           # Antrean Risk Engineering & Underwriting
│   │   ├── admin/             # Console Admin (Users, Branches, Form Builder, Audit Log)
│   │   └── api/               # API Upload & Occupancy Search
│   ├── components/            # UI Components (AppShell, FormEditor, ReviewPanel)
│   └── lib/                   # Domain Logic (Grading, Validation, Auth, Prisma)
├── uploads/                   # Penyimpanan file lampiran foto & dokumen lokal
├── dev.db                     # File database SQLite
└── docs/
    └── form-source-inventory.md  # Inventarisasi lengkap audit formulir sumber
```

---

## 🔒 Catatan SQLite & Batasan Deployment

- File database SQLite disimpan secara lokal di `dev.db`.
- Cocok untuk deployment single-instance / VPS (PM2, Docker) atau server lokal.
- Jika dideploy ke platform serverless multi-instance (seperti Vercel), disarankan menggunakan adapter database SQLite terkelola (Turso / LibSQL) atau PostgreSQL melalui konfigurasi Prisma DataSource tanpa mengubah kode aplikasi.
