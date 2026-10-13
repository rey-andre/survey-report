import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import fs from 'fs';
import path from 'path';

const UPLOAD_DIR = path.join(process.cwd(), 'uploads');

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    const attachment = await prisma.surveyAttachment.findUnique({
      where: { id },
      include: { survey: true },
    });

    if (!attachment || attachment.deletedAt) {
      return NextResponse.json({ error: 'File tidak ditemukan.' }, { status: 404 });
    }

    // Permission check
    if (user.role === 'SURVEYOR' && attachment.survey.surveyorId !== user.id) {
      return NextResponse.json({ error: 'Akses ditolak.' }, { status: 403 });
    }

    const fullPath = path.join(UPLOAD_DIR, attachment.storagePath);
    if (!fs.existsSync(fullPath)) {
      return NextResponse.json({ error: 'File fisik tidak ditemukan pada server.' }, { status: 404 });
    }

    const fileBuffer = fs.readFileSync(fullPath);
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': attachment.mimeType,
        'Content-Disposition': `inline; filename="${encodeURIComponent(attachment.originalFileName)}"`,
        'Content-Length': String(attachment.sizeBytes),
      },
    });
  } catch (err: any) {
    console.error('Download error:', err);
    return NextResponse.json({ error: 'Gagal mengunduh file.' }, { status: 500 });
  }
}
