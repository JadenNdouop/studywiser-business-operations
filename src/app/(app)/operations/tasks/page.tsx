import type { Metadata } from "next";

import { ComingSoon } from "@/components/shell/coming-soon";

export const metadata: Metadata = { title: "Tasks" };

export default function Page() {
  return <ComingSoon title="Tasks" phase={5} />;
}
