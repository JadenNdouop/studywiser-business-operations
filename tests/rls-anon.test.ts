import { createClient } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";

/**
 * RLS deny-by-default check (Phase 1 acceptance criterion #2), runnable form.
 *
 * Confirms that the anon key — the identity of any unauthenticated request —
 * reads ZERO rows from every table and cannot insert. This talks to a real
 * Supabase, so it only runs when RUN_DB_TESTS=1 and the env vars are set:
 *
 *   supabase start
 *   RUN_DB_TESTS=1 npm run test:db
 *
 * Without those it is skipped, so `npm test` stays green in CI with no database.
 * (A pure-SQL version that needs no Node lives in supabase/tests/.)
 */

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const enabled = process.env.RUN_DB_TESTS === "1" && !!url && !!anonKey;

const TABLES = [
  "user_profiles",
  "roles",
  "user_roles",
  "leads",
  "lead_activities",
  "clients",
  "workers",
  "tutor_details",
  "compensation_records",
  "worker_payments",
  "worker_payment_items",
  "invoices",
  "invoice_items",
  "payments",
  "revenue",
  "vendors",
  "expenses",
  "subscriptions",
  "projects",
  "tasks",
  "business_events",
  "documents",
  "sops",
  "audit_logs",
] as const;

describe.skipIf(!enabled)("RLS deny-by-default (anon key)", () => {
  const supabase = createClient(url!, anonKey!);

  it.each(TABLES)("anon reads zero rows from %s", async (table) => {
    const { data, error } = await supabase.from(table).select("*").limit(50);
    expect(error).toBeNull();
    expect(data ?? []).toHaveLength(0);
  });

  it("anon cannot insert (RLS rejects the write)", async () => {
    const { error } = await supabase
      .from("leads")
      .insert({ guardian_name: "rls-probe" });
    expect(error).not.toBeNull();
  });
});
