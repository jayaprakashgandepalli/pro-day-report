const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const employeeId = 'prasad'; // Found in earlier test
  
  let visitInclude = {
    orderBy: { visitDate: 'desc' },
    take: 1
  };

  const queryOptions = {
    where: { employeeId: employeeId },
    orderBy: { createdAt: 'desc' },
    skip: 0,
    take: 10,
    select: {
      id: true,
      studentName: true,
      phone: true,
      whatsapp: true,
      fatherName: true,
      group: true,
      schoolName: true,
      schoolArea: true,
      marks: true,
      village: true,
      studyInterestedAt: true,
      ableToBearFee: true,
      leadStatus: true,
      createdAt: true,
      visits: visitInclude,
    }
  };

  try {
    const students = await prisma.student.findMany(queryOptions);
    console.log("Students found:", students.length);
    if(students.length > 0) {
      console.log("First student:", students[0]);
    }
  } catch (err) {
    console.error("Query error:", err);
  }
}
main().catch(console.error).finally(() => prisma.$disconnect());
