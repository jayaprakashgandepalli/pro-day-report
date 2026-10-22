-- =========================================================================
-- POC-DB-01: Synthetic Seed Test Data
-- Target: Dedicated Schema Namespace (poc_db_01) in Disposable Database
-- Characteristics: 100% Synthetic, Zero PII, Isolated Multi-Tenant Fixtures
-- =========================================================================

SET search_path TO poc_db_01, public;

-- Clean existing data strictly in poc_db_01 tables
TRUNCATE TABLE poc_db_01.field_visits,
               poc_db_01.student_leads,
               poc_db_01.workspace_memberships,
               poc_db_01.workspace_subscriptions,
               poc_db_01.workspaces RESTRICT;

-- 1. Insert Synthetic Workspaces
INSERT INTO poc_db_01.workspaces (id, legal_name, subdomain)
VALUES 
(
    '018f3a5e-0001-7000-8000-000000000001',
    'Apex Institute of Technology (Tenant A)',
    'apex-inst'
),
(
    '018f3a5e-0001-7000-8000-000000000002',
    'Beacon College of Engineering (Tenant B)',
    'beacon-col'
);

-- 2. Insert Workspace Subscriptions
-- Tenant A has 10 allocated seats; Tenant B has 5 allocated seats
INSERT INTO poc_db_01.workspace_subscriptions (id, workspace_id, plan_tier, total_allocated_seats)
VALUES 
(
    gen_random_uuid(),
    '018f3a5e-0001-7000-8000-000000000001',
    'FULL_COLLEGE_SUITE',
    10
),
(
    gen_random_uuid(),
    '018f3a5e-0001-7000-8000-000000000002',
    'AGM_BUNDLE',
    5
);

-- 3. Seed Workspace Memberships (Allocated Seats)
-- Tenant A: Seed 9 active members (1 seat remaining under the 10-seat cap for concurrency test)
-- Explicit synthetic user IDs for deterministic test assertions:
-- User W1 Admin: 018f3a5e-0002-7000-8000-000000000001
-- User W1 Staff: 018f3a5e-0002-7000-8000-000000000002
INSERT INTO poc_db_01.workspace_memberships (id, workspace_id, user_id, role, is_active)
VALUES 
(
    gen_random_uuid(),
    '018f3a5e-0001-7000-8000-000000000001',
    '018f3a5e-0002-7000-8000-000000000001',
    'COLLEGE_ADMIN',
    TRUE
),
(
    gen_random_uuid(),
    '018f3a5e-0001-7000-8000-000000000001',
    '018f3a5e-0002-7000-8000-000000000002',
    'PRO',
    TRUE
);

-- Seed remaining 7 active members for Tenant A (total 9 active seats)
INSERT INTO poc_db_01.workspace_memberships (id, workspace_id, user_id, role, is_active)
SELECT 
    gen_random_uuid(),
    '018f3a5e-0001-7000-8000-000000000001',
    gen_random_uuid(),
    'PRO',
    TRUE
FROM generate_series(3, 9) AS i;

-- Seed 1 inactive member for Tenant A (does not count towards seat cap, tests rejection of deactivated users)
INSERT INTO poc_db_01.workspace_memberships (id, workspace_id, user_id, role, is_active)
VALUES 
(
    gen_random_uuid(),
    '018f3a5e-0001-7000-8000-000000000001',
    '018f3a5e-0002-7000-8000-000000000099',
    'PRO',
    FALSE
);

-- Tenant B: Seed 2 active members (3 seats remaining under the 5-seat cap)
-- User W2 Staff: 018f3a5e-0002-7000-8000-000000000003
INSERT INTO poc_db_01.workspace_memberships (id, workspace_id, user_id, role, is_active)
VALUES 
(
    gen_random_uuid(),
    '018f3a5e-0001-7000-8000-000000000002',
    '018f3a5e-0002-7000-8000-000000000003',
    'PRO',
    TRUE
),
(
    gen_random_uuid(),
    '018f3a5e-0001-7000-8000-000000000002',
    gen_random_uuid(),
    'PRO',
    TRUE
);

-- 4. Seed Synthetic Student Leads
-- 50 Leads for Tenant A
INSERT INTO poc_db_01.student_leads (
    id, workspace_id, student_name,
    phone_blind_index_v2, encrypted_phone, status
)
SELECT 
    gen_random_uuid(),
    '018f3a5e-0001-7000-8000-000000000001',
    'Tenant A Student #' || i,
    md5('phone_tenant_a_' || i) || md5('salt_tenant_a_' || i),
    'enc_phone_a_' || i,
    'NEW_INQUIRY'
FROM generate_series(1, 50) AS i;

-- 50 Leads for Tenant B
INSERT INTO poc_db_01.student_leads (
    id, workspace_id, student_name,
    phone_blind_index_v2, encrypted_phone, status
)
SELECT 
    gen_random_uuid(),
    '018f3a5e-0001-7000-8000-000000000002',
    'Tenant B Student #' || i,
    md5('phone_tenant_b_' || i) || md5('salt_tenant_b_' || i),
    'enc_phone_b_' || i,
    'NEW_INQUIRY'
FROM generate_series(1, 50) AS i;

-- 5. Seed Synthetic Field Visits (1 per lead)
INSERT INTO poc_db_01.field_visits (id, workspace_id, lead_id, visited_at)
SELECT 
    gen_random_uuid(),
    workspace_id,
    id,
    NOW() - INTERVAL '1 day'
FROM poc_db_01.student_leads;
