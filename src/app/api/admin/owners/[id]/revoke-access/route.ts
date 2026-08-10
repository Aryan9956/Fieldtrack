import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest, logAuditEvent } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getEmailProvider } from '@/lib/email';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session || session.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 403 });
    }

    const ownerId = params.id;
    const { reason } = await req.json().catch(() => ({ reason: '' }));

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
        accessStatus: 'REVOKED',
        accessRevokedAt: new Date(),
      },
    });

    await prisma.accessGrant.create({
      data: {
        organizationId: updatedOrg.id,
        action: 'REVOKED',
        reason: reason || 'Revoked by Super Admin',
        grantedBy: session.userId,
      },
    });

    await logAuditEvent({
      performerId: session.userId,
      targetId: owner.id,
      action: 'ACCESS_REVOKED',
      entityType: 'ORGANIZATION',
      entityId: updatedOrg.id,
      metadata: { reason },
    });

    const emailProvider = getEmailProvider();
    await emailProvider.sendAccessRevokedEmail(owner.email, owner.name, reason);

    return NextResponse.json({ message: 'Access revoked successfully' });
  } catch (error) {
    console.error('Revoke access error:', error);
    return NextResponse.json({ error: 'Failed to revoke access' }, { status: 500 });
  }
}
