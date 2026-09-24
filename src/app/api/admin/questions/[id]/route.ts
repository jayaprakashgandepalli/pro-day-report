import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const data = await req.json();

    // Prisma doesn't have a simple "replace all relations" for one-to-many. 
    // Best way is to delete existing options and create new ones.
    await prisma.option.deleteMany({
      where: { questionId: params.id }
    });

    const question = await prisma.question.update({
      where: { id: params.id },
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
    return NextResponse.json({ error: 'Failed to update question' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Due to Cascade delete on schema, deleting question deletes options and student responses
    await prisma.question.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete question' }, { status: 500 });
  }
}
