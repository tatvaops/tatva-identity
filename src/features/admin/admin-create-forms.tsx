"use client";

import { useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  adminCreateCertification,
  adminCreateExperience,
  adminCreateGig,
  adminCreateJob,
  adminCreateOrganisation,
  adminCreateOrgCredential,
  adminCreatePerson,
  adminCreatePost,
  adminCreateProject,
  adminCreateVerificationRequest,
} from "@/lib/admin/create-actions";
import { organisationTypes } from "@/lib/domain/workspace-schemas";
import { AdminMediaField } from "@/features/admin/admin-media-field";
import type { ActionResult } from "@/lib/actions/shared";

type Choice = { id: string; name?: string; full_name?: string; handle?: string };

function CreateCard({ title, body, children }: { title: string; body: string; children: ReactNode }) {
  return (
    <Card className="mb-6 p-5">
      <p className="text-sm font-semibold">{title}</p>
      <p className="mb-3 mt-1 text-sm text-muted-foreground">{body}</p>
      {children}
    </Card>
  );
}

function FieldError({ error }: { error: string | null }) {
  if (!error) return null;
  return (
    <p className="text-xs text-rose-700" role="alert">
      {error}
    </p>
  );
}

function Select({
  name,
  label,
  children,
}: {
  name: string;
  label: string;
  children: ReactNode;
}) {
  return (
    <select name={name} className="h-10 rounded-lg border border-input bg-white px-2 text-sm" aria-label={label}>
      {children}
    </select>
  );
}

function submitForm(
  start: ReturnType<typeof useTransition>[1],
  setError: (value: string | null) => void,
  router: ReturnType<typeof useRouter>,
  action: () => Promise<ActionResult>,
  redirectTo?: (id: string) => string,
) {
  start(async () => {
    const result = await action();
    if (!result.ok) setError(result.error);
    else {
      setError(null);
      if (result.id && redirectTo) router.push(redirectTo(result.id));
      else router.refresh();
    }
  });
}

export function AdminCreatePersonForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  return (
    <CreateCard
      title="Add a person"
      body="Creates a real passport they can later open with WhatsApp OTP. Photos can be uploaded now. This does not store Aadhaar, bank or home address."
    >
      <form
        className="grid gap-2 md:grid-cols-2"
        onSubmit={(event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          submitForm(start, setError, router, () =>
            adminCreatePerson({
              phone: String(form.get("phone") ?? ""),
              fullName: String(form.get("fullName") ?? ""),
              handle: String(form.get("handle") ?? ""),
              headline: String(form.get("headline") ?? ""),
              about: String(form.get("about") ?? ""),
              city: String(form.get("city") ?? ""),
              state: String(form.get("state") ?? ""),
              occupationMode: String(form.get("occupationMode") ?? ""),
              avatarPath: String(form.get("avatarPath") ?? ""),
              coverPath: String(form.get("coverPath") ?? ""),
              website: String(form.get("website") ?? ""),
            }),
            (id) => `/admin/people/${id}`,
          );
        }}
      >
        <Input name="fullName" required placeholder="Full name" aria-label="Full name" />
        <Input name="phone" required placeholder="Indian mobile, e.g. 9876543210" aria-label="Mobile number" />
        <Input name="handle" placeholder="handle (optional)" aria-label="Handle" />
        <Input name="headline" placeholder="Headline" aria-label="Headline" />
        <Input name="city" placeholder="City" aria-label="City" />
        <Input name="state" placeholder="State" aria-label="State" />
        <Select name="occupationMode" label="Occupation">
          <option value="white_collar">Professional</option>
          <option value="freelancer">Freelancer</option>
          <option value="blue_collar">Gig / site worker</option>
          <option value="contractor">Contractor</option>
        </Select>
        <Input name="website" placeholder="https:// website (optional)" aria-label="Website" />
        <div className="md:col-span-2">
          <Textarea name="about" placeholder="About" className="min-h-20" aria-label="About" />
        </div>
        <AdminMediaField name="avatarPath" label="Portrait" />
        <AdminMediaField name="coverPath" label="Cover photo" />
        <div className="md:col-span-2">
          <Button type="submit" disabled={pending}>
            {pending ? "Saving…" : "Publish person"}
          </Button>
        </div>
        <div className="md:col-span-2">
          <FieldError error={error} />
        </div>
      </form>
    </CreateCard>
  );
}

export function AdminCreateOrganisationForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  return (
    <CreateCard
      title="Add an organisation"
      body="Publishes a live company, service brand or product brand. Upload a cover and logo. GSTIN stays off the public record."
    >
      <form
        className="grid gap-2 md:grid-cols-2"
        onSubmit={(event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          submitForm(
            start,
            setError,
            router,
            () =>
              adminCreateOrganisation({
                name: String(form.get("name") ?? ""),
                type: String(form.get("type") ?? ""),
                passportKind: String(form.get("passportKind") ?? ""),
                tagline: String(form.get("tagline") ?? ""),
                about: String(form.get("about") ?? ""),
                industry: String(form.get("industry") ?? ""),
                city: String(form.get("city") ?? ""),
                state: String(form.get("state") ?? ""),
                website: String(form.get("website") ?? ""),
                categoryLabel: String(form.get("categoryLabel") ?? ""),
                servingRegions: String(form.get("servingRegions") ?? ""),
                coverPath: String(form.get("coverPath") ?? ""),
                logoPath: String(form.get("logoPath") ?? ""),
              }),
            (id) => `/admin/organisations/${id}`,
          );
        }}
      >
        <Input name="name" required placeholder="Organisation name" aria-label="Organisation name" />
        <Input name="tagline" placeholder="Tagline" aria-label="Tagline" />
        <Select name="type" label="Organisation type">
          {organisationTypes.map((type) => (
            <option key={type} value={type}>
              {type.replaceAll("_", " ")}
            </option>
          ))}
        </Select>
        <Select name="passportKind" label="Public kind">
          <option value="other">Company</option>
          <option value="service_brand">Service brand</option>
          <option value="product_brand">Product brand</option>
        </Select>
        <Input name="industry" placeholder="Industry" aria-label="Industry" />
        <Input name="categoryLabel" placeholder="Category label" aria-label="Category label" />
        <Input name="city" placeholder="City" aria-label="City" />
        <Input name="state" placeholder="State" aria-label="State" />
        <Input name="website" placeholder="https:// website" aria-label="Website" />
        <Input name="servingRegions" placeholder="Serving regions" aria-label="Serving regions" />
        <div className="md:col-span-2">
          <Textarea name="about" placeholder="About" className="min-h-20" aria-label="About" />
        </div>
        <AdminMediaField name="coverPath" label="Cover photo" />
        <AdminMediaField name="logoPath" label="Logo" />
        <div className="md:col-span-2">
          <Button type="submit" disabled={pending}>
            {pending ? "Saving…" : "Publish organisation"}
          </Button>
        </div>
        <div className="md:col-span-2">
          <FieldError error={error} />
        </div>
      </form>
    </CreateCard>
  );
}

export function AdminCreateProjectForm({ organisations }: { organisations: Choice[] }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  return (
    <CreateCard
      title="Add a project"
      body="Network project with a cover photo and optional YouTube walkthrough. This is not a Vertex site record."
    >
      <form
        className="grid gap-2 md:grid-cols-2"
        onSubmit={(event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          submitForm(start, setError, router, () =>
            adminCreateProject({
              name: String(form.get("name") ?? ""),
              summary: String(form.get("summary") ?? ""),
              projectType: String(form.get("projectType") ?? ""),
              status: String(form.get("status") ?? ""),
              city: String(form.get("city") ?? ""),
              state: String(form.get("state") ?? ""),
              coverImageUrl: String(form.get("coverImageUrl") ?? ""),
              youtubeUrl: String(form.get("youtubeUrl") ?? ""),
              valueLabel: String(form.get("valueLabel") ?? ""),
              durationLabel: String(form.get("durationLabel") ?? ""),
              clientOrganisationId: String(form.get("clientOrganisationId") ?? ""),
              mainContractorId: String(form.get("mainContractorId") ?? ""),
            }),
          );
        }}
      >
        <Input name="name" required placeholder="Project name" aria-label="Project name" />
        <Input name="projectType" placeholder="Type, e.g. fit-out" aria-label="Project type" />
        <Input name="city" placeholder="City" aria-label="City" />
        <Input name="state" placeholder="State" aria-label="State" />
        <Select name="status" label="Status">
          <option value="in_progress">In progress</option>
          <option value="completed">Completed</option>
          <option value="handover">Handover</option>
        </Select>
        <Input name="valueLabel" placeholder="Value label" aria-label="Value label" />
        <Input name="durationLabel" placeholder="Duration label" aria-label="Duration label" />
        <Input name="youtubeUrl" placeholder="https://www.youtube.com/watch?v=…" aria-label="YouTube URL" />
        <Select name="clientOrganisationId" label="Client organisation">
          <option value="">No client organisation</option>
          {organisations.map((org) => (
            <option key={org.id} value={org.id}>
              {org.name}
            </option>
          ))}
        </Select>
        <Select name="mainContractorId" label="Main contractor">
          <option value="">No main contractor</option>
          {organisations.map((org) => (
            <option key={`mc-${org.id}`} value={org.id}>
              {org.name}
            </option>
          ))}
        </Select>
        <div className="md:col-span-2">
          <Textarea name="summary" placeholder="Summary" className="min-h-20" aria-label="Summary" />
        </div>
        <div className="md:col-span-2">
          <AdminMediaField name="coverImageUrl" label="Project cover" />
        </div>
        <div className="md:col-span-2">
          <Button type="submit" disabled={pending}>
            {pending ? "Saving…" : "Publish project"}
          </Button>
        </div>
        <div className="md:col-span-2">
          <FieldError error={error} />
        </div>
      </form>
    </CreateCard>
  );
}

export function AdminCreateJobForm({ organisations }: { organisations: Choice[] }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  if (organisations.length === 0) {
    return (
      <CreateCard title="Add a job" body="Create an organisation first, then publish a listing here.">
        <p className="text-sm text-muted-foreground">No organisations yet.</p>
      </CreateCard>
    );
  }
  return (
    <CreateCard title="Add a job" body="Publishes an open job on the network. This does not hire or staff a site.">
      <form
        className="grid gap-2 md:grid-cols-2"
        onSubmit={(event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          submitForm(start, setError, router, () =>
            adminCreateJob({
              organisationId: String(form.get("organisationId") ?? ""),
              title: String(form.get("title") ?? ""),
              city: String(form.get("city") ?? ""),
              employmentType: String(form.get("employmentType") ?? ""),
              experienceLabel: String(form.get("experienceLabel") ?? ""),
              salaryLabel: String(form.get("salaryLabel") ?? ""),
              skills: String(form.get("skills") ?? ""),
              description: String(form.get("description") ?? ""),
            }),
          );
        }}
      >
        <Input name="title" required placeholder="Job title" aria-label="Job title" />
        <Select name="organisationId" label="Organisation">
          {organisations.map((org) => (
            <option key={org.id} value={org.id}>
              {org.name}
            </option>
          ))}
        </Select>
        <Input name="city" placeholder="City" aria-label="City" />
        <Select name="employmentType" label="Type">
          <option value="permanent">permanent</option>
          <option value="contract">contract</option>
          <option value="part_time">part time</option>
          <option value="temporary">temporary</option>
          <option value="internship">internship</option>
        </Select>
        <Input name="experienceLabel" placeholder="Experience label" aria-label="Experience" />
        <Input name="salaryLabel" placeholder="Salary label" aria-label="Salary label" />
        <div className="md:col-span-2">
          <Input name="skills" placeholder="Skills, comma separated" aria-label="Skills" />
        </div>
        <div className="md:col-span-2">
          <Textarea name="description" placeholder="Description" className="min-h-20" aria-label="Description" />
        </div>
        <div className="md:col-span-2">
          <Button type="submit" disabled={pending}>
            {pending ? "Publishing…" : "Publish job"}
          </Button>
        </div>
        <div className="md:col-span-2">
          <FieldError error={error} />
        </div>
      </form>
    </CreateCard>
  );
}

export function AdminCreateGigForm({
  organisations,
  projects,
}: {
  organisations: Choice[];
  projects: Choice[];
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  if (organisations.length === 0) {
    return (
      <CreateCard title="Add a gig" body="Create an organisation first, then publish a crew listing here.">
        <p className="text-sm text-muted-foreground">No organisations yet.</p>
      </CreateCard>
    );
  }
  return (
    <CreateCard title="Add a gig" body="Publishes an open gig. This does not quote or dispatch a crew.">
      <form
        className="grid gap-2 md:grid-cols-2"
        onSubmit={(event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          submitForm(start, setError, router, () =>
            adminCreateGig({
              organisationId: String(form.get("organisationId") ?? ""),
              title: String(form.get("title") ?? ""),
              trade: String(form.get("trade") ?? ""),
              siteName: String(form.get("siteName") ?? ""),
              shiftLabel: String(form.get("shiftLabel") ?? ""),
              payLabel: String(form.get("payLabel") ?? ""),
              startLabel: String(form.get("startLabel") ?? ""),
              seats: String(form.get("seats") ?? ""),
              duration: String(form.get("duration") ?? ""),
              description: String(form.get("description") ?? ""),
              projectId: String(form.get("projectId") ?? ""),
            }),
          );
        }}
      >
        <Input name="title" required placeholder="Gig title" aria-label="Gig title" />
        <Select name="organisationId" label="Organisation">
          {organisations.map((org) => (
            <option key={org.id} value={org.id}>
              {org.name}
            </option>
          ))}
        </Select>
        <Input name="trade" placeholder="Trade" aria-label="Trade" />
        <Input name="siteName" placeholder="Site name" aria-label="Site name" />
        <Input name="shiftLabel" placeholder="Shift" aria-label="Shift" />
        <Input name="payLabel" placeholder="Pay label" aria-label="Pay label" />
        <Input name="startLabel" placeholder="Start label" aria-label="Start label" />
        <Input name="seats" type="number" min={1} placeholder="Seats" aria-label="Seats" />
        <Select name="duration" label="Duration">
          <option value="1_day">1 day</option>
          <option value="1_shift">1 shift</option>
          <option value="4_hours">4 hours</option>
          <option value="3_days">3 days</option>
          <option value="1_week">1 week</option>
          <option value="project">project</option>
        </Select>
        <Select name="projectId" label="Linked project">
          <option value="">No linked project</option>
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </Select>
        <div className="md:col-span-2">
          <Textarea name="description" placeholder="Description" className="min-h-20" aria-label="Description" />
        </div>
        <div className="md:col-span-2">
          <Button type="submit" disabled={pending}>
            {pending ? "Publishing…" : "Publish gig"}
          </Button>
        </div>
        <div className="md:col-span-2">
          <FieldError error={error} />
        </div>
      </form>
    </CreateCard>
  );
}

export function AdminCreatePostForm({ people, organisations }: { people: Choice[]; organisations: Choice[] }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const [authorKind, setAuthorKind] = useState<"person" | "organisation">("person");
  if (people.length === 0 && organisations.length === 0) {
    return (
      <CreateCard title="Add a post" body="Create a person or organisation first, then publish to the feed.">
        <p className="text-sm text-muted-foreground">No authors yet.</p>
      </CreateCard>
    );
  }
  return (
    <CreateCard title="Add a post" body="Publishes a live feed update with an optional image. Hidden posts stay visible to the author.">
      <form
        className="grid gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          submitForm(start, setError, router, () =>
            adminCreatePost({
              authorProfileId: authorKind === "person" ? String(form.get("authorId") ?? "") : "",
              authorOrganisationId: authorKind === "organisation" ? String(form.get("authorId") ?? "") : "",
              body: String(form.get("body") ?? ""),
              postType: String(form.get("postType") ?? ""),
              imagePath: String(form.get("imagePath") ?? ""),
            }),
          );
        }}
      >
        <div className="flex flex-wrap gap-4 text-sm">
          <label className="inline-flex items-center gap-2">
            <input type="radio" name="authorKind" checked={authorKind === "person"} onChange={() => setAuthorKind("person")} />
            <span>Person</span>
          </label>
          <label className="inline-flex items-center gap-2">
            <input
              type="radio"
              name="authorKind"
              checked={authorKind === "organisation"}
              onChange={() => setAuthorKind("organisation")}
            />
            <span>Organisation</span>
          </label>
        </div>
        <Select name="authorId" label="Author">
          {(authorKind === "person" ? people : organisations).map((row) => (
            <option key={row.id} value={row.id}>
              {row.full_name ?? row.name}
              {row.handle ? ` @${row.handle}` : ""}
            </option>
          ))}
        </Select>
        <Select name="postType" label="Post type">
          <option value="update">update</option>
          <option value="project_update">project update</option>
          <option value="hiring">hiring</option>
          <option value="gig">gig</option>
          <option value="announcement">announcement</option>
        </Select>
        <Textarea name="body" required placeholder="What should the network see?" className="min-h-24" aria-label="Post body" />
        <AdminMediaField name="imagePath" label="Post image" />
        <Button type="submit" disabled={pending}>
          {pending ? "Publishing…" : "Publish post"}
        </Button>
        <FieldError error={error} />
      </form>
    </CreateCard>
  );
}

export function AdminCreateVerificationForm({ people }: { people: Choice[] }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  if (people.length === 0) {
    return (
      <CreateCard title="File a verification request" body="Add a person first, then file identity, employment or trade.">
        <p className="text-sm text-muted-foreground">No people yet.</p>
      </CreateCard>
    );
  }
  return (
    <CreateCard
      title="File a verification request"
      body="Creates a pending check for a reviewer. Approval sets the matching public flag. This does not mint a Vertex credential."
    >
      <form
        className="grid gap-2 md:grid-cols-3"
        onSubmit={(event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          submitForm(start, setError, router, () =>
            adminCreateVerificationRequest({
              profileId: String(form.get("profileId") ?? ""),
              kind: String(form.get("kind") ?? ""),
            }),
          );
        }}
      >
        <Select name="profileId" label="Person">
          {people.map((person) => (
            <option key={person.id} value={person.id}>
              {person.full_name} @{person.handle}
            </option>
          ))}
        </Select>
        <Select name="kind" label="Kind">
          <option value="identity">identity</option>
          <option value="employment">employment</option>
          <option value="trade">trade</option>
        </Select>
        <Button type="submit" disabled={pending}>
          {pending ? "Filing…" : "File request"}
        </Button>
        <div className="md:col-span-3">
          <FieldError error={error} />
        </div>
      </form>
    </CreateCard>
  );
}

export function AdminCreateExperienceForm({ profileId }: { profileId: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  return (
    <form
      className="grid gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        submitForm(start, setError, router, () =>
          adminCreateExperience({
            profileId,
            title: String(form.get("title") ?? ""),
            organisationName: String(form.get("organisationName") ?? ""),
            locationLabel: String(form.get("locationLabel") ?? ""),
            startDate: String(form.get("startDate") ?? ""),
            endDate: String(form.get("endDate") ?? ""),
          }),
        );
      }}
    >
      <Input name="title" required placeholder="Role title" aria-label="Role title" />
      <Input name="organisationName" placeholder="Organisation name" aria-label="Organisation name" />
      <Input name="locationLabel" placeholder="Location" aria-label="Location" />
      <Input name="startDate" type="date" aria-label="Start date" />
      <Input name="endDate" type="date" aria-label="End date" />
      <Button type="submit" size="sm" disabled={pending}>
        {pending ? "Saving…" : "Add experience"}
      </Button>
      <FieldError error={error} />
    </form>
  );
}

export function AdminCreateCertificationForm({ profileId }: { profileId: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  return (
    <form
      className="grid gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        submitForm(start, setError, router, () =>
          adminCreateCertification({
            profileId,
            name: String(form.get("name") ?? ""),
            issuer: String(form.get("issuer") ?? ""),
            category: String(form.get("category") ?? ""),
          }),
        );
      }}
    >
      <Input name="name" required placeholder="Credential name" aria-label="Credential name" />
      <Input name="issuer" placeholder="Issuer" aria-label="Issuer" />
      <Select name="category" label="Category">
        <option value="certification">certification</option>
        <option value="licence">licence</option>
        <option value="training">training</option>
        <option value="safety">safety</option>
        <option value="professional_qualification">professional qualification</option>
      </Select>
      <Button type="submit" size="sm" disabled={pending}>
        {pending ? "Saving…" : "Add credential"}
      </Button>
      <FieldError error={error} />
    </form>
  );
}

export function AdminCreateOrgCredentialForm({ organisationId }: { organisationId: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  return (
    <form
      className="mt-4 grid gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        submitForm(start, setError, router, () =>
          adminCreateOrgCredential({
            organisationId,
            name: String(form.get("name") ?? ""),
            category: String(form.get("category") ?? ""),
          }),
        );
      }}
    >
      <Input name="name" required placeholder="Credential name" aria-label="Credential name" />
      <Input name="category" placeholder="Category" aria-label="Category" />
      <Button type="submit" size="sm" disabled={pending}>
        {pending ? "Saving…" : "Add credential"}
      </Button>
      <FieldError error={error} />
    </form>
  );
}
