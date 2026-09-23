const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const employeeId = 'EMP01'; // Try generic
  
  const total = await prisma.student.count();
  console.log("Total students in DB:", total);
  
  if (total > 0) {
    const student = await prisma.student.findFirst();
    console.log("Sample student:", student);
    
    // Test minimal query
    try {
      const minimalStudents = await prisma.student.findMany({
        take: 1,
        select: {
          id: true,
          studentName: true,
          phone: true,
          visits: {
            orderBy: { visitDate: 'desc' },
            take: 1
          }
        }
      });
      console.log("Minimal query result:", minimalStudents);
    } catch (err) {
      console.error("Minimal query error:", err);
    }
  }
}
main().catch(console.error).finally(() => prisma.$disconnect());
