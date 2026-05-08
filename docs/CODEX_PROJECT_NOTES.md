# HomeSharing: Codex Project Notes

Last analyzed: 2026-05-05.

This document is the working map I should use before changing this repository. It describes the code that is active now, not just the historical intent in older docs.

## Product Shape

HomeSharing is a `Next.js` App Router application for property listings, favorites, bookings, host listing management, and admin moderation.

Main user areas:

- Public catalog: `/listings`, `/listings/[id]`
- Guest area: `/favorites`, `/bookings`
- Host area: `/host/listings`, `/host/listings/new`, `/host/listings/[id]/edit`, `/host/bookings`
- Admin area: `/admin/users`, `/admin/listings`, `/admin/bookings`
- Account/auth: `/login`, `/register`, `/settings`
- Mostly static/placeholder areas: `/messages`, `/notifications`, `/users/[id]`, `/test`, `/listing`

Some UI text and metadata still says `LockBox`; current repository/product name is `HomeSharing`.

## Stack

- `Next.js 16.1.1` with App Router and Turbopack scripts
- `React 19`
- `TypeScript`
- `SCSS Modules`
- `next-auth` v4 with JWT sessions
- `Supabase` as the live runtime data backend
- `Zustand` for UI state
- `Prisma` schema/migrations retained in repo, but not the primary runtime data access path

Important scripts from `package.json`:

- `npm run dev` -> `next dev --turbopack`
- `npm run build` -> `next build --turbopack`
- `npm run lint` -> `eslint .`
- `npm run typecheck` -> `tsc --noEmit`
- `npm test` -> `npm run typecheck`

## Application Shell

Root layout:

- [src/app/layout.tsx](/Users/qwerty/WebstormProjects/study/homesharing/src/app/layout.tsx)

The root layout wraps all pages in:

- `SessionProviderWrapper`
- `AppWrapper`
- global styles from [src/styles/globals.scss](/Users/qwerty/WebstormProjects/study/homesharing/src/styles/globals.scss)

Main wrapper/navigation:

- [src/widgets/Wrappers/AppWrapper.tsx](/Users/qwerty/WebstormProjects/study/homesharing/src/widgets/Wrappers/AppWrapper.tsx)
- [src/widgets/NavigationBar/NavigationBar.tsx](/Users/qwerty/WebstormProjects/study/homesharing/src/widgets/NavigationBar/NavigationBar.tsx)
- [src/shared/store/appStore.ts](/Users/qwerty/WebstormProjects/study/homesharing/src/shared/store/appStore.ts)

Navigation is shown only when `next-auth` reports `authenticated`. Public users land on catalog-style pages without the sidebar.

## Auth

Active auth configuration:

- [src/shared/lib/auth.ts](/Users/qwerty/WebstormProjects/study/homesharing/src/shared/lib/auth.ts)
- [src/app/api/auth/[...nextauth]/route.ts](/Users/qwerty/WebstormProjects/study/homesharing/src/app/api/auth/[...nextauth]/route.ts)
- [src/shared/types/next-auth.d.ts](/Users/qwerty/WebstormProjects/study/homesharing/src/shared/types/next-auth.d.ts)

Providers:

- credentials
- GitHub, only when `GITHUB_ID` and `GITHUB_SECRET` are both set
- Google, only when `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are both set

Session strategy is JWT. The app extends `session.user`/token with:

- `id`
- `isAdmin`
- `isHost`
- `isUser`

Credentials login reads table `User` through `getServiceClient()` and verifies `password` with `bcrypt`.

Registration:

- page: [src/app/register/page.tsx](/Users/qwerty/WebstormProjects/study/homesharing/src/app/register/page.tsx)
- API: [src/app/api/signup/route.ts](/Users/qwerty/WebstormProjects/study/homesharing/src/app/api/signup/route.ts)
- service: [src/shared/lib/accountService.ts](/Users/qwerty/WebstormProjects/study/homesharing/src/shared/lib/accountService.ts)

Server-side route guard helper:

- [src/shared/lib/sessionGuards.ts](/Users/qwerty/WebstormProjects/study/homesharing/src/shared/lib/sessionGuards.ts)

`loadSession()` normalizes `getServerSession(authOptions)` into `{ userId, isHost, isAdmin }`.

## Environment

Public env is centralized in:

- [src/shared/configs/publicEnv.ts](/Users/qwerty/WebstormProjects/study/homesharing/src/shared/configs/publicEnv.ts)

Required:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Server env is centralized in:

- [src/shared/configs/serverEnv.ts](/Users/qwerty/WebstormProjects/study/homesharing/src/shared/configs/serverEnv.ts)

Required:

- `NEXTAUTH_SECRET`

Optional/conditional:

- `SUPABASE_SERVICE_ROLE_KEY`
- `DATABASE_URL`
- `GITHUB_ID` + `GITHUB_SECRET`
- `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET`

OAuth pairs are validated as pairs: both values must be present or both absent.

## Supabase Runtime Model

Supabase helpers:

- browser client: [src/shared/utils/supabase/client.ts](/Users/qwerty/WebstormProjects/study/homesharing/src/shared/utils/supabase/client.ts)
- server client: [src/shared/utils/supabase/server.ts](/Users/qwerty/WebstormProjects/study/homesharing/src/shared/utils/supabase/server.ts)
- service client: [src/shared/utils/supabase/service.ts](/Users/qwerty/WebstormProjects/study/homesharing/src/shared/utils/supabase/service.ts)

The important runtime path is server route handlers using `getServiceClient()`. `SUPABASE_SERVICE_ROLE_KEY` is expected for private CRUD. If it is missing, the service client falls back to anon key and logs a warning, but private operations may fail depending on Supabase policies.

See [SUPABASE_SETUP.md](/Users/qwerty/WebstormProjects/study/homesharing/SUPABASE_SETUP.md) for the intended deployed table schema and RLS notes.

## Domain Models

### Listings

Type definitions:

- [src/shared/types/listing.ts](/Users/qwerty/WebstormProjects/study/homesharing/src/shared/types/listing.ts)

Primary table:

- `listings`

Main fields exposed to UI:

- `dealType`: `rent_long` | `rent_short` | `sale`
- `propertyType`: `flat` | `room` | `house` | `studio`
- `rooms`, `area`, `floor`, `totalFloors`
- `price`, `pricePeriod`, `deposit`
- `city`, `district`, `metro`, `address`
- `amenities`, `images`
- owner snapshot fields

Public listing repo/service:

- [src/shared/lib/listingsRepo.ts](/Users/qwerty/WebstormProjects/study/homesharing/src/shared/lib/listingsRepo.ts)
- [src/shared/lib/listingsService.ts](/Users/qwerty/WebstormProjects/study/homesharing/src/shared/lib/listingsService.ts)

Public listing API:

- `GET /api/listings`
- `GET /api/listings/[id]`

Public listing UI:

- [src/layouts/Listings/ListingsBoard.tsx](/Users/qwerty/WebstormProjects/study/homesharing/src/layouts/Listings/ListingsBoard.tsx)
- [src/layouts/Listings/ListingDetail.tsx](/Users/qwerty/WebstormProjects/study/homesharing/src/layouts/Listings/ListingDetail.tsx)
- [src/widgets/ListingFilters/ListingFilters.tsx](/Users/qwerty/WebstormProjects/study/homesharing/src/widgets/ListingFilters/ListingFilters.tsx)
- [src/widgets/ListingCard/ListingCard.tsx](/Users/qwerty/WebstormProjects/study/homesharing/src/widgets/ListingCard/ListingCard.tsx)

Filtering and sorting are implemented in `ListingsRepo.list()`: ids, excluded ids, deal/property type, city, rooms, price range, area range, search term, sort, pagination.

### Host Listings

Host repo/service:

- [src/shared/lib/hostListingsRepo.ts](/Users/qwerty/WebstormProjects/study/homesharing/src/shared/lib/hostListingsRepo.ts)
- [src/shared/lib/hostListingsService.ts](/Users/qwerty/WebstormProjects/study/homesharing/src/shared/lib/hostListingsService.ts)

Host APIs:

- `GET /api/host/listings`
- `POST /api/host/listings`
- `GET /api/host/listings/[id]`
- `PUT /api/host/listings/[id]`
- `DELETE /api/host/listings/[id]`

Host UI:

- [src/layouts/Host/HostShell.tsx](/Users/qwerty/WebstormProjects/study/homesharing/src/layouts/Host/HostShell.tsx)
- [src/layouts/Host/HostListingsBoard.tsx](/Users/qwerty/WebstormProjects/study/homesharing/src/layouts/Host/HostListingsBoard.tsx)
- [src/layouts/Host/HostListingFormPage.tsx](/Users/qwerty/WebstormProjects/study/homesharing/src/layouts/Host/HostListingFormPage.tsx)

Access requires `session.user.isHost` / `User.isService`.

`validateDraft()` in `hostListingsRepo.ts` is the central server-side listing draft validation. It enforces required title/city/address/description/ownerName, enum values, numeric fields, total floors >= floor, and `pricePeriod` for rental listings.

### Bookings

Type definitions:

- [src/shared/types/booking.ts](/Users/qwerty/WebstormProjects/study/homesharing/src/shared/types/booking.ts)

Repo/service:

- [src/shared/lib/bookingsRepo.ts](/Users/qwerty/WebstormProjects/study/homesharing/src/shared/lib/bookingsRepo.ts)
- [src/shared/lib/bookingsService.ts](/Users/qwerty/WebstormProjects/study/homesharing/src/shared/lib/bookingsService.ts)
- [src/shared/lib/bookingPricing.ts](/Users/qwerty/WebstormProjects/study/homesharing/src/shared/lib/bookingPricing.ts)

Guest APIs:

- `GET /api/bookings`
- `POST /api/bookings`
- `PATCH /api/bookings/[id]`

Host APIs:

- `GET /api/host/bookings`
- `PATCH /api/host/bookings/[id]`

Admin APIs:

- `GET /api/admin/bookings`
- `PATCH /api/admin/bookings/[id]`

Booking creation rules observed in code:

- auth required
- listing must exist
- sale listings cannot be booked
- users cannot book their own listing
- date strings must be `YYYY-MM-DD`
- `endDate` must be after `startDate`
- overlapping `pending`/`confirmed` bookings are rejected
- total price is computed server-side

Statuses:

- `pending`
- `confirmed`
- `cancelled`
- `rejected`
- `completed`

### Favorites

Client store/hook:

- [src/shared/lib/favorites.ts](/Users/qwerty/WebstormProjects/study/homesharing/src/shared/lib/favorites.ts)

APIs:

- `GET /api/favorites`
- `POST /api/favorites`
- `DELETE /api/favorites`
- `DELETE /api/favorites/[listingId]`

Favorites are local-first in `localStorage` under `homesharing.favorites`. After login, the store reconciles with the server by loading server favorites and uploading local-only ids.

### Account / Me

Service:

- [src/shared/lib/meService.ts](/Users/qwerty/WebstormProjects/study/homesharing/src/shared/lib/meService.ts)

APIs:

- `PATCH /api/me` toggles host role through `{ isHost: boolean }`
- `POST /api/me/avatar` uploads avatar to Supabase Storage
- `DELETE /api/me/avatar` resets avatar

Settings UI:

- [src/app/settings/page.tsx](/Users/qwerty/WebstormProjects/study/homesharing/src/app/settings/page.tsx)

### Admin

Client service:

- [src/shared/lib/adminService.ts](/Users/qwerty/WebstormProjects/study/homesharing/src/shared/lib/adminService.ts)

Admin APIs:

- `GET /api/admin/users`
- `PATCH /api/admin/users/[id]`
- `GET /api/admin/listings`
- `DELETE /api/admin/listings/[id]`
- `GET /api/admin/bookings`
- `PATCH /api/admin/bookings/[id]`

Admin UI:

- [src/layouts/Admin/AdminShell.tsx](/Users/qwerty/WebstormProjects/study/homesharing/src/layouts/Admin/AdminShell.tsx)
- [src/layouts/Admin/AdminUsersBoard.tsx](/Users/qwerty/WebstormProjects/study/homesharing/src/layouts/Admin/AdminUsersBoard.tsx)
- [src/layouts/Admin/AdminListingsBoard.tsx](/Users/qwerty/WebstormProjects/study/homesharing/src/layouts/Admin/AdminListingsBoard.tsx)
- [src/layouts/Admin/AdminBookingsBoard.tsx](/Users/qwerty/WebstormProjects/study/homesharing/src/layouts/Admin/AdminBookingsBoard.tsx)

Access requires `session.user.isAdmin` / `User.isAdmin`.

## Legacy Flat Layer

There is still a legacy `Flat` domain:

- [src/shared/lib/flatService.ts](/Users/qwerty/WebstormProjects/study/homesharing/src/shared/lib/flatService.ts)
- [src/app/api/flats/route.ts](/Users/qwerty/WebstormProjects/study/homesharing/src/app/api/flats/route.ts)
- [src/app/api/flats/[id]/route.ts](/Users/qwerty/WebstormProjects/study/homesharing/src/app/api/flats/[id]/route.ts)
- [src/widgets/Flat/Flat.tsx](/Users/qwerty/WebstormProjects/study/homesharing/src/widgets/Flat/Flat.tsx)
- [src/widgets/FlatCard/FlatCard.tsx](/Users/qwerty/WebstormProjects/study/homesharing/src/widgets/FlatCard/FlatCard.tsx)

Treat this as historical compatibility unless a task explicitly targets it. New product work should use `listings` and host/listing flows.

Additional historical notes:

- [docs/LEGACY_FLAT_LAYER.md](/Users/qwerty/WebstormProjects/study/homesharing/docs/LEGACY_FLAT_LAYER.md)

## Prisma Status

Prisma files:

- [prisma/schema.prisma](/Users/qwerty/WebstormProjects/study/homesharing/prisma/schema.prisma)
- [prisma/migrations](/Users/qwerty/WebstormProjects/study/homesharing/prisma/migrations)

Current reality:

- Runtime CRUD goes through Supabase clients directly, not Prisma Client.
- Prisma is retained as a fallback/history layer.
- `prisma/schema.prisma` currently contains a duplicated `model User` declaration. Do not treat it as authoritative until repaired and reconciled with Supabase.

## Route Map

Pages:

- `/`
- `/admin`
- `/admin/users`
- `/admin/listings`
- `/admin/bookings`
- `/bookings`
- `/favorites`
- `/host`
- `/host/listings`
- `/host/listings/new`
- `/host/listings/[id]/edit`
- `/host/bookings`
- `/listing`
- `/listings`
- `/listings/[id]`
- `/login`
- `/messages`
- `/notifications`
- `/register`
- `/settings`
- `/test`
- `/users/[id]`

API route handlers:

- `/api/auth/[...nextauth]`
- `/api/signup`
- `/api/me`
- `/api/me/avatar`
- `/api/listings`
- `/api/listings/[id]`
- `/api/bookings`
- `/api/bookings/[id]`
- `/api/favorites`
- `/api/favorites/[listingId]`
- `/api/host/listings`
- `/api/host/listings/[id]`
- `/api/host/bookings`
- `/api/host/bookings/[id]`
- `/api/admin/users`
- `/api/admin/users/[id]`
- `/api/admin/listings`
- `/api/admin/listings/[id]`
- `/api/admin/bookings`
- `/api/admin/bookings/[id]`
- `/api/flats`
- `/api/flats/[id]`
- `/api/test/[id]`

## Styling And UI Organization

Project structure is not a strict FSD implementation, but roughly:

- `src/app`: Next routes
- `src/layouts`: page-level feature layouts
- `src/widgets`: larger reusable UI blocks
- `src/shared/ui`: smaller reusable UI primitives
- `src/shared/icons`: React icon components
- `src/shared/lib`: services, repos, domain helpers
- `src/shared/types`: DTO/domain types
- `src/shared/configs`: environment and constants
- `src/styles`: global SCSS variables/mixins/base styles

Use existing SCSS module patterns and component organization before introducing new abstractions.

## Known Risks And Technical Debt

- Prisma schema has duplicate `model User`; Prisma should not be used as source of truth until fixed.
- Supabase and Prisma are not currently aligned as one migration authority.
- `README.md`, `swagger.yaml`, and some old docs may lag behind actual App Router code.
- Some UI still says `LockBox`.
- `Flat` layer still exists but is legacy.
- Several areas look placeholder/minimal: messages, notifications, `/users/[id]`, `/test`, `/listing`.
- Supabase private CRUD relies on service role key; missing `SUPABASE_SERVICE_ROLE_KEY` can break behavior under RLS.
- Session helper usage is mixed (`loadSession()` and direct `getServerSession()`), though both use `next-auth`.

## Practical Rules For Future Work

1. Use `next-auth` as the only auth/session source.
2. For listings and booking work, prefer `listings`, `hostListingsRepo`, `BookingsRepo`, and the current `/api/*` route handlers.
3. Treat host role as `session.user.isHost` in app code and `User.isService` in Supabase.
4. Keep server mutations behind route handlers and `getServiceClient()`.
5. Do not add new client-side direct Supabase access for private data unless RLS policies are intentionally designed.
6. Do not remove Prisma or Flat casually; both are historical/compatibility layers.
7. Before editing UI, check nearby SCSS module and component patterns.
8. Before relying on external docs in repo, verify against current code.

## Verification Notes

For code changes, preferred checks:

- `npm run typecheck`
- `npm run lint`
- `npm run build` when touching Next config, routing, server components, auth, or env behavior

This documentation update itself does not require runtime verification.
