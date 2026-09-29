"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Check, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { LoadingState } from "@/components/states/loading-state";
import { EmptyState } from "@/components/states/empty-state";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { ProjectFormDialog } from "@/components/operations/project-form-dialog";
import { TaskFormDialog } from "@/components/operations/task-form-dialog";
import { ProgressBar } from "@/components/operations/progress-bar";
import { useOperations } from "@/lib/operations/store";
import type { Task } from "@/lib/operations/types";
import { cn, formatCurrency } from "@/lib/utils";

export default function ProjectDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const {
    ready,
    getProject,
    tasksForProject,
    deleteProject,
    setTaskStatus,
    deleteTask,
  } = useOperations();

  const [editing, setEditing] = React.useState(false);
  const [deletingProject, setDeletingProject] = React.useState(false);
  const [editingTask, setEditingTask] = React.useState<Task | null>(null);
  const [deletingTask, setDeletingTask] = React.useState<Task | null>(null);

  if (!ready) return <LoadingState />;

  const project = getProject(params.id);
  if (!project) {
    return (
      <EmptyState
        title="Project not found"
        description="It may have been deleted."
        action={
          <Button asChild variant="outline">
            <Link href="/operations/projects">Back to projects</Link>
          </Button>
        }
      />
    );
  }

  const tasks = tasksForProject(project.id);
  const done = tasks.filter((t) => t.status === "completed").length;

  return (
    <div className="space-y-6">
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-2 mb-2">
          <Link href="/operations/projects">
            <ArrowLeft className="h-4 w-4" /> Projects
          </Link>
        </Button>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-xl font-semibold tracking-tight">
                {project.name}
              </h1>
              <StatusBadge status={project.status} />
              {project.priority && <StatusBadge status={project.priority} />}
            </div>
            {project.owner && (
              <p className="mt-1 text-sm text-muted-foreground">
                Owned by {project.owner}
              </p>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <ProjectFormDialog
              project={project}
              open={editing}
              onOpenChange={setEditing}
            />
            <Button variant="outline" onClick={() => setEditing(true)}>
              Edit
            </Button>
            <Button
              variant="outline"
              className="text-destructive hover:text-destructive"
              onClick={() => setDeletingProject(true)}
            >
              Delete
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {project.description && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {project.description}
                </p>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base">
                Tasks{" "}
                {tasks.length > 0 && (
                  <span className="ml-1 text-sm font-normal text-muted-foreground">
                    ({done}/{tasks.length} done)
                  </span>
                )}
              </CardTitle>
              <TaskFormDialog
                defaultProjectId={project.id}
                lockProject
                trigger={
                  <Button size="sm" variant="outline">
                    <Plus className="h-4 w-4" /> Add task
                  </Button>
                }
              />
            </CardHeader>
            <CardContent>
              {tasks.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  No tasks yet. Break this project into steps.
                </p>
              ) : (
                <ul className="divide-y">
                  {tasks.map((t) => {
                    const isDone = t.status === "completed";
                    return (
                      <li
                        key={t.id}
                        className="flex items-center gap-3 py-2.5"
                      >
                        <button
                          type="button"
                          aria-label={
                            isDone ? "Mark not done" : "Mark complete"
                          }
                          onClick={() =>
                            setTaskStatus(t.id, isDone ? "to_do" : "completed")
                          }
                          className={cn(
                            "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors",
                            isDone
                              ? "border-success bg-success text-white"
                              : "border-input hover:border-primary",
                          )}
                        >
                          {isDone && <Check className="h-3 w-3" />}
                        </button>
                        <button
                          type="button"
                          className="flex-1 text-left"
                          onClick={() => setEditingTask(t)}
                        >
                          <span
                            className={cn(
                              "text-sm",
                              isDone &&
                                "text-muted-foreground line-through",
                            )}
                          >
                            {t.title}
                          </span>
                          <span className="ml-2 text-xs text-muted-foreground">
                            {t.due_date ? `due ${t.due_date}` : ""}
                          </span>
                        </button>
                        {!isDone && t.priority && (
                          <StatusBadge status={t.priority} />
                        )}
                        {t.status === "blocked" && (
                          <StatusBadge status="blocked" />
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Delete task"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => setDeletingTask(t)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Progress</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ProgressBar value={project.progress_percent ?? 0} />
              <div className="grid gap-x-6 gap-y-4">
                <Detail label="Start date" value={project.start_date} />
                <Detail label="Due date" value={project.due_date} />
                <Detail
                  label="Budget"
                  value={
                    project.budget != null
                      ? formatCurrency(project.budget)
                      : undefined
                  }
                />
              </div>
            </CardContent>
          </Card>

          {project.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {project.notes}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {editingTask && (
        <TaskFormDialog
          task={editingTask}
          open={!!editingTask}
          onOpenChange={(o) => !o && setEditingTask(null)}
        />
      )}

      <ConfirmDialog
        open={deletingProject}
        onOpenChange={setDeletingProject}
        title="Delete this project?"
        description={`"${project.name}" will be removed. Its tasks stay, but detach from the project.`}
        confirmLabel="Delete project"
        onConfirm={() => {
          deleteProject(project.id);
          router.push("/operations/projects");
        }}
      />

      <ConfirmDialog
        open={!!deletingTask}
        onOpenChange={(o) => !o && setDeletingTask(null)}
        title="Delete this task?"
        description={
          deletingTask ? `"${deletingTask.title}" will be removed.` : undefined
        }
        confirmLabel="Delete task"
        onConfirm={() => {
          if (deletingTask) deleteTask(deletingTask.id);
          setDeletingTask(null);
        }}
      />
    </div>
  );
}

function Detail({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-0.5 text-sm tabular-nums">{value ?? "—"}</p>
    </div>
  );
}
