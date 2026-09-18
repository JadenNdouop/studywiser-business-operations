import type { Metadata } from "next";

import { ComingSoon } from "@/components/shell/coming-soon";

export const metadata: Metadata = { title: "Vendors" };

export default function Page() {
  return <ComingSoon title="Vendors" phase={5} />;
}
