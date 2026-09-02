# Professional Network Architecture

Product name is configurable via `NEXT_PUBLIC_PRODUCT_NAME` (default: **Tatva Identity**).

This document describes **what is actually in this repository**, then the Identity layer being added, then Vertex systems that are **not present here**.

It does not invent Tatva Vertex tables as if they already live in this database.

---

## 1. Current application architecture (EXISTING)

This workspace (`PassportIdentity` / package `tatva-identity`) is a greenfield Next.js app created for the Identity network. It is **not** a checkout of Vertex, Ops, or Vantage.

| Area | What exists in this repo |
| --- | --- |
| Framework | Next.js 16.3 App Router, React 19, TypeScript |
| Styling | Tailwind CSS v4, tokens in `src/app/globals.css` |
| UI kit | Local shadcn-style primitives under `src/components/ui` |
| Icons | Lucide |
| Forms | React Hook Form + Zod (dependencies present) |
| Data fetching | TanStack Query provider exists |
| Charts / flow | Recharts, React Flow (passport visualisation) |
| Auth | **None.** No middleware, no session, no login routes |
| Database | **No migrations, no SQL schema, no applied tables** |
| Supabase | Client stub only (`src/lib/supabase/client.ts`). `.env` URL/key are empty |
| Routes | App Router routes under `src/app` (feed, people, companies, jobs, gigs, etc.) |
| Previous data | Hardcoded mock graph (removed in this phase) |

There is no existing global navigation to preserve from Vertex. The Identity app shell **is** the navigation for this product.

---

## 2. Existing Tatva Vertex architecture (NOT IN THIS REPO)

The product specification describes Vertex operational entities:

- `worker_passports`
- `service_engagements`
- `worker_service_history`
- `tenants`
- `project_sites`
- `project_phases`
- `project_tasks`
- `task_gang_allocations`

**None of these tables, migrations, or TypeScript repositories exist in this repository.** They are treated as **FUTURE INTEGRATION** (section 20).

This app must not duplicate them. It may store a nullable `worker_passport_id` on `profiles` with **no foreign key** until Vertex is connected.

---

## 3. Existing database entities (EXISTING)

**None.** There is no `supabase/migrations` history and no live schema to introspect.

Anything created under `supabase/migrations/` in this phase is **NEW**.

---

## 4. Existing authentication model (EXISTING)

**None.**

**NEW:** Supabase Auth (`auth.users`) via `@supabase/ssr`, cookie session, middleware refresh.

Identity: `auth.users.id` = `profiles.id`.

---

## 5. Existing authorization model (EXISTING)

**None.**

**NEW:** Supabase Row Level Security on Identity tables. Public reads use a safe column set. Sensitive columns (rates, private documents) are never granted to `anon`. Frontend hiding is not the security boundary.

---

## 6. New Professional Identity layer (NEW)

```
auth.users
    └── profiles                 public professional identity
            └── worker_passport_id?   opaque UUID, Vertex later
            └── organisation_members
            └── experiences (self-declared)
            └── profile_skills
            └── profile_certifications
```

A person can have a profile with no worker passport.  
A worker passport (when Vertex exists) **enriches** the profile; it is not copied into resume fields.

---

## 7. Person / profile architecture (NEW)

- `profiles` — one row per user, public-safe columns + private availability rates
- `profile_handles` — unique username (`handle`) for `/people/[username]`
- Occupation is `occupation_mode` configuration, not separate apps:
  - `white_collar` | `blue_collar` | `freelancer` | `contractor`
- Public APIs/views never include Aadhaar, bank, payroll, PF, ESI, medical, home address, raw attendance

Passport strength is a **deterministic domain utility** over real fields (`src/lib/domain/passport-strength.ts`), not a stored employability score.

---

## 8. Organisation architecture (NEW)

- `organisations` — business identity (`slug` for `/companies/[slug]` and `/org/[slug]`)
- `organisation_type` is configuration (employer, vendor, subcontractor, …)
- `organisation_members` — public membership only when `visibility = public`
- `organisation_services`, `organisation_credentials` (status public; document blobs private)

---

## 9. Project architecture (NEW + FUTURE)

**NEW** in this database: `network_projects` (public identity of a project), `project_contributors`, `project_organisations`.

Named `network_projects` (not `projects`) so a future Vertex `projects` / `project_sites` table is not collided with.

**FUTURE:** map `network_projects.vertex_site_id` → `project_sites.id` when Vertex is attached. Do not duplicate operational Gantt/attendance here.

---

## 10. Social graph architecture (NEW)

Persisted edges:

| Table | Meaning |
| --- | --- |
| `connections` | person ↔ person (`pending` / `accepted`) |
| `follows` | person → person or organisation |
| `organisation_members` | person ↔ organisation (employment/association) |
| `project_contributors` | person ↔ project |
| `project_organisations` | organisation ↔ project |
| `profile_skills` | person ↔ skill |

Derived “worked with” later joins contributors on the same project. Recommendation *algorithms* are out of Phase 1.

---

## 11. Job architecture (NEW)

`job_posts` + `job_applications`. Distinct from gigs. Linked to `organisations` and optional recruiter `profiles`.

---

## 12. Gig architecture (NEW)

`gig_posts` + `gig_applications`. Shift/seat/duration fields. Not a job subtype.

---

## 13. Credential / verification architecture (NEW + FUTURE)

**NEW:** `skills`, `profile_skills`, `skill_verifications`, `endorsements`, `profile_certifications`, `organisation_credentials`, `verification_requests`.

Verification UI explains who / what / state. Stored as structured flags, not a generic blue tick.

**FUTURE:** employment/project verification asserted by Vertex engagement close-out, not by self-edit of a shift count.

---

## 14. Search architecture (NEW)

`searchNetwork(query)` in `src/lib/data/search.ts` runs parallel Postgres `ilike` filters on public tables.

UI is grouped (people, companies, jobs, gigs, posts, projects, skills, services). Ranking/vector search can replace the function body without changing the page.

---

## 15. Messaging architecture (NEW)

`conversations`, `conversation_members`, `messages`. Context enum: person, recruiter, organisation, job, gig, quote.

No fake transcripts. Empty inbox until rows exist.

---

## 16. Notification architecture (NEW)

`notifications` with typed `kind`. Inserted by future triggers/actions. Phase 1 reads real rows or shows empty.

---

## 17. Public / private data model

| Public | Private (RLS owner / members only) |
| --- | --- |
| Name, photo, headline, professional city | Daily/monthly rate |
| Skills, public projects, public certs | Credential files, KYC uploads |
| Verification *states* | Aadhaar, bank, PF, ESI, medical (never stored on `profiles`) |
| Derived shift counts **when Vertex supplies them** | Raw attendance, payroll |

This app does **not** add columns for Aadhaar or payroll. Vertex must never project those into Identity views.

---

## 18. RLS strategy (NEW)

- `anon` / `authenticated`: `SELECT` on public-safe tables/columns
- Writes: `authenticated` and `auth.uid() = profile_id` (or org admin membership)
- Storage: public avatars/covers; private `profile-documents` bucket
- Service role is not used in the browser

---

## 19. Storage strategy (NEW)

Buckets (declared in migration comments / to be created in Supabase):

- `avatars` (public)
- `covers` (public)
- `post-media` (public)
- `profile-documents` (private)

---

## 20. Future Vertex integration points

| Identity UI | Vertex later |
| --- | --- |
| Hire / Offer work | `service_engagements` + site + task allocation |
| Verified work history | `worker_service_history` derived shifts/ratings |
| Reliability / safety summaries | Attendance/DPR aggregates (never raw logs) |
| Request quote | Opportunity → work package → execution |
| `profiles.worker_passport_id` | `worker_passports.id` |
| `network_projects.vertex_site_id` | `project_sites.id` |

Ports live in `src/lib/integrations/vertex.ts`. Implementations currently return empty results. They must not toast fake success.

---

## 21. Migration strategy

1. Apply `supabase/migrations/20260902120000_identity_foundation.sql` to the Identity Supabase project.
2. Do not run Vertex migrations from this repo (they are not here).
3. When Vertex shares a database or FDW, add a follow-up migration that **adds FKs** only after those tables exist.

---

## 22. Component architecture (EXISTING UI + NEW DATA)

Keep: App shell, cards, verification badges, design tokens.

Replace: mock repositories, hardcoded demo people/companies, fake toasts for backend work.

Feature folders remain under `src/features/*`. Pages stay thin.

---

## 23. Route architecture

Unchanged public/network routes. `/org/[slug]` reuses organisation profile. `/passport/*` is the **authenticated** private workspace; `/people/[username]` is the public identity.

Auth routes **NEW:** `/auth/sign-in`.

---

## Legend

| Label | Meaning |
| --- | --- |
| EXISTING | Found in this repository before this phase |
| NEW | Introduced by the Identity network in this repo |
| FUTURE INTEGRATION | Specified Vertex/Ops systems not present in this codebase |
