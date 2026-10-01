/**
 * Data access for the Admin → Users screen. Reads/writes go through the
 * browser Supabase client and are gated by RLS: listing all users and managing
 * their roles requires an admin/owner session. In demo mode a small sample is
 * returned so the screen is populated without a backend.
 */
import { createClient } from "@/lib/supabase/client";
import { DEMO_MODE, DEMO_USER } from "@/lib/demo-mode";
import type { AdminUser, RoleName } from "./types";

type RoleJoin = { name: string } | { name: string }[] | null;

function namesFromJoin(roles: RoleJoin): RoleName[] {
  if (!roles) return [];
  const arr = Array.isArray(roles) ? roles : [roles];
  return arr.map((r) => r.name as RoleName);
}

const DEMO_USERS: AdminUser[] = [
  {
    id: "demo-owner",
    full_name: DEMO_USER.fullName,
    email: DEMO_USER.email,
    created_at: "2025-09-01T00:00:00.000Z",
    roles: ["owner"],
    isCurrentUser: true,
  },
  {
    id: "demo-ops",
    full_name: "Jordan Operations",
    created_at: "2026-01-15T00:00:00.000Z",
    roles: ["operations_manager"],
  },
  {
    id: "demo-finance",
    full_name: "Riley Finance",
    created_at: "2026-02-20T00:00:00.000Z",
    roles: ["finance"],
  },
];

export async function listUsers(): Promise<AdminUser[]> {
  if (DEMO_MODE) return DEMO_USERS;

  const supabase = createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  const [{ data: profiles, error: pErr }, { data: roleRows, error: rErr }] =
    await Promise.all([
      supabase
        .from("user_profiles")
        .select("id, full_name, created_at")
        .order("created_at", { ascending: true }),
      supabase.from("user_roles").select("user_id, roles(name)"),
    ]);
  if (pErr) throw pErr;
  if (rErr) throw rErr;

  const rolesByUser = new Map<string, RoleName[]>();
  for (const row of (roleRows ?? []) as {
    user_id: string;
    roles: RoleJoin;
  }[]) {
    const list = rolesByUser.get(row.user_id) ?? [];
    rolesByUser.set(row.user_id, [...list, ...namesFromJoin(row.roles)]);
  }

  return ((profiles ?? []) as {
    id: string;
    full_name: string;
    created_at: string;
  }[]).map((p) => ({
    id: p.id,
    full_name: p.full_name,
    created_at: p.created_at,
    roles: rolesByUser.get(p.id) ?? [],
    email: authUser && p.id === authUser.id ? (authUser.email ?? undefined) : undefined,
    isCurrentUser: !!authUser && p.id === authUser.id,
  }));
}

/**
 * Replace a user's roles with exactly `desired`, adding and removing
 * user_roles rows as needed. No-op in demo mode.
 */
export async function setUserRoles(
  userId: string,
  desired: RoleName[],
): Promise<void> {
  if (DEMO_MODE) return;
  const supabase = createClient();

  const [{ data: roleDefs, error: defErr }, { data: current, error: curErr }] =
    await Promise.all([
      supabase.from("roles").select("id, name"),
      supabase.from("user_roles").select("role_id, roles(name)").eq("user_id", userId),
    ]);
  if (defErr) throw defErr;
  if (curErr) throw curErr;

  const idByName = new Map<string, string>();
  for (const r of (roleDefs ?? []) as { id: string; name: string }[]) {
    idByName.set(r.name, r.id);
  }

  const currentNames = new Set(
    ((current ?? []) as { roles: RoleJoin }[]).flatMap((row) =>
      namesFromJoin(row.roles),
    ),
  );
  const desiredSet = new Set(desired);

  const toAdd = desired.filter((n) => !currentNames.has(n));
  const toRemove = [...currentNames].filter((n) => !desiredSet.has(n));

  if (toAdd.length) {
    const rows = toAdd
      .map((n) => idByName.get(n))
      .filter((id): id is string => !!id)
      .map((role_id) => ({ user_id: userId, role_id }));
    if (rows.length) {
      const { error } = await supabase.from("user_roles").insert(rows);
      if (error) throw error;
    }
  }

  for (const name of toRemove) {
    const roleId = idByName.get(name);
    if (!roleId) continue;
    const { error } = await supabase
      .from("user_roles")
      .delete()
      .eq("user_id", userId)
      .eq("role_id", roleId);
    if (error) throw error;
  }
}
