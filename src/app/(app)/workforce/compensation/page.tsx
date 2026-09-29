"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTable, type DataTableColumn } from "@/components/data-table";
import { LoadingState } from "@/components/states/loading-state";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CompensationFormDialog } from "@/components/workforce/compensation-form-dialog";
import { useWorkforce } from "@/lib/workforce/store";
import { isRecordPaid } from "@/lib/workforce/reporting";
import type { CompensationRecord } from "@/lib/workforce/types";
import { formatCurrency } from "@/lib/utils";

type Row = CompensationRecord & { workerName: string };

export default function CompensationPage() {
  const { ready, workers, records, items } = useWorkforce();
  const router = useRouter();
  const [workerId, setWorkerId] = React.useState<string>("");

  const rows = React.useMemo<Row[]>(() => {
    const nameById = new Map(
      workers.map((w) => [w.id, `${w.first_name} ${w.last_name}`]),
    );
    return records
      .map((r) => ({ ...r, workerName: nameById.get(r.worker_id) ?? "Unknown" }))
      .sort((a, b) => b.period_end.localeCompare(a.period_end));
  }, [workers, records]);

  const selectedWorker = workers.find((w) => w.id === workerId);

  const columns: DataTableColumn<Row>[] = [
    {
      id: "worker",
      header: "Worker",
      accessor: (r) => r.workerName,
      sortable: true,
      cell: (r) => <span className="font-medium">{r.workerName}</span>,
    },
    {
      id: "period",
      header: "Period",
      accessor: (r) => r.period_end,
      sortable: true,
      cell: (r) => (
        <span className="text-sm">
          {r.period_start} → {r.period_end}
        </span>
      ),
    },
    {
      id: "units",
      header: "Units",
      align: "right",
      accessor: (r) => r.units ?? 0,
      cell: (r) => (
        <span className="tabular-nums">{r.units ?? "—"}</span>
      ),
    },
    {
      id: "rate",
      header: "Rate",
      align: "right",
      accessor: (r) => r.rate,
      cell: (r) => <span className="tabular-nums">{formatCurrency(r.rate)}</span>,
    },
    {
      id: "earned",
      header: "Earned",
      align: "right",
      accessor: (r) => r.amount_earned,
      sortable: true,
      cell: (r) => (
        <span className="font-medium tabular-nums">
          {formatCurrency(r.amount_earned)}
        </span>
      ),
    },
    {
      id: "status",
      header: "Status",
      accessor: (r) => (isRecordPaid(r.id, items) ? "paid" : "unpaid"),
      cell: (r) =>
        isRecordPaid(r.id, items) ? (
          <Badge variant="secondary">Paid</Badge>
        ) : (
          <Badge className="bg-warning/15 text-warning hover:bg-warning/15">
            Unpaid
          </Badge>
        ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Compensation"
        description="Every earning logged across your workforce."
      />

      {!ready ? (
        <LoadingState />
      ) : (
        <DataTable
          columns={columns}
          data={rows}
          rowKey={(r) => r.id}
          onRowClick={(r) => router.push(`/workforce/${r.worker_id}`)}
          searchPlaceholder="Search by worker…"
          searchAccessor={(r) => r.workerName}
          emptyTitle="No compensation logged"
          emptyDescription="Pick a worker and log what they've earned."
          toolbar={
            <div className="flex items-center gap-2">
              <Select value={workerId} onValueChange={setWorkerId}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Choose a worker…" />
                </SelectTrigger>
                <SelectContent>
                  {workers.map((w) => (
                    <SelectItem key={w.id} value={w.id}>
                      {w.first_name} {w.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedWorker && (
                <CompensationFormDialog
                  worker={selectedWorker}
                  trigger={
                    <Button>
                      <Plus className="h-4 w-4" /> Log compensation
                    </Button>
                  }
                />
              )}
            </div>
          }
        />
      )}
    </div>
  );
}
