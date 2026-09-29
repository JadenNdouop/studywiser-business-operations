"use client";

import * as React from "react";
import { ExternalLink, MoreHorizontal, Plus } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTable, type DataTableColumn } from "@/components/data-table";
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
import { DocumentFormDialog } from "@/components/operations/document-form-dialog";
import { useOperations } from "@/lib/operations/store";
import {
  DOCUMENT_CATEGORIES,
  type BusinessDocument,
} from "@/lib/operations/types";
import { humanizeStatus } from "@/lib/status";

export default function DocumentsPage() {
  const { ready, documents, deleteDocument } = useOperations();
  const [category, setCategory] = React.useState("all");
  const [editing, setEditing] = React.useState<BusinessDocument | null>(null);
  const [deleting, setDeleting] = React.useState<BusinessDocument | null>(null);

  const rows = React.useMemo(
    () =>
      category === "all"
        ? documents
        : documents.filter((d) => d.category === category),
    [documents, category],
  );

  const columns: DataTableColumn<BusinessDocument>[] = [
    {
      id: "title",
      header: "Document",
      accessor: (d) => d.title,
      sortable: true,
      cell: (d) => (
        <div>
          <div className="font-medium">{d.title}</div>
          {d.notes && (
            <div className="text-xs text-muted-foreground">{d.notes}</div>
          )}
        </div>
      ),
    },
    {
      id: "category",
      header: "Category",
      accessor: (d) => d.category ?? "",
      sortable: true,
      cell: (d) =>
        d.category ? (
          <Badge variant="secondary">{humanizeStatus(d.category)}</Badge>
        ) : (
          "—"
        ),
    },
    {
      id: "link",
      header: "Link",
      cell: (d) => (
        <div onClick={(e) => e.stopPropagation()}>
          <a
            href={d.external_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
          >
            Open <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      ),
    },
    {
      id: "actions",
      header: "",
      cell: (d) => (
        <div onClick={(e) => e.stopPropagation()} className="text-right">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Document actions">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setEditing(d)}>
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => setDeleting(d)}
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
        title="Documents"
        description="A directory of key documents — each linked to where it lives."
        actions={
          <DocumentFormDialog
            trigger={
              <Button>
                <Plus className="h-4 w-4" /> New document
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
          rowKey={(d) => d.id}
          onRowClick={(d) => setEditing(d)}
          searchPlaceholder="Search documents…"
          searchAccessor={(d) => `${d.title} ${d.notes ?? ""}`}
          emptyTitle="No documents yet"
          emptyDescription="Add a link to a contract, policy, or template."
          toolbar={
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-[170px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {DOCUMENT_CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {humanizeStatus(c)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          }
        />
      )}

      {editing && (
        <DocumentFormDialog
          document={editing}
          open={!!editing}
          onOpenChange={(o) => !o && setEditing(null)}
        />
      )}

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Delete this document?"
        description={
          deleting
            ? `"${deleting.title}" will be removed from the directory. The linked file itself is untouched.`
            : undefined
        }
        confirmLabel="Delete document"
        onConfirm={() => {
          if (deleting) deleteDocument(deleting.id);
          setDeleting(null);
        }}
      />
    </div>
  );
}
