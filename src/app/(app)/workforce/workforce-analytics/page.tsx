import type { Metadata } from "next";

import { ComingSoon } from "@/components/shell/coming-soon";

export const metadata: Metadata = { title: "Workforce Analytics" };

export default function Page() {
  return <ComingSoon title="Workforce Analytics" phase={6} />;
}
