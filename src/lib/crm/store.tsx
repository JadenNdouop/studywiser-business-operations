"use client";

/**
 * CRM store — the demo-mode "backend".
 *
 * Holds leads, clients, and activities in React state and persists them to the
 * browser's localStorage, so data the user enters survives refreshes. This is
 * the ONE place that knows how data is stored: when the real Supabase backend
 * is turned on later, only this file changes — every screen keeps calling the
 * same useCrm() methods.
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

  // Load once on mount (client only), seeding on first run.
  React.useEffect(() => {
    let loaded: CrmData | null = null;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) loaded = JSON.parse(raw) as CrmData;
    } catch {
      loaded = null;
    }
    // One-time hydration from localStorage on mount (kept in an effect so the
    // server and first client render match, avoiding a hydration mismatch).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setData(loaded ?? seedData());
    setReady(true);
  }, []);

  // Persist on every change once loaded.
  React.useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      // storage full / unavailable — keep working from memory
    }
  }, [data, ready]);

  const api = React.useMemo<CrmContextValue>(() => {
    const getLead = (id: string) => data.leads.find((l) => l.id === id);
    const getClient = (id: string) => data.clients.find((c) => c.id === id);

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
      return id;
    }

    function updateLead(id: string, patch: Partial<Lead>) {
      setData((d) => ({
        ...d,
        leads: d.leads.map((l) =>
          l.id === id ? { ...l, ...patch, id: l.id, updated_at: now() } : l,
        ),
      }));
    }

    function deleteLead(id: string) {
      setData((d) => ({
        ...d,
        leads: d.leads.filter((l) => l.id !== id),
        activities: d.activities.filter((a) => a.lead_id !== id),
      }));
    }

    function addActivity(leadId: string, input: NewActivity) {
      const activity: LeadActivity = {
        id: newId(),
        lead_id: leadId,
        occurred_at: now(),
        ...input,
      };
      setData((d) => ({
        ...d,
        activities: [activity, ...d.activities],
        leads: d.leads.map((l) =>
          l.id === leadId
            ? { ...l, last_contact_date: now().slice(0, 10), updated_at: now() }
            : l,
        ),
      }));
    }

    function setLeadStage(id: string, stage: PipelineStage) {
      const lead = getLead(id);
      if (!lead || lead.pipeline_stage === stage) return;
      const activity: LeadActivity = {
        id: newId(),
        lead_id: id,
        activity_type: "stage_change",
        notes: `Stage changed to ${stage.replace(/_/g, " ")}.`,
        occurred_at: now(),
      };
      setData((d) => ({
        ...d,
        leads: d.leads.map((l) =>
          l.id === id ? { ...l, pipeline_stage: stage, updated_at: now() } : l,
        ),
        activities: [activity, ...d.activities],
      }));
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
      return id;
    }

    function updateClient(id: string, patch: Partial<Client>) {
      setData((d) => ({
        ...d,
        clients: d.clients.map((c) =>
          c.id === id ? { ...c, ...patch, id: c.id, updated_at: now() } : c,
        ),
      }));
    }

    function deleteClient(id: string) {
      setData((d) => ({
        ...d,
        clients: d.clients.filter((c) => c.id !== id),
      }));
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
      resetToSeed: () => setData(seedData()),
    };
  }, [data, ready]);

  return <CrmContext.Provider value={api}>{children}</CrmContext.Provider>;
}

export function useCrm(): CrmContextValue {
  const ctx = React.useContext(CrmContext);
  if (!ctx) throw new Error("useCrm must be used within a <CrmProvider>");
  return ctx;
}
