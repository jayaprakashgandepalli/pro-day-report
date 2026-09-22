import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

export async function GET() {
  try {
    const session = await getSession();

    if (!session || session.role !== 'TELECALLER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Calculate start and end of today
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    // Count distinct visits (calls) made by this telecaller today
    const callsMadeToday = await prisma.visit.count({
      where: {
        addedById: session.employeeId,
        createdAt: {
          gte: startOfToday,
          lte: endOfToday
        }
      }
    });

    return NextResponse.json({ callsMadeToday });
  } catch (error) {
    console.error('Error fetching telecaller stats:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
