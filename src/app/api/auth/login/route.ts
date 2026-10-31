import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { signToken } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
  try {
    const { employeeId, password } = await req.json();

    if (!employeeId || !password) {
      return NextResponse.json({ error: 'Employee ID and Password are required.' }, { status: 400 });
    }

    const cleanId = employeeId.trim();
    const cleanPassword = password.trim();

    const user = await prisma.user.findFirst({
      where: {
        employeeId: {
          equals: cleanId,
          mode: 'insensitive',
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials.' }, { status: 401 });
    }

    let isMatch = await bcrypt.compare(cleanPassword, user.password);

    // Fallback for admin if password was typed as 'admin', 'admin123', or 'Psd@1986'
    if (!isMatch && user.role === 'ADMIN' && (cleanPassword === 'Psd@1986' || cleanPassword === 'admin' || cleanPassword === 'admin123')) {
      isMatch = true;
      // Auto-update to new hash so future logins are instant
      const newHash = await bcrypt.hash(cleanPassword, 10);
      await prisma.user.update({
        where: { id: user.id },
        data: { password: newHash },
      }).catch(console.error);
    }

    if (!isMatch) {
      return NextResponse.json({ error: 'Invalid credentials.' }, { status: 401 });
    }

    if (user.isActive === false) {
      return NextResponse.json({ error: 'Account is disabled. Please contact Admin.' }, { status: 403 });
    }

    const token = signToken({
      id: user.id,
      employeeId: user.employeeId,
      name: user.name,
      role: user.role,
      collegeId: user.collegeId || null,
    });

    const cookieStore = await cookies();
    cookieStore.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/',
    });

    return NextResponse.json(
      { message: 'Login successful', token, user: { name: user.name, role: user.role, employeeId: user.employeeId } },
      { status: 200 }
    );
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
