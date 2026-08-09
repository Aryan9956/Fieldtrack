import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword, logAuditEvent } from '@/lib/auth';
import { RegisterOwnerSchema } from '@/lib/validators';
import { getEmailProvider } from '@/lib/email';
import { rateLimit } from '@/lib/rate-limit';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || req.headers.get('x-real-ip') || '127.0.0.1';
    const limitResult = rateLimit({ ip, endpoint: 'register', limit: 5, windowMs: 15 * 60 * 1000 });

    if (!limitResult.success) {
      return NextResponse.json(
        { error: 'Too many registration requests. Please wait 15 minutes.' },
        { status: 429 }
      );
    }

    const body = await req.json();
    const result = RegisterOwnerSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { name, email, password, orgName } = result.data;
    const lowerEmail = email.toLowerCase().trim();

    // Check existing user
    const existingUser = await prisma.user.findUnique({
      where: { email: lowerEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 400 }
      );
    }

    // Password hash
    const passwordHash = await hashPassword(password);

    // Verification token generation (raw token sent to user, SHA-256 stored in DB)
    const rawVerificationToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(rawVerificationToken).digest('hex');
    const tokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Create User, Organization, Subscription in transaction
    const newUser = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: lowerEmail,
          name,
          passwordHash,
          role: 'OWNER',
          emailVerified: false,
          verificationToken: hashedToken,
          verificationTokenExpiresAt: tokenExpires,
        },
      });

      const org = await tx.organization.create({
        data: {
          name: orgName,
          ownerId: user.id,
          accessStatus: 'PENDING',
          employeeLimit: 0,
        },
      });

      await tx.subscription.create({
        data: {
          organizationId: org.id,
          plan: 'FIELDTRACK',
          pricePerEmployee: 19,
          status: 'MANUAL',
        },
      });

      return user;
    });

    // Send verification email via abstraction
    const emailProvider = getEmailProvider();
    await emailProvider.sendVerificationEmail(lowerEmail, name, rawVerificationToken);

    // Log audit event
    await logAuditEvent({
      performerId: newUser.id,
      action: 'OWNER_REGISTERED',
      entityType: 'USER',
      entityId: newUser.id,
      metadata: { orgName, email: lowerEmail },
    });

    return NextResponse.json(
      {
        message: 'Registration successful! Please check your email to verify your account.',
        email: lowerEmail,
        requiresVerification: true,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Failed to complete registration. Please try again later.' },
      { status: 500 }
    );
  }
}
