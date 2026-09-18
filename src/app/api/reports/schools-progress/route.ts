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

    const { searchParams } = new URL(req.url);
    const mandalId = searchParams.get('mandalId');
    const grade = searchParams.get('grade');

    if (!mandalId) {
      return NextResponse.json({ error: 'Mandal ID is required' }, { status: 400 });
    }

    // 1. Get the Mandal name
    const mandal = await prisma.configValue.findUnique({
      where: { id: mandalId }
    });

    if (!mandal) {
      return NextResponse.json({ error: 'Mandal not found' }, { status: 404 });
    }

    // 2. Get all Villages under this Mandal
    const villages = await prisma.configValue.findMany({
      where: { type: 'VILLAGE', parentId: mandalId }
    });
    const villageIds = villages.map(v => v.id);

    // 3. Get all Schools under these Villages
    const schoolsWhere: any = {
      type: 'SCHOOL',
      parentId: { in: villageIds }
    };
    
    if (grade) {
      schoolsWhere.grade = grade;
    }

    const schools = await prisma.configValue.findMany({
      where: schoolsWhere
    });

    // 4. For each school, count the students
    // Since we group by schoolName in the Student table, we can fetch group by
    const schoolNames = schools.map(s => s.value);
    
    const studentCounts = await prisma.student.groupBy({
      by: ['schoolName'],
      where: {
        schoolName: { in: schoolNames }
      },
      _count: {
        id: true
      }
    });

    // Map counts to school names
    const countsMap = studentCounts.reduce((acc, curr) => {
      if (curr.schoolName) {
        acc[curr.schoolName] = curr._count.id;
      }
      return acc;
    }, {} as Record<string, number>);

    // 5. Construct the final report data
    const reportData = schools.map(school => {
      const collected = countsMap[school.value] || 0;
      const target = school.strength || 0;
      return {
        mandal: mandal.value,
        village: villages.find(v => v.id === school.parentId)?.value || 'Unknown',
        schoolName: school.value,
        grade: school.grade || 'N/A',
        target,
        collected,
        remaining: Math.max(0, target - collected),
        percentage: target > 0 ? Math.min(100, Math.round((collected / target) * 100)) : 0
      };
    });

    // Sort by village then school name
    reportData.sort((a, b) => {
      if (a.village === b.village) return a.schoolName.localeCompare(b.schoolName);
      return a.village.localeCompare(b.village);
    });

    return NextResponse.json({ report: reportData }, { status: 200 });
  } catch (error) {
    console.error('Error generating report:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
