"use client";

import * as React from "react";
import { Check } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ROLES, type AdminUser, type RoleName } from "@/lib/admin/types";

/**
 * Toggle a user's roles. Owners can't remove their own "owner" role (prevents
 * locking yourself out). Saving reports the full desired role set to the caller.
 */
export function ManageRolesDialog({
  user,
  open,
  onOpenChange,
  onSave,
}: {
  user: AdminUser | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (userId: string, roles: RoleName[]) => Promise<void> | void;
}) {
  const [selected, setSelected] = React.useState<Set<RoleName>>(new Set());
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (open && user) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelected(new Set(user.roles));
    }
  }, [open, user]);

  if (!user) return null;

  const lockOwner = user.isCurrentUser; // can't drop your own owner role

  function toggle(role: RoleName) {
    if (lockOwner && role === "owner") return;
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(role)) next.delete(role);
      else next.add(role);
      return next;
    });
  }

  async function handleSave() {
    if (!user) return;
    setSaving(true);
    try {
      await onSave(user.id, [...selected]);
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Manage roles</DialogTitle>
          <DialogDescription>
            {user.full_name} — choose which roles this person holds.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-1.5">
          {ROLES.map((role) => {
            const isSelected = selected.has(role.name);
            const disabled = lockOwner && role.name === "owner";
            return (
              <button
                key={role.name}
                type="button"
                onClick={() => toggle(role.name)}
                disabled={disabled}
                aria-pressed={isSelected}
                className={cn(
                  "flex w-full items-start gap-3 rounded-lg border p-3 text-left transition-colors",
                  isSelected
                    ? "border-primary/40 bg-primary/5"
                    : "border-border hover:bg-muted/50",
                  disabled && "cursor-not-allowed opacity-70",
                )}
              >
                <span
                  className={cn(
                    "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border",
                    isSelected
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-muted-foreground/40",
                  )}
                >
                  {isSelected && <Check className="h-3 w-3" />}
                </span>
                <span className="space-y-0.5">
                  <span className="block text-sm font-medium">
                    {role.label}
                    {disabled && (
                      <span className="ml-2 text-xs font-normal text-muted-foreground">
                        (you)
                      </span>
                    )}
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    {role.description}
                  </span>
                </span>
              </button>
            );
          })}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving…" : "Save roles"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
