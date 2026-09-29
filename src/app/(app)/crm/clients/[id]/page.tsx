"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Mail, Phone } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatusBadge } from "@/components/status-badge";
import { LoadingState } from "@/components/states/loading-state";
import { EmptyState } from "@/components/states/empty-state";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { ClientFormDialog } from "@/components/crm/client-form-dialog";
import { useCrm } from "@/lib/crm/store";
import { CLIENT_STATUSES, type ClientStatus } from "@/lib/crm/types";
import { humanizeStatus } from "@/lib/status";

export default function ClientDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { ready, getClient, updateClientStatus, deleteClient, leads } = useCrm();
  const [deleting, setDeleting] = React.useState(false);

  if (!ready) return <LoadingState />;

  const client = getClient(params.id);
  if (!client) {
    return (
      <EmptyState
        title="Client not found"
        description="It may have been deleted."
        action={
          <Button asChild variant="outline">
            <Link href="/crm/clients">Back to clients</Link>
          </Button>
        }
      />
    );
  }

  const sourceLead = leads.find((l) => l.converted_client_id === client.id);

  return (
    <div className="space-y-6">
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-2 mb-2">
          <Link href="/crm/clients">
            <ArrowLeft className="h-4 w-4" /> Clients
          </Link>
        </Button>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold tracking-tight">
              {client.family_name}
            </h1>
            <StatusBadge status={client.status} />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <ClientFormDialog
              client={client}
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
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Details</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
            <Detail label="Primary contact" value={client.primary_contact_name} />
            <Detail icon={Mail} label="Email" value={client.email} />
            <Detail icon={Phone} label="Phone" value={client.phone} />
            <Detail label="Customer since" value={client.customer_since} />
            <Detail label="Acquisition source" value={client.acquisition_source} />
            {sourceLead && (
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Converted from lead
                </p>
                <Link
                  href={`/crm/leads/${sourceLead.id}`}
                  className="mt-0.5 block text-sm text-primary hover:underline"
                >
                  {sourceLead.guardian_name}
                </Link>
              </div>
            )}
            {client.billing_notes && (
              <div className="sm:col-span-2">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Billing notes
                </p>
                <p className="mt-1 text-sm">{client.billing_notes}</p>
              </div>
            )}
            {client.notes && (
              <div className="sm:col-span-2">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Notes
                </p>
                <p className="mt-1 text-sm">{client.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Select
              value={client.status}
              onValueChange={(v) =>
                updateClientStatus(client.id, v as ClientStatus)
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CLIENT_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {humanizeStatus(s)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Invoices and payments for this client arrive in Phase 3 (Finance).
            </p>
          </CardContent>
        </Card>
      </div>

      <ConfirmDialog
        open={deleting}
        onOpenChange={setDeleting}
        title="Delete this client?"
        description={`"${client.family_name}" will be removed. This can't be undone.`}
        confirmLabel="Delete client"
        onConfirm={() => {
          deleteClient(client.id);
          router.push("/crm/clients");
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
