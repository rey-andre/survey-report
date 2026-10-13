'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { AlertCircle, RotateCcw, Home } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Unhandled Server Component error:', error);
  }, [error]);

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        backgroundColor: '#0f172a',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      <div
        className="card"
        style={{
          maxWidth: '480px',
          width: '100%',
          backgroundColor: '#1e293b',
          borderRadius: '16px',
          padding: '32px',
          color: '#f8fafc',
          border: '1px solid #334155',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            backgroundColor: 'rgba(239, 68, 68, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
            color: '#ef4444',
          }}
        >
          <AlertCircle size={32} />
        </div>

        <h1 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>
          Terjadi Kendala pada Halaman
        </h1>

        <p style={{ fontSize: '13.5px', color: '#94a3b8', lineHeight: 1.6, marginBottom: '20px' }}>
          {error?.message && !error.message.includes('Minified')
            ? error.message
            : 'Terjadi kesalahan saat memproses data. Silakan coba muat ulang atau periksa koneksi server.'}
        </p>

        {error?.digest && (
          <div
            style={{
              padding: '8px 12px',
              backgroundColor: '#0f172a',
              borderRadius: '8px',
              fontSize: '11.5px',
              color: '#64748b',
              marginBottom: '24px',
              fontFamily: 'monospace',
            }}
          >
            Error Digest: {error.digest}
          </div>
        )}

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <button
            onClick={() => reset()}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '10px 18px',
              backgroundColor: '#2563eb',
              color: '#ffffff',
              borderRadius: '8px',
              fontWeight: 600,
              fontSize: '13px',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            <RotateCcw size={15} />
            Coba Lagi
          </button>

          <Link
            href="/login"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '10px 18px',
              backgroundColor: '#334155',
              color: '#e2e8f0',
              borderRadius: '8px',
              fontWeight: 600,
              fontSize: '13px',
              textDecoration: 'none',
            }}
          >
            <Home size={15} />
            Halaman Login
          </Link>
        </div>
      </div>
    </div>
  );
}
