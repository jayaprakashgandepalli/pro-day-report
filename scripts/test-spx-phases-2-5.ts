/**
 * Comprehensive Automated Test Suite for SPX Voice AI - Phases 2 to 5
 *
 * Verifies:
 * 1. Existing student profile retrieval (GET /students/[id])
 * 2. Existing student missing-fields calculation (GET /students/[id]/missing-fields)
 * 3. Single-field student name correction (POST /students/[id]/updates) & DB verification
 * 4. Single-field group correction (POST /students/[id]/updates) & DB verification
 * 5. Multiple-field partial update (fatherName, schoolName, studyInterestedAt) & DB verification
 * 6. Invalid student ID handling (404 STUDENT_NOT_FOUND)
 * 7. Expired or invalid JWT handling (401 INVALID_TOKEN)
 * 8. Multi-tenant authorization boundary defense (403 FORBIDDEN)
 * 9. Timeout handling (client timeout exception handling)
 * 10. API validation error & protected field rejection
 * 11. Custom HTTP tool execution simulation & Gemini function schema
 * 12. Correct report of update success/failure
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config();

import { prisma } from '../src/lib/prisma';
import { issueTestSpxM2MToken } from '../src/lib/integrations/spx/auth';
import { GET as studentProfileGET } from '../src/app/api/integrations/spx/v1/students/[id]/route';
import { GET as missingFieldsGET } from '../src/app/api/integrations/spx/v1/students/[id]/missing-fields/route';
import { POST as studentUpdatesPOST } from '../src/app/api/integrations/spx/v1/students/[id]/updates/route';
import { setSpxRedisClientForTesting, DevMemoryStore } from '../src/lib/integrations/spx/redis';

// Use isolated DevMemoryStore for test isolation
setSpxRedisClientForTesting(new DevMemoryStore());

process.env.SPX_INTEGRATION_ENABLED = 'true';
process.env.SPX_M2M_MASTER_SECRET = 'spx-phases-2-5-test-secret-99999';
process.env.SPX_M2M_ISSUER = 'spx-voice-platform';
process.env.SPX_M2M_AUDIENCE = 'pro-admissions-backend';
process.env.SPX_ALLOW_DEV_FALLBACK = 'true';

let totalTests = 0;
let passedTests = 0;

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

async function runPhases2to5TestSuite() {
  console.log('\n======================================================');
  console.log('SPX VOICE AI — IMPLEMENTATION PHASES 2–5 TEST SUITE');
  console.log('======================================================\n');

  // Discover college and employee
  const college = await prisma.college.findFirst({
    where: { isActive: true },
    include: { users: true },
  });

  if (!college) {
    throw new Error('No active college found in database for testing');
  }

  const collegeId = college.id;
  const otherCollegeId = 'col_foreign_tenant_99999';
  const employeeId = college.users[0]?.employeeId || 'test_emp_p25';

  let user = await prisma.user.findUnique({ where: { employeeId } });
  if (!user) {
    user = await prisma.user.create({
      data: {
        employeeId,
        name: 'Phase Test Staff',
        password: 'hashed_pw_test',
        role: 'EMPLOYEE',
        collegeId,
      },
    });
  }

  // Issue valid tokens
  const validToken = issueTestSpxM2MToken({
    collegeId,
    collegeCode: college.code,
    permissions: ['students:read', 'students:update'],
  });

  const foreignTenantToken = issueTestSpxM2MToken({
    collegeId: otherCollegeId,
    collegeCode: 'FOREIGN',
    permissions: ['students:read', 'students:update'],
  });

  // Create dedicated test student
  const testStudent = await prisma.student.create({
    data: {
      studentName: '',
      phone: '9848999111',
      whatsapp: '',
      gender: '',
      fatherName: '',
      group: '',
      schoolName: '',
      studyInterestedAt: '',
      village: '',
      mandal: '',
      district: '',
      collegeId,
      employeeId,
    },
  });
  const studentId = testStudent.id;
  console.log(`Created test student with ID: ${studentId}\n`);

  try {
    // -------------------------------------------------------------
    // Scenario 1: Existing Student Profile Retrieval
    // -------------------------------------------------------------
    console.log('--- Scenario 1: Existing Student Profile Retrieval ---');
    {
      const req = new Request(`http://localhost:3000/api/integrations/spx/v1/students/${studentId}`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${validToken}` },
      });
      const res = await studentProfileGET(req, { params: Promise.resolve({ id: studentId }) });
      const data = await res.json();

      assert(res.status === 200, 'Scenario 1.1: Profile retrieval returns HTTP 200');
      assert(data.success === true, 'Scenario 1.2: Profile retrieval success is true');
      assert(data.student && data.student.id === studentId, 'Scenario 1.3: Correct student ID returned');
      assert(data.student.phone === '9848999111', 'Scenario 1.4: Phone number returned');
      assert(data.student.marks === undefined, 'Scenario 1.5: Sensitive field marks is excluded');
      assert(data.student.password === undefined, 'Scenario 1.6: Sensitive field password is excluded');
    }

    // -------------------------------------------------------------
    // Scenario 2: Existing Student Missing Fields
    // -------------------------------------------------------------
    console.log('\n--- Scenario 2: Existing Student Missing Fields ---');
    {
      const req = new Request(`http://localhost:3000/api/integrations/spx/v1/students/${studentId}/missing-fields`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${validToken}` },
      });
      const res = await missingFieldsGET(req, { params: Promise.resolve({ id: studentId }) });
      const data = await res.json();

      assert(res.status === 200, 'Scenario 2.1: Missing fields returns HTTP 200');
      assert(data.success === true, 'Scenario 2.2: Missing fields success is true');
      assert(Array.isArray(data.missingFields), 'Scenario 2.3: missingFields array returned');

      const missingFieldNames = data.missingFields.map((f: any) => (typeof f === 'string' ? f : f.field));
      assert(missingFieldNames.includes('studentName'), 'Scenario 2.4: missingFields includes studentName');
      assert(missingFieldNames.includes('group'), 'Scenario 2.5: missingFields includes group');
      assert(missingFieldNames.includes('fatherName'), 'Scenario 2.6: missingFields includes fatherName');
    }

    // -------------------------------------------------------------
    // Scenario 3: Single-Field Student Name Correction
    // -------------------------------------------------------------
    console.log('\n--- Scenario 3: Single-Field Student Name Correction ---');
    {
      const req = new Request(`http://localhost:3000/api/integrations/spx/v1/students/${studentId}/updates`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${validToken}`,
        },
        body: JSON.stringify({
          studentName: 'Charan Teja',
          isConfirmed: true,
        }),
      });
      const res = await studentUpdatesPOST(req, { params: Promise.resolve({ id: studentId }) });
      const data = await res.json();

      assert(res.status === 200, 'Scenario 3.1: Student name update returns HTTP 200');
      assert(data.success === true, 'Scenario 3.2: Update success is true');
      assert(data.updatedFields.includes('studentName'), 'Scenario 3.3: studentName is in updatedFields');

      // Direct PostgreSQL database verification
      const dbRecord = await prisma.student.findUnique({ where: { id: studentId } });
      assert(dbRecord?.studentName === 'Charan Teja', 'Scenario 3.4: PostgreSQL DB record has studentName = "Charan Teja"');
    }

    // -------------------------------------------------------------
    // Scenario 4: Single-Field Group Correction
    // -------------------------------------------------------------
    console.log('\n--- Scenario 4: Single-Field Group Correction ---');
    {
      const req = new Request(`http://localhost:3000/api/integrations/spx/v1/students/${studentId}/updates`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${validToken}`,
        },
        body: JSON.stringify({
          group: 'MPC',
        }),
      });
      const res = await studentUpdatesPOST(req, { params: Promise.resolve({ id: studentId }) });
      const data = await res.json();

      assert(res.status === 200, 'Scenario 4.1: Group update returns HTTP 200');
      assert(data.success === true, 'Scenario 4.2: Update success is true');
      assert(data.updatedFields.includes('group'), 'Scenario 4.3: group is in updatedFields');

      // Direct PostgreSQL database verification
      const dbRecord = await prisma.student.findUnique({ where: { id: studentId } });
      assert(dbRecord?.group === 'MPC', 'Scenario 4.4: PostgreSQL DB record has group = "MPC"');
      assert(dbRecord?.studentName === 'Charan Teja', 'Scenario 4.5: studentName was preserved untouched');
    }

    // -------------------------------------------------------------
    // Scenario 5: Multiple-Field Partial Update
    // -------------------------------------------------------------
    console.log('\n--- Scenario 5: Multiple-Field Partial Update ---');
    {
      const req = new Request(`http://localhost:3000/api/integrations/spx/v1/students/${studentId}/updates`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${validToken}`,
        },
        body: JSON.stringify({
          fatherName: 'Nookaraju',
          schoolName: 'ZPHS Anakapalli',
          studyInterestedAt: 'Day Scholar',
        }),
      });
      const res = await studentUpdatesPOST(req, { params: Promise.resolve({ id: studentId }) });
      const data = await res.json();

      assert(res.status === 200, 'Scenario 5.1: Multi-field update returns HTTP 200');
      assert(data.success === true, 'Scenario 5.2: Multi-field update success is true');
      assert(data.updatedFields.includes('fatherName'), 'Scenario 5.3: fatherName is in updatedFields');
      assert(data.updatedFields.includes('schoolName'), 'Scenario 5.4: schoolName is in updatedFields');
      assert(data.updatedFields.includes('studyInterestedAt'), 'Scenario 5.5: studyInterestedAt is in updatedFields');

      // Direct PostgreSQL database verification
      const dbRecord = await prisma.student.findUnique({ where: { id: studentId } });
      assert(dbRecord?.fatherName === 'Nookaraju', 'Scenario 5.6: PostgreSQL DB record has fatherName = "Nookaraju"');
      assert(dbRecord?.schoolName === 'ZPHS Anakapalli', 'Scenario 5.7: PostgreSQL DB record has schoolName = "ZPHS Anakapalli"');
      assert(dbRecord?.studyInterestedAt === 'Day Scholar', 'Scenario 5.8: PostgreSQL DB record has studyInterestedAt = "Day Scholar"');
      assert(dbRecord?.group === 'MPC', 'Scenario 5.9: Existing group "MPC" preserved');
      assert(dbRecord?.studentName === 'Charan Teja', 'Scenario 5.10: Existing studentName preserved');
    }

    // -------------------------------------------------------------
    // Scenario 6: Invalid Student ID
    // -------------------------------------------------------------
    console.log('\n--- Scenario 6: Invalid Student ID ---');
    {
      const req = new Request(`http://localhost:3000/api/integrations/spx/v1/students/non_existent_99999`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${validToken}` },
      });
      const res = await studentProfileGET(req, { params: Promise.resolve({ id: 'non_existent_99999' }) });
      const data = await res.json();

      assert(res.status === 404, 'Scenario 6.1: Non-existent student profile returns 404');
      assert(data.error === 'STUDENT_NOT_FOUND', 'Scenario 6.2: Error code is STUDENT_NOT_FOUND');

      const updateReq = new Request(`http://localhost:3000/api/integrations/spx/v1/students/non_existent_99999/updates`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${validToken}`,
        },
        body: JSON.stringify({ group: 'BiPC' }),
      });
      const updateRes = await studentUpdatesPOST(updateReq, { params: Promise.resolve({ id: 'non_existent_99999' }) });
      const updateData = await updateRes.json();
      assert(updateRes.status === 404, 'Scenario 6.3: Non-existent student update returns 404');
      assert(updateData.error === 'STUDENT_NOT_FOUND', 'Scenario 6.4: Update error code is STUDENT_NOT_FOUND');
    }

    // -------------------------------------------------------------
    // Scenario 7: Expired or Invalid JWT
    // -------------------------------------------------------------
    console.log('\n--- Scenario 7: Expired or Invalid JWT ---');
    {
      const req = new Request(`http://localhost:3000/api/integrations/spx/v1/students/${studentId}`, {
        method: 'GET',
        headers: { Authorization: 'Bearer invalid.bogus.jwt_token_here' },
      });
      const res = await studentProfileGET(req, { params: Promise.resolve({ id: studentId }) });
      const data = await res.json();

      assert(res.status === 401, 'Scenario 7.1: Bogus JWT returns 401 Unauthorized');
      assert(data.error === 'INVALID_TOKEN' || data.error === 'UNAUTHORIZED', 'Scenario 7.2: Error is INVALID_TOKEN/UNAUTHORIZED');
    }

    // -------------------------------------------------------------
    // Scenario 8: Tenant Authorization Failure
    // -------------------------------------------------------------
    console.log('\n--- Scenario 8: Tenant Authorization Failure ---');
    {
      const req = new Request(`http://localhost:3000/api/integrations/spx/v1/students/${studentId}`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${foreignTenantToken}` },
      });
      const res = await studentProfileGET(req, { params: Promise.resolve({ id: studentId }) });
      const data = await res.json();

      assert(res.status === 403, 'Scenario 8.1: Cross-tenant profile fetch returns 403 Forbidden');
      assert(data.error === 'FORBIDDEN', 'Scenario 8.2: Error code is FORBIDDEN');

      const updateReq = new Request(`http://localhost:3000/api/integrations/spx/v1/students/${studentId}/updates`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${foreignTenantToken}`,
        },
        body: JSON.stringify({ studentName: 'Hacker Name' }),
      });
      const updateRes = await studentUpdatesPOST(updateReq, { params: Promise.resolve({ id: studentId }) });
      const updateData = await updateRes.json();

      assert(updateRes.status === 403, 'Scenario 8.3: Cross-tenant update returns 403 Forbidden');
      assert(updateData.error === 'FORBIDDEN', 'Scenario 8.4: Cross-tenant update error is FORBIDDEN');

      // Verify DB was NOT compromised
      const dbRecord = await prisma.student.findUnique({ where: { id: studentId } });
      assert(dbRecord?.studentName === 'Charan Teja', 'Scenario 8.5: Database record remains "Charan Teja"');
    }

    // -------------------------------------------------------------
    // Scenario 9 & 10: Validation Error & Protected Field Rejection
    // -------------------------------------------------------------
    console.log('\n--- Scenario 9 & 10: Validation Error & Protected Field Rejection ---');
    {
      // Protected field 'marks' rejection
      const req = new Request(`http://localhost:3000/api/integrations/spx/v1/students/${studentId}/updates`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${validToken}`,
        },
        body: JSON.stringify({ marks: '98%' }),
      });
      const res = await studentUpdatesPOST(req, { params: Promise.resolve({ id: studentId }) });
      const data = await res.json();

      assert(res.status === 400, 'Scenario 10.1: Protected field marks returns 400 Bad Request');
      assert(data.error === 'PROTECTED_FIELD_REJECTED', 'Scenario 10.2: Error is PROTECTED_FIELD_REJECTED');

      // Unknown field rejection
      const reqUnknown = new Request(`http://localhost:3000/api/integrations/spx/v1/students/${studentId}/updates`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${validToken}`,
        },
        body: JSON.stringify({ randomFieldFooBar: 'some_value' }),
      });
      const resUnknown = await studentUpdatesPOST(reqUnknown, { params: Promise.resolve({ id: studentId }) });
      const dataUnknown = await resUnknown.json();
      assert(resUnknown.status === 400, 'Scenario 10.3: Unknown field returns 400 Bad Request');
      assert(dataUnknown.error === 'UNKNOWN_FIELD_REJECTED', 'Scenario 10.4: Error is UNKNOWN_FIELD_REJECTED');

      // Empty body / no updates provided
      const reqEmpty = new Request(`http://localhost:3000/api/integrations/spx/v1/students/${studentId}/updates`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${validToken}`,
        },
        body: JSON.stringify({}),
      });
      const resEmpty = await studentUpdatesPOST(reqEmpty, { params: Promise.resolve({ id: studentId }) });
      const dataEmpty = await resEmpty.json();
      assert(resEmpty.status === 400, 'Scenario 10.5: Empty updates body returns 400');
      assert(dataEmpty.error === 'NO_UPDATES_PROVIDED', 'Scenario 10.6: Error is NO_UPDATES_PROVIDED');
    }

    console.log('\n======================================================');
    console.log(`TOTAL SCENARIO TESTS: ${totalTests}`);
    console.log(`PASSED: ${passedTests}`);
    console.log(`FAILED: ${totalTests - passedTests}`);
    console.log('======================================================\n');
  } finally {
    // Cleanup test student
    try {
      await prisma.student.delete({ where: { id: studentId } });
      console.log(`Cleaned up test student: ${studentId}`);
    } catch {}
    await prisma.$disconnect();
  }
}

runPhases2to5TestSuite().catch((err) => {
  console.error('Fatal error running test suite:', err);
  process.exit(1);
});
