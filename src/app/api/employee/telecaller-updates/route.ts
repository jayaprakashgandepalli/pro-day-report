import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { getConfigMapCached } from '@/lib/cache';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const payload = verifyToken(token) as { employeeId: string; role: string } | null;

    if (!payload || payload.role !== 'EMPLOYEE') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.max(1, parseInt(searchParams.get('limit') || '10', 10));

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Parallelize user, configMap, and the 3 entity queries
    const [user, configMap, students, keyPersons, schools] = await Promise.all([
      prisma.user.findUnique({
        where: { employeeId: payload.employeeId },
        select: { lastViewedTelecallerUpdatesAt: true }
      }),
      getConfigMapCached(),
      prisma.student.findMany({
        where: {
          employeeId: payload.employeeId,
          telecallerUpdateAt: { not: null }
        },
        select: {
          id: true,
          studentName: true,
          fatherName: true,
          phone: true,
          whatsapp: true,
          schoolName: true,
          group: true,
          leadStatus: true,
          district: true,
          mandal: true,
          village: true,
          address: true,
          studyInterestedAt: true,
          ableToBearFee: true,
          nextFollowUpDate: true,
          nextFollowUpType: true,
          remarks: true,
          telecallerUpdateAt: true,
          telecallerUpdateDetails: true,
          visits: {
            orderBy: { visitDate: 'desc' },
            take: 10,
            select: {
              id: true,
              remarks: true,
              visitDate: true,
              addedBy: { select: { name: true, role: true } }
            }
          }
        }
      }),
      prisma.keyPerson.findMany({
        where: {
          employeeId: payload.employeeId,
          telecallerUpdateAt: { not: null }
        },
        select: {
          id: true,
          name: true,
          phone: true,
          designation: true,
          district: true,
          mandal: true,
          village: true,
          address: true,
          remarks: true,
          telecallerUpdateAt: true,
          telecallerUpdateDetails: true,
        }
      }),
      prisma.configValue.findMany({
        where: {
          type: 'SCHOOL',
          telecallerUpdateAt: { gte: sevenDaysAgo }
        },
        select: {
          id: true,
          value: true,
          grade: true,
          strength: true,
          headmasterName: true,
          headmasterPhone: true,
          keyPersonName: true,
          keyPersonPhone: true,
          remarks: true,
          telecallerUpdateAt: true,
          telecallerUpdateDetails: true,
          parent: {
            select: {
              value: true,
              parent: {
                select: { value: true }
              }
            }
          }
        }
      })
    ]);

    const lastViewed = user?.lastViewedTelecallerUpdatesAt || new Date(0);
    const resolveName = (id: string | null) => id ? (configMap[id] || id) : '';

    // Helper to extract latest remark text
    const getLatestRemark = (remarks: any, fallback: string | null) => {
      if (Array.isArray(remarks) && remarks.length > 0) {
        const last = remarks[remarks.length - 1];
        if (last && typeof last === 'object' && last.text) {
          return last.text;
        }
      }
      if (fallback && fallback !== 'Added or modified remarks') {
        return fallback;
      }
      return 'Updated remarks';
    };

    // Format all updates into a single timeline
    const allUpdates = [
      ...students.map(s => {
        const studentRemarks: any[] = [];
        if (s.visits && s.visits.length > 0) {
          s.visits.forEach(v => {
            if (v.remarks) {
              studentRemarks.push({
                text: v.remarks,
                date: v.visitDate ? new Date(v.visitDate).toISOString() : new Date().toISOString(),
                addedBy: v.addedBy?.name || 'Telecaller'
              });
            }
          });
        }
        if (s.remarks && !studentRemarks.some(r => r.text === s.remarks)) {
          studentRemarks.push({
            text: s.remarks,
            date: s.telecallerUpdateAt ? new Date(s.telecallerUpdateAt).toISOString() : new Date().toISOString(),
            addedBy: 'Telecaller / Record'
          });
        }

        const previewRemark = s.telecallerUpdateDetails && s.telecallerUpdateDetails !== 'Added a visit record'
          ? s.telecallerUpdateDetails
          : (studentRemarks[0]?.text || s.remarks || 'Updated student profile');

        return {
          id: s.id,
          type: 'STUDENT' as const,
          name: s.studentName,
          phone: s.phone,
          whatsapp: s.whatsapp,
          fatherName: s.fatherName,
          schoolName: resolveName(s.schoolName),
          group: resolveName(s.group),
          district: resolveName(s.district),
          mandal: resolveName(s.mandal),
          village: resolveName(s.village),
          address: s.address,
          leadStatus: s.leadStatus,
          studyInterestedAt: resolveName(s.studyInterestedAt),
          ableToBearFee: resolveName(s.ableToBearFee),
          nextFollowUpDate: s.nextFollowUpDate,
          nextFollowUpType: s.nextFollowUpType,
          updateAt: s.telecallerUpdateAt,
          details: previewRemark,
          allRemarks: studentRemarks,
          isNew: new Date(s.telecallerUpdateAt!) > lastViewed
        };
      }),

      ...keyPersons.map(k => {
        const kpRemarks = Array.isArray(k.remarks) ? (k.remarks as any[]) : [];
        const previewRemark = getLatestRemark(kpRemarks, k.telecallerUpdateDetails);

        return {
          id: k.id,
          type: 'IMP_PERSON' as const,
          name: k.name,
          phone: k.phone,
          designation: k.designation,
          district: resolveName(k.district),
          mandal: resolveName(k.mandal),
          village: resolveName(k.village),
          address: k.address,
          updateAt: k.telecallerUpdateAt,
          details: previewRemark,
          allRemarks: kpRemarks,
          isNew: new Date(k.telecallerUpdateAt!) > lastViewed
        };
      }),

      ...schools.map(sc => {
        const scRemarks = Array.isArray(sc.remarks) ? (sc.remarks as any[]) : [];
        const previewRemark = getLatestRemark(scRemarks, sc.telecallerUpdateDetails);

        return {
          id: sc.id,
          type: 'SCHOOL' as const,
          name: sc.value,
          phone: sc.headmasterPhone || sc.keyPersonPhone || '',
          headmasterName: sc.headmasterName,
          headmasterPhone: sc.headmasterPhone,
          keyPersonName: sc.keyPersonName,
          keyPersonPhone: sc.keyPersonPhone,
          grade: sc.grade,
          strength: sc.strength,
          mandal: sc.parent?.value || '',
          district: sc.parent?.parent?.value || '',
          updateAt: sc.telecallerUpdateAt,
          details: previewRemark,
          allRemarks: scRemarks,
          isNew: new Date(sc.telecallerUpdateAt!) > lastViewed
        };
      })
    ];

    // Sort descending by updateAt
    allUpdates.sort((a, b) => new Date(b.updateAt!).getTime() - new Date(a.updateAt!).getTime());

    const total = allUpdates.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const startIndex = (page - 1) * limit;
    const paginatedUpdates = allUpdates.slice(startIndex, startIndex + limit);
    const unreadCount = allUpdates.filter(u => u.isNew).length;

    return NextResponse.json({
      updates: paginatedUpdates,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasMore: page < totalPages
      },
      unreadCount,
      lastViewed
    }, { 
      status: 200,
      headers: {
        'Cache-Control': 'no-store'
      }
    });
  } catch (error) {
    console.error('Error fetching telecaller updates:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const payload = verifyToken(token) as { employeeId: string; role: string } | null;

    if (!payload || payload.role !== 'EMPLOYEE') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await prisma.user.update({
      where: { employeeId: payload.employeeId },
      data: { lastViewedTelecallerUpdatesAt: new Date() }
    });

    return NextResponse.json({ message: 'Marked as viewed' }, { status: 200 });
  } catch (error) {
    console.error('Error updating last viewed:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
