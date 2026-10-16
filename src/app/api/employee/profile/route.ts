import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    let employeeId = searchParams.get('employeeId');

    if (!employeeId) {
      const cookieStore = await cookies();
      const token = cookieStore.get('auth_token')?.value;
      if (token) {
        const payload = verifyToken(token) as { employeeId: string } | null;
        if (payload?.employeeId) {
          employeeId = payload.employeeId;
        }
      }
    }

    if (!employeeId) {
      return NextResponse.json({ error: 'employeeId is required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { employeeId },
      select: { employeeId: true, name: true, role: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const profileConfig = await prisma.configValue.findFirst({
      where: {
        type: 'EMPLOYEE_PROFILE',
        parentId: employeeId,
      },
    });

    let phone = '';
    let collegeName = '';
    if (profileConfig) {
      collegeName = profileConfig.value || '';
      const remarks = profileConfig.remarks as any;
      if (remarks) {
        phone = remarks.phone || '';
        if (!collegeName && remarks.collegeName) {
          collegeName = remarks.collegeName;
        }
      }
    }

    return NextResponse.json({
      success: true,
      profile: {
        employeeId: user.employeeId,
        name: user.name,
        role: user.role,
        phone,
        collegeName,
      },
    });
  } catch (error) {
    console.error('Error fetching employee profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { employeeId, name, phone, collegeName } = body;

    if (!employeeId) {
      return NextResponse.json({ error: 'employeeId is required' }, { status: 400 });
    }

    // 1. Update user name if provided
    if (name && name.trim()) {
      await prisma.user.update({
        where: { employeeId },
        data: { name: name.trim() },
      });
    }

    // 2. Upsert profile in ConfigValue
    const existing = await prisma.configValue.findFirst({
      where: {
        type: 'EMPLOYEE_PROFILE',
        parentId: employeeId,
      },
    });

    if (existing) {
      await prisma.configValue.update({
        where: { id: existing.id },
        data: {
          value: collegeName?.trim() || '',
          remarks: {
            phone: phone?.trim() || '',
            collegeName: collegeName?.trim() || '',
            name: name?.trim() || '',
            updatedAt: new Date().toISOString(),
          },
        },
      });
    } else {
      await prisma.configValue.create({
        data: {
          type: 'EMPLOYEE_PROFILE',
          parentId: employeeId,
          value: collegeName?.trim() || '',
          remarks: {
            phone: phone?.trim() || '',
            collegeName: collegeName?.trim() || '',
            name: name?.trim() || '',
            updatedAt: new Date().toISOString(),
          },
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Profile updated and synced successfully',
      profile: {
        employeeId,
        name: name?.trim() || '',
        phone: phone?.trim() || '',
        collegeName: collegeName?.trim() || '',
      },
    });
  } catch (error) {
    console.error('Error saving employee profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
