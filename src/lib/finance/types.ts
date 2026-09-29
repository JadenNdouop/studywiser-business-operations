/**
 * Finance domain types. Mirror the invoices / invoice_items / payments /
 * revenue / expenses tables in supabase/migrations so a later swap to real
 * Supabase queries is a 1:1 mapping. Currency is always a plain number of
 * dollars (never floating-point cents); reporting rounds for display.
 */

export type InvoiceStatus =
  | "draft"
  | "sent"
  | "partially_paid"
  | "paid"
  | "cancelled";

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

export interface Invoice {
  id: string;
  invoice_number: string; // e.g. SW-2026-0001
  client_id: string;
  issue_date: string; // YYYY-MM-DD
  due_date?: string;
  items: InvoiceItem[];
  subtotal: number;
  adjustments: number;
  total: number;
  amount_paid: number;
  balance: number;
  status: InvoiceStatus;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string;
  invoice_id: string;
  client_id: string;
  amount: number;
  payment_date: string; // YYYY-MM-DD
  payment_method?: string;
  reference_number?: string;
  notes?: string;
  created_at: string;
}

export type RevenueCategory =
  | "tutoring"
  | "consultation"
  | "educational_services"
  | "other";

export type RevenueSource = "manual" | "invoice_payment";

export interface RevenueEntry {
  id: string;
  date: string; // YYYY-MM-DD
  client_id?: string;
  category: RevenueCategory;
  description?: string;
  amount: number;
  source: RevenueSource;
  payment_id?: string;
  notes?: string;
  created_at: string;
}

export type ExpenseCategory =
  | "tutor_compensation"
  | "contractor_compensation"
  | "software"
  | "marketing"
  | "advertising"
  | "insurance"
  | "legal"
  | "accounting"
  | "banking_fees"
  | "office_supplies"
  | "technology"
  | "website"
  | "professional_services"
  | "other";

// Stored statuses; "overdue" is computed from due_date, never stored.
export type ExpensePaymentStatus = "pending" | "scheduled" | "paid";
export type RecurringStatus = "one_time" | "recurring";

export interface Expense {
  id: string;
  payee: string;
  date: string; // YYYY-MM-DD (date incurred)
  due_date?: string;
  category: ExpenseCategory;
  description?: string;
  amount: number;
  payment_method?: string;
  recurring_status: RecurringStatus;
  payment_status: ExpensePaymentStatus;
  payment_date?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export const REVENUE_CATEGORIES: RevenueCategory[] = [
  "tutoring",
  "consultation",
  "educational_services",
  "other",
];

export const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  "tutor_compensation",
  "contractor_compensation",
  "software",
  "marketing",
  "advertising",
  "insurance",
  "legal",
  "accounting",
  "banking_fees",
  "office_supplies",
  "technology",
  "website",
  "professional_services",
  "other",
];

export const EXPENSE_STATUSES: ExpensePaymentStatus[] = [
  "pending",
  "scheduled",
  "paid",
];
