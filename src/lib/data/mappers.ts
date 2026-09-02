import type {
  AvailabilityStatus,
  Experience,
  GigPost,
  JobPost,
  NetworkProject,
  OccupationMode,
  Organisation,
  OrganisationType,
  Post,
  ProfileCertification,
  ProfileSkill,
  PublicProfile,
  SkillVerificationLevel,
  VerificationState,
} from "@/lib/types/identity";

type ProfileRow = {
  id: string;
  handle: string;
  full_name: string;
  headline: string | null;
  about: string | null;
  avatar_path: string | null;
  cover_path: string | null;
  occupation_mode: string;
  classification: string | null;
  worker_passport_id: string | null;
  current_organisation_id: string | null;
  city: string | null;
  state: string | null;
  country: string;
  locality: string | null;
  languages: string[] | null;
  preferred_work_locations: string[] | null;
  work_preference: string | null;
  availability_status: string;
  willing_to_relocate: boolean;
  willing_to_travel: boolean;
  arrangement: string;
  preferred_roles: string[] | null;
  preferred_cities: string[] | null;
  identity_verified: boolean;
  employment_verified: boolean;
  trade_verified: boolean;
};

export function mapPublicProfile(row: ProfileRow): PublicProfile {
  return {
    id: row.id,
    handle: row.handle,
    fullName: row.full_name,
    headline: row.headline,
    about: row.about,
    avatarPath: row.avatar_path,
    coverPath: row.cover_path,
    occupationMode: row.occupation_mode as OccupationMode,
    classification: row.classification,
    workerPassportId: row.worker_passport_id,
    currentOrganisationId: row.current_organisation_id,
    city: row.city,
    state: row.state,
    country: row.country,
    locality: row.locality,
    languages: row.languages ?? [],
    preferredWorkLocations: row.preferred_work_locations ?? [],
    workPreference: row.work_preference,
    availabilityStatus: row.availability_status as AvailabilityStatus,
    willingToRelocate: row.willing_to_relocate,
    willingToTravel: row.willing_to_travel,
    arrangement: row.arrangement as PublicProfile["arrangement"],
    preferredRoles: row.preferred_roles ?? [],
    preferredCities: row.preferred_cities ?? [],
    identityVerified: row.identity_verified,
    employmentVerified: row.employment_verified,
    tradeVerified: row.trade_verified,
  };
}

export function mapOrganisation(row: {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  about: string | null;
  organisation_type: string;
  industry: string | null;
  city: string | null;
  state: string | null;
  country: string;
  locality: string | null;
  founded_year: number | null;
  team_size_label: string | null;
  website: string | null;
}): Organisation {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    tagline: row.tagline,
    about: row.about,
    type: row.organisation_type as OrganisationType,
    industry: row.industry,
    city: row.city,
    state: row.state,
    country: row.country,
    locality: row.locality,
    foundedYear: row.founded_year,
    teamSizeLabel: row.team_size_label,
    website: row.website,
  };
}

export function mapProject(row: {
  id: string;
  slug: string;
  name: string;
  summary: string | null;
  project_type: string | null;
  status: string;
  city: string | null;
  locality: string | null;
  verified: boolean;
  client_organisation_id: string | null;
  main_contractor_id: string | null;
}): NetworkProject {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    summary: row.summary,
    type: row.project_type,
    status: row.status as NetworkProject["status"],
    city: row.city,
    locality: row.locality,
    verified: row.verified,
    clientOrganisationId: row.client_organisation_id,
    mainContractorId: row.main_contractor_id,
  };
}

export function mapJob(row: {
  id: string;
  organisation_id: string;
  recruiter_profile_id: string | null;
  title: string;
  city: string | null;
  employment_type: string;
  experience_label: string | null;
  salary_label: string | null;
  skills: string[] | null;
  description: string | null;
  responsibilities: string[] | null;
  requirements: string[] | null;
  easy_apply: boolean;
  created_at: string;
}): JobPost {
  return {
    id: row.id,
    organisationId: row.organisation_id,
    recruiterProfileId: row.recruiter_profile_id,
    title: row.title,
    city: row.city,
    employmentType: row.employment_type as JobPost["employmentType"],
    experienceLabel: row.experience_label,
    salaryLabel: row.salary_label,
    skills: row.skills ?? [],
    description: row.description,
    responsibilities: row.responsibilities ?? [],
    requirements: row.requirements ?? [],
    easyApply: row.easy_apply,
    createdAt: row.created_at,
  };
}

export function mapGig(row: {
  id: string;
  organisation_id: string;
  title: string;
  site_name: string | null;
  trade: string | null;
  shift_label: string | null;
  pay_label: string | null;
  distance_km: number | null;
  start_label: string | null;
  seats: number | null;
  duration: string | null;
  description: string | null;
  created_at: string;
}): GigPost {
  return {
    id: row.id,
    organisationId: row.organisation_id,
    title: row.title,
    siteName: row.site_name,
    trade: row.trade,
    shiftLabel: row.shift_label,
    payLabel: row.pay_label,
    distanceKm: row.distance_km,
    startLabel: row.start_label,
    seats: row.seats,
    duration: row.duration,
    description: row.description,
    createdAt: row.created_at,
  };
}

export function mapPost(row: {
  id: string;
  post_type: string;
  author_profile_id: string | null;
  author_organisation_id: string | null;
  body: string;
  linked_project_id: string | null;
  linked_job_id: string | null;
  linked_gig_id: string | null;
  created_at: string;
}): Post {
  return {
    id: row.id,
    postType: row.post_type,
    authorProfileId: row.author_profile_id,
    authorOrganisationId: row.author_organisation_id,
    body: row.body,
    linkedProjectId: row.linked_project_id,
    linkedJobId: row.linked_job_id,
    linkedGigId: row.linked_gig_id,
    createdAt: row.created_at,
  };
}

export function mapExperience(row: {
  id: string;
  profile_id: string;
  title: string;
  organisation_id: string | null;
  organisation_name_text: string | null;
  location_label: string | null;
  start_date: string | null;
  end_date: string | null;
  source: string;
  responsibilities: string[] | null;
}): Experience {
  return {
    id: row.id,
    profileId: row.profile_id,
    title: row.title,
    organisationId: row.organisation_id,
    organisationNameText: row.organisation_name_text,
    locationLabel: row.location_label,
    startDate: row.start_date,
    endDate: row.end_date,
    source: row.source as Experience["source"],
    responsibilities: row.responsibilities ?? [],
  };
}

export function mapSkill(row: {
  id: string;
  verification_level: string;
  rating: number | null;
  skills: { name: string } | { name: string }[] | null;
}): ProfileSkill {
  const skill = Array.isArray(row.skills) ? row.skills[0] : row.skills;
  return {
    id: row.id,
    skillName: skill?.name ?? "Skill",
    verificationLevel: row.verification_level as SkillVerificationLevel,
    rating: row.rating,
  };
}

export function mapCert(row: {
  id: string;
  name: string;
  issuer: string | null;
  issue_date: string | null;
  expiry_date: string | null;
  credential_id_public: string | null;
  verification_state: string;
}): ProfileCertification {
  return {
    id: row.id,
    name: row.name,
    issuer: row.issuer,
    issueDate: row.issue_date,
    expiryDate: row.expiry_date,
    credentialIdPublic: row.credential_id_public,
    verificationState: row.verification_state as VerificationState,
  };
}
