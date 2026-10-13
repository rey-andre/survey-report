import { redirect } from 'next/navigation';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import AppShell from '@/components/AppShell';
import { History, Shield, User, FileText } from 'lucide-react';

export default async function AdminAuditLogsPage() {
  const user = await requireAuth(['SUPER_ADMIN']);

  const logs = await prisma.auditLog.findMany({
    include: { actor: true },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  return (
    <AppShell
      user={user}
      title="Audit Log Sistem & Riwayat Aktivitas"
      subtitle="Pencatatan menyeluruh atas setiap aksi autentikasi, survey, revisi, dan perubahan konfigurasi."
    >
      <div className="card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
          <History size={22} color="#1e6091" />
          <h2 style={{ fontSize: '18px', fontWeight: 700 }}>Aktivitas Terakhir ({logs.length})</h2>
        </div>

        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Waktu Kejadian</th>
                <th>Aktor / Pengguna</th>
                <th>Aksi</th>
                <th>Tipe Entitas</th>
                <th>ID Entitas</th>
                <th>Metadata Tambahan</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id}>
                  <td style={{ fontSize: '12px', color: '#64748b', whiteSpace: 'nowrap' }}>
                    {new Date(log.createdAt).toLocaleString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    })}
                  </td>
                  <td>
                    {log.actor ? (
                      <div>
                        <strong>{log.actor.name}</strong>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>{log.actor.role}</div>
                      </div>
                    ) : (
                      <span style={{ color: '#94a3b8' }}>System / Anonim</span>
                    )}
                  </td>
                  <td>
                    <span className="badge badge-avg" style={{ fontFamily: 'monospace', fontSize: '11.5px' }}>
                      {log.action}
                    </span>
                  </td>
                  <td>{log.entityType}</td>
                  <td style={{ fontFamily: 'monospace', fontSize: '11.5px', color: '#64748b' }}>
                    {log.entityId ? log.entityId.slice(0, 16) : '—'}
                  </td>
                  <td style={{ fontSize: '11.5px', color: '#475569', maxWidth: '300px', wordBreak: 'break-all' }}>
                    {log.metadataJson && log.metadataJson !== '{}' ? log.metadataJson : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}
