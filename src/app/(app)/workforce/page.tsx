"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { MoreHorizontal, Plus } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { WorkerFormDialog } from "@/components/workforce/worker-form-dialog";
import { useWorkforce } from "@/lib/workforce/store";
import { outstandingForWorker } from "@/lib/workforce/reporting";
import { WORKER_TYPES, type Worker } from "@/lib/workforce/types";
import { humanizeStatus } from "@/lib/status";
import { cn, formatCurrency } from "@/lib/utils";

const RATE_SUFFIX: Record<string, string> = {
  hourly: "/ hr",
  per_session: "/ session",
  salary: "/ period",
  flat_rate: "flat",
};

export default function WorkforcePage() {
  const { ready, workers, records, items, deleteWorker } = useWorkforce();
  const router = useRouter();
  const [type, setType] = React.useState("all");
  const [editing, setEditing] = React.useState<Worker | null>(null);
  const [deleting, setDeleting] = React.useState<Worker | null>(null);

  const rows = React.useMemo(
    () => (type === "all" ? workers : workers.filter((w) => w.worker_type === type)),
    [workers, type],
  );

  const columns: DataTableColumn<Worker>[] = [
    {
      id: "name",
      header: "Name",
      accessor: (w) => `${w.first_name} ${w.last_name}`,
      sortable: true,
      cell: (w) => (
        <div>
          <div className="font-medium">
            {w.first_name} {w.last_name}
          </div>
          {w.role_title && (
            <div className="text-xs text-muted-foreground">{w.role_title}</div>
          )}
        </div>
      ),
    },
    {
      id: "type",
      header: "Type",
      accessor: (w) => w.worker_type,
      sortable: true,
      cell: (w) => <Badge variant="secondary">{humanizeStatus(w.worker_type)}</Badge>,
    },
    {
      id: "status",
      header: "Status",
      accessor: (w) => w.status,
      cell: (w) => <StatusBadge status={w.status} />,
    },
    {
      id: "rate",
      header: "Rate",
      align: "right",
      accessor: (w) => w.compensation_rate ?? 0,
      cell: (w) =>
        w.compensation_rate != null ? (
          <span className="tabular-nums">
            {formatCurrency(w.compensation_rate)}{" "}
            <span className="text-xs text-muted-foreground">
              {w.compensation_type ? RATE_SUFFIX[w.compensation_type] : ""}
            </span>
          </span>
        ) : (
          "—"
        ),
    },
    {
      id: "outstanding",
      header: "Outstanding",
      align: "right",
      accessor: (w) => outstandingForWorker(w.id, records, items),
      sortable: true,
      cell: (w) => {
        const out = outstandingForWorker(w.id, records, items);
        return (
          <span
            className={cn(
              "tabular-nums",
              out > 0 && "font-medium text-warning",
            )}
          >
            {formatCurrency(out)}
          </span>
        );
      },
    },
    {
      id: "actions",
      header: "",
      cell: (w) => (
        <div onClick={(e) => e.stopPropagation()} className="text-right">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Worker actions">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => router.push(`/workforce/${w.id}`)}>
                Open
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setEditing(w)}>
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => setDeleting(w)}
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
        title="Workforce"
        description="Your tutors, contractors, and staff — and what they're owed."
        actions={
          <WorkerFormDialog
            trigger={
              <Button>
                <Plus className="h-4 w-4" /> New worker
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
          data={rows}
          rowKey={(w) => w.id}
          onRowClick={(w) => router.push(`/workforce/${w.id}`)}
          searchPlaceholder="Search workers…"
          searchAccessor={(w) =>
            `${w.first_name} ${w.last_name} ${w.role_title ?? ""} ${w.email ?? ""}`
          }
          emptyTitle="No workers yet"
          emptyDescription="Add your first tutor, contractor, or employee."
          toolbar={
            <Select value={type} onValueChange={setType}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="All types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                {WORKER_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {humanizeStatus(t)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          }
        />
      )}

      {editing && (
        <WorkerFormDialog
          worker={editing}
          open={!!editing}
          onOpenChange={(o) => !o && setEditing(null)}
        />
      )}

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Delete this worker?"
        description={
          deleting
            ? `${deleting.first_name} ${deleting.last_name}, along with their compensation and payment history, will be removed.`
            : undefined
        }
        confirmLabel="Delete worker"
        onConfirm={() => {
          if (deleting) deleteWorker(deleting.id);
          setDeleting(null);
        }}
      />
    </div>
  );
}
