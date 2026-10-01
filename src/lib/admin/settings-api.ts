/**
 * Data access for the Admin → Settings screen. org_settings is a single-row
 * table (see the org_settings migration): staff can read it, admins can change
 * it (RLS). In demo mode an in-memory copy is used.
 */
import { createClient } from "@/lib/supabase/client";
import { DEMO_MODE } from "@/lib/demo-mode";

export interface OrgSettings {
  business_name: string;
  legal_name: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  address: string | null;
  default_hourly_rate: number;
  invoice_prefix: string;
}

export const EMPTY_SETTINGS: OrgSettings = {
  business_name: "StudyWiser",
  legal_name: null,
  email: null,
  phone: null,
  website: null,
  address: null,
  default_hourly_rate: 35,
  invoice_prefix: "SW",
};

let demoSettings: OrgSettings = {
  ...EMPTY_SETTINGS,
  email: "info@studywiser.org",
};

const COLUMNS =
  "business_name, legal_name, email, phone, website, address, default_hourly_rate, invoice_prefix";

export async function getSettings(): Promise<OrgSettings> {
  if (DEMO_MODE) return demoSettings;

  const supabase = createClient();
  const { data, error } = await supabase
    .from("org_settings")
    .select(COLUMNS)
    .eq("id", true)
    .maybeSingle();
  if (error) throw error;
  if (!data) return EMPTY_SETTINGS;
  return data as unknown as OrgSettings;
}

export async function updateSettings(patch: OrgSettings): Promise<void> {
  if (DEMO_MODE) {
    demoSettings = { ...demoSettings, ...patch };
    return;
  }
  const supabase = createClient();
  const { error } = await supabase
    .from("org_settings")
    .update(patch)
    .eq("id", true);
  if (error) throw error;
}
