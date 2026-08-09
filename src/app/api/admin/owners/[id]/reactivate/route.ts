import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest, logAuditEvent } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session || session.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 403 });
    }

    const ownerId = params.id;

    const owner = await prisma.user.findUnique({
      where: { id: ownerId },
      include: { ownedOrganization: true },
    });

    if (!owner || !owner.ownedOrganization) {
      return NextResponse.json({ error: 'Owner organization not found' }, { status: 404 });
    }

    const updatedOrg = await prisma.organization.update({
      where: { id: owner.ownedOrganization.id },
      data: {
        accessStatus: 'ACTIVE',
        accessRevokedAt: null,
        accessSuspendedAt: null,
      },
    });

    await prisma.accessGrant.create({
      data: {
        organizationId: updatedOrg.id,
        action: 'REACTIVATED',
        reason: 'Reactivated by Super Admin',
        grantedBy: session.userId,
      },
    });

    await logAuditEvent({
      performerId: session.userId,
      targetId: owner.id,
      action: 'ACCESS_REACTIVATED',
      entityType: 'ORGANIZATION',
      entityId: updatedOrg.id,
    });

    return NextResponse.json({ message: 'Access reactivated successfully' });
  } catch (error) {
    console.error('Reactivate access error:', error);
    return NextResponse.json({ error: 'Failed to reactivate access' }, { status: 500 });
  }
}
