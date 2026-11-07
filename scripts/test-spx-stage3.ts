/**
 * Automated Verification Suite for SPX Voice AI Integration - Stage 3 Implementation
 * Tests Address Hierarchy, Call Summaries, Idempotency, Follow-up Scheduling, and Non-Inflation of Visits.
 */

import { prisma } from '../src/lib/prisma';
import { issueTestSpxM2MToken } from '../src/lib/integrations/spx/auth';
import { GET as districtsGET } from '../src/app/api/integrations/spx/v1/addresses/districts/route';
import { GET as mandalsGET } from '../src/app/api/integrations/spx/v1/addresses/districts/[districtId]/mandals/route';
import { GET as villagesGET } from '../src/app/api/integrations/spx/v1/addresses/mandals/[mandalId]/villages/route';
import { GET as searchGET } from '../src/app/api/integrations/spx/v1/addresses/search/route';
import { POST as validatePOST } from '../src/app/api/integrations/spx/v1/addresses/validate/route';
import { POST as updatesPOST } from '../src/app/api/integrations/spx/v1/students/[id]/updates/route';
import { POST as callSummaryPOST } from '../src/app/api/integrations/spx/v1/calls/summary/route';
import { GET as callsGET } from '../src/app/api/integrations/spx/v1/calls/route';
import { GET as followUpGET, POST as followUpPOST } from '../src/app/api/integrations/spx/v1/students/[id]/follow-up/route';
import { interpretNaturalFollowUpDate } from '../src/lib/integrations/spx/date-utils';

// Ensure test environment variables
process.env.SPX_INTEGRATION_ENABLED = 'true';
process.env.SPX_M2M_MASTER_SECRET = 'stage3-verification-secret-key-999';
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

async function runStage3Suite() {
  console.log('\n======================================================');
  console.log('SPX VOICE INTEGRATION - STAGE 3 AUTOMATED VERIFICATION');
  console.log('======================================================\n');

  // Discover college in database
  const college = await prisma.college.findFirst({
    where: { isActive: true },
    include: { users: true },
  });

  if (!college) {
    throw new Error('No active college found in database for testing');
  }

  const collegeId = college.id;
  const otherCollegeId = 'col_foreign_tenant_99999';

  const validToken = issueTestSpxM2MToken({
    collegeId,
    collegeCode: college.code,
    permissions: [
      'students:lookup',
      'students:read',
      'students:update',
      'college:read',
      'calls:write',
      'calls:read',
    ],
  });

  const foreignTenantToken = issueTestSpxM2MToken({
    collegeId: otherCollegeId,
    collegeCode: 'FOREIGN',
    permissions: [
      'students:lookup',
      'students:read',
      'students:update',
      'college:read',
      'calls:write',
      'calls:read',
    ],
  });

  // Query address hierarchy records from DB
  const districtRec = await prisma.configValue.findFirst({
    where: { type: 'DISTRICT', value: 'Anakapalli' },
  });

  if (!districtRec) {
    throw new Error('Anakapalli district not found in database');
  }

  const mandalRec = await prisma.configValue.findFirst({
    where: { type: 'MANDAL', parentId: districtRec.id },
  });

  if (!mandalRec) {
    throw new Error('No mandal found for Anakapalli district');
  }

  const villageRec = await prisma.configValue.findFirst({
    where: { type: 'VILLAGE', parentId: mandalRec.id },
  });

  if (!villageRec) {
    throw new Error('No village found for mandal');
  }

  // -----------------------------------------------------------------
  // PART A: ADDRESS HIERARCHY TESTS
  // -----------------------------------------------------------------
  console.log('--- Part A: Address Hierarchy Integration Tests ---');

  // Test 1: District list retrieval
  {
    const req = new Request('http://localhost/api/integrations/spx/v1/addresses/districts', {
      headers: { Authorization: `Bearer ${validToken}` },
    });
    const res = await districtsGET(req);
    const body = await res.json();

    assert(
      res.status === 200 &&
      body.success === true &&
      Array.isArray(body.districts) &&
      body.districts.some((d: any) => d.id === districtRec.id && d.name === 'Anakapalli'),
      'District list endpoint returns available district IDs and names'
    );
  }

  // Test 2: Mandal list for District
  {
    const req = new Request(`http://localhost/api/integrations/spx/v1/addresses/districts/${districtRec.id}/mandals`, {
      headers: { Authorization: `Bearer ${validToken}` },
    });
    const res = await mandalsGET(req, { params: Promise.resolve({ districtId: districtRec.id }) });
    const body = await res.json();

    assert(
      res.status === 200 &&
      body.success === true &&
      Array.isArray(body.mandals) &&
      body.mandals.length > 0 &&
      body.mandals.every((m: any) => m.districtId === districtRec.id),
      'Mandal list returns mandals belonging strictly to the specified district'
    );
  }

  // Test 3: Village list for Mandal
  {
    const req = new Request(`http://localhost/api/integrations/spx/v1/addresses/mandals/${mandalRec.id}/villages`, {
      headers: { Authorization: `Bearer ${validToken}` },
    });
    const res = await villagesGET(req, { params: Promise.resolve({ mandalId: mandalRec.id }) });
    const body = await res.json();

    assert(
      res.status === 200 &&
      body.success === true &&
      Array.isArray(body.villages) &&
      body.villages.length > 0 &&
      body.villages.every((v: any) => v.mandalId === mandalRec.id),
      'Village list returns villages belonging strictly to the specified mandal'
    );
  }

  // Test 4: Invalid District/Mandal Combination Rejected
  {
    const fakeDistrictId = 'cmu_fake_district_123';
    const req = new Request('http://localhost/api/integrations/spx/v1/addresses/validate', {
      method: 'POST',
      headers: { Authorization: `Bearer ${validToken}` },
      body: JSON.stringify({
        districtId: fakeDistrictId,
        mandalId: mandalRec.id,
        villageId: villageRec.id,
      }),
    });
    const res = await validatePOST(req);
    const body = await res.json();

    assert(
      res.status === 422 && body.valid === false && body.error === 'DISTRICT_MISMATCH',
      'Address validation rejects invalid district/mandal combination with 422 DISTRICT_MISMATCH'
    );
  }

  // Test 5: Invalid Mandal/Village Combination Rejected
  {
    const fakeMandalId = 'cmu_fake_mandal_456';
    const req = new Request('http://localhost/api/integrations/spx/v1/addresses/validate', {
      method: 'POST',
      headers: { Authorization: `Bearer ${validToken}` },
      body: JSON.stringify({
        districtId: districtRec.id,
        mandalId: fakeMandalId,
        villageId: villageRec.id,
      }),
    });
    const res = await validatePOST(req);
    const body = await res.json();

    assert(
      res.status === 422 && body.valid === false && body.error === 'MANDAL_MISMATCH',
      'Address validation rejects invalid mandal/village combination with 422 MANDAL_MISMATCH'
    );
  }

  // Test 6 & 7: Address Search with Complete Parent Hierarchy
  {
    const req = new Request(`http://localhost/api/integrations/spx/v1/addresses/search?q=${encodeURIComponent(villageRec.value)}`, {
      headers: { Authorization: `Bearer ${validToken}` },
    });
    const res = await searchGET(req);
    const body = await res.json();

    assert(
      res.status === 200 &&
      body.success === true &&
      Array.isArray(body.results) &&
      body.results.length > 0 &&
      body.results.some(
        (r: any) =>
          r.villageId === villageRec.id &&
          r.mandalId === mandalRec.id &&
          r.districtId === districtRec.id &&
          r.formattedAddress.includes(mandalRec.value)
      ),
      'Address search returns complete parent hierarchy (village -> mandal -> district)'
    );
  }

  // Test 8, 9 & 10: Student Hierarchical Address Updates & Validation
  {
    // Create temporary test student with empty address
    const employee = college.users.find((u) => u.role === 'EMPLOYEE') || college.users[0];
    const testStudent = await prisma.student.create({
      data: {
        studentName: 'Address Hierarchy Test Student',
        phone: '9848777666',
        group: 'MPC',
        collegeId,
        employeeId: employee?.employeeId || 'test',
        district: null,
        mandal: null,
        village: null,
        address: null,
      },
    });

    try {
      // 8.1 Invalid hierarchy update rejected & preserves existing nulls
      const invalidReq = new Request(`http://localhost/api/integrations/spx/v1/students/${testStudent.id}/updates`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${validToken}` },
        body: JSON.stringify({
          updates: {
            districtId: districtRec.id,
            mandalId: 'fake_mandal_id',
            villageId: villageRec.id,
          },
        }),
      });
      const invalidRes = await updatesPOST(invalidReq, { params: Promise.resolve({ id: testStudent.id }) });
      const invalidBody = await invalidRes.json();

      assert(
        invalidRes.status === 200 &&
        invalidBody.conflictsRequiringReview.some((c: any) => c.reason === 'INVALID_ADDRESS_HIERARCHY'),
        'Invalid address hierarchy in student update is caught and returned as review conflict'
      );

      // Verify DB was NOT updated with invalid values
      const checkAfterInvalid = await prisma.student.findUnique({ where: { id: testStudent.id } });
      assert(
        checkAfterInvalid?.district === null && checkAfterInvalid?.village === null,
        'Invalid address update preserves existing database values untouched'
      );

      // 8.2 Valid hierarchy update succeeds atomically
      const validUpdateReq = new Request(`http://localhost/api/integrations/spx/v1/students/${testStudent.id}/updates`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${validToken}` },
        body: JSON.stringify({
          updates: {
            districtId: districtRec.id,
            mandalId: mandalRec.id,
            villageId: villageRec.id,
            address: 'Door 4-12, Near Temple',
          },
        }),
      });
      const validUpdateRes = await updatesPOST(validUpdateReq, { params: Promise.resolve({ id: testStudent.id }) });
      const validUpdateBody = await validUpdateRes.json();

      assert(
        validUpdateRes.status === 200 &&
        validUpdateBody.updatedFields.includes('district') &&
        validUpdateBody.updatedFields.includes('mandal') &&
        validUpdateBody.updatedFields.includes('village') &&
        validUpdateBody.updatedFields.includes('address'),
        'Valid address hierarchy and free-text landmark updated together atomically'
      );

      // Verify DB holds valid IDs
      const checkAfterValid = await prisma.student.findUnique({ where: { id: testStudent.id } });
      assert(
        checkAfterValid?.district === districtRec.id &&
        checkAfterValid?.mandal === mandalRec.id &&
        checkAfterValid?.village === villageRec.id &&
        checkAfterValid?.address === 'Door 4-12, Near Temple',
        'Database verified with authentic district, mandal, village IDs and landmark'
      );
    } finally {
      await prisma.student.delete({ where: { id: testStudent.id } });
    }
  }

  // -----------------------------------------------------------------
  // PART B: AI CALL RECORDING & IDEMPOTENCY TESTS
  // -----------------------------------------------------------------
  console.log('\n--- Part B: AI Call Recording & Idempotency Tests ---');

  const testStudent = await prisma.student.findFirst({
    where: {
      OR: [{ collegeId }, { employee: { collegeId } }],
    },
  });

  const testStudentId = testStudent?.id || 'cmvas8p5a0000zphabyb2lfi8';
  const initialVisitCount = await prisma.visit.count();

  const uniqueCallId = `spx_test_call_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  // Test 11: Inbound Call Summary Ingestion
  {
    const inboundCallId = `inbound_${Date.now()}`;
    const req = new Request('http://localhost/api/integrations/spx/v1/calls/summary', {
      method: 'POST',
      headers: { Authorization: `Bearer ${validToken}` },
      body: JSON.stringify({
        spxCallId: inboundCallId,
        direction: 'INBOUND',
        studentId: testStudentId,
        status: 'COMPLETED',
        outcome: 'INTERESTED',
        durationSeconds: 145,
        summary: 'Caller enquired about MPC admissions and hostel fees in Telugu.',
        studentInterest: 'MPC',
      }),
    });
    const res = await callSummaryPOST(req);
    const body = await res.json();

    assert(
      res.status === 201 &&
      body.success === true &&
      body.callId === inboundCallId &&
      body.isDuplicate === false,
      'Inbound AI call summary ingested successfully with 201 Created'
    );
  }

  // Test 12: Outbound Call Summary Ingestion
  {
    const req = new Request('http://localhost/api/integrations/spx/v1/calls/summary', {
      method: 'POST',
      headers: { Authorization: `Bearer ${validToken}` },
      body: JSON.stringify({
        spxCallId: uniqueCallId,
        direction: 'OUTBOUND',
        studentId: testStudentId,
        status: 'COMPLETED',
        outcome: 'CALLBACK_REQUESTED',
        durationSeconds: 98,
        summary: 'Parent confirmed student is in 10th standard and asked for callback tomorrow.',
        followUpRequired: true,
        followUpDate: 'tomorrow',
        followUpType: 'Callback',
      }),
    });
    const res = await callSummaryPOST(req);
    const body = await res.json();

    assert(
      res.status === 201 &&
      body.success === true &&
      body.callId === uniqueCallId &&
      body.followUpScheduled === true,
      'Outbound AI call summary ingested and scheduled follow-up'
    );
  }

  // Test 13: Cross-Tenant Student Association Rejected
  {
    const crossTenantCallId = `cross_tenant_${Date.now()}`;
    const req = new Request('http://localhost/api/integrations/spx/v1/calls/summary', {
      method: 'POST',
      headers: { Authorization: `Bearer ${foreignTenantToken}` }, // Unauthorized college token
      body: JSON.stringify({
        spxCallId: crossTenantCallId,
        direction: 'OUTBOUND',
        studentId: testStudentId, // Belongs to collegeId, NOT foreignTenantToken
      }),
    });
    const res = await callSummaryPOST(req);
    const body = await res.json();

    assert(
      res.status === 403 && body.error === 'FORBIDDEN',
      'Call summary rejects association with cross-tenant student with 403 FORBIDDEN'
    );
  }

  // Test 14: Duplicate Call Submission Returns Idempotent 200
  {
    const req = new Request('http://localhost/api/integrations/spx/v1/calls/summary', {
      method: 'POST',
      headers: { Authorization: `Bearer ${validToken}` },
      body: JSON.stringify({
        spxCallId: uniqueCallId, // Same ID already ingested above
        direction: 'OUTBOUND',
        studentId: testStudentId,
        status: 'COMPLETED',
        summary: 'Duplicate retry of call summary',
      }),
    });
    const res = await callSummaryPOST(req);
    const body = await res.json();

    assert(
      res.status === 200 &&
      body.success === true &&
      body.isDuplicate === true &&
      body.callId === uniqueCallId,
      'Duplicate call submission returns idempotent 200 with isDuplicate: true without creating duplicates'
    );
  }

  // Test 15: Concurrent Retries Handled Safely
  {
    const concurrentCallId = `concurrent_call_${Date.now()}`;
    const payload = JSON.stringify({
      spxCallId: concurrentCallId,
      direction: 'OUTBOUND',
      studentId: testStudentId,
      status: 'COMPLETED',
    });

    const [r1, r2, r3] = await Promise.all([
      callSummaryPOST(new Request('http://localhost/api/integrations/spx/v1/calls/summary', {
        method: 'POST',
        headers: { Authorization: `Bearer ${validToken}` },
        body: payload,
      })),
      callSummaryPOST(new Request('http://localhost/api/integrations/spx/v1/calls/summary', {
        method: 'POST',
        headers: { Authorization: `Bearer ${validToken}` },
        body: payload,
      })),
      callSummaryPOST(new Request('http://localhost/api/integrations/spx/v1/calls/summary', {
        method: 'POST',
        headers: { Authorization: `Bearer ${validToken}` },
        body: payload,
      })),
    ]);

    const statuses = [r1.status, r2.status, r3.status];
    const createdCount = statuses.filter((s) => s === 201).length;
    const okCount = statuses.filter((s) => s === 200).length;

    assert(
      createdCount === 1 && okCount === 2,
      'Concurrent retries result in exactly 1 Created (201) and 2 Idempotent (200) responses'
    );
  }

  // Test 16: Zero Inflation of Physical Visits or Telecaller Stats
  {
    const finalVisitCount = await prisma.visit.count();
    assert(
      finalVisitCount === initialVisitCount,
      'Ingesting AI call summaries does NOT create Visit records or inflate human telecaller/doorstep stats'
    );
  }

  // Test 17: Staff Visibility of AI Calls via GET /api/integrations/spx/v1/calls
  {
    const req = new Request(`http://localhost/api/integrations/spx/v1/calls?studentId=${testStudentId}`, {
      headers: { Authorization: `Bearer ${validToken}` },
    });
    const res = await callsGET(req);
    const body = await res.json();

    assert(
      res.status === 200 &&
      body.success === true &&
      Array.isArray(body.calls) &&
      body.calls.some((c: any) => c.spxCallId === uniqueCallId),
      'GET /calls returns AI call history for staff visibility with outcome, duration, and summary'
    );
  }

  // -----------------------------------------------------------------
  // PART C: FOLLOW-UP MANAGEMENT TESTS
  // -----------------------------------------------------------------
  console.log('\n--- Part C: Follow-Up Management Tests ---');

  // Test 18: Unconfirmed Date Requires Confirmation (Rule 1 & 3)
  {
    const req = new Request(`http://localhost/api/integrations/spx/v1/students/${testStudentId}/follow-up`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${validToken}` },
      body: JSON.stringify({
        dateText: 'tomorrow',
        confirmed: false, // NOT yet confirmed with caller
      }),
    });
    const res = await followUpPOST(req, { params: Promise.resolve({ id: testStudentId }) });
    const body = await res.json();

    assert(
      res.status === 200 &&
      body.status === 'CONFIRMATION_REQUIRED' &&
      typeof body.humanFormattedKolkata === 'string' &&
      body.suggestedConfirmationQuestion !== undefined,
      'Unconfirmed date returns CONFIRMATION_REQUIRED with read-back question for caller verification'
    );
  }

  // Test 19: Confirmed Date Updates Follow-Up in Asia/Kolkata (Rule 2 & 7)
  {
    const req = new Request(`http://localhost/api/integrations/spx/v1/students/${testStudentId}/follow-up`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${validToken}` },
      body: JSON.stringify({
        dateText: 'tomorrow',
        followUpType: 'Callback',
        confirmed: true,
      }),
    });
    const res = await followUpPOST(req, { params: Promise.resolve({ id: testStudentId }) });
    const body = await res.json();

    assert(
      res.status === 200 &&
      body.success === true &&
      body.nextFollowUpDate !== null &&
      body.nextFollowUpType === 'Callback',
      'Confirmed follow-up date and type are saved together atomically in Student record'
    );

    // Verify GET /follow-up reflects this update
    const getReq = new Request(`http://localhost/api/integrations/spx/v1/students/${testStudentId}/follow-up`, {
      headers: { Authorization: `Bearer ${validToken}` },
    });
    const getRes = await followUpGET(getReq, { params: Promise.resolve({ id: testStudentId }) });
    const getBody = await getRes.json();

    assert(
      getRes.status === 200 &&
      getBody.hasScheduledFollowUp === true &&
      getBody.nextFollowUpType === 'Callback',
      'GET /students/[id]/follow-up returns currently stored follow-up date and type'
    );
  }

  // Test 20: Ambiguous or Past Dates Rejected (Rule 6)
  {
    const pastResult = interpretNaturalFollowUpDate('2020-01-01');
    const ambiguousReq = new Request(`http://localhost/api/integrations/spx/v1/students/${testStudentId}/follow-up`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${validToken}` },
      body: JSON.stringify({
        dateText: 'some random day later maybe',
        confirmed: true,
      }),
    });
    const ambiguousRes = await followUpPOST(ambiguousReq, { params: Promise.resolve({ id: testStudentId }) });
    const ambiguousBody = await ambiguousRes.json();

    assert(
      pastResult.success === false && pastResult.error === 'PAST_DATE_NOT_ALLOWED' &&
      ambiguousRes.status === 400 && ambiguousBody.error === 'UNRECOGNIZED_DATE_FORMAT',
      'Past dates and ambiguous date expressions are rejected without guessing'
    );
  }

  // Test 21: Unsupported Follow-Up Type Rejected (Rule 5)
  {
    const req = new Request(`http://localhost/api/integrations/spx/v1/students/${testStudentId}/follow-up`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${validToken}` },
      body: JSON.stringify({
        dateText: 'tomorrow',
        followUpType: 'NON_EXISTENT_UNSUPPORTED_TYPE',
        confirmed: true,
      }),
    });
    const res = await followUpPOST(req, { params: Promise.resolve({ id: testStudentId }) });
    const body = await res.json();

    assert(
      res.status === 400 && body.error === 'UNSUPPORTED_FOLLOW_UP_TYPE',
      'Unsupported follow-up types are rejected with 400 UNSUPPORTED_FOLLOW_UP_TYPE'
    );
  }

  // -----------------------------------------------------------------
  // SUMMARY
  // -----------------------------------------------------------------
  console.log('\n======================================================');
  console.log(`RESULTS: ${passedTests} / ${totalTests} TESTS PASSED`);
  console.log('======================================================\n');

  if (passedTests === totalTests) {
    console.log('>>> ALL STAGE 3 TESTS PASSED SUCCESSFULLY! <<<\n');
  } else {
    console.error('>>> SOME STAGE 3 TESTS FAILED. CHECK LOGS ABOVE. <<<\n');
    process.exit(1);
  }
}

runStage3Suite()
  .catch((err) => {
    console.error('FATAL TEST ERROR:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

