-- Security repair: conversation IDOR, GSTIN grants, application withdraw,
-- staff job/gig updates, connection accept, message body protection.

-- ---------------------------------------------------------------------------
-- GSTIN and other operator-only organisation columns
-- Table-level SELECT on organisations still included gstin for authenticated.
-- ---------------------------------------------------------------------------
revoke select on public.organisations from anon, authenticated;

grant select (
  id, slug, name, tagline, about, organisation_type, industry,
  city, state, country, locality, founded_year, team_size_label, website,
  logo_path, cover_path, public_phone, public_email, office_locality, service_areas,
  created_at, updated_at,
  passport_kind, legal_entity_name, gst_verified, kyc_verified,
  typical_value_min_inr, typical_value_max_inr, delivery_slots, design_lead_weeks, active_cities,
  design_capability, execution_capability, capability_chips, category_label, serving_regions,
  public_rate_visible, average_rating, verified_review_count, manufacturer_or_importer
) on public.organisations to anon, authenticated;

grant select (created_by) on public.organisations to authenticated;

-- ---------------------------------------------------------------------------
-- Conversations: cannot join by guessing a UUID
-- ---------------------------------------------------------------------------
drop policy if exists "conversation_members_insert_self" on public.conversation_members;
drop policy if exists "conversation_members_insert_peer" on public.conversation_members;
drop policy if exists "conversation_members_insert_first" on public.conversation_members;

create policy "conversation_members_insert_first"
  on public.conversation_members for insert
  with check (
    profile_id = auth.uid()
    and not exists (
      select 1 from public.conversation_members m
      where m.conversation_id = conversation_members.conversation_id
    )
  );

create policy "conversation_members_insert_peer"
  on public.conversation_members for insert
  with check (
    profile_id <> auth.uid()
    and exists (
      select 1 from public.conversation_members m
      where m.conversation_id = conversation_members.conversation_id
        and m.profile_id = auth.uid()
    )
    and (
      select count(*) from public.conversation_members m2
      where m2.conversation_id = conversation_members.conversation_id
    ) = 1
  );

drop policy if exists "conversations_member_update" on public.conversations;
create policy "conversations_member_update"
  on public.conversations for update
  using (
    exists (
      select 1 from public.conversation_members m
      where m.conversation_id = conversations.id and m.profile_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.conversation_members m
      where m.conversation_id = conversations.id and m.profile_id = auth.uid()
    )
  );

revoke update on public.conversations from authenticated;
grant update (
  kind, title, job_id, gig_id, organisation_id, service_id, linked_profile_id
) on public.conversations to authenticated;

revoke update on public.messages from authenticated;
grant update (read_at) on public.messages to authenticated;

-- ---------------------------------------------------------------------------
-- Atomic 1:1 conversation start (bypasses insert race, not membership IDOR)
-- ---------------------------------------------------------------------------
create or replace function public.start_direct_conversation(other_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
  existing uuid;
  new_id uuid;
  peer_name text;
begin
  if me is null then
    raise exception 'Sign in to continue.';
  end if;
  if other_id is null or other_id = me then
    raise exception 'You cannot message yourself.';
  end if;
  if exists (
    select 1 from public.profile_blocks
    where (blocker_id = me and blocked_id = other_id)
       or (blocker_id = other_id and blocked_id = me)
  ) then
    raise exception 'Messaging is not available with this person.';
  end if;
  if not exists (select 1 from public.profiles p where p.id = other_id) then
    raise exception 'That person is no longer available.';
  end if;

  select c.id into existing
  from public.conversations c
  join public.conversation_members a
    on a.conversation_id = c.id and a.profile_id = me
  join public.conversation_members b
    on b.conversation_id = c.id and b.profile_id = other_id
  where c.kind = 'person'
    and not exists (
      select 1 from public.conversation_members extra
      where extra.conversation_id = c.id
        and extra.profile_id not in (me, other_id)
    )
  limit 1;

  if existing is not null then
    return existing;
  end if;

  select full_name into peer_name from public.profiles where id = other_id;
  new_id := gen_random_uuid();
  insert into public.conversations (id, kind, title)
  values (new_id, 'person', coalesce(peer_name, 'Conversation'));
  insert into public.conversation_members (conversation_id, profile_id)
  values (new_id, me), (new_id, other_id);
  return new_id;
end;
$$;

revoke all on function public.start_direct_conversation(uuid) from public;
grant execute on function public.start_direct_conversation(uuid) to authenticated;

create or replace function public.conversation_previews(ids uuid[])
returns table (conversation_id uuid, body text, created_at timestamptz)
language sql
stable
security invoker
set search_path = public
as $$
  select distinct on (m.conversation_id)
    m.conversation_id,
    m.body,
    m.created_at
  from public.messages m
  where m.conversation_id = any(ids)
  order by m.conversation_id, m.created_at desc;
$$;

revoke all on function public.conversation_previews(uuid[]) from public;
grant execute on function public.conversation_previews(uuid[]) to authenticated;

-- ---------------------------------------------------------------------------
-- Connections: only the addressee can accept/decline
-- ---------------------------------------------------------------------------
delete from public.connections a
using public.connections b
where a.ctid < b.ctid
  and least(a.requester_id, a.addressee_id) = least(b.requester_id, b.addressee_id)
  and greatest(a.requester_id, a.addressee_id) = greatest(b.requester_id, b.addressee_id);

create unique index if not exists connections_pair_unique
  on public.connections (least(requester_id, addressee_id), greatest(requester_id, addressee_id));

drop policy if exists "connections_update_involved" on public.connections;
drop policy if exists "connections_update_addressee" on public.connections;
create policy "connections_update_addressee"
  on public.connections for update
  using (addressee_id = auth.uid())
  with check (addressee_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Applications: applicants may only withdraw; cannot apply to closed listings
-- ---------------------------------------------------------------------------
drop policy if exists "job_apps_insert_self" on public.job_applications;
create policy "job_apps_insert_self"
  on public.job_applications for insert
  with check (
    profile_id = auth.uid()
    and exists (
      select 1 from public.job_posts j
      where j.id = job_id and j.closed_at is null
    )
  );

drop policy if exists "job_apps_withdraw_self" on public.job_applications;
create policy "job_apps_withdraw_self"
  on public.job_applications for update
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid() and status = 'withdrawn');

drop policy if exists "job_apps_restore_self" on public.job_applications;
create policy "job_apps_restore_self"
  on public.job_applications for update
  using (profile_id = auth.uid() and status = 'withdrawn')
  with check (
    profile_id = auth.uid()
    and status = 'submitted'
    and exists (
      select 1 from public.job_posts j
      where j.id = job_id and j.closed_at is null
    )
  );

drop policy if exists "gig_apps_insert_self" on public.gig_applications;
create policy "gig_apps_insert_self"
  on public.gig_applications for insert
  with check (
    profile_id = auth.uid()
    and exists (
      select 1 from public.gig_posts g
      where g.id = gig_id
        and g.closed_at is null
        and (g.seats is null or g.seats > 0)
    )
  );

drop policy if exists "gig_apps_withdraw_self" on public.gig_applications;
create policy "gig_apps_withdraw_self"
  on public.gig_applications for update
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid() and status = 'withdrawn');

drop policy if exists "gig_apps_restore_self" on public.gig_applications;
create policy "gig_apps_restore_self"
  on public.gig_applications for update
  using (profile_id = auth.uid() and status = 'withdrawn')
  with check (
    profile_id = auth.uid()
    and status = 'submitted'
    and exists (
      select 1 from public.gig_posts g
      where g.id = gig_id
        and g.closed_at is null
        and (g.seats is null or g.seats > 0)
    )
  );

-- ---------------------------------------------------------------------------
-- Staff (not only creator) can update jobs/gigs and invite members
-- ---------------------------------------------------------------------------
drop policy if exists "jobs_update_creator" on public.job_posts;
drop policy if exists "jobs_update_staff" on public.job_posts;
create policy "jobs_update_staff"
  on public.job_posts for update
  using (public.is_org_staff(organisation_id));

drop policy if exists "gigs_update_creator" on public.gig_posts;
drop policy if exists "gigs_update_staff" on public.gig_posts;
create policy "gigs_update_staff"
  on public.gig_posts for update
  using (public.is_org_staff(organisation_id));

drop policy if exists "org_members_insert_creator" on public.organisation_members;
drop policy if exists "org_members_insert_staff" on public.organisation_members;
create policy "org_members_insert_staff"
  on public.organisation_members for insert
  with check (public.is_org_staff(organisation_id));

-- ---------------------------------------------------------------------------
-- Hidden organisations stay off public job/gig discovery
-- ---------------------------------------------------------------------------
drop policy if exists "jobs_read" on public.job_posts;
create policy "jobs_read"
  on public.job_posts for select
  using (
    exists (
      select 1 from public.organisations o
      where o.id = job_posts.organisation_id
        and (not o.admin_hidden or public.is_org_staff(o.id))
    )
  );

drop policy if exists "gigs_read" on public.gig_posts;
create policy "gigs_read"
  on public.gig_posts for select
  using (
    exists (
      select 1 from public.organisations o
      where o.id = gig_posts.organisation_id
        and (not o.admin_hidden or public.is_org_staff(o.id))
    )
  );

-- ---------------------------------------------------------------------------
-- Community endorsement may raise verification_level on someone else's skill
-- ---------------------------------------------------------------------------
create or replace function public.apply_community_endorsement(skill_row_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    return;
  end if;
  update public.profile_skills
  set verification_level = 'community_endorsed'
  where id = skill_row_id
    and profile_id <> auth.uid()
    and verification_level = 'self_declared'
    and exists (
      select 1 from public.endorsements e
      where e.profile_skill_id = skill_row_id
        and e.endorser_id = auth.uid()
    );
end;
$$;

revoke all on function public.apply_community_endorsement(uuid) from public;
grant execute on function public.apply_community_endorsement(uuid) to authenticated;
