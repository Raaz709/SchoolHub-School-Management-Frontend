# SchoolHub — Frontend

A React + TypeScript school ERP web client that consumes the **SchoolHub ASP.NET Core API** (multi-tenant, JWT-authenticated). This is the **web** client; a React Native mobile app is planned against the same API.

> **Status:** Features 1–4 complete — app shell, live dashboard, login/register, and Student Info.

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

All endpoints except `/api/auth/*` require a JWT. Log in through the built-in login screen, which stores the token in `localStorage` under `schoolhub.token` and the user under `schoolhub.user`.

---

## Project structure

```
src/
├── AppShell.tsx                 # auth gate + page router
├── main.tsx                     # mounts AuthProvider + NavigationProvider + AppShell
├── index.css                    # Tailwind v4 import + @theme design tokens
├── api/
│   ├── auth.ts                  # login(), register()
│   ├── dashboard.ts             # fetchDashboardStats()
│   ├── announcements.ts         # fetchAnnouncements()
│   ├── students.ts              # fetchStudents(), searchStudents()
│   └── academic.ts              # fetchClasses(), fetchSections()
├── context/
│   ├── AuthContext.tsx          # token + user state, signIn/signOut
│   └── NavigationContext.tsx    # active nav id + sidebar collapsed state
├── data/
│   └── navigation.ts            # 13 sidebar items (all backend-backed)
├── hooks/
│   └── useAsync.ts              # loading / error / retry for GET requests
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
│   ├── StudentInfo.tsx          # table + search + class/section filters
│   └── ComingSoon.tsx           # placeholder for unbuilt modules
└── lib/
    ├── api.ts                   # apiGet, apiPost, ApiError, token helpers
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

### Feature 4 — Student Info ✅

- Searchable table — `GET /api/students/search?query=...`
- Class and section filters from `/api/academic/classes` and `/api/academic/sections`
- Columns: Roll No, Name, Email, Class, Section, Status pill
- Empty-state and skeleton handling

---

## Roadmap

- [x] **Feature 1** — App shell, sidebar, navigation, design tokens
- [x] **Feature 2** — School Overview dashboard
- [x] **Feature 3** — API client + JWT auth + login/register
- [x] **Feature 4** — Student Info module
- [ ] **Feature 5** — Attendance module (`AttendanceController`)
- [ ] **Feature 6** — Examinations (`ExamsController`)
- [ ] **Feature 7** — Teachers (`TeachersController`, `AdminManagementController`)
- [ ] **Feature 8** — Academics (`AcademicController`)
- [ ] **Feature 9** — Fees Collection (`FeesController`, `ReportsController`)
- [ ] **Feature 10** — Timetable, Events, Assignments
- [ ] **Feature 11** — Audit Logs, Reports
- [ ] **Feature 12** — Real routing (react-router-dom) + TanStack Query

---

## Backend

The API lives at `SchoolHubBackend/` (ASP.NET Core 8, EF Core, PostgreSQL via Dapper, JWT via `TokenService`). It exposes ~20 controllers including Auth, Students, Teachers, Fees, Exams, Attendance, Reports, and Admin. Role-based access covers Admin / Teacher / Student / Parent.

**Do not modify the backend** — the frontend consumes it as-is.

---

## Notes

- `src/App.tsx` is leftover from the original Vite scaffold demo and is no longer imported. It can be deleted.
- Charts are hand-rolled (inline SVG + divs) to avoid adding a charting dependency.