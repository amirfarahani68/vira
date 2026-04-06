# Target Architecture

This document describes the production architecture for the Vira attendance platform.  The goal is to implement a **modular monolith** that cleanly separates concerns (frontend, backend, database, caching) while avoiding the complexity of microservices.  This architecture is designed to scale and support future extensions such as payroll and finance modules.

## Overview

The system will be composed of the following major components:

1. **Next.js Frontend (Web)** – A React‑based single‑page application with server‑side rendering (SSR) and static site generation (SSG).  Next.js allows pages to be statically generated at build time or rendered on each request【820677051717679†L101-L105】【94847718204238†L15-L18】.  Pages such as dashboards and reports that are mostly static can be statically generated, while pages requiring up‑to‑date data (attendance, shifts) will use SSR via `getServerSideProps`【94847718204238†L15-L34】.  The frontend will be internationalised with Persian UI strings and will call the backend API for data.

2. **NestJS Backend (API)** – A TypeScript framework for building efficient, scalable server‑side applications.  NestJS encourages modular design; a module is a class annotated with `@Module()` which provides metadata used to organise the application【650692815912447†L207-L219】.  Each business domain (Auth, Users, Attendance, Shifts, Leave, Reports, RBAC, Branches) will live in its own module, exposing controllers for REST endpoints and services for business logic.

3. **PostgreSQL Database** – A relational database used to store persistent data such as users, roles, branches, attendance records, shifts, leave requests and audit logs.  PostgreSQL’s transactional nature and support for JSON fields make it suitable for complex queries.

4. **Redis** – Used as an in‑memory cache and message queue.  Redis will cache frequently read data (e.g., user sessions, QR tokens) and support background jobs like rotating QR codes and sending notifications.

5. **Liara Deployment** – The entire monorepo (frontend and backend) will be deployed to Liara.  The backend will run as a Node application with environment variables for database and Redis connection strings.  The frontend will be built and served either via Liara’s static hosting or through a Node process that executes `next build` and `next start`.

### High‑Level Data Flow

1. Users access the **Next.js** web application.  For pages requiring dynamic data, Next.js executes `getServerSideProps()` to fetch data from the NestJS API before rendering【94847718204238†L15-L34】.
2. The **NestJS** API validates the request, enforces RBAC rules and interacts with the PostgreSQL database via an ORM (e.g., TypeORM or Prisma).  Modules encapsulate controllers and services【650692815912447†L207-L219】.
3. Redis caches QR codes and session tokens.  A scheduled job rotates QR codes and invalidates old ones.
4. Liara orchestrates deployment, environment variables and scaling.

## Recommended Monorepo Structure

```
/ (root)
│  package.json           # top‑level scripts, dev dependencies
│  tsconfig.base.json     # shared TypeScript config
│  .prettierrc, .eslintrc
│
├── apps/
│   ├── web/              # Next.js frontend app
│   │   ├── pages/        # pages (login, dashboard, attendance, shifts, leave, reports)
│   │   ├── components/   # reusable UI components (tables, forms, modals)
│   │   ├── hooks/        # custom React hooks (useAuth, useAttendance)
│   │   ├── lib/          # i18n helpers, API client, utils
│   │   ├── public/       # static assets (icons, images)
│   │   ├── next.config.js
│   │   └── package.json
│   └── api/              # NestJS backend app
│       ├── src/
│       │   ├── main.ts   # bootstrap
│       │   ├── app.module.ts
│       │   ├── modules/
│       │   │   ├── auth/
│       │   │   ├── users/
│       │   │   ├── roles/
│       │   │   ├── branches/
│       │   │   ├── attendance/
│       │   │   ├── shifts/
│       │   │   ├── leave/
│       │   │   ├── reports/
│       │   └── common/   # shared guards, filters, interceptors
│       ├── prisma/       # or typeorm configuration and migrations
│       └── package.json
│
├── libs/
│   ├── db/               # shared database models and migrations
│   ├── auth/             # shared auth utilities (passport strategies, guards)
│   ├── ui/               # React component library shared across apps
│   └── utils/            # shared utilities
│
└── .env                  # environment variables (not committed)
```

This structure organises the frontend and backend into separate **apps** while providing shared libraries for database models, UI components and utilities.  Tools such as **Nx**, **Turborepo** or **Yarn workspaces** can manage dependencies and scripts across the monorepo.

## Initial Modules and Responsibilities

| Module (NestJS) | Responsibility | Inputs/Outputs | Dependencies |
|-----------------|----------------|---------------|--------------|
| **AuthModule** | User authentication (passwords, refresh tokens, JWT), integration with session store and OAuth if needed. | Inputs: login credentials; Outputs: access/refresh tokens, session info. | UsersModule, Redis cache. |
| **UsersModule** | CRUD operations for users, password hashing, branch assignment. | Inputs: user data; Outputs: user records. | AuthModule, RolesModule, BranchesModule. |
| **RolesModule** | Defines roles and permissions (RBAC).  Provides guards/interceptors to enforce access. | Inputs: role definitions; Outputs: ability checks. | UsersModule. |
| **BranchesModule** | Manages organisational branches.  Associates users with branches. | Inputs: branch data; Outputs: branch entities. | None. |
| **AttendanceModule** | Handles creation of attendance records, QR code generation, geolocation (optional) and retrieval of attendance history. | Inputs: QR scan payload, timestamp; Outputs: attendance entries. | UsersModule, ShiftsModule, Redis (for QR tokens). |
| **ShiftsModule** | CRUD operations for shifts, assignment of users to shifts, shift approvals. | Inputs: shift details and assignments; Outputs: shift entities and assignments. | UsersModule, BranchesModule. |
| **LeaveModule** | Submission and approval of leave requests.  Notification of supervisors/managers. | Inputs: leave request details; Outputs: leave records with statuses. | UsersModule, BranchesModule. |
| **ReportsModule** | Generates aggregated reports for attendance, shifts and leave.  Implements filtering by branch, user, date range and role. | Inputs: report query parameters; Outputs: report data (tables/charts). | AttendanceModule, ShiftsModule, LeaveModule, UsersModule. |
| **CommonModule** | Provides shared utilities (exceptions, logging, interceptors, configuration service). | Inputs: configuration; Outputs: shared providers. | All other modules. |

## API Surface Draft

The API will follow REST principles.  Below is a high‑level outline of endpoints (HTTP verbs omitted for brevity):

- **Auth:** `/auth/login` (POST), `/auth/refresh` (POST), `/auth/me` (GET), `/auth/logout` (POST)
- **Users:** `/users` (GET, POST), `/users/:id` (GET, PATCH, DELETE)
- **Roles/Permissions:** `/roles` (GET, POST), `/roles/:id` (PATCH, DELETE)
- **Branches:** `/branches` (GET, POST), `/branches/:id` (GET, PATCH, DELETE)
- **Attendance:** `/attendance` (GET), `/attendance/qr` (GET – returns current QR code), `/attendance/scan` (POST – submit scan with QR token and optional geolocation), `/attendance/:id` (GET)
- **Shifts:** `/shifts` (GET, POST), `/shifts/:id` (GET, PATCH, DELETE), `/shifts/:id/assign` (POST)
- **Leave:** `/leave` (GET – list my requests), `/leave` (POST – submit request), `/leave/:id` (GET, PATCH – approve/reject), `/leave/approvals` (GET – supervisor view)
- **Reports:** `/reports/attendance` (GET with query params), `/reports/shifts` (GET), `/reports/leave` (GET)

All endpoints will require authentication and will enforce RBAC via guards.  Errors will be standardised and follow HTTP status code conventions.

## Database Entities Draft

| Entity | Key Fields | Relationships |
|------|-----------|---------------|
| **User** | `id`, `username`, `passwordHash`, `fullName`, `email`, `roleId`, `branchId`, `createdAt`, `updatedAt`, `status` | Many‑to‑one with **Role**; Many‑to‑one with **Branch**; One‑to‑many with **AttendanceRecord**, **LeaveRequest**, **ShiftAssignment**. |
| **Role** | `id`, `name`, `description` | One‑to‑many with **User**; Many‑to‑many with **Permission** (via RolePermission). |
| **Permission** | `id`, `action`, `resource` | Many‑to‑many with **Role**. |
| **Branch** | `id`, `name`, `location`, `managerId`, `createdAt`, `updatedAt` | One‑to‑many with **User**; One‑to‑many with **Shift**; One‑to‑many with **AttendanceRecord**. |
| **Shift** | `id`, `name`, `branchId`, `startTime`, `endTime`, `date`, `createdBy` | Many‑to‑one with **Branch**; One‑to‑many with **ShiftAssignment**. |
| **ShiftAssignment** | `id`, `shiftId`, `userId`, `status` (assigned, confirmed, swapped) | Many‑to‑one with **Shift**; Many‑to‑one with **User**. |
| **AttendanceRecord** | `id`, `userId`, `branchId`, `shiftId`, `timestamp`, `method` (QR, manual), `geoLocation`, `deviceId` | Many‑to‑one with **User**, **Branch**, **Shift**. |
| **LeaveRequest** | `id`, `userId`, `branchId`, `fromDate`, `toDate`, `type`, `reason`, `status`, `approvedBy`, `approvedAt`, `createdAt` | Many‑to‑one with **User** and **Branch**; `approvedBy` references **User**. |
| **AuditLog** | `id`, `userId`, `action`, `resource`, `resourceId`, `timestamp`, `meta` (JSON) | Many‑to‑one with **User**. |

These entities are deliberately normalised to support complex queries (e.g., join attendance with shifts and branches).  The **AuditLog** table records changes and access events for compliance.

## Summary

Adopting the architecture described above will provide a solid foundation for the Vira platform.  Next.js will handle server‑side rendering and static generation to deliver a fast, localised user experience【820677051717679†L101-L105】【94847718204238†L15-L34】.  NestJS, organised into feature modules【650692815912447†L207-L219】, will encapsulate business logic and expose a clean API over PostgreSQL and Redis.  This modular monolith can scale within a single codebase while remaining extensible for future modules like payroll and finance.
