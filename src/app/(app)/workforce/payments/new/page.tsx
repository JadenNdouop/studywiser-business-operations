import type { Metadata } from "next";

import { ComingSoon } from "@/components/shell/coming-soon";

export const metadata: Metadata = { title: "Record Payment" };

export default function Page() {
  return <ComingSoon title="Record Payment" phase={4} />;
}
