'use client';

import React, { useState } from 'react';
import { createBranchAction } from '@/app/actions/admin';
import { PlusCircle, Building2 } from 'lucide-react';

export default function AdminBranchesClient({ branches }: { branches: any[] }) {
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await createBranchAction(name, code);
      if (res.success) {
        alert('Cabang berhasil ditambahkan!');
        setShowModal(false);
        window.location.reload();
      } else {
        alert(res.error || 'Gagal menambahkan cabang.');
      }
    } catch (err: any) {
      alert(err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '18px' }}>
        <button type="button" onClick={() => setShowModal(true)} className="btn btn-primary">
          <PlusCircle size={16} />
          <span>+ Tambah Cabang Baru</span>
        </button>
      </div>

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Nama Cabang</th>
              <th>Kode Cabang</th>
              <th>Jumlah User Terdaftar</th>
              <th>Status Operasional</th>
            </tr>
          </thead>
          <tbody>
            {branches.map((b) => (
              <tr key={b.id}>
                <td>
                  <strong>{b.name}</strong>
                </td>
                <td>{b.code || '—'}</td>
                <td>{b._count?.users || 0} akun</td>
                <td>
                  <span className="badge badge-good">Aktif</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
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
            <h3 style={{ fontSize: '17px', fontWeight: 700, marginBottom: '16px' }}>Tambah Cabang Baru</h3>
            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label className="form-label">Nama Kota / Cabang</label>
                <input
                  type="text"
                  required
                  className="form-control"
                  placeholder="Contoh: Yogyakarta"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Kode Singkatan Cabang (Opsional)</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Contoh: JOG"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '20px' }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">
                  Batal
                </button>
                <button type="submit" disabled={loading} className="btn btn-primary">
                  {loading ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
