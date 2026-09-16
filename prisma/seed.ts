import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const adminPassword = await bcrypt.hash('Psd@1986', 10);
  const employeePassword = await bcrypt.hash('Psd@1986', 10);
  const telecallerPassword = await bcrypt.hash('Psd@1986', 10);

  const admin = await prisma.user.upsert({
    where: { employeeId: 'admin' },
    update: { password: adminPassword },
    create: {
      employeeId: 'admin',
      name: 'System Admin',
      password: adminPassword,
      role: 'ADMIN',
    },
  });

  const emp1 = await prisma.user.upsert({
    where: { employeeId: 'prasad' },
    update: { password: employeePassword },
    create: {
      employeeId: 'prasad',
      name: 'Ravi Kumar',
      password: employeePassword,
      role: 'EMPLOYEE',
    },
  });

  const telecaller1 = await prisma.user.upsert({
    where: { employeeId: 'telecaller' },
    update: { password: telecallerPassword },
    create: {
      employeeId: 'telecaller',
      name: 'Telecaller',
      password: telecallerPassword,
      role: 'TELECALLER',
    },
  });

  console.log('Seeded database:', { admin, emp1, telecaller1 });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
