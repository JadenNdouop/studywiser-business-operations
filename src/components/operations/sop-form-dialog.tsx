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
  SOP_STATUSES,
  type Sop,
  type SopStatus,
} from "@/lib/operations/types";
import { humanizeStatus } from "@/lib/status";

type FormState = {
  title: string;
  category: string;
  description: string;
  content: string;
  owner: string;
  status: SopStatus;
};

function initialState(sop?: Sop): FormState {
  return {
    title: sop?.title ?? "",
    category: sop?.category ?? "",
    description: sop?.description ?? "",
    content: sop?.content ?? "",
    owner: sop?.owner ?? "",
    status: sop?.status ?? "active",
  };
}

export function SopFormDialog({
  sop,
  trigger,
  open: controlledOpen,
  onOpenChange,
}: {
  sop?: Sop;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const { createSop, updateSop } = useOperations();
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(false);
  const open = controlledOpen ?? uncontrolledOpen;
  const setOpen = onOpenChange ?? setUncontrolledOpen;
  const [form, setForm] = React.useState<FormState>(() => initialState(sop));
  const isEdit = !!sop;

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (open) setForm(initialState(sop));
  }, [open, sop]);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim() || !form.content.trim()) return;
    const base = {
      title: form.title.trim(),
      category: form.category.trim() || undefined,
      description: form.description.trim() || undefined,
      content: form.content,
      owner: form.owner.trim() || undefined,
      status: form.status,
    };
    if (sop) {
      // Editing the body counts as a new version.
      const contentChanged = form.content !== sop.content;
      updateSop(sop.id, {
        ...base,
        version: contentChanged ? sop.version + 1 : sop.version,
      });
    } else {
      createSop(base);
    }
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit SOP" : "New SOP"}
            {isEdit && (
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                v{sop.version}
              </span>
            )}
          </DialogTitle>
          <DialogDescription>
            A standard operating procedure — the steps for doing something the
            same way each time.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <Field label="Title" required>
            <Input
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="e.g. Onboarding a new tutor"
              required
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Category">
              <Input
                value={form.category}
                onChange={(e) => set("category", e.target.value)}
                placeholder="e.g. Tutors"
              />
            </Field>
            <Field label="Owner">
              <Input
                value={form.owner}
                onChange={(e) => set("owner", e.target.value)}
                placeholder="Who maintains it"
              />
            </Field>
            <Field label="Status">
              <Select
                value={form.status}
                onValueChange={(v) => set("status", v as SopStatus)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SOP_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {humanizeStatus(s)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>
          <Field label="Summary">
            <Input
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="One line on what this covers"
            />
          </Field>
          <Field label="Steps / content" required>
            <Textarea
              value={form.content}
              onChange={(e) => set("content", e.target.value)}
              placeholder={"1. First step…\n2. Next step…"}
              className="min-h-[200px] font-mono text-sm"
            />
          </Field>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!form.title.trim() || !form.content.trim()}
            >
              {isEdit ? "Save changes" : "Create SOP"}
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
