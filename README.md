# Tatva Identity

Professional identity network: verified passport, work history, credentials, reputation, projects, and availability.

This is a Next.js app. **Vercel is the host. Render is not needed** — there is no separate long-running API or worker. Database and auth are Supabase.

## Local

```bash
npm install
cp .env.example .env.local
npm run dev
```

Apply `supabase/migrations/20260902120000_identity_foundation.sql` in the Supabase SQL editor before using sign-in, profiles, or writes.

## Environment

Set these in `.env.local` and in the Vercel project:

- `NEXT_PUBLIC_PRODUCT_NAME`
- `NEXT_PUBLIC_PRODUCT_TAGLINE`
- `NEXT_PUBLIC_ECOSYSTEM_NAME`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Do not commit `.env.local`. After deploy, add the production URL to the Supabase Auth redirect allow-list (`/auth/callback`).
