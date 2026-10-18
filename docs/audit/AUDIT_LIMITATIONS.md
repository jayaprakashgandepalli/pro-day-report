# Audit Limitations and Unverified Boundaries

**Target System:** Intermediate College Admissions & Field Operations SaaS  
**Standard:** Complete transparency regarding constraints, unexecuted checks, unverified claims, and operational boundaries respected during this investigation.

---

## 1. Absolute Audit Boundaries Respected

In strict accordance with the Master Audit Directive, the following operational restrictions were observed:
1. **Zero Source Code Alteration:** No application files, dependencies, configurations, or package manifests were modified, formatted, or renamed.
2. **Initial Git State Maintained:** The initial Git state (`master`, with existing unstaged working edits from a prior session on `prisma/schema.prisma`, `src/app/api/students/route.ts`, and `src/app/api/students/[id]/visits/route.ts`) was left intact without resetting or stashing.
3. **No Schema Migrations or Database Mutations:** No destructive queries, migrations, or schema updates were executed against the live Supabase database.
4. **No Real PII or External Communication:** No real student phone numbers were called, no real WhatsApp messages or SMS notifications were transmitted, and no live credentials were exposed.
5. **No Destructive Load or Penetration Testing:** Security assessments were conducted defensively via static code inspection and architectural tracing, avoiding live exploit generation or denial-of-service load tests.

---

## 2. Checks Not Executed and Tooling Constraints

| Check / Investigation | Status | Reason Not Executed | What Remains Unknown |
| :--- | :---: | :--- | :--- |
| **`npm run build` (Full Next.js Production Build)** | **DEFERRED** | Statically verified that `npx tsc --noEmit` fails on `src/app/api/students/route.ts:174`. Executing `npm run build` would write to `.next/` and fail at the compile step. | Whether additional page-level server/client boundary errors exist beyond the API syntax error. |
| **Live Database Transaction Deadlock Tests** | **NOT EXECUTED** | Prohibited by rule against running heavy concurrent mutations on live data. | Exact deadlock threshold under high-concurrency concurrent visits to the same student record. |
| **Capacitor Android Device APK Build** | **NOT EXECUTED** | Android SDK (`adb`, `gradlew`) was not invoked to build an Android APK. | Native Android hardware compatibility (e.g., camera permissions, geolocation) on low-end hardware. |
| **Flutter Native Device Compilation** | **NOT EXECUTED** | Flutter runtime tooling (`flutter build apk`) was not invoked during read-only audit. | Runtime behavior of the SQLite offline mutation queue in `mobile_app/lib/services/offline_service.dart`. |
| **Automated Test Run** | **NOT APPLICABLE** | No automated test runner (Jest/Vitest) is installed in the repository's `package.json`. | Regression status of edge-case date-range calculations in report generation. |

---

## 3. Unverified Claims and Evidence Gaps

1. **Google Drive Backup Restore Verification:** While `scripts/db-restore.ts` exists, executing a real restore was prohibited to avoid overwriting database state. Restoration capability is classified as `PARTIALLY VERIFIED` based on code structure.
2. **Offline Web PWA Behavior:** `next-pwa` is configured in `next.config.ts`, but real-world service worker asset precaching under unstable 2G/3G mobile cellular networks could not be dynamically verified without a live physical device.
3. **Database Volume and Table Sizes:** Because direct query execution against production data was restricted, exact production row counts and disk table sizes remain unknown to the audit team.
