"use client";

import { CrmProvider } from "@/lib/crm/store";
import { FinanceProvider } from "@/lib/finance/store";
import { WorkforceProvider } from "@/lib/workforce/store";
import { OperationsProvider } from "@/lib/operations/store";

/**
 * All domain stores, mounted once for the whole app.
 *
 * They live here (not in per-domain layouts) so cross-domain screens — the
 * executive dashboard and the analytics pages — can read every domain from a
 * single, shared, live source. Mounting a domain's provider in two places would
 * create two independent copies of its state fighting over the same
 * localStorage key, so each provider must appear exactly once: here.
 *
 * CRM is outermost because Finance reads client names from it.
 */
export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <CrmProvider>
      <FinanceProvider>
        <WorkforceProvider>
          <OperationsProvider>{children}</OperationsProvider>
        </WorkforceProvider>
      </FinanceProvider>
    </CrmProvider>
  );
}
