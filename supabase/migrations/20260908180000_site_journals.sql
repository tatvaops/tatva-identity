-- Site journals: weekly construction execution diaries.
-- Separate from network_projects (verified project identity). Vertex stays disconnected.

create table public.site_journals (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null check (char_length(title) between 1 and 300),
  description text check (description is null or char_length(description) <= 10000),
  cover_media text,
  project_type text,
  city text,
  region text,
  budget_range text,
  timeline_start_date date not null,
  status text not null default 'draft'
    check (status in ('draft', 'pending_review', 'published', 'archived')),
  health_status text not null default 'stable'
    check (health_status in ('stable', 'watch_procurement', 'delay_risk', 'stabilized')),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  tags text[] not null default '{}',
  visibility text not null default 'public'
    check (visibility in ('public', 'unlisted', 'private')),
  ai_summary text,
  featured boolean not null default false,
  moderation_status text not null default 'clean'
    check (moderation_status in ('clean', 'flagged', 'restricted')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger site_journals_updated_at
before update on public.site_journals
for each row execute function public.set_updated_at();

create table public.site_journal_contributors (
  journal_id uuid not null references public.site_journals (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  role text,
  badge text,
  created_at timestamptz not null default now(),
  primary key (journal_id, profile_id)
);

create table public.site_journal_entries (
  id uuid primary key default gen_random_uuid(),
  journal_id uuid not null references public.site_journals (id) on delete cascade,
  week_number integer not null check (week_number between 1 and 500),
  entry_type text not null,
  title text not null check (char_length(title) between 1 and 300),
  content text not null check (char_length(content) between 1 and 20000),
  media jsonb not null default '[]'::jsonb,
  location_city text,
  location_region text,
  location_area text,
  risk_level text not null default 'low'
    check (risk_level in ('low', 'medium', 'high')),
  tags text[] not null default '{}',
  ai_insight text,
  related_discussion_ids text[] not null default '{}',
  created_by uuid not null references public.profiles (id) on delete cascade,
  moderation_status text not null default 'clean'
    check (moderation_status in ('clean', 'flagged', 'restricted')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger site_journal_entries_updated_at
before update on public.site_journal_entries
for each row execute function public.set_updated_at();

create table public.site_journal_field_notes (
  id uuid primary key default gen_random_uuid(),
  entry_id uuid not null references public.site_journal_entries (id) on delete cascade,
  parent_id uuid references public.site_journal_field_notes (id) on delete cascade,
  author_id uuid not null references public.profiles (id) on delete cascade,
  content text not null check (char_length(content) between 1 and 2000),
  deleted_at timestamptz,
  created_at timestamptz not null default now()
);

create index site_journals_owner_idx on public.site_journals (owner_id, created_at desc);
create index site_journals_public_idx on public.site_journals (status, visibility, city);
create index site_journal_entries_journal_idx on public.site_journal_entries (journal_id, week_number desc, created_at desc);
create index site_journal_field_notes_entry_idx on public.site_journal_field_notes (entry_id, created_at);

create or replace function public.is_site_journal_contributor(jid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.site_journals j
    where j.id = jid and j.owner_id = auth.uid()
  ) or exists (
    select 1 from public.site_journal_contributors c
    where c.journal_id = jid and c.profile_id = auth.uid()
  );
$$;

create or replace function public.site_journal_is_readable(jid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.site_journals j
    where j.id = jid
      and (
        public.is_site_journal_contributor(j.id)
        or (
          j.status = 'published'
          and j.visibility in ('public', 'unlisted')
          and j.moderation_status <> 'restricted'
        )
      )
  );
$$;

revoke all on function public.is_site_journal_contributor(uuid) from public;
revoke all on function public.site_journal_is_readable(uuid) from public;
grant execute on function public.is_site_journal_contributor(uuid) to authenticated, anon;
grant execute on function public.site_journal_is_readable(uuid) to authenticated, anon;

alter table public.site_journals enable row level security;
alter table public.site_journal_contributors enable row level security;
alter table public.site_journal_entries enable row level security;
alter table public.site_journal_field_notes enable row level security;

create policy "site_journals_select"
  on public.site_journals for select
  using (
    owner_id = auth.uid()
    or exists (
      select 1 from public.site_journal_contributors c
      where c.journal_id = site_journals.id and c.profile_id = auth.uid()
    )
    or (
      status = 'published'
      and visibility in ('public', 'unlisted')
      and moderation_status <> 'restricted'
    )
  );

create policy "site_journals_insert"
  on public.site_journals for insert
  with check (owner_id = auth.uid() and status = 'draft');

create policy "site_journals_update_owner"
  on public.site_journals for update
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid() and status in ('draft', 'pending_review'));

create policy "site_journal_contributors_select"
  on public.site_journal_contributors for select
  using (public.site_journal_is_readable(journal_id));

create policy "site_journal_contributors_insert"
  on public.site_journal_contributors for insert
  with check (public.is_site_journal_contributor(journal_id));

create policy "site_journal_entries_select"
  on public.site_journal_entries for select
  using (public.site_journal_is_readable(journal_id) and moderation_status <> 'restricted');

create policy "site_journal_entries_insert"
  on public.site_journal_entries for insert
  with check (created_by = auth.uid() and public.is_site_journal_contributor(journal_id));

create policy "site_journal_notes_select"
  on public.site_journal_field_notes for select
  using (
    exists (
      select 1 from public.site_journal_entries e
      where e.id = entry_id and public.site_journal_is_readable(e.journal_id)
    )
  );

create policy "site_journal_notes_insert"
  on public.site_journal_field_notes for insert
  with check (
    author_id = auth.uid()
    and exists (
      select 1 from public.site_journal_entries e
      where e.id = entry_id and public.site_journal_is_readable(e.journal_id)
    )
  );

create policy "site_journal_notes_update_own"
  on public.site_journal_field_notes for update
  using (author_id = auth.uid())
  with check (author_id = auth.uid());

grant select on public.site_journals, public.site_journal_contributors, public.site_journal_entries, public.site_journal_field_notes
  to anon, authenticated;
grant insert, update on public.site_journals to authenticated;
grant insert on public.site_journal_contributors, public.site_journal_entries, public.site_journal_field_notes to authenticated;
grant update on public.site_journal_field_notes to authenticated;
