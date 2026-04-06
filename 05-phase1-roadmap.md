# Phase 1 Roadmap

This roadmap outlines the steps required to migrate the static Vira MVP to a production‑ready platform using Next.js, NestJS, PostgreSQL and Redis.  Phase 1 focuses on core features (attendance, shifts, leave approvals, reports) with RBAC and multi‑branch support.

## 1. Project Setup & Scaffolding

1. **Establish Monorepo:** Initialise a monorepo using Nx or Turborepo with workspaces for `apps/web` (Next.js) and `apps/api` (NestJS) and shared libraries (`libs/db`, `libs/auth`, `libs/ui`, `libs/utils`).
2. **Version Control:** Commit the base structure to GitHub with a CI workflow that runs linting, formatting and basic tests.
3. **Configure Environment:** Create `.env.example` with variables for database connection, Redis URL, JWT secret, etc.  Integrate a configuration service in NestJS and Next.js to consume these variables.

## 2. Database & ORM Setup

1. **Choose ORM:** Select Prisma or TypeORM for the backend.  Define schema based on the domain model (User, Role, Branch, Shift, AttendanceRecord, LeaveRequest, etc.).
2. **Migration Scripts:** Implement migration scripts to create tables and seed initial data (roles, permissions, admin user).
3. **Connection & Repository Layer:** Create a database module in NestJS that exports repositories/services for other modules to use.

## 3. Backend Implementation (NestJS)

1. **Auth Module:** Implement registration and login using JWT.  Store password hashes securely and use refresh tokens if necessary.  Implement RBAC guards based on roles and permissions.
2. **Users & Roles Modules:** CRUD endpoints for users, roles and permissions.  Implement branch assignment logic.
3. **Branches Module:** CRUD endpoints for branches and assignment of managers.
4. **Shifts Module:** CRUD endpoints for shifts.  Implement `ShiftAssignment` creation and validation (no overlapping assignments).  Provide endpoints for supervisors to approve shift swaps.
5. **Attendance Module:** Implement QR generation using a Redis‑backed queue.  Provide endpoints to generate the current QR token (`/attendance/qr`) and to submit a scan (`/attendance/scan`).  Validate tokens, create `AttendanceRecord`, and optionally verify geolocation.  Implement manual clock‑in/out fallback.
6. **Leave Module:** Implement submission of leave requests and approval workflow.  Include email or in‑app notifications for supervisors.
7. **Reports Module:** Implement basic report endpoints that aggregate attendance, shift utilisation and leave statistics by branch and date range.
8. **Audit Logging:** Implement a global interceptor or middleware to log significant actions into the `AuditLog` table.
9. **Testing & Validation:** Write unit tests for services and integration tests for controllers.  Use validation pipes and DTOs to enforce data contracts.

## 4. Frontend Implementation (Next.js)

1. **Authentication & RBAC:** Implement login pages and use cookies or bearer tokens to store JWTs.  Create a client‑side auth context and route guards (HOCs or middleware) that redirect users based on role and branch.
2. **Layout & Navigation:** Build a responsive layout with a side navigation bar.  Use dynamic route segments for branch and user context.
3. **Attendance UI:** Display the rotating QR code using data fetched from `/attendance/qr`.  Provide a mobile scanning page that reads QR codes and submits to the backend.  Show attendance history.
4. **Shift Management UI:** Provide forms to create/edit shifts, assign employees and list assignments.  Implement interactive tables with filtering and pagination.
5. **Leave Management UI:** Build forms for technicians to submit leave requests and pages for supervisors/managers to approve or reject.  Provide status indicators and history.
6. **Reporting UI:** Implement dashboards with charts/tables showing attendance totals, shift coverage and leave balances.  Allow filtering by branch, role and date range.
7. **Internationalisation & Calendars:** Use a library (e.g., `react-i18next` or `next-i18next`) for Persian translations.  Integrate a Persian calendar component for date selection.

## 5. Infrastructure & Deployment

1. **Dockerisation:** Create Dockerfiles for the frontend and backend.  Use multi‑stage builds to install dependencies and run production builds.
2. **Liara Configuration:** Define `liara.json` or equivalent to specify build and start commands.  For example, for Next.js: `next build` and `next start`; for NestJS: `npm run build` and `node dist/main.js`.  Configure environment variables through Liara’s dashboard.
3. **CI/CD Pipeline:** Configure GitHub Actions (or Liara’s pipeline) to run tests, lint, build and deploy on push to the `main` branch.  Use secrets for database credentials.
4. **Monitoring & Logs:** Integrate basic logging and error monitoring (e.g., Winston in NestJS).  Plan integration with Liara’s monitoring features or third‑party services.

## 6. Data Migration & Go‑Live

1. **User Import:** If there are existing employees, prepare a migration script to import them into the `User` table with default roles and branch assignments.
2. **Pilot Deployment:** Deploy a staging environment for internal testing.  Gather feedback from managers, supervisors and technicians.
3. **Training & Documentation:** Provide guides in Persian for end users and technical documentation in English for developers.
4. **Go‑Live:** After successful testing, deploy to production.  Monitor system usage and address defects.

## 7. Post‑Launch Activities

- **Performance Tuning:** Optimise database queries and caching.  Consider adding indexes based on usage patterns.
- **Feature Backlog:** Prioritise additional features (notifications, geolocation, payroll integration) for subsequent phases.
- **Security Review:** Conduct a security audit, focusing on RBAC, injection prevention and secure storage of secrets.

## Summary

This roadmap emphasises incremental delivery.  By scaffolding the monorepo, defining the database schema and implementing backend modules first, the team can develop a clean API that the Next.js frontend consumes.  RBAC, multi‑branch logic and audit logging are core to Phase 1 and should not be deferred.  Deploying early to a staging environment on Liara allows stakeholders to validate the system before going live.
