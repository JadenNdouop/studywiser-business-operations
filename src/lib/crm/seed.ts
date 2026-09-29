import type { Client, Lead, LeadActivity } from "./types";

export interface CrmData {
  leads: Lead[];
  activities: LeadActivity[];
  clients: Client[];
}

/** Date helpers so the seed always looks "current" relative to today. */
function iso(daysFromNow: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return d.toISOString();
}
function ymd(daysFromNow: number): string {
  return iso(daysFromNow).slice(0, 10);
}

/**
 * Example CRM data so the screens aren't empty on first look. Clearly example
 * records — the user can delete them and add their own; everything persists in
 * the browser.
 */
export function seedData(): CrmData {
  const clients: Client[] = [
    {
      id: "seed-client-1",
      family_name: "Okafor Family",
      primary_contact_name: "Amara Okafor",
      email: "amara.okafor@example.com",
      phone: "(202) 555-0148",
      status: "active",
      acquisition_source: "referral",
      customer_since: ymd(-120),
      billing_notes: "Monthly, invoiced on the 1st.",
      notes: "Two students — algebra and SAT prep.",
      created_at: iso(-120),
      updated_at: iso(-5),
    },
    {
      id: "seed-client-2",
      family_name: "Nguyen Family",
      primary_contact_name: "David Nguyen",
      email: "d.nguyen@example.com",
      phone: "(202) 555-0176",
      status: "active",
      acquisition_source: "google",
      customer_since: ymd(-60),
      notes: "Weekly reading tutoring for 4th grader.",
      created_at: iso(-60),
      updated_at: iso(-8),
    },
    {
      id: "seed-client-3",
      family_name: "Patel Family",
      primary_contact_name: "Rina Patel",
      email: "rina.patel@example.com",
      phone: "(202) 555-0133",
      status: "paused",
      acquisition_source: "instagram",
      customer_since: ymd(-200),
      notes: "Paused over the summer; expected to resume in fall.",
      created_at: iso(-200),
      updated_at: iso(-30),
    },
  ];

  const leads: Lead[] = [
    {
      id: "seed-lead-1",
      guardian_name: "Michelle Carter",
      student_name: "Jayden Carter",
      grade: "9th",
      subject_needed: "Algebra I",
      phone: "(202) 555-0192",
      email: "michelle.carter@example.com",
      location: "Silver Spring, MD",
      lead_source: "website",
      date_received: ymd(-2),
      estimated_value: 1200,
      pipeline_stage: "new_lead",
      next_follow_up_date: ymd(1),
      notes: "Filled out the website form; wants twice-weekly sessions.",
      created_at: iso(-2),
      updated_at: iso(-2),
    },
    {
      id: "seed-lead-2",
      guardian_name: "Robert Kim",
      student_name: "Sophie Kim",
      grade: "11th",
      subject_needed: "SAT Prep",
      phone: "(202) 555-0117",
      email: "rkim@example.com",
      location: "Bethesda, MD",
      lead_source: "referral",
      date_received: ymd(-6),
      estimated_value: 2400,
      pipeline_stage: "contacted",
      last_contact_date: ymd(-3),
      next_follow_up_date: ymd(-1),
      notes: "Referred by the Okafor family. Left a voicemail.",
      created_at: iso(-6),
      updated_at: iso(-3),
    },
    {
      id: "seed-lead-3",
      guardian_name: "Angela Reyes",
      student_name: "Mateo Reyes",
      grade: "7th",
      subject_needed: "Reading & Writing",
      phone: "(202) 555-0154",
      email: "a.reyes@example.com",
      location: "Washington, DC",
      lead_source: "instagram",
      date_received: ymd(-10),
      estimated_value: 960,
      pipeline_stage: "consultation",
      last_contact_date: ymd(-2),
      next_follow_up_date: ymd(2),
      notes: "Consultation booked for next week.",
      created_at: iso(-10),
      updated_at: iso(-2),
    },
    {
      id: "seed-lead-4",
      guardian_name: "Thomas Wright",
      student_name: "Ella Wright",
      grade: "10th",
      subject_needed: "Chemistry",
      phone: "(202) 555-0188",
      email: "twright@example.com",
      location: "Arlington, VA",
      lead_source: "google",
      date_received: ymd(-14),
      estimated_value: 1600,
      pipeline_stage: "interested",
      last_contact_date: ymd(-4),
      next_follow_up_date: ymd(3),
      notes: "Very interested; comparing us with one other tutor.",
      created_at: iso(-14),
      updated_at: iso(-4),
    },
    {
      id: "seed-lead-5",
      guardian_name: "Priya Sharma",
      student_name: "Aarav Sharma",
      grade: "8th",
      subject_needed: "Pre-Algebra",
      phone: "(202) 555-0161",
      email: "priya.s@example.com",
      location: "Rockville, MD",
      lead_source: "school",
      date_received: ymd(-18),
      estimated_value: 1100,
      pipeline_stage: "enrollment_pending",
      last_contact_date: ymd(-1),
      next_follow_up_date: ymd(1),
      notes: "Ready to enroll — sending the agreement.",
      created_at: iso(-18),
      updated_at: iso(-1),
    },
    {
      id: "seed-lead-6",
      guardian_name: "James Bell",
      student_name: "Olivia Bell",
      grade: "12th",
      subject_needed: "Calculus",
      phone: "(202) 555-0129",
      email: "jbell@example.com",
      location: "Fairfax, VA",
      lead_source: "word_of_mouth",
      date_received: ymd(-25),
      estimated_value: 1800,
      pipeline_stage: "lost",
      last_contact_date: ymd(-12),
      notes: "Went with a family friend instead.",
      created_at: iso(-25),
      updated_at: iso(-12),
    },
  ];

  const activities: LeadActivity[] = [
    {
      id: "seed-act-1",
      lead_id: "seed-lead-2",
      activity_type: "call",
      contact_method: "phone",
      notes: "Left a voicemail introducing StudyWiser.",
      occurred_at: iso(-3),
    },
    {
      id: "seed-act-2",
      lead_id: "seed-lead-3",
      activity_type: "email",
      contact_method: "email",
      notes: "Sent consultation booking link.",
      occurred_at: iso(-5),
    },
    {
      id: "seed-act-3",
      lead_id: "seed-lead-3",
      activity_type: "meeting",
      notes: "Confirmed consultation time for next week.",
      occurred_at: iso(-2),
    },
    {
      id: "seed-act-4",
      lead_id: "seed-lead-4",
      activity_type: "call",
      contact_method: "phone",
      notes: "Discussed availability and pricing; will decide by Friday.",
      occurred_at: iso(-4),
    },
  ];

  return { leads, activities, clients };
}
