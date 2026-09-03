"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
  addSkill,
  updateAvailability,
  updateProfileAbout,
} from "@/lib/actions/profile";
import {
  aboutSchema,
  availabilitySchema,
  certificationSchema,
  experienceSchema,
  projectSchema,
  skillSchema,
} from "@/lib/domain/profile-schemas";
import type { PublicProfile } from "@/lib/types/identity";

type Editor = "about" | "experience" | "skill" | "certification" | "project" | "availability" | null;

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
    </>
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
    defaultValues: { headline: profile.headline ?? "", about: profile.about ?? "" },
  });
  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent>
        <DialogTitle>Edit about</DialogTitle>
        <DialogDescription>Only fields you save are stored.</DialogDescription>
        <form
          className="mt-4 space-y-3"
          onSubmit={form.handleSubmit(async (values) => {
            const result = await updateProfileAbout(values);
            if (!result.ok) {
              setServerError(result.error);
              return;
            }
            onClose();
            router.refresh();
          })}
        >
          <Input placeholder="Headline" {...form.register("headline")} />
          <Textarea placeholder="About" {...form.register("about")} />
          <FieldError message={form.formState.errors.headline?.message} />
          {serverError && <p className="text-sm text-rose-700">{serverError}</p>}
          <Button type="submit" disabled={form.formState.isSubmitting}>
            Save
          </Button>
        </form>
        <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-3">
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
  const form = useForm({
    resolver: zodResolver(certificationSchema),
    defaultValues: { name: "", issuer: "", issueDate: "", credentialIdPublic: "" },
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
          <Input placeholder="Credential name" {...form.register("name")} />
          <Input placeholder="Issuer" {...form.register("issuer")} />
          <Input type="date" {...form.register("issueDate")} />
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
          {serverError && <p className="text-sm text-rose-700">{serverError}</p>}
          <Button type="submit" disabled={form.formState.isSubmitting}>
            Save
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
