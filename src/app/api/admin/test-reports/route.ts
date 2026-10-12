import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = verifyToken(token) as { role: string; employeeId: string } | null;
    if (!payload || payload.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || 'all'; // all, completed, pending
    const group = searchParams.get('group') || 'all';

    // Build query conditions
    const whereClause: any = {};

    if (search) {
      whereClause.OR = [
        { studentName: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { schoolName: { contains: search, mode: 'insensitive' } },
        { village: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status === 'completed') {
      whereClause.assessmentReport = { isNot: null };
    } else if (status === 'pending') {
      whereClause.assessmentReport = { is: null };
    }

    if (group !== 'all') {
      whereClause.assessmentReport = {
        recommendedGroup: { contains: group, mode: 'insensitive' }
      };
    }

    // Fetch students with their assessment report
    const students = await prisma.student.findMany({
      where: whereClause,
      select: {
        id: true,
        studentName: true,
        fatherName: true,
        phone: true,
        whatsapp: true,
        schoolName: true,
        village: true,
        mandal: true,
        group: true,
        createdAt: true,
        assessmentReport: {
          select: {
            id: true,
            recommendedGroup: true,
            recommendedJobs: true,
            disciplineScore: true,
            screenTimeScore: true,
            familyAttitudeScore: true,
            careerClarityScore: true,
            identifiedFlaws: true,
            advice: true,
            dailyActivities: true,
            createdAt: true,
            updatedAt: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Compute metrics
    const totalStudents = await prisma.student.count();
    const completedTests = await prisma.assessmentReport.count();
    const pendingTests = Math.max(0, totalStudents - completedTests);

    // Group breakdown
    const reports = await prisma.assessmentReport.findMany({
      select: { recommendedGroup: true }
    });

    const groupCounts: Record<string, number> = {};
    reports.forEach(r => {
      const g = r.recommendedGroup || 'Unknown';
      groupCounts[g] = (groupCounts[g] || 0) + 1;
    });

    return NextResponse.json({
      students,
      stats: {
        totalStudents,
        completedTests,
        pendingTests,
        groupCounts
      }
    });
  } catch (error) {
    console.error('Failed to fetch test reports:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
