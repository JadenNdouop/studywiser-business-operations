import { redirect } from "next/navigation";

/**
 * The app has no marketing landing page — the root just forwards into the
 * console. Middleware sends unauthenticated visitors to /login.
 */
export default function RootPage() {
  redirect("/dashboard");
}
