# Tatva Identity

Professional identity network: verified passport, work history, credentials, reputation, projects, and availability.

This is a Next.js app. **Vercel is the host. Render is not needed** — there is no separate long-running API or worker. Database is Supabase. Sign-in is WhatsApp OTP via the Tatva Vision Users API; the session is a Supabase cookie.

## Local

```bash
npm install
cp .env.example .env.local
npm run dev
```

Apply `supabase/migrations/20260902120000_identity_foundation.sql` in the Supabase SQL editor before using sign-in, profiles, or writes.

WhatsApp OTP: set `TATVA_USERS_API_BASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`. For local codes without WhatsApp, set `TATVA_VISION_OTP_ENABLED=false`. Set `REDIS_URL` on Vercel so rate limits and local OTPs work across instances.

## Demonstration data

The platform can be filled with labelled demo people, companies, jobs, gigs, posts and comments.

1. Apply `supabase/migrations/20260904120000_seed_toggle.sql` and `supabase/migrations/20260904130000_demo_seed_data.sql` in the Supabase SQL editor (or run `supabase/seed.sql` after the toggle migration).
2. **Hide without deleting:** `update public.platform_settings set seed_data_enabled = false;`
3. **Show again:** `update public.platform_settings set seed_data_enabled = true;`
4. **Delete forever:** `select public.unseed_platform();` (also in `supabase/unseed.sql`)

Demo profiles use handles like `seed-ananya` and copy that says they are demonstration records.

## Environment

Set these in `.env.local` and in the Vercel project:

- `NEXT_PUBLIC_PRODUCT_NAME`
- `NEXT_PUBLIC_PRODUCT_TAGLINE`
- `NEXT_PUBLIC_ECOSYSTEM_NAME`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `TATVA_USERS_API_BASE_URL`
- `TATVA_VISION_OTP_ENABLED`
- `REDIS_URL` (recommended on Vercel)

Do not commit `.env.local`.
