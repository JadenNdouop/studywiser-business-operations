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
  PROJECT_STATUSES,
  type Priority,
  type Project,
  type ProjectStatus,
} from "@/lib/operations/types";
import { humanizeStatus } from "@/lib/status";

type FormState = {
  name: string;
  description: string;
  owner: string;
  start_date: string;
  due_date: string;
  priority: Priority | "";
  status: ProjectStatus;
  progress_percent: string;
  budget: string;
  notes: string;
};

function initialState(project?: Project): FormState {
  return {
    name: project?.name ?? "",
    description: project?.description ?? "",
    owner: project?.owner ?? "",
    start_date: project?.start_date ?? "",
    due_date: project?.due_date ?? "",
    priority: project?.priority ?? "",
    status: project?.status ?? "planned",
    progress_percent:
      project?.progress_percent != null
        ? String(project.progress_percent)
        : "",
    budget: project?.budget != null ? String(project.budget) : "",
    notes: project?.notes ?? "",
  };
}

export function ProjectFormDialog({
  project,
  trigger,
  open: controlledOpen,
  onOpenChange,
}: {
  project?: Project;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const { createProject, updateProject } = useOperations();
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(false);
  const open = controlledOpen ?? uncontrolledOpen;
  const setOpen = onOpenChange ?? setUncontrolledOpen;
  const [form, setForm] = React.useState<FormState>(() =>
    initialState(project),
  );
  const isEdit = !!project;

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (open) setForm(initialState(project));
  }, [open, project]);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;
    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      owner: form.owner.trim() || undefined,
      start_date: form.start_date || undefined,
      due_date: form.due_date || undefined,
      priority: form.priority || undefined,
      status: form.status,
      progress_percent: form.progress_percent
        ? Math.max(0, Math.min(100, Number(form.progress_percent)))
        : undefined,
      budget: form.budget ? Number(form.budget) : undefined,
      notes: form.notes.trim() || undefined,
    };
    if (project) updateProject(project.id, payload);
    else createProject(payload);
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit project" : "New project"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update this project's details."
              : "Start something and track it to done."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <Field label="Name" required>
            <Input
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="e.g. Fall enrollment campaign"
              required
            />
          </Field>
          <Field label="Description">
            <Textarea
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="What is this project about?"
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Owner">
              <Input
                value={form.owner}
                onChange={(e) => set("owner", e.target.value)}
                placeholder="Who's responsible"
              />
            </Field>
            <Field label="Status">
              <Select
                value={form.status}
                onValueChange={(v) => set("status", v as ProjectStatus)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PROJECT_STATUSES.map((s) => (
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
            <Field label="Progress (%)">
              <Input
                type="number"
                min="0"
                max="100"
                value={form.progress_percent}
                onChange={(e) => set("progress_percent", e.target.value)}
                placeholder="0–100"
              />
            </Field>
            <Field label="Start date">
              <Input
                type="date"
                value={form.start_date}
                onChange={(e) => set("start_date", e.target.value)}
              />
            </Field>
            <Field label="Due date">
              <Input
                type="date"
                value={form.due_date}
                onChange={(e) => set("due_date", e.target.value)}
              />
            </Field>
            <Field label="Budget ($)">
              <Input
                type="number"
                min="0"
                step="0.01"
                value={form.budget}
                onChange={(e) => set("budget", e.target.value)}
                placeholder="Optional"
              />
            </Field>
          </div>
          <Field label="Notes">
            <Textarea
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              placeholder="Optional…"
            />
          </Field>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!form.name.trim()}>
              {isEdit ? "Save changes" : "Create project"}
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
