'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SessionUser } from '@/lib/auth';
import { logoutAction } from '@/app/actions/auth';
import {
  LayoutDashboard,
  PlusCircle,
  ShieldCheck,
  FileCheck2,
  Users,
  Building2,
  FileSpreadsheet,
  History,
  LogOut,
  Building,
} from 'lucide-react';

interface AppShellProps {
  user: SessionUser;
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}

export default function AppShell({ user, children, title, subtitle }: AppShellProps) {
  const pathname = usePathname();

  const handleLogout = async () => {
    if (confirm('Apakah Anda yakin ingin keluar?')) {
      await logoutAction();
      window.location.href = '/login';
    }
  };

  const roleNameMap: Record<string, string> = {
    SURVEYOR: 'Surveyor',
    RISK_ENGINEERING: 'Risk Engineering',
    UNDERWRITER: 'Underwriter',
    SUPER_ADMIN: 'Super Admin',
  };

  return (
    <div className="app-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="brand-icon">
            <Building size={20} />
          </div>
          <div className="brand-info">
            <div className="brand-title">SURVEY & RISK</div>
            <div className="brand-subtitle">Property Aswata</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section-title">Menu Utama</div>

          <Link
            href="/dashboard"
            className={`nav-item ${pathname === '/dashboard' ? 'active' : ''}`}
          >
            <LayoutDashboard size={18} />
            <span>Dashboard</span>
          </Link>

          {(user.role === 'SURVEYOR' || user.role === 'SUPER_ADMIN') && (
            <Link
              href="/surveys/new"
              className={`nav-item ${pathname === '/surveys/new' ? 'active' : ''}`}
            >
              <PlusCircle size={18} />
              <span>+ Survey Baru</span>
            </Link>
          )}

          {(user.role === 'RISK_ENGINEERING' || user.role === 'SUPER_ADMIN') && (
            <Link
              href="/reviews/risk-engineering"
              className={`nav-item ${pathname.startsWith('/reviews/risk-engineering') ? 'active' : ''}`}
            >
              <ShieldCheck size={18} />
              <span>Review Teknis</span>
            </Link>
          )}

          {(user.role === 'UNDERWRITER' || user.role === 'SUPER_ADMIN') && (
            <Link
              href="/reviews/underwriting"
              className={`nav-item ${pathname.startsWith('/reviews/underwriting') ? 'active' : ''}`}
            >
              <FileCheck2 size={18} />
              <span>Underwriting</span>
            </Link>
          )}

          {user.role === 'SUPER_ADMIN' && (
            <>
              <div className="nav-section-title">Administrasi</div>
              <Link
                href="/admin/users"
                className={`nav-item ${pathname.startsWith('/admin/users') ? 'active' : ''}`}
              >
                <Users size={18} />
                <span>Manajemen User</span>
              </Link>
              <Link
                href="/admin/branches"
                className={`nav-item ${pathname.startsWith('/admin/branches') ? 'active' : ''}`}
              >
                <Building2 size={18} />
                <span>Daftar Cabang</span>
              </Link>
              <Link
                href="/admin/form-builder"
                className={`nav-item ${pathname.startsWith('/admin/form-builder') ? 'active' : ''}`}
              >
                <FileSpreadsheet size={18} />
                <span>Pengaturan Form</span>
              </Link>
              <Link
                href="/admin/audit-logs"
                className={`nav-item ${pathname.startsWith('/admin/audit-logs') ? 'active' : ''}`}
              >
                <History size={18} />
                <span>Audit Log</span>
              </Link>
            </>
          )}
        </nav>

        <div className="sidebar-footer">
          <div className="user-badge">
            <div className="user-avatar">{user.name.charAt(0).toUpperCase()}</div>
            <div className="user-details">
              <div className="user-name">{user.name}</div>
              <div className="user-role-label">
                {roleNameMap[user.role] || user.role} {user.branchName ? `• ${user.branchName}` : ''}
              </div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            title="Keluar / Logout"
            className="btn btn-secondary"
            style={{ padding: '6px', background: 'transparent', border: 'none', color: '#94a3b8' }}
          >
            <LogOut size={18} />
          </button>
        </div>
      </aside>

      {/* Main Area */}
      <div className="main-content">
        <header className="topbar">
          <div className="page-title-box">
            <h1>{title || 'Survey Report & Risk Grading'}</h1>
            {subtitle && <p className="page-subtitle">{subtitle}</p>}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span className="badge badge-avg" style={{ fontSize: '12px', padding: '6px 12px' }}>
              Cabang: {user.branchName || 'Semua Cabang'}
            </span>
          </div>
        </header>

        <main className="content-container">{children}</main>
      </div>
    </div>
  );
}
