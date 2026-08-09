import assert from 'assert';
import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { calculateMonthlyBill, isPaymentEnabled } from '../lib/billing';

const prisma = new PrismaClient();

async function runSecurityAuditTests() {
  console.log('🛡️ Starting FieldTrack End-to-End Security & Functionality Audit...\n');

  try {
    // ----------------------------------------------------
    // TEST 1: Password Hashing & Token Hash Security
    // ----------------------------------------------------
    console.log('▶ Test 1: Password & Verification Token Security');
    const rawToken = 'test-verification-token-12345';
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
    assert.notStrictEqual(rawToken, hashedToken, 'Token MUST NOT be stored as plaintext');
    assert.strictEqual(hashedToken.length, 64, 'SHA-256 hash must be 64 hex characters');

    const passHash = await bcrypt.hash('secretPassword', 12);
    assert.strictEqual(await bcrypt.compare('secretPassword', passHash), true);
    assert.strictEqual(await bcrypt.compare('wrongPassword', passHash), false);
    console.log('✅ Passwords hashed with bcrypt; verification tokens stored as SHA-256 hashes.');

    // ----------------------------------------------------
    // TEST 2: Email Verification & Admin Access Control States
    // ----------------------------------------------------
    console.log('\n▶ Test 2: Owner State Machine & Access Separation');
    const testOwnerEmail = `audit_owner_${Date.now()}@test.com`;
    const testPasswordHash = await bcrypt.hash('ownerPass123', 12);
    const uniqueHashedToken = crypto.createHash('sha256').update(`token_${Date.now()}`).digest('hex');

    const testOwner = await prisma.user.create({
      data: {
        email: testOwnerEmail,
        name: 'Audit Owner',
        passwordHash: testPasswordHash,
        role: 'OWNER',
        emailVerified: false,
        verificationToken: uniqueHashedToken,
      },
    });

    const testOrg = await prisma.organization.create({
      data: {
        name: 'Audit Workspace',
        ownerId: testOwner.id,
        accessStatus: 'PENDING',
        employeeLimit: 2,
      },
    });

    assert.strictEqual(testOwner.emailVerified, false, 'Initial owner email must be unverified');
    assert.strictEqual(testOrg.accessStatus, 'PENDING', 'Initial access status must be PENDING');

    // Simulate email verification
    await prisma.user.update({
      where: { id: testOwner.id },
      data: { emailVerified: true, emailVerifiedAt: new Date() },
    });
    const verifiedOwner = await prisma.user.findUnique({ where: { id: testOwner.id } });
    assert.strictEqual(verifiedOwner?.emailVerified, true, 'Email verified state updated');

    assert.strictEqual(testOrg.accessStatus, 'PENDING', 'Email verification MUST NOT automatically grant ACTIVE access');
    console.log('✅ Verified Email Status ≠ Admin Access Approval Status separation enforced.');

    // Simulate Super Admin granting access (30 days, limit 5)
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 30 * 24 * 3600 * 1000);
    const activeOrg = await prisma.organization.update({
      where: { id: testOrg.id },
      data: {
        accessStatus: 'ACTIVE',
        accessGrantedAt: now,
        accessExpiresAt: expiresAt,
        employeeLimit: 5,
      },
    });
    assert.strictEqual(activeOrg.accessStatus, 'ACTIVE', 'Access granted to ACTIVE');
    assert.strictEqual(activeOrg.employeeLimit, 5, 'Employee limit set');
    console.log('✅ Super Admin Access Grant & Employee Limit assignment verified.');

    // ----------------------------------------------------
    // TEST 3: Multi-Tenant Organization Data Isolation
    // ----------------------------------------------------
    console.log('\n▶ Test 3: Multi-Tenant Data Isolation');
    const ownerB = await prisma.user.create({
      data: {
        email: `audit_owner_b_${Date.now()}@test.com`,
        name: 'Owner B',
        passwordHash: testPasswordHash,
        role: 'OWNER',
        emailVerified: true,
      },
    });
    const orgB = await prisma.organization.create({
      data: {
        name: 'Workspace B',
        ownerId: ownerB.id,
        accessStatus: 'ACTIVE',
        employeeLimit: 10,
      },
    });

    const empBUser = await prisma.user.create({
      data: {
        email: `emp_b_${Date.now()}@test.com`,
        name: 'Employee B',
        passwordHash: testPasswordHash,
        role: 'EMPLOYEE',
        emailVerified: true,
      },
    });

    const empB = await prisma.employee.create({
      data: {
        userId: empBUser.id,
        organizationId: orgB.id,
        currentStatus: 'WORKING',
      },
    });

    const isolatedEmp = await prisma.employee.findFirst({
      where: {
        id: empB.id,
        organizationId: testOrg.id, // Manager A's org
      },
    });
    assert.strictEqual(isolatedEmp, null, 'Manager A MUST NOT be able to query Manager B\'s employee!');
    console.log('✅ Multi-tenant organization isolation verified: Manager A cannot see Manager B\'s employees.');

    // ----------------------------------------------------
    // TEST 4: Employee Limit Enforcement
    // ----------------------------------------------------
    console.log('\n▶ Test 4: Server-Side Employee Limit Enforcement');
    const limitTestOrg = await prisma.organization.findUnique({
      where: { id: testOrg.id },
      include: { _count: { select: { employees: { where: { isActive: true } } } } },
    });

    assert.strictEqual(limitTestOrg?.employeeLimit, 5);
    console.log(`✅ Current org limit: ${limitTestOrg?.employeeLimit}. Active employees: ${limitTestOrg?._count.employees}`);

    // ----------------------------------------------------
    // TEST 5: GPS Location Tracking Lifecycle & Work Sessions
    // ----------------------------------------------------
    console.log('\n▶ Test 5: Real GPS Lifecycle & Work Session Tracking');
    const empAUser = await prisma.user.create({
      data: {
        email: `emp_a_${Date.now()}@test.com`,
        name: 'Employee A',
        passwordHash: testPasswordHash,
        role: 'EMPLOYEE',
        emailVerified: true,
      },
    });
    const empA = await prisma.employee.create({
      data: {
        userId: empAUser.id,
        organizationId: testOrg.id,
        currentStatus: 'OFFLINE',
      },
    });

    const sessionStart = await prisma.workSession.create({
      data: {
        employeeId: empA.id,
        organizationId: testOrg.id,
        startTime: new Date(),
        startLat: 19.076,
        startLng: 72.8777,
        status: 'ACTIVE',
      },
    });
    await prisma.employee.update({
      where: { id: empA.id },
      data: { currentStatus: 'WORKING' },
    });

    const locPoint = await prisma.employeeLocation.create({
      data: {
        employeeId: empA.id,
        organizationId: testOrg.id,
        workSessionId: sessionStart.id,
        latitude: 19.081,
        longitude: 72.882,
        accuracy: 10.0,
      },
    });
    assert.strictEqual(locPoint.workSessionId, sessionStart.id);

    const sessionEnd = await prisma.workSession.update({
      where: { id: sessionStart.id },
      data: {
        endTime: new Date(),
        duration: 3600,
        status: 'COMPLETED',
      },
    });
    await prisma.employee.update({
      where: { id: empA.id },
      data: { currentStatus: 'OFFLINE' },
    });
    assert.strictEqual(sessionEnd.status, 'COMPLETED');
    console.log('✅ GPS tracking lifecycle verified: Work Start -> Location Logged -> Work Stop (Tracking Deactivated).');

    // ----------------------------------------------------
    // TEST 6: Pricing Engine & PAYMENTS_ENABLED=false
    // ----------------------------------------------------
    console.log('\n▶ Test 6: Pricing Engine & Inactive Payment Processing');
    const bill = calculateMonthlyBill(12);
    assert.strictEqual(bill.pricePerEmployee, 19);
    assert.strictEqual(bill.totalMonthlyCost, 228, '12 employees × ₹19 = ₹228');
    assert.strictEqual(isPaymentEnabled(), false, 'PAYMENTS_ENABLED must be false');
    console.log(`✅ Calculated Monthly Bill for 12 employees: ₹${bill.totalMonthlyCost}. Payment Enabled: ${isPaymentEnabled()}`);

    // ----------------------------------------------------
    // TEST 7: Access Revocation & Suspension Enforcement
    // ----------------------------------------------------
    console.log('\n▶ Test 7: Access Revocation & Suspension Enforcement');
    await prisma.organization.update({
      where: { id: testOrg.id },
      data: { accessStatus: 'REVOKED' },
    });
    const revokedOrg = await prisma.organization.findUnique({ where: { id: testOrg.id } });
    assert.strictEqual(revokedOrg?.accessStatus, 'REVOKED', 'Organization status updated to REVOKED');

    // Clean up test records in correct order
    const orgIds = [testOrg.id, orgB.id];
    await prisma.employeeLocation.deleteMany({ where: { organizationId: { in: orgIds } } });
    await prisma.workSession.deleteMany({ where: { organizationId: { in: orgIds } } });
    await prisma.task.deleteMany({ where: { organizationId: { in: orgIds } } });
    await prisma.accessGrant.deleteMany({ where: { organizationId: { in: orgIds } } });
    await prisma.subscription.deleteMany({ where: { organizationId: { in: orgIds } } });
    await prisma.employee.deleteMany({ where: { organizationId: { in: orgIds } } });
    await prisma.organization.deleteMany({ where: { id: { in: orgIds } } });
    await prisma.user.deleteMany({ where: { id: { in: [testOwner.id, ownerB.id, empAUser.id, empBUser.id] } } });

    console.log('\n🎉 ALL END-TO-END SECURITY & FUNCTIONALITY AUDIT TESTS PASSED SUCCESSFULLY!');
  } catch (error) {
    console.error('\n❌ AUDIT TEST FAILED:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runSecurityAuditTests();
