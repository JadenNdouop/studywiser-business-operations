import type { Metadata } from "next";

import { ComingSoon } from "@/components/shell/coming-soon";

export const metadata: Metadata = { title: "Overview" };

export default function Page() {
  return <ComingSoon title="Overview" phase={3} />;
}
