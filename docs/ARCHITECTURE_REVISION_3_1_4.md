# Architecture Revision 3.1.4: Final Targeted Pre-PoC Hardened Baseline

**Document Status:** Architecture Revision 3.1.4 (Final Targeted Pre-PoC Specification Baseline)  
**System:** Multi-Tenant College Admissions Operations & Field Force SaaS  
**Scope Classification:** Phase 1 Operational Core  
**Role:** Principal SaaS Architect & Application Security Architect  
**Predecessor Baselines:** Revision 2.0, Revision 3.0, Revision 3.1, Revision 3.1.1, Revision 3.1.2, and Revision 3.1.3 (Preserved in full)  
**Document Purpose:** Provide targeted, surgical technical corrections over Revision 3.1.3 to establish an implementation-ready baseline prior to Phase 0 Proof-of-Concept execution:
1. **Safe Expand-and-Contract Blind-Index Rotation Ordering:** Correct the sequencing in Section 5.5 so no application version is ever deployed referencing a column before that column exists in the database. Formalize a 10-phase expand-and-contract deployment sequence with an exhaustive phase matrix documenting database schema states, compatible application versions, observable preconditions, rollback boundaries, and the definitive point of no return.
2. **Cryptographically Bound Archival Deletion Authorization:** Strengthen Section 8 so that two-step deletion authorization is specific, current, and non-reusable. Formally bind the authorization record to exact workspace and academic-year IDs, the manifest ID, verified payload SHA-256 hash, eligible record scope, planned deletion counts, independent College Admin and Platform Security Admin identities, strict 24-hour expiry, and single-use state. Mandate transaction-safe pre-batch revalidation using `FOR UPDATE` row locks to prevent compliance-hold or cohort-state race conditions, with durable batch progress checkpoints and an explicit caveat on foreign-key inventory completeness.
3. **Realistic Offline Token Replay & Flash Rollback Limitations:** Clarify Section 5.2 by explicitly acknowledging that local `seen_token_ids` tracking in encrypted storage cannot prevent replay if an attacker restores an offline flash snapshot or app-data backup. Document verified client guarantees vs. hardware-backed requirements vs. accepted consumer-hardware limitations, enforcing strict fail-closed online revalidation whenever timing continuity is broken.
4. **Preserved Governance & Evidence Rigor:** Maintain all owner-approved commercial packages and business decisions; preserve the 7 unresolved owner decisions without false approvals; preserve the academic-year archival lifecycle (live operational data, permanent PostgreSQL admissions/statistics, cold-archived interactions); keep all PoCs marked strictly **not executed**; and provide an honest assessment of remaining operational risks.
**Implementation Boundary:** Strictly non-implemented specification. Zero application code, dependencies, schemas, migrations, or configurations modified.

---

## 1. Governance Classification and Decision Log

Every statement in this architecture is classified into one of five governance tiers:
1. `[OWNER-APPROVED DECISION]`: Formally locked by the product owner; non-negotiable architectural baseline.
2. `[PROPOSED SPECIFICATION]`: Technical design submitted for review and pre-implementation proof of concept.
3. `[ASSUMPTION]`: Explicit engineering or operational assumption subject to field validation.
4. `[RECOMMENDATION]`: Architect's technical guidance where business trade-offs exist.
5. `[UNRESOLVED OWNER DECISION]`: Explicit commercial or policy choice requiring owner sign-off before production.

```mermaid
flowchart TD
    subgraph Approved_Tier ["Locked Baseline [OWNER-APPROVED DECISION]"]
        A1["ADR-01: Shared Feeder-School Master Directory\nCanonical Master Shared; Contacts & Notes Tenant-Private"]
        A2["ADR-02: Phone Duplicate Scope\nTenant-Scoped via Blind Index + Partial Unique Index"]
        A3["ADR-03: Mobile Offline Operational Lease\n48h Monotonic Lease + Online Revalidation on Continuity Break"]
        A4["ADR-04: Staff Seat Quota Enforcement\nHard-Cap per Workspace Subscription (Fails Closed)"]
        A5["ADR-05: Personal Influencer Contacts\nPrivate to Responsible Staff; Archived on Staff Departure"]
        A6["ADR-06: Three-Package Commercial Model\nIndividual PRO, AGM Bundle, Full College Suite"]
    end

    subgraph Proposed_Tier ["Technical Hardening [PROPOSED SPECIFICATION]"]
        P1["ADR-07: 10-Phase Expand-and-Contract Blind-Index Rotation (Outside Tx Block)"]
        P2["ADR-08: Parameterized RLS Context via set_config & Unprivileged Runtime Role"]
        P3["ADR-09: Multi-Tier School Identity Resolution & Association Collision Handling"]
        P4["ADR-10: Hardware Keystore Cryptographic Erasure & Transactional Lead Migration"]
        P5["ADR-11: Bound Archival Deletion Authorization & Async Glacier Retrieval Flow"]
    end

    subgraph Open_Tier ["Pending Owner Sign-Off [UNRESOLVED OWNER DECISION]"]
        Q1["Issue 1: Individual PRO Lead Migration Policy (Wizard vs. Strict Isolation)"]
        Q2["Issue 2: AGM Bundle Add-On PRO Seats (Incremental Add-on vs. Upgrade)"]
        Q3["Issue 3: Provisional School Review Expiry (Indefinite Queue vs. Auto-Promotion)"]
        Q4["Issue 4: Post-Reboot Emergency Offline Grace (Rejected vs. 4h Grace Approval)"]
        Q5["Issue 5: Statutory Historical Data Retention Period (5 vs. 7 vs. 10 Years)"]
        Q6["Issue 6: Warm Tier Operational Retention Horizon (1 vs. 2 vs. 3 Academic Years)"]
        Q7["Issue 7: Academic-Year Archival Trigger Policy (Automated vs. Admin Sign-off)"]
    end
```

### 1.1 Formally Approved Decisions (Locked Baseline)

| Reference | Area | Formal Policy & Architectural Enforcement Mechanism | Governance Tier |
| :--- | :--- | :--- | :---: |
| **ADR-01** | Feeder Schools | **Shared Canonical Directory with Tenant-Private Overlays:** Government school registries (UDISE codes, canonical names, geographic mandals) are shared across all tenants. All headmaster contact numbers, private notes, institutional ratings, and staff allocations remain strictly tenant-private. | `[OWNER-APPROVED DECISION]` |
| **ADR-02** | Lead Uniqueness | **Per-Tenant Phone Uniqueness:** Student phone number uniqueness is enforced strictly within each college tenant via `(workspace_id, phone_blind_index)` (`CHAR(64)`). College B is fully permitted to prospect a student previously contacted by College A without cross-tenant conflict or data leakage. | `[OWNER-APPROVED DECISION]` |
| **ADR-03** | Mobile Operation | **48-Hour Monotonic Lease + Online Revalidation on Continuity Break:** Field PRO mobile clients are permitted an autonomous offline operational window of up to 48 hours during continuous device uptime. Any break in hardware timing continuity (such as counter reset indicating reboot) requires online network revalidation before local database access resumes. | `[OWNER-APPROVED DECISION]` |
| **ADR-04** | SaaS Quotas | **Hard Staff-Seat Quota Enforcement:** Subscription plans enforce hard caps on active staff memberships (`max_staff_seats`). API attempts to provision staff beyond the entitlement fail closed with HTTP 422 until upgraded. | `[OWNER-APPROVED DECISION]` |
| **ADR-05** | Contact Privacy | **Personal Relative/Influencer Ownership & Departure Archival:** Village relative and influencer referral contacts mapped by a PRO are private to that staff member. Upon employee departure or deactivation, contacts are archived and hidden, not transferred to competing staff. | `[OWNER-APPROVED DECISION]` |
| **ADR-06** | Product Packaging | **Three Commercial Packages:** The system supports three commercial tiers in a single codebase: Individual PRO, AGM Bundle, and Full College Suite. | `[OWNER-APPROVED DECISION]` |

### 1.2 Open Commercial and Policy Questions Requiring Owner Sign-Off

1. **Individual PRO Workspace Migration into College Suite:**  
   - *Status:* `[UNRESOLVED OWNER DECISION]`  
   - *Policy Choices:* (A) Provide an explicit, audited migration wizard with dual authorization; (B) Mandate complete isolation with zero record transfers.  
   - *Architectural Recommendation:* Option A. `[RECOMMENDATION]`
2. **AGM Bundle Add-On PRO Seats:**  
   - *Status:* `[UNRESOLVED OWNER DECISION]`  
   - *Policy Choices:* (A) Support incremental PRO seat add-ons (e.g., base package of 5 PROs expanded to 8); (B) Require upgrading to Full College Suite.  
   - *Architectural Recommendation:* Option A. `[RECOMMENDATION]`
3. **Provisional School Review Expiry:**  
   - *Status:* `[UNRESOLVED OWNER DECISION]`  
   - *Policy Choices:* (A) Keep unreviewed submissions in `PROVISIONAL` status indefinitely; (B) Auto-promote to `CANONICAL` after 30 days without review.  
   - *Architectural Recommendation:* Option A to prevent directory corruption. `[RECOMMENDATION]`
4. **Offline Reboot Emergency Grace Window:**  
   - *Status:* `[UNRESOLVED OWNER DECISION]`  
   - *Policy Choices:* (A) Strict policy: require online revalidation immediately on offline reboot; (B) Permit a strictly bounded 4-hour emergency operational grace window.  
   - *Security Analysis:* Option B allows an attacker with physical possession to reboot the device repeatedly to obtain perpetual 4-hour windows.  
   - *Architectural Recommendation:* Option A (Strict online revalidation). Option B is marked unapproved. `[RECOMMENDATION]`
5. **Historical Data Retention Horizon:**  
   - *Status:* `[UNRESOLVED OWNER DECISION]`  
   - *Policy Choices:* (A) 5-year regulatory compliance retention; (B) 7-year statutory financial/educational record retention; (C) 10-year institutional archive.  
   - *Architectural Recommendation:* Configure retention period per jurisdiction and institutional SLA. Do not hardcode a single timeline. `[RECOMMENDATION]`
6. **Warm Tier Operational Duration in PostgreSQL:**  
   - *Status:* `[UNRESOLVED OWNER DECISION]`  
   - *Policy Choices:* (A) 1 prior academic year retained in PostgreSQL read replica / partitioned schema; (B) 2 prior academic years retained; (C) Immediate cold-storage migration upon academic-year close.  
   - *Architectural Recommendation:* Option B (2 prior academic years) provides optimal balance between historical reporting and primary DB cost, but remains a commercial/infrastructure sizing decision. `[RECOMMENDATION]`
7. **Academic-Year Archival Trigger Policy:**  
   - *Status:* `[UNRESOLVED OWNER DECISION]`  
   - *Policy Choices:* (A) Fully automated cron-job trigger after a fixed elapsed window post-closure; (B) Mandatory two-key administrative signoff (College Admin formal close request + Platform Admin execution approval).  
   - *Architectural Recommendation:* Option B. Unilateral automated deletion poses severe operational risk if an intake cycle runs late. `[RECOMMENDATION]`

---

## 2. Commercial Packaging and Domain Entitlement Model

### 2.1 The Three Commercial Packages

The platform provides a single unified codebase supporting three commercial packages. Package limits and feature flags are evaluated dynamically; no hardcoded package-specific code paths exist.

```mermaid
flowchart LR
    subgraph Package_Tiers ["Three Commercial Packages [OWNER-APPROVED DECISION]"]
        P1["Package 1: Individual PRO\n• 1 PRO Seat\n• Personal Lead Workspace\n• Doorstep Visits & Alarms\n• Personal Day-End PDF Export\n• No Supervisory Hierarchy"]
        P2["Package 2: AGM Bundle\n• 1 AGM + 2-10 PRO Seats\n• Zone & Mandal Territory Mgmt\n• Team Performance Oversight\n• AGM Team PDF Export\n• PRO PDF Export Disabled\n• No Telecaller / Admin Workspace"]
        P3["Package 3: Full College Suite\n• College Admin + AGM + PRO + Telecaller\n• College Admissions Operations\n• Catchment Penetration Analytics\n• Spot Admission & App Numbering\n• College Admin PDF Export\n• AGM/PRO Export Disabled by Default"]
    end
```

1. **Individual PRO Package:** Single-member workspace for independent field agents. Authorized for personal lead entry, doorstep visits, dynamic alarms, and **personal daily activity PDF exports**.
2. **AGM Bundle:** Multi-member regional workspace (1 AGM seat + configurable PRO seats). Authorized for team task management, territory allocation, and **AGM-level team/territory PDF reports**. PRO seats have **PDF export disabled by default**.
3. **Full College Suite:** Institutional enterprise workspace with complete administrative hierarchy (`COLLEGE_ADMIN`, `AGM`, `PRO`, `TELECALLER`), multi-branch partitioning, spot admissions with application numbering, catchment intelligence, and **College Admin-level authorized PDF exports**.

---

## 3. PDF Export Security and Forensic Watermarking Architecture

### 3.1 Threat Model for Document Exports

Exported operational summaries, PRO day reports, and catchment analyses represent high-value exfiltration targets. The PDF generation and delivery architecture enforces defense-in-depth:

```mermaid
flowchart TD
    subgraph Client_Req ["1. Export Request & Authorization"]
        User["User Initiates PDF Export Request"] --> AuthCheck{"Server-Side Entitlement Check:\nIs Role Authorized for this Package?"}
        AuthCheck -- No --> Forbidden["HTTP 403 Forbidden\n(Log Security Event)"]
        AuthCheck -- Yes --> Enqueue["Enqueue Export Job in Redis/BullMQ\nReturn HTTP 202 Accepted + Job ID"]
    end

    subgraph Worker_Gen ["2. Isolated PDF Generation Worker"]
        Enqueue --> Worker["Async PDF Worker (Chromium / Puppeteer Sandbox)"]
        Worker --> FetchData["Fetch Tenant Data under RLS Session Context"]
        Worker --> ApplyWatermark["Render Dynamic Forensic Visual Watermark:\n• Exporting User Full Name & Staff ID\n• Workspace ID & College Name\n• Client IP & UTC Timestamp\n• Diagonal Semi-Transparent Microprint Pattern"]
        Worker --> RenderPDF["Compile Encrypted PDF (Restricted Copy/Print Flags)"]
    end

    subgraph Storage_Delivery ["3. Ephemeral Delivery Pipeline"]
        RenderPDF --> S3Upload["Upload to Ephemeral S3 Bucket\nLifecycle Rule: 24h Auto-Deletion\nSSE-KMS Encryption"]
        S3Upload --> GenURL["Generate Short-Lived Pre-Signed URL\n(TTL = 15 Minutes Strict Expiry)"]
        GenURL --> AuditLog["Record Immutable Audit Event:\nREPORT_PDF_EXPORTED\n(User, Workspace, Filters, S3 Key, Hash)"]
        AuditLog --> Notify["Notify Client via WebSocket / Poll Endpoint"]
    end
```

### 3.2 Key Export Security Invariants

1. **Role-Based Entitlement Gates:** In the AGM Bundle, PRO seats have export buttons disabled in the UI and blocked with HTTP 403 at the API gateway. In the Full College Suite, only `COLLEGE_ADMIN` (or explicitly delegated supervisory roles) may export bulk lead summaries.
2. **Dynamic Forensic Watermarking:** Every generated page embeds a multi-layered watermark containing:
   - Requesting user's full name, email, and internal staff ID.
   - College tenant name and UUID.
   - IP address of the client and exact UTC export timestamp.
   - Micro-print tracking pattern across the background making photographic leaks attributable.
3. **Short-Lived Signed URLs:** PDFs are never stored in public buckets. Downloads use AWS S3 / Cloud Storage pre-signed URLs with a 15-minute expiration window.
4. **Ephemeral S3 Lifecycle:** Export artifacts are stored in a dedicated temporary bucket configured with a 24-hour expiration lifecycle rule.

---

## 4. Feeder-School Master Directory & Identity Resolution

### 4.1 Schema Partitioning: Shared Directory vs. Tenant Private Overlays

Feeder school master data combines government-verified canonical reference data with college-private relationship metadata:

```mermaid
erDiagram
    MASTER_SCHOOL ||--o{ SCHOOL_IDENTIFIER : "identified_by"
    MASTER_SCHOOL ||--o{ SCHOOL_ALIAS : "aliased_as"
    MASTER_SCHOOL ||--o{ COLLEGE_SCHOOL_ASSOCIATION : "associated_with"
    MASTER_SCHOOL ||--o{ SCHOOL_MERGE_SNAPSHOT : "restorable_via"

    WORKSPACE ||--o{ COLLEGE_SCHOOL_ASSOCIATION : "owns_association"
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
        char(64) phone_blind_index
    }
```

- **Canonical Shared Directory Fields (Global, No PII):**
  - `master_schools`: `canonical_name`, `normalized_name`, `school_category`, `district_id`, `mandal_id`, `village_id`, `verification_status`.
  - `school_identifiers`: `identifier_type` (UDISE, State Board Code), `identifier_value`, `issuing_authority`.
  - `school_aliases`: Alternate spellings and phonetic variations.
- **Tenant-Private Metadata & Contacts (Strictly Scoped by Workspace ID):**
  - `tenant_school_metadata`: `estimated_10th_strength`, `internal_grade`, `is_allocated_catchment`, `private_notes`.
  - `tenant_school_contacts`: Headmaster and key contact names, AES-256-GCM encrypted phone numbers, IVs, tags, and `CHAR(64)` blind indexes. **Strictly inaccessible to competing colleges.**

---

### 4.2 School Identity Resolution Workflow

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
1. **Tier 1 (Verified Official Match):** Matches verified government code (UDISE). Eliminates phonetic ambiguity subject to government accuracy.
2. **Tier 2 (Strong Local Match):** Matches canonical name or verified alias within the exact same mandal. Prompts user confirmation.
3. **Tier 3 (Probable Duplicate - Review Queue):** High token similarity ($>0.70$ Jaccard or Double Metaphone) within same district. **Never merged automatically.** Creates `school_contribution_requests` entry held for human review.
4. **Tier 4 (No Match - Provisional Creation):** Provisions new `master_schools` record with `verification_status = 'PROVISIONAL'`. Tagged with prominent visual badge: `[PROVISIONAL - UNVERIFIED]`. Usable immediately by submitting college; visible to other colleges with warning badge.

---

### 4.3 Transactional Merge Recovery & Association Collision Handling

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

    Admin->>API: POST /api/v1/admin/schools/merge { sourceId: B, targetId: A, justification: "Duplicate confirmed" }
    API->>API: Validate A != B; A.status == CANONICAL; B.status != MERGED
    
    rect rgb(240, 248, 255)
        Note over API,Audit: Atomic Database Transaction
        API->>SnapTable: INSERT INTO school_merge_snapshots (source_id, target_id, pre_merge_state_json)
        API->>MasterTable: UPDATE master_schools SET verification_status = 'MERGED', merged_into_id = A WHERE id = B
        API->>MasterTable: INSERT INTO school_aliases (master_school_id, alias_name, source) VALUES (A, B.canonical_name, 'MERGE_OP')
        
        Note over AssocTable,ContactTable: Handle Collisions Without Cross-Tenant Disclosure
        loop For each College C associated with School B
            alt College C is NOT associated with School A
                API->>AssocTable: UPDATE college_school_associations SET master_school_id = A WHERE workspace_id = C AND master_school_id = B
                API->>MetaTable: UPDATE tenant_school_metadata SET master_school_id = A WHERE workspace_id = C AND master_school_id = B
            else College C is ALREADY associated with School A (Collision)
                API->>AssocTable: UPDATE college_school_associations SET status = 'SUPERSEDED_BY_MERGE' WHERE workspace_id = C AND master_school_id = B
                API->>ContactTable: Re-point contacts belonging to B's metadata to point to A's metadata ID (Workspace C only)
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

- **Zero Cross-Tenant Leakage During Merges:** College 1's private notes and contacts for School B are merged strictly into College 1's records for School A. Private contacts from different colleges are never merged or disclosed across workspace boundaries.
- **Atomic Failure Recovery & Retry Idempotency:** The entire merge operation executes in a single database transaction. Failure rolls back completely. The request requires an `idempotency_key = UUIDv7`; retrying returns the snapshot result without re-executing.
- **Reversible Unmerge:** Durable pre-merge snapshots in `school_merge_snapshots` allow reversing accidental merges without data loss.

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
    DBHash["PostgreSQL user_sessions.token_hash\n(CHAR(64) Hex String)"]

    RawToken --> HMAC
    Pepper --> HMAC
    HMAC --> DBHash
```

- **Key:** `server_session_pepper` (256-bit cryptographically random secret injected via cloud secret managers).
- **Message:** `raw_session_token` (prefixed `st_` + 32 bytes CSPRNG Base64URL).
- **Database Storage:** Stored as a 64-character lowercase hex string in `user_sessions.token_hash` (`CHAR(64) NOT NULL UNIQUE`). Plain unkeyed SHA-256 is eliminated.
- **Dual-Pepper Zero-Downtime Rotation:** Runtime evaluates `HMAC(current_pepper, raw_token)`. If not found, evaluates `HMAC(previous_pepper, raw_token)`. If matched under `previous_pepper`, the session row is re-hashed with `current_pepper` and updated on the fly.
- **Immediate Revocation:** Logout, user deactivation, and workspace suspension immediately execute `UPDATE user_sessions SET revoked_at = NOW()`.

---

### 5.2 Offline Monotonic Clock Rollback Detection Algorithm & Ed25519 Asymmetric Time Tokens

#### 5.2.1 Cryptographic Correction: Ed25519 Asymmetric Signatures

Revision 3.1.2 contained an internal cryptographic contradiction by defining a symmetric HMAC signature (`sig = HMAC(server_key, payload)`) while asserting that the client verifies it using a "Server Public Key". Symmetric HMAC keys cannot be distributed to untrusted mobile clients without compromising the minting secret.

Revision 3.1.3 resolves this contradiction by specifying **Ed25519 asymmetric digital signatures** for all server-issued time tokens. The server retains the private signing key in Cloud KMS / Hardware Security Module (`server_ed25519_sk`), while the mobile application embeds or pins the server's public verification key (`server_ed25519_pk`).

$$\text{TimeTokenPayload} = \text{CanonicalJSON}(\{\text{token\_id}, \text{server\_utc}, \text{expires\_at}, \text{workspace\_id}, \text{user\_id}\})$$
$$\text{sig} = \text{Ed25519Sign}(\text{key} = \text{server\_ed25519\_sk}, \text{message} = \text{TimeTokenPayload})$$

```mermaid
flowchart TD
    subgraph Server_Handshake ["1. Online Server-Time Handshake"]
        Connect["Client Authenticates Online"] --> IssueToken["Server Mints Ed25519-Signed TimeToken:\n{ token_id, server_utc, expires_at, workspace_id, user_id, sig }"]
        IssueToken --> ClientVerify["Client Verifies Signature with Pinned Server Public Key:\nEd25519Verify(server_ed25519_pk, payload, sig)"]
        ClientVerify --> CheckReplay{"token_id in seen_tokens Set OR\nexpires_at < Current Estimated Time?"}
        CheckReplay -- Yes --> RejectToken["Reject Token (Replay / Expired Attack)\nLock Session"]
        CheckReplay -- No --> StoreAnchors["Atomically Store in Hardware-Backed Storage:\n• T_server_anchor = server_utc\n• M_boot_anchor = Platform Monotonic Ticks\n• Record token_id in seen_token_ids"]
    end

    subgraph Offline_Evaluation ["2. Offline Verification Algorithm (While Running)"]
        Tick["PRO Performs Action Offline"] --> ReadStorage["Read Anchors from Secure Storage"]
        ReadStorage -- Storage Read Error --> FailClosedStorage["Fail Closed Immediately:\nZeroize RAM Keys, Lock Database"]
        ReadStorage -- Success --> ReadMono["Read Current Monotonic Ticks (M_current)"]
        ReadMono --> ReadSystem["Read System Wall-Clock (T_system)"]
        ReadSystem --> CheckReset{"M_current < M_boot_anchor?\n(Monotonic Counter Reset)"}
        CheckReset -- Yes --> LockReboot["Lock Database: Require Online Revalidation\n(Timing Continuity Lost / Reboot Detected)"]
        CheckReset -- No --> CalcEst["Calculate Estimated UTC:\nT_estimated = T_server_anchor + (M_current - M_boot_anchor)"]
        CalcEst --> CheckDrift{"|T_system - T_estimated| > 15 Minutes?\n(Wall-Clock Tampered)"}
        CheckDrift -- Yes --> LockRollback["Lock Database: Require Online Revalidation\n(Clock Rollback Detected)"]
        CheckDrift -- No --> CheckLease{"(M_current - M_boot_anchor) > 48 Hours OR\nT_estimated > expires_at (±60s skew)?"}
        CheckLease -- Yes --> LockExpire["Evict RAM Keys & Lock App:\n(48h Lease Expired)"]
        CheckLease -- No --> PermitAction["Permit Offline Action & Log Mutation"]
    end
```

#### 5.2.2 Reframing Reboot Detection: Monotonic Counter Reset vs. Continuity Proof

Prior drafts claimed that $M_{\text{current}} < M_{\text{boot\_anchor}}$ proved a reboot had occurred. Architecturally, monotonic timers (`android.os.SystemClock.elapsedRealtime()` on Android, `mach_continuous_time()` on iOS) count elapsed ticks since device boot. Comparing $M_{\text{current}} < M_{\text{boot\_anchor}}$ detects that the monotonic counter has reset or wrapped. 

While a counter reset is a sufficient indicator that system continuity has broken, it does not mathematically prove a reboot (a hardware clock wrap or low-level kernel counter reset produces the same symptom). Crucially, consumer operating systems provide no offline mechanism to prove how much physical time elapsed while the device was powered down or rebooted. 

Therefore, the architectural rule is reframed: **if hardware timing continuity cannot be proven, the application must assume compromise and require online network revalidation.**

#### 5.2.3 Token Security Specification & Fail-Closed Storage

1. **Replay Prevention:** The mobile client maintains an append-only set of consumed `token_id` values (UUIDv7) in SQLCipher encrypted storage (`seen_token_ids`). If an attacker intercepts or attempts to replay a previously valid time token, the client checks the token against `seen_token_ids` and rejects it.
2. **Clock Skew & Expiration Enforcement:** The client verifies that $\text{server\_utc} \le \text{expires\_at}$. When validating lease expiration offline, the client enforces $\text{expires\_at}$ against $T_{\text{estimated}}$ with a strict tolerance of $\pm 60$ seconds to accommodate minor oscillator drift.
3. **Fail-Closed on Secure Storage Failure:** If a call to read or update `flutter_secure_storage` or the native platform Keychain/Keystore throws an exception (e.g., daemon crash, storage corruption, key invalidation), the application **must fail closed immediately**. It zeroes out $K_{\text{db}}$ in memory (`memset 0x00`), invalidates SQLite connection handles, and transitions to a locked screen requiring online re-authentication.

#### 5.2.4 Offline Token Replay Limitations, Flash Rollback & Hardware Boundaries

Architectural honesty requires documenting the physical limitations of consumer mobile platforms regarding state rollback:

```mermaid
flowchart TD
    subgraph Verified_Guarantees ["1. Verified Client Capabilities (During Continuous Uptime)"]
        G1["Monotonic Counter Monotonicity (Forward progression while running)"]
        G2["System Wall-Clock Drift Detection (|T_system - T_estimated| > 15m)"]
        G3["In-Memory Replay Prevention (Rejection of identical token_id in active session)"]
        G4["Fail-Closed on Exception (Zeroize RAM keys on storage read failure)"]
    end

    subgraph Hardware_Reqs ["2. Capabilities Requiring Hardware TEE / Online Verification"]
        H1["Persistent Hardware Monotonic Counters (StrongBox / Secure Enclave)"]
        H2["Online Cryptographic Timestamp Handshake (Server-side token invalidation)"]
        H3["Hardware Device Attestation (Play Integrity / App Attest)"]
    end

    subgraph Accepted_Limits ["3. Accepted Limitations on Consumer Mobile Devices"]
        L1["Flash Snapshot Restoration: Attacker restoring raw NAND flash or app container\nrewinds seen_token_ids and local SQLCipher database to earlier valid state"]
        L2["Offline Dormancy: Impossible without network to prove whether device was\npowered off for 5 minutes or 5 months"]
        L3["Zero Hardware Monotonic API for 3rd-Party Sandboxes on Standard Consumer OS"]
    end

    Verified_Guarantees --> Policy["Architectural Enforcement Policy:\n• Fail closed to online revalidation on any continuity loss\n• Enforce maximum 48h lease during continuous uptime\n• Lease duration subject to physical-device PoC validation"]
    Hardware_Reqs --> Policy
    Accepted_Limits --> Policy
```

1. **What the Client CAN Guarantee:**
   - During continuous uptime, `SystemClock.elapsedRealtime()` / `mach_continuous_time()` guarantees strict monotonic forward progression.
   - Any manual alteration of the device wall-clock is detected if it drifts $>15$ minutes from estimated time.
   - Any presented time token with a `token_id` already recorded in `seen_token_ids` within current storage state is immediately rejected.
2. **What Requires Hardware-Backed Evidence or Online Server Validation:**
   - True hardware rollback resistance requires dedicated non-volatile hardware monotonic counters (e.g., Android StrongBox tamper-resistant counters). However, modern consumer Android and iOS sandboxes do not expose raw hardware counter APIs to third-party applications.
   - Absolute protection against token reuse across app-data restorations requires an **online server handshake** where the server marks the token consumed in its database.
3. **Accepted Limitations on Consumer Mobile Hardware:**
   - **Local Storage Rollback via Flash Image:** If an attacker creates a full NAND flash image or OS-level application backup containing a valid, unexpired time token and later restores that snapshot offline, the local `seen_token_ids` set and SQLCipher database are reverted to the pre-consumed state. The client software running locally cannot detect that physical NAND flash blocks were restored while powered down.
   - **Offline Time Blindness:** When a device boots up offline, it cannot establish the true wall-clock time without an external trusted time anchor (cellular base station NITZ or NTP server).
4. **Enforcement Rule:** Whenever monotonic continuity is broken (counter reset indicating reboot), the client **must fail closed and require online network revalidation**. The 48-hour offline lease duration is an upper operational bound during continuous uptime and remains **subject to physical-device validation in PoC 2**.

---

### 5.3 Platform-Specific Reboot Detection (Android vs. iOS)

| Dimension | Android Implementation | iOS Implementation |
| :--- | :--- | :--- |
| **Monotonic Uptime API** | `android.os.SystemClock.elapsedRealtime()` (measures milliseconds since boot including deep sleep). | `clock_gettime(CLOCK_MONOTONIC_RAW, ...)` or `mach_continuous_time()` (nanoseconds since boot). |
| **Reset Detection Mechanism** | 1. Compare current `elapsedRealtime()` against `M_boot_anchor`. If current $<$ anchor, a counter reset occurred.<br>2. Listen for `android.intent.action.BOOT_COMPLETED` (requires `RECEIVE_BOOT_COMPLETED` permission). | 1. Compare current `mach_continuous_time()` against `M_boot_anchor`. If current $<$ anchor, a counter reset occurred.<br>2. Inspect `sysctl` with `KERN_BOOTTIME` (returns boot timeval struct). |
| **Limitation Concerning `/proc`** | `/proc/sys/kernel/random/boot_id` is restricted by modern SELinux on Android 11+ for untrusted app sandboxes. It must **not** be assumed accessible. | iOS has no `/proc` filesystem and does not expose a hardware boot UUID to third-party app sandboxes. |
| **Shared Offline Limitation** | If a device reboots while offline, monotonic counters reset to 0. It is impossible on consumer hardware to prove whether the device was powered off for 5 seconds or 5 months without network time. | Same limitation. Monotonic counter resets to 0. Wall-clock can be altered in settings. |
| **Safest Achievable Policy** | **Online Revalidation on Reboot (Default Baseline):** If counter reset indicates lost continuity, local database remains locked until network handshake succeeds. | Same policy. Local database locked until network handshake succeeds. |

---

### 5.4 Hardware Keystores, Cryptographic Erasure & Observable Evidence

```mermaid
flowchart TD
    subgraph Hardware_Boundary ["Hardware Security Element (StrongBox / TEE / Secure Enclave)"]
        KEK["Hardware Key (KEK_device)\n• Generated with KeyGenParameterSpec\n• PURPOSE_ENCRYPT | PURPOSE_DECRYPT\n• Non-Exportable from Hardware\n• Bound to Hardware Attestation"]
    end

    subgraph Ephemeral_RAM ["Process Memory (Volatile)"]
        RAM_Key["Decrypted Database Key (K_db)\nStored ONLY in RAM during active session"]
    end

    subgraph Storage_Boundary ["Flash Storage (Encrypted Database)"]
        Enc_DB[("SQLCipher SQLite Database\nEncrypted with 256-bit AES-CBC\nCiphertext on NAND Flash")]
    end

    KEK -->|Unwraps on Biometric/PIN| RAM_Key
    RAM_Key -->|Encrypts / Decrypts Blocks| Enc_DB

    subgraph Wipe_Trigger ["Cryptographic Erasure Event (Zeroization)"]
        Trigger["Wipe Trigger:\n• 48h Lease Expiry\n• Tamper Detected\n• Server 401 PURGE_DATA\n• Secure Storage Read Failure"]
        Trigger --> Zeroize["1. Call KeyStore.deleteEntry(alias)\n2. Zeroize RAM: native memset(K_db, 0, 32)\n3. Close DB Handles"]
    end

    Zeroize --> Result["Outcome:\nKEK_device destroyed in hardware element.\nK_db cannot be unwrapped.\nFlash ciphertext is mathematically irrecoverable\n(Defeats flash wear-leveling remap persistence)"]
```

#### Exact Pre- and Post-Deletion Testing Sequence
1. **Pre-Deletion Baseline Test:**
   - App calls hardware API: unwrap $K_{\text{db}}$ using $KEK_{\text{device}}$.
   - Open SQLCipher with $K_{\text{db}}$. Query `SELECT count(*) FROM student_leads;` $\implies$ Assert query returns $>0$.
2. **Cryptographic Erasure Execution:**
   - Call native platform deletion: `keyStore.deleteEntry(alias)` on Android, `SecItemDelete` on iOS.
   - Call native memory zeroization on $K_{\text{db}}$ buffer (`memset 0x00`).
3. **Post-Deletion Keystore Verification:**
   - Attempt to access key entry: `keyStore.containsAlias(alias)` $\implies$ Assert returns `false`.
   - Attempt hardware unwrap $\implies$ Assert throws `KeyStoreException` / `errSecItemNotFound`.
4. **Post-Deletion Decryption Test:**
   - Attempt to open local database using standard app workflow $\implies$ Fails at unwrap step before touching SQLite.
5. **Key Protection Rule:** The raw 256-bit database key $K_{\text{db}}$ is **never exported, logged, or saved to flash storage** for testing.

---

### 5.5 Safe Expand-and-Contract Blind-Index Rotation Sequence

#### 5.5.1 Architectural Requirement & Ordering Principle

In PostgreSQL, `CREATE INDEX CONCURRENTLY` and `CREATE UNIQUE INDEX CONCURRENTLY` **cannot execute inside a transaction block** (`ERROR: 25001`). Crucially, deploying an application version that references a new column (`phone_blind_index_v2`) **before that column exists in the database causes immediate runtime SQL crashes** (`column "phone_blind_index_v2" does not exist`). 

Application code deployments and database DDL are decoupled operational events. To guarantee continuous zero-downtime availability and multi-tenant uniqueness throughout rotation, the system enforces a strict **10-phase expand-and-contract sequence**:

```mermaid
sequenceDiagram
    autonumber
    actor Admin as Platform Security Admin
    participant DB as PostgreSQL 16 Primary
    participant App as App Fleet (Rolling Pods)
    participant Worker as Re-Indexing Worker
    participant Audit as Immutable Audit Log

    Note over DB,App: Phase 1 & 2: Database Expansion & Compatibility Verification
    Admin->>DB: Phase 1: ALTER TABLE student_leads ADD COLUMN phone_blind_index_v2 CHAR(64); (Nullable, unindexed)
    Admin->>DB: Phase 2: Verify column exists; assert App v1 fleet remains fully operational

    Note over DB,App: Phase 3: Deploy Dual-Write Application Version
    Admin->>App: Phase 3: Rolling deploy App v_dual (Computes & writes v1 + v2; queries v1)
    App->>DB: All new INSERTs and UPDATEs write both blind indexes

    Note over DB,Worker: Phase 4 & 5: Online Backfill & Completeness Verification
    Admin->>Worker: Phase 4: Start bounded backfill worker (Batches of 500 rows, SKIP LOCKED)
    Worker->>DB: UPDATE student_leads SET phone_blind_index_v2 = HMAC(salt_v2, phone)
    Admin->>DB: Phase 5: Verify zero unpopulated rows & zero v2 duplicates

    Note over DB,Worker: Phase 6: Concurrent Index Creation (Outside Tx Block)
    Worker->>DB: Phase 6: CREATE UNIQUE INDEX CONCURRENTLY idx_unique_active_workspace_phone_v2 ...
    Worker->>DB: Poll pg_index.indisvalid == true

    Note over DB,App: Phase 7: Deploy Read-V2 Application Version
    Admin->>App: Phase 7: Rolling deploy App v_read_v2 (Queries point to v2; writes v1 + v2)

    Note over DB,App: Phase 8: Deploy Pre-Final Compatibility Application Version
    Admin->>App: Phase 8: Rolling deploy App v_final_pre (Reads and writes strictly via v2; no v1 code)
    Admin->>App: Assert 100% of running fleet is on App v_final_pre

    Note over DB,Admin: Phase 9 & 10: Contract Phase (Index Drop & Column Cleanup)
    Admin->>DB: Phase 9: DROP INDEX CONCURRENTLY idx_unique_active_workspace_phone; (Outside Tx)
    Admin->>DB: Phase 10: ALTER TABLE student_leads DROP COLUMN phone_blind_index;
    Admin->>DB: ALTER TABLE student_leads RENAME COLUMN phone_blind_index_v2 TO phone_blind_index;
    Admin->>DB: ALTER INDEX idx_unique_active_workspace_phone_v2 RENAME TO idx_unique_active_workspace_phone;
    Admin->>Audit: Log Audit Event (BLIND_INDEX_ROTATED, { workspaceId, saltVersion: "v2" })
```

---

#### 5.5.2 Comprehensive 10-Phase Deployment Matrix

| Phase | Phase Name | Available Database Schema State | Safe Running Application Versions | Preconditions & Observable Verification Checks | Rollback Procedure & Point of No Return |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Phase 1** | **DDL: Add Nullable Column** | `student_leads` has `phone_blind_index CHAR(64)` with unique index; `phone_blind_index_v2 CHAR(64) NULL` added. No index on v2. | `App v1` (Only reads/writes v1) | **Precondition:** `pg_stat_activity` free of long transactions.<br>**Check:** `SELECT column_name FROM information_schema.columns WHERE table_name = 'student_leads' AND column_name = 'phone_blind_index_v2';` returns 1 row. | **Rollback:** `ALTER TABLE student_leads DROP COLUMN phone_blind_index_v2;`. Safe, zero data loss. |
| **Phase 2** | **Compatibility Verification** | Column `phone_blind_index_v2` exists, nullable, unindexed. | `App v1` | **Precondition:** Phase 1 complete.<br>**Check:** Query production error logs; assert `App v1` error rate is 0.00%. | **Rollback:** Same as Phase 1. |
| **Phase 3** | **Deploy Dual-Write Application** | Column `phone_blind_index_v2` exists. Active unique index on v1. | `App v1` (during rollout), `App v_dual` | **Precondition:** Column v2 confirmed present.<br>**Check:** Pod rollout 100% complete. Monitor inserts: verify new rows have non-null `phone_blind_index_v2`. | **Rollback:** Roll back fleet to `App v1`. Any written v2 values are simply abandoned. |
| **Phase 4** | **Online Bounded Backfill** | Column `phone_blind_index_v2` being populated. Active unique index on v1. | `App v_dual` | **Precondition:** 100% fleet on `App v_dual`.<br>**Check:** Backfill worker logs batch progress. `pg_stat_activity` monitors lock wait times $\le 50\text{ms}$. | **Rollback:** Terminate backfill worker. Roll back fleet to `App v1`. Drop column v2. |
| **Phase 5** | **Backfill Completeness & Duplicate Triage** | All active rows have non-null `phone_blind_index_v2`. Active unique index on v1. | `App v_dual` | **Precondition:** Backfill worker finishes.<br>**Check:** `SELECT count(*) FROM student_leads WHERE phone_blind_index_v2 IS NULL;` returns exactly 0.<br>**Check:** Duplicate check on v2 returns 0 rows. | **Rollback:** If unresolvable duplicates found, abort. Stop dual-write, roll back to `App v1`. |
| **Phase 6** | **Concurrent Unique Index Creation** | Unique index on v1; concurrent unique index `idx_unique_active_workspace_phone_v2` building/built. | `App v_dual` | **Precondition:** Zero nulls and zero duplicates in v2.<br>**Check (Post-DDL):** `SELECT indisvalid FROM pg_index WHERE indexrelid = 'idx_unique_active_workspace_phone_v2'::regclass;` returns `true`. | **Rollback:** If `indisvalid` is `false`, run `DROP INDEX CONCURRENTLY idx_unique_active_workspace_phone_v2;`. v1 index remains 100% intact. |
| **Phase 7** | **Deploy Read-V2 Application** | Both unique indexes valid. Reads and writes point to v2; writes also duplicate to v1. | `App v_dual` (during rollout), `App v_read_v2` | **Precondition:** Index v2 valid (`indisvalid = true`).<br>**Check:** Application metrics show lookups hitting v2 index. Conflict errors trigger on v2. | **Rollback:** Roll back fleet to `App v_dual`. Reads revert to v1. Both indexes maintained. |
| **Phase 8** | **Deploy Pre-Final Compatible Application** | Both columns exist; both indexes valid. | `App v_read_v2` (during rollout), `App v_final_pre` | **Precondition:** Phase 7 running stably for $\ge 24\text{h}$.<br>**Check:** Verify **zero pods** across cluster remain on versions prior to `App v_final_pre`. | **Rollback:** Re-deploy `App v_read_v2`. |
| **Phase 9** | **Retire Old Index (Outside Tx Block)** | Only unique index on v2 active. Old index removed. Both columns present. | `App v_final_pre` | **Precondition:** 100% fleet on `App v_final_pre`.<br>**Check:** `pg_stat_user_indexes` shows 0 scans on old index. Run `DROP INDEX CONCURRENTLY idx_unique_active_workspace_phone;`. | **Rollback:** If needed, rebuild v1 index with `CREATE UNIQUE INDEX CONCURRENTLY`. |
| **Phase 10** | **Final DDL Cleanup** | Single column `phone_blind_index` with single unique index. | `App v_final_pre`, `App v_final` | **Precondition:** Phase 9 verified. Zero references to old column.<br>**Check:** Execute short DDL transaction (drop old column, rename v2). `SELECT column_name FROM information_schema.columns` confirms clean schema. | **POINT OF NO RETURN:** Once Phase 10 commits, column `phone_blind_index` (v1) is physically dropped. Rolling back to v1 requires a full new forward rotation. |

---

#### 5.5.3 Operational Guarantees & Edge-Case Handling

1. **Concurrent Writes & Uniqueness Invariants:**
   - From Phase 3 through Phase 6, `App v_dual` computes both hashes on every `INSERT` and `UPDATE`. Uniqueness is actively enforced by PostgreSQL via the pre-existing unique index on `phone_blind_index` (v1).
   - From Phase 6 onward, both unique indexes exist and are valid. PostgreSQL enforces uniqueness on both columns simultaneously.
   - From Phase 8 onward, uniqueness is enforced exclusively via `idx_unique_active_workspace_phone_v2`.
2. **Backfill Idempotency & Interrupted Job Recovery:**
   - The backfill background worker queries rows using `SELECT id, encrypted_phone FROM student_leads WHERE phone_blind_index_v2 IS NULL LIMIT 500 FOR UPDATE SKIP LOCKED;`.
   - If the worker pod crashes or the database connection terminates mid-batch, the uncommitted batch rolls back cleanly. The next execution picks up from the remaining rows where `phone_blind_index_v2 IS NULL`.
   - The worker never updates a row that already has a non-null v2 value.
3. **Decoupled Architecture Rule:** Application code deployments and database DDL are strictly decoupled. No migration script or CI/CD pipeline shall ever attempt to execute application deployment and concurrent DDL in the same automated step.

---

### 5.6 Parameter-Safe PostgreSQL RLS & Root-Cause Failure Protocol

```sql
-- Parameter-safe transaction-local tenant context
SELECT set_config('app.current_tenant_id', $1, true);

-- Partial Unique Index on active leads (CHAR(64))
CREATE UNIQUE INDEX idx_unique_active_workspace_phone 
ON student_leads (workspace_id, phone_blind_index) 
WHERE deleted_at IS NULL;
```

#### Behavioral Distinction: 0-Row SELECT vs. Rejected Writes
- **`SELECT`:** Missing context or mismatched context evaluates `USING` to false $\implies$ returns **0 rows** (empty result set, failing closed without leaking existence).
- **`INSERT`:** Missing context or mismatched context evaluates `WITH CHECK` to false $\implies$ raises PostgreSQL error `42501` (`insufficient_privilege`).
- **`UPDATE` / `DELETE`:** Rows of other tenants are invisible under `USING` (0 rows affected). Attempts to mutate `workspace_id` trigger error `42501`.

#### RLS PoC Failure Protocol (No Bare-Application Fallback)
If the Drizzle ORM + RLS PoC fails under PgBouncer transaction pooling (due to context leakage, pooler bugs, or latency overhead $>2.0\text{ms}$):
1. **Root-Cause Analysis (RCA):** The team must stop and produce a formal RCA document detailing why transaction-scoped context bled or failed.
2. **Demonstrated Alternative Boundary Required:** Falling back to application-layer repository filtering alone is **strictly rejected**. Before proceeding to implementation, an alternative structural database isolation boundary must be demonstrated:
   - *Alternative A: Schema-per-Tenant Separation* (`search_path` routing with separate PostgreSQL schemas per tenant).
   - *Alternative B: Dedicated Connection Pools per Tenant* (PgBouncer routing connections to dedicated tenant databases).

---

### 5.7 Cross-Workspace Lead Migration: Transactional Audit Consistency

```mermaid
sequenceDiagram
    autonumber
    actor PRO as Individual PRO (Source Workspace A)
    actor Admin as College Admin (Destination Workspace B)
    participant API as Migration API (/api/v1/workspaces/migrate-leads)
    participant KMS as Cloud KMS
    participant DB as PostgreSQL Database
    participant AuditTable as audit_events Table

    PRO->>API: Initiate Migration Request (Selected Lead IDs, Target Workspace B, IdempotencyKey)
    Admin->>API: Approve Migration Request (Sign Dual-Consent Agreement)
    
    rect rgb(240, 248, 255)
        Note over API,AuditTable: Atomic Database Transaction
        API->>DB: BEGIN TRANSACTION;
        
        API->>DB: Fetch Encrypted Leads from Workspace A
        API->>KMS: Decrypt Workspace A Leads using DEK_A -> raw_phone
        API->>API: Compute candidate_blind_index = HMAC-SHA256(workspace_phone_salt_B, raw_phone)
        
        API->>DB: SELECT id FROM student_leads WHERE workspace_id = B AND phone_blind_index = candidate_blind_index AND deleted_at IS NULL
        alt Collision Detected
            Note over API,DB: Flag collision in migration_triage_records (Do NOT overwrite)
        else No Collision
            API->>KMS: Encrypt raw_phone with Workspace B DEK_B -> encrypted_phone_B
            API->>DB: INSERT INTO student_leads (workspace_id = B, phone_blind_index, encrypted_phone_B, migrated_from_id = A)
            API->>DB: UPDATE student_leads SET deleted_at = NOW(), migration_target_id = B, migration_status = 'MIGRATED_OUT' WHERE id = Lead_A
        end
        
        Note over API,AuditTable: Audit Records Written in SAME Database Transaction
        API->>AuditTable: INSERT INTO audit_events (workspace_id = A, action = 'LEAD_MIGRATED_OUT', entity_id = Lead_A)
        API->>AuditTable: INSERT INTO audit_events (workspace_id = B, action = 'LEAD_MIGRATED_IN', entity_id = New_Lead_B)
        API->>DB: INSERT INTO workspace_migration_runs (idempotency_key, status = 'COMPLETED')
        
        API->>DB: COMMIT;
    end

    API-->>Admin: 200 OK (Migration Summary: 45 Imported, 2 Collisions Triaged)
```

- **Transactional Audit Invariant:** The audit records are written **transactionally within the exact same database transaction** as the lead insertion in Workspace B and soft-deletion in Workspace A.
- **Idempotency & Partial Failure Recovery:**
  - If a transaction aborts or the network drops before commit, the entire migration rolls back: source lead is not soft-deleted, destination lead is not inserted, and no audit event is created.
  - Client retries with the same `idempotency_key`. The server checks `workspace_migration_runs`: if `COMPLETED`, returns the stored migration receipt without re-executing.
  - Migration state and audit evidence cannot silently diverge.

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
    WORKSPACE ||--o{ WORKSPACE_ARCHIVAL_MANIFEST : "archives"
    WORKSPACE ||--o{ WORKSPACE_ARCHIVE_DELETION_AUTHORIZATION : "authorizes_deletion"
    WORKSPACE ||--o{ WORKSPACE_COMPLIANCE_HOLD : "subject_to"

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

### Core Schema Entity Specifications (Highlighting Standardized Blind Indexes & Archival Entities)

- **`STUDENT_LEAD`:**
  - `id`: `UUID PK`
  - `workspace_id`: `UUID FK NOT NULL`
  - `academic_year_id`: `UUID FK NOT NULL`
  - `student_name`: `VARCHAR(150) NOT NULL`
  - `encrypted_phone`: `BYTEA NOT NULL` (AES-256-GCM ciphertext)
  - `phone_iv`: `BYTEA NOT NULL` (12 bytes)
  - `phone_tag`: `BYTEA NOT NULL` (16 bytes)
  - `phone_blind_index`: `CHAR(64) NOT NULL` (HMAC-SHA256 lowercase hex string; standardized across all schemas)
  - `status`: `VARCHAR(50) NOT NULL` (`NEW_PROSPECT | CONTACTED | VISITED | APPLIED | ADMITTED | LOST`)
  - `assigned_staff_id`: `UUID FK`
  - `created_at`: `TIMESTAMPTZ NOT NULL DEFAULT NOW()`
  - `deleted_at`: `TIMESTAMPTZ` (Soft delete for operational tombstoning)
- **`WORKSPACE_ARCHIVAL_MANIFEST`:**
  - `id`: `UUID PK`
  - `workspace_id`: `UUID FK NOT NULL`
  - `academic_year_id`: `UUID FK NOT NULL`
  - `s3_prefix`: `VARCHAR(500) NOT NULL`
  - `record_count`: `INTEGER NOT NULL`
  - `payload_sha256`: `CHAR(64) NOT NULL` (Aggregate cryptographic checksum of all exported chunks)
  - `chunk_manifest_json`: `JSONB NOT NULL` (List of chunk files, per-chunk row counts, and individual chunk SHA-256 hashes)
  - `status`: `VARCHAR(50) NOT NULL` (`EXPORTED | VERIFIED | RESTORING | PURGED`)
  - `created_at`: `TIMESTAMPTZ NOT NULL DEFAULT NOW()`
  - `verified_at`: `TIMESTAMPTZ`
- **`WORKSPACE_ARCHIVE_DELETION_AUTHORIZATION`:**
  - `id`: `UUID PK` (UUIDv7)
  - `workspace_id`: `UUID FK NOT NULL`
  - `academic_year_id`: `UUID FK NOT NULL`
  - `manifest_id`: `UUID FK NOT NULL` (Strict foreign key to `workspace_archival_manifests.id`)
  - `payload_sha256`: `CHAR(64) NOT NULL` (Cryptographically bound to manifest payload hash)
  - `eligible_record_scope_json`: `JSONB NOT NULL` (Explicit snapshot query criteria, cohort range, and excluded admitted lead IDs)
  - `planned_deletion_counts_json`: `JSONB NOT NULL` (Itemized planned deletion counts per table)
  - `verification_result_id`: `UUID NOT NULL` (Audit ID of successful pre-authorization verification run)
  - `college_admin_id`: `UUID FK NOT NULL` (Digital authorization signature from College Admin)
  - `platform_security_admin_id`: `UUID FK NOT NULL` (Independent approval signature from Platform Security Admin)
  - `authorized_at`: `TIMESTAMPTZ NOT NULL DEFAULT NOW()`
  - `expires_at`: `TIMESTAMPTZ NOT NULL` (Strict 24-hour expiration window: `authorized_at + INTERVAL '24 hours'`)
  - `status`: `VARCHAR(50) NOT NULL DEFAULT 'AUTHORIZED'` (`AUTHORIZED | IN_PROGRESS | CONSUMED | EXPIRED | REVOKED`)
  - `consumed_at`: `TIMESTAMPTZ`
- **`WORKSPACE_COMPLIANCE_HOLD`:**
  - `id`: `UUID PK`
  - `workspace_id`: `UUID FK NOT NULL`
  - `academic_year_id`: `UUID FK` (Nullable: if NULL, hold applies to entire workspace)
  - `hold_reason`: `VARCHAR(255) NOT NULL` (`LITIGATION_PENDING | STATUTORY_AUDIT | REGULATORY_INVESTIGATION`)
  - `authorized_by`: `UUID FK NOT NULL`
  - `is_active`: `BOOLEAN NOT NULL DEFAULT TRUE`
  - `placed_at`: `TIMESTAMPTZ NOT NULL DEFAULT NOW()`
  - `released_at`: `TIMESTAMPTZ`

---

## 7. Database Indexing and Query Performance Strategy

> [!NOTE]
> This section is a `[PROPOSED SPECIFICATION]`. Index definitions are design artefacts only. No DDL has been executed.

### 7.1 Index Philosophy and Classification

Every index in the system belongs to one of three functional classes:

| Class | Purpose | Examples |
| :--- | :--- | :--- |
| **Uniqueness** | Enforce data-integrity constraints at the database layer | Tenant-scoped phone blind index (`CHAR(64)`); active workspace membership |
| **Lookup / Keyset Selectivity** | Accelerate filtered multi-tenant queries with deterministic pagination | Composite `(workspace_id, status, assigned_staff_id, created_at DESC, id DESC)` on leads |
| **Sort / Range** | Accelerate time-series ordering, daily activity rollup, and date filtering | `(workspace_id, staff_id, visited_at DESC, id DESC)` on `field_visits` |

#### Architectural Invariants for Index Design
1. **Leading Tenant Column:** Every tenant-scoped index places `workspace_id` as the leading column, ensuring optimal scan boundaries under PostgreSQL Row-Level Security.
2. **Deterministic Keyset Pagination Ordering:** B-Tree lookup indexes that serve paginated UI lists must append `(..., created_at DESC, id DESC)` or `(..., timestamp DESC, id DESC)`. This guarantees stable, deterministic keyset (cursor-based) pagination (`WHERE (created_at, id) < ($cursor_time, $cursor_id) ORDER BY created_at DESC, id DESC LIMIT 50`) without the catastrophic performance degradation of offset pagination.
3. **Type Consistency:** All phone blind index columns are strictly defined as `CHAR(64)` across all tables (`student_leads.phone_blind_index`, `tenant_school_contacts.phone_blind_index`), matching the output length of HMAC-SHA256 hex encoding.
4. **Partial Indexing for Active Data:** Partial indexes (`WHERE deleted_at IS NULL`) exclude soft-deleted operational rows and completed historical records from hot query paths.

---

### 7.2 Critical Index Catalogue

```sql
-- =========================================================================
-- 1. UNIQUENESS CONSTRAINTS & BLIND INDEXES
-- =========================================================================

-- Tenant-scoped phone blind index (CHAR(64), partial; active leads only)
CREATE UNIQUE INDEX idx_unique_active_workspace_phone
  ON student_leads (workspace_id, phone_blind_index)
  WHERE deleted_at IS NULL;

-- One active membership per user per workspace
CREATE UNIQUE INDEX idx_unique_active_membership
  ON workspace_memberships (workspace_id, user_identity_id)
  WHERE is_active = TRUE;

-- One live session token per hash (CHAR(64) constant-time lookup)
CREATE UNIQUE INDEX idx_unique_session_token_hash
  ON user_sessions (token_hash);

-- Active compliance hold uniqueness per workspace and academic year
CREATE UNIQUE INDEX idx_unique_active_compliance_hold
  ON workspace_compliance_holds (workspace_id, academic_year_id)
  WHERE is_active = TRUE;

-- Active deletion authorization uniqueness per manifest
CREATE UNIQUE INDEX idx_unique_active_deletion_auth
  ON workspace_archive_deletion_authorizations (workspace_id, manifest_id)
  WHERE status IN ('AUTHORIZED', 'IN_PROGRESS');

-- =========================================================================
-- 2. LOOKUP INDEXES WITH DETERMINISTIC KEYSET PAGINATION
-- =========================================================================

-- Lead list filtered by workspace + status + assigned staff (Keyset ordered)
CREATE INDEX idx_leads_ws_status_staff_created
  ON student_leads (workspace_id, status, assigned_staff_id, created_at DESC, id DESC)
  WHERE deleted_at IS NULL;

-- Default lead list by workspace with keyset cursor pagination
CREATE INDEX idx_leads_ws_created_id
  ON student_leads (workspace_id, created_at DESC, id DESC)
  WHERE deleted_at IS NULL;

-- Field visits by lead (most common parent/student interaction drill-down)
CREATE INDEX idx_visits_lead_visited_id
  ON field_visits (lead_id, visited_at DESC, id DESC);

-- Telecall interactions by lead
CREATE INDEX idx_telecall_lead_called_id
  ON telecall_interactions (lead_id, called_at DESC, id DESC);

-- Staff territory assignments by workspace + mandal
CREATE INDEX idx_territory_ws_mandal
  ON staff_territory_assignments (workspace_id, mandal_id);

-- School contacts by blind index (per-tenant lookup, CHAR(64))
CREATE INDEX idx_school_contact_blind
  ON tenant_school_contacts (phone_blind_index);

-- =========================================================================
-- 3. SORT, RANGE & AUDIT TRAIL INDEXES
-- =========================================================================

-- Day-report queries (PRO daily activity rollup ordered with tie-breaker)
CREATE INDEX idx_visits_ws_staff_date_id
  ON field_visits (workspace_id, staff_id, visited_at DESC, id DESC)
  WHERE deleted_at IS NULL;

-- Telecalls by workspace and staff with keyset cursor
CREATE INDEX idx_telecall_ws_called_id
  ON telecall_interactions (workspace_id, called_at DESC, id DESC);

-- Audit events by workspace + entity (deterministic historical audit trail)
CREATE INDEX idx_audit_ws_entity_occurred_id
  ON audit_events (workspace_id, entity_type, entity_id, occurred_at DESC, id DESC);

-- Global workspace audit events for administrative stream
CREATE INDEX idx_audit_ws_occurred_id
  ON audit_events (workspace_id, occurred_at DESC, id DESC);

-- Admission records by academic year + workspace
CREATE INDEX idx_admission_ws_year_admitted
  ON admission_records (workspace_id, academic_year_id, admitted_at DESC, id DESC);

-- Subscription expiry lookups (background billing/renewal workers)
CREATE INDEX idx_subscription_expiry
  ON workspace_subscriptions (current_period_end)
  WHERE status = 'ACTIVE';
```

---

### 7.3 Query Performance Targets & Seeded Benchmark Protocol

| Query Pattern | p95 Latency Target | Measurement Protocol |
| :--- | :---: | :--- |
| Lead list for a PRO (keyset paginated, 50 rows, `workspace_id + status`) | ≤ 10 ms | `EXPLAIN (ANALYZE, BUFFERS)` on seeded multi-tenant dataset |
| Session token lookup by hash (`CHAR(64)` exact match) | ≤ 2 ms | Dedicated Vitest driver benchmark via direct pg client |
| AGM team daily visit count (by mandal and date range) | ≤ 25 ms | `EXPLAIN (ANALYZE, BUFFERS)` |
| Feeder school search within mandal (normalized name) | ≤ 15 ms | `EXPLAIN (ANALYZE, BUFFERS)` |
| Admission count by academic year (College Admin dashboard) | ≤ 30 ms | `EXPLAIN (ANALYZE, BUFFERS)` |
| Audit trail for a single lead (all events, keyset ordered) | ≤ 20 ms | `EXPLAIN (ANALYZE, BUFFERS)` |

#### Benchmark Scale Qualification: Minimal Synthetic Baseline vs. Full Production Simulation

The benchmark dataset specified below constitutes a **minimal synthetic baseline** intended strictly to verify index selectivity, index-only scan choices, and query planning behaviors in Phase 0:
- 10 tenant workspaces × 5,000 student leads each (50,000 total leads).
- 200,000 field visit records.
- 500,000 audit event records.

**Production Scale Benchmark Requirements:** A 50,000-lead synthetic dataset does **not** demonstrate production scale for a multi-tenant SaaS serving enterprise college networks. Prior to production launch, full-scale load testing must simulate:
1. **Concurrent Mixed Workloads:** 250 concurrent PRO mobile sync operations writing field visits while 25 College Admins query analytical dashboards.
2. **Tenant Data Skew:** A power-law distribution where Tier-1 enterprise colleges hold 100,000+ leads and millions of audit rows alongside small single-PRO workspaces.
3. **RLS & Pooler Overhead:** 10,000 rapid transactions through PgBouncer measuring context switching overhead with `set_config`.
4. **Archival I/O Contention:** Sustained live read/write performance while a background archival worker streams chunks under `REPEATABLE READ` snapshot isolation.

---

### 7.4 Query Execution Plan Governance

- **Execution Plan Capture:** `EXPLAIN (ANALYZE, BUFFERS)` output must be captured and committed to the performance test suite for every query introduced.
- **Refined Sequential Scan Governance:** A sequential scan (`Seq Scan`) on a table exceeding 10,000 rows is **not** automatically classified as an architectural defect if:
  1. The query executes a full-cohort archival export under snapshot isolation where streaming all rows sequentially is significantly more I/O-efficient than traversing B-Tree leaves.
  2. The query performs a legitimate whole-cohort statistical aggregation where optimizer selectivity estimates exceed 20% of the physical table pages.
  For all other OLTP application queries, a sequential scan on $>10,000$ rows is treated as an index defect requiring resolution or formal architectural review.
- **Index Scan Verification:** Index usage is continuously verified in staging via `pg_stat_user_indexes.idx_scan`. Any index demonstrating zero scans across a full test cycle is evaluated for removal to eliminate write-amplification overhead.

---

## 8. Academic-Year Data Lifecycle, Cold Storage, and Cost Optimization

> [!NOTE]
> This section is a `[PROPOSED SPECIFICATION]`. No archival workers, schema partitioning, or cloud object lifecycles have been implemented.

### 8.1 Academic-Year Lifecycle Concept & Owner Preference Alignment

College admissions operations follow discrete annual cycles. In accordance with product-owner preferences:
1. **Live Operational Data:** Current academic-year leads, field visits, telecaller queues, alarms, and daily reports remain fully live in the primary PostgreSQL database for high-concurrency, sub-10ms transactional operations.
2. **Permanent Core Data in PostgreSQL:** Approved operational statistics, institutional aggregates, **all admitted-student records (`admission_records`)**, and **all audit logs (`audit_events`)** remain permanently stored in PostgreSQL for immediate institutional reporting and regulatory traceability.
3. **Eligible Historical Data Archival:** Older operational interaction data (unconverted prospect leads, historical field visit details, telecalling voice logs, and transient task notes) is migrated to encrypted, compressed object storage once the intake cycle closes.
4. **Policy Decision Boundaries:** Rather than imposing arbitrary engineering defaults, parameters such as the post-closure waiting window, warm-tier retention horizon, and compliance retention periods are formally categorized as `[UNRESOLVED OWNER DECISION]` items (Section 1.2, Items 5–7).

```mermaid
flowchart LR
    subgraph Hot_Tier ["1. Hot Operational (PostgreSQL Primary)"]
        H1["Current Academic Year\nReal-time reads & writes\nSub-10ms p95 Latency\nRLS Tenant Isolated"]
    end
    subgraph Warm_Tier ["2. Warm Analytical (Optional Tier [UNRESOLVED OWNER DECISION])"]
        W1["Prior Academic Years (T-1 to T-k)\nPostgreSQL Read Replica / Partition\nAnalytical reporting & dashboard drill-downs"]
    end
    subgraph Cold_Tier ["3. Cold Archival (Encrypted Object Storage)"]
        C1["Closed Cohort Archives\nCompressed JSONL.gz\nAWS S3 Glacier / GCS Archive\nKMS Per-Cohort Archive DEK"]
    end
    subgraph Purge_Tier ["4. Compliance Expiry (Zeroization)"]
        D1["Retention Period Expired\nCryptographic Erasure (DEK Destroyed)\nPhysical Object Deletion via S3 Lifecycle"]
    end

    H1 -->|"Formal Academic Year Close\n+ Waiting Period Elapsed"| W1
    W1 -->|"Archival Policy Triggered\nSnapshot Export & Verification"| C1
    C1 -->|"Statutory Retention Reached\nOwner/Legal Signoff"| D1
```

---

### 8.2 Archival Eligibility Criteria & Compliance Holds

A cohort qualifies for archival and subsequent live cleanup only when **all five** of the following prerequisites evaluate to true:

| Condition | Verification Check |
| :--- | :--- |
| **1. Academic Year Closed** | `academic_years.status = 'CLOSED'` with formal administrative close timestamp. |
| **2. Configured Elapsed Window** | The configured post-closure waiting interval ($T_{\text{archive\_wait}}$, e.g. 6 to 12 months, per owner policy) has elapsed since `closed_at`. |
| **3. No Active Compliance Hold** | The workspace and cohort are clear of legal or regulatory holds: `SELECT count(*) FROM workspace_compliance_holds WHERE workspace_id = $1 AND (academic_year_id = $2 OR academic_year_id IS NULL) AND is_active = TRUE;` returns exactly 0. |
| **4. No Pending Migrations** | `workspace_migration_runs` shows zero `PENDING` or `IN_PROGRESS` records referencing the cohort. |
| **5. Unconverted Leads Only** | Admitted student records (`status = 'ADMITTED'` with an associated `admission_records` row) are marked for permanent PostgreSQL retention and excluded from live deletion. |

---

### 8.3 Snapshot-Consistent Export, Multi-Factor Verification & Cryptographically Bound Deletion Authorization

Archival and subsequent live database cleanup is structured into three discrete, auditable phases: **Snapshot-Isolated Export**, **Independent Multi-Factor Verification with Bound Authorization**, and **Transaction-Safe Pre-Batch Revalidation Deletion**:

```mermaid
sequenceDiagram
    autonumber
    actor CollegeAdmin as College Admin
    actor SecAdmin as Platform Security Admin
    participant Archiver as Archival Background Worker
    participant DB as PostgreSQL 16 Primary
    participant S3 as Cold Object Storage (Glacier / GCS)
    participant KMS as AWS KMS / Cloud KMS
    participant AuthTable as workspace_archive_deletion_authorizations Table
    participant Manifest as workspace_archival_manifests Table
    participant Audit as Immutable Audit Log

    Note over CollegeAdmin,SecAdmin: Phase 1: Snapshot Export under REPEATABLE READ
    SecAdmin->>Archiver: Trigger Archival Export (workspace_id, academic_year_id)
    Archiver->>DB: Check Eligibility & Compliance Holds (Section 8.2)

    rect rgb(240, 248, 255)
        Archiver->>DB: BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ;
        Archiver->>DB: SELECT id FROM student_leads WHERE workspace_id = $1 AND academic_year_id = $2 AND status != 'ADMITTED';
        Note over Archiver,DB: Captures isolated cohort snapshot unaffected by concurrent writes
        
        loop In Batches of 1,000 Rows
            Archiver->>DB: Fetch batch rows (leads, visits, telecalls, tasks)
            Archiver->>Archiver: Compute per-chunk SHA-256 hash & compress to JSONL.gz
            Archiver->>KMS: GenerateDataKey(archive_key_spec) -> DEK_archive
            Archiver->>S3: PUT encrypted chunk to s3://archive/{ws_id}/{ay_id}/chunk_{N}.jsonl.gz
            Archiver->>S3: Read back S3 ETag to verify upload integrity
        end
        Archiver->>DB: COMMIT;
        Archiver->>Archiver: Calculate aggregate payload SHA-256 across all chunks
        Archiver->>Manifest: INSERT INTO workspace_archival_manifests (workspace_id, academic_year_id, s3_prefix, record_count, payload_sha256, status = 'EXPORTED')
    end

    Note over CollegeAdmin,SecAdmin: Phase 2: Dual Verification & Bound Authorization Record Creation
    SecAdmin->>Archiver: Trigger Verification Run (manifest_id)
    Archiver->>S3: Read back all chunks; assert row counts & SHA-256 hashes match chunk_manifest_json exactly
    Archiver->>Manifest: UPDATE workspace_archival_manifests SET status = 'VERIFIED', verified_at = NOW()
    
    CollegeAdmin->>DB: Sign Deletion Request (scope, counts, manifest_id, payload_sha256)
    SecAdmin->>DB: Counter-Sign Deletion Approval
    DB->>AuthTable: INSERT INTO workspace_archive_deletion_authorizations (workspace_id, academic_year_id, manifest_id, payload_sha256, eligible_record_scope_json, planned_deletion_counts_json, college_admin_id, platform_security_admin_id, expires_at = NOW() + 24h, status = 'AUTHORIZED')

    Note over Archiver,DB: Phase 3: Transaction-Safe Pre-Batch Revalidation Deletion
    loop In Bounded Batches of 500 Rows
        rect rgb(255, 240, 240)
            Archiver->>DB: BEGIN;
            Archiver->>AuthTable: SELECT * FROM workspace_archive_deletion_authorizations WHERE id = $auth_id AND status IN ('AUTHORIZED', 'IN_PROGRESS') AND expires_at > NOW() FOR UPDATE;
            Note over Archiver,DB: Abort if authorization missing, expired, or consumed
            Archiver->>DB: SELECT count(*) FROM workspace_compliance_holds WHERE workspace_id = $ws_id AND (academic_year_id = $ay_id OR academic_year_id IS NULL) AND is_active = TRUE FOR UPDATE;
            alt Active Compliance Hold Detected
                Archiver->>AuthTable: UPDATE workspace_archive_deletion_authorizations SET status = 'REVOKED' WHERE id = $auth_id;
                Archiver->>Audit: Log Audit Event (DELETION_HALTED_BY_COMPLIANCE_HOLD)
                Archiver->>DB: COMMIT; (Abort cleanup; preserve source records)
            else No Compliance Hold
                Archiver->>Manifest: Assert status == 'VERIFIED' AND payload_sha256 == auth.payload_sha256
                Archiver->>DB: Hard Check: Assert 0 admission_records and 0 audit_events in batch candidate IDs
                Archiver->>DB: DELETE FROM follow_up_tasks WHERE lead_id IN (batch);
                Archiver->>DB: DELETE FROM telecall_interactions WHERE lead_id IN (batch);
                Archiver->>DB: DELETE FROM field_visits WHERE lead_id IN (batch);
                Archiver->>DB: DELETE FROM migration_triage_records WHERE lead_id IN (batch);
                Archiver->>DB: DELETE FROM student_leads WHERE id IN (batch) AND status != 'ADMITTED';
                Archiver->>DB: INSERT INTO archive_deletion_batch_runs (auth_id, batch_num, deleted_count, checkpoint_id);
                Archiver->>DB: COMMIT;
            end
        end
    end
    Archiver->>AuthTable: UPDATE workspace_archive_deletion_authorizations SET status = 'CONSUMED', consumed_at = NOW() WHERE id = $auth_id;
    Archiver->>DB: UPDATE academic_years SET status = 'ARCHIVED', archived_at = NOW() WHERE id = $ay_id;
    Archiver->>Audit: Log Audit Event (ACADEMIC_YEAR_ARCHIVED, { workspaceId, academicYearId, recordCount, payloadSha256, authId })
```

---

#### 8.3.1 Detailed Authorization Binding & Revalidation Invariants

1. **Cryptographic & Identity Binding:** The authorization record (`workspace_archive_deletion_authorizations`) strictly binds:
   - Specific `workspace_id` and `academic_year_id`.
   - Exact `manifest_id` and verified `payload_sha256` checksum.
   - Exact `eligible_record_scope_json` (snapshot filter boundaries and excluded student IDs).
   - Expected `planned_deletion_counts_json` per entity table.
   - Independent identity credentials: `college_admin_id` (institutional signoff) and `platform_security_admin_id` (infrastructure approval).
   - Strict 24-hour expiration (`expires_at = authorized_at + INTERVAL '24 hours'`).
   - One-time use state (`AUTHORIZED` $\to$ `IN_PROGRESS` $\to$ `CONSUMED`).
2. **Transaction-Safe Pre-Batch Revalidation under Row Locks:**
   - Deletion does **not** assume an authorization remains valid across a multi-minute cleanup run.
   - In **every individual batch transaction of 500 rows**, the archival worker executes:
     ```sql
     SELECT * FROM workspace_archive_deletion_authorizations 
     WHERE id = $auth_id AND status IN ('AUTHORIZED', 'IN_PROGRESS') AND expires_at > NOW() 
     FOR UPDATE;
     ```
   - It re-evaluates active compliance holds under lock:
     ```sql
     SELECT count(*) FROM workspace_compliance_holds 
     WHERE workspace_id = $ws_id AND (academic_year_id = $ay_id OR academic_year_id IS NULL) AND is_active = TRUE 
     FOR UPDATE;
     ```
   - **Hold Placement Handling:** If a legal or compliance hold is placed while a cleanup job is actively executing, the very next batch transaction detects the hold via `FOR UPDATE`, marks the authorization `status = 'REVOKED'`, writes an audit event, and terminates the job. The remaining source records are permanently preserved in the primary database.
3. **Protection Against Stale or Altered Approvals:**
   - Authorizations older than 24 hours automatically evaluate to expired and are rejected by the worker.
   - If a cohort's data or manifest changes between export and deletion, the manifest `payload_sha256` will no longer match the authorized hash, aborting execution.
4. **Durable Batch Checkpoints & Idempotent Resumption:**
   - Every committed batch records its progress durably in `archive_deletion_batch_runs (auth_id, batch_number, deleted_count, last_processed_id)`.
   - If the worker pod crashes, restarts, or loses connectivity, re-running the job detects the existing authorization, reads the latest committed checkpoint ID, and resumes from that exact cursor. Records are never skipped or deleted outside the authorized scope.
5. **Foreign-Key Dependency Inventory & Completeness Caveat:**
   - The conceptual deletion sequence enforces child-to-parent deletion:
     1. `follow_up_tasks` (FK `lead_id`)
     2. `telecall_interactions` (FK `lead_id`)
     3. `field_visits` (FK `lead_id`)
     4. `migration_triage_records` (FK `lead_id`)
     5. `lead_attachments` (Object files deleted from S3 hot bucket via bulk API, then metadata rows deleted)
     6. `student_leads` (Cohort root leads deleted where `status != 'ADMITTED'`)
   - **Completeness Caveat:** This proposed foreign-key deletion order is an architectural baseline design and **must NOT be assumed complete** until all actual production schema foreign keys, object-storage attachments, cascade configurations, and retained relationships are exhaustively inventoried against physical DDL before implementation.
6. **Absolute Exemption from Deletion:**
   - **`admission_records` (Spot admissions, assigned application numbers, enrolled fee receipts) are NEVER deleted.**
   - **`audit_events` (Immutable operational logs) are NEVER deleted.**
   Attempts to include these tables in cleanup batches trigger immediate database transaction abort.

---

### 8.4 Asynchronous Historical Data Retrieval Workflow

Cold storage services (AWS S3 Glacier, GCS Archive) are inherently asynchronous. Restoring an archived cohort requires minutes to hours depending on retrieval tier (Expedited vs. Standard). Historical data retrieval is specified as an **asynchronous, audited, access-controlled restore workflow**, not a synchronous request-response query:

```mermaid
sequenceDiagram
    autonumber
    actor Admin as College Admin / Compliance Auditor
    participant API as Ingress API Gateway
    participant Restorer as Historical Restore Background Worker
    participant S3 as Cold Object Storage (Glacier / Archive)
    participant KMS as Cloud KMS
    participant Stage as Temporary Staging S3 Bucket
    participant Audit as Immutable Audit Log

    Admin->>API: POST /api/v1/archive/restore-request { academic_year_id, justification, ticket_id }
    API->>API: Verify College Admin role + Entitlement (ALLOW_HISTORICAL_RESTORE)
    API->>API: Check active rate limit (Max 3 restore requests / workspace / month)
    API->>Restorer: Enqueue Restore Job (restore_id = UUIDv7)
    API-->>Admin: 202 Accepted { restore_id, estimated_completion: "2-4 hours", status: "PENDING" }

    rect rgb(240, 248, 255)
        Note over Restorer,S3: Asynchronous Object Retrieval
        Restorer->>S3: Initiate Glacier Restore Object (Tier: Standard / Expedited)
        Note over Restorer,S3: Wait for S3 EventBridge / SQS Notification: RestoreObject:Completed
    end

    rect rgb(255, 255, 240)
        Note over Restorer,Stage: Decryption, Validation & Field Masking
        Restorer->>S3: Fetch restored encrypted JSONL.gz chunks
        Restorer->>Restorer: Verify chunk SHA-256 hashes match workspace_archival_manifests
        Restorer->>KMS: Decrypt chunks using cohort archive DEK
        Restorer->>Restorer: Parse records and apply PII field masking (phone: "+91-XXXX-XX" || last4)
        Restorer->>Stage: Upload sanitized package to ephemeral staging bucket (24h TTL)
        Restorer->>Restorer: Generate short-lived pre-signed download URL (TTL = 15 Minutes)
        Restorer->>Audit: Log Audit Event (HISTORICAL_DATA_RESTORED, { workspaceId, academicYearId, requestedBy, ticketId })
    end

    Admin->>API: GET /api/v1/archive/restore-status?restore_id=uuid
    API-->>Admin: 200 OK { status: "COMPLETED", download_url: "https://...", expires_in: "15 minutes" }
```

- **Default PII Masking:** All historical lead records exported via the retrieval API have student and guardian phone numbers masked (`+91-XXXX-XX5678`) by default. Unmasked access requires a dedicated platform superadmin override entitlement (`HISTORICAL_PII_UNMASK_PRIVILEGE`) and mandatory legal justification.
- **Strict Rate Limiting & Audit Mandate:** Historical restorations are strictly capped (default: max 3 requests per tenant per month) to prevent bulk unauthorized database scraping. Every restore operation is permanently logged in `audit_events`.

---

### 8.5 Storage Cost Optimization Model

| Tier | Storage Technology | Latency Profile | Target Data Cohort | Policy / Retention Horizon |
| :--- | :--- | :--- | :--- | :--- |
| **Hot** | PostgreSQL 16 (Primary + Replica) | Sub-10ms (SSD IOPS) | Active academic-year operational leads, visits, telecalls, admitted students, and system logs. | Current academic intake cycle. |
| **Warm** | PostgreSQL Read Replica / Partitioned Schema | 10–50ms | Admitted student records, year-end admissions summaries, and essential analytical cohorts. | `[UNRESOLVED OWNER DECISION]` (1 to 2 prior academic years). |
| **Cold** | AWS S3 Glacier Flexible / GCS Archive | Minutes to Hours | Full detailed interaction records of closed intake cycles (compressed JSONL.gz with KMS DEK). | `[UNRESOLVED OWNER DECISION]` (5, 7, or 10 years per jurisdictional requirements). |
| **Purge** | Cryptographic Erasure + S3 Expiration | N/A | Cohorts exceeding legal retention horizon. | Permanent destruction of KMS DEK and physical file deletion. |

---

### 8.6 Legal & Regulatory Compliance Holds

To prevent accidental destruction or automated archival of records subject to litigation, audit, or government investigation:
1. **Administrative Hold API:** Authorized platform operators can place a compliance hold via `POST /api/v1/admin/compliance-holds`.
2. **Archival & Deletion Freeze:** Any active record in `workspace_compliance_holds` for a tenant workspace or specific academic year **strictly freezes all archival exports and live-database cleanup workers**.
3. **Audit Immutability:** Placements and releases of compliance holds are written to `audit_events` and cannot be modified or deleted.

---

### 8.7 Cryptographic Erasure at Retention Expiry

When the configured statutory retention period elapses for a cold archive cohort:
1. **KMS Key Zeroization:** The dedicated KMS Data Encryption Key (`archive_DEK_{workspace_id}_{ay_id}`) is scheduled for deletion and revoked. Once revoked, the ciphertext objects in object storage become permanently mathematically unrecoverable.
2. **Physical Object Lifecycle:** S3 bucket lifecycle rules trigger physical object deletion 30 days following key zeroization.
3. **Audit Proof:** An immutable audit event `COLD_ARCHIVE_DEK_DESTROYED` is recorded with the KMS key ARN and manifest digest as legal proof of data destruction.

---

## 9. Security Findings Register (SEC-01 to SEC-08)

| Finding ID | Vulnerability Description | Severity | Target Architecture Mitigation | Automated Verification Test |
| :--- | :--- | :---: | :--- | :--- |
| **SEC-01** | Client-Side JWT Minting in Flutter (`api_service.dart`) | **CRITICAL** | Complete removal of client token signing. Server issues opaque 256-bit bearer tokens verified against HMAC-SHA256 database hashes. | `TEST-VERIF-01`: Client submits forged token; server returns HTTP 401. All tokens minted by server exclusively. |
| **SEC-02** | Default Insecure Student Password Takeover (`123456`) | **CRITICAL** | Student login and self-registration entirely deferred from Phase 1. | `TEST-VERIF-02`: Public student registration endpoints eliminated from API routing table. |
| **SEC-03** | Public Feeder School PII Leakage (`GET /api/config`) | **HIGH** | `master_schools` read-only master; headmaster personal phones moved to encrypted `tenant_school_contacts` requiring authenticated tenant session. | `TEST-VERIF-03`: Unauthenticated `GET /api/v1/schools` returns HTTP 401. Authenticated staff see only tenant-authorized contacts. |
| **SEC-04** | Cross-Tenant Lead Leaks via Unassigned Telecallers | **HIGH** | Telecaller queries enforce mandatory tenant scoping and assignment checks. Empty assignment returns `[]` (fail-closed), never global leads. | `TEST-VERIF-04`: Telecaller with empty assignment queries `/api/v1/leads`; returns empty array, 0 rows leaked. |
| **SEC-05** | Tokens Passed in URL Query Strings (`?token=...`) | **MEDIUM** | Ingress API gateway strictly rejects tokens in query strings. Tokens accepted exclusively via `__Host-` cookies or `Authorization: Bearer` headers. | `TEST-VERIF-05`: Request with `?token=...` returns HTTP 400 Bad Request. |
| **SEC-06** | Hardcoded Automated Backup Fallback Secret | **MEDIUM** | Secret hardcoding eliminated. Process fails startup if `CRON_SECRET` is unset via Zod environment validation. | `TEST-VERIF-06`: Missing `CRON_SECRET` in environment causes application startup crash with explicit error. |
| **SEC-07** | Stolen Offline Field Phone Data Extraction | **HIGH** | 48-hour monotonic lease; online revalidation on continuity break; SQLCipher 256-bit AES encryption; cryptographic erasure zeroizing TPM keys on tamper/expiry. | `TEST-VERIF-07`: Simulate monotonic advance $>48$h or reboot; verify $K_{\text{db}}$ evicted and local database unreadable. |
| **SEC-08** | Unauthorized Bulk PDF Data Exfiltration | **MEDIUM** | Role-based export authorization; server-side entitlement checks; forensic visual watermarking; 15-minute expiring S3 pre-signed URLs. | `TEST-VERIF-08`: PRO in Full College Suite calls export endpoint; returns HTTP 403. Admin export generates watermarked artifact. |

---

## 10. Proof-of-Concept (PoC) Plans with Observable Evidence Artifacts

> [!CAUTION]
> **PoC Status Clarification:** Zero PoCs have been executed. No test has passed. The architecture is ready for PoC execution only after test prerequisites and physical test hardware are available.

### 10.1 PoC 1: Drizzle ORM + PostgreSQL RLS under Transaction Pooling & Index Performance

- **Objective:** Prove parameter-safe `set_config('app.current_tenant_id', $1, true)` under PgBouncer transaction pooling using unprivileged role `app_runtime_user`, and validate keyset pagination index plans.
- **Prerequisites:** PostgreSQL 16 container, PgBouncer (`pool_mode = transaction`), Drizzle ORM wrapper.
- **Restricted Database Role:** `app_runtime_user` (`NOINHERIT`, `NOSUPERUSER`, `NOCREATEDB`, `NOCREATEROLE`, `NOBYPASSRLS`).
- **Test Cases, Observable Results & Evidence Artifacts:**

| Test ID | Operation & Condition | Expected Observable Result | Required Evidence Artifact |
| :--- | :--- | :--- | :--- |
| **P1-T1** | SELECT with missing context | Returns 0 rows | SQL query log showing empty result set |
| **P1-T2** | INSERT with missing context | Throws SQL error `42501` | PostgreSQL server error log capturing error `42501` |
| **P1-T3** | INSERT with mismatched `workspace_id` | Throws SQL error `42501` | Assertion log capturing `42501` rejection |
| **P1-T4** | UPDATE other tenant row | Updates 0 rows | Query result showing `rowCount: 0` |
| **P1-T5** | UPDATE mutating `workspace_id` to Tenant B | Throws SQL error `42501` | Server error log capturing `WITH CHECK` violation |
| **P1-T6** | DELETE other tenant row | Deletes 0 rows | Query result showing `rowCount: 0` |
| **P1-T7** | Transaction abort context cleanup | Aborted Tx leaves next Tx clean | PgBouncer query sequence log |
| **P1-T8** | 10,000 rapid interleaved transactions | Exactly 0 cross-tenant leaks | Vitest test report with 10,000 assertions passing |
| **P1-T9** | Performance latency overhead | Overhead $\Delta T \le 2.0\text{ms}$ on p95 | Benchmark comparison report (Baseline vs. RLS) |
| **P1-T10** | Keyset pagination index scan execution | `Index Scan` on `idx_leads_ws_status_staff_created`; zero `Seq Scan`; latency $\le 10\text{ms}$ | `EXPLAIN (ANALYZE, BUFFERS)` execution plan logs on 50,000-lead seeded dataset |

- **Overhead Calculation Methodology:**
  $$\Delta T = \overline{T}_{\text{p95}}(\text{RLS + set\_config}) - \overline{T}_{\text{p95}}(\text{Baseline})$$
- **Measurable Pass Criteria:** 0 cross-tenant leaks; 100% of illegal writes rejected; $\Delta T \le 2.0\text{ms}$ on p95; keyset pagination executes with sub-10ms index scans.
- **Failure Fallback:** Halt implementation $\implies$ Perform RCA $\implies$ Demonstrate Schema-per-Tenant or Dedicated Tenant Pools before proceeding.

---

### 10.2 PoC 2: Flutter Offline Lease, Hardware Keystore & Ed25519 Verification

- **Objective:** Validate SQLCipher encryption, monotonic uptime tracking, Ed25519 token verification, reboot continuity break detection, and cryptographic erasure on physical test hardware.
- **Prerequisites:** Flutter test app embedding `sqflite_sqlcipher`, `flutter_secure_storage`, and native hardware Keystore/Secure Enclave bindings.
- **Physical Test Devices:** (1) Budget Android phone (Android 10+, 2GB RAM); (2) iPhone (iOS 15+).
- **Test Cases, Observable Results & Evidence Artifacts:**

| Test ID | Procedure & Condition | Expected Observable Result | Required Evidence Artifact |
| :--- | :--- | :--- | :--- |
| **P2-T1** | Queue 100 visits offline | Encrypted SQLite records created | Hex dump of local `.db` showing ciphertext |
| **P2-T2** | System wall-clock rollback by 7 days | Tamper detected; UI locked | Device `logcat` capturing clock-tamper lock |
| **P2-T3** | Device reboot while offline | Continuity reset detected; local DB locked; online reval required | App logs capturing `elapsedRealtime` / `mach_continuous_time` reset lock |
| **P2-T4** | Ed25519 Time-Token Verification | Pinned public key validates authentic token; forged token rejected with error | Client crypto test log asserting signature verification result |
| **P2-T5** | Continuous uptime $>48$ hours | Lease expires; keys evicted from RAM | App logs capturing monotonic lease expiry |
| **P2-T6** | Replay of previously seen `token_id` | Client rejects token; marks session locked | App security logs asserting `seen_token_ids` rejection |
| **P2-T7** | Secure storage read failure simulation | Storage exception triggers fail-closed zeroization and lock | Memory dump assertion and crash/lock event log |
| **P2-T8** | Cryptographic erasure execution | $KEK_{\text{device}}$ deleted from Keystore | Pre- and post-test keystore logs; `KeyStoreException` / `errSecItemNotFound` |
| **P2-T9** | Reconnection atomic batch sync | 100 items synced; 0 duplicates | Server transaction log showing 100 commits, 0 dups |

- **Measurable Pass Criteria:** Keystore unwrap throws `KeyStoreException` after deletion; offline counter reset locks database; Ed25519 forged tokens rejected; batch sync produces zero duplicates.
- **Failure Fallback:** Ephemeral in-memory session keys only (requires user to remain online to re-authenticate if app restarts).

---

## 11. Feature-to-Acceptance-Test Traceability Matrix

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
| **Query Engine** | Deterministic Keyset Cursor Pagination | `TEST-TC-11` | Query 50 leads with cursor `(created_at, id)`. Add concurrent insert. Fetch next 50. | Exact next page returned without missing or duplicated rows; execution plan utilizes B-Tree index scan. |
| **Archival Safety** | Snapshot-Isolated Archival Export | `TEST-TC-12` | Initiate archival export on closed cohort while running concurrent update queries. | Exported JSONL.gz matches `REPEATABLE READ` snapshot; read-back SHA-256 equals manifest hash. |
| **Archival Safety** | Bound Deletion Authorization & Hold Halt | `TEST-TC-13` | Attempt cleanup with expired authorization; place compliance hold during active batch cleanup run. | Expired authorization rejected with HTTP 400; compliance hold immediately aborts transaction and revokes authorization, preserving remaining records. |
| **Mobile Security** | Ed25519 Token Verification & Replay Reject | `TEST-TC-14` | Client validates genuine Ed25519 token, records `token_id`, and receives duplicate `token_id`. | First token accepted and anchors set; replayed token rejected and session locked. |

---

## 12. Implementation-Readiness Verdict and Next Actions

### 12.1 Implementation-Readiness Verdict

> [!IMPORTANT]
> **VERDICT: ARCHITECTURALLY SPECIFIED AND HARDENED — READY FOR PHASE 0 PROOF-OF-CONCEPT EXECUTION.**  
> 
> With the completion of Revision 3.1.4, all identified ordering hazards in blind-index rotation, authorization binding weaknesses in archival deletion, and over-claims regarding offline storage rollback have been resolved.
> 
> **Honest Assessment of Remaining Operational Limitations and Engineering Risks:**
> 1. *Consumer Hardware State Rollback:* No software architecture running on consumer mobile hardware can prevent an offline attacker with physical device control from restoring an unencrypted flash backup or app-data container. The architecture mitigates this by requiring online revalidation whenever timing continuity is broken, but cannot prevent state rollback if an unexpired token is restored before its 48-hour continuous uptime elapsed window closes.
> 2. *Transaction Pooling Context Latency:* Parameterized RLS via `set_config` provides mathematical multi-tenant database isolation, but introduces transaction context overhead under PgBouncer. If `PoC 1` demonstrates that latency overhead exceeds the $2.0\text{ms}$ p95 ceiling, the project must pivot to Schema-per-Tenant separation before Milestone 1 code is written.
> 3. *Regulatory Retention & Commercial Sizing:* Statutory retention periods and warm-tier database retention durations remain unresolved owner decisions (Section 1.2, Items 5–7). These do not block technical PoC execution, but must be resolved before the production archival worker is scheduled.
> 
> The architecture is declared **architecturally frozen for pre-implementation validation**. No further architectural revisions should be produced. The team must proceed directly to the planned Phase 0 PoCs to gather empirical evidence.

### 12.2 Next Actions

1. **Action 1 (Owner Governance):** Secure formal product-owner and legal sign-off on the 7 unresolved policy questions listed in Section 1.2 (PRO migration wizard vs. isolation, AGM add-on seats, provisional school review expiry, post-reboot emergency grace, statutory retention period, warm tier duration, and archival trigger policy).
2. **Action 2 (PoC Testbed Provisioning):** Provision the isolated Phase 0 PoC environments:
   - Linux container hosting PostgreSQL 16 and PgBouncer in transaction-pooling mode.
   - Physical test devices (budget Android 10+ device with 2GB RAM; iPhone running iOS 15+).
3. **Action 3 (PoC Execution & Evidence Capture):** Execute PoC 1 (`P1-T1` through `P1-T10`) and PoC 2 (`P2-T1` through `P2-T9`). Capture all concrete evidence artifacts (`logcat` traces, PostgreSQL server error logs, `EXPLAIN (ANALYZE, BUFFERS)` outputs, and hardware keystore unwrap logs).
4. **Action 4 (Empirical Evaluation):** Review PoC evidence against measurable pass criteria. If RLS overhead exceeds 2.0ms or context leaks occur under PgBouncer, trigger the mandatory RCA protocol and evaluate Schema-per-Tenant separation.
5. **Action 5 (Milestone 1 Buildout):** Upon documented PoC passage, proceed to implement the Phase 1 Walking Skeleton.
6. **Action 6 (Production DDL Dependency Inventory):** Prior to deploying the Section 8 archival worker, perform a complete inventory of all physical PostgreSQL foreign keys, cascade triggers, and S3 attachment buckets to ensure the deletion order is fully verified.

---

## 13. Change Log: Revision 3.1.3 $\to$ Revision 3.1.4 & Confirmation

### 13.1 Change Log

| Dimension | Revision 3.1.3 | Revision 3.1.4 (Current) | Rationale |
| :--- | :--- | :--- | :--- |
| **Blind-Index Rotation Deployment Ordering** | Deployed `App v_dual` in Phase 2 before column `phone_blind_index_v2` was created in Phase 3, risking runtime SQL crashes. | Redesigned into a safe **10-phase expand-and-contract sequence**: column is added via DDL first (Phase 1), verified (Phase 2), and only then is `App v_dual` deployed (Phase 3). Added full phase matrix documenting schema state, safe app versions, preconditions, rollback, and point of no return. | Guarantees no running application instance ever queries or inserts against a non-existent column during rolling deployment. |
| **Archival Deletion Authorization Binding** | Generic authorization endpoint; lacked durable cryptographic binding to exact manifest, scope, and independent signatures. | Created `WORKSPACE_ARCHIVE_DELETION_AUTHORIZATION` entity binding workspace, academic year, manifest ID, payload SHA-256 hash, eligible scope JSON, planned deletion counts, College Admin and Platform Security Admin IDs, 24-hour expiry, and single-use state. | Prevents stale, replayed, or mismatched authorizations from executing deletion against modified cohorts or different manifests. |
| **Pre-Batch Revalidation & Hold Race Handling** | Relied on upfront checks; concurrent compliance holds could race with long-running batch deletes. | Mandated **pre-batch revalidation inside every 500-row transaction** using `FOR UPDATE` locks on both the authorization and compliance hold tables. Immediate revocation and job abort if a hold is placed. | Prevents race conditions where a legal hold placed mid-cleanup is bypassed by in-flight deletion batches. |
| **Foreign-Key Deletion Completeness Caveat** | Presented foreign-key deletion sequence as finalized. | Formally qualified that the proposed foreign-key deletion sequence is a baseline design that must be verified against full production DDL and object-storage attachments before execution. | Acknowledges real-world schema evolution risks and prevents unexpected foreign-key constraint violations. |
| **Offline Token Replay & Flash Rollback Limitations** | Claimed local `seen_token_ids` in encrypted storage prevented token replay without caveat. | Added Section 5.2.4 detailing exact client guarantees vs. hardware TEE requirements vs. accepted consumer limitations (flash/NAND image restoration). Reinforced strict fail-closed policy. | Eliminates unrealistic cryptographic claims on consumer smartphones and aligns architecture with physical hardware boundaries. |
| **Readiness Verdict & Honest Risk Assessment** | Stated all security hazards were resolved. | Added explicit assessment of remaining operational hurdles: physical-device flash rollback, transaction pooler RLS overhead ceiling, and legal retention period decisions. | Upholds professional architectural honesty; avoids false claims of absolute pre-PoC perfection. |

---

### 13.2 Strict Non-Modification Confirmation

In accordance with strict project constraints:
- **Zero application source code files were created, edited, or deleted.**
- **No package dependencies were installed or modified (`package.json`, `package-lock.json` remain untouched).**
- **No database schemas, tables, or migrations were executed.**
- **No configuration files, environment variables, or running dev servers were modified.**
- **All previous revisions (Revision 2.0, Revision 3.0, Revision 3.1, Revision 3.1.1, Revision 3.1.2, and Revision 3.1.3) remain preserved in their entirety.**
