import { WorkforceProvider } from "@/lib/workforce/store";

export default function WorkforceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <WorkforceProvider>{children}</WorkforceProvider>;
}
