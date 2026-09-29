/**
 * Small helper for renewal dates, shared by Vendors and Subscriptions.
 * Renewal urgency is always computed from today, never stored, so it can't
 * go stale.
 */

export type RenewalTone = "overdue" | "soon" | "normal";

export interface RenewalInfo {
  /** Whole days until renewal (negative = past). */
  days: number;
  tone: RenewalTone;
  label: string;
}

export function renewalInfo(
  renewalDate?: string,
  soonWithinDays = 30,
): RenewalInfo | null {
  if (!renewalDate) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(renewalDate + "T00:00:00");
  const days = Math.round(
    (target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
  );

  let tone: RenewalTone = "normal";
  let label: string;
  if (days < 0) {
    tone = "overdue";
    label = `${Math.abs(days)}d overdue`;
  } else if (days === 0) {
    tone = "soon";
    label = "Today";
  } else if (days <= soonWithinDays) {
    tone = "soon";
    label = `in ${days}d`;
  } else {
    label = `in ${days}d`;
  }
  return { days, tone, label };
}
