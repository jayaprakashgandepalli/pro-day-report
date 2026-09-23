import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const colleges = await prisma.user.findMany({
      where: { role: 'COLLEGE', isActive: true },
      select: { id: true, employeeId: true, name: true }
    });
    return NextResponse.json({ colleges }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
