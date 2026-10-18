# User Experience and Role-Based Workflow Audit

**Target System:** Intermediate College Admissions & Field Operations SaaS  
**Audit Standard:** Role-by-role heuristic evaluation, interaction flow tracing, mobile touch-target inspection, and field usability analysis.

---

## 1. Role-by-Role Workflow Evaluation

### 1. Field PRO (Public Relations Officer / Employee)
- **Primary Workspaces:** `/employee/village-visits`, `/employee/add`, `/employee/telecaller-updates`.
- **Core Workflow Trace:**
  1. PRO arrives at a rural village, opens `/employee/village-visits`.
  2. Selects Mandal and Village dropdowns (cascading).
  3. Inspects status tabs: `All`, `Pending`, `Met Today`, `Never Met`.
  4. Taps student card ➔ Expandable card reveals parent phone, school, and marks.
  5. Clicks "Record Visit" modal ➔ Selects outcome (e.g., "Following up", "After Exams"), enters parent remarks, sets callback date.
  6. Submits ➔ System auto-increments visit count and sets `doorstepCompleted: true`.
  7. Taps "Share WhatsApp Card" ➔ In-app canvas renders branded visit card on-device with student details, photo, and college badge for instant WhatsApp sharing.
- **Usability Strengths:**
  - Fast, one-thumb mobile workflow for outdoor fieldwork.
  - On-device HTML5 canvas card generation removes dependency on slow server-side image rendering.
  - Instant status counts allow PROs to see remaining homes at a glance.
- **Usability Deficits:**
  - **Offline Vulnerability:** When cellular data drops in remote villages, submitting a visit throws a network error modal. The PRO must re-enter remarks once back in cell coverage.
  - **Form Length on Add:** `/employee/add` is a long form with 15+ fields on a single screen without a multi-step stepper, increasing cognitive load when standing in a village street.

---

### 2. Telecaller
- **Primary Workspaces:** `/telecaller`, `/telecaller/students`, `/telecaller/followups`.
- **Core Workflow Trace:**
  1. Telecaller logs into `/telecaller`.
  2. Views daily call target, assigned lead count, and overdue callbacks.
  3. Clicks "Star Leads" ➔ Instantly filters high-conversion prospects (MPC/BiPC + parent willing to bear fee + prime campus).
  4. Clicks `tel:` or `wa.me` shortcut next to student's phone number to initiate call or message.
  5. Records call notes in the slide-over modal ➔ Updates status to `Interested`, `Following Up`, or `Joined Other College`.
  6. Sets next milestone (`Date`, `After 10th Exams`, `After SSC Results`).
- **Usability Strengths:**
  - Direct 1-click dialer and WhatsApp web shortcuts reduce manual dialing errors.
  - Clear visual badges for follow-up types (`After Exams`, `After Results`).
- **Usability Deficits:**
  - When telecaller notes are saved, the full student list refreshes, causing the user to lose their scroll position on long lead tables.
  - Star leads criteria are hardcoded to science streams; non-science colleges (MEC/CEC/HEC) cannot customize star criteria from the UI.

---

### 3. College Administrator & Campus Director
- **Primary Workspaces:** `/college/dashboard`, `/college/team`, `/college/reports`, `/college/schools`.
- **Core Workflow Trace:**
  1. Opens `/college/dashboard`.
  2. Views 4 primary KPI cards: Total Leads Collected, Doorstep Visits Completed, Admissions Secured, Today's Influx.
  3. Reviews Feeder School Intelligence: Compares total 10th-grade class strength across mapped high schools against leads collected by field staff.
  4. Evaluates Staff League Table: Compares leads collected, doorsteps done, and star conversion per field employee.
  5. Reviews 14-day SVG intake charts to assess marketing momentum.
- **Usability Strengths:**
  - High information density tailored for executive decision-making.
  - School catchment intelligence provides actionable field accountability.
- **Usability Deficits:**
  - The dashboard is heavy (90KB+ client script) and takes 2–4 seconds to render initial charts on standard office laptops.
  - No export button on the dashboard overview itself (must navigate separately to `/reports/generate`).

---

### 4. Assistant General Manager (AGM)
- **Primary Workspaces:** `/agm`, `/agm/reports`, `/agm/team`, `/agm/schools`.
- **Core Workflow Trace:**
  1. AGM oversees multiple field employees and telecallers assigned to their zone.
  2. Reviews feeder school coverage by mandal and inspects unassigned schools.
  3. Inspects individual staff daily activity reports (`/agm/reports/staff?staffId=...`).
- **Usability Strengths:**
  - Dedicated zone oversight view.
- **Usability Deficits:**
  - The staff detail page (`/agm/reports/staff/page.tsx`) is 1,100 lines long, with deeply nested expand/collapse accordions that can lag when displaying hundreds of student visit logs.

---

### 5. Platform Admin (Super Admin)
- **Primary Workspaces:** `/admin`, `/admin/colleges`, `/admin/users`, `/admin/config/[type]`, `/admin/questions`.
- **Core Workflow Trace:**
  1. Creates new college tenants with seat quotas (`maxAgms`, `maxTelecallers`, `maxEmployees`) and subscription pricing.
  2. Manages master location trees: Districts ➔ Mandals ➔ Villages.
  3. Curates questions and scoring weights for the student career guidance engine.
- **Usability Strengths:**
  - Clean master-detail tables for dictionary values.
- **Usability Deficits:**
  - `/admin/users` allows editing users but fails to link them to specific colleges during creation.
  - High-risk actions (e.g., deleting a location node) lack two-step confirmation or impact warnings for child villages.

---

### 6. Student (Self-Service)
- **Primary Workspaces:** `/student/dashboard`, `/student/dashboard/test`, `/student/dashboard/report`.
- **Core Workflow Trace:**
  1. Student logs in with phone number.
  2. Takes 5-module assessment: Group Clarity (MPC vs BiPC vs Commerce), Study Discipline, Screen Time, Family, Career.
  3. Submits ➔ Receives an instant, bilingual Telugu/English psychometric career report with personalized strengths, daily activity advice, and recommended intermediate streams.
- **Usability Strengths:**
  - Engaging, accessible design for 15-year-old rural students.
  - Telugu language advice makes the report easy for parents to understand.
- **Usability Deficits:**
  - "Ask an Expert" form on `/student/dashboard/ask-expert` is a mock UI that does not actually submit to staff.

---

## 2. Heuristic Cross-Cutting Findings

| Heuristic Dimension | Rating | Finding & Evidence |
| :--- | :---: | :--- |
| **Mobile Touch Targets** | **GOOD (7/10)** | Primary action buttons (`Record Visit`, `Call`, `Share`) meet 48px touch-target standards. However, secondary pagination buttons on `/telecaller/students` are small (32px). |
| **Information Architecture** | **VERY GOOD (8/10)** | Role-based navigation is distinct and clear. PROs are not distracted by administrative settings. |
| **Feedback & Error Recovery** | **MODERATE (5/10)** | API errors typically display generic "Internal server error" toasts rather than actionable recovery guidance. |
| **Readability & Typography** | **VERY GOOD (8/10)** | Clean system fonts, high-contrast dark card accents (`#202C33`), and clear badge colors (Green for Admitted, Orange for Follow-Up). |
| **Accessibility (WCAG 2.1)** | **MODERATE (5/10)** | Lacks ARIA labels on custom modal dialogs; color-alone indicators used on certain lead status badges. |
| **Network Resilience** | **POOR (3/10)** | PWA caching covers static assets but lacks an offline mutation queue for visit records in the web client. |
