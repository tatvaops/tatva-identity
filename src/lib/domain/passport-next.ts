import { handleIsGenerated } from "@/lib/domain/onboarding";
import type { PassportComponent } from "@/lib/domain/passport-strength";
import type { PublicProfile } from "@/lib/types/identity";

export type PassportNextAction = {
  id: string;
  title: string;
  why: string;
  href: string;
};

export function passportNextActions(input: {
  profile: PublicProfile;
  skillCount: number;
  projectCount: number;
  experienceCount: number;
  credentialCount: number;
  educationCount?: number;
}): PassportNextAction[] {
  const actions: PassportNextAction[] = [];
  if (!input.profile.fullName.trim() || input.profile.fullName === "New professional") {
    actions.push({
      id: "name",
      title: "Confirm your professional name",
      why: "Clients and employers need a real name before they can trust this passport.",
      href: "/onboarding",
    });
  }
  if (handleIsGenerated(input.profile.handle)) {
    actions.push({
      id: "handle",
      title: "Choose a public handle",
      why: "A stable handle is the address you send to a client or employer.",
      href: "/settings#profile",
    });
  }
  if (!input.profile.avatarPath) {
    actions.push({
      id: "photo",
      title: "Add a profile photograph",
      why: "A photograph makes the passport recognisable on site and in hiring.",
      href: "/passport?section=identity",
    });
  }
  if (!input.profile.headline) {
    actions.push({
      id: "headline",
      title: "Add a professional headline",
      why: "The headline is the first answer to “what can they do?”",
      href: "/passport?section=identity",
    });
  }
  if (!input.profile.city) {
    actions.push({
      id: "location",
      title: "Add where you work",
      why: "Location is how the network finds people who can actually show up.",
      href: "/passport?section=availability",
    });
  }
  if (input.skillCount === 0) {
    actions.push({
      id: "skills",
      title: "List your skills",
      why: "Skills are how discovery matches you to work.",
      href: "/passport?section=skills",
    });
  }
  if (input.experienceCount === 0) {
    actions.push({
      id: "experience",
      title: "Add a role you have held",
      why: "Experience shows what you have actually delivered, not only what you claim.",
      href: "/passport?section=employment",
    });
  }
  if (input.projectCount < 2) {
    actions.push({
      id: "projects",
      title: input.projectCount === 0 ? "Add your first project" : "Add 2 projects to strengthen your professional passport",
      why: "Projects are evidence. A passport without work is only a claim.",
      href: "/passport?section=projects",
    });
  }
  if (input.credentialCount === 0) {
    actions.push({
      id: "credentials",
      title: "Add a certification or training record",
      why: "Credentials support trade, safety and professional claims.",
      href: "/passport?section=credentials",
    });
  }
  return actions.slice(0, 4);
}

export function nextActionForComponent(component: PassportComponent): string {
  const href: Record<string, string> = {
    identity: "/passport?section=identity",
    photo: "/passport?section=identity",
    headline: "/passport?section=identity",
    location: "/passport?section=availability",
    employment: "/passport?section=employment",
    skills: "/passport?section=skills",
    projects: "/passport?section=projects",
    credentials: "/passport?section=credentials",
    education: "/passport?section=education",
    references: "/passport?section=references",
    services: "/passport?section=services",
  };
  return href[component.id] ?? "/passport";
}
