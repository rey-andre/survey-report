'use client';

import React, { useState } from 'react';
import { updateQuestionConfigAction } from '@/app/actions/admin';
import { Layers, Edit3, CheckCircle2, Sliders, Eye } from 'lucide-react';

interface AdminFormBuilderClientProps {
  version: any;
  sections: any[];
  questions: any[];
}

export default function AdminFormBuilderClient({ version, sections, questions }: AdminFormBuilderClientProps) {
  const [selectedSecKey, setSelectedSecKey] = useState<string>('all');
  const [editingQ, setEditingQ] = useState<any | null>(null);
  const [editLabel, setEditLabel] = useState('');
  const [editHelp, setEditHelp] = useState('');
  const [editRequired, setEditRequired] = useState(false);
  const [loading, setLoading] = useState(false);

  const filteredQuestions = selectedSecKey === 'all'
    ? questions
    : questions.filter((q) => q.section.key === selectedSecKey);

  const startEdit = (q: any) => {
    setEditingQ(q);
    setEditLabel(q.label);
    setEditHelp(q.helpText || '');
    setEditRequired(q.isRequired);
  };

  const handleSaveQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingQ) return;

    setLoading(true);
    try {
      const res = await updateQuestionConfigAction(editingQ.id, {
        label: editLabel,
        helpText: editHelp,
        isRequired: editRequired,
      });
      if (res.success) {
        alert('Pengaturan pertanyaan berhasil disimpan!');
        setEditingQ(null);
        window.location.reload();
      } else {
        alert(res.error || 'Gagal menyimpan.');
      }
    } catch (err: any) {
      alert(err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Version Header Card */}
      <div
        className="card"
        style={{
          marginBottom: '20px',
          padding: '20px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 800 }}>Versi Formulir: {version.version}</h2>
            <span className="badge badge-good">PUBLISHED (Aktif)</span>
          </div>
          <p style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
            Total {sections.length} Bagian • {questions.length} Pertanyaan Terdaftar di SQLite
          </p>
        </div>

        <div>
          <span style={{ fontSize: '12px', color: '#64748b' }}>
            Dipublikasikan: {version.publishedAt ? new Date(version.publishedAt).toLocaleDateString('id-ID') : '—'}
          </span>
        </div>
      </div>

      {/* Filter by Section */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '10px', marginBottom: '18px' }}>
        <button
          type="button"
          onClick={() => setSelectedSecKey('all')}
          className={`stepper-pill ${selectedSecKey === 'all' ? 'active' : ''}`}
        >
          Semua Bagian ({questions.length})
        </button>
        {sections.map((sec) => (
          <button
            key={sec.id}
            type="button"
            onClick={() => setSelectedSecKey(sec.key)}
            className={`stepper-pill ${selectedSecKey === sec.key ? 'active' : ''}`}
          >
            {sec.key.toUpperCase()}: {sec.title.split('—')[0]}
          </button>
        ))}
      </div>

      {/* Table of Questions */}
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Bagian</th>
              <th>Field Key</th>
              <th>Label Pertanyaan</th>
              <th>Tipe Input</th>
              <th>Wajib?</th>
              <th>Kondisi Tampil</th>
              <th style={{ textAlign: 'right' }}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filteredQuestions.map((q) => (
              <tr key={q.id}>
                <td>
                  <span className="badge badge-avg">{q.section.key}</span>
                </td>
                <td style={{ fontFamily: 'monospace', fontWeight: 600, color: '#1e6091', fontSize: '12.5px' }}>
                  {q.key}
                </td>
                <td style={{ maxWidth: '320px' }}>
                  <div style={{ fontWeight: 600 }}>{q.label}</div>
                  {q.helpText && <div style={{ fontSize: '11px', color: '#64748b' }}>{q.helpText}</div>}
                </td>
                <td>
                  <span className="badge badge-draft">{q.type}</span>
                </td>
                <td>
                  {q.isRequired ? (
                    <span className="badge badge-poor">Wajib *</span>
                  ) : (
                    <span style={{ color: '#94a3b8', fontSize: '12px' }}>Opsional</span>
                  )}
                </td>
                <td style={{ fontSize: '11px', color: '#64748b', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {q.visibilityConditionJson ? 'Dinamis (Show If)' : 'Selalu Tampil'}
                </td>
                <td style={{ textAlign: 'right' }}>
                  <button
                    type="button"
                    onClick={() => startEdit(q)}
                    className="btn btn-secondary"
                    style={{ padding: '6px 10px', fontSize: '12px' }}
                  >
                    <Edit3 size={13} />
                    <span>Edit</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Edit Question Modal */}
      {editingQ && (
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
          <div className="card" style={{ width: '100%', maxWidth: '520px', padding: '24px' }}>
            <h3 style={{ fontSize: '17px', fontWeight: 700, marginBottom: '6px' }}>
              Edit Pertanyaan: <code>{editingQ.key}</code>
            </h3>
            <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '16px' }}>
              Bagian: {editingQ.section.title} • Tipe: {editingQ.type}
            </p>

            <form onSubmit={handleSaveQuestion}>
              <div className="form-group">
                <label className="form-label">Label Pertanyaan</label>
                <textarea
                  rows={2}
                  required
                  className="form-control"
                  value={editLabel}
                  onChange={(e) => setEditLabel(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Help Text / Panduan Pengisian</label>
                <input
                  type="text"
                  className="form-control"
                  value={editHelp}
                  onChange={(e) => setEditHelp(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '14px 0' }}>
                <input
                  type="checkbox"
                  id="chk_req"
                  checked={editRequired}
                  onChange={(e) => setEditRequired(e.target.checked)}
                />
                <label htmlFor="chk_req" style={{ fontSize: '13px', cursor: 'pointer', fontWeight: 600 }}>
                  Wajib Diisi Sebelum Submit Review (Required)
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '20px' }}>
                <button type="button" onClick={() => setEditingQ(null)} className="btn btn-secondary">
                  Batal
                </button>
                <button type="submit" disabled={loading} className="btn btn-primary">
                  {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
