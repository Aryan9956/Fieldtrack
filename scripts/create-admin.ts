import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createSuperAdmin() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME || 'FieldTrack Super Admin';

  if (!email || !password) {
    console.error('❌ Error: ADMIN_EMAIL and ADMIN_PASSWORD environment variables are required.');
    console.error('Example: ADMIN_EMAIL=admin@yourdomain.com ADMIN_PASSWORD=StrongPassword123! npm run create-admin');
    process.exit(1);
  }

  if (password.length < 8) {
    console.error('❌ Error: Password must be at least 8 characters long.');
    process.exit(1);
  }

  console.log(`🔐 Creating Super Admin account for: ${email}`);

  const lowerEmail = email.toLowerCase().trim();
  const passwordHash = await bcrypt.hash(password, 12);

  const admin = await prisma.user.upsert({
    where: { email: lowerEmail },
    update: {
      passwordHash,
      role: 'SUPER_ADMIN',
      emailVerified: true,
      emailVerifiedAt: new Date(),
    },
    create: {
      email: lowerEmail,
      name,
      passwordHash,
      role: 'SUPER_ADMIN',
      emailVerified: true,
      emailVerifiedAt: new Date(),
    },
  });

  console.log('✅ Super Admin account successfully created/updated!');
  console.log(`ID: ${admin.id}`);
  console.log(`Email: ${admin.email}`);
  console.log(`Role: ${admin.role}`);

  await prisma.$disconnect();
}

createSuperAdmin().catch((e) => {
  console.error('Failed to create super admin:', e);
  process.exit(1);
});
