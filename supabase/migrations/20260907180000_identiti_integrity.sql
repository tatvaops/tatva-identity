-- Integrity: privacy RLS, notification prefs, search appearance attribution, media indexes.

alter table public.posts
  add column if not exists youtube_url text;

alter table public.search_appearances
  add column if not exists searcher_profile_id uuid references public.profiles (id) on delete set null;

create index if not exists search_appearances_profile_created_idx
  on public.search_appearances (profile_id, created_at desc);

create index if not exists search_appearances_searcher_idx
  on public.search_appearances (searcher_profile_id, created_at desc);

create unique index if not exists profile_views_daily_unique
  on public.profile_views (viewed_profile_id, viewer_profile_id, (created_at::date))
  where viewer_profile_id is not null;

-- ---------------------------------------------------------------------------
-- Notification delivery honours owner preferences
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
declare
  allowed boolean := true;
  prefs record;
begin
  if target is null or target = auth.uid() then
    return;
  end if;

  select
    notify_connections,
    notify_messages,
    notify_applications,
    notify_social,
    notify_organisation
  into prefs
  from public.profiles
  where id = target;

  if found then
    if kind in ('connection', 'follow') then
      allowed := prefs.notify_connections;
    elsif kind in ('message', 'enquiry') then
      allowed := prefs.notify_messages;
    elsif kind in ('application') then
      allowed := prefs.notify_applications;
    elsif kind in ('comment', 'reaction', 'recommendation', 'recommendation_request', 'mention') then
      allowed := prefs.notify_social;
    elsif kind in ('organisation', 'org_invite', 'invite') then
      allowed := prefs.notify_organisation;
    end if;
  end if;

  if not allowed then
    return;
  end if;

  insert into public.notifications (profile_id, kind, title, body, href)
  values (target, kind, title, body, href);
end;
$$;

revoke all on function public.notify_profile(uuid, text, text, text, text) from public;
grant execute on function public.notify_profile(uuid, text, text, text, text) to authenticated;

-- ---------------------------------------------------------------------------
-- Search appearances: authenticated, attributed, de-duplicated
-- ---------------------------------------------------------------------------
create or replace function public.record_search_appearances(profile_ids uuid[], search_query text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  pid uuid;
  q text;
begin
  if auth.uid() is null or profile_ids is null then
    return;
  end if;
  q := left(coalesce(search_query, ''), 120);
  foreach pid in array profile_ids[1:12]
  loop
    if pid is null or pid = auth.uid() then
      continue;
    end if;
    if exists (
      select 1
      from public.search_appearances
      where profile_id = pid
        and searcher_profile_id = auth.uid()
        and coalesce(query, '') = q
        and created_at > now() - interval '24 hours'
    ) then
      continue;
    end if;
    insert into public.search_appearances (profile_id, query, searcher_profile_id)
    values (pid, nullif(q, ''), auth.uid());
  end loop;
end;
$$;

revoke all on function public.record_search_appearances(uuid[], text) from public;
grant execute on function public.record_search_appearances(uuid[], text) to authenticated;

drop policy if exists "search_appearances_insert" on public.search_appearances;
create policy "search_appearances_insert"
  on public.search_appearances for insert
  to authenticated
  with check (searcher_profile_id = auth.uid() and searcher_profile_id is not null);

revoke insert on public.search_appearances from anon;
grant insert on public.search_appearances to authenticated;

-- ---------------------------------------------------------------------------
-- Privacy: experiences, activity, project associations, connections
-- ---------------------------------------------------------------------------
drop policy if exists "experience_read" on public.professional_experiences;
create policy "experience_read"
  on public.professional_experiences for select
  using (
    public.seed_visible('experience', id)
    and (
      profile_id = auth.uid()
      or exists (
        select 1 from public.profiles p
        where p.id = professional_experiences.profile_id
          and public.audience_allows(p.experience_visible_to, p.id)
      )
    )
  );

drop policy if exists "posts_read" on public.posts;
create policy "posts_read"
  on public.posts for select
  using (
    public.seed_visible('post', id)
    and (hidden_at is null or author_profile_id = auth.uid())
    and (
      author_profile_id is null
      or author_profile_id = auth.uid()
      or exists (
        select 1 from public.profiles p
        where p.id = posts.author_profile_id
          and public.audience_allows(p.activity_visible_to, p.id)
      )
    )
  );

drop policy if exists "contributors_read_opted" on public.project_contributors;
create policy "contributors_read_opted"
  on public.project_contributors for select
  using (
    (opted_in = true or profile_id = auth.uid())
    and public.seed_visible('contributor', id)
    and (
      profile_id = auth.uid()
      or exists (
        select 1 from public.profiles p
        where p.id = project_contributors.profile_id
          and public.audience_allows(p.projects_visible_to, p.id)
      )
    )
  );

drop policy if exists "connections_read_involved" on public.connections;
drop policy if exists "connections_read" on public.connections;
create policy "connections_read"
  on public.connections for select
  using (
    requester_id = auth.uid()
    or addressee_id = auth.uid()
    or (
      status = 'accepted'
      and (
        exists (
          select 1 from public.profiles p
          where p.id = connections.requester_id
            and public.audience_allows(p.connections_visible_to, p.id)
        )
        or exists (
          select 1 from public.profiles p
          where p.id = connections.addressee_id
            and public.audience_allows(p.connections_visible_to, p.id)
        )
      )
    )
  );

create index if not exists posts_created_idx on public.posts (created_at desc) where hidden_at is null;
create index if not exists messages_conversation_created_idx on public.messages (conversation_id, created_at desc);
create index if not exists connections_status_idx on public.connections (status, addressee_id);
