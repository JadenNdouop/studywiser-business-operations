/**
 * The CRM store now lives in <AppProviders> at the app root (so cross-domain
 * screens can read it too), so this layout is just a passthrough.
 */
export default function CrmLayout({ children }: { children: React.ReactNode }) {
  return children;
}
