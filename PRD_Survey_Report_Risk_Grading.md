# Product Requirements Document (PRD)
## Web App Survey Report & Risk Grading — Property Risk Survey

**Versi:** 1.0  
**Tanggal:** 13 Oktober 2026  
**Tujuan dokumen:** Instruksi implementasi untuk AI coding agent Antigravity.

---

## 1. Ringkasan Produk

Bangun aplikasi web internal **Survey Report & Risk Grading** untuk mengelola survei risiko properti dari pengisian lapangan sampai review Risk Engineering dan keputusan Underwriter. Aplikasi memiliki empat role: **Surveyor, Risk Engineering, Underwriter, dan Super Admin**.

Surveyor dapat membuat survey, mengisi formulir panjang secara bertahap, menyimpan draft meskipun belum lengkap, lalu melanjutkannya dari dashboard. Setelah siap, surveyor mengirimkan survey untuk direview. Risk Engineering meninjau hasil dan dapat menyetujui tahap teknis atau meminta revisi. Underwriter meninjau hasil survey/risk grading dan mencatat keputusan underwriting. Super Admin mengelola user, role, konfigurasi pertanyaan, dan seluruh data.

Gunakan **Next.js + TypeScript + SQLite** untuk versi awal. Form pertanyaan harus diturunkan dari HTML referensi yang dilampirkan (`survey report percobaan.html`), terutama form embedded berjudul **“Survey Report & Risk Grading — Property Aswata”**. Jangan menyalin login, dashboard, dummy data, atau gaya prototipe HTML sebagai desain final. Gunakan HTML sebagai sumber struktur pertanyaan, tipe input, pilihan jawaban, field kondisional, bobot, dan alur pengisian.

## 2. Tujuan dan indikator keberhasilan

### Tujuan
1. Mengubah formulir HTML menjadi aplikasi berbasis akun dengan data persisten di SQLite.
2. Memungkinkan survey disimpan sebagai draft kapan pun tanpa mewajibkan seluruh pertanyaan terisi.
3. Menyediakan alur kerja yang jelas dan dapat dilacak dari draft hingga keputusan Underwriter.
4. Membatasi data dan tindakan berdasarkan role serta kepemilikan survey.
5. Menjadikan pertanyaan dan opsi survey terkonfigurasi dari database agar dapat dikelola tanpa mengubah kode aplikasi.
6. Menampilkan hasil survey dan grading berdasarkan data yang benar-benar disimpan, bukan dummy data.

### Acceptance criteria tingkat produk
- User dapat login dengan akun dan password; role tidak boleh dipilih sendiri dari layar login.
- Surveyor dapat membuat survey, menyimpan draft dengan field kosong, keluar, login lagi, dan melanjutkan dengan jawaban sebelumnya tetap utuh.
- Tombol **Simpan Draft** tidak menjalankan validasi wajib untuk seluruh formulir.
- Tombol **Kirim untuk Review** memvalidasi field wajib dan kondisi terkait sebelum mengubah status.
- Perubahan status, catatan review, revisi, dan keputusan underwriting tercatat dengan pengguna serta waktu.
- Role tidak dapat mengakses API atau data yang bukan haknya hanya dengan mengubah URL atau request.
- Super Admin dapat menambah, mengubah, mengurutkan, menonaktifkan, dan mengelompokkan pertanyaan melalui UI admin.
- Form survey memiliki seluruh bagian dan pertanyaan yang teridentifikasi dalam HTML referensi. Tidak boleh mengganti pertanyaan dengan form generik atau hanya membuat contoh beberapa field.
- Terdapat akun uji untuk masing-masing dari empat role, dibuat melalui seed script.
- Aplikasi dapat dijalankan lokal dengan instruksi setup yang jelas.

## 3. Pengguna dan hak akses

### 3.1 Surveyor
- Melihat dashboard berisi survey yang dibuat/ditugaskan kepadanya.
- Membuat survey baru.
- Mengisi, menyimpan draft, dan melanjutkan draft miliknya.
- Melihat detail survey miliknya, termasuk status dan catatan revisi.
- Mengedit survey draft atau survey yang dikembalikan untuk revisi.
- Mengirim survey untuk review ketika validasi pengiriman terpenuhi.
- Tidak dapat menyetujui survey sendiri atau mengubah hasil review/keputusan Underwriter.
- Tidak dapat mengubah definisi pertanyaan sistem.

### 3.2 Risk Engineering
- Melihat survey yang masuk ke antrean review teknis dan survey yang pernah ditanganinya.
- Membuka seluruh jawaban, lampiran, serta ringkasan grading yang relevan.
- Menambahkan catatan review.
- Menyetujui tahap Risk Engineering atau mengembalikan survey untuk revisi dengan alasan yang wajib diisi.
- Tidak dapat mengubah jawaban Surveyor secara diam-diam. Jika ada koreksi, gunakan catatan/komentar atau alur revisi yang dapat diaudit.
- Tidak mengelola user atau definisi pertanyaan.

### 3.3 Underwriter
- Melihat survey yang telah lolos review Risk Engineering dan antrean underwriting.
- Melihat ringkasan risiko, jawaban survey, lampiran, dan hasil grading.
- Mencatat keputusan underwriting: **Layak dicover**, **Layak dicover dengan syarat/perbaikan**, **Perlu review lebih lanjut**, atau **Tidak layak dicover**.
- Menambahkan catatan/ketentuan underwriting.
- Mengembalikan kasus untuk klarifikasi/revisi bila diperlukan; alasan wajib diisi.
- Tidak dapat mengubah jawaban teknis surveyor atau konfigurasi pertanyaan.

### 3.4 Super Admin
- Memiliki akses administratif ke seluruh survey dan dashboard.
- CRUD user, aktivasi/nonaktif user, reset password, penetapan role, cabang, serta profil.
- Mengelola daftar cabang dan referensi pilihan yang relevan.
- Mengelola form: bagian, pertanyaan, label, tipe input, pilihan, urutan, wajib/tidak wajib, aturan tampil kondisional, dan status aktif.
- Melihat audit log dan riwayat perubahan.
- Admin tidak boleh mengubah histori jawaban/keputusan secara tanpa jejak. Aksi administratif tetap dicatat.

### 3.5 Prinsip otorisasi
Otorisasi harus diperiksa di server pada setiap Server Action/Route Handler/akses data, bukan hanya menyembunyikan tombol di frontend. Terapkan prinsip least privilege. User tidak aktif tidak dapat login. Semua endpoint detail harus memeriksa role dan kepemilikan/akses terhadap survey.

## 4. Alur kerja dan status survey

Gunakan status internal yang eksplisit:
1. `DRAFT` — sedang diisi; jawaban boleh belum lengkap.
2. `SUBMITTED` — dikirim Surveyor, menunggu review Risk Engineering.
3. `REVISION_REQUIRED` — dikembalikan untuk revisi; Surveyor dapat mengedit.
4. `RISK_APPROVED` — review teknis disetujui, menunggu Underwriter.
5. `UNDERWRITING_REVIEW` — sedang ditinjau Underwriter (opsional jika dibutuhkan sebagai status terpisah).
6. `COMPLETED` — keputusan underwriting final sudah dicatat.
7. `CANCELLED` — survey dibatalkan oleh role yang diizinkan, dengan alasan.

Jangan menyamakan **status workflow** dengan **hasil grading**. Status menjelaskan proses; grading menjelaskan tingkat risiko. Status dashboard dapat ditampilkan dalam bahasa Indonesia, misalnya Draft, Menunggu Review, Perlu Revisi, Disetujui Risk Engineering, Menunggu Underwriter, Selesai, dan Dibatalkan.

### Transisi utama
- Surveyor: `DRAFT → SUBMITTED`.
- Risk Engineering: `SUBMITTED → RISK_APPROVED` atau `SUBMITTED → REVISION_REQUIRED`.
- Surveyor: `REVISION_REQUIRED → SUBMITTED`.
- Underwriter: `RISK_APPROVED → COMPLETED`, atau minta klarifikasi/revisi sesuai aturan workflow.
- Super Admin dapat melakukan tindakan administratif khusus hanya dengan alasan dan audit log.

Setiap transisi status menyimpan aktor, waktu, status sebelum/sesudah, catatan, dan alasan jika ada.

## 5. Modul aplikasi

### 5.1 Autentikasi
- Halaman login dengan email/username dan password.
- Tidak ada pemilihan role saat login.
- Hash password dengan algoritma yang sesuai (misalnya Argon2id atau bcrypt melalui library yang terpelihara).
- Gunakan session/cookie `HttpOnly`, `Secure` pada production, dan `SameSite` yang tepat.
- Sediakan logout dan penanganan sesi kedaluwarsa.
- Jangan menyimpan password plaintext atau menampilkan password pada halaman user management.
- Seed akun uji menggunakan kredensial yang hanya untuk development; wajib ditandai sebagai akun testing dan dokumentasikan penggantian password sebelum deployment.

### 5.2 Dashboard
Dashboard menyesuaikan role dan hanya menghitung data yang boleh dilihat oleh user.
- Kartu ringkasan: total survey, draft, menunggu review, perlu revisi, disetujui Risk Engineering, menunggu Underwriter, selesai.
- Tabel/list survey: nomor survey/RAR jika sudah tersedia, tertanggung, cabang, okupansi, surveyor, tanggal survey, status, grading, updated at.
- Pencarian berdasarkan nama tertanggung, nomor survey/RAR, atau alamat.
- Filter status, cabang, okupansi, tanggal, surveyor, dan grading.
- Sorting dan pagination server-side.
- Surveyor: tombol **+ Survey Baru** dan aksi **Lanjutkan Draft**.
- Risk Engineering: antrean **Menunggu Review**.
- Underwriter: antrean yang sudah lolos review teknis.
- Super Admin: akses global, termasuk filter semua cabang.
- Empty state, loading state, error state, konfirmasi untuk tindakan penting, dan notifikasi sukses/gagal.
- Jangan gunakan data dummy sebagai data produksi. Seed data demo opsional harus jelas terpisah dari akun/data inti.

### 5.3 Form Survey
- Form panjang dipecah menjadi bagian/step sesuai kelompok di bawah.
- Navigasi bagian, indikator progress, dan status penyimpanan.
- Simpan draft manual dan autosave opsional dengan debounce; manual save tetap tersedia.
- Jawaban tersimpan ke database, bukan hanya state browser/localStorage.
- Ketika user kembali ke draft, nilai jawaban, pilihan, checklist, dan metadata upload harus dipulihkan.
- Pertanyaan wajib diberi penanda; validasi wajib terutama diterapkan saat **Kirim untuk Review**, bukan **Simpan Draft**.
- Validasi format tanggal, angka, koordinat, email jika ada, dan file upload.
- Field kondisional tampil berdasarkan jawaban terkait. Jawaban pada field yang disembunyikan tidak boleh hilang diam-diam; pertahankan nilainya atau beri konfirmasi saat perubahan pilihan membuat field tidak relevan.
- Mendukung radio, checkbox multi-pilihan, select, teks pendek, angka, tanggal, textarea, upload file/foto, dan komponen pencarian referensi.
- Pertanyaan dan opsi di-render dari konfigurasi database; jangan hard-code semua pertanyaan di komponen React.
- Komponen khusus boleh dibuat untuk kalkulasi/lookup/pertanyaan kompleks, tetapi metadata dan label dasarnya tetap berasal dari konfigurasi form.

### 5.4 Review Risk Engineering
- Tampilan baca seluruh jawaban, file, dan ringkasan.
- Navigasi per bagian dengan penanda bagian yang belum lengkap.
- Catatan review umum dan, bila memungkinkan, komentar per pertanyaan.
- Tombol **Setujui Review Teknis** dan **Minta Revisi**.
- Alasan revisi wajib; Surveyor melihat alasan dan dapat memperbaiki lalu mengirim ulang.
- Simpan snapshot/riwayat pengajuan agar review sebelumnya tetap dapat ditelusuri.

### 5.5 Underwriting
- Menampilkan data survey dan hasil review teknis dalam mode baca.
- Pilihan keputusan sesuai form: Layak dicover; Layak dicover dengan syarat/perbaikan; Perlu review lebih lanjut; Tidak layak dicover.
- Catatan kesimpulan dan ketentuan/syarat jika keputusan bersyarat.
- Keputusan final mencatat pengguna dan waktu.
- Jangan menganggap rekomendasi Surveyor sebagai keputusan Underwriter.

### 5.6 Manajemen user
- Daftar user dengan pencarian, filter role/cabang/status aktif.
- Buat/edit user, assign role dan cabang, aktif/nonaktifkan, reset password.
- Validasi email/username unik.
- Jangan mengizinkan penghapusan fisik user yang telah memiliki histori; gunakan nonaktifkan/soft delete.
- Perubahan role dicatat dalam audit log.

### 5.7 Form Builder / Pengaturan Pertanyaan
Super Admin dapat:
- Melihat bagian dan daftar pertanyaan sesuai urutan form.
- Membuat/mengubah label, help text, key unik, tipe input, opsi, required flag, urutan, dan status aktif.
- Mengatur kondisi tampil sederhana seperti `show_if` berdasarkan key pertanyaan dan nilai jawaban.
- Mengatur kelompok pertanyaan serta sub-bagian okupansi khusus.
- Mengatur opsi select/radio/checkbox, bobot atau metadata grading bila relevan.
- Preview form sebelum perubahan diterbitkan.
- Menerbitkan versi form baru dan melihat versi aktif.
- Menonaktifkan pertanyaan, bukan menghapus pertanyaan yang sudah pernah dijawab.

**Best practice:** gunakan definisi form berversi di database. Survey baru menggunakan versi aktif ketika dibuat. Survey yang sudah dimulai tetap terikat pada versi form yang dipakai saat dibuat, agar label/urutan/aturan tidak berubah di tengah proses. Admin dapat menerbitkan versi baru untuk survey baru. Migrasi survey lama ke versi baru harus menjadi aksi eksplisit dan tidak termasuk fitur MVP.

### 5.8 Lampiran
Form referensi memiliki upload:
- Foto tampak depan/samping/dalam dan foto umum.
- General site layout/denah.
- Layout proteksi kebakaran.
- Form/contoh Hot Work Permit.
- Foto khusus gudang tembakau: kemasan, tinggi tumpukan, jarak tumpukan, ventilasi.
- Catatan dokumen/foto.

Simpan metadata file di SQLite dan file fisik di direktori lokal privat untuk development, bukan sebagai base64 di database. Buat abstraksi storage agar kelak dapat diganti ke object storage. File harus diakses melalui endpoint terotorisasi, nama file dibuat aman/unik, validasi MIME dan ukuran, serta jangan mempercayai ekstensi file saja. Tentukan batas ukuran dan tipe yang diizinkan, misalnya gambar JPG/PNG/WebP dan dokumen PDF/DOCX/XLSX sesuai kebutuhan.

### 5.9 Audit log dan histori
Catat setidaknya:
- Login sukses/gagal secara aman (tanpa password).
- Buat/edit/nonaktif user.
- Pembuatan survey, penyimpanan draft, submit, revisi, persetujuan, keputusan underwriting, pembatalan.
- Perubahan konfigurasi pertanyaan dan publikasi versi form.
- Upload/hapus lampiran.
- Perubahan data penting menyimpan actor, timestamp, entity, action, dan ringkasan perubahan. Hindari menyimpan rahasia atau data sensitif yang tidak perlu di log.

## 6. Katalog formulir yang wajib diimplementasikan dari HTML referensi

Gunakan bagian dan pertanyaan di bawah sebagai checklist cakupan. Pertahankan label asli berbahasa Indonesia sedekat mungkin, termasuk tanda wajib, istilah teknis, pilihan, bobot, dan catatan kondisional yang terlihat pada HTML. Bila suatu pertanyaan terdiri dari beberapa subfield, implementasikan subfield-nya juga. Jangan menghilangkan pertanyaan karena tampak jarang digunakan.

### A. Informasi Umum Survey
- Nama Tertanggung *
- Nama Komersial / Merk
- Alamat Risiko Lengkap *
- Kode Pos *
- Koordinat GPS *
- Tanggal Survey *
- Pelaksana Survey *
- Cabang
- Nilai Pertanggungan / TSI (Rp) *
- PIC di Lokasi

### B. Survey Umum
- Jumlah Karyawan / Tenaga Kerja
- Usaha Berjalan Sejak Tahun
- Jam Operasional
- Ada Rencana Perubahan / Ekspansi ke Depan?
- Jika ada, jelaskan rencana perubahan / ekspansi

### C. Survey Khusus Okupansi
Bagian ini harus mendukung pertanyaan dinamis berdasarkan kategori okupansi dan subkategori. Pertanyaan spesifik yang terdapat dalam HTML meliputi:
- Pilih Kategori Okupansi *
- Material (Bahan Baku Utama) *
- Proses Produksi *
- Produk (Hasil Akhir) *
- Mesin Utama *
- Kategori Barang yang Disimpan — Bahan Baku
- Sistem Penyimpanan — Bahan Baku
- Detail Sistem Penyimpanan / Keterangan Tambahan — Bahan Baku
- Kategori Barang yang Disimpan — Produk
- Sistem Penyimpanan — Produk
- Detail Sistem Penyimpanan / Keterangan Tambahan — Produk
- Kategori Barang yang Disimpan
- Klasifikasi Komoditas Gudang *
- Pertanyaan gudang tembakau:
  1. Dari mana asal tembakau yang disimpan (langsung dari petani / sudah diproses)?
  2. Jenis tembakau apa saja yang disimpan?
  3. Bagaimana bentuk & jenis kemasannya (karung, bal, kotak, dll)?
  4. Apakah ada karyawan yang standby/kerja terus menerus di dalam gudang?
  5. Bagaimana sistem pengawasan gudang dilakukan (patroli, CCTV, sensor, dll)?
  6. Bagaimana perputaran stok (turnover) di gudang?
  7. Berapa lama rata-rata tembakau disimpan (mingguan, bulanan, tahunan)?
  8. Apakah ada stok yang disimpan hingga tahunan?
  9. Apakah ada SOP untuk rotasi tumpukan stok (misalnya sistem over staple)?
  10. Jika ada, seberapa sering rotasi dilakukan?
  11. Berapa estimasi ketinggian maksimum tumpukan stok tembakau?
  12. Apakah ada aturan yang membatasi tinggi tumpukan?
  13. Seberapa rapat antar tumpukan disusun?
  14. Apakah dilakukan pengukuran suhu pada stok tembakau? (Metode & frekuensi)
  15. Apakah dilakukan pemantauan suhu ruangan gudang secara rutin? (Hasil rata-rata)
  16. Apakah dilakukan pemantauan kelembapan udara gudang? (Metode & hasil)
  17. Bagaimana sistem ventilasi gudang?
  18. Bagaimana kondisi di dalam gudang saat dirasakan langsung (panas, sumpek, lembap, dll)?
  19. Foto jenis kemasan tembakau
  20. Foto ketinggian tumpukan
  21. Foto jarak antar tumpukan
  22. Foto kondisi ventilasi gudang
- Klasifikasi Kepemilikan / Pengelolaan Gudang *
- Kategori Barang (Kode OJK) *
- Sistem Penyimpanan dan Detail Sistem Penyimpanan / Keterangan Tambahan
- Ada Area Cold Storage? termasuk pilihan persentase dan input manual jika pilihannya Lainnya
- Ada Aktivitas Charging Forklift Baterai? termasuk pertanyaan jarak terkait
- Ada Instalasi Lampu Merkuri / HID? termasuk pertanyaan cover
- Ada Coverage MB?
- Sub-Tipe Commercial * (Perkantoran, Restoran/Mall dengan tenant F&B, Hotel, Rumah Sakit, Apartemen, Data Center)
- Jumlah Lantai & Estimasi Kapasitas Orang
- Ada Ruang Server / Data Center?
- Jika ada ruang server, proteksi kebakaran khusus (gas/FM200) tersedia?
- Jumlah Lift & Tangga Darurat
- Lokasi Area Parkir
- Pertanyaan dapur/F&B: jenis bahan bakar/gas; sistem gas; kapasitas dan lokasi penyimpanan; gas detector; solenoid valve; deep frying; automatic suppression pada kitchen hood; perawatan hood/filter/ducting; pemeriksaan dapur sebelum tutup; inspeksi tenant; fire extinguisher; sprinkler/hydrant.
- Pertanyaan rumah sakit: peralatan medis bernilai tinggi dan nilai perkiraan; lokasi; proteksi kebakaran; medical gas/bahan mudah terbakar; potensi water damage dan water leak detection; kontrol akses/CCTV.
- Pertanyaan Data Center bernomor 1–31 beserta subfield:
  - Apakah bangunan sejak awal didesain sebagai Data Center?
  - Jika bukan, apakah dilakukan pemeriksaan/pekerjaan struktural, MEP, dan SLF sebelum alih fungsi?
  - Sertifikasi Tier Uptime Institute; jenis Tier; atau lembaga/jenis sertifikasi lain.
  - Data Hall (dua field sebagaimana tersedia di HTML).
  - Kapasitas beban IT.
  - Sumber listrik dan jumlah penyulang.
  - Redundansi sistem listrik dan skema N+1/N+2/2N/2N+1/Lainnya.
  - Jenis transformer (oil, air, lainnya) beserta detail.
  - Redundansi pendinginan dan skema redundansi.
  - Jenis pendinginan data hall (CRAC, Fan Wall, CRAH, lainnya) beserta detail.
  - Utilitas: genset, cooling tower, chiller, UPS, lainnya.
  - Jenis baterai sistem IT dan utility, termasuk opsi lainnya.
  - Proteksi kebakaran ruang data hall, battery, UPS, genset, dan penyimpanan bahan bakar.
  - Jenis bahan bakar genset dan lokasi penyimpanan utama/harian/lainnya.
  - Inspeksi/perawatan panel listrik, genset, sistem pendinginan (internal/eksternal beserta detail).
  - Pengukuran THD.
  - Harmonic filter dan lokasi panel.
  - Surge arrestor dan lokasi panel.
  - Water leak detector dan lokasi.
- Catatan khusus apartemen.
- Deskripsi Jenis Usaha & Hal Khusus yang Perlu Diperhatikan.

Pilihan rinci dan key field harus diekstrak/ditranskripsikan dari HTML referensi ketika implementasi. Jangan mengarang opsi jika opsi tersedia di sumber; jika suatu opsi tidak terbaca atau ambigu, dokumentasikan sebagai TODO untuk konfirmasi, jangan diam-diam mengubah arti pertanyaan.

### D. Upload Dokumen & Foto
- Tampak Depan, Samping, Dalam, dll.
- Upload general site layout / denah keseluruhan lokasi.
- Upload layout proteksi kebakaran.
- Upload form / contoh Hot Work Permit.
- Catatan Terkait Dokumen / Foto.

### E. Management
- Lima pertanyaan ya/tidak yang tersedia sebagai `m1`, `m2`, `m3`, `m4`, dan `m7` di HTML; pertahankan label asli dari file HTML saat implementasi.
- Jumlah klaim dalam 5 tahun terakhir *: 0, 1–2, 3+.
- Detail kerugian/klaim (mendukung lebih dari satu kejadian).
- Risk improvement atas klaim sebelumnya * (wajib jika ada klaim): Ya/Tidak.
- Ringkasan Kejadian & Tindak Lanjut / Perbaikan yang Dilakukan.
- > 50% rekomendasi Aswata telah dijalankan? *: Ya/Tidak.
- Catatan Management.

**Catatan implementasi:** Lima pertanyaan awal ditampilkan sebagai label “Ya” pada hasil ekstraksi ringkas, sehingga agent wajib membaca label yang tepat langsung dari HTML; jangan menebak teks pertanyaan tersebut.

### F. Construction
- Kelas Konstruksi Bangunan * (pilihan skor/kode sesuai HTML).
- Jumlah Lantai *.
- Luas Bangunan (m²).
- Tahun Dibangun.
- Apakah menggunakan Combustible Sandwich Panel > 30% floor area?
- Apakah menggunakan Combustible ACP (Aluminium Composite Panel) > 30% surface area?
- Catatan Konstruksi.

### G. Occupancy
- Breakdown Okupansi ASWATA * (menggunakan lookup/pencarian referensi sesuai HTML).
- Kode Okupansi.
- Rating / Skor.
- Kategori Hazard Risk Okupansi (field kalkulasi/tersembunyi di HTML).
- Deskripsi aktivitas utama di lokasi *.
- Penyimpanan/penggunaan bahan kimia berbahaya: none/small/large.
- Apakah ada dapur/kitchen (Restaurant, Hotel, Central Kitchen)?
- Apakah ada forklift listrik yang diisi baterai di dalam gedung?

### H. Protection — Proteksi Kebakaran
- APAR — Alat Pemadam Api Ringan * (Bobot 25%): good/avg/none.
- Hidran — Unit Boks/Pillar Hidran * (Bobot 30%): good/avg/none.
  - Jumlah unit indoor hydrant.
  - Jumlah unit outdoor hydrant.
  - Untuk jockey pump, main pump, diesel pump: jumlah unit, kapasitas, automatic start.
  - Kapasitas penyimpanan air hydrant.
- Detektor Kebakaran Otomatis * (Bobot 25% — Smoke/Heat/Flame Detector): good/avg/none.
  - Apakah sistem detector berfungsi normal?
  - Jenis detektor (heat, smoke, lainnya).
  - Cakupan instalasi: <30%, 30%–50%, 50%–80%, >80%.
  - Penjelasan area cakupan.
- Sprinkler * (Bobot 10%): good/avg/none.
  - Apakah suplai air sama dengan sistem hydrant?
  - Jika tidak, penjelasan.
  - Cakupan instalasi dengan opsi yang tersedia.
  - Penjelasan area cakupan.
- Pemadam Kebakaran Publik — Estimasi Response Time * (Bobot 10%): skor 8/6/4/2 sesuai HTML.
- Keterangan tambahan terkait proteksi kebakaran.

### I. Exposure
- Kondisi fasilitas di sekitar bangunan tertanggung * (pilihan skor 4/3/2/1 sesuai HTML).
- Deskripsi fasilitas/bangunan di sekitar.

### J. Natural Hazards
- Gempa — Tarif & Zona Gempa OJK *: zona 1–5 dengan deskripsi rating seperti pada HTML.
- Banjir — lima kriteria yang masing-masing memiliki jawaban Ya/Tidak; pertahankan rule pada HTML bahwa seluruh kriteria harus “Ya” untuk rating Average.
- Petir — Penangkal Petir *: Average/Marginal sesuai HTML.

### K. Loss Estimate & Other Perils
- Ada Pemisah Antar Bangunan (Fire Wall/Jarak Aman)? (ditandai TBC pada HTML; konfirmasi sebelum menetapkan aturan wajib).
- Jumlah Bangunan *: 1 atau lebih dari 1.
- Other Perils — Apakah ada risiko khusus lain? *: Tidak/Ya.
- Jika ada, jelaskan risiko khusus tersebut.
- Catatan tambahan Surveyor.

### L. Hasil Risk Grading
- Rekomendasi: Layak dicover; Layak dicover dengan syarat/perbaikan; Perlu review lebih lanjut; Tidak layak dicover.
- Catatan Kesimpulan.

## 7. Risk grading dan kalkulasi

- Pertahankan opsi skor dan bobot yang eksplisit pada HTML, termasuk bobot Protection: APAR 25%, Hidran 30%, Detektor 25%, Sprinkler 10%, Pemadam Kebakaran Publik 10%.
- Jangan mengarang formula untuk overall grading, hazard score, atau rekomendasi bila formula tidak jelas/terdokumentasi dalam HTML. Lakukan ekstraksi seluruh fungsi JavaScript terkait grading dari HTML dan implementasikan dengan unit test.
- Kalkulasi yang ada di form harus dijalankan secara deterministik di server bila berdampak pada hasil resmi; frontend dapat menampilkan preview.
- Pisahkan hasil kalkulasi dari jawaban input. Simpan nilai kalkulasi, versi algoritma, dan waktu kalkulasi agar dapat ditelusuri.
- Bila formula belum dapat dipastikan, tampilkan status “Belum dihitung/Perlu konfigurasi” dan dokumentasikan sebagai blocker; jangan memberi grading palsu.
- Jangan izinkan edit manual terhadap hasil kalkulasi kecuali ada fitur override khusus dengan alasan, role yang diizinkan, dan audit log.

## 8. Rekomendasi model data SQLite

Gunakan ORM yang kompatibel dengan Next.js dan SQLite (disarankan **Prisma**; Drizzle dapat dipilih jika konsisten). Definisikan relasi dan indeks dengan benar. Skema minimal:

### `User`
- `id` (UUID/CUID), `name`, `email` unik, `passwordHash`, `role`, `branchId` nullable, `isActive`, `createdAt`, `updatedAt`, `lastLoginAt`.

### `Branch`
- `id`, `name` unik, `code` opsional, `isActive`, timestamps.

### `FormVersion`
- `id`, `version` unik, `status` (DRAFT/PUBLISHED/ARCHIVED), `publishedAt`, `createdById`, timestamps.

### `FormSection`
- `id`, `formVersionId`, `key`, `title`, `description`, `sortOrder`, `isActive`.

### `FormQuestion`
- `id`, `sectionId`, `key` unik dalam satu versi form, `label`, `helpText`, `type`, `isRequired`, `sortOrder`, `optionsJson`, `validationJson`, `visibilityConditionJson`, `gradingMetadataJson`, `isActive`.
- Tipe contoh: `text`, `textarea`, `number`, `date`, `select`, `radio`, `checkbox_group`, `file`, `lookup`, `hidden`, `repeater`.
- `optionsJson` hanya untuk opsi terstruktur; jangan menyimpan jawaban survey di sini.

### `Survey`
- `id`, `surveyNumber` unik (bisa null selama draft bila nomor baru diberikan saat submit), `insuredName`, `commercialName`, `riskAddress`, `postalCode`, `gpsCoordinates`, `surveyDate`, `surveyorId`, `branchId`, `occupancyCategory`, `tsiAmount`, `status`, `formVersionId`, `createdAt`, `updatedAt`, `submittedAt`, `riskApprovedAt`, `completedAt`, `deletedAt` nullable.
- Informasi umum yang perlu dipakai untuk dashboard boleh disimpan di kolom terstruktur; sumber jawaban lengkap tetap disimpan pada `SurveyAnswer`.

### `SurveyAnswer`
- `id`, `surveyId`, `questionKey`, `valueJson`, `updatedById`, `updatedAt`.
- Unique constraint pada (`surveyId`, `questionKey`). Simpan pilihan tunggal, multi-pilihan, angka, teks, dan nilai terstruktur dengan representasi JSON yang tervalidasi.
- Pertimbangkan `formVersionId`/question ID agar relasi terhadap versi form tetap jelas.

### `SurveyAttachment`
- `id`, `surveyId`, `questionKey`/`attachmentCategory`, `originalFileName`, `storedFileName`, `mimeType`, `sizeBytes`, `storagePath`, `uploadedById`, `createdAt`, `deletedAt`.

### `SurveyReview`
- `id`, `surveyId`, `reviewType` (RISK_ENGINEERING/UNDERWRITING), `decision`, `comment`, `reviewerId`, `createdAt`.

### `SurveyStatusHistory`
- `id`, `surveyId`, `fromStatus`, `toStatus`, `actorId`, `comment`, `createdAt`.

### `AuditLog`
- `id`, `actorId`, `action`, `entityType`, `entityId`, `metadataJson`, `createdAt`.

### `RiskCalculation`
- `id`, `surveyId`, `algorithmVersion`, `resultJson`, `overallGrade`, `calculatedAt`, `calculatedById` nullable.

Gunakan foreign key, unique constraint, dan indeks untuk kolom pencarian/filter umum seperti status, branchId, surveyorId, surveyDate, insuredName, dan updatedAt. Transaksi database harus dipakai untuk operasi yang mengubah jawaban dan status secara bersamaan.

**Catatan SQLite:** file database lokal cocok untuk development/MVP single-instance. Dokumentasikan batasan concurrency dan deployment. Jangan menganggap file SQLite lokal otomatis cocok untuk serverless multi-instance. Jika deployment kelak ke Vercel atau multi-instance, rencanakan migrasi ke database yang sesuai atau gunakan layanan SQLite hosted yang kompatibel; jangan kehilangan abstraksi repository/ORM.

## 9. Persyaratan teknis

- Next.js App Router + TypeScript.
- UI responsive desktop/tablet/mobile; prioritas penggunaan survey lapangan pada tablet dan mobile.
- ORM SQLite, schema migrations, dan seed script.
- Gunakan validasi skema bersama (misalnya Zod) di server dan client.
- Pisahkan layer UI, domain/business logic, validasi, database access, autentikasi, dan otorisasi.
- Gunakan Server Components secara default; gunakan Client Components hanya untuk interaksi yang memerlukan state browser.
- Gunakan Server Actions atau Route Handlers dengan pola konsisten, selalu memvalidasi session, role, payload, dan kepemilikan data.
- Hindari query database langsung dari komponen UI.
- Jangan menyimpan seluruh form sebagai satu JSON besar tanpa model jawaban per key; jawaban per pertanyaan memudahkan autosave, review, audit, dan reporting.
- Form schema harus tervalidasi dan memiliki `key` stabil yang tidak berubah hanya karena label diubah.
- Gunakan pagination server-side, pencarian/filter tervalidasi, dan cegah N+1 query.
- Buat error handling terpusat dan pesan error yang ramah pengguna dalam Bahasa Indonesia.
- Sertakan lint, typecheck, migration, seed, dan test commands.
- Tidak perlu menambahkan layanan eksternal atau cloud storage untuk MVP; gunakan adapter lokal yang aman.

## 10. Keamanan dan privasi

- Password selalu di-hash; rahasia disimpan di environment variables.
- Proteksi terhadap SQL injection melalui ORM/parameterized query, XSS melalui escaping, CSRF sesuai mekanisme auth, dan akses file tanpa otorisasi.
- Terapkan rate limit login dasar, validasi input, dan batas upload.
- Jangan mengandalkan role yang dikirim dari browser.
- Semua query survey harus membatasi akses berdasarkan role dan ownership.
- Gunakan soft delete untuk data penting.
- Jangan log password, token session, atau isi lampiran.
- Tampilkan konfirmasi untuk keputusan final dan aksi destruktif.
- Sediakan instruksi backup database dan direktori upload. Untuk SQLite, backup harus dilakukan dengan cara yang konsisten dengan penulisan database.

## 11. UX dan desain

Buat desain baru yang profesional untuk aplikasi internal risk engineering/insurance. HTML terlampir adalah referensi konten dan logika, **bukan patokan visual** untuk login/dashboard. Rekomendasi:
- Navigasi sidebar di desktop dan navigasi ringkas di mobile.
- Header berisi nama halaman, breadcrumb, user menu, role, dan cabang.
- Dashboard memakai ringkasan statistik, filter yang jelas, tabel/list yang mudah dipindai, badge status konsisten, dan pagination.
- Form panjang memakai stepper/accordion per bagian, progress indikator, label jelas, help text, dan penanda required.
- Tombol utama: **Simpan Draft**, **Simpan & Lanjut**, **Kirim untuk Review**. Tombol simpan draft mudah ditemukan.
- Tampilkan status “Tersimpan”/“Menyimpan…”/“Gagal menyimpan” dengan waktu update terakhir.
- Sebelum meninggalkan form, beri peringatan hanya jika ada perubahan yang belum tersimpan.
- Aksesibilitas: label terhubung ke input, keyboard navigation, focus state, kontras memadai, pesan error dekat field, jangan hanya menggunakan warna untuk menunjukkan status.
- Semua copy UI dalam Bahasa Indonesia, kecuali istilah teknis yang memang dipakai pada form sumber.

## 12. Halaman minimum

1. `/login`
2. `/dashboard`
3. `/surveys/new`
4. `/surveys/[id]` — detail/read mode mengikuti hak akses.
5. `/surveys/[id]/edit` — draft/revisi yang boleh diedit.
6. `/reviews/risk-engineering`
7. `/reviews/underwriting`
8. `/admin/users`
9. `/admin/branches`
10. `/admin/form-builder`
11. `/admin/form-builder/[versionId]`
12. `/admin/audit-logs`
13. Halaman 403/404 dan error fallback yang layak.

Route dapat disesuaikan dengan arsitektur final, namun kemampuan bisnisnya harus tetap ada.

## 13. Validasi dan aturan penyimpanan

### Simpan Draft
- Boleh menyimpan form kosong atau sebagian.
- Simpan hanya field yang valid secara tipe; misalnya angka yang tidak valid harus diberi pesan atau tidak ditulis sebagai angka.
- Jangan memaksa field required terisi.
- Simpan status tetap `DRAFT` atau `REVISION_REQUIRED` sesuai konteks.
- Tampilkan notifikasi sukses/gagal dan waktu penyimpanan terakhir.
- Jika autosave diterapkan, cegah request bersamaan menimpa data baru dengan data lama; gunakan debounce dan/atau updatedAt/version check.

### Kirim untuk Review
- Validasi semua field wajib aktif berdasarkan kondisi tampil.
- Validasi aturan kondisional (misalnya jika klaim ada, field risk improvement menjadi wajib).
- Validasi lampiran wajib bila didefinisikan demikian pada sumber.
- Tampilkan ringkasan error dan tautan menuju bagian/field yang bermasalah.
- Jika validasi lolos, simpan jawaban, snapshot pengajuan, perubahan status, dan status history dalam transaksi.

### Revisi
- Surveyor hanya dapat mengedit survey yang dibuat olehnya dan berstatus draft/revisi, kecuali aturan admin yang diaudit.
- Catatan reviewer ditampilkan dengan jelas.
- Setelah diperbaiki, surveyor mengirim ulang; histori pengajuan sebelumnya tetap tersedia.

## 14. Testing dan Definition of Done

### Unit tests
- Perhitungan grading sesuai fungsi sumber HTML.
- Validasi field wajib dan aturan kondisional.
- Transisi status yang sah/tidak sah.
- Permission per role dan ownership.
- Parsing/validasi jawaban sesuai tipe pertanyaan.

### Integration tests
- Login/logout dan penolakan user nonaktif.
- Surveyor membuat draft dengan jawaban sebagian.
- Surveyor melanjutkan draft dan jawaban tetap tersimpan.
- Submit gagal jika field wajib belum lengkap.
- Submit berhasil jika validasi lengkap.
- Risk Engineering approve/revision dengan catatan.
- Surveyor memperbaiki dan submit ulang.
- Underwriter menyimpan keputusan.
- Admin mengelola user dan menerbitkan versi form.
- File hanya dapat diakses user yang berwenang.

### End-to-end tests
- Alur utama dari login Surveyor sampai keputusan Underwriter.
- Semua empat role hanya melihat menu dan data sesuai hak akses.
- Form builder dapat mengubah label/opsi/urutan pertanyaan dan versi yang sudah dipakai survey lama tetap stabil.
- Dashboard filter, search, pagination, dan statistik berfungsi dengan data SQLite.

### Definition of Done
- Tidak ada tombol utama yang hanya bersifat mock.
- Tidak ada penggunaan dummy data untuk menggantikan fitur yang diminta.
- Semua pertanyaan dalam katalog HTML tersedia dan dapat disimpan.
- Tidak ada password default produksi.
- Migration dan seed dapat dijalankan dari instruksi README.
- Lint, typecheck, unit test, dan integration test lulus.
- README berisi setup, migrasi, seed akun testing, lokasi database/upload, dan catatan batasan SQLite.
- Aplikasi diuji pada ukuran layar desktop dan mobile.

## 15. Akun testing per role

Buat akun melalui seed script dengan data berikut. Gunakan password development yang sama untuk memudahkan QA lokal, tetapi jangan pernah menggunakan password ini untuk production.

| Role | Nama | Email | Password testing |
|---|---|---|---|
| Super Admin | Admin Survey | `admin.survey@example.test` | `SurveyDev!2026` |
| Surveyor | Budi Surveyor | `surveyor@example.test` | `SurveyDev!2026` |
| Risk Engineering | Rina Risk Engineering | `risk.engineering@example.test` | `SurveyDev!2026` |
| Underwriter | Andi Underwriter | `underwriter@example.test` | `SurveyDev!2026` |

Ketentuan:
- Seed harus idempotent: dapat dijalankan ulang tanpa membuat duplikasi.
- Tandai akun sebagai akun development/testing.
- Buat beberapa data demo opsional hanya jika diperlukan untuk menguji dashboard, dan beri penanda jelas sebagai data demo.
- README harus mencantumkan kredensial testing tersebut dan perintah untuk menjalankan seed.
- Pada production, nonaktifkan akun seed atau wajibkan penggantian password sebelum login pertama.

## 16. Urutan implementasi yang disarankan untuk agent

1. **Audit HTML sumber**: baca seluruh file; inventarisasi semua label, input name/id, tipe, opsi, kondisi tampil, kalkulasi grading, dan aturan validasi. Buat file dokumentasi `docs/form-source-inventory.md`. Jangan menghilangkan field atau menebak formula.
2. **Bootstrap project**: Next.js App Router, TypeScript, styling/UI primitives, Prisma + SQLite, Zod, testing setup.
3. **Schema dan seed**: model User, Branch, FormVersion, FormSection, FormQuestion, Survey, SurveyAnswer, Attachment, Review, StatusHistory, AuditLog, RiskCalculation.
4. **Auth & RBAC**: login nyata, session, middleware/layout guard, server-side authorization.
5. **Form configuration**: import seluruh pertanyaan dari HTML ke seed/database, dengan versi awal `v1`. Pertahankan stable keys yang merujuk pada name/id HTML bila tersedia.
6. **Dynamic form renderer**: implementasikan seluruh tipe input, kondisi tampil, validasi, dan upload.
7. **Draft persistence**: simpan/load jawaban per pertanyaan, tombol Simpan Draft, resume draft, dan autosave opsional.
8. **Dashboard**: data real dari database, filter, search, sorting, pagination, statistik sesuai role.
9. **Workflow review**: Risk Engineering, revisi, Underwriter, status history, audit.
10. **Admin console**: user, cabang, form builder, publish version, audit log.
11. **Grading**: porting formula dari JavaScript HTML ke modul domain dengan unit tests; jika formula tidak jelas, tandai blocker dan jangan mengarang.
12. **QA dan dokumentasi**: test end-to-end, README, seed credentials, backup instructions, catatan SQLite deployment.

Agent harus mengerjakan aplikasi yang benar-benar berfungsi, bukan hanya mockup. Bila tugas terlalu besar untuk satu pass, kerjakan bertahap dengan urutan di atas dan pertahankan aplikasi dapat dijalankan setelah setiap tahap.

## 17. Instruksi eksplisit untuk Antigravity

- Mulai dengan memeriksa file `survey report percobaan.html` yang disediakan dalam workspace.
- Jangan menjadikan login/dashboard prototipe sebagai referensi desain final.
- Gunakan bagian, label, opsi, tipe input, kondisi, dan formula dari form embedded di file tersebut sebagai sumber kebenaran.
- Jangan menghapus atau menyederhanakan pertanyaan yang jarang digunakan, termasuk pertanyaan okupansi khusus Data Center, gudang tembakau, F&B, rumah sakit, dan apartemen.
- Buat konfigurasi pertanyaan di SQLite dan render form secara dinamis.
- Gunakan versioning form agar perubahan admin tidak merusak survey lama.
- Simpan draft dengan jawaban sebagian tanpa validasi wajib penuh.
- Semua aksi workflow harus benar-benar tersimpan ke database dan diaudit.
- Terapkan keamanan RBAC di sisi server.
- Buat empat akun testing melalui seed seperti tabel pada bagian 15.
- Setelah selesai, laporkan fitur yang sudah selesai, cara menjalankan aplikasi, hasil test, akun testing, dan setiap TODO/blocker yang memerlukan konfirmasi bisnis.
