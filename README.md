# Tatva IDENTITI

**Tatva IDENTITI** (package `tatva-identity`) is a standalone professional identity network for construction, interiors, manufacturing and allied trades. People and organisations publish a public passport: who they are, what they delivered, labelled evidence, availability, jobs and gigs. Discussions about a brand happen on **Vantage Forums**. Hire, quote, attendance, payroll and site operations stay in **Tatva Vertex**, which is not this repository.

Live development site: [https://tatva-identity-dev.vercel.app](https://tatva-identity-dev.vercel.app/)  
Repository: [https://github.com/tatvaops/tatva-identity](https://github.com/tatvaops/tatva-identity)  
Vantage (separate product): [https://vantage.withtatva.ai](https://vantage.withtatva.ai)

This README is the operator and engineering map of the platform as built. Deeper notes live in `docs/`.

---

## 1. What this product is

IDENTITI is a **proof-led identity layer**, not a brochure site and not a workforce-management system.

| It does | It does not |
| --- | --- |
| Public people, companies, brands, projects, jobs, gigs, feed, messages | Host forum threads (Vantage does) |
| WhatsApp OTP sign-in and a Supabase session | Store Aadhaar, bank, payroll, PF/ESI, medical or home address |
| Operator console to publish and moderate **live** records with photos | Duplicate Vertex sites, gangs, attendance, DPR |
| Labelled trust, requirement fit and AI pulse from first-party fields | Invent a hidden reputation score |
| Map a brand to a Vantage thread after a human publishes | Auto-publish a forum post or invent a thread slug |
| First-party vendor contact / enquiry on IDENTITI | Fulfil Vertex Hire or Quote |

Display name, tagline and ecosystem name come from env (`NEXT_PUBLIC_PRODUCT_*`). UI copy uses **IDENTITI**.

---

## 2. Hard product rules

These are enforced in schema, UI and admin copy. Do not “finish” a screen by violating them.

1. **No Vertex operational tables** in this database (no sites, gangs, attendance, payroll).
2. **Hire** and **Quote** stay explicit Vertex boundaries (`vertexHireAvailable` / `vertexQuoteAvailable` are `false` in `src/lib/integrations/vertex.ts`). Buttons explain that the path is not connected.
3. **No Aadhaar, bank, payroll, PF/ESI, medical, home address** columns. `gstin` exists on organisations for operators but is **not** granted to `anon` or `authenticated` public selects.
4. **No mysterious hidden score.** Passport strength is completeness of real sections. Trust breakdown is labelled public evidence.
5. **WhatsApp OTP** via Tatva Vision; session is Supabase. Phone users are created as `phone_91{digits}@tatvaops.local`.
6. **First-party `product_events` only.** No third-party analytics vendor.
7. **Demo rows are labelled demonstration data** (handles like `seed-ananya`). They can be hidden without delete.
8. **Never invent a live Vantage API URL.** Leave `VANTAGE_API_BASE_URL` empty until Vantage confirms a partner hub API.
9. IDENTITI **never auto-publishes** a forum post and **never invents** a `thread_slug`.

---

## 3. Architecture

```
Browser
  └── Next.js 16 (App Router) on Vercel
        ├── Server components + server actions
        ├── Supabase (Postgres + Auth + Storage) via anon key + RLS
        ├── Service role (server only) for /admin writes and WhatsApp user create
        ├── Tatva Vision Users API (WhatsApp OTP)
        └── Redirect / webhook to Vantage Forums (separate site)
```

| Layer | Choice |
| --- | --- |
| App | Next.js 16.3, React 19, TypeScript, Turbopack |
| Host | **Vercel only.** There is no Render worker or separate API process |
| Database | Supabase Postgres. Schema in `supabase/migrations/` |
| Auth | WhatsApp OTP → `auth.admin.createUser` → magic-link cookie session |
| Storage | `identity-public` (images, 5 MB, jpeg/png/webp/gif), `identity-private` (owner documents) |
| UI | Tailwind v4, tokens in `src/app/globals.css` (page wrap 1480px, primary `#2437d4`) |
| Tests | `npm test` (Node test runner via `tsx`) |

`profiles.id` **is** `auth.users.id`. You cannot insert a person without an auth user. Admin “Add person” creates the auth user with the same phone email pattern as WhatsApp, then updates `profiles`.

---

## 4. Public network (what a visitor sees)

Primary header: Service brand, Product brand, Professional, Gig worker, Projects, Brand forum, Admin control (operators), Profile. Feed, Jobs, Gigs, Messages, Companies sit in account / secondary navigation.

### 4.1 Directories and profiles

| Route | Who it is |
| --- | --- |
| `/` | Home / concept landing |
| `/service-brands` | Organisations with `passport_kind = service_brand` |
| `/service-brands/[slug]` | Overlay hero, showreel, requirement fit, projects, strengths, labelled AI pulse, trust ring |
| `/product-brands` | `passport_kind = product_brand` |
| `/product-brands/[slug]` | Product families, application proof, factory video, people |
| `/product-brands/[slug]/products/[productId]` | Inner product |
| `/professionals` | `occupation_mode` white_collar or freelancer |
| `/professionals/[handle]` | Career, projects, experience, certs, endorsements |
| `/gig-workers` | blue_collar or contractor |
| `/gig-workers/[handle]` | Portfolio photos, skill facts, supervisor reviews |
| `/people` and `/people/[username]` | Combined people index / legacy person URL |
| `/companies`, `/companies/[slug]` | All organisation types; edit, jobs, gigs, reviews |
| `/org/[slug]` | Alias onto the company / brand passport |
| `/projects`, `/projects/[id]` | Network projects (covers, YouTube, QC notes). Not a Vertex site record |
| `/jobs`, `/jobs/[id]`, `/jobs/create` | Permanent / contract listings. Close without deleting |
| `/gigs`, `/gigs/[id]`, `/gigs/create` | Shift / crew listings. Seats, trade, site name |
| `/services` | Organisation and profile services catalogue |
| `/forums` | Hub of brand → Vantage mappings. IDENTITI does not host posts |
| `/search` | Weighted ranking over people, orgs, jobs, gigs (not vector search) |

Occupation routing: `personPublicHref(handle, occupationMode)` sends gig occupations to `/gig-workers/…` and others to `/professionals/…`.

### 4.2 Signed-in workspace

| Route | Purpose |
| --- | --- |
| `/auth/sign-in` | WhatsApp OTP |
| `/feed` | Network posts, comments, reactions |
| `/messages` | Direct threads. `?org=slug` or `?person=id` or `?c=conversationId` |
| `/notifications` | In-app notifications |
| `/passport`, `/passport/[handle]` | Public-safe passport projection |
| `/passport/documents` | Private vault (JPEG/PNG/WebP/PDF). Never shown on public pages |
| `/profile` | Owner editor: photos, languages, visibility, private rates (not public) |
| `/connections`, `/followers`, `/network`, `/graph` | Graph, follow, block, mute |
| `/saved` | Saved entities |
| `/applications` | Candidate / worker application tracker |
| `/insights` | First-party views and search appearances |
| `/settings` | Account settings |
| `/companies/new` | Create an organisation (owner membership) |

### 4.3 Contacting a vendor (IDENTITI, not Vertex)

On service brands, product brands and company pages, **Request this vendor** / **Contact this brand** opens a signed-in form. It:

1. Creates or reuses a conversation with `kind = enquiry` and `organisation_id` set.
2. Inserts a message (`Vendor request:` or `Contact:` prefix).
3. Notifies the organisation owner when one exists.
4. Records `vendor_contacted` in `product_events`.
5. Sends the person to `/messages?c=…`.

Operators see these under **Admin → Contacts**, together with job and gig applications.

**Vertex Request quote / Hire** remain disabled dialogs. Do not treat an IDENTITI enquiry as a Vertex work package.

### 4.4 Forums (Vantage)

IDENTITI maps `service_brand` | `product_brand` | `product` to a Vantage thread. It does not store discussion posts.

| Route | Behaviour |
| --- | --- |
| `/forum/go/[type]/[id]` | If `forum_entity_links.thread_slug` exists → 302 to `{VANTAGE}/forums/{slug}`. Else pending page |
| `/forum/new/[type]/[id]` | Must be signed in. Mints HS256 JWT (8 min TTL) and 302 to `{VANTAGE}/forums/new?context={jwt}` |
| `POST /api/forum/webhooks/discussion-created` | Vantage (or a minted write credential) saves `thread_slug`. Never creates the post |

If `IDENTITI_FORUM_PRIVATE_KEY` is empty, `/forum/new` shows **Cannot start this discussion yet**. That is intentional. IDENTITI will not fake a live thread.

Full protocol: `docs/vantage-forum-integration.md`.

---

## 5. Operations console (`/admin`)

URL: `/admin`. Sign-in is always required. Anonymous users redirect to `/auth/sign-in?next=/admin`.

### 5.1 Who can open it

| Mode | Env | Behaviour |
| --- | --- | --- |
| Temporarily open | `PLATFORM_ADMIN_OPEN=true` | **Any signed-in account** can use the console. Banner warns operators |
| Locked (production default) | `PLATFORM_ADMIN_OPEN` unset in production, or `false`, plus `PLATFORM_ADMIN_HANDLES` and/or `PLATFORM_ADMIN_USER_IDS` | Only listed handles / user IDs; first visit upserts `platform_admins` |
| Grant more | Settings | Enter a public handle |

Writes go through the **service role** after `requirePlatformAdmin()`. Actions are rate-limited and written to `audit_logs`.

### 5.2 Sections

| Section | Operators can |
| --- | --- |
| **Overview** | Queues, volume, demo visibility, links to publish live records |
| **Verifications** | File identity / employment / trade requests; approve or decline. Approval sets the public flag. Does not mint a Vertex credential |
| **People** | **Add a live person** (Indian mobile, name, handle, occupation, portrait/cover upload). Hide, verify ID. Detail: photos, portfolio, experience, wallet certs, supervisor reviews, skill facts |
| **Organisations** | **Add a live company / service brand / product brand** (cover, logo). Hide. Detail: passport kind, media, products, YouTube videos, strengths, labelled AI pulse, credentials, name people on projects |
| **Projects** | **Add a live project** (cover upload, YouTube URL, client/contractor). Mark verified, QC notes |
| **Jobs & gigs** | **Publish** a job or gig against an organisation; Close / Reopen. Does not hire or staff a site |
| **Contacts** | Vendor enquiries and messages; job applications; gig applications |
| **Moderation** | **Publish a feed post** (person or org author, optional image); hide posts; action reports |
| **Activity** | First-party events last 7 days. Operators do not invent rows |
| **Audit** | Actor, action, entity. No Aadhaar or payroll |
| **Forums** | Map entity UUID → Vantage thread slug / canonical URL |
| **Settings** | Demo data on/off, grant/revoke operator, mint Vantage webhook credential (plaintext once), forum env **booleans only** (never prints secrets) |

### 5.3 Adding live people

Admin create uses the WhatsApp-compatible identity:

- Normalise Indian mobile (`6–9` + 9 digits).
- `auth.admin.createUser` with email `phone_91{digits}@tatvaops.local`, E.164 `+91…`, metadata `auth_provider: whatsapp-otp`.
- Trigger `handle_new_user` inserts `profiles`; admin then sets handle, city, occupation, media.
- Phone is **not** stored on the public profile.

Occupation: Professional (`white_collar`), Freelancer, Gig / site worker (`blue_collar`), Contractor. That chooses `/professionals` vs `/gig-workers`.

### 5.4 Media

Public photos: upload JPEG/PNG/WebP/GIF under 5 MB into `identity-public`, or paste an `https://` URL. Storage paths are resolved by `publicMediaUrl`.

Video on this product is a **YouTube URL** (project walkthrough, organisation showreel). The public bucket does not accept `video/mp4`.

Broken seed Unsplash IDs are remapped in `src/lib/media/public-url.ts`. `PhotoFrame` hides on load error so empty navy panels do not appear.

---

## 6. Data model (short)

Full model: `docs/professional-network-data-model.md`.

| Table | Role |
| --- | --- |
| `profiles` | Public identity. `occupation_mode`, verification flags, `admin_hidden` |
| `organisations` | Companies and brands. `passport_kind`, media, **no public gstin** |
| `organisation_members` | Owner / recruiter / member |
| `network_projects` | Opted-in delivered work |
| `job_posts` / `gig_posts` | Listings + `closed_at` |
| `job_applications` / `gig_applications` | Applications |
| `posts` / `post_media` | Feed |
| `conversations` / `messages` | Person, organisation, enquiry, job, gig |
| `verification_requests` | Reviewer queue |
| `forum_entity_links` | Brand/product → Vantage slug |
| `platform_admins` / `platform_settings` / `audit_logs` / `product_events` | Operations |
| `brand_products`, `organisation_videos`, `work_portfolio_items`, `skill_passport_facts`, `supervisor_reviews` | IDENTITI marketplace proof |

Public reads use `public_profiles` and granted organisation columns. RLS is the security boundary; hiding in CSS is not.

---

## 7. Authentication

1. User enters Indian mobile on `/auth/sign-in`.
2. If `TATVA_VISION_OTP_ENABLED=true`, Tatva Vision sends WhatsApp OTP (`TATVA_USERS_API_BASE_URL`).
3. If `false`, a local OTP path can run (needs `REDIS_URL` / `OTP_HMAC_SECRET` on Vercel so instances share state).
4. On success, service role creates or finds `auth.users` and sets a Supabase cookie via `generateLink` + `verifyOtp`.
5. `handle_new_user` creates `profiles` with a generated handle `u-` + id fragment until they pick a public handle.

Keep the production origin on the **Supabase Auth allow-list** for `/auth/callback`.

---

## 8. Environment

Copy `.env.example` → `.env.local`. **Never commit `.env.local`.** Set the same keys on the Vercel project (Production).

### Required to run the site

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Browser + RLS client |
| `SUPABASE_SERVICE_ROLE_KEY` | Admin, OTP user create, storage uploads as operator. **Server only** |
| `TATVA_USERS_API_BASE_URL` | WhatsApp OTP |
| `TATVA_VISION_OTP_ENABLED` | `true` for Vision; `false` for local codes |
| `NEXT_PUBLIC_APP_ORIGIN` | This deployment origin (JWT `return_url`, webhook host) |

### Operations

| Variable | Purpose |
| --- | --- |
| `PLATFORM_ADMIN_OPEN` | Default **open** (`true`). Set `false` to lock to named operators |
| `PLATFORM_ADMIN_HANDLES` | Comma-separated handles without `@` |
| `PLATFORM_ADMIN_USER_IDS` | Comma-separated profile UUIDs |
| `REDIS_URL` | Recommended on Vercel for OTP and rate limits across instances |

### Vantage Forums

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_VANTAGE_FORUMS_ORIGIN` | Default `https://vantage.withtatva.ai` |
| `IDENTITI_FORUM_PRIVATE_KEY` | HMAC for context JWTs. **Required for Discuss** |
| `VANTAGE_FORUM_PUBLIC_KEY` | Same HMAC; Vantage stores this. IDENTITI only uses it as “is set” in Settings |
| `VANTAGE_FORUM_WRITE_TOKEN` | Bearer for `POST /api/forum/webhooks/discussion-created` |
| `VANTAGE_ALLOWED_RETURN_ORIGINS` | Extra `return_url` origins. Localhost and tatva-identity-dev are always allowed |
| `VANTAGE_API_BASE_URL` | **Leave empty** until Vantage ships partner hubs |
| `VANTAGE_FORUM_READ_TOKEN` | Bearer for that future API |

Generate secrets in PowerShell (OpenSSL is often missing on Windows):

```powershell
# IDENTITI_FORUM_PRIVATE_KEY (give Vantage the same string as VANTAGE_FORUM_PUBLIC_KEY)
$bytes = New-Object byte[] 48
[System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
[Convert]::ToBase64String($bytes)

# VANTAGE_FORUM_WRITE_TOKEN
$bytes = New-Object byte[] 32
[System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
($bytes | ForEach-Object { $_.ToString('x2') }) -join ''
```

Do not paste generated values into chat or git. After adding keys on Vercel, **redeploy**. Admin → Settings must show **Signing key: set**. Vantage must still implement `GET /forums/new?context=` verification; IDENTITI only mints the JWT.

Webhook for this deployment:

```
POST https://tatva-identity-dev.vercel.app/api/forum/webhooks/discussion-created
Authorization: Bearer <VANTAGE_FORUM_WRITE_TOKEN>
```

---

## 9. Local development

```bash
npm install
cp .env.example .env.local
# fill secrets
npm run dev
```

Default Next port is 3000. Apply **all** files in `supabase/migrations/` on the linked Supabase project (SQL editor or CLI), in filename order.

| Script | What |
| --- | --- |
| `npm run dev` | Turbopack dev server |
| `npm run build` / `npm start` | Production build |
| `npm test` | Domain tests (search rank, admin search, handles, forum token, requirement fit, trust, AI review, forum env) |
| `npx tsc --noEmit` | Typecheck |

---

## 10. Migrations (apply in order)

| File | What it adds |
| --- | --- |
| `20260902120000_identity_foundation.sql` | Core Identity schema, RLS, `handle_new_user` |
| `20260903100000_profile_write_grants.sql` | Profile write grants |
| `20260903120000_credential_wallet.sql` | Certification category |
| `20260903140000_identity_write_paths.sql` | Conversation and application write policies |
| `20260904120000_seed_toggle.sql` | `platform_settings.seed_data_enabled` |
| `20260904130000_demo_seed_data.sql` | Labelled demonstration network |
| `20260904160000_identity_gap_fill.sql` | Storage buckets, FTS, org contact columns, conversation links |
| `20260904180000_platform_admin.sql` | Operators, hide flags, audit |
| `20260905120000_identiti_marketplace.sql` | Brands, products, videos, portfolio, forum links, AI review |
| `20260905121000_identiti_seed.sql` | Aurum / Nandi / Aditi / Ramesh sample IDENTITI rows |
| `20260905130000_identiti_media_connect.sql` | Media wiring |
| `20260907120000_identiti_self_service.sql` | Owner portfolio/skill-fact writes, feed media insert, org staff application access |
| `20260907180000_identiti_integrity.sql` | Notification prefs, search appearance attribution, privacy RLS |
| `20260907180000_profile_owner_grants.sql` | Owner grants for onboarding/privacy/notification columns |
| `20260907200000_identiti_security_repair.sql` | Conversation IDOR, GSTIN grants, applicant withdraw, staff job updates |
| `20260907160000_identiti_production_hardening.sql` | Onboarding step, current roles, evidence visibility |
| `20260907180000_identiti_integrity.sql` | Privacy RLS, notification prefs, attributed search appearances |

Reload IDENTITI sample: `select public.seed_identiti_marketplace();`  
Hide demo without delete: `update public.platform_settings set seed_data_enabled = false;` (or Admin → Settings).  
Delete demo forever: `select public.unseed_platform();`

---

## 11. Repository map

```
src/app/(network)/     Public and signed-in pages
src/app/admin/         Operations console
src/app/auth/          Sign-in and callback
src/features/          UI by domain (identiti, admin, company, messaging, …)
src/lib/actions/       User server actions
src/lib/admin/         Operator gate, create actions, listings
src/lib/auth/          Phone, Vision OTP, session
src/lib/data/          Queries and mappers (granted columns only)
src/lib/domain/        Pure rules: slugs, forum JWT, trust, requirement fit
src/lib/integrations/  Vertex stubs (empty) and Vantage client
src/lib/media/         publicMediaUrl + dead-Unsplash remap
supabase/migrations/   Source of truth for schema
docs/                  Architecture, data model, security, Vantage protocol
```

---

## 12. Security notes

- Service role and HMAC keys are server-only. Forum Settings prints **set / missing**, never the secret.
- Context JWT: `iss=tatva-identiti`, `aud=vantage-forums`, 8 minute `exp`, `jti` stored. No API key in the query string — only the JWT.
- `return_url` is allow-listed (open-redirect guard).
- Webhook bearer compared with `timingSafeEqual`.
- Public organisation `select(*)` that includes `gstin` fails on purpose; use `ORGANISATION_GRANTED_COLUMNS`.
- Operator cannot hide their own profile or revoke the last operator.
- Deeper write-up: `docs/professional-network-security.md`.

---

## 13. What is still not connected

| Item | Status |
| --- | --- |
| Vertex verified work history, nearby GPS, Hire, Quote | Ports return empty / `false` |
| Vantage JWT verify on `/forums/new?context=` | IDENTITI mints; Vantage must verify |
| Vantage partner hub REST API | Keep `VANTAGE_API_BASE_URL` empty |
| Payments, sponsored listings, vector search, graph AI | Out of scope |
| Locking `/admin` to named operators | Production default is locked. Set `PLATFORM_ADMIN_OPEN=true` only for a controlled launch window |

---

## 14. Suggested live check

1. Sign in with WhatsApp OTP.
2. Open `/service-brands` and `/product-brands`. Empty sections stay empty; demo rows are labelled.
3. Signed-out Discuss → sign-in. Signed-in Discuss → Vantage or the honest missing-key page.
4. **Request this vendor** → `/messages` → **Admin → Contacts** shows the note.
5. **Admin → People / Organisations / Projects / Jobs** → add live rows with photos; confirm they appear on public directories.
6. Admin → Settings: demo toggle, forum key status, mint webhook token (copy once).
7. Expect Hire, Quote and Vertex work history to stay empty on purpose.

---

## 15. Related docs

- `docs/professional-network-architecture.md` — Identity vs Vertex vs Vantage
- `docs/professional-network-data-model.md` — tables and constraints
- `docs/professional-network-security.md` — RLS, grants, PII
- `docs/vantage-forum-integration.md` — JWT, webhook, env
- `docs/implementation-gaps.md` — honest leftover list
