import { CrmProvider } from "@/lib/crm/store";
import { FinanceProvider } from "@/lib/finance/store";

/**
 * Finance pages need both stores: the finance store (invoices, payments,
 * expenses…) and the CRM store (to look up client names for invoices).
 */
export default function FinanceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CrmProvider>
      <FinanceProvider>{children}</FinanceProvider>
    </CrmProvider>
  );
}
