import { OperationsProvider } from "@/lib/operations/store";

export default function OperationsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <OperationsProvider>{children}</OperationsProvider>;
}
