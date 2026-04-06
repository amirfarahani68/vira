export type RoleName = 'manager' | 'supervisor' | 'technician';

export interface Role {
  id: string;
  name: RoleName;
  permissions: PermissionName[];
}

export type PermissionName =
  | 'view_attendance'
  | 'manage_shifts'
  | 'approve_leave'
  | 'view_reports'
  | 'manage_users';

export interface User {
  id: string;
  username: string;
  passwordHash?: string; // hashed password (server only)
  name: string;
  roleId: string;
  branchId: string;
}

export interface Branch {
  id: string;
  name: string;
}

export interface Shift {
  id: string;
  name: string;
  startTime: string; // ISO time
  endTime: string; // ISO time
  branchId: string;
}

export interface ShiftAssignment {
  id: string;
  userId: string;
  shiftId: string;
  date: string; // ISO date
}

export interface AttendanceRecord {
  id: string;
  userId: string;
  timestamp: string; // ISO string
  type: 'checkin' | 'checkout';
  branchId: string;
}

export interface LeaveRequest {
  id: string;
  userId: string;
  startDate: string; // ISO date
  endDate: string; // ISO date
  status: 'pending' | 'approved' | 'rejected';
  branchId: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  timestamp: string;
  branchId: string;
}
