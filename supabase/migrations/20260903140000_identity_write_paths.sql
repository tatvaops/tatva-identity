-- Remaining Identity write paths. Vertex operational tables are still not created.

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

create policy "conversations_insert_auth"
  on public.conversations for insert
  with check (auth.uid() is not null);

create policy "conversation_members_insert_self"
  on public.conversation_members for insert
  with check (profile_id = auth.uid());

create policy "conversation_members_insert_peer"
  on public.conversation_members for insert
  with check (
    exists (
      select 1 from public.conversation_members m
      where m.conversation_id = conversation_id and m.profile_id = auth.uid()
    )
  );

create policy "org_members_insert_creator"
  on public.organisation_members for insert
  with check (public.is_org_creator(organisation_id));

create policy "services_write_creator"
  on public.organisation_services for all
  using (public.is_org_creator(organisation_id))
  with check (public.is_org_creator(organisation_id));

create policy "org_creds_write_creator"
  on public.organisation_credentials for all
  using (public.is_org_creator(organisation_id))
  with check (public.is_org_creator(organisation_id));

create policy "jobs_write_creator"
  on public.job_posts for insert
  with check (
    public.is_org_creator(organisation_id)
    and (recruiter_profile_id is null or recruiter_profile_id = auth.uid())
  );

create policy "gigs_write_creator"
  on public.gig_posts for insert
  with check (public.is_org_creator(organisation_id));

create policy "job_apps_recruiter_read"
  on public.job_applications for select
  using (
    exists (
      select 1 from public.job_posts j
      where j.id = job_id and public.is_org_creator(j.organisation_id)
    )
  );

create policy "job_apps_recruiter_update"
  on public.job_applications for update
  using (
    exists (
      select 1 from public.job_posts j
      where j.id = job_id and public.is_org_creator(j.organisation_id)
    )
  );

drop policy if exists "job_apps_own" on public.job_applications;
create policy "job_apps_insert_self"
  on public.job_applications for insert
  with check (profile_id = auth.uid());
create policy "job_apps_select_self"
  on public.job_applications for select
  using (profile_id = auth.uid());

create policy "gig_apps_recruiter_read"
  on public.gig_applications for select
  using (
    exists (
      select 1 from public.gig_posts g
      where g.id = gig_id and public.is_org_creator(g.organisation_id)
    )
  );

create policy "gig_apps_recruiter_update"
  on public.gig_applications for update
  using (
    exists (
      select 1 from public.gig_posts g
      where g.id = gig_id and public.is_org_creator(g.organisation_id)
    )
  );

drop policy if exists "gig_apps_own" on public.gig_applications;
create policy "gig_apps_insert_self"
  on public.gig_applications for insert
  with check (profile_id = auth.uid());
create policy "gig_apps_select_self"
  on public.gig_applications for select
  using (profile_id = auth.uid());

create policy "recommendations_insert_self"
  on public.recommendations for insert
  with check (from_profile_id = auth.uid() and from_profile_id <> to_profile_id);

grant select on public.organisation_members to anon, authenticated;
grant insert, update on public.organisations to authenticated;
grant insert, update, delete on public.organisation_members to authenticated;
grant insert, update, delete on public.organisation_services to authenticated;
grant insert, update, delete on public.organisation_credentials to authenticated;
grant insert on public.job_posts, public.gig_posts to authenticated;
grant insert on public.recommendations to authenticated;
grant select, insert on public.profile_views to authenticated;
grant select, update on public.job_applications, public.gig_applications to authenticated;
