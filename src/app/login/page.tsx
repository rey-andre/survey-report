'use client';

import React, { useState } from 'react';
import { loginAction } from '@/app/actions/auth';
import { Building, Shield, Lock, Mail, ArrowRight, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData();
    formData.append('email', email);
    formData.append('password', password);

    try {
      const res = await loginAction(formData);
      if (!res.success) {
        setError(res.error || 'Login gagal.');
      } else if (res.redirectTo) {
        window.location.href = res.redirectTo;
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setLoading(false);
    }
  };

  const fillTestAccount = (testEmail: string) => {
    setEmail(testEmail);
    setPassword('SurveyDev!2026');
    setError(null);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        background: 'radial-gradient(circle at 15% 20%, rgba(30, 96, 145, 0.4), transparent 50%), radial-gradient(circle at 85% 80%, rgba(217, 119, 6, 0.25), transparent 50%), linear-gradient(145deg, #0f1c2e, #17283c 65%, #08101a)',
      }}
    >
      <div
        className="card"
        style={{
          width: '100%',
          maxWidth: '440px',
          padding: '36px 32px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.45)',
          borderRadius: '20px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #1e6091, #38bdf8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              boxShadow: '0 4px 14px rgba(56, 189, 248, 0.3)',
            }}
          >
            <Building size={24} />
          </div>
          <div>
            <h1 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
              ASWATA RISK
            </h1>
            <p style={{ fontSize: '12px', color: '#64748b' }}>Property Survey Report & Grading</p>
          </div>
        </div>

        <div style={{ marginBottom: '22px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a' }}>Masuk ke Akun</h2>
          <p style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
            Gunakan kredensial resmi untuk mengakses sistem survey.
          </p>
        </div>

        {error && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: '#fef2f2',
              color: '#b91c1c',
              padding: '12px 14px',
              borderRadius: '8px',
              fontSize: '13px',
              marginBottom: '18px',
              border: '1px solid #fecaca',
            }}
          >
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email / Username</label>
            <div style={{ position: 'relative' }}>
              <input
                type="email"
                required
                className="form-control"
                style={{ paddingLeft: '38px' }}
                placeholder="nama@example.test"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <Mail
                size={16}
                style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '24px' }}>
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type="password"
                required
                className="form-control"
                style={{ paddingLeft: '38px' }}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <Lock
                size={16}
                style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{ width: '100%', padding: '12px', fontSize: '14px', borderRadius: '10px' }}
          >
            {loading ? 'Memverifikasi...' : 'Masuk Sekarang'}
            {!loading && <ArrowRight size={16} />}
          </button>
        </form>

        {/* Quick Testing Accounts */}
        <div
          style={{
            marginTop: '28px',
            paddingTop: '20px',
            borderTop: '1px dashed #e2e8f0',
          }}
        >
          <div style={{ fontSize: '11.5px', fontWeight: 600, color: '#64748b', marginBottom: '10px' }}>
            ⚡ Akun Uji Coba Cepat (Password: SurveyDev!2026):
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
            <button
              type="button"
              onClick={() => fillTestAccount('surveyor@example.test')}
              className="btn btn-secondary"
              style={{ fontSize: '11px', padding: '6px 8px' }}
            >
              Surveyor
            </button>
            <button
              type="button"
              onClick={() => fillTestAccount('risk.engineering@example.test')}
              className="btn btn-secondary"
              style={{ fontSize: '11px', padding: '6px 8px' }}
            >
              Risk Eng.
            </button>
            <button
              type="button"
              onClick={() => fillTestAccount('underwriter@example.test')}
              className="btn btn-secondary"
              style={{ fontSize: '11px', padding: '6px 8px' }}
            >
              Underwriter
            </button>
            <button
              type="button"
              onClick={() => fillTestAccount('admin.survey@example.test')}
              className="btn btn-secondary"
              style={{ fontSize: '11px', padding: '6px 8px' }}
            >
              Super Admin
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
