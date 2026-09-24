import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { signToken } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
  try {
    const { phone, password } = await req.json();

    if (!phone || !password) {
      return NextResponse.json({ error: 'Phone number and Password are required.' }, { status: 400 });
    }

    const student = await prisma.student.findFirst({
      where: { phone },
    });

    if (!student) {
      return NextResponse.json({ error: 'Student not found. Please register.' }, { status: 401 });
    }

    if (student.registrationStatus === 'PENDING') {
      return NextResponse.json({ error: 'Your account is pending approval by the admin.' }, { status: 403 });
    }
    
    if (student.registrationStatus === 'REJECTED') {
      return NextResponse.json({ error: 'Your registration was rejected.' }, { status: 403 });
    }

    // Check password (either hashed or fallback logic for pre-registered students)
    let isMatch = false;
    
    if (student.password) {
      isMatch = await bcrypt.compare(password, student.password);
    } else {
      // If no password is set (pre-registered by employee), allow '123456' or their phone number
      isMatch = (password === '123456' || password === student.phone); 
    }

    if (!isMatch) {
      return NextResponse.json({ error: 'Invalid password.' }, { status: 401 });
    }

    // Use a specific token for students to separate from employees
    const token = signToken({
      id: student.id,
      phone: student.phone,
      name: student.studentName,
      role: 'STUDENT',
    });

    const cookieStore = await cookies();
    // Save as student_token so it doesn't conflict with employee auth_token
    cookieStore.set('student_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/',
    });

    return NextResponse.json(
      { message: 'Login successful', user: { name: student.studentName, role: 'STUDENT' } },
      { status: 200 }
    );
  } catch (error) {
    console.error('Student Login error:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
