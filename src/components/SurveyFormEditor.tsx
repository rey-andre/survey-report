'use client';

import React, { useState, useEffect, useTransition, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { saveSurveyDraftAction, submitSurveyForReviewAction } from '@/app/actions/survey';
import { calculateRiskGrading, RiskCalculationResult, getHidranWajibStatus } from '@/lib/grading';
import { validateSurveySubmission, ValidationError } from '@/lib/validation';
import {
  Save,
  Send,
  AlertCircle,
  CheckCircle,
  Upload,
  Search,
  ChevronLeft,
  ChevronRight,
  FileText,
  MapPin,
  Flame,
  Building,
  ShieldCheck,
  Activity,
  Layers,
  FileSpreadsheet,
  Check,
} from 'lucide-react';

interface FormSectionData {
  id: string;
  key: string;
  title: string;
  description: string | null;
  sortOrder: number;
}

interface FormQuestionData {
  id: string;
  sectionId: string;
  key: string;
  label: string;
  helpText: string | null;
  type: string;
  isRequired: boolean;
  sortOrder: number;
  optionsJson: string | null;
  validationJson: string | null;
  visibilityConditionJson: string | null;
  gradingMetadataJson: string | null;
}

interface SurveyFormEditorProps {
  surveyId: string;
  surveyStatus: string;
  surveyNumber: string | null;
  sections: FormSectionData[];
  questions: FormQuestionData[];
  initialAnswers: Record<string, any>;
  initialAttachments?: any[];
  branches: { id: string; name: string }[];
  surveyorName: string;
}

export default function SurveyFormEditor({
  surveyId,
  surveyStatus,
  surveyNumber,
  sections,
  questions,
  initialAnswers,
  initialAttachments = [],
  branches,
  surveyorName,
}: SurveyFormEditorProps) {
  const router = useRouter();
  const [activeSecIndex, setActiveSecIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({
    f_surveyor: surveyorName,
    f_tanggal: new Date().toISOString().slice(0, 10),
    ...initialAnswers,
  });

  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Occupancy lookup state
  const [occQuery, setOccQuery] = useState('');
  const [occResults, setOccResults] = useState<any[]>([]);
  const [isOccOpen, setIsOccOpen] = useState(false);

  // File upload state
  const [attachments, setAttachments] = useState<any[]>(initialAttachments);
  const [uploadingField, setUploadingField] = useState<string | null>(null);

  // Risk grading calculation preview
  const [calcResult, setCalcResult] = useState<RiskCalculationResult>(() =>
    calculateRiskGrading(answers)
  );

  // Update calculation whenever relevant answers change
  useEffect(() => {
    setCalcResult(calculateRiskGrading(answers));
  }, [answers]);

  const [sectionErrorNotice, setSectionErrorNotice] = useState<string | null>(null);

  const activeSection = sections[activeSecIndex] || sections[0];

  const handleFieldChange = (key: string, value: any) => {
    setAnswers((prev) => ({
      ...prev,
      [key]: value,
    }));
    setValidationErrors((prev) => prev.filter((e) => e.fieldKey !== key));
  };

  const handleGoToSection = (targetIndex: number) => {
    // If moving backwards, always allow
    if (targetIndex < activeSecIndex) {
      setActiveSecIndex(targetIndex);
      setSectionErrorNotice(null);
      window.scrollTo({ top: 120, behavior: 'smooth' });
      return;
    }

    // Validate current section when attempting to advance
    const allErrors = validateSurveySubmission(answers);
    const currentSecErrors = allErrors.filter((e) => e.sectionIndex === activeSecIndex);

    if (currentSecErrors.length > 0) {
      setValidationErrors(allErrors);
      setSectionErrorNotice(
        `Pertanyaan wajib pada Bagian ${activeSecIndex + 1} (${activeSection.title.split('—')[0].trim()}) belum lengkap. Anda belum dapat lanjut ke bagian berikutnya sebelum melengkapinya.`
      );
      window.scrollTo({ top: 120, behavior: 'smooth' });
      return;
    }

    // Check intermediate sections if jumping ahead
    for (let s = 0; s < targetIndex; s++) {
      const intermediateErrors = allErrors.filter((e) => e.sectionIndex === s);
      if (intermediateErrors.length > 0) {
        setValidationErrors(allErrors);
        setActiveSecIndex(s);
        setSectionErrorNotice(
          `Silakan lengkapi pertanyaan wajib pada Bagian ${s + 1} (${sections[s]?.title.split('—')[0].trim()}) terlebih dahulu.`
        );
        window.scrollTo({ top: 120, behavior: 'smooth' });
        return;
      }
    }

    setSectionErrorNotice(null);
    setActiveSecIndex(targetIndex);
    window.scrollTo({ top: 120, behavior: 'smooth' });
  };

  // Manual Save Draft
  const handleSaveDraft = async () => {
    setSaveStatus('saving');
    try {
      const res = await saveSurveyDraftAction(surveyId, answers);
      if (res.success) {
        setSaveStatus('saved');
        setLastSavedTime(new Date().toLocaleTimeString('id-ID'));
        setTimeout(() => setSaveStatus('idle'), 3500);
      } else {
        setSaveStatus('error');
        alert(res.error || 'Gagal menyimpan draft.');
      }
    } catch (err: any) {
      setSaveStatus('error');
      alert(err.message || 'Gagal menyimpan draft.');
    }
  };

  // Submit for Review
  const handleSubmitReview = async () => {
    if (!confirm('Kirim laporan survey ini ke Risk Engineering untuk direview? Pastikan seluruh data telah sesuai.')) {
      return;
    }

    setIsSubmitting(true);
    setValidationErrors([]);

    try {
      const res = await submitSurveyForReviewAction(surveyId, answers);
      if (!res.success) {
        if (res.validationErrors && res.validationErrors.length > 0) {
          setValidationErrors(res.validationErrors);
          // Jump to first section with error
          const firstErr = res.validationErrors[0];
          setActiveSecIndex(firstErr.sectionIndex);
        } else {
          alert(res.error || 'Gagal mengirim survey.');
        }
      } else {
        alert(`Survey berhasil dikirim! Nomor Survey: ${res.surveyNumber}`);
        router.push(`/surveys/${surveyId}`);
      }
    } catch (err: any) {
      alert(err.message || 'Terjadi kesalahan saat mengirim.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // GPS Geolocation Browser Trigger
  const handleGetGPS = () => {
    if (!navigator.geolocation) {
      alert('Browser Anda tidak mendukung geolokasi.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = `${pos.coords.latitude.toFixed(6)}, ${pos.coords.longitude.toFixed(6)}`;
        handleFieldChange('f_gps', coords);
      },
      () => {
        alert('Gagal mengambil koordinat lokasi. Pastikan izin lokasi aktif.');
      }
    );
  };

  // Search occupancies
  const handleSearchOcc = async (query: string) => {
    setOccQuery(query);
    try {
      const res = await fetch(`/api/occupancy/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setOccResults(data.results || []);
      setIsOccOpen(true);
    } catch {
      // silent fallback
    }
  };

  const handleSelectOcc = (item: any) => {
    setAnswers((prev) => ({
      ...prev,
      o_breakdown_code: item.code,
      o_breakdown_name: item.description,
      o_hazard_score: item.score,
      o_hazard_cat: item.riskKey,
      o_hazard_label: item.riskLabel,
    }));
    setIsOccOpen(false);
  };

  // File Upload
  const handleUploadFile = async (e: React.ChangeEvent<HTMLInputElement>, questionKey: string) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingField(questionKey);
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const formData = new FormData();
      formData.append('surveyId', surveyId);
      formData.append('questionKey', questionKey);
      formData.append('file', file);

      try {
        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });
        const data = await res.json();
        if (data.success && data.attachment) {
          setAttachments((prev) => [...prev, data.attachment]);
        } else {
          alert(data.error || 'Gagal mengunggah file');
        }
      } catch (err: any) {
        alert(err.message || 'Gagal mengunggah file.');
      }
    }
    setUploadingField(null);
  };

  // Conditional field visibility evaluator
  const isQuestionVisible = (q: FormQuestionData): boolean => {
    if (!q.visibilityConditionJson) return true;
    try {
      const cond = JSON.parse(q.visibilityConditionJson);
      if (cond.field) {
        const val = answers[cond.field];
        if (cond.value !== undefined) return val === cond.value;
        if (cond.values !== undefined) return cond.values.includes(val);
        if (cond.notValue !== undefined) return val !== cond.notValue && val !== undefined && val !== '';
      }
      if (cond.all && Array.isArray(cond.all)) {
        return cond.all.every((c: any) => {
          const val = answers[c.field];
          if (c.value !== undefined) return val === c.value;
          if (c.values !== undefined) return c.values.includes(val);
          return true;
        });
      }
    } catch {
      return true;
    }
    return true;
  };

  const questionsInActiveSec = questions
    .filter((q) => q.sectionId === activeSection.id)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const errorsInActiveSec = validationErrors.filter(
    (e) => e.sectionIndex === activeSecIndex
  );

  return (
    <div style={{ paddingBottom: '80px' }}>
      {/* Top Banner / Controls */}
      <div
        className="card"
        style={{
          padding: '16px 24px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          position: 'sticky',
          top: '70px',
          zIndex: 8,
          boxShadow: 'var(--shadow-md)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span className="badge badge-draft" style={{ fontSize: '13px', padding: '6px 12px' }}>
            {surveyNumber || 'DRAFT SURVEY'}
          </span>
          <span style={{ fontSize: '13px', color: '#64748b' }}>
            Tertanggung: <strong>{answers.f_tertanggung || '— Belum Diisi —'}</strong>
          </span>
          {saveStatus === 'saving' && (
            <span style={{ fontSize: '12px', color: '#d97706', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span className="spin">⏳</span> Menyimpan draft...
            </span>
          )}
          {saveStatus === 'saved' && (
            <span style={{ fontSize: '12px', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <CheckCircle size={14} /> Tersimpan ({lastSavedTime})
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            type="button"
            onClick={handleSaveDraft}
            disabled={saveStatus === 'saving'}
            className="btn btn-secondary"
            title="Simpan perubahan tanpa validasi form wajib"
          >
            <Save size={16} />
            <span>Simpan Draft</span>
          </button>

          <button
            type="button"
            onClick={handleSubmitReview}
            disabled={isSubmitting}
            className="btn btn-primary"
            style={{ padding: '9px 18px' }}
          >
            <Send size={16} />
            <span>Kirim untuk Review</span>
          </button>
        </div>
      </div>

      {/* Validation Alert Box if any errors */}
      {validationErrors.length > 0 && (
        <div
          style={{
            background: '#fff1f2',
            border: '1.5px solid #fecdd3',
            borderRadius: '12px',
            padding: '16px 20px',
            marginBottom: '20px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#be123c', fontWeight: 700, fontSize: '14px' }}>
            <AlertCircle size={18} />
            <span>Pengiriman Ditolak: Terdapat {validationErrors.length} kolom wajib/kondisional yang belum lengkap!</span>
          </div>
          <p style={{ fontSize: '12.5px', color: '#9f1239', marginTop: '4px' }}>
            Silakan lengkapi kolom yang ditandai di bawah ini:
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '10px' }}>
            {validationErrors.map((err, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setActiveSecIndex(err.sectionIndex)}
                className="btn btn-secondary"
                style={{
                  fontSize: '11.5px',
                  padding: '4px 8px',
                  background: '#ffffff',
                  color: '#be123c',
                  borderColor: '#fca5a5',
                }}
              >
                Bagian {err.sectionIndex + 1}: {err.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Section Mandatory Error Notice Banner */}
      {sectionErrorNotice && (
        <div
          style={{
            background: '#fff1f2',
            border: '1.5px solid #fecdd3',
            borderRadius: '12px',
            padding: '14px 18px',
            marginBottom: '18px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            color: '#be123c',
            fontWeight: 600,
            fontSize: '13.5px',
            boxShadow: '0 4px 12px rgba(239, 68, 68, 0.1)',
          }}
        >
          <AlertCircle size={20} style={{ flexShrink: 0 }} />
          <div style={{ flex: 1 }}>{sectionErrorNotice}</div>
        </div>
      )}

      {/* Stepper Navigation */}
      <div className="stepper-nav">
        {sections.map((sec, idx) => {
          const hasError = validationErrors.some((e) => e.sectionIndex === idx);
          return (
            <button
              key={sec.id}
              type="button"
              onClick={() => handleGoToSection(idx)}
              className={`stepper-pill ${activeSecIndex === idx ? 'active' : ''} ${hasError ? 'has-error' : ''}`}
            >
              <span>{idx + 1}. {sec.title.split('—')[0]}</span>
              {hasError && <span style={{ color: '#ef4444' }}>●</span>}
            </button>
          );
        })}
      </div>

      {/* Section Header Card */}
      <div className="form-section-banner">
        <div className="fsb-icon">
          {activeSecIndex === 0 && '📋'}
          {activeSecIndex === 1 && '🏢'}
          {activeSecIndex === 2 && '🏭'}
          {activeSecIndex === 3 && '📎'}
          {activeSecIndex === 4 && '👔'}
          {activeSecIndex === 5 && '🏗️'}
          {activeSecIndex === 6 && '🏭'}
          {activeSecIndex === 7 && '🔥'}
          {activeSecIndex === 8 && '🌍'}
          {activeSecIndex === 9 && '🌋'}
          {activeSecIndex === 10 && '💰'}
          {activeSecIndex === 11 && '📊'}
        </div>
        <div>
          <div className="fsb-title">
            Bagian {activeSecIndex + 1}: {activeSection.title}
          </div>
          {activeSection.description && <div className="fsb-sub">{activeSection.description}</div>}
        </div>
      </div>

      {/* Section Body */}
      <div className="card" style={{ padding: '28px' }}>
        {/* Render Special Section 11 (Grading Calculation View) */}
        {activeSecIndex === 11 ? (
          <div>
            <div className={`grading-banner ${calcResult.overallGrade.toLowerCase()}`}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 600, opacity: 0.9 }}>HASIL OVERALL RISK GRADING</div>
                <div className="gb-grade">{calcResult.overallGrade}</div>
                <div className="gb-score">
                  Total Skor: <strong>{calcResult.total} / 55 poin</strong>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '12px', opacity: 0.85 }}>Tertanggung: {answers.f_tertanggung || '—'}</div>
                <div style={{ fontSize: '12px', opacity: 0.85 }}>Tanggal: {answers.f_tanggal || '—'}</div>
                {calcResult.protectionOverride && (
                  <div style={{ marginTop: '8px', background: 'rgba(0,0,0,0.25)', padding: '4px 10px', borderRadius: '6px', fontSize: '11.5px' }}>
                    ⚠️ Override POOR aktif karena Proteksi Kebakaran = Poor
                  </div>
                )}
              </div>
            </div>

            <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '12px' }}>Rincian Skor & Bobot per Kategori</h3>
            <div className="table-wrap" style={{ marginBottom: '24px' }}>
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
                    ['1', 'Management', 'I', calcResult.ratings.management, calcResult.scores.management],
                    ['2', 'Construction', 'I', calcResult.ratings.construction, calcResult.scores.construction],
                    ['3', 'Occupancy', 'I', calcResult.ratings.occupancy, calcResult.scores.occupancy],
                    ['4', 'Protection', 'I', calcResult.ratings.protection, calcResult.scores.protection],
                    ['5', 'Exposure', 'II', calcResult.ratings.exposure, calcResult.scores.exposure],
                    ['6', 'Natural Hazards', 'II', calcResult.ratings.nat_hazards, calcResult.scores.nat_hazards],
                    ['7', 'Other Perils', 'II', calcResult.ratings.other_perils, calcResult.scores.other_perils],
                    ['8', 'Loss Estimate', 'III', calcResult.ratings.loss_estimate, calcResult.scores.loss_estimate],
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
                  <tr style={{ background: '#f8fafc', fontWeight: 800 }}>
                    <td colSpan={4} style={{ textAlign: 'right' }}>TOTAL SKOR</td>
                    <td style={{ fontSize: '16px', color: '#1e6091' }}>{calcResult.total} / 55</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        ) : null}

        {/* Dynamic Questions rendering */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {questionsInActiveSec.map((q) => {
            if (!isQuestionVisible(q)) return null;

            const isErr = errorsInActiveSec.some((e) => e.fieldKey === q.key);
            const val = answers[q.key] ?? '';

            // 1. Text or Number or Date
            if (q.type === 'text' || q.type === 'number' || q.type === 'date') {
              return (
                <div key={q.id} className="form-group" style={{ borderColor: isErr ? '#ef4444' : undefined }}>
                  <label className="form-label">
                    {q.label} {q.isRequired && <span className="req">*</span>}
                  </label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type={q.type}
                      className="form-control"
                      value={val}
                      placeholder={q.helpText || ''}
                      onChange={(e) => handleFieldChange(q.key, e.target.value)}
                    />
                    {q.key === 'f_gps' && (
                      <button type="button" onClick={handleGetGPS} className="btn btn-secondary" title="Ambil GPS sekarang">
                        <MapPin size={16} />
                        <span>Lokasi Saya</span>
                      </button>
                    )}
                  </div>
                  {q.helpText && <div className="form-hint">{q.helpText}</div>}
                  {isErr && <div style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>Kolom ini wajib diisi.</div>}
                </div>
              );
            }

            // 2. Textarea
            if (q.type === 'textarea') {
              return (
                <div key={q.id} className="form-group">
                  <label className="form-label">
                    {q.label} {q.isRequired && <span className="req">*</span>}
                  </label>
                  <textarea
                    rows={3}
                    className="form-control"
                    value={val}
                    placeholder={q.helpText || ''}
                    onChange={(e) => handleFieldChange(q.key, e.target.value)}
                  />
                  {q.helpText && <div className="form-hint">{q.helpText}</div>}
                  {isErr && <div style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>Kolom ini wajib diisi.</div>}
                </div>
              );
            }

            // 3. Select
            if (q.type === 'select') {
              let options: { label: string; value: string }[] = [];
              if (q.optionsJson) {
                try {
                  options = JSON.parse(q.optionsJson);
                } catch {}
              }

              return (
                <div key={q.id} className="form-group">
                  <label className="form-label">
                    {q.label} {q.isRequired && <span className="req">*</span>}
                  </label>
                  <select
                    className="form-control"
                    value={val}
                    onChange={(e) => handleFieldChange(q.key, e.target.value)}
                  >
                    <option value="">— Pilih Opsi —</option>
                    {options.map((opt, i) => (
                      <option key={i} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  {q.helpText && <div className="form-hint">{q.helpText}</div>}
                  {isErr && <div style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>Wajib memilih opsi.</div>}
                </div>
              );
            }

            // 4. Radio Group
            if (q.type === 'radio') {
              let options: any[] = [];
              if (q.optionsJson) {
                try {
                  options = JSON.parse(q.optionsJson);
                } catch {}
              }

              return (
                <div key={q.id} className="form-group">
                  <label className="form-label">
                    {q.label} {q.isRequired && <span className="req">*</span>}
                  </label>
                  <div className="radio-cards-grid">
                    {options.map((opt, i) => {
                      const isSelected = String(val) === String(opt.value);
                      return (
                        <div
                          key={i}
                          className={`radio-card-item ${isSelected ? 'selected' : ''}`}
                          onClick={() => handleFieldChange(q.key, opt.value)}
                        >
                          <input
                            type="radio"
                            name={q.key}
                            checked={isSelected}
                            onChange={() => handleFieldChange(q.key, opt.value)}
                          />
                          <div className="rc-content">
                            <div className="rc-title">{opt.label}</div>
                            {opt.desc && <div className="rc-desc">{opt.desc}</div>}
                            {opt.badge && (
                              <div style={{ marginTop: '4px' }}>
                                <span className="badge badge-avg">{opt.badge}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {q.helpText && <div className="form-hint">{q.helpText}</div>}
                  {isErr && <div style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>Wajib memilih salah satu opsi.</div>}
                </div>
              );
            }

            // 5. Lookup (Occupancy search)
            if (q.type === 'lookup') {
              return (
                <div key={q.id} className="form-group" style={{ position: 'relative' }}>
                  <label className="form-label">
                    {q.label} {q.isRequired && <span className="req">*</span>}
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Ketik kode (misal 2923) atau nama industri..."
                      value={answers.o_breakdown_name ? `${answers.o_breakdown_code} - ${answers.o_breakdown_name}` : occQuery}
                      onChange={(e) => handleSearchOcc(e.target.value)}
                      onFocus={() => handleSearchOcc('')}
                    />
                    <Search
                      size={16}
                      style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}
                    />
                  </div>

                  {answers.o_breakdown_code && (
                    <div style={{ marginTop: '8px', padding: '10px 14px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', fontSize: '12.5px' }}>
                      <strong>Terpilih:</strong> {answers.o_breakdown_code} — {answers.o_breakdown_name}
                      <div style={{ marginTop: '4px', color: '#166534' }}>
                        Kategori Hazard: <b>{answers.o_hazard_label}</b> | Hazard Score: <b>{answers.o_hazard_score}</b>
                      </div>
                    </div>
                  )}

                  {isOccOpen && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        background: '#ffffff',
                        border: '1px solid #cbd5e1',
                        borderRadius: '8px',
                        boxShadow: 'var(--shadow-xl)',
                        maxHeight: '260px',
                        overflowY: 'auto',
                        zIndex: 20,
                        marginTop: '4px',
                      }}
                    >
                      {occResults.map((item, idx) => (
                        <div
                          key={idx}
                          onClick={() => handleSelectOcc(item)}
                          style={{
                            padding: '10px 14px',
                            borderBottom: '1px solid #f1f5f9',
                            cursor: 'pointer',
                            fontSize: '13px',
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = '#f8fafc')}
                          onMouseLeave={(e) => (e.currentTarget.style.background = '#ffffff')}
                        >
                          <div style={{ fontWeight: 600, color: '#1e6091' }}>{item.code} — {item.description}</div>
                          <div style={{ fontSize: '11px', color: '#64748b' }}>
                            {item.riskLabel} • Skor: {item.score}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {q.helpText && <div className="form-hint">{q.helpText}</div>}
                  {isErr && <div style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>Wajib memilih okupansi referensi.</div>}
                </div>
              );
            }

            // 6. File Upload
            if (q.type === 'file') {
              const filesForThisField = attachments.filter((a) => a.questionKey === q.key);
              return (
                <div key={q.id} className="form-group">
                  <label className="form-label">
                    {q.label} {q.isRequired && <span className="req">*</span>}
                  </label>
                  <input
                    type="file"
                    className="form-control"
                    onChange={(e) => handleUploadFile(e, q.key)}
                    disabled={uploadingField === q.key}
                  />
                  {uploadingField === q.key && (
                    <div style={{ fontSize: '12px', color: '#d97706', marginTop: '4px' }}>Sedang mengunggah file...</div>
                  )}
                  {filesForThisField.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '10px' }}>
                      {filesForThisField.map((att) => (
                        <div
                          key={att.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            background: '#f1f5f9',
                            padding: '6px 12px',
                            borderRadius: '6px',
                            fontSize: '12px',
                          }}
                        >
                          <FileText size={14} color="#1e6091" />
                          <a href={`/api/attachments/${att.id}`} target="_blank" rel="noreferrer" style={{ textDecoration: 'underline' }}>
                            {att.originalFileName}
                          </a>
                        </div>
                      ))}
                    </div>
                  )}
                  {q.helpText && <div className="form-hint">{q.helpText}</div>}
                </div>
              );
            }

            // 7. Checkbox
            if (q.type === 'checkbox') {
              return (
                <div key={q.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '8px 0' }}>
                  <input
                    type="checkbox"
                    id={q.key}
                    checked={!!val}
                    onChange={(e) => handleFieldChange(q.key, e.target.checked)}
                  />
                  <label htmlFor={q.key} style={{ fontSize: '13px', cursor: 'pointer' }}>
                    {q.label}
                  </label>
                </div>
              );
            }

            return null;
          })}
        </div>

        {/* Section Navigation Footer */}
        <div
          style={{
            marginTop: '32px',
            paddingTop: '20px',
            borderTop: '1px solid var(--border-light)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <button
            type="button"
            disabled={activeSecIndex === 0}
            onClick={() => handleGoToSection(activeSecIndex - 1)}
            className="btn btn-secondary"
          >
            <ChevronLeft size={16} />
            <span>Bagian Sebelumnya</span>
          </button>

          <span style={{ fontSize: '12.5px', color: '#64748b' }}>
            Bagian {activeSecIndex + 1} dari {sections.length}
          </span>

          <button
            type="button"
            disabled={activeSecIndex === sections.length - 1}
            onClick={() => handleGoToSection(activeSecIndex + 1)}
            className="btn btn-primary"
          >
            <span>Bagian Selanjutnya</span>
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
