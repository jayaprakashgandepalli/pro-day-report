import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateSpxM2M, assertNoTenantMismatch, SpxAuthError } from '@/lib/integrations/spx/auth';
import { validateStudentTenantOwnership } from '@/lib/integrations/spx/tenant';
import { checkRateLimit } from '@/lib/integrations/spx/rate-limiter';
import { recordAuditLog, getCorrelationId } from '@/lib/integrations/spx/audit-logger';
import { normalizePhoneNumber } from '@/lib/phone';
import { validateAddressHierarchy } from '@/lib/integrations/spx/address-utils';

export const dynamic = 'force-dynamic';

/**
 * Approved low-risk fields that SPX Voice AI is allowed to populate when empty.
 */
const APPROVED_UPDATE_FIELDS = new Set([
  'studentName',
  'fatherName',
  'whatsapp',
  'gender',
  'address',
  'district',
  'districtId',
  'mandal',
  'mandalId',
  'village',
  'villageId',
  'schoolName',
  'schoolArea',
  'group',
  'educationStage',
  'studyInterestedAt',
  'ableToBearFee',
]);

/**
 * Protected and sensitive fields that MUST NEVER be modified via M2M updates.
 */
const PROTECTED_FIELDS = new Set([
  'id',
  'collegeId',
  'employeeId',
  'joinedCollegeId',
  'collegeBranchId',
  'marks',
  'remarks',
  'leadStatus',
  'password',
  'registrationStatus',
  'registeredBy',
  'doorstepCompleted',
  'applicationNumber',
  'admissionDate',
  'studentPhoto',
  'applicationPhoto',
  'visitNumber',
  'telecallerUpdateAt',
  'telecallerUpdateDetails',
  'createdAt',
  'updatedAt',
]);

interface FieldConflict {
  field: string;
  existingValue: string;
  submittedValue: string;
  reason: 'EXISTING_VALUE_CONFLICT' | 'INVALID_ADDRESS_HIERARCHY';
}

/**
 * POST /api/integrations/spx/v1/students/[id]/updates
 * Submits basic missing student information collected during a phone call.
 * Enforces strict Fill-Only semantics, address hierarchy validation, and conflict generation.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const correlationId = getCorrelationId(req);
  const endpoint = '/api/integrations/spx/v1/students/[id]/updates';

  try {
    // 1. M2M Authentication with 'students:update' scope
    const auth = await authenticateSpxM2M(req, ['students:update']);

    // 2. Resolve Route Parameter
    const { id } = await params;
    if (!id || typeof id !== 'string' || id.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'INVALID_ID', message: 'A valid student ID is required' },
        { status: 400 }
      );
    }
    const studentId = id.trim();

    // 3. Parse & Validate Payload
    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { success: false, error: 'INVALID_JSON', message: 'Malformed JSON in request body' },
        { status: 400 }
      );
    }

    // 4. Tenant Boundary Defense: Reject collegeId spoofing
    assertNoTenantMismatch(auth, body.collegeId, endpoint);

    // 5. Rate Limiting per Student & Tenant (20 updates/min per student)
    const rateLimit = await checkRateLimit(`update:${auth.collegeId}:${studentId}`, 20, 60, correlationId, auth.collegeId);
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

    // 6. Strict Multi-Tenant Boundary Validation
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

    // 7. Extract Submitted Updates
    const rawUpdates = body.updates && typeof body.updates === 'object' ? body.updates : body;
    const submittedKeys = body.updates && typeof body.updates === 'object'
      ? Object.keys(body.updates).filter((k) => k !== 'isConfirmed' && k !== 'nameConfirmed')
      : Object.keys(body).filter((k) => k !== 'collegeId' && k !== 'isConfirmed' && k !== 'nameConfirmed');

    if (submittedKeys.length === 0) {
      return NextResponse.json(
        { success: false, error: 'NO_UPDATES_PROVIDED', message: 'No valid update fields were provided' },
        { status: 400 }
      );
    }

    // 8. Reject Unknown or Protected Fields
    for (const key of submittedKeys) {
      if (PROTECTED_FIELDS.has(key)) {
        return NextResponse.json(
          {
            success: false,
            error: 'PROTECTED_FIELD_REJECTED',
            message: `Field '${key}' is protected and cannot be modified via M2M integration.`,
          },
          { status: 400 }
        );
      }

      if (!APPROVED_UPDATE_FIELDS.has(key)) {
        return NextResponse.json(
          {
            success: false,
            error: 'UNKNOWN_FIELD_REJECTED',
            message: `Field '${key}' is not an approved updateable field.`,
          },
          { status: 400 }
        );
      }
    }

    // 8b. Validate studentName if submitted (reject empty, whitespace-only, or unconfirmed names)
    if (submittedKeys.includes('studentName')) {
      const rawName = rawUpdates.studentName;
      if (rawName === null || rawName === undefined || typeof rawName !== 'string' || rawName.trim().length === 0) {
        return NextResponse.json(
          {
            success: false,
            error: 'INVALID_STUDENT_NAME',
            message: 'Submitted studentName cannot be empty or whitespace only',
          },
          { status: 400 }
        );
      }

      const trimmedCandidate = rawName.trim();
      const UNCONFIRMED_PLACEHOLDERS = new Set([
        'unknown',
        'unconfirmed',
        'n/a',
        'na',
        'null',
        'none',
        'not known',
        'not sure',
        'pending confirmation',
      ]);

      if (
        UNCONFIRMED_PLACEHOLDERS.has(trimmedCandidate.toLowerCase()) ||
        rawUpdates.isConfirmed === false ||
        body.isConfirmed === false ||
        rawUpdates.nameConfirmed === false ||
        body.nameConfirmed === false
      ) {
        return NextResponse.json(
          {
            success: false,
            error: 'UNCONFIRMED_NAME_REJECTED',
            message: 'Cannot save an unconfirmed or placeholder student name',
          },
          { status: 400 }
        );
      }
    }

    // 9. Query Current Student Values for Submitted Fields
    const currentStudent = await prisma.student.findUnique({
      where: { id: studentId },
      select: {
        studentName: true,
        fatherName: true,
        whatsapp: true,
        gender: true,
        address: true,
        district: true,
        mandal: true,
        village: true,
        schoolName: true,
        schoolArea: true,
        group: true,
        educationStage: true,
        studyInterestedAt: true,
        ableToBearFee: true,
      },
    });

    if (!currentStudent) {
      return NextResponse.json(
        { success: false, error: 'STUDENT_NOT_FOUND', message: 'Student record not found' },
        { status: 404 }
      );
    }

    // 10. Process Updates with Fill-Only, Hierarchy Validation & Conflict Detection
    const fieldsToApply: Record<string, string> = {};
    const updatedFields: string[] = [];
    const unchangedFields: string[] = [];
    const conflictsRequiringReview: FieldConflict[] = [];

    // Check if Address Hierarchy fields are submitted
    const submittedDistrict = rawUpdates.districtId || rawUpdates.district;
    const submittedMandal = rawUpdates.mandalId || rawUpdates.mandal;
    const submittedVillage = rawUpdates.villageId || rawUpdates.village;
    const hasAddressHierarchyInput = Boolean(submittedDistrict || submittedMandal || submittedVillage);

    const addressKeys = new Set(['district', 'districtId', 'mandal', 'mandalId', 'village', 'villageId']);

    // A. Handle standard profile fields (excluding address hierarchy handled in B)
    for (const field of submittedKeys) {
      if (addressKeys.has(field)) continue;

      const rawValue = rawUpdates[field];
      if (rawValue === null || rawValue === undefined) continue;

      const candidateStr = typeof rawValue === 'string' ? rawValue.trim() : String(rawValue).trim();
      if (!candidateStr) continue;

      const candidateValue = field === 'whatsapp' ? normalizePhoneNumber(candidateStr) : candidateStr;
      const existingRaw = (currentStudent as Record<string, any>)[field];
      const hasExisting =
        existingRaw !== null &&
        existingRaw !== undefined &&
        typeof existingRaw === 'string' &&
        existingRaw.trim().length > 0;

      if (!hasExisting) {
        fieldsToApply[field] = candidateValue;
        updatedFields.push(field);
      } else {
        const existingClean = field === 'whatsapp' ? normalizePhoneNumber(existingRaw) : existingRaw.trim();
        if (existingClean.toLowerCase() === candidateValue.toLowerCase()) {
          unchangedFields.push(field);
        } else {
          conflictsRequiringReview.push({
            field,
            existingValue: existingRaw,
            submittedValue: candidateStr,
            reason: 'EXISTING_VALUE_CONFLICT',
          });
        }
      }
    }

    // B. Handle Address Hierarchy atomically with validation
    if (hasAddressHierarchyInput) {
      const existingDistrict = currentStudent.district;
      const existingMandal = currentStudent.mandal;
      const existingVillage = currentStudent.village;

      const hasExistingHierarchy = Boolean(existingDistrict && existingMandal && existingVillage);

      // Check for conflicts on already populated address fields
      let hasAddressConflict = false;

      if (existingDistrict && submittedDistrict && existingDistrict !== submittedDistrict) {
        conflictsRequiringReview.push({
          field: 'district',
          existingValue: existingDistrict,
          submittedValue: submittedDistrict,
          reason: 'EXISTING_VALUE_CONFLICT',
        });
        hasAddressConflict = true;
      }

      if (existingMandal && submittedMandal && existingMandal !== submittedMandal) {
        conflictsRequiringReview.push({
          field: 'mandal',
          existingValue: existingMandal,
          submittedValue: submittedMandal,
          reason: 'EXISTING_VALUE_CONFLICT',
        });
        hasAddressConflict = true;
      }

      if (existingVillage && submittedVillage && existingVillage !== submittedVillage) {
        conflictsRequiringReview.push({
          field: 'village',
          existingValue: existingVillage,
          submittedValue: submittedVillage,
          reason: 'EXISTING_VALUE_CONFLICT',
        });
        hasAddressConflict = true;
      }

      if (hasAddressConflict) {
        // Preserves existing address information intact
      } else if (!hasExistingHierarchy) {
        // Fill-only: resolve proposed district, mandal, village
        const targetDistrict = submittedDistrict || existingDistrict;
        const targetMandal = submittedMandal || existingMandal;
        const targetVillage = submittedVillage || existingVillage;

        if (targetDistrict && targetMandal && targetVillage) {
          const validationResult = await validateAddressHierarchy(targetDistrict, targetMandal, targetVillage);

          if (validationResult.valid) {
            fieldsToApply.district = targetDistrict;
            fieldsToApply.mandal = targetMandal;
            fieldsToApply.village = targetVillage;

            if (!existingDistrict) updatedFields.push('district');
            if (!existingMandal) updatedFields.push('mandal');
            if (!existingVillage) updatedFields.push('village');
          } else {
            conflictsRequiringReview.push({
              field: 'addressHierarchy',
              existingValue: `${existingDistrict || 'none'}/${existingMandal || 'none'}/${existingVillage || 'none'}`,
              submittedValue: `${targetDistrict}/${targetMandal}/${targetVillage}`,
              reason: 'INVALID_ADDRESS_HIERARCHY',
            });
          }
        } else {
          // Incomplete hierarchy provided
          conflictsRequiringReview.push({
            field: 'addressHierarchy',
            existingValue: 'incomplete',
            submittedValue: `${submittedDistrict || ''}/${submittedMandal || ''}/${submittedVillage || ''}`,
            reason: 'INVALID_ADDRESS_HIERARCHY',
          });
        }
      } else {
        unchangedFields.push('district', 'mandal', 'village');
      }
    }

    // 11. Execute Database Update Atomically
    if (updatedFields.length > 0) {
      await prisma.student.update({
        where: { id: studentId },
        data: fieldsToApply,
      });
    }

    // 12. Audit Logging
    recordAuditLog({
      correlationId,
      collegeId: auth.collegeId,
      credentialIdentity: auth.credentialId,
      endpoint,
      action: 'STUDENT_UPDATE_FILL',
      status: 'SUCCESS',
      detail: `Updated: [${updatedFields.join(', ')}] | Conflicts: [${conflictsRequiringReview.map((c) => c.field).join(', ')}]`,
    });

    return NextResponse.json(
      {
        success: true,
        studentId,
        updatedFields,
        conflictsRequiringReview,
        unchangedFields,
        message: updatedFields.length > 0
          ? `Successfully filled ${updatedFields.length} missing field(s).`
          : 'No empty fields were updated.',
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
