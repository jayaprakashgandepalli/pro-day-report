import { prisma } from '@/lib/prisma';
import { issueTestSpxM2MToken } from './auth';
import { recordAuditLog, getCorrelationId } from './audit-logger';

export interface TriggerStudentCallParams {
  studentId: string;
  customPhoneNumber?: string;
  requestedByEmployeeId?: string;
  requestedByRole?: string;
  correlationId?: string;
}

export interface TriggerStudentCallResult {
  success: boolean;
  workflowRunId?: number;
  workflowRunName?: string;
  status?: string;
  error?: string;
  message: string;
}

/**
 * Normalizes Indian phone numbers to E.164 (+91XXXXXXXXXX) format.
 */
export function normalizePhoneForSpx(rawPhone: string): string {
  const digits = rawPhone.replace(/\D/g, '');
  if (digits.length === 10) {
    return `+91${digits}`;
  }
  if (digits.length === 12 && digits.startsWith('91')) {
    return `+${digits}`;
  }
  if (digits.length === 11 && digits.startsWith('0')) {
    return `+91${digits.substring(1)}`;
  }
  // Fallback: prepend + if missing
  return rawPhone.startsWith('+') ? rawPhone : `+${digits}`;
}

/**
 * Resolves list of missing key fields on student profile.
 */
function identifyMissingFields(student: any): string[] {
  const missing: string[] = [];
  if (!student.fatherName?.trim()) missing.push('fatherName');
  if (!student.motherName?.trim()) missing.push('motherName');
  if (!student.gender?.trim()) missing.push('gender');
  if (!student.occupation?.trim()) missing.push('occupation');
  if (!student.district?.trim()) missing.push('district');
  if (!student.mandal?.trim()) missing.push('mandal');
  if (!student.village?.trim()) missing.push('village');
  if (!student.address?.trim()) missing.push('address');
  if (!student.group?.trim()) missing.push('group');
  if (student.tenthMarks === null || student.tenthMarks === undefined) missing.push('tenthMarks');
  if (student.interMarks === null || student.interMarks === undefined) missing.push('interMarks');
  return missing;
}

/**
 * Server-side client for initiating individual outbound AI calls via SPX Voice.
 * Reuses SPX endpoint: POST /api/v1/public/agent/{uuid}
 * CRITICAL: The SPX API key is only read server-side and never sent to browser code.
 */
export async function triggerOutboundStudentCall(
  params: TriggerStudentCallParams
): Promise<TriggerStudentCallResult> {
  const correlationId = params.correlationId || `corr_outbound_${Date.now()}`;
  const endpoint = 'SPX_OUTBOUND_CLIENT';

  // 1. Resolve SPX Configuration
  const baseUrl = (process.env.SPX_API_BASE_URL || process.env.SPX_BASE_URL || 'http://localhost:8000').replace(/\/+$/, '');
  const apiKey = (process.env.SPX_API_KEY || process.env.SPX_VOICE_API_KEY)?.trim();
  const agentUuid = (
    process.env.SPX_AGENT_UUID ||
    process.env.AGENT_UUID ||
    process.env.SPX_VOICE_AGENT_UUID
  )?.trim();
  const rawTelephonyConfigId = process.env.SPX_TELEPHONY_CONFIG_ID || process.env.TELEPHONY_CONFIG_ID;
  const telephonyConfigId = rawTelephonyConfigId && !isNaN(parseInt(rawTelephonyConfigId, 10))
    ? parseInt(rawTelephonyConfigId, 10)
    : undefined;

  if (!apiKey || !apiKey.trim()) {
    recordAuditLog({
      correlationId,
      collegeId: null,
      credentialIdentity: null,
      endpoint,
      action: 'OUTBOUND_CONFIG_ERROR',
      status: 'FAILURE',
      detail: 'SPX_API_KEY is not configured in environment',
    });
    return {
      success: false,
      error: 'CONFIGURATION_ERROR',
      message: 'SPX Voice API key is not configured on the server',
    };
  }

  if (!agentUuid || !agentUuid.trim()) {
    recordAuditLog({
      correlationId,
      collegeId: null,
      credentialIdentity: null,
      endpoint,
      action: 'OUTBOUND_CONFIG_ERROR',
      status: 'FAILURE',
      detail: 'SPX_AGENT_UUID is not configured in environment',
    });
    return {
      success: false,
      error: 'CONFIGURATION_ERROR',
      message: 'SPX Voice Agent UUID is not configured on the server',
    };
  }

  // 2. Fetch Student with Tenant and Staff Context
  const student = await prisma.student.findUnique({
    where: { id: params.studentId },
    include: {
      college: true,
      employee: {
        include: {
          college: true,
        },
      },
      joinedCollege: true,
    },
  });

  if (!student) {
    recordAuditLog({
      correlationId,
      collegeId: null,
      credentialIdentity: null,
      endpoint,
      action: 'OUTBOUND_STUDENT_NOT_FOUND',
      status: 'FAILURE',
      detail: `Student ${params.studentId} not found`,
    });
    return {
      success: false,
      error: 'STUDENT_NOT_FOUND',
      message: 'Student record not found',
    };
  }

  // 3. Resolve Target Phone Number
  const rawPhone = params.customPhoneNumber || student.phone || student.whatsapp;
  if (!rawPhone || !rawPhone.trim()) {
    return {
      success: false,
      error: 'PHONE_NUMBER_REQUIRED',
      message: 'Student does not have a valid contact phone number',
    };
  }
  const normalizedPhone = normalizePhoneForSpx(rawPhone);

  // 4. Resolve Tenant College (Optional - not required)
  let collegeId = student.collegeId || student.joinedCollegeId || student.employee?.collegeId;
  let collegeName = student.college?.name || student.employee?.college?.name;
  let collegeCode = student.college?.code || student.employee?.college?.code;

  if (!collegeId) {
    // Attempt fallback from environment or first available college in database
    const envCollegeId = process.env.SPX_DEFAULT_COLLEGE_ID || process.env.DEFAULT_COLLEGE_ID;
    try {
      let fallbackCollege = envCollegeId
        ? await prisma.college.findUnique({ where: { id: envCollegeId } })
        : null;

      if (!fallbackCollege) {
        fallbackCollege = await prisma.college.findFirst({
          where: { isActive: true },
          orderBy: { createdAt: 'asc' },
        }) || await prisma.college.findFirst({
          orderBy: { createdAt: 'asc' },
        });
      }

      if (fallbackCollege) {
        collegeId = fallbackCollege.id;
        collegeName = fallbackCollege.name;
        collegeCode = fallbackCollege.code;
      }
    } catch (e) {
      console.warn('[SPX_OUTBOUND] Could not fetch fallback college:', e);
    }

    if (!collegeId) {
      collegeId = 'DEFAULT';
    }
  }

  collegeName = collegeName || 'Admissions Office';
  collegeCode = collegeCode || 'PRO';

  // 5. Generate Short-Lived M2M JWT for this Call Session
  // This allows SPX tools (lookup, profile, missing-fields, updates, address, follow-up)
  // to authenticate back to PRO securely without compromising credentials.
  const spxM2mToken = issueTestSpxM2MToken(
    {
      collegeId,
      collegeCode,
      permissions: [
        'students:lookup',
        'students:read',
        'students:update',
        'college:read',
        'calls:write',
      ],
    },
    '2h'
  );

  const missingFields = identifyMissingFields(student);
  const proPublicUrl = (process.env.PRO_PUBLIC_URL || 'http://localhost:3000').replace(/\/+$/, '');

  // 6. Build Initial Context for SPX Voice Agent
  const initialContext: Record<string, any> = {
    student_id: student.id,
    student_name: student.studentName,
    customer_number: normalizedPhone,
    phone_number: normalizedPhone,
    college_id: collegeId,
    college_name: collegeName,
    college_code: collegeCode,
    missing_fields: missingFields,
    father_name: student.fatherName || '',
    gender: student.gender || '',
    school_name: student.schoolName || '',
    group: student.group || '',
    spx_token: spxM2mToken,
    pro_api_url: proPublicUrl,
    triggered_by: params.requestedByEmployeeId || 'SYSTEM',
    triggered_role: params.requestedByRole || 'TELECALLER',
  };

  // 7. Dispatch HTTP POST to SPX Voice
  const targetUrl = `${baseUrl}/api/v1/public/agent/${agentUuid}`;
  const requestBody: Record<string, any> = {
    phone_number: normalizedPhone,
    initial_context: initialContext,
  };
  if (telephonyConfigId !== undefined) {
    requestBody.telephony_configuration_id = telephonyConfigId;
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);

    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey,
        'X-Correlation-ID': correlationId,
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    const responseData = await response.json().catch(() => null);

    if (!response.ok) {
      const errorDetail = responseData?.detail || responseData?.message || response.statusText;
      recordAuditLog({
        correlationId,
        collegeId,
        credentialIdentity: params.requestedByEmployeeId || null,
        endpoint,
        action: 'OUTBOUND_DISPATCH_FAILED',
        status: 'FAILURE',
        detail: `SPX returned status ${response.status}: ${JSON.stringify(errorDetail)}`,
      });

      return {
        success: false,
        error: `SPX_${response.status}`,
        message: typeof errorDetail === 'string' ? errorDetail : 'SPX Voice call initiation failed',
      };
    }

    recordAuditLog({
      correlationId,
      collegeId,
      credentialIdentity: params.requestedByEmployeeId || null,
      endpoint,
      action: 'OUTBOUND_CALL_INITIATED',
      status: 'SUCCESS',
      detail: `Call initiated: Run ID ${responseData?.workflow_run_id} (${responseData?.workflow_run_name}) to ${normalizedPhone}`,
    });

    return {
      success: true,
      workflowRunId: responseData?.workflow_run_id,
      workflowRunName: responseData?.workflow_run_name,
      status: responseData?.status || 'initiated',
      message: `Call successfully initiated with SPX Voice (Run ID: ${responseData?.workflow_run_id})`,
    };
  } catch (err: any) {
    const isTimeout = err.name === 'AbortError';
    const message = isTimeout ? 'SPX Voice service timed out after 12s' : (err.message || 'Network error communicating with SPX');

    recordAuditLog({
      correlationId,
      collegeId,
      credentialIdentity: params.requestedByEmployeeId || null,
      endpoint,
      action: 'OUTBOUND_NETWORK_ERROR',
      status: 'FAILURE',
      detail: message,
    });

    return {
      success: false,
      error: isTimeout ? 'SPX_TIMEOUT' : 'SPX_NETWORK_ERROR',
      message,
    };
  }
}

