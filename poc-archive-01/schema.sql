-- =========================================================================
-- POC-ARCHIVE-01: Minimal Reproducible Schema
-- Based on: docs/ARCHITECTURE_REVISION_3_1_5.md (Sections 6, 7, and 8)
-- Target: Isolated Disposable Test Database (shop_db)
-- =========================================================================

-- Clean up any previous test schema runs in this isolated database
DROP TABLE IF EXISTS audit_events CASCADE;
DROP TABLE IF EXISTS archive_deletion_exclusions CASCADE;
DROP TABLE IF EXISTS archive_deletion_batch_runs CASCADE;
DROP TABLE IF EXISTS workspace_archive_approval_events CASCADE;
DROP TABLE IF EXISTS workspace_archive_deletion_authorizations CASCADE;
DROP TABLE IF EXISTS workspace_archival_manifests CASCADE;
DROP TABLE IF EXISTS workspace_compliance_holds CASCADE;
DROP TABLE IF EXISTS admission_records CASCADE;
DROP TABLE IF EXISTS follow_up_tasks CASCADE;
DROP TABLE IF EXISTS telecall_interactions CASCADE;
DROP TABLE IF EXISTS field_visits CASCADE;
DROP TABLE IF EXISTS student_leads CASCADE;
DROP TABLE IF EXISTS academic_years CASCADE;
DROP TABLE IF EXISTS workspaces CASCADE;

-- 1. Workspaces (Tenant Anchor)
CREATE TABLE workspaces (
    id UUID PRIMARY KEY,
    legal_name VARCHAR(255) NOT NULL,
    subdomain VARCHAR(64) UNIQUE NOT NULL,
    subscription_tier VARCHAR(50) NOT NULL DEFAULT 'FULL_COLLEGE_SUITE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Academic Years (Cohort Anchor)
CREATE TABLE academic_years (
    id UUID PRIMARY KEY,
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE RESTRICT,
    year_label VARCHAR(32) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'CURRENT_OPERATIONAL', -- 'CURRENT_OPERATIONAL' | 'COHORT_CLOSED' | 'ARCHIVED'
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    archived_at TIMESTAMPTZ
);

-- 3. Student Leads (Root Operational Entity)
CREATE TABLE student_leads (
    id UUID PRIMARY KEY,
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE RESTRICT,
    academic_year_id UUID NOT NULL REFERENCES academic_years(id) ON DELETE RESTRICT,
    student_name VARCHAR(255) NOT NULL,
    phone_blind_index_v2 CHAR(64) NOT NULL,
    encrypted_phone TEXT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'NEW_INQUIRY', -- 'NEW_INQUIRY' | 'VISITED' | 'INTERESTED' | 'ADMITTED' | 'ENROLLED'
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- Index for keyset pagination & archival scans
CREATE INDEX idx_leads_ws_ay_id 
    ON student_leads (workspace_id, academic_year_id, id ASC);

CREATE INDEX idx_leads_ws_phone_v2 
    ON student_leads (workspace_id, phone_blind_index_v2);

-- 4. Dependent Child Interaction Entities
CREATE TABLE field_visits (
    id UUID PRIMARY KEY,
    lead_id UUID NOT NULL REFERENCES student_leads(id) ON DELETE CASCADE,
    visited_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    notes TEXT
);
CREATE INDEX idx_visits_lead ON field_visits (lead_id);

CREATE TABLE telecall_interactions (
    id UUID PRIMARY KEY,
    lead_id UUID NOT NULL REFERENCES student_leads(id) ON DELETE CASCADE,
    called_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    duration_seconds INT NOT NULL DEFAULT 60
);
CREATE INDEX idx_telecall_lead ON telecall_interactions (lead_id);

CREATE TABLE follow_up_tasks (
    id UUID PRIMARY KEY,
    lead_id UUID NOT NULL REFERENCES student_leads(id) ON DELETE CASCADE,
    due_date DATE NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_tasks_lead ON follow_up_tasks (lead_id);

-- 5. Permanent Admission Records (EXEMPT FROM DELETION)
CREATE TABLE admission_records (
    id UUID PRIMARY KEY,
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE RESTRICT,
    lead_id UUID NOT NULL REFERENCES student_leads(id) ON DELETE RESTRICT,
    application_number VARCHAR(64) UNIQUE NOT NULL,
    fee_paid_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    admitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Compliance Holds (Both Workspace-Wide and Academic-Year Specific)
CREATE TABLE workspace_compliance_holds (
    id UUID PRIMARY KEY,
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE RESTRICT,
    academic_year_id UUID REFERENCES academic_years(id) ON DELETE RESTRICT, -- NULL = Workspace-Wide
    hold_reason VARCHAR(255) NOT NULL,
    authorized_by UUID NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    placed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    released_at TIMESTAMPTZ
);
CREATE INDEX idx_holds_lookup ON workspace_compliance_holds (workspace_id, academic_year_id, is_active);

-- 7. Archival Manifests
CREATE TABLE workspace_archival_manifests (
    id UUID PRIMARY KEY,
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE RESTRICT,
    academic_year_id UUID NOT NULL REFERENCES academic_years(id) ON DELETE RESTRICT,
    s3_prefix VARCHAR(255) NOT NULL,
    record_count INT NOT NULL,
    payload_sha256 CHAR(64) NOT NULL,
    export_snapshot_timestamp TIMESTAMPTZ NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'EXPORTED', -- 'EXPORTED' | 'VERIFIED'
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    verified_at TIMESTAMPTZ
);

-- 8. Archive Deletion Authorizations
CREATE TABLE workspace_archive_deletion_authorizations (
    id UUID PRIMARY KEY,
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE RESTRICT,
    academic_year_id UUID NOT NULL REFERENCES academic_years(id) ON DELETE RESTRICT,
    manifest_id UUID NOT NULL REFERENCES workspace_archival_manifests(id) ON DELETE RESTRICT,
    payload_sha256 CHAR(64) NOT NULL,
    canonical_payload_digest CHAR(64) NOT NULL,
    canonical_payload_json JSONB NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING_APPROVAL', -- 'PENDING_APPROVAL' | 'AUTHORIZED' | 'IN_PROGRESS' | 'CONSUMED' | 'REVOKED' | 'PARTIALLY_PURGED_REQUIRES_REEXPORT'
    authorized_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ NOT NULL,
    consumed_at TIMESTAMPTZ,
    revoked_at TIMESTAMPTZ,
    revocation_reason VARCHAR(255)
);

-- 9. Approval Events (Two-Person Separation of Duties)
CREATE TABLE workspace_archive_approval_events (
    id UUID PRIMARY KEY,
    authorization_id UUID NOT NULL REFERENCES workspace_archive_deletion_authorizations(id) ON DELETE CASCADE,
    approver_user_id UUID NOT NULL,
    approver_role VARCHAR(50) NOT NULL, -- 'COLLEGE_ADMIN' | 'PLATFORM_SECURITY_ADMIN'
    canonical_payload_digest CHAR(64) NOT NULL,
    mfa_ticket_id VARCHAR(128) NOT NULL,
    signature_payload TEXT NOT NULL,
    signature_algorithm VARCHAR(32) NOT NULL DEFAULT 'ED25519',
    approved_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_auth_approver_role UNIQUE (authorization_id, approver_role)
);

-- 10. Durable Batch Progress Tracking
CREATE TABLE archive_deletion_batch_runs (
    id UUID PRIMARY KEY,
    authorization_id UUID NOT NULL REFERENCES workspace_archive_deletion_authorizations(id) ON DELETE CASCADE,
    batch_num INT NOT NULL,
    chunk_start_id UUID NOT NULL,
    chunk_end_id UUID NOT NULL,
    records_deleted_count INT NOT NULL,
    committed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_auth_batch UNIQUE (authorization_id, batch_num)
);

-- 11. Excluded Records Audit
CREATE TABLE archive_deletion_exclusions (
    id UUID PRIMARY KEY,
    authorization_id UUID NOT NULL REFERENCES workspace_archive_deletion_authorizations(id) ON DELETE CASCADE,
    lead_id UUID NOT NULL,
    reason VARCHAR(255) NOT NULL, -- 'RECORD_MUTATED_POST_EXPORT' | 'ADMISSION_EXEMPT'
    entity_updated_at TIMESTAMPTZ,
    detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 12. Audit Events
CREATE TABLE audit_events (
    id UUID PRIMARY KEY,
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE RESTRICT,
    event_type VARCHAR(100) NOT NULL,
    details JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
