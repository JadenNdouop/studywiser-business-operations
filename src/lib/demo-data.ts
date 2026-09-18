/**
 * ⚠️  DEMO DATA — NOT REAL.
 *
 * Phase 1 renders the dashboard from these static placeholder numbers so the
 * layout is real before any live queries exist. Every value here is invented.
 * These get replaced with live `/lib/reporting` queries in Phase 6; nothing in
 * this file should ever be treated as an actual StudyWiser figure.
 */

export const IS_DEMO_DATA = true as const;

export interface DashboardKpi {
  id: string;
  label: string;
  value: number;
  format: "currency" | "number";
  delta: number;
  invertTrend?: boolean;
}

export const dashboardKpis: DashboardKpi[] = [
  {
    id: "revenue",
    label: "Revenue (This Month)",
    value: 42180,
    format: "currency",
    delta: 12.4,
  },
  {
    id: "net-profit",
    label: "Net Profit (This Month)",
    value: 14920,
    format: "currency" as const,
    delta: 8.1,
  },
  {
    id: "outstanding-ar",
    label: "Outstanding Receivables",
    value: 9340,
    format: "currency" as const,
    delta: 4.6,
    invertTrend: true,
  },
  {
    id: "active-clients",
    label: "Active Clients",
    value: 38,
    format: "number" as const,
    delta: 5.6,
  },
];

/** Revenue vs. expenses by month (last 6 months). */
export const revenueTrend = [
  { month: "Apr", revenue: 31200, expenses: 22800 },
  { month: "May", revenue: 33900, expenses: 23400 },
  { month: "Jun", revenue: 35100, expenses: 24950 },
  { month: "Jul", revenue: 37480, expenses: 25100 },
  { month: "Aug", revenue: 39620, expenses: 26370 },
  { month: "Sep", revenue: 42180, expenses: 27260 },
];

/** Revenue split by category (this month). */
export const revenueByCategory = [
  { name: "Tutoring", value: 31200 },
  { name: "Consultation", value: 6100 },
  { name: "Educational Services", value: 3680 },
  { name: "Other", value: 1200 },
];

/** Sales pipeline: leads by stage, narrowing toward conversion. */
export const pipelineFunnel = [
  { name: "New Leads", value: 48 },
  { name: "Contacted", value: 32 },
  { name: "Consultation", value: 21 },
  { name: "Interested", value: 14 },
  { name: "Enrollment Pending", value: 8 },
  { name: "Converted", value: 6 },
];

/** Attention Center: things that need action, per the doc's §10 / Step 7 panel. */
export type AttentionItem = {
  id: string;
  title: string;
  meta: string;
  status: string;
};

export const attentionItems: AttentionItem[] = [
  {
    id: "a1",
    title: "3 invoices overdue",
    meta: "$4,120 total · oldest 18 days",
    status: "overdue",
  },
  {
    id: "a2",
    title: "5 leads need follow-up",
    meta: "No contact in 7+ days",
    status: "contacted",
  },
  {
    id: "a3",
    title: "2 vendor renewals this week",
    meta: "Zoom Pro · Canva Teams",
    status: "scheduled",
  },
  {
    id: "a4",
    title: "4 tasks overdue",
    meta: "Across 2 projects",
    status: "blocked",
  },
];
