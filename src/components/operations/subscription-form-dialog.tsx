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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useOperations } from "@/lib/operations/store";
import {
  SUBSCRIPTION_STATUSES,
  type SubBillingFrequency,
  type Subscription,
  type SubscriptionStatus,
} from "@/lib/operations/types";
import { humanizeStatus } from "@/lib/status";

const NO_VENDOR = "__none__";

type FormState = {
  service_name: string;
  vendor_id: string;
  category: string;
  billing_frequency: SubBillingFrequency;
  cost: string;
  renewal_date: string;
  payment_method: string;
  owner: string;
  status: SubscriptionStatus;
};

function initialState(sub?: Subscription): FormState {
  const freq: SubBillingFrequency = sub?.billing_frequency ?? "monthly";
  const cost =
    freq === "annual"
      ? sub?.annual_cost
      : sub?.monthly_cost;
  return {
    service_name: sub?.service_name ?? "",
    vendor_id: sub?.vendor_id ?? "",
    category: sub?.category ?? "",
    billing_frequency: freq,
    cost: cost != null ? String(cost) : "",
    renewal_date: sub?.renewal_date ?? "",
    payment_method: sub?.payment_method ?? "",
    owner: sub?.owner ?? "",
    status: sub?.status ?? "active",
  };
}

export function SubscriptionFormDialog({
  subscription,
  trigger,
  open: controlledOpen,
  onOpenChange,
}: {
  subscription?: Subscription;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const { vendors, createSubscription, updateSubscription } = useOperations();
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(false);
  const open = controlledOpen ?? uncontrolledOpen;
  const setOpen = onOpenChange ?? setUncontrolledOpen;
  const [form, setForm] = React.useState<FormState>(() =>
    initialState(subscription),
  );
  const isEdit = !!subscription;

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (open) setForm(initialState(subscription));
  }, [open, subscription]);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.service_name.trim()) return;
    const costNum = form.cost ? Number(form.cost) : undefined;
    const payload = {
      service_name: form.service_name.trim(),
      vendor_id: form.vendor_id || undefined,
      category: form.category.trim() || undefined,
      billing_frequency: form.billing_frequency,
      monthly_cost:
        form.billing_frequency === "monthly" ? costNum : undefined,
      annual_cost:
        form.billing_frequency === "annual" ? costNum : undefined,
      renewal_date: form.renewal_date || undefined,
      payment_method: form.payment_method.trim() || undefined,
      owner: form.owner.trim() || undefined,
      status: form.status,
    };
    if (subscription) updateSubscription(subscription.id, payload);
    else createSubscription(payload);
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit subscription" : "New subscription"}
          </DialogTitle>
          <DialogDescription>
            A recurring software or service cost.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <Field label="Service name" required>
            <Input
              value={form.service_name}
              onChange={(e) => set("service_name", e.target.value)}
              placeholder="e.g. QuickBooks Online"
              required
            />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Billing">
              <Select
                value={form.billing_frequency}
                onValueChange={(v) =>
                  set("billing_frequency", v as SubBillingFrequency)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="annual">Annual</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field
              label={
                form.billing_frequency === "annual"
                  ? "Annual cost ($)"
                  : "Monthly cost ($)"
              }
            >
              <Input
                type="number"
                min="0"
                step="0.01"
                value={form.cost}
                onChange={(e) => set("cost", e.target.value)}
              />
            </Field>
            <Field label="Category">
              <Input
                value={form.category}
                onChange={(e) => set("category", e.target.value)}
                placeholder="e.g. Software"
              />
            </Field>
            <Field label="Status">
              <Select
                value={form.status}
                onValueChange={(v) => set("status", v as SubscriptionStatus)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SUBSCRIPTION_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {humanizeStatus(s)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Renewal date">
              <Input
                type="date"
                value={form.renewal_date}
                onChange={(e) => set("renewal_date", e.target.value)}
              />
            </Field>
            <Field label="Payment method">
              <Input
                value={form.payment_method}
                onChange={(e) => set("payment_method", e.target.value)}
                placeholder="e.g. Visa •• 4242"
              />
            </Field>
            <Field label="Owner">
              <Input
                value={form.owner}
                onChange={(e) => set("owner", e.target.value)}
                placeholder="Who manages it"
              />
            </Field>
            <Field label="Vendor">
              <Select
                value={form.vendor_id || NO_VENDOR}
                onValueChange={(v) =>
                  set("vendor_id", v === NO_VENDOR ? "" : v)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="No vendor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_VENDOR}>No vendor</SelectItem>
                  {vendors.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!form.service_name.trim()}>
              {isEdit ? "Save changes" : "Create subscription"}
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
