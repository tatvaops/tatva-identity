-- Identity gap-fill. Does not create Vertex operational tables.
-- Hide demo rows with seed_visible where those tables are listed in the seed toggle.

create or replace function public.is_org_creator(org_id uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1 from public.organisations o
    where o.id = org_id and o.created_by = auth.uid()
  );
$$;

grant execute on function public.is_org_creator(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Profile completeness, professional titles, field visibility
-- ---------------------------------------------------------------------------

alter table public.profiles
  add column if not exists professional_title text;

alter table public.profiles
  drop constraint if exists profiles_professional_title_check;

alter table public.profiles
  add constraint profiles_professional_title_check
  check (
    professional_title is null or professional_title in (
      'white_collar',
      'blue_collar',
      'skilled_trade',
      'gig_worker',
      'freelancer',
      'contractor',
      'technician',
      'supervisor',
      'engineer',
      'architect',
      'designer',
      'service_professional'
    )
  );

alter table public.profiles
  add column if not exists about_visible_to text not null default 'public';

alter table public.profiles
  drop constraint if exists profiles_about_visible_to_check;

alter table public.profiles
  add constraint profiles_about_visible_to_check
  check (about_visible_to in ('public', 'connections', 'recruiters', 'private'));

alter table public.profiles
  add column if not exists location_visible_to text not null default 'public';

alter table public.profiles
  drop constraint if exists profiles_location_visible_to_check;

alter table public.profiles
  add constraint profiles_location_visible_to_check
  check (location_visible_to in ('public', 'connections', 'recruiters', 'private'));

grant update (
  professional_title, about_visible_to, location_visible_to, email_visible_to
) on public.profiles to authenticated;

grant select (
  professional_title, about_visible_to, location_visible_to
) on public.profiles to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Organisation workplace contact (never a home address)
-- ---------------------------------------------------------------------------

alter table public.organisations
  add column if not exists logo_path text,
  add column if not exists cover_path text,
  add column if not exists public_phone text,
  add column if not exists public_email text,
  add column if not exists office_locality text,
  add column if not exists service_areas text[] not null default '{}';

alter table public.organisation_members
  add column if not exists org_role text not null default 'member',
  add column if not exists invite_status text not null default 'active';

alter table public.organisation_members
  drop constraint if exists organisation_members_org_role_check;

alter table public.organisation_members
  add constraint organisation_members_org_role_check
  check (org_role in ('owner', 'admin', 'recruiter', 'member'));

alter table public.organisation_members
  drop constraint if exists organisation_members_invite_status_check;

alter table public.organisation_members
  add constraint organisation_members_invite_status_check
  check (invite_status in ('invited', 'active', 'left'));

-- Hide owner uuid from anonymous grants. Authenticated still needs it for creator checks.
revoke select on public.organisations from anon;
grant select (
  id, slug, name, tagline, about, organisation_type, industry,
  city, state, country, locality, founded_year, team_size_label, website,
  logo_path, cover_path, public_phone, public_email, office_locality, service_areas,
  created_at, updated_at
) on public.organisations to anon;

grant select (
  id, slug, name, tagline, about, organisation_type, industry,
  city, state, country, locality, founded_year, team_size_label, website,
  logo_path, cover_path, public_phone, public_email, office_locality, service_areas,
  created_by, created_at, updated_at
) on public.organisations to authenticated;

-- ---------------------------------------------------------------------------
-- Jobs / gigs close + easy apply already on jobs
-- ---------------------------------------------------------------------------

alter table public.job_posts
  add column if not exists closed_at timestamptz;

alter table public.gig_posts
  add column if not exists closed_at timestamptz;

grant update on public.job_posts, public.gig_posts to authenticated;

drop policy if exists "jobs_update_creator" on public.job_posts;
create policy "jobs_update_creator"
  on public.job_posts for update
  using (public.is_org_creator(organisation_id));

drop policy if exists "gigs_update_creator" on public.gig_posts;
create policy "gigs_update_creator"
  on public.gig_posts for update
  using (public.is_org_creator(organisation_id));

-- Recruiter / admin can also write jobs
create or replace function public.is_org_staff(org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    public.is_org_creator(org_id)
    or exists (
      select 1
      from public.organisation_members m
      where m.organisation_id = org_id
        and m.profile_id = auth.uid()
        and m.invite_status = 'active'
        and m.org_role in ('owner', 'admin', 'recruiter')
    );
$$;

grant execute on function public.is_org_staff(uuid) to authenticated;

drop policy if exists "jobs_write_staff" on public.job_posts;
create policy "jobs_write_staff"
  on public.job_posts for insert
  with check (
    public.is_org_staff(organisation_id)
    and (recruiter_profile_id is null or recruiter_profile_id = auth.uid())
  );

drop policy if exists "gigs_write_staff" on public.gig_posts;
create policy "gigs_write_staff"
  on public.gig_posts for insert
  with check (public.is_org_staff(organisation_id));

-- ---------------------------------------------------------------------------
-- Conversation links (job / gig / enquiry) without Vertex quote fulfilment
-- ---------------------------------------------------------------------------

alter table public.conversations
  add column if not exists job_id uuid references public.job_posts (id) on delete set null,
  add column if not exists gig_id uuid references public.gig_posts (id) on delete set null,
  add column if not exists organisation_id uuid references public.organisations (id) on delete set null,
  add column if not exists service_id uuid,
  add column if not exists linked_profile_id uuid references public.profiles (id) on delete set null;

alter table public.messages
  add column if not exists read_at timestamptz;

-- ---------------------------------------------------------------------------
-- Graph / catalogue tables
-- ---------------------------------------------------------------------------

create table if not exists public.profile_services (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  description text,
  locations text[] not null default '{}',
  availability_label text,
  created_at timestamptz not null default now()
);

create table if not exists public.project_milestones (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.network_projects (id) on delete cascade,
  title text not null,
  body text,
  occurred_on date,
  created_at timestamptz not null default now()
);

create table if not exists public.project_media (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.network_projects (id) on delete cascade,
  storage_path text not null,
  caption text,
  kind text not null default 'photo' check (kind in ('photo', 'before', 'after')),
  created_at timestamptz not null default now()
);

create table if not exists public.project_skills (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.network_projects (id) on delete cascade,
  skill_id uuid not null references public.skills (id) on delete cascade,
  unique (project_id, skill_id)
);

create table if not exists public.project_services (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.network_projects (id) on delete cascade,
  organisation_service_id uuid references public.organisation_services (id) on delete cascade,
  profile_service_id uuid references public.profile_services (id) on delete cascade,
  check (
    (organisation_service_id is not null and profile_service_id is null)
    or (organisation_service_id is null and profile_service_id is not null)
  )
);

create table if not exists public.profile_blocks (
  id uuid primary key default gen_random_uuid(),
  blocker_id uuid not null references public.profiles (id) on delete cascade,
  blocked_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);

create table if not exists public.profile_mutes (
  id uuid primary key default gen_random_uuid(),
  muter_id uuid not null references public.profiles (id) on delete cascade,
  muted_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (muter_id, muted_id),
  check (muter_id <> muted_id)
);

create table if not exists public.organisation_views (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations (id) on delete cascade,
  viewer_profile_id uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.product_events (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles (id) on delete set null,
  name text not null,
  entity_kind text,
  entity_id uuid,
  created_at timestamptz not null default now()
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles (id) on delete set null,
  action text not null,
  entity_kind text not null,
  entity_id uuid,
  created_at timestamptz not null default now()
);

create table if not exists public.recommendation_requests (
  id uuid primary key default gen_random_uuid(),
  from_profile_id uuid not null references public.profiles (id) on delete cascade,
  to_profile_id uuid not null references public.profiles (id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'fulfilled', 'declined')),
  created_at timestamptz not null default now(),
  check (from_profile_id <> to_profile_id)
);

create table if not exists public.search_appearances (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  query text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Notify other people (security definer — RLS otherwise only allows self-insert)
-- ---------------------------------------------------------------------------

create or replace function public.notify_profile(
  target uuid,
  kind text,
  title text,
  body text default null,
  href text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if target is null or target = auth.uid() then
    return;
  end if;
  insert into public.notifications (profile_id, kind, title, body, href)
  values (target, kind, title, body, href);
end;
$$;

revoke all on function public.notify_profile(uuid, text, text, text, text) from public;
grant execute on function public.notify_profile(uuid, text, text, text, text) to authenticated;

create or replace function public.write_audit(
  action text,
  entity_kind text,
  entity_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.audit_logs (actor_id, action, entity_kind, entity_id)
  values (auth.uid(), action, entity_kind, entity_id);
end;
$$;

grant execute on function public.write_audit(text, text, uuid) to authenticated;

create or replace function public.record_product_event(
  name text,
  entity_kind text default null,
  entity_id uuid default null
)
returns void
language sql
security definer
set search_path = public
as $$
  insert into public.product_events (profile_id, name, entity_kind, entity_id)
  values (auth.uid(), name, entity_kind, entity_id);
$$;

grant execute on function public.record_product_event(text, text, uuid) to authenticated, anon;

-- ---------------------------------------------------------------------------
-- Verified-project skill evidence (not a hidden score)
-- ---------------------------------------------------------------------------

create or replace function public.enrich_verified_project()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  contributor record;
  skill_row record;
begin
  if tg_op = 'update' and new.verified is true and (old.verified is distinct from true) then
    for contributor in
      select profile_id from public.project_contributors
      where project_id = new.id and opted_in = true
    loop
      for skill_row in
        select ps.id
        from public.profile_skills ps
        join public.project_skills psk on psk.skill_id = ps.skill_id
        where ps.profile_id = contributor.profile_id
          and psk.project_id = new.id
      loop
        if not exists (
          select 1 from public.skill_verifications v
          where v.profile_skill_id = skill_row.id and v.kind = 'project'
        ) then
          insert into public.skill_verifications (profile_skill_id, kind, explanation)
          values (skill_row.id, 'project', 'Opted-in contributor on a verified project.');
        end if;
        update public.profile_skills
        set verification_level = case
          when verification_level in ('tatva_verified', 'employer_verified', 'certification_verified') then verification_level
          else 'employer_verified'
        end
        where id = skill_row.id
          and verification_level in ('self_declared', 'community_endorsed');
      end loop;
    end loop;
  end if;
  return new;
end;
$$;

drop trigger if exists network_projects_enrich on public.network_projects;
create trigger network_projects_enrich
after update of verified on public.network_projects
for each row execute function public.enrich_verified_project();

-- Gig seats decrement when a recruiter accepts an applicant
create or replace function public.decrement_gig_seats()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'accepted' and (old.status is distinct from 'accepted') then
    update public.gig_posts
    set seats = greatest(coalesce(seats, 1) - 1, 0)
    where id = new.gig_id
      and seats is not null;
  end if;
  return new;
end;
$$;

drop trigger if exists gig_apps_decrement_seats on public.gig_applications;
create trigger gig_apps_decrement_seats
after update of status on public.gig_applications
for each row execute function public.decrement_gig_seats();

-- ---------------------------------------------------------------------------
-- Full-text search (simple config: names, not semantic vectors)
-- ---------------------------------------------------------------------------

alter table public.profiles
  add column if not exists search_document tsvector
  generated always as (
    setweight(to_tsvector('simple', coalesce(full_name, '')), 'A')
    || setweight(to_tsvector('simple', coalesce(headline, '')), 'B')
    || setweight(to_tsvector('simple', coalesce(about, '')), 'C')
    || setweight(to_tsvector('simple', coalesce(city, '')), 'B')
  ) stored;

alter table public.organisations
  add column if not exists search_document tsvector
  generated always as (
    setweight(to_tsvector('simple', coalesce(name, '')), 'A')
    || setweight(to_tsvector('simple', coalesce(tagline, '')), 'B')
    || setweight(to_tsvector('simple', coalesce(industry, '')), 'B')
    || setweight(to_tsvector('simple', coalesce(about, '')), 'C')
    || setweight(to_tsvector('simple', coalesce(city, '')), 'B')
  ) stored;

alter table public.job_posts
  add column if not exists search_document tsvector
  generated always as (
    setweight(to_tsvector('simple', coalesce(title, '')), 'A')
    || setweight(to_tsvector('simple', coalesce(city, '')), 'B')
    || setweight(to_tsvector('simple', coalesce(description, '')), 'C')
  ) stored;

alter table public.gig_posts
  add column if not exists search_document tsvector
  generated always as (
    setweight(to_tsvector('simple', coalesce(title, '')), 'A')
    || setweight(to_tsvector('simple', coalesce(trade, '')), 'A')
    || setweight(to_tsvector('simple', coalesce(site_name, '')), 'B')
    || setweight(to_tsvector('simple', coalesce(description, '')), 'C')
  ) stored;

alter table public.network_projects
  add column if not exists search_document tsvector
  generated always as (
    setweight(to_tsvector('simple', coalesce(name, '')), 'A')
    || setweight(to_tsvector('simple', coalesce(summary, '')), 'B')
    || setweight(to_tsvector('simple', coalesce(city, '')), 'B')
  ) stored;

create index if not exists profiles_search_idx on public.profiles using gin (search_document);
create index if not exists organisations_search_idx on public.organisations using gin (search_document);
create index if not exists job_posts_search_idx on public.job_posts using gin (search_document);
create index if not exists gig_posts_search_idx on public.gig_posts using gin (search_document);
create index if not exists network_projects_search_idx on public.network_projects using gin (search_document);
create index if not exists profile_views_viewed_idx on public.profile_views (viewed_profile_id, created_at desc);
create index if not exists organisation_views_org_idx on public.organisation_views (organisation_id, created_at desc);
create index if not exists product_events_name_idx on public.product_events (name, created_at desc);
create index if not exists posts_created_idx on public.posts (created_at desc);
create index if not exists job_posts_closed_idx on public.job_posts (closed_at);
create index if not exists gig_posts_closed_idx on public.gig_posts (closed_at);

-- ---------------------------------------------------------------------------
-- Reviews: verified client = opted-in on a shared project with that organisation
-- ---------------------------------------------------------------------------

create or replace function public.can_review_organisation(org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.project_contributors c
    join public.project_organisations po on po.project_id = c.project_id
    where c.profile_id = auth.uid()
      and c.opted_in = true
      and po.organisation_id = org_id
  );
$$;

grant execute on function public.can_review_organisation(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Storage buckets
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  (
    'identity-public',
    'identity-public',
    true,
    5242880,
    array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  ),
  (
    'identity-private',
    'identity-private',
    false,
    10485760,
    array['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
  )
on conflict (id) do nothing;

drop policy if exists "identity_public_read" on storage.objects;
create policy "identity_public_read"
  on storage.objects for select
  using (bucket_id = 'identity-public');

drop policy if exists "identity_public_write_own" on storage.objects;
create policy "identity_public_write_own"
  on storage.objects for insert
  with check (
    bucket_id = 'identity-public'
    and auth.uid() is not null
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "identity_public_update_own" on storage.objects;
create policy "identity_public_update_own"
  on storage.objects for update
  using (
    bucket_id = 'identity-public'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "identity_public_delete_own" on storage.objects;
create policy "identity_public_delete_own"
  on storage.objects for delete
  using (
    bucket_id = 'identity-public'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "identity_private_own" on storage.objects;
create policy "identity_private_own"
  on storage.objects for all
  using (
    bucket_id = 'identity-private'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'identity-private'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ---------------------------------------------------------------------------
-- RLS for new tables
-- ---------------------------------------------------------------------------

alter table public.profile_services enable row level security;
alter table public.project_milestones enable row level security;
alter table public.project_media enable row level security;
alter table public.project_skills enable row level security;
alter table public.project_services enable row level security;
alter table public.profile_blocks enable row level security;
alter table public.profile_mutes enable row level security;
alter table public.organisation_views enable row level security;
alter table public.product_events enable row level security;
alter table public.audit_logs enable row level security;
alter table public.recommendation_requests enable row level security;
alter table public.search_appearances enable row level security;

drop policy if exists "profile_services_read" on public.profile_services;
create policy "profile_services_read"
  on public.profile_services for select using (true);
drop policy if exists "profile_services_write_own" on public.profile_services;
create policy "profile_services_write_own"
  on public.profile_services for all
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

drop policy if exists "project_milestones_read" on public.project_milestones;
create policy "project_milestones_read"
  on public.project_milestones for select using (true);
drop policy if exists "project_milestones_write_contributor" on public.project_milestones;
create policy "project_milestones_write_contributor"
  on public.project_milestones for insert
  with check (
    exists (
      select 1 from public.project_contributors c
      where c.project_id = project_id and c.profile_id = auth.uid()
    )
  );

drop policy if exists "project_media_read" on public.project_media;
create policy "project_media_read"
  on public.project_media for select using (true);
drop policy if exists "project_media_write_contributor" on public.project_media;
create policy "project_media_write_contributor"
  on public.project_media for insert
  with check (
    exists (
      select 1 from public.project_contributors c
      where c.project_id = project_id and c.profile_id = auth.uid()
    )
  );

drop policy if exists "project_skills_read" on public.project_skills;
create policy "project_skills_read"
  on public.project_skills for select using (true);
drop policy if exists "project_skills_write_contributor" on public.project_skills;
create policy "project_skills_write_contributor"
  on public.project_skills for insert
  with check (
    exists (
      select 1 from public.project_contributors c
      where c.project_id = project_id and c.profile_id = auth.uid()
    )
  );

drop policy if exists "project_services_read" on public.project_services;
create policy "project_services_read"
  on public.project_services for select using (true);

drop policy if exists "blocks_own" on public.profile_blocks;
create policy "blocks_own"
  on public.profile_blocks for all
  using (blocker_id = auth.uid())
  with check (blocker_id = auth.uid());

drop policy if exists "mutes_own" on public.profile_mutes;
create policy "mutes_own"
  on public.profile_mutes for all
  using (muter_id = auth.uid())
  with check (muter_id = auth.uid());

drop policy if exists "org_views_insert" on public.organisation_views;
create policy "org_views_insert"
  on public.organisation_views for insert
  with check (viewer_profile_id is null or viewer_profile_id = auth.uid());
drop policy if exists "org_views_owner" on public.organisation_views;
create policy "org_views_owner"
  on public.organisation_views for select
  using (public.is_org_creator(organisation_id) or public.is_org_staff(organisation_id));

drop policy if exists "product_events_insert" on public.product_events;
create policy "product_events_insert"
  on public.product_events for insert
  with check (profile_id is null or profile_id = auth.uid());
drop policy if exists "product_events_own" on public.product_events;
create policy "product_events_own"
  on public.product_events for select
  using (profile_id = auth.uid());

drop policy if exists "audit_logs_own" on public.audit_logs;
create policy "audit_logs_own"
  on public.audit_logs for select
  using (actor_id = auth.uid());

drop policy if exists "rec_requests_involved" on public.recommendation_requests;
create policy "rec_requests_involved"
  on public.recommendation_requests for select
  using (from_profile_id = auth.uid() or to_profile_id = auth.uid());
drop policy if exists "rec_requests_insert" on public.recommendation_requests;
create policy "rec_requests_insert"
  on public.recommendation_requests for insert
  with check (from_profile_id = auth.uid());
drop policy if exists "rec_requests_update" on public.recommendation_requests;
create policy "rec_requests_update"
  on public.recommendation_requests for update
  using (to_profile_id = auth.uid() or from_profile_id = auth.uid());

drop policy if exists "search_appearances_own" on public.search_appearances;
create policy "search_appearances_own"
  on public.search_appearances for select
  using (profile_id = auth.uid());
drop policy if exists "search_appearances_insert" on public.search_appearances;
create policy "search_appearances_insert"
  on public.search_appearances for insert
  with check (true);

drop policy if exists "reviews_insert_verified" on public.reviews;
create policy "reviews_insert_verified"
  on public.reviews for insert
  with check (
    reviewer_profile_id = auth.uid()
    and public.can_review_organisation(organisation_id)
  );

drop policy if exists "verification_requests_insert_self" on public.verification_requests;
create policy "verification_requests_insert_self"
  on public.verification_requests for insert
  with check (profile_id = auth.uid() or organisation_id is not null);

drop policy if exists "skill_verifications_insert_endorser" on public.skill_verifications;
create policy "skill_verifications_insert_endorser"
  on public.skill_verifications for insert
  with check (verifier_profile_id = auth.uid());

drop policy if exists "org_members_update_staff" on public.organisation_members;
create policy "org_members_update_staff"
  on public.organisation_members for update
  using (public.is_org_staff(organisation_id) or profile_id = auth.uid());

drop policy if exists "org_members_delete_staff" on public.organisation_members;
create policy "org_members_delete_staff"
  on public.organisation_members for delete
  using (public.is_org_staff(organisation_id) or profile_id = auth.uid());

drop policy if exists "connections_delete_involved" on public.connections;
create policy "connections_delete_involved"
  on public.connections for delete
  using (requester_id = auth.uid() or addressee_id = auth.uid());

drop policy if exists "messages_update_member" on public.messages;
create policy "messages_update_member"
  on public.messages for update
  using (
    exists (
      select 1 from public.conversation_members m
      where m.conversation_id = messages.conversation_id and m.profile_id = auth.uid()
    )
  );

grant select, insert, update, delete on public.profile_services to authenticated;
grant select on public.profile_services to anon;
grant select, insert on public.project_milestones, public.project_media, public.project_skills, public.project_services
  to authenticated;
grant select on public.project_milestones, public.project_media, public.project_skills, public.project_services
  to anon;
grant select, insert, delete on public.profile_blocks, public.profile_mutes to authenticated;
grant select, insert on public.organisation_views to authenticated;
grant insert on public.organisation_views to anon;
grant select, insert on public.product_events to authenticated;
grant insert on public.product_events to anon;
grant select on public.audit_logs to authenticated;
grant select, insert, update on public.recommendation_requests to authenticated;
grant select, insert on public.search_appearances to authenticated, anon;
grant insert on public.reviews to authenticated;
grant insert on public.verification_requests to authenticated;
grant insert on public.skill_verifications to authenticated;
grant insert, update, delete on public.post_media, public.comments, public.profile_documents to authenticated;
grant update on public.messages to authenticated;

-- public_profiles view: add new public columns (replace, do not rename in place)
drop view if exists public.public_profiles;
create view public.public_profiles
with (security_invoker = true)
as
select
  id, handle, full_name, headline, about, avatar_path, cover_path,
  occupation_mode, professional_title, classification, worker_passport_id, current_organisation_id,
  city, state, country, locality, languages, preferred_work_locations,
  work_preference, availability_status, willing_to_relocate, willing_to_travel,
  arrangement, preferred_roles, preferred_cities, preferred_radius_km,
  shift_preference, notice_period, email_visible_to, website,
  about_visible_to, location_visible_to,
  identity_verified, employment_verified, trade_verified, created_at, updated_at
from public.profiles;

grant select on public.public_profiles to anon, authenticated;
