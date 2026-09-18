import type { Metadata } from "next";

import { ComingSoon } from "@/components/shell/coming-soon";

export const metadata: Metadata = { title: "Users" };

export default function Page() {
  return <ComingSoon title="Users" phase={1} />;
}
