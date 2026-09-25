# SchoolHub Frontend (React + TypeScript + Vite)

SchoolHub is a comprehensive School ERP web application consuming the ASP.NET Core API backend.

## Design System & UI
- **Shadcn UI & Tailwind CSS**: Built using Shadcn UI aesthetic principles with modern glassmorphism, soft pastel gradients (`#e0e7ff` to `#f3e8ff`), and refined card shadows.
- **Reference Mockup Alignment**: Designed precisely around the mobile ERP reference mockup featuring smooth rounded containers, status bars, and polished components.

## Implemented Features

### 1. Login Screen
- Styled mobile container matching reference ERP design.
- School selection dropdown, User ID, and Password inputs with visibility toggle.
- Authentication API integration (`/api/auth/login`) with demo/offline fallback.
- Remember password and forgot password support.

### 2. Dashboard Screen
- User profile header with student name, grade, avatar, and notification badge.
- Search bar and school announcement ticker banner.
- School Menu grid cards with notification badges (Dashboard, Calendar, Attendance, Homework).
- Today at a Glance summary section (Classes, Pending Homework, Circulars).
- School Moments scrollable cards (Science Fair 2025, Sports Day 2025).

### 3. Attendance & Calendar Screen
- Attendance header with student info and back navigation.
- October 2025 calendar grid with color-coded status indicator dots (Present, Absent, Leave) and legend.
- Monthly statistics summary card featuring attendance percentage progress bar (73%), Working Days (31), Present count (23), and Absent count (5).

## Tech Stack
- React + TypeScript
- Vite
- Tailwind CSS v4 / Shadcn UI Styling / Lucide Icons
- ASP.NET Core API Backend (C# / Entity Framework)
