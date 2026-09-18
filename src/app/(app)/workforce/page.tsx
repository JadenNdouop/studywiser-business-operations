import type { Metadata } from "next";

import { ComingSoon } from "@/components/shell/coming-soon";

export const metadata: Metadata = { title: "Workers" };

export default function Page() {
  return <ComingSoon title="Workers" phase={4} />;
}
