'use client';

import React, { useState } from 'react';
import { createUserAction, toggleUserStatusAction, resetPasswordAction } from '@/app/actions/admin';
import { PlusCircle, ShieldAlert, KeyRound, Check, X } from 'lucide-react';

interface AdminUsersClientProps {
  users: any[];
  branches: { id: string; name: string }[];
}

export default function AdminUsersClient({ users, branches }: AdminUsersClientProps) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [resettingUserId, setResettingUserId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreateUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    try {
      const res = await createUserAction(formData);
      if (res.success) {
        alert('User berhasil dibuat!');
        setShowCreateModal(false);
        window.location.reload();
      } else {
        alert(res.error || 'Gagal membuat user.');
      }
    } catch (err: any) {
      alert(err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (userId: string, currentActive: boolean) => {
    const actionName = currentActive ? 'menonaktifkan' : 'mengaktifkan';
    if (!confirm(`Apakah Anda yakin ingin ${actionName} user ini?`)) return;

    try {
      const res = await toggleUserStatusAction(userId);
      if (res.success) {
        window.location.reload();
      } else {
        alert(res.error || 'Gagal mengubah status user.');
      }
    } catch (err: any) {
      alert(err.message || 'Terjadi kesalahan sistem.');
    }
  };

  const handleResetPass = async (userId: string) => {
    if (!newPassword || newPassword.length < 6) {
      alert('Password baru minimal 6 karakter.');
      return;
    }

    try {
      const res = await resetPasswordAction(userId, newPassword);
      if (res.success) {
        alert('Password berhasil direset!');
        setResettingUserId(null);
        setNewPassword('');
      } else {
        alert(res.error || 'Gagal mereset password.');
      }
    } catch (err: any) {
      alert(err.message || 'Terjadi kesalahan sistem.');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '18px' }}>
        <button type="button" onClick={() => setShowCreateModal(true)} className="btn btn-primary">
          <PlusCircle size={16} />
          <span>+ Tambah Pengguna Baru</span>
        </button>
      </div>

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Nama Pengguna</th>
              <th>Email</th>
              <th>Role</th>
              <th>Cabang</th>
              <th>Status</th>
              <th>Login Terakhir</th>
              <th style={{ textAlign: 'right' }}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>
                  <strong>{u.name}</strong>
                </td>
                <td>{u.email}</td>
                <td>
                  <span className="badge badge-avg">{u.role}</span>
                </td>
                <td>{u.branch?.name || 'Semua Cabang'}</td>
                <td>
                  {u.isActive ? (
                    <span className="badge badge-good">Aktif</span>
                  ) : (
                    <span className="badge badge-poor">Nonaktif</span>
                  )}
                </td>
                <td style={{ fontSize: '12px', color: '#64748b' }}>
                  {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleDateString('id-ID') : 'Belum pernah'}
                </td>
                <td style={{ textAlign: 'right' }}>
                  <div style={{ display: 'inline-flex', gap: '6px' }}>
                    <button
                      type="button"
                      onClick={() => setResettingUserId(u.id)}
                      className="btn btn-secondary"
                      style={{ padding: '6px 10px', fontSize: '12px' }}
                      title="Reset Password"
                    >
                      <KeyRound size={13} />
                      <span>Reset Pass</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(u.id, u.isActive)}
                      className={`btn ${u.isActive ? 'btn-danger' : 'btn-success'}`}
                      style={{ padding: '6px 10px', fontSize: '12px' }}
                    >
                      {u.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal Create User */}
      {showCreateModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 50,
            padding: '16px',
          }}
        >
          <div className="card" style={{ width: '100%', maxWidth: '440px', padding: '24px' }}>
            <h3 style={{ fontSize: '17px', fontWeight: 700, marginBottom: '16px' }}>Tambah User Baru</h3>
            <form onSubmit={handleCreateUser}>
              <div className="form-group">
                <label className="form-label">Nama Lengkap</label>
                <input type="text" name="name" required className="form-control" placeholder="Contoh: Budi Santoso" />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input type="email" name="email" required className="form-control" placeholder="nama@aswata.co.id" />
              </div>
              <div className="form-group">
                <label className="form-label">Password Awal</label>
                <input type="password" name="password" required className="form-control" placeholder="Minimal 6 karakter" />
              </div>
              <div className="form-group">
                <label className="form-label">Role Akses</label>
                <select name="role" required className="form-control">
                  <option value="SURVEYOR">Surveyor (Lapangan)</option>
                  <option value="RISK_ENGINEERING">Risk Engineering (Review Teknis)</option>
                  <option value="UNDERWRITER">Underwriter (Akseptasi)</option>
                  <option value="SUPER_ADMIN">Super Admin (Penuh)</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Cabang Penempatan</label>
                <select name="branchId" className="form-control">
                  <option value="">— Kantor Pusat / Semua Cabang —</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '20px' }}>
                <button type="button" onClick={() => setShowCreateModal(false)} className="btn btn-secondary">
                  Batal
                </button>
                <button type="submit" disabled={loading} className="btn btn-primary">
                  {loading ? 'Menyimpan...' : 'Simpan User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Reset Password */}
      {resettingUserId && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 50,
            padding: '16px',
          }}
        >
          <div className="card" style={{ width: '100%', maxWidth: '380px', padding: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '14px' }}>Reset Password User</h3>
            <div className="form-group">
              <label className="form-label">Password Baru</label>
              <input
                type="password"
                className="form-control"
                placeholder="Minimal 6 karakter"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
              <button
                type="button"
                onClick={() => {
                  setResettingUserId(null);
                  setNewPassword('');
                }}
                className="btn btn-secondary"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => handleResetPass(resettingUserId)}
                className="btn btn-primary"
              >
                Update Password
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
