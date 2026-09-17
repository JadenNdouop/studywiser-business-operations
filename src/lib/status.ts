import type { BadgeProps } from "@/components/ui/badge";

type Variant = NonNullable<BadgeProps["variant"]>;

export interface StatusMeta {
  label: string;
  variant: Variant;
}

/** Turn a snake_case status token into a human "Title Case" label. */
export function humanizeStatus(status: string): string {
  return status
    .split(/[_\s]+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/**
 * Central status -> {label, color} registry so every status pill in the app is
 * colored consistently, whatever domain it comes from. Unknown statuses fall
 * back to a neutral pill with a humanized label.
 */
export const STATUS_REGISTRY: Record<string, StatusMeta> = {
  // Generic lifecycle
  active: { label: "Active", variant: "success" },
  inactive: { label: "Inactive", variant: "muted" },
  paused: { label: "Paused", variant: "warning" },
  lost: { label: "Lost", variant: "destructive" },
  cancelled: { label: "Cancelled", variant: "muted" },
  archived: { label: "Archived", variant: "muted" },
  on_leave: { label: "On Leave", variant: "warning" },

  // Lead pipeline
  new_lead: { label: "New Lead", variant: "info" },
  contacted: { label: "Contacted", variant: "info" },
  consultation: { label: "Consultation", variant: "info" },
  interested: { label: "Interested", variant: "info" },
  enrollment_pending: { label: "Enrollment Pending", variant: "warning" },
  converted: { label: "Converted", variant: "success" },

  // Invoice / payment
  draft: { label: "Draft", variant: "muted" },
  sent: { label: "Sent", variant: "info" },
  partially_paid: { label: "Partially Paid", variant: "warning" },
  paid: { label: "Paid", variant: "success" },
  overdue: { label: "Overdue", variant: "destructive" },

  // Expense / AP payment status
  pending: { label: "Pending", variant: "warning" },
  scheduled: { label: "Scheduled", variant: "info" },

  // Projects / tasks
  planned: { label: "Planned", variant: "muted" },
  to_do: { label: "To Do", variant: "muted" },
  in_progress: { label: "In Progress", variant: "info" },
  blocked: { label: "Blocked", variant: "destructive" },
  completed: { label: "Completed", variant: "success" },

  // Priorities
  low: { label: "Low", variant: "muted" },
  medium: { label: "Medium", variant: "info" },
  high: { label: "High", variant: "warning" },
  urgent: { label: "Urgent", variant: "destructive" },
};

export function getStatusMeta(status: string): StatusMeta {
  return (
    STATUS_REGISTRY[status] ?? {
      label: humanizeStatus(status),
      variant: "muted",
    }
  );
}
