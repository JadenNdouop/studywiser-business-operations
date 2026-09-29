/**
 * The Finance and CRM stores now live in <AppProviders> at the app root, so
 * this layout is just a passthrough.
 */
export default function FinanceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
