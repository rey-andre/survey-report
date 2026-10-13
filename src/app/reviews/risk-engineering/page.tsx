import { redirect } from 'next/navigation';
import Link from 'next/link';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import AppShell from '@/components/AppShell';
import { ShieldCheck, ChevronRight, CheckCircle2 } from 'lucide-react';

export default async function RiskEngineeringReviewQueuePage() {
  const user = await requireAuth(['RISK_ENGINEERING', 'SUPER_ADMIN']);

  const pendingSurveys = await prisma.survey.findMany({
    where: {
      status: 'SUBMITTED',
      deletedAt: null,
    },
    include: {
      surveyor: true,
      branch: true,
      riskCalculations: {
        orderBy: { calculatedAt: 'desc' },
        take: 1,
      },
    },
    orderBy: { submittedAt: 'asc' },
  });

  return (
    <AppShell
      user={user}
      title="Antrean Review Risk Engineering"
      subtitle="Daftar laporan survey lapangan yang menunggu verifikasi teknis dan kelayakan proteksi."
    >
      <div className="card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
          <ShieldCheck size={24} color="#1e6091" />
          <h2 style={{ fontSize: '18px', fontWeight: 700 }}>
            Survey Menunggu Review Teknis ({pendingSurveys.length})
          </h2>
        </div>

        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>No. Survey</th>
                <th>Nama Tertanggung</th>
                <th>Cabang</th>
                <th>Okupansi</th>
                <th>Surveyor</th>
                <th>Tanggal Dikirim</th>
                <th>Indikasi Grading</th>
                <th style={{ textAlign: 'right' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {pendingSurveys.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '40px 16px', color: '#64748b' }}>
                    <CheckCircle2 size={32} style={{ color: '#10b981', marginBottom: '8px' }} />
                    <p style={{ fontWeight: 600 }}>Semua survey telah ditinjau!</p>
                    <p style={{ fontSize: '12px' }}>Tidak ada survey yang sedang menunggu review Risk Engineering.</p>
                  </td>
                </tr>
              ) : (
                pendingSurveys.map((s) => {
                  const calc = s.riskCalculations[0];
                  return (
                    <tr key={s.id}>
                      <td style={{ fontWeight: 700, color: '#1e6091' }}>{s.surveyNumber}</td>
                      <td>
                        <strong>{s.insuredName}</strong>
                      </td>
                      <td>{s.branch?.name || '—'}</td>
                      <td style={{ textTransform: 'capitalize' }}>{s.occupancyCategory || '—'}</td>
                      <td>{s.surveyor.name}</td>
                      <td style={{ fontSize: '12px', color: '#64748b' }}>
                        {s.submittedAt ? new Date(s.submittedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'}
                      </td>
                      <td>
                        <span className={`badge badge-${calc?.overallGrade.toLowerCase() || 'avg'}`}>
                          {calc?.overallGrade || '—'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <Link href={`/surveys/${s.id}`} className="btn btn-primary" style={{ padding: '6px 14px', fontSize: '12px' }}>
                          <span>Tinjau Sekarang</span>
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
