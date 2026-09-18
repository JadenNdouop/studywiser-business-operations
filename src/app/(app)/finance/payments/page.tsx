import type { Metadata } from "next";

import { ComingSoon } from "@/components/shell/coming-soon";

export const metadata: Metadata = { title: "Payments" };

export default function Page() {
  return <ComingSoon title="Payments" phase={3} />;
}
