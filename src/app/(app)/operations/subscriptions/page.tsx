import type { Metadata } from "next";

import { ComingSoon } from "@/components/shell/coming-soon";

export const metadata: Metadata = { title: "Subscriptions" };

export default function Page() {
  return <ComingSoon title="Subscriptions" phase={5} />;
}
