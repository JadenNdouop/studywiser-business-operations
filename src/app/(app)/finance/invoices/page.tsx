import type { Metadata } from "next";

import { ComingSoon } from "@/components/shell/coming-soon";

export const metadata: Metadata = { title: "Invoices" };

export default function Page() {
  return <ComingSoon title="Invoices" phase={3} />;
}
