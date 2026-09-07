-- Owner writes for claimed evidence, staff application access, and feed media.

grant insert, update, delete on public.work_portfolio_items, public.skill_passport_facts to authenticated;

drop policy if exists "identiti_portfolio_owner_insert" on public.work_portfolio_items;
create policy "identiti_portfolio_owner_insert"
  on public.work_portfolio_items for insert
  with check (
    profile_id = auth.uid()
    and supervisor_verified = false
    and brand_verified = false
  );

drop policy if exists "identiti_portfolio_owner_update" on public.work_portfolio_items;
create policy "identiti_portfolio_owner_update"
  on public.work_portfolio_items for update
  using (profile_id = auth.uid())
  with check (
    profile_id = auth.uid()
    and supervisor_verified = false
    and brand_verified = false
  );

drop policy if exists "identiti_portfolio_owner_delete" on public.work_portfolio_items;
create policy "identiti_portfolio_owner_delete"
  on public.work_portfolio_items for delete
  using (profile_id = auth.uid());

drop policy if exists "identiti_skill_facts_owner_insert" on public.skill_passport_facts;
create policy "identiti_skill_facts_owner_insert"
  on public.skill_passport_facts for insert
  with check (profile_id = auth.uid() and verified_projects = 0);

drop policy if exists "identiti_skill_facts_owner_update" on public.skill_passport_facts;
create policy "identiti_skill_facts_owner_update"
  on public.skill_passport_facts for update
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid() and verified_projects = 0);

drop policy if exists "identiti_skill_facts_owner_delete" on public.skill_passport_facts;
create policy "identiti_skill_facts_owner_delete"
  on public.skill_passport_facts for delete
  using (profile_id = auth.uid());

drop policy if exists "post_media_author_insert" on public.post_media;
create policy "post_media_author_insert"
  on public.post_media for insert
  with check (
    exists (
      select 1 from public.posts p
      where p.id = post_id and p.author_profile_id = auth.uid()
    )
  );

drop policy if exists "orgs_update_staff" on public.organisations;
create policy "orgs_update_staff"
  on public.organisations for update
  using (public.is_org_staff(id));

drop policy if exists "job_apps_recruiter_read" on public.job_applications;
create policy "job_apps_recruiter_read"
  on public.job_applications for select
  using (
    exists (
      select 1 from public.job_posts j
      where j.id = job_id and public.is_org_staff(j.organisation_id)
    )
  );

drop policy if exists "job_apps_recruiter_update" on public.job_applications;
create policy "job_apps_recruiter_update"
  on public.job_applications for update
  using (
    exists (
      select 1 from public.job_posts j
      where j.id = job_id and public.is_org_staff(j.organisation_id)
    )
  );

drop policy if exists "gig_apps_recruiter_read" on public.gig_applications;
create policy "gig_apps_recruiter_read"
  on public.gig_applications for select
  using (
    exists (
      select 1 from public.gig_posts g
      where g.id = gig_id and public.is_org_staff(g.organisation_id)
    )
  );

drop policy if exists "gig_apps_recruiter_update" on public.gig_applications;
create policy "gig_apps_recruiter_update"
  on public.gig_applications for update
  using (
    exists (
      select 1 from public.gig_posts g
      where g.id = gig_id and public.is_org_staff(g.organisation_id)
    )
  );

drop policy if exists "services_write_staff" on public.organisation_services;
create policy "services_write_staff"
  on public.organisation_services for all
  using (public.is_org_staff(organisation_id))
  with check (public.is_org_staff(organisation_id));

drop policy if exists "org_creds_write_staff" on public.organisation_credentials;
create policy "org_creds_write_staff"
  on public.organisation_credentials for all
  using (public.is_org_staff(organisation_id))
  with check (public.is_org_staff(organisation_id));
