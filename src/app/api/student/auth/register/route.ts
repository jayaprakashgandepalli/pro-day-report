import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
  try {
    const { studentName, phone, schoolName, password } = await req.json();

    if (!studentName || !phone || !schoolName || !password) {
      return NextResponse.json({ error: 'All fields are required.' }, { status: 400 });
    }

    // Check if phone already exists
    const existingStudent = await prisma.student.findFirst({
      where: { phone },
    });

    if (existingStudent) {
      if (!existingStudent.password) {
        // Update password for students pre-added by employees
        const hashedPassword = await bcrypt.hash(password, 10);
        await prisma.student.update({
          where: { id: existingStudent.id },
          data: {
            password: hashedPassword,
            studentName: existingStudent.studentName || studentName,
            schoolName: existingStudent.schoolName || schoolName,
            registrationStatus: 'APPROVED' // ensure they can login immediately
          }
        });
        return NextResponse.json(
          { 
            message: 'Your account was pre-registered by our team. Your new password has been set successfully!',
            isPreRegistered: true 
          },
          { status: 201 }
        );
      }
      return NextResponse.json({ error: 'This phone number is already registered. Please login.' }, { status: 400 });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Find a default employee/admin to assign this student to (since employeeId is required)
    const admin = await prisma.user.findFirst({
      where: { role: 'ADMIN' },
    });

    if (!admin) {
      return NextResponse.json({ error: 'System error: No admin found.' }, { status: 500 });
    }

    // Create the student with PENDING status
    const newStudent = await prisma.student.create({
      data: {
        studentName,
        phone,
        schoolName,
        password: hashedPassword,
        group: 'Pending', // Default
        registrationStatus: 'PENDING',
        registeredBy: 'SELF',
        employeeId: admin.employeeId,
      },
    });

    return NextResponse.json(
      { message: 'Registration successful. Waiting for approval.' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
