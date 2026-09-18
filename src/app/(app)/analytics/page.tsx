import type { Metadata } from "next";

import { ComingSoon } from "@/components/shell/coming-soon";

export const metadata: Metadata = { title: "Analytics" };

export default function Page() {
  return <ComingSoon title="Analytics" phase={6} />;
}
