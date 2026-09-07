-- Product-complete: profile repair, onboarding, education, evidence, privacy, applications.

-- ---------------------------------------------------------------------------
-- Repair missing profile rows for authenticated users
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  generated_handle text;
begin
  generated_handle := 'u-' || substr(replace(new.id::text, '-', ''), 1, 12);
  insert into public.profiles (id, handle, full_name)
  values (
    new.id,
    generated_handle,
    coalesce(nullif(new.raw_user_meta_data->>'full_name', ''), 'New professional')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create or replace function public.ensure_own_profile()
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  result public.profiles;
  generated_handle text;
  display_name text;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;
  select * into result from public.profiles where id = auth.uid();
  if found then
    return result;
  end if;
  generated_handle := 'u-' || substr(replace(auth.uid()::text, '-', ''), 1, 12);
  select coalesce(nullif(raw_user_meta_data->>'full_name', ''), 'New professional')
    into display_name
  from auth.users
  where id = auth.uid();
  insert into public.profiles (id, handle, full_name)
  values (auth.uid(), generated_handle, coalesce(display_name, 'New professional'))
  on conflict (id) do update set full_name = public.profiles.full_name
  returning * into result;
  return result;
end;
$$;

revoke all on function public.ensure_own_profile() from public;
grant execute on function public.ensure_own_profile() to authenticated;

-- ---------------------------------------------------------------------------
-- Profile depth + privacy + notifications + onboarding
-- ---------------------------------------------------------------------------
alter table public.profiles
  add column if not exists onboarding_completed_at timestamptz,
  add column if not exists years_experience integer,
  add column if not exists specialisation text,
  add column if not exists industries_served text[] not null default '{}',
  add column if not exists professional_interests text[] not null default '{}',
  add column if not exists activity_visible_to text not null default 'public',
  add column if not exists connections_visible_to text not null default 'public',
  add column if not exists availability_visible_to text not null default 'public',
  add column if not exists projects_visible_to text not null default 'public',
  add column if not exists experience_visible_to text not null default 'public',
  add column if not exists notify_connections boolean not null default true,
  add column if not exists notify_messages boolean not null default true,
  add column if not exists notify_applications boolean not null default true,
  add column if not exists notify_social boolean not null default true,
  add column if not exists notify_organisation boolean not null default true;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'profiles_activity_visible_to_check') then
    alter table public.profiles add constraint profiles_activity_visible_to_check
      check (activity_visible_to in ('public', 'connections', 'recruiters', 'private'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'profiles_connections_visible_to_check') then
    alter table public.profiles add constraint profiles_connections_visible_to_check
      check (connections_visible_to in ('public', 'connections', 'recruiters', 'private'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'profiles_availability_visible_to_check') then
    alter table public.profiles add constraint profiles_availability_visible_to_check
      check (availability_visible_to in ('public', 'connections', 'recruiters', 'private'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'profiles_projects_visible_to_check') then
    alter table public.profiles add constraint profiles_projects_visible_to_check
      check (projects_visible_to in ('public', 'connections', 'recruiters', 'private'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'profiles_experience_visible_to_check') then
    alter table public.profiles add constraint profiles_experience_visible_to_check
      check (experience_visible_to in ('public', 'connections', 'recruiters', 'private'));
  end if;
end $$;

alter table public.profile_skills
  add column if not exists years_experience numeric,
  add column if not exists category text;

alter table public.profile_services
  add column if not exists category text,
  add column if not exists pricing_model text;

-- ---------------------------------------------------------------------------
-- Education
-- ---------------------------------------------------------------------------
create table if not exists public.profile_education (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  institution text not null,
  qualification text,
  course text,
  field_of_study text,
  start_date date,
  end_date date,
  credential_id_public text,
  evidence_document_id uuid references public.profile_documents (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists profile_education_updated_at on public.profile_education;
create trigger profile_education_updated_at
before update on public.profile_education
for each row execute function public.set_updated_at();

alter table public.profile_education enable row level security;

drop policy if exists "education_public_read" on public.profile_education;
create policy "education_public_read"
  on public.profile_education for select
  using (true);

drop policy if exists "education_owner_write" on public.profile_education;
create policy "education_owner_write"
  on public.profile_education for all
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

grant select on public.profile_education to anon, authenticated;
grant insert, update, delete on public.profile_education to authenticated;

-- ---------------------------------------------------------------------------
-- Evidence items (claim ↔ proof)
-- ---------------------------------------------------------------------------
create table if not exists public.evidence_items (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  claim_kind text not null check (claim_kind in (
    'skill', 'experience', 'project', 'certification', 'education', 'service', 'portfolio'
  )),
  claim_id uuid,
  document_id uuid references public.profile_documents (id) on delete set null,
  media_path text,
  note text,
  verification_state text not null default 'self_declared',
  created_at timestamptz not null default now()
);

alter table public.evidence_items enable row level security;

drop policy if exists "evidence_public_read" on public.evidence_items;
create policy "evidence_public_read"
  on public.evidence_items for select
  using (document_id is null);

drop policy if exists "evidence_owner_all" on public.evidence_items;
create policy "evidence_owner_all"
  on public.evidence_items for all
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

grant select on public.evidence_items to anon, authenticated;
grant insert, update, delete on public.evidence_items to authenticated;

-- ---------------------------------------------------------------------------
-- Project views (real analytics)
-- ---------------------------------------------------------------------------
create table if not exists public.project_views (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.network_projects (id) on delete cascade,
  viewer_profile_id uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists project_views_project_idx on public.project_views (project_id, created_at desc);

alter table public.project_views enable row level security;

drop policy if exists "project_views_insert" on public.project_views;
create policy "project_views_insert"
  on public.project_views for insert
  with check (viewer_profile_id is null or viewer_profile_id = auth.uid());

drop policy if exists "project_views_read" on public.project_views;
create policy "project_views_read"
  on public.project_views for select
  using (
    viewer_profile_id = auth.uid()
    or exists (
      select 1 from public.project_contributors c
      where c.project_id = project_views.project_id and c.profile_id = auth.uid()
    )
  );

grant select, insert on public.project_views to authenticated;
grant insert on public.project_views to anon;

-- ---------------------------------------------------------------------------
-- Connections: one relationship per pair
-- ---------------------------------------------------------------------------
delete from public.connections a
using public.connections b
where a.id > b.id
  and least(a.requester_id, a.addressee_id) = least(b.requester_id, b.addressee_id)
  and greatest(a.requester_id, a.addressee_id) = greatest(b.requester_id, b.addressee_id);

create unique index if not exists connections_undirected_unique
  on public.connections (least(requester_id, addressee_id), greatest(requester_id, addressee_id));

-- ---------------------------------------------------------------------------
-- Author can delete own posts
-- ---------------------------------------------------------------------------
drop policy if exists "posts_author_delete" on public.posts;
create policy "posts_author_delete"
  on public.posts for delete
  using (author_profile_id = auth.uid());

drop policy if exists "posts_author_update" on public.posts;
create policy "posts_author_update"
  on public.posts for update
  using (author_profile_id = auth.uid())
  with check (author_profile_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Privacy helpers for public_profiles
-- ---------------------------------------------------------------------------
create or replace function public.are_connected(a uuid, b uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    a is not null and b is not null
    and auth.uid() is not null
    and (auth.uid() = a or auth.uid() = b)
    and exists (
      select 1 from public.connections
      where status = 'accepted'
        and (
          (requester_id = a and addressee_id = b)
          or (requester_id = b and addressee_id = a)
        )
    );
$$;

create or replace function public.viewer_is_recruiter()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.organisation_members
    where profile_id = auth.uid()
      and invite_status = 'active'
      and org_role in ('owner', 'admin', 'recruiter')
  );
$$;

create or replace function public.audience_allows(audience text, owner_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    owner_id = auth.uid()
    or audience is null
    or audience = 'public'
    or (audience = 'connections' and public.are_connected(owner_id, auth.uid()))
    or (audience = 'recruiters' and (public.viewer_is_recruiter() or public.are_connected(owner_id, auth.uid())))
    or (audience in ('private', 'none') and owner_id = auth.uid());
$$;

revoke all on function public.are_connected(uuid, uuid) from public;
revoke all on function public.viewer_is_recruiter() from public;
revoke all on function public.audience_allows(text, uuid) from public;
grant execute on function public.are_connected(uuid, uuid) to anon, authenticated;
grant execute on function public.viewer_is_recruiter() to anon, authenticated;
grant execute on function public.audience_allows(text, uuid) to anon, authenticated;

drop view if exists public.public_profiles;
create view public.public_profiles
with (security_invoker = true)
as
select
  id,
  handle,
  full_name,
  headline,
  case when public.audience_allows(about_visible_to, id) then about else null end as about,
  avatar_path,
  cover_path,
  occupation_mode,
  professional_title,
  classification,
  worker_passport_id,
  current_organisation_id,
  case when public.audience_allows(location_visible_to, id) then city else null end as city,
  case when public.audience_allows(location_visible_to, id) then state else null end as state,
  country,
  case when public.audience_allows(location_visible_to, id) then locality else null end as locality,
  languages,
  case when public.audience_allows(location_visible_to, id) then preferred_work_locations else '{}'::text[] end as preferred_work_locations,
  work_preference,
  case when public.audience_allows(availability_visible_to, id) then availability_status else 'not_looking' end as availability_status,
  willing_to_relocate,
  willing_to_travel,
  arrangement,
  preferred_roles,
  preferred_cities,
  preferred_radius_km,
  shift_preference,
  notice_period,
  email_visible_to,
  website,
  about_visible_to,
  location_visible_to,
  activity_visible_to,
  connections_visible_to,
  availability_visible_to,
  projects_visible_to,
  experience_visible_to,
  years_experience,
  specialisation,
  industries_served,
  professional_interests,
  identity_verified,
  employment_verified,
  trade_verified,
  created_at,
  updated_at
from public.profiles;

grant select on public.public_profiles to anon, authenticated;

create index if not exists profiles_city_idx on public.profiles (city);
create index if not exists profiles_occupation_idx on public.profiles (occupation_mode);
create index if not exists profile_education_profile_idx on public.profile_education (profile_id);
create index if not exists evidence_items_profile_idx on public.evidence_items (profile_id, claim_kind);
