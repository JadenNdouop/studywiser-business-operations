"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { LeadFormDialog } from "@/components/crm/lead-form-dialog";
import { useCrm } from "@/lib/crm/store";
import { ALL_STAGES, type Lead } from "@/lib/crm/types";
import { humanizeStatus } from "@/lib/status";
import { cn, formatCurrency } from "@/lib/utils";

function followUpTone(date?: string): string {
  if (!date) return "text-muted-foreground";
  const today = new Date().toISOString().slice(0, 10);
  if (date < today) return "text-destructive font-medium";
  if (date === today) return "text-warning font-medium";
  return "";
}

export default function LeadsPage() {
  const { ready, leads, deleteLead } = useCrm();
  const router = useRouter();
  const [stage, setStage] = React.useState<string>("all");
  const [editing, setEditing] = React.useState<Lead | null>(null);
  const [deleting, setDeleting] = React.useState<Lead | null>(null);

  const rows = React.useMemo(
    () => (stage === "all" ? leads : leads.filter((l) => l.pipeline_stage === stage)),
    [leads, stage],
  );

  const columns: DataTableColumn<Lead>[] = [
    {
      id: "name",
      header: "Lead",
      accessor: (l) => l.guardian_name,
      sortable: true,
      cell: (l) => (
        <div className="min-w-0">
          <div className="font-medium">{l.guardian_name}</div>
          {l.student_name && (
            <div className="text-xs text-muted-foreground">
              {l.student_name}
              {l.grade ? ` · ${l.grade}` : ""}
            </div>
          )}
        </div>
      ),
    },
    {
      id: "subject",
      header: "Subject",
      accessor: (l) => l.subject_needed ?? "",
      cell: (l) => l.subject_needed ?? "—",
    },
    {
      id: "stage",
      header: "Stage",
      accessor: (l) => l.pipeline_stage,
      sortable: true,
      cell: (l) => <StatusBadge status={l.pipeline_stage} />,
    },
    {
      id: "source",
      header: "Source",
      accessor: (l) => (l.lead_source ? humanizeStatus(l.lead_source) : ""),
      cell: (l) => (l.lead_source ? humanizeStatus(l.lead_source) : "—"),
    },
    {
      id: "value",
      header: "Est. value",
      align: "right",
      accessor: (l) => l.estimated_value ?? 0,
      sortable: true,
      cell: (l) =>
        l.estimated_value != null ? formatCurrency(l.estimated_value) : "—",
    },
    {
      id: "followup",
      header: "Next follow-up",
      accessor: (l) => l.next_follow_up_date ?? "",
      sortable: true,
      cell: (l) => (
        <span className={cn(followUpTone(l.next_follow_up_date))}>
          {l.next_follow_up_date ?? "—"}
        </span>
      ),
    },
    {
      id: "actions",
      header: "",
      cell: (l) => (
        <div onClick={(e) => e.stopPropagation()} className="text-right">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Lead actions">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => router.push(`/crm/leads/${l.id}`)}>
                Open
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setEditing(l)}>
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => setDeleting(l)}
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
        title="Leads"
        description="Prospective families and where they are in the pipeline."
        actions={
          <LeadFormDialog
            trigger={
              <Button>
                <Plus className="h-4 w-4" /> New lead
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
          rowKey={(l) => l.id}
          onRowClick={(l) => router.push(`/crm/leads/${l.id}`)}
          searchPlaceholder="Search leads…"
          searchAccessor={(l) =>
            [
              l.guardian_name,
              l.student_name,
              l.subject_needed,
              l.email,
              l.phone,
              l.location,
            ]
              .filter(Boolean)
              .join(" ")
          }
          emptyTitle="No leads yet"
          emptyDescription="Add your first lead to start tracking the pipeline."
          toolbar={
            <Select value={stage} onValueChange={setStage}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All stages" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All stages</SelectItem>
                {ALL_STAGES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {humanizeStatus(s)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          }
        />
      )}

      {/* Edit dialog (controlled) */}
      {editing && (
        <LeadFormDialog
          lead={editing}
          open={!!editing}
          onOpenChange={(o) => !o && setEditing(null)}
        />
      )}

      {/* Delete confirmation */}
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Delete this lead?"
        description={
          deleting
            ? `"${deleting.guardian_name}" and its activity history will be removed. This can't be undone.`
            : undefined
        }
        confirmLabel="Delete lead"
        onConfirm={() => {
          if (deleting) deleteLead(deleting.id);
          setDeleting(null);
        }}
      />
    </div>
  );
}
