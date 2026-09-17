import { headers } from "next/headers";

/**
 * Best-effort absolute base URL for building auth redirect links.
 * Prefers an explicit env var (set this in production), then the request
 * origin, then a localhost fallback for development.
 */
export async function getSiteUrl(): Promise<string> {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL;
  if (fromEnv) return fromEnv.replace(/\/$/, "");

  try {
    const h = await headers();
    const origin = h.get("origin");
    if (origin) return origin;
    const host = h.get("host");
    const proto = h.get("x-forwarded-proto") ?? "http";
    if (host) return `${proto}://${host}`;
  } catch {
    // headers() unavailable outside a request scope
  }

  return "http://localhost:3000";
}
