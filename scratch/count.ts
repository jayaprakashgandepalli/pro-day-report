import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
prisma.student.count().then(c => console.log('TOTAL_STUDENTS: ' + c)).finally(() => prisma.$disconnect());
