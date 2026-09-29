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
import { useWorkforce } from "@/lib/workforce/store";
import {
  COMPENSATION_TYPES,
  WORKER_STATUSES,
  WORKER_TYPES,
  type CompensationType,
  type Worker,
  type WorkerStatus,
  type WorkerType,
} from "@/lib/workforce/types";
import { humanizeStatus } from "@/lib/status";

type FormState = {
  first_name: string;
  last_name: string;
  worker_type: WorkerType;
  role_title: string;
  status: WorkerStatus;
  email: string;
  phone: string;
  compensation_type: CompensationType | "";
  compensation_rate: string;
  start_date: string;
  contractor_status: string;
  documentation_status: string;
  notes: string;
};

function initialState(worker?: Worker): FormState {
  return {
    first_name: worker?.first_name ?? "",
    last_name: worker?.last_name ?? "",
    worker_type: worker?.worker_type ?? "tutor",
    role_title: worker?.role_title ?? "",
    status: worker?.status ?? "active",
    email: worker?.email ?? "",
    phone: worker?.phone ?? "",
    compensation_type: worker?.compensation_type ?? "",
    compensation_rate:
      worker?.compensation_rate != null ? String(worker.compensation_rate) : "",
    start_date: worker?.start_date ?? "",
    contractor_status: worker?.contractor_status ?? "",
    documentation_status: worker?.documentation_status ?? "",
    notes: worker?.notes ?? "",
  };
}

export function WorkerFormDialog({
  worker,
  trigger,
  open: controlledOpen,
  onOpenChange,
}: {
  worker?: Worker;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const { createWorker, updateWorker } = useWorkforce();
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(false);
  const open = controlledOpen ?? uncontrolledOpen;
  const setOpen = onOpenChange ?? setUncontrolledOpen;
  const [form, setForm] = React.useState<FormState>(() => initialState(worker));
  const isEdit = !!worker;

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (open) setForm(initialState(worker));
  }, [open, worker]);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  const showTutorFields =
    form.worker_type === "tutor" || form.worker_type === "contractor";

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.first_name.trim() || !form.last_name.trim()) return;
    const payload = {
      first_name: form.first_name.trim(),
      last_name: form.last_name.trim(),
      worker_type: form.worker_type,
      role_title: form.role_title.trim() || undefined,
      status: form.status,
      email: form.email.trim() || undefined,
      phone: form.phone.trim() || undefined,
      compensation_type: form.compensation_type || undefined,
      compensation_rate: form.compensation_rate
        ? Number(form.compensation_rate)
        : undefined,
      start_date: form.start_date || undefined,
      contractor_status: showTutorFields
        ? form.contractor_status.trim() || undefined
        : undefined,
      documentation_status: showTutorFields
        ? form.documentation_status.trim() || undefined
        : undefined,
      notes: form.notes.trim() || undefined,
    };
    if (worker) updateWorker(worker.id, payload);
    else createWorker(payload);
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit worker" : "New worker"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update this worker's details."
              : "Add a tutor, contractor, or employee."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="First name" required>
              <Input
                value={form.first_name}
                onChange={(e) => set("first_name", e.target.value)}
                required
              />
            </Field>
            <Field label="Last name" required>
              <Input
                value={form.last_name}
                onChange={(e) => set("last_name", e.target.value)}
                required
              />
            </Field>
            <Field label="Type">
              <Select
                value={form.worker_type}
                onValueChange={(v) => set("worker_type", v as WorkerType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {WORKER_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {humanizeStatus(t)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Role title">
              <Input
                value={form.role_title}
                onChange={(e) => set("role_title", e.target.value)}
                placeholder="e.g. Math Tutor"
              />
            </Field>
            <Field label="Status">
              <Select
                value={form.status}
                onValueChange={(v) => set("status", v as WorkerStatus)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {WORKER_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {humanizeStatus(s)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Start date">
              <Input
                type="date"
                value={form.start_date}
                onChange={(e) => set("start_date", e.target.value)}
              />
            </Field>
            <Field label="Email">
              <Input
                type="email"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                placeholder="name@example.com"
              />
            </Field>
            <Field label="Phone">
              <Input
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
                placeholder="(202) 555-0100"
              />
            </Field>
            <Field label="Compensation type">
              <Select
                value={form.compensation_type || undefined}
                onValueChange={(v) =>
                  set("compensation_type", v as CompensationType)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {COMPENSATION_TYPES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {humanizeStatus(c)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Rate ($)">
              <Input
                type="number"
                min="0"
                step="0.01"
                value={form.compensation_rate}
                onChange={(e) => set("compensation_rate", e.target.value)}
                placeholder="Per hour / session / period"
              />
            </Field>
            {showTutorFields && (
              <>
                <Field label="Contractor status">
                  <Input
                    value={form.contractor_status}
                    onChange={(e) => set("contractor_status", e.target.value)}
                    placeholder="e.g. W-9 on file"
                  />
                </Field>
                <Field label="Documentation status">
                  <Input
                    value={form.documentation_status}
                    onChange={(e) =>
                      set("documentation_status", e.target.value)
                    }
                    placeholder="e.g. Complete"
                  />
                </Field>
              </>
            )}
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
            <Button
              type="submit"
              disabled={!form.first_name.trim() || !form.last_name.trim()}
            >
              {isEdit ? "Save changes" : "Add worker"}
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
