'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { riskEngineeringReviewAction, underwritingReviewAction } from '@/app/actions/survey';
import { ShieldCheck, FileCheck2, AlertTriangle, Send } from 'lucide-react';

interface SurveyReviewPanelProps {
  surveyId: string;
  status: string;
  userRole: string;
}

export default function SurveyReviewPanel({ surveyId, status, userRole }: SurveyReviewPanelProps) {
  const router = useRouter();
  const [comment, setComment] = useState('');
  const [underwritingDecision, setUnderwritingDecision] = useState<
    'COVERABLE' | 'COVERABLE_WITH_CONDITIONS' | 'NEED_FURTHER_REVIEW' | 'DECLINED'
  >('COVERABLE');
  const [loading, setLoading] = useState(false);

  // Risk Engineering Action
  const handleRiskReview = async (decision: 'APPROVE' | 'REVISION_REQUIRED') => {
    if (decision === 'REVISION_REQUIRED' && !comment.trim()) {
      alert('Alasan minta revisi wajib diisi agar surveyor dapat memperbaiki laporan.');
      return;
    }

    const confirmMsg =
      decision === 'APPROVE'
        ? 'Setujui kelayakan teknis survey ini dan teruskan ke Underwriter?'
        : 'Kembalikan survey ini ke Surveyor untuk direvisi?';

    if (!confirm(confirmMsg)) return;

    setLoading(true);
    try {
      const res = await riskEngineeringReviewAction({ surveyId, decision, comment });
      if (res.success) {
        alert(decision === 'APPROVE' ? 'Review teknis berhasil disetujui!' : 'Permintaan revisi berhasil dikirim.');
        router.refresh();
      } else {
        alert(res.error || 'Gagal memproses review.');
      }
    } catch (err: any) {
      alert(err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setLoading(false);
    }
  };

  // Underwriting Action
  const handleUnderwritingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) {
      alert('Catatan kesimpulan & ketentuan underwriting wajib diisi.');
      return;
    }

    if (!confirm('Simpan keputusan underwriting final atas survey ini?')) return;

    setLoading(true);
    try {
      const res = await underwritingReviewAction({
        surveyId,
        decision: underwritingDecision,
        comment,
      });
      if (res.success) {
        alert('Keputusan underwriting final berhasil disimpan!');
        router.refresh();
      } else {
        alert(res.error || 'Gagal menyimpan keputusan.');
      }
    } catch (err: any) {
      alert(err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setLoading(false);
    }
  };

  const canRiskReview = (userRole === 'RISK_ENGINEERING' || userRole === 'SUPER_ADMIN') && status === 'SUBMITTED';
  const canUnderwrite = (userRole === 'UNDERWRITER' || userRole === 'SUPER_ADMIN') && status === 'RISK_APPROVED';

  if (!canRiskReview && !canUnderwrite) {
    return null;
  }

  return (
    <div
      className="card"
      style={{
        border: '2px solid #38bdf8',
        boxShadow: '0 8px 24px rgba(56, 189, 248, 0.15)',
        marginBottom: '28px',
        padding: '24px',
      }}
    >
      {canRiskReview && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#1e6091', marginBottom: '12px' }}>
            <ShieldCheck size={22} />
            <h3 style={{ fontSize: '17px', fontWeight: 700 }}>Panel Review Risk Engineering</h3>
          </div>
          <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '16px' }}>
            Tinjau hasil survey dan grading teknis properti. Anda dapat menyetujui kelayakan teknis atau meminta revisi perbaikan kepada surveyor.
          </p>

          <div className="form-group">
            <label className="form-label">
              Catatan Review Teknis / Alasan Revisi <span className="req">*</span>
            </label>
            <textarea
              rows={3}
              className="form-control"
              placeholder="Tuliskan catatan teknis atau poin-poin yang wajib diperbaiki surveyor..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              disabled={loading}
              onClick={() => handleRiskReview('APPROVE')}
              className="btn btn-success"
              style={{ padding: '10px 18px' }}
            >
              <ShieldCheck size={16} />
              <span>Setujui Review Teknis</span>
            </button>

            <button
              type="button"
              disabled={loading}
              onClick={() => handleRiskReview('REVISION_REQUIRED')}
              className="btn btn-danger"
              style={{ padding: '10px 18px' }}
            >
              <AlertTriangle size={16} />
              <span>Minta Revisi ke Surveyor</span>
            </button>
          </div>
        </div>
      )}

      {canUnderwrite && (
        <form onSubmit={handleUnderwritingSubmit}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0f766e', marginBottom: '12px' }}>
            <FileCheck2 size={22} />
            <h3 style={{ fontSize: '17px', fontWeight: 700 }}>Panel Keputusan Underwriting</h3>
          </div>
          <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '16px' }}>
            Laporan telah disetujui Risk Engineering. Tentukan keputusan akseptasi underwriting dan ketentuan penjaminan risiko.
          </p>

          <div className="form-group">
            <label className="form-label">Keputusan Akseptasi</label>
            <div className="radio-cards-grid">
              {[
                { val: 'COVERABLE', label: 'Layak Dicover', desc: 'Risiko standar dapat diakseptasi' },
                { val: 'COVERABLE_WITH_CONDITIONS', label: 'Layak dengan Syarat / Perbaikan', desc: 'Wajib pemenuhan ketentuan proteksi/perbaikan' },
                { val: 'NEED_FURTHER_REVIEW', label: 'Perlu Review Lebih Lanjut', desc: 'Menunggu survey lanjutan / rujukan kantor pusat' },
                { val: 'DECLINED', label: 'Tidak Layak Dicover', desc: 'Risiko ditolak / uninsurable' },
              ].map((item) => (
                <div
                  key={item.val}
                  className={`radio-card-item ${underwritingDecision === item.val ? 'selected' : ''}`}
                  onClick={() => setUnderwritingDecision(item.val as any)}
                >
                  <input
                    type="radio"
                    name="uw_decision"
                    checked={underwritingDecision === item.val}
                    onChange={() => setUnderwritingDecision(item.val as any)}
                  />
                  <div className="rc-content">
                    <div className="rc-title">{item.label}</div>
                    <div className="rc-desc">{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">
              Catatan Kesimpulan & Ketentuan Penjaminan <span className="req">*</span>
            </label>
            <textarea
              rows={3}
              required
              className="form-control"
              placeholder="Tuliskan klausula khusus, deductible, endorsement, atau catatan kesimpulan Underwriter..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
          </div>

          <button type="submit" disabled={loading} className="btn btn-primary" style={{ padding: '10px 20px' }}>
            <Send size={16} />
            <span>Simpan Keputusan Final</span>
          </button>
        </form>
      )}
    </div>
  );
}
