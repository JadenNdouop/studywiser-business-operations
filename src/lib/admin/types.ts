/**
 * Admin domain types. Mirrors the user_profiles / roles / user_roles tables.
 * Roles are a fixed, enum-constrained set of seven (see the roles table).
 */
import type { BadgeProps } from "@/components/ui/badge";

export type RoleName =
  | "owner"
  | "admin"
  | "operations_manager"
  | "finance"
  | "tutor"
  | "contractor"
  | "employee";

export interface RoleMeta {
  name: RoleName;
  label: string;
  description: string;
  variant: NonNullable<BadgeProps["variant"]>;
  /**
   * Current access level enforced by the database (RLS). "admin" = owner/admin
   * (full control incl. users, roles, settings, audit log); "staff" = access to
   * business data. Finer per-role permissions are reserved for later.
   */
  access: "admin" | "staff";
}

/** The seven roles the system understands, in order of precedence. */
export const ROLES: RoleMeta[] = [
  {
    name: "owner",
    label: "Owner",
    description: "Full control of everything, including users and settings.",
    variant: "default",
    access: "admin",
  },
  {
    name: "admin",
    label: "Admin",
    description: "Manage users, roles, settings, and all business data.",
    variant: "info",
    access: "admin",
  },
  {
    name: "operations_manager",
    label: "Operations Manager",
    description: "Run projects, tasks, vendors, and day-to-day operations.",
    variant: "secondary",
    access: "staff",
  },
  {
    name: "finance",
    label: "Finance",
    description: "Access invoices, payments, expenses, and reporting.",
    variant: "success",
    access: "staff",
  },
  {
    name: "tutor",
    label: "Tutor",
    description: "A tutor on the roster. Reserved for future tutor access.",
    variant: "warning",
    access: "staff",
  },
  {
    name: "contractor",
    label: "Contractor",
    description: "A contracted worker. Reserved for future access.",
    variant: "muted",
    access: "staff",
  },
  {
    name: "employee",
    label: "Employee",
    description: "A general staff member. Reserved for future access.",
    variant: "outline",
    access: "staff",
  },
];

export const ROLE_META: Record<RoleName, RoleMeta> = Object.fromEntries(
  ROLES.map((r) => [r.name, r]),
) as Record<RoleName, RoleMeta>;

export interface AdminUser {
  id: string;
  full_name: string;
  created_at: string;
  roles: RoleName[];
  /** Only known for the signed-in user (email lives in auth.users). */
  email?: string;
  /** True for the currently signed-in account. */
  isCurrentUser?: boolean;
}
