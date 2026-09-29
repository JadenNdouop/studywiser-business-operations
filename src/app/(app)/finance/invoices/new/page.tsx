"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { LoadingState } from "@/components/states/loading-state";
import { EmptyState } from "@/components/states/empty-state";
import { useFinance } from "@/lib/finance/store";
import { useCrm } from "@/lib/crm/store";
import { formatCurrency } from "@/lib/utils";

type ItemRow = { description: string; quantity: string; rate: string };

const blankRow = (): ItemRow => ({ description: "", quantity: "1", rate: "" });

export default function NewInvoicePage() {
  const router = useRouter();
  const { createInvoice } = useFinance();
  const { ready, clients } = useCrm();

  const [clientId, setClientId] = React.useState("");
  const [issueDate, setIssueDate] = React.useState(
    new Date().toISOString().slice(0, 10),
  );
  const [dueDate, setDueDate] = React.useState("");
  const [items, setItems] = React.useState<ItemRow[]>([blankRow()]);
  const [adjustments, setAdjustments] = React.useState("0");
  const [notes, setNotes] = React.useState("");

  const activeClients = clients.filter((c) => c.status !== "lost");

  function setItem(i: number, patch: Partial<ItemRow>) {
    setItems((rows) => rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  }
  function addRow() {
    setItems((rows) => [...rows, blankRow()]);
  }
  function removeRow(i: number) {
    setItems((rows) => (rows.length > 1 ? rows.filter((_, idx) => idx !== i) : rows));
  }

  const lineAmount = (r: ItemRow) => (Number(r.quantity) || 0) * (Number(r.rate) || 0);
  const subtotal = items.reduce((s, r) => s + lineAmount(r), 0);
  const total = subtotal + (Number(adjustments) || 0);

  const validItems = items.filter((r) => r.description.trim() && Number(r.rate) > 0);
  const canCreate = clientId && validItems.length > 0;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!canCreate) return;
    const id = createInvoice({
      client_id: clientId,
      issue_date: issueDate,
      due_date: dueDate || undefined,
      adjustments: Number(adjustments) || 0,
      notes: notes.trim() || undefined,
      items: validItems.map((r) => ({
        description: r.description.trim(),
        quantity: Number(r.quantity) || 1,
        rate: Number(r.rate) || 0,
      })),
    });
    router.push(`/finance/invoices/${id}`);
  }

  if (!ready) return <LoadingState />;

  return (
    <div className="space-y-6">
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-2 mb-2">
          <Link href="/finance/invoices">
            <ArrowLeft className="h-4 w-4" /> Invoices
          </Link>
        </Button>
        <h1 className="text-xl font-semibold tracking-tight">New invoice</h1>
      </div>

      {activeClients.length === 0 ? (
        <EmptyState
          title="You need a client first"
          description="Invoices are billed to a client. Add one, then come back."
          action={
            <Button asChild>
              <Link href="/crm/clients">Go to clients</Link>
            </Button>
          }
        />
      ) : (
        <form onSubmit={submit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Details</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label>
                  Client<span className="text-destructive"> *</span>
                </Label>
                <Select value={clientId} onValueChange={setClientId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a client" />
                  </SelectTrigger>
                  <SelectContent>
                    {activeClients.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.family_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Issue date</Label>
                <Input
                  type="date"
                  value={issueDate}
                  onChange={(e) => setIssueDate(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Due date</Label>
                <Input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Line items</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {items.map((row, i) => (
                <div key={i} className="flex flex-col gap-2 sm:flex-row sm:items-end">
                  <div className="flex-1 space-y-1.5">
                    {i === 0 && <Label className="sm:sr-only">Description</Label>}
                    <Input
                      value={row.description}
                      onChange={(e) => setItem(i, { description: e.target.value })}
                      placeholder="Description (e.g. Algebra tutoring — 4 sessions)"
                    />
                  </div>
                  <div className="w-20 space-y-1.5">
                    {i === 0 && <Label>Qty</Label>}
                    <Input
                      type="number"
                      min="0"
                      step="1"
                      value={row.quantity}
                      onChange={(e) => setItem(i, { quantity: e.target.value })}
                    />
                  </div>
                  <div className="w-28 space-y-1.5">
                    {i === 0 && <Label>Rate</Label>}
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={row.rate}
                      onChange={(e) => setItem(i, { rate: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>
                  <div className="w-24 text-right text-sm tabular-nums text-muted-foreground sm:pb-2.5">
                    {formatCurrency(lineAmount(row))}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeRow(i)}
                    disabled={items.length === 1}
                    aria-label="Remove line"
                    className="sm:mb-1"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={addRow}>
                <Plus className="h-4 w-4" /> Add line
              </Button>

              <div className="ml-auto max-w-xs space-y-2 border-t pt-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="tabular-nums">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-muted-foreground">Adjustments</span>
                  <Input
                    type="number"
                    step="0.01"
                    value={adjustments}
                    onChange={(e) => setAdjustments(e.target.value)}
                    className="h-8 w-28 text-right"
                  />
                </div>
                <div className="flex items-center justify-between border-t pt-2 text-sm font-semibold">
                  <span>Total</span>
                  <span className="tabular-nums">{formatCurrency(total)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional notes shown on the invoice…"
              />
            </CardContent>
          </Card>

          <div className="flex justify-end gap-2">
            <Button asChild variant="outline">
              <Link href="/finance/invoices">Cancel</Link>
            </Button>
            <Button type="submit" disabled={!canCreate}>
              Create invoice
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
