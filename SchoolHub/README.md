# SchoolHub — Frontend

A React + TypeScript school ERP web client that consumes the **SchoolHub ASP.NET Core API** (multi-tenant, JWT-authenticated). This is the **web** client; a React Native mobile app is planned against the same API.

> **Status:** Feature 1 (App Shell) complete. Dashboard body, module pages, auth wiring, and API integration are still to come.

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

No routing or data-fetching libraries yet — both are deliberate deferrals (see *Roadmap*).

---

## Getting started

Install dependencies and start the dev server:

    cd "SchoolHub Frontend/SchoolHub"
    npm install
    npm run dev

Other scripts: npm run build, npm run preview, npm run lint.

The API base URL will live in .env (copy .env.example). Not yet wired up.

---

## Getting started

Install dependencies and start the dev server:

    cd "SchoolHub Frontend/SchoolHub"
    npm install
    npm run dev

Other scripts: npm run build, npm run preview, npm run lint.

The API base URL will live in .env (copy .env.example). Not yet wired up.

---

## Project structure

---

## Project structure
====
## Getting started

Install dependencies and start the dev server:

    cd "SchoolHub Frontend/SchoolHub"
    npm install
    npm run dev

Other scripts: npm run build, npm run preview, npm run lint.

The API base URL will live in .env (copy .env.example). Not yet wired up.

---

## Project structure

---

## Project structure
====
## Getting started

Install dependencies and start the dev server:

    cd "SchoolHub Frontend/SchoolHub"
    npm install
    npm run dev

Other scripts: npm run build, npm run preview, npm run lint.

The API base URL will live in .env (copy .env.example). Not yet wired up.

---

## Project structure
====
## Getting started

Install dependencies and start the dev server:

    cd "SchoolHub Frontend/SchoolHub"
    npm install
    npm run dev

Other scripts: npm run build, npm run preview, npm run lint.

The API base URL will live in .env (copy .env.example). Not yet wired up.

---

## Project structure

---

## Project structure

    src/
    ├── AppShell.tsx              # entry — picks the page for the active nav id
    ├── main.tsx                  # mounts NavigationProvider + AppShell
    ├── index.css                 # Tailwind v4 import + @theme design tokens
    ├── context/
    │   └── NavigationContext.tsx # active nav id + sidebar collapsed state
    ├── data/
    │   └── navigation.ts         # 17 sidebar items (id, label, icon)
    ├── layouts/
    │   └── AppLayout.tsx         # h-screen shell: sidebar + scrollable content
    ├── components/
    │   ├── common/EmptyPanel.tsx
    │   └── layout/
    │       ├── Sidebar.tsx       # brand, collapse toggle, active mint pill
    │       └── PageHeader.tsx    # title / subtitle / action
    ├── pages/
    │   ├── SchoolOverview.tsx    # default page (placeholder)
    │   └── ComingSoon.tsx        # placeholder for the other 16 modules
    └── lib/cn.ts                 # className joiner

---

## Design system

Tokens are declared in src/index.css under Tailwind v4's @theme block, so utilities like bg-mint-100, text-ink-500, border-line, and bg-canvas resolve directly.

| Ramp | Purpose |
|---|---|
| ink-900 → ink-400 | primary / secondary / muted text |
| line, line-soft | borders and hover surfaces |
| canvas | app background (#f4f7fa) |
| mint-50 → mint-600 | brand accent, active states |

The active sidebar item uses an inline linear-gradient(90deg, #dcf6cd → #b7eaa5) with a mint-tinted drop shadow, matching the reference design.

---

## Feature 1 — App Shell ✅

- **Sidebar** — 17 modules in the reference order: School Overview, Front Office, Student Info, Online Course, Multi Branch, Live Classes, Behavior Records, Income & Expense, CBSE Examination, Examinations, Attendance, Online Examinations, Academics, Lesson Plan, Human Resource, Communicate, Fees Collection.
- **Collapsible** — 264px ↔ 76px, toggled by the panel icon; collapsed mode shows icons only with tooltips.
- **Active state** — mint gradient pill, aria-current="page".
- **Navigation** — context-based (useNavigation hook), no router. Nav ids are route-shaped so a swap to react-router is contained.
- **Placeholders** — SchoolOverview and a generic ComingSoon for the remaining modules.

---

## Roadmap

- [x] **Feature 1** — App shell, sidebar, navigation, design tokens
- [ ] **Feature 2** — School Overview dashboard (stat cards, bar/line/donut charts, fees overview)
- [ ] **Feature 3** — API client + JWT auth (AuthController)
- [ ] **Feature 4** — Student Info module (StudentsController)
- [ ] **Feature 5** — Attendance module (AttendanceController)
- [ ] **Feature 6** — Examinations (ExamsController, AcademicController)
- [ ] **Feature 7** — Fees Collection (FeesController)
- [ ] **Feature 8** — Communicate / Notices (AnnouncementsController)
- [ ] **Feature 9** — Admin: staff, roles, audit logs, reports
- [ ] **Feature 10** — Real routing (react-router-dom) + TanStack Query

---

## Backend

The API lives at SchoolHubBackend/ (ASP.NET Core 8, EF Core, SQL Server, JWT via TokenService). It exposes ~20 controllers including Auth, Students, Teachers, Fees, Exams, Attendance, Reports, and Admin. Role-based access covers Admin / Teacher / Student / Parent.

**Do not modify the backend** — the frontend consumes it as-is.

---

## Notes

- src/App.tsx is leftover from the original Vite scaffold demo and is no longer imported. It can be deleted.
- Charts will be hand-rolled (inline SVG + divs) to avoid adding a charting dependency.
