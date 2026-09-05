-- Replace seed Unsplash URLs that now 404, and keep IDENTITI columns readable.
-- gstin stays off anonymous and authenticated column grants.

grant select (
  passport_kind, legal_entity_name, gst_verified, kyc_verified,
  typical_value_min_inr, typical_value_max_inr, delivery_slots, design_lead_weeks, active_cities,
  design_capability, execution_capability, capability_chips, category_label, serving_regions,
  public_rate_visible, average_rating, verified_review_count, manufacturer_or_importer
) on public.organisations to anon, authenticated;

update public.organisations
set cover_path = replace(
  cover_path,
  'https://images.unsplash.com/photo-1615971677499-5467cb89d40f',
  'https://images.unsplash.com/photo-1615873968403-89e068629265'
)
where cover_path like '%photo-1615971677499-5467cb89d40f%';

update public.organisations
set cover_path = replace(
  cover_path,
  'https://images.unsplash.com/photo-1504307651254-35680f356988',
  'https://images.unsplash.com/photo-1541888946425-d81bb19240f5'
)
where cover_path like '%photo-1504307651254-35680f356988%';

update public.brand_products
set photo_url = replace(
  photo_url,
  'https://images.unsplash.com/photo-1615971677499-5467cb89d40f',
  'https://images.unsplash.com/photo-1615873968403-89e068629265'
)
where photo_url like '%photo-1615971677499-5467cb89d40f%';

update public.profiles
set cover_path = replace(
  cover_path,
  'https://images.unsplash.com/photo-1504307651254-35680f356988',
  'https://images.unsplash.com/photo-1541888946425-d81bb19240f5'
)
where cover_path like '%photo-1504307651254-35680f356988%';

update public.work_portfolio_items
set image_url = replace(
  image_url,
  'https://images.unsplash.com/photo-1504307651254-35680f356988',
  'https://images.unsplash.com/photo-1541888946425-d81bb19240f5'
)
where image_url like '%photo-1504307651254-35680f356988%';
