# Inventarisasi Formulir Survey Report & Risk Grading (Sumber: HTML Referensi)

Dokumen ini merupakan hasil audit komprehensif terhadap `survey report percobaan.html` (embedded `extracted_survey_form.html`) sesuai instruksi PRD Bagian 16 Langkah 1.

---

## 1. Ikhtisar Struktur Bagian (Sections)

Formulir terdiri dari 12 bagian berurutan (`sec0` hingga `sec11`):

| No | ID Bagian | Judul Bagian | Subjudul / Keterangan | Bobot Grading |
|---|---|---|---|---|
| 0 | `sec0` | **Informasi Umum Survey** | Data dasar objek risiko yang disurvey | — |
| 1 | `sec1` | **Survey Umum** | Pertanyaan dasar yang berlaku untuk semua jenis okupansi | — |
| 2 | `sec2` | **Survey Khusus Okupansi** | Pertanyaan tambahan dinamis sesuai jenis usaha / okupansi | — |
| 3 | `sec3` | **Upload Dokumen & Foto** | Foto dan dokumen hasil survey lapangan | — |
| 4 | `sec4` | **Management** | Penilaian manajemen risiko | Kategori I (Max Good 8) |
| 5 | `sec5` | **Construction** | Penilaian konstruksi bangunan | Kategori I |
| 6 | `sec6` | **Occupancy** | Penilaian aktivitas di lokasi risiko (dari Breakdown Okupansi) | Kategori I |
| 7 | `sec7` | **Protection — Proteksi Kebakaran** | Ketersediaan & kondisi sistem proteksi kebakaran | Kategori I |
| 8 | `sec8` | **Exposure** | Penilaian eksposur dari lingkungan sekitar | Kategori II (Max Good 4) |
| 9 | `sec9` | **Natural Hazards** | Kombinasi eksposur Gempa, Banjir, dan Petir | Kategori II (Max 3/2) |
| 10 | `sec10` | **Loss Estimate & Other Perils** | Estimasi kerugian maksimal & risiko khusus lainnya | Kategori III & II |
| 11 | `sec11` | **Hasil Risk Grading** | Kalkulasi otomatis berdasarkan input surveyor & kesimpulan | Total Skor (Max 55) |

---

## 2. Rincian Pertanyaan & Field per Bagian

### A. Informasi Umum Survey (`sec0`)
- **`f_tertanggung`** (Teks, Wajib *): *Nama Tertanggung* (Placeholder: PT / CV / Nama Perorangan)
- **`f_merk`** (Teks): *Nama Komersial / Merk* (Placeholder: Nama usaha / brand)
- **`f_alamat`** (Textarea, Wajib *): *Alamat Risiko Lengkap*
- **`f_kode_pos`** (Teks, 5 digit angka, Wajib *): *Kode Pos*
- **`f_gps`** (Teks, format latitude/longitude, Wajib *): *Koordinat GPS* (Didukung aksi geolocation browser)
- **`f_tanggal`** (Date, Wajib *): *Tanggal Survey*
- **`f_surveyor`** (Teks, Wajib *): *Pelaksana Survey* (Diisi nama akun surveyor login)
- **`f_cabang`** (Select, Wajib *): *Cabang* (Opsi cabang: Jakarta, Surabaya, Medan, Bandung, Semarang, Makassar, Denpasar, Palembang, Balikpapan, Manado, Pekanbaru, Lampung, Solo, Malang, Batam)
- **`f_tsi`** (Number/Currency, Wajib *): *Nilai Pertanggungan / TSI (Rp)*
- **`f_pic`** (Teks): *PIC di Lokasi* (Nama & jabatan yang mendampingi survey)

### B. Survey Umum (`sec1`)
- **`f_karyawan`** (Number): *Jumlah Karyawan / Tenaga Kerja*
- **`f_sejak`** (Number): *Usaha Berjalan Sejak Tahun*
- **`f_jam_op`** (Teks): *Jam Operasional* (Placeholder: Contoh: 08.00 - 17.00 (1 shift) / 24 jam (3 shift))
- **`f_ekspansi`** (Radio: Ya/Tidak): *Ada Rencana Perubahan / Ekspansi ke Depan?*
- **`f_ekspansi_detail`** (Textarea, Tampil jika `f_ekspansi` = Ya): *Jika ada, jelaskan rencana perubahan / ekspansi*

### C. Survey Khusus Okupansi (`sec2`)
Field pemicu utama:
- **`sp_jenis`** (Select, Wajib *): *Pilih Kategori Okupansi*
  - Opsi: `pabrik` (Pabrik / Manufaktur), `gudang` (Gudang / Pergudangan), `commercial` (Commercial / Residential), `datacenter` (Data Center), `lainnya` (Lainnya)

#### 1. Okupansi: Pabrik / Manufaktur (`pabrik`)
- **`sp_pb_material`** (Textarea, Wajib *): *Material (Bahan Baku Utama)*
- **`sp_pb_proses`** (Textarea, Wajib *): *Proses Produksi*
- **`sp_pb_produk`** (Textarea, Wajib *): *Produk (Hasil Akhir)*
- **`sp_pb_mesin`** (Textarea, Wajib *): *Mesin Utama*
- **`sp_pb_bb_barang`** (Teks): *Kategori Barang yang Disimpan — Bahan Baku*
- **`sp_pb_bb_sistem`** (Select): *Sistem Penyimpanan — Bahan Baku* (Floor Storage, Racking, Block Stacking, Lainnya)
- **`sp_pb_bb_detail`** (Textarea): *Detail Sistem Penyimpanan / Keterangan Tambahan — Bahan Baku*
- **`sp_pb_produk_barang`** (Teks): *Kategori Barang yang Disimpan — Produk*
- **`sp_pb_produk_sistem`** (Select): *Sistem Penyimpanan — Produk* (Floor Storage, Racking, Block Stacking, Lainnya)
- **`sp_pb_produk_detail`** (Textarea): *Detail Sistem Penyimpanan / Keterangan Tambahan — Produk*

#### 2. Okupansi: Gudang (`gudang`)
- **`sp_gd_komoditas`** (Select, Wajib *): *Klasifikasi Komoditas Gudang*
  - Opsi: `noncomb` (Barang Umum Non-Combustible), `comb` (Barang Umum Combustible / Campuran), `tembakau` (Tembakau / Rokok), `flam` (Flammable / Chemical), `cold` (Cold Storage)
- **Pertanyaan Khusus Gudang Tembakau (22 Item)** (Tampil jika `sp_gd_komoditas` = `tembakau`):
  1. `sp_tb_asal` (Textarea): *Asal tembakau (petani / sudah diproses)*
  2. `sp_tb_jenis` (Textarea): *Jenis tembakau yang disimpan*
  3. `sp_tb_kemasan` (Textarea): *Bentuk & jenis kemasan*
  4. `sp_tb_staff` (Radio Ya/Tidak): *Karyawan standby/kerja terus menerus di dalam gudang*
  5. `sp_tb_pengawasan` (Textarea): *Sistem pengawasan gudang (patroli, CCTV, sensor)*
  6. `sp_tb_turnover` (Textarea): *Perputaran stok (turnover)*
  7. `sp_tb_lama` (Textarea): *Rata-rata lama penyimpanan*
  8. `sp_tb_tahunan` (Radio Ya/Tidak): *Ada stok disimpan hingga tahunan?*
  9. `sp_tb_sop_rotasi` (Radio Ya/Tidak): *SOP rotasi tumpukan stok (over staple)*
  10. `sp_tb_frek_rotasi` (Textarea): *Frekuensi rotasi stok*
  11. `sp_tb_tinggi` (Textarea): *Estimasi ketinggian maksimum tumpukan*
  12. `sp_tb_batas_tinggi` (Radio Ya/Tidak): *Aturan membatasi tinggi tumpukan*
  13. `sp_tb_jarak` (Textarea): *Kerapatan susunan antar tumpukan*
  14. `sp_tb_suhu_stok` (Textarea): *Pengukuran suhu stok (metode & frekuensi)*
  15. `sp_tb_suhu_ruang` (Textarea): *Pemantauan suhu ruangan gudang rutin*
  16. `sp_tb_kelembapan` (Textarea): *Pemantauan kelembapan udara gudang*
  17. `sp_tb_ventilasi` (Textarea): *Sistem ventilasi gudang*
  18. `sp_tb_kondisi` (Textarea): *Kondisi langsung dalam gudang (panas/sumpek/lembap)*
  19. `sp_tb_foto_kemasan` (File): *Foto jenis kemasan tembakau*
  20. `sp_tb_foto_tinggi` (File): *Foto ketinggian tumpukan*
  21. `sp_tb_foto_jarak` (File): *Foto jarak antar tumpukan*
  22. `sp_tb_foto_ventilasi` (File): *Foto kondisi ventilasi gudang*
- **`sp_gd_klasifikasi`** (Select, Wajib *): *Klasifikasi Kepemilikan / Pengelolaan Gudang* (Gudang Pribadi, Gudang Komersil / Disewakan, Gudang Logistik / 3PL, Lainnya)
  - Jika Gudang Pribadi: checklist 3 syarat (`sp_gd_pribadi_syarat1`, `sp_gd_pribadi_syarat2`, `sp_gd_pribadi_syarat3`)
- **`sp_gd_ojk_code`** (Teks, Wajib *): *Kategori Barang (Kode OJK)*
- **`sp_gd_barang`** (Teks): *Kategori Barang yang Disimpan*
- **`sp_gd_sistem`** (Select): *Sistem Penyimpanan* (Racking, Floor Stacking, Block Stacking, Automated / AS/RS, Lainnya)
- **`sp_gd_sistem_detail`** (Textarea): *Detail Sistem Penyimpanan / Keterangan Tambahan*
- **`sp_gd_cold`** (Radio Ya/Tidak): *Ada Area Cold Storage?*
  - Jika Ya: `sp_gd_cold_pct` (Select: <25%, 25-50%, >50%, manual) dan `sp_gd_cold_pct_manual`
- **`sp_gd_forklift`** (Radio Ya/Tidak): *Ada Aktivitas Charging Forklift Baterai?*
  - Jika Ya: `sp_gd_forklift_jarak` (<5m, 5-10m, >10m, ruang terpisah)
- **`sp_gd_lampu`** (Radio Ya/Tidak): *Ada Instalasi Lampu Merkuri / HID?*
  - Jika Ya: `sp_gd_lampu_cover` (Lampu memiliki cover / pelindung?: Ya/Tidak)
- **`sp_gd_mb`** (Radio Ya/Tidak): *Ada Coverage MB?*

#### 3. Okupansi: Commercial / Residential (`commercial`)
- **`sp_cm_tipe`** (Select, Wajib *): *Sub-Tipe Commercial* (perkantoran, restoran, hotel, rs, apartemen)
- **`sp_kt_lantai`** (Teks): *Jumlah Lantai & Estimasi Kapasitas Orang*
- **`sp_kt_server`** (Radio Ya/Tidak): *Ada Ruang Server / Data Center?*
  - Jika Ya: `sp_kt_server_gas` (Proteksi gas/FM200 tersedia?)
- **`sp_kt_lift`** (Teks): *Jumlah Lift & Tangga Darurat*
- **`sp_kt_parkir`** (Select): *Lokasi Area Parkir* (Basement, Gedung Parkir Terpisah, Terbuka / Outdoor)

Pertanyaan Sub-Tipe Khusus:
- **Restoran / Mall tenant F&B / Hotel** (Dapur & F&B):
  - `sp_fb_gas`: Jenis bahan bakar gas (LPG Tabung, PGN Pipa, Listrik, Lainnya)
  - `sp_fb_sistem_gas`: Sistem gas (Tabung di dapur, tabung di luar / pipa, tangki sentral)
  - `sp_fb_kapasitas_gas`: Kapasitas total & lokasi penyimpanan
  - `sp_fb_detector`: Gas leak detector (Ya/Tidak)
  - `sp_fb_solenoid`: Interlock solenoid valve (Ya/Tidak)
  - `sp_fb_deep_fry`: Deep frying (Ya/Tidak)
  - `sp_fb_hood_supp`: Automatic suppression di kitchen hood (Ya/Tidak)
  - `sp_fb_hood_clean`: Frekuensi pembersihan kitchen hood & ducting
  - `sp_fb_close_check`: Pemeriksaan kompor & gas sebelum tutup (Ya/Tidak)
  - `sp_fb_inspeksi`: Inspeksi tenant berkala (Ya/Tidak)
  - `sp_fb_ext`: APAR khusus Kelas K / Wet Chemical (Ya/Tidak)
  - `sp_fb_spr_hyd`: Sprinkler/Hidran mengcover area dapur (Ya/Tidak)
- **Rumah Sakit (`rs`)**:
  - `sp_rs_highvalue`: Peralatan medis nilai tinggi & estimasi nilai
  - `sp_rs_lokasi`: Lokasi penempatan alat medis
  - `sp_rs_fireprot`: Proteksi kebakaran khusus di ruang alat medis (FM200, Pre-action, Detektor Asap Sensitif, Lainnya)
  - `sp_rs_medgas`: Medical gas & oksigen sentral
  - `sp_rs_water`: Potensi kerugian water damage & water leak detection (Ya/Tidak)
  - `sp_rs_security`: Kontrol akses & CCTV (Ya/Tidak)
- **Apartemen (`apartemen`)**:
  - `sp_apartemen_note`: Catatan khusus apartemen

#### 4. Okupansi: Data Center (`datacenter`) (31 Pertanyaan Terstruktur)
1. `sp_dc_purpose` (Radio: Ya / Bukan sejak awal): Apakah bangunan sejak awal didesain sebagai Data Center?
   - Jika Bukan: `sp_dc_structural` (Pemeriksaan struktural), `sp_dc_mep` (Kajian MEP), `sp_dc_slf` (SLF alih fungsi)
2. `sp_dc_uptime` (Radio Ya/Tidak): Sertifikasi Uptime Institute?
   - Jika Ya: `sp_dc_tier` (Tier I, II, III, IV)
   - Jika Tidak: `sp_dc_other_cert` (Lembaga / sertifikasi lain)
3. `sp_dc_datahall` (Teks): Data Hall (Spesifikasi / kapasitas)
4. `sp_dc_datahall_62` (Teks): Data Hall (Kapasitas beban & ruangan)
5. `sp_dc_it_load` (Teks): Kapasitas beban IT (kW / MW)
6. `sp_dc_power_source` (Teks): Sumber pasokan listrik utama
7. `sp_dc_feeder` (Teks): Jumlah jalur penyulang (feeder)
8. `sp_dc_elec_redundancy` (Radio Ya/Tidak): Redundansi sistem kelistrikan?
   - Jika Ya: `sp_dc_elec_scheme` (N+1, 2N, 2(N+1), dll) & `sp_dc_elec_other`
9. Trafo / Transformer: `sp_dc_tr_oil` (Oil), `sp_dc_tr_air` (Dry/Air), `sp_dc_tr_other`
10. Redundansi Cooling: `sp_dc_cooling_redundancy`, skema `sp_dc_cooling_scheme`, `sp_dc_cooling_other`
11. Pendinginan Data Hall: `sp_dc_crac`, `sp_dc_fanwall`, `sp_dc_crah`
12. Utilitas: `sp_dc_util_genset`, `sp_dc_util_cooling_tower`, `sp_dc_util_chiller`, `sp_dc_util_ups`, `sp_dc_util_other`
13. Baterai IT: `sp_dc_battery_it`, `sp_dc_battery_it_other`
14. Baterai Utility: `sp_dc_battery_utility`, `sp_dc_battery_utility_other`
15. Proteksi Kebakaran Ruang Data Hall: `sp_dc_dh_clean`, `sp_dc_dh_preaction`, `sp_dc_dh_vesda`, `sp_dc_dh_ext`, `sp_dc_dh_other`
16. Proteksi Ruang Baterai: `sp_dc_bat_clean`, `sp_dc_bat_hydrogen`, `sp_dc_bat_vesda`, `sp_dc_bat_preaction`, `sp_dc_bat_ext`, `sp_dc_bat_other`
17. Proteksi Ruang UPS: `sp_dc_ups_clean`, `sp_dc_ups_vesda`, `sp_dc_ups_preaction`, `sp_dc_ups_ext`, `sp_dc_ups_other`
18. Proteksi Ruang Genset: `sp_dc_genset_fire`
19. Proteksi Penyimpanan Bahan Bakar: `sp_dc_fuel_storage_fire`
20. Jenis Bahan Bakar Genset: `sp_dc_fuel_type`
21. Tangki Utama Bahan Bakar: `sp_dc_fuel_main`
22. Tangki Harian (Day Tank): `sp_dc_fuel_daily`
23. Tangki Lainnya: `sp_dc_fuel_other`
24. Perawatan Panel Listrik Internal: `sp_dc_panel_internal` & detail
25. Perawatan Panel Listrik Eksternal: `sp_dc_panel_external` & detail
26. Perawatan Genset Internal: `sp_dc_genset_internal` & detail
27. Perawatan Genset Eksternal: `sp_dc_genset_external` & detail
28. Perawatan Pendinginan Internal: `sp_dc_cool_internal` & detail
29. Perawatan Pendinginan Eksternal: `sp_dc_cool_external` & detail
30. Pengukuran THD: `sp_dc_thd`, Harmonic Filter: `sp_dc_harmonic` & lokasi, Surge Arrestor: `sp_dc_surge` & lokasi
31. Water Leak Detector: `sp_dc_waterleak` & lokasi

#### 5. Okupansi: Lainnya (`lainnya`)
- **`sp_lainnya_desc`** (Textarea): *Deskripsi Jenis Usaha & Hal Khusus yang Perlu Diperhatikan*

---

### D. Upload Dokumen & Foto (`sec3`)
- **`up_foto`** (File multiple image/*): *Foto Bangunan (Tampak Depan, Samping, Dalam, dll.)*
- **`up_site_layout`** (File single): *General Site Layout / denah keseluruhan lokasi*
- **`up_fire_layout`** (File single): *Layout Proteksi Kebakaran*
- **`up_hot_work`** (File single): *Form / Contoh Hot Work Permit*
- **`up_catatan`** (Textarea): *Catatan Terkait Dokumen / Foto*

---

### E. Management (`sec4`) — Bobot Kategori I
Lima Pertanyaan Ya/Tidak Utama:
- **`m1`** (Radio Ya/Tidak, Wajib *): *Kebersihan dan kerapihan — Lokasi terlihat bersih dan rapi secara visual*
- **`m2`** (Radio Ya/Tidak, Wajib *): *Aturan merokok — Ada larangan merokok, tidak nampak puntung rokok di area berisiko*
- **`m3`** (Radio Ya/Tidak, Wajib *): *Pelatihan kebakaran — Diadakan minimal 1x per tahun, ada bukti/dokumentasi*
- **`m4`** (Radio Ya/Tidak, Wajib *): *Perawatan rutin — Dilakukan inspeksi dan pemeliharaan berkala atas instalasi*
- **`m7`** (Radio Ya/Tidak, Wajib *): *Hot Work Permit — Ada prosedur tertulis dan implementasi izin kerja panas*

Riwayat Klaim & Rekomendasi:
- **`m_klaim`** (Radio: `0`, `1-2`, `3+`, Wajib *): *Jumlah klaim dalam 5 tahun terakhir*
- **`m_klaim_detail`** (Repeater/Array): Detail klaim (Tahun, Jenis Kerugian, Nilai Klaim, Penyebab)
- **`m_improvement`** (Radio Ya/Tidak, Wajib * jika `m_klaim` != 0): *Risk improvement atas klaim sebelumnya*
- **`m_improvement_detail`** (Textarea): *Ringkasan Kejadian & Tindak Lanjut / Perbaikan yang Dilakukan*
- **`m_rekomendasi`** (Radio Ya/Tidak, Wajib *): *> 50% rekomendasi Aswata telah dijalankan?*
- **`m_catatan`** (Textarea): *Catatan Management*

---

### F. Construction (`sec5`) — Bobot Kategori I
- **`c_kelas`** (Radio skor `8`/`6`/`4`/`3`, Wajib *): *Kelas Konstruksi Bangunan*
  - `8`: Kelas 1 (Konstruksi Beton) - Good (8)
  - `6`: Kelas 1 (Konstruksi Baja) - Average (6)
  - `4`: Kelas 2 (Sebagian Kayu/Baja Ringan) - Marginal (4)
  - `3`: Kelas 3 (Mayoritas Kayu/Combustible) - Poor (3)
- **`c_lantai`** (Number, Wajib *): *Jumlah Lantai*
- **`c_luas`** (Number): *Luas Bangunan (m²)*
- **`c_tahun`** (Number): *Tahun Dibangun*
- **`c_sandwich`** (Radio Ya/Tidak, Wajib *): *Menggunakan Combustible Sandwich Panel > 30% floor area?*
- **`c_acp`** (Radio Ya/Tidak, Wajib *): *Menggunakan Combustible ACP > 30% surface area?*
- **`c_catatan`** (Textarea): *Catatan Konstruksi*

---

### G. Occupancy (`sec6`) — Bobot Kategori I
- **`o_breakdown_code`** (Lookup Wajib *): *Breakdown Okupansi ASWATA (365 kode referensi)*
- **`o_breakdown_name`**: Nama deskripsi okupansi terpilih
- **`o_hazard_score`**: Skor hazard okupansi (2-8)
- **`o_hazard_cat`**: Kategori hazard risk (low_nonhazardous, low_industrial_others, mhr12, mhr3, high, energy)
- **`o_hazard_label`**: Label kategori hazard
- **`o_deskripsi`** (Textarea, Wajib *): *Deskripsi aktivitas utama di lokasi*
- **`o_kimia`** (Radio: None / Small / Large): *Penyimpanan / penggunaan bahan kimia berbahaya*
- **`o_dapur`** (Radio Ya/Tidak): *Apakah ada dapur/kitchen (Restaurant, Hotel, Central Kitchen)?*
- **`o_forklift`** (Radio Ya/Tidak): *Apakah ada forklift listrik yang diisi baterai di dalam gedung?*

---

### H. Protection — Proteksi Kebakaran (`sec7`) — Bobot Kategori I
Komponen Penilaian & Bobot:
- **`p_apar`** (Radio: `good` (6), `avg` (4), `none` (2), Bobot 25%, Wajib *): *APAR — Alat Pemadam Api Ringan*
- **`p_hidran`** (Radio: `good` (8), `avg` (6), `none` (2), Bobot 30%, Wajib *): *Hidran — Unit Boks/Pillar Hidran*
  - Subfield: Indoor hydrant count, Outdoor hydrant count, Jockey/Main/Diesel pump specs (units, kapasitas, auto-start), Kapasitas storage air
- **`p_detektor`** (Radio: `good` (8), `avg` (6), `none` (2), Bobot 25%, Wajib *): *Detektor Kebakaran Otomatis*
  - Subfield: `p_det_normal` (Fungsi normal?: Ya/Tidak), Tipe detektor, Cakupan instalasi (<30%, 30-50%, 50-80%, >80%), Penjelasan cakupan
- **`p_sprinkler`** (Radio: `good` (8), `avg` (6), `none` (2), Bobot 10%, Wajib *): *Sprinkler*
  - Subfield: Suplai air sama dengan hidran, Cakupan instalasi, Penjelasan cakupan
- **`p_damkar`** (Radio: `8` (<15 mnt), `6` (15-30 mnt), `4` (30-45 mnt), `2` (>45 mnt), Bobot 10%, Wajib *): *Respons Pemadam Kebakaran Publik*
- **`p_catatan`** (Textarea): *Keterangan tambahan proteksi kebakaran*

---

### I. Exposure (`sec8`) — Bobot Kategori II (Max Good 4)
- **`ex_kondisi`** (Radio skor `4`/`3`/`2`/`1`, Wajib *): *Kondisi fasilitas di sekitar bangunan tertanggung*
  - `4`: Berdiri sendiri, tidak ada fasilitas lain dalam radius 100 m — Good (4)
  - `3`: Fasilitas lain berisiko rendah/sedang, jarak > 15 m — Average (3)
  - `2`: Fasilitas berisiko sedang, jarak 5-15 m — Marginal (2)
  - `1`: Menempel / jarak < 5 m ke fasilitas berisiko tinggi — Poor (1)
- **`ex_deskripsi`** (Textarea): *Deskripsi fasilitas/bangunan di sekitar*

---

### J. Natural Hazards (`sec9`) — Bobot Kategori II (Max 3/2)
- **`nh_gempa_zone`** (Select: `1`-`5`, Wajib *): *Tarif & Zona Gempa OJK* (Zona 1-4 Average, Zona 5 Marginal)
- **Banjir (5 Pertanyaan Ya/Tidak)** (Semua harus Ya agar Average):
  - `nh_flood_loss`: Tidak pernah tergenang / riwayat banjir
  - `nh_flood_prone`: Bukan area rawan banjir OJK / peta banjir
  - `nh_flood_river`: Jarak dari sungai/kali > 500m atau ada tanggul memadai
  - `nh_flood_elev`: Elevasi lantai bangunan lebih tinggi dari jalan/lingkungan
  - `nh_flood_hill`: Bukan area lembah / rawan limpasan bukit
- **`nh_petir`** (Radio: `avg` (Average) / `marg` (Marginal), Wajib *): *Penangkal Petir*
- Aturan Kombinasi: Jika Gempa, Banjir, atau Petir ada yang Marginal -> Natural Hazards = Marginal (2), jika semua Average -> Average (3).

---

### K. Loss Estimate & Other Perils (`sec10`)
- **`le_pemisah`** (Radio Ya/Tidak, TBC): *Ada Pemisah Antar Bangunan (Fire Wall / Jarak Aman)?*
- **`le_jml_bangunan`** (Radio: `single` (1 bangunan), `multi` (>1 bangunan), Wajib *): *Jumlah Bangunan*
- **`op_ada`** (Radio Ya/Tidak, Wajib *): *Other Perils — Apakah ada risiko khusus lain?*
- **`op_deskripsi`** (Textarea, jika Ya): *Penjelasan risiko khusus lain*
- **`f_catatan_surveyor`** (Textarea): *Catatan Tambahan Surveyor*

---

### L. Hasil Risk Grading (`sec11`)
- **Kalkulasi Otomatis** (Tabel & Total Skor dari 8 Kategori, Skala 55 poin):
  - >= 46: **GOOD**
  - 31 - 45: **AVERAGE**
  - 21 - 30: **MARGINAL**
  - < 21: **POOR**
  - *Special override*: Jika Protection = 'Poor', Overall Risk Grading otomatis di-override menjadi **POOR**.
- **`f_rekomendasi`** (Radio, Wajib saat submit review):
  - Layak Dicover
  - Layak Dicover dengan Syarat/Perbaikan
  - Perlu Review Lebih Lanjut
  - Tidak Layak Dicover
- **`f_kesimpulan`** (Textarea): *Catatan Kesimpulan*
