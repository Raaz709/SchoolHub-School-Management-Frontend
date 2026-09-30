# SchoolHub — Frontend

A React + TypeScript school ERP web client that consumes the **SchoolHub ASP.NET Core API** (multi-tenant, JWT-authenticated). This is the **web** client; a React Native mobile app is planned against the same API.

> **Status:** App shell, live dashboard, login/register, per-role dashboards, profile, and two full management modules — Students (CRUD) and Teachers (CRUD).

---

## Tech stack

| Layer | Choice |
|---|---|
| Framework | React 19 + TypeScript |
| Build | Vite (Rolldown) |
| Styling | Tailwind CSS v4 (CSS-first, `@theme` tokens) |
| Icons | lucide-react |
| Compiler | React Compiler via `@rolldown/plugin-babel` |
| Backend | ASP.NET Core 8 Web API + EF Core + JWT |

No routing or data-fetching libraries — deliberate deferrals (see *Roadmap*). Routing is context-based; data fetching uses a small `useAsync` hook.

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
│   ├── announcements.ts         # fetchAnnouncements()
│   ├── students.ts              # roster read + create/update/deactivate/reactivate/assign
│   ├── teachers.ts              # teacher read + create/update/deactivate
│   ├── academic.ts              # fetchClasses(), fetchSections()
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
│   │   ├── Modal.tsx            # shared dialog shell for forms
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
| `mint-50` → `mint-600` | brand accent, active states |

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

---

## Roadmap

- [x] **Feature 1** — App shell, sidebar, navigation, design tokens
- [x] **Feature 2** — School Overview dashboard
- [x] **Feature 3** — API client + JWT auth + login/register
- [x] **Feature 4** — Student management (CRUD)
- [x] **Feature 5** — Teachers module (CRUD)
- [x] **Feature 6** — Role dashboards + profile
- [ ] **Feature 7** — Academics (`AcademicController`)
- [ ] **Feature 8** — Attendance (`AttendanceController`)
- [ ] **Feature 9** — Examinations (`ExamsController`)
- [ ] **Feature 10** — Fees Collection (`FeesController`, `ReportsController`)
- [ ] **Feature 11** — Timetable, Events, Assignments, Communicate
- [ ] **Feature 12** — Audit Logs, Reports
- [ ] **Feature 13** — Real routing (react-router-dom) + TanStack Query

---

## Backend

The API lives in a separate repository (ASP.NET Core 8, PostgreSQL via Dapper, JWT). It exposes ~20 controllers including Auth, Students, Teachers, Academic, Fees, Exams, Attendance, Reports, and Admin. Role-based access covers Admin / Teacher / Student / Parent.

**Do not modify the backend** — the frontend consumes it as-is.

### Idempotent writes

Assignment and similar operations are safe to retry. `POST /api/students/{id}/assign-class` upserts on `StudentId` rather than inserting, so a double-submit cannot create a second enrolment row — which previously made the roster return each student once per assignment.

Match on ids, not names, when reading an entity back. Class names are not unique in this database (`Grade 10` exists as both id 1 and id 4), so the student list returns `ClassId` and `SectionId` alongside the names; resolving by name would silently pick the wrong row.

---

## Notes

- `src/App.tsx` is leftover from the original Vite scaffold demo and is no longer imported. It can be deleted.
- Charts are hand-rolled (inline SVG + divs) to avoid adding a charting dependency.
- Parent accounts are created by an admin through `POST /api/admin/parents`; there is no `POST /api/parents`.