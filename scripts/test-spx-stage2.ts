/**
 * Automated Verification Suite for SPX Voice AI Integration - Stage 2 Business APIs
 * Tests Student Lookup, Allowlisted Profile, Missing Fields, College Info, College Knowledge,
 * Fill-Only Updates, Cross-Tenant Protection, and Regression Safety.
 */

import { prisma } from '../src/lib/prisma';
import { issueTestSpxM2MToken } from '../src/lib/integrations/spx/auth';
import { POST as lookupPOST } from '../src/app/api/integrations/spx/v1/students/lookup/route';
import { GET as profileGET } from '../src/app/api/integrations/spx/v1/students/[id]/route';
import { GET as missingFieldsGET } from '../src/app/api/integrations/spx/v1/students/[id]/missing-fields/route';
import { GET as collegeInfoGET } from '../src/app/api/integrations/spx/v1/college/information/route';
import { GET as collegeKnowledgeGET } from '../src/app/api/integrations/spx/v1/college/knowledge/route';
import { POST as updatesPOST } from '../src/app/api/integrations/spx/v1/students/[id]/updates/route';
import { verifyToken, signToken } from '../src/lib/auth';

// Ensure test environment variables
process.env.SPX_INTEGRATION_ENABLED = 'true';
process.env.SPX_M2M_MASTER_SECRET = 'stage2-verification-secret-key-999';
process.env.SPX_M2M_ISSUER = 'spx-voice-platform';
process.env.SPX_M2M_AUDIENCE = 'pro-admissions-backend';
process.env.SPX_ALLOW_DEV_FALLBACK = 'true';

let passedTests = 0;
let totalTests = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  [PASS] ${testName}`);
  } else {
    console.error(`  [FAIL] ${testName}${detail ? ` - ${detail}` : ''}`);
    process.exitCode = 1;
  }
}

async function runStage2Suite() {
  console.log('\n======================================================');
  console.log('SPX VOICE INTEGRATION - STAGE 2 BUSINESS APIS VERIFICATION');
  console.log('======================================================\n');

  // Discover valid college and employee in test DB
  const college = await prisma.college.findFirst({
    where: { isActive: true },
    include: { users: true },
  });

  if (!college) {
    throw new Error('No active college found in database for testing');
  }

  const collegeId = college.id;
  const otherCollegeId = 'col_hostile_tenant_99999';

  // Tokens for authenticated college and unauthorized college
  const validToken = issueTestSpxM2MToken({
    collegeId,
    collegeCode: college.code,
    permissions: [
      'students:lookup',
      'students:read',
      'students:update',
      'college:read',
    ],
  });

  const otherTenantToken = issueTestSpxM2MToken({
    collegeId: otherCollegeId,
    collegeCode: 'OTHER',
    permissions: [
      'students:lookup',
      'students:read',
      'students:update',
      'college:read',
    ],
  });

  const lowPermissionToken = issueTestSpxM2MToken({
    collegeId,
    permissions: ['college:read'], // Lacks students:lookup, students:read, students:update
  });

  // Find or create test student
  let employee = college.users.find((u) => u.role === 'EMPLOYEE' || u.role === 'COLLEGE');
  if (!employee) {
    employee = college.users[0] || (await prisma.user.findFirst());
  }

  const existingStudent = await prisma.student.findFirst({
    where: {
      OR: [
        { collegeId },
        { employee: { collegeId } },
      ],
    },
  });

  const testStudentId = existingStudent?.id || 'cmvas8p5a0000zphabyb2lfi8';
  const testStudentPhone = existingStudent?.phone || '9848112233';

  // -----------------------------------------------------------------
  // TEST 1: Missing or Invalid M2M Authentication
  // -----------------------------------------------------------------
  console.log('--- Test 1: M2M Authentication & Permissions Enforcement ---');

  // 1.1 Absent Header
  {
    const req = new Request('http://localhost/api/integrations/spx/v1/students/lookup', {
      method: 'POST',
      body: JSON.stringify({ phone: '9848112233' }),
    });
    const res = await lookupPOST(req);
    const body = await res.json();
    assert(
      res.status === 401 && body.error === 'MISSING_CREDENTIALS',
      'Lookup rejects request without Authorization header (401 MISSING_CREDENTIALS)'
    );
  }

  // 1.2 Insufficient Scope
  {
    const req = new Request('http://localhost/api/integrations/spx/v1/students/lookup', {
      method: 'POST',
      headers: { Authorization: `Bearer ${lowPermissionToken}` },
      body: JSON.stringify({ phone: '9848112233' }),
    });
    const res = await lookupPOST(req);
    const body = await res.json();
    assert(
      res.status === 403 && body.error === 'INSUFFICIENT_PERMISSIONS',
      'Lookup rejects token lacking "students:lookup" permission with 403'
    );
  }

  // -----------------------------------------------------------------
  // TEST 2 & 5: Multi-Tenant Isolation & Nullable collegeId Fallback
  // -----------------------------------------------------------------
  console.log('\n--- Test 2 & 5: Multi-Tenant Isolation & Nullable collegeId Fallback ---');

  // 2.1 Cross-Tenant Profile Access Blocked
  {
    const req = new Request(`http://localhost/api/integrations/spx/v1/students/${testStudentId}`, {
      headers: { Authorization: `Bearer ${otherTenantToken}` },
    });
    const res = await profileGET(req, { params: Promise.resolve({ id: testStudentId }) });
    const body = await res.json();
    assert(
      res.status === 403 && body.error === 'FORBIDDEN',
      'Unauthorized college token is blocked with 403 FORBIDDEN when accessing student'
    );
  }

  // 2.2 Client-Supplied CollegeId Spoofing Blocked
  {
    const req = new Request('http://localhost/api/integrations/spx/v1/students/lookup', {
      method: 'POST',
      headers: { Authorization: `Bearer ${validToken}` },
      body: JSON.stringify({ phone: testStudentPhone, collegeId: otherCollegeId }),
    });
    const res = await lookupPOST(req);
    const body = await res.json();
    assert(
      res.status === 403 && body.error === 'TENANT_MISMATCH_DETECTED',
      'assertNoTenantMismatch blocks spoofed collegeId parameter in body with 403'
    );
  }

  // -----------------------------------------------------------------
  // TEST 3: Phone Normalization & No-Match Results
  // -----------------------------------------------------------------
  console.log('\n--- Test 3: Phone Normalization & Search ---');

  // 3.1 Normalization matches numbers with +91, spaces, hyphens
  {
    const formattedPhone = `+91 ${testStudentPhone.slice(0, 5)}-${testStudentPhone.slice(5)}`;
    const req = new Request('http://localhost/api/integrations/spx/v1/students/lookup', {
      method: 'POST',
      headers: { Authorization: `Bearer ${validToken}` },
      body: JSON.stringify({ phone: formattedPhone }),
    });
    const res = await lookupPOST(req);
    const body = await res.json();
    assert(
      res.status === 200 &&
      body.success === true &&
      (body.status === 'FOUND' || body.status === 'MULTIPLE_MATCHES') &&
      body.candidates.length >= 1,
      'Phone normalization correctly strips +91, spaces, and hyphens to match student'
    );
  }

  // 3.2 No-Match Result
  {
    const nonExistentPhone = '9999900000';
    const req = new Request('http://localhost/api/integrations/spx/v1/students/lookup', {
      method: 'POST',
      headers: { Authorization: `Bearer ${validToken}` },
      body: JSON.stringify({ phone: nonExistentPhone }),
    });
    const res = await lookupPOST(req);
    const body = await res.json();
    assert(
      res.status === 200 &&
      body.success === true &&
      body.status === 'NOT_FOUND' &&
      body.matchesCount === 0 &&
      Array.isArray(body.candidates) &&
      body.candidates.length === 0,
      'Unmatched phone number returns clean 200 NOT_FOUND response with empty candidates'
    );
  }

  // -----------------------------------------------------------------
  // TEST 4: Multiple Students Matching Same Phone Number
  // -----------------------------------------------------------------
  console.log('\n--- Test 4: Multiple Matching Students Disambiguation ---');
  {
    // Create 2 test students with same shared family phone number
    const sharedPhone = '9911991199';
    const s1 = await prisma.student.create({
      data: {
        studentName: 'Sibling One (Test)',
        phone: sharedPhone,
        group: 'MPC',
        collegeId,
        employeeId: employee?.employeeId || 'test',
        schoolName: 'Test High School A',
      },
    });

    const s2 = await prisma.student.create({
      data: {
        studentName: 'Sibling Two (Test)',
        phone: sharedPhone,
        group: 'BiPC',
        collegeId,
        employeeId: employee?.employeeId || 'test',
        schoolName: 'Test High School B',
      },
    });

    try {
      const req = new Request('http://localhost/api/integrations/spx/v1/students/lookup', {
        method: 'POST',
        headers: { Authorization: `Bearer ${validToken}` },
        body: JSON.stringify({ phone: sharedPhone }),
      });
      const res = await lookupPOST(req);
      const body = await res.json();

      assert(
        res.status === 200 &&
        body.status === 'MULTIPLE_MATCHES' &&
        body.matchesCount >= 2 &&
        body.candidates.some((c: any) => c.id === s1.id) &&
        body.candidates.some((c: any) => c.id === s2.id),
        'Lookup returns MULTIPLE_MATCHES with distinguishing details when phone is shared'
      );
    } finally {
      // Clean up test siblings
      await prisma.student.deleteMany({
        where: { id: { in: [s1.id, s2.id] } },
      });
    }
  }

  // -----------------------------------------------------------------
  // TEST 6: Student Profile Allowlisted Fields (Privacy Verification)
  // -----------------------------------------------------------------
  console.log('\n--- Test 6: Allowlisted Student Profile & Sensitive Data Redaction ---');
  {
    const req = new Request(`http://localhost/api/integrations/spx/v1/students/${testStudentId}`, {
      headers: { Authorization: `Bearer ${validToken}` },
    });
    const res = await profileGET(req, { params: Promise.resolve({ id: testStudentId }) });
    const body = await res.json();

    assert(
      res.status === 200 &&
      body.success === true &&
      body.student.id === testStudentId &&
      body.student.marks === undefined && // SENSITIVE: MUST BE OMITTED
      body.student.remarks === undefined && // SENSITIVE: MUST BE OMITTED
      body.student.password === undefined && // SENSITIVE: MUST BE OMITTED
      body.student.employeeId === undefined && // INTERNAL STAFF: MUST BE OMITTED
      body.student.studentName !== undefined,
      'Student profile returns approved admissions fields and strictly redacts marks, remarks, and employeeId'
    );
  }

  // -----------------------------------------------------------------
  // TEST 7: Missing-Field Calculation
  // -----------------------------------------------------------------
  console.log('\n--- Test 7: Missing-Field Calculation Engine ---');
  {
    const req = new Request(`http://localhost/api/integrations/spx/v1/students/${testStudentId}/missing-fields`, {
      headers: { Authorization: `Bearer ${validToken}` },
    });
    const res = await missingFieldsGET(req, { params: Promise.resolve({ id: testStudentId }) });
    const body = await res.json();

    assert(
      res.status === 200 &&
      body.success === true &&
      typeof body.missingCount === 'number' &&
      Array.isArray(body.missingFields) &&
      body.missingFields.every((f: any) => f.field && f.label && f.category),
      'missing-fields route calculates empty fields on server and provides human-readable labels'
    );
  }

  // -----------------------------------------------------------------
  // TEST 8: Tenant-Scoped College Information
  // -----------------------------------------------------------------
  console.log('\n--- Test 8: Tenant-Scoped College Information ---');
  {
    const req = new Request('http://localhost/api/integrations/spx/v1/college/information', {
      headers: { Authorization: `Bearer ${validToken}` },
    });
    const res = await collegeInfoGET(req);
    const body = await res.json();

    assert(
      res.status === 200 &&
      body.success === true &&
      body.college.id === collegeId &&
      body.college.code === college.code &&
      body.college.name === college.name &&
      Array.isArray(body.branches) &&
      body.college.fees === undefined, // Verifies unverified fees are NOT invented
      'college/information returns authenticated college profile and active branches without inventing facts'
    );
  }

  // -----------------------------------------------------------------
  // TEST 9: Approved College Knowledge Retrieval
  // -----------------------------------------------------------------
  console.log('\n--- Test 9: Approved College Knowledge Retrieval ---');
  {
    const req = new Request('http://localhost/api/integrations/spx/v1/college/knowledge', {
      headers: { Authorization: `Bearer ${validToken}` },
    });
    const res = await collegeKnowledgeGET(req);
    const body = await res.json();

    assert(
      res.status === 200 &&
      body.success === true &&
      Array.isArray(body.knowledge) &&
      body.knowledge.every((k: any) => k.category && k.fact && k.source),
      'college/knowledge returns approved academic streams and knowledge facts with provenance source'
    );
  }

  // -----------------------------------------------------------------
  // TEST 10: Fill-Only Student Updates & Conflict Detection
  // -----------------------------------------------------------------
  console.log('\n--- Test 10: Fill-Only Student Updates & Conflict Detection ---');
  {
    // Create a temporary test student with known empty and filled fields
    const updateStudent = await prisma.student.create({
      data: {
        studentName: 'Fill Only Test Student',
        phone: '9848999888',
        fatherName: 'Original Father Name',
        group: 'MPC',
        educationStage: null, // EMPTY -> Safe to fill
        studyInterestedAt: null, // EMPTY -> Safe to fill
        collegeId,
        employeeId: employee?.employeeId || 'test',
      },
    });

    try {
      // 10.1 Fill empty field and attempt conflicting update on populated field
      const req = new Request(`http://localhost/api/integrations/spx/v1/students/${updateStudent.id}/updates`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${validToken}` },
        body: JSON.stringify({
          updates: {
            educationStage: '10th Standard', // Was empty -> should be updated
            fatherName: 'Contradictory New Father Name', // Was populated -> must NOT overwrite, must flag conflict
          },
        }),
      });
      const res = await updatesPOST(req, { params: Promise.resolve({ id: updateStudent.id }) });
      const body = await res.json();

      assert(
        res.status === 200 &&
        body.success === true &&
        body.updatedFields.includes('educationStage') &&
        !body.updatedFields.includes('fatherName') &&
        body.conflictsRequiringReview.some((c: any) => c.field === 'fatherName'),
        'Fill-Only policy fills empty educationStage and refuses to overwrite fatherName, reporting conflict'
      );

      // Verify in Database directly
      const dbCheck = await prisma.student.findUnique({ where: { id: updateStudent.id } });
      assert(
        dbCheck?.educationStage === '10th Standard' &&
        dbCheck?.fatherName === 'Original Father Name',
        'Database verifies empty field was populated and existing field was preserved untouched'
      );
    } finally {
      await prisma.student.delete({ where: { id: updateStudent.id } });
    }
  }

  // -----------------------------------------------------------------
  // TEST 11: Rejection of Protected & Unknown Fields
  // -----------------------------------------------------------------
  console.log('\n--- Test 11: Rejection of Protected & Unknown Fields ---');
  {
    // 11.1 Protected field attempt (marks)
    const reqMarks = new Request(`http://localhost/api/integrations/spx/v1/students/${testStudentId}/updates`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${validToken}` },
      body: JSON.stringify({
        updates: { marks: '600/600' },
      }),
    });
    const resMarks = await updatesPOST(reqMarks, { params: Promise.resolve({ id: testStudentId }) });
    const bodyMarks = await resMarks.json();
    assert(
      resMarks.status === 400 && bodyMarks.error === 'PROTECTED_FIELD_REJECTED',
      'Update route rejects modification of protected field "marks" with 400 PROTECTED_FIELD_REJECTED'
    );

    // 11.2 Protected field attempt (collegeId)
    const reqCollegeId = new Request(`http://localhost/api/integrations/spx/v1/students/${testStudentId}/updates`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${validToken}` },
      body: JSON.stringify({
        updates: { collegeId: 'col_fake_999' },
      }),
    });
    const resCollegeId = await updatesPOST(reqCollegeId, { params: Promise.resolve({ id: testStudentId }) });
    const bodyCollegeId = await resCollegeId.json();
    assert(
      resCollegeId.status === 400 && bodyCollegeId.error === 'PROTECTED_FIELD_REJECTED',
      'Update route rejects tenant re-assignment via "collegeId" with 400 PROTECTED_FIELD_REJECTED'
    );

    // 11.3 Unknown field attempt
    const reqUnknown = new Request(`http://localhost/api/integrations/spx/v1/students/${testStudentId}/updates`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${validToken}` },
      body: JSON.stringify({
        updates: { maliciousInjectedField: 'hack' },
      }),
    });
    const resUnknown = await updatesPOST(reqUnknown, { params: Promise.resolve({ id: testStudentId }) });
    const bodyUnknown = await resUnknown.json();
    assert(
      resUnknown.status === 400 && bodyUnknown.error === 'UNKNOWN_FIELD_REJECTED',
      'Update route rejects unknown arbitrary fields with 400 UNKNOWN_FIELD_REJECTED'
    );
  }

  // -----------------------------------------------------------------
  // TEST 12: Zero-Regression on Human Authentication
  // -----------------------------------------------------------------
  console.log('\n--- Test 12: Existing PRO Authentication & Workflows Unaffected ---');
  {
    const humanPayload = {
      userId: 'emp_human_001',
      employeeId: '9010737882',
      role: 'EMPLOYEE',
      collegeId: 'col_aurora_001',
    };

    const humanJwt = signToken(humanPayload);
    const decoded = verifyToken(humanJwt) as typeof humanPayload;

    assert(
      decoded &&
      decoded.employeeId === '9010737882' &&
      decoded.role === 'EMPLOYEE',
      'Existing PRO human authentication (signToken/verifyToken) functions identically with zero regression'
    );
  }

  // -----------------------------------------------------------------
  // VERIFICATION SUMMARY
  // -----------------------------------------------------------------
  console.log('\n======================================================');
  console.log(`RESULTS: ${passedTests} / ${totalTests} TESTS PASSED`);
  console.log('======================================================\n');

  if (passedTests === totalTests) {
    console.log('>>> ALL STAGE 2 BUSINESS API TESTS PASSED SUCCESSFULLY! <<<\n');
  } else {
    console.error('>>> SOME STAGE 2 TESTS FAILED. CHECK LOGS ABOVE. <<<\n');
    process.exit(1);
  }
}

runStage2Suite()
  .catch((err) => {
    console.error('FATAL TEST ERROR:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
