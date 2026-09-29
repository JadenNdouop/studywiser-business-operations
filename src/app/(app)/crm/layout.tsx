import { CrmProvider } from "@/lib/crm/store";

/**
 * Wraps every /crm/* page in the CRM store provider, so leads, clients, and
 * activities are available (and persisted) across all the CRM screens.
 */
export default function CrmLayout({ children }: { children: React.ReactNode }) {
  return <CrmProvider>{children}</CrmProvider>;
}
