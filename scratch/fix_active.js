const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  const result = await p.user.updateMany({ data: { isActive: true } });
  console.log('Updated users:', result.count);
  await p.$disconnect();
}

main().catch(console.error);
