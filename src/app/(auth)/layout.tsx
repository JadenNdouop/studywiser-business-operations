import { Brand } from "@/components/brand";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted/40 p-4">
      <Brand />
      <div className="w-full max-w-sm">{children}</div>
      <p className="text-xs text-muted-foreground">
        Internal business operations · StudyWiser
      </p>
    </div>
  );
}
