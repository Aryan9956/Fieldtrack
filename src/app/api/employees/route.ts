import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest, hashPassword, logAuditEvent } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { CreateEmployeeSchema } from '@/lib/validators';

export const dynamic = 'force-dynamic';


export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session || session.role !== 'OWNER' || !session.organizationId) {
      return NextResponse.json({ error: 'Unauthorized manager access.' }, { status: 403 });
    }

    const employees = await prisma.employee.findMany({
      where: {
        organizationId: session.organizationId,
      },
      include: {
        user: {
          select: { name: true, email: true },
        },
        workSessions: {
          take: 1,
          orderBy: { startTime: 'desc' },
        },
        tasks: {
          where: { status: { in: ['ASSIGNED', 'ACCEPTED', 'IN_PROGRESS'] } },
          select: { id: true, title: true, priority: true, status: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ employees });
  } catch (error) {
    console.error('Fetch employees error:', error);
    return NextResponse.json({ error: 'Failed to fetch employees' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session || session.role !== 'OWNER' || !session.organizationId) {
      return NextResponse.json({ error: 'Unauthorized manager access.' }, { status: 403 });
    }

    const body = await req.json();
    const result = CreateEmployeeSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { name, email, password, phone, designation } = result.data;
    const lowerEmail = email.toLowerCase().trim();

    // 1. Employee Limit Check (Server-Side Enforced)
    const org = await prisma.organization.findUnique({
      where: { id: session.organizationId },
      include: {
        _count: {
          select: {
            employees: { where: { isActive: true } },
          },
        },
      },
    });

    if (!org) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    const activeCount = org._count.employees;
    if (activeCount >= org.employeeLimit) {
      return NextResponse.json(
        {
          error: `You have reached your active employee limit (${activeCount} / ${org.employeeLimit}). Please contact administrator to increase limit.`,
          code: 'EMPLOYEE_LIMIT_REACHED',
          limit: org.employeeLimit,
          current: activeCount,
        },
        { status: 403 }
      );
    }

    // 2. Check email uniqueness
    const existingUser = await prisma.user.findUnique({
      where: { email: lowerEmail },
    });
    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email already exists.' },
        { status: 400 }
      );
    }

    // 3. Create User & Employee profile
    const passwordHash = await hashPassword(password);

    const newEmployee = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: lowerEmail,
          name,
          passwordHash,
          role: 'EMPLOYEE',
          emailVerified: true, // Employees don't require separate verification
          emailVerifiedAt: new Date(),
        },
      });

      const emp = await tx.employee.create({
        data: {
          userId: user.id,
          organizationId: session.organizationId!,
          phone,
          designation,
          currentStatus: 'OFFLINE',
        },
      });

      return emp;
    });

    await logAuditEvent({
      performerId: session.userId,
      action: 'EMPLOYEE_CREATED',
      entityType: 'EMPLOYEE',
      entityId: newEmployee.id,
      metadata: { name, email: lowerEmail },
    });

    return NextResponse.json({
      message: 'Employee added successfully',
      employee: newEmployee,
    });
  } catch (error) {
    console.error('Create employee error:', error);
    return NextResponse.json({ error: 'Failed to create employee' }, { status: 500 });
  }
}
