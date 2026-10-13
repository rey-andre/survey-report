import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const UPLOAD_DIR = path.join(process.cwd(), 'uploads');

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();

    const formData = await req.formData();
    const surveyId = formData.get('surveyId') as string;
    const questionKey = (formData.get('questionKey') as string) || 'general';
    const category = (formData.get('category') as string) || 'general';
    const file = formData.get('file') as File;

    if (!surveyId || !file) {
      return NextResponse.json({ error: 'Survey ID dan file wajib dikirim.' }, { status: 400 });
    }

    // Verify survey existence and permission
    const survey = await prisma.survey.findUnique({ where: { id: surveyId } });
    if (!survey) {
      return NextResponse.json({ error: 'Survey tidak ditemukan.' }, { status: 404 });
    }
    if (user.role === 'SURVEYOR' && survey.surveyorId !== user.id) {
      return NextResponse.json({ error: 'Akses ditolak.' }, { status: 403 });
    }

    // Size limit: 15MB
    if (file.size > 15 * 1024 * 1024) {
      return NextResponse.json({ error: 'Ukuran file melebihi batas 15MB.' }, { status: 400 });
    }

    if (!fs.existsSync(UPLOAD_DIR)) {
      fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    }

    const originalFileName = file.name;
    const ext = path.extname(originalFileName);
    const safeBase = path.basename(originalFileName, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    const storedFileName = `${Date.now()}_${crypto.randomBytes(6).toString('hex')}_${safeBase}${ext}`;
    const storagePath = path.join(UPLOAD_DIR, storedFileName);

    const bytes = await file.arrayBuffer();
    fs.writeFileSync(storagePath, Buffer.from(bytes));

    const attachment = await prisma.surveyAttachment.create({
      data: {
        surveyId,
        questionKey,
        attachmentCategory: category,
        originalFileName,
        storedFileName,
        mimeType: file.type || 'application/octet-stream',
        sizeBytes: file.size,
        storagePath: storedFileName,
        uploadedById: user.id,
      },
    });

    await prisma.auditLog.create({
      data: {
        actorId: user.id,
        action: 'ATTACHMENT_UPLOAD',
        entityType: 'SurveyAttachment',
        entityId: attachment.id,
        metadataJson: JSON.stringify({ originalFileName, sizeBytes: file.size }),
      },
    });

    return NextResponse.json({
      success: true,
      attachment: {
        id: attachment.id,
        originalFileName: attachment.originalFileName,
        sizeBytes: attachment.sizeBytes,
        mimeType: attachment.mimeType,
        questionKey: attachment.questionKey,
      },
    });
  } catch (err: any) {
    console.error('Upload error:', err);
    return NextResponse.json({ error: err.message || 'Gagal mengunggah file.' }, { status: 500 });
  }
}
