"use client";

import * as React from "react";
import { MoreHorizontal, Plus } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { DataTable, type DataTableColumn } from "@/components/data-table";
import { StatusBadge } from "@/components/status-badge";
import { LoadingState } from "@/components/states/loading-state";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { ExpenseFormDialog } from "@/components/finance/expense-form-dialog";
import { useFinance } from "@/lib/finance/store";
import { effectiveExpenseStatus } from "@/lib/finance/reporting";
import type { Expense } from "@/lib/finance/types";
import { humanizeStatus } from "@/lib/status";
import { formatCurrency } from "@/lib/utils";

export default function ExpensesPage() {
  const { ready, expenses, markExpensePaid, deleteExpense } = useFinance();
  const [editing, setEditing] = React.useState<Expense | null>(null);
  const [deleting, setDeleting] = React.useState<Expense | null>(null);

  const columns: DataTableColumn<Expense>[] = [
    {
      id: "payee",
      header: "Payee",
      accessor: (e) => e.payee,
      sortable: true,
      cell: (e) => (
        <div>
          <div className="font-medium">{e.payee}</div>
          {e.description && (
            <div className="text-xs text-muted-foreground">{e.description}</div>
          )}
        </div>
      ),
    },
    {
      id: "category",
      header: "Category",
      accessor: (e) => humanizeStatus(e.category),
      sortable: true,
    },
    {
      id: "date",
      header: "Date",
      accessor: (e) => e.date,
      sortable: true,
    },
    {
      id: "due",
      header: "Due",
      accessor: (e) => e.due_date ?? "",
      cell: (e) => e.due_date ?? "—",
    },
    {
      id: "amount",
      header: "Amount",
      align: "right",
      accessor: (e) => e.amount,
      sortable: true,
      cell: (e) => formatCurrency(e.amount),
    },
    {
      id: "status",
      header: "Status",
      accessor: (e) => effectiveExpenseStatus(e),
      sortable: true,
      cell: (e) => <StatusBadge status={effectiveExpenseStatus(e)} />,
    },
    {
      id: "actions",
      header: "",
      cell: (e) => (
        <div onClick={(ev) => ev.stopPropagation()} className="text-right">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Expense actions">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {e.payment_status !== "paid" && (
                <DropdownMenuItem onClick={() => markExpensePaid(e.id)}>
                  Mark as paid
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => setEditing(e)}>Edit</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => setDeleting(e)}
              >
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Expenses"
        description="Money going out. Unpaid expenses show up under Payables."
        actions={
          <ExpenseFormDialog
            trigger={
              <Button>
                <Plus className="h-4 w-4" /> New expense
              </Button>
            }
          />
        }
      />

      {!ready ? (
        <LoadingState />
      ) : (
        <DataTable
          columns={columns}
          data={expenses}
          rowKey={(e) => e.id}
          onRowClick={(e) => setEditing(e)}
          searchPlaceholder="Search expenses…"
          searchAccessor={(e) =>
            `${e.payee} ${e.description ?? ""} ${humanizeStatus(e.category)}`
          }
          emptyTitle="No expenses yet"
          emptyDescription="Record your first business expense."
        />
      )}

      {editing && (
        <ExpenseFormDialog
          expense={editing}
          open={!!editing}
          onOpenChange={(o) => !o && setEditing(null)}
        />
      )}

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Delete this expense?"
        description={
          deleting
            ? `"${deleting.payee}" (${formatCurrency(deleting.amount)}) will be removed.`
            : undefined
        }
        confirmLabel="Delete expense"
        onConfirm={() => {
          if (deleting) deleteExpense(deleting.id);
          setDeleting(null);
        }}
      />
    </div>
  );
}
