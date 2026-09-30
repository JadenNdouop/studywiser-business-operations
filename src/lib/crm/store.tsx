"use client";

/**
 * CRM store — the data layer for leads, clients, and activities.
 *
 * ONE place knows how data is stored. It runs in two modes, chosen by the
 * NEXT_PUBLIC_DEMO_MODE flag:
 *   • Demo mode  → React state persisted to localStorage (no backend needed).
 *   • Live mode  → Supabase (Postgres + RLS) under the signed-in user.
 * Every screen calls the same useCrm() methods either way.
 *
 * Live-mode writes are optimistic: we update local state immediately (so the
 * UI stays snappy and IDs are available synchronously), then send the write to
 * Supabase. If a write fails we log it and refetch, so the screen re-syncs with
 * the server's truth instead of silently drifting.
 */

import * as React from "react";

import type { CrmData } from "./seed";
import { seedData } from "./seed";
import type {
  Client,
  ClientStatus,
  Lead,
  LeadActivity,
  PipelineStage,
} from "./types";
import { DEMO_MODE } from "@/lib/demo-mode";
import { createClient as createSupabaseClient } from "@/lib/supabase/client";

const STORAGE_KEY = "studywiser_crm_v1";

function now(): string {
  return new Date().toISOString();
}
function newId(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return "id-" + Math.random().toString(36).slice(2) + Date.now().toString(36);
  }
}
/** Drop the primary key from an update payload. */
function withoutId<T extends { id?: string }>(patch: T): Partial<T> {
  const rest = { ...patch };
  delete rest.id;
  return rest;
}

export type NewLead = Partial<Omit<Lead, "id" | "created_at" | "updated_at">> &
  Pick<Lead, "guardian_name">;
export type NewActivity = Pick<LeadActivity, "activity_type"> &
  Partial<Pick<LeadActivity, "contact_method" | "notes" | "occurred_at">>;
export type NewClient = Partial<Omit<Client, "id" | "created_at" | "updated_at">> &
  Pick<Client, "family_name">;

interface CrmContextValue {
  ready: boolean;
  leads: Lead[];
  clients: Client[];
  activities: LeadActivity[];
  getLead: (id: string) => Lead | undefined;
  getClient: (id: string) => Client | undefined;
  activitiesForLead: (leadId: string) => LeadActivity[];
  createLead: (input: NewLead) => string;
  updateLead: (id: string, patch: Partial<Lead>) => void;
  deleteLead: (id: string) => void;
  setLeadStage: (id: string, stage: PipelineStage) => void;
  addActivity: (leadId: string, input: NewActivity) => void;
  convertLead: (id: string) => string | undefined;
  createClient: (input: NewClient) => string;
  updateClient: (id: string, patch: Partial<Client>) => void;
  updateClientStatus: (id: string, status: ClientStatus) => void;
  deleteClient: (id: string) => void;
  resetToSeed: () => void;
}

const CrmContext = React.createContext<CrmContextValue | null>(null);

const EMPTY: CrmData = { leads: [], activities: [], clients: [] };

export function CrmProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = React.useState<CrmData>(EMPTY);
  const [ready, setReady] = React.useState(false);

  // One Supabase client for the provider's lifetime (null in demo mode).
  const supabase = React.useMemo(
    () => (DEMO_MODE ? null : createSupabaseClient()),
    [],
  );

  // Pull the whole CRM dataset from Supabase into local state.
  const reload = React.useCallback(async () => {
    if (!supabase) return;
    const [leadsRes, clientsRes, actsRes] = await Promise.all([
      supabase.from("leads").select("*").order("created_at", { ascending: false }),
      supabase
        .from("clients")
        .select("*")
        .order("created_at", { ascending: false }),
      supabase
        .from("lead_activities")
        .select("*")
        .order("occurred_at", { ascending: false }),
    ]);
    setData({
      leads: (leadsRes.data ?? []) as Lead[],
      clients: (clientsRes.data ?? []) as Client[],
      activities: (actsRes.data ?? []) as LeadActivity[],
    });
  }, [supabase]);

  // Initial load: localStorage (demo) or Supabase (live).
  React.useEffect(() => {
    if (DEMO_MODE) {
      let loaded: CrmData | null = null;
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) loaded = JSON.parse(raw) as CrmData;
      } catch {
        loaded = null;
      }
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setData(loaded ?? seedData());
      setReady(true);
    } else {
      reload().finally(() => setReady(true));
    }
  }, [reload]);

  // Persist to localStorage in demo mode only.
  React.useEffect(() => {
    if (DEMO_MODE && ready) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      } catch {
        // storage full / unavailable — keep working from memory
      }
    }
  }, [data, ready]);

  const api = React.useMemo<CrmContextValue>(() => {
    const getLead = (id: string) => data.leads.find((l) => l.id === id);
    const getClient = (id: string) => data.clients.find((c) => c.id === id);

    /** Run a live-mode write; on failure, log and refetch to resync. */
    function fire(run: () => Promise<void>) {
      if (!supabase) return; // demo mode: local state + localStorage is enough
      run().catch((err) => {
        console.error("[crm] write failed, resyncing:", err);
        void reload();
      });
    }

    async function assertNoError(
      p: PromiseLike<{ error: unknown }>,
    ): Promise<void> {
      const { error } = await p;
      if (error) throw error;
    }

    function createLead(input: NewLead): string {
      const id = newId();
      const ts = now();
      const lead: Lead = {
        pipeline_stage: "new_lead",
        date_received: ts.slice(0, 10),
        ...input,
        id,
        created_at: ts,
        updated_at: ts,
      };
      setData((d) => ({ ...d, leads: [lead, ...d.leads] }));
      fire(() => assertNoError(supabase!.from("leads").insert(lead)));
      return id;
    }

    function updateLead(id: string, patch: Partial<Lead>) {
      setData((d) => ({
        ...d,
        leads: d.leads.map((l) =>
          l.id === id ? { ...l, ...patch, id: l.id, updated_at: now() } : l,
        ),
      }));
      fire(() =>
        assertNoError(
          supabase!.from("leads").update(withoutId(patch)).eq("id", id),
        ),
      );
    }

    function deleteLead(id: string) {
      setData((d) => ({
        ...d,
        leads: d.leads.filter((l) => l.id !== id),
        activities: d.activities.filter((a) => a.lead_id !== id),
      }));
      // lead_activities cascade-delete in the DB via FK.
      fire(() => assertNoError(supabase!.from("leads").delete().eq("id", id)));
    }

    function addActivity(leadId: string, input: NewActivity) {
      const ts = now();
      const activity: LeadActivity = {
        id: newId(),
        lead_id: leadId,
        occurred_at: ts,
        ...input,
      };
      setData((d) => ({
        ...d,
        activities: [activity, ...d.activities],
        leads: d.leads.map((l) =>
          l.id === leadId
            ? { ...l, last_contact_date: ts.slice(0, 10), updated_at: ts }
            : l,
        ),
      }));
      fire(async () => {
        await assertNoError(supabase!.from("lead_activities").insert(activity));
        await assertNoError(
          supabase!
            .from("leads")
            .update({ last_contact_date: ts.slice(0, 10) })
            .eq("id", leadId),
        );
      });
    }

    function setLeadStage(id: string, stage: PipelineStage) {
      const lead = getLead(id);
      if (!lead || lead.pipeline_stage === stage) return;
      const ts = now();
      const activity: LeadActivity = {
        id: newId(),
        lead_id: id,
        activity_type: "stage_change",
        notes: `Stage changed to ${stage.replace(/_/g, " ")}.`,
        occurred_at: ts,
      };
      setData((d) => ({
        ...d,
        leads: d.leads.map((l) =>
          l.id === id ? { ...l, pipeline_stage: stage, updated_at: ts } : l,
        ),
        activities: [activity, ...d.activities],
      }));
      fire(async () => {
        await assertNoError(
          supabase!.from("leads").update({ pipeline_stage: stage }).eq("id", id),
        );
        await assertNoError(
          supabase!.from("lead_activities").insert(activity),
        );
      });
    }

    function convertLead(id: string): string | undefined {
      const lead = getLead(id);
      if (!lead) return undefined;
      if (lead.converted_client_id) return lead.converted_client_id;

      const clientId = newId();
      const ts = now();
      const client: Client = {
        id: clientId,
        family_name: lead.guardian_name,
        primary_contact_name: lead.guardian_name,
        email: lead.email,
        phone: lead.phone,
        status: "active",
        acquisition_source: lead.lead_source,
        customer_since: ts.slice(0, 10),
        notes: lead.student_name
          ? `Converted from lead. Student: ${lead.student_name}${
              lead.subject_needed ? ` (${lead.subject_needed})` : ""
            }.`
          : "Converted from lead.",
        created_at: ts,
        updated_at: ts,
      };
      const activity: LeadActivity = {
        id: newId(),
        lead_id: id,
        activity_type: "stage_change",
        notes: "Converted to client.",
        occurred_at: ts,
      };
      setData((d) => ({
        ...d,
        clients: [client, ...d.clients],
        leads: d.leads.map((l) =>
          l.id === id
            ? {
                ...l,
                pipeline_stage: "converted",
                converted_client_id: clientId,
                updated_at: ts,
              }
            : l,
        ),
        activities: [activity, ...d.activities],
      }));
      fire(async () => {
        await assertNoError(supabase!.from("clients").insert(client));
        await assertNoError(
          supabase!
            .from("leads")
            .update({
              pipeline_stage: "converted",
              converted_client_id: clientId,
            })
            .eq("id", id),
        );
        await assertNoError(supabase!.from("lead_activities").insert(activity));
      });
      return clientId;
    }

    function createClient(input: NewClient): string {
      const id = newId();
      const ts = now();
      const client: Client = {
        status: "active",
        ...input,
        id,
        created_at: ts,
        updated_at: ts,
      };
      setData((d) => ({ ...d, clients: [client, ...d.clients] }));
      fire(() => assertNoError(supabase!.from("clients").insert(client)));
      return id;
    }

    function updateClient(id: string, patch: Partial<Client>) {
      setData((d) => ({
        ...d,
        clients: d.clients.map((c) =>
          c.id === id ? { ...c, ...patch, id: c.id, updated_at: now() } : c,
        ),
      }));
      fire(() =>
        assertNoError(
          supabase!.from("clients").update(withoutId(patch)).eq("id", id),
        ),
      );
    }

    function deleteClient(id: string) {
      setData((d) => ({
        ...d,
        clients: d.clients.filter((c) => c.id !== id),
      }));
      fire(() => assertNoError(supabase!.from("clients").delete().eq("id", id)));
    }

    return {
      ready,
      leads: data.leads,
      clients: data.clients,
      activities: data.activities,
      getLead,
      getClient,
      activitiesForLead: (leadId: string) =>
        data.activities
          .filter((a) => a.lead_id === leadId)
          .sort((a, b) => b.occurred_at.localeCompare(a.occurred_at)),
      createLead,
      updateLead,
      deleteLead,
      setLeadStage,
      addActivity,
      convertLead,
      createClient,
      updateClient,
      updateClientStatus: (id, status) => updateClient(id, { status }),
      deleteClient,
      resetToSeed: () => {
        if (DEMO_MODE) setData(seedData());
        else void reload();
      },
    };
  }, [data, ready, supabase, reload]);

  return <CrmContext.Provider value={api}>{children}</CrmContext.Provider>;
}

export function useCrm(): CrmContextValue {
  const ctx = React.useContext(CrmContext);
  if (!ctx) throw new Error("useCrm must be used within a <CrmProvider>");
  return ctx;
}
