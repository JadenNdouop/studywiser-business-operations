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
  BILLING_FREQUENCIES,
  VENDOR_STATUSES,
  type BillingFrequency,
  type Vendor,
  type VendorStatus,
} from "@/lib/operations/types";
import { humanizeStatus } from "@/lib/status";

type FormState = {
  name: string;
  category: string;
  contact_name: string;
  email: string;
  website: string;
  service_provided: string;
  cost: string;
  billing_frequency: BillingFrequency | "";
  start_date: string;
  renewal_date: string;
  status: VendorStatus;
  notes: string;
};

function initialState(vendor?: Vendor): FormState {
  return {
    name: vendor?.name ?? "",
    category: vendor?.category ?? "",
    contact_name: vendor?.contact_name ?? "",
    email: vendor?.email ?? "",
    website: vendor?.website ?? "",
    service_provided: vendor?.service_provided ?? "",
    cost: vendor?.cost != null ? String(vendor.cost) : "",
    billing_frequency: vendor?.billing_frequency ?? "",
    start_date: vendor?.start_date ?? "",
    renewal_date: vendor?.renewal_date ?? "",
    status: vendor?.status ?? "active",
    notes: vendor?.notes ?? "",
  };
}

export function VendorFormDialog({
  vendor,
  trigger,
  open: controlledOpen,
  onOpenChange,
}: {
  vendor?: Vendor;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const { createVendor, updateVendor } = useOperations();
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(false);
  const open = controlledOpen ?? uncontrolledOpen;
  const setOpen = onOpenChange ?? setUncontrolledOpen;
  const [form, setForm] = React.useState<FormState>(() =>
    initialState(vendor),
  );
  const isEdit = !!vendor;

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (open) setForm(initialState(vendor));
  }, [open, vendor]);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;
    const payload = {
      name: form.name.trim(),
      category: form.category.trim() || undefined,
      contact_name: form.contact_name.trim() || undefined,
      email: form.email.trim() || undefined,
      website: form.website.trim() || undefined,
      service_provided: form.service_provided.trim() || undefined,
      cost: form.cost ? Number(form.cost) : undefined,
      billing_frequency: form.billing_frequency || undefined,
      start_date: form.start_date || undefined,
      renewal_date: form.renewal_date || undefined,
      status: form.status,
      notes: form.notes.trim() || undefined,
    };
    if (vendor) updateVendor(vendor.id, payload);
    else createVendor(payload);
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit vendor" : "New vendor"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update this vendor's details."
              : "Track a supplier or service provider and its renewal."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name" required>
              <Input
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="e.g. Google Workspace"
                required
              />
            </Field>
            <Field label="Category">
              <Input
                value={form.category}
                onChange={(e) => set("category", e.target.value)}
                placeholder="e.g. Software"
              />
            </Field>
            <Field label="Contact name">
              <Input
                value={form.contact_name}
                onChange={(e) => set("contact_name", e.target.value)}
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
            <Field label="Website">
              <Input
                value={form.website}
                onChange={(e) => set("website", e.target.value)}
                placeholder="example.com"
              />
            </Field>
            <Field label="Status">
              <Select
                value={form.status}
                onValueChange={(v) => set("status", v as VendorStatus)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {VENDOR_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {humanizeStatus(s)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Cost ($)">
              <Input
                type="number"
                min="0"
                step="0.01"
                value={form.cost}
                onChange={(e) => set("cost", e.target.value)}
              />
            </Field>
            <Field label="Billing frequency">
              <Select
                value={form.billing_frequency || undefined}
                onValueChange={(v) =>
                  set("billing_frequency", v as BillingFrequency)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {BILLING_FREQUENCIES.map((b) => (
                    <SelectItem key={b} value={b}>
                      {humanizeStatus(b)}
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
            <Field label="Renewal date">
              <Input
                type="date"
                value={form.renewal_date}
                onChange={(e) => set("renewal_date", e.target.value)}
              />
            </Field>
          </div>
          <Field label="Service provided">
            <Input
              value={form.service_provided}
              onChange={(e) => set("service_provided", e.target.value)}
              placeholder="What they do for you"
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
            <Button type="submit" disabled={!form.name.trim()}>
              {isEdit ? "Save changes" : "Create vendor"}
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
