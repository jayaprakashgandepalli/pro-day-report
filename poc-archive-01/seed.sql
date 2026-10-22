-- =========================================================================
-- POC-ARCHIVE-01: Seed Test Data
-- Sets up Workspace, 2 Academic Years, 1,000 Leads with child interactions,
-- Admitted records, verified manifests, and dual-approved authorizations.
-- =========================================================================

-- Clear existing data
TRUNCATE TABLE audit_events, archive_deletion_exclusions, archive_deletion_batch_runs,
               workspace_archive_approval_events, workspace_archive_deletion_authorizations,
               workspace_archival_manifests, workspace_compliance_holds, admission_records,
               follow_up_tasks, telecall_interactions, field_visits, student_leads,
               academic_years, workspaces CASCADE;

-- 1. Insert Workspace W1
INSERT INTO workspaces (id, legal_name, subdomain, subscription_tier)
VALUES (
    '018f3a5e-0001-7000-8000-000000000001',
    'Sri Siddhartha Institute of Engineering & Technology',
    'sri-siddhartha',
    'FULL_COLLEGE_SUITE'
);

-- 2. Insert Academic Years AY1 (2024-2025) and AY2 (2023-2024)
INSERT INTO academic_years (id, workspace_id, year_label, start_date, end_date, status)
VALUES 
(
    '018f3a5e-0002-7000-8000-000000000001',
    '018f3a5e-0001-7000-8000-000000000001',
    '2024-2025',
    '2024-06-01',
    '2025-05-31',
    'COHORT_CLOSED'
),
(
    '018f3a5e-0002-7000-8000-000000000002',
    '018f3a5e-0001-7000-8000-000000000001',
    '2023-2024',
    '2023-06-01',
    '2024-05-31',
    'COHORT_CLOSED'
);

-- Common export snapshot timestamp: 2 hours ago
-- All initial seed data has created_at / updated_at 3 hours ago
-- This establishes a clean baseline before the export snapshot.

-- 3. Insert 500 Leads for AY1
INSERT INTO student_leads (
    id, workspace_id, academic_year_id, student_name,
    phone_blind_index_v2, encrypted_phone, status, created_at, updated_at
)
SELECT 
    gen_random_uuid(),
    '018f3a5e-0001-7000-8000-000000000001',
    '018f3a5e-0002-7000-8000-000000000001',
    'AY1 Student Lead #' || i,
    md5('phone_ay1_' || i) || md5('salt_ay1_' || i),
    'enc_phone_ay1_' || i,
    CASE WHEN i <= 10 THEN 'ADMITTED' ELSE 'NEW_INQUIRY' END,
    NOW() - INTERVAL '3 hours',
    NOW() - INTERVAL '3 hours'
FROM generate_series(1, 500) AS i;

-- 4. Insert 500 Leads for AY2
INSERT INTO student_leads (
    id, workspace_id, academic_year_id, student_name,
    phone_blind_index_v2, encrypted_phone, status, created_at, updated_at
)
SELECT 
    gen_random_uuid(),
    '018f3a5e-0001-7000-8000-000000000001',
    '018f3a5e-0002-7000-8000-000000000002',
    'AY2 Student Lead #' || i,
    md5('phone_ay2_' || i) || md5('salt_ay2_' || i),
    'enc_phone_ay2_' || i,
    CASE WHEN i <= 10 THEN 'ADMITTED' ELSE 'NEW_INQUIRY' END,
    NOW() - INTERVAL '3 hours',
    NOW() - INTERVAL '3 hours'
FROM generate_series(1, 500) AS i;

-- 5. Insert Child Interactions for all leads
-- Field visits
INSERT INTO field_visits (id, lead_id, visited_at, created_at, updated_at, notes)
SELECT 
    gen_random_uuid(),
    id,
    NOW() - INTERVAL '3 hours',
    NOW() - INTERVAL '3 hours',
    NOW() - INTERVAL '3 hours',
    'Initial field counseling visit.'
FROM student_leads;

-- Telecall interactions (2 per lead)
INSERT INTO telecall_interactions (id, lead_id, called_at, created_at, updated_at, duration_seconds)
SELECT 
    gen_random_uuid(),
    id,
    NOW() - INTERVAL '3 hours',
    NOW() - INTERVAL '3 hours',
    NOW() - INTERVAL '3 hours',
    90
FROM student_leads;

INSERT INTO telecall_interactions (id, lead_id, called_at, created_at, updated_at, duration_seconds)
SELECT 
    gen_random_uuid(),
    id,
    NOW() - INTERVAL '3 hours',
    NOW() - INTERVAL '3 hours',
    NOW() - INTERVAL '3 hours',
    120
FROM student_leads;

-- Follow-up tasks
INSERT INTO follow_up_tasks (id, lead_id, due_date, status, created_at, updated_at)
SELECT 
    gen_random_uuid(),
    id,
    CURRENT_DATE - 30,
    'COMPLETED',
    NOW() - INTERVAL '3 hours',
    NOW() - INTERVAL '3 hours'
FROM student_leads;

-- 6. Insert Admission Records for the 10 admitted students in each AY (Permanent Records)
INSERT INTO admission_records (id, workspace_id, lead_id, application_number, fee_paid_amount, admitted_at)
SELECT 
    gen_random_uuid(),
    workspace_id,
    id,
    'APP-2024-' || SUBSTRING(id::text, 1, 8),
    25000.00,
    NOW() - INTERVAL '3 hours'
FROM student_leads
WHERE status = 'ADMITTED';

-- 7. Insert Verified Archival Manifests (Created 2 hours ago; snapshot timestamp 2 hours ago)
INSERT INTO workspace_archival_manifests (
    id, workspace_id, academic_year_id, s3_prefix,
    record_count, payload_sha256, export_snapshot_timestamp, status, created_at, verified_at
)
VALUES 
(
    '018f3a5e-0003-7000-8000-000000000001',
    '018f3a5e-0001-7000-8000-000000000001',
    '018f3a5e-0002-7000-8000-000000000001',
    's3://cold-archive/sri-siddhartha/ay1/',
    490, -- 500 leads minus 10 admitted leads
    'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    NOW() - INTERVAL '2 hours',
    'VERIFIED',
    NOW() - INTERVAL '2 hours',
    NOW() - INTERVAL '2 hours'
),
(
    '018f3a5e-0003-7000-8000-000000000002',
    '018f3a5e-0001-7000-8000-000000000001',
    '018f3a5e-0002-7000-8000-000000000002',
    's3://cold-archive/sri-siddhartha/ay2/',
    490,
    'd41d8cd98f00b204e9800998ecf8427e00000000000000000000000000000000',
    NOW() - INTERVAL '2 hours',
    'VERIFIED',
    NOW() - INTERVAL '2 hours',
    NOW() - INTERVAL '2 hours'
);

-- 8. Insert Authorized Archive Deletion Authorizations (24h expiry)
INSERT INTO workspace_archive_deletion_authorizations (
    id, workspace_id, academic_year_id, manifest_id,
    payload_sha256, canonical_payload_digest, canonical_payload_json,
    status, authorized_at, expires_at
)
VALUES 
(
    '018f3a5e-0004-7000-8000-000000000001',
    '018f3a5e-0001-7000-8000-000000000001',
    '018f3a5e-0002-7000-8000-000000000001',
    '018f3a5e-0003-7000-8000-000000000001',
    'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    'a1b2c3d4e5f60000000000000000000000000000000000000000000000000001',
    '{"eligible_leads": 490, "max_created_at": "2026-06-30T23:59:59Z"}'::jsonb,
    'AUTHORIZED',
    NOW() - INTERVAL '1 hour',
    NOW() + INTERVAL '23 hours'
),
(
    '018f3a5e-0004-7000-8000-000000000002',
    '018f3a5e-0001-7000-8000-000000000001',
    '018f3a5e-0002-7000-8000-000000000002',
    '018f3a5e-0003-7000-8000-000000000002',
    'd41d8cd98f00b204e9800998ecf8427e00000000000000000000000000000000',
    'a1b2c3d4e5f60000000000000000000000000000000000000000000000000002',
    '{"eligible_leads": 490, "max_created_at": "2026-06-30T23:59:59Z"}'::jsonb,
    'AUTHORIZED',
    NOW() - INTERVAL '1 hour',
    NOW() + INTERVAL '23 hours'
);

-- 9. Insert Independent Approval Events (Two distinct roles and approvers)
INSERT INTO workspace_archive_approval_events (
    id, authorization_id, approver_user_id, approver_role,
    canonical_payload_digest, mfa_ticket_id, signature_payload, approved_at
)
VALUES 
-- Approvals for AY1 Authorization
(
    gen_random_uuid(),
    '018f3a5e-0004-7000-8000-000000000001',
    '018f3a5e-0005-7000-8000-000000000001', -- College Admin User
    'COLLEGE_ADMIN',
    'a1b2c3d4e5f60000000000000000000000000000000000000000000000000001',
    'mfa_ticket_college_admin_ay1',
    'ed25519_sig_college_admin_ay1',
    NOW() - INTERVAL '1 hour'
),
(
    gen_random_uuid(),
    '018f3a5e-0004-7000-8000-000000000001',
    '018f3a5e-0005-7000-8000-000000000002', -- Platform Security Admin User (Distinct!)
    'PLATFORM_SECURITY_ADMIN',
    'a1b2c3d4e5f60000000000000000000000000000000000000000000000000001',
    'mfa_ticket_sec_admin_ay1',
    'ed25519_sig_sec_admin_ay1',
    NOW() - INTERVAL '1 hour'
),
-- Approvals for AY2 Authorization
(
    gen_random_uuid(),
    '018f3a5e-0004-7000-8000-000000000002',
    '018f3a5e-0005-7000-8000-000000000001',
    'COLLEGE_ADMIN',
    'a1b2c3d4e5f60000000000000000000000000000000000000000000000000002',
    'mfa_ticket_college_admin_ay2',
    'ed25519_sig_college_admin_ay2',
    NOW() - INTERVAL '1 hour'
),
(
    gen_random_uuid(),
    '018f3a5e-0004-7000-8000-000000000002',
    '018f3a5e-0005-7000-8000-000000000002',
    'PLATFORM_SECURITY_ADMIN',
    'a1b2c3d4e5f60000000000000000000000000000000000000000000000000002',
    'mfa_ticket_sec_admin_ay2',
    'ed25519_sig_sec_admin_ay2',
    NOW() - INTERVAL '1 hour'
);
