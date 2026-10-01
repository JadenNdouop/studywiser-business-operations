"use client";

import * as React from "react";
import { History } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTable, type DataTableColumn } from "@/components/data-table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { listAuditLog, type AuditEntry } from "@/lib/admin/audit-api";
import { humanizeStatus } from "@/lib/status";

function humanizeAction(action: string): string {
  return humanizeStatus(action.replace(/\./g, " "));
}

function actionVariant(
  action: string,
): "success" | "info" | "destructive" | "muted" {
  const a = action.toLowerCase();
  if (/(deleted|removed|revoked|cancelled)/.test(a)) return "destructive";
  if (/(created|added|assigned|recorded)/.test(a)) return "success";
  if (/(updated|changed|edited|status)/.test(a)) return "info";
  return "muted";
}

function formatWhen(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? "—"
    : d.toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });
}

function JsonBlock({ label, value }: { label: string; value: unknown }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <pre className="max-h-48 overflow-auto rounded-md border bg-muted/40 p-3 text-xs">
        {value == null ? "—" : JSON.stringify(value, null, 2)}
      </pre>
    </div>
  );
}

export default function AuditLogPage() {
  const [entries, setEntries] = React.useState<AuditEntry[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [detail, setDetail] = React.useState<AuditEntry | null>(null);

  React.useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await listAuditLog();
        if (active) setEntries(data);
      } catch (e) {
        if (active)
          setError(
            e instanceof Error ? e.message : "Failed to load the audit log.",
          );
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const columns: DataTableColumn<AuditEntry>[] = [
    {
      id: "when",
      header: "When",
      accessor: (e) => e.createdAt,
      sortable: true,
      cell: (e) => (
        <span className="whitespace-nowrap text-sm text-muted-foreground">
          {formatWhen(e.createdAt)}
        </span>
      ),
    },
    {
      id: "actor",
      header: "Actor",
      accessor: (e) => e.actorName,
      sortable: true,
      cell: (e) => <span className="font-medium">{e.actorName}</span>,
    },
    {
      id: "action",
      header: "Action",
      accessor: (e) => e.action,
      sortable: true,
      cell: (e) => (
        <Badge variant={actionVariant(e.action)}>
          {humanizeAction(e.action)}
        </Badge>
      ),
    },
    {
      id: "entity",
      header: "Entity",
      accessor: (e) => `${e.entityType} ${e.entityId}`,
      cell: (e) => (
        <div className="text-sm">
          <span className="font-medium">{humanizeStatus(e.entityType)}</span>{" "}
          <span className="text-muted-foreground">{e.entityId}</span>
        </div>
      ),
    },
    {
      id: "details",
      header: "",
      align: "right",
      cell: (e) => (
        <Button variant="ghost" size="sm" onClick={() => setDetail(e)}>
          Details
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Audit Log"
        description="An append-only record of changes made across StudyWiser."
      />

      <div className="flex items-start gap-2.5 rounded-lg border bg-muted/40 p-4 text-sm">
        <History className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
        <p className="text-muted-foreground">
          The audit log is append-only and visible to owners and admins only.
          Entries appear here as key actions are recorded — it may be empty until
          logging is wired into those actions.
        </p>
      </div>

      {error ? (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm">
          <p className="font-medium text-foreground">
            Couldn&apos;t load the audit log
          </p>
          <p className="text-muted-foreground">{error}</p>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={entries}
          rowKey={(e) => e.id}
          isLoading={loading}
          searchable
          searchPlaceholder="Search the audit log…"
          emptyTitle="No activity logged yet"
          emptyDescription="Once actions are recorded, they'll show up here newest-first."
        />
      )}

      <Dialog open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {detail ? humanizeAction(detail.action) : "Details"}
            </DialogTitle>
            <DialogDescription>
              {detail &&
                `${humanizeStatus(detail.entityType)} ${detail.entityId} · ${
                  detail.actorName
                } · ${formatWhen(detail.createdAt)}`}
            </DialogDescription>
          </DialogHeader>
          {detail && (
            <div className="grid gap-4 sm:grid-cols-2">
              <JsonBlock label="Before" value={detail.previousValue} />
              <JsonBlock label="After" value={detail.newValue} />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
