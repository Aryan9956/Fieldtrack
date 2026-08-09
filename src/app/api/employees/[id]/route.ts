import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest, logAuditEvent } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session || session.role !== 'OWNER' || !session.organizationId) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 403 });
    }

    const employee = await prisma.employee.findFirst({
      where: {
        id: params.id,
        organizationId: session.organizationId,
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        workSessions: {
          orderBy: { startTime: 'desc' },
          take: 20,
        },
        tasks: {
          orderBy: { createdAt: 'desc' },
        },
        locations: {
          orderBy: { timestamp: 'desc' },
          take: 50,
        },
      },
    });

    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    return NextResponse.json({ employee });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch employee' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session || session.role !== 'OWNER' || !session.organizationId) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 403 });
    }

    const body = await req.json();
    const { name, phone, designation, isActive } = body;

    const employee = await prisma.employee.findFirst({
      where: { id: params.id, organizationId: session.organizationId },
    });

    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    if (typeof isActive === 'boolean') {
      await prisma.employee.update({
        where: { id: employee.id },
        data: { isActive },
      });
    }

    if (name) {
      await prisma.user.update({
        where: { id: employee.userId },
        data: { name },
      });
    }

    const updatedEmp = await prisma.employee.update({
      where: { id: employee.id },
      data: { phone, designation },
      include: { user: { select: { name: true, email: true } } },
    });

    await logAuditEvent({
      performerId: session.userId,
      action: 'EMPLOYEE_UPDATED',
      entityType: 'EMPLOYEE',
      entityId: employee.id,
    });

    return NextResponse.json({ employee: updatedEmp });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update employee' }, { status: 500 });
  }
}
