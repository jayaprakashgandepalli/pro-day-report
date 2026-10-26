import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { name, code, location, phone, isActive } = body;

    const data: any = {};
    if (name !== undefined) data.name = name.trim();
    if (code !== undefined) data.code = code && typeof code === 'string' && code.trim() ? code.trim() : null;
    if (location !== undefined) data.location = location && typeof location === 'string' && location.trim() ? location.trim() : null;
    if (phone !== undefined) data.phone = phone && typeof phone === 'string' && phone.trim() ? phone.trim() : null;
    if (isActive !== undefined) data.isActive = Boolean(isActive);

    const branch = await prisma.collegeBranch.update({
      where: { id },
      data,
    });

    return NextResponse.json({ success: true, branch }, { status: 200 });
  } catch (error: any) {
    console.error('Error updating college branch:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    // Check if any students are linked
    const studentCount = await prisma.student.count({
      where: { collegeBranchId: id }
    });

    if (studentCount > 0) {
      // Soft-delete by setting isActive = false to preserve admission data
      await prisma.collegeBranch.update({
        where: { id },
        data: { isActive: false },
      });
      return NextResponse.json({
        success: true,
        message: `Branch deactivated (archived) because ${studentCount} students are admitted to it.`
      }, { status: 200 });
    }

    await prisma.collegeBranch.delete({
      where: { id }
    });

    return NextResponse.json({ success: true, message: 'Branch deleted successfully' }, { status: 200 });
  } catch (error: any) {
    console.error('Error deleting college branch:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal server error' }, { status: 500 });
  }
}
