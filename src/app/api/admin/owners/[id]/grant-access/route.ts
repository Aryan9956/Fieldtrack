import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest, logAuditEvent } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { GrantAccessSchema } from '@/lib/validators';
import { getEmailProvider } from '@/lib/email';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session || session.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 403 });
    }

    const ownerId = params.id;
    const body = await req.json();
    const result = GrantAccessSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid parameters', details: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { durationDays, employeeLimit, reason } = result.data;

    const owner = await prisma.user.findUnique({
      where: { id: ownerId },
      include: { ownedOrganization: true },
    });

    if (!owner || owner.role !== 'OWNER' || !owner.ownedOrganization) {
      return NextResponse.json({ error: 'Owner or organization not found.' }, { status: 404 });
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);

    // Update Organization Access & Employee Limit
    const updatedOrg = await prisma.organization.update({
      where: { id: owner.ownedOrganization.id },
      data: {
        accessStatus: 'ACTIVE',
        accessGrantedAt: now,
        accessExpiresAt: expiresAt,
        accessRevokedAt: null,
        accessSuspendedAt: null,
        employeeLimit,
      },
    });

    // Record AccessGrant history entry
    await prisma.accessGrant.create({
      data: {
        organizationId: updatedOrg.id,
        action: 'GRANTED',
        duration: `${durationDays} days`,
        employeeLimit,
        reason: reason || 'Granted by Super Admin',
        grantedBy: session.userId,
        expiresAt,
      },
    });

    // Audit Log
    await logAuditEvent({
      performerId: session.userId,
      targetId: owner.id,
      action: 'ACCESS_GRANTED',
      entityType: 'ORGANIZATION',
      entityId: updatedOrg.id,
      metadata: { durationDays, employeeLimit, reason, expiresAt },
    });

    // Send email notification
    const emailProvider = getEmailProvider();
    await emailProvider.sendAccessGrantedEmail(
      owner.email,
      owner.name,
      `${durationDays} days`,
      employeeLimit
    );

    return NextResponse.json({
      message: 'Access granted successfully!',
      organization: updatedOrg,
    });
  } catch (error) {
    console.error('Grant access error:', error);
    return NextResponse.json({ error: 'Failed to grant access.' }, { status: 500 });
  }
}
