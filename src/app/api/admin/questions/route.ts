import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const questions = await prisma.question.findMany({
      orderBy: { order: 'asc' },
      include: { options: true }
    });

    return NextResponse.json({ questions });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch questions' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const data = await req.json();

    const question = await prisma.question.create({
      data: {
        text: data.text,
        order: data.order,
        isActive: data.isActive,
        options: {
          create: data.options.map((opt: any) => ({
            text: opt.text,
            traitPoints: opt.traitPoints
          }))
        }
      }
    });

    return NextResponse.json({ question });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create question' }, { status: 500 });
  }
}
