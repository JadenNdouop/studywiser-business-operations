"use client";

import * as React from "react";
import { Check, MoreHorizontal, Plus } from "lucide-react";

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
import { TaskFormDialog } from "@/components/operations/task-form-dialog";
import { useOperations } from "@/lib/operations/store";
import { TASK_STATUSES, type Task } from "@/lib/operations/types";
import { humanizeStatus } from "@/lib/status";
import { cn } from "@/lib/utils";

function isOverdue(t: Task): boolean {
  if (!t.due_date || t.status === "completed") return false;
  return t.due_date < new Date().toISOString().slice(0, 10);
}

export default function TasksPage() {
  const { ready, tasks, projects, setTaskStatus, deleteTask } = useOperations();
  const [status, setStatus] = React.useState("open");
  const [editing, setEditing] = React.useState<Task | null>(null);
  const [deleting, setDeleting] = React.useState<Task | null>(null);

  const projectName = React.useCallback(
    (id?: string) =>
      id ? (projects.find((p) => p.id === id)?.name ?? null) : null,
    [projects],
  );

  const rows = React.useMemo(() => {
    const base =
      status === "all"
        ? tasks
        : status === "open"
          ? tasks.filter((t) => t.status !== "completed")
          : tasks.filter((t) => t.status === status);
    // Open tasks first, then by due date (undated last).
    return [...base].sort((a, b) => {
      const ad = a.due_date ?? "9999-99-99";
      const bd = b.due_date ?? "9999-99-99";
      return ad.localeCompare(bd);
    });
  }, [tasks, status]);

  const columns: DataTableColumn<Task>[] = [
    {
      id: "done",
      header: "",
      cell: (t) => {
        const isDone = t.status === "completed";
        return (
          <div onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              aria-label={isDone ? "Mark not done" : "Mark complete"}
              onClick={() => setTaskStatus(t.id, isDone ? "to_do" : "completed")}
              className={cn(
                "flex h-5 w-5 items-center justify-center rounded-full border transition-colors",
                isDone
                  ? "border-success bg-success text-white"
                  : "border-input hover:border-primary",
              )}
            >
              {isDone && <Check className="h-3 w-3" />}
            </button>
          </div>
        );
      },
    },
    {
      id: "title",
      header: "Task",
      accessor: (t) => t.title,
      sortable: true,
      cell: (t) => (
        <div>
          <div
            className={cn(
              "font-medium",
              t.status === "completed" && "text-muted-foreground line-through",
            )}
          >
            {t.title}
          </div>
          {projectName(t.project_id) && (
            <div className="text-xs text-muted-foreground">
              {projectName(t.project_id)}
            </div>
          )}
        </div>
      ),
    },
    {
      id: "status",
      header: "Status",
      accessor: (t) => t.status,
      sortable: true,
      cell: (t) => <StatusBadge status={t.status} />,
    },
    {
      id: "priority",
      header: "Priority",
      accessor: (t) => t.priority ?? "",
      cell: (t) => (t.priority ? <StatusBadge status={t.priority} /> : "—"),
    },
    {
      id: "assignee",
      header: "Assignee",
      accessor: (t) => t.assignee ?? "",
      cell: (t) => (
        <span className="text-sm">{t.assignee ?? "—"}</span>
      ),
    },
    {
      id: "due",
      header: "Due",
      accessor: (t) => t.due_date ?? "",
      sortable: true,
      cell: (t) => (
        <span
          className={cn(
            "text-sm tabular-nums",
            isOverdue(t) && "font-medium text-destructive",
          )}
        >
          {t.due_date ?? "—"}
        </span>
      ),
    },
    {
      id: "actions",
      header: "",
      cell: (t) => (
        <div onClick={(e) => e.stopPropagation()} className="text-right">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Task actions">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setEditing(t)}>
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => setDeleting(t)}
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
        title="Tasks"
        description="Everything on the to-do list, across every project."
        actions={
          <TaskFormDialog
            trigger={
              <Button>
                <Plus className="h-4 w-4" /> New task
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
          rowKey={(t) => t.id}
          onRowClick={(t) => setEditing(t)}
          searchPlaceholder="Search tasks…"
          searchAccessor={(t) => `${t.title} ${t.assignee ?? ""}`}
          emptyTitle="No tasks here"
          emptyDescription="Add a task or switch the filter to see completed ones."
          toolbar={
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="all">All</SelectItem>
                {TASK_STATUSES.map((s) => (
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
        <TaskFormDialog
          task={editing}
          open={!!editing}
          onOpenChange={(o) => !o && setEditing(null)}
        />
      )}

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Delete this task?"
        description={
          deleting ? `"${deleting.title}" will be removed.` : undefined
        }
        confirmLabel="Delete task"
        onConfirm={() => {
          if (deleting) deleteTask(deleting.id);
          setDeleting(null);
        }}
      />
    </div>
  );
}
