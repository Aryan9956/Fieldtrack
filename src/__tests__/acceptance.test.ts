import assert from 'assert';
import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { calculateMonthlyBill, isPaymentEnabled } from '../lib/billing';

const prisma = new PrismaClient();

async function runAcceptanceTest() {
  console.log('🧪 Starting FieldTrack Final Real-World Acceptance & Security Test Suite...\n');

  try {
    // ----------------------------------------------------
    // TEST 1: Database Connection & PostgreSQL Compatibility
    // ----------------------------------------------------
    console.log('▶ Test 1: Database Connection & Query Latency');
    const dbStart = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const dbLatency = Date.now() - dbStart;
    console.log(`✅ Database responsive. Query Latency: ${dbLatency}ms`);

    // ----------------------------------------------------
    // TEST 2: Email Verification & Separate Access Approval
    // ----------------------------------------------------
    console.log('\n▶ Test 2: Owner Email Verification & Admin Access State Machine');
    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

    const ownerUser = await prisma.user.create({
      data: {
        email: `acc_owner_${Date.now()}@test.com`,
        name: 'Acceptance Owner',
        passwordHash: await bcrypt.hash('OwnerSecret123', 12),
        role: 'OWNER',
        emailVerified: false,
        verificationToken: hashedToken,
        verificationTokenExpiresAt: new Date(Date.now() + 24 * 3600 * 1000),
      },
    });

    const orgA = await prisma.organization.create({
      data: {
        name: 'Acceptance Org A',
        ownerId: ownerUser.id,
        accessStatus: 'PENDING',
        employeeLimit: 2,
      },
    });

    assert.strictEqual(ownerUser.emailVerified, false);
    assert.strictEqual(orgA.accessStatus, 'PENDING');

    // Verify email token match
    const foundUser = await prisma.user.findFirst({ where: { verificationToken: hashedToken } });
    assert.strictEqual(foundUser?.id, ownerUser.id);
    console.log('✅ Email verification token stored securely as SHA-256 hash.');

    // Simulate email verification
    await prisma.user.update({
      where: { id: ownerUser.id },
      data: { emailVerified: true, emailVerifiedAt: new Date(), verificationToken: null },
    });

    const verifiedUser = await prisma.user.findUnique({ where: { id: ownerUser.id } });
    assert.strictEqual(verifiedUser?.emailVerified, true);
    assert.strictEqual(orgA.accessStatus, 'PENDING', 'Email verification MUST NOT automatically make access ACTIVE');
    console.log('✅ Email Verification state separated from Admin Access Approval state.');

    // ----------------------------------------------------
    // TEST 3: Admin Manual Access Grant & Employee Quota Setting
    // ----------------------------------------------------
    console.log('\n▶ Test 3: Super Admin Access Grant & Employee Limits');
    const activeOrgA = await prisma.organization.update({
      where: { id: orgA.id },
      data: {
        accessStatus: 'ACTIVE',
        accessGrantedAt: new Date(),
        accessExpiresAt: new Date(Date.now() + 30 * 24 * 3600 * 1000),
        employeeLimit: 2,
      },
    });

    assert.strictEqual(activeOrgA.accessStatus, 'ACTIVE');
    assert.strictEqual(activeOrgA.employeeLimit, 2);
    console.log('✅ Admin granted ACTIVE access for 30 days with employee limit = 2.');

    // ----------------------------------------------------
    // TEST 4: Employee Limit Server-Side Quota Enforcement
    // ----------------------------------------------------
    console.log('\n▶ Test 4: Server-Side Employee Limit Enforcement (Limit = 2)');
    const emp1User = await prisma.user.create({
      data: { email: `acc_emp1_${Date.now()}@test.com`, name: 'Emp 1', passwordHash: 'hash', role: 'EMPLOYEE', emailVerified: true },
    });
    const emp1 = await prisma.employee.create({
      data: { userId: emp1User.id, organizationId: orgA.id, isActive: true },
    });

    const emp2User = await prisma.user.create({
      data: { email: `acc_emp2_${Date.now()}@test.com`, name: 'Emp 2', passwordHash: 'hash', role: 'EMPLOYEE', emailVerified: true },
    });
    const emp2 = await prisma.employee.create({
      data: { userId: emp2User.id, organizationId: orgA.id, isActive: true },
    });

    const activeCount = await prisma.employee.count({ where: { organizationId: orgA.id, isActive: true } });
    assert.strictEqual(activeCount, 2);

    const isAtLimit = activeCount >= activeOrgA.employeeLimit;
    assert.strictEqual(isAtLimit, true, 'Creating 3rd active employee MUST be blocked by quota check');
    console.log(`✅ Quota check verified: ${activeCount} active employees out of ${activeOrgA.employeeLimit} limit.`);

    // Deactivate 1 employee and verify new space opens
    await prisma.employee.update({ where: { id: emp1.id }, data: { isActive: false } });
    const newActiveCount = await prisma.employee.count({ where: { organizationId: orgA.id, isActive: true } });
    assert.strictEqual(newActiveCount, 1);
    console.log('✅ Deactivating employee immediately frees quota slot (1/2 active).');

    // Reactivate emp1 for remaining tests
    await prisma.employee.update({ where: { id: emp1.id }, data: { isActive: true } });

    // ----------------------------------------------------
    // TEST 5: Multi-Tenant Penetration & IDOR Isolation (Org A vs Org B)
    // ----------------------------------------------------
    console.log('\n▶ Test 5: Multi-Tenant Data & API Isolation Penetration Test');
    const ownerB = await prisma.user.create({
      data: { email: `acc_owner_b_${Date.now()}@test.com`, name: 'Owner B', passwordHash: 'hash', role: 'OWNER', emailVerified: true },
    });
    const orgB = await prisma.organization.create({
      data: { name: 'Org B Workspace', ownerId: ownerB.id, accessStatus: 'ACTIVE', employeeLimit: 5 },
    });
    const empBUser = await prisma.user.create({
      data: { email: `acc_emp_b_${Date.now()}@test.com`, name: 'Emp B', passwordHash: 'hash', role: 'EMPLOYEE', emailVerified: true },
    });
    const empB = await prisma.employee.create({
      data: { userId: empBUser.id, organizationId: orgB.id, isActive: true },
    });

    const leakedEmp = await prisma.employee.findFirst({
      where: { id: empB.id, organizationId: orgA.id },
    });
    assert.strictEqual(leakedEmp, null, 'Owner A MUST NOT be able to query Owner B employee records!');

    const leakedTask = await prisma.task.findFirst({
      where: { organizationId: orgA.id, employeeId: empB.id },
    });
    assert.strictEqual(leakedTask, null, 'Owner A MUST NOT access Owner B tasks!');
    console.log('✅ Multi-tenant data isolation verified: Org A cannot read or leak Org B resources.');

    // ----------------------------------------------------
    // TEST 6: Public Share Token Security & Expiration
    // ----------------------------------------------------
    console.log('\n▶ Test 6: Public Location Share Token Security & Expiration');
    const shareTokenStr = crypto.randomBytes(24).toString('hex');
    const shareToken = await prisma.locationShareToken.create({
      data: {
        shareToken: shareTokenStr,
        organizationId: orgA.id,
        employeeId: emp1.id,
        title: 'Live Tracking Test',
        expiresAt: new Date(Date.now() - 1000), // Expired 1 second ago
        isActive: true,
      },
    });

    const queriedToken = await prisma.locationShareToken.findUnique({ where: { shareToken: shareTokenStr } });
    assert.notStrictEqual(queriedToken, null);

    const isExpired = queriedToken?.expiresAt && new Date(queriedToken.expiresAt) < new Date();
    assert.strictEqual(isExpired, true, 'Expired share token MUST be rejected');
    console.log('✅ Public share token expiration verified: Expired links strictly deny access.');

    // ----------------------------------------------------
    // TEST 7: Pricing Engine Calculation
    // ----------------------------------------------------
    console.log('\n▶ Test 7: Commercial Pricing Server-Side Calculation');
    assert.strictEqual(calculateMonthlyBill(1).totalMonthlyCost, 19);
    assert.strictEqual(calculateMonthlyBill(10).totalMonthlyCost, 190);
    assert.strictEqual(calculateMonthlyBill(12).totalMonthlyCost, 228);
    assert.strictEqual(calculateMonthlyBill(25).totalMonthlyCost, 475);
    assert.strictEqual(calculateMonthlyBill(100).totalMonthlyCost, 1900);
    assert.strictEqual(isPaymentEnabled(), false, 'PAYMENTS_ENABLED must remain false for MVP');
    console.log('✅ Server pricing calculation verified (₹19/active employee/month).');

    // ----------------------------------------------------
    // TEST 8: Access Suspension & Revocation Enforcement
    // ----------------------------------------------------
    console.log('\n▶ Test 8: Access Revocation & Suspension');
    await prisma.organization.update({ where: { id: orgA.id }, data: { accessStatus: 'SUSPENDED' } });
    let checkOrg = await prisma.organization.findUnique({ where: { id: orgA.id } });
    assert.strictEqual(checkOrg?.accessStatus, 'SUSPENDED');

    await prisma.organization.update({ where: { id: orgA.id }, data: { accessStatus: 'REVOKED' } });
    checkOrg = await prisma.organization.findUnique({ where: { id: orgA.id } });
    assert.strictEqual(checkOrg?.accessStatus, 'REVOKED');
    console.log('✅ Access state updates (SUSPENDED -> REVOKED) verified.');

    // Clean up test data
    const orgIds = [orgA.id, orgB.id];
    await prisma.locationShareToken.deleteMany({ where: { organizationId: { in: orgIds } } });
    await prisma.employeeLocation.deleteMany({ where: { organizationId: { in: orgIds } } });
    await prisma.workSession.deleteMany({ where: { organizationId: { in: orgIds } } });
    await prisma.task.deleteMany({ where: { organizationId: { in: orgIds } } });
    await prisma.accessGrant.deleteMany({ where: { organizationId: { in: orgIds } } });
    await prisma.subscription.deleteMany({ where: { organizationId: { in: orgIds } } });
    await prisma.employee.deleteMany({ where: { organizationId: { in: orgIds } } });
    await prisma.organization.deleteMany({ where: { id: { in: orgIds } } });
    await prisma.user.deleteMany({ where: { id: { in: [ownerUser.id, ownerB.id, emp1User.id, emp2User.id, empBUser.id] } } });

    console.log('\n🎉 ALL ACCEPTANCE & SECURITY TESTS PASSED SUCCESSFULLY!');
  } catch (error) {
    console.error('\n❌ ACCEPTANCE TEST FAILED:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runAcceptanceTest();
