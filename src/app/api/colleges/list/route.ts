import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Return College Branches added by user/employees rather than Admin role COLLEGE users
    const branches = await prisma.collegeBranch.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      select: { id: true, name: true, code: true, location: true, phone: true }
    });

    return NextResponse.json({
      success: true,
      colleges: branches,
      branches,
    }, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching colleges/branches list:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
