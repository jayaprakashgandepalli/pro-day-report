import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function fix() {
  const allSchools = await prisma.configValue.findMany({ where: { type: 'SCHOOL' } });
  
  let count = 0;
  for (const school of allSchools) {
    const updated = await prisma.student.updateMany({
      where: { schoolName: school.id },
      data: { schoolName: school.value }
    });
    count += updated.count;
  }
  console.log('Fixed', count, 'students');
}

fix().catch(console.error).finally(() => prisma.$disconnect());
