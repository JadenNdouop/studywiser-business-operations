"use client";

/**
 * Operations store — the demo-mode "backend" for projects, tasks, and the
 * business calendar. Same pattern as CRM/Finance/Workforce: React state
 * persisted to localStorage, one place that knows how data is stored.
 */

import * as React from "react";

import type { OperationsData } from "./seed";
import { seedData } from "./seed";
import type { BusinessEvent, Project, Task } from "./types";

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
  resetToSeed: () => void;
}

const OperationsContext = React.createContext<OperationsContextValue | null>(
  null,
);

const EMPTY: OperationsData = { projects: [], tasks: [], events: [] };

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
