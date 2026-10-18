# Defensive Security and Vulnerability Audit

**Target System:** Intermediate College Admissions & Field Operations SaaS  
**Audit Standard:** Static code vulnerability analysis, configuration review, and defensive verification. No destructive testing or live data extraction performed.

---

## 1. Executive Security Evaluation & Scores (0–100)

| Security Category | Score (0–100) | Confidence | Primary Risk Factor |
| :--- | :---: | :---: | :--- |
| **Authentication** | **30** | High | Hardcoded JWT fallback secret; client-side token signing; default student passwords. |
| **Authorization & RBAC** | **42** | High | Direct Object Reference (IDOR) on student records; telecaller bypass of student ownership. |
| **Multi-Tenant Isolation** | **35** | High | Telecallers with empty assignments leak cross-tenant leads; cross-college student admission. |
| **API & Input Security** | **52** | High | Missing input schemas; JWT passed in URL query strings; no API rate limiting. |
| **Data Privacy (PII)** | **28** | High | `GET /api/config` publicly exposes school headmaster names, phone numbers, and staff notes without auth. |
| **Secrets & Configuration** | **25** | High | Hardcoded fallback secrets in server and client source code (`mobile_app/lib/services/api_service.dart:27`). |
| **Dependency Security** | **68** | Medium-High | Modern packages (`next@16.3.5`, `prisma@5.22.0`, `bcryptjs@3.0.3`), but unpinned and untracked lockfiles. |
| **Auditability & Logging** | **20** | High | Zero audit logs for record access, student exports, or data deletions; basic `console.log` only. |

**Composite Security Score:** **37.5 / 100 (CRITICAL RISK POSTURE)**

---

## 2. Critical & High-Severity Security Findings

### FINDING SEC-01 [CRITICAL]: Client-Side Token Forging in Companion Flutter Application
- **Severity:** CRITICAL (CVSS 9.8)
- **Evidence:** `mobile_app/lib/services/api_service.dart:27, 274-295`:
  ```dart
  static const String _jwtSecret = 'super-secret-fallback-key-for-local-dev';
  ...
  static String generateFallbackToken({required String employeeId, required String name, required String role}) {
    ...
    final hmac = Hmac(sha256, utf8.encode(_jwtSecret));
    final digest = hmac.convert(utf8.encode('$header.$payload'));
    return '$header.$payload.$signature';
  }
  ```
- **Server Match:** `src/lib/auth.ts:4`:
  ```ts
  const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-fallback-key-for-local-dev';
  ```
- **Mechanics:** The Flutter application source code contains the secret key used by the backend when `JWT_SECRET` is not overridden in production or when local defaults are used. Furthermore, the Flutter client contains a local signing method that mints valid HMAC-SHA256 JWTs with 10-year expiration dates. Anyone with access to the client code or decompiled binary can forge an arbitrary JWT with `role: "ADMIN"` or `role: "COLLEGE"`.
- **Impact:** Total bypass of authentication and full administrative takeover.
- **Remediation:** Remove client-side token signing entirely. Enforce that JWTs are only minted on the server in `/api/auth/login`. Ensure `process.env.JWT_SECRET` is strictly required and crashes the server on startup if missing.

---

### FINDING SEC-02 [CRITICAL]: Insecure Pre-Registered Student Authentication & Account Takeover
- **Severity:** CRITICAL (CVSS 9.1)
- **Evidence:**
  1. `src/app/api/student/auth/login/route.ts:48-50`:
     ```ts
     if (student.password) {
       isMatch = await bcrypt.compare(password, student.password);
     } else {
       // If no password is set (pre-registered by employee), allow '123456' or their phone number
       isMatch = (password === '123456' || password === student.phone); 
     }
     ```
  2. `src/app/api/student/auth/register/route.ts:32-52`:
     ```ts
     if (existingStudent) {
       if (!existingStudent.password) {
         // Update password for students pre-added by employees
         const hashedPassword = await bcrypt.hash(password, 10);
         await prisma.student.update({
           where: { id: existingStudent.id },
           data: { password: hashedPassword, registrationStatus: 'APPROVED' }
         });
         return NextResponse.json({ message: 'Your account was pre-registered... Your new password has been set successfully!' }, { status: 201 });
       }
     ```
- **Mechanics:**
  1. When a field PRO enters a prospective 10th-grade student, `password` is left null.
  2. Anyone who knows or guesses a student's phone number can immediately log into `/student/dashboard` using password `123456` or the student's phone number.
  3. Furthermore, anyone can call `POST /api/student/auth/register` with that student's phone number and a password of their choice. The endpoint updates the student's record, hashes the attacker's password, sets `registrationStatus: 'APPROVED'`, and hands over control with zero OTP, SMS, or identity verification.
- **Impact:** Complete unauthorized takeover of student profiles, psychometric reports, and personal contact details.
- **Remediation:** Do not allow passwordless or default logins. Require SMS OTP verification before setting a password on pre-registered records.

---

### FINDING SEC-03 [CRITICAL]: Public Unauthenticated Exposure of Feeder School PII and Headmaster Contacts
- **Severity:** HIGH (CVSS 8.2)
- **Evidence:** `src/app/api/config/route.ts:10-27`:
  ```ts
  export async function GET() {
    try {
      const configs = await getAllConfigsCached();
      return NextResponse.json({ configs }, { status: 200, ... });
    }
  ```
- **Mechanics:** `src/proxy.ts:14` explicitly excludes all `/api/*` routes from proxy protection. `GET /api/config` does not check cookies, headers, or tokens. It calls `getAllConfigsCached()`, which queries `prisma.configValue.findMany()`.
- **Exposed Data:**
  - All feeder school names and class strengths (`strength`).
  - Headmaster Names (`headmasterName`) and Headmaster Personal Mobile Numbers (`headmasterPhone`).
  - School Key Persons (`keyPersonName`) and Personal Mobile Numbers (`keyPersonPhone`).
  - Telecaller Follow-Up Notes & Remarks (`remarks`, `telecallerUpdateDetails`).
  - All Districts, Mandals, and Villages across all colleges.
- **Impact:** Confidential institutional contact directories and intelligence are publicly accessible to competitors and unauthorized scrapers.
- **Remediation:** Enforce `verifyToken()` on `GET /api/config`. Filter records strictly by `collegeId` and redact sensitive personal contact fields unless accessed by authorized staff.

---

### FINDING SEC-04 [HIGH]: Cross-Tenant Data Leaks and Direct Object Reference (IDOR)
- **Severity:** HIGH (CVSS 7.7)
- **Evidence:**
  1. **Telecaller Global Fallback:** `src/app/api/students/route.ts:114-122`:
     ```ts
     } else if (userRole === 'TELECALLER') {
       const user = await prisma.user.findUnique({
         where: { employeeId: payload.employeeId },
         select: { assignedEmployees: true }
       });
       if (user && user.assignedEmployees && user.assignedEmployees.length > 0) {
         whereClause.AND.push({ employeeId: { in: user.assignedEmployees } });
       }
       // If no specific assigned employees, telecaller sees all students
     ```
     If `assignedEmployees` is empty or unassigned, the telecaller receives ALL students across the entire database, bypassing college boundaries.
  2. **Telecaller Global Student Deletion:** `src/app/api/students/[id]/route.ts:165-170`:
     ```ts
     const userRole = (payload.role || '').toUpperCase();
     if (userRole !== 'ADMIN' && userRole !== 'TELECALLER') {
       if (currentStudent.employeeId !== payload.employeeId) {
         return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
       }
     }
     await prisma.student.delete({ where: { id } });
     ```
     Telecallers are exempt from ownership checks on student deletion, allowing any telecaller to delete any student in the database.
  3. **IDOR on Student Detail:** `src/app/api/students/[id]/route.ts:124-143`:
     `GET /api/students/[id]` only validates that an auth token exists, but does not check if the student belongs to the requester's college or employee account.
- **Impact:** Cross-tenant snooping, accidental or malicious student deletion, and violation of student privacy.
- **Remediation:** Always scope queries by `collegeId`. Restrict telecallers with empty assignments to zero records (`whereClause.AND.push({ id: 'none' })`). Require tenant verification before returning or deleting a student record.

---

### FINDING SEC-05 [MEDIUM]: Authentication Tokens Passed in URL Query Strings
- **Severity:** MEDIUM (CVSS 5.3)
- **Evidence:** `src/lib/auth.ts:27-31` and `mobile_app/lib/services/api_service.dart:319`:
  ```ts
  const queryToken = url.searchParams.get('token') || url.searchParams.get('auth_token');
  if (queryToken) return queryToken.trim();
  ```
- **Mechanics:** The authentication helper explicitly accepts JWTs passed in URL query parameters (`?token=...`). Mobile clients append this token when constructing URIs.
- **Impact:** URLs containing sensitive tokens are routinely written to server access logs, reverse proxy logs (Nginx/Cloudflare), browser histories, and `Referer` headers sent to external domains.
- **Remediation:** Remove query-string authentication. Require tokens strictly in `Authorization: Bearer <token>` headers or secure HTTP-only cookies.

---

### FINDING SEC-06 [MEDIUM]: Hardcoded Fallback Secrets for Automated Backups
- **Severity:** MEDIUM (CVSS 5.9)
- **Evidence:** `src/app/api/cron/backup/route.ts:11`:
  ```ts
  const CRON_SECRET = process.env.CRON_SECRET || 'MY_SUPER_SECRET_CRON_KEY_123';
  ```
- **Mechanics:** If `CRON_SECRET` is omitted from the deployment environment, the default string `'MY_SUPER_SECRET_CRON_KEY_123'` is used. A simple HTTP GET to `/api/cron/backup?secret=MY_SUPER_SECRET_CRON_KEY_123` triggers an automated full database dump to Google Drive.
- **Impact:** Uncontrolled database dumps and potential rate-limit exhaustion.
- **Remediation:** Remove fallback string; fail with HTTP 500 if `CRON_SECRET` is unset.

---

## 3. Defense-in-Depth Analysis

1. **SQL Injection:** LOW RISK. The application utilizes Prisma ORM with parameterized queries throughout. No `prisma.$queryRawUnsafe` calls were discovered.
2. **Cross-Site Scripting (XSS):** LOW RISK. React 19 JSX escapes string content by default. No instances of `dangerouslySetInnerHTML` were found in user-facing form rendering.
3. **Cross-Site Request Forgery (CSRF):** MEDIUM RISK. API routes do not implement CSRF tokens, relying instead on `SameSite: 'lax'` cookie attributes and Bearer authorization headers.
4. **Rate Limiting:** ABSENT. There is no rate limiting on `/api/auth/login`, `/api/student/auth/login`, or registration endpoints. Vulnerable to credential stuffing and brute-force attacks.
5. **Session Revocation:** ABSENT. Stateless JWTs cannot be revoked upon logout. Revocation requires either a Redis token blacklist or moving to server-managed session tokens.
