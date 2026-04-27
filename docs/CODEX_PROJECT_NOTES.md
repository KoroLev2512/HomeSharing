# HomeSharing: internal project notes

## Purpose

This repository is a `Next.js` application for managing rental properties / lockbox-style access workflows.
The current product surface is centered on:

- authentication and registration
- listing flats that belong to the current user
- flat details in the main dashboard
- a mostly UI-only settings screen

Despite the current repo name (`homesharing`), parts of the codebase and docs still use the older product name `LockBox`.

## Current stack

- `Next.js 16.1.1` with App Router
- `React 19`
- `TypeScript`
- `SCSS modules`
- `next-auth` v4 with JWT session strategy
- `Supabase` used as the live data backend
- `Zustand` for client UI/global state
- `Prisma` schema and migrations exist as a retained fallback layer, but runtime CRUD currently goes through Supabase tables directly

## What is actually used at runtime

### Main application shell

- Root layout: [src/app/layout.tsx](/Users/qwerty/WebstormProjects/HomeSharing/homesharing/src/app/layout.tsx)
- App wrapper with navbar/content shell: [src/widgets/Wrappers/AppWrapper.tsx](/Users/qwerty/WebstormProjects/HomeSharing/homesharing/src/widgets/Wrappers/AppWrapper.tsx)
- Primary dashboard page: [src/app/page.tsx](/Users/qwerty/WebstormProjects/HomeSharing/homesharing/src/app/page.tsx)
- Dashboard layout implementation: [src/layouts/Home/HomeLayout.tsx](/Users/qwerty/WebstormProjects/HomeSharing/homesharing/src/layouts/Home/HomeLayout.tsx)

### Auth flow in use

Active auth configuration is in [src/shared/lib/auth.ts](/Users/qwerty/WebstormProjects/HomeSharing/homesharing/src/shared/lib/auth.ts).

Providers currently wired in code:

- `credentials`
- `github`
- `google`

Auth route:

- [src/app/api/auth/[...nextauth]/route.ts](/Users/qwerty/WebstormProjects/HomeSharing/homesharing/src/app/api/auth/[...nextauth]/route.ts)

Session model:

- JWT session strategy
- `session.user` is extended with `id`, `isAdmin`, `isService`, `isUser`
- typings live in [src/shared/types/next-auth.d.ts](/Users/qwerty/WebstormProjects/HomeSharing/homesharing/src/shared/types/next-auth.d.ts)

Registration flow:

- page: [src/app/register/page.tsx](/Users/qwerty/WebstormProjects/HomeSharing/homesharing/src/app/register/page.tsx)
- service: [src/shared/lib/accountService.ts](/Users/qwerty/WebstormProjects/HomeSharing/homesharing/src/shared/lib/accountService.ts)
- API: [src/app/api/signup/route.ts](/Users/qwerty/WebstormProjects/HomeSharing/homesharing/src/app/api/signup/route.ts)

Login flow:

- page: [src/app/login/page.tsx](/Users/qwerty/WebstormProjects/HomeSharing/homesharing/src/app/login/page.tsx)
- credentials auth delegates to `next-auth`

### Flat data flow

Client service:

- [src/shared/lib/flatService.ts](/Users/qwerty/WebstormProjects/HomeSharing/homesharing/src/shared/lib/flatService.ts)

API routes:

- [src/app/api/flats/route.ts](/Users/qwerty/WebstormProjects/HomeSharing/homesharing/src/app/api/flats/route.ts)
- [src/app/api/flats/[id]/route.ts](/Users/qwerty/WebstormProjects/HomeSharing/homesharing/src/app/api/flats/[id]/route.ts)

Behavior:

- all flat CRUD is scoped to `session.user.id`
- data is read/written against Supabase table `"Flat"`
- UI maps DB data into `IFlatCard`
- missing images fall back to `/rooms/room.png`
- `persons` in the mapped card model is still hardcoded as `[]`

### Supabase integration

Supabase utilities:

- server client: [src/shared/utils/supabase/server.ts](/Users/qwerty/WebstormProjects/HomeSharing/homesharing/src/shared/utils/supabase/server.ts)
- browser client: [src/shared/utils/supabase/client.ts](/Users/qwerty/WebstormProjects/HomeSharing/homesharing/src/shared/utils/supabase/client.ts)

Important detail:

- general app CRUD uses `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- signup and credentials auth create their own Supabase client and prefer `SUPABASE_SERVICE_ROLE_KEY`, falling back to anon key if missing

## Route map

Pages currently present under `src/app`:

- `/` dashboard
- `/login`
- `/register`
- `/settings`
- `/test`
- `/users/[id]`

Implemented API routes:

- `/api/auth/[...nextauth]`
- `/api/signup`
- `/api/flats`
- `/api/flats/[id]`

There are also legacy or placeholder files under `src/app/api/_app.tsx` and other repo docs/spec files that do not match the live route surface.

## Database model

Prisma schema file:

- [prisma/schema.prisma](/Users/qwerty/WebstormProjects/HomeSharing/homesharing/prisma/schema.prisma)

Effective domain entities:

- `User`
- `Account`
- `Session`
- `VerificationToken`
- `Flat`

Important: the schema currently contains a duplicated `model User` declaration. That is not a documentation issue; it is a real schema defect that should be cleaned up before treating Prisma as authoritative again.
At the same time, Prisma should remain in the repository even if it is not the active runtime path right now.

## State management

Current UI/session layer:
- `next-auth` session hooks
- `Zustand` UI store in [src/shared/store/appStore.ts](/Users/qwerty/WebstormProjects/HomeSharing/homesharing/src/shared/store/appStore.ts)

Legacy auth layer status:
- the old custom cookie/JWT auth store has been removed from active `src` code
- current auth-aware screens should use `next-auth` directly
- if old auth behavior is ever needed again, it should be reintroduced deliberately rather than inferred from stale modules

## Files that look stale or mismatched

These files should be treated carefully because they do not reflect the current runtime path cleanly:

- [README.md](/Users/qwerty/WebstormProjects/HomeSharing/homesharing/README.md)
- [swagger.yaml](/Users/qwerty/WebstormProjects/HomeSharing/homesharing/swagger.yaml)
- [src/entities/session/next-auth-config.ts](/Users/qwerty/WebstormProjects/HomeSharing/homesharing/src/entities/session/next-auth-config.ts)
- [src/app/users/[id]/page.tsx](/Users/qwerty/WebstormProjects/HomeSharing/homesharing/src/app/users/[id]/page.tsx)

Notes:

- `README.md` describes a project that is close in spirit but outdated in concrete structure and versions.
- `swagger.yaml` documents user/event/notify endpoints that are not the current App Router API surface.
- `src/entities/session/next-auth-config.ts` only contains GitHub provider config and is not the active auth entrypoint.
- `/users/[id]` now reads auth state from `next-auth`, but the route is still minimal and should not be treated as a fully developed profile area.

## Confirmed risks and technical debt

### 1. Secrets hygiene issue

File [.env.example](/Users/qwerty/WebstormProjects/HomeSharing/homesharing/.env.example) currently contains concrete GitHub OAuth values instead of placeholders.
Treat this as a security/process problem. A template file should not ship real secrets.

### 2. Mixed auth architectures

This was previously a major issue, but the active app path has now been cleaned to use `next-auth`.
Residual risk remains mostly in outdated docs and historical assumptions, not in the runtime wiring.

### 3. Supabase and Prisma are not aligned as a single source of truth

Prisma schema and migrations exist, but runtime server routes interact with Supabase tables directly.
This means schema evolution discipline is weak unless a deliberate policy is chosen.
Current working assumption: Supabase is the active runtime source, while Prisma is intentionally preserved as a standby layer for a possible return later.

### 4. OAuth UI over-promises providers

Login/register UI advertises providers such as `vk`, `apple`, and `gosuslugi`, but active auth config only wires `github`, `google`, and `credentials`.
Those buttons are likely broken unless additional provider wiring exists elsewhere.

### 5. Legacy docs and route contracts are unreliable

`README.md` and `swagger.yaml` should not be assumed current when implementing new features.

## Verified status

What has been checked directly:

- repository structure
- active route files
- active auth config
- Supabase integration points
- main page/layout wiring
- TypeScript check: `npx tsc --noEmit` passed

What has not been confirmed fully:

- end-to-end production build completion
- live OAuth provider configuration in external consoles
- whether Supabase RLS policies in docs match the currently deployed project

## Practical guidance for future edits

When changing this repo, prefer these rules:

1. For auth/session-aware screens, use `next-auth` as the single source of truth.
2. For flat CRUD, use the `/api/flats` routes and `FlatService` as the current path of least resistance.
3. Treat `README.md` and `swagger.yaml` as historical references until updated.
4. Keep auth changes aligned with `next-auth` session data instead of reintroducing a parallel client auth store.
5. Do not remove `Prisma` just because it is inactive at runtime; treat it as a retained fallback layer.
6. If Prisma work is needed, first repair `prisma/schema.prisma` and reconcile Prisma-vs-Supabase ownership.
