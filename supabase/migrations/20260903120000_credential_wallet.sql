-- Phase 2: credential wallet categories and revoked state.
-- Does not store credential files or document numbers.

alter table public.profile_certifications
  add column if not exists category text not null default 'certification';

alter table public.profile_certifications
  drop constraint if exists profile_certifications_category_check;

alter table public.profile_certifications
  add constraint profile_certifications_category_check
  check (category in (
    'certification',
    'licence',
    'training',
    'safety',
    'professional_qualification'
  ));

alter table public.profile_certifications
  drop constraint if exists profile_certifications_verification_state_check;

alter table public.profile_certifications
  add constraint profile_certifications_verification_state_check
  check (verification_state in (
    'verified',
    'pending',
    'expired',
    'revoked',
    'not_submitted',
    'self_declared'
  ));
