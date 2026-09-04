export type OccupationMode = "white_collar" | "blue_collar" | "freelancer" | "contractor";

export type ProfessionalTitle =
  | "white_collar"
  | "blue_collar"
  | "skilled_trade"
  | "gig_worker"
  | "freelancer"
  | "contractor"
  | "technician"
  | "supervisor"
  | "engineer"
  | "architect"
  | "designer"
  | "service_professional";

export type VisibilityAudience = "public" | "connections" | "recruiters" | "private";

export type AvailabilityStatus =
  | "not_looking"
  | "open_to_opportunities"
  | "open_to_jobs"
  | "open_to_gigs"
  | "available_immediately"
  | "engaged"
  | "on_leave";

export type OrganisationType =
  | "employer"
  | "service_provider"
  | "vendor"
  | "subcontractor"
  | "staffing_agency"
  | "developer"
  | "general_contractor"
  | "manufacturer"
  | "brand"
  | "consultancy"
  | "institution"
  | "training_organisation"
  | "recruitment_agency";

export type VerificationKind =
  | "identity"
  | "employment"
  | "trade"
  | "project"
  | "skill"
  | "credential"
  | "tatva";

export type VerificationState =
  | "verified"
  | "pending"
  | "expired"
  | "revoked"
  | "not_submitted"
  | "self_declared";

export type SkillVerificationLevel =
  | "self_declared"
  | "community_endorsed"
  | "employer_verified"
  | "certification_verified"
  | "tatva_verified";

export type EmploymentType = "permanent" | "contract" | "part_time" | "temporary" | "internship";

export type PostType =
  | "update"
  | "project_completion"
  | "before_after"
  | "hiring"
  | "gig_requirement"
  | "job_vacancy"
  | "certification"
  | "new_employee"
  | "work_anniversary"
  | "project_milestone"
  | "vendor_completion"
  | "case_study"
  | "product_service"
  | "site_progress"
  | "skill_achievement";

export type ConnectionStatus = "pending" | "accepted" | "declined";

export type QueryMeta = {
  configured: boolean;
  error: string | null;
};

export type ListOptions = {
  page?: number;
  pageSize?: number;
};

export type PublicProfile = {
  id: string;
  handle: string;
  fullName: string;
  headline: string | null;
  about: string | null;
  avatarPath: string | null;
  coverPath: string | null;
  occupationMode: OccupationMode;
  professionalTitle: ProfessionalTitle | null;
  classification: string | null;
  workerPassportId: string | null;
  currentOrganisationId: string | null;
  city: string | null;
  state: string | null;
  country: string;
  locality: string | null;
  languages: string[];
  preferredWorkLocations: string[];
  workPreference: string | null;
  availabilityStatus: AvailabilityStatus;
  willingToRelocate: boolean;
  willingToTravel: boolean;
  arrangement: "on_site" | "hybrid" | "remote";
  preferredRoles: string[];
  preferredCities: string[];
  website: string | null;
  emailVisibleTo: "none" | "connections" | "recruiters";
  aboutVisibleTo: VisibilityAudience;
  locationVisibleTo: VisibilityAudience;
  identityVerified: boolean;
  employmentVerified: boolean;
  tradeVerified: boolean;
};

export type Organisation = {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  about: string | null;
  type: OrganisationType;
  industry: string | null;
  city: string | null;
  state: string | null;
  country: string;
  locality: string | null;
  foundedYear: number | null;
  teamSizeLabel: string | null;
  website: string | null;
  logoPath: string | null;
  coverPath: string | null;
  publicPhone: string | null;
  publicEmail: string | null;
  officeLocality: string | null;
  serviceAreas: string[];
  /** True only when the signed-in viewer created this organisation. Never a public owner id. */
  isOwner: boolean;
  createdBy: string | null;
};

export type NetworkProject = {
  id: string;
  slug: string;
  name: string;
  summary: string | null;
  type: string | null;
  status: "completed" | "in_progress" | "handover";
  city: string | null;
  locality: string | null;
  verified: boolean;
  clientOrganisationId: string | null;
  mainContractorId: string | null;
};

export type JobPost = {
  id: string;
  organisationId: string;
  recruiterProfileId: string | null;
  title: string;
  city: string | null;
  employmentType: EmploymentType;
  experienceLabel: string | null;
  salaryLabel: string | null;
  skills: string[];
  description: string | null;
  responsibilities: string[];
  requirements: string[];
  easyApply: boolean;
  closedAt: string | null;
  createdAt: string;
};

export type GigPost = {
  id: string;
  organisationId: string;
  title: string;
  siteName: string | null;
  projectId: string | null;
  trade: string | null;
  shiftLabel: string | null;
  payLabel: string | null;
  distanceKm: number | null;
  startLabel: string | null;
  seats: number | null;
  duration: string | null;
  description: string | null;
  closedAt: string | null;
  createdAt: string;
};

export type PostComment = {
  id: string;
  postId: string;
  authorId: string;
  body: string;
  createdAt: string;
};

export type Post = {
  id: string;
  postType: string;
  authorProfileId: string | null;
  authorOrganisationId: string | null;
  body: string;
  linkedProjectId: string | null;
  linkedJobId: string | null;
  linkedGigId: string | null;
  createdAt: string;
};

export type Experience = {
  id: string;
  profileId: string;
  title: string;
  organisationId: string | null;
  organisationNameText: string | null;
  locationLabel: string | null;
  startDate: string | null;
  endDate: string | null;
  source: "self_declared" | "organisation_verified";
  responsibilities: string[];
};

export type ProfileSkill = {
  id: string;
  skillName: string;
  verificationLevel: SkillVerificationLevel;
  rating: number | null;
};

export type CredentialCategory =
  | "certification"
  | "licence"
  | "training"
  | "safety"
  | "professional_qualification";

export type ProfileCertification = {
  id: string;
  name: string;
  issuer: string | null;
  issueDate: string | null;
  expiryDate: string | null;
  credentialIdPublic: string | null;
  verificationState: VerificationState;
  category: CredentialCategory;
};

export type ServiceLedgerRow = {
  id: string;
  projectName: string;
  organisationName: string;
  role: string;
  startLabel: string | null;
  endLabel: string | null;
  verifiedShifts: number | null;
  rating: number | null;
  verificationSource?: "organisation" | "project_record" | "vertex";
};

export type ConversationSummary = {
  id: string;
  title: string | null;
  kind: string;
  preview: string | null;
  updatedAt: string;
};

export type MessageRow = {
  id: string;
  conversationId: string;
  senderId: string;
  body: string;
  readAt: string | null;
  createdAt: string;
};

export type ProfileService = {
  id: string;
  profileId: string;
  name: string;
  description: string | null;
  locations: string[];
  availabilityLabel: string | null;
};

export type ProjectMilestone = {
  id: string;
  projectId: string;
  title: string;
  body: string | null;
  occurredOn: string | null;
};

export type ProjectMedia = {
  id: string;
  projectId: string;
  storagePath: string;
  caption: string | null;
  kind: "photo" | "before" | "after";
};

export type NotificationRow = {
  id: string;
  kind: string;
  title: string;
  body: string | null;
  href: string | null;
  readAt: string | null;
  createdAt: string;
};

export type OrgService = {
  id: string;
  organisationId: string;
  name: string;
  description: string | null;
  locations: string[];
  pricingModel: string | null;
};

export type OrgCredential = {
  id: string;
  name: string;
  category: string;
  verificationState: VerificationState;
  expiryLabel: string | null;
};

export type ReviewRow = {
  id: string;
  relationship: "verified_client" | "verified_employer";
  rating: number;
  body: string | null;
  reviewerName: string | null;
  reviewerRole: string | null;
  createdAt: string;
};

export type RecommendationRow = {
  id: string;
  fromProfileId: string;
  relationship: string | null;
  body: string;
  createdAt: string;
};

export type SkillCatalogItem = {
  id: string;
  name: string;
  category: string | null;
};

export type AuthContext = {
  userId: string | null;
  profile: PublicProfile | null;
  configured: boolean;
  isPlatformAdmin: boolean;
};

export type PendingConnection = {
  id: string;
  profile: PublicProfile;
};

export type OpportunityApplication = {
  id: string;
  entityId: string;
  profileId: string;
  status: string;
  createdAt: string;
  profile?: PublicProfile | null;
};

export type SavedItem = {
  id: string;
  entityKind: string;
  entityId: string;
  createdAt: string;
};

export type WorkGraphEdge = {
  kind: "worked_with" | "shared_organisation" | "shared_project";
  fromId: string;
  toId: string;
  label: string;
};
