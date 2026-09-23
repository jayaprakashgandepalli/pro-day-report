const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  try {
    const targetConfigs = await prisma.configValue.findMany({
      where: {
        OR: [
          { type: 'STUDY_INTEREST', value: { contains: 'vizag', mode: 'insensitive' } },
          { type: 'STUDY_INTEREST', value: { contains: 'visakha', mode: 'insensitive' } },
          { type: 'FEE_BEARABLE', value: { contains: 'yes', mode: 'insensitive' } },
          { type: 'FEE_BEARABLE', value: { contains: 'bearable', mode: 'insensitive' } },
          { type: 'GROUP', value: { contains: 'MPC', mode: 'insensitive' } },
          { type: 'GROUP', value: { contains: 'BIPC', mode: 'insensitive' } }
        ]
      }
    });
    
    const interestIds = targetConfigs.filter(c => c.type === 'STUDY_INTEREST').map(c => c.id);
    const feeIds = targetConfigs.filter(c => c.type === 'FEE_BEARABLE').map(c => c.id);
    const groupIds = targetConfigs.filter(c => c.type === 'GROUP').map(c => c.id);

    let whereClause = { AND: [] };

    whereClause.AND.push({
      OR: [
        { studyInterestedAt: { in: interestIds } },
        { studyInterestedAt: { contains: 'vizag', mode: 'insensitive' } },
        { studyInterestedAt: { contains: 'visakha', mode: 'insensitive' } }
      ]
    });

    whereClause.AND.push({
      OR: [
        { ableToBearFee: { in: feeIds } },
        { ableToBearFee: { contains: 'yes', mode: 'insensitive' } },
        { ableToBearFee: { contains: 'bearable', mode: 'insensitive' } }
      ]
    });

    whereClause.AND.push({
      OR: [
        { group: { in: groupIds } },
        { group: { contains: 'mpc', mode: 'insensitive' } },
        { group: { contains: 'bipc', mode: 'insensitive' } }
      ]
    });

    console.log("WHERE CLAUSE:", JSON.stringify(whereClause, null, 2));

    const total = await prisma.student.count({ where: whereClause });
    console.log("TOTAL FILTERED:", total);
  } catch (err) {
    console.error("PRISMA ERROR:", err);
  } finally {
    await prisma.$disconnect();
  }
}

test();
