import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';


export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session || session.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const filter = searchParams.get('filter') || 'ALL'; // ALL | PENDING | VERIFIED | ACTIVE | EXPIRED | SUSPENDED | REVOKED
    const query = searchParams.get('q') || '';

    const whereClause: any = {
      role: 'OWNER',
    };

    if (query) {
      whereClause.OR = [
        { name: { contains: query } },
        { email: { contains: query } },
        { ownedOrganization: { name: { contains: query } } },
      ];
    }

    if (filter === 'VERIFIED') {
      whereClause.emailVerified = true;
    } else if (filter === 'PENDING') {
      whereClause.ownedOrganization = { accessStatus: 'PENDING' };
    } else if (filter === 'ACTIVE') {
      whereClause.ownedOrganization = { accessStatus: 'ACTIVE' };
    } else if (filter === 'EXPIRED') {
      whereClause.ownedOrganization = { accessStatus: 'EXPIRED' };
    } else if (filter === 'SUSPENDED') {
      whereClause.ownedOrganization = { accessStatus: 'SUSPENDED' };
    } else if (filter === 'REVOKED') {
      whereClause.ownedOrganization = { accessStatus: 'REVOKED' };
    }

    const owners = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        email: true,
        emailVerified: true,
        emailVerifiedAt: true,
        createdAt: true,
        ownedOrganization: {
          select: {
            id: true,
            name: true,
            accessStatus: true,
            accessGrantedAt: true,
            accessExpiresAt: true,
            employeeLimit: true,
            _count: {
              select: {
                employees: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ owners });
  } catch (error) {
    console.error('Fetch owners error:', error);
    return NextResponse.json({ error: 'Failed to fetch owners list' }, { status: 500 });
  }
}
