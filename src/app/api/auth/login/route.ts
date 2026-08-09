import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyPassword, createJWTToken, setAuthCookie, logAuditEvent } from '@/lib/auth';
import { LoginSchema } from '@/lib/validators';
import { rateLimit } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || req.headers.get('x-real-ip') || '127.0.0.1';
    const limitResult = rateLimit({ ip, endpoint: 'login', limit: 10, windowMs: 60 * 1000 });

    if (!limitResult.success) {
      return NextResponse.json(
        { error: 'Too many login attempts. Please wait 1 minute before trying again.' },
        { status: 429 }
      );
    }

    const body = await req.json();
    const result = LoginSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid input credentials', details: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { email, password } = result.data;
    const lowerEmail = email.toLowerCase().trim();

    const user = await prisma.user.findUnique({
      where: { email: lowerEmail },
      include: {
        ownedOrganization: true,
        employeeProfile: {
          include: {
            organization: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const isMatch = await verifyPassword(password, user.passwordHash);
    if (!isMatch) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    // ROLE: SUPER_ADMIN
    if (user.role === 'SUPER_ADMIN') {
      const token = await createJWTToken({
        userId: user.id,
        email: user.email,
        name: user.name,
        role: 'SUPER_ADMIN',
        emailVerified: true,
      });

      const response = NextResponse.json({
        message: 'Admin login successful',
        user: { id: user.id, email: user.email, name: user.name, role: user.role },
        redirectTo: '/admin',
      });
      setAuthCookie(response, token);
      await logAuditEvent({ performerId: user.id, action: 'ADMIN_LOGIN' });
      return response;
    }

    // ROLE: OWNER
    if (user.role === 'OWNER') {
      // 1. Mandatory Email Verification Check
      if (!user.emailVerified) {
        return NextResponse.json(
          {
            error: 'Email verification required before accessing FieldTrack.',
            code: 'EMAIL_NOT_VERIFIED',
            email: user.email,
          },
          { status: 403 }
        );
      }

      const org = user.ownedOrganization;
      if (!org) {
        return NextResponse.json({ error: 'No organization linked to this owner account.' }, { status: 400 });
      }

      // Check access status
      const accessStatus = org.accessStatus;
      if (accessStatus !== 'ACTIVE') {
        return NextResponse.json(
          {
            error: `Your account access status is ${accessStatus}.`,
            code: `ACCESS_${accessStatus}`,
            accessStatus,
          },
          { status: 403 }
        );
      }

      // Check expiration if set
      if (org.accessExpiresAt && new Date(org.accessExpiresAt) < new Date()) {
        // Automatically mark as EXPIRED
        await prisma.organization.update({
          where: { id: org.id },
          data: { accessStatus: 'EXPIRED' },
        });

        return NextResponse.json(
          {
            error: 'Your FieldTrack access has expired. Please contact the administrator.',
            code: 'ACCESS_EXPIRED',
            accessStatus: 'EXPIRED',
          },
          { status: 403 }
        );
      }

      const token = await createJWTToken({
        userId: user.id,
        email: user.email,
        name: user.name,
        role: 'OWNER',
        organizationId: org.id,
        emailVerified: true,
        accessStatus: 'ACTIVE',
      });

      const response = NextResponse.json({
        message: 'Login successful',
        user: { id: user.id, email: user.email, name: user.name, role: user.role, organizationId: org.id },
        redirectTo: '/dashboard',
      });
      setAuthCookie(response, token);
      await logAuditEvent({ performerId: user.id, action: 'OWNER_LOGIN' });
      return response;
    }

    // ROLE: EMPLOYEE
    if (user.role === 'EMPLOYEE') {
      const emp = user.employeeProfile;
      if (!emp || !emp.isActive) {
        return NextResponse.json({ error: 'Employee account is inactive or disabled.' }, { status: 403 });
      }

      const org = emp.organization;
      if (org.accessStatus !== 'ACTIVE') {
        return NextResponse.json(
          {
            error: 'Your organization access is currently inactive. Contact your manager.',
            code: `ORG_ACCESS_${org.accessStatus}`,
          },
          { status: 403 }
        );
      }

      const token = await createJWTToken({
        userId: user.id,
        email: user.email,
        name: user.name,
        role: 'EMPLOYEE',
        organizationId: org.id,
        employeeId: emp.id,
        emailVerified: true,
      });

      const response = NextResponse.json({
        message: 'Login successful',
        user: { id: user.id, email: user.email, name: user.name, role: user.role, organizationId: org.id, employeeId: emp.id },
        redirectTo: '/employee',
      });
      setAuthCookie(response, token);
      await logAuditEvent({ performerId: user.id, action: 'EMPLOYEE_LOGIN' });
      return response;
    }

    return NextResponse.json({ error: 'Invalid user role' }, { status: 400 });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred during login.' }, { status: 500 });
  }
}
