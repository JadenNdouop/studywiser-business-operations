import type { Metadata } from "next";

import { ComingSoon } from "@/components/shell/coming-soon";

export const metadata: Metadata = { title: "Revenue" };

export default function Page() {
  return <ComingSoon title="Revenue" phase={3} />;
}
