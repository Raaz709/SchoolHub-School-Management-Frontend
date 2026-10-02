# SchoolHub — Frontend

A React + TypeScript school ERP web client that consumes the **SchoolHub ASP.NET Core API** (multi-tenant, JWT-authenticated). This is the **web** client; a React Native mobile app is planned against the same API.

> **Status:** App shell, live dashboard, login/register, per-role dashboards, profile, and full management modules — Students, Teachers, Academics, Attendance, Examinations, Fees Collection, Timetable, Events, Assignments, Communicate, Reports and Audit Logs. Real routing (`react-router-dom`) and server-state management (`@tanstack/react-query`) now power navigation and data fetching.

---

## Tech stack

| Layer | Choice |
|---|---|
| Framework | React 19 + TypeScript |
| Build | Vite (Rolldown) |
| Styling | Tailwind CSS v4 (CSS-first, `@theme` tokens) |
| Icons | lucide-react |
| Compiler | React Compiler via `@rolldown/plugin-babel` |
| Routing | `react-router-dom` v6 |
| Data fetching | `@tanstack/react-query` v5 |
| Backend | ASP.NET Core 8 Web API + EF Core + JWT |

Routing uses `react-router-dom` with `BrowserRouter`; server-state management is powered by TanStack Query via a `useAsync` compatibility wrapper.

---

## Getting started

Install dependencies and start the dev server:

```bash
cd "SchoolHub Frontend/SchoolHub"
npm install
npm run dev
```

Other scripts: `npm run build`, `npm run preview`, `npm run lint`.

### Environment

Create `SchoolHub/.env.local` with:

```
VITE_API_BASE_URL=http://localhost:5000
```

**No trailing slash, no `/api` suffix** — controller routes already include the `api/` prefix.

### Auth

All endpoints except `/api/auth/*` and `/api/health` require a JWT. Log in through the built-in login screen, which stores the token in `localStorage` under `schoolhub.token` and the user under `schoolhub.user`.

### Authorization

The client hides what a role cannot use, but the backend is the authority — it returns 403 regardless of what the UI shows. `canAccess()` in `src/data/navigation.ts` guards *rendering* as well as the sidebar, so a stale or hand-edited `activeId` cannot surface an admin-only page.

Role rules are derived from the backend's own `[Authorize]` attributes rather than from preference, and each nav item lists its roles inline.

### Response casing

The API serialises PascalCase (`PropertyNamingPolicy = null`), so DTO fields and interface properties are PascalCase: `student.ClassId`, `dto.RollNumber`. Do not rename these to camelCase.

---

## Project structure

```
src/
├── AppShell.tsx                 # auth gate + context-based page router
├── main.tsx                     # mounts AuthProvider + NavigationProvider + AppShell
├── index.css                    # Tailwind v4 import + @theme design tokens
├── api/
│   ├── auth.ts                  # login(), register()
│   ├── dashboard.ts             # fetchDashboardStats()
│   ├── announcements.ts         # announcements feed + staff create/update/delete
│   ├── students.ts              # roster read + create/update/deactivate/reactivate/assign
│   ├── teachers.ts              # teacher read + create/update/deactivate
│   ├── academic.ts              # fetchClasses(), fetchSections()
│   ├── attendance.ts            # roster, session history, marking writes, own record
│   ├── exams.ts                 # exam CRUD, papers, bulk marking, transcripts
│   ├── fees.ts                  # fee structures, assignments, payments, summary
│   ├── timetable.ts             # bell schedule, weekly entries, own/child week
│   ├── events.ts                # events, RSVP, participant list and moderation
│   ├── assignments.ts           # assignments, submissions, grading
│   ├── notifications.ts         # inbox, unread count, mark-read and delete
│   ├── reports.ts               # enrolment headcount and fee-collection reports
│   ├── auditLogs.ts             # audit trail, action labels and tones
│   ├── portals.ts               # per-role dashboard data
│   ├── profile.ts               # fetchProfile(), updateProfile(), password change
│   └── teacher.ts               # teacher-scoped endpoints
├── context/
│   ├── AuthContext.tsx          # token + user state, signIn/signOut
│   └── NavigationContext.tsx    # active nav id + sidebar collapsed state
├── data/
│   └── navigation.ts            # 13 sidebar items + hidden profile, per-role
├── hooks/
│   ├── useAsync.ts              # loading / error / retry for GET requests
│   ├── useAuth.ts               # useAuth() context hook
│   └── useNavigation.ts         # useNavigation() context hook
├── layouts/
│   └── AppLayout.tsx            # sidebar + topbar + scrollable content
├── components/
│   ├── common/
│   │   ├── EmptyPanel.tsx
│   │   ├── ErrorState.tsx       # 401/403/network-aware error card + retry
│   │   └── Skeleton.tsx         # loading pulse
│   ├── dashboard/
│   │   ├── StatCard.tsx
│   │   ├── ActivityPanel.tsx
│   │   └── AnnouncementsPanel.tsx
│   └── layout/
│       ├── Sidebar.tsx          # brand, collapse toggle, mint active pill
│       ├── TopBar.tsx           # search, notifications, user menu + logout
│       └── PageHeader.tsx       # title / subtitle / action
├── pages/
│   ├── LoginPage.tsx
│   ├── RegisterPage.tsx
│   ├── SchoolOverview.tsx       # live dashboard
│   ├── StudentDashboard.tsx     # role: Student
│   ├── TeacherDashboard.tsx     # role: Teacher
│   ├── ParentDashboard.tsx      # role: Parent
│   ├── ProfilePage.tsx          # own profile only, reachable from the avatar
│   ├── StudentInfo.tsx          # full student CRUD (Admin) / read-only (Teacher)
│   ├── TeachersPage.tsx         # full teacher CRUD (Admin)
│   ├── AcademicsPage.tsx        # classes / sections / subjects tabs
│   ├── AttendancePage.tsx       # marking (staff) + own records (Student/Parent)
│   ├── ExamsPage.tsx            # exam setup + bulk marking (staff) + transcripts (Student/Parent)
│   ├── FeesPage.tsx             # fee structures, assignment, ledger and payments (Admin)
│   ├── TimetablePage.tsx        # bell schedule + weekly lesson grid (Admin) / own week
│   ├── EventsPage.tsx           # event calendar, RSVP and participant moderation
│   ├── AssignmentsPage.tsx      # assignments + grading (staff) / submit (Student)
│   ├── CommunicatePage.tsx      # announcements feed + notification inbox
│   ├── ReportsPage.tsx          # enrolment + fee-collection reports (Admin)
│   ├── AuditLogsPage.tsx        # recorded staff activity (Admin)
│   └── ComingSoon.tsx           # placeholder for unbuilt modules
└── lib/
    ├── api.ts                   # apiGet/apiPost/apiPut/apiPatch, ApiError, token helpers
    ├── env.ts                   # API_BASE_URL resolution
    └── cn.ts                    # className joiner
```

---

## Design system

Tokens are declared in `src/index.css` under Tailwind v4's `@theme` block, so utilities like `bg-mint-100`, `text-ink-500`, `border-line`, and `bg-canvas` resolve directly.

| Ramp | Purpose |
|---|---|
| `ink-900` → `ink-400` | primary / secondary / muted text |
| `line`, `line-soft` | borders and hover surfaces |
| `canvas` | app background (`#f4f7fa`) |
| `mint-50` → `mint-700` | brand accent, active states, and the text colour of status pills |

The active sidebar item uses an inline `linear-gradient(90deg, #dcf6cd → #b7eaa5)` with a mint-tinted drop shadow, matching the reference design.

---

## Features

### Feature 1 — App Shell ✅

- **Sidebar** — 13 modules, each backed by a real backend controller. Collapsible (264px ↔ 76px).
- **Active state** — mint gradient pill, `aria-current="page"`.
- **Navigation** — context-based (`useNavigation()`), no router. Nav ids are route-shaped so a swap to react-router is contained.

Backed modules: School Overview, Student Info, Teachers, Academics, Timetable, Attendance, Examinations, Assignments, Fees Collection, Communicate, Events, Reports, Audit Logs.

### Feature 2 — Live Dashboard ✅

- **Stat cards** — Total Students / Teachers / Parents / Classes, Present Today, Upcoming Exams, Announcements
- **Recent Activity** — last 5 audit-log entries with relative timestamps
- **Announcements** — most recent 4, with target role badge
- Data from `GET /api/admin/dashboard/stats` and `GET /api/announcements`
- Skeleton loaders, error state with retry

### Feature 3 — Login / Register ✅

- Login page with username + password, mint-themed
- Register page with Student / Teacher / Parent role tabs and conditional fields
- Token stored in `localStorage`; `AuthProvider` gates the app
- TopBar shows real username + role with logout menu
- 401 → "Invalid username or password"; network failure → "Cannot reach the API"

### Feature 4 — Student Management ✅

Admin gets the full lifecycle; Teacher gets the same roster read-only.

- **Search + filters** — `GET /api/students/search?query=&classId=&sectionId=`, with class and section dropdowns from `/api/academic/classes` and `/api/academic/sections`. Status filtering is client-side, since the list endpoint has no status parameter.
- **Columns** — Roll No, Name, Email, Class, Section, Admission Date, Status pill, Actions.
- **Create** — `POST /api/students`, including an optional class and section assigned in the same step.
- **Edit** — roll number via `PUT /api/students/{id}`.
- **Assign class** — `POST /api/students/{id}/assign-class`. Idempotent: the backend upserts on `StudentId`, so reassigning replaces the previous row instead of accumulating one.
- **Deactivate / reactivate** — `PATCH /api/students/{id}/deactivate` and `.../reactivate`. Deactivation is a soft flag, so the record and its history survive.
- Empty-state, skeleton, and per-action error handling. Buttons are disabled while a request is in flight.

**Roles:** Admin sees write actions; Teacher sees the roster with a read-only notice. Both roles may read the class and section lookups, so the filters work for each.

### Feature 5 — Teachers ✅

- Admin-only, mirroring the student module: search, department filter, status filter, create, edit, deactivate, subject assignment.
- Staffing fields and an employee code on create.
- Deactivate is one-way from this page; unlike students, there is no reactivate endpoint for teachers yet.

### Feature 6 — Role Dashboards + Profile ✅

- `StudentDashboard`, `TeacherDashboard`, `ParentDashboard` — each renders from its own portal endpoints rather than the admin stats endpoint.
- `ProfilePage` — own record only; reachable from the top-bar avatar for every role and deliberately absent from the sidebar.

### Feature 7 — Academics ✅

- Three tabs over `AcademicController`: classes, sections, subjects. Search filters the active tab as you type.
- Admin gets create, rename, and delete on each list, plus a subject-assignment dialog per class that replaces the class's subject set in one call.
- Class rows carry `SectionCount` so an unconfigured grade is visible without opening it. Section rows resolve their class by id, so the display label comes from `ClassName` and never from parsing a name. Subjects carry `TeacherName` so the owner column renders without a second request.
- Deletes are guarded server-side: a class holding enrollments, a section holding enrollments, or a subject referenced by assignments/exams/timetable is refused with a count rather than a foreign-key error. The UI surfaces that message as an error notice.
- **Roles:** Admin sees all write actions; Teacher gets the same three read-only lists with the action column empty.

### Feature 8 — Attendance ✅

- **Mark a day** — pick a class, section and date; the roster loads with each student's stored status already filled in, so a re-mark starts from the recorded decision. Four statuses only (`Present`, `Absent`, `Late`, `Excused`), with all-present/all-absent shortcuts for the common case and an optional remark per student.
- **One session per section per day** — the API refuses a second mark for the same day with `409` and the existing session id, so saving an already-marked day opens it for correction instead of creating a duplicate that would double-count the day in a student's percentage.
- **History** — `GET /api/attendance/sessions` with an optional class filter, newest first, showing marked-vs-total per day. A day where `Marked < Total` is flagged incomplete, because a student with no mark was previously indistinguishable from an absence. Edit opens that session.
- **Correcting a session** — updates each mark in place rather than re-inserting, so a student's original remark is never orphaned and a student cannot be duplicated into one day.
- **Student and Parent views** — the same page shows a read-only record with an attendance summary. A student reads `/api/attendance/mine`, which resolves the id server-side; nothing previously exposed a student's own `Students.Id`, so the page would otherwise have had to guess it. A parent picks a child, and the API re-checks the link server-side on every request.
- **Roles:** Admin and Teacher get the marking screens; Student and Parent get only their own records. Sections are filtered by `ClassId` rather than matched on name, since a class and a section can share a name.

### Feature 9 — Examinations ✅

- **Exam setup** — create and edit an exam's title, academic year, date window and pass percentage. The year picker submits an `AcademicYearId` rather than a name, because the seed data holds two years both called `2024-2025` and a name-keyed picker would silently submit the wrong one.
- **Papers** — a paper is one subject for one class, so one exam can cover several grades. The exam row shows paper and class counts, and flags a zero-paper exam in amber: that is the state a new exam starts in and it is not distinguishable from a finished one at a glance. Removes are guarded server-side and the refusal message names what blocks the delete.
- **Marking** — opening a paper loads the class roster with stored marks, grades and remarks already filled in, so a re-mark starts from the recorded values and does not drop a remark. Each row shows the stored grade and percentage beside the input being edited, so a correction is visibly a correction.
- **One save for the whole roster** — `PUT /api/exams/subjects/{id}/marks` applies a paper in a single transaction, so a teacher cannot stop halfway and leave a paper that looks complete. Blank rows are skipped; a mark outside `0..MaxMarks` or belonging to another class is rejected by the API with the offending student ids named, and nothing is written.
- **Grading** — the server grades on fixed bands (`A+` 90, `A` 80, `B` 70, `C` 60, `F`) and echoes each student's computed percentage, grade and pass/fail back, so the screen shows the server's verdict rather than recomputing it. `PassingMarks` is entered as a percentage and labelled as such, since that is how the API reads it.
- **Transcripts** — a Student reads `/api/exams/mine`, which resolves the student id server-side; nothing previously exposed a student's own `Students.Id`, so the page would otherwise have had to guess it. Rows are rolled up per exam server-side, each carrying its own exam's pass threshold rather than one shared line. A Parent picks a child and the API re-checks the link server-side on every request, so swapping the selector cannot reach an unlinked student.
- **Roles:** Admin and Teacher get setup, paper management and marking; Student and Parent get only transcripts. Admin alone sees Delete, matching the API. Parents are excluded from the exam list itself, so the page never requests a list it is refused.
- State is derived, not seeded: the selected exam, the child in view and the marking draft are all computed from the loaded rows, so a deleted exam, an unlinked child or a reopened paper cannot leave stale state behind, and no effect fires after unmount.

### Feature 10 — Fees Collection ✅

Admin-only, backed by `FeesController` and the fee-collection report in `ReportsController`.

- **Summary** — billed, collected, outstanding and overdue totals for the whole school, from `GET /api/fees/summary`. Overdue is the outstanding part of fees past their due date.
- **Fee structures** — create, edit and delete a charge (`GET/POST/PUT/DELETE /api/fees/structures`). A structure is either school-wide or fixed to one class. The list carries the class name and a live `AssignedCount`, so an assigned fee is visibly blocked from deletion or an amount change before the attempt.
- **Assignment** — assign a fee to a whole class or to one student, with a due date (`POST /api/fees/assignments`). Re-assigning an already-charged fee is a no-op, so a class assignment can be safely re-run; the response reports how many were assigned versus skipped. A class-scoped fee can only go to its own class.
- **Student ledger** — one row per fee a student owes, filterable by class, status and a name/roll search (`GET /api/fees/assignments`). Paid, outstanding and status are derived by the server, never stored: `Paid` (paid ≥ amount), else `Overdue` (past due), else `Partial`, else `Unpaid`.
- **Recording a payment** — settles the selected ledger row inline (`POST /api/fees/payments`). Overpayment is refused with the balance named rather than silently carried as credit, and a fully-paid fee cannot take another payment. A payment refreshes the summary, ledger, structure counts and payment list together.
- **Payment history** — recent payments with student, fee, method, reference and date (`GET /api/fees/payments`).
- **Guarded deletes** — a structure with assignments, or an assignment with payments, is refused with the amount or count that blocks it, so collected money is never silently cascaded away.
- **State** — the ledger filters and every panel's refetch are lifted into the page, so one write refreshes exactly what it changed.

### Feature 11a — Timetable ✅

Backed by `SchoolExtensionsController` (`/api/schoolextensions/timeslots`, `/api/schoolextensions/timetable`). Every signed-in role may read a timetable; only an Admin may write.

- **Bell schedule** — the Admin page lists, adds, edits and deletes periods (`GET/POST/PUT/DELETE /api/schoolextensions/timeslots`). A period must end after it starts and cannot overlap another; a period still scheduled into the timetable is refused with a count of the lessons that block it, because the cascade would otherwise wipe them.
- **Weekly grid** — pick a class and section to see the week as periods (rows) by day (columns). Clicking a cell adds a lesson or opens the one already there; the editor sets subject, teacher, period and day, and saves in place or removes it (`POST/PUT/DELETE /api/schoolextensions/timetable`).
- **Guarded writes** — the API refuses (409) a section booked twice in one period and a teacher booked in two places at once, and rejects (400) a bad day, a section from another class, a subject the class does not offer or an unknown period. The UI surfaces the message in a notice rather than failing silently.
- **Role-aware reads** — Students and Teachers get their own week through `GET /api/schoolextensions/timetable/mine`; a parent picks a linked child and reads `GET /api/schoolextensions/timetable/student/{id}`. The class is resolved server-side, so a learner cannot request another section's week. The same grid is reused, showing the teacher's class and the learner's teacher respectively.
- **State** — the selected class/section and the open editor draft are derived from the loaded rows, so switching class cannot leave a section or draft pointing at the previous one.

### Feature 11b — Events ✅

Backed by `SchoolExtensionsController` (`/api/schoolextensions/events/*`). Every signed-in role may read the calendar and answer for themselves; only an Admin may change an event.

- **Calendar** — every event is a card with its date and time, location and description (`GET /api/schoolextensions/events`). Each card carries the caller's own response (`MyStatus`) and the number of responses so far.
- **Creating and editing** — Admin only. One form covers create and edit; date is required and a duplicate title on the same date is refused with 409, surfaced as a notice. Deleting an event removes it and its responses together (`POST/PUT/DELETE /api/schoolextensions/events`).
- **RSVP** — a selector records the caller's own response (`PUT /api/schoolextensions/events/{id}/rsvp`), upserted so a change replaces the previous answer, using the four statuses the API accepts (`Invited`, `Attending`, `Not Attending`, `Maybe`). Choosing "No response" removes the caller's row.
- **Participant moderation** — expanding a card lists who responded and how (`GET /api/schoolextensions/events/{id}/participants`). Staff may remove anyone's response; a learner may remove only their own, which the API enforces independently of the UI.
- **State** — one write refreshes the list, so the response count and the caller's own status stay in step without a second round trip.

### Feature 11c — Assignments ✅

Backed by `AssignmentsController` (`/api/assignments/*`). Staff set and grade work; a learner sees only the assignments their class offers, which the API scopes before any data leaves the server.

- **Staff list** — every assignment as a row with its subject, teacher, deadline, max score and submission count (`GET /api/assignments`). An overdue deadline is marked; create and edit share one form (`POST/PUT /api/assignments`), and a blank title, missing deadline, non-positive max score or unknown subject is refused with a notice.
- **Ownership** — a Teacher may only edit or delete their own assignment, an Admin any. The UI offers the controls to all staff and surfaces the API's `403` in a notice rather than guessing who owns what.
- **Submissions and grading** — expanding a row lists who submitted, when, and their file link (`GET /api/assignments/{id}/submissions`). Each row returns a score and feedback (`PUT /api/assignments/submissions/{id}`); a score outside `0..MaxScore` is refused. Clearing the score sends `null`, so a grade can be removed.
- **Learner view** — a Student sees only the assignments their class offers, with their own submission state, score and feedback carried on the same row. They submit a link (`POST /api/assignments/submit`), upserted so a second call updates rather than duplicates, and the button reads "Submit" or "Update submission" accordingly.
- **State** — one write refetches the list, so the submission count and the learner's status stay in step.

### Feature 11d — Communicate ✅

Backed by `AnnouncementsController` (`/api/announcements/*`) and the notifications endpoints (`/api/schoolextensions/notifications`). One page holds the school's announcements and the signed-in user's own notification inbox.

- **Announcements feed** — every notice the API releases to the caller, newest first, each with its audience badge and, where set, the class it targets (`GET /api/announcements`). Reads are audience-scoped server-side: a Student sees their class and school-wide notices, a Parent their children's, staff everything.
- **Publishing** — staff share one create/edit form (`POST/PUT /api/announcements`), choosing an audience (`All`/`Admin`/`Teacher`/`Student`/`Parent`) and optionally one class; a blank title or message, an unknown audience or an unknown class is refused with a notice. A Teacher may only change their own notice, an Admin any, and the API's `403` is shown rather than pre-emptively hiding the control.
- **Notification inbox** — the caller's own notifications (`GET /api/schoolextensions/notifications`) carry an unread state; one click marks a row read (`PATCH .../{id}/read`) and "Mark all read" clears the lot (`PATCH .../read-all`). A row can be deleted (`DELETE .../{id}`).
- **Shared unread badge** — the top-bar bell shows the live unread count from `GET /api/schoolextensions/notifications/unread-count` and updates the moment the inbox changes, because each notification write dispatches `NOTIFICATIONS_CHANGED_EVENT` and the badge listens for it.

### Feature 12 — Reports & Audit Logs ✅

Backed by `ReportsController` (`/api/reports/*`) and `AuditLogsController` (`/api/auditlogs`). Both are read-only and Admin-only server-side, so neither page carries role logic of its own.

- **Summary tiles** — students reported and classes covered from the enrolment report, then collected and outstanding money from the collection report. The collected tile carries the billed total as its hint, so the two figures are read together.
- **Students by class** — one row per class and section with its headcount (`GET /api/reports/students-by-class`), and a footer that totals the column. A class with no sections yet still appears, labelled "All sections".
- **Fee collection** — billed, collected and outstanding grouped by the status the API derives (`GET /api/reports/fee-collection`). The four statuses and their precedence come from the server, so the page only colours the pill; a school with nothing assigned shows an empty panel rather than a row of zeros.
- **Audit trail** — recorded activity as timestamp, actor, action and details (`GET /api/auditlogs`). An entry whose account has since been deleted still stands and says so, and an IP address is shown only when one was captured.
- **Filtering** — the audit endpoint takes no parameters, so the search box (actor, action or details) and the action picker filter what is on screen. The action options are derived from the data, so a new action needs no code change, and the header reads "n of m" while a filter is active.

---

## Roadmap

- [x] **Feature 1** — App shell, sidebar, navigation, design tokens
- [x] **Feature 2** — School Overview dashboard
- [x] **Feature 3** — API client + JWT auth + login/register
- [x] **Feature 4** — Student management (CRUD)
- [x] **Feature 5** — Teachers module (CRUD)
- [x] **Feature 6** — Role dashboards + profile
- [x] **Feature 7** — Academics (classes, sections, subjects, class-subject mapping)
- [x] **Feature 8** — Attendance (marking, correction, history, learner records)
- [x] **Feature 9** — Examinations (exam CRUD, per-class papers, bulk marking, transcripts)
- [x] **Feature 10** — Fees Collection (structures, assignment, ledger, payments)
- [x] **Feature 11a** — Timetable (bell schedule, weekly lesson grid, own/child week)
- [x] **Feature 11b** — Events (calendar, RSVP, participant moderation)
- [x] **Feature 11c** — Assignments (staff set/grade, learner submit, class-scoped reads)
- [x] **Feature 11d** — Communicate (scoped announcements, notification inbox, shared unread badge)
- [x] **Feature 12** — Audit Logs, Reports (enrolment + collection reports, audit trail)
- [x] **Feature 13** — Real routing (react-router-dom) + TanStack Query

---

## Backend

The API lives in a separate repository (ASP.NET Core 8, PostgreSQL via Dapper, JWT). It exposes ~20 controllers including Auth, Students, Teachers, Academic, Fees, Exams, Attendance, Reports, and Admin. Role-based access covers Admin / Teacher / Student / Parent.

**Do not modify the backend** — the frontend consumes it as-is.

### Idempotent writes

Assignment and similar operations are safe to retry. `POST /api/students/{id}/assign-class` upserts on `StudentId` rather than inserting, so a double-submit cannot create a second enrolment row — which previously made the roster return each student once per assignment. `POST /api/fees/assignments` is idempotent on `(StudentId, FeeStructureId)`, so re-running a class assignment cannot charge a student the same fee twice.

Match on ids, not names, when reading an entity back. Class names are not unique in this database (`Grade 10` exists as both id 1 and id 4), so the student list returns `ClassId` and `SectionId` alongside the names; resolving by name would silently pick the wrong row.

---

## Notes

- `src/App.tsx` is leftover from the original Vite scaffold demo and is no longer imported. It can be deleted.
- Charts are hand-rolled (inline SVG + divs) to avoid adding a charting dependency.
- Parent accounts are created by an admin through `POST /api/admin/parents`; there is no `POST /api/parents`.