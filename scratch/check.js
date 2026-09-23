const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const admitted = await prisma.student.findMany({
    where: { leadStatus: 'Admitted' },
    select: { id: true, studentName: true, employeeId: true }
  });
  console.log('Admitted students:', admitted);
}
main().finally(() => prisma.$disconnect());
