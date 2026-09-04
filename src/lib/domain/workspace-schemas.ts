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
  publicPhone: z.string().trim().max(20).optional(),
  publicEmail: z.string().trim().max(120).optional(),
  officeLocality: z.string().trim().max(80).optional(),
  serviceAreas: z.string().trim().max(400).optional(),
  teamSizeLabel: z.string().trim().max(40).optional(),
  state: z.string().trim().max(80).optional(),
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
  responsibilities: z.string().trim().max(2000).optional(),
  requirements: z.string().trim().max(2000).optional(),
  easyApply: z.boolean().optional(),
  jobId: z.string().uuid().optional(),
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
  projectId: z.string().uuid().optional().or(z.literal("")),
  distanceKm: z.string().trim().max(8).optional(),
  gigId: z.string().uuid().optional(),
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

export const orgMemberSchema = z.object({
  organisationId: z.string().uuid(),
  handle: z.string().trim().min(2).max(80),
  roleTitle: z.string().trim().max(80),
  department: z.string().trim().max(80),
  orgRole: z.enum(["admin", "recruiter", "member"]),
  visibility: z.enum(["public", "private"]),
});

export const reviewSchema = z.object({
  organisationId: z.string().uuid(),
  rating: z.number().min(1).max(5),
  body: z.string().trim().min(8).max(1000),
  relationship: z.enum(["verified_client", "verified_employer"]),
  projectId: z.string().uuid().optional(),
});

export const recommendationRequestSchema = z.object({
  toProfileId: z.string().uuid(),
});
