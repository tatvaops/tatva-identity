-- Tatva Identity — Professional Network foundation
-- Vertex operational tables are NOT created here.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Updated-at helper
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Organisations (created before profiles for current_organisation_id)
-- ---------------------------------------------------------------------------
create table public.organisations (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  tagline text,
  about text,
  organisation_type text not null default 'employer'
    check (organisation_type in (
      'employer','service_provider','vendor','subcontractor','staffing_agency',
      'developer','general_contractor','manufacturer','brand','consultancy',
      'institution','training_organisation','recruitment_agency'
    )),
  industry text,
  city text,
  state text,
  country text not null default 'India',
  locality text,
  founded_year integer,
  team_size_label text,
  website text,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger organisations_updated_at
before update on public.organisations
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Profiles = auth.users public identity
-- No Aadhaar, bank, payroll, PF, ESI, medical, home address columns.
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  handle text not null unique,
  full_name text not null,
  headline text,
  about text,
  avatar_path text,
  cover_path text,
  occupation_mode text not null default 'white_collar'
    check (occupation_mode in ('white_collar','blue_collar','freelancer','contractor')),
  classification text
    check (classification is null or classification in (
      'regular_employee','contract_labor','gig_spot_worker',
      'vendor_gang_member','vendor_subcontractor_gang'
    )),
  worker_passport_id uuid,
  current_organisation_id uuid references public.organisations (id) on delete set null,
  city text,
  state text,
  country text not null default 'India',
  locality text,
  languages text[] not null default '{}',
  preferred_work_locations text[] not null default '{}',
  work_preference text,
  availability_status text not null default 'not_looking'
    check (availability_status in (
      'not_looking','open_to_opportunities','open_to_jobs','open_to_gigs',
      'available_immediately','engaged','on_leave'
    )),
  willing_to_relocate boolean not null default false,
  willing_to_travel boolean not null default false,
  arrangement text not null default 'on_site'
    check (arrangement in ('on_site','hybrid','remote')),
  preferred_roles text[] not null default '{}',
  preferred_cities text[] not null default '{}',
  preferred_radius_km integer,
  shift_preference text,
  notice_period text,
  daily_rate_inr integer,
  monthly_salary_inr integer,
  email_visible_to text not null default 'none'
    check (email_visible_to in ('none','connections','recruiters')),
  website text,
  identity_verified boolean not null default false,
  employment_verified boolean not null default false,
  trade_verified boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint handle_format check (handle ~ '^[a-z0-9][a-z0-9-]{1,62}[a-z0-9]$')
);

create trigger profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create table public.profile_handles (
  handle text primary key references public.profiles (handle) on delete cascade,
  profile_id uuid not null unique references public.profiles (id) on delete cascade
);

create or replace function public.sync_profile_handle()
returns trigger
language plpgsql
as $$
begin
  insert into public.profile_handles (handle, profile_id)
  values (new.handle, new.id)
  on conflict (profile_id) do update set handle = excluded.handle;
  if tg_op = 'update' and old.handle is distinct from new.handle then
    delete from public.profile_handles where handle = old.handle;
  end if;
  return new;
end;
$$;

create trigger profiles_sync_handle
after insert or update of handle on public.profiles
for each row execute function public.sync_profile_handle();

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
    coalesce(new.raw_user_meta_data->>'full_name', 'New professional')
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Membership, graph, content
-- ---------------------------------------------------------------------------
create table public.organisation_members (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  role_title text,
  department text,
  member_kind text not null default 'employee'
    check (member_kind in ('leadership','employee','contract_professional','associated_skilled_worker')),
  visibility text not null default 'public' check (visibility in ('public','private')),
  created_at timestamptz not null default now(),
  unique (organisation_id, profile_id)
);

create table public.connections (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.profiles (id) on delete cascade,
  addressee_id uuid not null references public.profiles (id) on delete cascade,
  status text not null default 'pending' check (status in ('pending','accepted','declined')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (requester_id, addressee_id),
  check (requester_id <> addressee_id)
);

create trigger connections_updated_at
before update on public.connections
for each row execute function public.set_updated_at();

create table public.follows (
  id uuid primary key default gen_random_uuid(),
  follower_id uuid not null references public.profiles (id) on delete cascade,
  person_id uuid references public.profiles (id) on delete cascade,
  organisation_id uuid references public.organisations (id) on delete cascade,
  created_at timestamptz not null default now(),
  check (
    (person_id is not null and organisation_id is null)
    or (person_id is null and organisation_id is not null)
  )
);

create unique index follows_person_unique
  on public.follows (follower_id, person_id) where person_id is not null;
create unique index follows_org_unique
  on public.follows (follower_id, organisation_id) where organisation_id is not null;

create table public.skills (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  category text
);

create table public.profile_skills (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  skill_id uuid not null references public.skills (id) on delete cascade,
  verification_level text not null default 'self_declared'
    check (verification_level in (
      'self_declared','community_endorsed','employer_verified','certification_verified','tatva_verified'
    )),
  rating integer check (rating is null or (rating >= 1 and rating <= 5)),
  created_at timestamptz not null default now(),
  unique (profile_id, skill_id)
);

create table public.skill_verifications (
  id uuid primary key default gen_random_uuid(),
  profile_skill_id uuid not null references public.profile_skills (id) on delete cascade,
  kind text not null,
  verifier_profile_id uuid references public.profiles (id) on delete set null,
  verifier_organisation_id uuid references public.organisations (id) on delete set null,
  explanation text,
  created_at timestamptz not null default now()
);

create table public.endorsements (
  id uuid primary key default gen_random_uuid(),
  profile_skill_id uuid not null references public.profile_skills (id) on delete cascade,
  endorser_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (profile_skill_id, endorser_id)
);

create table public.profile_certifications (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  issuer text,
  issue_date date,
  expiry_date date,
  credential_id_public text,
  verification_state text not null default 'self_declared'
    check (verification_state in ('verified','pending','expired','not_submitted','self_declared')),
  public_visible boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.professional_experiences (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  organisation_id uuid references public.organisations (id) on delete set null,
  organisation_name_text text,
  location_label text,
  start_date date,
  end_date date,
  source text not null default 'self_declared'
    check (source in ('self_declared','organisation_verified')),
  responsibilities text[] not null default '{}',
  created_at timestamptz not null default now()
);

create table public.network_projects (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  summary text,
  project_type text,
  status text not null default 'in_progress'
    check (status in ('completed','in_progress','handover')),
  city text,
  state text,
  country text not null default 'India',
  locality text,
  client_organisation_id uuid references public.organisations (id) on delete set null,
  main_contractor_id uuid references public.organisations (id) on delete set null,
  vertex_site_id uuid,
  verified boolean not null default false,
  start_date date,
  end_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger network_projects_updated_at
before update on public.network_projects
for each row execute function public.set_updated_at();

create table public.project_contributors (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.network_projects (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  organisation_id uuid references public.organisations (id) on delete set null,
  role_title text,
  contribution text,
  opted_in boolean not null default false,
  unique (project_id, profile_id)
);

create table public.project_organisations (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.network_projects (id) on delete cascade,
  organisation_id uuid not null references public.organisations (id) on delete cascade,
  role text not null check (role in ('client','main_contractor','subcontractor','vendor','consultant')),
  scope text,
  unique (project_id, organisation_id)
);

create table public.posts (
  id uuid primary key default gen_random_uuid(),
  post_type text not null default 'update',
  author_profile_id uuid references public.profiles (id) on delete cascade,
  author_organisation_id uuid references public.organisations (id) on delete cascade,
  body text not null,
  linked_project_id uuid references public.network_projects (id) on delete set null,
  linked_job_id uuid,
  linked_gig_id uuid,
  created_at timestamptz not null default now(),
  check (
    (author_profile_id is not null and author_organisation_id is null)
    or (author_profile_id is null and author_organisation_id is not null)
  )
);

create table public.post_media (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  storage_path text not null,
  caption text
);

create table public.post_reactions (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  kind text not null default 'like',
  created_at timestamptz not null default now(),
  unique (post_id, profile_id, kind)
);

create table public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  author_profile_id uuid not null references public.profiles (id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

create table public.job_posts (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations (id) on delete cascade,
  recruiter_profile_id uuid references public.profiles (id) on delete set null,
  title text not null,
  city text,
  state text,
  country text not null default 'India',
  locality text,
  employment_type text not null default 'permanent'
    check (employment_type in ('permanent','contract','part_time','temporary','internship')),
  experience_label text,
  salary_label text,
  skills text[] not null default '{}',
  description text,
  responsibilities text[] not null default '{}',
  requirements text[] not null default '{}',
  easy_apply boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.posts
  add constraint posts_linked_job_fk
  foreign key (linked_job_id) references public.job_posts (id) on delete set null;

create table public.job_applications (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.job_posts (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  status text not null default 'submitted',
  created_at timestamptz not null default now(),
  unique (job_id, profile_id)
);

create table public.gig_posts (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations (id) on delete cascade,
  title text not null,
  site_name text,
  project_id uuid references public.network_projects (id) on delete set null,
  trade text,
  shift_label text,
  pay_label text,
  distance_km numeric,
  start_label text,
  seats integer,
  duration text check (duration in ('4_hours','1_shift','1_day','3_days','1_week','project')),
  description text,
  created_at timestamptz not null default now()
);

alter table public.posts
  add constraint posts_linked_gig_fk
  foreign key (linked_gig_id) references public.gig_posts (id) on delete set null;

create table public.gig_applications (
  id uuid primary key default gen_random_uuid(),
  gig_id uuid not null references public.gig_posts (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  status text not null default 'submitted',
  created_at timestamptz not null default now(),
  unique (gig_id, profile_id)
);

create table public.organisation_services (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations (id) on delete cascade,
  name text not null,
  description text,
  locations text[] not null default '{}',
  pricing_model text
);

create table public.organisation_credentials (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations (id) on delete cascade,
  name text not null,
  category text not null,
  verification_state text not null default 'not_submitted'
    check (verification_state in ('verified','pending','expired','not_submitted')),
  public_visible boolean not null default true,
  expiry_label text
);

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations (id) on delete cascade,
  project_id uuid references public.network_projects (id) on delete set null,
  reviewer_profile_id uuid references public.profiles (id) on delete set null,
  reviewer_name text,
  reviewer_role text,
  relationship text not null check (relationship in ('verified_client','verified_employer')),
  rating numeric not null check (rating >= 0 and rating <= 5),
  body text,
  created_at timestamptz not null default now()
);

create table public.recommendations (
  id uuid primary key default gen_random_uuid(),
  from_profile_id uuid not null references public.profiles (id) on delete cascade,
  to_profile_id uuid not null references public.profiles (id) on delete cascade,
  relationship text,
  body text not null,
  created_at timestamptz not null default now()
);

create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  kind text not null default 'person'
    check (kind in ('person','recruiter','organisation','enquiry','gig','job','quote')),
  title text,
  created_at timestamptz not null default now()
);

create table public.conversation_members (
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  organisation_id uuid references public.organisations (id) on delete cascade,
  primary key (conversation_id, profile_id)
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  sender_id uuid not null references public.profiles (id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  kind text not null,
  title text not null,
  body text,
  href text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.saved_items (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  entity_kind text not null,
  entity_id uuid not null,
  created_at timestamptz not null default now(),
  unique (profile_id, entity_kind, entity_id)
);

create table public.profile_views (
  id uuid primary key default gen_random_uuid(),
  viewed_profile_id uuid not null references public.profiles (id) on delete cascade,
  viewer_profile_id uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.profile_documents (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  label text not null,
  storage_path text not null,
  created_at timestamptz not null default now()
);

create table public.verification_requests (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles (id) on delete cascade,
  organisation_id uuid references public.organisations (id) on delete cascade,
  kind text not null,
  status text not null default 'pending',
  created_at timestamptz not null default now()
);

-- Public-safe profile projection (no rates)
create or replace view public.public_profiles
with (security_invoker = true)
as
select
  id, handle, full_name, headline, about, avatar_path, cover_path,
  occupation_mode, classification, worker_passport_id, current_organisation_id,
  city, state, country, locality, languages, preferred_work_locations,
  work_preference, availability_status, willing_to_relocate, willing_to_travel,
  arrangement, preferred_roles, preferred_cities, preferred_radius_km,
  shift_preference, notice_period, email_visible_to, website,
  identity_verified, employment_verified, trade_verified, created_at, updated_at
from public.profiles;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.profile_handles enable row level security;
alter table public.organisations enable row level security;
alter table public.organisation_members enable row level security;
alter table public.connections enable row level security;
alter table public.follows enable row level security;
alter table public.skills enable row level security;
alter table public.profile_skills enable row level security;
alter table public.skill_verifications enable row level security;
alter table public.endorsements enable row level security;
alter table public.profile_certifications enable row level security;
alter table public.professional_experiences enable row level security;
alter table public.network_projects enable row level security;
alter table public.project_contributors enable row level security;
alter table public.project_organisations enable row level security;
alter table public.posts enable row level security;
alter table public.post_media enable row level security;
alter table public.post_reactions enable row level security;
alter table public.comments enable row level security;
alter table public.job_posts enable row level security;
alter table public.job_applications enable row level security;
alter table public.gig_posts enable row level security;
alter table public.gig_applications enable row level security;
alter table public.organisation_services enable row level security;
alter table public.organisation_credentials enable row level security;
alter table public.reviews enable row level security;
alter table public.recommendations enable row level security;
alter table public.conversations enable row level security;
alter table public.conversation_members enable row level security;
alter table public.messages enable row level security;
alter table public.notifications enable row level security;
alter table public.saved_items enable row level security;
alter table public.profile_views enable row level security;
alter table public.profile_documents enable row level security;
alter table public.verification_requests enable row level security;

-- Profiles: public can read non-sensitive columns via grants on the view + table select
-- Restrict table SELECT for anon to exclude rate columns using column grants.

grant usage on schema public to anon, authenticated;

grant select (
  id, handle, full_name, headline, about, avatar_path, cover_path,
  occupation_mode, classification, worker_passport_id, current_organisation_id,
  city, state, country, locality, languages, preferred_work_locations,
  work_preference, availability_status, willing_to_relocate, willing_to_travel,
  arrangement, preferred_roles, preferred_cities, preferred_radius_km,
  shift_preference, notice_period, email_visible_to, website,
  identity_verified, employment_verified, trade_verified, created_at, updated_at
) on public.profiles to anon, authenticated;

grant select (id, daily_rate_inr, monthly_salary_inr) on public.profiles to authenticated;

grant update (
  handle, full_name, headline, about, avatar_path, cover_path,
  occupation_mode, classification, current_organisation_id,
  city, state, country, locality, languages, preferred_work_locations,
  work_preference, availability_status, willing_to_relocate, willing_to_travel,
  arrangement, preferred_roles, preferred_cities, preferred_radius_km,
  shift_preference, notice_period, daily_rate_inr, monthly_salary_inr,
  email_visible_to, website
) on public.profiles to authenticated;

create policy "profiles_select_public_safe"
  on public.profiles for select
  using (true);

create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "profile_handles_read"
  on public.profile_handles for select using (true);

create policy "orgs_read"
  on public.organisations for select using (true);

create policy "orgs_insert_auth"
  on public.organisations for insert
  with check (auth.uid() = created_by);

create policy "orgs_update_creator"
  on public.organisations for update
  using (auth.uid() = created_by);

create policy "org_members_read_public"
  on public.organisation_members for select
  using (visibility = 'public' or profile_id = auth.uid());

create policy "connections_read_involved"
  on public.connections for select
  using (requester_id = auth.uid() or addressee_id = auth.uid());

create policy "connections_insert_self"
  on public.connections for insert
  with check (requester_id = auth.uid());

create policy "connections_update_involved"
  on public.connections for update
  using (requester_id = auth.uid() or addressee_id = auth.uid());

create policy "follows_read"
  on public.follows for select using (true);

create policy "follows_insert_self"
  on public.follows for insert with check (follower_id = auth.uid());

create policy "follows_delete_self"
  on public.follows for delete using (follower_id = auth.uid());

create policy "skills_read" on public.skills for select using (true);
create policy "profile_skills_read" on public.profile_skills for select using (true);
create policy "profile_skills_write_own"
  on public.profile_skills for all using (profile_id = auth.uid()) with check (profile_id = auth.uid());

create policy "skill_verifications_read" on public.skill_verifications for select using (true);
create policy "endorsements_read" on public.endorsements for select using (true);
create policy "endorsements_insert_self"
  on public.endorsements for insert with check (endorser_id = auth.uid());

create policy "certs_read_public"
  on public.profile_certifications for select
  using (public_visible = true or profile_id = auth.uid());

create policy "certs_write_own"
  on public.profile_certifications for all using (profile_id = auth.uid()) with check (profile_id = auth.uid());

create policy "experience_read" on public.professional_experiences for select using (true);
create policy "experience_write_own"
  on public.professional_experiences for all using (profile_id = auth.uid()) with check (profile_id = auth.uid());

create policy "projects_read" on public.network_projects for select using (true);
create policy "contributors_read_opted"
  on public.project_contributors for select
  using (opted_in = true or profile_id = auth.uid());
create policy "project_orgs_read" on public.project_organisations for select using (true);

create policy "posts_read" on public.posts for select using (true);
create policy "posts_insert_self"
  on public.posts for insert with check (author_profile_id = auth.uid());
create policy "post_media_read" on public.post_media for select using (true);
create policy "reactions_read" on public.post_reactions for select using (true);
create policy "reactions_write_self"
  on public.post_reactions for all using (profile_id = auth.uid()) with check (profile_id = auth.uid());
create policy "comments_read" on public.comments for select using (true);
create policy "comments_insert_self"
  on public.comments for insert with check (author_profile_id = auth.uid());

create policy "jobs_read" on public.job_posts for select using (true);
create policy "gigs_read" on public.gig_posts for select using (true);
create policy "job_apps_own"
  on public.job_applications for all using (profile_id = auth.uid()) with check (profile_id = auth.uid());
create policy "gig_apps_own"
  on public.gig_applications for all using (profile_id = auth.uid()) with check (profile_id = auth.uid());

create policy "services_read" on public.organisation_services for select using (true);
create policy "org_creds_read_public"
  on public.organisation_credentials for select
  using (public_visible = true);
create policy "reviews_read" on public.reviews for select using (true);
create policy "recommendations_read" on public.recommendations for select using (true);

create policy "conversations_member_read"
  on public.conversations for select
  using (
    exists (
      select 1 from public.conversation_members m
      where m.conversation_id = id and m.profile_id = auth.uid()
    )
  );

create policy "conversation_members_self"
  on public.conversation_members for select
  using (profile_id = auth.uid() or exists (
    select 1 from public.conversation_members m
    where m.conversation_id = conversation_members.conversation_id and m.profile_id = auth.uid()
  ));

create policy "messages_member_read"
  on public.messages for select
  using (
    exists (
      select 1 from public.conversation_members m
      where m.conversation_id = messages.conversation_id and m.profile_id = auth.uid()
    )
  );

create policy "messages_member_insert"
  on public.messages for insert
  with check (
    sender_id = auth.uid()
    and exists (
      select 1 from public.conversation_members m
      where m.conversation_id = conversation_id and m.profile_id = auth.uid()
    )
  );

create policy "notifications_own"
  on public.notifications for all
  using (profile_id = auth.uid()) with check (profile_id = auth.uid());

create policy "saved_own"
  on public.saved_items for all
  using (profile_id = auth.uid()) with check (profile_id = auth.uid());

create policy "profile_views_insert"
  on public.profile_views for insert
  with check (viewer_profile_id is null or viewer_profile_id = auth.uid());

create policy "profile_views_own"
  on public.profile_views for select
  using (viewed_profile_id = auth.uid());

create policy "documents_own"
  on public.profile_documents for all
  using (profile_id = auth.uid()) with check (profile_id = auth.uid());

create policy "verification_requests_own"
  on public.verification_requests for select
  using (profile_id = auth.uid());

grant select on public.public_profiles to anon, authenticated;
grant select on public.organisations, public.skills, public.profile_skills,
  public.profile_certifications, public.professional_experiences,
  public.network_projects, public.project_contributors, public.project_organisations,
  public.posts, public.post_media, public.post_reactions, public.comments,
  public.job_posts, public.gig_posts, public.organisation_services,
  public.organisation_credentials, public.reviews, public.recommendations,
  public.follows, public.skill_verifications, public.endorsements
  to anon, authenticated;

grant select, insert, update, delete on public.connections, public.follows,
  public.posts, public.post_reactions, public.comments, public.job_applications,
  public.gig_applications, public.saved_items, public.notifications,
  public.messages, public.conversation_members, public.conversations,
  public.profile_skills, public.profile_certifications, public.professional_experiences,
  public.profile_documents, public.endorsements
  to authenticated;
