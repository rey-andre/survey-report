export interface RiskScores {
  management: number;
  construction: number;
  occupancy: number;
  protection: number;
  exposure: number;
  nat_hazards: number;
  other_perils: number;
  loss_estimate: number;
}

export type RatingLabel = 'Good' | 'Average' | 'Marginal' | 'Poor';

export interface RiskRatings {
  management: RatingLabel;
  construction: RatingLabel;
  occupancy: RatingLabel;
  protection: RatingLabel;
  exposure: RatingLabel;
  nat_hazards: RatingLabel;
  other_perils: RatingLabel;
  loss_estimate: RatingLabel;
}

export interface RiskCalculationResult {
  scores: RiskScores;
  ratings: RiskRatings;
  total: number;
  overallGrade: 'GOOD' | 'AVERAGE' | 'MARGINAL' | 'POOR';
  protectionOverride: boolean;
  hidranWajib: {
    wajib: boolean;
    alasan: string[];
  };
}

export const COMMERCIAL_RESIDENTIAL_TSI_THRESHOLD = 100e9;

export const HIDRAN_THRESHOLD: Record<string, { label: string; amount: number }> = {
  energy: { label: 'Energy Hazard Risk', amount: 50e9 },
  high: { label: 'High Hazard Risk', amount: 50e9 },
  mhr3: { label: 'Medium Hazard Risk 3 (Flammable)', amount: 50e9 },
  mhr12: { label: 'Medium Hazard Risk 1 & 2', amount: 75e9 },
  low_industrial_others: { label: 'Low Hazard Risk (Industrial Risk-Others)', amount: 75e9 },
  low_nonhazardous: { label: 'Low Hazard Risk (Industrial Risk-Non Hazardous)', amount: 100e9 },
};

export function scoreToRating(s: number): RatingLabel {
  if (s >= 7) return 'Good';
  if (s >= 5) return 'Average';
  if (s >= 3) return 'Marginal';
  return 'Poor';
}

export function scoreExpToRating(s: number): RatingLabel {
  if (s >= 4) return 'Good';
  if (s >= 3) return 'Average';
  if (s >= 2) return 'Marginal';
  return 'Poor';
}

export function getHidranWajibStatus(answers: Record<string, any>): { wajib: boolean; alasan: string[] } {
  const cat = answers.o_hazard_cat || null;
  const tsi = parseFloat(answers.f_tsi) || 0;
  const damkarVal = answers.p_damkar ? String(answers.p_damkar) : '';
  const responLebih30 = damkarVal === '2'; // > 45 mnt (skor 2)
  const lantai = parseInt(answers.c_lantai, 10) || 0;
  const kelasVal = answers.c_kelas ? parseInt(answers.c_kelas, 10) : null;
  const kelasCombustible = kelasVal === 4 || kelasVal === 3;
  const jenisKhusus = answers.sp_jenis || '';
  const isCommercialResidential = jenisKhusus === 'commercial';

  let wajib = false;
  let alasan: string[] = [];

  if (isCommercialResidential && tsi >= COMMERCIAL_RESIDENTIAL_TSI_THRESHOLD) {
    if (lantai >= 6) {
      wajib = true;
      alasan = [
        'Commercial/Residential Risk',
        'TSI >= 100M',
        'Bangunan ≥ 6 lantai — wajib terlepas dari waktu respons pemadam publik',
      ];
    } else if ((lantai >= 4 || kelasCombustible) && responLebih30) {
      wajib = true;
      alasan = [
        'Commercial/Residential Risk',
        'TSI >= 100M',
        lantai >= 4 ? 'Bangunan ≥ 4 lantai' : 'Konstruksi combustible Class 2/3',
        'Waktu respons pemadam kebakaran publik > 30 menit',
      ];
    }
  } else if (!isCommercialResidential && cat && HIDRAN_THRESHOLD[cat] && responLebih30 && tsi >= HIDRAN_THRESHOLD[cat].amount) {
    wajib = true;
    alasan = [
      'Waktu respons pemadam kebakaran publik > 30 menit',
      'Kategori risiko: ' + HIDRAN_THRESHOLD[cat].label,
      'TSI Rp ' + tsi.toLocaleString('id-ID') + ' ≥ Rp ' + HIDRAN_THRESHOLD[cat].amount.toLocaleString('id-ID'),
    ];
  }

  return { wajib, alasan };
}

export function getNaturalHazardStatus(answers: Record<string, any>) {
  const zona = answers.nh_gempa_zone ? String(answers.nh_gempa_zone) : '';
  const gempa = zona ? (zona === '5' ? 'Marginal' : 'Average') : null;

  const floodNames = ['nh_flood_loss', 'nh_flood_prone', 'nh_flood_river', 'nh_flood_elev', 'nh_flood_hill'];
  const floodValues = floodNames.map((name) => answers[name] || null);
  const floodComplete = floodValues.every(Boolean);
  const banjir = floodComplete ? (floodValues.every((v) => v === 'yes') ? 'Average' : 'Marginal') : null;

  const petirVal = answers.nh_petir || '';
  const petir = petirVal ? (petirVal === 'marg' ? 'Marginal' : 'Average') : null;

  const complete = !!(gempa && petir && floodComplete);
  const overall = complete && gempa === 'Average' && banjir === 'Average' && petir === 'Average' ? 'Average' : (complete ? 'Marginal' : null);

  return { gempa, banjir, petir, overall, complete };
}

export function calculateRiskGrading(answers: Record<string, any>): RiskCalculationResult {
  const scores: Partial<RiskScores> = {};
  const ratings: Partial<RiskRatings> = {};

  // 1. MANAGEMENT
  const mKeys = ['m1', 'm2', 'm3', 'm4', 'm7'];
  const mChecked = mKeys.filter((key) => answers[key] === 'yes').length;
  const mBase = mChecked >= 4 ? 8 : mChecked >= 3 ? 6 : mChecked >= 1 ? 4 : 2;
  let mAdj = 0;
  const mKlaim = answers.m_klaim;
  if (mKlaim === '3+') mAdj -= 2;
  if (mKlaim === '1-2') mAdj -= 1;
  const mImp = answers.m_improvement;
  if (mKlaim && mKlaim !== '0' && mImp === 'yes') mAdj += 2;
  const mRek = answers.m_rekomendasi;
  if (mRek === 'yes') mAdj += 2;

  scores.management = Math.max(2, Math.min(8, mBase + mAdj));
  ratings.management = scoreToRating(scores.management);

  // 2. CONSTRUCTION
  const cKelas = answers.c_kelas ? parseInt(answers.c_kelas, 10) : 4;
  let cBase = cKelas;
  const downgradeTier = (score: number) => (score >= 8 ? 6 : score >= 6 ? 4 : score >= 4 ? 3 : 3);
  if (answers.c_sandwich === 'yes') cBase = downgradeTier(cBase);
  if (answers.c_acp === 'yes') cBase = downgradeTier(cBase);

  scores.construction = cBase;
  ratings.construction = cBase <= 3 ? 'Poor' : cBase <= 4 ? 'Marginal' : cBase <= 6 ? 'Average' : 'Good';

  // 3. OCCUPANCY (From hazard score)
  const oScore = answers.o_hazard_score ? parseInt(answers.o_hazard_score, 10) : 4;
  scores.occupancy = oScore;
  ratings.occupancy = scoreToRating(scores.occupancy);

  // 4. PROTECTION
  const pScores: Record<string, Record<string, number>> = {
    apar: { good: 6, avg: 4, none: 2 },
    hidran: { good: 8, avg: 6, none: 2 },
    detektor: { good: 8, avg: 6, none: 2 },
    sprinkler: { good: 8, avg: 6, none: 2 },
  };
  const weights: Record<string, number> = {
    apar: 0.25,
    hidran: 0.3,
    detektor: 0.25,
    sprinkler: 0.1,
  };

  let pTotal = 0;
  for (const name of ['apar', 'hidran', 'detektor', 'sprinkler']) {
    const valKey = answers[`p_${name}`] || 'none';
    const val = pScores[name]?.[valKey] ?? 2;
    pTotal += val * weights[name];
  }
  const pDamkar = answers.p_damkar ? parseInt(answers.p_damkar, 10) : 4;
  pTotal += pDamkar * 0.1;

  scores.protection = Math.round(pTotal);
  ratings.protection = scoreToRating(scores.protection);

  // Hidran wajib penalty check
  const hidranCheck = getHidranWajibStatus(answers);
  const pHidranVal = answers.p_hidran || 'none';
  if (hidranCheck.wajib && pHidranVal === 'none') {
    scores.protection = 2;
    ratings.protection = 'Poor';
  }

  // 5. EXPOSURE
  const exV = answers.ex_kondisi ? parseInt(answers.ex_kondisi, 10) : 2;
  scores.exposure = exV;
  ratings.exposure = scoreExpToRating(scores.exposure);

  // 6. NATURAL HAZARDS
  const nhStatus = getNaturalHazardStatus(answers);
  scores.nat_hazards = nhStatus.overall === 'Average' ? 3 : 2;
  ratings.nat_hazards = nhStatus.overall === 'Average' ? 'Average' : 'Marginal';

  // 7. OTHER PERILS
  scores.other_perils = 3;
  ratings.other_perils = 'Average';

  // 8. LOSS ESTIMATE
  const leV = answers.le_jml_bangunan === 'multi';
  scores.loss_estimate = leV ? 3 : 5;
  ratings.loss_estimate = leV ? 'Marginal' : 'Average';

  // TOTAL
  const finalScores = scores as RiskScores;
  const total =
    finalScores.management +
    finalScores.construction +
    finalScores.occupancy +
    finalScores.protection +
    finalScores.exposure +
    finalScores.nat_hazards +
    finalScores.other_perils +
    finalScores.loss_estimate;

  let overallGrade: 'GOOD' | 'AVERAGE' | 'MARGINAL' | 'POOR';
  if (total >= 46) overallGrade = 'GOOD';
  else if (total >= 31) overallGrade = 'AVERAGE';
  else if (total >= 21) overallGrade = 'MARGINAL';
  else overallGrade = 'POOR';

  let protectionOverride = false;
  // Protection Poor override final rating to POOR
  if (ratings.protection === 'Poor') {
    overallGrade = 'POOR';
    protectionOverride = true;
  }

  return {
    scores: finalScores,
    ratings: ratings as RiskRatings,
    total,
    overallGrade,
    protectionOverride,
    hidranWajib: hidranCheck,
  };
}
