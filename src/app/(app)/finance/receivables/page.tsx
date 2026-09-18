import type { Metadata } from "next";

import { ComingSoon } from "@/components/shell/coming-soon";

export const metadata: Metadata = { title: "Receivables" };

export default function Page() {
  return <ComingSoon title="Receivables" phase={3} />;
}
