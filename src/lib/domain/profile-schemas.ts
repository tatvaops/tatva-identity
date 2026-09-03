import { z } from "zod";

export const aboutSchema = z.object({
  headline: z.string().trim().max(160),
  about: z.string().trim().max(4000),
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
  credentialIdPublic: z.string().trim().max(80),
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
});

export const projectSchema = z.object({
  name: z.string().trim().min(2).max(160),
  summary: z.string().trim().max(500),
  city: z.string().trim().max(80),
  roleTitle: z.string().trim().max(120),
});
