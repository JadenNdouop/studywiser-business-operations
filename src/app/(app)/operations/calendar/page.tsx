"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LoadingState } from "@/components/states/loading-state";
import { EventFormDialog } from "@/components/operations/event-form-dialog";
import { useOperations } from "@/lib/operations/store";
import type { BusinessEvent } from "@/lib/operations/types";
import { humanizeStatus } from "@/lib/status";
import { cn } from "@/lib/utils";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function ymd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function CalendarPage() {
  const { ready, events } = useOperations();
  const today = React.useMemo(() => new Date(), []);
  const [view, setView] = React.useState(() => ({
    year: today.getFullYear(),
    month: today.getMonth(), // 0-based
  }));

  // Editing an existing event (opens the dialog controlled).
  const [editing, setEditing] = React.useState<BusinessEvent | null>(null);
  // Adding on a specific clicked day.
  const [addDate, setAddDate] = React.useState<string | null>(null);

  const eventsByDay = React.useMemo(() => {
    const map = new Map<string, BusinessEvent[]>();
    for (const e of events) {
      const list = map.get(e.event_date) ?? [];
      list.push(e);
      map.set(e.event_date, list);
    }
    return map;
  }, [events]);

  // Build the 6×7 grid of days for the visible month.
  const cells = React.useMemo(() => {
    const first = new Date(view.year, view.month, 1);
    const startOffset = first.getDay(); // 0=Sun
    const start = new Date(view.year, view.month, 1 - startOffset);
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  }, [view]);

  const upcoming = React.useMemo(() => {
    const t = ymd(today);
    return [...events]
      .filter((e) => e.event_date >= t)
      .sort((a, b) => a.event_date.localeCompare(b.event_date))
      .slice(0, 6);
  }, [events, today]);

  function shiftMonth(delta: number) {
    setView((v) => {
      const d = new Date(v.year, v.month + delta, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
  }

  const todayStr = ymd(today);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Calendar"
        description="Payroll, filings, renewals, and other key business dates."
        actions={
          <EventFormDialog
            trigger={
              <Button>
                <Plus className="h-4 w-4" /> New event
              </Button>
            }
          />
        }
      />

      {!ready ? (
        <LoadingState />
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base">
                {MONTHS[view.month]} {view.year}
              </CardTitle>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  aria-label="Previous month"
                  onClick={() => shiftMonth(-1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setView({
                      year: today.getFullYear(),
                      month: today.getMonth(),
                    })
                  }
                >
                  Today
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  aria-label="Next month"
                  onClick={() => shiftMonth(1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 border-l border-t">
                {WEEKDAYS.map((w) => (
                  <div
                    key={w}
                    className="border-b border-r bg-muted/40 px-2 py-1.5 text-center text-xs font-medium text-muted-foreground"
                  >
                    {w}
                  </div>
                ))}
                {cells.map((d) => {
                  const key = ymd(d);
                  const inMonth = d.getMonth() === view.month;
                  const dayEvents = eventsByDay.get(key) ?? [];
                  const isToday = key === todayStr;
                  return (
                    <button
                      type="button"
                      key={key}
                      onClick={() => setAddDate(key)}
                      className={cn(
                        "min-h-[84px] border-b border-r p-1.5 text-left align-top transition-colors hover:bg-muted/40",
                        !inMonth && "bg-muted/20 text-muted-foreground",
                      )}
                    >
                      <span
                        className={cn(
                          "inline-flex h-6 w-6 items-center justify-center rounded-full text-xs tabular-nums",
                          isToday && "bg-primary font-semibold text-primary-foreground",
                        )}
                      >
                        {d.getDate()}
                      </span>
                      <div className="mt-1 space-y-1">
                        {dayEvents.slice(0, 3).map((e) => (
                          <span
                            key={e.id}
                            role="button"
                            tabIndex={0}
                            onClick={(ev) => {
                              ev.stopPropagation();
                              setEditing(e);
                            }}
                            onKeyDown={(ev) => {
                              if (ev.key === "Enter") {
                                ev.stopPropagation();
                                setEditing(e);
                              }
                            }}
                            className="block truncate rounded bg-primary/10 px-1 py-0.5 text-[11px] font-medium text-primary hover:bg-primary/20"
                            title={e.title}
                          >
                            {e.title}
                          </span>
                        ))}
                        {dayEvents.length > 3 && (
                          <span className="block px-1 text-[11px] text-muted-foreground">
                            +{dayEvents.length - 3} more
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Click a day to add an event, or an event to edit it.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Upcoming</CardTitle>
            </CardHeader>
            <CardContent>
              {upcoming.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  Nothing scheduled ahead.
                </p>
              ) : (
                <ul className="divide-y">
                  {upcoming.map((e) => (
                    <li key={e.id}>
                      <button
                        type="button"
                        onClick={() => setEditing(e)}
                        className="flex w-full items-start justify-between gap-3 py-2.5 text-left hover:opacity-80"
                      >
                        <div>
                          <p className="text-sm font-medium">{e.title}</p>
                          <p className="text-xs tabular-nums text-muted-foreground">
                            {e.event_date}
                          </p>
                        </div>
                        {e.event_type && (
                          <Badge variant="secondary" className="shrink-0">
                            {humanizeStatus(e.event_type)}
                          </Badge>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Edit an existing event */}
      {editing && (
        <EventFormDialog
          event={editing}
          open={!!editing}
          onOpenChange={(o) => !o && setEditing(null)}
        />
      )}

      {/* Add an event on a clicked day */}
      {addDate && (
        <EventFormDialog
          defaultDate={addDate}
          open={!!addDate}
          onOpenChange={(o) => !o && setAddDate(null)}
        />
      )}
    </div>
  );
}
