import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Memulai Seeding Database ---');

  // 1. Seed Cabang (Branches)
  const branches = [
    { name: 'Jakarta', code: 'JKT' },
    { name: 'Surabaya', code: 'SBY' },
    { name: 'Medan', code: 'MDN' },
    { name: 'Bandung', code: 'BDG' },
    { name: 'Semarang', code: 'SMG' },
    { name: 'Makassar', code: 'MKS' },
    { name: 'Denpasar', code: 'DPS' },
    { name: 'Palembang', code: 'PLM' },
    { name: 'Balikpapan', code: 'BPN' },
    { name: 'Manado', code: 'MND' },
    { name: 'Pekanbaru', code: 'PKU' },
    { name: 'Lampung', code: 'LPG' },
    { name: 'Solo', code: 'SLO' },
    { name: 'Malang', code: 'MLG' },
    { name: 'Batam', code: 'BTM' },
  ];

  const branchMap: Record<string, string> = {};
  for (const b of branches) {
    const branch = await prisma.branch.upsert({
      where: { name: b.name },
      update: { code: b.code, isActive: true },
      create: { name: b.name, code: b.code, isActive: true },
    });
    branchMap[b.name] = branch.id;
  }
  console.log(`✓ ${branches.length} Cabang berhasil diproses.`);

  // 2. Seed 4 Akun Testing (PRD Section 15)
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('SurveyDev!2026', salt);

  const testUsers = [
    {
      name: 'Admin Survey',
      email: 'admin.survey@example.test',
      role: 'SUPER_ADMIN',
      branchName: 'Jakarta',
    },
    {
      name: 'Budi Surveyor',
      email: 'surveyor@example.test',
      role: 'SURVEYOR',
      branchName: 'Jakarta',
    },
    {
      name: 'Rina Risk Engineering',
      email: 'risk.engineering@example.test',
      role: 'RISK_ENGINEERING',
      branchName: 'Jakarta',
    },
    {
      name: 'Andi Underwriter',
      email: 'underwriter@example.test',
      role: 'UNDERWRITER',
      branchName: 'Jakarta',
    },
  ];

  for (const u of testUsers) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: {
        name: u.name,
        role: u.role,
        passwordHash: passwordHash,
        branchId: branchMap[u.branchName] || null,
        isActive: true,
      },
      create: {
        name: u.name,
        email: u.email,
        passwordHash: passwordHash,
        role: u.role,
        branchId: branchMap[u.branchName] || null,
        isActive: true,
      },
    });
  }
  console.log('✓ 4 Akun Testing berhasil diproses (SurveyDev!2026).');

  // 3. Seed FormVersion v1.0
  const formDataRaw = fs.readFileSync(path.join(__dirname, 'form_v1_data.json'), 'utf-8');
  const formData = JSON.parse(formDataRaw);

  const formVersion = await prisma.formVersion.upsert({
    where: { version: 'v1.0' },
    update: {
      status: 'PUBLISHED',
      publishedAt: new Date(),
    },
    create: {
      version: 'v1.0',
      status: 'PUBLISHED',
      publishedAt: new Date(),
    },
  });

  const sectionMap: Record<string, string> = {};
  for (const sec of formData.sections) {
    let sectionRecord = await prisma.formSection.findFirst({
      where: { formVersionId: formVersion.id, key: sec.key },
    });

    if (!sectionRecord) {
      sectionRecord = await prisma.formSection.create({
        data: {
          formVersionId: formVersion.id,
          key: sec.key,
          title: sec.title,
          description: sec.description,
          sortOrder: sec.sortOrder,
          isActive: true,
        },
      });
    } else {
      sectionRecord = await prisma.formSection.update({
        where: { id: sectionRecord.id },
        data: {
          title: sec.title,
          description: sec.description,
          sortOrder: sec.sortOrder,
          isActive: true,
        },
      });
    }
    sectionMap[sec.key] = sectionRecord.id;
  }
  console.log(`✓ ${formData.sections.length} Bagian Formulir berhasil diproses.`);

  // 4. Seed Questions
  let questionCount = 0;
  for (const q of formData.questions) {
    const sectionId = sectionMap[q.sectionKey];
    if (!sectionId) continue;

    const existingQ = await prisma.formQuestion.findUnique({
      where: {
        formVersionId_key: {
          formVersionId: formVersion.id,
          key: q.key,
        },
      },
    });

    const dataPayload = {
      sectionId,
      formVersionId: formVersion.id,
      key: q.key,
      label: q.label,
      helpText: q.helpText || null,
      type: q.type,
      isRequired: q.isRequired || false,
      sortOrder: q.sortOrder,
      optionsJson: q.options ? JSON.stringify(q.options) : null,
      validationJson: q.validation ? JSON.stringify(q.validation) : null,
      visibilityConditionJson: q.visibility ? JSON.stringify(q.visibility) : null,
      gradingMetadataJson: q.grading ? JSON.stringify(q.grading) : null,
      isActive: true,
    };

    if (existingQ) {
      await prisma.formQuestion.update({
        where: { id: existingQ.id },
        data: dataPayload,
      });
    } else {
      await prisma.formQuestion.create({
        data: dataPayload,
      });
    }
    questionCount++;
  }
  console.log(`✓ ${questionCount} Pertanyaan Formulir v1.0 berhasil disimpan ke SQLite.`);

  // 5. Audit Log Seed Initial
  await prisma.auditLog.create({
    data: {
      action: 'SYSTEM_SEED',
      entityType: 'System',
      entityId: 'seed-v1',
      metadataJson: JSON.stringify({
        sectionsCount: formData.sections.length,
        questionsCount: questionCount,
        accountsSeeded: testUsers.map((u) => u.email),
      }),
    },
  });

  console.log('--- Seeding Selesai Sukses ---');
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
