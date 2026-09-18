import type { Metadata } from "next";

import { ComingSoon } from "@/components/shell/coming-soon";

export const metadata: Metadata = { title: "Calendar" };

export default function Page() {
  return <ComingSoon title="Calendar" phase={5} />;
}
