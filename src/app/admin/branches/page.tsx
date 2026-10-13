import { redirect } from 'next/navigation';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import AppShell from '@/components/AppShell';
import AdminBranchesClient from '@/components/AdminBranchesClient';

export default async function AdminBranchesPage() {
  const user = await requireAuth(['SUPER_ADMIN']);

  const branches = await prisma.branch.findMany({
    where: { isActive: true },
    include: {
      _count: {
        select: { users: true },
      },
    },
    orderBy: { name: 'asc' },
  });

  return (
    <AppShell
      user={user}
      title="Daftar Cabang & Wilayah Kerja"
      subtitle="Kelola referensi cabang perusahaan yang digunakan dalam penugasan survey."
    >
      <AdminBranchesClient branches={branches} />
    </AppShell>
  );
}
