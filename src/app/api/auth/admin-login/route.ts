import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyPassword, createJWTToken, setAuthCookie, logAuditEvent } from '@/lib/auth';
import { AdminLoginSchema } from '@/lib/validators';
import { rateLimit } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || req.headers.get('x-real-ip') || '127.0.0.1';
    const limitResult = rateLimit({ ip, endpoint: 'admin-login', limit: 5, windowMs: 15 * 60 * 1000 });

    if (!limitResult.success) {
      return NextResponse.json(
        { error: 'Too many admin authentication attempts. Rate limit exceeded.' },
        { status: 429 }
      );
    }

    const body = await req.json();
    const result = AdminLoginSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
    }

    const { email, password } = result.data;
    const lowerEmail = email.toLowerCase().trim();

    const user = await prisma.user.findUnique({
      where: { email: lowerEmail },
    });

    if (!user || user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Invalid admin credentials' }, { status: 401 });
    }

    const isMatch = await verifyPassword(password, user.passwordHash);
    if (!isMatch) {
      return NextResponse.json({ error: 'Invalid admin credentials' }, { status: 401 });
    }

    const token = await createJWTToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: 'SUPER_ADMIN',
      emailVerified: true,
    });

    const response = NextResponse.json({
      message: 'Super Admin login successful',
      user: { id: user.id, email: user.email, name: user.name, role: 'SUPER_ADMIN' },
      redirectTo: '/admin',
    });

    setAuthCookie(response, token);
    await logAuditEvent({ performerId: user.id, action: 'SUPER_ADMIN_LOGIN' });

    return response;
  } catch (error) {
    console.error('Admin login error:', error);
    return NextResponse.json({ error: 'Admin login failed' }, { status: 500 });
  }
}
