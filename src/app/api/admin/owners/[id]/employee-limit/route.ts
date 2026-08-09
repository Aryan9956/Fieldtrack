import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest, logAuditEvent } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session || session.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 403 });
    }

    const { employeeLimit } = await req.json();
    const limit = parseInt(employeeLimit, 10);

    if (isNaN(limit) || limit < 1) {
      return NextResponse.json({ error: 'Valid employee limit >= 1 required.' }, { status: 400 });
    }

    const owner = await prisma.user.findUnique({
      where: { id: params.id },
      include: { ownedOrganization: true },
    });

    if (!owner || !owner.ownedOrganization) {
      return NextResponse.json({ error: 'Owner organization not found' }, { status: 404 });
    }

    const updatedOrg = await prisma.organization.update({
      where: { id: owner.ownedOrganization.id },
      data: { employeeLimit: limit },
    });

    await logAuditEvent({
      performerId: session.userId,
      targetId: owner.id,
      action: 'EMPLOYEE_LIMIT_CHANGED',
      entityType: 'ORGANIZATION',
      entityId: updatedOrg.id,
      metadata: { newLimit: limit },
    });

    return NextResponse.json({ message: 'Employee limit updated', employeeLimit: limit });
  } catch (error) {
    console.error('Employee limit change error:', error);
    return NextResponse.json({ error: 'Failed to update employee limit' }, { status: 500 });
  }
}
