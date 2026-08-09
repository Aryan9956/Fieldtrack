import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest, logAuditEvent } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session || session.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 403 });
    }

    const { daysToAdd } = await req.json();
    const days = parseInt(daysToAdd, 10);

    if (isNaN(days) || days <= 0) {
      return NextResponse.json({ error: 'Valid positive days value required.' }, { status: 400 });
    }

    const owner = await prisma.user.findUnique({
      where: { id: params.id },
      include: { ownedOrganization: true },
    });

    if (!owner || !owner.ownedOrganization) {
      return NextResponse.json({ error: 'Owner or organization not found.' }, { status: 404 });
    }

    const currentExpires = owner.ownedOrganization.accessExpiresAt
      ? new Date(owner.ownedOrganization.accessExpiresAt)
      : new Date();

    const baseTime = currentExpires > new Date() ? currentExpires : new Date();
    const newExpiresAt = new Date(baseTime.getTime() + days * 24 * 60 * 60 * 1000);

    const updatedOrg = await prisma.organization.update({
      where: { id: owner.ownedOrganization.id },
      data: {
        accessStatus: 'ACTIVE',
        accessExpiresAt: newExpiresAt,
      },
    });

    await prisma.accessGrant.create({
      data: {
        organizationId: updatedOrg.id,
        action: 'EXTENDED',
        duration: `${days} days`,
        reason: `Extended access by ${days} days by Super Admin`,
        grantedBy: session.userId,
        expiresAt: newExpiresAt,
      },
    });

    await logAuditEvent({
      performerId: session.userId,
      targetId: owner.id,
      action: 'ACCESS_EXTENDED',
      entityType: 'ORGANIZATION',
      entityId: updatedOrg.id,
      metadata: { daysToAdd: days, newExpiresAt },
    });

    return NextResponse.json({ message: `Access extended by ${days} days`, expiresAt: newExpiresAt });
  } catch (error) {
    console.error('Extend access error:', error);
    return NextResponse.json({ error: 'Failed to extend access' }, { status: 500 });
  }
}
