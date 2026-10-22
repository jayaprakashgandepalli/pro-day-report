-- =========================================================================
-- POC-DB-01: PostgreSQL Data Access & Tenant Isolation Schema
-- Target: Dedicated Schema Namespace (poc_db_01) in Disposable Database
-- Role Boundary: Admin role runs DDL; poc_db_01_runtime_user runs runtime tests
-- Specification Reference: docs/ARCHITECTURE_REVISION_3_1_5.md (Section 5.6)
-- =========================================================================

-- 1. Create Dedicated Isolated Schema Namespace
CREATE SCHEMA IF NOT EXISTS poc_db_01;
SET search_path TO poc_db_01, public;

-- Clean up any prior test runs STRICTLY within the poc_db_01 schema namespace
-- (Zero effect on public schema or existing application tables)
DROP TABLE IF EXISTS poc_db_01.field_visits RESTRICT;
DROP TABLE IF EXISTS poc_db_01.student_leads RESTRICT;
DROP TABLE IF EXISTS poc_db_01.workspace_memberships RESTRICT;
DROP TABLE IF EXISTS poc_db_01.workspace_subscriptions RESTRICT;
DROP TABLE IF EXISTS poc_db_01.workspaces RESTRICT;
DROP FUNCTION IF EXISTS poc_db_01.set_tenant_context(UUID);
DROP FUNCTION IF EXISTS poc_db_01.set_tenant_context(UUID, UUID);

-- 2. Tenant Anchor (Workspaces)
CREATE TABLE poc_db_01.workspaces (
    id UUID PRIMARY KEY,
    legal_name VARCHAR(255) NOT NULL,
    subdomain VARCHAR(64) UNIQUE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Subscription & Staff-Seat Quota Table (Section 5.1)
CREATE TABLE poc_db_01.workspace_subscriptions (
    id UUID PRIMARY KEY,
    workspace_id UUID NOT NULL REFERENCES poc_db_01.workspaces(id) ON DELETE RESTRICT,
    plan_tier VARCHAR(50) NOT NULL DEFAULT 'FULL_COLLEGE_SUITE',
    total_allocated_seats INT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_sub_workspace UNIQUE (workspace_id)
);
CREATE INDEX idx_sub_workspace ON poc_db_01.workspace_subscriptions (workspace_id);

-- 4. Workspace Memberships (Allocated Seats)
CREATE TABLE poc_db_01.workspace_memberships (
    id UUID PRIMARY KEY,
    workspace_id UUID NOT NULL REFERENCES poc_db_01.workspaces(id) ON DELETE RESTRICT,
    user_id UUID NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'PRO',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_memberships_ws_active ON poc_db_01.workspace_memberships (workspace_id, is_active);

-- 5. Student Leads with Tenant-Scoped Phone Blind-Index (ADR-02 & Section 5.5)
CREATE TABLE poc_db_01.student_leads (
    id UUID PRIMARY KEY,
    workspace_id UUID NOT NULL REFERENCES poc_db_01.workspaces(id) ON DELETE RESTRICT,
    student_name VARCHAR(255) NOT NULL,
    phone_blind_index_v2 CHAR(64) NOT NULL,
    encrypted_phone TEXT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'NEW_INQUIRY',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- Composite Unique Index: Unique per workspace while active (deleted_at IS NULL)
CREATE UNIQUE INDEX idx_leads_workspace_phone_v2 
    ON poc_db_01.student_leads (workspace_id, phone_blind_index_v2) 
    WHERE deleted_at IS NULL;

CREATE INDEX idx_leads_ws ON poc_db_01.student_leads (workspace_id);

-- 6. Child Interaction Entity (Multi-Table Atomic Write Test)
CREATE TABLE poc_db_01.field_visits (
    id UUID PRIMARY KEY,
    workspace_id UUID NOT NULL REFERENCES poc_db_01.workspaces(id) ON DELETE RESTRICT,
    lead_id UUID NOT NULL REFERENCES poc_db_01.student_leads(id) ON DELETE CASCADE,
    visited_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_visits_ws_lead ON poc_db_01.field_visits (workspace_id, lead_id);

-- 7. Hardened Dual-Parameter Tenant Context Function
-- Architectural Note: Validates that p_user_id is an active member of p_workspace_id
-- and enforces in-transaction context immutability (cannot switch tenants mid-transaction).
-- TRUST BOUNDARY NOTICE: This database function relies on the application server having
-- authenticated p_user_id. It protects against cross-tenant switching for a given user,
-- but the database cannot distinguish whether p_user_id was forged if an attacker has
-- arbitrary SQL execution capabilities as poc_db_01_runtime_user.
CREATE OR REPLACE FUNCTION poc_db_01.set_tenant_context(
    p_user_id UUID,
    p_workspace_id UUID
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = poc_db_01, pg_temp
AS $$
DECLARE
    v_current_tenant TEXT;
    v_is_active_member BOOLEAN;
BEGIN
    -- 1. In-Transaction Context Immutability Guard
    -- Prevent mid-transaction context switching if already bound to a different tenant
    v_current_tenant := current_setting('app.current_tenant_id', true);
    IF v_current_tenant IS NOT NULL 
       AND v_current_tenant <> '' 
       AND v_current_tenant <> p_workspace_id::text THEN
        RAISE EXCEPTION 'AUTHORIZATION_FAILURE: Cannot switch tenant context within an active transaction'
            USING ERRCODE = '42501'; -- insufficient_privilege
    END IF;

    -- 2. Active Membership Validation Guard
    -- Verifies that p_user_id is an active member of p_workspace_id
    SELECT EXISTS (
        SELECT 1 
        FROM poc_db_01.workspace_memberships wm
        WHERE wm.workspace_id = p_workspace_id 
          AND wm.user_id = p_user_id 
          AND wm.is_active = TRUE
    ) INTO v_is_active_member;

    IF NOT v_is_active_member THEN
        -- Generic error message avoids leaking membership existence
        RAISE EXCEPTION 'AUTHORIZATION_FAILURE: Invalid tenant context or unauthorized user'
            USING ERRCODE = '42501'; -- insufficient_privilege
    END IF;

    -- 3. Parameter-Safe Transaction-Local Binding (is_local = true)
    PERFORM set_config('app.current_user_id', p_user_id::text, true);
    PERFORM set_config('app.current_tenant_id', p_workspace_id::text, true);
END;
$$;

-- 8. Row-Level Security Configuration
ALTER TABLE poc_db_01.student_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE poc_db_01.student_leads FORCE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_policy_leads ON poc_db_01.student_leads
    FOR ALL
    USING (
        workspace_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid
    )
    WITH CHECK (
        workspace_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid
    );

ALTER TABLE poc_db_01.field_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE poc_db_01.field_visits FORCE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_policy_visits ON poc_db_01.field_visits
    FOR ALL
    USING (
        workspace_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid
    )
    WITH CHECK (
        workspace_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid
    );

-- Workspace Memberships RLS: Runtime role only sees memberships in its established workspace
ALTER TABLE poc_db_01.workspace_memberships ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_policy_memberships ON poc_db_01.workspace_memberships
    FOR ALL
    USING (
        workspace_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid
    )
    WITH CHECK (
        workspace_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid
    );

-- 9. Unprivileged Runtime Role Provisioning
-- The application runtime role must NEVER have SUPERUSER or BYPASSRLS
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'poc_db_01_runtime_user') THEN
        CREATE ROLE poc_db_01_runtime_user WITH LOGIN PASSWORD 'poc_runtime_pass_safe_placeholder' NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS;
    ELSE
        RAISE EXCEPTION 'ROLE_COLLISION_DETECTED: Role "poc_db_01_runtime_user" already exists in the cluster. Setup aborted to avoid altering or overwriting an existing role.'
            USING ERRCODE = '55000'; -- object_not_in_prerequisite_state
    END IF;
END $$;

-- Revoke default PUBLIC execute privilege on the security definer function
REVOKE ALL ON FUNCTION poc_db_01.set_tenant_context(UUID, UUID) FROM PUBLIC;

-- Grant minimal necessary permissions to poc_db_01_runtime_user
GRANT USAGE ON SCHEMA poc_db_01 TO poc_db_01_runtime_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA poc_db_01 TO poc_db_01_runtime_user;
GRANT EXECUTE ON FUNCTION poc_db_01.set_tenant_context(UUID, UUID) TO poc_db_01_runtime_user;
