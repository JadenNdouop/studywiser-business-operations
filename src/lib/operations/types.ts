/**
 * Operations domain types. Mirror the projects / tasks / business_events
 * tables in supabase/migrations. (Vendors, subscriptions, documents, and SOPs
 * join this domain in the second half of Phase 5.)
 *
 * In demo mode there are no auth users, so "owner" and "assignee" are plain
 * text names rather than user-id foreign keys.
 */

export type Priority = "low" | "medium" | "high" | "urgent";
export type ProjectStatus =
  | "planned"
  | "in_progress"
  | "blocked"
  | "completed"
  | "cancelled";
export type TaskStatus = "to_do" | "in_progress" | "blocked" | "completed";
export type EventType =
  | "payroll"
  | "invoice_cycle"
  | "tax_deadline"
  | "marketing_launch"
  | "team_meeting"
  | "vendor_renewal"
  | "contract_expiration"
  | "project_milestone"
  | "filing"
  | "other";

export interface Project {
  id: string;
  name: string;
  description?: string;
  owner?: string;
  start_date?: string; // YYYY-MM-DD
  due_date?: string;
  priority?: Priority;
  status: ProjectStatus;
  progress_percent?: number; // 0–100
  budget?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  project_id?: string;
  assignee?: string;
  priority?: Priority;
  due_date?: string;
  status: TaskStatus;
  created_at: string;
  completed_at?: string;
}

export interface BusinessEvent {
  id: string;
  title: string;
  event_type?: EventType;
  event_date: string; // YYYY-MM-DD
  notes?: string;
  created_at: string;
}

// --- Vendors / Subscriptions / Documents / SOPs (Phase 5 chunk 2) ---

export type BillingFrequency = "one_time" | "monthly" | "quarterly" | "annual";
export type VendorStatus = "active" | "inactive";
export type SubBillingFrequency = "monthly" | "annual";
export type SubscriptionStatus = "active" | "cancelled";
export type DocumentCategory =
  | "legal"
  | "finance"
  | "hr"
  | "tutors"
  | "clients"
  | "marketing"
  | "operations"
  | "policies"
  | "templates"
  | "contracts";
export type SopStatus = "draft" | "active" | "archived";

export interface Vendor {
  id: string;
  name: string;
  category?: string;
  contact_name?: string;
  email?: string;
  website?: string;
  service_provided?: string;
  cost?: number;
  billing_frequency?: BillingFrequency;
  start_date?: string;
  renewal_date?: string;
  status: VendorStatus;
  notes?: string;
  created_at: string;
}

export interface Subscription {
  id: string;
  service_name: string;
  vendor_id?: string;
  category?: string;
  monthly_cost?: number;
  annual_cost?: number;
  billing_frequency?: SubBillingFrequency;
  renewal_date?: string;
  payment_method?: string;
  owner?: string;
  status: SubscriptionStatus;
  created_at: string;
}

/** A document *record* — metadata + an external link (no file storage in MVP). */
export interface BusinessDocument {
  id: string;
  title: string;
  category?: DocumentCategory;
  external_url: string;
  notes?: string;
  created_at: string;
}

export interface Sop {
  id: string;
  title: string;
  category?: string;
  description?: string;
  content: string;
  owner?: string;
  version: number;
  status: SopStatus;
  updated_at: string;
}

export const PRIORITIES: Priority[] = ["low", "medium", "high", "urgent"];
export const PROJECT_STATUSES: ProjectStatus[] = [
  "planned",
  "in_progress",
  "blocked",
  "completed",
  "cancelled",
];
export const TASK_STATUSES: TaskStatus[] = [
  "to_do",
  "in_progress",
  "blocked",
  "completed",
];
export const EVENT_TYPES: EventType[] = [
  "payroll",
  "invoice_cycle",
  "tax_deadline",
  "marketing_launch",
  "team_meeting",
  "vendor_renewal",
  "contract_expiration",
  "project_milestone",
  "filing",
  "other",
];

export const BILLING_FREQUENCIES: BillingFrequency[] = [
  "one_time",
  "monthly",
  "quarterly",
  "annual",
];
export const VENDOR_STATUSES: VendorStatus[] = ["active", "inactive"];
export const SUB_BILLING_FREQUENCIES: SubBillingFrequency[] = [
  "monthly",
  "annual",
];
export const SUBSCRIPTION_STATUSES: SubscriptionStatus[] = [
  "active",
  "cancelled",
];
export const DOCUMENT_CATEGORIES: DocumentCategory[] = [
  "legal",
  "finance",
  "hr",
  "tutors",
  "clients",
  "marketing",
  "operations",
  "policies",
  "templates",
  "contracts",
];
export const SOP_STATUSES: SopStatus[] = ["draft", "active", "archived"];
