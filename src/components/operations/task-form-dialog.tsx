"use client";

import * as React from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useOperations } from "@/lib/operations/store";
import {
  PRIORITIES,
  TASK_STATUSES,
  type Priority,
  type Task,
  type TaskStatus,
} from "@/lib/operations/types";
import { humanizeStatus } from "@/lib/status";

const NO_PROJECT = "__none__";

type FormState = {
  title: string;
  description: string;
  project_id: string;
  assignee: string;
  priority: Priority | "";
  status: TaskStatus;
  due_date: string;
};

function initialState(task?: Task, defaultProjectId?: string): FormState {
  return {
    title: task?.title ?? "",
    description: task?.description ?? "",
    project_id: task?.project_id ?? defaultProjectId ?? "",
    assignee: task?.assignee ?? "",
    priority: task?.priority ?? "",
    status: task?.status ?? "to_do",
    due_date: task?.due_date ?? "",
  };
}

export function TaskFormDialog({
  task,
  defaultProjectId,
  lockProject,
  trigger,
  open: controlledOpen,
  onOpenChange,
}: {
  task?: Task;
  defaultProjectId?: string;
  /** When true, hide the project picker (e.g. on a project detail page). */
  lockProject?: boolean;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const { projects, createTask, updateTask } = useOperations();
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(false);
  const open = controlledOpen ?? uncontrolledOpen;
  const setOpen = onOpenChange ?? setUncontrolledOpen;
  const [form, setForm] = React.useState<FormState>(() =>
    initialState(task, defaultProjectId),
  );
  const isEdit = !!task;

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (open) setForm(initialState(task, defaultProjectId));
  }, [open, task, defaultProjectId]);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) return;
    const payload = {
      title: form.title.trim(),
      description: form.description.trim() || undefined,
      project_id: form.project_id || undefined,
      assignee: form.assignee.trim() || undefined,
      priority: form.priority || undefined,
      status: form.status,
      due_date: form.due_date || undefined,
    };
    if (task) updateTask(task.id, payload);
    else createTask(payload);
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit task" : "New task"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Update this task." : "Add something to get done."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <Field label="Title" required>
            <Input
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="e.g. Draft fall promo landing page"
              required
            />
          </Field>
          <Field label="Description">
            <Textarea
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="Optional details…"
            />
          </Field>
          {!lockProject && (
            <Field label="Project">
              <Select
                value={form.project_id || NO_PROJECT}
                onValueChange={(v) =>
                  set("project_id", v === NO_PROJECT ? "" : v)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="No project" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_PROJECT}>No project</SelectItem>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          )}
          <div className="grid grid-cols-2 gap-4">
            <Field label="Status">
              <Select
                value={form.status}
                onValueChange={(v) => set("status", v as TaskStatus)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TASK_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {humanizeStatus(s)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Priority">
              <Select
                value={form.priority || undefined}
                onValueChange={(v) => set("priority", v as Priority)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map((p) => (
                    <SelectItem key={p} value={p}>
                      {humanizeStatus(p)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Assignee">
              <Input
                value={form.assignee}
                onChange={(e) => set("assignee", e.target.value)}
                placeholder="Who's on it"
              />
            </Field>
            <Field label="Due date">
              <Input
                type="date"
                value={form.due_date}
                onChange={(e) => set("due_date", e.target.value)}
              />
            </Field>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!form.title.trim()}>
              {isEdit ? "Save changes" : "Create task"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label>
        {label}
        {required && <span className="text-destructive"> *</span>}
      </Label>
      {children}
    </div>
  );
}
