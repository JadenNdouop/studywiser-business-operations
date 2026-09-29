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
import { useFinance } from "@/lib/finance/store";
import {
  EXPENSE_CATEGORIES,
  EXPENSE_STATUSES,
  type Expense,
  type ExpenseCategory,
  type ExpensePaymentStatus,
  type RecurringStatus,
} from "@/lib/finance/types";
import { humanizeStatus } from "@/lib/status";

type FormState = {
  payee: string;
  category: ExpenseCategory;
  amount: string;
  date: string;
  due_date: string;
  payment_status: ExpensePaymentStatus;
  payment_date: string;
  payment_method: string;
  recurring_status: RecurringStatus;
  notes: string;
};

function initialState(expense?: Expense): FormState {
  return {
    payee: expense?.payee ?? "",
    category: expense?.category ?? "other",
    amount: expense?.amount != null ? String(expense.amount) : "",
    date: expense?.date ?? new Date().toISOString().slice(0, 10),
    due_date: expense?.due_date ?? "",
    payment_status: expense?.payment_status ?? "pending",
    payment_date: expense?.payment_date ?? "",
    payment_method: expense?.payment_method ?? "",
    recurring_status: expense?.recurring_status ?? "one_time",
    notes: expense?.notes ?? "",
  };
}

export function ExpenseFormDialog({
  expense,
  trigger,
  open: controlledOpen,
  onOpenChange,
}: {
  expense?: Expense;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const { createExpense, updateExpense } = useFinance();
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(false);
  const open = controlledOpen ?? uncontrolledOpen;
  const setOpen = onOpenChange ?? setUncontrolledOpen;
  const [form, setForm] = React.useState<FormState>(() => initialState(expense));
  const isEdit = !!expense;

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (open) setForm(initialState(expense));
  }, [open, expense]);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.payee.trim() || !(Number(form.amount) > 0)) return;
    const payload = {
      payee: form.payee.trim(),
      category: form.category,
      amount: Number(form.amount),
      date: form.date,
      due_date: form.due_date || undefined,
      payment_status: form.payment_status,
      payment_date:
        form.payment_status === "paid"
          ? form.payment_date || new Date().toISOString().slice(0, 10)
          : undefined,
      payment_method: form.payment_method.trim() || undefined,
      recurring_status: form.recurring_status,
      notes: form.notes.trim() || undefined,
    };
    if (expense) updateExpense(expense.id, payload);
    else createExpense(payload);
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit expense" : "New expense"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Update this expense." : "Record money going out."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>
                Payee<span className="text-destructive"> *</span>
              </Label>
              <Input
                value={form.payee}
                onChange={(e) => set("payee", e.target.value)}
                placeholder="Who it's paid to"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label>
                Amount ($)<span className="text-destructive"> *</span>
              </Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={form.amount}
                onChange={(e) => set("amount", e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select
                value={form.category}
                onValueChange={(v) => set("category", v as ExpenseCategory)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EXPENSE_CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {humanizeStatus(c)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Recurring?</Label>
              <Select
                value={form.recurring_status}
                onValueChange={(v) => set("recurring_status", v as RecurringStatus)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="one_time">One time</SelectItem>
                  <SelectItem value="recurring">Recurring</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Date</Label>
              <Input
                type="date"
                value={form.date}
                onChange={(e) => set("date", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Due date</Label>
              <Input
                type="date"
                value={form.due_date}
                onChange={(e) => set("due_date", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Payment status</Label>
              <Select
                value={form.payment_status}
                onValueChange={(v) =>
                  set("payment_status", v as ExpensePaymentStatus)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EXPENSE_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {humanizeStatus(s)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {form.payment_status === "paid" && (
              <div className="space-y-1.5">
                <Label>Paid on</Label>
                <Input
                  type="date"
                  value={form.payment_date}
                  onChange={(e) => set("payment_date", e.target.value)}
                />
              </div>
            )}
          </div>
          <div className="space-y-1.5">
            <Label>Notes</Label>
            <Textarea
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              placeholder="Optional…"
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!form.payee.trim() || !(Number(form.amount) > 0)}
            >
              {isEdit ? "Save changes" : "Add expense"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
