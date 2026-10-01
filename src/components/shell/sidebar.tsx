"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";

import { Brand } from "@/components/brand";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import {
  dashboardItem,
  navGroups,
  type NavGroup,
  type NavItem,
} from "./nav-config";

function isActive(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

interface Accent {
  /** Section header icon color. */
  icon: string;
  /** Left rail color under the section. */
  rail: string;
  /** Active item background + text. */
  activeBg: string;
  activeText: string;
  /** Collapsed-section "active" dot. */
  dot: string;
}

/**
 * Per-section accent colors. Keys match NavGroup.accent in nav-config. Full
 * class strings (not built dynamically) so Tailwind keeps them in the build.
 */
const ACCENTS: Record<string, Accent> = {
  emerald: {
    icon: "text-emerald-600 dark:text-emerald-400",
    rail: "border-emerald-500/30",
    activeBg: "bg-emerald-500/10",
    activeText: "text-emerald-700 dark:text-emerald-300",
    dot: "bg-emerald-500",
  },
  sky: {
    icon: "text-sky-600 dark:text-sky-400",
    rail: "border-sky-500/30",
    activeBg: "bg-sky-500/10",
    activeText: "text-sky-700 dark:text-sky-300",
    dot: "bg-sky-500",
  },
  violet: {
    icon: "text-violet-600 dark:text-violet-400",
    rail: "border-violet-500/30",
    activeBg: "bg-violet-500/10",
    activeText: "text-violet-700 dark:text-violet-300",
    dot: "bg-violet-500",
  },
  amber: {
    icon: "text-amber-600 dark:text-amber-400",
    rail: "border-amber-500/30",
    activeBg: "bg-amber-500/10",
    activeText: "text-amber-700 dark:text-amber-300",
    dot: "bg-amber-500",
  },
  fuchsia: {
    icon: "text-fuchsia-600 dark:text-fuchsia-400",
    rail: "border-fuchsia-500/30",
    activeBg: "bg-fuchsia-500/10",
    activeText: "text-fuchsia-700 dark:text-fuchsia-300",
    dot: "bg-fuchsia-500",
  },
  rose: {
    icon: "text-rose-600 dark:text-rose-400",
    rail: "border-rose-500/30",
    activeBg: "bg-rose-500/10",
    activeText: "text-rose-700 dark:text-rose-300",
    dot: "bg-rose-500",
  },
};

const DEFAULT_ACCENT: Accent = {
  icon: "text-muted-foreground",
  rail: "border-sidebar-border",
  activeBg: "bg-sidebar-accent",
  activeText: "text-sidebar-accent-foreground",
  dot: "bg-primary",
};

function accentFor(key?: string): Accent {
  return (key && ACCENTS[key]) || DEFAULT_ACCENT;
}

function NavLink({
  item,
  accent = DEFAULT_ACCENT,
  onNavigate,
}: {
  item: NavItem;
  accent?: Accent;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const active = isActive(pathname, item.href);
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm transition-colors",
        active
          ? cn("font-medium", accent.activeBg, accent.activeText)
          : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span className="truncate">{item.title}</span>
      {!item.ready && (
        <span className="ml-auto rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
          Soon
        </span>
      )}
    </Link>
  );
}

function NavGroupSection({
  group,
  onNavigate,
}: {
  group: NavGroup;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const groupActive = group.items.some((i) => isActive(pathname, i.href));
  const [open, setOpen] = React.useState(true);
  const GroupIcon = group.icon;
  const accent = accentFor(group.accent);

  return (
    <div className="space-y-1 border-t border-sidebar-border/70 pt-3">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex w-full items-center gap-2 px-2.5 py-1.5 text-xs font-semibold uppercase tracking-wider hover:text-foreground",
          groupActive ? "text-foreground" : "text-muted-foreground/70",
        )}
      >
        <GroupIcon className={cn("h-3.5 w-3.5", accent.icon)} />
        <span>{group.label}</span>
        <ChevronRight
          className={cn(
            "ml-auto h-3.5 w-3.5 transition-transform",
            open && "rotate-90",
          )}
        />
        {!open && groupActive && (
          <span className={cn("h-1.5 w-1.5 rounded-full", accent.dot)} />
        )}
      </button>
      {open && (
        <div
          className={cn(
            "ml-[1.1rem] space-y-0.5 border-l pl-2.5",
            accent.rail,
          )}
        >
          {group.items.map((item) => (
            <NavLink
              key={item.href}
              item={item}
              accent={accent}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/** The navigation body, shared by the desktop sidebar and the mobile sheet. */
export function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex h-14 items-center border-b px-4">
        <Link href="/dashboard" onClick={onNavigate}>
          <Brand />
        </Link>
      </div>
      <ScrollArea className="flex-1">
        <nav className="space-y-3 p-3">
          <div className="space-y-0.5 pb-1">
            <NavLink item={dashboardItem} onNavigate={onNavigate} />
          </div>
          {navGroups.map((group) => (
            <NavGroupSection
              key={group.label}
              group={group}
              onNavigate={onNavigate}
            />
          ))}
        </nav>
      </ScrollArea>
    </div>
  );
}
