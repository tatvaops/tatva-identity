-- Load or reload demonstration professionals, companies, jobs, gigs, posts and comments.
-- Requires 20260904120000_seed_toggle.sql to be applied first.
select public.seed_demo_data();
select public.seed_identiti_marketplace();
select public.seed_identiti_media_connect();
