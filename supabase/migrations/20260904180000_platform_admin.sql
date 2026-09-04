-- Platform operations console. Does not create Vertex tables.
-- Bootstrap the first operator in SQL or via PLATFORM_ADMIN_HANDLES on the app server.

create table if not exists public.platform_admins (
  profile_id uuid primary key references public.profiles (id) on delete cascade,
  granted_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.content_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid references public.profiles (id) on delete set null,
  entity_kind text not null,
  entity_id uuid not null,
  reason text,
  status text not null default 'open' check (status in ('open', 'actioned', 'dismissed')),
  created_at timestamptz not null default now()
);

alter table public.profiles
  add column if not exists admin_hidden boolean not null default false;

alter table public.organisations
  add column if not exists admin_hidden boolean not null default false;

alter table public.posts
  add column if not exists hidden_at timestamptz;

alter table public.verification_requests
  add column if not exists reviewer_note text,
  add column if not exists reviewed_at timestamptz,
  add column if not exists reviewed_by uuid references public.profiles (id) on delete set null;

create or replace function public.is_platform_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.platform_admins a
    where a.profile_id = auth.uid()
  );
$$;

grant execute on function public.is_platform_admin() to authenticated, anon;

alter table public.platform_admins enable row level security;
alter table public.content_reports enable row level security;

drop policy if exists "platform_admins_self" on public.platform_admins;
create policy "platform_admins_self"
  on public.platform_admins for select
  using (profile_id = auth.uid());

drop policy if exists "content_reports_insert_self" on public.content_reports;
create policy "content_reports_insert_self"
  on public.content_reports for insert
  with check (reporter_id = auth.uid());

drop policy if exists "content_reports_own" on public.content_reports;
create policy "content_reports_own"
  on public.content_reports for select
  using (reporter_id = auth.uid());

grant select on public.platform_admins to authenticated;
grant insert on public.content_reports to authenticated;
grant select on public.content_reports to authenticated;

-- Public reads hide operator-held rows. Owners can still see their own profile.
drop policy if exists "profiles_select_public_safe" on public.profiles;
create policy "profiles_select_public_safe"
  on public.profiles for select
  using (
    public.seed_visible('profile', id)
    and (not admin_hidden or id = auth.uid())
  );

drop policy if exists "orgs_read" on public.organisations;
create policy "orgs_read"
  on public.organisations for select
  using (
    public.seed_visible('organisation', id)
    and (not admin_hidden or created_by = auth.uid())
  );

drop policy if exists "posts_read" on public.posts;
create policy "posts_read"
  on public.posts for select
  using (
    public.seed_visible('post', id)
    and (hidden_at is null or author_profile_id = auth.uid())
  );

create index if not exists verification_requests_status_idx
  on public.verification_requests (status, created_at desc);
create index if not exists content_reports_status_idx
  on public.content_reports (status, created_at desc);
create index if not exists platform_admins_granted_idx
  on public.platform_admins (created_at desc);

create unique index if not exists content_reports_open_unique
  on public.content_reports (reporter_id, entity_kind, entity_id)
  where status = 'open';
