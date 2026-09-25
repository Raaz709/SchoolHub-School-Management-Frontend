# SchoolHub Frontend (React + TypeScript + Vite)

SchoolHub is a comprehensive School ERP web application consuming the ASP.NET Core API backend.

## Design System & UI
- **Shadcn UI & Tailwind CSS**: Built using Shadcn UI aesthetic principles with modern glassmorphism, soft pastel gradients (`#e0e7ff` to `#f3e8ff`), and refined card shadows.
- **Responsive Web Application Layout**: Designed as a modern desktop/tablet/mobile responsive web application (not a mobile app wrapper), featuring professional navigation headers, grid dashboards, and interactive widgets matching the reference ERP mockup.

## Implemented Features

### 1. Login Screen
- Responsive web login card with School ERP branding, school selection dropdown, User ID, and Password inputs with visibility toggle.
- Authentication API integration (`/api/auth/login`) with demo/offline fallback.
- Remember password and forgot password support.

### 2. Dashboard Screen
- Top navigation bar with student user profile (Emma Roberts - Grade 7 B), search bar, notification bell, and logout capability.
- School announcement banner.
- School Menu grid cards with notification badge counters (Dashboard, Calendar, Attendance, Homework).
- Today at a Glance summary widget (Classes Today, Pending Homework, New Circulars).
- School Moments feature cards (Science Fair 2025, Sports Day 2025).

### 3. Attendance & Calendar Screen
- Attendance header with back navigation and student information.
- Interactive October 2025 calendar view with color-coded status indicator badges (Present, Absent, Leave) and status legend.
- Monthly statistics summary card featuring overall attendance progress bar (73%), Working Days (31), Present days (23), and Absent days (5).

## Tech Stack
- React + TypeScript
- Vite
- Tailwind CSS v4 / Shadcn UI Styling / Lucide Icons
- ASP.NET Core API Backend (C# / Entity Framework)
