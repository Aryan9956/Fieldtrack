import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        emailVerified: true,
        emailVerifiedAt: true,
        ownedOrganization: {
          select: {
            id: true,
            name: true,
            accessStatus: true,
            accessExpiresAt: true,
            employeeLimit: true,
          },
        },
        employeeProfile: {
          select: {
            id: true,
            phone: true,
            designation: true,
            organization: {
              select: {
                id: true,
                name: true,
                accessStatus: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({ user });
  } catch (error) {
    return NextResponse.json({ user: null }, { status: 500 });
  }
}
