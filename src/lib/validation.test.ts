import { test } from 'node:test';
import assert from 'node:assert';
import { validateSurveySubmission } from './validation';

test('Draft with empty answers produces expected mandatory issues upon submission', () => {
  const issues = validateSurveySubmission({});
  assert.ok(issues.length > 10, 'Empty submission should catch all required fields');
  assert.ok(issues.some((i) => i.fieldKey === 'f_tertanggung'));
  assert.ok(issues.some((i) => i.fieldKey === 'f_kode_pos'));
  assert.ok(issues.some((i) => i.fieldKey === 'c_kelas'));
});

test('Conditional validation requires improvement when claims exist', () => {
  const answers = {
    f_tertanggung: 'PT ABC',
    f_alamat: 'Jl Sudirman',
    f_kode_pos: '12345',
    f_gps: '-6.2, 106.8',
    f_tanggal: '2026-10-13',
    f_cabang: 'Jakarta',
    f_tsi: '5000000000',
    sp_jenis: 'lainnya',
    m1: 'yes',
    m2: 'yes',
    m3: 'yes',
    m4: 'yes',
    m7: 'yes',
    m_klaim: '1-2', // claims exist
    // m_improvement is missing
    m_rekomendasi: 'yes',
    c_kelas: '8',
    c_lantai: '2',
    c_sandwich: 'no',
    c_acp: 'no',
    o_hazard_score: '6',
    o_deskripsi: 'Kantor',
    p_apar: 'good',
    p_hidran: 'good',
    p_detektor: 'good',
    p_det_normal: 'yes',
    p_sprinkler: 'good',
    p_damkar: '8',
    ex_kondisi: '4',
    nh_gempa_zone: '2',
    nh_flood_loss: 'yes',
    nh_flood_prone: 'yes',
    nh_flood_river: 'yes',
    nh_flood_elev: 'yes',
    nh_flood_hill: 'yes',
    nh_petir: 'avg',
    le_jml_bangunan: 'single',
    op_ada: 'no',
    f_rekomendasi: 'Layak dicover',
  };

  const issues = validateSurveySubmission(answers);
  assert.strictEqual(issues.length, 1);
  assert.strictEqual(issues[0].fieldKey, 'm_improvement');
});

test('Invalid 4-digit postal code is flagged', () => {
  const issues = validateSurveySubmission({
    f_tertanggung: 'PT XYZ',
    f_kode_pos: '1234', // invalid
  });
  const postalIssue = issues.find((i) => i.fieldKey === 'f_kode_pos');
  assert.ok(postalIssue);
  assert.ok(postalIssue.message.includes('5 digit'));
});
