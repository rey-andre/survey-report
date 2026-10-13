import { test } from 'node:test';
import assert from 'node:assert';
import {
  calculateRiskGrading,
  scoreToRating,
  scoreExpToRating,
  getHidranWajibStatus,
  getNaturalHazardStatus,
} from './grading';

test('scoreToRating maps correctly', () => {
  assert.strictEqual(scoreToRating(8), 'Good');
  assert.strictEqual(scoreToRating(7), 'Good');
  assert.strictEqual(scoreToRating(6), 'Average');
  assert.strictEqual(scoreToRating(5), 'Average');
  assert.strictEqual(scoreToRating(4), 'Marginal');
  assert.strictEqual(scoreToRating(3), 'Marginal');
  assert.strictEqual(scoreToRating(2), 'Poor');
});

test('scoreExpToRating maps correctly for exposure', () => {
  assert.strictEqual(scoreExpToRating(4), 'Good');
  assert.strictEqual(scoreExpToRating(3), 'Average');
  assert.strictEqual(scoreExpToRating(2), 'Marginal');
  assert.strictEqual(scoreExpToRating(1), 'Poor');
});

test('Management calculation with claims and improvement', () => {
  // 5 checklist items yes -> base 8. Klaim 3+ -> -2. Improvement yes -> +2. Rekomendasi yes -> +2 (capped at 8)
  const answers = {
    m1: 'yes',
    m2: 'yes',
    m3: 'yes',
    m4: 'yes',
    m7: 'yes',
    m_klaim: '3+',
    m_improvement: 'yes',
    m_rekomendasi: 'yes',
    c_kelas: '8',
    c_sandwich: 'no',
    c_acp: 'no',
    o_hazard_score: '8',
    p_apar: 'good',
    p_hidran: 'good',
    p_detektor: 'good',
    p_sprinkler: 'good',
    p_damkar: '8',
    ex_kondisi: '4',
    nh_gempa_zone: '1',
    nh_flood_loss: 'yes',
    nh_flood_prone: 'yes',
    nh_flood_river: 'yes',
    nh_flood_elev: 'yes',
    nh_flood_hill: 'yes',
    nh_petir: 'avg',
    le_jml_bangunan: 'single',
  };

  const res = calculateRiskGrading(answers);
  assert.strictEqual(res.scores.management, 8);
  assert.strictEqual(res.ratings.management, 'Good');
  assert.strictEqual(res.overallGrade, 'GOOD');
});

test('Construction downgrade for combustible sandwich and ACP', () => {
  // Class 1 Beton (8) -> downgrade sandwich -> 6 -> downgrade ACP -> 4
  const answers = {
    c_kelas: '8',
    c_sandwich: 'yes',
    c_acp: 'yes',
  };
  const res = calculateRiskGrading(answers);
  assert.strictEqual(res.scores.construction, 4);
  assert.strictEqual(res.ratings.construction, 'Marginal');
});

test('Hidran Wajib trigger and Protection Poor override', () => {
  // Commercial risk with TSI 120M (>= 100M) and >= 6 floors -> Hidran Wajib
  const answers = {
    sp_jenis: 'commercial',
    f_tsi: '120000000000',
    c_lantai: '7',
    c_kelas: '8',
    p_apar: 'good',
    p_hidran: 'none', // No hydrant!
    p_detektor: 'good',
    p_sprinkler: 'good',
    p_damkar: '8',
  };

  const hidran = getHidranWajibStatus(answers);
  assert.strictEqual(hidran.wajib, true);

  const res = calculateRiskGrading(answers);
  assert.strictEqual(res.scores.protection, 2);
  assert.strictEqual(res.ratings.protection, 'Poor');
  assert.strictEqual(res.protectionOverride, true);
  assert.strictEqual(res.overallGrade, 'POOR');
});

test('Natural Hazards combination: one marginal makes overall marginal', () => {
  const answers = {
    nh_gempa_zone: '5', // Zona 5 = Marginal
    nh_flood_loss: 'yes',
    nh_flood_prone: 'yes',
    nh_flood_river: 'yes',
    nh_flood_elev: 'yes',
    nh_flood_hill: 'yes',
    nh_petir: 'avg',
  };

  const nh = getNaturalHazardStatus(answers);
  assert.strictEqual(nh.gempa, 'Marginal');
  assert.strictEqual(nh.banjir, 'Average');
  assert.strictEqual(nh.petir, 'Average');
  assert.strictEqual(nh.overall, 'Marginal');
});
