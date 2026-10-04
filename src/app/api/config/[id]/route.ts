import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { invalidateConfigCache } from '@/lib/cache';

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const payload = verifyToken(token) as { role: string } | null;
    
    if (!payload || payload.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Delete children first (if it's a district/mandal)
    await prisma.configValue.deleteMany({
      where: { parentId: id }
    });

    await prisma.configValue.delete({
      where: { id }
    });

    invalidateConfigCache();

    return NextResponse.json({ message: 'Config deleted' }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const payload = verifyToken(token) as { role: string } | null;
    
    if (!payload || (payload.role !== 'ADMIN' && payload.role !== 'TELECALLER')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const data = await req.json();
    const { value, strength, grade, headmasterName, headmasterPhone, keyPersonName, keyPersonPhone } = data;

    if (!value) {
      return NextResponse.json({ error: 'Value is required' }, { status: 400 });
    }

    const updateData: any = {
      value,
      strength: strength !== undefined ? parseInt(strength, 10) : undefined,
      grade: grade !== undefined ? grade : undefined,
      headmasterName: headmasterName !== undefined ? headmasterName : undefined,
      headmasterPhone: headmasterPhone !== undefined ? headmasterPhone : undefined,
      keyPersonName: keyPersonName !== undefined ? keyPersonName : undefined,
      keyPersonPhone: keyPersonPhone !== undefined ? keyPersonPhone : undefined,
      remarks: data.remarks !== undefined ? data.remarks : undefined,
    };

    if (payload.role === 'TELECALLER') {
      updateData.telecallerUpdateAt = new Date();
      if (Array.isArray(data.remarks) && data.remarks.length > 0) {
        const lastRemark = data.remarks[data.remarks.length - 1];
        updateData.telecallerUpdateDetails = lastRemark.text || 'Added remarks';
      } else {
        updateData.telecallerUpdateDetails = 'Updated school details';
      }
    }

    const updated = await prisma.configValue.update({
      where: { id },
      data: updateData
    });

    invalidateConfigCache();

    return NextResponse.json({ message: 'Config updated', config: updated }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
