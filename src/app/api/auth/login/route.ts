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

    const user = await prisma.user.findUnique({
      where: { employeeId },
    });

    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials.' }, { status: 401 });
    }

    const isMatch = await bcrypt.compare(password, user.password);

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
    });

    const cookieStore = await cookies();
    cookieStore.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/',
    });

    return NextResponse.json(
      { message: 'Login successful', user: { name: user.name, role: user.role, employeeId: user.employeeId } },
      { status: 200 }
    );
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
