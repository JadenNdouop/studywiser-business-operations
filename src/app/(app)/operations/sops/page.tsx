"use client";

import * as React from "react";
import { FileText, Pencil, Plus, Trash2 } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { LoadingState } from "@/components/states/loading-state";
import { EmptyState } from "@/components/states/empty-state";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { SopFormDialog } from "@/components/operations/sop-form-dialog";
import { useOperations } from "@/lib/operations/store";
import { SOP_STATUSES, type Sop } from "@/lib/operations/types";
import { humanizeStatus } from "@/lib/status";

export default function SopsPage() {
  const { ready, sops, deleteSop } = useOperations();
  const [status, setStatus] = React.useState("all");
  const [editing, setEditing] = React.useState<Sop | null>(null);
  const [deleting, setDeleting] = React.useState<Sop | null>(null);

  const rows = React.useMemo(
    () => (status === "all" ? sops : sops.filter((s) => s.status === status)),
    [sops, status],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="SOPs"
        description="Standard operating procedures — how the business does things, written down."
        actions={
          <SopFormDialog
            trigger={
              <Button>
                <Plus className="h-4 w-4" /> New SOP
              </Button>
            }
          />
        }
      />

      <div className="flex items-center justify-end">
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-[150px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            {SOP_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {humanizeStatus(s)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {!ready ? (
        <LoadingState />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No SOPs here"
          description="Write down a repeatable process so it's done the same way every time."
          action={
            <SopFormDialog
              trigger={<Button variant="outline">Create your first SOP</Button>}
            />
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {rows.map((sop) => (
            <Card key={sop.id} className="flex flex-col">
              <CardHeader className="space-y-0 pb-3">
                <div className="flex items-start justify-between gap-3">
                  <CardTitle className="text-base">{sop.title}</CardTitle>
                  <StatusBadge status={sop.status} />
                </div>
                <div className="flex flex-wrap items-center gap-2 pt-1.5 text-xs text-muted-foreground">
                  {sop.category && (
                    <Badge variant="secondary">{sop.category}</Badge>
                  )}
                  <span>v{sop.version}</span>
                  {sop.owner && <span>· {sop.owner}</span>}
                </div>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col">
                {sop.description && (
                  <p className="text-sm text-muted-foreground">
                    {sop.description}
                  </p>
                )}
                <p className="mt-2 line-clamp-3 whitespace-pre-line text-sm text-muted-foreground/80">
                  {sop.content}
                </p>
                <div className="mt-4 flex items-center gap-2 pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setEditing(sop)}
                  >
                    <Pencil className="h-3.5 w-3.5" /> View / edit
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-muted-foreground hover:text-destructive"
                    onClick={() => setDeleting(sop)}
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {editing && (
        <SopFormDialog
          sop={editing}
          open={!!editing}
          onOpenChange={(o) => !o && setEditing(null)}
        />
      )}

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Delete this SOP?"
        description={
          deleting ? `"${deleting.title}" will be removed.` : undefined
        }
        confirmLabel="Delete SOP"
        onConfirm={() => {
          if (deleting) deleteSop(deleting.id);
          setDeleting(null);
        }}
      />
    </div>
  );
}
