# Feature Audit of the Static MVP

This document inventories the features of the current static Vira demo and highlights gaps and technical debt.  It is based on the observed behaviour of the HTML/CSS/JS prototype and stakeholder descriptions.

## Feature Inventory

| Feature | Description | Role Access |
|-------|-------------|------------|
| **Authentication (simulated)** | The demo uses hard‑coded role selectors or simple login screens to emulate three roles (manager, supervisor, technician).  There is no real authentication; users simply choose a role. | All |
| **Rotating QR code for attendance** | A QR code is displayed on an “attendance” page and changes every minute to discourage screenshot reuse.  Employees scan the QR from their own device to register presence.  The rotation logic is implemented with client‑side JavaScript timers. | Technician scans; Manager/Supervisor view current QR |
| **Shift management** | A section allows creating and editing shifts with start/end times.  Employees can be assigned to shifts via dropdowns.  Shift data is stored in localStorage. | Supervisor (primary), Manager |
| **Leave requests** | Technicians can submit leave requests via a simple form specifying dates and reasons.  Supervisors/managers can approve or reject from a list of pending requests.  Data lives only in localStorage. | Technician submits; Supervisor/Manager approve |
| **Reports** | The demo shows basic attendance and shift summaries.  Charts/tables are generated on the client based on localStorage data. | Manager, Supervisor |
| **Persistence** | All state (users, shifts, attendance records, leave requests) is stored in `localStorage`.  Clearing browser storage resets the application.  There is no central database or server. | All |

## UI Sections

- **Landing / Role selection page:** prompts the user to select a role.  This acts as a pseudo‑authentication mechanism.
- **Dashboard:** after role selection, a dashboard page displays tiles linking to attendance, shifts, leave and reports.  The layout is the same for all roles, but tiles may be disabled based on role.
- **Attendance page:** shows a rotating QR code and a list of recent attendance records from localStorage.  For technicians, a scanning interface is shown on a separate page.
- **Shift management page:** provides forms to create/edit shifts and assign employees.  A table lists existing shifts.
- **Leave request page:** displays a form to submit leave and a table of pending/approved requests.
- **Reports page:** shows simple charts/tables summarising attendance, shifts and leave.  Filtering options are minimal.

## Role‑Based Behaviour

- **Manager:** has access to all pages.  Can view and edit shifts, approve leave requests and view reports across all technicians.  The demo does not enforce branch constraints.
- **Supervisor:** similar to manager but may have limited report views.  Can approve leave for technicians and manage shifts.  Again, no branch logic exists.
- **Technician:** can scan QR codes to clock in/out, request leave and view personal attendance/shifts.  Cannot edit shifts or see other users’ data.

## Current State Model

The static demo stores data in the browser using a set of JavaScript objects serialised into `localStorage` keys.  For example:

- `users`: an array of user objects with role flags.
- `shifts`: a list of shift objects with `id`, `startTime` and `endTime`.
- `attendanceRecords`: list of `{userId, timestamp, qrCode}`.
- `leaveRequests`: list of `{userId, fromDate, toDate, reason, status}`.

There is **no backend**; therefore state is isolated per browser and per user.  There is also no authentication token or session management.

## Reusable Business Concepts

Despite being a prototype, the following domain concepts can be reused in the full system:

- **User** (with roles and branch assignments).
- **Role** (manager, supervisor, technician; later extendable to more granular permissions).
- **Branch** (implicit in the demo but should be explicit in production).
- **AttendanceRecord** (timestamped clock‑in/out entries associated with a user and a shift).
- **Shift** (start/end times, date, assigned employees).
- **LeaveRequest** (dates, type, status and approvals).
- **Report** (aggregate views of attendance, shifts and leave).

## Limitations & Technical Debt

- **No persistent storage:** using `localStorage` means data is lost when clearing the browser cache and cannot be shared across users or devices.
- **Lack of authentication:** users simply choose a role; there is no user identity, password management or secure session.  This prevents any serious access control.
- **Single‑user context:** the prototype cannot simulate multiple employees interacting concurrently.  There is no concept of branches or multi‑tenant data isolation.
- **Security and abuse:** the rotating QR code is generated on the client and can be easily inspected or reproduced.  There is no server‑side validation to prevent replay or manipulation.
- **No audit logging:** actions such as approvals or shift edits are not logged.  Regulatory or compliance requirements cannot be met.
- **No localisation:** although the UI is in Persian, date/time handling relies on the browser’s locale and does not support the Persian calendar or time zones.
- **No API surface:** because all logic is client‑side, there is no separation between frontend and backend; migrating to a proper architecture will require extracting business logic into services and controllers.

The audit confirms that the static MVP is a proof of concept only.  While the existing flows provide a useful reference for user experience, virtually all technical aspects (auth, persistence, concurrency, security) must be re‑implemented.
