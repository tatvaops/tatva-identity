-- Production hardening: onboarding progress, current roles, evidence visibility, indexes.

alter table public.profiles
  add column if not exists onboarding_step integer not null default 0;

alter table public.professional_experiences
  add column if not exists is_current boolean not null default false;

update public.professional_experiences
set is_current = true
where is_current = false and end_date is null;

alter table public.evidence_items
  add column if not exists is_public boolean not null default true;

drop policy if exists "evidence_public_read" on public.evidence_items;
create policy "evidence_public_read"
  on public.evidence_items for select
  using (
    document_id is null
    and is_public = true
  );

drop policy if exists "evidence_owner_all" on public.evidence_items;
create policy "evidence_owner_all"
  on public.evidence_items for all
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

create index if not exists job_applications_job_idx on public.job_applications (job_id);
create index if not exists gig_applications_gig_idx on public.gig_applications (gig_id);
create index if not exists job_posts_org_idx on public.job_posts (organisation_id);
create index if not exists gig_posts_org_idx on public.gig_posts (organisation_id);
create index if not exists project_views_viewer_idx on public.project_views (viewer_profile_id);
create index if not exists professional_experiences_profile_idx on public.professional_experiences (profile_id, start_date desc);
