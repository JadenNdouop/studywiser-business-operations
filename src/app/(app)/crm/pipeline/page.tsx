"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { MoreHorizontal, Plus } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { LoadingState } from "@/components/states/loading-state";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LeadFormDialog } from "@/components/crm/lead-form-dialog";
import { useCrm } from "@/lib/crm/store";
import { ALL_STAGES, type Lead, type PipelineStage } from "@/lib/crm/types";
import { getStatusMeta, humanizeStatus } from "@/lib/status";
import { cn, formatCurrency } from "@/lib/utils";

// Stages a card can be moved to from the board. "Converted" is intentionally
// excluded — converting creates a client and is done from the lead's page.
const MOVE_TARGETS = ALL_STAGES.filter((s) => s !== "converted");

const DOT: Record<string, string> = {
  success: "bg-success",
  warning: "bg-warning",
  info: "bg-info",
  destructive: "bg-destructive",
  muted: "bg-muted-foreground",
  default: "bg-primary",
  secondary: "bg-muted-foreground",
  outline: "bg-muted-foreground",
};

export default function PipelinePage() {
  const { ready, leads, setLeadStage } = useCrm();
  const router = useRouter();

  const byStage = React.useMemo(() => {
    const map = new Map<PipelineStage, Lead[]>();
    for (const s of ALL_STAGES) map.set(s, []);
    for (const l of leads) map.get(l.pipeline_stage)?.push(l);
    return map;
  }, [leads]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pipeline"
        description="Every lead by stage. Use a card's menu to move it along."
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
        <div className="overflow-x-auto pb-2">
          <div className="flex gap-4" style={{ minWidth: "min-content" }}>
            {ALL_STAGES.map((stage) => {
              const items = byStage.get(stage) ?? [];
              const total = items.reduce(
                (sum, l) => sum + (l.estimated_value ?? 0),
                0,
              );
              const meta = getStatusMeta(stage);
              return (
                <div key={stage} className="w-72 shrink-0">
                  <div className="mb-2 flex items-center justify-between px-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "h-2 w-2 rounded-full",
                          DOT[meta.variant] ?? DOT.default,
                        )}
                      />
                      <span className="text-sm font-medium">{meta.label}</span>
                      <span className="text-xs text-muted-foreground">
                        {items.length}
                      </span>
                    </div>
                    {total > 0 && (
                      <span className="text-xs tabular-nums text-muted-foreground">
                        {formatCurrency(total)}
                      </span>
                    )}
                  </div>

                  <div className="flex min-h-[120px] flex-col gap-2 rounded-lg border bg-muted/30 p-2">
                    {items.length === 0 ? (
                      <p className="px-2 py-6 text-center text-xs text-muted-foreground">
                        No leads
                      </p>
                    ) : (
                      items.map((l) => (
                        <div
                          key={l.id}
                          onClick={() => router.push(`/crm/leads/${l.id}`)}
                          className="group cursor-pointer rounded-md border bg-card p-3 shadow-sm transition-colors hover:border-primary/40"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium">
                                {l.guardian_name}
                              </p>
                              {(l.student_name || l.subject_needed) && (
                                <p className="truncate text-xs text-muted-foreground">
                                  {[l.student_name, l.subject_needed]
                                    .filter(Boolean)
                                    .join(" · ")}
                                </p>
                              )}
                            </div>
                            <div onClick={(e) => e.stopPropagation()}>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 opacity-60 group-hover:opacity-100"
                                    aria-label="Move lead"
                                  >
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    onClick={() =>
                                      router.push(`/crm/leads/${l.id}`)
                                    }
                                  >
                                    Open
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuLabel>Move to</DropdownMenuLabel>
                                  {MOVE_TARGETS.filter(
                                    (s) => s !== l.pipeline_stage,
                                  ).map((s) => (
                                    <DropdownMenuItem
                                      key={s}
                                      onClick={() => setLeadStage(l.id, s)}
                                    >
                                      {humanizeStatus(s)}
                                    </DropdownMenuItem>
                                  ))}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                          {l.estimated_value != null && (
                            <p className="mt-2 text-xs font-medium tabular-nums text-muted-foreground">
                              {formatCurrency(l.estimated_value)}
                            </p>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
