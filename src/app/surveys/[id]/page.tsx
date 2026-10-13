import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { getSessionUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import AppShell from '@/components/AppShell';
import SurveyReviewPanel from '@/components/SurveyReviewPanel';
import {
  FileText,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Building,
  Edit,
  ArrowLeft,
  Paperclip,
  History,
} from 'lucide-react';

interface SurveyDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function SurveyDetailPage({ params }: SurveyDetailPageProps) {
  const user = await getSessionUser();
  if (!user) redirect('/login');

  const { id } = await params;

  const survey = await prisma.survey.findUnique({
    where: { id },
    include: {
      surveyor: true,
      branch: true,
      answers: true,
      attachments: { where: { deletedAt: null } },
      reviews: {
        include: { reviewer: true },
        orderBy: { createdAt: 'desc' },
      },
      statusHistories: {
        include: { actor: true },
        orderBy: { createdAt: 'desc' },
      },
      riskCalculations: {
        orderBy: { calculatedAt: 'desc' },
        take: 1,
      },
      formVersion: {
        include: {
          sections: {
            where: { isActive: true },
            orderBy: { sortOrder: 'asc' },
          },
          questions: {
            where: { isActive: true },
            orderBy: { sortOrder: 'asc' },
          },
        },
      },
    },
  });

  if (!survey || survey.deletedAt) {
    notFound();
  }

  // Permission check: surveyor can only view own survey, unless RE / UW / Super Admin
  if (user.role === 'SURVEYOR' && survey.surveyorId !== user.id) {
    redirect('/dashboard');
  }

  // Parse answers map
  const answersMap: Record<string, any> = {};
  for (const a of survey.answers) {
    try {
      answersMap[a.questionKey] = JSON.parse(a.valueJson);
    } catch {
      answersMap[a.questionKey] = a.valueJson;
    }
  }

  const latestCalc = survey.riskCalculations[0];
  let calcDetails: any = null;
  if (latestCalc?.resultJson) {
    try {
      calcDetails = JSON.parse(latestCalc.resultJson);
    } catch {}
  }

  const canEdit =
    (survey.status === 'DRAFT' || survey.status === 'REVISION_REQUIRED') &&
    (user.role === 'SURVEYOR' || user.role === 'SUPER_ADMIN') &&
    (user.role !== 'SURVEYOR' || survey.surveyorId === user.id);

  return (
    <AppShell
      user={user}
      title={survey.insuredName || 'Laporan Survey Properti'}
      subtitle={`Nomor: ${survey.surveyNumber || '[Draft]'} • Cabang: ${survey.branch?.name || '—'}`}
    >
      {/* Action bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <Link href="/dashboard" className="btn btn-secondary">
          <ArrowLeft size={16} />
          <span>Kembali ke Dashboard</span>
        </Link>

        {canEdit && (
          <Link href={`/surveys/${survey.id}/edit`} className="btn btn-primary">
            <Edit size={16} />
            <span>Edit / Lanjutkan Form</span>
          </Link>
        )}
      </div>

      {/* Review Action Panel for Risk Eng & Underwriter */}
      <SurveyReviewPanel surveyId={survey.id} status={survey.status} userRole={user.role} />

      {/* Risk Grading Overview Card if calculated */}
      {calcDetails && (
        <div className={`grading-banner ${calcDetails.overallGrade.toLowerCase()}`}>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 600, opacity: 0.9 }}>HASIL RESMI RISK GRADING</div>
            <div className="gb-grade">{calcDetails.overallGrade}</div>
            <div className="gb-score">
              Total Skor: <strong>{calcDetails.total} / 55 poin</strong>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '12px', opacity: 0.85 }}>Surveyor: {survey.surveyor.name}</div>
            <div style={{ fontSize: '12px', opacity: 0.85 }}>
              Status:{' '}
              <b>
                {survey.status === 'DRAFT'
                  ? 'Draft'
                  : survey.status === 'SUBMITTED'
                  ? 'Menunggu Review'
                  : survey.status === 'REVISION_REQUIRED'
                  ? 'Perlu Revisi'
                  : survey.status === 'RISK_APPROVED'
                  ? 'Disetujui Risk Eng.'
                  : 'Selesai'}
              </b>
            </div>
            {calcDetails.protectionOverride && (
              <div style={{ marginTop: '6px', background: 'rgba(0,0,0,0.25)', padding: '4px 8px', borderRadius: '4px', fontSize: '11px' }}>
                Override Poor: Sistem Proteksi Kurang Memadai
              </div>
            )}
          </div>
        </div>
      )}

      {/* Score Breakdown Table */}
      {calcDetails && (
        <div className="card" style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '12px' }}>Rincian Skor per Kategori Risiko</h3>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Kategori Risiko</th>
                  <th>Bobot</th>
                  <th>Rating Kategori</th>
                  <th>Skor</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['1', 'Management', 'I', calcDetails.ratings.management, calcDetails.scores.management],
                  ['2', 'Construction', 'I', calcDetails.ratings.construction, calcDetails.scores.construction],
                  ['3', 'Occupancy', 'I', calcDetails.ratings.occupancy, calcDetails.scores.occupancy],
                  ['4', 'Protection', 'I', calcDetails.ratings.protection, calcDetails.scores.protection],
                  ['5', 'Exposure', 'II', calcDetails.ratings.exposure, calcDetails.scores.exposure],
                  ['6', 'Natural Hazards', 'II', calcDetails.ratings.nat_hazards, calcDetails.scores.nat_hazards],
                  ['7', 'Other Perils', 'II', calcDetails.ratings.other_perils, calcDetails.scores.other_perils],
                  ['8', 'Loss Estimate', 'III', calcDetails.ratings.loss_estimate, calcDetails.scores.loss_estimate],
                ].map(([num, cat, bwt, rat, sc]) => (
                  <tr key={num}>
                    <td>{num}</td>
                    <td style={{ fontWeight: 600 }}>{cat}</td>
                    <td>{bwt}</td>
                    <td>
                      <span className={`badge badge-${String(rat).toLowerCase()}`}>{rat}</span>
                    </td>
                    <td style={{ fontWeight: 800 }}>{sc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Answers grouped by sections */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '28px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 700 }}>Data Jawaban Hasil Survey</h2>

        {survey.formVersion.sections.map((sec, idx) => {
          const questionsInSec = survey.formVersion.questions.filter((q) => q.sectionId === sec.id);
          const hasAnswers = questionsInSec.some((q) => answersMap[q.key] !== undefined && answersMap[q.key] !== '');

          return (
            <div key={sec.id} className="card" style={{ padding: '20px 24px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#1e6091', marginBottom: '14px', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
                Bagian {idx + 1}: {sec.title}
              </h3>

              {!hasAnswers ? (
                <div style={{ fontSize: '13px', color: '#94a3b8', fontStyle: 'italic' }}>
                  Belum ada jawaban pada bagian ini.
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                  {questionsInSec.map((q) => {
                    const ans = answersMap[q.key];
                    if (ans === undefined || ans === '') return null;

                    return (
                      <div key={q.id} style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                        <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>{q.label}</div>
                        <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#0f172a', marginTop: '4px', wordBreak: 'break-word' }}>
                          {typeof ans === 'boolean'
                            ? ans ? 'Ya' : 'Tidak'
                            : typeof ans === 'object'
                            ? JSON.stringify(ans)
                            : String(ans)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Uploaded Attachments */}
      <div className="card" style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <Paperclip size={18} color="#1e6091" />
          <h3 style={{ fontSize: '16px', fontWeight: 700 }}>Lampiran Dokumen & Foto Lapangan</h3>
        </div>

        {survey.attachments.length === 0 ? (
          <p style={{ fontSize: '13px', color: '#94a3b8' }}>Tidak ada lampiran file pada survey ini.</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
            {survey.attachments.map((att) => (
              <a
                key={att.id}
                href={`/api/attachments/${att.id}`}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '12px 14px',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  background: '#f8fafc',
                  transition: 'all 0.15s ease',
                }}
              >
                <FileText size={20} color="#1e6091" />
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                    {att.originalFileName}
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>
                    {(att.sizeBytes / 1024).toFixed(1)} KB • {att.questionKey}
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>

      {/* Audit & Workflow History Timeline */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <History size={18} color="#1e6091" />
          <h3 style={{ fontSize: '16px', fontWeight: 700 }}>Riwayat Status & Review Workflow</h3>
        </div>

        {survey.statusHistories.length === 0 ? (
          <p style={{ fontSize: '13px', color: '#94a3b8' }}>Belum ada histori transisi status.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {survey.statusHistories.map((hist) => (
              <div
                key={hist.id}
                style={{
                  padding: '12px 16px',
                  borderRadius: '8px',
                  background: '#f8fafc',
                  borderLeft: '4px solid #1e6091',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <div style={{ fontWeight: 700, fontSize: '13px', color: '#1e6091' }}>
                    {hist.fromStatus} ➔ {hist.toStatus}
                  </div>
                  <div style={{ fontSize: '11.5px', color: '#94a3b8' }}>
                    {new Date(hist.createdAt).toLocaleString('id-ID')}
                  </div>
                </div>
                <div style={{ fontSize: '12.5px', color: '#0f172a' }}>
                  Oleh: <strong>{hist.actor.name}</strong> ({hist.actor.role})
                </div>
                {hist.comment && (
                  <div style={{ fontSize: '12.5px', color: '#475569', marginTop: '4px', fontStyle: 'italic' }}>
                    &ldquo;{hist.comment}&rdquo;
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
