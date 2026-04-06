# Product Scope for the “Vira” Attendance Platform

## Context

The current Vira product is a **static demo** implemented in plain HTML, CSS and JavaScript. It is a **minimum‑viable prototype** used to validate user flows and basic functionality.  The demo supports three roles (manager, supervisor and technician) and demonstrates attendance tracking (with a rotating QR code), shift management, leave requests and simple reports.  All data is stored in the browser’s **localStorage**, so nothing is persisted beyond the individual user’s browser session.

The organisation plans to evolve this demo into a **production‑grade enterprise platform**.  The long‑term vision is to build a modular attendance and workforce management suite that can later be extended to payroll, financial accounting, petty cash and cheque management.  The target technology stack is **Next.js** for the frontend, **NestJS** for the backend API, **PostgreSQL** as the relational database, and **Redis** for caching and background jobs.  The platform will be deployed on **Liara**.

## Product Direction

The product will support multiple branches and role‑based access control (RBAC) from the start.  The following business capabilities define the overall direction:

- **Attendance:** allow employees to clock in/out using rotating QR codes, manual input or future geolocation.  Attendance records must include timestamps, branch and user information.
- **Shift management:** define shifts, assign employees to shifts and allow supervisors/managers to edit or swap assignments.
- **Leave management:** employees submit leave requests, supervisors approve/reject and managers have oversight.  Leave types include vacation, sick and custom categories.
- **Reporting:** managers and supervisors can view attendance summaries, shift utilisation and leave balances.  Reports can be filtered by branch, date range and role.
- **RBAC and multi‑branch:** the system must enforce role permissions and ensure users only access data for branches they are associated with.  Administrators can manage users, roles and branch assignments.

### Future extensions

Once the core attendance/shift/leave functionality is stable, the platform should be extensible to support payroll calculations, finance modules (such as petty cash and cheque management) and integrations with third‑party systems.  The architecture should therefore favour **modular monolith** principles and a shared domain model rather than microservices.

## Roles and Languages

The product recognises three primary roles:

| Role | Responsibilities |
|-----|-------------------|
| **Manager** | Oversees one or more branches, approves leave requests, manages supervisors and technicians, and has access to high‑level reports. |
| **Supervisor** | Manages shifts within a branch, approves technician leave requests, and reviews attendance records. |
| **Technician** | Submits attendance by scanning QR codes, requests leave and views personal schedule. |

UI content will be presented in **Persian (Farsi)** to align with the target user base.  Code, comments and architecture documentation will be written in **English** to simplify maintenance and collaboration with broader technical communities.

## Phase 1 Goals

The initial production release (Phase 1) will focus on the following scope:

1. **Attendance:** implement rotating QR codes via the backend, secure scanning from the frontend and persist attendance records in PostgreSQL.
2. **Shift management:** CRUD operations for shifts, assignment of employees to shifts and supervisor approval flows.
3. **Leave approvals:** allow employees to submit leave requests, supervisors/managers to approve or reject and record the outcome.
4. **Reporting:** deliver basic reports for attendance, shift coverage and leave statistics per branch and role.
5. **RBAC & multi‑branch:** enforce roles and permissions at both frontend and backend layers and support multiple branch contexts.

These goals will be implemented using a **modular monolith** approach that organises code into discrete modules (e.g., Auth, Users, Attendance, Shifts, Leave, Reports) without introducing network boundaries.  This enables cohesive development, straightforward transaction management and simpler deployment while keeping the codebase extensible for future modules.
