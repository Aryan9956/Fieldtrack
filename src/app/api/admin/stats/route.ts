import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';


export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session || session.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized. Super Admin role required.' }, { status: 403 });
    }

    const [
      totalOwners,
      verifiedOwners,
      pendingOwners,
      activeOwners,
      suspendedOwners,
      revokedOwners,
      expiredOwners,
      totalEmployees,
      activeEmployees,
      currentlyWorking,
      totalTasks,
      completedTasks,
    ] = await Promise.all([
      prisma.user.count({ where: { role: 'OWNER' } }),
      prisma.user.count({ where: { role: 'OWNER', emailVerified: true } }),
      prisma.organization.count({ where: { accessStatus: 'PENDING' } }),
      prisma.organization.count({ where: { accessStatus: 'ACTIVE' } }),
      prisma.organization.count({ where: { accessStatus: 'SUSPENDED' } }),
      prisma.organization.count({ where: { accessStatus: 'REVOKED' } }),
      prisma.organization.count({ where: { accessStatus: 'EXPIRED' } }),
      prisma.employee.count(),
      prisma.employee.count({ where: { isActive: true } }),
      prisma.employee.count({ where: { currentStatus: 'WORKING' } }),
      prisma.task.count(),
      prisma.task.count({ where: { status: 'COMPLETED' } }),
    ]);

    return NextResponse.json({
      stats: {
        totalOwners,
        verifiedOwners,
        pendingOwners,
        activeOwners,
        suspendedOwners,
        revokedOwners,
        expiredOwners,
        totalEmployees,
        activeEmployees,
        currentlyWorking,
        totalTasks,
        completedTasks,
        revenue: '₹0', // Payment inactive for MVP
        paymentStatus: 'INACTIVE',
      },
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    return NextResponse.json({ error: 'Failed to fetch admin stats' }, { status: 500 });
  }
}
