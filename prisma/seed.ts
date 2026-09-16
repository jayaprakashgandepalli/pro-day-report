import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const adminPassword = await bcrypt.hash('admin123', 10);
  const employeePassword = await bcrypt.hash('emp123', 10);

  const admin = await prisma.user.upsert({
    where: { employeeId: 'admin' },
    update: {},
    create: {
      employeeId: 'admin',
      name: 'System Admin',
      password: adminPassword,
      role: 'ADMIN',
    },
  });

  const emp1 = await prisma.user.upsert({
    where: { employeeId: 'EMP001' },
    update: {},
    create: {
      employeeId: 'EMP001',
      name: 'Ravi Kumar',
      password: employeePassword,
      role: 'EMPLOYEE',
    },
  });

  console.log('Seeded database:', { admin, emp1 });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
