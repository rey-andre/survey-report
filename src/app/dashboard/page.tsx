import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getSessionUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import AppShell from '@/components/AppShell';
import {
  FileText,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Building,
  PlusCircle,
  Search,
  SlidersHorizontal,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';

interface DashboardPageProps {
  searchParams: Promise<{
    q?: string;
    status?: string;
    cabang?: string;
    grading?: string;
  }>;
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const user = await getSessionUser();
  if (!user) redirect('/login');

  const params = await searchParams;
  const q = params.q?.trim() || '';
  const filterStatus = params.status || '';
  const filterCabang = params.cabang || '';
  const filterGrading = params.grading || '';

  // Role based query filtering
  const whereClause: any = {
    deletedAt: null,
  };

  if (user.role === 'SURVEYOR') {
    whereClause.surveyorId = user.id;
  } else if (user.role === 'RISK_ENGINEERING') {
    // RE can see submitted, approved, revision, and completed
    whereClause.status = {
      in: ['SUBMITTED', 'REVISION_REQUIRED', 'RISK_APPROVED', 'COMPLETED'],
    };
  } else if (user.role === 'UNDERWRITER') {
    // Underwriter sees technical-approved and completed
    whereClause.status = {
      in: ['RISK_APPROVED', 'COMPLETED'],
    };
  }

  if (filterStatus) {
    whereClause.status = filterStatus;
  }

  if (q) {
    whereClause.OR = [
      { insuredName: { contains: q } },
      { commercialName: { contains: q } },
      { surveyNumber: { contains: q } },
      { riskAddress: { contains: q } },
    ];
  }

  if (filterCabang) {
    whereClause.branch = { name: filterCabang };
  }

  // Fetch statistics based on role access
  const statBaseWhere: any = { deletedAt: null };
  if (user.role === 'SURVEYOR') statBaseWhere.surveyorId = user.id;

  const [
    totalCount,
    draftCount,
    submittedCount,
    revisionCount,
    approvedCount,
    completedCount,
  ] = await Promise.all([
    prisma.survey.count({ where: statBaseWhere }),
    prisma.survey.count({ where: { ...statBaseWhere, status: 'DRAFT' } }),
    prisma.survey.count({ where: { ...statBaseWhere, status: 'SUBMITTED' } }),
    prisma.survey.count({ where: { ...statBaseWhere, status: 'REVISION_REQUIRED' } }),
    prisma.survey.count({ where: { ...statBaseWhere, status: 'RISK_APPROVED' } }),
    prisma.survey.count({ where: { ...statBaseWhere, status: 'COMPLETED' } }),
  ]);

  // Fetch surveys list
  const surveys = await prisma.survey.findMany({
    where: whereClause,
    include: {
      surveyor: true,
      branch: true,
      riskCalculations: {
        orderBy: { calculatedAt: 'desc' },
        take: 1,
      },
    },
    orderBy: { updatedAt: 'desc' },
    take: 50,
  });

  const branches = await prisma.branch.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return <span className="badge badge-draft">Draft</span>;
      case 'SUBMITTED':
        return <span className="badge badge-submitted">Menunggu Review</span>;
      case 'REVISION_REQUIRED':
        return <span className="badge badge-revision">Perlu Revisi</span>;
      case 'RISK_APPROVED':
        return <span className="badge badge-approved">Disetujui Risk Eng.</span>;
      case 'COMPLETED':
        return <span className="badge badge-completed">Selesai Underwritten</span>;
      default:
        return <span className="badge">{status}</span>;
    }
  };

  const getGradeBadge = (grade?: string) => {
    if (!grade) return <span style={{ color: '#94a3b8' }}>—</span>;
    switch (grade) {
      case 'GOOD':
        return <span className="badge badge-good">GOOD</span>;
      case 'AVERAGE':
        return <span className="badge badge-avg">AVERAGE</span>;
      case 'MARGINAL':
        return <span className="badge badge-marginal">MARGINAL</span>;
      case 'POOR':
        return <span className="badge badge-poor">POOR</span>;
      default:
        return <span className="badge">{grade}</span>;
    }
  };

  return (
    <AppShell user={user} title="Dashboard Survey Risiko" subtitle="Monitoring dan antrean peninjauan laporan survey">
      {/* Stat Cards */}
      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-card-title">Total Survey</div>
          <div className="stat-card-value">{totalCount}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-title">Draft Berjalan</div>
          <div className="stat-card-value" style={{ color: '#64748b' }}>
            {draftCount}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-title">Menunggu Review</div>
          <div className="stat-card-value" style={{ color: '#d97706' }}>
            {submittedCount}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-title">Perlu Revisi</div>
          <div className="stat-card-value" style={{ color: '#dc2626' }}>
            {revisionCount}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-title">Disetujui Risk Eng.</div>
          <div className="stat-card-value" style={{ color: '#4f46e5' }}>
            {approvedCount}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-title">Selesai / Final</div>
          <div className="stat-card-value" style={{ color: '#16a34a' }}>
            {completedCount}
          </div>
        </div>
      </div>

      {/* Toolbar Filters & Action */}
      <div
        className="card"
        style={{
          padding: '16px 20px',
          marginBottom: '20px',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
        }}
      >
        <form method="GET" style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', flex: 1 }}>
          <div style={{ position: 'relative', minWidth: '220px', flex: '2 1 220px' }}>
            <input
              type="text"
              name="q"
              defaultValue={q}
              placeholder="Cari Tertanggung, No. Survey, Alamat..."
              className="form-control"
              style={{ paddingLeft: '36px' }}
            />
            <Search
              size={16}
              style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}
            />
          </div>

          <select
            name="status"
            defaultValue={filterStatus}
            className="form-control"
            style={{ width: 'auto', minWidth: '150px' }}
          >
            <option value="">Semua Status</option>
            <option value="DRAFT">Draft</option>
            <option value="SUBMITTED">Menunggu Review</option>
            <option value="REVISION_REQUIRED">Perlu Revisi</option>
            <option value="RISK_APPROVED">Disetujui Risk Eng.</option>
            <option value="COMPLETED">Selesai</option>
          </select>

          <select
            name="cabang"
            defaultValue={filterCabang}
            className="form-control"
            style={{ width: 'auto', minWidth: '140px' }}
          >
            <option value="">Semua Cabang</option>
            {branches.map((b) => (
              <option key={b.id} value={b.name}>
                {b.name}
              </option>
            ))}
          </select>

          <button type="submit" className="btn btn-secondary">
            <SlidersHorizontal size={15} />
            <span>Filter</span>
          </button>
        </form>

        {(user.role === 'SURVEYOR' || user.role === 'SUPER_ADMIN') && (
          <Link href="/surveys/new" className="btn btn-primary" style={{ padding: '10px 18px' }}>
            <PlusCircle size={17} />
            <span>+ Survey Baru</span>
          </Link>
        )}
      </div>

      {/* Table of Surveys */}
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>No. Survey</th>
              <th>Nama Tertanggung</th>
              <th>Cabang</th>
              <th>Okupansi</th>
              <th>Surveyor</th>
              <th>Tanggal Survey</th>
              <th>Status</th>
              <th>Risk Grading</th>
              <th>Terakhir Diubah</th>
              <th style={{ textAlign: 'right' }}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {surveys.length === 0 ? (
              <tr>
                <td colSpan={10} style={{ textAlign: 'center', padding: '48px 24px', color: '#64748b' }}>
                  <Building size={36} style={{ color: '#cbd5e1', marginBottom: '8px' }} />
                  <p style={{ fontWeight: 600, fontSize: '15px' }}>Belum ada data survey yang sesuai.</p>
                  <p style={{ fontSize: '13px', marginTop: '4px' }}>
                    {user.role === 'SURVEYOR'
                      ? 'Klik "+ Survey Baru" untuk mulai mengisi survey properti.'
                      : 'Data akan tampil saat ada survey yang dikirimkan.'}
                  </p>
                </td>
              </tr>
            ) : (
              surveys.map((s) => {
                const latestCalc = s.riskCalculations[0];
                return (
                  <tr key={s.id}>
                    <td style={{ fontWeight: 700, color: '#1e6091' }}>
                      {s.surveyNumber || <span style={{ color: '#94a3b8' }}>[DRAFT]</span>}
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{s.insuredName || '— Belum diisi —'}</div>
                      {s.commercialName && (
                        <div style={{ fontSize: '11.5px', color: '#64748b' }}>{s.commercialName}</div>
                      )}
                    </td>
                    <td>{s.branch?.name || '—'}</td>
                    <td style={{ textTransform: 'capitalize' }}>{s.occupancyCategory || '—'}</td>
                    <td>{s.surveyor.name}</td>
                    <td>
                      {s.surveyDate ? new Date(s.surveyDate).toLocaleDateString('id-ID') : '—'}
                    </td>
                    <td>{getStatusBadge(s.status)}</td>
                    <td>{getGradeBadge(latestCalc?.overallGrade)}</td>
                    <td style={{ fontSize: '12px', color: '#64748b' }}>
                      {new Date(s.updatedAt).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        {(s.status === 'DRAFT' || s.status === 'REVISION_REQUIRED') &&
                        (user.role === 'SURVEYOR' || user.role === 'SUPER_ADMIN') ? (
                          <Link href={`/surveys/${s.id}/edit`} className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '12px' }}>
                            <span>Lanjutkan</span>
                            <ChevronRight size={14} />
                          </Link>
                        ) : (
                          <Link href={`/surveys/${s.id}`} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }}>
                            <span>Lihat Detail</span>
                            <ChevronRight size={14} />
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}
