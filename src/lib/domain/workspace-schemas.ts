import { z } from "zod";

export const organisationTypes = [
  "employer",
  "service_provider",
  "vendor",
  "subcontractor",
  "staffing_agency",
  "developer",
  "general_contractor",
  "manufacturer",
  "brand",
  "consultancy",
  "institution",
  "training_organisation",
  "recruitment_agency",
] as const;

export const organisationSchema = z.object({
  name: z.string().trim().min(2).max(160),
  tagline: z.string().trim().max(180),
  about: z.string().trim().max(4000),
  type: z.enum(organisationTypes),
  industry: z.string().trim().max(80),
  city: z.string().trim().max(80),
  locality: z.string().trim().max(80),
  foundedYear: z.string().trim().max(4),
  website: z.string().trim().max(200),
});

export const orgServiceSchema = z.object({
  organisationId: z.string().uuid(),
  name: z.string().trim().min(2).max(160),
  description: z.string().trim().max(1000),
  locations: z.string().trim().max(400),
  pricingModel: z.string().trim().max(80),
});

export const orgCredentialSchema = z.object({
  organisationId: z.string().uuid(),
  name: z.string().trim().min(2).max(160),
  category: z.string().trim().min(2).max(80),
});

export const jobPostSchema = z.object({
  organisationId: z.string().uuid(),
  title: z.string().trim().min(2).max(160),
  city: z.string().trim().max(80),
  employmentType: z.enum(["permanent", "contract", "part_time", "temporary", "internship"]),
  experienceLabel: z.string().trim().max(80),
  salaryLabel: z.string().trim().max(80),
  skills: z.string().trim().max(400),
  description: z.string().trim().max(4000),
});

export const gigPostSchema = z.object({
  organisationId: z.string().uuid(),
  title: z.string().trim().min(2).max(160),
  siteName: z.string().trim().max(120),
  trade: z.string().trim().max(80),
  shiftLabel: z.string().trim().max(80),
  payLabel: z.string().trim().max(80),
  startLabel: z.string().trim().max(80),
  seats: z.string().trim().max(4),
  duration: z.enum(["4_hours", "1_shift", "1_day", "3_days", "1_week", "project"]),
  description: z.string().trim().max(2000),
});

export const recommendationSchema = z.object({
  toProfileId: z.string().uuid(),
  relationship: z.string().trim().max(80),
  body: z.string().trim().min(8).max(1000),
});

export const applicationStatusSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["submitted", "shortlisted", "rejected", "hired", "accepted"]),
});
