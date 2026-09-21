import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const mandals = await prisma.configValue.findMany({ where: { type: 'MANDAL', value: { contains: 'Butchayyapeta', mode: 'insensitive' } } });
  const villages = await prisma.configValue.findMany({ where: { type: 'VILLAGE', value: { contains: 'Vaddadi', mode: 'insensitive' } } });
  const schools = await prisma.configValue.findMany({ where: { type: 'SCHOOL', value: { contains: 'Vaddadi', mode: 'insensitive' } } });
  const group = await prisma.configValue.findFirst({ where: { type: 'GROUP' } }); // Just to see what groups exist, or maybe there is "10th" in some config?
  const allGroups = await prisma.configValue.findMany({ where: { type: 'GROUP' } });

  console.log('Mandal (Butchayyapeta):', mandals.map(c => c.value));
  console.log('Village (Vaddadi):', villages.map(c => c.value));
  console.log('School (Vaddadi):', schools.map(c => c.value));
  console.log('Groups:', allGroups.map(c => c.value));
}
main().finally(() => prisma.$disconnect());
