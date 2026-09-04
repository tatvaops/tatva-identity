-- Demonstration network. Re-runnable.
-- Hide:  update public.platform_settings set seed_data_enabled = false;
-- Show:  update public.platform_settings set seed_data_enabled = true;
-- Delete: select public.unseed_platform();

create or replace function public.seed_auth_user(uid uuid, email text, full_name text)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, email_change, email_change_token_new, recovery_token
  ) values (
    '00000000-0000-0000-0000-000000000000',
    uid,
    'authenticated',
    'authenticated',
    email,
    crypt('SeedLogin-demo-only', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('full_name', full_name, 'auth_provider', 'seed'),
    now() - interval '40 days',
    now(),
    '', '', '', ''
  ) on conflict (id) do nothing;

  if not exists (select 1 from auth.identities where user_id = uid and provider = 'email') then
    insert into auth.identities (
      id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
    ) values (
      uid,
      uid,
      jsonb_build_object('sub', uid::text, 'email', email),
      'email',
      uid::text,
      now(), now(), now()
    );
  end if;
end;
$$;

create or replace function public.seed_demo_data()
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  p1 uuid := 'a0000000-0000-4000-8000-000000000001';
  p2 uuid := 'a0000000-0000-4000-8000-000000000002';
  p3 uuid := 'a0000000-0000-4000-8000-000000000003';
  p4 uuid := 'a0000000-0000-4000-8000-000000000004';
  p5 uuid := 'a0000000-0000-4000-8000-000000000005';
  p6 uuid := 'a0000000-0000-4000-8000-000000000006';
  p7 uuid := 'a0000000-0000-4000-8000-000000000007';
  p8 uuid := 'a0000000-0000-4000-8000-000000000008';
  p9 uuid := 'a0000000-0000-4000-8000-000000000009';
  p10 uuid := 'a0000000-0000-4000-8000-000000000010';
  o1 uuid := 'b0000000-0000-4000-8000-000000000001';
  o2 uuid := 'b0000000-0000-4000-8000-000000000002';
  o3 uuid := 'b0000000-0000-4000-8000-000000000003';
  o4 uuid := 'b0000000-0000-4000-8000-000000000004';
  o5 uuid := 'b0000000-0000-4000-8000-000000000005';
  o6 uuid := 'b0000000-0000-4000-8000-000000000006';
  pr1 uuid := 'c0000000-0000-4000-8000-000000000001';
  pr2 uuid := 'c0000000-0000-4000-8000-000000000002';
  pr3 uuid := 'c0000000-0000-4000-8000-000000000003';
  pr4 uuid := 'c0000000-0000-4000-8000-000000000004';
  s1 uuid := 'd0000000-0000-4000-8000-000000000001';
  s2 uuid := 'd0000000-0000-4000-8000-000000000002';
  s3 uuid := 'd0000000-0000-4000-8000-000000000003';
  s4 uuid := 'd0000000-0000-4000-8000-000000000004';
  s5 uuid := 'd0000000-0000-4000-8000-000000000005';
  s6 uuid := 'd0000000-0000-4000-8000-000000000006';
  s7 uuid := 'd0000000-0000-4000-8000-000000000007';
  s8 uuid := 'd0000000-0000-4000-8000-000000000008';
  s9 uuid := 'd0000000-0000-4000-8000-000000000009';
  s10 uuid := 'd0000000-0000-4000-8000-000000000010';
  s11 uuid := 'd0000000-0000-4000-8000-000000000011';
  s12 uuid := 'd0000000-0000-4000-8000-000000000012';
  post1 uuid := 'e0000000-0000-4000-8000-000000000001';
  post2 uuid := 'e0000000-0000-4000-8000-000000000002';
  post3 uuid := 'e0000000-0000-4000-8000-000000000003';
  post4 uuid := 'e0000000-0000-4000-8000-000000000004';
  post5 uuid := 'e0000000-0000-4000-8000-000000000005';
  post6 uuid := 'e0000000-0000-4000-8000-000000000006';
  post7 uuid := 'e0000000-0000-4000-8000-000000000007';
  post8 uuid := 'e0000000-0000-4000-8000-000000000008';
  job1 uuid := 'f0000000-0000-4000-8000-000000000001';
  job2 uuid := 'f0000000-0000-4000-8000-000000000002';
  job3 uuid := 'f0000000-0000-4000-8000-000000000003';
  job4 uuid := 'f0000000-0000-4000-8000-000000000004';
  job5 uuid := 'f0000000-0000-4000-8000-000000000005';
  gig1 uuid := 'aa000000-0000-4000-8000-000000000001';
  gig2 uuid := 'aa000000-0000-4000-8000-000000000002';
  gig3 uuid := 'aa000000-0000-4000-8000-000000000003';
  gig4 uuid := 'aa000000-0000-4000-8000-000000000004';
  conv1 uuid := 'bb000000-0000-4000-8000-000000000001';
begin
  perform public.unseed_platform();
  update public.platform_settings set seed_data_enabled = true, updated_at = now() where id = 1;

  perform public.seed_auth_user(p1, 'seed-ananya@tatva.example', 'Ananya Iyer');
  perform public.seed_auth_user(p2, 'seed-rohan@tatva.example', 'Rohan Mehta');
  perform public.seed_auth_user(p3, 'seed-fatima@tatva.example', 'Fatima Sheikh');
  perform public.seed_auth_user(p4, 'seed-vikram@tatva.example', 'Vikram Rao');
  perform public.seed_auth_user(p5, 'seed-meera@tatva.example', 'Meera Nair');
  perform public.seed_auth_user(p6, 'seed-arjun@tatva.example', 'Arjun Patel');
  perform public.seed_auth_user(p7, 'seed-sana@tatva.example', 'Sana Qureshi');
  perform public.seed_auth_user(p8, 'seed-kabir@tatva.example', 'Kabir Singh');
  perform public.seed_auth_user(p9, 'seed-lakshmi@tatva.example', 'Lakshmi Reddy');
  perform public.seed_auth_user(p10, 'seed-priya@tatva.example', 'Priya Sharma');

  perform public.mark_seed('profile', p1);
  perform public.mark_seed('profile', p2);
  perform public.mark_seed('profile', p3);
  perform public.mark_seed('profile', p4);
  perform public.mark_seed('profile', p5);
  perform public.mark_seed('profile', p6);
  perform public.mark_seed('profile', p7);
  perform public.mark_seed('profile', p8);
  perform public.mark_seed('profile', p9);
  perform public.mark_seed('profile', p10);

  insert into public.organisations (id, slug, name, tagline, about, organisation_type, industry, city, state, locality, founded_year, team_size_label, website, created_by)
  values
    (o1, 'meridian-axis', 'Meridian Axis Infra', 'Campus and transit development', 'Developer for mixed-use campuses and metro-adjacent work. Demonstration organisation.', 'developer', 'Infrastructure', 'Bengaluru', 'Karnataka', 'Whitefield', 2009, '200-500', 'https://example.invalid/meridian-axis', p1),
    (o2, 'coastal-grid', 'Coastal Grid Erectors', 'Structural steel and facade', 'Subcontractor for erection, decking and facade access. Demonstration organisation.', 'subcontractor', 'Construction', 'Mumbai', 'Maharashtra', 'Navi Mumbai', 2014, '50-200', 'https://example.invalid/coastal-grid', p2),
    (o3, 'lumen-atelier', 'Lumen Atelier', 'Architecture and workplace', 'Design studio for interiors and workplace programmes. Demonstration organisation.', 'consultancy', 'Design', 'Pune', 'Maharashtra', 'Kalyani Nagar', 2016, '20-50', 'https://example.invalid/lumen-atelier', p4),
    (o4, 'narmada-crew', 'Narmada Crew Staffing', 'Skilled crews for industrial sites', 'Staffing partner for welding, electrical and HSE crews. Demonstration organisation.', 'staffing_agency', 'Staffing', 'Ahmedabad', 'Gujarat', 'Naroda', 2011, '50-200', 'https://example.invalid/narmada-crew', p6),
    (o5, 'dakshin-ops', 'Dakshin Operations', 'Facilities and shift services', 'Operations partner for campuses and plants. Demonstration organisation.', 'service_provider', 'Facilities', 'Chennai', 'Tamil Nadu', 'Guindy', 2013, '200-500', 'https://example.invalid/dakshin-ops', p5),
    (o6, 'sahyadri-components', 'Sahyadri Components', 'Prefabricated building systems', 'Manufacturer of modular components for site assembly. Demonstration organisation.', 'manufacturer', 'Manufacturing', 'Pune', 'Maharashtra', 'Chakan', 2007, '200-500', 'https://example.invalid/sahyadri-components', p8)
  on conflict (id) do nothing;
  perform public.mark_seed('organisation', o1);
  perform public.mark_seed('organisation', o2);
  perform public.mark_seed('organisation', o3);
  perform public.mark_seed('organisation', o4);
  perform public.mark_seed('organisation', o5);
  perform public.mark_seed('organisation', o6);

  update public.profiles set
    handle = 'seed-ananya', full_name = 'Ananya Iyer',
    headline = 'Product designer for workplace and identity tools',
    about = 'Designs hiring and identity flows for professional networks. Demonstration profile — not a real person.',
    occupation_mode = 'white_collar', current_organisation_id = o1, city = 'Bengaluru', state = 'Karnataka', locality = 'Indiranagar',
    languages = array['English','Kannada','Hindi'], preferred_work_locations = array['Bengaluru','Hyderabad'],
    availability_status = 'open_to_opportunities', willing_to_relocate = false, willing_to_travel = true,
    arrangement = 'hybrid', preferred_roles = array['Product designer','Design lead'],
    identity_verified = true, employment_verified = true
  where id = p1;
  update public.profiles set
    handle = 'seed-rohan', full_name = 'Rohan Mehta',
    headline = 'Civil site engineer — transit and commercial frames',
    about = 'Runs site coordination for steel and RCC packages. Demonstration profile — not a real person.',
    occupation_mode = 'white_collar', classification = 'regular_employee', current_organisation_id = o2,
    city = 'Mumbai', state = 'Maharashtra', locality = 'Vashi',
    languages = array['English','Marathi','Hindi'], preferred_work_locations = array['Mumbai','Pune'],
    availability_status = 'engaged', willing_to_relocate = false, willing_to_travel = true,
    arrangement = 'on_site', preferred_roles = array['Site engineer'],
    identity_verified = true, employment_verified = true
  where id = p2;
  update public.profiles set
    handle = 'seed-fatima', full_name = 'Fatima Sheikh',
    headline = 'Electrical supervisor for industrial and campus work',
    about = 'Leads licensed electrical crews on occupied campuses. Demonstration profile — not a real person.',
    occupation_mode = 'blue_collar', classification = 'regular_employee', current_organisation_id = o5,
    city = 'Hyderabad', state = 'Telangana', locality = 'HITEC City',
    languages = array['English','Hindi','Telugu'], preferred_work_locations = array['Hyderabad','Bengaluru'],
    availability_status = 'open_to_gigs', willing_to_relocate = true, willing_to_travel = true,
    arrangement = 'on_site', preferred_roles = array['Electrical supervisor'],
    identity_verified = true, trade_verified = true, employment_verified = true
  where id = p3;
  update public.profiles set
    handle = 'seed-vikram', full_name = 'Vikram Rao',
    headline = 'Independent architect — interiors and adaptive reuse',
    about = 'Takes scoped architecture and workplace redesign. Demonstration profile — not a real person.',
    occupation_mode = 'freelancer', current_organisation_id = o3, city = 'Pune', state = 'Maharashtra', locality = 'Kothrud',
    languages = array['English','Marathi'], preferred_work_locations = array['Pune','Mumbai'],
    availability_status = 'open_to_jobs', willing_to_relocate = false, willing_to_travel = true,
    arrangement = 'hybrid', preferred_roles = array['Architect'],
    identity_verified = true
  where id = p4;
  update public.profiles set
    handle = 'seed-meera', full_name = 'Meera Nair',
    headline = 'Talent partner for operations and skilled trades',
    about = 'Recruits supervisors and campus operations roles. Demonstration profile — not a real person.',
    occupation_mode = 'white_collar', current_organisation_id = o5, city = 'Chennai', state = 'Tamil Nadu', locality = 'Adyar',
    languages = array['English','Tamil','Malayalam'], preferred_work_locations = array['Chennai'],
    availability_status = 'not_looking', arrangement = 'hybrid', preferred_roles = array['Talent partner'],
    identity_verified = true, employment_verified = true
  where id = p5;
  update public.profiles set
    handle = 'seed-arjun', full_name = 'Arjun Patel',
    headline = 'Structural welder — available for industrial shifts',
    about = 'Certified structural welder for plant and commercial frames. Demonstration profile — not a real person.',
    occupation_mode = 'blue_collar', classification = 'gig_spot_worker', current_organisation_id = o4,
    city = 'Ahmedabad', state = 'Gujarat', locality = 'Naroda',
    languages = array['Gujarati','Hindi','English'], preferred_work_locations = array['Ahmedabad','Surat','Vadodara'],
    availability_status = 'available_immediately', willing_to_relocate = true, willing_to_travel = true,
    arrangement = 'on_site', preferred_roles = array['Welder'], shift_preference = 'rotating',
    identity_verified = true, trade_verified = true
  where id = p6;
  update public.profiles set
    handle = 'seed-sana', full_name = 'Sana Qureshi',
    headline = 'Interior contractor for office fit-outs',
    about = 'Runs small contractor teams for interiors. Demonstration profile — not a real person.',
    occupation_mode = 'contractor', classification = 'vendor_subcontractor_gang', current_organisation_id = o3,
    city = 'Delhi', state = 'Delhi', locality = 'Okhla',
    languages = array['Hindi','English','Urdu'], preferred_work_locations = array['Delhi','Noida','Gurugram'],
    availability_status = 'open_to_opportunities', willing_to_relocate = false, willing_to_travel = true,
    arrangement = 'on_site', preferred_roles = array['Interior contractor'],
    identity_verified = true, employment_verified = true
  where id = p7;
  update public.profiles set
    handle = 'seed-kabir', full_name = 'Kabir Singh',
    headline = 'Project controls lead — schedule and cost',
    about = 'Owns look-ahead planning for multi-contractor sites. Demonstration profile — not a real person.',
    occupation_mode = 'white_collar', current_organisation_id = o1, city = 'Noida', state = 'Uttar Pradesh', locality = 'Sector 62',
    languages = array['English','Hindi','Punjabi'], preferred_work_locations = array['Noida','Delhi'],
    availability_status = 'engaged', arrangement = 'on_site', preferred_roles = array['Project controls'],
    identity_verified = true, employment_verified = true
  where id = p8;
  update public.profiles set
    handle = 'seed-lakshmi', full_name = 'Lakshmi Reddy',
    headline = 'HSE officer for plant and campus work',
    about = 'Safety officer for occupied sites. Demonstration profile — not a real person.',
    occupation_mode = 'blue_collar', classification = 'regular_employee', current_organisation_id = o4,
    city = 'Visakhapatnam', state = 'Andhra Pradesh', locality = 'Gajuwaka',
    languages = array['Telugu','English','Hindi'], preferred_work_locations = array['Visakhapatnam','Hyderabad'],
    availability_status = 'open_to_jobs', willing_to_relocate = true, arrangement = 'on_site',
    preferred_roles = array['HSE officer'], identity_verified = true, trade_verified = true
  where id = p9;
  update public.profiles set
    handle = 'seed-priya', full_name = 'Priya Sharma',
    headline = 'Workplace researcher and content lead',
    about = 'Documents how teams actually work on site and in offices. Demonstration profile — not a real person.',
    occupation_mode = 'freelancer', city = 'Jaipur', state = 'Rajasthan', locality = 'Malviya Nagar',
    languages = array['Hindi','English'], preferred_work_locations = array['Jaipur','Remote'],
    availability_status = 'open_to_opportunities', arrangement = 'remote', preferred_roles = array['Researcher'],
    identity_verified = true
  where id = p10;

  insert into public.organisation_members (organisation_id, profile_id, role_title, department, member_kind, visibility)
  values
    (o1, p1, 'Design lead', 'Product', 'leadership', 'public'),
    (o1, p8, 'Project controls', 'Delivery', 'employee', 'public'),
    (o2, p2, 'Site engineer', 'Projects', 'employee', 'public'),
    (o3, p4, 'Principal', 'Studio', 'leadership', 'public'),
    (o3, p7, 'Fit-out contractor', 'Delivery', 'contract_professional', 'public'),
    (o4, p6, 'Welder', 'Crew', 'associated_skilled_worker', 'public'),
    (o4, p9, 'HSE officer', 'Safety', 'employee', 'public'),
    (o5, p3, 'Electrical supervisor', 'Operations', 'employee', 'public'),
    (o5, p5, 'Talent partner', 'People', 'leadership', 'public')
  on conflict do nothing;
  insert into public.seed_manifest (entity_kind, entity_id)
  select 'org_member', id from public.organisation_members where organisation_id in (o1,o2,o3,o4,o5,o6);

  insert into public.skills (id, name, category) values
    (s1, 'Product design', 'design'),
    (s2, 'Site engineering', 'construction'),
    (s3, 'Electrical supervision', 'trades'),
    (s4, 'Architecture', 'design'),
    (s5, 'Talent acquisition', 'people'),
    (s6, 'Structural welding', 'trades'),
    (s7, 'Interior contracting', 'construction'),
    (s8, 'Project controls', 'delivery'),
    (s9, 'HSE', 'safety'),
    (s10, 'Workplace research', 'research'),
    (s11, 'Revit', 'software'),
    (s12, 'Bar bending schedule', 'construction')
  on conflict (id) do nothing;
  perform public.mark_seed('skill', s1); perform public.mark_seed('skill', s2); perform public.mark_seed('skill', s3);
  perform public.mark_seed('skill', s4); perform public.mark_seed('skill', s5); perform public.mark_seed('skill', s6);
  perform public.mark_seed('skill', s7); perform public.mark_seed('skill', s8); perform public.mark_seed('skill', s9);
  perform public.mark_seed('skill', s10); perform public.mark_seed('skill', s11); perform public.mark_seed('skill', s12);

  insert into public.profile_skills (profile_id, skill_id, verification_level, rating) values
    (p1, s1, 'employer_verified', 5),
    (p2, s2, 'employer_verified', 5),
    (p3, s3, 'tatva_verified', 5),
    (p4, s4, 'certification_verified', 5),
    (p4, s11, 'self_declared', 4),
    (p5, s5, 'employer_verified', 4),
    (p6, s6, 'tatva_verified', 5),
    (p7, s7, 'community_endorsed', 4),
    (p8, s8, 'employer_verified', 5),
    (p9, s9, 'certification_verified', 5),
    (p10, s10, 'self_declared', 4),
    (p2, s12, 'employer_verified', 4)
  on conflict do nothing;
  insert into public.seed_manifest (entity_kind, entity_id)
  select 'profile_skill', id from public.profile_skills where profile_id in (p1,p2,p3,p4,p5,p6,p7,p8,p9,p10);

  insert into public.endorsements (profile_skill_id, endorser_id)
  select ps.id, p8 from public.profile_skills ps where ps.profile_id = p1 and ps.skill_id = s1
  on conflict do nothing;
  insert into public.seed_manifest (entity_kind, entity_id)
  select 'endorsement', id from public.endorsements where endorser_id in (p1,p2,p3,p4,p5,p6,p7,p8,p9,p10);

  insert into public.profile_certifications (profile_id, name, issuer, issue_date, category, verification_state, public_visible)
  values
    (p3, 'Supervisory electrical competency', 'State licensing board (demo)', '2022-03-01', 'licence', 'verified', true),
    (p6, 'Structural welding qualification', 'Industrial training institute (demo)', '2021-11-12', 'safety', 'verified', true),
    (p9, 'NEBOSH General Certificate (demo label)', 'Training partner (demo)', '2023-06-20', 'safety', 'verified', true),
    (p4, 'Council of Architecture registration (demo)', 'Professional body (demo)', '2018-01-15', 'professional_qualification', 'verified', true)
  ;
  insert into public.seed_manifest (entity_kind, entity_id)
  select 'certification', id from public.profile_certifications where profile_id in (p1,p2,p3,p4,p5,p6,p7,p8,p9,p10);

  insert into public.professional_experiences (profile_id, title, organisation_id, organisation_name_text, location_label, start_date, end_date, source, responsibilities)
  values
    (p1, 'Product designer', o1, 'Meridian Axis Infra', 'Bengaluru', '2022-02-01', null, 'organisation_verified', array['Identity flows','Hiring screens']),
    (p2, 'Site engineer', o2, 'Coastal Grid Erectors', 'Mumbai', '2020-08-01', null, 'organisation_verified', array['Look-ahead planning','Contractor coordination']),
    (p3, 'Electrical supervisor', o5, 'Dakshin Operations', 'Hyderabad', '2019-04-01', null, 'organisation_verified', array['Crew briefing','Permit to work']),
    (p4, 'Principal architect', o3, 'Lumen Atelier', 'Pune', '2016-05-01', null, 'self_declared', array['Workplace programmes','Adaptive reuse']),
    (p6, 'Structural welder', o4, 'Narmada Crew Staffing', 'Ahmedabad', '2018-01-01', null, 'organisation_verified', array['Shop and site welding'])
  ;
  insert into public.seed_manifest (entity_kind, entity_id)
  select 'experience', id from public.professional_experiences where profile_id in (p1,p2,p3,p4,p5,p6,p7,p8,p9,p10);

  insert into public.network_projects (id, slug, name, summary, project_type, status, city, state, locality, client_organisation_id, main_contractor_id, verified, start_date, end_date)
  values
    (pr1, 'whitefield-campus-expansion', 'Whitefield campus expansion', 'Workplace campus block with opted-in professional identities. Demonstration project.', 'campus', 'in_progress', 'Bengaluru', 'Karnataka', 'Whitefield', o1, o2, true, '2025-01-15', null),
    (pr2, 'vashi-transit-deck', 'Vashi transit deck', 'Steel deck package beside a transit node. Demonstration project.', 'transit', 'completed', 'Mumbai', 'Maharashtra', 'Vashi', o1, o2, true, '2023-03-01', '2024-11-30'),
    (pr3, 'kalyani-workplace-refresh', 'Kalyani workplace refresh', 'Interior refresh for a design studio. Demonstration project.', 'interior', 'handover', 'Pune', 'Maharashtra', 'Kalyani Nagar', o3, o3, true, '2024-06-01', '2025-02-28'),
    (pr4, 'chakan-component-line', 'Chakan component line', 'Prefabrication line commissioning. Demonstration project.', 'plant', 'in_progress', 'Pune', 'Maharashtra', 'Chakan', o6, o4, true, '2025-09-01', null)
  on conflict (id) do nothing;
  perform public.mark_seed('project', pr1);
  perform public.mark_seed('project', pr2);
  perform public.mark_seed('project', pr3);
  perform public.mark_seed('project', pr4);

  insert into public.project_organisations (project_id, organisation_id, role, scope)
  values
    (pr1, o1, 'client', 'Developer'),
    (pr1, o2, 'main_contractor', 'Structure'),
    (pr1, o5, 'vendor', 'Electrical operations'),
    (pr2, o1, 'client', 'Developer'),
    (pr2, o2, 'main_contractor', 'Steel deck'),
    (pr3, o3, 'consultant', 'Design'),
    (pr4, o6, 'client', 'Manufacturer'),
    (pr4, o4, 'vendor', 'Crew supply')
  on conflict do nothing;
  insert into public.seed_manifest (entity_kind, entity_id)
  select 'project_org', id from public.project_organisations where project_id in (pr1,pr2,pr3,pr4);

  insert into public.project_contributors (project_id, profile_id, organisation_id, role_title, contribution, opted_in)
  values
    (pr1, p1, o1, 'Design lead', 'Workplace programme', true),
    (pr1, p8, o1, 'Controls', 'Look-ahead', true),
    (pr1, p3, o5, 'Electrical supervisor', 'Campus electrical', true),
    (pr2, p2, o2, 'Site engineer', 'Deck package', true),
    (pr2, p6, o4, 'Welder', 'Site welding', true),
    (pr3, p4, o3, 'Architect', 'Refresh design', true),
    (pr3, p7, o3, 'Contractor', 'Fit-out', true),
    (pr4, p9, o4, 'HSE officer', 'Line safety', true)
  on conflict do nothing;
  insert into public.seed_manifest (entity_kind, entity_id)
  select 'contributor', id from public.project_contributors where project_id in (pr1,pr2,pr3,pr4);

  insert into public.job_posts (id, organisation_id, recruiter_profile_id, title, city, state, locality, employment_type, experience_label, salary_label, skills, description, responsibilities, requirements, easy_apply)
  values
    (job1, o1, p5, 'Senior product designer', 'Bengaluru', 'Karnataka', 'Whitefield', 'permanent', '5+ years', 'Public band on request', array['Product design'], 'Design identity and hiring surfaces. Demonstration job.', array['Ship flows with engineering'], array['Portfolio of workplace tools'], true),
    (job2, o2, p2, 'Site engineer — steel', 'Mumbai', 'Maharashtra', 'Vashi', 'contract', '3+ years', 'Contract rate', array['Site engineering'], 'Own a steel package. Demonstration job.', array['Coordinate erection'], array['Site experience'], false),
    (job3, o5, p5, 'Electrical supervisor', 'Hyderabad', 'Telangana', 'HITEC City', 'permanent', '4+ years', 'Public band on request', array['Electrical supervision'], 'Lead campus electrical crews. Demonstration job.', array['Permits and briefing'], array['Supervisory licence'], true),
    (job4, o3, p4, 'Interior architect', 'Pune', 'Maharashtra', 'Kalyani Nagar', 'permanent', '4+ years', 'Public band on request', array['Architecture'], 'Workplace interiors. Demonstration job.', array['Draw and coordinate'], array['Portfolio'], false),
    (job5, o4, p5, 'HSE officer', 'Ahmedabad', 'Gujarat', 'Naroda', 'permanent', '3+ years', 'Public band on request', array['HSE'], 'Crew safety partner. Demonstration job.', array['Briefings and observation'], array['Recognised safety certificate'], true)
  on conflict (id) do nothing;
  perform public.mark_seed('job', job1); perform public.mark_seed('job', job2); perform public.mark_seed('job', job3);
  perform public.mark_seed('job', job4); perform public.mark_seed('job', job5);

  insert into public.gig_posts (id, organisation_id, title, site_name, project_id, trade, shift_label, pay_label, distance_km, start_label, seats, duration, description)
  values
    (gig1, o4, 'Night welding crew', 'Chakan component line', pr4, 'Welding', '20:00–04:00', 'Shift rate on request', 12, 'Next Monday', 6, '1_week', 'Demonstration gig for a prefabrication line.'),
    (gig2, o5, 'Campus electrical shutdown support', 'Whitefield campus', pr1, 'Electrical', 'Day shift', 'Day rate on request', 8, 'This Saturday', 4, '1_day', 'Demonstration gig for an occupied campus.'),
    (gig3, o2, 'Deck bolt-up crew', 'Vashi transit deck', pr2, 'Steel erection', 'Day shift', 'Shift rate on request', 5, 'Completed demo window', 8, '3_days', 'Demonstration gig.'),
    (gig4, o3, 'Joinery installers', 'Kalyani workplace refresh', pr3, 'Interiors', 'Day shift', 'Day rate on request', 3, 'Handover week', 3, '1_week', 'Demonstration gig.')
  on conflict (id) do nothing;
  perform public.mark_seed('gig', gig1); perform public.mark_seed('gig', gig2); perform public.mark_seed('gig', gig3); perform public.mark_seed('gig', gig4);

  insert into public.job_applications (job_id, profile_id, status) values
    (job1, p10, 'submitted'), (job3, p3, 'submitted'), (job5, p9, 'submitted')
  on conflict do nothing;
  insert into public.gig_applications (gig_id, profile_id, status) values
    (gig1, p6, 'submitted'), (gig2, p3, 'submitted')
  on conflict do nothing;

  insert into public.organisation_services (organisation_id, name, description, locations, pricing_model)
  values
    (o2, 'Structural steel erection', 'Erection crews and equipment. Demonstration service.', array['Mumbai','Pune'], 'project'),
    (o3, 'Workplace design', 'Interior and architecture packages. Demonstration service.', array['Pune','Mumbai'], 'retainer'),
    (o4, 'Skilled crew supply', 'Welders, electricians, HSE. Demonstration service.', array['Ahmedabad','Surat'], 'shift'),
    (o5, 'Campus electrical operations', 'Occupied-site electrical. Demonstration service.', array['Chennai','Hyderabad'], 'annual')
  ;
  insert into public.seed_manifest (entity_kind, entity_id)
  select 'service', id from public.organisation_services where organisation_id in (o1,o2,o3,o4,o5,o6);

  insert into public.organisation_credentials (organisation_id, name, category, verification_state, public_visible, expiry_label)
  values
    (o2, 'Contractor safety rating (demo)', 'safety', 'verified', true, '2027'),
    (o4, 'Staffing licence (demo)', 'licence', 'verified', true, '2026'),
    (o5, 'Facilities operations certificate (demo)', 'operations', 'pending', true, null)
  ;
  insert into public.seed_manifest (entity_kind, entity_id)
  select 'org_credential', id from public.organisation_credentials where organisation_id in (o1,o2,o3,o4,o5,o6);

  insert into public.reviews (organisation_id, project_id, reviewer_profile_id, reviewer_name, reviewer_role, relationship, rating, body)
  values
    (o2, pr2, p8, 'Kabir Singh', 'Project controls', 'verified_client', 4.5, 'Deck package closed on the agreed sequence. Demonstration review.'),
    (o3, pr3, p1, 'Ananya Iyer', 'Design lead', 'verified_client', 5, 'Clear drawings and calm site coordination. Demonstration review.')
  ;
  insert into public.seed_manifest (entity_kind, entity_id)
  select 'review', id from public.reviews where organisation_id in (o1,o2,o3,o4,o5,o6);

  insert into public.recommendations (from_profile_id, to_profile_id, relationship, body)
  values
    (p8, p1, 'Worked together on Whitefield campus', 'Ananya kept identity and hiring screens honest. Demonstration recommendation.'),
    (p2, p6, 'Same steel package', 'Arjun showed up prepared and left a clean joint. Demonstration recommendation.'),
    (p5, p3, 'Campus operations', 'Fatima ran occupied-site electrical without drama. Demonstration recommendation.')
  ;
  insert into public.seed_manifest (entity_kind, entity_id)
  select 'recommendation', id from public.recommendations where from_profile_id in (p1,p2,p3,p4,p5,p6,p7,p8,p9,p10);

  insert into public.connections (requester_id, addressee_id, status)
  values
    (p1, p2, 'accepted'), (p1, p4, 'accepted'), (p1, p8, 'accepted'),
    (p2, p6, 'accepted'), (p3, p5, 'accepted'), (p3, p9, 'accepted'),
    (p4, p7, 'accepted'), (p8, p10, 'pending'), (p6, p9, 'accepted')
  on conflict do nothing;
  insert into public.follows (follower_id, person_id) values
    (p1, p4), (p1, p8), (p10, p1), (p5, p3), (p2, p6)
  on conflict do nothing;
  insert into public.follows (follower_id, organisation_id) values
    (p1, o2), (p4, o1), (p10, o3)
  on conflict do nothing;
  insert into public.seed_manifest (entity_kind, entity_id)
  select 'follow', id from public.follows where follower_id in (p1,p2,p3,p4,p5,p6,p7,p8,p9,p10);

  insert into public.posts (id, post_type, author_profile_id, author_organisation_id, body, linked_project_id, created_at)
  values
    (post1, 'update', p1, null, 'Shipped a quieter hiring flow for campus roles. Demonstration post — not a real update.', pr1, now() - interval '2 days'),
    (post2, 'site_progress', p2, null, 'Transit deck bolt-up closed on the last grid. Demonstration post.', pr2, now() - interval '5 days'),
    (post3, 'skill_achievement', p3, null, 'Completed occupied-site electrical briefing with the campus team. Demonstration post.', pr1, now() - interval '1 day'),
    (post4, 'case_study', p4, null, 'Workplace refresh handed over with a smaller furniture set. Demonstration post.', pr3, now() - interval '8 days'),
    (post5, 'gig_requirement', null, o4, 'Need a night welding crew next week at Chakan. Demonstration post.', pr4, now() - interval '12 hours'),
    (post6, 'hiring', null, o5, 'Hiring an electrical supervisor for Hyderabad campus operations. Demonstration post.', null, now() - interval '3 days'),
    (post7, 'project_milestone', p8, null, 'Look-ahead locked for Whitefield block B. Demonstration post.', pr1, now() - interval '6 days'),
    (post8, 'certification', p9, null, 'Safety certificate renewed for plant work. Demonstration post.', pr4, now() - interval '10 days')
  on conflict (id) do nothing;
  perform public.mark_seed('post', post1); perform public.mark_seed('post', post2); perform public.mark_seed('post', post3);
  perform public.mark_seed('post', post4); perform public.mark_seed('post', post5); perform public.mark_seed('post', post6);
  perform public.mark_seed('post', post7); perform public.mark_seed('post', post8);

  insert into public.comments (post_id, author_profile_id, body, created_at) values
    (post1, p8, 'The empty states on hiring were the right call. Demonstration comment.', now() - interval '1 day'),
    (post1, p10, 'Would use this copy in onboarding. Demonstration comment.', now() - interval '20 hours'),
    (post2, p6, 'Grid 12 was clean when we left. Demonstration comment.', now() - interval '4 days'),
    (post2, p1, 'Photos of the deck would help the passport page. Demonstration comment.', now() - interval '4 days'),
    (post3, p5, 'Campus team confirmed the briefing window. Demonstration comment.', now() - interval '10 hours'),
    (post4, p7, 'Joinery set arrived in one load. Demonstration comment.', now() - interval '7 days'),
    (post5, p6, 'I can take the first three nights. Demonstration comment.', now() - interval '8 hours'),
    (post6, p3, 'Sharing with licensed supervisors in Hyderabad. Demonstration comment.', now() - interval '2 days'),
    (post7, p2, 'Steel package can meet that look-ahead. Demonstration comment.', now() - interval '5 days'),
    (post8, p6, 'We will keep the same briefing time. Demonstration comment.', now() - interval '9 days')
  ;
  insert into public.seed_manifest (entity_kind, entity_id)
  select 'comment', id from public.comments where post_id in (post1,post2,post3,post4,post5,post6,post7,post8);

  insert into public.post_reactions (post_id, profile_id, kind) values
    (post1, p8, 'like'), (post1, p10, 'like'), (post1, p4, 'like'),
    (post2, p1, 'like'), (post2, p6, 'like'), (post3, p5, 'like'),
    (post5, p6, 'like'), (post6, p3, 'like'), (post7, p2, 'like')
  on conflict do nothing;
  insert into public.seed_manifest (entity_kind, entity_id)
  select 'reaction', id from public.post_reactions where post_id in (post1,post2,post3,post4,post5,post6,post7,post8);

  insert into public.conversations (id, kind, title) values
    (conv1, 'person', 'Whitefield look-ahead')
  on conflict (id) do nothing;
  insert into public.conversation_members (conversation_id, profile_id) values
    (conv1, p1), (conv1, p8)
  on conflict do nothing;
  insert into public.messages (conversation_id, sender_id, body, created_at) values
    (conv1, p8, 'Block B look-ahead is in the shared folder. Demonstration message.', now() - interval '2 days'),
    (conv1, p1, 'I will mark the hiring screens that still look empty. Demonstration message.', now() - interval '1 day');

  insert into public.notifications (profile_id, kind, title, body, href)
  values
    (p1, 'comment', 'Kabir commented on your update', 'Demonstration notification.', '/feed'),
    (p6, 'gig', 'Night welding crew was posted', 'Demonstration notification.', '/gigs')
  ;
  insert into public.profile_views (viewed_profile_id, viewer_profile_id, created_at) values
    (p1, p10, now() - interval '3 hours'),
    (p3, p5, now() - interval '1 day'),
    (p6, p2, now() - interval '5 hours')
  ;
  insert into public.saved_items (profile_id, entity_kind, entity_id) values
    (p3, 'job', job3),
    (p6, 'gig', gig1)
  on conflict do nothing;
  insert into public.verification_requests (profile_id, kind, status) values
    (p10, 'identity', 'pending')
  ;
end;
$$;

select public.seed_demo_data();
