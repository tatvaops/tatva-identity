-- IDENTITI marketplace: service/product brands, products, portfolio, forum links, AI review.
-- Does not create Vertex tables. Sample rows are labelled demonstration data.

alter table public.organisations
  add column if not exists passport_kind text not null default 'other'
    check (passport_kind in ('service_brand', 'product_brand', 'other')),
  add column if not exists legal_entity_name text,
  add column if not exists gstin text,
  add column if not exists gst_verified boolean not null default false,
  add column if not exists kyc_verified boolean not null default false,
  add column if not exists typical_value_min_inr integer,
  add column if not exists typical_value_max_inr integer,
  add column if not exists delivery_slots integer,
  add column if not exists design_lead_weeks integer,
  add column if not exists active_cities integer,
  add column if not exists design_capability boolean not null default false,
  add column if not exists execution_capability boolean not null default false,
  add column if not exists capability_chips text[] not null default '{}',
  add column if not exists category_label text,
  add column if not exists serving_regions text,
  add column if not exists public_rate_visible boolean not null default false,
  add column if not exists average_rating numeric(3,2),
  add column if not exists verified_review_count integer not null default 0,
  add column if not exists manufacturer_or_importer text;

update public.organisations
set passport_kind = case
  when organisation_type in ('service_provider', 'subcontractor', 'general_contractor', 'developer', 'consultancy') then 'service_brand'
  when organisation_type in ('manufacturer', 'brand', 'vendor') then 'product_brand'
  else 'other'
end
where passport_kind = 'other';

alter table public.profiles
  add column if not exists public_rate_visible boolean not null default false,
  add column if not exists rehire_rate numeric(5,2);

alter table public.network_projects
  add column if not exists size_label text,
  add column if not exists value_label text,
  add column if not exists duration_label text,
  add column if not exists youtube_url text,
  add column if not exists youtube_duration text,
  add column if not exists scope_delivered text,
  add column if not exists materials_used text,
  add column if not exists qc_notes text,
  add column if not exists testimonial text,
  add column if not exists customer_verified boolean not null default false,
  add column if not exists cover_image_url text;

create table if not exists public.organisation_videos (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations (id) on delete cascade,
  kind text not null check (kind in ('intro', 'walkthrough', 'workshop', 'process', 'testimonial', 'qc')),
  title text not null,
  youtube_url text not null,
  duration_label text,
  created_at timestamptz not null default now()
);

create table if not exists public.organisation_performance (
  organisation_id uuid primary key references public.organisations (id) on delete cascade,
  on_time_pct numeric(5,2),
  quality_rating numeric(3,2),
  budget_adherence numeric(3,2),
  communication_rating numeric(3,2),
  issue_resolution numeric(3,2),
  repeat_customer_pct numeric(5,2),
  completed_projects integer,
  ongoing_projects integer,
  verification_state text not null default 'self_declared'
);

create table if not exists public.organisation_strengths (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations (id) on delete cascade,
  title text not null,
  metric_label text,
  body text
);

create table if not exists public.organisation_ai_review_settings (
  organisation_id uuid primary key references public.organisations (id) on delete cascade,
  ai_review_source text not null default 'vantage_forum'
    check (ai_review_source in ('google_reviews', 'vantage_forum')),
  ai_review_enabled boolean not null default true,
  minimum_source_count integer not null default 5,
  minimum_verified_source_count integer not null default 2,
  refresh_frequency text not null default 'weekly',
  last_generated_at timestamptz,
  confidence_score numeric(5,2),
  manual_review_required boolean not null default false
);

create table if not exists public.organisation_ai_reviews (
  organisation_id uuid primary key references public.organisations (id) on delete cascade,
  source_label text not null,
  source_kind text not null check (source_kind in ('google_reviews', 'vantage_forum')),
  overall_sentiment_pct numeric(5,2),
  strengths text[] not null default '{}',
  concerns text[] not null default '{}',
  themes text[] not null default '{}',
  brand_response_rate numeric(5,2),
  source_count integer not null default 0,
  date_range_label text,
  confidence_label text not null default 'low',
  summary text not null,
  source_href text,
  generated_at timestamptz not null default now()
);

create table if not exists public.brand_products (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations (id) on delete cascade,
  slug text not null,
  name text not null,
  variant text,
  application_family text not null,
  category text,
  description text,
  specifications jsonb not null default '{}',
  unit_label text,
  indicative_price_label text,
  availability text not null default 'in_stock',
  warranty_label text,
  certifications text[] not null default '{}',
  youtube_url text,
  photo_url text,
  created_at timestamptz not null default now(),
  unique (organisation_id, slug)
);

create table if not exists public.product_project_uses (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.brand_products (id) on delete cascade,
  project_id uuid references public.network_projects (id) on delete set null,
  installer_organisation_id uuid references public.organisations (id) on delete set null,
  worker_profile_id uuid references public.profiles (id) on delete set null,
  application text,
  location text,
  used_on date,
  endorsement text,
  customer_feedback text,
  verified boolean not null default false
);

create table if not exists public.work_portfolio_items (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  kind text not null check (kind in ('photo', 'video', 'before_after')),
  image_url text not null,
  caption text,
  work_category text,
  location text,
  product_used text,
  project_id uuid references public.network_projects (id) on delete set null,
  supervisor_verified boolean not null default false,
  brand_verified boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.supervisor_reviews (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  reviewer_name text not null,
  reviewer_designation text,
  company_name text,
  project_id uuid references public.network_projects (id) on delete set null,
  verified_relationship boolean not null default false,
  quality_rating numeric(3,2),
  reliability_rating numeric(3,2),
  attendance_rating numeric(3,2),
  safety_rating numeric(3,2),
  teamwork_rating numeric(3,2),
  body text,
  created_at timestamptz not null default now()
);

create table if not exists public.skill_passport_facts (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  skill_name text not null,
  proficiency text,
  years_experience numeric(4,1),
  verified_projects integer not null default 0,
  assessment_label text,
  tools_owned text[] not null default '{}',
  safety_training text
);

create table if not exists public.forum_entity_links (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null check (entity_type in ('service_brand', 'product_brand', 'product')),
  entity_id uuid not null,
  brand_id uuid,
  product_id uuid,
  forum_hub_id text,
  forum_thread_id text,
  thread_slug text,
  canonical_url text,
  status text not null default 'pending' check (status in ('pending', 'active', 'failed')),
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists forum_entity_hub_unique
  on public.forum_entity_links (entity_type, entity_id)
  where forum_thread_id is null;
create unique index if not exists forum_entity_thread_unique
  on public.forum_entity_links (thread_slug)
  where thread_slug is not null;

create table if not exists public.forum_token_jti (
  jti text primary key,
  expires_at timestamptz not null,
  used_at timestamptz
);

create table if not exists public.api_credentials (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  token_hash text not null unique,
  scopes text[] not null default '{}',
  expires_at timestamptz,
  revoked_at timestamptz,
  last_used_at timestamptz,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.platform_evidence_settings (
  id integer primary key default 1 check (id = 1),
  minimum_source_count integer not null default 5,
  minimum_verified_source_count integer not null default 2,
  updated_at timestamptz not null default now()
);

insert into public.platform_evidence_settings (id)
values (1)
on conflict (id) do nothing;

alter table public.organisation_videos enable row level security;
alter table public.organisation_performance enable row level security;
alter table public.organisation_strengths enable row level security;
alter table public.organisation_ai_review_settings enable row level security;
alter table public.organisation_ai_reviews enable row level security;
alter table public.brand_products enable row level security;
alter table public.product_project_uses enable row level security;
alter table public.work_portfolio_items enable row level security;
alter table public.supervisor_reviews enable row level security;
alter table public.skill_passport_facts enable row level security;
alter table public.forum_entity_links enable row level security;
alter table public.forum_token_jti enable row level security;
alter table public.api_credentials enable row level security;
alter table public.platform_evidence_settings enable row level security;

drop policy if exists "identiti_videos_read" on public.organisation_videos;
create policy "identiti_videos_read" on public.organisation_videos for select
  using (public.seed_visible('organisation', organisation_id));
drop policy if exists "identiti_perf_read" on public.organisation_performance;
create policy "identiti_perf_read" on public.organisation_performance for select
  using (public.seed_visible('organisation', organisation_id));
drop policy if exists "identiti_strengths_read" on public.organisation_strengths;
create policy "identiti_strengths_read" on public.organisation_strengths for select
  using (public.seed_visible('organisation', organisation_id));
drop policy if exists "identiti_ai_settings_read" on public.organisation_ai_review_settings;
create policy "identiti_ai_settings_read" on public.organisation_ai_review_settings for select
  using (public.seed_visible('organisation', organisation_id));
drop policy if exists "identiti_ai_reviews_read" on public.organisation_ai_reviews;
create policy "identiti_ai_reviews_read" on public.organisation_ai_reviews for select
  using (public.seed_visible('organisation', organisation_id));
drop policy if exists "identiti_products_read" on public.brand_products;
create policy "identiti_products_read" on public.brand_products for select
  using (public.seed_visible('organisation', organisation_id));
drop policy if exists "identiti_product_uses_read" on public.product_project_uses;
create policy "identiti_product_uses_read" on public.product_project_uses for select using (true);
drop policy if exists "identiti_portfolio_read" on public.work_portfolio_items;
create policy "identiti_portfolio_read" on public.work_portfolio_items for select
  using (public.seed_visible('profile', profile_id));
drop policy if exists "identiti_supervisor_read" on public.supervisor_reviews;
create policy "identiti_supervisor_read" on public.supervisor_reviews for select
  using (public.seed_visible('profile', profile_id));
drop policy if exists "identiti_skill_facts_read" on public.skill_passport_facts;
create policy "identiti_skill_facts_read" on public.skill_passport_facts for select
  using (public.seed_visible('profile', profile_id));
drop policy if exists "identiti_forum_links_read" on public.forum_entity_links;
create policy "identiti_forum_links_read" on public.forum_entity_links for select
  using (brand_id is null or public.seed_visible('organisation', brand_id));
drop policy if exists "identiti_evidence_read" on public.platform_evidence_settings;
create policy "identiti_evidence_read" on public.platform_evidence_settings for select using (true);

grant select on
  public.organisation_videos,
  public.organisation_performance,
  public.organisation_strengths,
  public.organisation_ai_review_settings,
  public.organisation_ai_reviews,
  public.brand_products,
  public.product_project_uses,
  public.work_portfolio_items,
  public.supervisor_reviews,
  public.skill_passport_facts,
  public.forum_entity_links,
  public.platform_evidence_settings
to anon, authenticated;
