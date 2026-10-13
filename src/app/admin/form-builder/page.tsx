import { redirect } from 'next/navigation';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import AppShell from '@/components/AppShell';
import AdminFormBuilderClient from '@/components/AdminFormBuilderClient';

export default async function AdminFormBuilderPage() {
  const user = await requireAuth(['SUPER_ADMIN']);

  const activeVersion = await prisma.formVersion.findFirst({
    where: { status: 'PUBLISHED' },
    include: {
      sections: {
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' },
      },
      questions: {
        where: { isActive: true },
        include: { section: true },
        orderBy: { sortOrder: 'asc' },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  if (!activeVersion) {
    return (
      <AppShell user={user} title="Pengaturan Formulir">
        <div className="card">Belum ada versi formulir yang diterbitkan.</div>
      </AppShell>
    );
  }

  return (
    <AppShell
      user={user}
      title="Pengaturan Formulir & Pertanyaan"
      subtitle="Kelola definisi 208 pertanyaan survey properti dan kriteria validasi dinamis dari SQLite."
    >
      <AdminFormBuilderClient
        version={activeVersion}
        sections={activeVersion.sections}
        questions={activeVersion.questions}
      />
    </AppShell>
  );
}
