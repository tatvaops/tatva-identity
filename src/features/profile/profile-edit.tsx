"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useSession } from "@/components/providers/session-provider";
import {
  addCertification,
  addExperience,
  addOptedInProject,
  addProfileService,
  addSkill,
  endorseSkill,
  requestVerification,
  updateAvailability,
  updateProfileAbout,
} from "@/lib/actions/profile";
import { uploadPublicImage } from "@/lib/actions/media";
import {
  aboutSchema,
  availabilitySchema,
  certificationSchema,
  experienceSchema,
  profileServiceSchema,
  projectSchema,
  skillSchema,
  verificationRequestSchema,
} from "@/lib/domain/profile-schemas";
import { CREDENTIAL_CATEGORIES } from "@/lib/domain/credentials";
import { PROFESSIONAL_TITLES } from "@/lib/domain/professional-titles";
import type { PublicProfile } from "@/lib/types/identity";

type Editor =
  | "about"
  | "experience"
  | "skill"
  | "certification"
  | "project"
  | "availability"
  | "service"
  | "verification"
  | "photo"
  | null;

export function ProfileEditors({
  profile,
  canEdit,
}: {
  profile: PublicProfile;
  canEdit: boolean;
}) {
  const session = useSession();
  const [open, setOpen] = useState<Editor>(null);
  if (!canEdit || session.profile?.id !== profile.id) return null;
  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen("about")}>
        Edit profile
      </Button>
      <AboutDialog profile={profile} open={open === "about"} onClose={() => setOpen(null)} onMore={setOpen} />
      <ExperienceDialog open={open === "experience"} onClose={() => setOpen(null)} />
      <SkillDialog open={open === "skill"} onClose={() => setOpen(null)} />
      <CertificationDialog open={open === "certification"} onClose={() => setOpen(null)} />
      <ProjectDialog open={open === "project"} onClose={() => setOpen(null)} />
      <AvailabilityDialog profile={profile} open={open === "availability"} onClose={() => setOpen(null)} />
      <ServiceDialog open={open === "service"} onClose={() => setOpen(null)} />
      <VerificationDialog open={open === "verification"} onClose={() => setOpen(null)} />
      <PhotoDialog open={open === "photo"} onClose={() => setOpen(null)} />
    </>
  );
}

export function EndorseSkillButton({ profileSkillId }: { profileSkillId: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  return (
    <span className="mt-1 block">
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={pending}
        onClick={async () => {
          setPending(true);
          const result = await endorseSkill({ profileSkillId });
          setPending(false);
          if (!result.ok) {
            setError(result.error);
            return;
          }
          router.refresh();
        }}
      >
        Endorse
      </Button>
      {error ? <span className="mt-1 block text-[11px] text-rose-700">{error}</span> : null}
    </span>
  );
}

export function ProfileSectionEdit({ kind, label }: { kind: Exclude<Editor, "about" | null>; label: string }) {
  const { profile } = useSession();
  const [open, setOpen] = useState(false);
  if (!profile) return null;
  return (
    <>
      <Button variant="ghost" size="sm" onClick={() => setOpen(true)}>
        {label}
      </Button>
      {kind === "experience" && <ExperienceDialog open={open} onClose={() => setOpen(false)} />}
      {kind === "skill" && <SkillDialog open={open} onClose={() => setOpen(false)} />}
      {kind === "certification" && <CertificationDialog open={open} onClose={() => setOpen(false)} />}
      {kind === "project" && <ProjectDialog open={open} onClose={() => setOpen(false)} />}
      {kind === "availability" && (
        <AvailabilityDialog profile={profile} open={open} onClose={() => setOpen(false)} />
      )}
      {kind === "service" && <ServiceDialog open={open} onClose={() => setOpen(false)} />}
      {kind === "verification" && <VerificationDialog open={open} onClose={() => setOpen(false)} />}
      {kind === "photo" && <PhotoDialog open={open} onClose={() => setOpen(false)} />}
    </>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-xs text-rose-700">{message}</p>;
}

function AboutDialog({
  profile,
  open,
  onClose,
  onMore,
}: {
  profile: PublicProfile;
  open: boolean;
  onClose: () => void;
  onMore: (editor: Editor) => void;
}) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const form = useForm({
    resolver: zodResolver(aboutSchema),
    defaultValues: {
      headline: profile.headline ?? "",
      about: profile.about ?? "",
      fullName: profile.fullName,
      website: profile.website ?? "",
      languages: profile.languages.join(", "),
      preferredWorkLocations: profile.preferredWorkLocations.join(", "),
      locality: profile.locality ?? "",
      state: profile.state ?? "",
      arrangement: profile.arrangement,
      willingToRelocate: profile.willingToRelocate,
      willingToTravel: profile.willingToTravel,
      professionalTitle: profile.professionalTitle ?? undefined,
      emailVisibleTo: profile.emailVisibleTo,
      aboutVisibleTo: profile.aboutVisibleTo,
      locationVisibleTo: profile.locationVisibleTo,
    },
  });
  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogTitle>Edit about</DialogTitle>
        <DialogDescription>Only fields you save are stored.</DialogDescription>
        <form
          className="mt-4 space-y-3"
          onSubmit={form.handleSubmit(async (values) => {
            const result = await updateProfileAbout({
              ...values,
              professionalTitle: values.professionalTitle || undefined,
            });
            if (!result.ok) {
              setServerError(result.error);
              return;
            }
            onClose();
            router.refresh();
          })}
        >
          <Input placeholder="Full name" {...form.register("fullName")} />
          <Input placeholder="Headline" {...form.register("headline")} />
          <Textarea placeholder="About" {...form.register("about")} />
          <Input placeholder="Website" {...form.register("website")} />
          <Input placeholder="Languages, comma separated" {...form.register("languages")} />
          <Input placeholder="Preferred work locations, comma separated" {...form.register("preferredWorkLocations")} />
          <div className="grid grid-cols-2 gap-2">
            <Input placeholder="Locality" {...form.register("locality")} />
            <Input placeholder="State" {...form.register("state")} />
          </div>
          <label className="block text-xs font-medium text-muted-foreground" htmlFor="professional-title">
            Professional title
          </label>
          <select
            id="professional-title"
            className="h-10 w-full rounded-lg border border-input px-3 text-sm"
            {...form.register("professionalTitle")}
          >
            <option value="">Not specified</option>
            {PROFESSIONAL_TITLES.map((title) => (
              <option key={title.id} value={title.id}>
                {title.label}
              </option>
            ))}
          </select>
          <label className="block text-xs font-medium text-muted-foreground" htmlFor="arrangement">
            Arrangement
          </label>
          <select id="arrangement" className="h-10 w-full rounded-lg border border-input px-3 text-sm" {...form.register("arrangement")}>
            <option value="on_site">On site</option>
            <option value="hybrid">Hybrid</option>
            <option value="remote">Remote</option>
          </select>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" {...form.register("willingToRelocate")} />
            Willing to relocate
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" {...form.register("willingToTravel")} />
            Willing to travel
          </label>
          <label className="block text-xs font-medium text-muted-foreground" htmlFor="about-visible">
            About visibility
          </label>
          <select id="about-visible" className="h-10 w-full rounded-lg border border-input px-3 text-sm" {...form.register("aboutVisibleTo")}>
            <option value="public">Public</option>
            <option value="connections">Connections</option>
            <option value="recruiters">Recruiters</option>
            <option value="private">Private</option>
          </select>
          <label className="block text-xs font-medium text-muted-foreground" htmlFor="location-visible">
            Location visibility
          </label>
          <select id="location-visible" className="h-10 w-full rounded-lg border border-input px-3 text-sm" {...form.register("locationVisibleTo")}>
            <option value="public">Public</option>
            <option value="connections">Connections</option>
            <option value="recruiters">Recruiters</option>
            <option value="private">Private</option>
          </select>
          <label className="block text-xs font-medium text-muted-foreground" htmlFor="email-visible">
            Email visibility
          </label>
          <select id="email-visible" className="h-10 w-full rounded-lg border border-input px-3 text-sm" {...form.register("emailVisibleTo")}>
            <option value="none">Hidden</option>
            <option value="connections">Connections</option>
            <option value="recruiters">Recruiters</option>
          </select>
          <FieldError message={form.formState.errors.headline?.message ?? form.formState.errors.fullName?.message} />
          {serverError && <p className="text-sm text-rose-700">{serverError}</p>}
          <Button type="submit" disabled={form.formState.isSubmitting}>
            Save
          </Button>
        </form>
        <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-3">
          <Button size="sm" variant="outline" onClick={() => onMore("photo")}>
            Photos
          </Button>
          <Button size="sm" variant="outline" onClick={() => onMore("experience")}>
            Add experience
          </Button>
          <Button size="sm" variant="outline" onClick={() => onMore("skill")}>
            Add skill
          </Button>
          <Button size="sm" variant="outline" onClick={() => onMore("certification")}>
            Add credential
          </Button>
          <Button size="sm" variant="outline" onClick={() => onMore("project")}>
            Add project
          </Button>
          <Button size="sm" variant="outline" onClick={() => onMore("service")}>
            Add service
          </Button>
          <Button size="sm" variant="outline" onClick={() => onMore("verification")}>
            Request verification
          </Button>
          <Button size="sm" variant="outline" onClick={() => onMore("availability")}>
            Availability
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ExperienceDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const form = useForm({
    resolver: zodResolver(experienceSchema),
    defaultValues: {
      title: "",
      organisationName: "",
      locationLabel: "",
      startDate: "",
      endDate: "",
      responsibilities: "",
    },
  });
  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent>
        <DialogTitle>Add experience</DialogTitle>
        <DialogDescription>This is self-declared until an organisation verifies it.</DialogDescription>
        <form
          className="mt-4 space-y-3"
          onSubmit={form.handleSubmit(async (values) => {
            const result = await addExperience(values);
            if (!result.ok) {
              setServerError(result.error);
              return;
            }
            form.reset();
            onClose();
            router.refresh();
          })}
        >
          <Input placeholder="Role" {...form.register("title")} />
          <Input placeholder="Organisation name" {...form.register("organisationName")} />
          <Input placeholder="Location" {...form.register("locationLabel")} />
          <div className="grid grid-cols-2 gap-2">
            <Input type="date" {...form.register("startDate")} />
            <Input type="date" {...form.register("endDate")} />
          </div>
          <Textarea placeholder="Responsibilities, one per line" {...form.register("responsibilities")} />
          <FieldError message={form.formState.errors.title?.message} />
          {serverError && <p className="text-sm text-rose-700">{serverError}</p>}
          <Button type="submit" disabled={form.formState.isSubmitting}>
            Save
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function SkillDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const form = useForm({ resolver: zodResolver(skillSchema), defaultValues: { name: "" } });
  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent>
        <DialogTitle>Add skill</DialogTitle>
        <DialogDescription>Starts as self-declared. Verification comes from work or credentials later.</DialogDescription>
        <form
          className="mt-4 space-y-3"
          onSubmit={form.handleSubmit(async (values) => {
            const result = await addSkill(values);
            if (!result.ok) {
              setServerError(result.error);
              return;
            }
            form.reset();
            onClose();
            router.refresh();
          })}
        >
          <Input placeholder="Skill name" {...form.register("name")} />
          <FieldError message={form.formState.errors.name?.message} />
          {serverError && <p className="text-sm text-rose-700">{serverError}</p>}
          <Button type="submit" disabled={form.formState.isSubmitting}>
            Save
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function CertificationDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const form = useForm<z.infer<typeof certificationSchema>>({
    resolver: zodResolver(certificationSchema),
    defaultValues: {
      name: "",
      issuer: "",
      issueDate: "",
      expiryDate: "",
      credentialIdPublic: "",
      category: "certification",
    },
  });
  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent>
        <DialogTitle>Add credential</DialogTitle>
        <DialogDescription>Public name and issuer only. Files stay in private storage.</DialogDescription>
        <form
          className="mt-4 space-y-3"
          onSubmit={form.handleSubmit(async (values) => {
            const result = await addCertification(values);
            if (!result.ok) {
              setServerError(result.error);
              return;
            }
            form.reset();
            onClose();
            router.refresh();
          })}
        >
          <select className="h-10 w-full rounded-lg border border-input px-3 text-sm" {...form.register("category")}>
            {CREDENTIAL_CATEGORIES.map((category) => (
              <option key={category.id} value={category.id}>
                {category.label}
              </option>
            ))}
          </select>
          <Input placeholder="Credential name" {...form.register("name")} />
          <Input placeholder="Issuer" {...form.register("issuer")} />
          <label className="block text-xs font-medium text-muted-foreground" htmlFor="issue-date">
            Issue date
          </label>
          <Input id="issue-date" type="date" {...form.register("issueDate")} />
          <label className="block text-xs font-medium text-muted-foreground" htmlFor="expiry-date">
            Expiry date
          </label>
          <Input id="expiry-date" type="date" {...form.register("expiryDate")} />
          <Input placeholder="Public credential id (optional)" {...form.register("credentialIdPublic")} />
          <FieldError message={form.formState.errors.name?.message} />
          {serverError && <p className="text-sm text-rose-700">{serverError}</p>}
          <Button type="submit" disabled={form.formState.isSubmitting}>
            Save
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ProjectDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const form = useForm({
    resolver: zodResolver(projectSchema),
    defaultValues: { name: "", summary: "", city: "", roleTitle: "" },
  });
  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent>
        <DialogTitle>Add project</DialogTitle>
        <DialogDescription>Creates a public project identity you opt into. This is not a Vertex site record.</DialogDescription>
        <form
          className="mt-4 space-y-3"
          onSubmit={form.handleSubmit(async (values) => {
            const result = await addOptedInProject(values);
            if (!result.ok) {
              setServerError(result.error);
              return;
            }
            form.reset();
            onClose();
            router.refresh();
          })}
        >
          <Input placeholder="Project name" {...form.register("name")} />
          <Textarea placeholder="Summary" {...form.register("summary")} />
          <Input placeholder="City" {...form.register("city")} />
          <Input placeholder="Your role" {...form.register("roleTitle")} />
          <FieldError message={form.formState.errors.name?.message} />
          {serverError && <p className="text-sm text-rose-700">{serverError}</p>}
          <Button type="submit" disabled={form.formState.isSubmitting}>
            Save
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function AvailabilityDialog({
  profile,
  open,
  onClose,
}: {
  profile: PublicProfile;
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const form = useForm({
    resolver: zodResolver(availabilitySchema),
    defaultValues: {
      availabilityStatus: profile.availabilityStatus,
      occupationMode: profile.occupationMode,
      city: profile.city ?? "",
      preferredRoles: profile.preferredRoles.join(", "),
      dailyRateInr: "",
      monthlySalaryInr: "",
      noticePeriod: "",
    },
  });
  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent>
        <DialogTitle>Edit availability</DialogTitle>
        <DialogDescription>Rates stay private. This only updates public availability.</DialogDescription>
        <form
          className="mt-4 space-y-3"
          onSubmit={form.handleSubmit(async (values) => {
            const result = await updateAvailability(values);
            if (!result.ok) {
              setServerError(result.error);
              return;
            }
            onClose();
            router.refresh();
          })}
        >
          <select className="h-10 w-full rounded-lg border border-input px-3 text-sm" {...form.register("availabilityStatus")}>
            <option value="not_looking">Not looking</option>
            <option value="open_to_opportunities">Open to opportunities</option>
            <option value="open_to_jobs">Open to jobs</option>
            <option value="open_to_gigs">Open to work</option>
            <option value="available_immediately">Available immediately</option>
            <option value="engaged">Engaged</option>
            <option value="on_leave">On leave</option>
          </select>
          <select className="h-10 w-full rounded-lg border border-input px-3 text-sm" {...form.register("occupationMode")}>
            <option value="white_collar">White collar</option>
            <option value="blue_collar">Skilled / site</option>
            <option value="freelancer">Freelancer</option>
            <option value="contractor">Contractor</option>
          </select>
          <Input placeholder="City" {...form.register("city")} />
          <Input placeholder="Preferred roles, comma separated" {...form.register("preferredRoles")} />
          <label className="block text-xs font-medium text-muted-foreground" htmlFor="daily-rate">
            Daily rate (private to you)
          </label>
          <Input id="daily-rate" inputMode="numeric" placeholder="INR" {...form.register("dailyRateInr")} />
          <label className="block text-xs font-medium text-muted-foreground" htmlFor="monthly-rate">
            Monthly rate (private to you)
          </label>
          <Input id="monthly-rate" inputMode="numeric" placeholder="INR" {...form.register("monthlySalaryInr")} />
          <Input placeholder="Notice period" {...form.register("noticePeriod")} />
          {serverError && <p className="text-sm text-rose-700">{serverError}</p>}
          <Button type="submit" disabled={form.formState.isSubmitting}>
            Save
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ServiceDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const form = useForm({
    resolver: zodResolver(profileServiceSchema),
    defaultValues: { name: "", description: "", locations: "", availabilityLabel: "" },
  });
  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent>
        <DialogTitle>Add a service</DialogTitle>
        <DialogDescription>Listed on your profile. This is not a quote or payment flow.</DialogDescription>
        <form
          className="mt-4 space-y-3"
          onSubmit={form.handleSubmit(async (values) => {
            const result = await addProfileService(values);
            if (!result.ok) {
              setServerError(result.error);
              return;
            }
            form.reset();
            onClose();
            router.refresh();
          })}
        >
          <Input placeholder="Service name" {...form.register("name")} />
          <Textarea placeholder="Description" {...form.register("description")} />
          <Input placeholder="Locations, comma separated" {...form.register("locations")} />
          <Input placeholder="Availability label" {...form.register("availabilityLabel")} />
          <FieldError message={form.formState.errors.name?.message} />
          {serverError && <p className="text-sm text-rose-700">{serverError}</p>}
          <Button type="submit" disabled={form.formState.isSubmitting}>
            Save
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function VerificationDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const form = useForm({
    resolver: zodResolver(verificationRequestSchema),
    defaultValues: { kind: "identity" as const },
  });
  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent>
        <DialogTitle>Request verification</DialogTitle>
        <DialogDescription>Creates a pending request. It is not verified until reviewed.</DialogDescription>
        <form
          className="mt-4 space-y-3"
          onSubmit={form.handleSubmit(async (values) => {
            const result = await requestVerification(values);
            if (!result.ok) {
              setServerError(result.error);
              return;
            }
            onClose();
            router.refresh();
          })}
        >
          <select className="h-10 w-full rounded-lg border border-input px-3 text-sm" {...form.register("kind")}>
            <option value="identity">Identity</option>
            <option value="employment">Employment</option>
            <option value="trade">Trade</option>
            <option value="skill">Skill</option>
            <option value="credential">Credential</option>
            <option value="project">Project</option>
            <option value="tatva">Tatva</option>
          </select>
          {serverError && <p className="text-sm text-rose-700">{serverError}</p>}
          <Button type="submit" disabled={form.formState.isSubmitting}>
            Submit request
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function PhotoDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  async function upload(kind: "avatar" | "cover", file: File | undefined) {
    if (!file) return;
    setPending(true);
    const data = new FormData();
    data.set("file", file);
    data.set("kind", kind);
    const result = await uploadPublicImage(data);
    setPending(false);
    if (!result.ok) {
      setServerError(result.error);
      return;
    }
    onClose();
    router.refresh();
  }
  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent>
        <DialogTitle>Profile photos</DialogTitle>
        <DialogDescription>JPEG, PNG or WebP, under 5 MB.</DialogDescription>
        <div className="mt-4 space-y-3">
          <label className="block text-sm font-medium">
            Profile photo
            <Input
              className="mt-1"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              disabled={pending}
              onChange={(event) => void upload("avatar", event.target.files?.[0])}
            />
          </label>
          <label className="block text-sm font-medium">
            Cover photo
            <Input
              className="mt-1"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              disabled={pending}
              onChange={(event) => void upload("cover", event.target.files?.[0])}
            />
          </label>
          {serverError && <p className="text-sm text-rose-700">{serverError}</p>}
        </div>
      </DialogContent>
    </Dialog>
  );
}
