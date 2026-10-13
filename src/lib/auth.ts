import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { prisma } from './prisma';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'survey-report-secret-key-development-2026-secure-token'
);

export const COOKIE_NAME = 'survey_session';

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: 'SURVEYOR' | 'RISK_ENGINEERING' | 'UNDERWRITER' | 'SUPER_ADMIN';
  branchId: string | null;
  branchName?: string | null;
}

export async function createSessionToken(user: SessionUser): Promise<string> {
  return await new SignJWT({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    branchId: user.branchId,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(JWT_SECRET);
}

export async function verifySessionToken(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return {
      id: payload.id as string,
      email: payload.email as string,
      name: payload.name as string,
      role: payload.role as SessionUser['role'],
      branchId: (payload.branchId as string) || null,
    };
  } catch {
    return null;
  }
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  const session = await verifySessionToken(token);
  if (!session) return null;

  // Verify that user still exists and isActive in DB
  const user = await prisma.user.findUnique({
    where: { id: session.id },
    include: { branch: true },
  });

  if (!user || !user.isActive) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role as SessionUser['role'],
    branchId: user.branchId,
    branchName: user.branch?.name || null,
  };
}

export async function requireAuth(allowedRoles?: SessionUser['role'][]): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) {
    throw new Error('UNAUTHORIZED');
  }

  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    throw new Error('FORBIDDEN');
  }

  return user;
}
