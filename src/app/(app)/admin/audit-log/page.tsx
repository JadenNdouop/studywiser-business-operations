import type { Metadata } from "next";

import { ComingSoon } from "@/components/shell/coming-soon";

export const metadata: Metadata = { title: "Audit Log" };

export default function Page() {
  return <ComingSoon title="Audit Log" phase={6} />;
}
