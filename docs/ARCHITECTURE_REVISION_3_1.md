# Architecture Revision 3.1: Final Technical Corrections Before PoCs

**Document Status:** Architecture Revision 3.1 (Pre-PoC Technical Baseline)  
**System:** Multi-Tenant College Admissions Operations & Field Force SaaS  
**Scope Classification:** Phase 1 Operational Core  
**Role:** Principal SaaS Architect & Application Security Architect  
**Predecessor Baselines:** Revision 2.0 and Revision 3.0 (Preserved in full)  
**Document Purpose:** Resolve physical device clock/reboot feasibility, unify HMAC-SHA256 session hashing, correct PostgreSQL partial unique indexes, parameterize RLS context, harden downgrade safety, detail cross-workspace migrations, and establish concrete PoC exit criteria and fallbacks.  
**Implementation Boundary:** Strictly non-implemented specification. Zero application code, dependencies, schemas, migrations, or configurations modified.

---

## 1. Executive Architecture Summary & Governance Log

```mermaid
flowchart TD
    subgraph Approved_Decisions ["Locked Architectural Decisions (Approved)"]
        A1["ADR-01: Shared Feeder-School Master Directory\nCanonical Master Shared; Contacts & Notes Tenant-Private\n[APPROVED]"]
        A2["ADR-02: Phone Duplicate Scope\nTenant-Scoped via HMAC Blind Index + Partial Unique Index\n[APPROVED]"]
        A3["ADR-03: Mobile Offline Operational Lease\n48h Monotonic Lease + Online Revalidation on Reboot\n[APPROVED]"]
        A4["ADR-04: Staff Seat Quota Enforcement\nHard-Cap per Workspace Subscription (Fails Closed)\n[APPROVED]"]
        A5["ADR-05: Personal Influencer Contacts\nPrivate to Responsible Staff; Archived on Staff Departure\n[APPROVED]"]
    end

    subgraph Proposed_Specs ["Proposed Architectural Specifications (Revision 3.1)"]
        P1["ADR-06: Commercial Packages\nIndividual PRO, AGM Bundle, Full College Suite\n[PROPOSED SPECIFICATION]"]
        P2["ADR-07: School Identity Resolution\nMulti-Tier Matching + Human Review Queue + Reversible Merges\n[PROPOSED SPECIFICATION]"]
        P3["ADR-08: RLS Fail-Closed Context\nParameterized set_config + Restricted app_runtime_user\n[PROPOSED SPECIFICATION]"]
        P4["ADR-09: Cryptographic Phone Pipeline\nE.164 Clean + AES-256-GCM + Blind Index + Key Rotation\n[PROPOSED SPECIFICATION]"]
    end

    subgraph Open_Questions ["Open Owner Decisions Requiring Sign-Off"]
        Q1["Issue 1: Individual PRO Workspace Migration Policy"]
        Q2["Issue 2: AGM Bundle Add-On PRO Seats"]
        Q3["Issue 3: Provisional School Promotion Expiry Policy"]
    end
```

### 1.1 Formally Approved Decisions (Locked Baseline)

| Decision Reference | Area | Formal Policy & Architectural Enforcement Mechanism | Governance Status |
| :--- | :--- | :--- | :---: |
| **ADR-01** | Feeder Schools | **Shared Canonical Directory with Tenant-Private Overlays:** Government school registries (UDISE codes, canonical names, geographic mandals) are shared across all tenants. All headmaster contact numbers, private notes, institutional ratings, and staff allocations remain strictly tenant-private. | **APPROVED** |
| **ADR-02** | Lead Uniqueness | **Per-Tenant Phone Uniqueness:** Student phone number uniqueness is enforced strictly within each college tenant via `(workspace_id, phone_blind_index)`. College B is fully permitted to prospect a student previously contacted by College A without cross-tenant conflict or data leakage. | **APPROVED** |
| **ADR-03** | Mobile Operation | **48-Hour Monotonic Lease + Online Revalidation on Reboot:** Field PRO mobile clients are permitted an autonomous offline operational window of up to 48 hours while running. Because standard consumer mobile OSs reset monotonic clocks on power cycle, rebooting while offline requires online revalidation before local database access resumes. | **APPROVED** |
| **ADR-04** | SaaS Quotas | **Hard Staff-Seat Quota Enforcement:** Subscription plans enforce hard caps on active staff memberships (`max_staff_seats`). API attempts to provision staff beyond the entitlement fail closed with HTTP 422 until upgraded. | **APPROVED** |
| **ADR-05** | Contact Privacy | **Personal Relative/Influencer Ownership & Departure Archival:** Village relative and influencer referral contacts mapped by a PRO are private to that staff member. Upon employee departure or deactivation, contacts are archived and hidden, not transferred to competing staff. | **APPROVED** |

### 1.2 Open Commercial Questions Requiring Owner Sign-Off

1. **Individual PRO Workspace Migration into College Suite:** When an independent PRO subscriber is hired by a college using the Full College Suite, should their personal leads be imported via an audited, dual-consent cryptographic re-keying wizard, or must their independent workspace remain strictly isolated?  
   *Architecture Recommendation:* Keep workspaces separate by default; provide an explicit, audited migration wizard requiring dual authorization (PRO + College Admin).
2. **AGM Bundle Add-On PRO Seats:** Can an AGM Bundle purchase individual PRO add-on seats beyond the bundled tier (e.g., base package of 5 PROs expanded to 8), or must they upgrade to a Full College Suite?  
   *Architecture Recommendation:* Support incremental PRO seat add-on entitlements.
3. **Provisional School Auto-Promotion:** If a provisional school submission by College A remains in the review queue unreviewed by the Platform Admin for $>30$ days, should it be auto-promoted to Canonical status, or remain Provisional indefinitely?  
   *Architecture Recommendation:* Remain Provisional indefinitely to prevent registry corruption.

---

## 2. Commercial Packaging and Domain Entitlement Model

### 2.1 The Three Commercial Packages

The platform provides a single unified codebase supporting three commercial packages. Package limits and feature flags are evaluated dynamically; no hardcoded package-specific code paths exist.

```mermaid
flowchart LR
    subgraph Package_Tiers ["Three Commercial Packages"]
        P1["Package 1: Individual PRO\n• 1 PRO Seat\n• Personal Lead Workspace\n• Doorstep Visits & Alarms\n• Personal Day-End PDF Export\n• No Supervisory Hierarchy"]
        P2["Package 2: AGM Bundle\n• 1 AGM + 2-10 PRO Seats\n• Zone & Mandal Territory Mgmt\n• Team Performance Oversight\n• AGM Team PDF Export\n• PRO PDF Export Disabled\n• No Telecaller / Admin Workspace"]
        P3["Package 3: Full College Suite\n• College Admin + AGM + PRO + Telecaller\n• College Admissions Operations\n• Catchment Penetration Analytics\n• Spot Admission & App Numbering\n• College Admin PDF Export\n• AGM/PRO Export Disabled by Default"]
    end
```

1. **Individual PRO Package:**
   - **Target User:** Independent admission consultants or freelance field representatives.
   - **Workspace Model:** Single-member workspace.
   - **Authorized Capabilities:** Personal lead entry, village student selector, doorstep visit recording, dynamic callback alarms, and **personal daily activity PDF exports**.
   - **Restricted Capabilities:** No supervisory staff management, no AGM dashboards, no feeder school catchment analytics, no telecaller desks.
2. **AGM Bundle:**
   - **Target User:** Regional managers overseeing a regional field team across 5 to 20 mandals.
   - **Workspace Model:** Multi-member team workspace (1 AGM seat + configurable PRO seats).
   - **Authorized Capabilities:** Team task assignment, territory allocation, PRO visit monitoring, and **AGM-level team/territory PDF reports**.
   - **Restricted Capabilities:** PRO seats have **PDF export disabled by default**; no central College Admin console; no telecaller lead distribution desks.
3. **Full College Suite:**
   - **Target User:** Accredited intermediate and junior colleges with multi-branch or campus operations.
   - **Workspace Model:** Enterprise institutional workspace.
   - **Authorized Capabilities:** Full administrative hierarchy (`COLLEGE_ADMIN`, `AGM`, `PRO`, `TELECALLER`), multi-branch scoping, spot admission recording with application number sequencing, feeder school catchment intelligence, and **College Admin-level authorized PDF exports**.
   - **Restricted Capabilities:** Field PRO and AGM PDF exports disabled by default to prevent unauthorized bulk data exfiltration.

---

### 2.2 Domain Separation: Subscriptions, Workspaces, Roles, and Entitlements

The domain model completely decouples **Commercial Subscriptions**, **Workspaces**, **User Roles**, and **Feature Entitlements**:

```mermaid
erDiagram
    PRODUCT_PLAN ||--o{ PLAN_ENTITLEMENT : "defines"
    PRODUCT_PLAN ||--o{ WORKSPACE_SUBSCRIPTION : "purchased_as"
    WORKSPACE ||--o{ WORKSPACE_SUBSCRIPTION : "governed_by"
    WORKSPACE ||--o{ WORKSPACE_MEMBERSHIP : "contains"
    USER_IDENTITY ||--o{ WORKSPACE_MEMBERSHIP : "participates_as"
    WORKSPACE_MEMBERSHIP ||--o{ MEMBERSHIP_ROLE : "assigned"
    ROLE ||--o{ ROLE_PERMISSION : "grants"

    WORKSPACE_SUBSCRIPTION {
        uuid id PK
        uuid workspace_id FK
        uuid plan_id FK
        enum status "ACTIVE | TRIALING | SUSPENDED | CANCELLED"
        int max_pro_seats
        int max_agm_seats
        int max_telecaller_seats
        timestamptz current_period_end
    }

    ROLE {
        uuid id PK
        varchar code "COLLEGE_ADMIN | AGM | PRO | TELECALLER"
        varchar name
    }

    ROLE_PERMISSION {
        uuid id PK
        uuid role_id FK
        varchar permission_code "lead:create | report:export:self | report:export:team"
    }

    PLAN_ENTITLEMENT {
        uuid id PK
        uuid plan_id FK
        varchar feature_code "FEAT_PDF_EXPORT_PERSONAL | FEAT_TELECALLER_DESK"
        boolean is_enabled
    }
```

#### Effective Access Evaluation Formula
Access to any protected capability is evaluated at runtime via a three-way intersection:
$$\text{Effective Access} = \text{Package Entitlement} \cap \text{Role Permission} \cap \text{Record Authorization Scope}$$

- If an action is not entitled by the workspace subscription, access is rejected (HTTP 403 `PACKAGE_NOT_ENTITLED`).
- If an action is entitled by the package, but the user's role lacks the permission, access is rejected (HTTP 403 `ROLE_NOT_AUTHORIZED`).
- If both package and role permit the action, access is evaluated against the user's geographic/assignment scope (e.g., PRO accessing only their assigned leads; AGM accessing only their zone).

---

### 2.3 Package-to-Feature Entitlement Matrix

| Feature Code | Capability Description | Individual PRO | AGM Bundle | Full College Suite |
| :--- | :--- | :---: | :---: | :---: |
| `FEAT_LEAD_CAPTURE` | Create and manage prospective student leads | **Enabled** | **Enabled** | **Enabled** |
| `FEAT_DOORSTEP_VISIT` | Record doorstep visits and dynamic alarms | **Enabled** | **Enabled** | **Enabled** |
| `FEAT_WHATSAPP_CARD` | Generate on-device watermarked WhatsApp cards | **Enabled** | **Enabled** | **Enabled** |
| `FEAT_OFFLINE_SYNC` | Mobile offline SQLite queue and sync | **Enabled** | **Enabled** | **Enabled** |
| `FEAT_PDF_EXPORT_PERSONAL` | Export personal daily activity PDF reports | **Enabled** | Disabled (Default) | Disabled (Default) |
| `FEAT_PDF_EXPORT_TEAM` | Export aggregated zone/team PDF reports | Disabled | **Enabled** (AGM Only) | Disabled (Default) |
| `FEAT_PDF_EXPORT_COLLEGE` | Export college-wide master PDF reports | Disabled | Disabled | **Enabled** (Admin Only) |
| `FEAT_TERRITORY_MGMT` | Allocate mandals and feeder schools to staff | Disabled | **Enabled** (Zone) | **Enabled** (College) |
| `FEAT_STAFF_MGMT` | Provision and deactivate subordinate staff seats | Disabled | **Enabled** (PROs) | **Enabled** (All Roles) |
| `FEAT_CATCHMENT_INTEL`| Catchment penetration vs. 10th-grade strength | Disabled | Disabled | **Enabled** |
| `FEAT_TELECALLER_DESK`| 2-way PRO $\leftrightarrow$ Telecaller lead desk | Disabled | Disabled | **Enabled** |
| `FEAT_SPOT_ADMISSION` | Spot admission logging with application numbers| Disabled | Disabled | **Enabled** |
| `FEAT_MULTI_BRANCH` | Multiple campus partitions within workspace | Disabled | Disabled | **Enabled** |

---

### 2.4 Safe Subscription Lifecycle & Downgrade Safety

```mermaid
stateDiagram-v2
    [*] --> ActivePaid: Subscription Provisioned

    state ActivePaid {
        [*] --> InGoodStanding
        InGoodStanding --> DowngradePending: Downgrade Requested (Term End)
        DowngradePending --> AdminSelectionComplete: Admin Selects Accounts to Deactivate
        AdminSelectionComplete --> InGoodStanding: New Quota Enforced at Term
        DowngradePending --> DeadlinePassedUnresolved: Term Arrives without Selection
        DeadlinePassedUnresolved --> SafeLockdown: Workspace Enters Write-Lockdown
        SafeLockdown --> InGoodStanding: Admin Completes Mandatory Selection
    }

    ActivePaid --> Suspended: Payment Overdue (3-Day Grace)
    Suspended --> ActivePaid: Payment Cleared
    Suspended --> Offboarded: 30 Days Unresolved
    Offboarded --> [*]: 90-Day Retention Lock -> Purged
```

#### Safe Downgrade Policy (No Silent Guesses)
In previous revisions, automatic deactivation of staff based on creation order was considered. **This is rejected as unsafe:**
1. **Explicit Selection Requirement:** When a quota reduction is scheduled (e.g., from 8 PROs to 4 PROs), the administrator console flags the workspace as `DOWNGRADE_PENDING_SELECTION`.
2. **Safe Deadline Behavior (No Data Destruction):**
   - If the effective date arrives and the administrator has not selected the accounts to remove:
   - The system **does not guess** which staff to deactivate.
   - The system **does not reassign leads automatically**.
   - Instead, the workspace enters **Write-Lockdown** (`QUOTA_EXCEEDED_SELECTION_REQUIRED`):
     - All staff can continue to view existing leads, visits, and reports (read operations preserved).
     - New lead entry and visit logging are paused.
     - The administrator is redirected upon login to an unavoidable selection modal.
     - Once the administrator explicitly designates the accounts to deactivate, those accounts transition to `is_active = false`, their active sessions are revoked, their leads are routed according to explicit admin instructions, and write operations resume immediately.
     - Audit events recorded: `WORKSPACE_DOWNGRADE_WRITE_LOCKED`, `STAFF_EXPLICITLY_DEACTIVATED_ON_DOWNGRADE`.

---

## 3. Server-Side PDF Export Security and Scoping

### 3.1 Authorization and Server-Side Enforcement Rules

Hiding the "Export PDF" button in the client UI is fundamentally insufficient. The API gateway and report service enforce strict server-side validation:

```mermaid
sequenceDiagram
    autonumber
    actor Staff as Authenticated Staff Member
    participant Ingress as Ingress Auth Guard
    participant EntitleEngine as Entitlement Engine
    participant ExportWorker as Async Export Worker (pg-boss)
    participant Storage as Encrypted S3 Artifact Bucket
    participant Audit as Audit Service

    Staff->>Ingress: POST /api/v1/reports/pdf-export { reportType: "DAY_SUMMARY", filter: {...} }
    Ingress->>Ingress: Extract Session Context { userId, role, workspaceId }
    
    Ingress->>EntitleEngine: Evaluate (workspaceId, role, "DAY_SUMMARY")
    alt Package Entitlement Disabled (e.g., PRO in Full College Suite)
        EntitleEngine-->>Staff: 403 Forbidden (FEATURE_NOT_ENTITLED_FOR_PACKAGE)
    else Role Lacks Export Permission
        EntitleEngine-->>Staff: 403 Forbidden (ROLE_NOT_AUTHORIZED_FOR_EXPORT)
    else Authorized
        EntitleEngine->>ExportWorker: Enqueue Job { jobId, workspaceId, userId, role, scopeFilters }
        ExportWorker->>Audit: Log Audit Event (EXPORT_REQUESTED)
        Ingress-->>Staff: 202 Accepted { jobId, status: "PROCESSING" }
    end

    Note over ExportWorker,Storage: Asynchronous Background Generation
    ExportWorker->>ExportWorker: Set PostgreSQL Tenant Context: SELECT set_config('app.current_tenant_id', $1, true)
    ExportWorker->>ExportWorker: Apply Role Territory Filters (WHERE mandal_id IN (...) OR pro_id = ...)
    ExportWorker->>ExportWorker: Render PDF with Forensic Visual Watermark
    ExportWorker->>Storage: Stream Encrypted PDF to private S3 bucket
    ExportWorker->>ExportWorker: Generate 15-Minute Pre-Signed Download URL
    ExportWorker->>Audit: Log Audit Event (EXPORT_COMPLETED, recordCount: 142)
```

- **Individual PRO:** Authorized strictly to export records where `created_by_user_id = ctx.userId`.
- **AGM Bundle:** AGM authorized to export records where `mandal_id IN (ctx.assignedMandals)` or `created_by_user_id IN (ctx.subordinateStaffIds)`. PRO exports return HTTP 403.
- **Full College Suite:** College Admin authorized to export college-wide records. AGMs and PROs return HTTP 403 by default unless an explicit override entitlement (`OVERRIDE_ALLOW_STAFF_EXPORT`) is granted by the College Admin.

### 3.2 Forensic Watermarking and Artifact Security
- **Visual Forensic Watermark:** Every generated PDF page embeds a semi-transparent, diagonal background watermark containing:
  `[Workspace Name] | User: [Employee Code] | IP: [Client IP] | Timestamp: [UTC ISO8601]`
- **Storage Lifecycle:** PDFs stream directly to a private, server-side encrypted S3 bucket (`aws:kms`).
- **Time-Expiring Access:** Download links use S3 pre-signed URLs with a hard **15-minute time-to-live**.
- **Audit Logging:** Every export invocation logs: `user_id`, `workspace_id`, `report_type`, `record_count`, `applied_filters`, and `artifact_sha256_hash` to the immutable audit log.

---

## 4. Shared Feeder School Directory & Identity Resolution Engine

### 4.1 Master School Directory Architecture

```mermaid
erDiagram
    MASTER_SCHOOL ||--o{ SCHOOL_ALIAS : "identified_by"
    MASTER_SCHOOL ||--o{ SCHOOL_IDENTIFIER : "verified_by"
    MASTER_SCHOOL ||--o{ COLLEGE_SCHOOL_ASSOCIATION : "associated_with"
    MASTER_SCHOOL ||--o{ SCHOOL_CONTRIBUTION_REQUEST : "originated_from"
    MASTER_SCHOOL ||--o{ SCHOOL_MERGE_SNAPSHOT : "restorable_via"

    COLLEGE_SCHOOL_ASSOCIATION ||--o{ TENANT_SCHOOL_METADATA : "customizes"
    TENANT_SCHOOL_METADATA ||--o{ TENANT_SCHOOL_CONTACT : "protects"

    MASTER_SCHOOL {
        uuid id PK
        varchar canonical_name
        varchar normalized_name
        varchar school_category "GOVT_ZP | MUNICIPAL | PRIVATE_AIDED | PRIVATE_UNAIDED"
        uuid district_id FK
        uuid mandal_id FK
        uuid village_id FK
        enum verification_status "CANONICAL | PROVISIONAL | MERGED | REJECTED"
        uuid merged_into_id FK
        timestamptz created_at
    }

    SCHOOL_IDENTIFIER {
        uuid id PK
        uuid master_school_id FK
        enum identifier_type "UDISE_CODE | STATE_BOARD_CODE | AFFILIATION_NO"
        varchar identifier_value
        varchar issuing_authority
        boolean is_verified
    }

    TENANT_SCHOOL_METADATA {
        uuid id PK
        uuid workspace_id FK
        uuid master_school_id FK
        int estimated_10th_strength
        varchar internal_grade "A_PLUS | A | B | C"
        boolean is_allocated_catchment
        text private_notes
    }

    TENANT_SCHOOL_CONTACT {
        uuid id PK
        uuid tenant_metadata_id FK
        varchar contact_type "HEADMASTER | SENIOR_TEACHER | INFLUENCER"
        varchar name
        bytea encrypted_phone
        bytea phone_iv
        bytea phone_tag
        char phone_blind_index
    }
```

---

### 4.2 School Identity Resolution Workflow

When a field PRO or college administrator searches for or submits a feeder school, the system follows a deterministic 5-stage identity resolution pipeline:

```mermaid
flowchart TD
    subgraph Ingress_Search ["Stage 1: Search & Normalization"]
        Input["User Input: Name, Mandal, UDISE Code"] --> Normalize["Normalize String:\nUppercase, Remove Punctuation,\nStandardize 'ZP / ZILLA PARISHAD / HIGH SCHOOL'"]
    end

    subgraph MultiTier_Match ["Stage 2: Deterministic Matching Engine"]
        Normalize --> CheckUDISE{"Has Verified Official Identifier?\n(e.g., UDISE Match)"}
        CheckUDISE -- Yes --> ExactMatch["Tier 1: Verified Official Match\nAuto-associate College to Canonical School"]
        CheckUDISE -- No --> CheckMandal{"Match Normalized Name / Verified Alias\nwithin EXACT SAME Mandal?"}
        CheckMandal -- Yes --> StrongMatch["Tier 2: Strong Local Match Found\nPrompt User to Confirm Existing School"]
        CheckMandal -- No --> CheckFuzzy{"Candidate Similarity Check:\nToken Jaccard > 0.70 OR Metaphone Match\nwithin SAME District?"}
        CheckFuzzy -- Yes --> ProbableDup["Tier 3: Probable Duplicate Flagged\nHold for Review Queue"]
        CheckFuzzy -- No --> NoMatch["Tier 4: No Match Found\nCreate Provisional Contribution"]
    end

    subgraph Resolution_Paths ["Stage 3: Contribution & Review Actions"]
        ProbableDup --> QueueHold["Create Contribution Request\nStatus: PENDING_REVIEW\nAttach Provisional Association for Submitting College"]
        NoMatch --> ProvCreate["Create Master School\nStatus: PROVISIONAL\nLabel: [PROVISIONAL - UNVERIFIED]\nAttach to Submitting College"]
        QueueHold --> AdminReview["Platform Admin Review Console"]
        ProvCreate --> AdminReview
    end

    subgraph Admin_Actions ["Stage 4: Platform Admin Review Operations"]
        AdminReview --> ActConfirm["Action A: Confirm as New Canonical"]
        AdminReview --> ActAlias["Action B: Link as Alias to Existing Canonical"]
        AdminReview --> ActMerge["Action C: Merge into Existing Canonical\n(Atomic Transaction with Pre-Merge Snapshot)"]
        AdminReview --> ActReject["Action D: Reject Submission\n(Locks school, notifies submitting college)"]
    end
```

#### Deterministic Multi-Tier Matching Logic
1. **Tier 1 (Verified Official Identifier Match):** Matches a verified government code (UDISE, state board code). Eliminates phonetic ambiguity (subject to government issuing accuracy). Automatically links association to canonical record.
2. **Tier 2 (Strong Local Match):** Matches a canonical name or verified alias within the exact same administrative mandal. Prompts the user to confirm. Direct association upon confirmation.
3. **Tier 3 (Probable Duplicate - Central Review Queue):** High token similarity ($>0.70$ Jaccard or Double Metaphone equivalence) within the same district or neighboring mandal. **Fails safe:** The system does NOT automatically merge identities. It creates a `school_contribution_requests` entry held for Platform Admin review. The submitting college receives a temporary provisional link.
4. **Tier 4 (No Match - Provisional Creation):** No candidate match found. System provisions a new `master_schools` record with `verification_status = 'PROVISIONAL'`.
   - **Provisional Usage Rules:** The submitting college can log visits, capture leads, and assign staff against it immediately. To other colleges, the school appears in search with a prominent visual badge: `[PROVISIONAL - UNVERIFIED]`. Other colleges can view and associate with it, but official board ratings cannot be applied until verified.

---

### 4.3 Transactional School Merge Recovery & Association Collision Handling

```mermaid
sequenceDiagram
    autonumber
    actor Admin as Platform Superadmin
    participant API as School Admin API (/api/v1/admin/schools/merge)
    participant SnapTable as school_merge_snapshots Table
    participant MasterTable as master_schools Table
    participant AssocTable as college_school_associations Table
    participant MetaTable as tenant_school_metadata Table
    participant ContactTable as tenant_school_contacts Table
    participant Audit as Immutable Audit Log

    Admin->>API: POST /api/v1/admin/schools/merge { sourceId: B, targetId: A, justification: "Duplicate UDISE confirmed" }
    API->>API: Validate A != B; A.status == CANONICAL; B.status != MERGED
    
    rect rgb(240, 248, 255)
        Note over API,Audit: Atomic Database Transaction
        API->>SnapTable: INSERT INTO school_merge_snapshots (source_id, target_id, pre_merge_state_json)
        API->>MasterTable: UPDATE master_schools SET verification_status = 'MERGED', merged_into_id = A WHERE id = B
        API->>MasterTable: INSERT INTO school_aliases (master_school_id, alias_name, source) VALUES (A, B.canonical_name, 'MERGE_OP')
        
        Note over AssocTable,ContactTable: Handle Collisions for Colleges Associated with BOTH A and B
        loop For each College C associated with School B
            alt College C is NOT associated with School A
                API->>AssocTable: UPDATE college_school_associations SET master_school_id = A WHERE workspace_id = C AND master_school_id = B
                API->>MetaTable: UPDATE tenant_school_metadata SET master_school_id = A WHERE workspace_id = C AND master_school_id = B
            else College C is ALREADY associated with School A (Collision)
                API->>AssocTable: UPDATE college_school_associations SET status = 'SUPERSEDED_BY_MERGE' WHERE workspace_id = C AND master_school_id = B
                API->>ContactTable: Re-point contacts belonging to B's metadata to point to A's metadata ID
                API->>MetaTable: Append B's notes into A's private_notes: E'\n[Merged Notes from School B]: ' || notes
                API->>MetaTable: UPDATE tenant_school_metadata SET status = 'ARCHIVED_DUE_TO_MERGE' WHERE workspace_id = C AND master_school_id = B
            end
        end

        API->>Audit: Log Audit Event (SCHOOL_MERGED, { sourceId: B, targetId: A, adminId: Admin.id })
    end

    API-->>Admin: 200 OK { status: 'MERGE_COMPLETED', snapshotId: 'uuid' }

    Note over Admin,Audit: Reversible Unmerge Procedure (Emergency Rollback)
    Admin->>API: POST /api/v1/admin/schools/unmerge { snapshotId: 'uuid', justification: 'Erroneous merge' }
    rect rgb(255, 240, 245)
        Note over API,Audit: Atomic Rollback Transaction
        API->>SnapTable: Read pre_merge_state_json
        API->>MasterTable: Restore B.status = 'PROVISIONAL', B.merged_into_id = NULL
        API->>MasterTable: DELETE alias created during merge
        API->>AssocTable: Revert association records and statuses to pre-merge IDs
        API->>MetaTable: Revert metadata records and un-nest contacts to pre-merge IDs
        API->>SnapTable: Mark snapshot status = 'ROLLED_BACK'
        API->>Audit: Log Audit Event (SCHOOL_UNMERGED, { snapshotId: 'uuid' })
    end
    API-->>Admin: 200 OK { status: 'UNMERGE_COMPLETED' }
```

- **Collision Invariant:** A college cannot have two active `tenant_school_metadata` records for the same canonical school. Re-pointing School B's contacts to School A's metadata preserves private headmaster phone numbers and relationship notes without violating uniqueness constraints.
- **Durable Rollback:** Pre-merge snapshots guarantee that interrupted merges roll back cleanly, and accidental operator merges can be reversed without data loss.

---

## 5. Security Architecture Corrections

### 5.1 Unified Session-Token Hashing: HMAC-SHA256 with Server Pepper

The architecture enforces a single, mathematically consistent session-token hashing and storage strategy across all modules, tests, and data models:

$$\text{token\_hash} = \text{HMAC-SHA256}(\text{key} = \text{server\_session\_pepper}, \text{message} = \text{raw\_session\_token})$$

```mermaid
flowchart LR
    RawToken["Raw Session Token:\n'st_' + Base64URL(randomBytes(32))\n(256 bits entropy)"]
    Pepper["Server-Side Session Pepper\n(Stored in Cloud KMS / AWS Secrets Manager)"]
    HMAC["HMAC-SHA256 Engine"]
    DBHash["PostgreSQL user_sessions.token_hash\n(CHAR 64 Hex String)"]

    RawToken --> HMAC
    Pepper --> HMAC
    HMAC --> DBHash
```

- **Key:** `server_session_pepper` (256-bit cryptographically secure random secret stored in Cloud KMS / AWS Secrets Manager, never in the database).
- **Message:** `raw_session_token` (prefixed `st_` + 32 bytes CSPRNG Base64URL).
- **Database Storage:** Stored as a 64-character lowercase hex string in `user_sessions.token_hash` (`CHAR(64) NOT NULL UNIQUE`). Plain SHA-256 is eliminated.
- **Zero-Downtime Pepper Rotation:** The application runtime supports `current_pepper` and `previous_pepper`. Incoming requests evaluate `HMAC(current_pepper, raw_token)`. If not found, they evaluate `HMAC(previous_pepper, raw_token)`. If found, the session row is re-hashed with `current_pepper` and updated in the database on the fly.
- **Immediate Revocation:**
  - Logout: `UPDATE user_sessions SET revoked_at = NOW() WHERE token_hash = :hash`.
  - User Deactivation: `UPDATE user_sessions SET revoked_at = NOW() WHERE user_id = :userId`.
  - Workspace Suspension: `UPDATE user_sessions SET revoked_at = NOW() WHERE workspace_id = :workspaceId`.

---

### 5.2 Offline Lease Feasibility & Hardware Security Redesign

> [!IMPORTANT]
> **Platform Clock Limitation & Verified Reality:**  
> Standard Android `SystemClock.elapsedRealtime()` and iOS `mach_continuous_time()` reset to `0` whenever the device is rebooted. Standard consumer mobile devices do not expose an un-authenticated, tamper-proof, wall-clock persistence across reboots in an offline state.

To provide security without relying on unverified hardware claims, the mobile architecture implements a **Multi-Layer Defensive Clock & Lease Protocol**:

```mermaid
flowchart TD
    subgraph Device_Startup ["1. App Startup & Monotonic Check"]
        OpenApp["PRO Launches Flutter App"] --> ReadBoot["Read Current OS boot_id & Monotonic Ticks"]
        ReadBoot --> CompareAnchor["Compare with Encrypted Local Lease Anchor File"]
        CompareAnchor --> CheckReboot{"Did Device Reboot while Offline?\n(boot_id changed OR ticks < last_anchor)"}
    end

    subgraph Reboot_Handling ["2. Reboot Policy Enforcement"]
        CheckReboot -- Yes (Reboot Detected) --> CheckRebootPolicy{"Reboot Policy Evaluation"}
        CheckRebootPolicy -- Strict Policy (Default) --> RequireOnline["Lock Local Database\nRequire Online Network Revalidation\n(Biometrics & PIN Disabled)"]
        CheckRebootPolicy -- Grace Policy (Fallback) --> CheckGrace{"Elapsed Wall-Clock < 4h Grace?"}
        CheckGrace -- Yes --> AllowLimited["Allow Max 4h Local Emergency Entry"]
        CheckGrace -- No --> RequireOnline
    end

    subgraph Normal_Operation ["3. Continuous Monotonic Tracking (No Reboot)"]
        CheckReboot -- No (Same Boot Cycle) --> ReadUptime["Calculate Elapsed Monotonic Ticks since Sync"]
        ReadUptime --> Check48h{"Elapsed Uptime > 48 Hours?"}
        Check48h -- Yes --> EvictKeys["Evict RAM Keys & Lock App"]
        Check48h -- No --> CheckClockRollback{"Wall-Clock < Highest Recorded Timestamp?"}
        CheckClockRollback -- Yes (Rollback Detected) --> EvictKeys
        CheckClockRollback -- No --> NormalAccess["Unlock SQLCipher via Hardware-Unwrapped Key\nAllow Offline Visits & Lead Entry"]
    end

    subgraph Sync_Restoration ["4. Network Connection Restored"]
        RequireOnline --> ServerSync["POST /api/v1/sync/handshake (Signed Server Time)"]
        NormalAccess --> ServerSync
        ServerSync --> ResetAnchor["Update Lease Anchor File:\n• new boot_id\n• monotonic_sync_anchor = 0\n• last_verified_server_utc\n• Reset 48h Lease Timer"]
    end
```

#### Detailed Hardware-Backed Mechanics
1. **Continuous Monotonic Tracking (While Running):** While powered on, monotonic clocks measure elapsed time reliably, completely immune to user wall-clock modifications in Android/iOS settings.
2. **Offline Reboot Policy (The Secure Fallback):**
   - If the phone powers off or reboots while offline, the app detects the boot change.
   - **Recommended Default:** The local database locks, requiring an online network handshake before local access resumes. This eliminates the vulnerability where a stolen phone has its battery pulled for weeks to evade lease expiration.
   - **Operational Fallback (Configurable 4-Hour Grace):** If field operations in deep rural dead zones require reboot tolerance (e.g., dead battery recharged via motorcycle battery), the app permits a strictly bounded 4-hour emergency window verified against forward-only timestamps, after which hard lockdown occurs.
3. **Cryptographic Erasure (Zeroization of Key, not Flash Memory):**
   - Overwriting SQLite files on flash storage is unreliable due to Flash Translation Layer (FTL) block wear-leveling remapping.
   - The platform encrypts SQLite via SQLCipher with key $K_{db}$.
   - $K_{db}$ is encrypted by $KEK_{device}$ inside the hardware keystore (StrongBox / Secure Enclave).
   - Upon wipe trigger (tamper detected, 48h expiry, or server 401 `PURGE_DATA`), the app deletes $KEK_{device}$ from the hardware keystore. Without $KEK_{device}$, recovering $K_{db}$ is mathematically intractable ($2^{256}$ operations), rendering the physical SQLite file on flash storage permanently irrecoverable.
4. **App Backup Prevention:** Android `android:allowBackup="false"` in manifest; iOS `kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly` prevents un-authenticated cloud or local file extractions.

---

### 5.3 PostgreSQL Integrity: Partial Unique Index & Keyed Phone Encryption

The invalid table-level constraint syntax from Revision 3.0 is corrected to a **PostgreSQL Partial Unique Index**:

```sql
-- Partial Unique Index on active leads within each workspace
CREATE UNIQUE INDEX idx_unique_active_workspace_phone 
ON student_leads (workspace_id, phone_blind_index) 
WHERE deleted_at IS NULL;
```

```mermaid
flowchart TD
    subgraph Raw_Ingress ["1. Phone Ingress & Canonical Normalization"]
        Raw["Raw Input: '+91 98765-43210'"] --> Norm["Clean Digits: '9876543210'\nRegex Validation: ^[6-9]\\d{9}$"]
    end

    subgraph Crypto_Pipeline ["2. Dual Cryptographic Pipeline"]
        Norm --> Reversible["AES-256-GCM Encryption Path\n(Reversible Storage)"]
        Norm --> BlindPath["Keyed Blind Index Path\n(Deterministic Duplicate Detection)"]
        
        Reversible --> KMS["KMS DEK (Workspace Envelope Key)"]
        KMS --> GCMCipher["AES-256-GCM Cipher\nRandom 96-bit IV per row"]
        GCMCipher --> StoredFields["encrypted_phone (BYTEA)\nphone_iv (BYTEA)\nphone_tag (BYTEA)"]
        
        BlindPath --> SaltStore["Workspace Salt Store"]
        SaltStore --> Salt["workspace_phone_salt (256-bit Secret)"]
        Salt --> HMACEngine["HMAC-SHA256(key = workspace_phone_salt, message = clean_phone)"]
        HMACEngine --> StoredBlind["phone_blind_index (CHAR 64 Hex String)"]
    end

    subgraph DB_Enforcement ["3. Database Persistence & Uniqueness"]
        StoredFields --> LeadRow[("student_leads Row")]
        StoredBlind --> LeadRow
        LeadRow --> PartialIndex["Partial Unique Index:\nidx_unique_active_workspace_phone\n(workspace_id, phone_blind_index) WHERE deleted_at IS NULL"]
    end
```

#### Duplicate Handling Behavior
When an insert or update collides with an existing active lead in the same workspace, PostgreSQL raises error code `23505` (`unique_violation`). The API maps this cleanly to HTTP 409 Conflict with an RFC 7807 Problem Details response:

```json
{
  "type": "https://api.admissions-app.com/v1/errors/duplicate-phone",
  "title": "Duplicate Lead Phone Number",
  "status": 409,
  "detail": "A prospective student with this phone number already exists in your college workspace.",
  "instance": "/api/v1/leads",
  "code": "DUPLICATE_PHONE_NUMBER",
  "correlationId": "req_01HPX789ABCD"
}
```

---

### 5.4 Parameter-Safe Transaction-Local PostgreSQL RLS

To eliminate SQL injection risks and guarantee transaction pooling compatibility (PgBouncer in transaction mode), tenant context injection uses the **parameterized `set_config` function**:

```sql
-- Parameter-safe transaction-scoped tenant context setting
SELECT set_config('app.current_tenant_id', $1, true);
```

```mermaid
flowchart TD
    subgraph Drizzle_Wrapper ["Drizzle ORM Transaction Wrapper"]
        StartTx["Begin DB Transaction"] --> InjectCtx["Execute: SELECT set_config('app.current_tenant_id', $1, true)\n[$1 = ctx.workspaceId]"]
        InjectCtx --> RunQuery["Execute Application DML (SELECT / INSERT / UPDATE / DELETE)"]
    end

    subgraph RLS_Policy_Evaluation ["PostgreSQL Row-Level Security Engine"]
        RunQuery --> EvalPolicy{"RLS Policy Evaluation\nworkspace_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid"}
        
        EvalPolicy -- SELECT Mismatched / Missing Context --> ZeroRows["Returns 0 Rows (Fail-Closed)"]
        EvalPolicy -- SELECT Matched Context --> ReturnData["Returns Workspace Rows"]
        
        EvalPolicy -- INSERT Mismatched / Missing Context --> ErrorWrite["Throws SQL Error 42501 (RLS Policy Violation)"]
        EvalPolicy -- INSERT Matched Context --> SuccessWrite["Inserts Row Successfully"]
    end

    subgraph Tx_Completion ["Transaction End"]
        ReturnData --> CommitTx["COMMIT (Connection Returned to PgBouncer Clean)"]
        ZeroRows --> CommitTx
        ErrorWrite --> RollbackTx["ROLLBACK (Connection Returned Clean)"]
    end
```

#### Differentiating Zero-Row SELECT from Rejected Writes
- **`SELECT` Operations:** If tenant context is missing or points to another tenant, the `USING` clause evaluates to false. The query returns **0 rows** (empty result set, failing closed without leaking existence).
- **`INSERT` Operations:** If tenant context is missing or does not match `new.workspace_id`, the `WITH CHECK` clause evaluates to false. PostgreSQL raises error `42501` (`insufficient_privilege: new row violates row-level security policy`).
- **`UPDATE` / `DELETE` Operations:** Rows belonging to other tenants are invisible under `USING` (0 rows affected). Attempts to update `workspace_id` to another tenant trigger `WITH CHECK` error `42501`.

---

### 5.5 Cross-Workspace Lead Migration: Cryptographic Re-Keying Protocol

Because Workspace A and Workspace B use **completely different HMAC salts** (`salt_A` $\neq$ `salt_B`), blind indexes from Workspace A cannot be compared directly against Workspace B.

Cross-workspace lead migration operates via an **In-Memory Cryptographic Re-Keying Pipeline**:

```mermaid
sequenceDiagram
    autonumber
    actor PRO as Individual PRO (Source Workspace A)
    actor Admin as College Admin (Destination Workspace B)
    participant API as Migration API (/api/v1/workspaces/migrate-leads)
    participant KMS as Cloud KMS
    participant DB as PostgreSQL Database
    participant Audit as Immutable Audit Log

    PRO->>API: Initiate Migration Request (Selected Lead IDs, Target Workspace B)
    Admin->>API: Approve Migration Request (Sign Dual-Consent Agreement)
    
    rect rgb(240, 248, 255)
        Note over API,DB: Atomic In-Memory Re-Keying Pipeline
        API->>DB: Fetch Encrypted Leads from Workspace A
        API->>KMS: Decrypt Workspace A Leads using DEK_A
        KMS-->>API: raw_phone in Server Memory
        
        API->>API: Compute candidate_blind_index = HMAC-SHA256(workspace_phone_salt_B, raw_phone)
        API->>DB: SELECT id FROM student_leads WHERE workspace_id = B AND phone_blind_index = candidate_blind_index AND deleted_at IS NULL
        
        alt Phone Already Exists in College B (Collision)
            API-->>Admin: Prompt Collision Triage: (Merge Visit History OR Skip)
            Note over API,DB: Do NOT overwrite College B's lead record
        else No Collision
            API->>KMS: Encrypt raw_phone with Workspace B DEK_B (Fresh Random IV)
            KMS-->>API: encrypted_phone_B, iv_B, tag_B
            API->>DB: INSERT INTO student_leads (workspace_id = B, phone_blind_index, encrypted_phone_B, migrated_from_id = A)
            API->>DB: UPDATE student_leads SET deleted_at = NOW(), migration_target_id = B WHERE id = Lead_A
        end
        
        API->>Audit: Log Audit Events in BOTH Workspaces (LEAD_MIGRATED_OUT, LEAD_MIGRATED_IN)
    end

    API-->>Admin: Migration Completed (Summary: 45 Imported, 2 Collisions Triaged)
```

- **Invariant:** Workspaces remain strictly segregated. Raw phone numbers exist decrypted only within ephemeral server process memory during re-encryption and are never written to disk or logs.

---

## 6. Updated Conceptual Data Model

```mermaid
erDiagram
    PRODUCT_PLAN ||--o{ WORKSPACE_SUBSCRIPTION : "governs"
    WORKSPACE ||--o{ WORKSPACE_SUBSCRIPTION : "holds"
    WORKSPACE ||--o{ WORKSPACE_MEMBERSHIP : "employs"
    WORKSPACE ||--o{ BRANCH : "operates"
    WORKSPACE ||--o{ STUDENT_LEAD : "owns"
    WORKSPACE ||--o{ COLLEGE_SCHOOL_ASSOCIATION : "links"
    WORKSPACE ||--o{ AUDIT_EVENT : "logs"

    USER_IDENTITY ||--o{ WORKSPACE_MEMBERSHIP : "participates_as"
    WORKSPACE_MEMBERSHIP ||--o{ USER_SESSION : "authenticates"
    WORKSPACE_MEMBERSHIP ||--o{ STAFF_TERRITORY_ASSIGNMENT : "assigned"
    WORKSPACE_MEMBERSHIP ||--o{ STUDENT_LEAD : "created_by"
    WORKSPACE_MEMBERSHIP ||--o{ FIELD_VISIT : "conducted_by"
    WORKSPACE_MEMBERSHIP ||--o{ PERSONAL_INFLUENCER_CONTACT : "owns_private"

    MASTER_SCHOOL ||--o{ COLLEGE_SCHOOL_ASSOCIATION : "referenced_by"
    MASTER_SCHOOL ||--o{ SCHOOL_ALIAS : "aliases"
    MASTER_SCHOOL ||--o{ SCHOOL_IDENTIFIER : "codes"
    MASTER_SCHOOL ||--o{ SCHOOL_MERGE_SNAPSHOT : "restorable_via"
    COLLEGE_SCHOOL_ASSOCIATION ||--o{ TENANT_SCHOOL_METADATA : "customizes"
    TENANT_SCHOOL_METADATA ||--o{ TENANT_SCHOOL_CONTACT : "protects"

    STUDENT_LEAD ||--o{ FIELD_VISIT : "receives"
    STUDENT_LEAD ||--o{ TELECALL_INTERACTION : "receives"
    STUDENT_LEAD ||--o| ADMISSION_RECORD : "converts_to"
```

### 6.1 Critical Entity Definitions & Integrity Rules

#### 1. `student_leads` (Admissions Pipeline)
- **Fields:** `id` (UUIDv7), `workspace_id` (UUID $\to$ `workspaces.id`), `branch_id` (UUID $\to$ `branches.id`, NULLABLE), `created_by_membership_id` (UUID), `assigned_pro_id` (UUID, NULLABLE), `assigned_telecaller_id` (UUID, NULLABLE), `full_name` (VARCHAR(100)), `phone_blind_index` (CHAR(64)), `encrypted_phone` (BYTEA), `phone_iv` (BYTEA), `phone_tag` (BYTEA), `village_id` (UUID), `mandal_id` (UUID), `master_school_id` (UUID, NULLABLE), `lead_status` (`NEW`, `FOLLOW_UP`, `STAR_LEAD`, `VISIT_SCHEDULED`, `ADMITTED`, `DROPPED`), `doorstep_completed` (BOOLEAN DEFAULT FALSE), `version` (INT DEFAULT 1), `deleted_at` (TIMESTAMPTZ NULL).
- **Integrity Rule:** `CREATE UNIQUE INDEX idx_unique_active_workspace_phone ON student_leads (workspace_id, phone_blind_index) WHERE deleted_at IS NULL;`

#### 2. `user_sessions` (Server-Managed Sessions)
- **Fields:** `id` (UUID), `workspace_id` (UUID), `user_id` (UUID), `token_hash` (CHAR(64) UNIQUE NOT NULL), `idle_expires_at` (TIMESTAMPTZ NOT NULL), `max_expires_at` (TIMESTAMPTZ NOT NULL), `last_activity_at` (TIMESTAMPTZ NOT NULL), `revoked_at` (TIMESTAMPTZ NULL), `ip_address` (INET), `user_agent` (VARCHAR(255)).
- **Integrity Rule:** Hashed strictly via `HMAC-SHA256(server_session_pepper, raw_token)`.

#### 3. `personal_influencer_contacts` (PRO Relatives & Influencers)
- **Fields:** `id` (UUID), `workspace_id` (UUID $\to$ `workspaces.id`), `membership_id` (UUID $\to$ `workspace_memberships.id`), `name` (VARCHAR(100)), `encrypted_phone` (BYTEA), `phone_blind_index` (CHAR(64)), `relation_type` (`UNCLE`, `BROTHER`, `VILLAGE_ELDER`, `LOCAL_TUTOR`), `village_id` (UUID), `status` (`ACTIVE`, `ARCHIVED`), `created_at` (TIMESTAMPTZ).
- **Integrity Rule:** Private to `membership_id`. Auto-archived upon staff deactivation. Inaccessible to other staff members.

#### 4. `school_merge_snapshots` (Reversible Merge Recovery)
- **Fields:** `id` (UUID), `source_school_id` (UUID), `target_school_id` (UUID), `pre_merge_state_json` (JSONB NOT NULL), `executed_by_admin_id` (UUID), `status` (`ACTIVE_MERGE`, `ROLLED_BACK`), `created_at` (TIMESTAMPTZ).

---

## 7. Security Findings Register (SEC-01 to SEC-08)

| Finding ID | Vulnerability Description | Severity | Target Architecture Mitigation | Automated Verification Test |
| :--- | :--- | :---: | :--- | :--- |
| **SEC-01** | Client-Side JWT Minting in Flutter (`api_service.dart`) | **CRITICAL** | Complete removal of client token signing. Server issues opaque 256-bit bearer tokens verified against HMAC-SHA256 database hashes. | `TEST-VERIF-01`: Client submits forged token; server returns HTTP 401. All tokens minted by server exclusively. |
| **SEC-02** | Default Insecure Student Password Takeover (`123456`) | **CRITICAL** | Student login and self-registration entirely deferred from Phase 1. | `TEST-VERIF-02`: Public student registration endpoints eliminated from API routing table. |
| **SEC-03** | Public Feeder School PII Leakage (`GET /api/config`) | **HIGH** | `master_schools` read-only master; headmaster personal phones moved to encrypted `tenant_school_contacts` requiring authenticated tenant session. | `TEST-VERIF-03`: Unauthenticated `GET /api/v1/schools` returns HTTP 401. Authenticated staff see only tenant-authorized contacts. |
| **SEC-04** | Cross-Tenant Lead Leaks via Unassigned Telecallers | **HIGH** | Telecaller queries enforce mandatory tenant scoping and assignment checks. Empty assignment returns `[]` (fail-closed), never global leads. | `TEST-VERIF-04`: Telecaller with empty assignment queries `/api/v1/leads`; returns empty array, 0 rows leaked. |
| **SEC-05** | Tokens Passed in URL Query Strings (`?token=...`) | **MEDIUM** | Ingress API gateway strictly rejects tokens in query strings. Tokens accepted exclusively via `__Host-` cookies or `Authorization: Bearer` headers. | `TEST-VERIF-05`: Request with `?token=...` returns HTTP 400 Bad Request. |
| **SEC-06** | Hardcoded Automated Backup Fallback Secret | **MEDIUM** | Secret hardcoding eliminated. Process fails startup if `CRON_SECRET` is unset via Zod environment validation. | `TEST-VERIF-06`: Missing `CRON_SECRET` in environment causes application startup crash with explicit error. |
| **SEC-07** | Stolen Offline Field Phone Data Extraction | **HIGH** | 48-hour monotonic lease; online revalidation on reboot; SQLCipher 256-bit AES encryption; cryptographic erasure zeroizing TPM keys on tamper/expiry. | `TEST-VERIF-07`: Simulate monotonic advance $>48$h or reboot; verify $K_{db}$ evicted and local database unreadable. |
| **SEC-08** | Unauthorized Bulk PDF Data Exfiltration | **MEDIUM** | Role-based export authorization; server-side entitlement checks; forensic visual watermarking; 15-minute expiring S3 pre-signed URLs. | `TEST-VERIF-08`: PRO in Full College Suite calls export endpoint; returns HTTP 403. Admin export generates watermarked artifact. |

---

## 8. Proof-of-Concept (PoC) Plans with Measurable Exit Criteria

### 8.1 PoC 1: Drizzle ORM + PostgreSQL RLS under Transaction Pooling

- **Objective:** Prove that Drizzle ORM executes parameter-safe `SELECT set_config('app.current_tenant_id', $1, true)` reliably across pooled connections (PgBouncer in transaction mode) without session state bleeding, under a restricted runtime database role.
- **Prerequisites:** Containerized PostgreSQL 16 instance, PgBouncer configured with `pool_mode = transaction`, Drizzle ORM connection wrapper.
- **Test Environment:** Docker test container on Linux.
- **Database Roles:**
  - `migrator_admin`: Owns schema, has `BYPASSRLS`.
  - `app_runtime_user`: Unprivileged runtime role (`NOINHERIT`, `NOSUPERUSER`, `NOCREATEDB`, `NOCREATEROLE`, `NOBYPASSRLS`).
- **Test Cases:**
  1. *Test 1.1 (Parameter-Safe Injection):* Set context via `set_config('app.current_tenant_id', $1, true)` where `$1` is parameterized.
  2. *Test 1.2 (Missing Context Fail-Closed):* Query `student_leads` without setting context $\implies$ Assert SELECT returns 0 rows.
  3. *Test 1.3 (Write Rejection):* Attempt INSERT into `student_leads` without context $\implies$ Assert PostgreSQL raises error `42501`.
  4. *Test 1.4 (Pooled Connection Reuse):* Rapidly interleave 10,000 transactions alternating between Tenant A and Tenant B over 10 physical pooled connections $\implies$ Assert zero cross-tenant row contamination.
  5. *Test 1.5 (Aborted Transaction Context Clearance):* Abort transaction mid-flight $\implies$ Assert subsequent transaction on same physical connection does not retain aborted tenant context.
- **Evidence to Collect:** PgBouncer connection logs, PostgreSQL transaction query logs, automated Vitest assertion report.
- **Measurable Pass Conditions:**
  - 0 cross-tenant rows returned across 10,000 interleaved transactions.
  - 100% of missing-context writes rejected with error `42501`.
  - Additional latency introduced by `set_config` is $< 2.0\text{ms}$ per transaction.
- **Fallback if Failed:** If PgBouncer transaction pooling leaks session state or adds excessive latency, fall back to **Application-Layer Repository Scoping** as the primary security perimeter, backed by schema-level separation or dedicated connection pools per enterprise tenant.

---

### 8.2 PoC 2: Flutter Offline Lease & Hardware Security

- **Objective:** Validate SQLCipher local database encryption, client-side UUIDv7 generation, monotonic uptime lease tracking, online revalidation on reboot, and cryptographic erasure on physical mobile devices.
- **Prerequisites:** Flutter test application embedding `sqflite_sqlcipher`, `flutter_secure_storage`, and native platform security bindings.
- **Test Devices:**
  1. Low-end Android test device (Android 10+, 2GB RAM, e.g., Redmi or Samsung A-series).
  2. iOS test device (iOS 15+, e.g., iPhone SE or iPhone 11).
- **Test Cases:**
  1. *Test 2.1 (Offline Queue Serialization):* Queue 100 doorstep visits while offline $\implies$ Verify serialized to encrypted SQLite with UUIDv7 keys.
  2. *Test 2.2 (System Clock Rollback):* Manually roll system wall-clock back 7 days in OS settings while offline $\implies$ App reads monotonic uptime anchor, detects backward shift $\implies$ Evicts $K_{db}$ from RAM and locks UI.
  3. *Test 2.3 (Device Reboot while Offline):* Reboot device while offline $\implies$ App detects `boot_id` change $\implies$ Enforces online revalidation requirement (local DB remains locked until network handshake).
  4. *Test 2.4 (48-Hour Continuous Uptime Expiry):* Simulate 48 hours continuous uptime $\implies$ Lease expires, hardware key evicted from RAM, UI locks.
  5. *Test 2.5 (Cryptographic Erasure Verification):* Trigger remote wipe or tamper lockdown $\implies$ App deletes $KEK_{device}$ from hardware keystore $\implies$ Extract physical SQLite file via `adb backup` or file extraction $\implies$ Attempt offline decryption $\implies$ Assert file unreadable mathematical noise.
  6. *Test 2.6 (Reconnection Atomic Batch Sync):* Restore connectivity $\implies$ Flushes 100 queued mutations in atomic transaction $\implies$ Assert server accepts with 0 duplicate records.
- **Evidence to Collect:** Android `logcat` logs, iOS console logs, raw SQLite database hex dumps before and after wipe, API transaction logs.
- **Measurable Pass Conditions:**
  - SQLite database is provably unreadable after $KEK_{device}$ zeroization.
  - Clock rollback attempts trigger immediate lockdown in $100\%$ of test runs.
  - Device reboot while offline safely locks database until online revalidation occurs.
  - Batch sync transmits 100 items with zero duplicates.
- **Fallback if Failed:** If hardware keystore key deletion is unsupported or inconsistent on specific budget Android OEM builds, fall back to **Mandatory App Re-Authentication on Every Launch** with ephemeral session keys in memory only (no persistent local encryption key stored on device).

---

## 9. Feature-to-Acceptance-Test Traceability Matrix

| Feature Module | Business Rule / Capability | Required Test ID | Concrete Acceptance Test Procedure | Expected Pass Result |
| :--- | :--- | :--- | :--- | :--- |
| **Tenant Lifecycle** | Hard Staff-Seat Cap Enforcement | `TEST-TC-01` | Subscription quota = 3 PRO seats. College Admin attempts to provision 4th PRO user. | HTTP 422 Unprocessable Entity (`SEAT_QUOTA_EXCEEDED`). Record not created. |
| **Identity & Sessions**| Session Revocation on User Deactivation | `TEST-TC-02` | PRO user logs in on Web and Mobile. Admin deactivates user (`is_active = false`). PRO makes subsequent API call. | HTTP 401 Unauthorized (`SESSION_REVOKED`). Local mobile app locks. |
| **Lead Management** | Keyed HMAC Duplicate Phone Check | `TEST-TC-03` | PRO A creates lead with Phone P in College A. PRO B creates lead with Phone P in College B. PRO A attempts duplicate in College A. | College B creation succeeds (HTTP 201). Duplicate in College A fails (HTTP 409 Conflict). |
| **Field Visits** | Append-Only Doorstep Visit Log | `TEST-TC-04` | PRO logs visit with parent remarks on Lead L. Attaches idempotency key K. Re-sends identical payload with key K. | Visit created, `doorstep_completed = true`. Duplicate request returns cached 200 without duplicate row. |
| **School Directory** | Multi-Tier Identity Resolution | `TEST-TC-05` | Search "Sri Siddhartha ZP High School, Guntur" against Canonical "Sri Siddhartha High School, Guntur" (same UDISE). | Match classified as Tier 1. Direct association linked without creating duplicate school. |
| **School Directory** | Private Contact Protection | `TEST-TC-06` | College A logs private headmaster phone on School S. College B queries School S. | College B sees school profile; College A's headmaster phone and private notes are omitted. |
| **Telecaller Desk** | Dynamic Callback Alarm Trigger | `TEST-TC-07` | Telecaller sets callback milestone `AFTER_10TH_EXAMS`. Platform Admin marks 10th exams completed. | Lead appears automatically in Telecaller High-Priority Callback Queue. |
| **PDF Reporting** | Server-Side PDF Export Authorization | `TEST-TC-08` | PRO in AGM Bundle attempts `POST /api/v1/reports/pdf-export` for personal leads. | HTTP 403 Forbidden (`EXPORT_PERMISSION_DISABLED_FOR_ROLE`). |
| **PDF Reporting** | Authorized AGM Team Export | `TEST-TC-09` | AGM in AGM Bundle calls team export endpoint. | HTTP 202 Accepted. Async worker outputs PDF with forensic watermark and 15-min pre-signed URL. |
| **Platform Ops** | Audited Break-Glass Impersonation | `TEST-TC-10` | Platform operator initiates support session with Ticket ID #801. Accesses College A leads. | Access granted for max 2h; all phone numbers masked by default; action logged in `audit_events`. |

---

## 10. Implementation-Readiness Verdict and Ordered Next Steps

### 10.1 Implementation-Readiness Verdict

> [!IMPORTANT]
> **VERDICT: ARCHITECTURALLY SOUND & RIGOROUSLY VALIDATED — AUTHORIZED FOR PHASE 0 PROOFS OF CONCEPT.**  
> 
> Revision 3.1 eliminates all physical device clock ambiguities, mathematically unifies session hashing, establishes parameter-safe RLS testing under unprivileged runtime roles, and provides concrete PoC exit criteria and fallbacks.  
> 
> **Zero production code implementation is authorized until Phase 0 PoCs conclude successfully.**

---

### 10.2 Ordered Next Steps

```mermaid
flowchart TD
    Step1["Step 1: Stakeholder Sign-Off on Approved Decisions & Open Questions\n(Commercial packages, downgrade locks, and migration policies)"]
    Step2["Step 2: Execute Phase 0 Technical Proofs of Concept (6 Days)\n• PoC 1: Drizzle ORM + PostgreSQL RLS under PgBouncer\n• PoC 2: Flutter SQLCipher + Hardware Monotonic Lease on Physical Devices"]
    Step3["Step 3: Milestone 1 Walking Skeleton Buildout\n• Database DDL & Forward-Only Migrations\n• Centralized Auth & Session Engine (HMAC-SHA256)\n• Multi-Tenant Isolation CI Test Harness\n• Staging Container Deployment & Health Probes"]
    Step4["Step 4: Phase 1B & 1C Domain Feature Assembly\n• Feeder School Directory & Contribution Engine\n• Field Visits & Offline Synchronization\n• Telecaller Desk & Spot Admissions\n• Audited Platform Administration Console"]

    Step1 --> Step2 --> Step3 --> Step4
```

1. **Step 1 (Governance):** Secure formal Product Owner sign-off on the 5 approved architectural decisions and resolve the 3 open commercial questions (Section 1).
2. **Step 2 (Phase 0 PoCs - 6 Engineering Days):**
   - Execute PoC 1: Drizzle ORM with PostgreSQL RLS under PgBouncer transaction pooling.
   - Execute PoC 2: Flutter SQLCipher encrypted queue and 48-hour hardware monotonic lease protection on physical Android and iOS test hardware.
3. **Step 3 (Milestone 1 Implementation):** Build the secure walking skeleton:
   - Automated forward-only database migrations.
   - Session engine with `HMAC-SHA256` hashing and `__Host-` cookies.
   - Tenant-scoped student lead creation with AES-256-GCM encryption and partial unique index.
   - Mandatory CI Cross-Tenant Isolation Penetration Test Suite.
   - Dockerized staging deployment with `/health/live` and `/health/ready` probes.
4. **Step 4 (Phase 1 Operations Core):** Proceed with full domain module assembly across web and mobile clients according to the feature traceability matrix.

---

## 11. Documentation Modification Register & Confirmation

### 11.1 Documentation Files Created / Modified
- [`docs/ARCHITECTURE_REVISION_3_1.md`](file:///x:/Prasad%20projact%20works/PRO%20day%20report/docs/ARCHITECTURE_REVISION_3_1.md) — Created as the permanent, authoritative Revision 3.1 specification baseline.
- [`docs/ARCHITECTURE_REVISION_3.md`](file:///x:/Prasad%20projact%20works/PRO%20day%20report/docs/ARCHITECTURE_REVISION_3.md) — Preserved in full as predecessor historical baseline.

### 11.2 Strict Non-Modification Confirmation
In accordance with task constraints:
- **Zero application source code files were created, edited, or deleted.**
- **No package dependencies were installed or modified (`package.json`, `package-lock.json` remain untouched).**
- **No database schemas, tables, or migrations were executed.**
- **No configuration files, environment variables, or running dev servers were modified.**
- **Revision 2.0, Revision 3.0, and the existing codebase remain preserved in their entirety as historical reference.**
