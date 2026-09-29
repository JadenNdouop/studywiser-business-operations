"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  CalendarClock,
  Mail,
  MapPin,
  Phone,
  UserCheck,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { StatusBadge } from "@/components/status-badge";
import { LoadingState } from "@/components/states/loading-state";
import { EmptyState } from "@/components/states/empty-state";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { LeadFormDialog } from "@/components/crm/lead-form-dialog";
import { useCrm } from "@/lib/crm/store";
import {
  ACTIVITY_TYPES,
  ALL_STAGES,
  type ActivityType,
} from "@/lib/crm/types";
import { humanizeStatus } from "@/lib/status";
import { formatCurrency } from "@/lib/utils";

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function LeadDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const {
    ready,
    getLead,
    getClient,
    activitiesForLead,
    setLeadStage,
    addActivity,
    convertLead,
    deleteLead,
  } = useCrm();

  const [deleting, setDeleting] = React.useState(false);
  const [converting, setConverting] = React.useState(false);
  const [activityType, setActivityType] = React.useState<ActivityType>("call");
  const [activityNote, setActivityNote] = React.useState("");

  if (!ready) return <LoadingState />;

  const lead = getLead(params.id);
  if (!lead) {
    return (
      <EmptyState
        title="Lead not found"
        description="It may have been deleted."
        action={
          <Button asChild variant="outline">
            <Link href="/crm/leads">Back to leads</Link>
          </Button>
        }
      />
    );
  }

  const activities = activitiesForLead(lead.id);
  const linkedClient = lead.converted_client_id
    ? getClient(lead.converted_client_id)
    : undefined;

  function logActivity() {
    if (!activityNote.trim()) return;
    addActivity(lead!.id, {
      activity_type: activityType,
      notes: activityNote.trim(),
    });
    setActivityNote("");
  }

  return (
    <div className="space-y-6">
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-2 mb-2">
          <Link href="/crm/leads">
            <ArrowLeft className="h-4 w-4" /> Leads
          </Link>
        </Button>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-semibold tracking-tight">
                {lead.guardian_name}
              </h1>
              <StatusBadge status={lead.pipeline_stage} />
            </div>
            {lead.student_name && (
              <p className="mt-1 text-sm text-muted-foreground">
                {lead.student_name}
                {lead.grade ? ` · ${lead.grade}` : ""}
                {lead.subject_needed ? ` · ${lead.subject_needed}` : ""}
              </p>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <LeadFormDialog
              lead={lead}
              trigger={<Button variant="outline">Edit</Button>}
            />
            <Button
              variant="outline"
              className="text-destructive hover:text-destructive"
              onClick={() => setDeleting(true)}
            >
              Delete
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main column */}
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Details</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
              <Detail icon={Mail} label="Email" value={lead.email} />
              <Detail icon={Phone} label="Phone" value={lead.phone} />
              <Detail icon={MapPin} label="Location" value={lead.location} />
              <Detail
                label="Source"
                value={lead.lead_source ? humanizeStatus(lead.lead_source) : undefined}
              />
              <Detail
                label="Estimated value"
                value={
                  lead.estimated_value != null
                    ? formatCurrency(lead.estimated_value)
                    : undefined
                }
              />
              <Detail label="Date received" value={lead.date_received} />
              <Detail label="Last contact" value={lead.last_contact_date} />
              <Detail
                icon={CalendarClock}
                label="Next follow-up"
                value={lead.next_follow_up_date}
              />
              {lead.notes && (
                <div className="sm:col-span-2">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Notes
                  </p>
                  <p className="mt-1 text-sm">{lead.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Activity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col gap-2 sm:flex-row">
                <Select
                  value={activityType}
                  onValueChange={(v) => setActivityType(v as ActivityType)}
                >
                  <SelectTrigger className="sm:w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ACTIVITY_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {humanizeStatus(t)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Textarea
                  value={activityNote}
                  onChange={(e) => setActivityNote(e.target.value)}
                  placeholder="Log a call, email, or note…"
                  className="min-h-[40px] flex-1"
                />
                <Button
                  onClick={logActivity}
                  disabled={!activityNote.trim()}
                  className="sm:self-start"
                >
                  Log
                </Button>
              </div>

              <Separator />

              {activities.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  No activity logged yet.
                </p>
              ) : (
                <ul className="space-y-4">
                  {activities.map((a) => (
                    <li key={a.id} className="flex gap-3">
                      <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-medium">
                            {humanizeStatus(a.activity_type)}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {formatDateTime(a.occurred_at)}
                          </span>
                        </div>
                        {a.notes && (
                          <p className="text-sm text-muted-foreground">{a.notes}</p>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Side column */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Pipeline stage</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Select
                value={lead.pipeline_stage}
                onValueChange={(v) =>
                  setLeadStage(lead.id, v as (typeof ALL_STAGES)[number])
                }
                disabled={lead.pipeline_stage === "converted"}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ALL_STAGES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {humanizeStatus(s)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Changing the stage is logged in the activity timeline.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Conversion</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {linkedClient ? (
                <>
                  <p className="flex items-center gap-2 text-sm text-success">
                    <UserCheck className="h-4 w-4" /> Converted to a client.
                  </p>
                  <Button asChild variant="outline" className="w-full">
                    <Link href={`/crm/clients/${linkedClient.id}`}>
                      View client <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground">
                    Ready to enroll? Convert this lead into a client record.
                  </p>
                  <Button className="w-full" onClick={() => setConverting(true)}>
                    <UserCheck className="h-4 w-4" /> Convert to client
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <ConfirmDialog
        open={deleting}
        onOpenChange={setDeleting}
        title="Delete this lead?"
        description={`"${lead.guardian_name}" and its activity history will be removed. This can't be undone.`}
        confirmLabel="Delete lead"
        onConfirm={() => {
          deleteLead(lead.id);
          router.push("/crm/leads");
        }}
      />

      <ConfirmDialog
        open={converting}
        onOpenChange={setConverting}
        variant="default"
        title="Convert to client?"
        description="This creates a client record from this lead and marks the lead as converted. The lead stays in your history."
        confirmLabel="Convert"
        onConfirm={() => {
          convertLead(lead.id);
          setConverting(false);
        }}
      />
    </div>
  );
}

function Detail({
  icon: Icon,
  label,
  value,
}: {
  icon?: React.ComponentType<{ className?: string }>;
  label: string;
  value?: string;
}) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-0.5 flex items-center gap-1.5 text-sm">
        {Icon && value && <Icon className="h-3.5 w-3.5 text-muted-foreground" />}
        {value ?? "—"}
      </p>
    </div>
  );
}
