import type {
  NetworkProject,
  ProfileCertification,
  ProfileSkill,
  PublicProfile,
  SkillVerificationLevel,
} from "@/lib/types/identity";

export const SKILL_LEVEL_HELP: Record<SkillVerificationLevel, string> = {
  self_declared: "Listed by this professional. Not confirmed by an organisation or credential.",
  community_endorsed: "Endorsed by people in their network. Not the same as employer verification.",
  employer_verified: "Confirmed by an organisation they have worked with.",
  certification_verified: "Backed by a public credential on this profile.",
  tatva_verified: "Confirmed through Tatva verified work, not only a self-declared skill.",
};

export const SKILL_LEVEL_LABEL: Record<SkillVerificationLevel, string> = {
  self_declared: "Self declared",
  community_endorsed: "Community endorsed",
  employer_verified: "Employer verified",
  certification_verified: "Certification verified",
  tatva_verified: "Tatva verified",
};

export type VerificationFlag = {
  kind: "identity" | "employment" | "trade" | "project" | "skill" | "credential" | "tatva";
  state: "verified" | "pending" | "expired" | "not_submitted" | "self_declared";
  label: string;
  explanation: string;
  verifiedBy?: string;
};

export function headerFlags(flags: VerificationFlag[]): VerificationFlag[] {
  return flags.filter((flag) => flag.state === "verified" || flag.state === "pending" || flag.kind === "tatva");
}

export function flagsFromProfile(profile: PublicProfile): VerificationFlag[] {
  return flagsFromEvidence({ profile, skills: [], certifications: [], projects: [] });
}

export function flagsFromEvidence(input: {
  profile: PublicProfile;
  skills: ProfileSkill[];
  certifications: ProfileCertification[];
  projects: NetworkProject[];
}): VerificationFlag[] {
  const { profile, skills, certifications, projects } = input;
  const skillVerified = skills.some(
    (s) => s.verificationLevel === "employer_verified" || s.verificationLevel === "tatva_verified" || s.verificationLevel === "certification_verified",
  );
  const credentialVerified = certifications.some((c) => c.verificationState === "verified");
  const projectVerified = projects.some((p) => p.verified);
  const tatvaVerified = profile.identityVerified && profile.employmentVerified && (skillVerified || projectVerified);

  const flags: VerificationFlag[] = [
    profile.identityVerified
      ? {
          kind: "identity",
          state: "verified",
          label: "Identity Verified",
          explanation: "Identity check completed. Document numbers are never shown on this network.",
        }
      : {
          kind: "identity",
          state: "not_submitted",
          label: "Identity",
          explanation: "Identity is not verified yet. Documents stay private when submitted.",
        },
    profile.employmentVerified
      ? {
          kind: "employment",
          state: "verified",
          label: "Employment Verified",
          explanation: "Employment information verified by the organisation. Payroll stays private.",
          verifiedBy: "Organisation",
        }
      : {
          kind: "employment",
          state: "not_submitted",
          label: "Employment",
          explanation: "No organisation has confirmed employment on this profile yet.",
        },
  ];

  if (profile.tradeVerified) {
    flags.push({
      kind: "trade",
      state: "verified",
      label: "Trade Verified",
      explanation: "Primary trade is confirmed from verified work, not only a self-declared title.",
    });
  }

  flags.push(
    projectVerified
      ? {
          kind: "project",
          state: "verified",
          label: "Project Verified",
          explanation: "At least one opted-in project is marked verified.",
        }
      : {
          kind: "project",
          state: "not_submitted",
          label: "Projects",
          explanation: "No verified projects on this profile yet.",
        },
    skillVerified
      ? {
          kind: "skill",
          state: "verified",
          label: "Skill Verified",
          explanation: "A skill has employer, certification, or Tatva verification — not only self-declaration.",
        }
      : {
          kind: "skill",
          state: "self_declared",
          label: "Skills",
          explanation: skills.length > 0 ? "Skills are listed as self-declared until an organisation or credential confirms them." : "No skills listed yet.",
        },
    credentialVerified
      ? {
          kind: "credential",
          state: "verified",
          label: "Credential Verified",
          explanation: "A public credential is in verified state. Files stay private.",
        }
      : {
          kind: "credential",
          state: certifications.some((c) => c.verificationState === "pending") ? "pending" : "not_submitted",
          label: "Credentials",
          explanation: "Public credentials show state only. Document numbers stay private.",
        },
  );

  if (tatvaVerified) {
    flags.push({
      kind: "tatva",
      state: "verified",
      label: "Tatva Verified",
      explanation: "Identity, employment, and at least one verified skill or project are in place.",
    });
  }

  return flags;
}
