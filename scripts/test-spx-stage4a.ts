/**
 * Stage 4A Automated Test Suite
 * Tests Outbound AI Call Triggering, SPX Client Construction, Security & Tenant Isolation,
 * Webhook Normalization, Database Idempotency, and Tool Manifest Compliance.
 */

import { prisma } from '../src/lib/prisma';
import { issueTestSpxM2MToken, authenticateSpxM2M } from '../src/lib/integrations/spx/auth';
import { normalizePhoneForSpx, triggerOutboundStudentCall } from '../src/lib/integrations/spx/spx-outbound-client';
import { normalizeSpxWebhookPayload } from '../src/lib/integrations/spx/webhook-normalizer';
import { ingestCallRecord, findCallRecord } from '../src/lib/integrations/spx/call-store';
import { getSpxProToolManifest } from '../src/lib/integrations/spx/spx-tool-manifest';
import { POST as aiCallRoute } from '../src/app/api/students/[id]/ai-call/route';
import { POST as webhookRoute } from '../src/app/api/integrations/spx/v1/calls/webhook/route';
import jwt from 'jsonwebtoken';

let testsPassed = 0;
let testsFailed = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`  ✓ PASS: ${testName}`);
    testsPassed++;
  } else {
    console.error(`  ✗ FAIL: ${testName}${detail ? ` - ${detail}` : ''}`);
    testsFailed++;
  }
}

async function runStage4aTests() {
  console.log('\n======================================================');
  console.log('       STAGE 4A: SPX VOICE AI OUTBOUND & WEBHOOK      ');
  console.log('======================================================\n');

  // Set environment for testing
  process.env.SPX_INTEGRATION_ENABLED = 'true';
  process.env.SPX_M2M_MASTER_SECRET = 'test-m2m-master-secret-key-stage4a-12345';
  process.env.SPX_M2M_ISSUER = 'spx-voice-platform';
  process.env.SPX_M2M_AUDIENCE = 'pro-admissions-backend';
  process.env.JWT_SECRET = 'test-human-jwt-secret-key-12345';
  process.env.SPX_API_BASE_URL = 'http://mock-spx-voice:8000';
  process.env.SPX_API_KEY = 'mock_spx_key_abc123';
  process.env.SPX_AGENT_UUID = 'agent_telugu_admissions_uuid_555';
  process.env.SPX_WEBHOOK_SECRET = 'mock-webhook-shared-secret-999';

  const testCollegeId = `col_stg4a_${Date.now()}`;
  const otherCollegeId = `col_other_${Date.now()}`;
  const testStudentId = `std_stg4a_${Date.now()}`;
  const otherStudentId = `std_other_${Date.now()}`;

  try {
    // Setup test fixtures in database
    await prisma.college.create({
      data: {
        id: testCollegeId,
        name: 'Aditya Engineering College (Stage 4A)',
        code: 'AEC4A',
      },
    });

    await prisma.college.create({
      data: {
        id: otherCollegeId,
        name: 'Other College (Stage 4A)',
        code: 'OTH4A',
      },
    });

    const existingUser = await prisma.user.findFirst();
    if (!existingUser) {
      throw new Error('No user found in database for student creation');
    }

    await prisma.student.create({
      data: {
        id: testStudentId,
        studentName: 'Naveen Kumar',
        phone: '9848022338',
        collegeId: testCollegeId,
        group: 'MPC',
        fatherName: 'Srinivas',
        employeeId: existingUser.employeeId,
      },
    });

    await prisma.student.create({
      data: {
        id: otherStudentId,
        studentName: 'Suresh Varma',
        phone: '9848099887',
        collegeId: otherCollegeId,
        group: 'BiPC',
        employeeId: existingUser.employeeId,
      },
    });

    // ----------------------------------------------------
    // TEST 1: Phone Normalization for SPX E.164 Dialing
    // ----------------------------------------------------
    console.log('--- 1. Phone Normalization for SPX E.164 ---');
    assert(normalizePhoneForSpx('9848022338') === '+919848022338', 'Normalizes 10-digit number to +91');
    assert(normalizePhoneForSpx('09848022338') === '+919848022338', 'Normalizes leading 0 number to +91');
    assert(normalizePhoneForSpx('919848022338') === '+919848022338', 'Normalizes 12-digit 91 number to +91');
    assert(normalizePhoneForSpx('+919848022338') === '+919848022338', 'Preserves existing E.164 number');

    // ----------------------------------------------------
    // TEST 2: Outbound Client Configuration Validation
    // ----------------------------------------------------
    console.log('\n--- 2. Outbound Client Configuration Validation ---');
    const savedApiKey = process.env.SPX_API_KEY;
    delete process.env.SPX_API_KEY;
    const missingKeyResult = await triggerOutboundStudentCall({ studentId: testStudentId });
    assert(missingKeyResult.success === false && missingKeyResult.error === 'CONFIGURATION_ERROR', 'Detects missing SPX_API_KEY');
    process.env.SPX_API_KEY = savedApiKey;

    const savedAgentUuid = process.env.SPX_AGENT_UUID;
    delete process.env.SPX_AGENT_UUID;
    const missingUuidResult = await triggerOutboundStudentCall({ studentId: testStudentId });
    assert(missingUuidResult.success === false && missingUuidResult.error === 'CONFIGURATION_ERROR', 'Detects missing SPX_AGENT_UUID');
    process.env.SPX_AGENT_UUID = savedAgentUuid;

    const nonExistentResult = await triggerOutboundStudentCall({ studentId: 'non_existent_student_999' });
    assert(nonExistentResult.success === false && nonExistentResult.error === 'STUDENT_NOT_FOUND', 'Rejects non-existent student');

    // ----------------------------------------------------
    // TEST 3: Outbound Request Construction & Interception
    // ----------------------------------------------------
    console.log('\n--- 3. Outbound Request Construction & Context Injection ---');
    let capturedUrl = '';
    let capturedHeaders: Record<string, string> = {};
    let capturedBody: any = null;

    const originalFetch = global.fetch;
    global.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      capturedUrl = input.toString();
      capturedHeaders = (init?.headers as Record<string, string>) || {};
      capturedBody = JSON.parse(init?.body as string || '{}');

      return new Response(
        JSON.stringify({
          status: 'initiated',
          workflow_run_id: 8421,
          workflow_run_name: 'WR-API-8421',
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    };

    const callResult = await triggerOutboundStudentCall({
      studentId: testStudentId,
      requestedByEmployeeId: 'emp_telecaller_1',
      requestedByRole: 'TELECALLER',
    });

    global.fetch = originalFetch;

    assert(callResult.success === true, 'Outbound call succeeds with simulated SPX service');
    assert(callResult.workflowRunId === 8421, 'Returns SPX workflowRunId');
    assert(capturedUrl === 'http://mock-spx-voice:8000/api/v1/public/agent/agent_telugu_admissions_uuid_555', 'Calls correct SPX trigger endpoint');
    assert(capturedHeaders['X-API-Key'] === 'mock_spx_key_abc123', 'Transmits X-API-Key header to SPX');
    assert(capturedBody?.phone_number === '+919848022338', 'Passes normalized recipient phone number');
    assert(capturedBody?.initial_context?.student_id === testStudentId, 'Passes student_id in initial_context');
    assert(capturedBody?.initial_context?.college_id === testCollegeId, 'Passes college_id in initial_context');
    assert(capturedBody?.initial_context?.student_name === 'Naveen Kumar', 'Passes student_name in initial_context');
    assert(Boolean(capturedBody?.initial_context?.spx_token), 'Generates and passes M2M token for SPX tools');

    // Verify generated M2M token inside initial_context
    const decodedToken = jwt.verify(
      capturedBody.initial_context.spx_token,
      process.env.SPX_M2M_MASTER_SECRET
    ) as any;
    assert(decodedToken.collegeId === testCollegeId, 'M2M token is strictly bound to student collegeId');
    assert(decodedToken.permissions.includes('students:read'), 'M2M token grants students:read');
    assert(decodedToken.permissions.includes('students:update'), 'M2M token grants students:update');

    // ----------------------------------------------------
    // TEST 4: PRO Server Route Security & Tenant Isolation
    // ----------------------------------------------------
    console.log('\n--- 4. PRO Server Route Security & Tenant Enforcement ---');

    // 4.1 Unauthenticated Request
    const unauthReq = new Request('http://localhost:3000/api/students/123/ai-call', {
      method: 'POST',
    });
    const unauthRes = await aiCallRoute(unauthReq, { params: Promise.resolve({ id: testStudentId }) });
    assert(unauthRes.status === 401, 'Rejects unauthenticated request with 401');

    // 4.2 Cross-Tenant College User
    const crossTenantCollegeToken = jwt.sign(
      { employeeId: otherCollegeId, role: 'COLLEGE' },
      process.env.JWT_SECRET
    );
    const crossTenantReq = new Request('http://localhost:3000/api/students/123/ai-call', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${crossTenantCollegeToken}`,
      },
    });
    const crossTenantRes = await aiCallRoute(crossTenantReq, { params: Promise.resolve({ id: testStudentId }) });
    assert(crossTenantRes.status === 403, 'Blocks cross-tenant college user from triggering call for another college (403)');

    // ----------------------------------------------------
    // TEST 5: SPX Tool Manifest Compliance
    // ----------------------------------------------------
    console.log('\n--- 5. SPX Tool Manifest Schema Compliance ---');
    const tools = getSpxProToolManifest();
    assert(Array.isArray(tools) && tools.length >= 7, 'Generates full set of PRO integration tools');

    const lookupTool = tools.find((t) => t.name === 'lookup_student');
    assert(lookupTool !== undefined && lookupTool.category === 'http_api', 'lookup_student tool defined with category http_api');
    assert(lookupTool?.definition.config.method === 'POST', 'lookup_student uses POST method');

    const profileTool = tools.find((t) => t.name === 'get_student_profile');
    assert(profileTool?.definition.config.url.includes('{{initial_context.student_id}}'), 'get_student_profile binds URL to student_id template');

    const updateTool = tools.find((t) => t.name === 'update_student_profile');
    assert(updateTool?.definition.config.method === 'POST', 'update_student_profile uses POST method');

    // ----------------------------------------------------
    // TEST 6: Webhook Normalization (SPX -> PRO)
    // ----------------------------------------------------
    console.log('\n--- 6. Webhook Normalization (SPX Payload -> PRO Call Summary) ---');
    const rawSpxPayload = {
      workflow_run_id: 9912,
      customer_number: '+919848022338',
      rep_number: '+910000000000',
      called_at: '2026-11-07T07:15:00Z',
      duration: 142,
      district: 'Visakhapatnam',
      town: 'Gajuwaka',
      looking_for: 'B.Tech CSE',
      customer_name: 'Naveen',
      remarks: 'Student interested in CSE. Agrees to college visit next Monday.',
      recording_url: 'https://minio.spx.internal/recordings/call_9912.mp3',
    };

    const normalized = await normalizeSpxWebhookPayload(rawSpxPayload, testCollegeId);
    assert(normalized.callSummaryInput.spxCallId === '9912', 'Maps workflow_run_id to spxCallId');
    assert(normalized.callSummaryInput.durationSeconds === 142, 'Maps duration to durationSeconds');
    assert(normalized.callSummaryInput.outcome === 'CONNECTED', 'Derives CONNECTED outcome for positive duration');
    assert(normalized.callSummaryInput.recordingUrl === 'https://minio.spx.internal/recordings/call_9912.mp3', 'Maps recording_url');
    assert(normalized.callSummaryInput.followUpRequired === true, 'Detects followUpRequired from remarks text');
    assert(normalized.matchedStudentId === testStudentId, 'Auto-resolves student reference from phone number');
    assert(normalized.resolvedCollegeId === testCollegeId, 'Resolves tenant collegeId correctly');

    // ----------------------------------------------------
    // TEST 7: Webhook Ingestion & Database Idempotency
    // ----------------------------------------------------
    console.log('\n--- 7. Webhook Security & Idempotency ---');

    // 7.1 Webhook Authentication Check
    const unauthWebhookReq = new Request('http://localhost:3000/api/integrations/spx/v1/calls/webhook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(rawSpxPayload),
    });
    const unauthWebhookRes = await webhookRoute(unauthWebhookReq);
    assert(unauthWebhookRes.status === 401, 'Rejects webhook without secret or token with 401');

    // 7.2 Initial Webhook Delivery
    const validWebhookReq = new Request('http://localhost:3000/api/integrations/spx/v1/calls/webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-SPX-Webhook-Secret': 'mock-webhook-shared-secret-999',
      },
      body: JSON.stringify(rawSpxPayload),
    });
    const validWebhookRes = await webhookRoute(validWebhookReq);
    const validWebhookData = await validWebhookRes.json();
    assert(validWebhookRes.status === 201, 'First webhook delivery ingested with 201 Created');
    assert(validWebhookData.isDuplicate === false, 'Indicates isDuplicate: false on first delivery');

    // Verify record in database
    const savedRecord = await findCallRecord('9912');
    assert(savedRecord !== null, 'Record persisted in database SpxCallRecord');
    assert(savedRecord?.studentId === testStudentId, 'Database record correctly linked to student');
    assert(savedRecord?.durationSeconds === 142, 'Database record duration persisted');

    // 7.3 Duplicate Webhook Delivery (Idempotency Test)
    const duplicateWebhookReq = new Request('http://localhost:3000/api/integrations/spx/v1/calls/webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-SPX-Webhook-Secret': 'mock-webhook-shared-secret-999',
      },
      body: JSON.stringify(rawSpxPayload),
    });
    const duplicateWebhookRes = await webhookRoute(duplicateWebhookReq);
    const duplicateWebhookData = await duplicateWebhookRes.json();
    assert(duplicateWebhookRes.status === 200, 'Duplicate delivery returns 200 OK (idempotent)');
    assert(duplicateWebhookData.isDuplicate === true, 'Returns isDuplicate: true without inserting second row');

  } finally {
    // Clean up test fixtures
    await prisma.$executeRawUnsafe(`DELETE FROM "SpxCallRecord" WHERE "collegeId" IN ('${testCollegeId}', '${otherCollegeId}')`);
    await prisma.student.deleteMany({ where: { id: { in: [testStudentId, otherStudentId] } } });
    await prisma.college.deleteMany({ where: { id: { in: [testCollegeId, otherCollegeId] } } });
  }

  console.log('\n======================================================');
  console.log(`TEST RESULTS: ${testsPassed} passed, ${testsFailed} failed`);
  console.log('======================================================\n');

  if (testsFailed > 0) {
    process.exit(1);
  }
}

runStage4aTests().catch((err) => {
  console.error('Test execution exception:', err);
  process.exit(1);
});
