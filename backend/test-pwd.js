const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const u = await prisma.user.findUnique({where:{email:'admin@globetrotter.internal'}});
  if(!u) {
    console.log('not found');
    return;
  }
  console.log('hash in db:', u.password_hash);
  const newHash = await bcrypt.hash('AdminSecretPass123!', 12);
  await prisma.user.update({
    where: { email: 'admin@globetrotter.internal' },
    data: { password_hash: newHash }
  });
  console.log('Updated hash to:', newHash);
}

check().finally(() => prisma.$disconnect());
