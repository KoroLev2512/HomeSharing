# Vercel Environment Setup

This project expects its runtime configuration from Vercel environment variables.

## Required variables

### Supabase

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

### NextAuth

- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`

`NEXTAUTH_URL` should be the canonical public URL of the deployment.

Production example:

```env
NEXTAUTH_URL=https://your-domain.example
```

## Optional OAuth variables

GitHub:

- `GITHUB_ID`
- `GITHUB_SECRET`

Google:

- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`

Important:

- set both values for a provider or leave both empty
- if only one value from a pair is set, the app will fail fast with a configuration error

## Prisma fallback variable

- `DATABASE_URL`

This is not needed by the current runtime path, but should be set if you plan to use Prisma tooling or return to Prisma-backed flows later.

## How to add variables in Vercel

1. Open `Project Settings -> Environment Variables`
2. Add each variable for the environments you use
3. Redeploy after changes

## Recommended verification

After deploy, verify:

1. `/listings` opens for guests
2. `/login` works for credentials auth
3. `/api/auth/session` returns a valid response
4. protected dashboard `/` redirects guests to `/listings`

## Common failure cases

### `Missing required environment variable`

Cause:
- one of the required Supabase or NextAuth variables is absent

Fix:
- compare Vercel values against [`.env.example`](/Users/qwerty/WebstormProjects/HomeSharing/homesharing/.env.example)

### `Incomplete environment configuration`

Cause:
- only one value from an OAuth pair was set

Fix:
- set both provider variables or remove both

### Auth works locally but not on Vercel

Cause:
- wrong `NEXTAUTH_URL`
- missing OAuth callback URLs in provider consoles

Fix:
- set the correct deployment URL
- update provider callback URLs to `/api/auth/callback/google` and `/api/auth/callback/github`
