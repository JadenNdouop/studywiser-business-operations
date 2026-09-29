/**
 * The Operations store now lives in <AppProviders> at the app root, so this
 * layout is just a passthrough.
 */
export default function OperationsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
