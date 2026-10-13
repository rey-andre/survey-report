import { redirect } from 'next/navigation';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import AppShell from '@/components/AppShell';
import AdminUsersClient from '@/components/AdminUsersClient';

export default async function AdminUsersPage() {
  const user = await requireAuth(['SUPER_ADMIN']);

  const users = await prisma.user.findMany({
    include: { branch: true },
    orderBy: { createdAt: 'desc' },
  });

  const branches = await prisma.branch.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' },
  });

  return (
    <AppShell
      user={user}
      title="Manajemen Pengguna & Akses"
      subtitle="Kelola akun surveyor, risk engineering, underwriter, dan hak akses cabang."
    >
      <AdminUsersClient users={users} branches={branches} />
    </AppShell>
  );
}
