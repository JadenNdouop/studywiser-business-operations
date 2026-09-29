"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";

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
import { useCrm } from "@/lib/crm/store";
import {
  ALL_STAGES,
  LEAD_SOURCES,
  type Lead,
  type LeadSource,
  type PipelineStage,
} from "@/lib/crm/types";
import { humanizeStatus } from "@/lib/status";

type FormState = {
  guardian_name: string;
  student_name: string;
  grade: string;
  subject_needed: string;
  email: string;
  phone: string;
  location: string;
  lead_source: LeadSource | "";
  estimated_value: string;
  pipeline_stage: PipelineStage;
  next_follow_up_date: string;
  notes: string;
};

function initialState(lead?: Lead): FormState {
  return {
    guardian_name: lead?.guardian_name ?? "",
    student_name: lead?.student_name ?? "",
    grade: lead?.grade ?? "",
    subject_needed: lead?.subject_needed ?? "",
    email: lead?.email ?? "",
    phone: lead?.phone ?? "",
    location: lead?.location ?? "",
    lead_source: lead?.lead_source ?? "",
    estimated_value: lead?.estimated_value != null ? String(lead.estimated_value) : "",
    pipeline_stage: lead?.pipeline_stage ?? "new_lead",
    next_follow_up_date: lead?.next_follow_up_date ?? "",
    notes: lead?.notes ?? "",
  };
}

export function LeadFormDialog({
  lead,
  trigger,
  open: controlledOpen,
  onOpenChange,
  onSaved,
}: {
  lead?: Lead;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSaved?: (id: string) => void;
}) {
  const { createLead, updateLead } = useCrm();
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(false);
  const open = controlledOpen ?? uncontrolledOpen;
  const setOpen = onOpenChange ?? setUncontrolledOpen;

  const [form, setForm] = React.useState<FormState>(() => initialState(lead));
  const [saving, setSaving] = React.useState(false);
  const isEdit = !!lead;

  // Reset the fields whenever the dialog opens.
  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (open) setForm(initialState(lead));
  }, [open, lead]);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.guardian_name.trim()) return;
    setSaving(true);

    const payload = {
      guardian_name: form.guardian_name.trim(),
      student_name: form.student_name.trim() || undefined,
      grade: form.grade.trim() || undefined,
      subject_needed: form.subject_needed.trim() || undefined,
      email: form.email.trim() || undefined,
      phone: form.phone.trim() || undefined,
      location: form.location.trim() || undefined,
      lead_source: form.lead_source || undefined,
      estimated_value: form.estimated_value
        ? Number(form.estimated_value)
        : undefined,
      pipeline_stage: form.pipeline_stage,
      next_follow_up_date: form.next_follow_up_date || undefined,
      notes: form.notes.trim() || undefined,
    };

    let id: string;
    if (lead) {
      updateLead(lead.id, payload);
      id = lead.id;
    } else {
      id = createLead(payload);
    }
    setSaving(false);
    setOpen(false);
    onSaved?.(id);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit lead" : "New lead"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update this lead's details."
              : "Add a prospective family to the pipeline."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Guardian name" required>
              <Input
                value={form.guardian_name}
                onChange={(e) => set("guardian_name", e.target.value)}
                placeholder="e.g. Michelle Carter"
                required
              />
            </Field>
            <Field label="Student name">
              <Input
                value={form.student_name}
                onChange={(e) => set("student_name", e.target.value)}
                placeholder="e.g. Jayden Carter"
              />
            </Field>
            <Field label="Grade">
              <Input
                value={form.grade}
                onChange={(e) => set("grade", e.target.value)}
                placeholder="e.g. 9th"
              />
            </Field>
            <Field label="Subject needed">
              <Input
                value={form.subject_needed}
                onChange={(e) => set("subject_needed", e.target.value)}
                placeholder="e.g. Algebra I"
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
            <Field label="Location">
              <Input
                value={form.location}
                onChange={(e) => set("location", e.target.value)}
                placeholder="City, State"
              />
            </Field>
            <Field label="Lead source">
              <Select
                value={form.lead_source || undefined}
                onValueChange={(v) => set("lead_source", v as LeadSource)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a source" />
                </SelectTrigger>
                <SelectContent>
                  {LEAD_SOURCES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {humanizeStatus(s)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Estimated value ($)">
              <Input
                type="number"
                min="0"
                step="1"
                value={form.estimated_value}
                onChange={(e) => set("estimated_value", e.target.value)}
                placeholder="e.g. 1200"
              />
            </Field>
            <Field label="Pipeline stage">
              <Select
                value={form.pipeline_stage}
                onValueChange={(v) => set("pipeline_stage", v as PipelineStage)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ALL_STAGES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {humanizeStatus(s)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Next follow-up">
              <Input
                type="date"
                value={form.next_follow_up_date}
                onChange={(e) => set("next_follow_up_date", e.target.value)}
              />
            </Field>
          </div>

          <Field label="Notes">
            <Textarea
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              placeholder="Anything worth remembering about this family…"
            />
          </Field>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving || !form.guardian_name.trim()}>
              {saving && <Loader2 className="animate-spin" />}
              {isEdit ? "Save changes" : "Add lead"}
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
