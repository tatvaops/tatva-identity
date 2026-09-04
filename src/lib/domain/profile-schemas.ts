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
});

export const skillSchema = z.object({
  name: z.string().trim().min(2).max(80),
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
});

export const verificationRequestSchema = z.object({
  kind: z.enum(["identity", "employment", "trade", "skill", "credential", "project", "tatva"]),
});

export const endorsementSchema = z.object({
  profileSkillId: z.string().uuid(),
});
