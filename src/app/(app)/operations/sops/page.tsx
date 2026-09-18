import type { Metadata } from "next";

import { ComingSoon } from "@/components/shell/coming-soon";

export const metadata: Metadata = { title: "SOPs" };

export default function Page() {
  return <ComingSoon title="SOPs" phase={5} />;
}
