import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { calculateMonthlyBill, isPaymentEnabled } from '@/lib/billing';

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session || session.role !== 'OWNER' || !session.organizationId) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 403 });
    }

    const org = await prisma.organization.findUnique({
      where: { id: session.organizationId },
      include: {
        subscription: true,
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

    const activeEmployeeCount = org._count.employees;
    const billingCalculation = calculateMonthlyBill(activeEmployeeCount);

    return NextResponse.json({
      subscription: {
        plan: 'FIELDTRACK',
        pricePerEmployee: 19,
        activeEmployeeCount,
        estimatedMonthlyCost: billingCalculation.totalMonthlyCost,
        accessStatus: org.accessStatus,
        accessExpiresAt: org.accessExpiresAt,
        employeeLimit: org.employeeLimit,
        paymentSystemStatus: isPaymentEnabled() ? 'ACTIVE' : 'INACTIVE',
        paymentsEnabled: isPaymentEnabled(),
        message: isPaymentEnabled() ? 'Online payment active' : 'Online payments are currently disabled (₹0 MVP Mode). Access is managed by Super Admin.',
      },
    });
  } catch (error) {
    console.error('Subscription API error:', error);
    return NextResponse.json({ error: 'Failed to fetch subscription' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  // Reject payment attempt when PAYMENTS_ENABLED=false
  if (!isPaymentEnabled()) {
    return NextResponse.json(
      {
        error: 'Payment processing is currently disabled on this platform. Access is granted manually by administrator.',
        code: 'PAYMENTS_DISABLED',
      },
      { status: 400 }
    );
  }

  return NextResponse.json({ message: 'Payment gateway initialized' });
}
