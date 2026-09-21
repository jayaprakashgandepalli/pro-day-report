import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = verifyToken(token) as { employeeId: string; role: string } | null;

    if (!payload || !payload.employeeId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let whereClause: any = { AND: [] };

    if (payload.role === 'EMPLOYEE') {
      whereClause.AND.push({ employeeId: payload.employeeId });
    } else if (payload.role === 'COLLEGE') {
      const user = await prisma.user.findUnique({
        where: { employeeId: payload.employeeId },
        select: { allowedGroups: true, allowedLocations: true }
      });
      if (user) {
        if (user.allowedGroups.length > 0) {
          whereClause.AND.push({ group: { in: user.allowedGroups } });
        }
        if (user.allowedLocations.length > 0) {
          whereClause.AND.push({ studyInterestedAt: { in: user.allowedLocations } });
        }
        if (user.allowedGroups.length === 0 && user.allowedLocations.length === 0) {
          whereClause.AND.push({ id: 'none' });
        }
      }

      // Hide students admitted to other colleges
      whereClause.AND.push({
        OR: [
          { joinedCollegeId: null },
          { joinedCollegeId: payload.employeeId }
        ]
      });
    }

    if (whereClause.AND.length === 0) {
      delete whereClause.AND;
    }

    const students = await prisma.student.findMany({
      where: whereClause,
      select: { mandal: true, village: true }
    });

    const mandals = Array.from(new Set(students.map(s => s.mandal).filter(Boolean))) as string[];
    const villages = Array.from(new Set(students.map(s => s.village).filter(Boolean))) as string[];

    return NextResponse.json({ mandals: mandals.sort(), villages: villages.sort() }, { status: 200 });
  } catch (error) {
    console.error('Locations error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
