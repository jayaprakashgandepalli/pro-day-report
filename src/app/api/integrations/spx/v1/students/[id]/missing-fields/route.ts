import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateSpxM2M, SpxAuthError } from '@/lib/integrations/spx/auth';
import { validateStudentTenantOwnership } from '@/lib/integrations/spx/tenant';
import { checkRateLimit } from '@/lib/integrations/spx/rate-limiter';
import { recordAuditLog, getCorrelationId } from '@/lib/integrations/spx/audit-logger';

export const dynamic = 'force-dynamic';

interface FieldSpec {
  field: string;
  label: string;
  category: 'personal' | 'location' | 'academic' | 'preference';
}

const TRACKED_ADMISSIONS_FIELDS: FieldSpec[] = [
  { field: 'studentName', label: 'Student Name', category: 'personal' },
  { field: 'fatherName', label: "Father's Name", category: 'personal' },
  { field: 'gender', label: 'Gender', category: 'personal' },
  { field: 'whatsapp', label: 'WhatsApp Number', category: 'personal' },
  { field: 'group', label: 'Preferred Academic Stream / Group (e.g. MPC, BiPC)', category: 'academic' },
  { field: 'educationStage', label: 'Current Education Stage (e.g. 10th)', category: 'academic' },
  { field: 'studyInterestedAt', label: 'Campus Preference / Mode (e.g. Day Scholar, Hostel)', category: 'preference' },
  { field: 'ableToBearFee', label: 'Fee Bearability Status', category: 'preference' },
  { field: 'schoolName', label: 'School Name', category: 'academic' },
  { field: 'schoolArea', label: 'School Area', category: 'location' },
  { field: 'district', label: 'District', category: 'location' },
  { field: 'mandal', label: 'Mandal', category: 'location' },
  { field: 'village', label: 'Village', category: 'location' },
  { field: 'address', label: 'Residential Address', category: 'location' },
];

/**
 * GET /api/integrations/spx/v1/students/[id]/missing-fields
 * Calculates and returns the list of empty profile fields needed for admissions.
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const correlationId = getCorrelationId(req);
  const endpoint = '/api/integrations/spx/v1/students/[id]/missing-fields';

  try {
    // 1. M2M Authentication with 'students:read' scope
    const auth = await authenticateSpxM2M(req, ['students:read']);

    // 2. Resolve Route Parameter
    const { id } = await params;
    if (!id || typeof id !== 'string' || id.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'INVALID_ID', message: 'A valid student ID is required' },
        { status: 400 }
      );
    }
    const studentId = id.trim();

    // 3. Rate Limiting per Tenant
    const rateLimit = await checkRateLimit(`missing_fields:${auth.collegeId}`, 120, 60, correlationId, auth.collegeId);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: 'RATE_LIMIT_EXCEEDED',
          message: 'Rate limit exceeded. Please retry later.',
          retryAfterSeconds: rateLimit.retryAfterSeconds,
        },
        { status: 429 }
      );
    }

    // 4. Strict Multi-Tenant Boundary Validation
    const validation = await validateStudentTenantOwnership(
      studentId,
      auth.collegeId,
      correlationId,
      endpoint
    );

    if (!validation.allowed) {
      if (validation.reason === 'STUDENT_NOT_FOUND') {
        return NextResponse.json(
          { success: false, error: 'STUDENT_NOT_FOUND', message: 'Student not found' },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { success: false, error: 'FORBIDDEN', message: 'Access to this student record is prohibited' },
        { status: 403 }
      );
    }

    // 5. Query student profile fields
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      select: {
        studentName: true,
        fatherName: true,
        gender: true,
        whatsapp: true,
        group: true,
        educationStage: true,
        studyInterestedAt: true,
        ableToBearFee: true,
        schoolName: true,
        schoolArea: true,
        district: true,
        mandal: true,
        village: true,
        address: true,
      },
    });

    if (!student) {
      return NextResponse.json(
        { success: false, error: 'STUDENT_NOT_FOUND', message: 'Student record not found' },
        { status: 404 }
      );
    }

    // 6. Calculate Missing Fields on Server
    const missingFields: FieldSpec[] = [];
    const populatedFields: string[] = [];

    for (const spec of TRACKED_ADMISSIONS_FIELDS) {
      const value = (student as Record<string, any>)[spec.field];
      const isMissing =
        value === null ||
        value === undefined ||
        (typeof value === 'string' && value.trim() === '');

      if (isMissing) {
        missingFields.push(spec);
      } else {
        populatedFields.push(spec.field);
      }
    }

    recordAuditLog({
      correlationId,
      collegeId: auth.collegeId,
      credentialIdentity: auth.credentialId,
      endpoint,
      action: 'MISSING_FIELDS_CALCULATED',
      status: 'SUCCESS',
      detail: `Student ${studentId} has ${missingFields.length} missing fields out of ${TRACKED_ADMISSIONS_FIELDS.length}`,
    });

    return NextResponse.json(
      {
        success: true,
        studentId,
        totalTracked: TRACKED_ADMISSIONS_FIELDS.length,
        missingCount: missingFields.length,
        populatedCount: populatedFields.length,
        missingFields,
      },
      { status: 200 }
    );
  } catch (err: any) {
    if (err instanceof SpxAuthError) {
      return NextResponse.json(
        { success: false, error: err.errorCode, message: err.message },
        { status: err.statusCode }
      );
    }

    recordAuditLog({
      correlationId,
      collegeId: null,
      credentialIdentity: null,
      endpoint,
      action: 'INTERNAL_ERROR',
      status: 'FAILURE',
      detail: err.message,
    });

    return NextResponse.json(
      { success: false, error: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

