-- Hide demo data (platform looks empty, rows stay in the database):
--   update public.platform_settings set seed_data_enabled = false;
--
-- Show demo data again:
--   update public.platform_settings set seed_data_enabled = true;
--
-- Delete demo data permanently:
select public.unseed_platform();
