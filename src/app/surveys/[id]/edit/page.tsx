import { notFound, redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import AppShell from '@/components/AppShell';
import SurveyFormEditor from '@/components/SurveyFormEditor';

interface EditSurveyPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditSurveyPage({ params }: EditSurveyPageProps) {
  const user = await getSessionUser();
  if (!user) redirect('/login');

  const { id } = await params;

  const survey = await prisma.survey.findUnique({
    where: { id },
    include: {
      surveyor: true,
      branch: true,
      answers: true,
      attachments: { where: { deletedAt: null } },
      formVersion: {
        include: {
          sections: {
            where: { isActive: true },
            orderBy: { sortOrder: 'asc' },
          },
          questions: {
            where: { isActive: true },
            orderBy: { sortOrder: 'asc' },
          },
        },
      },
    },
  });

  if (!survey || survey.deletedAt) {
    notFound();
  }

  // Permission check: surveyor can only edit own survey, unless super admin
  if (user.role === 'SURVEYOR' && survey.surveyorId !== user.id) {
    redirect('/dashboard');
  }

  // Status check: only DRAFT or REVISION_REQUIRED can be edited
  if (survey.status !== 'DRAFT' && survey.status !== 'REVISION_REQUIRED' && user.role !== 'SUPER_ADMIN') {
    redirect(`/surveys/${survey.id}`);
  }

  const branches = await prisma.branch.findMany({
    where: { isActive: true },
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  });

  // Reconstruct answers map
  const initialAnswers: Record<string, any> = {};
  for (const a of survey.answers) {
    try {
      initialAnswers[a.questionKey] = JSON.parse(a.valueJson);
    } catch {
      initialAnswers[a.questionKey] = a.valueJson;
    }
  }

  return (
    <AppShell
      user={user}
      title="Pengisian Survey Risiko Properti"
      subtitle={`Nomor: ${survey.surveyNumber || '[Draft Baru]'} • Surveyor: ${survey.surveyor.name}`}
    >
      <SurveyFormEditor
        surveyId={survey.id}
        surveyStatus={survey.status}
        surveyNumber={survey.surveyNumber}
        sections={survey.formVersion.sections}
        questions={survey.formVersion.questions}
        initialAnswers={initialAnswers}
        initialAttachments={survey.attachments}
        branches={branches}
        surveyorName={survey.surveyor.name}
      />
    </AppShell>
  );
}
