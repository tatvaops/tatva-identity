-- Connect IDENTITI demo rows with public photos, product uses, and older project covers.
-- All media is labelled demonstration data. Does not invent live Vantage threads.
-- gstin stays off the anonymous and authenticated column grants.

grant select (
  passport_kind, legal_entity_name, gst_verified, kyc_verified,
  typical_value_min_inr, typical_value_max_inr, delivery_slots, design_lead_weeks, active_cities,
  design_capability, execution_capability, capability_chips, category_label, serving_regions,
  public_rate_visible, average_rating, verified_review_count, manufacturer_or_importer
) on public.organisations to anon, authenticated;

create or replace function public.seed_identiti_media_connect()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  aurum_id uuid := 'b0000000-0000-4000-8000-000000000007';
  stone_id uuid := 'b0000000-0000-4000-8000-000000000008';
  o1 uuid := 'b0000000-0000-4000-8000-000000000001';
  o2 uuid := 'b0000000-0000-4000-8000-000000000002';
  o3 uuid := 'b0000000-0000-4000-8000-000000000003';
  o4 uuid := 'b0000000-0000-4000-8000-000000000004';
  o5 uuid := 'b0000000-0000-4000-8000-000000000005';
  o6 uuid := 'b0000000-0000-4000-8000-000000000006';
  sobha_id uuid := 'c0000000-0000-4000-8000-000000000005';
  villa_id uuid := 'c0000000-0000-4000-8000-000000000006';
  pr1 uuid := 'c0000000-0000-4000-8000-000000000001';
  pr2 uuid := 'c0000000-0000-4000-8000-000000000002';
  pr3 uuid := 'c0000000-0000-4000-8000-000000000003';
  pr4 uuid := 'c0000000-0000-4000-8000-000000000004';
  prod1 uuid := 'd1000000-0000-4000-8000-000000000001';
  prod2 uuid := 'd1000000-0000-4000-8000-000000000002';
  prod3 uuid := 'd1000000-0000-4000-8000-000000000003';
  exec_id uuid := 'a0000000-0000-4000-8000-000000000011';
  carpenter_id uuid := 'a0000000-0000-4000-8000-000000000012';
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
begin
  update public.organisations set
    cover_path = 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1400&q=80',
    logo_path = 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=200&q=80',
    category_label = coalesce(category_label, 'Interior contractor'),
    serving_regions = coalesce(serving_regions, 'Bengaluru, Mysuru, Hyderabad')
  where id = aurum_id;

  update public.organisations set
    cover_path = 'https://images.unsplash.com/photo-1615873968403-89e068629265?auto=format&fit=crop&w=1400&q=80',
    logo_path = 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=200&q=80',
    category_label = coalesce(category_label, 'Material brand'),
    serving_regions = coalesce(serving_regions, 'South India')
  where id = stone_id;

  update public.organisations set
    cover_path = case id
      when o1 then 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1400&q=80'
      when o2 then 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=1400&q=80'
      when o3 then 'https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=1400&q=80'
      when o4 then 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=1400&q=80'
      when o5 then 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=1400&q=80'
      when o6 then 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=1400&q=80'
    end,
    category_label = coalesce(category_label, case organisation_type
      when 'developer' then 'Campus developer'
      when 'subcontractor' then 'Structural contractor'
      when 'consultancy' then 'Design studio'
      when 'staffing_agency' then 'Crew partner'
      when 'service_provider' then 'Facilities operator'
      when 'manufacturer' then 'Building systems'
      else category_label
    end)
  where id in (o1, o2, o3, o4, o5, o6);

  update public.brand_products set photo_url = case id
    when prod1 then 'https://images.unsplash.com/photo-1615873968403-89e068629265?auto=format&fit=crop&w=1200&q=80'
    when prod2 then 'https://images.unsplash.com/photo-1615876234886-fd9a39fda97f?auto=format&fit=crop&w=1200&q=80'
    when prod3 then 'https://images.unsplash.com/photo-1600607687644-c7171b42498f?auto=format&fit=crop&w=1200&q=80'
  end
  where id in (prod1, prod2, prod3);

  update public.network_projects set
    cover_image_url = coalesce(cover_image_url, case id
      when pr1 then 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1400&q=80'
      when pr2 then 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=1400&q=80'
      when pr3 then 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1400&q=80'
      when pr4 then 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=1400&q=80'
    end),
    value_label = coalesce(value_label, case id
      when pr1 then 'Campus block'
      when pr2 then 'Steel deck package'
      when pr3 then 'Studio refresh'
      when pr4 then 'Line commissioning'
    end),
    qc_notes = coalesce(qc_notes, 'Demonstration QC note. Photos are sample media, not a live site record.'),
    testimonial = coalesce(testimonial, 'Demonstration client note. Not a live endorsement.')
  where id in (pr1, pr2, pr3, pr4);

  insert into public.project_media (project_id, storage_path, caption, kind)
  select sobha_id, 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1400&q=80', 'Living room after handover (demo)', 'photo'
  where not exists (select 1 from public.project_media where project_id = sobha_id);
  insert into public.project_media (project_id, storage_path, caption, kind)
  select villa_id, 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1400&q=80', 'Courtyard joinery (demo)', 'photo'
  where not exists (select 1 from public.project_media where project_id = villa_id);
  insert into public.project_media (project_id, storage_path, caption, kind)
  select pr1, 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1400&q=80', 'Campus workplace (demo)', 'photo'
  where not exists (select 1 from public.project_media where project_id = pr1);

  insert into public.product_project_uses (product_id, project_id, installer_organisation_id, worker_profile_id, application, location, endorsement, verified)
  select prod1, villa_id, aurum_id, carpenter_id, 'Wet-area floors', 'Courtyard Villa bathrooms', 'Demonstration use. Kota laid after waterproofing photos.', true
  where not exists (select 1 from public.product_project_uses where product_id = prod1 and project_id = villa_id);
  insert into public.product_project_uses (product_id, project_id, installer_organisation_id, worker_profile_id, application, location, endorsement, verified)
  select prod2, sobha_id, aurum_id, exec_id, 'Apartment flooring', 'Sobha Royal Pavilion 3BHK', 'Demonstration use. Porcelain specified for living rooms.', true
  where not exists (select 1 from public.product_project_uses where product_id = prod2 and project_id = sobha_id);
  insert into public.product_project_uses (product_id, project_id, installer_organisation_id, worker_profile_id, application, location, endorsement, verified)
  select prod3, villa_id, aurum_id, carpenter_id, 'Feature wall', 'Courtyard Villa courtyard', 'Demonstration use. Fluted cladding on the courtyard wall.', true
  where not exists (select 1 from public.product_project_uses where product_id = prod3 and project_id = villa_id);

  update public.profiles set
    avatar_path = case id
      when exec_id then 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80'
      when carpenter_id then 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80'
      when p1 then 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80'
      when p2 then 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80'
      when p3 then 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=400&q=80'
      when p4 then 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80'
      when p5 then 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=400&q=80'
      when p6 then 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80'
      when p7 then 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'
      when p8 then 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=400&q=80'
      when p9 then 'https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=400&q=80'
      when p10 then 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=400&q=80'
    end,
    cover_path = coalesce(cover_path, case occupation_mode
      when 'blue_collar' then 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=1400&q=80'
      when 'contractor' then 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=1400&q=80'
      else 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1400&q=80'
    end)
  where id in (exec_id, carpenter_id, p1, p2, p3, p4, p5, p6, p7, p8, p9, p10);

  insert into public.work_portfolio_items (profile_id, kind, image_url, caption, work_category, location, product_used, supervisor_verified)
  select p3, 'photo', 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=900&q=80', 'Campus electrical board (demo)', 'Electrical', 'Whitefield', null, true
  where not exists (select 1 from public.work_portfolio_items where profile_id = p3 and caption = 'Campus electrical board (demo)');
  insert into public.work_portfolio_items (profile_id, kind, image_url, caption, work_category, location, product_used, supervisor_verified)
  select p6, 'photo', 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=900&q=80', 'Site welding pass (demo)', 'Welding', 'Vashi', null, true
  where not exists (select 1 from public.work_portfolio_items where profile_id = p6 and caption = 'Site welding pass (demo)');
  insert into public.work_portfolio_items (profile_id, kind, image_url, caption, work_category, location, product_used, supervisor_verified)
  select p7, 'photo', 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=900&q=80', 'Office fit-out after paint (demo)', 'Interiors', 'Kalyani Nagar', null, true
  where not exists (select 1 from public.work_portfolio_items where profile_id = p7 and caption = 'Office fit-out after paint (demo)');
  insert into public.work_portfolio_items (profile_id, kind, image_url, caption, work_category, location, product_used, supervisor_verified)
  select p9, 'photo', 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=900&q=80', 'Toolbox talk on line (demo)', 'HSE', 'Chakan', null, true
  where not exists (select 1 from public.work_portfolio_items where profile_id = p9 and caption = 'Toolbox talk on line (demo)');
end;
$$;

revoke all on function public.seed_identiti_media_connect() from public;
grant execute on function public.seed_identiti_media_connect() to postgres;

select public.seed_identiti_media_connect();
