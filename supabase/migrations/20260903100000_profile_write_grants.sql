-- Allow authenticated professionals to add skills and opted-in public projects.
-- Catalog rows are names only. Project files and Vertex sites are not created here.

create policy "skills_insert_auth"
  on public.skills for insert
  with check (auth.uid() is not null);

grant insert on public.skills to authenticated;

create policy "projects_insert_auth"
  on public.network_projects for insert
  with check (auth.uid() is not null);

create policy "contributors_write_own"
  on public.project_contributors for insert
  with check (profile_id = auth.uid());

create policy "contributors_update_own"
  on public.project_contributors for update
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

grant insert, update on public.network_projects, public.project_contributors to authenticated;
