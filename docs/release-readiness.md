# IDENTITI release-readiness checklist

This checklist covers the areas that unit tests cannot validate without a configured Supabase and external services. The temporary open-admin development mode is deliberately excluded from this pass.

## Automated checks

```text
npm test
npm run lint
npx tsc --noEmit
npm run build
git diff --check
```

## Staging smoke tests

- Anonymous visitors can browse public profiles, organisations, verified projects and published site journals.
- An owner can create a draft site journal, add an entry, add a field note, and submit it for review.
- A contributor can add an entry; an unrelated signed-in account cannot edit the journal.
- Draft and private journals do not appear in public lists or API responses.
- Image uploads reject unsupported types and files above 5 MB.
- MP4/WebM uploads reject files above 50 MB and succeed in `identity-public`.
- Private documents are owner-only, produce short-lived signed URLs, and clean up storage on deletion.
- Search, filters, pagination and empty states preserve query parameters.
- OTP send/verify handles invalid, expired, repeated and provider-failure cases.
- Messages, notifications, jobs, gigs and applications work on narrow mobile screens.
- Vantage webhook rejects malformed payloads, invalid credentials and bursts over the rate limit.
- A failed Redis connection falls back without crashing the request.

## Supabase checks

Run against staging before applying a migration to live:

```sql
select to_regclass('public.site_journals');
select to_regclass('public.site_journal_entries');
select file_size_limit, allowed_mime_types
from storage.buckets
where id = 'identity-public';
```

Confirm anonymous, owner, contributor and unrelated-user behavior with the Supabase SQL editor or a staging test account. Confirm migration versions are recorded and no older migration is being re-run.

## Deferred before production

- Lock `/admin` with `PLATFORM_ADMIN_OPEN=false` and named operators.
- Add browser E2E automation against staging.
- Add alerting for Supabase, Redis, WhatsApp OTP, storage and Vantage failures.
