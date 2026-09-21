import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';

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

    // Parallel fetch for grouped counts
    const [mandalStats, villageStats, schoolStats] = await Promise.all([
      prisma.student.groupBy({
        by: ['mandal'],
        _count: { id: true },
        where: { ...whereClause, mandal: { not: null } }
      }),
      prisma.student.groupBy({
        by: ['village'],
        _count: { id: true },
        where: { ...whereClause, village: { not: null } }
      }),
      prisma.student.groupBy({
        by: ['schoolName'],
        _count: { id: true },
        where: { ...whereClause, schoolName: { not: null } }
      })
    ]);

    // Format output
    const mandals = mandalStats.filter(s => s.mandal && s.mandal.trim() !== '').map(s => ({ id: s.mandal, count: s._count.id }));
    const villages = villageStats.filter(s => s.village && s.village.trim() !== '').map(s => ({ id: s.village, count: s._count.id }));
    const schools = schoolStats.filter(s => s.schoolName && s.schoolName.trim() !== '').map(s => ({ id: s.schoolName, count: s._count.id }));

    return NextResponse.json({ mandals, villages, schools }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
