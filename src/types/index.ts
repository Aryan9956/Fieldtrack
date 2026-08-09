export type Role = 'SUPER_ADMIN' | 'OWNER' | 'EMPLOYEE';

export type AccessStatus = 'PENDING' | 'ACTIVE' | 'EXPIRED' | 'SUSPENDED' | 'REVOKED';

export type EmployeeStatus = 'OFFLINE' | 'WORKING' | 'ON_BREAK';

export type WorkSessionStatus = 'ACTIVE' | 'COMPLETED' | 'ABANDONED';

export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export type TaskStatus = 'ASSIGNED' | 'ACCEPTED' | 'IN_PROGRESS' | 'COMPLETED';

export type SubscriptionStatus = 'MANUAL' | 'ACTIVE' | 'PAST_DUE' | 'CANCELLED';

export type PaymentStatus = 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED';

export interface UserSession {
  userId: string;
  email: string;
  name: string;
  role: Role;
  organizationId?: string;
  employeeId?: string;
  emailVerified: boolean;
  accessStatus?: AccessStatus;
}

export interface JWTPayload {
  userId: string;
  email: string;
  name: string;
  role: Role;
  organizationId?: string;
  employeeId?: string;
  emailVerified: boolean;
  accessStatus?: AccessStatus;
  exp?: number;
  iat?: number;
}
