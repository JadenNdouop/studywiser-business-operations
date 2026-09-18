import type { Metadata } from "next";

import { ComingSoon } from "@/components/shell/coming-soon";

export const metadata: Metadata = { title: "Roles" };

export default function Page() {
  return <ComingSoon title="Roles" phase={1} />;
}
