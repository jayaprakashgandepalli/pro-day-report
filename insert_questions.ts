const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Inserting sample questions...');

  // Question 1
  const q1 = await prisma.question.create({
    data: {
      category: 'APTITUDE',
      text: 'What do you enjoy doing the most in your free time?',
      options: {
        create: [
          { text: 'Solving logic puzzles or learning about space/nature', score: 1, traitPoints: 'SCIENCE' },
          { text: 'Thinking about business ideas and saving money', score: 1, traitPoints: 'COMMERCE' },
          { text: 'Drawing, reading storybooks, or listening to music', score: 1, traitPoints: 'ARTS' },
          { text: 'Playing with computers, coding, or fixing gadgets', score: 1, traitPoints: 'TECH' },
        ]
      }
    }
  });

  // Question 2
  const q2 = await prisma.question.create({
    data: {
      category: 'APTITUDE',
      text: 'If you are given a school project, what role do you take?',
      options: {
        create: [
          { text: 'Researching and gathering all the scientific information', score: 1, traitPoints: 'SCIENCE' },
          { text: 'Calculating the budget and managing the expenses', score: 1, traitPoints: 'COMMERCE' },
          { text: 'Designing and decorating the final project beautifully', score: 1, traitPoints: 'ARTS' },
          { text: 'Creating the PowerPoint presentation and technical setup', score: 1, traitPoints: 'TECH' },
        ]
      }
    }
  });

  // Question 3
  const q3 = await prisma.question.create({
    data: {
      category: 'APTITUDE',
      text: 'Which of these subjects do you find most interesting to read?',
      options: {
        create: [
          { text: 'Biology, Physics, or Chemistry', score: 1, traitPoints: 'SCIENCE' },
          { text: 'Economics, Accounts, or Social Studies', score: 1, traitPoints: 'COMMERCE' },
          { text: 'Languages, History, or Literature', score: 1, traitPoints: 'ARTS' },
          { text: 'Computer Science or Mathematics', score: 1, traitPoints: 'TECH' },
        ]
      }
    }
  });

  // Question 4
  const q4 = await prisma.question.create({
    data: {
      category: 'APTITUDE',
      text: 'What kind of videos do you mostly watch on YouTube/TV?',
      options: {
        create: [
          { text: 'National Geographic, animals, or science experiments', score: 1, traitPoints: 'SCIENCE' },
          { text: 'Share market tips, business success stories, or news', score: 1, traitPoints: 'COMMERCE' },
          { text: 'Movies, short films, music videos, or painting tutorials', score: 1, traitPoints: 'ARTS' },
          { text: 'Mobile reviews, robots, or technology updates', score: 1, traitPoints: 'TECH' },
        ]
      }
    }
  });

  // Question 5
  const q5 = await prisma.question.create({
    data: {
      category: 'BEHAVIORAL',
      text: 'When you face a difficult problem, how do you solve it?',
      options: {
        create: [
          { text: 'I try to find the logical reason and root cause behind it', score: 1, traitPoints: 'SCIENCE' },
          { text: 'I think about which solution is most profitable or efficient', score: 1, traitPoints: 'COMMERCE' },
          { text: 'I think creatively out of the box to find a unique solution', score: 1, traitPoints: 'ARTS' },
          { text: 'I search on the internet or use tools to fix it', score: 1, traitPoints: 'TECH' },
        ]
      }
    }
  });

  console.log('Successfully inserted 5 questions with options!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
