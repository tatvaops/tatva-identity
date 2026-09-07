import { z } from "zod";

export const aboutSchema = z.object({
  headline: z.string().trim().max(160),
  about: z.string().trim().max(4000),
  fullName: z.string().trim().min(2).max(80).optional(),
  website: z.string().trim().max(200).optional(),
  languages: z.string().trim().max(240).optional(),
  preferredWorkLocations: z.string().trim().max(240).optional(),
  locality: z.string().trim().max(80).optional(),
  state: z.string().trim().max(80).optional(),
  willingToRelocate: z.boolean().optional(),
  willingToTravel: z.boolean().optional(),
  arrangement: z.enum(["on_site", "hybrid", "remote"]).optional(),
  emailVisibleTo: z.enum(["none", "connections", "recruiters"]).optional(),
  aboutVisibleTo: z.enum(["public", "connections", "recruiters", "private"]).optional(),
  locationVisibleTo: z.enum(["public", "connections", "recruiters", "private"]).optional(),
  professionalTitle: z
    .enum([
      "white_collar",
      "blue_collar",
      "skilled_trade",
      "gig_worker",
      "freelancer",
      "contractor",
      "technician",
      "supervisor",
      "engineer",
      "architect",
      "designer",
      "service_professional",
    ])
    .optional(),
});

export const experienceSchema = z.object({
  title: z.string().trim().min(2).max(120),
  organisationName: z.string().trim().max(160),
  locationLabel: z.string().trim().max(120),
  startDate: z.string().trim().max(10),
  endDate: z.string().trim().max(10),
  responsibilities: z.string().trim().max(2000),
  isCurrent: z.boolean().optional(),
});

export const skillSchema = z.object({
  name: z.string().trim().min(2).max(80),
  category: z.string().trim().max(80).optional(),
  yearsExperience: z.string().trim().max(8).optional(),
});

export const educationSchema = z.object({
  institution: z.string().trim().min(2).max(160),
  qualification: z.string().trim().max(160).optional(),
  course: z.string().trim().max(160).optional(),
  fieldOfStudy: z.string().trim().max(120).optional(),
  startDate: z.string().trim().max(10).optional(),
  endDate: z.string().trim().max(10).optional(),
  credentialIdPublic: z.string().trim().max(80).optional(),
});

export const privacySchema = z.object({
  aboutVisibleTo: z.enum(["public", "connections", "recruiters", "private"]),
  locationVisibleTo: z.enum(["public", "connections", "recruiters", "private"]),
  emailVisibleTo: z.enum(["none", "connections", "recruiters"]),
  availabilityVisibleTo: z.enum(["public", "connections", "recruiters", "private"]),
  connectionsVisibleTo: z.enum(["public", "connections", "recruiters", "private"]),
  activityVisibleTo: z.enum(["public", "connections", "recruiters", "private"]),
  projectsVisibleTo: z.enum(["public", "connections", "recruiters", "private"]),
  experienceVisibleTo: z.enum(["public", "connections", "recruiters", "private"]),
});

export const notificationPrefsSchema = z.object({
  notifyConnections: z.boolean(),
  notifyMessages: z.boolean(),
  notifyApplications: z.boolean(),
  notifySocial: z.boolean(),
  notifyOrganisation: z.boolean(),
});

export const reportSchema = z.object({
  entityKind: z.enum(["post", "profile", "organisation", "job", "gig", "project"]),
  entityId: z.string().uuid(),
  reason: z.string().trim().min(4).max(280),
});

export const certificationSchema = z.object({
  name: z.string().trim().min(2).max(160),
  issuer: z.string().trim().max(160),
  issueDate: z.string().trim().max(10),
  expiryDate: z.string().trim().max(10),
  credentialIdPublic: z.string().trim().max(80),
  category: z.enum([
    "certification",
    "licence",
    "training",
    "safety",
    "professional_qualification",
  ]),
});

export const availabilitySchema = z.object({
  availabilityStatus: z.enum([
    "not_looking",
    "open_to_opportunities",
    "open_to_jobs",
    "open_to_gigs",
    "available_immediately",
    "engaged",
    "on_leave",
  ]),
  occupationMode: z.enum(["white_collar", "blue_collar", "freelancer", "contractor"]),
  city: z.string().trim().max(80),
  preferredRoles: z.string().trim().max(240),
  dailyRateInr: z.string().trim().max(10).optional(),
  monthlySalaryInr: z.string().trim().max(10).optional(),
  noticePeriod: z.string().trim().max(80).optional(),
});

export const projectSchema = z.object({
  name: z.string().trim().min(2).max(160),
  summary: z.string().trim().max(500),
  city: z.string().trim().max(80),
  roleTitle: z.string().trim().max(120),
});

export const profileServiceSchema = z.object({
  name: z.string().trim().min(2).max(160),
  description: z.string().trim().max(1000),
  locations: z.string().trim().max(400),
  availabilityLabel: z.string().trim().max(80),
  category: z.string().trim().max(80).optional(),
  pricingModel: z.string().trim().max(80).optional(),
});

export const verificationRequestSchema = z.object({
  kind: z.enum(["identity", "employment", "trade", "skill", "credential", "project", "tatva"]),
});

export const endorsementSchema = z.object({
  profileSkillId: z.string().uuid(),
});

export const handleSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9][a-z0-9-]{1,62}[a-z0-9]$/, "Use 3–64 letters, numbers or hyphens.");

export const onboardingSchema = z.object({
  fullName: z.string().trim().min(2).max(80),
  handle: z.string().trim().max(64).optional(),
  headline: z.string().trim().max(160).optional(),
  about: z.string().trim().max(4000).optional(),
  city: z.string().trim().max(80).optional(),
  state: z.string().trim().max(80).optional(),
  occupationMode: z.enum(["white_collar", "blue_collar", "freelancer", "contractor"]),
  skipHandle: z.boolean().optional(),
  languages: z.string().trim().max(240).optional(),
  specialisation: z.string().trim().max(120).optional(),
  professionalTitle: z
    .enum([
      "white_collar",
      "blue_collar",
      "skilled_trade",
      "gig_worker",
      "freelancer",
      "contractor",
      "technician",
      "supervisor",
      "engineer",
      "architect",
      "designer",
      "service_professional",
    ])
    .optional(),
  availabilityStatus: z
    .enum([
      "not_looking",
      "open_to_opportunities",
      "open_to_jobs",
      "open_to_gigs",
      "available_immediately",
      "engaged",
      "on_leave",
    ])
    .optional(),
  step: z.number().int().min(0).max(20).optional(),
  markComplete: z.boolean().optional(),
});

export const evidenceItemSchema = z.object({
  claimKind: z.enum(["skill", "experience", "project", "certification", "education", "service", "portfolio"]),
  note: z.string().trim().max(400).optional(),
  mediaPath: z.string().trim().max(500).optional(),
  claimId: z.string().uuid().optional(),
});

export const portfolioItemSchema = z.object({
  imageUrl: z.string().trim().min(8).max(500),
  caption: z.string().trim().max(160).optional(),
  workCategory: z.string().trim().max(80).optional(),
  location: z.string().trim().max(80).optional(),
});

export const skillFactSchema = z.object({
  skillName: z.string().trim().min(2).max(80),
  yearsExperience: z.string().trim().max(8).optional(),
  tools: z.string().trim().max(240).optional(),
  proficiency: z.string().trim().max(80).optional(),
});

export const recordIdSchema = z.object({
  id: z.string().uuid(),
});
