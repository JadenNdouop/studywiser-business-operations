/**
 * Demo seed data for the Operations domain. Dates are computed relative to
 * "today" so the calendar and due-date views always look current, whenever the
 * demo is opened.
 */

import type { BusinessEvent, Project, Task } from "./types";

export interface OperationsData {
  projects: Project[];
  tasks: Task[];
  events: BusinessEvent[];
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

  return { projects, tasks, events };
}
