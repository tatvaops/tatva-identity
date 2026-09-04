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

Use this when the live network looks empty. All demo rows are labelled as demonstration records (handles like `seed-ananya`). Hide them before treating the product as genuine.

**Files**

- Toggle + hide/show switch: `supabase/migrations/20260904120000_seed_toggle.sql`
- Full seed (people, companies, projects, jobs, gigs, posts, comments, reactions, skills, credentials, reviews, recommendations, follows, applications): `supabase/migrations/20260904130000_demo_seed_data.sql`
- Reload after the toggle exists: `supabase/seed.sql`
- Delete forever: `supabase/unseed.sql`

**Load (Supabase SQL editor, in order)**

1. Run `supabase/migrations/20260904120000_seed_toggle.sql`
2. Run `supabase/migrations/20260904130000_demo_seed_data.sql`

Or, if the toggle is already applied: `select public.seed_demo_data();`

**Hide without deleting (instant)**

```sql
update public.platform_settings set seed_data_enabled = false;
```

**Show again**

```sql
update public.platform_settings set seed_data_enabled = true;
```

**Delete forever**

```sql
select public.unseed_platform();
```

While demo data is on, the app shows a banner with these same SQL lines. After hide or delete, hard-refresh the feed, people, companies, and jobs.

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
