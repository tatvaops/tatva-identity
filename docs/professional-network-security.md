# Professional network security

Identity security is RLS plus column grants. The UI is not the boundary.

## Authentication

WhatsApp OTP via Tatva Vision. The app then creates or reuses a Supabase user and sets cookies. There is no public email magic-link sign-in.

Synthetic emails (`phone_91…@tatvaops.local`) are an identity key, not a mailbox.

## Authorization

- `requireUser()` on every mutating server action.
- Organisation writes: `is_org_creator` or `is_org_staff` (`owner` / `admin` / `recruiter`).
- Applicants cannot set hiring statuses. They may only withdraw, and only while the application is still in a non-terminal operator state. Recruiters update via staff policies. Closed listings cannot receive new applications at RLS.
- Direct conversations cannot be joined by guessing a UUID. `conversation_members` insert is limited to the first member of a new thread plus one peer. Established threads are member-read only. `start_direct_conversation` creates 1:1 threads atomically.
- Connection accept/decline is addressee-only. Requesters withdraw by delete.
- Message bodies cannot be updated by members. Only `read_at` is granted for updates.
- `gstin` is not granted to `anon` or `authenticated`. Table-level SELECT on organisations is revoked so new columns do not leak.
- Reviews require a shared opted-in project with that organisation (`can_review_organisation`).
- Notifications to another person only through `notify_profile` (security definer). Direct insert of someone else's notification row is denied.
- `created_by` is not granted to `anon`. Authenticated mappers expose `isOwner` only when the viewer is the creator.

## Privacy

Never store or return Aadhaar, bank, payroll, PF/ESI, medical, home address, or raw attendance on Identity tables.

Rates (`daily_rate_inr`, `monthly_salary_inr`) are granted to `authenticated` for the owner update path and are not on `public_profiles`.

Private documents use `identity-private` with folder = `auth.uid()`.

## Abuse controls

- OTP rate limit already in auth routes.
- Application and message writes call `rateLimit` keyed by user id.
- Profile view inserts are throttled.
- Blocks remove connections. Mutes are viewer-owned.

## Audit and events

`write_audit` and `record_product_event` are definer functions. They record actor + action, not document contents.

## Storage

Public bucket is readable; writes must be under the caller's uuid prefix. Private bucket is owner-only.

## What is still Vertex

Hire, quote, verified work history, reliability from attendance, and worker passport FKs stay ports in `src/lib/integrations/vertex.ts`. They return empty on purpose.
