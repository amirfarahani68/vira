# Domain Model

The Vira attendance platform is built around a set of core business entities and their relationships.  This document describes the conceptual domain model that underpins the database schema defined in the Target Architecture.  While the technical implementation uses PostgreSQL and an ORM, understanding the domain concepts is critical for designing modules, services and user flows.

## Core Entities

### User

Represents an individual who can authenticate and interact with the platform.  Each user has a role and is assigned to a branch.

- **Attributes:** `id`, `username`, `passwordHash`, `fullName`, `email`, `roleId`, `branchId`, `status` (active, inactive), `createdAt`, `updatedAt`.
- **Behaviour:** A user can log in/out, clock in/out, request leave and view personal data.  Managers and supervisors can perform administrative actions.  User accounts may be enabled/disabled.
- **Relationships:** belongs to a **Role**, belongs to a **Branch**, has many **AttendanceRecords**, has many **ShiftAssignments**, has many **LeaveRequests**, and references the user who approves those leave requests.

### Role

Defines the set of permissions granted to a user.  Roles correspond to business roles (manager, supervisor, technician) and can be extended.  A role can be associated with multiple permissions.

- **Attributes:** `id`, `name`, `description`.
- **Behaviour:** Roles group permissions that are enforced via guards in NestJS.  Changing a role’s permissions affects all users with that role.
- **Relationships:** has many **Users**; has many **Permissions** (many‑to‑many via RolePermission).

### Permission

A fine‑grained authorisation rule describing an allowed action on a resource (e.g., `read_attendance`, `approve_leave`).  These are combined into roles.

- **Attributes:** `id`, `action`, `resource`.
- **Relationships:** belongs to many **Roles** via RolePermission.

### Branch

Represents an organisational unit or location.  Branches allow multi‑tenant separation so that users can only view data for the branches to which they are assigned.

- **Attributes:** `id`, `name`, `location`, `managerId` (optional), `createdAt`, `updatedAt`.
- **Relationships:** has many **Users**, has many **Shifts**, has many **AttendanceRecords**, has many **LeaveRequests**.

### Shift

Defines a scheduled work period.  Shifts are assigned to users, and attendance records reference the shift being worked.

- **Attributes:** `id`, `name`, `branchId`, `date`, `startTime`, `endTime`, `createdBy` (User), `createdAt`, `updatedAt`.
- **Relationships:** belongs to a **Branch**; has many **ShiftAssignments**.

### ShiftAssignment

Links a user to a shift.  Tracks assignment status (assigned, accepted, swapped) and provides context for attendance.

- **Attributes:** `id`, `shiftId`, `userId`, `status`, `assignedAt`, `updatedAt`.
- **Relationships:** belongs to a **Shift**, belongs to a **User**.

### AttendanceRecord

Represents a single clock‑in or clock‑out event.  The record includes context such as the branch, shift and method of attendance.

- **Attributes:** `id`, `userId`, `branchId`, `shiftId` (optional), `timestamp`, `method` (QR, manual), `geoLocation` (lat/lon), `deviceId`.
- **Behaviour:** Attendance records are immutable; they can be corrected only by authorised users (with appropriate audit logging).
- **Relationships:** belongs to a **User**, belongs to a **Branch**, optional belongs to a **Shift**.

### LeaveRequest

Records a user’s request to take leave.  Includes dates, type of leave and approval status.  The request must be reviewed by a supervisor or manager.

- **Attributes:** `id`, `userId`, `branchId`, `fromDate`, `toDate`, `type` (vacation, sick, etc.), `reason`, `status` (pending, approved, rejected), `approvedBy` (User), `approvedAt`, `createdAt`.
- **Behaviour:** Users can create and cancel their own requests before approval; supervisors/managers can approve or reject requests.  Approval events are logged.
- **Relationships:** belongs to a **User** (requester), belongs to a **Branch**; references **User** as approver.

### AuditLog

Captures significant actions performed in the system for compliance and troubleshooting.

- **Attributes:** `id`, `userId`, `action`, `resource`, `resourceId`, `timestamp`, `meta` (JSON with contextual details).
- **Behaviour:** Audit logs are write‑only and cannot be modified.  They allow administrators to trace operations such as approvals, shift edits and login attempts.
- **Relationships:** belongs to a **User**.

## Relationships Diagram (Textual)

Below is a textual depiction of the relationships among the core entities:

```
User (1) ─── (1) Role
   │          │
   ├─< ShiftAssignment >─┤
   │          │
   └─< AttendanceRecord
   │          │
   └─< LeaveRequest

Role ───< RolePermission >─── Permission

Branch ───< User
    │
    └─< Shift
        │
        └─< ShiftAssignment
    └─< AttendanceRecord
    └─< LeaveRequest
```

Arrows (───) represent one‑to‑many relationships.  For example, a **Branch** has many **Users**, **Shifts**, **AttendanceRecords** and **LeaveRequests**.  **ShiftAssignments** link **Users** to **Shifts**.

## Domain Events and Invariants

- **Clock‑In Event:** When a QR code is scanned, the system verifies that the token is valid, associates it with a branch and user, ensures the user has a shift assignment (if required) and then creates an **AttendanceRecord**.
- **Shift Assignment Event:** Assigning a user to a shift creates a **ShiftAssignment** record and may notify the user.
- **Leave Request Event:** Submitting a leave request creates a **LeaveRequest** in `pending` status.  Approval updates `status`, sets `approvedBy` and `approvedAt`, and creates an **AuditLog** entry.

These events enforce invariants such as **no overlapping leave and shift assignments** and **attendance records must belong to valid users and branches**.

## Multi‑Branch Considerations

Because the platform will support multiple branches, every entity is scoped to a branch either directly (via `branchId`) or indirectly (via the user’s branch assignment).  RBAC guards will ensure that users can only operate on entities belonging to their branch (unless they have cross‑branch permissions).

## Conclusion

The domain model provides the foundation for the database schema and API.  By clearly defining entities, relationships and behaviours, we ensure consistency between the frontend, backend and database implementations.  This model is deliberately extensible so that future modules (e.g., payroll) can build on top of the same user, branch and attendance concepts.
