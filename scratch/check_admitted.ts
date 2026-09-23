import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const admitted = await prisma.student.findMany({
    where: { leadStatus: 'Admitted' },
    select: { studentName: true, employeeId: true }
  });
  console.log('Admitted students:', admitted);
}
main().finally(() => prisma.$disconnect());
