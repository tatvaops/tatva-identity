# What was left out

Honest leftover list after the gap-fill pass. Routes and write paths exist so the product can be used. Vertex is still not connected. Nothing was invented to look finished.

---

## Applied on the live database

- `20260903120000_credential_wallet.sql`
- `20260903140000_identity_write_paths.sql`
- `20260904120000_seed_toggle.sql` + demo seed
- `20260904160000_identity_gap_fill.sql` (storage, notify, FTS, members, services, milestones, views, events)

Auth on Vercel is WhatsApp OTP, not magic-link. The production origin still needs to stay on the Supabase allow-list for `/auth/callback`.

---

## Intentionally not built (product rules)

| Item | Why |
| --- | --- |
| Tatva Vertex operational tables | Must not duplicate worker management, attendance, payroll, sites, gangs, DPR |
| Hire / Quote buttons that “work” | Vertex ports stay `false`; UI is an explicit boundary |
| Payments, subscriptions, sponsored listings | Phase 19: do not monetise prematurely |
| Mysterious reputation score | Phase 11 forbids a single hidden score |
| Vector / semantic search | After weighted ranking |
| Graph AI / staffing recommendations | Phase 20 is long-term intelligence |
| Offline, voice capture, credential scanning | Mobile worker depth, not Identity schema |
| External analytics vendor / Sentry | First-party `product_events` only |

Demo rows are labelled demonstration data. They are not fabricated work history presented as real.

---

## What this pass filled

- Profile editor: name, languages, locations, arrangement, relocate/travel, professional title, visibility, private rates, photo upload
- Verification request submit, skill endorse, recommendation request
- Private document vault (`/passport/documents`)
- Org workplace contact, logo, member invite, roles, `current_organisation_id` on create, job/gig links from company, org followers, verified-client reviews
- Project milestones / gallery tables and loaders; verified project can evidence listed skills
- Network: unfollow already existed; remove connection, block, mute; outgoing pending; org follow list; notifications to the other person
- Jobs: requirements/responsibilities, easy-apply flag, close, candidate tracker `/applications`, job-kind conversation helper
- Gigs: project id, distance field, seats decrement on accept, worker tracker
- Profile services without an organisation; service enquiry conversation
- Comments and likes on posts; people picker in messages; read receipts
- FTS indexes + skill/trade people filter; React Flow graph canvas
- Insights extras (unique views, org views, search appearances) when rows exist
- Mobile: messages in the tab bar, notifications in the header
- Architecture, data-model, and security docs
- Domain tests (`npm test`)

---

## Still empty until Vertex

- Verified work history, reliability, nearby GPS, Hire, Quote
- Organisation credential “verified” still needs an operator in `/admin` unless a reviewer has set the state

---

## Platform operations (`/admin`)

Signed-in platform operators only. Bootstrap the first operator with `PLATFORM_ADMIN_HANDLES` or `PLATFORM_ADMIN_USER_IDS`, then grant others from Settings. All writes go through the service role after `requirePlatformAdmin()`. Hidden profiles/orgs/posts stay off public discovery. Identity / employment / trade flags can be set by a reviewer here. Hire, Quote and Vertex tables are not in this console.

---

## Suggested check

1. Sign in with WhatsApp OTP.
2. Edit profile (languages, photo, rates), request verification, add a service.
3. Create or open an organisation → invite by handle → post job/gig from the company page.
4. Second account: apply, comment, connect, follow, endorse, message, write a review if you share a project.
5. First account: accept, applications, close job, `/insights`, `/graph`, `/applications`.
6. Expect Hire, Quote, and verified work history to stay empty on purpose.
7. Set `PLATFORM_ADMIN_HANDLES` to your handle, apply `20260904180000_platform_admin.sql`, open `/admin`.
