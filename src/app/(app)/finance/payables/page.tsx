import type { Metadata } from "next";

import { ComingSoon } from "@/components/shell/coming-soon";

export const metadata: Metadata = { title: "Payables" };

export default function Page() {
  return <ComingSoon title="Payables" phase={3} />;
}
