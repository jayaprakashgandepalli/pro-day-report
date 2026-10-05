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
    const districtId = searchParams.get('districtId');
    const grade = searchParams.get('grade');

    if (!mandalId && !districtId) {
      return NextResponse.json({ error: 'Mandal ID or District ID is required' }, { status: 400 });
    }

    let mandals: any[] = [];
    let villages: any[] = [];
    let reportTitleLocation = '';

    if (mandalId) {
      // 1. Get the Mandal name
      const mandal = await prisma.configValue.findUnique({
        where: { id: mandalId }
      });

      if (!mandal) {
        return NextResponse.json({ error: 'Mandal not found' }, { status: 404 });
      }

      mandals = [mandal];
      reportTitleLocation = `${mandal.value} Mandal`;

      // 2. Get all Villages under this Mandal
      villages = await prisma.configValue.findMany({
        where: { type: 'VILLAGE', parentId: mandalId }
      });
    } else if (districtId) {
      // 1. Get District
      const district = await prisma.configValue.findUnique({
        where: { id: districtId }
      });

      if (!district) {
        return NextResponse.json({ error: 'District not found' }, { status: 404 });
      }

      reportTitleLocation = `${district.value} District`;

      // 2. Get all Mandals under District
      mandals = await prisma.configValue.findMany({
        where: { type: 'MANDAL', parentId: districtId }
      });
      const mandalIds = mandals.map(m => m.id);

      // 3. Get all Villages under these Mandals
      villages = await prisma.configValue.findMany({
        where: { type: 'VILLAGE', parentId: { in: mandalIds } }
      });
    }

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
    const schoolNames = schools.map(s => s.value);
    
    const studentWhereClause: any = {
      schoolName: { in: schoolNames }
    };
    
    // Only count students added by this user if they are normal EMPLOYEE (Admin and Telecaller see all)
    if (payload.role !== 'ADMIN' && payload.role !== 'TELECALLER') {
      studentWhereClause.employeeId = (payload as any).employeeId;
    }

    const studentCounts = await prisma.student.groupBy({
      by: ['schoolName'],
      where: studentWhereClause,
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
      const v = villages.find(v => v.id === school.parentId);
      const m = v ? mandals.find(m => m.id === v.parentId) : mandals[0];

      return {
        mandal: m?.value || 'Unknown',
        village: v?.value || 'Unknown',
        schoolName: school.value,
        grade: school.grade || 'N/A',
        target,
        collected,
        remaining: Math.max(0, target - collected),
        percentage: target > 0 ? Math.min(100, Math.round((collected / target) * 100)) : 0,
        headmasterName: school.headmasterName || 'N/A',
        headmasterPhone: school.headmasterPhone || 'N/A',
        keyPersonName: school.keyPersonName || '-',
        keyPersonPhone: school.keyPersonPhone || '-'
      };
    });

    // Sort by village then school name
    reportData.sort((a, b) => {
      if (a.mandal !== b.mandal) return a.mandal.localeCompare(b.mandal);
      if (a.village !== b.village) return a.village.localeCompare(b.village);
      return a.schoolName.localeCompare(b.schoolName);
    });

    return NextResponse.json({ report: reportData, titleLocation: reportTitleLocation }, { status: 200 });
  } catch (error) {
    console.error('Error generating report:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
