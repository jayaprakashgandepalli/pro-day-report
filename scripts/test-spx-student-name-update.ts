/**
 * Automated Verification Suite for SPX Voice AI - Student Name Fill-Only Updates
 * Tests:
 * 1. Fill missing studentName when empty string ("")
 * 2. Fill missing studentName when whitespace ("   ")
 * 3. Never overwrite existing studentName (EXISTING_VALUE_CONFLICT)
 * 4. Mark unchanged when matching existing studentName (case-insensitive & trimmed)
 * 5. Reject empty or whitespace-only submitted studentName (INVALID_STUDENT_NAME)
 * 6. Reject unconfirmed / placeholder studentName (UNCONFIRMED_NAME_REJECTED)
 * 7. Enforce multi-tenant boundary defense (cross-tenant 403 Forbidden)
 * 8. Missing-fields calculation includes missing studentName as mandatory
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config();

import { prisma } from '../src/lib/prisma';
import { issueTestSpxM2MToken } from '../src/lib/integrations/spx/auth';
import { POST as updatesPOST } from '../src/app/api/integrations/spx/v1/students/[id]/updates/route';
import { GET as missingFieldsGET } from '../src/app/api/integrations/spx/v1/students/[id]/missing-fields/route';
import { setSpxRedisClientForTesting, DevMemoryStore } from '../src/lib/integrations/spx/redis';

process.env.SPX_INTEGRATION_ENABLED = 'true';
process.env.SPX_M2M_MASTER_SECRET = 'student-name-test-master-secret-12345';
process.env.SPX_M2M_ISSUER = 'spx-voice-platform';
process.env.SPX_M2M_AUDIENCE = 'pro-admissions-backend';
process.env.SPX_ALLOW_DEV_FALLBACK = 'true';

// Use isolated DevMemoryStore for test predictability
setSpxRedisClientForTesting(new DevMemoryStore());

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

async function runStudentNameTestSuite() {
  console.log('\n======================================================');
  console.log('SPX VOICE INTEGRATION - STUDENT NAME FILL-ONLY VERIFICATION');
  console.log('======================================================\n');

  // Discover an active college and employee
  const college = await prisma.college.findFirst({
    where: { isActive: true },
    include: { users: true },
  });

  if (!college) {
    throw new Error('No active college found in database for testing');
  }

  const collegeId = college.id;
  const otherCollegeId = 'col_hostile_tenant_88888';
  const employeeId = college.users[0]?.employeeId || 'test_emp_001';

  // Ensure employee exists
  let user = await prisma.user.findUnique({ where: { employeeId } });
  if (!user) {
    user = await prisma.user.create({
      data: {
        employeeId,
        name: 'Test Staff',
        password: 'hashed_pw_test',
        role: 'EMPLOYEE',
        collegeId,
      },
    });
  }

  const validToken = issueTestSpxM2MToken({
    collegeId,
    collegeCode: college.code,
    permissions: ['students:read', 'students:update'],
  });

  const otherTenantToken = issueTestSpxM2MToken({
    collegeId: otherCollegeId,
    collegeCode: 'OTHER',
    permissions: ['students:read', 'students:update'],
  });

  // -----------------------------------------------------------------
  // TEST 1: Fill missing studentName when empty string ("")
  // -----------------------------------------------------------------
  console.log('--- Test 1: Fill missing studentName when empty string ---');
  {
    const student1 = await prisma.student.create({
      data: {
        studentName: '',
        phone: '9848111222',
        fatherName: 'Ramana Rao',
        group: 'MPC',
        collegeId,
        employeeId: user.employeeId,
      },
    });

    try {
      const req = new Request(`http://localhost/api/integrations/spx/v1/students/${student1.id}/updates`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${validToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          updates: {
            studentName: '  Rohan Sharma  ', // Leading and trailing whitespace
          },
        }),
      });

      const res = await updatesPOST(req, { params: Promise.resolve({ id: student1.id }) });
      const body = await res.json();

      assert(res.status === 200, 'Test 1.1: Response status is 200');
      assert(body.success === true, 'Test 1.2: Response success is true');
      assert(
        Array.isArray(body.updatedFields) && body.updatedFields.includes('studentName'),
        'Test 1.3: studentName is returned in updatedFields'
      );
      assert(
        Array.isArray(body.conflictsRequiringReview) && body.conflictsRequiringReview.length === 0,
        'Test 1.4: conflictsRequiringReview is empty'
      );

      // Verify in DB directly: leading and trailing whitespace trimmed
      const dbStudent = await prisma.student.findUnique({ where: { id: student1.id } });
      assert(
        dbStudent?.studentName === 'Rohan Sharma',
        'Test 1.5: Database record updated with trimmed student name'
      );
    } finally {
      await prisma.student.delete({ where: { id: student1.id } });
    }
  }

  // -----------------------------------------------------------------
  // TEST 2: Fill missing studentName when whitespace ("   ")
  // -----------------------------------------------------------------
  console.log('\n--- Test 2: Fill missing studentName when whitespace ---');
  {
    const student2 = await prisma.student.create({
      data: {
        studentName: '   ',
        phone: '9848111333',
        fatherName: 'Venkatesh Rao',
        group: 'BiPC',
        collegeId,
        employeeId: user.employeeId,
      },
    });

    try {
      const req = new Request(`http://localhost/api/integrations/spx/v1/students/${student2.id}/updates`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${validToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          updates: {
            studentName: 'Priya Patel',
          },
        }),
      });

      const res = await updatesPOST(req, { params: Promise.resolve({ id: student2.id }) });
      const body = await res.json();

      assert(res.status === 200, 'Test 2.1: Response status is 200');
      assert(body.success === true, 'Test 2.2: Response success is true');
      assert(
        Array.isArray(body.updatedFields) && body.updatedFields.includes('studentName'),
        'Test 2.3: studentName is returned in updatedFields'
      );

      const dbStudent = await prisma.student.findUnique({ where: { id: student2.id } });
      assert(
        dbStudent?.studentName === 'Priya Patel',
        'Test 2.4: Database record updated from whitespace to "Priya Patel"'
      );
    } finally {
      await prisma.student.delete({ where: { id: student2.id } });
    }
  }

  // -----------------------------------------------------------------
  // TEST 3: Never overwrite an existing studentName (Conflict Review)
  // -----------------------------------------------------------------
  console.log('\n--- Test 3: Never overwrite an existing studentName ---');
  {
    const student3 = await prisma.student.create({
      data: {
        studentName: 'Kavitha Reddy',
        phone: '9848111444',
        group: 'CEC',
        collegeId,
        employeeId: user.employeeId,
      },
    });

    try {
      const req = new Request(`http://localhost/api/integrations/spx/v1/students/${student3.id}/updates`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${validToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          updates: {
            studentName: 'Ananya Sharma', // Conflicting candidate name
          },
        }),
      });

      const res = await updatesPOST(req, { params: Promise.resolve({ id: student3.id }) });
      const body = await res.json();

      assert(res.status === 200, 'Test 3.1: Response status is 200');
      assert(body.success === true, 'Test 3.2: Response success is true');
      assert(
        !body.updatedFields.includes('studentName'),
        'Test 3.3: studentName is NOT in updatedFields'
      );
      assert(
        body.conflictsRequiringReview.some(
          (c: any) =>
            c.field === 'studentName' &&
            c.existingValue === 'Kavitha Reddy' &&
            c.submittedValue === 'Ananya Sharma' &&
            c.reason === 'EXISTING_VALUE_CONFLICT'
        ),
        'Test 3.4: conflictsRequiringReview contains EXISTING_VALUE_CONFLICT with both names'
      );

      // Verify in DB directly: existing name preserved untouched
      const dbStudent = await prisma.student.findUnique({ where: { id: student3.id } });
      assert(
        dbStudent?.studentName === 'Kavitha Reddy',
        'Test 3.5: Database studentName remains "Kavitha Reddy" untouched'
      );
    } finally {
      await prisma.student.delete({ where: { id: student3.id } });
    }
  }

  // -----------------------------------------------------------------
  // TEST 4: Mark unchanged when identical name submitted
  // -----------------------------------------------------------------
  console.log('\n--- Test 4: Mark unchanged when identical name submitted ---');
  {
    const student4 = await prisma.student.create({
      data: {
        studentName: 'Kavitha Reddy',
        phone: '9848111555',
        group: 'MPC',
        collegeId,
        employeeId: user.employeeId,
      },
    });

    try {
      const req = new Request(`http://localhost/api/integrations/spx/v1/students/${student4.id}/updates`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${validToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          updates: {
            studentName: '  kavitha reddy  ', // Case-insensitive and trimmed match
          },
        }),
      });

      const res = await updatesPOST(req, { params: Promise.resolve({ id: student4.id }) });
      const body = await res.json();

      assert(res.status === 200, 'Test 4.1: Response status is 200');
      assert(
        Array.isArray(body.unchangedFields) && body.unchangedFields.includes('studentName'),
        'Test 4.2: studentName is returned in unchangedFields'
      );
      assert(
        body.updatedFields.length === 0,
        'Test 4.3: updatedFields is empty'
      );
      assert(
        body.conflictsRequiringReview.length === 0,
        'Test 4.4: conflictsRequiringReview is empty'
      );
    } finally {
      await prisma.student.delete({ where: { id: student4.id } });
    }
  }

  // -----------------------------------------------------------------
  // TEST 5: Reject empty or whitespace-only submitted studentName
  // -----------------------------------------------------------------
  console.log('\n--- Test 5: Reject empty or whitespace-only submitted studentName ---');
  {
    const student5 = await prisma.student.create({
      data: {
        studentName: '',
        phone: '9848111666',
        group: 'MEC',
        collegeId,
        employeeId: user.employeeId,
      },
    });

    try {
      // 5.1 Empty string
      const reqEmpty = new Request(`http://localhost/api/integrations/spx/v1/students/${student5.id}/updates`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${validToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          updates: { studentName: '' },
        }),
      });

      const resEmpty = await updatesPOST(reqEmpty, { params: Promise.resolve({ id: student5.id }) });
      const bodyEmpty = await resEmpty.json();

      assert(resEmpty.status === 400, 'Test 5.1: Submitting empty studentName returns 400');
      assert(
        bodyEmpty.error === 'INVALID_STUDENT_NAME',
        'Test 5.2: Error code is INVALID_STUDENT_NAME'
      );

      // 5.2 Whitespace only
      const reqWhitespace = new Request(`http://localhost/api/integrations/spx/v1/students/${student5.id}/updates`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${validToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          updates: { studentName: '     ' },
        }),
      });

      const resWhitespace = await updatesPOST(reqWhitespace, { params: Promise.resolve({ id: student5.id }) });
      const bodyWhitespace = await resWhitespace.json();

      assert(resWhitespace.status === 400, 'Test 5.3: Submitting whitespace studentName returns 400');
      assert(
        bodyWhitespace.error === 'INVALID_STUDENT_NAME',
        'Test 5.4: Error code is INVALID_STUDENT_NAME'
      );
    } finally {
      await prisma.student.delete({ where: { id: student5.id } });
    }
  }

  // -----------------------------------------------------------------
  // TEST 6: Reject unconfirmed or placeholder studentName
  // -----------------------------------------------------------------
  console.log('\n--- Test 6: Reject unconfirmed or placeholder studentName ---');
  {
    const student6 = await prisma.student.create({
      data: {
        studentName: '',
        phone: '9848111777',
        group: 'HEC',
        collegeId,
        employeeId: user.employeeId,
      },
    });

    try {
      // 6.1 Placeholder "unknown"
      const reqUnknown = new Request(`http://localhost/api/integrations/spx/v1/students/${student6.id}/updates`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${validToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          updates: { studentName: 'unknown' },
        }),
      });
      const resUnknown = await updatesPOST(reqUnknown, { params: Promise.resolve({ id: student6.id }) });
      const bodyUnknown = await resUnknown.json();

      assert(resUnknown.status === 400, 'Test 6.1: Submitting placeholder "unknown" returns 400');
      assert(
        bodyUnknown.error === 'UNCONFIRMED_NAME_REJECTED',
        'Test 6.2: Error code is UNCONFIRMED_NAME_REJECTED'
      );

      // 6.2 Explicitly unconfirmed flag
      const reqUnconfFlag = new Request(`http://localhost/api/integrations/spx/v1/students/${student6.id}/updates`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${validToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          updates: {
            studentName: 'Suresh Kumar',
            isConfirmed: false,
          },
        }),
      });
      const resUnconfFlag = await updatesPOST(reqUnconfFlag, { params: Promise.resolve({ id: student6.id }) });
      const bodyUnconfFlag = await resUnconfFlag.json();

      assert(resUnconfFlag.status === 400, 'Test 6.3: Submitting isConfirmed: false returns 400');
      assert(
        bodyUnconfFlag.error === 'UNCONFIRMED_NAME_REJECTED',
        'Test 6.4: Error code is UNCONFIRMED_NAME_REJECTED'
      );
    } finally {
      await prisma.student.delete({ where: { id: student6.id } });
    }
  }

  // -----------------------------------------------------------------
  // TEST 7: Cross-tenant isolation (Forbidden for unauthorized college)
  // -----------------------------------------------------------------
  console.log('\n--- Test 7: Multi-Tenant isolation protection ---');
  {
    const student7 = await prisma.student.create({
      data: {
        studentName: '',
        phone: '9848111888',
        group: 'MPC',
        collegeId,
        employeeId: user.employeeId,
      },
    });

    try {
      const req = new Request(`http://localhost/api/integrations/spx/v1/students/${student7.id}/updates`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${otherTenantToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          updates: { studentName: 'Hostile Attacker Name' },
        }),
      });

      const res = await updatesPOST(req, { params: Promise.resolve({ id: student7.id }) });
      const body = await res.json();

      assert(res.status === 403, 'Test 7.1: Cross-tenant update returns 403 Forbidden');
      assert(body.error === 'FORBIDDEN', 'Test 7.2: Error code is FORBIDDEN');

      const dbStudent = await prisma.student.findUnique({ where: { id: student7.id } });
      assert(
        dbStudent?.studentName === '',
        'Test 7.3: Database record remains completely untouched by cross-tenant attacker'
      );
    } finally {
      await prisma.student.delete({ where: { id: student7.id } });
    }
  }

  // -----------------------------------------------------------------
  // TEST 8: Missing-fields calculation engine
  // -----------------------------------------------------------------
  console.log('\n--- Test 8: Missing-fields calculation includes studentName ---');
  {
    const studentMissing = await prisma.student.create({
      data: {
        studentName: '', // EMPTY -> Must be in missingFields
        phone: '9848111999',
        group: 'MPC',
        collegeId,
        employeeId: user.employeeId,
      },
    });

    const studentFilled = await prisma.student.create({
      data: {
        studentName: 'Existing Valid Name', // POPULATED -> Must NOT be in missingFields
        phone: '9848111000',
        group: 'BiPC',
        collegeId,
        employeeId: user.employeeId,
      },
    });

    try {
      // 8.1 Student with empty studentName
      const reqMissing = new Request(
        `http://localhost/api/integrations/spx/v1/students/${studentMissing.id}/missing-fields`,
        {
          headers: { Authorization: `Bearer ${validToken}` },
        }
      );
      const resMissing = await missingFieldsGET(reqMissing, {
        params: Promise.resolve({ id: studentMissing.id }),
      });
      const bodyMissing = await resMissing.json();

      assert(resMissing.status === 200, 'Test 8.1: Missing-fields endpoint returns 200');
      assert(
        bodyMissing.missingFields.some((f: any) => f.field === 'studentName'),
        'Test 8.2: missingFields includes "studentName" when studentName is empty'
      );

      // 8.2 Student with populated studentName
      const reqFilled = new Request(
        `http://localhost/api/integrations/spx/v1/students/${studentFilled.id}/missing-fields`,
        {
          headers: { Authorization: `Bearer ${validToken}` },
        }
      );
      const resFilled = await missingFieldsGET(reqFilled, {
        params: Promise.resolve({ id: studentFilled.id }),
      });
      const bodyFilled = await resFilled.json();

      assert(resFilled.status === 200, 'Test 8.3: Missing-fields endpoint returns 200 for filled student');
      assert(
        !bodyFilled.missingFields.some((f: any) => f.field === 'studentName'),
        'Test 8.4: missingFields does NOT include "studentName" when studentName is populated'
      );
    } finally {
      await prisma.student.delete({ where: { id: studentMissing.id } });
      await prisma.student.delete({ where: { id: studentFilled.id } });
    }
  }

  console.log('\n======================================================');
  console.log(`TOTAL TESTS: ${totalTests}`);
  console.log(`PASSED: ${passedTests}`);
  console.log(`FAILED: ${totalTests - passedTests}`);
  console.log('======================================================\n');

  if (totalTests !== passedTests) {
    process.exit(1);
  }
}

runStudentNameTestSuite()
  .catch((err) => {
    console.error('Test suite failed with unexpected exception:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
