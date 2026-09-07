"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  addEvidenceItem,
  addExperience,
  addOptedInProject,
  addProfileService,
  addSkill,
  completeOnboarding,
  saveOnboardingProgress,
  skipRemainingOnboarding,
  updateAvailability,
} from "@/lib/actions/profile";
import { uploadPublicImage } from "@/lib/actions/media";
import { defaultHandleFromName, normalizeHandle, ONBOARDING_STEPS, type OnboardingAccountKind } from "@/lib/domain/onboarding";
import { PROFESSIONAL_TITLES } from "@/lib/domain/professional-titles";
import type { AvailabilityStatus, OccupationMode, ProfessionalTitle, PublicProfile } from "@/lib/types/identity";

const OCCUPATIONS: { value: OccupationMode; label: string; hint: string }[] = [
  { value: "white_collar", label: "Professional", hint: "Architecture, design, engineering, project management" },
  { value: "freelancer", label: "Independent professional", hint: "Consulting, design or specialist services" },
  { value: "blue_collar", label: "Skilled trade / gig worker", hint: "Site, fabrication, finishing and allied trades" },
  { value: "contractor", label: "Contractor", hint: "Crew, contracting or specialist execution" },
];

const AVAILABILITY: { value: AvailabilityStatus; label: string }[] = [
  { value: "open_to_opportunities", label: "Open to opportunities" },
  { value: "open_to_jobs", label: "Open to jobs" },
  { value: "open_to_gigs", label: "Open to gigs" },
  { value: "available_immediately", label: "Available immediately" },
  { value: "not_looking", label: "Not looking right now" },
];

export function OnboardingWizard({
  profile,
  initialStep = 0,
  nextPath = "/feed",
}: {
  profile: PublicProfile;
  initialStep?: number;
  nextPath?: string;
}) {
  const router = useRouter();
  const [step, setStep] = useState(initialStep);
  const [error, setError] = useState<string | null>(null);
  const [photoSaved, setPhotoSaved] = useState(Boolean(profile.avatarPath));
  const [pending, start] = useTransition();
  const [fullName, setFullName] = useState(profile.fullName === "New professional" ? "" : profile.fullName);
  const [accountKind, setAccountKind] = useState<OnboardingAccountKind>("individual");
  const [occupationMode, setOccupationMode] = useState<OccupationMode>(profile.occupationMode);
  const [professionalTitle, setProfessionalTitle] = useState<ProfessionalTitle | "">(profile.professionalTitle ?? "");
  const [specialisation, setSpecialisation] = useState(profile.specialisation ?? "");
  const [handle, setHandle] = useState(profile.handle.startsWith("u-") ? "" : profile.handle);
  const [headline, setHeadline] = useState(profile.headline ?? "");
  const [skill, setSkill] = useState("");
  const [service, setService] = useState("");
  const [city, setCity] = useState(profile.city ?? "");
  const [state, setState] = useState(profile.state ?? "");
  const [languages, setLanguages] = useState(profile.languages.join(", "));
  const [role, setRole] = useState("");
  const [organisation, setOrganisation] = useState("");
  const [isCurrent, setIsCurrent] = useState(true);
  const [projectName, setProjectName] = useState("");
  const [evidenceNote, setEvidenceNote] = useState("");
  const [availability, setAvailability] = useState<AvailabilityStatus>(
    profile.availabilityStatus === "not_looking" ? "open_to_opportunities" : profile.availabilityStatus,
  );
  const suggested = useMemo(() => defaultHandleFromName(fullName || "professional"), [fullName]);
  const current = ONBOARDING_STEPS[step] ?? ONBOARDING_STEPS[0];

  function progressPayload(markComplete = false, nextStep = step) {
    const chosenHandle = normalizeHandle(handle);
    return {
      fullName,
      handle: chosenHandle || undefined,
      headline: headline || undefined,
      city: city || undefined,
      state: state || undefined,
      occupationMode,
      languages: languages || undefined,
      specialisation: specialisation || undefined,
      professionalTitle: professionalTitle || undefined,
      availabilityStatus: availability,
      skipHandle: !chosenHandle,
      step: nextStep,
      markComplete,
    };
  }

  async function persist(nextStep: number, markComplete = false) {
    const result = markComplete
      ? await completeOnboarding(progressPayload(true, nextStep))
      : await saveOnboardingProgress(progressPayload(false, nextStep));
    if (!result.ok) {
      setError(result.error);
      return false;
    }
    return true;
  }

  async function saveStepExtras() {
    if (current.id === "craft" && skill.trim().length >= 2) {
      const result = await addSkill({ name: skill });
      if (!result.ok) {
        setError(result.error);
        return false;
      }
    }
    if (current.id === "craft" && service.trim().length >= 2) {
      const result = await addProfileService({
        name: service,
        description: "",
        locations: city,
        availabilityLabel: "",
      });
      if (!result.ok) {
        setError(result.error);
        return false;
      }
    }
    if (current.id === "proof" && role.trim().length >= 2) {
      const result = await addExperience({
        title: role,
        organisationName: organisation,
        locationLabel: city,
        startDate: "",
        endDate: "",
        responsibilities: "",
        isCurrent,
      });
      if (!result.ok) {
        setError(result.error);
        return false;
      }
    }
    if (current.id === "proof" && projectName.trim().length >= 2) {
      const result = await addOptedInProject({
        name: projectName,
        summary: "",
        city,
        roleTitle: role,
      });
      if (!result.ok) {
        setError(result.error);
        return false;
      }
    }
    if (current.id === "proof" && evidenceNote.trim().length >= 4) {
      const result = await addEvidenceItem({
        claimKind: "portfolio",
        note: evidenceNote,
      });
      if (!result.ok) {
        setError(result.error);
        return false;
      }
    }
    if (current.id === "availability") {
      const result = await updateAvailability({
        availabilityStatus: availability,
        occupationMode,
        city,
        preferredRoles: "",
      });
      if (!result.ok) {
        setError(result.error);
        return false;
      }
    }
    return true;
  }

  async function goNext() {
    setError(null);
    if (current.id === "identity" && fullName.trim().length < 2) {
      setError("Add the name clients and employers should see.");
      return;
    }
    const extras = await saveStepExtras();
    if (!extras) return;
    if (current.id === "publish") {
      const saved = await persist(ONBOARDING_STEPS.length - 1, true);
      if (!saved) return;
      router.replace(accountKind === "organisation" ? "/companies/new" : nextPath || "/passport");
      router.refresh();
      return;
    }
    const nextStep = Math.min(ONBOARDING_STEPS.length - 1, step + 1);
    const saved = await persist(nextStep, false);
    if (!saved) return;
    setStep(nextStep);
  }

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#6e7391]">Professional passport</p>
      <h1 className="text-2xl font-black tracking-tight text-[#111a42]">Set up your IDENTITI passport</h1>
      <p className="text-sm text-muted-foreground">
        Step {step + 1} of {ONBOARDING_STEPS.length}: {current.label}. Name is required. Everything else can be skipped
        and saved later.
      </p>
      <div
        className="flex gap-1"
        role="progressbar"
        aria-valuemin={1}
        aria-valuemax={ONBOARDING_STEPS.length}
        aria-valuenow={step + 1}
        aria-label={`Onboarding step ${step + 1} of ${ONBOARDING_STEPS.length}`}
      >
        {ONBOARDING_STEPS.map((item, index) => (
          <span
            key={item.id}
            className={`h-1.5 flex-1 rounded-full ${index <= step ? "bg-[#2437d4]" : "bg-[#e2e5ef]"}`}
          />
        ))}
      </div>
      <Card className="space-y-4 p-5">
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            start(() => goNext());
          }}
        >
          {current.id === "identity" ? (
            <label className="block space-y-1 text-sm" htmlFor="onboarding-name">
              <span className="font-medium">Your name</span>
              <Input
                id="onboarding-name"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                autoComplete="name"
                aria-invalid={Boolean(error)}
                aria-describedby={error ? "onboarding-error" : "onboarding-name-hint"}
              />
              <span id="onboarding-name-hint" className="text-xs text-muted-foreground">
                This is the name clients and employers will see.
              </span>
            </label>
          ) : null}
          {current.id === "type" ? (
            <fieldset className="space-y-3">
              <legend className="text-sm font-medium">Are you setting up a person or an organisation?</legend>
              {(
                [
                  ["individual", "Individual professional", "A personal passport for work you deliver."],
                  ["organisation", "Organisation", "A company, brand, contractor or supplier identity."],
                ] as const
              ).map(([value, label, hint]) => (
                <label key={value} className="flex cursor-pointer gap-3 rounded-xl border border-border p-3">
                  <input type="radio" name="accountKind" checked={accountKind === value} onChange={() => setAccountKind(value)} />
                  <span>
                    <span className="block text-sm font-semibold">{label}</span>
                    <span className="text-xs text-muted-foreground">{hint}</span>
                  </span>
                </label>
              ))}
              {accountKind === "individual" ? (
                <div className="space-y-2 pt-2">
                  <p className="text-sm font-medium">How should the network classify you?</p>
                  {OCCUPATIONS.map((item) => (
                    <label key={item.value} className="flex cursor-pointer gap-3 rounded-xl border border-border p-3">
                      <input
                        type="radio"
                        name="occupation"
                        checked={occupationMode === item.value}
                        onChange={() => setOccupationMode(item.value)}
                      />
                      <span>
                        <span className="block text-sm font-semibold">{item.label}</span>
                        <span className="text-xs text-muted-foreground">{item.hint}</span>
                      </span>
                    </label>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Finish a personal identity first. You can create the organisation passport immediately after publishing.
                </p>
              )}
            </fieldset>
          ) : null}
          {current.id === "presence" ? (
            <div className="space-y-3">
              <label className="block space-y-1 text-sm" htmlFor="onboarding-handle">
                <span className="font-medium">Public handle</span>
                <Input
                  id="onboarding-handle"
                  value={handle}
                  onChange={(event) => setHandle(normalizeHandle(event.target.value))}
                  placeholder={suggested}
                />
                <span className="text-xs text-muted-foreground">
                  identiti.withtatva.ai/{handle || suggested}. Skip to keep a generated handle for now.
                </span>
              </label>
              <label className="block space-y-1 text-sm" htmlFor="onboarding-headline">
                <span className="font-medium">Professional headline</span>
                <Input
                  id="onboarding-headline"
                  value={headline}
                  onChange={(event) => setHeadline(event.target.value)}
                  placeholder="Interior fit-out lead · Bengaluru"
                />
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block space-y-1 text-sm sm:col-span-2" htmlFor="onboarding-languages">
                  <span className="font-medium">Languages</span>
                  <Input
                    id="onboarding-languages"
                    value={languages}
                    onChange={(event) => setLanguages(event.target.value)}
                    placeholder="English, Hindi, Kannada"
                  />
                </label>
                <label className="block space-y-1 text-sm" htmlFor="onboarding-city">
                  <span className="font-medium">City</span>
                  <Input id="onboarding-city" value={city} onChange={(event) => setCity(event.target.value)} />
                </label>
                <label className="block space-y-1 text-sm" htmlFor="onboarding-state">
                  <span className="font-medium">State</span>
                  <Input id="onboarding-state" value={state} onChange={(event) => setState(event.target.value)} />
                </label>
              </div>
            </div>
          ) : null}
          {current.id === "craft" ? (
            <div className="space-y-3">
              <label className="block space-y-1 text-sm" htmlFor="onboarding-title">
                <span className="font-medium">Professional title</span>
                <select
                  id="onboarding-title"
                  className="h-10 w-full rounded-lg border border-input bg-white px-3 text-sm"
                  value={professionalTitle}
                  onChange={(event) => setProfessionalTitle(event.target.value as ProfessionalTitle | "")}
                >
                  <option value="">Not specified yet</option>
                  {PROFESSIONAL_TITLES.map((title) => (
                    <option key={title.id} value={title.id}>
                      {title.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block space-y-1 text-sm" htmlFor="onboarding-specialisation">
                <span className="font-medium">Specialisation</span>
                <Input
                  id="onboarding-specialisation"
                  value={specialisation}
                  onChange={(event) => setSpecialisation(event.target.value)}
                  placeholder="Joinery, HVAC, residential interiors…"
                />
              </label>
              <label className="block space-y-1 text-sm" htmlFor="onboarding-skill">
                <span className="font-medium">A skill you want found for</span>
                <Input
                  id="onboarding-skill"
                  value={skill}
                  onChange={(event) => setSkill(event.target.value)}
                  placeholder="Joinery, HVAC, AutoCAD…"
                />
              </label>
              <label className="block space-y-1 text-sm" htmlFor="onboarding-service">
                <span className="font-medium">A service you offer</span>
                <Input
                  id="onboarding-service"
                  value={service}
                  onChange={(event) => setService(event.target.value)}
                  placeholder="Turnkey interiors, steel fabrication…"
                />
                <span className="text-xs text-muted-foreground">Skip if you are looking for work rather than selling a service.</span>
              </label>
            </div>
          ) : null}
          {current.id === "proof" ? (
            <div className="space-y-3">
              <label className="block space-y-1 text-sm" htmlFor="onboarding-photo">
                <span className="font-medium">Profile photograph</span>
                <Input
                  id="onboarding-photo"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (!file) return;
                    start(async () => {
                      const data = new FormData();
                      data.set("file", file);
                      data.set("kind", "avatar");
                      const result = await uploadPublicImage(data);
                      if (!result.ok) setError(result.error);
                      else setPhotoSaved(true);
                    });
                  }}
                />
                {photoSaved ? <span className="text-xs text-emerald-700">Photograph saved.</span> : null}
              </label>
              <label className="block space-y-1 text-sm" htmlFor="onboarding-role">
                <span className="font-medium">A role you have held</span>
                <Input id="onboarding-role" value={role} onChange={(event) => setRole(event.target.value)} placeholder="Site supervisor" />
              </label>
              <label className="block space-y-1 text-sm" htmlFor="onboarding-org">
                <span className="font-medium">Organisation</span>
                <Input id="onboarding-org" value={organisation} onChange={(event) => setOrganisation(event.target.value)} />
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={isCurrent} onChange={(event) => setIsCurrent(event.target.checked)} />
                This is my current role
              </label>
              <label className="block space-y-1 text-sm" htmlFor="onboarding-project">
                <span className="font-medium">A project you delivered</span>
                <Input
                  id="onboarding-project"
                  value={projectName}
                  onChange={(event) => setProjectName(event.target.value)}
                  placeholder="Residence fit-out, Koramangala"
                />
              </label>
              <label className="block space-y-1 text-sm" htmlFor="onboarding-evidence">
                <span className="font-medium">Evidence note</span>
                <Input
                  id="onboarding-evidence"
                  value={evidenceNote}
                  onChange={(event) => setEvidenceNote(event.target.value)}
                  placeholder="Site photos, drawings or a credential you can attach later"
                />
                <span className="text-xs text-muted-foreground">
                  This is claimed until you attach a file from the passport workspace. It will not appear as verified.
                </span>
              </label>
            </div>
          ) : null}
          {current.id === "availability" ? (
            <fieldset className="space-y-2">
              <legend className="text-sm font-medium">What are you available for?</legend>
              {AVAILABILITY.map((item) => (
                <label key={item.value} className="flex cursor-pointer gap-3 rounded-xl border border-border p-3 text-sm">
                  <input
                    type="radio"
                    name="availability"
                    checked={availability === item.value}
                    onChange={() => setAvailability(item.value)}
                  />
                  {item.label}
                </label>
              ))}
            </fieldset>
          ) : null}
          {current.id === "publish" ? (
            <div className="space-y-2 text-sm">
              <p className="font-semibold">{fullName || "Unnamed professional"}</p>
              <p className="text-muted-foreground">{headline || "Add a headline after publishing if you skipped it."}</p>
              <p className="text-muted-foreground">
                @{handle || suggested} · {city || "Location later"} ·{" "}
                {accountKind === "organisation" ? "Organisation next" : occupationMode.replaceAll("_", " ")}
              </p>
              <p>This passport is yours. You can keep adding evidence from the workspace.</p>
              {accountKind === "organisation" ? (
                <p>
                  After publishing you will be taken to{" "}
                  <Link className="text-primary hover:underline" href="/companies/new">
                    create the organisation
                  </Link>
                  .
                </p>
              ) : null}
            </div>
          ) : null}
          {error ? (
            <p id="onboarding-error" className="text-sm text-rose-700" role="alert">
              {error}
            </p>
          ) : null}
          <div className="flex flex-wrap gap-2">
            {step > 0 ? (
              <Button type="button" variant="outline" onClick={() => setStep((value) => Math.max(0, value - 1))}>
                Back
              </Button>
            ) : null}
            <Button type="submit" disabled={pending || (current.id === "identity" && fullName.trim().length < 2)}>
              {pending ? "Saving…" : current.id === "publish" ? "Publish passport" : "Continue"}
            </Button>
            {step > 0 && current.id !== "publish" ? (
              <Button
                type="button"
                variant="ghost"
                disabled={pending}
                onClick={() =>
                  start(async () => {
                    setError(null);
                    const nextStep = Math.min(ONBOARDING_STEPS.length - 1, step + 1);
                    const saved = await persist(nextStep, false);
                    if (!saved) return;
                    setStep(nextStep);
                  })
                }
              >
                Skip
              </Button>
            ) : null}
          </div>
        </form>
      </Card>
      {fullName.trim().length >= 2 ? (
        <button
          type="button"
          className="text-sm text-primary hover:underline disabled:opacity-50"
          disabled={pending}
          onClick={() =>
            start(async () => {
              setError(null);
              const saved = await saveOnboardingProgress(progressPayload(false, step));
              if (!saved.ok) {
                setError(saved.error);
                return;
              }
              const skipped = await skipRemainingOnboarding();
              if (!skipped.ok) {
                setError(skipped.error);
                return;
              }
              router.replace(accountKind === "organisation" ? "/companies/new" : nextPath || "/feed");
              router.refresh();
            })
          }
        >
          Finish later and go to the network
        </button>
      ) : null}
    </div>
  );
}
