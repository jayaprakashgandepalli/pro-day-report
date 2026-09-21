import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = verifyToken(token) as { employeeId: string; role: string } | null;
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Fetch all configs to resolve IDs to names
    const configs = await prisma.configValue.findMany({ select: { id: true, value: true, type: true } });
    const configMap: Record<string, string> = {};
    configs.forEach(c => { configMap[c.id] = c.value; });

    const resolveName = (id: string | null) => {
      if (!id) return 'Unknown';
      return configMap[id] || id;
    };

    // Group-wise counts (raw)
    const rawGroupStats = await prisma.student.groupBy({
      by: ['group'],
      _count: { id: true },
    });

    // Merge by resolved name
    const groupMerged: Record<string, number> = {};
    for (const g of rawGroupStats) {
      const name = resolveName(g.group);
      groupMerged[name] = (groupMerged[name] || 0) + g._count.id;
    }
    const groupStats = Object.entries(groupMerged)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    // Study Interest wise counts (raw)
    const rawInterestStats = await prisma.student.groupBy({
      by: ['studyInterestedAt'],
      _count: { id: true },
    });

    // Merge by resolved name
    const interestMerged: Record<string, number> = {};
    for (const g of rawInterestStats) {
      const name = resolveName(g.studyInterestedAt);
      interestMerged[name] = (interestMerged[name] || 0) + g._count.id;
    }
    const interestStats = Object.entries(interestMerged)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    // College-wise allocated counts
    const collegeStatsRaw = await prisma.student.groupBy({
      by: ['joinedCollegeId'],
      where: { joinedCollegeId: { not: null } },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } }
    });

    const collegeIds = collegeStatsRaw.map(c => c.joinedCollegeId).filter(Boolean) as string[];
    const colleges = await prisma.user.findMany({
      where: { employeeId: { in: collegeIds } },
      select: { employeeId: true, name: true }
    });
    const collegeMap: Record<string, string> = {};
    colleges.forEach(c => { collegeMap[c.employeeId] = c.name; });

    const collegeStats = collegeStatsRaw.map(c => ({
      collegeId: c.joinedCollegeId,
      collegeName: collegeMap[c.joinedCollegeId!] || 'Unknown',
      count: c._count.id
    }));

    return NextResponse.json({ groupStats, interestStats, collegeStats });
  } catch (error) {
    console.error('Stats error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
