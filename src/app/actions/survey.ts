'use server';

import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { validateSurveySubmission, ValidationError } from '@/lib/validation';
import { calculateRiskGrading } from '@/lib/grading';
import { revalidatePath } from 'next/cache';

export async function createSurveyAction() {
  const user = await requireAuth(['SURVEYOR', 'SUPER_ADMIN']);

  // Get active published form version
  const activeVersion = await prisma.formVersion.findFirst({
    where: { status: 'PUBLISHED' },
    orderBy: { createdAt: 'desc' },
  });

  if (!activeVersion) {
    throw new Error('Tidak ada versi formulir aktif yang tersedia.');
  }

  const survey = await prisma.survey.create({
    data: {
      surveyorId: user.id,
      branchId: user.branchId,
      formVersionId: activeVersion.id,
      status: 'DRAFT',
    },
  });

  await statusHistoryCreate({
    surveyId: survey.id,
    fromStatus: 'NONE',
    toStatus: 'DRAFT',
    actorId: user.id,
    comment: 'Survey baru dibuat dalam mode Draft.',
  });

  await prisma.auditLog.create({
    data: {
      actorId: user.id,
      action: 'SURVEY_CREATE',
      entityType: 'Survey',
      entityId: survey.id,
    },
  });

  return { success: true, surveyId: survey.id };
}

// Helper to record status history
async function statusHistoryCreate(data: {
  surveyId: string;
  fromStatus: string;
  toStatus: string;
  actorId: string;
  comment?: string;
}) {
  await prisma.surveyStatusHistory.create({
    data: {
      surveyId: data.surveyId,
      fromStatus: data.fromStatus,
      toStatus: data.toStatus,
      actorId: data.actorId,
      comment: data.comment || '',
    },
  });
}

export async function saveSurveyDraftAction(surveyId: string, answers: Record<string, any>) {
  const user = await requireAuth();

  const survey = await prisma.survey.findUnique({
    where: { id: surveyId },
  });

  if (!survey) {
    return { success: false, error: 'Survey tidak ditemukan.' };
  }

  // Permission check: surveyor can only edit own survey, unless super admin
  if (user.role === 'SURVEYOR' && survey.surveyorId !== user.id) {
    return { success: false, error: 'Anda tidak memiliki hak untuk mengubah survey ini.' };
  }

  if (survey.status !== 'DRAFT' && survey.status !== 'REVISION_REQUIRED' && user.role !== 'SUPER_ADMIN') {
    return { success: false, error: `Survey berstatus ${survey.status} tidak dapat diubah.` };
  }

  // Parse structured summary columns for dashboard efficiency
  const insuredName = answers.f_tertanggung || survey.insuredName;
  const commercialName = answers.f_merk || survey.commercialName;
  const riskAddress = answers.f_alamat || survey.riskAddress;
  const postalCode = answers.f_kode_pos || survey.postalCode;
  const gpsCoordinates = answers.f_gps || survey.gpsCoordinates;
  const surveyDate = answers.f_tanggal ? new Date(answers.f_tanggal) : survey.surveyDate;
  const occupancyCategory = answers.sp_jenis || survey.occupancyCategory;
  const tsiAmount = answers.f_tsi ? parseFloat(answers.f_tsi) : survey.tsiAmount;

  // Resolve branch if answered
  let branchId = survey.branchId;
  if (answers.f_cabang) {
    const branch = await prisma.branch.findUnique({ where: { name: answers.f_cabang } });
    if (branch) branchId = branch.id;
  }

  // Run calculation preview
  const calc = calculateRiskGrading(answers);

  await prisma.$transaction(async (tx) => {
    // 1. Update Survey top-level metadata
    await tx.survey.update({
      where: { id: surveyId },
      data: {
        insuredName,
        commercialName,
        riskAddress,
        postalCode,
        gpsCoordinates,
        surveyDate,
        occupancyCategory,
        tsiAmount,
        branchId,
        updatedAt: new Date(),
      },
    });

    // 2. Batch upsert answers
    for (const [key, value] of Object.entries(answers)) {
      if (value === undefined) continue;
      const jsonStr = JSON.stringify(value);
      await tx.surveyAnswer.upsert({
        where: {
          surveyId_questionKey: {
            surveyId,
            questionKey: key,
          },
        },
        update: {
          valueJson: jsonStr,
          updatedById: user.id,
        },
        create: {
          surveyId,
          questionKey: key,
          valueJson: jsonStr,
          updatedById: user.id,
        },
      });
    }

    // 3. Upsert calculation result
    const existingCalc = await tx.riskCalculation.findFirst({
      where: { surveyId },
    });

    if (existingCalc) {
      await tx.riskCalculation.update({
        where: { id: existingCalc.id },
        data: {
          resultJson: JSON.stringify(calc),
          overallGrade: calc.overallGrade,
          calculatedAt: new Date(),
          calculatedById: user.id,
        },
      });
    } else {
      await tx.riskCalculation.create({
        data: {
          surveyId,
          resultJson: JSON.stringify(calc),
          overallGrade: calc.overallGrade,
          calculatedById: user.id,
        },
      });
    }
  });

  revalidatePath(`/surveys/${surveyId}`);
  revalidatePath('/dashboard');

  return {
    success: true,
    updatedAt: new Date().toISOString(),
    calculation: calc,
  };
}

export async function submitSurveyForReviewAction(surveyId: string, answers: Record<string, any>) {
  const user = await requireAuth();

  const survey = await prisma.survey.findUnique({
    where: { id: surveyId },
  });

  if (!survey) {
    return { success: false, error: 'Survey tidak ditemukan.' };
  }

  if (user.role === 'SURVEYOR' && survey.surveyorId !== user.id) {
    return { success: false, error: 'Anda tidak memiliki hak untuk mengirim survey ini.' };
  }

  if (survey.status !== 'DRAFT' && survey.status !== 'REVISION_REQUIRED' && user.role !== 'SUPER_ADMIN') {
    return { success: false, error: `Survey berstatus ${survey.status} tidak dapat dikirim.` };
  }

  // MANDATORY VALIDATION
  const errors = validateSurveySubmission(answers);
  if (errors.length > 0) {
    return {
      success: false,
      error: `Terdapat ${errors.length} data wajib atau kondisional yang belum dilengkapi.`,
      validationErrors: errors,
    };
  }

  // Save answers first
  await saveSurveyDraftAction(surveyId, answers);

  // Generate Survey Number if not set
  let surveyNumber = survey.surveyNumber;
  if (!surveyNumber) {
    const datePrefix = new Date().toISOString().slice(0, 7).replace('-', '');
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    surveyNumber = `SR-${datePrefix}-${randomSuffix}`;
  }

  const fromStatus = survey.status;
  const toStatus = 'SUBMITTED';

  await prisma.$transaction(async (tx) => {
    await tx.survey.update({
      where: { id: surveyId },
      data: {
        surveyNumber,
        status: toStatus,
        submittedAt: new Date(),
        updatedAt: new Date(),
      },
    });

    await tx.surveyStatusHistory.create({
      data: {
        surveyId,
        fromStatus,
        toStatus,
        actorId: user.id,
        comment: fromStatus === 'REVISION_REQUIRED' ? 'Survey telah diperbaiki dan dikirim ulang untuk review.' : 'Survey dikirim untuk review teknis Risk Engineering.',
      },
    });

    await tx.auditLog.create({
      data: {
        actorId: user.id,
        action: 'SURVEY_SUBMIT',
        entityType: 'Survey',
        entityId: surveyId,
        metadataJson: JSON.stringify({ surveyNumber, fromStatus, toStatus }),
      },
    });
  });

  revalidatePath(`/surveys/${surveyId}`);
  revalidatePath('/dashboard');
  revalidatePath('/reviews/risk-engineering');

  return { success: true, surveyNumber };
}

export async function riskEngineeringReviewAction(payload: {
  surveyId: string;
  decision: 'APPROVE' | 'REVISION_REQUIRED';
  comment: string;
}) {
  const user = await requireAuth(['RISK_ENGINEERING', 'SUPER_ADMIN']);

  const { surveyId, decision, comment } = payload;

  if (decision === 'REVISION_REQUIRED' && (!comment || comment.trim().length === 0)) {
    return { success: false, error: 'Catatan alasan revisi wajib diisi.' };
  }

  const survey = await prisma.survey.findUnique({
    where: { id: surveyId },
  });

  if (!survey) {
    return { success: false, error: 'Survey tidak ditemukan.' };
  }

  if (survey.status !== 'SUBMITTED' && user.role !== 'SUPER_ADMIN') {
    return { success: false, error: 'Survey ini tidak dalam antrean review Risk Engineering.' };
  }

  const toStatus = decision === 'APPROVE' ? 'RISK_APPROVED' : 'REVISION_REQUIRED';

  await prisma.$transaction(async (tx) => {
    await tx.survey.update({
      where: { id: surveyId },
      data: {
        status: toStatus,
        riskApprovedAt: decision === 'APPROVE' ? new Date() : null,
        updatedAt: new Date(),
      },
    });

    await tx.surveyReview.create({
      data: {
        surveyId,
        reviewType: 'RISK_ENGINEERING',
        decision,
        comment: comment || (decision === 'APPROVE' ? 'Disetujui oleh Risk Engineering.' : ''),
        reviewerId: user.id,
      },
    });

    await tx.surveyStatusHistory.create({
      data: {
        surveyId,
        fromStatus: survey.status,
        toStatus,
        actorId: user.id,
        comment,
      },
    });

    await tx.auditLog.create({
      data: {
        actorId: user.id,
        action: `RISK_REVIEW_${decision}`,
        entityType: 'Survey',
        entityId: surveyId,
        metadataJson: JSON.stringify({ decision, comment }),
      },
    });
  });

  revalidatePath(`/surveys/${surveyId}`);
  revalidatePath('/dashboard');
  revalidatePath('/reviews/risk-engineering');
  revalidatePath('/reviews/underwriting');

  return { success: true, newStatus: toStatus };
}

export async function underwritingReviewAction(payload: {
  surveyId: string;
  decision: 'COVERABLE' | 'COVERABLE_WITH_CONDITIONS' | 'NEED_FURTHER_REVIEW' | 'DECLINED';
  comment: string;
}) {
  const user = await requireAuth(['UNDERWRITER', 'SUPER_ADMIN']);

  const { surveyId, decision, comment } = payload;

  if (!comment || comment.trim().length === 0) {
    return { success: false, error: 'Catatan kesimpulan & ketentuan underwriting wajib diisi.' };
  }

  const survey = await prisma.survey.findUnique({
    where: { id: surveyId },
  });

  if (!survey) {
    return { success: false, error: 'Survey tidak ditemukan.' };
  }

  if (survey.status !== 'RISK_APPROVED' && user.role !== 'SUPER_ADMIN') {
    return { success: false, error: 'Survey belum disetujui oleh Risk Engineering.' };
  }

  const toStatus = 'COMPLETED';

  await prisma.$transaction(async (tx) => {
    await tx.survey.update({
      where: { id: surveyId },
      data: {
        status: toStatus,
        completedAt: new Date(),
        updatedAt: new Date(),
      },
    });

    await tx.surveyReview.create({
      data: {
        surveyId,
        reviewType: 'UNDERWRITING',
        decision,
        comment,
        reviewerId: user.id,
      },
    });

    await tx.surveyStatusHistory.create({
      data: {
        surveyId,
        fromStatus: survey.status,
        toStatus,
        actorId: user.id,
        comment: `Keputusan Underwriter: ${decision}. Catatan: ${comment}`,
      },
    });

    await tx.auditLog.create({
      data: {
        actorId: user.id,
        action: `UNDERWRITING_${decision}`,
        entityType: 'Survey',
        entityId: surveyId,
        metadataJson: JSON.stringify({ decision, comment }),
      },
    });
  });

  revalidatePath(`/surveys/${surveyId}`);
  revalidatePath('/dashboard');
  revalidatePath('/reviews/underwriting');

  return { success: true };
}
