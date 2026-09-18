import type { Metadata } from "next";

import { ComingSoon } from "@/components/shell/coming-soon";

export const metadata: Metadata = { title: "Projects" };

export default function Page() {
  return <ComingSoon title="Projects" phase={5} />;
}
