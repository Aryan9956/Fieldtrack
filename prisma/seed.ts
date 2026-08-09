import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  if (process.env.NODE_ENV === 'production' && process.env.SEED_DEMO_DATA !== 'true') {
    console.log('ℹ️ Production environment detected: Skipping demo owner/employees seeding.');
    console.log('ℹ️ To create initial Super Admin in production, run: npm run create-admin');
    return;
  }

  // 1. Super Admin (Optional seed if ADMIN_EMAIL set)
  const adminPasswordHash = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'admin123secure', 12);
  const superAdmin = await prisma.user.upsert({
    where: { email: 'admin@fieldtrack.com' },
    update: {},
    create: {
      email: 'admin@fieldtrack.com',
      name: 'FieldTrack Admin',
      passwordHash: adminPasswordHash,
      role: 'SUPER_ADMIN',
      emailVerified: true,
      emailVerifiedAt: new Date(),
    },
  });
  console.log('✅ Super Admin created:', superAdmin.email);

  // 2. Demo Owner & Organization
  const ownerPasswordHash = await bcrypt.hash('demo123', 12);
  const owner = await prisma.user.upsert({
    where: { email: 'demo@fieldtrack.com' },
    update: {},
    create: {
      email: 'demo@fieldtrack.com',
      name: 'Rajesh Sharma (Owner)',
      passwordHash: ownerPasswordHash,
      role: 'OWNER',
      emailVerified: true,
      emailVerifiedAt: new Date(),
    },
  });

  const org = await prisma.organization.upsert({
    where: { ownerId: owner.id },
    update: {},
    create: {
      name: 'Apex Field Services',
      ownerId: owner.id,
      accessStatus: 'ACTIVE',
      accessGrantedAt: new Date(),
      accessExpiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
      employeeLimit: 25,
    },
  });

  await prisma.subscription.upsert({
    where: { organizationId: org.id },
    update: {},
    create: {
      organizationId: org.id,
      plan: 'FIELDTRACK',
      pricePerEmployee: 19,
      status: 'MANUAL',
    },
  });

  console.log('✅ Demo Owner & Org created:', org.name);

  // 3. Demo Employees
  const empPasswordHash = await bcrypt.hash('emp123', 12);
  const demoEmployeesData = [
    { name: 'Rahul Verma', email: 'rahul@demo.com', phone: '+91 98765 43210', designation: 'Senior Field Technician', currentStatus: 'WORKING' },
    { name: 'Amit Kumar', email: 'amit@demo.com', phone: '+91 98765 43211', designation: 'Delivery Representative', currentStatus: 'ON_BREAK' },
    { name: 'Priya Singh', email: 'priya@demo.com', phone: '+91 98765 43212', designation: 'Client Inspector', currentStatus: 'WORKING' },
    { name: 'Ravi Patel', email: 'ravi@demo.com', phone: '+91 98765 43213', designation: 'Field Sales Officer', currentStatus: 'OFFLINE' },
    { name: 'Sneha Reddy', email: 'sneha@demo.com', phone: '+91 98765 43214', designation: 'Site Surveyor', currentStatus: 'OFFLINE' },
  ];

  const createdEmployees = [];

  for (const empData of demoEmployeesData) {
    const user = await prisma.user.upsert({
      where: { email: empData.email },
      update: {},
      create: {
        email: empData.email,
        name: empData.name,
        passwordHash: empPasswordHash,
        role: 'EMPLOYEE',
        emailVerified: true,
        emailVerifiedAt: new Date(),
      },
    });

    const emp = await prisma.employee.upsert({
      where: { userId: user.id },
      update: { currentStatus: empData.currentStatus },
      create: {
        userId: user.id,
        organizationId: org.id,
        phone: empData.phone,
        designation: empData.designation,
        currentStatus: empData.currentStatus,
        lastSeenAt: new Date(),
      },
    });

    createdEmployees.push({ emp, user });
  }

  console.log(`✅ Created ${createdEmployees.length} demo employees`);

  // 4. Create Work Sessions & Locations for Working Employees
  const mumbaiBase = { lat: 19.076, lng: 72.8777 };

  // Rahul (Working - 4h 30m ago)
  const rahulEmp = createdEmployees[0].emp;
  const rahulSession = await prisma.workSession.create({
    data: {
      employeeId: rahulEmp.id,
      organizationId: org.id,
      startTime: new Date(Date.now() - 4.5 * 3600 * 1000),
      startLat: mumbaiBase.lat,
      startLng: mumbaiBase.lng,
      status: 'ACTIVE',
    },
  });

  // Insert location points for Rahul
  const locationsRahul = [
    { latitude: 19.0760, longitude: 72.8777, timestamp: new Date(Date.now() - 4 * 3600 * 1000) },
    { latitude: 19.0810, longitude: 72.8820, timestamp: new Date(Date.now() - 3 * 3600 * 1000) },
    { latitude: 19.0850, longitude: 72.8900, timestamp: new Date(Date.now() - 2 * 3600 * 1000) },
    { latitude: 19.0920, longitude: 72.8950, timestamp: new Date(Date.now() - 10 * 60 * 1000) },
  ];

  for (const loc of locationsRahul) {
    await prisma.employeeLocation.create({
      data: {
        employeeId: rahulEmp.id,
        organizationId: org.id,
        workSessionId: rahulSession.id,
        latitude: loc.latitude,
        longitude: loc.longitude,
        accuracy: 12.5,
        timestamp: loc.timestamp,
      },
    });
  }

  // Priya (Working - 2h ago)
  const priyaEmp = createdEmployees[2].emp;
  const priyaSession = await prisma.workSession.create({
    data: {
      employeeId: priyaEmp.id,
      organizationId: org.id,
      startTime: new Date(Date.now() - 2 * 3600 * 1000),
      startLat: 19.1136,
      startLng: 72.8697,
      status: 'ACTIVE',
    },
  });

  await prisma.employeeLocation.create({
    data: {
      employeeId: priyaEmp.id,
      organizationId: org.id,
      workSessionId: priyaSession.id,
      latitude: 19.1136,
      longitude: 72.8697,
      accuracy: 8.0,
      timestamp: new Date(Date.now() - 5 * 60 * 1000),
    },
  });

  // 5. Tasks
  const tasksData = [
    {
      title: 'Inspect ABC Electronics Facility',
      description: 'Perform quarterly safety inspection at main warehouse.',
      employeeId: rahulEmp.id,
      priority: 'HIGH',
      status: 'IN_PROGRESS',
      location: 'Andheri East, Mumbai',
      dueDate: new Date(Date.now() + 8 * 3600 * 1000),
    },
    {
      title: 'Deliver Equipment Package #402',
      description: 'Hand over solar meters to project manager.',
      employeeId: createdEmployees[1].emp.id, // Amit
      priority: 'MEDIUM',
      status: 'ACCEPTED',
      location: 'BKC Complex, Mumbai',
      dueDate: new Date(Date.now() + 4 * 3600 * 1000),
    },
    {
      title: 'Site Survey - Greenfield Heights',
      description: 'Measure boundaries for phase 2 construction.',
      employeeId: priyaEmp.id,
      priority: 'URGENT',
      status: 'IN_PROGRESS',
      location: 'Powai Lake, Mumbai',
      dueDate: new Date(Date.now() + 2 * 3600 * 1000),
    },
    {
      title: 'Client Meeting - Nexus Corp',
      description: 'Discuss field maintenance SLA renewals.',
      employeeId: createdEmployees[3].emp.id, // Ravi
      priority: 'LOW',
      status: 'COMPLETED',
      location: 'Lower Parel, Mumbai',
      completedAt: new Date(Date.now() - 1 * 3600 * 1000),
    },
  ];

  for (const t of tasksData) {
    await prisma.task.create({
      data: {
        organizationId: org.id,
        ...t,
      },
    });
  }

  console.log('✅ Created sample tasks');

  // 6. Audit Logs
  await prisma.auditLog.createMany({
    data: [
      {
        performerId: superAdmin.id,
        targetId: owner.id,
        action: 'ACCESS_GRANTED',
        entityType: 'ORGANIZATION',
        entityId: org.id,
        metadata: JSON.stringify({ duration: '365 days', limit: 25, reason: 'Initial onboarding' }),
      },
      {
        performerId: owner.id,
        action: 'EMPLOYEE_CREATED',
        entityType: 'EMPLOYEE',
        metadata: JSON.stringify({ name: 'Rahul Verma', email: 'rahul@demo.com' }),
      },
    ],
  });

  console.log('✅ Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
