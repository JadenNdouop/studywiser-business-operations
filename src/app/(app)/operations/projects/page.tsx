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
import { ProjectFormDialog } from "@/components/operations/project-form-dialog";
import { ProgressBar } from "@/components/operations/progress-bar";
import { useOperations } from "@/lib/operations/store";
import {
  PROJECT_STATUSES,
  type Project,
} from "@/lib/operations/types";
import { humanizeStatus } from "@/lib/status";

export default function ProjectsPage() {
  const { ready, projects, tasks, deleteProject } = useOperations();
  const router = useRouter();
  const [status, setStatus] = React.useState("all");
  const [editing, setEditing] = React.useState<Project | null>(null);
  const [deleting, setDeleting] = React.useState<Project | null>(null);

  const rows = React.useMemo(
    () =>
      status === "all"
        ? projects
        : projects.filter((p) => p.status === status),
    [projects, status],
  );

  const columns: DataTableColumn<Project>[] = [
    {
      id: "name",
      header: "Project",
      accessor: (p) => p.name,
      sortable: true,
      cell: (p) => (
        <div>
          <div className="font-medium">{p.name}</div>
          {p.owner && (
            <div className="text-xs text-muted-foreground">{p.owner}</div>
          )}
        </div>
      ),
    },
    {
      id: "status",
      header: "Status",
      accessor: (p) => p.status,
      sortable: true,
      cell: (p) => <StatusBadge status={p.status} />,
    },
    {
      id: "priority",
      header: "Priority",
      accessor: (p) => p.priority ?? "",
      cell: (p) => (p.priority ? <StatusBadge status={p.priority} /> : "—"),
    },
    {
      id: "progress",
      header: "Progress",
      accessor: (p) => p.progress_percent ?? 0,
      sortable: true,
      cell: (p) => <ProgressBar value={p.progress_percent ?? 0} />,
    },
    {
      id: "tasks",
      header: "Tasks",
      align: "right",
      accessor: (p) => tasks.filter((t) => t.project_id === p.id).length,
      cell: (p) => {
        const list = tasks.filter((t) => t.project_id === p.id);
        const done = list.filter((t) => t.status === "completed").length;
        return list.length ? (
          <span className="tabular-nums text-sm text-muted-foreground">
            {done}/{list.length}
          </span>
        ) : (
          "—"
        );
      },
    },
    {
      id: "due",
      header: "Due",
      accessor: (p) => p.due_date ?? "",
      sortable: true,
      cell: (p) => (
        <span className="text-sm tabular-nums">{p.due_date ?? "—"}</span>
      ),
    },
    {
      id: "actions",
      header: "",
      cell: (p) => (
        <div onClick={(e) => e.stopPropagation()} className="text-right">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Project actions">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => router.push(`/operations/projects/${p.id}`)}
              >
                Open
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setEditing(p)}>
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => setDeleting(p)}
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
        title="Projects"
        description="Initiatives you're running — with progress and the tasks under each."
        actions={
          <ProjectFormDialog
            trigger={
              <Button>
                <Plus className="h-4 w-4" /> New project
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
          rowKey={(p) => p.id}
          onRowClick={(p) => router.push(`/operations/projects/${p.id}`)}
          searchPlaceholder="Search projects…"
          searchAccessor={(p) => `${p.name} ${p.owner ?? ""}`}
          emptyTitle="No projects yet"
          emptyDescription="Create your first project to start tracking work."
          toolbar={
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-[170px]">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {PROJECT_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {humanizeStatus(s)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          }
        />
      )}

      {editing && (
        <ProjectFormDialog
          project={editing}
          open={!!editing}
          onOpenChange={(o) => !o && setEditing(null)}
        />
      )}

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Delete this project?"
        description={
          deleting
            ? `"${deleting.name}" will be removed. Its tasks stay, but detach from the project.`
            : undefined
        }
        confirmLabel="Delete project"
        onConfirm={() => {
          if (deleting) deleteProject(deleting.id);
          setDeleting(null);
        }}
      />
    </div>
  );
}
