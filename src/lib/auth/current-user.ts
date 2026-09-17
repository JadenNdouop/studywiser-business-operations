import { cache } from "react";

import { createClient } from "@/lib/supabase/server";

export interface CurrentUser {
  id: string;
  email: string;
  fullName: string;
  roles: string[];
}

type RoleJoinRow = {
  roles: { name: string } | { name: string }[] | null;
};

/**
 * The signed-in user with their profile name and role names.
 * Wrapped in React `cache` so multiple server components in one render share a
 * single round-trip. Returns null when not authenticated.
 */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [{ data: profile }, { data: roleRows }] = await Promise.all([
    supabase.from("user_profiles").select("full_name").eq("id", user.id).single(),
    supabase.from("user_roles").select("roles(name)").eq("user_id", user.id),
  ]);

  const roles = ((roleRows ?? []) as RoleJoinRow[]).flatMap((row) => {
    if (!row.roles) return [];
    return Array.isArray(row.roles)
      ? row.roles.map((r) => r.name)
      : [row.roles.name];
  });

  return {
    id: user.id,
    email: user.email ?? "",
    fullName: profile?.full_name ?? user.email ?? "Unknown",
    roles,
  };
});
