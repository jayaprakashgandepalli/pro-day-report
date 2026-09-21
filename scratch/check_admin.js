const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  const admin = await p.user.findUnique({ where: { employeeId: 'admin' } });
  console.log(admin);
  await p.$disconnect();
}

main().catch(console.error);
