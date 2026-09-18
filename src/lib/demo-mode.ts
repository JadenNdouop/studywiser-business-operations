/**
 * Local demo mode.
 *
 * When NEXT_PUBLIC_DEMO_MODE=true, the app runs with NO Supabase backend:
 * auth is bypassed and a fixed demo user is used, so `npm run dev` boots
 * straight into the dashboard/shell with nothing to install or configure.
 *
 * Set it to false (and configure + start Supabase) to turn on real
 * authentication and data. All the Supabase wiring stays in place either way.
 */
export const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

export const DEMO_USER: {
  fullName: string;
  email: string;
  roles: string[];
} = {
  fullName: "StudyWiser Owner",
  email: "owner@studywiser.org",
  roles: ["owner"],
};
