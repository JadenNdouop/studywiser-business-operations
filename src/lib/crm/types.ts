/**
 * CRM domain types. These mirror the `leads`, `lead_activities`, and `clients`
 * tables in supabase/migrations so that swapping the demo store for real
 * Supabase queries later is a 1:1 mapping, not a rewrite.
 */

export type PipelineStage =
  | "new_lead"
  | "contacted"
  | "consultation"
  | "interested"
  | "enrollment_pending"
  | "converted"
  | "lost";

export type LeadSource =
  | "referral"
  | "google"
  | "instagram"
  | "facebook"
  | "website"
  | "school"
  | "community_event"
  | "word_of_mouth"
  | "other";

export type ActivityType =
  | "call"
  | "email"
  | "text"
  | "meeting"
  | "note"
  | "stage_change";

export type ClientStatus = "active" | "paused" | "inactive" | "lost";

export interface Lead {
  id: string;
  guardian_name: string;
  student_name?: string;
  grade?: string;
  subject_needed?: string;
  phone?: string;
  email?: string;
  location?: string;
  lead_source?: LeadSource;
  date_received: string; // YYYY-MM-DD
  estimated_value?: number;
  pipeline_stage: PipelineStage;
  last_contact_date?: string;
  next_follow_up_date?: string;
  notes?: string;
  converted_client_id?: string;
  created_at: string;
  updated_at: string;
}

export interface LeadActivity {
  id: string;
  lead_id: string;
  activity_type: ActivityType;
  contact_method?: string;
  notes?: string;
  occurred_at: string; // ISO timestamp
}

export interface Client {
  id: string;
  family_name: string;
  primary_contact_name?: string;
  email?: string;
  phone?: string;
  status: ClientStatus;
  acquisition_source?: string;
  customer_since?: string;
  billing_notes?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

/** Ordered pipeline stages that a lead flows through (excludes the terminal 'lost'). */
export const PIPELINE_STAGES: PipelineStage[] = [
  "new_lead",
  "contacted",
  "consultation",
  "interested",
  "enrollment_pending",
  "converted",
];

/** Every selectable stage, including 'lost'. */
export const ALL_STAGES: PipelineStage[] = [...PIPELINE_STAGES, "lost"];

export const LEAD_SOURCES: LeadSource[] = [
  "referral",
  "google",
  "instagram",
  "facebook",
  "website",
  "school",
  "community_event",
  "word_of_mouth",
  "other",
];

export const ACTIVITY_TYPES: ActivityType[] = [
  "call",
  "email",
  "text",
  "meeting",
  "note",
];

export const CLIENT_STATUSES: ClientStatus[] = [
  "active",
  "paused",
  "inactive",
  "lost",
];
