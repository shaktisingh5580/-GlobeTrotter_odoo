import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // 1. Create Default Admin User
  const adminPasswordHash = await bcrypt.hash('AdminP@ss123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@globetrotter.internal' },
    update: {},
    create: {
      email: 'admin@globetrotter.internal',
      password_hash: adminPasswordHash,
      first_name: 'System',
      last_name: 'Administrator',
      bio: 'GlobeTrotter System Administrator',
      city: 'San Francisco',
      country: 'United States',
      role: Role.ADMIN,
      email_verified: true,
      email_verified_at: new Date(),
    },
  });
  console.log(`✅ Admin user seeded: ${admin.email}`);

  // 2. Create Demo User
  const demoPasswordHash = await bcrypt.hash('DemoP@ss123', 12);
  const demoUser = await prisma.user.upsert({
    where: { email: 'shakti@example.com' },
    update: {},
    create: {
      email: 'shakti@example.com',
      password_hash: demoPasswordHash,
      first_name: 'Shakti',
      last_name: 'Kumar',
      bio: 'Travel enthusiast & globetrotter',
      city: 'Mumbai',
      country: 'India',
      role: Role.USER,
      email_verified: true,
      email_verified_at: new Date(),
    },
  });
  console.log(`✅ Demo user seeded: ${demoUser.email}`);

  console.log('🎉 Seeding completed successfully.');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
