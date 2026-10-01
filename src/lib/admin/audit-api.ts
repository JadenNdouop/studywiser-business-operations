/**
 * Data access for the Admin → Audit Log screen. audit_logs is append-only and
 * readable by admins/owners only (RLS). Actor names are resolved from
 * user_profiles. In demo mode a small sample is returned.
 */
import { createClient } from "@/lib/supabase/client";
import { DEMO_MODE } from "@/lib/demo-mode";

export interface AuditEntry {
  id: string;
  actorId: string | null;
  actorName: string;
  action: string;
  entityType: string;
  entityId: string;
  previousValue: unknown;
  newValue: unknown;
  createdAt: string;
}

const DEMO_ENTRIES: AuditEntry[] = [
  {
    id: "demo-1",
    actorId: "demo-owner",
    actorName: "StudyWiser Owner",
    action: "invoice.status_changed",
    entityType: "invoice",
    entityId: "SW-2026-0032",
    previousValue: { status: "sent" },
    newValue: { status: "paid" },
    createdAt: new Date(Date.now() - 1000 * 60 * 42).toISOString(),
  },
  {
    id: "demo-2",
    actorId: "demo-owner",
    actorName: "StudyWiser Owner",
    action: "expense.deleted",
    entityType: "expense",
    entityId: "e3b0c442",
    previousValue: { payee: "Old Vendor", amount: 49 },
    newValue: null,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
  },
  {
    id: "demo-3",
    actorId: "demo-owner",
    actorName: "StudyWiser Owner",
    action: "user_role.assigned",
    entityType: "user_role",
    entityId: "demo-finance",
    previousValue: null,
    newValue: { role: "finance" },
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(),
  },
];

export async function listAuditLog(limit = 200): Promise<AuditEntry[]> {
  if (DEMO_MODE) return DEMO_ENTRIES;

  const supabase = createClient();
  const { data: rows, error } = await supabase
    .from("audit_logs")
    .select(
      "id, actor_id, action, entity_type, entity_id, previous_value, new_value, created_at",
    )
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;

  const logs = (rows ?? []) as {
    id: string;
    actor_id: string | null;
    action: string;
    entity_type: string;
    entity_id: string;
    previous_value: unknown;
    new_value: unknown;
    created_at: string;
  }[];

  // Resolve actor names from user_profiles in one round-trip.
  const actorIds = [...new Set(logs.map((l) => l.actor_id).filter(Boolean))] as string[];
  const names = new Map<string, string>();
  if (actorIds.length) {
    const { data: profiles } = await supabase
      .from("user_profiles")
      .select("id, full_name")
      .in("id", actorIds);
    for (const p of (profiles ?? []) as { id: string; full_name: string }[]) {
      names.set(p.id, p.full_name);
    }
  }

  return logs.map((l) => ({
    id: l.id,
    actorId: l.actor_id,
    actorName: l.actor_id ? (names.get(l.actor_id) ?? "Unknown user") : "System",
    action: l.action,
    entityType: l.entity_type,
    entityId: l.entity_id,
    previousValue: l.previous_value,
    newValue: l.new_value,
    createdAt: l.created_at,
  }));
}
