-- Owner-writable profile columns added after the original column grants.
-- Without these, onboarding / privacy / notification saves fail with schema-cache errors.

alter table public.profiles
  add column if not exists onboarding_completed_at timestamptz,
  add column if not exists onboarding_step integer not null default 0,
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

alter table public.professional_experiences
  add column if not exists is_current boolean not null default false;

alter table public.evidence_items
  add column if not exists is_public boolean not null default true;

-- Public identity fields used by public_profiles (security_invoker).
grant select (
  specialisation,
  years_experience,
  industries_served,
  professional_interests,
  activity_visible_to,
  connections_visible_to,
  availability_visible_to,
  projects_visible_to,
  experience_visible_to
) on public.profiles to anon, authenticated;

-- Owner-only progress and notification preferences.
grant select (
  onboarding_step,
  onboarding_completed_at,
  notify_connections,
  notify_messages,
  notify_applications,
  notify_social,
  notify_organisation
) on public.profiles to authenticated;

grant update (
  specialisation,
  years_experience,
  industries_served,
  professional_interests,
  activity_visible_to,
  connections_visible_to,
  availability_visible_to,
  projects_visible_to,
  experience_visible_to,
  onboarding_step,
  onboarding_completed_at,
  notify_connections,
  notify_messages,
  notify_applications,
  notify_social,
  notify_organisation
) on public.profiles to authenticated;

-- Prevent self-connections at the database layer.
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'connections_no_self'
  ) then
    alter table public.connections
      add constraint connections_no_self check (requester_id <> addressee_id);
  end if;
end $$;

create or replace function public.existing_person_conversation(other_id uuid)
returns uuid
language sql
stable
security invoker
set search_path = public
as $$
  select me.conversation_id
  from public.conversation_members me
  join public.conversation_members peer on peer.conversation_id = me.conversation_id
  join public.conversations c on c.id = me.conversation_id
  where me.profile_id = auth.uid()
    and peer.profile_id = other_id
    and coalesce(c.kind, 'person') = 'person'
  limit 1;
$$;

revoke all on function public.existing_person_conversation(uuid) from public;
grant execute on function public.existing_person_conversation(uuid) to authenticated;

create or replace function public.unread_message_counts()
returns table (conversation_id uuid, unread bigint)
language sql
stable
security invoker
set search_path = public
as $$
  select m.conversation_id, count(*)::bigint as unread
  from public.messages m
  join public.conversation_members cm on cm.conversation_id = m.conversation_id
  where cm.profile_id = auth.uid()
    and m.sender_id <> auth.uid()
    and m.read_at is null
  group by m.conversation_id;
$$;

revoke all on function public.unread_message_counts() from public;
grant execute on function public.unread_message_counts() to authenticated;
