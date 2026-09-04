-- Demo-data switch. Hide without deleting:
--   update public.platform_settings set seed_data_enabled = false;
-- Show again:
--   update public.platform_settings set seed_data_enabled = true;
-- Delete demo rows:
--   select public.unseed_platform();

create table if not exists public.platform_settings (
  id integer primary key default 1 check (id = 1),
  seed_data_enabled boolean not null default true,
  updated_at timestamptz not null default now()
);

insert into public.platform_settings (id, seed_data_enabled)
values (1, true)
on conflict (id) do nothing;

create table if not exists public.seed_manifest (
  entity_kind text not null,
  entity_id uuid not null,
  primary key (entity_kind, entity_id)
);

create or replace function public.mark_seed(kind text, row_id uuid)
returns void
language sql
as $$
  insert into public.seed_manifest (entity_kind, entity_id)
  values (kind, row_id)
  on conflict do nothing;
$$;

create or replace function public.seed_visible(kind text, row_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    coalesce((select s.seed_data_enabled from public.platform_settings s where s.id = 1), false)
    or not exists (
      select 1
      from public.seed_manifest m
      where m.entity_kind = kind
        and m.entity_id = row_id
    );
$$;

revoke all on function public.seed_visible(text, uuid) from public;
grant execute on function public.seed_visible(text, uuid) to anon, authenticated;
grant execute on function public.mark_seed(text, uuid) to postgres;
grant select on public.platform_settings to anon, authenticated;

alter table public.platform_settings enable row level security;
alter table public.seed_manifest enable row level security;

drop policy if exists "platform_settings_read" on public.platform_settings;
create policy "platform_settings_read"
  on public.platform_settings for select
  using (true);

create or replace function public.unseed_platform()
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  uid uuid;
begin
  delete from public.network_projects
  where id in (select entity_id from public.seed_manifest where entity_kind = 'project');
  delete from public.organisations
  where id in (select entity_id from public.seed_manifest where entity_kind = 'organisation');
  delete from public.posts
  where id in (select entity_id from public.seed_manifest where entity_kind = 'post');
  delete from public.skills
  where id in (select entity_id from public.seed_manifest where entity_kind = 'skill');
  for uid in select entity_id from public.seed_manifest where entity_kind = 'profile'
  loop
    delete from auth.identities where user_id = uid;
    delete from auth.users where id = uid;
  end loop;
  delete from public.seed_manifest;
  update public.platform_settings set seed_data_enabled = false, updated_at = now() where id = 1;
end;
$$;

revoke all on function public.unseed_platform() from public;

-- Hide demo rows from every public read when seed_data_enabled is false.
drop policy if exists "profiles_select_public_safe" on public.profiles;
create policy "profiles_select_public_safe"
  on public.profiles for select
  using (public.seed_visible('profile', id));

drop policy if exists "profile_handles_read" on public.profile_handles;
create policy "profile_handles_read"
  on public.profile_handles for select
  using (public.seed_visible('profile', profile_id));

drop policy if exists "orgs_read" on public.organisations;
create policy "orgs_read"
  on public.organisations for select
  using (public.seed_visible('organisation', id));

drop policy if exists "org_members_read_public" on public.organisation_members;
create policy "org_members_read_public"
  on public.organisation_members for select
  using (
    (visibility = 'public' or profile_id = auth.uid())
    and public.seed_visible('org_member', id)
  );

drop policy if exists "follows_read" on public.follows;
create policy "follows_read"
  on public.follows for select
  using (public.seed_visible('follow', id));

drop policy if exists "skills_read" on public.skills;
create policy "skills_read"
  on public.skills for select
  using (public.seed_visible('skill', id));

drop policy if exists "profile_skills_read" on public.profile_skills;
create policy "profile_skills_read"
  on public.profile_skills for select
  using (public.seed_visible('profile_skill', id));

drop policy if exists "skill_verifications_read" on public.skill_verifications;
create policy "skill_verifications_read"
  on public.skill_verifications for select
  using (public.seed_visible('skill_verification', id));

drop policy if exists "endorsements_read" on public.endorsements;
create policy "endorsements_read"
  on public.endorsements for select
  using (public.seed_visible('endorsement', id));

drop policy if exists "certs_read_public" on public.profile_certifications;
create policy "certs_read_public"
  on public.profile_certifications for select
  using (
    (public_visible = true or profile_id = auth.uid())
    and public.seed_visible('certification', id)
  );

drop policy if exists "experience_read" on public.professional_experiences;
create policy "experience_read"
  on public.professional_experiences for select
  using (public.seed_visible('experience', id));

drop policy if exists "projects_read" on public.network_projects;
create policy "projects_read"
  on public.network_projects for select
  using (public.seed_visible('project', id));

drop policy if exists "contributors_read_opted" on public.project_contributors;
create policy "contributors_read_opted"
  on public.project_contributors for select
  using (
    (opted_in = true or profile_id = auth.uid())
    and public.seed_visible('contributor', id)
  );

drop policy if exists "project_orgs_read" on public.project_organisations;
create policy "project_orgs_read"
  on public.project_organisations for select
  using (public.seed_visible('project_org', id));

drop policy if exists "posts_read" on public.posts;
create policy "posts_read"
  on public.posts for select
  using (public.seed_visible('post', id));

drop policy if exists "post_media_read" on public.post_media;
create policy "post_media_read"
  on public.post_media for select
  using (public.seed_visible('post_media', id));

drop policy if exists "reactions_read" on public.post_reactions;
create policy "reactions_read"
  on public.post_reactions for select
  using (public.seed_visible('reaction', id));

drop policy if exists "comments_read" on public.comments;
create policy "comments_read"
  on public.comments for select
  using (public.seed_visible('comment', id));

drop policy if exists "jobs_read" on public.job_posts;
create policy "jobs_read"
  on public.job_posts for select
  using (public.seed_visible('job', id));

drop policy if exists "gigs_read" on public.gig_posts;
create policy "gigs_read"
  on public.gig_posts for select
  using (public.seed_visible('gig', id));

drop policy if exists "services_read" on public.organisation_services;
create policy "services_read"
  on public.organisation_services for select
  using (public.seed_visible('service', id));

drop policy if exists "org_creds_read_public" on public.organisation_credentials;
create policy "org_creds_read_public"
  on public.organisation_credentials for select
  using (public_visible = true and public.seed_visible('org_credential', id));

drop policy if exists "reviews_read" on public.reviews;
create policy "reviews_read"
  on public.reviews for select
  using (public.seed_visible('review', id));

drop policy if exists "recommendations_read" on public.recommendations;
create policy "recommendations_read"
  on public.recommendations for select
  using (public.seed_visible('recommendation', id));
