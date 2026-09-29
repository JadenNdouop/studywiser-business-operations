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
import { useWorkforce } from "@/lib/workforce/store";
import type { Worker } from "@/lib/workforce/types";
import { formatCurrency } from "@/lib/utils";

function ymd(daysFromNow: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return d.toISOString().slice(0, 10);
}

export function CompensationFormDialog({
  worker,
  trigger,
}: {
  worker: Worker;
  trigger: React.ReactNode;
}) {
  const { addCompensation } = useWorkforce();
  const [open, setOpen] = React.useState(false);
  const [periodStart, setPeriodStart] = React.useState(ymd(-14));
  const [periodEnd, setPeriodEnd] = React.useState(ymd(0));
  const [units, setUnits] = React.useState("");
  const [rate, setRate] = React.useState(
    worker.compensation_rate != null ? String(worker.compensation_rate) : "",
  );
  const [amount, setAmount] = React.useState("");
  const [amountEdited, setAmountEdited] = React.useState(false);
  const [notes, setNotes] = React.useState("");

  React.useEffect(() => {
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPeriodStart(ymd(-14));
      setPeriodEnd(ymd(0));
      setUnits("");
      setRate(
        worker.compensation_rate != null ? String(worker.compensation_rate) : "",
      );
      setAmount("");
      setAmountEdited(false);
      setNotes("");
    }
  }, [open, worker.compensation_rate]);

  // Suggested amount from units × rate, unless the user typed their own.
  const computed = (Number(units) || 0) * (Number(rate) || 0);
  const effectiveAmount = amountEdited ? Number(amount) || 0 : computed;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!(effectiveAmount > 0)) return;
    addCompensation(worker.id, {
      period_start: periodStart,
      period_end: periodEnd,
      units: units ? Number(units) : undefined,
      rate: Number(rate) || 0,
      amount_earned: effectiveAmount,
      notes: notes.trim() || undefined,
    });
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Log compensation</DialogTitle>
          <DialogDescription>
            What {worker.first_name} earned for a period.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Period start</Label>
              <Input
                type="date"
                value={periodStart}
                onChange={(e) => setPeriodStart(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Period end</Label>
              <Input
                type="date"
                value={periodEnd}
                onChange={(e) => setPeriodEnd(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Units (hrs / sessions)</Label>
              <Input
                type="number"
                min="0"
                step="0.5"
                value={units}
                onChange={(e) => setUnits(e.target.value)}
                placeholder="e.g. 18"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Rate ($)</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={rate}
                onChange={(e) => setRate(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Amount earned ($)</Label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={amountEdited ? amount : computed ? String(computed) : ""}
              onChange={(e) => {
                setAmount(e.target.value);
                setAmountEdited(true);
              }}
              placeholder="Auto-calculated from units × rate"
              required
            />
            {!amountEdited && computed > 0 && (
              <p className="text-xs text-muted-foreground">
                {units} × {formatCurrency(Number(rate) || 0)} ={" "}
                {formatCurrency(computed)} — edit if needed.
              </p>
            )}
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
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!(effectiveAmount > 0)}>
              Add
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
