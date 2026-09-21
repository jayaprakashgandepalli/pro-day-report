import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const employee = await prisma.user.findUnique({ where: { employeeId: '9010737882' } });
  console.log('Employee:', employee ? 'Found: ' + employee.name : 'Not Found');

  const configs = await prisma.configValue.findMany({
    where: {
      type: { in: ['MANDAL', 'VILLAGE', 'SCHOOL', 'GROUP'] }
    }
  });

  console.log('Configs:', configs.map(c => ({ id: c.id, type: c.type, value: c.value })));
}

main().catch(console.error).finally(() => prisma.$disconnect());
