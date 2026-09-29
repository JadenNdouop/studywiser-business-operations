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
