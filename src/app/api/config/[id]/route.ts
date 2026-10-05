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
    const { value, strength, grade, headmasterName, headmasterPhone, keyPersonName, keyPersonPhone, parentId } = data;

    if (!value) {
      return NextResponse.json({ error: 'Value is required' }, { status: 400 });
    }

    let parsedStrength: number | null | undefined = undefined;
    if (strength !== undefined) {
      if (strength === '' || strength === null) {
        parsedStrength = 0;
      } else {
        const num = parseInt(strength, 10);
        parsedStrength = isNaN(num) ? 0 : num;
      }
    }

    const updateData: any = {
      value,
      ...(parsedStrength !== undefined && { strength: parsedStrength }),
      ...(grade !== undefined && { grade: grade || null }),
      ...(headmasterName !== undefined && { headmasterName: headmasterName || null }),
      ...(headmasterPhone !== undefined && { headmasterPhone: headmasterPhone || null }),
      ...(keyPersonName !== undefined && { keyPersonName: keyPersonName || null }),
      ...(keyPersonPhone !== undefined && { keyPersonPhone: keyPersonPhone || null }),
      ...(parentId !== undefined && { parentId: parentId || null }),
      ...(data.remarks !== undefined && { remarks: data.remarks }),
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
    console.error('Error updating config:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
