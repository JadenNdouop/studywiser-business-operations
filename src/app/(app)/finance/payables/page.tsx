"use client";

import { MoreHorizontal } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DataTable, type DataTableColumn } from "@/components/data-table";
import { StatusBadge } from "@/components/status-badge";
import { LoadingState } from "@/components/states/loading-state";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useFinance } from "@/lib/finance/store";
import {
  AGING_BUCKETS,
  agingSummary,
  daysPastDue,
  effectiveExpenseStatus,
  openExpenses,
  totalPayable,
} from "@/lib/finance/reporting";
import type { Expense } from "@/lib/finance/types";
import { humanizeStatus } from "@/lib/status";
import { cn, formatCurrency } from "@/lib/utils";

const BUCKET_LABEL: Record<string, string> = {
  current: "Not yet due",
  "1-30": "1–30 days",
  "31-60": "31–60 days",
  "61-90": "61–90 days",
  "90+": "90+ days",
};

export default function PayablesPage() {
  const { ready, expenses, markExpensePaid } = useFinance();

  const open = openExpenses(expenses);
  const total = totalPayable(expenses);
  const summary = agingSummary(
    open.map((e) => ({ due_date: e.due_date, amount: e.amount })),
  );

  const columns: DataTableColumn<Expense>[] = [
    {
      id: "payee",
      header: "Payee",
      accessor: (e) => e.payee,
      sortable: true,
      cell: (e) => <span className="font-medium">{e.payee}</span>,
    },
    {
      id: "category",
      header: "Category",
      accessor: (e) => humanizeStatus(e.category),
    },
    { id: "due", header: "Due", accessor: (e) => e.due_date ?? "", cell: (e) => e.due_date ?? "—" },
    {
      id: "age",
      header: "Age",
      accessor: (e) => daysPastDue(e.due_date),
      sortable: true,
      cell: (e) => {
        const d = daysPastDue(e.due_date);
        return d > 0 ? (
          <span className="text-destructive">{d}d overdue</span>
        ) : (
          <span className="text-muted-foreground">—</span>
        );
      },
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
      cell: (e) => <StatusBadge status={effectiveExpenseStatus(e)} />,
    },
    {
      id: "actions",
      header: "",
      cell: (e) => (
        <div onClick={(ev) => ev.stopPropagation()} className="text-right">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Actions">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => markExpensePaid(e.id)}>
                Mark as paid
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
        title="Payables"
        description="Bills you still owe. This is the unpaid slice of your expenses."
      />

      {!ready ? (
        <LoadingState />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <Card className="col-span-2 sm:col-span-1">
              <CardContent className="p-4">
                <p className="text-xs font-medium text-muted-foreground">
                  Total owed
                </p>
                <p className="mt-1 text-xl font-semibold tabular-nums">
                  {formatCurrency(total)}
                </p>
              </CardContent>
            </Card>
            {AGING_BUCKETS.map((b) => (
              <Card key={b}>
                <CardContent className="p-4">
                  <p className="text-xs font-medium text-muted-foreground">
                    {BUCKET_LABEL[b]}
                  </p>
                  <p
                    className={cn(
                      "mt-1 text-lg font-semibold tabular-nums",
                      b !== "current" && summary[b] > 0 && "text-destructive",
                    )}
                  >
                    {formatCurrency(summary[b])}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          <DataTable
            columns={columns}
            data={open}
            rowKey={(e) => e.id}
            searchPlaceholder="Search payables…"
            searchAccessor={(e) => `${e.payee} ${humanizeStatus(e.category)}`}
            emptyTitle="Nothing owed"
            emptyDescription="Every expense is paid up."
          />
        </>
      )}
    </div>
  );
}
