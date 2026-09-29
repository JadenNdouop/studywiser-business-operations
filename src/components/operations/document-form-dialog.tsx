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
  DOCUMENT_CATEGORIES,
  type BusinessDocument,
  type DocumentCategory,
} from "@/lib/operations/types";
import { humanizeStatus } from "@/lib/status";

type FormState = {
  title: string;
  category: DocumentCategory | "";
  external_url: string;
  notes: string;
};

function initialState(doc?: BusinessDocument): FormState {
  return {
    title: doc?.title ?? "",
    category: doc?.category ?? "",
    external_url: doc?.external_url ?? "",
    notes: doc?.notes ?? "",
  };
}

export function DocumentFormDialog({
  document,
  trigger,
  open: controlledOpen,
  onOpenChange,
}: {
  document?: BusinessDocument;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const { createDocument, updateDocument } = useOperations();
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(false);
  const open = controlledOpen ?? uncontrolledOpen;
  const setOpen = onOpenChange ?? setUncontrolledOpen;
  const [form, setForm] = React.useState<FormState>(() =>
    initialState(document),
  );
  const isEdit = !!document;

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (open) setForm(initialState(document));
  }, [open, document]);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim() || !form.external_url.trim()) return;
    const payload = {
      title: form.title.trim(),
      category: form.category || undefined,
      external_url: form.external_url.trim(),
      notes: form.notes.trim() || undefined,
    };
    if (document) updateDocument(document.id, payload);
    else createDocument(payload);
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit document" : "New document"}</DialogTitle>
          <DialogDescription>
            Track a document by its title and a link to where it lives.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <Field label="Title" required>
            <Input
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="e.g. Contractor agreement (template)"
              required
            />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Category">
              <Select
                value={form.category || undefined}
                onValueChange={(v) => set("category", v as DocumentCategory)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {DOCUMENT_CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {humanizeStatus(c)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>
          <Field label="Link" required>
            <Input
              type="url"
              value={form.external_url}
              onChange={(e) => set("external_url", e.target.value)}
              placeholder="https://drive.google.com/…"
              required
            />
          </Field>
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
              disabled={!form.title.trim() || !form.external_url.trim()}
            >
              {isEdit ? "Save changes" : "Add document"}
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
