# POC-ARCHIVE-01: Empirical Archival Deletion & Concurrency Validation Report

**Document Reference:** [ARCHITECTURE_REVISION_3_1_5.md](file:///x:/Prasad%20projact%20works/PRO%20day%20report/docs/ARCHITECTURE_REVISION_3_1_5.md)  
**Execution Date:** 2026-10-18  
**Target Environment:** Isolated PostgreSQL 18.3 x64 (`shop_db` at `127.0.0.1:5432`)  
**Target Directory:** Strictly confined to `poc-archive-01/`  
**Application Integrity:** Verified 100% untouched. Zero modifications to production source code, dependencies, or production databases.

---

## 1. Executive Summary

`POC-ARCHIVE-01` was executed to empirically validate the archival deletion protocol, concurrency control invariants, compliance hold serialization, post-export mutation detection, and crash recovery mechanisms specified in Architecture Revision 3.1.5.

Following rigorous technical audit feedback, the test harness was strengthened to address critical edge cases:
1. **Silent Data Loss Prevention (Test 4):** PostgreSQL returns `UPDATE 0` without raising an error when a target row is deleted while an update waits on a row lock. The test now strictly requires and validates application-level conflict detection: either the mutation commits before deletion and the record is preserved, or the application explicitly detects `rowsUpdated === 0` and raises an `ARCHIVE_CONCURRENT_DELETION_CONFLICT` error.
2. **Telecall Mutation Coverage & Manifest SHA-256 (Test 3):** Added `updated_at` tracking to `telecall_interactions` to verify that edits to existing interaction records trigger exclusion. Computed genuine SHA-256 digests for export manifests.
3. **Crash & Recovery Proof (Test 6):** Proves process termination (`isKilled = true`), verifies immediate PostgreSQL transaction rollback (live lead count remains 300), and validates durable checkpoint resumption by a replacement worker.

### Overall Results Summary

| Test ID | Test Scenario | Status | Measured Metric | Key Invariant Verified |
| :--- | :--- | :---: | :--- | :--- |
| **TEST-01** | Workspace-wide compliance hold serialization & revocation | **PASS** | Lock wait: **602 ms** | Active hold placed mid-run immediately serializes on workspace lock and blocks subsequent batches across all cohorts. |
| **TEST-02** | Academic-year hold & cross-cohort serialization bottleneck | **PASS** | Serialization wait: **393 ms** | Cohort hold on AY1 halts AY1 while permitting AY2; locking `workspaces` serializes cross-cohort runs. |
| **TEST-03** | Post-export mutation detection (including telecall edits & SHA-256) | **PASS** | Exclusions logged: **5 / 5**<br>Hash: `0ac5f1d...` | All 5 mutated entities (lead row, visit, new telecall, telecall edit, task) are excluded and preserved; safe leads deleted. |
| **TEST-04** | Freshness-check vs. Delete race condition & explicit conflict guard | **PASS** | Client wait: **598 ms**<br>Conflict: **Explicit** | Pre-lock mutation preserved; concurrent update on deleted lead triggers explicit application conflict error (no silent loss). |
| **TEST-05** | Authorization revocation mid-cleanup | **PASS** | Remaining leads: **300 / 500** | Revocation after Batch 1 is immediately caught at Batch 2 start; cleanup safely halts without data loss. |
| **TEST-06** | Worker crash failure recovery & checkpoint resumption | **PASS** | Rollback: **300 leads**<br>Final AY1: **10 admitted** | Terminated Worker 1 transaction rolled back cleanly; Worker 2 resumes from checkpoint cursor to completion. |

**Final Suite Score:** **6 Passed / 0 Failed (100% Success on Disposable Local Database)**

---

## 2. Test Environment & Credential Safety

To guarantee zero impact on existing application infrastructure and production Supabase databases:

1. **Isolation Guarantee:** The test harness connects exclusively to a dedicated, standalone PostgreSQL database instance (`shop_db` on `127.0.0.1:5432`). It does not connect to any production database or remote network host.
2. **Credential Sanitization:** Hardcoded fallback credentials have been removed from test runners. Configuration is loaded strictly from environment variables or `.env.poc`.
3. **Configuration Template (`poc-archive-01/.env.poc`):**
   ```env
   POC_DB_HOST="127.0.0.1"
   POC_DB_PORT="5432"
   POC_DB_USER="postgres"
   POC_DB_PASS="<YOUR_LOCAL_DB_PASSWORD>"
   POC_DB_NAME="shop_db"
   PSQL_PATH="C:\\Program Files\\PostgreSQL\\18\\bin\\psql.exe"
   ```

---

## 3. Detailed Empirical Test Results

### TEST-01: Workspace-Wide Compliance Hold Serialization & Revocation

- **Objective:** Verify that placing a workspace-level hold (`academic_year_id = NULL`) blocks on active batch cleanup, acquires the workspace lock once Batch 1 commits, revokes active authorizations, and immediately halts subsequent deletion batches across all cohorts.
- **Execution Flow:**
  1. Worker AY1 begins transaction, acquires `FOR UPDATE` on `workspaces` and `academic_years (AY1)`, deletes 200 leads (Batch 1), records the batch in `archive_deletion_batch_runs`, and holds locks during simulated processing (`pg_sleep(0.8)`).
  2. Concurrently at $t = 200\text{ ms}$, Hold Creator begins transaction and requests `SELECT id FROM workspaces WHERE id = W1 FOR UPDATE`.
  3. PostgreSQL forces Hold Creator to wait on the workspace row lock.
  4. Worker AY1 completes Batch 1 and commits at $t = 800\text{ ms}$.
  5. Hold Creator unblocks (measured lock wait time: **602 ms**), inserts `workspace_compliance_holds` (`STATUTORY_AUDIT_WORKSPACE_WIDE`), revokes active authorizations (`SET status = 'REVOKED'`), and commits.
  6. Worker AY1 attempts Batch 2: acquires workspace lock, checks authorization status, observes `REVOKED`, and issues clean `ROLLBACK`.
  7. Worker AY2 attempts Batch 1: checks workspace holds, observes active workspace-wide audit hold, and issues clean `ROLLBACK`.
- **Measured Empirical Metrics:**
  - Hold Creator wait time: **602 ms**
  - AY1 live leads remaining: **300** (Batch 1 committed 200 deletes; Batch 2 cleanly aborted)
  - AY2 live leads remaining: **500** (Zero deletes executed)
  - Recorded batch runs: **1**
- **Verdict:** **PASS**

---

### TEST-02: Academic-Year-Specific Hold & Cross-Cohort Serialization Bottleneck

- **Objective:** Demonstrate that a cohort-specific hold on AY1 halts AY1 cleanup while permitting AY2 cleanup to proceed once locks clear. Quantify whether locking `workspaces` serializes all cohorts in a tenant.
- **Execution Flow:**
  1. Hold Creator inserts a compliance hold specifically for AY1 (`academic_year_id = AY1_ID`) and revokes AY1 authorization.
  2. Worker AY1 begins transaction, locks workspace, and simulates work for 500 ms.
  3. Worker AY2 concurrently begins transaction to clean AY2 and requests `SELECT id FROM workspaces WHERE id = W1 FOR UPDATE`.
  4. Worker AY2 is blocked by Worker AY1's workspace-level lock despite operating on a completely separate academic year (`AY2_ID` vs `AY1_ID`).
  5. Worker AY1 evaluates authorization, sees `REVOKED`, and rolls back.
  6. Worker AY2 unblocks (measured serialization wait time: **393 ms**), locks `AY2_ID`, confirms authorization is `AUTHORIZED` and no hold applies to AY2, deletes 200 leads, records the batch, and commits.
- **Measured Empirical Metrics:**
  - Cross-cohort lock serialization delay: **393 ms**
  - AY1 live leads remaining (held): **500** (100% preserved)
  - AY2 live leads remaining (un-held): **300** (200 unadmitted leads deleted)
- **Architectural Finding:** Locking the root `workspaces` row enforces strict cross-cohort serialization within the same tenant.
- **Verdict:** **PASS**

---

### TEST-03: Post-Export Mutation Detection (Including Telecall Edits & SHA-256 Manifest)

- **Objective:** Verify that candidate leads mutated after the archival export snapshot are detected and excluded, with specific coverage for edits to existing telecalls and cryptographic manifest validation.
- **Execution Flow:**
  1. Database baseline: manifest export snapshot timestamp set to $T_{\text{snapshot}} = \text{NOW}() - 2\text{ hours}$.
  2. Manifest payload verification: Genuine SHA-256 digest computed across the candidate lead export payload (`0ac5f1d5127f3e0a184d04949966292d23f343ee8c975cbb4024846dfaa57118`) and bound to manifest and authorization.
  3. Five candidate leads in AY1 receive post-export mutations at $T_{\text{mutation}} = \text{NOW}() - 30\text{ minutes}$:
     - **Lead A:** Direct lead row updated (`updated_at > T_{\text{snapshot}}`).
     - **Lead B:** New counseling `field_visits` record inserted (`visited_at > T_{\text{snapshot}}`).
     - **Lead C:** New `telecall_interactions` record inserted (`called_at > T_{\text{snapshot}}`).
     - **Lead D (Telecall Edit):** Existing telecall interaction record edited (`updated_at > T_{\text{snapshot}}`, `duration_seconds = 300`). Validates `telecall_interactions.updated_at` column.
     - **Lead E:** New `follow_up_tasks` record inserted (`updated_at > T_{\text{snapshot}}`).
  4. Worker runs deduplicated pre-batch mutation detection query:
     ```sql
     INSERT INTO archive_deletion_exclusions (id, authorization_id, lead_id, reason, entity_updated_at, detected_at)
     SELECT gen_random_uuid(), '${AUTH_AY1_ID}'::uuid, sub.id, 'RECORD_MUTATED_POST_EXPORT', sub.updated_at, NOW()
     FROM (
         SELECT DISTINCT l.id, l.updated_at
         FROM student_leads l
         LEFT JOIN field_visits fv ON fv.lead_id = l.id AND (fv.updated_at > m.export_snapshot_timestamp OR fv.visited_at > m.export_snapshot_timestamp)
         LEFT JOIN telecall_interactions ti ON ti.lead_id = l.id AND (ti.called_at > m.export_snapshot_timestamp OR ti.updated_at > m.export_snapshot_timestamp)
         LEFT JOIN follow_up_tasks ft ON ft.lead_id = l.id AND ft.updated_at > m.export_snapshot_timestamp
         WHERE l.id IN (SELECT id FROM candidate_batch)
         AND (l.updated_at > m.export_snapshot_timestamp OR fv.id IS NOT NULL OR ti.id IS NOT NULL OR ft.id IS NOT NULL)
     ) sub;
     ```
  5. Exactly 5 exclusions are recorded.
  6. Worker computes `safe_leads = candidate_batch - excluded_leads` (the 5 non-mutated leads) and deletes only those 5 safe leads. Commits.
- **Measured Empirical Metrics:**
  - Export manifest SHA-256: `0ac5f1d5127f3e0a184d04949966292d23f343ee8c975cbb4024846dfaa57118`
  - Mutated Lead A preserved: **true**
  - Mutated Lead B (visit) preserved: **true**
  - Mutated Lead C (telecall added) preserved: **true**
  - Mutated Lead D (telecall edited) preserved: **true** (Proves `telecall_interactions.updated_at` detection)
  - Mutated Lead E (task) preserved: **true**
  - Admitted leads preserved: **10 / 10**
  - Exclusions logged in database: **5**
  - Total AY1 leads remaining: **495** (500 initial - 5 safe deleted = 495)
- **Scope Limitation Note:** This test evaluates timestamp-based exclusions. It verifies that indexed timestamp triggers detect mutations. It does not perform a live byte-level comparison of all PostgreSQL fields against cold S3 storage objects.
- **Verdict:** **PASS**

---

### TEST-04: Freshness-Check vs. Delete Race Condition & Explicit Conflict Guard

- **Objective:** Address the silent data loss problem (`UPDATE 0`). Demonstrate both explicit required outcomes:
  1. *Outcome A:* Pre-lock client mutation commits before archival deletion, and the record is preserved.
  2. *Outcome B:* Archival worker acquires lock first. Concurrent application update encounters a deleted record, explicitly detects `rowsUpdated === 0`, and raises an explicit conflict error rather than silently reporting success.
  3. *Outcome C:* Under `REPEATABLE READ`, database engine throws explicit serialization failure.
- **Execution Flow:**
  - **Part 4A (Pre-Lock Mutation Commits First):**
    1. Client updates Lead 4A and commits.
    2. Worker executes batch covering Lead 4A.
    3. Pre-batch check detects Lead 4A was mutated post-snapshot, logs exclusion, and skips Lead 4A.
    4. Lead 4A remains preserved in live database (`PRE_LOCK_SAVED_STUDENT`).
  - **Part 4B (Archival Lock Acquired First - Anti-Silent Data Loss):**
    1. Worker acquires `FOR UPDATE` row lock on Lead 4B and sleeps for 800 ms.
    2. Concurrently at $t = 200\text{ ms}$, Client attempts mutation on Lead 4B with application-layer guard:
       ```sql
       WITH upd AS (
           UPDATE student_leads 
           SET student_name = 'CONCURRENT_HACK' 
           WHERE id = '${lead4B}' 
           RETURNING id
       )
       SELECT count(*) AS rows_updated FROM upd;
       ```
    3. Client blocks waiting on Worker's row lock (measured wait time: **598 ms**).
    4. Worker completes deletion of Lead 4B and child rows, then commits.
    5. Client unblocks. In PostgreSQL `READ COMMITTED` mode, the target row was deleted, so `upd` produces 0 rows, and `SELECT count(*)` returns `0`.
    6. **Application Guard Activation:** Client inspects `rowsUpdated === 0`, flags `clientApplicationConflictRaised = true`, generates user-facing error message:
       `ARCHIVE_CONCURRENT_DELETION_CONFLICT: Target lead was archived/deleted concurrently. Changes aborted.`,
       and executes `ROLLBACK;`.
  - **Part 4C (Database Engine-Level Conflict Under REPEATABLE READ):**
    1. Client begins `REPEATABLE READ` transaction and reads Lead 4C.
    2. Worker deletes Lead 4C and commits.
    3. Client attempts `UPDATE student_leads WHERE id = '${lead4C}'`.
    4. PostgreSQL engine rejects update with serialization error (`could not serialize access due to concurrent update`).
- **Measured Empirical Metrics:**
  - Part 4A: Pre-lock mutation committed and PRESERVED: **true**
  - Part 4B: Worker locked first, Client blocked: **true** (**598 ms**)
  - Part 4B: Explicit application conflict reported: **true**
  - Part 4B: Error message returned to caller: `"ARCHIVE_CONCURRENT_DELETION_CONFLICT: Target lead was archived/deleted concurrently. Changes aborted."`
  - Part 4C: Engine-level conflict verification: **true**
- **Verdict:** **PASS**

---

### TEST-05: Authorization Revocation Mid-Cleanup

- **Objective:** Verify that if an administrator revokes an authorization while cleanup is underway, subsequent batch runs immediately detect the revocation and abort.
- **Execution Flow:**
  1. Worker executes Batch 1 (200 rows deleted) and commits.
  2. Administrator executes manual revocation:
     ```sql
     UPDATE workspace_archive_deletion_authorizations 
     SET status = 'REVOKED', revoked_at = NOW(), revocation_reason = 'ADMIN_MANUAL_CANCEL'
     WHERE id = AUTH_AY1_ID;
     ```
  3. Worker begins Batch 2, revalidates authorization under lock, detects it is `REVOKED`, and cleanly rolls back.
- **Measured Empirical Metrics:**
  - Batch 2 cleanly halted: **true**
  - Live leads remaining: **300**
  - Recorded batch runs: **1**
- **Verdict:** **PASS**

---

### TEST-06: Worker Crash Failure Recovery & Checkpoint Resumption

- **Objective:** Verify that an abrupt worker process termination rolls back in-flight uncommitted deletes, and that a replacement worker discovers the durable checkpoint cursor and completes cleanup.
- **Execution Flow:**
  1. Worker 1 executes Batch 1 (200 leads), commits, and records checkpoint: `batch_num = 1`, `chunk_end_id = lead_200_id`.
  2. Worker 1 begins Batch 2, executes in-flight deletes for 100 rows, and is abruptly terminated via `SIGKILL` (PID 30968).
  3. **Crash Verification:** Test confirms Worker 1 process exited (`worker1Terminated = true`).
  4. **PostgreSQL Rollback Audit:** Direct query immediately post-crash proves all 100 in-flight uncommitted deletes were rolled back. Live lead count in DB: exactly **300** (500 initial - 200 committed = 300).
  5. Worker 2 (replacement worker) boots up, queries latest committed checkpoint from `archive_deletion_batch_runs`:
     `Discovered last committed checkpoint: batch_num = 1 | records_deleted_count = 200`.
  6. Worker 2 resumes cleanup from cursor, deletes remaining unadmitted leads, records `batch_num = 2`, marks authorization `'CONSUMED'`, and sets academic year to `'ARCHIVED'`. Commits.
- **Measured Empirical Metrics:**
  - Worker 1 process terminated on crash: **true**
  - Mid-crash live leads in DB (rollback verified): **300**
  - Final live leads in AY1: **10** (100% of admitted students preserved)
  - Final admitted students count: **10**
  - Academic year final status: **`ARCHIVED`**
  - Authorization final status: **`CONSUMED`**
- **Verdict:** **PASS**

---

## 4. Key Architectural Findings & Limitations

### 1. The Silent Data Loss Guard Contract
PostgreSQL's default `READ COMMITTED` isolation level handles concurrent deletion of a locked row by evaluating `UPDATE` against the latest row version. If the row was deleted by the locking transaction, the update affects 0 rows without raising a SQL error.
- **Engineering Rule:** In production application mutation handlers, any update to student leads or child records must inspect the affected row count (e.g. `rowCount === 0` in node-postgres or `RETURNING id` count in Supabase/PostgREST). If 0 rows are returned for an existing record, the application must return an explicit `409 Conflict` (`ARCHIVE_CONCURRENT_DELETION_CONFLICT`) rather than a `200 OK`.

### 2. PoC vs. Production Safety Boundaries
These tests prove that:
- PostgreSQL's row locking and hierarchical table locking prevent orphaned updates.
- Crash recovery and uncommitted transaction rollbacks function reliably at the database engine level.
- Durable checkpoint cursors prevent duplicate deletion and resume accurately.

**What these tests do NOT prove:**
- They do not test production Next.js/Supabase application code, API routes, or React UI components.
- They do not test Supabase Row Level Security (RLS) policies or PgBouncer in transaction pooling mode.
- They do not test production cold storage verification (S3/Wasabi multipart checksums).
- Production safety guarantees will require end-to-end integration testing in the production application environment once implemented.

---

## 5. Artifacts and Reproducibility

All PoC code and artifacts are located in `poc-archive-01/`:

1. [`poc-archive-01/schema.sql`](file:///x:/Prasad%20projact%20works/PRO%20day%20report/poc-archive-01/schema.sql): Complete DDL for the 12 core archival entities, foreign keys, and indexes (including `telecall_interactions.updated_at`).
2. [`poc-archive-01/seed.sql`](file:///x:/Prasad%20projact%20works/PRO%20day%20report/poc-archive-01/seed.sql): Deterministic dataset containing 1,000 leads, child visits/calls/tasks, admitted records, manifests, and dual-approved authorizations.
3. [`poc-archive-01/test_runner.js`](file:///x:/Prasad%20projact%20works/PRO%20day%20report/poc-archive-01/test_runner.js): Automated multi-session concurrency runner with explicit conflict assertions and manifest SHA-256 calculation.
4. [`poc-archive-01/POC_ARCHIVE_01_RESULTS.json`](file:///x:/Prasad%20projact%20works/PRO%20day%20report/poc-archive-01/POC_ARCHIVE_01_RESULTS.json): Raw execution output with millisecond measurements.
5. [`poc-archive-01/.env.poc`](file:///x:/Prasad%20projact%20works/PRO%20day%20report/poc-archive-01/.env.poc): Local disposable database connection configuration.

### How to Re-Run Suite:
```bash
cd "x:\Prasad projact works\PRO day report"
node poc-archive-01/test_runner.js
```
