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

function NavLink({
  item,
  onNavigate,
}: {
  item: NavItem;
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
          ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
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

  return (
    <div className="space-y-1">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2 px-2.5 py-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground/80 hover:text-foreground"
      >
        <GroupIcon className="h-3.5 w-3.5" />
        <span>{group.label}</span>
        <ChevronRight
          className={cn(
            "ml-auto h-3.5 w-3.5 transition-transform",
            open && "rotate-90",
          )}
        />
        {!open && groupActive && (
          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
        )}
      </button>
      {open && (
        <div className="space-y-0.5 pl-1">
          {group.items.map((item) => (
            <NavLink key={item.href} item={item} onNavigate={onNavigate} />
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
        <nav className="space-y-4 p-3">
          <div className="space-y-0.5">
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
