# Repository and Technology Inventory

**Target System:** Intermediate College Admissions & Field Operations SaaS  
**Repository Path:** `x:\Prasad projact works\PRO day report`  
**Audit Standard:** Derived strictly from repository evidence and file inspection.

---

## 1. System Inventory & Boundaries

The codebase comprises a single monorepo containing a full-stack Next.js web application, a native Capacitor Android container, and a Flutter cross-platform mobile application.

```
x:/Prasad projact works/PRO day report/
├── src/                          # Next.js 16.3.5 Full-Stack Web Application
│   ├── app/                      # Next.js App Router (67 Pages, 56 API Routes)
│   │   ├── admin/                # Platform / Super Admin Web Console
│   │   ├── agm/                  # Assistant General Manager Field Management Portal
│   │   ├── api/                  # 56 REST API Route Handlers
│   │   ├── college/              # College Admin / Management Portal
│   │   ├── employee/             # Field PRO (Public Relations Officer) Mobile-Web Portal
│   │   ├── student/              # Student Self-Service & Assessment Portal
│   │   └── telecaller/           # Telecaller Follow-Up CRM Workspace
│   ├── components/               # 15 React UI Components & Modals
│   ├── lib/                      # Shared Server & Client Utilities (auth, cache, prisma, phone)
│   └── proxy.ts                  # Next.js 16 Proxy / Request Interceptor (replaces middleware.ts)
├── mobile_app/                   # Companion Flutter Cross-Platform Mobile Application
│   ├── lib/                      # Dart Source (Screens, API Service, SQLite Offline Service)
│   │   ├── screens/              # Employee & Student Mobile Screens
│   │   └── services/             # HTTP API Client, Offline SQLite Queue, WhatsApp Templates
│   └── pubspec.yaml              # Flutter Dependencies (http, shared_preferences, crypto, sqflite)
├── android/                      # Capacitor Native Android Shell
│   ├── app/                      # Android Studio Project targeting 'com.prodayreport.app'
│   └── build.gradle              # Gradle Build Configuration
├── prisma/                       # Database Schema & Seeds
│   ├── schema.prisma             # PostgreSQL / Supabase Schema (13 Relational Models)
│   ├── dev.db                    # Legacy SQLite Artifact (24 KB, unused in active config)
│   ├── seed.ts                   # Question & Test Seeding Script
│   └── seedLocations.ts          # Andhra Pradesh Location Seeding Script
├── scripts/                      # Operational Automation Scripts
│   ├── db-backup.ts              # PostgreSQL Dump & Google Drive Cloud Backup
│   ├── db-restore.ts             # Google Drive Download & Database Restoration
│   └── get-token.js              # Google OAuth2 Refresh Token Generator
├── business-sales-kit/           # Business Models & Feature Verification Matrices
├── public/                       # Static Assets, HTML Viewers, Icons, Manifest
├── package.json                  # Root Dependencies & Build Scripts
└── tsconfig.json                 # TypeScript 5 Compiler Configuration
```

---

## 2. Technology Stack & Framework Inventory

| Layer | Technology | Version | Evidence / Source File |
| :--- | :--- | :--- | :--- |
| **Language (Web)** | TypeScript | `^5` | `package.json:51`, `tsconfig.json` |
| **Language (Mobile)** | Dart | SDK `^3.0.0` | `mobile_app/pubspec.yaml` |
| **Web Framework** | Next.js (App Router) | `16.3.5` | `package.json:33`, `node_modules/next` |
| **UI Library** | React / React DOM | `19.2.8` | `package.json:37-38` |
| **Database Engine** | PostgreSQL (Supabase) | 15+ compatible | `prisma/schema.prisma:5-9` |
| **Database ORM** | Prisma Client | `5.22.0` | `package.json:21, 36` |
| **Mobile Wrapper** | Capacitor | `8.5.2` | `package.json:16-19, 41`, `capacitor.config.ts` |
| **Mobile Native App** | Flutter | Flutter 3.x | `mobile_app/pubspec.yaml` |
| **Styling** | Vanilla CSS / CSS Modules | Native | `src/app/globals.css`, `src/app/page.module.css` |
| **Icons** | Lucide React | `^1.46.0` | `package.json:32` |
| **Client PDF Export** | jsPDF / jsPDF-AutoTable | `^4.2.1` / `^5.0.8` | `package.json:29-30`, `src/app/reports/generate/page.tsx` |
| **Authentication** | JWT (`jsonwebtoken` / `bcryptjs`)| `9.0.3` / `3.0.3` | `package.json:24, 28`, `src/lib/auth.ts` |
| **PWA Engine** | next-pwa | `^5.6.0` | `package.json:34`, `next.config.ts` |
| **Task Scheduling** | node-cron | `^4.6.0` | `package.json:35`, `scripts/db-backup.ts` |
| **Cloud Storage** | Google Drive API (`googleapis`) | `^183.0.0` | `package.json:27`, `src/app/api/cron/backup/route.ts` |

---

## 3. Component Status: Actual vs Configured vs Planned

| Component | Status | Details & Evidence |
| :--- | :---: | :--- |
| **Next.js Full-Stack App** | **ACTUAL & RUNNING** | 67 pages and 56 API routes actively serving web and Capacitor clients. |
| **Prisma PostgreSQL Connection** | **ACTUAL & RUNNING** | Connected to Supabase via `DATABASE_URL` (pooled) and `DIRECT_URL`. |
| **Capacitor Android Container** | **CONFIGURED & BUILT** | Web wrapper configured at `capacitor.config.ts` targeting `https://sri.uniknaturals.in`. |
| **Flutter Mobile Application** | **SEPARATE SOURCE TREE** | Complete Dart codebase in `mobile_app/`. Implements REST calls to backend with local SQLite caching. |
| **Google Drive Cloud Backup** | **CONFIGURED** | Working script `scripts/db-backup.ts` and route `src/app/api/cron/backup/route.ts`. |
| **Prisma Migrations** | **ABSENT** | `prisma/migrations` does not exist. Schema synchronization relies on `prisma db push`. |
| **Automated Testing Suite** | **ABSENT (WEB)** | No Jest, Vitest, Cypress, or Playwright installed or configured. 1 Flutter smoke test exists. |
| **Containerization / Docker** | **PLANNED / ABSENT** | No `Dockerfile` or `docker-compose.yml` present in repository. |
| **CI/CD Workflows** | **MINIMAL / PARTIAL** | `.github/` contains minimal files; no automated CI build or test verification action. |

---

## 4. Environment Variables Specification

The platform utilizes the following environment variables (derived from `.env.example` and code inspection):

| Variable Name | Purpose | Sensitivity Level | Risk if Misconfigured |
| :--- | :--- | :--- | :--- |
| `DATABASE_URL` | Supabase pooled connection string (Supavisor) | HIGH (Credential) | Application cannot connect to PostgreSQL. |
| `DIRECT_URL` | Direct PostgreSQL connection string for migrations | HIGH (Credential) | Schema push and migration scripts fail. |
| `JWT_SECRET` | Secret key for signing and verifying JSON Web Tokens | CRITICAL (Secret) | If omitted, code falls back to hardcoded string `'super-secret-fallback-key-for-local-dev'`. |
| `CRON_SECRET` | Secret authorizing `/api/cron/backup` | HIGH (Secret) | If omitted, falls back to `'MY_SUPER_SECRET_CRON_KEY_123'`, exposing full DB dump. |
| `GOOGLE_DRIVE_FOLDER_ID` | Drive folder where backup archives are stored | MEDIUM (Config) | Backup script cannot locate target Drive directory. |
| `GOOGLE_CLIENT_ID` | Google OAuth2 client ID for Drive upload | HIGH (Credential) | Drive API authorization fails. |
| `GOOGLE_CLIENT_SECRET` | Google OAuth2 client secret | CRITICAL (Secret) | Drive API authorization fails. |
| `GOOGLE_REFRESH_TOKEN` | Google OAuth2 permanent refresh token | CRITICAL (Secret) | Drive API authorization fails. |

---

## 5. Dependency Health and Deprecations

1. **Next.js 16 Architectural Conventions:** Next.js 16 deprecated `middleware.ts` in favor of `proxy.ts`. The repository correctly implements `src/proxy.ts`. However, `src/proxy.ts:14` explicitly bypasses all `/api/*` routes, requiring each API endpoint to handle authentication independently.
2. **React 19 Compatibility:** React 19 is utilized (`19.2.8`). React 19 deprecates certain legacy hook behaviors and strict dependency arrays, which accounts for some of the 496 ESLint warnings.
3. **Double Mobile Client Maintenance:** Maintaining both a Capacitor web wrapper (`android/`) and a native Flutter app (`mobile_app/`) creates duplicated effort and synchronization drift between mobile surfaces.
4. **Prisma 5.22.0:** Fully up-to-date and compatible with PostgreSQL. However, lack of tracked migration history represents a configuration risk.
