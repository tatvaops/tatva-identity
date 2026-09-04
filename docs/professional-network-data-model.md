# Professional network data model

This is the Identity database in this repository. Vertex operational tables are not here.

## Identity

| Table | Role |
| --- | --- |
| `profiles` | One professional identity per `auth.users` row. Public-safe columns plus private rates. |
| `profile_handles` | Unique handle for `/people/[handle]`. Updates cascade. |
| `profile_services` | Independent service catalogue without creating an organisation. |
| `profile_documents` | Private vault metadata. Files live in `identity-private`. |
| `profile_blocks` / `profile_mutes` | Viewer-owned safety controls. |
| `verification_requests` | In-product request that a check should happen. Does not flip verified flags by itself. |

Occupation stays configuration: `occupation_mode` plus optional `professional_title` (technician, supervisor, engineer, architect, designer, gig worker, …). Not separate apps.

Field visibility: `email_visible_to`, `about_visible_to`, `location_visible_to`. Rates stay column-granted to the owner only.

## Organisations

| Table | Role |
| --- | --- |
| `organisations` | Business identity. Workplace contact (`public_phone`, `public_email`, `office_locality`) is not a home address. `created_by` is not granted to `anon`. |
| `organisation_members` | Membership with `org_role` (`owner` / `admin` / `recruiter` / `member`) and `invite_status`. |
| `organisation_services` / `organisation_credentials` | Catalogue and public credential *state*. |
| `organisation_views` | Company profile views for the owner. |
| `reviews` | Insert allowed only when the reviewer opted in on a shared project with that organisation. |

## Graph

`connections`, `follows`, `project_contributors`, `project_organisations`, `network_projects`, `project_milestones`, `project_media`, `project_skills`, `project_services`.

`network_projects` is named so a future Vertex `projects` / `project_sites` table is not collided with. `vertex_site_id` is an opaque UUID with no FK.

A verified project can write `skill_verifications` of kind `project` for opted-in contributors who listed those skills. That is evidence, not a hidden score.

## Marketplace

`job_posts` (`closed_at`, `easy_apply`, structured `responsibilities` / `requirements`), `job_applications`, `gig_posts` (`project_id`, `distance_km`, `closed_at`, seats decrement on accept), `gig_applications`.

## Communication

`conversations` may set `kind` plus optional `job_id` / `gig_id` / `organisation_id` / `service_id`. `messages.read_at` is a receipt. `notifications` for other people go through `notify_profile(...)` (security definer).

## Growth / audit

`profile_views`, `search_appearances`, `recommendation_requests`, `product_events`, `audit_logs`.

`product_events` is first-party instrumentation in this database. It is not a warehouse and not Insights-as-analytics.

## Search

Generated `tsvector` columns (`search_document`) plus GIN indexes on people, organisations, jobs, gigs, and projects. Ranking still happens in `src/lib/domain/search-rank.ts`. No embedding index.

## Storage

- `identity-public` — avatars, covers, logos, post/project photos. Path prefix is `auth.uid()`.
- `identity-private` — owner-only documents.

## Intentionally absent

Worker passports, sites, gangs, attendance, DPR, payroll, Aadhaar, bank accounts, PF/ESI, medical records.
