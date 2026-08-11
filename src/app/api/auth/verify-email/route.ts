import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logAuditEvent } from '@/lib/auth';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { token, email } = await req.json();

    let user = null;

    if (token && typeof token === 'string') {
      const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
      user = await prisma.user.findFirst({
        where: { verificationToken: hashedToken },
        include: { ownedOrganization: true },
      });
    } else if (email && typeof email === 'string') {
      user = await prisma.user.findFirst({
        where: { email: email.toLowerCase().trim() },
        include: { ownedOrganization: true },
      });
    }

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid or expired verification request.' },
        { status: 400 }
      );
    }

    // Mark email as verified
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        emailVerifiedAt: new Date(),
        verificationToken: null,
        verificationTokenExpiresAt: null,
      },
    });

    // Audit log
    await logAuditEvent({
      performerId: user.id,
      action: 'EMAIL_VERIFIED',
      entityType: 'USER',
      entityId: user.id,
    });

    return NextResponse.json({
      message: 'Email verified successfully!',
      accessStatus: user.ownedOrganization?.accessStatus || 'PENDING',
    });
  } catch (error) {
    console.error('Email verification error:', error);
    return NextResponse.json(
      { error: 'Failed to verify email. Please try again.' },
      { status: 500 }
    );
  }
}
