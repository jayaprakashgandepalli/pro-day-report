import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { recordAuditLog } from './audit-logger';

export class SpxTenantIsolationError extends Error {
  public statusCode: number;
  public errorCode: string;

  constructor(message: string, statusCode: number = 403, errorCode: string = 'FORBIDDEN') {
    super(message);
    this.name = 'SpxTenantIsolationError';
    this.statusCode = statusCode;
    this.errorCode = errorCode;
  }
}

export interface StudentTenantValidationResult {
  allowed: boolean;
  student?: {
    id: string;
    studentName: string;
    phone: string;
    collegeId: string | null;
    employeeId: string;
    employeeCollegeId: string | null;
  };
  reason?: string;
}

/**
 * Builds a strict Prisma `where` clause that guarantees all queried students
 * unambiguously belong to the authenticated college tenant.
 * Accounts for nullable `Student.collegeId` by resolving creator `employee.collegeId`.
 * CRITICAL: Never uses `joinedCollegeId` as proof of ownership.
 */
export function buildTenantStudentWhereClause(
  collegeId: string,
  extraConditions?: Prisma.StudentWhereInput
): Prisma.StudentWhereInput {
  const cleanCollegeId = collegeId.trim();

  const tenantFilter: Prisma.StudentWhereInput = {
    OR: [
      // 1. Direct College Ownership
      { collegeId: cleanCollegeId },
      // 2. Fallback Creator Ownership (when student.collegeId is null)
      {
        AND: [
          { collegeId: null },
          { employee: { collegeId: cleanCollegeId } },
        ],
      },
    ],
  };

  if (!extraConditions) {
    return tenantFilter;
  }

  return {
    AND: [tenantFilter, extraConditions],
  };
}

/**
 * Validates whether an individual student unambiguously belongs to the authenticated college.
 * Rejects ambiguous, missing, or conflicting ownership without guessing.
 */
export async function validateStudentTenantOwnership(
  studentId: string,
  authenticatedCollegeId: string,
  correlationId?: string,
  endpoint: string = '/api/integrations/spx'
): Promise<StudentTenantValidationResult> {
  const cleanStudentId = studentId.trim();
  const cleanCollegeId = authenticatedCollegeId.trim();

  // 1. Fetch Student and their assigned Creator Employee
  const student = await prisma.student.findUnique({
    where: { id: cleanStudentId },
    select: {
      id: true,
      studentName: true,
      phone: true,
      collegeId: true,
      employeeId: true,
      employee: {
        select: {
          employeeId: true,
          collegeId: true,
        },
      },
    },
  });

  if (!student) {
    return {
      allowed: false,
      reason: 'STUDENT_NOT_FOUND',
    };
  }

  const directCollegeId = student.collegeId;
  const employeeCollegeId = student.employee?.collegeId || null;

  // 2. Direct Ownership Check
  if (directCollegeId !== null) {
    if (directCollegeId === cleanCollegeId) {
      // If employee has a conflicting college, flag conflict
      if (employeeCollegeId !== null && employeeCollegeId !== cleanCollegeId) {
        if (correlationId) {
          recordAuditLog({
            correlationId,
            collegeId: cleanCollegeId,
            credentialIdentity: null,
            endpoint,
            action: 'TENANT_VALIDATION_FAILED',
            status: 'BLOCKED',
            detail: `Conflict: student.collegeId=${directCollegeId} but employee.collegeId=${employeeCollegeId}`,
          });
        }
        return {
          allowed: false,
          reason: 'CONFLICTING_TENANT_OWNERSHIP',
        };
      }

      return {
        allowed: true,
        student: {
          id: student.id,
          studentName: student.studentName,
          phone: student.phone,
          collegeId: directCollegeId,
          employeeId: student.employeeId,
          employeeCollegeId,
        },
      };
    }

    // Direct mismatch: student explicitly belongs to another college
    if (correlationId) {
      recordAuditLog({
        correlationId,
        collegeId: cleanCollegeId,
        credentialIdentity: null,
        endpoint,
        action: 'TENANT_VALIDATION_FAILED',
        status: 'BLOCKED',
        detail: `Tenant mismatch: student.collegeId=${directCollegeId} requested by collegeId=${cleanCollegeId}`,
      });
    }
    return {
      allowed: false,
      reason: 'CROSS_TENANT_ACCESS_FORBIDDEN',
    };
  }

  // 3. Null direct collegeId: Evaluate Creator Employee College
  if (employeeCollegeId !== null && employeeCollegeId === cleanCollegeId) {
    return {
      allowed: true,
      student: {
        id: student.id,
        studentName: student.studentName,
        phone: student.phone,
        collegeId: null,
        employeeId: student.employeeId,
        employeeCollegeId,
      },
    };
  }

  // 4. Ambiguous: Both are null or employee belongs to another college
  if (correlationId) {
    recordAuditLog({
      correlationId,
      collegeId: cleanCollegeId,
      credentialIdentity: null,
      endpoint,
      action: 'TENANT_VALIDATION_FAILED',
      status: 'BLOCKED',
      detail: `Ambiguous ownership: student.collegeId=null and employee.collegeId=${employeeCollegeId}`,
    });
  }

  return {
    allowed: false,
    reason: 'AMBIGUOUS_OR_UNASSIGNED_TENANT_RECORD',
  };
}

