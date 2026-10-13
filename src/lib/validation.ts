export interface ValidationError {
  sectionIndex: number;
  sectionKey: string;
  fieldKey: string;
  label: string;
  message: string;
}

export function validateSurveySubmission(answers: Record<string, any>): ValidationError[] {
  const errors: ValidationError[] = [];

  const addError = (secIdx: number, secKey: string, fieldKey: string, label: string, message?: string) => {
    errors.push({
      sectionIndex: secIdx,
      sectionKey: secKey,
      fieldKey,
      label,
      message: message || `${label} wajib diisi sebelum dikirim untuk review.`,
    });
  };

  const hasVal = (k: string) => {
    const v = answers[k];
    if (v === undefined || v === null) return false;
    if (typeof v === 'string') return v.trim().length > 0;
    if (typeof v === 'number') return !isNaN(v);
    return true;
  };

  // Section 0: Informasi Umum
  if (!hasVal('f_tertanggung')) addError(0, 'sec0', 'f_tertanggung', 'Nama Tertanggung');
  if (!hasVal('f_alamat')) addError(0, 'sec0', 'f_alamat', 'Alamat Risiko Lengkap');
  if (!hasVal('f_kode_pos')) {
    addError(0, 'sec0', 'f_kode_pos', 'Kode Pos');
  } else if (!/^\d{5}$/.test(String(answers.f_kode_pos).trim())) {
    addError(0, 'sec0', 'f_kode_pos', 'Kode Pos', 'Kode Pos harus berupa 5 digit angka.');
  }
  if (!hasVal('f_gps')) addError(0, 'sec0', 'f_gps', 'Koordinat GPS');
  if (!hasVal('f_tanggal')) addError(0, 'sec0', 'f_tanggal', 'Tanggal Survey');
  if (!hasVal('f_cabang')) addError(0, 'sec0', 'f_cabang', 'Cabang');
  if (!hasVal('f_tsi')) addError(0, 'sec0', 'f_tsi', 'Nilai Pertanggungan / TSI (Rp)');

  // Section 2: Survey Khusus Okupansi
  if (!hasVal('sp_jenis')) {
    addError(2, 'sec2', 'sp_jenis', 'Kategori Okupansi');
  } else {
    const jenis = answers.sp_jenis;
    if (jenis === 'pabrik') {
      if (!hasVal('sp_pb_material')) addError(2, 'sec2', 'sp_pb_material', 'Material (Bahan Baku Utama)');
      if (!hasVal('sp_pb_proses')) addError(2, 'sec2', 'sp_pb_proses', 'Proses Produksi');
      if (!hasVal('sp_pb_produk')) addError(2, 'sec2', 'sp_pb_produk', 'Produk (Hasil Akhir)');
      if (!hasVal('sp_pb_mesin')) addError(2, 'sec2', 'sp_pb_mesin', 'Mesin Utama');
    } else if (jenis === 'commercial') {
      if (!hasVal('sp_cm_tipe')) addError(2, 'sec2', 'sp_cm_tipe', 'Sub-Tipe Commercial');
    } else if (jenis === 'gudang') {
      if (!hasVal('sp_gd_komoditas')) addError(2, 'sec2', 'sp_gd_komoditas', 'Klasifikasi Komoditas Gudang');
      if (!hasVal('sp_gd_klasifikasi')) addError(2, 'sec2', 'sp_gd_klasifikasi', 'Klasifikasi Kepemilikan / Pengelolaan Gudang');
      if (!hasVal('sp_gd_ojk_code')) addError(2, 'sec2', 'sp_gd_ojk_code', 'Kategori Barang (Kode OJK)');
    }
  }

  // Section 4: Management
  const mChecklist = [
    ['m1', 'Kebersihan dan kerapihan'],
    ['m2', 'Aturan merokok'],
    ['m3', 'Pelatihan kebakaran'],
    ['m4', 'Perawatan rutin'],
    ['m7', 'Hot Work Permit'],
  ];
  for (const [key, label] of mChecklist) {
    if (!hasVal(key)) addError(4, 'sec4', key, `Management — ${label}`);
  }
  if (!hasVal('m_klaim')) addError(4, 'sec4', 'm_klaim', 'Jumlah klaim dalam 5 tahun terakhir');
  if (hasVal('m_klaim') && answers.m_klaim !== '0' && !hasVal('m_improvement')) {
    addError(4, 'sec4', 'm_improvement', 'Risk improvement atas klaim sebelumnya');
  }
  if (!hasVal('m_rekomendasi')) addError(4, 'sec4', 'm_rekomendasi', '> 50% rekomendasi Aswata telah dijalankan?');

  // Section 5: Construction
  if (!hasVal('c_kelas')) addError(5, 'sec5', 'c_kelas', 'Kelas Konstruksi Bangunan');
  if (!hasVal('c_lantai')) addError(5, 'sec5', 'c_lantai', 'Jumlah Lantai');
  if (!hasVal('c_sandwich')) addError(5, 'sec5', 'c_sandwich', 'Combustible Sandwich Panel > 30%');
  if (!hasVal('c_acp')) addError(5, 'sec5', 'c_acp', 'Combustible ACP > 30%');

  // Section 6: Occupancy
  if (!hasVal('o_breakdown_code') && !hasVal('o_hazard_score')) {
    addError(6, 'sec6', 'o_breakdown_code', 'Breakdown Okupansi ASWATA');
  }
  if (!hasVal('o_deskripsi')) addError(6, 'sec6', 'o_deskripsi', 'Deskripsi aktivitas utama di lokasi');

  // Section 7: Protection
  const pChecklist = [
    ['p_apar', 'APAR'],
    ['p_hidran', 'Hidran'],
    ['p_detektor', 'Detektor Kebakaran Otomatis'],
    ['p_sprinkler', 'Sprinkler'],
    ['p_damkar', 'Respons Pemadam Kebakaran Publik'],
  ];
  for (const [key, label] of pChecklist) {
    if (!hasVal(key)) addError(7, 'sec7', key, `Proteksi — ${label}`);
  }
  if ((answers.p_detektor === 'good' || answers.p_detektor === 'avg') && !hasVal('p_det_normal')) {
    addError(7, 'sec7', 'p_det_normal', 'Detektor Kebakaran Otomatis — kondisi fungsi sistem');
  }

  // Section 8: Exposure
  if (!hasVal('ex_kondisi')) addError(8, 'sec8', 'ex_kondisi', 'Kondisi fasilitas di sekitar bangunan');

  // Section 9: Natural Hazards
  if (!hasVal('nh_gempa_zone')) addError(9, 'sec9', 'nh_gempa_zone', 'Tarif & Zona Gempa OJK');
  const nhBanjir = [
    ['nh_flood_loss', 'Riwayat loss banjir'],
    ['nh_flood_prone', 'Flood prone area'],
    ['nh_flood_river', 'Jarak dari sungai'],
    ['nh_flood_elev', 'Elevasi bangunan'],
    ['nh_flood_hill', 'Area perbukitan'],
  ];
  for (const [key, label] of nhBanjir) {
    if (!hasVal(key)) addError(9, 'sec9', key, `Banjir — ${label}`);
  }
  if (!hasVal('nh_petir')) addError(9, 'sec9', 'nh_petir', 'Penangkal Petir');

  // Section 10: Loss Estimate & Other Perils
  if (!hasVal('le_jml_bangunan')) addError(10, 'sec10', 'le_jml_bangunan', 'Jumlah Bangunan');
  if (!hasVal('op_ada')) addError(10, 'sec10', 'op_ada', 'Other Perils — risiko khusus lain');
  if (answers.op_ada === 'yes' && !hasVal('op_deskripsi')) {
    addError(10, 'sec10', 'op_deskripsi', 'Penjelasan risiko khusus lain');
  }

  // Section 11: Rekomendasi
  if (!hasVal('f_rekomendasi')) addError(11, 'sec11', 'f_rekomendasi', 'Rekomendasi Surveyor');

  return errors;
}
