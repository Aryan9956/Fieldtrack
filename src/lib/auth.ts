import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { UserSession, JWTPayload, Role } from '@/types';
import { prisma } from './prisma';

const SECRET_KEY = new TextEncoder().encode(
  process.env.AUTH_SECRET || 'fieldtrack-dev-secret-key-change-in-production-min32chars'
);

const TOKEN_NAME = 'fieldtrack_token';

// Password Hashing
export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}

// Token Generation
export async function createJWTToken(payload: UserSession): Promise<string> {
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(SECRET_KEY);
}

// Token Verification
export async function verifyJWTToken(token: string): Promise<JWTPayload | null> {
  try {
    const verified = await jwtVerify(token, SECRET_KEY);
    return verified.payload as unknown as JWTPayload;
  } catch (error) {
    return null;
  }
}

// Session retriever from Cookies (for Server Components & Route Handlers)
export async function getSession(): Promise<UserSession | null> {
  const cookieStore = cookies();
  const token = cookieStore.get(TOKEN_NAME)?.value;
  if (!token) return null;
  const payload = await verifyJWTToken(token);
  if (!payload) return null;
  return {
    userId: payload.userId,
    email: payload.email,
    name: payload.name,
    role: payload.role,
    organizationId: payload.organizationId,
    employeeId: payload.employeeId,
    emailVerified: payload.emailVerified,
    accessStatus: payload.accessStatus,
  };
}

// Session retriever from Request (for Middleware and Route Handlers)
export async function getSessionFromRequest(req: NextRequest): Promise<UserSession | null> {
  const token = req.cookies.get(TOKEN_NAME)?.value || req.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) return null;
  const payload = await verifyJWTToken(token);
  if (!payload) return null;
  return {
    userId: payload.userId,
    email: payload.email,
    name: payload.name,
    role: payload.role,
    organizationId: payload.organizationId,
    employeeId: payload.employeeId,
    emailVerified: payload.emailVerified,
    accessStatus: payload.accessStatus,
  };
}

// Cookie setter for API response
export function setAuthCookie(res: NextResponse, token: string) {
  res.cookies.set(TOKEN_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60, // 7 days
  });
}

// Clear cookie
export function clearAuthCookie(res: NextResponse) {
  res.cookies.set(TOKEN_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
}

// Audit Logger Helper
export async function logAuditEvent({
  performerId,
  targetId,
  action,
  entityType,
  entityId,
  metadata,
  ipAddress,
}: {
  performerId?: string;
  targetId?: string;
  action: string;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        performerId: performerId || null,
        targetId: targetId || null,
        action,
        entityType: entityType || null,
        entityId: entityId || null,
        metadata: metadata ? JSON.stringify(metadata) : null,
        ipAddress: ipAddress || null,
      },
    });
  } catch (error) {
    console.error('Failed to write audit log:', error);
  }
}
