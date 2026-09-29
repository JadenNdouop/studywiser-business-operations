"use client";

import * as React from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useOperations } from "@/lib/operations/store";
import {
  EVENT_TYPES,
  type BusinessEvent,
  type EventType,
} from "@/lib/operations/types";
import { humanizeStatus } from "@/lib/status";

type FormState = {
  title: string;
  event_type: EventType | "";
  event_date: string;
  notes: string;
};

function initialState(event?: BusinessEvent, defaultDate?: string): FormState {
  return {
    title: event?.title ?? "",
    event_type: event?.event_type ?? "",
    event_date: event?.event_date ?? defaultDate ?? "",
    notes: event?.notes ?? "",
  };
}

export function EventFormDialog({
  event,
  defaultDate,
  trigger,
  open: controlledOpen,
  onOpenChange,
}: {
  event?: BusinessEvent;
  defaultDate?: string;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const { createEvent, updateEvent, deleteEvent } = useOperations();
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(false);
  const open = controlledOpen ?? uncontrolledOpen;
  const setOpen = onOpenChange ?? setUncontrolledOpen;
  const [form, setForm] = React.useState<FormState>(() =>
    initialState(event, defaultDate),
  );
  const isEdit = !!event;

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (open) setForm(initialState(event, defaultDate));
  }, [open, event, defaultDate]);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim() || !form.event_date) return;
    const payload = {
      title: form.title.trim(),
      event_type: form.event_type || undefined,
      event_date: form.event_date,
      notes: form.notes.trim() || undefined,
    };
    if (event) updateEvent(event.id, payload);
    else createEvent(payload);
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit event" : "New event"}</DialogTitle>
          <DialogDescription>
            Put a key business date on the calendar.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <Field label="Title" required>
            <Input
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="e.g. Payroll run"
              required
            />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Date" required>
              <Input
                type="date"
                value={form.event_date}
                onChange={(e) => set("event_date", e.target.value)}
                required
              />
            </Field>
            <Field label="Type">
              <Select
                value={form.event_type || undefined}
                onValueChange={(v) => set("event_type", v as EventType)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {EVENT_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {humanizeStatus(t)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>
          <Field label="Notes">
            <Textarea
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              placeholder="Optional…"
            />
          </Field>
          <DialogFooter className="sm:justify-between">
            {isEdit ? (
              <Button
                type="button"
                variant="ghost"
                className="text-destructive hover:text-destructive"
                onClick={() => {
                  if (event) deleteEvent(event.id);
                  setOpen(false);
                }}
              >
                Delete
              </Button>
            ) : (
              <span />
            )}
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!form.title.trim() || !form.event_date}
              >
                {isEdit ? "Save changes" : "Add event"}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label>
        {label}
        {required && <span className="text-destructive"> *</span>}
      </Label>
      {children}
    </div>
  );
}
