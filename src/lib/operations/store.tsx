"use client";

/**
 * Operations store — projects, tasks, calendar events, vendors, subscriptions,
 * documents, and SOPs.
 *
 * Two modes (NEXT_PUBLIC_DEMO_MODE): localStorage in demo mode, Supabase
 * (Postgres + RLS, signed-in user) in live mode. Same useOperations() API.
 * Live writes are optimistic with revert-on-error (log + refetch).
 *
 * Shape note: the app keeps a free-text owner/assignee name; the database stores
 * those in *_name text columns (the uuid link columns are reserved for a future
 * user-picker). We map owner→owner_name / assignee→assignee_name on the way in
 * and out.
 */

import * as React from "react";

import type { OperationsData } from "./seed";
import { seedData } from "./seed";
import type {
  BusinessDocument,
  BusinessEvent,
  Project,
  Sop,
  Subscription,
  Task,
  Vendor,
} from "./types";
import { DEMO_MODE } from "@/lib/demo-mode";
import { createClient as createSupabaseClient } from "@/lib/supabase/client";

const STORAGE_KEY = "studywiser_operations_v1";

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

/** Rename one key (and drop the primary key) for a DB update payload. */
function renameKey(
  obj: Record<string, unknown>,
  from: string,
  to: string,
): Record<string, unknown> {
  const o = { ...obj };
  if (from in o) {
    o[to] = o[from];
    delete o[from];
  }
  delete o.id;
  return o;
}
/** Drop the primary key from an update payload. */
function stripId(obj: Record<string, unknown>): Record<string, unknown> {
  const o = { ...obj };
  delete o.id;
  return o;
}
// Row mappers: app object -> DB row (owner/assignee become *_name columns).
function toProjectRow(p: Project) {
  const { owner, ...rest } = p;
  return { ...rest, owner_name: owner ?? null };
}
function toTaskRow(t: Task) {
  const { assignee, ...rest } = t;
  return { ...rest, assignee_name: assignee ?? null };
}
function toSubRow(s: Subscription) {
  const { owner, ...rest } = s;
  return { ...rest, owner_name: owner ?? null };
}
function toSopRow(s: Sop) {
  const { owner, ...rest } = s;
  return { ...rest, owner_name: owner ?? null };
}
// DB row -> app object.
function fromProjectRow(r: Record<string, unknown>): Project {
  const { owner_name, ...rest } = r;
  return { ...(rest as unknown as Project), owner: (owner_name as string) ?? undefined };
}
function fromTaskRow(r: Record<string, unknown>): Task {
  const { assignee_name, ...rest } = r;
  return { ...(rest as unknown as Task), assignee: (assignee_name as string) ?? undefined };
}
function fromSubRow(r: Record<string, unknown>): Subscription {
  const { owner_name, ...rest } = r;
  return { ...(rest as unknown as Subscription), owner: (owner_name as string) ?? undefined };
}
function fromSopRow(r: Record<string, unknown>): Sop {
  const { owner_name, ...rest } = r;
  return { ...(rest as unknown as Sop), owner: (owner_name as string) ?? undefined };
}

export type NewProject = Partial<Omit<Project, "id" | "created_at" | "updated_at">> &
  Pick<Project, "name">;
export type NewTask = Partial<Omit<Task, "id" | "created_at" | "completed_at">> &
  Pick<Task, "title">;
export type NewEvent = Partial<Omit<BusinessEvent, "id" | "created_at">> &
  Pick<BusinessEvent, "title" | "event_date">;
export type NewVendor = Partial<Omit<Vendor, "id" | "created_at">> &
  Pick<Vendor, "name">;
export type NewSubscription = Partial<Omit<Subscription, "id" | "created_at">> &
  Pick<Subscription, "service_name">;
export type NewDocument = Partial<Omit<BusinessDocument, "id" | "created_at">> &
  Pick<BusinessDocument, "title" | "external_url">;
export type NewSop = Partial<Omit<Sop, "id" | "updated_at" | "version">> &
  Pick<Sop, "title" | "content">;

interface OperationsContextValue {
  ready: boolean;
  projects: Project[];
  tasks: Task[];
  events: BusinessEvent[];
  getProject: (id: string) => Project | undefined;
  tasksForProject: (projectId: string) => Task[];
  createProject: (input: NewProject) => string;
  updateProject: (id: string, patch: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  createTask: (input: NewTask) => string;
  updateTask: (id: string, patch: Partial<Task>) => void;
  setTaskStatus: (id: string, status: Task["status"]) => void;
  deleteTask: (id: string) => void;
  createEvent: (input: NewEvent) => string;
  updateEvent: (id: string, patch: Partial<BusinessEvent>) => void;
  deleteEvent: (id: string) => void;
  vendors: Vendor[];
  subscriptions: Subscription[];
  documents: BusinessDocument[];
  sops: Sop[];
  getVendor: (id: string) => Vendor | undefined;
  createVendor: (input: NewVendor) => string;
  updateVendor: (id: string, patch: Partial<Vendor>) => void;
  deleteVendor: (id: string) => void;
  createSubscription: (input: NewSubscription) => string;
  updateSubscription: (id: string, patch: Partial<Subscription>) => void;
  deleteSubscription: (id: string) => void;
  createDocument: (input: NewDocument) => string;
  updateDocument: (id: string, patch: Partial<BusinessDocument>) => void;
  deleteDocument: (id: string) => void;
  getSop: (id: string) => Sop | undefined;
  createSop: (input: NewSop) => string;
  updateSop: (id: string, patch: Partial<Sop>) => void;
  deleteSop: (id: string) => void;
  resetToSeed: () => void;
}

const OperationsContext = React.createContext<OperationsContextValue | null>(
  null,
);

const EMPTY: OperationsData = {
  projects: [],
  tasks: [],
  events: [],
  vendors: [],
  subscriptions: [],
  documents: [],
  sops: [],
};

/** Fill any collection missing from an older localStorage cache from seed. */
function migrate(loaded: Partial<OperationsData>): OperationsData {
  const seeded = seedData();
  return {
    projects: loaded.projects ?? seeded.projects,
    tasks: loaded.tasks ?? seeded.tasks,
    events: loaded.events ?? seeded.events,
    vendors: loaded.vendors ?? seeded.vendors,
    subscriptions: loaded.subscriptions ?? seeded.subscriptions,
    documents: loaded.documents ?? seeded.documents,
    sops: loaded.sops ?? seeded.sops,
  };
}

export function OperationsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [data, setData] = React.useState<OperationsData>(EMPTY);
  const [ready, setReady] = React.useState(false);

  const supabase = React.useMemo(
    () => (DEMO_MODE ? null : createSupabaseClient()),
    [],
  );

  const reload = React.useCallback(async () => {
    if (!supabase) return;
    const [pRes, tRes, eRes, vRes, sRes, dRes, soRes] = await Promise.all([
      supabase.from("projects").select("*").order("created_at", { ascending: false }),
      supabase.from("tasks").select("*").order("created_at", { ascending: false }),
      supabase.from("business_events").select("*").order("event_date", { ascending: false }),
      supabase.from("vendors").select("*").order("created_at", { ascending: false }),
      supabase.from("subscriptions").select("*").order("created_at", { ascending: false }),
      supabase.from("documents").select("*").order("created_at", { ascending: false }),
      supabase.from("sops").select("*").order("updated_at", { ascending: false }),
    ]);
    setData({
      projects: ((pRes.data ?? []) as Record<string, unknown>[]).map(fromProjectRow),
      tasks: ((tRes.data ?? []) as Record<string, unknown>[]).map(fromTaskRow),
      events: (eRes.data ?? []) as BusinessEvent[],
      vendors: (vRes.data ?? []) as Vendor[],
      subscriptions: ((sRes.data ?? []) as Record<string, unknown>[]).map(fromSubRow),
      documents: (dRes.data ?? []) as BusinessDocument[],
      sops: ((soRes.data ?? []) as Record<string, unknown>[]).map(fromSopRow),
    });
  }, [supabase]);

  React.useEffect(() => {
    if (DEMO_MODE) {
      let loaded: Partial<OperationsData> | null = null;
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) loaded = JSON.parse(raw) as Partial<OperationsData>;
      } catch {
        loaded = null;
      }
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setData(loaded ? migrate(loaded) : seedData());
      setReady(true);
    } else {
      reload().finally(() => setReady(true));
    }
  }, [reload]);

  React.useEffect(() => {
    if (DEMO_MODE && ready) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      } catch {
        // ignore
      }
    }
  }, [data, ready]);

  const api = React.useMemo<OperationsContextValue>(() => {
    function fire(run: () => Promise<void>) {
      if (!supabase) return;
      run().catch((err) => {
        console.error("[operations] write failed, resyncing:", err);
        void reload();
      });
    }
    async function ok(p: PromiseLike<{ error: unknown }>): Promise<void> {
      const { error } = await p;
      if (error) throw error;
    }

    // ----- Projects -----
    function createProject(input: NewProject): string {
      const id = newId();
      const ts = now();
      const project: Project = {
        status: "planned",
        ...input,
        id,
        created_at: ts,
        updated_at: ts,
      };
      setData((d) => ({ ...d, projects: [project, ...d.projects] }));
      fire(() => ok(supabase!.from("projects").insert(toProjectRow(project))));
      return id;
    }
    function updateProject(id: string, patch: Partial<Project>) {
      setData((d) => ({
        ...d,
        projects: d.projects.map((p) =>
          p.id === id ? { ...p, ...patch, id: p.id, updated_at: now() } : p,
        ),
      }));
      fire(() =>
        ok(
          supabase!
            .from("projects")
            .update(renameKey(patch, "owner", "owner_name"))
            .eq("id", id),
        ),
      );
    }
    function deleteProject(id: string) {
      setData((d) => ({
        ...d,
        projects: d.projects.filter((p) => p.id !== id),
        tasks: d.tasks.map((t) =>
          t.project_id === id ? { ...t, project_id: undefined } : t,
        ),
      }));
      // tasks.project_id is ON DELETE SET NULL in the DB.
      fire(() => ok(supabase!.from("projects").delete().eq("id", id)));
    }

    // ----- Tasks -----
    function createTask(input: NewTask): string {
      const id = newId();
      const task: Task = {
        status: "to_do",
        ...input,
        id,
        created_at: now(),
        completed_at: input.status === "completed" ? now() : undefined,
      };
      setData((d) => ({ ...d, tasks: [task, ...d.tasks] }));
      fire(() => ok(supabase!.from("tasks").insert(toTaskRow(task))));
      return id;
    }
    function updateTask(id: string, patch: Partial<Task>) {
      setData((d) => ({
        ...d,
        tasks: d.tasks.map((t) => (t.id === id ? { ...t, ...patch, id: t.id } : t)),
      }));
      fire(() =>
        ok(
          supabase!
            .from("tasks")
            .update(renameKey(patch, "assignee", "assignee_name"))
            .eq("id", id),
        ),
      );
    }
    function setTaskStatus(id: string, status: Task["status"]) {
      const completed_at = status === "completed" ? now() : undefined;
      setData((d) => ({
        ...d,
        tasks: d.tasks.map((t) =>
          t.id === id
            ? {
                ...t,
                status,
                completed_at:
                  status === "completed" ? (t.completed_at ?? now()) : undefined,
              }
            : t,
        ),
      }));
      fire(() =>
        ok(
          supabase!
            .from("tasks")
            .update({ status, completed_at: completed_at ?? null })
            .eq("id", id),
        ),
      );
    }
    function deleteTask(id: string) {
      setData((d) => ({ ...d, tasks: d.tasks.filter((t) => t.id !== id) }));
      fire(() => ok(supabase!.from("tasks").delete().eq("id", id)));
    }

    // ----- Events -----
    function createEvent(input: NewEvent): string {
      const id = newId();
      const event: BusinessEvent = { ...input, id, created_at: now() };
      setData((d) => ({ ...d, events: [event, ...d.events] }));
      fire(() => ok(supabase!.from("business_events").insert(event)));
      return id;
    }
    function updateEvent(id: string, patch: Partial<BusinessEvent>) {
      setData((d) => ({
        ...d,
        events: d.events.map((e) => (e.id === id ? { ...e, ...patch, id: e.id } : e)),
      }));
      fire(() =>
        ok(supabase!.from("business_events").update(stripId(patch)).eq("id", id)),
      );
    }
    function deleteEvent(id: string) {
      setData((d) => ({ ...d, events: d.events.filter((e) => e.id !== id) }));
      fire(() => ok(supabase!.from("business_events").delete().eq("id", id)));
    }

    // ----- Vendors -----
    function createVendor(input: NewVendor): string {
      const id = newId();
      const vendor: Vendor = { status: "active", ...input, id, created_at: now() };
      setData((d) => ({ ...d, vendors: [vendor, ...d.vendors] }));
      fire(() => ok(supabase!.from("vendors").insert(vendor)));
      return id;
    }
    function updateVendor(id: string, patch: Partial<Vendor>) {
      setData((d) => ({
        ...d,
        vendors: d.vendors.map((v) => (v.id === id ? { ...v, ...patch, id: v.id } : v)),
      }));
      fire(() =>
        ok(supabase!.from("vendors").update(stripId(patch)).eq("id", id)),
      );
    }
    function deleteVendor(id: string) {
      setData((d) => ({
        ...d,
        vendors: d.vendors.filter((v) => v.id !== id),
        subscriptions: d.subscriptions.map((s) =>
          s.vendor_id === id ? { ...s, vendor_id: undefined } : s,
        ),
      }));
      // subscriptions.vendor_id is ON DELETE SET NULL in the DB.
      fire(() => ok(supabase!.from("vendors").delete().eq("id", id)));
    }

    // ----- Subscriptions -----
    function createSubscription(input: NewSubscription): string {
      const id = newId();
      const sub: Subscription = { status: "active", ...input, id, created_at: now() };
      setData((d) => ({ ...d, subscriptions: [sub, ...d.subscriptions] }));
      fire(() => ok(supabase!.from("subscriptions").insert(toSubRow(sub))));
      return id;
    }
    function updateSubscription(id: string, patch: Partial<Subscription>) {
      setData((d) => ({
        ...d,
        subscriptions: d.subscriptions.map((s) =>
          s.id === id ? { ...s, ...patch, id: s.id } : s,
        ),
      }));
      fire(() =>
        ok(
          supabase!
            .from("subscriptions")
            .update(renameKey(patch, "owner", "owner_name"))
            .eq("id", id),
        ),
      );
    }
    function deleteSubscription(id: string) {
      setData((d) => ({
        ...d,
        subscriptions: d.subscriptions.filter((s) => s.id !== id),
      }));
      fire(() => ok(supabase!.from("subscriptions").delete().eq("id", id)));
    }

    // ----- Documents -----
    function createDocument(input: NewDocument): string {
      const id = newId();
      const doc: BusinessDocument = { ...input, id, created_at: now() };
      setData((d) => ({ ...d, documents: [doc, ...d.documents] }));
      fire(() => ok(supabase!.from("documents").insert(doc)));
      return id;
    }
    function updateDocument(id: string, patch: Partial<BusinessDocument>) {
      setData((d) => ({
        ...d,
        documents: d.documents.map((doc) =>
          doc.id === id ? { ...doc, ...patch, id: doc.id } : doc,
        ),
      }));
      fire(() =>
        ok(supabase!.from("documents").update(stripId(patch)).eq("id", id)),
      );
    }
    function deleteDocument(id: string) {
      setData((d) => ({ ...d, documents: d.documents.filter((doc) => doc.id !== id) }));
      fire(() => ok(supabase!.from("documents").delete().eq("id", id)));
    }

    // ----- SOPs -----
    function createSop(input: NewSop): string {
      const id = newId();
      const sop: Sop = { status: "active", version: 1, ...input, id, updated_at: now() };
      setData((d) => ({ ...d, sops: [sop, ...d.sops] }));
      fire(() => ok(supabase!.from("sops").insert(toSopRow(sop))));
      return id;
    }
    function updateSop(id: string, patch: Partial<Sop>) {
      setData((d) => ({
        ...d,
        sops: d.sops.map((s) =>
          s.id === id ? { ...s, ...patch, id: s.id, updated_at: now() } : s,
        ),
      }));
      fire(() =>
        ok(
          supabase!
            .from("sops")
            .update(renameKey(patch, "owner", "owner_name"))
            .eq("id", id),
        ),
      );
    }
    function deleteSop(id: string) {
      setData((d) => ({ ...d, sops: d.sops.filter((s) => s.id !== id) }));
      fire(() => ok(supabase!.from("sops").delete().eq("id", id)));
    }

    return {
      ready,
      projects: data.projects,
      tasks: data.tasks,
      events: data.events,
      getProject: (id) => data.projects.find((p) => p.id === id),
      tasksForProject: (projectId) =>
        data.tasks
          .filter((t) => t.project_id === projectId)
          .sort((a, b) => (a.due_date ?? "").localeCompare(b.due_date ?? "")),
      createProject,
      updateProject,
      deleteProject,
      createTask,
      updateTask,
      setTaskStatus,
      deleteTask,
      createEvent,
      updateEvent,
      deleteEvent,
      vendors: data.vendors,
      subscriptions: data.subscriptions,
      documents: data.documents,
      sops: data.sops,
      getVendor: (id) => data.vendors.find((v) => v.id === id),
      createVendor,
      updateVendor,
      deleteVendor,
      createSubscription,
      updateSubscription,
      deleteSubscription,
      createDocument,
      updateDocument,
      deleteDocument,
      getSop: (id) => data.sops.find((s) => s.id === id),
      createSop,
      updateSop,
      deleteSop,
      resetToSeed: () => {
        if (DEMO_MODE) setData(seedData());
        else void reload();
      },
    };
  }, [data, ready, supabase, reload]);

  return (
    <OperationsContext.Provider value={api}>
      {children}
    </OperationsContext.Provider>
  );
}

export function useOperations(): OperationsContextValue {
  const ctx = React.useContext(OperationsContext);
  if (!ctx)
    throw new Error("useOperations must be used within an <OperationsProvider>");
  return ctx;
}
