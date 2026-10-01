import Image from "next/image";
import { CheckCircle2 } from "lucide-react";

import { Brand } from "@/components/brand";

const HIGHLIGHTS = [
  "Finance, invoicing & expenses",
  "CRM, leads & clients",
  "Workforce & compensation",
  "Projects, vendors & operations",
];

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      {/* Branded panel (desktop only) */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-primary p-10 text-primary-foreground lg:flex">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-white/10 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-32 -left-24 h-96 w-96 rounded-full bg-white/10 blur-3xl"
        />

        <div className="relative flex items-center gap-3">
          <Image
            src="/studywiser-badge-light.png"
            alt="StudyWiser"
            width={40}
            height={40}
            priority
            className="h-10 w-10 rounded-lg"
          />
          <div className="leading-tight">
            <div className="text-lg font-semibold">StudyWiser</div>
            <div className="text-sm text-primary-foreground/70">Operations</div>
          </div>
        </div>

        <div className="relative space-y-6">
          <h1 className="text-3xl font-semibold leading-tight tracking-tight">
            Your whole business,
            <br />
            in one console.
          </h1>
          <ul className="space-y-2.5">
            {HIGHLIGHTS.map((h) => (
              <li
                key={h}
                className="flex items-center gap-2.5 text-primary-foreground/90"
              >
                <CheckCircle2 className="h-5 w-5 shrink-0" />
                <span>{h}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-primary-foreground/60">
          Internal business operations · StudyWiser
        </p>
      </div>

      {/* Form panel */}
      <div className="flex flex-col items-center justify-center gap-6 bg-muted/30 p-6">
        <div className="lg:hidden">
          <Brand />
        </div>
        <div className="w-full max-w-sm">{children}</div>
        <p className="text-xs text-muted-foreground lg:hidden">
          Internal business operations · StudyWiser
        </p>
      </div>
    </div>
  );
}
