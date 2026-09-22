import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = verifyToken(token) as { employeeId: string } | null;

    if (!payload || !payload.employeeId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await req.json();

    if (!data.studentName || !data.phone || !data.group) {
      return NextResponse.json({ error: 'Student Name, Phone, and Group are required.' }, { status: 400 });
    }

    // Check for existing phone number
    const existingStudent = await prisma.student.findFirst({
      where: { phone: data.phone }
    });

    if (existingStudent) {
      return NextResponse.json({ error: 'Student with this phone number already exists.' }, { status: 400 });
    }

    const newStudent = await prisma.student.create({
      data: {
        employeeId: payload.employeeId,
        studentName: data.studentName,
        fatherName: data.fatherName || null,
        occupation: data.occupation || null,
        address: data.address || null,
        phone: data.phone,
        whatsapp: data.whatsapp || null,
        gender: data.gender || null,
        group: data.group,
        visitNumber: data.visitNumber || null,
        schoolName: data.schoolName || null,
        schoolArea: data.schoolArea || null,
        remarks: data.remarks || null,
        district: data.district || null,
        mandal: data.mandal || null,
        village: data.village || null,
        studyInterestedAt: data.studyInterestedAt || null,
        educationStage: data.educationStage || null,
        ableToBearFee: data.ableToBearFee || null,
        doorstepCompleted: data.doorstepCompleted ? true : false,
      },
    });

    return NextResponse.json({ message: 'Student added successfully', student: newStudent }, { status: 201 });
  } catch (error) {
    console.error('Add student error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = verifyToken(token) as { employeeId: string; role: string } | null;

    if (!payload || !payload.employeeId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date');
    const search = searchParams.get('search');
    const preset = searchParams.get('preset');
    const interest = searchParams.get('interest');
    const fee = searchParams.get('fee');
    const location = searchParams.get('location');
    const mandal = searchParams.get('mandal');
    const village = searchParams.get('village');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    let whereClause: any = { AND: [] };

    if (payload.role === 'EMPLOYEE') {
      whereClause.AND.push({ employeeId: payload.employeeId });
    } else if (payload.role === 'TELECALLER') {
      const user = await prisma.user.findUnique({
        where: { employeeId: payload.employeeId },
        select: { assignedEmployees: true }
      });
      if (user && user.assignedEmployees && user.assignedEmployees.length > 0) {
        whereClause.AND.push({ employeeId: { in: user.assignedEmployees } });
      } else {
        whereClause.AND.push({ id: 'none' }); // No access if no employees assigned
      }
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
        // If they have no permissions, they see nothing
        if (user.allowedGroups.length === 0 && user.allowedLocations.length === 0) {
           whereClause.AND.push({ id: 'none' }); // impossible condition
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
    
    const callStatus = searchParams.get('callStatus');
    if (callStatus === 'not_called') {
      whereClause.AND.push({
        OR: [
          { remarks: null },
          { remarks: '' }
        ]
      });
    }

    const addedDate = searchParams.get('addedDate');
    if (addedDate) {
      const startOfDay = new Date(addedDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(addedDate);
      endOfDay.setHours(23, 59, 59, 999);
      whereClause.AND.push({
        createdAt: { gte: startOfDay, lte: endOfDay }
      });
    }

    const admissionStatus = searchParams.get('admissionStatus');
    if (admissionStatus === 'admitted') {
      whereClause.AND.push({ leadStatus: 'Admitted' });
    } else if (admissionStatus === 'pending') {
      whereClause.AND.push({
        OR: [
          { leadStatus: { not: 'Admitted' } },
          { leadStatus: null }
        ]
      });
    }

    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (startDate && endDate) {
      const startOfDay = new Date(startDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(endDate);
      endOfDay.setHours(23, 59, 59, 999);
      whereClause.AND.push({
        OR: [
          { createdAt: { gte: startOfDay, lte: endOfDay } },
          { visits: { some: { visitDate: { gte: startOfDay, lte: endOfDay } } } }
        ]
      });
    } else if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      whereClause.AND.push({
        OR: [
          { createdAt: { gte: startOfDay, lte: endOfDay } },
          { visits: { some: { visitDate: { gte: startOfDay, lte: endOfDay } } } }
        ]
      });
    }

    if (search) {
      whereClause.AND.push({
        OR: [
          { studentName: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search } }
        ]
      });
    }

    console.log("=== API /api/students HIT ===");
    console.log("URL:", req.url);
    console.log("Preset:", preset);
    
    if (preset === 'prime') {
      console.log("Applying prime preset filters...");
      const targetConfigs = await prisma.configValue.findMany({
        where: {
          OR: [
            { type: 'STUDY_INTEREST', value: { contains: 'vizag', mode: 'insensitive' } },
            { type: 'STUDY_INTEREST', value: { contains: 'visakha', mode: 'insensitive' } },
            { type: 'FEE_BEARABLE', value: { contains: 'yes', mode: 'insensitive' } },
            { type: 'FEE_BEARABLE', value: { contains: 'bearable', mode: 'insensitive' } },
            { type: 'GROUP', value: { contains: 'MPC', mode: 'insensitive' } },
            { type: 'GROUP', value: { contains: 'BIPC', mode: 'insensitive' } }
          ]
        }
      });
      
      const interestIds = targetConfigs.filter(c => c.type === 'STUDY_INTEREST').map(c => c.id);
      const feeIds = targetConfigs.filter(c => c.type === 'FEE_BEARABLE').map(c => c.id);
      const groupIds = targetConfigs.filter(c => c.type === 'GROUP').map(c => c.id);

      whereClause.AND.push({
        OR: [
          { studyInterestedAt: { in: interestIds } },
          { studyInterestedAt: { contains: 'vizag', mode: 'insensitive' } },
          { studyInterestedAt: { contains: 'visakha', mode: 'insensitive' } }
        ]
      });

      whereClause.AND.push({
        OR: [
          { ableToBearFee: { in: feeIds } },
          { ableToBearFee: { contains: 'yes', mode: 'insensitive' } },
          { ableToBearFee: { contains: 'bearable', mode: 'insensitive' } }
        ]
      });

      whereClause.AND.push({
        OR: [
          { group: { in: groupIds } },
          { group: { contains: 'mpc', mode: 'insensitive' } },
          { group: { contains: 'bipc', mode: 'insensitive' } }
        ]
      });
    }

    if (interest) whereClause.AND.push({ studyInterestedAt: interest });
    if (fee) whereClause.AND.push({ ableToBearFee: fee });

    if (location) {
      whereClause.AND.push({
        OR: [
          { district: location },
          { mandal: location },
          { village: location }
        ]
      });
    }

    if (mandal) {
      whereClause.AND.push({ mandal });
    }
    
    if (village) {
      whereClause.AND.push({ village });
    }

    const schoolName = searchParams.get('schoolName');
    if (schoolName) {
      whereClause.AND.push({ schoolName });
    }

    const profileStatus = searchParams.get('profileStatus');
    if (profileStatus === 'incomplete') {
      whereClause.AND.push({
        OR: [
          { fatherName: null }, { fatherName: '' },
          { district: null }, { district: '' },
          { mandal: null }, { mandal: '' },
          { village: null }, { village: '' },
          { schoolName: null }, { schoolName: '' },
          { gender: null }, { gender: '' },
          { occupation: null }, { occupation: '' }
        ]
      });
    }

    const followup = searchParams.get('followup');
    if (followup) {
      const endOfToday = new Date();
      endOfToday.setHours(23, 59, 59, 999);

      if (payload && payload.role === 'COLLEGE') {
        if (followup === 'today') {
          whereClause.AND.push({
            visits: {
              some: {
                addedById: payload.employeeId,
                OR: [
                  { nextFollowUpType: 'Date', nextFollowUpDate: { lte: endOfToday } },
                  { nextFollowUpType: null, nextFollowUpDate: { lte: endOfToday } }
                ]
              }
            }
          });
        } else if (followup === 'upcoming') {
          whereClause.AND.push({
            visits: {
              some: {
                addedById: payload.employeeId,
                OR: [
                  { nextFollowUpType: 'Date', nextFollowUpDate: { gt: endOfToday } },
                  { nextFollowUpType: null, nextFollowUpDate: { gt: endOfToday } }
                ]
              }
            }
          });
        } else if (followup === 'action') {
          whereClause.AND.push({
            visits: {
              some: {
                addedById: payload.employeeId,
                nextFollowUpType: { in: ['After Exams', 'After Results'] }
              }
            }
          });
        }
      } else {
        if (followup === 'today') {
          whereClause.AND.push({
            OR: [
              { nextFollowUpType: 'Date', nextFollowUpDate: { lte: endOfToday } },
              { nextFollowUpType: null, nextFollowUpDate: { lte: endOfToday } }
            ]
          });
        } else if (followup === 'upcoming') {
          whereClause.AND.push({
            OR: [
              { nextFollowUpType: 'Date', nextFollowUpDate: { gt: endOfToday } },
              { nextFollowUpType: null, nextFollowUpDate: { gt: endOfToday } }
            ]
          });
        } else if (followup === 'action') {
          whereClause.AND.push({
            nextFollowUpType: { in: ['After Exams', 'After Results'] }
          });
        }
      }
    }

    // If no AND conditions were added, remove the empty array
    if (whereClause.AND.length === 0) {
      delete whereClause.AND;
    }

    const total = await prisma.student.count({ where: whereClause });

    let visitInclude: any = {
      orderBy: { visitDate: 'desc' as const },
      take: 1
    };
    
    if (payload.role === 'COLLEGE') {
      visitInclude.where = { addedById: payload.employeeId };
    }

    const students = await prisma.student.findMany({
      where: whereClause,
      include: { 
        employee: true,
        visits: visitInclude,
        joinedCollege: { select: { name: true } }
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return NextResponse.json({ students, total, page, limit }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
