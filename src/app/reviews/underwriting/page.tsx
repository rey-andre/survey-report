import { redirect } from 'next/navigation';
import Link from 'next/link';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import AppShell from '@/components/AppShell';
import { FileCheck2, ChevronRight, CheckCircle2 } from 'lucide-react';

export default async function UnderwritingReviewQueuePage() {
  const user = await requireAuth(['UNDERWRITER', 'SUPER_ADMIN']);

  const readySurveys = await prisma.survey.findMany({
    where: {
      status: 'RISK_APPROVED',
      deletedAt: null,
    },
    include: {
      surveyor: true,
      branch: true,
      riskCalculations: {
        orderBy: { calculatedAt: 'desc' },
        take: 1,
      },
      reviews: {
        where: { reviewType: 'RISK_ENGINEERING' },
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
    orderBy: { riskApprovedAt: 'asc' },
  });

  return (
    <AppShell
      user={user}
      title="Antrean Keputusan Underwriting"
      subtitle="Survey risiko yang telah lolos peninjauan teknis dan siap diputuskan akseptasinya."
    >
      <div className="card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
          <FileCheck2 size={24} color="#0f766e" />
          <h2 style={{ fontSize: '18px', fontWeight: 700 }}>
            Survey Siap Akseptasi ({readySurveys.length})
          </h2>
        </div>

        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>No. Survey</th>
                <th>Nama Tertanggung</th>
                <th>TSI (Rp)</th>
                <th>Cabang</th>
                <th>Risk Grading</th>
                <th>Catatan Risk Eng.</th>
                <th>Tanggal Disetujui</th>
                <th style={{ textAlign: 'right' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {readySurveys.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '40px 16px', color: '#64748b' }}>
                    <CheckCircle2 size={32} style={{ color: '#10b981', marginBottom: '8px' }} />
                    <p style={{ fontWeight: 600 }}>Semua kasus telah diputuskan!</p>
                    <p style={{ fontSize: '12px' }}>Tidak ada antrean survey yang menunggu keputusan Underwriter.</p>
                  </td>
                </tr>
              ) : (
                readySurveys.map((s) => {
                  const calc = s.riskCalculations[0];
                  const reReview = s.reviews[0];
                  return (
                    <tr key={s.id}>
                      <td style={{ fontWeight: 700, color: '#1e6091' }}>{s.surveyNumber}</td>
                      <td>
                        <strong>{s.insuredName}</strong>
                      </td>
                      <td style={{ fontWeight: 600 }}>
                        {s.tsiAmount ? `Rp ${s.tsiAmount.toLocaleString('id-ID')}` : '—'}
                      </td>
                      <td>{s.branch?.name || '—'}</td>
                      <td>
                        <span className={`badge badge-${calc?.overallGrade.toLowerCase() || 'avg'}`}>
                          {calc?.overallGrade || '—'}
                        </span>
                      </td>
                      <td style={{ fontSize: '12px', color: '#475569', maxWidth: '240px' }}>
                        {reReview?.comment || 'Disetujui'}
                      </td>
                      <td style={{ fontSize: '12px', color: '#64748b' }}>
                        {s.riskApprovedAt
                          ? new Date(s.riskApprovedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
                          : '—'}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <Link href={`/surveys/${s.id}`} className="btn btn-primary" style={{ padding: '6px 14px', fontSize: '12px' }}>
                          <span>Beri Keputusan</span>
                          <ChevronRight size={14} />
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}
