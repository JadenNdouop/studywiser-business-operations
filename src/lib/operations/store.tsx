"use client";

/**
 * Operations store — the demo-mode "backend" for projects, tasks, and the
 * business calendar. Same pattern as CRM/Finance/Workforce: React state
 * persisted to localStorage, one place that knows how data is stored.
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

export type NewProject = Partial<Omit<Project, "id" | "created_at" | "updated_at">> &
  Pick<Project, "name">;
export type NewTask = Partial<Omit<Task, "id" | "created_at" | "completed_at">> &
  Pick<Task, "title">;
export type NewEvent = Partial<Omit<BusinessEvent, "id" | "created_at">> &
  Pick<BusinessEvent, "title" | "event_date">;
export type NewVendor = Partial<Omit<Vendor, "id" | "created_at">> &
  Pick<Vendor, "name">;
export type NewSubscription = Partial<
  Omit<Subscription, "id" | "created_at">
> &
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

export function OperationsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [data, setData] = React.useState<OperationsData>(EMPTY);
  const [ready, setReady] = React.useState(false);

  React.useEffect(() => {
    let loaded: OperationsData | null = null;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) loaded = JSON.parse(raw) as OperationsData;
    } catch {
      loaded = null;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setData(loaded ?? seedData());
    setReady(true);
  }, []);

  React.useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      // ignore
    }
  }, [data, ready]);

  const api = React.useMemo<OperationsContextValue>(() => {
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
      return id;
    }

    function createTask(input: NewTask): string {
      const id = newId();
      const task: Task = {
        status: "to_do",
        ...input,
        id,
        created_at: now(),
        completed_at:
          input.status === "completed" ? now() : undefined,
      };
      setData((d) => ({ ...d, tasks: [task, ...d.tasks] }));
      return id;
    }

    function setTaskStatus(id: string, status: Task["status"]) {
      setData((d) => ({
        ...d,
        tasks: d.tasks.map((t) =>
          t.id === id
            ? {
                ...t,
                status,
                completed_at:
                  status === "completed"
                    ? (t.completed_at ?? now())
                    : undefined,
              }
            : t,
        ),
      }));
    }

    function createEvent(input: NewEvent): string {
      const id = newId();
      const event: BusinessEvent = {
        ...input,
        id,
        created_at: now(),
      };
      setData((d) => ({ ...d, events: [event, ...d.events] }));
      return id;
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
      updateProject: (id, patch) =>
        setData((d) => ({
          ...d,
          projects: d.projects.map((p) =>
            p.id === id
              ? { ...p, ...patch, id: p.id, updated_at: now() }
              : p,
          ),
        })),
      deleteProject: (id) =>
        setData((d) => ({
          ...d,
          projects: d.projects.filter((p) => p.id !== id),
          // Tasks survive; they just detach from the deleted project.
          tasks: d.tasks.map((t) =>
            t.project_id === id ? { ...t, project_id: undefined } : t,
          ),
        })),
      createTask,
      updateTask: (id, patch) =>
        setData((d) => ({
          ...d,
          tasks: d.tasks.map((t) =>
            t.id === id ? { ...t, ...patch, id: t.id } : t,
          ),
        })),
      setTaskStatus,
      deleteTask: (id) =>
        setData((d) => ({
          ...d,
          tasks: d.tasks.filter((t) => t.id !== id),
        })),
      createEvent,
      updateEvent: (id, patch) =>
        setData((d) => ({
          ...d,
          events: d.events.map((e) =>
            e.id === id ? { ...e, ...patch, id: e.id } : e,
          ),
        })),
      deleteEvent: (id) =>
        setData((d) => ({
          ...d,
          events: d.events.filter((e) => e.id !== id),
        })),

      // --- Vendors ---
      vendors: data.vendors,
      getVendor: (id) => data.vendors.find((v) => v.id === id),
      createVendor: (input) => {
        const id = newId();
        const vendor: Vendor = {
          status: "active",
          ...input,
          id,
          created_at: now(),
        };
        setData((d) => ({ ...d, vendors: [vendor, ...d.vendors] }));
        return id;
      },
      updateVendor: (id, patch) =>
        setData((d) => ({
          ...d,
          vendors: d.vendors.map((v) =>
            v.id === id ? { ...v, ...patch, id: v.id } : v,
          ),
        })),
      deleteVendor: (id) =>
        setData((d) => ({
          ...d,
          vendors: d.vendors.filter((v) => v.id !== id),
          // Subscriptions survive; they detach from the deleted vendor.
          subscriptions: d.subscriptions.map((s) =>
            s.vendor_id === id ? { ...s, vendor_id: undefined } : s,
          ),
        })),

      // --- Subscriptions ---
      subscriptions: data.subscriptions,
      createSubscription: (input) => {
        const id = newId();
        const sub: Subscription = {
          status: "active",
          ...input,
          id,
          created_at: now(),
        };
        setData((d) => ({
          ...d,
          subscriptions: [sub, ...d.subscriptions],
        }));
        return id;
      },
      updateSubscription: (id, patch) =>
        setData((d) => ({
          ...d,
          subscriptions: d.subscriptions.map((s) =>
            s.id === id ? { ...s, ...patch, id: s.id } : s,
          ),
        })),
      deleteSubscription: (id) =>
        setData((d) => ({
          ...d,
          subscriptions: d.subscriptions.filter((s) => s.id !== id),
        })),

      // --- Documents ---
      documents: data.documents,
      createDocument: (input) => {
        const id = newId();
        const doc: BusinessDocument = {
          ...input,
          id,
          created_at: now(),
        };
        setData((d) => ({ ...d, documents: [doc, ...d.documents] }));
        return id;
      },
      updateDocument: (id, patch) =>
        setData((d) => ({
          ...d,
          documents: d.documents.map((doc) =>
            doc.id === id ? { ...doc, ...patch, id: doc.id } : doc,
          ),
        })),
      deleteDocument: (id) =>
        setData((d) => ({
          ...d,
          documents: d.documents.filter((doc) => doc.id !== id),
        })),

      // --- SOPs ---
      sops: data.sops,
      getSop: (id) => data.sops.find((s) => s.id === id),
      createSop: (input) => {
        const id = newId();
        const sop: Sop = {
          status: "active",
          version: 1,
          ...input,
          id,
          updated_at: now(),
        };
        setData((d) => ({ ...d, sops: [sop, ...d.sops] }));
        return id;
      },
      updateSop: (id, patch) =>
        setData((d) => ({
          ...d,
          sops: d.sops.map((s) =>
            s.id === id
              ? { ...s, ...patch, id: s.id, updated_at: now() }
              : s,
          ),
        })),
      deleteSop: (id) =>
        setData((d) => ({
          ...d,
          sops: d.sops.filter((s) => s.id !== id),
        })),

      resetToSeed: () => setData(seedData()),
    };
  }, [data, ready]);

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
