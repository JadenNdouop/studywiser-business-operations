import type { Metadata } from "next";

import { ComingSoon } from "@/components/shell/coming-soon";

export const metadata: Metadata = { title: "Financial Analytics" };

export default function Page() {
  return <ComingSoon title="Financial Analytics" phase={6} />;
}
