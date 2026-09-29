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
import { useFinance } from "@/lib/finance/store";
import type { Invoice } from "@/lib/finance/types";
import { humanizeStatus } from "@/lib/status";
import { formatCurrency } from "@/lib/utils";

const METHODS = ["bank_transfer", "card", "cash", "check", "other"];

export function RecordPaymentDialog({
  invoice,
  trigger,
}: {
  invoice: Invoice;
  trigger: React.ReactNode;
}) {
  const { recordPayment } = useFinance();
  const [open, setOpen] = React.useState(false);
  const [amount, setAmount] = React.useState(String(invoice.balance));
  const [date, setDate] = React.useState(new Date().toISOString().slice(0, 10));
  const [method, setMethod] = React.useState<string>("bank_transfer");
  const [reference, setReference] = React.useState("");

  React.useEffect(() => {
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAmount(String(invoice.balance));
      setDate(new Date().toISOString().slice(0, 10));
      setReference("");
    }
  }, [open, invoice.balance]);

  const numeric = Number(amount);
  const valid = numeric > 0 && numeric <= invoice.balance + 0.001;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid) return;
    recordPayment(invoice.id, {
      amount: numeric,
      payment_date: date,
      payment_method: method,
      reference_number: reference.trim() || undefined,
    });
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Record a payment</DialogTitle>
          <DialogDescription>
            {invoice.invoice_number} · balance {formatCurrency(invoice.balance)}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Amount</Label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
            {!valid && amount !== "" && (
              <p className="text-xs text-destructive">
                Enter an amount between $0 and the balance.
              </p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Date</Label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Method</Label>
              <Select value={method} onValueChange={setMethod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {METHODS.map((m) => (
                    <SelectItem key={m} value={m}>
                      {humanizeStatus(m)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Reference (optional)</Label>
            <Input
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="Check #, transaction id…"
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!valid}>
              Record payment
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
