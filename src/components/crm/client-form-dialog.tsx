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
import { useCrm } from "@/lib/crm/store";
import { CLIENT_STATUSES, type Client, type ClientStatus } from "@/lib/crm/types";
import { humanizeStatus } from "@/lib/status";

type FormState = {
  family_name: string;
  primary_contact_name: string;
  email: string;
  phone: string;
  status: ClientStatus;
  acquisition_source: string;
  customer_since: string;
  billing_notes: string;
  notes: string;
};

function initialState(client?: Client): FormState {
  return {
    family_name: client?.family_name ?? "",
    primary_contact_name: client?.primary_contact_name ?? "",
    email: client?.email ?? "",
    phone: client?.phone ?? "",
    status: client?.status ?? "active",
    acquisition_source: client?.acquisition_source ?? "",
    customer_since: client?.customer_since ?? "",
    billing_notes: client?.billing_notes ?? "",
    notes: client?.notes ?? "",
  };
}

export function ClientFormDialog({
  client,
  trigger,
  open: controlledOpen,
  onOpenChange,
  onSaved,
}: {
  client?: Client;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSaved?: (id: string) => void;
}) {
  const { createClient, updateClient } = useCrm();
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(false);
  const open = controlledOpen ?? uncontrolledOpen;
  const setOpen = onOpenChange ?? setUncontrolledOpen;
  const [form, setForm] = React.useState<FormState>(() => initialState(client));
  const isEdit = !!client;

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (open) setForm(initialState(client));
  }, [open, client]);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.family_name.trim()) return;
    const payload = {
      family_name: form.family_name.trim(),
      primary_contact_name: form.primary_contact_name.trim() || undefined,
      email: form.email.trim() || undefined,
      phone: form.phone.trim() || undefined,
      status: form.status,
      acquisition_source: form.acquisition_source.trim() || undefined,
      customer_since: form.customer_since || undefined,
      billing_notes: form.billing_notes.trim() || undefined,
      notes: form.notes.trim() || undefined,
    };
    const id = client ? (updateClient(client.id, payload), client.id) : createClient(payload);
    setOpen(false);
    onSaved?.(id);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit client" : "New client"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update this client's details."
              : "Add a client relationship."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Family name" required>
              <Input
                value={form.family_name}
                onChange={(e) => set("family_name", e.target.value)}
                placeholder="e.g. Okafor Family"
                required
              />
            </Field>
            <Field label="Primary contact">
              <Input
                value={form.primary_contact_name}
                onChange={(e) => set("primary_contact_name", e.target.value)}
                placeholder="e.g. Amara Okafor"
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
            <Field label="Status">
              <Select
                value={form.status}
                onValueChange={(v) => set("status", v as ClientStatus)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CLIENT_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {humanizeStatus(s)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Customer since">
              <Input
                type="date"
                value={form.customer_since}
                onChange={(e) => set("customer_since", e.target.value)}
              />
            </Field>
            <Field label="Acquisition source">
              <Input
                value={form.acquisition_source}
                onChange={(e) => set("acquisition_source", e.target.value)}
                placeholder="e.g. referral"
              />
            </Field>
          </div>
          <Field label="Billing notes">
            <Textarea
              value={form.billing_notes}
              onChange={(e) => set("billing_notes", e.target.value)}
              placeholder="Billing cadence, terms…"
            />
          </Field>
          <Field label="Notes">
            <Textarea
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              placeholder="Anything worth remembering…"
            />
          </Field>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!form.family_name.trim()}>
              {isEdit ? "Save changes" : "Add client"}
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
