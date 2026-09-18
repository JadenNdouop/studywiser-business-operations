import type { Metadata } from "next";

import { ComingSoon } from "@/components/shell/coming-soon";

export const metadata: Metadata = { title: "Documents" };

export default function Page() {
  return <ComingSoon title="Documents" phase={5} />;
}
