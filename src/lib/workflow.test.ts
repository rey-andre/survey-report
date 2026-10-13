import { test } from 'node:test';
import assert from 'node:assert';
import { prisma } from './prisma';
import bcrypt from 'bcryptjs';
import { calculateRiskGrading } from './grading';
import { validateSurveySubmission } from './validation';

test('End-to-end Workflow Integration: Surveyor -> Risk Eng -> Underwriter', async () => {
  // 1. Get seeded surveyor
  const surveyor = await prisma.user.findUnique({
    where: { email: 'surveyor@example.test' },
  });
  assert.ok(surveyor, 'Surveyor account must exist');

  const riskEng = await prisma.user.findUnique({
    where: { email: 'risk.engineering@example.test' },
  });
  assert.ok(riskEng, 'Risk Engineering account must exist');

  const underwriter = await prisma.user.findUnique({
    where: { email: 'underwriter@example.test' },
  });
  assert.ok(underwriter, 'Underwriter account must exist');

  const activeVersion = await prisma.formVersion.findFirst({
    where: { status: 'PUBLISHED' },
  });
  assert.ok(activeVersion, 'Active form version must exist');

  // 2. Surveyor creates new survey draft
  const survey = await prisma.survey.create({
    data: {
      surveyorId: surveyor.id,
      formVersionId: activeVersion.id,
      status: 'DRAFT',
      insuredName: 'PT Industri Maju Bersama',
    },
  });
  assert.strictEqual(survey.status, 'DRAFT');

  // 3. Save partial draft answers without mandatory validation
  const partialAnswers = {
    f_tertanggung: 'PT Industri Maju Bersama',
    f_alamat: 'Kawasan Industri MM2100 Blok C, Cikarang Barat',
    c_lantai: '2',
    m1: 'yes',
  };

  for (const [key, val] of Object.entries(partialAnswers)) {
    await prisma.surveyAnswer.upsert({
      where: {
        surveyId_questionKey: {
          surveyId: survey.id,
          questionKey: key,
        },
      },
      update: { valueJson: JSON.stringify(val) },
      create: {
        surveyId: survey.id,
        questionKey: key,
        valueJson: JSON.stringify(val),
      },
    });
  }

  const savedAnswers = await prisma.surveyAnswer.findMany({
    where: { surveyId: survey.id },
  });
  assert.strictEqual(savedAnswers.length, 4, 'Partial draft answers must be persisted');

  // 4. Validate that submission fails if incomplete
  const issues = validateSurveySubmission(partialAnswers);
  assert.ok(issues.length > 0, 'Incomplete survey must be rejected upon submission');

  // 5. Complete all required fields
  const completeAnswers = {
    ...partialAnswers,
    f_kode_pos: '17530',
    f_gps: '-6.3012, 107.1023',
    f_tanggal: '2026-10-13',
    f_cabang: 'Jakarta',
    f_tsi: '75000000000',
    sp_jenis: 'lainnya',
    m2: 'yes',
    m3: 'yes',
    m4: 'yes',
    m7: 'yes',
    m_klaim: '0',
    m_rekomendasi: 'yes',
    c_kelas: '8',
    c_sandwich: 'no',
    c_acp: 'no',
    o_hazard_score: '6',
    o_deskripsi: 'Manufaktur komponen presisi',
    p_apar: 'good',
    p_hidran: 'good',
    p_detektor: 'good',
    p_det_normal: 'yes',
    p_sprinkler: 'good',
    p_damkar: '8',
    ex_kondisi: '3',
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

  const validationSuccess = validateSurveySubmission(completeAnswers);
  assert.strictEqual(validationSuccess.length, 0, 'Complete survey should pass validation');

  // 6. Calculate risk grading
  const grading = calculateRiskGrading(completeAnswers);
  assert.ok(grading.total >= 40, 'Complete good risk should achieve high score');

  // 7. Submit survey for review
  const submittedSurvey = await prisma.survey.update({
    where: { id: survey.id },
    data: {
      surveyNumber: 'SR-202610-0099',
      status: 'SUBMITTED',
      submittedAt: new Date(),
    },
  });
  assert.strictEqual(submittedSurvey.status, 'SUBMITTED');

  // 8. Risk Engineering review: Request revision first
  const revReqSurvey = await prisma.survey.update({
    where: { id: survey.id },
    data: { status: 'REVISION_REQUIRED' },
  });
  await prisma.surveyReview.create({
    data: {
      surveyId: survey.id,
      reviewType: 'RISK_ENGINEERING',
      decision: 'REVISION_REQUIRED',
      comment: 'Mohon upload denah proteksi kebakaran terbaru',
      reviewerId: riskEng.id,
    },
  });
  assert.strictEqual(revReqSurvey.status, 'REVISION_REQUIRED');

  // 9. Surveyor re-submits after revision
  const reSubmittedSurvey = await prisma.survey.update({
    where: { id: survey.id },
    data: { status: 'SUBMITTED' },
  });
  assert.strictEqual(reSubmittedSurvey.status, 'SUBMITTED');

  // 10. Risk Engineering approves technical stage
  const approvedSurvey = await prisma.survey.update({
    where: { id: survey.id },
    data: {
      status: 'RISK_APPROVED',
      riskApprovedAt: new Date(),
    },
  });
  assert.strictEqual(approvedSurvey.status, 'RISK_APPROVED');

  // 11. Underwriter decisions final acceptance
  const completedSurvey = await prisma.survey.update({
    where: { id: survey.id },
    data: {
      status: 'COMPLETED',
      completedAt: new Date(),
    },
  });
  await prisma.surveyReview.create({
    data: {
      surveyId: survey.id,
      reviewType: 'UNDERWRITING',
      decision: 'COVERABLE',
      comment: 'Akseptasi disetujui penuh dengan rate standar Aswata.',
      reviewerId: underwriter.id,
    },
  });
  assert.strictEqual(completedSurvey.status, 'COMPLETED');

  // Clean up test survey record
  await prisma.survey.delete({ where: { id: survey.id } });
});
