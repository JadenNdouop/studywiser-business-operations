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
import { EmptyState } from "@/components/states/empty-state";
import { useWorkforce } from "@/lib/workforce/store";
import { unpaidRecords } from "@/lib/workforce/reporting";
import type { Worker } from "@/lib/workforce/types";
import { formatCurrency } from "@/lib/utils";

const PAYMENT_METHODS = ["bank_transfer", "check", "cash", "payroll", "other"];

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export function PayWorkerDialog({
  worker,
  trigger,
}: {
  worker: Worker;
  trigger: React.ReactNode;
}) {
  const { records, items, payWorker } = useWorkforce();
  const [open, setOpen] = React.useState(false);
  const [selected, setSelected] = React.useState<Record<string, boolean>>({});
  const [paymentDate, setPaymentDate] = React.useState(today());
  const [method, setMethod] = React.useState("bank_transfer");
  const [reference, setReference] = React.useState("");
  const [notes, setNotes] = React.useState("");

  // What this worker is owed, most recent period first.
  const unpaid = React.useMemo(
    () =>
      unpaidRecords(worker.id, records, items).sort((a, b) =>
        b.period_end.localeCompare(a.period_end),
      ),
    [worker.id, records, items],
  );

  // When the dialog opens, pre-select every unpaid record (pay in full is the
  // common case) and reset the payment fields.
  React.useEffect(() => {
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelected(Object.fromEntries(unpaid.map((r) => [r.id, true])));
      setPaymentDate(today());
      setMethod("bank_transfer");
      setReference("");
      setNotes("");
    }
    // Only re-seed selection when the dialog transitions open.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const selectedIds = unpaid.filter((r) => selected[r.id]).map((r) => r.id);
  const total = unpaid
    .filter((r) => selected[r.id])
    .reduce((sum, r) => sum + r.amount_earned, 0);

  function toggle(id: string) {
    setSelected((s) => ({ ...s, [id]: !s[id] }));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (selectedIds.length === 0) return;
    payWorker(worker.id, selectedIds, {
      payment_date: paymentDate,
      payment_method: method,
      reference_number: reference.trim() || undefined,
      notes: notes.trim() || undefined,
    });
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            Pay {worker.first_name} {worker.last_name}
          </DialogTitle>
          <DialogDescription>
            Choose which earned periods this payment settles.
          </DialogDescription>
        </DialogHeader>

        {unpaid.length === 0 ? (
          <EmptyState
            title="Nothing outstanding"
            description="Every compensation record for this worker has already been paid."
          />
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-2">
              <Label>Outstanding periods</Label>
              <div className="divide-y rounded-md border">
                {unpaid.map((r) => (
                  <label
                    key={r.id}
                    className="flex cursor-pointer items-center gap-3 px-3 py-2.5 hover:bg-muted/50"
                  >
                    <input
                      type="checkbox"
                      className="h-4 w-4 accent-primary"
                      checked={!!selected[r.id]}
                      onChange={() => toggle(r.id)}
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        {r.period_start} → {r.period_end}
                      </p>
                      {r.notes && (
                        <p className="text-xs text-muted-foreground">
                          {r.notes}
                        </p>
                      )}
                    </div>
                    <span className="text-sm font-medium tabular-nums">
                      {formatCurrency(r.amount_earned)}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-2.5">
              <span className="text-sm text-muted-foreground">
                Payment total
              </span>
              <span className="text-base font-semibold tabular-nums">
                {formatCurrency(total)}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Payment date</Label>
                <Input
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Method</Label>
                <Select value={method} onValueChange={setMethod}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_METHODS.map((m) => (
                      <SelectItem key={m} value={m}>
                        {m
                          .split("_")
                          .map((w) => w[0].toUpperCase() + w.slice(1))
                          .join(" ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Reference number</Label>
              <Input
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="Optional — e.g. check #1042"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Notes</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional…"
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={selectedIds.length === 0}>
                Pay {formatCurrency(total)}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
