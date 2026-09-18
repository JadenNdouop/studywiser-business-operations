import type { Metadata } from "next";

import { ComingSoon } from "@/components/shell/coming-soon";

export const metadata: Metadata = { title: "Profit & Loss" };

export default function Page() {
  return <ComingSoon title="Profit & Loss" phase={3} />;
}
