# HomeSharing

HomeSharing is a `Next.js` application for rental listings, favorites, and a private owner dashboard.

## Current product shape

- Public area:
  - `/listings` listing catalog
  - `/listings/[id]` listing details
  - `/favorites`
- Auth:
  - credentials login
  - optional OAuth via `Google` and `GitHub`
- Private area:
  - `/` owner dashboard with "Мои объекты"
  - `/settings`
  - `/users/[id]` minimal profile page

## Stack

- `Next.js 16`
- `React 19`
- `TypeScript`
- `SCSS Modules`
- `next-auth` v4 with JWT sessions
- `Supabase`
- `Zustand`

## Data model

Current runtime data access goes through Supabase tables and route handlers.

`Prisma` is kept in the repository as a fallback layer for a possible future return, but it is not the active runtime path.

## Environment variables

Use [`.env.example`](/Users/qwerty/WebstormProjects/HomeSharing/homesharing/.env.example) as the template.

Required for the current runtime:

```env
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-supabase-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-supabase-service-role-key"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-a-random-secret"
```

Optional OAuth providers:

```env
GITHUB_ID=""
GITHUB_SECRET=""
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
```

Important:

- set both values for a provider or leave both empty
- `SUPABASE_SERVICE_ROLE_KEY` is expected by server-side data access
- `DATABASE_URL` is retained only for the Prisma fallback layer

## Local setup

1. Install dependencies:

```bash
npm install
```

2. Create `.env.local` from `.env.example`

3. Start the dev server:

```bash
npm run dev
```

4. Open `http://localhost:3000`

Guest flow starts at `/listings`.
Authenticated users can use `/` as the private dashboard.

## Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
npm run typecheck
npm test
```

## Auth notes

- `next-auth` is the single source of truth for session state
- active auth config lives in [src/shared/lib/auth.ts](/Users/qwerty/WebstormProjects/HomeSharing/homesharing/src/shared/lib/auth.ts)
- credentials auth reads users from Supabase
- OAuth providers are enabled only when the full env pair is present

## Supabase notes

Main helpers:

- [src/shared/utils/supabase/client.ts](/Users/qwerty/WebstormProjects/HomeSharing/homesharing/src/shared/utils/supabase/client.ts)
- [src/shared/utils/supabase/server.ts](/Users/qwerty/WebstormProjects/HomeSharing/homesharing/src/shared/utils/supabase/server.ts)
- [src/shared/utils/supabase/service.ts](/Users/qwerty/WebstormProjects/HomeSharing/homesharing/src/shared/utils/supabase/service.ts)

`getServiceClient()` uses `SUPABASE_SERVICE_ROLE_KEY` when available and falls back to anon key with a warning.

## Deployment

For Vercel env setup, see [VERCEL_ENV_SETUP.md](/Users/qwerty/WebstormProjects/HomeSharing/homesharing/VERCEL_ENV_SETUP.md).

For Supabase schema and operational notes, see [SUPABASE_SETUP.md](/Users/qwerty/WebstormProjects/HomeSharing/homesharing/SUPABASE_SETUP.md).
