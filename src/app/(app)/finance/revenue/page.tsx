"use client";

import * as React from "react";
import { MoreHorizontal, Plus } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { DataTable, type DataTableColumn } from "@/components/data-table";
import { Badge } from "@/components/ui/badge";
import { LoadingState } from "@/components/states/loading-state";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useFinance } from "@/lib/finance/store";
import { useCrm } from "@/lib/crm/store";
import { REVENUE_CATEGORIES, type RevenueCategory, type RevenueEntry } from "@/lib/finance/types";
import { humanizeStatus } from "@/lib/status";
import { formatCurrency } from "@/lib/utils";

export default function RevenuePage() {
  const { ready, revenue, addRevenue, deleteRevenue } = useFinance();
  const { clients, getClient } = useCrm();

  const clientName = (id?: string) => (id ? getClient(id)?.family_name ?? "—" : "—");

  const columns: DataTableColumn<RevenueEntry>[] = [
    { id: "date", header: "Date", accessor: (r) => r.date, sortable: true },
    {
      id: "category",
      header: "Category",
      accessor: (r) => humanizeStatus(r.category),
      sortable: true,
    },
    {
      id: "description",
      header: "Description",
      accessor: (r) => r.description ?? "",
      cell: (r) => r.description ?? "—",
    },
    {
      id: "client",
      header: "Client",
      accessor: (r) => clientName(r.client_id),
      cell: (r) => clientName(r.client_id),
    },
    {
      id: "source",
      header: "Source",
      accessor: (r) => r.source,
      cell: (r) => (
        <Badge variant={r.source === "invoice_payment" ? "info" : "muted"}>
          {r.source === "invoice_payment" ? "Invoice" : "Manual"}
        </Badge>
      ),
    },
    {
      id: "amount",
      header: "Amount",
      align: "right",
      accessor: (r) => r.amount,
      sortable: true,
      cell: (r) => formatCurrency(r.amount),
    },
    {
      id: "actions",
      header: "",
      cell: (r) =>
        r.source === "manual" ? (
          <div className="text-right">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Revenue actions">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => deleteRevenue(r.id)}
                >
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ) : null,
    },
  ];

  // Add-income dialog state
  const [open, setOpen] = React.useState(false);
  const [date, setDate] = React.useState(new Date().toISOString().slice(0, 10));
  const [category, setCategory] = React.useState<RevenueCategory>("tutoring");
  const [clientId, setClientId] = React.useState<string>("none");
  const [description, setDescription] = React.useState("");
  const [amount, setAmount] = React.useState("");

  React.useEffect(() => {
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDate(new Date().toISOString().slice(0, 10));
      setDescription("");
      setAmount("");
      setClientId("none");
      setCategory("tutoring");
    }
  }, [open]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!(Number(amount) > 0)) return;
    addRevenue({
      date,
      category,
      client_id: clientId === "none" ? undefined : clientId,
      description: description.trim() || undefined,
      amount: Number(amount),
    });
    setOpen(false);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Revenue"
        description="Your income ledger — invoice payments plus any income logged directly."
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4" /> Add income
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Add income</DialogTitle>
                <DialogDescription>
                  For income that didn&apos;t go through an invoice.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={submit} className="space-y-4">
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
                    <Label>
                      Amount ($)<span className="text-destructive"> *</span>
                    </Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Category</Label>
                  <Select
                    value={category}
                    onValueChange={(v) => setCategory(v as RevenueCategory)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {REVENUE_CATEGORIES.map((c) => (
                        <SelectItem key={c} value={c}>
                          {humanizeStatus(c)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Client (optional)</Label>
                  <Select value={clientId} onValueChange={setClientId}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {clients.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.family_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Description</Label>
                  <Input
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="e.g. One-off consultation"
                  />
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={!(Number(amount) > 0)}>
                    Add income
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      {!ready ? (
        <LoadingState />
      ) : (
        <DataTable
          columns={columns}
          data={revenue}
          rowKey={(r) => r.id}
          searchPlaceholder="Search revenue…"
          searchAccessor={(r) =>
            `${humanizeStatus(r.category)} ${r.description ?? ""} ${clientName(r.client_id)}`
          }
          emptyTitle="No revenue yet"
          emptyDescription="Record a payment on an invoice, or add income directly."
        />
      )}
    </div>
  );
}
