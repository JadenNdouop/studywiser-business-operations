# StudyWiser Ops

Internal business operations platform for StudyWiser — finance, CRM & sales,
workforce, operations, and business intelligence in one console.

> This is the **internal** back-office system. It is a completely separate
> application (and separate Supabase project) from the customer-facing
> StudyWiser tutoring app. No student-facing or session-delivery functionality
> lives here.

## Status

**Phase 1 — Foundation + Executive Shell: complete.** The app has authentication,
the full navigation shell, a demo-data dashboard, the shared component library,
and every database table with Row Level Security. Domain features (CRM, Finance,
Workforce, Operations, BI) arrive in Phases 2–6 — their nav links currently show
a "coming in a later phase" placeholder. See `docs`/the project's architecture
doc for the full phase plan.

## Tech stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript** (strict)
- **Tailwind CSS v4** + shadcn-style UI primitives (Radix)
- **Supabase** (Postgres + Auth) with Row Level Security
- **Recharts** for charts, **react-hook-form** + **zod** for forms
- **Vitest** + Testing Library for tests

## Prerequisites

- Node.js 20+ (built with Node 22)
- [Supabase CLI](https://supabase.com/docs/guides/cli) and Docker (for local dev)

## Getting started (clean checkout)

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env.local
# The defaults in .env.example are the standard local Supabase values and work
# as-is for local development. For production, fill in your hosted project's URL
# and anon key.

# 3. Start local Supabase (Postgres + Auth). Requires Docker.
supabase start

# 4. Apply all migrations and seed the local dev owner account
supabase db reset

# 5. Run the app
npm run dev
```

Open http://localhost:3000 and sign in with the seeded local owner:

- **Email:** `owner@studywiser.local`
- **Password:** `DevPassword123!`

## Owner provisioning

There is no manual "make me an admin" step. The **first user to sign up** on a
fresh project is automatically granted the `owner` role (via a database trigger),
so on a new production project the first sign-up — the account owner — becomes
owner. Locally, `supabase db reset` seeds that owner for you.

To (re)grant owner explicitly, run in the Supabase SQL editor:

```sql
select public.grant_owner_by_email('you@studywiser.org');
```

## Testing

```bash
npm test            # unit + component tests (no database needed)
npm run test:db     # RLS deny-by-default check against a running local Supabase
npm run typecheck   # strict TypeScript check
npm run lint        # ESLint
```

`npm run test:db` requires `supabase start` to be running. There is also a
pure-SQL version of the RLS check that needs no Node:

```bash
psql "$(supabase status -o env | grep DB_URL | cut -d= -f2- | tr -d '\"')" \
  -f supabase/tests/rls_deny_by_default.sql
```

## Project structure

```
src/
  app/
    (auth)/            login, forgot-password, reset-password
    (app)/             authenticated app: dashboard + domain routes
    auth/callback/     Supabase email-link handler
    layout.tsx         root layout (fonts, theme provider)
    middleware is in src/middleware.ts (route guard)
  components/
    ui/                shadcn-style primitives (button, card, dialog, …)
    charts/            Recharts wrappers (trend, bar, donut, funnel)
    shell/             sidebar, header, user menu, nav config
    dashboard/         dashboard view
    data-table.tsx, kpi-card.tsx, status-badge.tsx, form-dialog.tsx, …
  lib/
    supabase/          browser + server + middleware clients
    actions/           server actions (auth)
    auth/              current-user helper
    reporting/         (Phase 3+) shared financial aggregates
    demo-data.ts       Phase 1 dashboard placeholder data
supabase/
  migrations/          versioned schema (all tables + RLS)
  seed.sql             local dev owner account
  tests/               SQL RLS verification
```

## Database & security

Every table has Row Level Security **enabled from its first migration**, and no
policy is ever granted to the anonymous role — so an unauthenticated request
reads zero rows anywhere. Staff access is granted to authenticated users who
hold a role; owner/admin get management rights. Financial columns use
`numeric(12,2)` (never floating point). See the architecture doc for the full
schema, business rules, and rationale.

## Deployment

Deploy to Vercel (a separate Vercel project from the tutoring app). Set the
three `NEXT_PUBLIC_*` environment variables from `.env.example` to your hosted
Supabase project's values, and point Supabase Auth's redirect URLs at your
deployed domain (`/auth/callback`). The production build is verified with
`npm run build`.

## License

Private — internal StudyWiser use only.
