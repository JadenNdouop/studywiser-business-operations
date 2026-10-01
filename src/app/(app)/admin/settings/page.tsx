"use client";

import * as React from "react";
import { Check } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LoadingState } from "@/components/states/loading-state";
import {
  getSettings,
  updateSettings,
  EMPTY_SETTINGS,
  type OrgSettings,
} from "@/lib/admin/settings-api";

export default function SettingsPage() {
  const [settings, setSettings] = React.useState<OrgSettings>(EMPTY_SETTINGS);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [saved, setSaved] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await getSettings();
        if (active) setSettings(data);
      } catch (e) {
        if (active)
          setError(e instanceof Error ? e.message : "Failed to load settings.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  function set<K extends keyof OrgSettings>(key: K, value: OrgSettings[K]) {
    setSettings((s) => ({ ...s, [key]: value }));
    setSaved(false);
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      await updateSettings(settings);
      setSaved(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save settings.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Settings" description="Your business profile and defaults." />
        <LoadingState />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Your business profile and billing defaults."
        actions={
          <Button onClick={handleSave} disabled={saving} className="gap-1.5">
            {saved && !saving && <Check className="h-4 w-4" />}
            {saving ? "Saving…" : saved ? "Saved" : "Save changes"}
          </Button>
        }
      />

      {error && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm">
          <p className="font-medium text-foreground">Something went wrong</p>
          <p className="text-muted-foreground">{error}</p>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Business profile</CardTitle>
          <CardDescription>
            Shown on invoices and used across the app.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field label="Business name">
            <Input
              value={settings.business_name}
              onChange={(e) => set("business_name", e.target.value)}
            />
          </Field>
          <Field label="Legal name">
            <Input
              value={settings.legal_name ?? ""}
              onChange={(e) => set("legal_name", e.target.value || null)}
              placeholder="e.g. StudyWiser LLC"
            />
          </Field>
          <Field label="Email">
            <Input
              type="email"
              value={settings.email ?? ""}
              onChange={(e) => set("email", e.target.value || null)}
            />
          </Field>
          <Field label="Phone">
            <Input
              value={settings.phone ?? ""}
              onChange={(e) => set("phone", e.target.value || null)}
            />
          </Field>
          <Field label="Website">
            <Input
              value={settings.website ?? ""}
              onChange={(e) => set("website", e.target.value || null)}
              placeholder="studywiser.org"
            />
          </Field>
          <Field label="Address" className="sm:col-span-2">
            <Textarea
              value={settings.address ?? ""}
              onChange={(e) => set("address", e.target.value || null)}
              rows={2}
            />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Billing defaults</CardTitle>
          <CardDescription>
            Defaults applied when creating invoices and records.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field label="Default hourly rate ($)">
            <Input
              type="number"
              min={0}
              step="0.01"
              value={String(settings.default_hourly_rate)}
              onChange={(e) =>
                set("default_hourly_rate", Number(e.target.value) || 0)
              }
            />
          </Field>
          <Field label="Invoice number prefix">
            <Input
              value={settings.invoice_prefix}
              onChange={(e) =>
                set("invoice_prefix", e.target.value.toUpperCase())
              }
              placeholder="SW"
            />
          </Field>
        </CardContent>
      </Card>
    </div>
  );
}

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <Label className="mb-1.5 block">{label}</Label>
      {children}
    </div>
  );
}
