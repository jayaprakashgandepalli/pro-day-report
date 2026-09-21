import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const stats = await prisma.student.groupBy({ by: ['employeeId'], _count: { id: true } });
  let total = 0;
  for (let s of stats) {
    const emp = await prisma.user.findUnique({where:{id: s.employeeId}});
    if (emp) {
      console.log(emp.name + ' (' + emp.employeeId + '): ' + s._count.id);
    } else {
      console.log('Employee ' + s.employeeId + ': ' + s._count.id);
    }
    total += s._count.id;
  }
  console.log('Total students in DB:', total);
}
main().finally(() => prisma.$disconnect());
