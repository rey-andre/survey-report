'use server';

import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { COOKIE_NAME, createSessionToken, getSessionUser, SessionUser } from '@/lib/auth';

export interface LoginResult {
  success: boolean;
  error?: string;
  redirectTo?: string;
}

export async function loginAction(formData: FormData): Promise<LoginResult> {
  const email = (formData.get('email') as string)?.trim().toLowerCase();
  const password = formData.get('password') as string;

  if (!email || !password) {
    return { success: false, error: 'Email dan password wajib diisi.' };
  }

  const user = await prisma.user.findUnique({
    where: { email },
    include: { branch: true },
  });

  if (!user) {
    await prisma.auditLog.create({
      data: {
        action: 'LOGIN_FAILED',
        entityType: 'User',
        metadataJson: JSON.stringify({ email, reason: 'User tidak ditemukan' }),
      },
    });
    return { success: false, error: 'Email atau password salah.' };
  }

  if (!user.isActive) {
    await prisma.auditLog.create({
      data: {
        actorId: user.id,
        action: 'LOGIN_BLOCKED',
        entityType: 'User',
        metadataJson: JSON.stringify({ email, reason: 'Akun dinonaktifkan' }),
      },
    });
    return { success: false, error: 'Akun Anda dinonaktifkan. Hubungi Super Admin.' };
  }

  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
  if (!isPasswordValid) {
    await prisma.auditLog.create({
      data: {
        actorId: user.id,
        action: 'LOGIN_FAILED',
        entityType: 'User',
        metadataJson: JSON.stringify({ email, reason: 'Password salah' }),
      },
    });
    return { success: false, error: 'Email atau password salah.' };
  }

  // Login successful
  const sessionUser: SessionUser = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role as SessionUser['role'],
    branchId: user.branchId,
    branchName: user.branch?.name || null,
  };

  const token = await createSessionToken(sessionUser);

  // Set HTTPOnly cookie
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  await prisma.auditLog.create({
    data: {
      actorId: user.id,
      action: 'LOGIN_SUCCESS',
      entityType: 'User',
      entityId: user.id,
      metadataJson: JSON.stringify({ role: user.role }),
    },
  });

  return { success: true, redirectTo: '/dashboard' };
}

export async function logoutAction(): Promise<void> {
  const currentUser = await getSessionUser();
  if (currentUser) {
    await prisma.auditLog.create({
      data: {
        actorId: currentUser.id,
        action: 'LOGOUT',
        entityType: 'User',
        entityId: currentUser.id,
      },
    });
  }

  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}
