import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const payload = verifyToken(token) as { role: string } | null;
    
    if (!payload) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 1. Get all Mandals
    const mandals = await prisma.configValue.findMany({
      where: { type: 'MANDAL' }
    });

    if (!mandals || mandals.length === 0) {
      return NextResponse.json({ summaries: [] }, { status: 200 });
    }

    // Prepare array for results
    const summaries = [];

    // Optimize: fetch all villages and schools, then map. Or just do it in a loop for now (easier).
    // Actually, getting all villages, all schools, all student counts is better for performance.
    
    // 2. Get all Villages
    const allVillages = await prisma.configValue.findMany({
      where: { type: 'VILLAGE' }
    });
    
    // 3. Get all Schools
    const allSchools = await prisma.configValue.findMany({
      where: { type: 'SCHOOL' }
    });

    // 4. Get student counts grouped by schoolName
    const studentCounts = await prisma.student.groupBy({
      by: ['schoolName'],
      _count: {
        id: true
      }
    });

    const countsMap = studentCounts.reduce((acc, curr) => {
      if (curr.schoolName) {
        acc[curr.schoolName] = curr._count.id;
      }
      return acc;
    }, {} as Record<string, number>);

    // Process each Mandal
    for (const mandal of mandals) {
      const villageIds = allVillages.filter(v => v.parentId === mandal.id).map(v => v.id);
      const schoolsInMandal = allSchools.filter(s => s.parentId && villageIds.includes(s.parentId));

      let totalSchools = schoolsInMandal.length;
      let gradeCounts: Record<string, number> = {};
      let totalTarget = 0;
      let totalCollected = 0;

      for (const school of schoolsInMandal) {
        const g = school.grade || 'N/A';
        if (!gradeCounts[g]) gradeCounts[g] = 0;
        gradeCounts[g]++;

        const target = school.strength || 0;
        const collected = countsMap[school.value] || 0;
        
        totalTarget += target;
        totalCollected += collected;
      }

      let percentage = 0;
      if (totalTarget > 0) {
        percentage = Math.min(100, Math.round((totalCollected / totalTarget) * 100));
      } else if (totalCollected > 0) {
         percentage = 100;
      }

      summaries.push({
        mandalId: mandal.id,
        mandalName: mandal.value,
        totalSchools,
        gradeCounts,
        totalTarget,
        totalCollected,
        percentage
      });
    }

    // Sort by name
    summaries.sort((a, b) => a.mandalName.localeCompare(b.mandalName));

    return NextResponse.json({ summaries }, { status: 200 });
  } catch (error) {
    console.error('Error generating mandal summaries:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
