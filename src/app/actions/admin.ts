'use server';

import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import bcrypt from 'bcryptjs';
import { revalidatePath } from 'next/cache';

export async function createUserAction(formData: FormData) {
  const actor = await requireAuth(['SUPER_ADMIN']);

  const name = (formData.get('name') as string)?.trim();
  const email = (formData.get('email') as string)?.trim().toLowerCase();
  const password = formData.get('password') as string;
  const role = formData.get('role') as string;
  const branchId = (formData.get('branchId') as string) || null;

  if (!name || !email || !password || !role) {
    return { success: false, error: 'Semua field wajib diisi.' };
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { success: false, error: 'Email sudah terdaftar.' };
  }

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);

  const newUser = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      role,
      branchId,
      isActive: true,
    },
  });

  await prisma.auditLog.create({
    data: {
      actorId: actor.id,
      action: 'USER_CREATE',
      entityType: 'User',
      entityId: newUser.id,
      metadataJson: JSON.stringify({ email, role, branchId }),
    },
  });

  revalidatePath('/admin/users');
  return { success: true };
}

export async function toggleUserStatusAction(userId: string) {
  const actor = await requireAuth(['SUPER_ADMIN']);

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return { success: false, error: 'User tidak ditemukan.' };

  if (user.id === actor.id) {
    return { success: false, error: 'Tidak dapat menonaktifkan akun sendiri.' };
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { isActive: !user.isActive },
  });

  await prisma.auditLog.create({
    data: {
      actorId: actor.id,
      action: updated.isActive ? 'USER_ACTIVATE' : 'USER_DEACTIVATE',
      entityType: 'User',
      entityId: userId,
    },
  });

  revalidatePath('/admin/users');
  return { success: true, isActive: updated.isActive };
}

export async function resetPasswordAction(userId: string, newPass: string) {
  const actor = await requireAuth(['SUPER_ADMIN']);

  if (!newPass || newPass.length < 6) {
    return { success: false, error: 'Password minimal 6 karakter.' };
  }

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(newPass, salt);

  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash },
  });

  await prisma.auditLog.create({
    data: {
      actorId: actor.id,
      action: 'USER_PASSWORD_RESET',
      entityType: 'User',
      entityId: userId,
    },
  });

  return { success: true };
}

export async function createBranchAction(name: string, code?: string) {
  const actor = await requireAuth(['SUPER_ADMIN']);

  if (!name || name.trim().length === 0) {
    return { success: false, error: 'Nama cabang wajib diisi.' };
  }

  const existing = await prisma.branch.findUnique({ where: { name } });
  if (existing) {
    return { success: false, error: 'Nama cabang sudah ada.' };
  }

  const branch = await prisma.branch.create({
    data: { name: name.trim(), code: code?.trim() || null, isActive: true },
  });

  await prisma.auditLog.create({
    data: {
      actorId: actor.id,
      action: 'BRANCH_CREATE',
      entityType: 'Branch',
      entityId: branch.id,
      metadataJson: JSON.stringify({ name, code }),
    },
  });

  revalidatePath('/admin/branches');
  return { success: true };
}

export async function updateQuestionConfigAction(
  questionId: string,
  data: {
    label?: string;
    helpText?: string;
    isRequired?: boolean;
    isActive?: boolean;
    optionsJson?: string;
  }
) {
  const actor = await requireAuth(['SUPER_ADMIN']);

  const question = await prisma.formQuestion.findUnique({ where: { id: questionId } });
  if (!question) return { success: false, error: 'Pertanyaan tidak ditemukan.' };

  await prisma.formQuestion.update({
    where: { id: questionId },
    data,
  });

  await prisma.auditLog.create({
    data: {
      actorId: actor.id,
      action: 'QUESTION_UPDATE',
      entityType: 'FormQuestion',
      entityId: questionId,
      metadataJson: JSON.stringify(data),
    },
  });

  revalidatePath('/admin/form-builder');
  return { success: true };
}
