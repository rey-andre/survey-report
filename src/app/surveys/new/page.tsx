'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSurveyAction } from '@/app/actions/survey';

export default function NewSurveyPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    createSurveyAction()
      .then((result) => {
        if (!active) return;
        if (result.success && result.surveyId) {
          router.replace(`/surveys/${result.surveyId}/edit`);
        } else {
          router.replace('/dashboard');
        }
      })
      .catch((err) => {
        if (!active) return;
        setError(err.message || 'Gagal membuat survey baru.');
      });

    return () => {
      active = false;
    };
  }, [router]);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: '#f8fafc',
      }}
    >
      <div style={{ textAlign: 'center', color: '#64748b', padding: '24px' }}>
        <div style={{ fontSize: '36px', marginBottom: '14px' }}>📋</div>
        <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>Membuat Survey Baru...</h2>
        <p style={{ fontSize: '13px', marginTop: '4px' }}>Menyiapkan formulir dan versi kriteria aktif dari SQLite.</p>
        {error && (
          <p style={{ color: '#ef4444', fontSize: '13px', marginTop: '12px', fontWeight: 600 }}>
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
