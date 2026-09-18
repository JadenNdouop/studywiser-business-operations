"use client";

import { Menu } from "lucide-react";
import { usePathname } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { DEMO_MODE } from "@/lib/demo-mode";
import { UserMenu } from "./user-menu";
import { allNavItems } from "./nav-config";

function useCurrentTitle() {
  const pathname = usePathname();
  // Longest matching href wins (so /finance/revenue beats /finance).
  const match = [...allNavItems]
    .filter((i) => pathname === i.href || pathname.startsWith(`${i.href}/`))
    .sort((a, b) => b.href.length - a.href.length)[0];
  return match?.title ?? "StudyWiser Ops";
}

export function Header({
  user,
  onMenuClick,
}: {
  user: { fullName: string; email: string; roles: string[] };
  onMenuClick: () => void;
}) {
  const title = useCurrentTitle();

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={onMenuClick}
        aria-label="Open navigation menu"
      >
        <Menu className="h-5 w-5" />
      </Button>
      <h1 className="text-sm font-semibold tracking-tight">{title}</h1>
      {DEMO_MODE && (
        <Badge variant="warning" className="hidden sm:inline-flex">
          Demo
        </Badge>
      )}
      <div className="flex-1" />
      <ThemeToggle />
      <UserMenu
        fullName={user.fullName}
        email={user.email}
        roles={user.roles}
      />
    </header>
  );
}
