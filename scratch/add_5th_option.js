const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Adding 5th option to all questions...');
    
    const questions = await prisma.question.findMany();
    
    for (const q of questions) {
      await prisma.option.create({
        data: {
          questionId: q.id,
          text: 'ఇందులో ఏదీ కాదు (None of the above)',
          traitPoints: q.module === '1' ? 'NONE' : '0'
        }
      });
    }

    console.log('Successfully added 5th option to all 75 questions!');
  } catch (error) {
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
