-- Labelled IDENTITI demonstration: Aurum Habitat, one product brand, executive, carpenter.
-- Does not overwrite existing demo orgs. Hide with seed_data_enabled = false.

create or replace function public.seed_identiti_marketplace()
returns void
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
declare
  exec_id uuid := 'a0000000-0000-4000-8000-000000000011';
  carpenter_id uuid := 'a0000000-0000-4000-8000-000000000012';
  aurum_id uuid := 'b0000000-0000-4000-8000-000000000007';
  stone_id uuid := 'b0000000-0000-4000-8000-000000000008';
  sobha_id uuid := 'c0000000-0000-4000-8000-000000000005';
  villa_id uuid := 'c0000000-0000-4000-8000-000000000006';
  prod1 uuid := 'd1000000-0000-4000-8000-000000000001';
  prod2 uuid := 'd1000000-0000-4000-8000-000000000002';
  prod3 uuid := 'd1000000-0000-4000-8000-000000000003';
begin
  perform public.seed_auth_user(exec_id, 'seed-aditi@tatva.example', 'Aditi Menon', 'seed-aditi');
  perform public.seed_auth_user(carpenter_id, 'seed-ramesh@tatva.example', 'Ramesh Kulkarni', 'seed-ramesh');
  perform public.mark_seed('profile', exec_id);
  perform public.mark_seed('profile', carpenter_id);

  insert into public.organisations (
    id, slug, name, tagline, about, organisation_type, passport_kind, industry, city, state, locality,
    founded_year, team_size_label, website, created_by, legal_entity_name, gstin, gst_verified, kyc_verified,
    typical_value_min_inr, typical_value_max_inr, delivery_slots, design_lead_weeks, active_cities,
    design_capability, execution_capability, capability_chips, category_label, serving_regions,
    average_rating, verified_review_count
  ) values
    (
      aurum_id, 'aurum-habitat', 'Aurum Habitat', 'Turnkey interiors for homes that must last',
      'Demonstration service brand. Interior design and execution for apartments and villas. Not a live contractor listing.',
      'service_provider', 'service_brand', 'Interiors', 'Bengaluru', 'Karnataka', 'Indiranagar',
      2016, '50-200', 'https://example.invalid/aurum-habitat', exec_id, 'Aurum Habitat Private Limited (demo)',
      '29AAAAA0000A1Z5', true, true, 1500000, 18000000, 3, 4, 4, true, true,
      array['Turnkey interiors','Villa interiors','Material specification','Site QC'],
      'Interior contractor', 'Bengaluru, Mysuru, Hyderabad', 4.6, 18
    ),
    (
      stone_id, 'nandi-surfaces', 'Nandi Surfaces', 'Stone and tile for wet areas and facades',
      'Demonstration product brand. Natural stone and porcelain for residential interiors. Not a live catalogue.',
      'manufacturer', 'product_brand', 'Materials', 'Bengaluru', 'Karnataka', 'Peenya',
      2004, '200-500', 'https://example.invalid/nandi-surfaces', exec_id, 'Nandi Surfaces Private Limited (demo)',
      '29BBBBB0000B1Z5', true, true, null, null, null, null, 6, false, false,
      array['Porcelain','Natural stone','Wet-area systems'],
      'Material brand', 'South India', 4.4, 9
    )
  on conflict (id) do nothing;
  perform public.mark_seed('organisation', aurum_id);
  perform public.mark_seed('organisation', stone_id);

  update public.profiles set
    handle = 'seed-aditi', full_name = 'Aditi Menon',
    headline = 'Interiors director — villas and premium apartments',
    about = 'Leads design and delivery for turnkey homes. Demonstration profile — not a real person.',
    occupation_mode = 'white_collar', professional_title = 'designer',
    current_organisation_id = aurum_id, city = 'Bengaluru', state = 'Karnataka', locality = 'Indiranagar',
    languages = array['English','Kannada','Hindi'], preferred_work_locations = array['Bengaluru','Hyderabad'],
    availability_status = 'open_to_opportunities', arrangement = 'hybrid',
    preferred_roles = array['Interiors director'],
    identity_verified = true, employment_verified = true
  where id = exec_id;

  update public.profiles set
    handle = 'seed-ramesh', full_name = 'Ramesh Kulkarni',
    headline = 'Carpenter — joinery and site finishing',
    about = 'Site carpenter for wardrobes, panelling and door frames. Demonstration profile — not a real person.',
    occupation_mode = 'blue_collar', professional_title = 'skilled_trade', classification = 'gig_spot_worker',
    current_organisation_id = aurum_id, city = 'Bengaluru', state = 'Karnataka', locality = 'Mahadevapura',
    languages = array['Kannada','Hindi','English'], preferred_work_locations = array['Bengaluru'],
    availability_status = 'open_to_gigs', arrangement = 'on_site',
    preferred_roles = array['Carpenter'],
    identity_verified = true, trade_verified = true
  where id = carpenter_id;

  insert into public.network_projects (
    id, slug, name, summary, project_type, status, city, state, locality,
    client_organisation_id, main_contractor_id, verified, start_date, end_date,
    size_label, value_label, duration_label, youtube_url, youtube_duration, qc_notes, testimonial,
    customer_verified, cover_image_url
  ) values
    (
      sobha_id, 'sobha-royal-pavilion', 'Sobha Royal Pavilion',
      'Demonstration apartment interiors for a Bengaluru tower. Labelled sample data.',
      'interior', 'completed', 'Bengaluru', 'Karnataka', 'Sarjapur',
      aurum_id, aurum_id, true, '2024-01-10', '2024-11-20',
      '3 BHK · 1,860 sq ft', '₹42L interiors', '10 months',
      'https://www.youtube.com/watch?v=dQw4w9WgXcQ', '6:12',
      'Wet-area waterproofing photographed before tile. Demonstration QC note.',
      'Handover was on the agreed week. Demonstration testimonial.',
      true, 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1400&q=80'
    ),
    (
      villa_id, 'courtyard-villa', 'Courtyard Villa',
      'Demonstration villa interiors with courtyard joinery. Labelled sample data.',
      'villa', 'completed', 'Bengaluru', 'Karnataka', 'Whitefield',
      aurum_id, aurum_id, true, '2023-02-01', '2024-03-15',
      'Villa · 4,200 sq ft', '₹1.1Cr interiors', '13 months',
      'https://www.youtube.com/watch?v=dQw4w9WgXcQ', '8:40',
      'Teak moisture checks logged before polish. Demonstration QC note.',
      'The courtyard joinery is what we hired them for. Demonstration testimonial.',
      true, 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1400&q=80'
    )
  on conflict (id) do nothing;
  perform public.mark_seed('project', sobha_id);
  perform public.mark_seed('project', villa_id);

  insert into public.project_contributors (project_id, profile_id, organisation_id, role_title, contribution, opted_in)
  values
    (sobha_id, exec_id, aurum_id, 'Interiors director', 'Design and handover', true),
    (villa_id, exec_id, aurum_id, 'Interiors director', 'Villa programme', true),
    (villa_id, carpenter_id, aurum_id, 'Carpenter', 'Joinery and panelling', true)
  on conflict do nothing;

  insert into public.organisation_performance (organisation_id, on_time_pct, quality_rating, completed_projects, ongoing_projects, verification_state)
  values (aurum_id, 92, 4.6, 28, 4, 'self_declared')
  on conflict (organisation_id) do nothing;

  insert into public.organisation_strengths (organisation_id, title, metric_label, body)
  values
    (aurum_id, 'Material specification', '18 verified reviews mention this', 'Demonstration strength copied from labelled reviews.'),
    (aurum_id, 'Site finishing', 'QC notes on both featured projects', 'Demonstration strength. Not a live rating feed.')
  on conflict do nothing;

  insert into public.organisation_videos (organisation_id, kind, title, youtube_url, duration_label)
  values (aurum_id, 'walkthrough', 'Company showreel (demonstration)', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', '4:20')
  on conflict do nothing;

  insert into public.organisation_ai_review_settings (organisation_id, ai_review_source, ai_review_enabled, minimum_source_count)
  values
    (aurum_id, 'vantage_forum', true, 5),
    (stone_id, 'google_reviews', true, 5)
  on conflict (organisation_id) do nothing;

  insert into public.organisation_ai_reviews (
    organisation_id, source_label, source_kind, overall_sentiment_pct, strengths, concerns, themes,
    brand_response_rate, source_count, date_range_label, confidence_label, summary, source_href
  ) values
    (
      aurum_id, 'Source: Vantage Forum discussions', 'vantage_forum', 81,
      array['Material honesty','Site presence'], array['Lead time on imported stone'],
      array['Handover','Joinery'], 0.7, 12, 'Jan–Aug 2026', 'medium',
      'Demonstration AI pulse from labelled forum excerpts. Buyers praise site presence and material honesty. Lead times on imported stone come up often. This is not a live scrape.',
      '/forums'
    ),
    (
      stone_id, 'Source: Google Reviews', 'google_reviews', 74,
      array['Shade matching'], array['Crate damage'],
      array['Delivery'], 0.4, 2, '2026', 'low',
      'Stored demonstration summary. Public profile will hide this until the evidence threshold is met.',
      null
    )
  on conflict (organisation_id) do nothing;

  insert into public.brand_products (
    id, organisation_id, slug, name, application_family, category, description, indicative_price_label, warranty_label, unit_label
  ) values
    (prod1, stone_id, 'kota-honed-slab', 'Kota honed slab', 'Flooring', 'Natural stone', 'Demonstration Kota slab for wet-area floors.', 'Indicative ₹180 / sq ft', '1 year shade', 'sq ft'),
    (prod2, stone_id, 'matte-porcelain-600', 'Matte porcelain 600', 'Flooring', 'Porcelain', 'Demonstration porcelain for apartments.', 'Indicative ₹95 / sq ft', '5 year wear', 'sq ft'),
    (prod3, stone_id, 'fluted-cladding', 'Fluted cladding', 'Walls', 'Porcelain', 'Demonstration cladding for courtyards and feature walls.', 'Indicative ₹240 / sq ft', '5 year wear', 'sq ft')
  on conflict (id) do nothing;

  insert into public.work_portfolio_items (profile_id, kind, image_url, caption, work_category, location, product_used, supervisor_verified)
  values
    (carpenter_id, 'photo', 'https://images.unsplash.com/photo-1615873968403-89e068629265?auto=format&fit=crop&w=900&q=80', 'Wardrobe carcass before laminate', 'Joinery', 'Whitefield', 'BWR plywood', true),
    (carpenter_id, 'photo', 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=900&q=80', 'Fluted wall panelling', 'Panelling', 'Sarjapur', 'Teak veneer', true),
    (carpenter_id, 'photo', 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=900&q=80', 'Door frame after polish', 'Finishing', 'Whitefield', 'Teak', false)
  on conflict do nothing;

  insert into public.supervisor_reviews (profile_id, reviewer_name, reviewer_designation, company_name, verified_relationship, quality_rating, body)
  values (carpenter_id, 'Aditi Menon', 'Interiors director', 'Aurum Habitat (demo)', true, 4.7, 'Demonstration supervisor review. Site finishing was consistent on the villa package.')
  on conflict do nothing;

  insert into public.skill_passport_facts (profile_id, skill_name, proficiency, years_experience, verified_projects, tools_owned)
  values (carpenter_id, 'Site carpentry', 'advanced', 11, 2, array['Circular saw','Router','Domino'])
  on conflict do nothing;

  insert into public.forum_entity_links (entity_type, entity_id, brand_id, status)
  values
    ('service_brand', aurum_id, aurum_id, 'pending'),
    ('product_brand', stone_id, stone_id, 'pending')
  on conflict do nothing;
end;
$$;

revoke all on function public.seed_identiti_marketplace() from public;
grant execute on function public.seed_identiti_marketplace() to postgres;

select public.seed_identiti_marketplace();
