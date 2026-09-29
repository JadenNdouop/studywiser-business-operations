/**
 * Demo seed data for the Operations domain. Dates are computed relative to
 * "today" so the calendar and due-date views always look current, whenever the
 * demo is opened.
 */

import type {
  BusinessDocument,
  BusinessEvent,
  Project,
  Sop,
  Subscription,
  Task,
  Vendor,
} from "./types";

export interface OperationsData {
  projects: Project[];
  tasks: Task[];
  events: BusinessEvent[];
  vendors: Vendor[];
  subscriptions: Subscription[];
  documents: BusinessDocument[];
  sops: Sop[];
}

function iso(): string {
  return new Date().toISOString();
}

/** A YYYY-MM-DD date, `days` from today (negative = past). */
function day(days: number): string {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

/** A YYYY-MM-DD date on the Nth day of the current month. */
function thisMonth(dayOfMonth: number): string {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(dayOfMonth);
  return d.toISOString().slice(0, 10);
}

export function seedData(): OperationsData {
  const ts = iso();

  const projects: Project[] = [
    {
      id: "seed-pr-1",
      name: "Fall enrollment campaign",
      description:
        "Drive new tutoring sign-ups for the fall semester across paid and referral channels.",
      owner: "StudyWiser Owner",
      start_date: day(-20),
      due_date: day(25),
      priority: "high",
      status: "in_progress",
      progress_percent: 45,
      budget: 4000,
      notes: "Coordinating with the marketing vendor on ad creative.",
      created_at: ts,
      updated_at: ts,
    },
    {
      id: "seed-pr-2",
      name: "Tutor onboarding revamp",
      description:
        "Rebuild the tutor onboarding checklist and paperwork flow to cut ramp-up time.",
      owner: "StudyWiser Owner",
      start_date: day(-8),
      due_date: day(40),
      priority: "medium",
      status: "planned",
      progress_percent: 10,
      created_at: ts,
      updated_at: ts,
    },
    {
      id: "seed-pr-3",
      name: "2025 tax prep",
      description: "Gather records and hand off to the accountant.",
      owner: "StudyWiser Owner",
      start_date: day(-40),
      due_date: day(-2),
      priority: "urgent",
      status: "completed",
      progress_percent: 100,
      created_at: ts,
      updated_at: ts,
    },
  ];

  const tasks: Task[] = [
    {
      id: "seed-tk-1",
      title: "Draft fall promo landing page",
      project_id: "seed-pr-1",
      assignee: "StudyWiser Owner",
      priority: "high",
      due_date: day(3),
      status: "in_progress",
      created_at: ts,
    },
    {
      id: "seed-tk-2",
      title: "Approve ad creative from vendor",
      project_id: "seed-pr-1",
      assignee: "StudyWiser Owner",
      priority: "medium",
      due_date: day(6),
      status: "to_do",
      created_at: ts,
    },
    {
      id: "seed-tk-3",
      title: "Set referral bonus amount",
      project_id: "seed-pr-1",
      priority: "low",
      due_date: day(-1),
      status: "completed",
      created_at: ts,
      completed_at: ts,
    },
    {
      id: "seed-tk-4",
      title: "Write new tutor welcome email",
      project_id: "seed-pr-2",
      assignee: "StudyWiser Owner",
      priority: "medium",
      due_date: day(12),
      status: "to_do",
      created_at: ts,
    },
    {
      id: "seed-tk-5",
      title: "Collect W-9s from Q3 contractors",
      project_id: "seed-pr-2",
      priority: "high",
      due_date: day(-3),
      status: "blocked",
      created_at: ts,
    },
    {
      id: "seed-tk-6",
      title: "Renew business license",
      assignee: "StudyWiser Owner",
      priority: "high",
      due_date: day(9),
      status: "to_do",
      created_at: ts,
    },
  ];

  const events: BusinessEvent[] = [
    {
      id: "seed-ev-1",
      title: "Payroll run",
      event_type: "payroll",
      event_date: thisMonth(15),
      notes: "Semi-monthly payroll for staff and tutors.",
      created_at: ts,
    },
    {
      id: "seed-ev-2",
      title: "Monthly invoicing cycle",
      event_type: "invoice_cycle",
      event_date: thisMonth(1),
      created_at: ts,
    },
    {
      id: "seed-ev-3",
      title: "Team check-in",
      event_type: "team_meeting",
      event_date: day(2),
      notes: "Weekly ops sync.",
      created_at: ts,
    },
    {
      id: "seed-ev-4",
      title: "Fall campaign launch",
      event_type: "marketing_launch",
      event_date: day(7),
      created_at: ts,
    },
    {
      id: "seed-ev-5",
      title: "Quarterly tax filing",
      event_type: "tax_deadline",
      event_date: thisMonth(28),
      notes: "Estimated quarterly taxes due.",
      created_at: ts,
    },
  ];

  const vendors: Vendor[] = [
    {
      id: "seed-vn-1",
      name: "Google Workspace",
      category: "Software",
      contact_name: "Billing",
      email: "billing@google.com",
      website: "workspace.google.com",
      service_provided: "Email, docs, and shared drive for the team",
      cost: 72,
      billing_frequency: "monthly",
      start_date: day(-300),
      renewal_date: day(8),
      status: "active",
      created_at: ts,
    },
    {
      id: "seed-vn-2",
      name: "Rivera & Associates CPA",
      category: "Accounting",
      contact_name: "Elena Rivera",
      email: "elena@riveracpa.com",
      service_provided: "Bookkeeping and annual tax filing",
      cost: 350,
      billing_frequency: "monthly",
      start_date: day(-180),
      renewal_date: day(45),
      status: "active",
      created_at: ts,
    },
    {
      id: "seed-vn-3",
      name: "PrintWorks Local",
      category: "Marketing",
      service_provided: "Flyers and printed handouts for community events",
      cost: 200,
      billing_frequency: "one_time",
      status: "inactive",
      created_at: ts,
    },
  ];

  const subscriptions: Subscription[] = [
    {
      id: "seed-sb-1",
      service_name: "QuickBooks Online",
      vendor_id: undefined,
      category: "Finance",
      monthly_cost: 30,
      billing_frequency: "monthly",
      renewal_date: day(3),
      payment_method: "Visa •• 4242",
      owner: "StudyWiser Owner",
      status: "active",
      created_at: ts,
    },
    {
      id: "seed-sb-2",
      service_name: "Canva Pro",
      category: "Marketing",
      monthly_cost: 15,
      billing_frequency: "monthly",
      renewal_date: day(19),
      payment_method: "Visa •• 4242",
      owner: "StudyWiser Owner",
      status: "active",
      created_at: ts,
    },
    {
      id: "seed-sb-3",
      service_name: "Zoom Business",
      category: "Software",
      annual_cost: 1800,
      billing_frequency: "annual",
      renewal_date: day(120),
      payment_method: "Visa •• 4242",
      owner: "StudyWiser Owner",
      status: "active",
      created_at: ts,
    },
    {
      id: "seed-sb-4",
      service_name: "Old scheduling tool",
      category: "Software",
      monthly_cost: 25,
      billing_frequency: "monthly",
      status: "cancelled",
      created_at: ts,
    },
  ];

  const documents: BusinessDocument[] = [
    {
      id: "seed-dc-1",
      title: "Independent contractor agreement (template)",
      category: "contracts",
      external_url: "https://drive.google.com/example-contractor-agreement",
      notes: "Standard W-9 contractor template for new tutors.",
      created_at: ts,
    },
    {
      id: "seed-dc-2",
      title: "2025 business insurance policy",
      category: "legal",
      external_url: "https://drive.google.com/example-insurance-policy",
      created_at: ts,
    },
    {
      id: "seed-dc-3",
      title: "Brand style guide",
      category: "marketing",
      external_url: "https://drive.google.com/example-brand-guide",
      notes: "Logo, colors, and voice for all StudyWiser materials.",
      created_at: ts,
    },
  ];

  const sops: Sop[] = [
    {
      id: "seed-sop-1",
      title: "Onboarding a new tutor",
      category: "Tutors",
      description: "Steps from offer accepted to first session ready.",
      content:
        "1. Send the contractor agreement and collect a signed W-9.\n2. Create their worker record in Workforce.\n3. Add them to Google Workspace and the shared drive.\n4. Schedule a 30-minute orientation call.\n5. Assign their first client and confirm availability.",
      owner: "StudyWiser Owner",
      version: 2,
      status: "active",
      updated_at: ts,
    },
    {
      id: "seed-sop-2",
      title: "Monthly invoicing run",
      category: "Finance",
      description: "How invoices go out each month.",
      content:
        "1. On the 1st, generate invoices for all active clients.\n2. Review line items against sessions delivered.\n3. Send invoices and mark them as sent.\n4. Follow up on anything unpaid after 14 days.",
      owner: "StudyWiser Owner",
      version: 1,
      status: "active",
      updated_at: ts,
    },
    {
      id: "seed-sop-3",
      title: "Handling a refund request",
      category: "Clients",
      content:
        "Draft — outline the refund policy and approval steps here.",
      owner: "StudyWiser Owner",
      version: 1,
      status: "draft",
      updated_at: ts,
    },
  ];

  return { projects, tasks, events, vendors, subscriptions, documents, sops };
}
