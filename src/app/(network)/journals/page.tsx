import { JournalsFeedView } from "@/features/journals/journals-feed";
import { QueryNotice } from "@/components/states/empty-state";
import { getSiteJournalDirectory } from "@/lib/data/site-journals";
import { getAuthContext } from "@/lib/data/query";
import type { HealthUi } from "@/lib/domain/site-journal";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Site journals" };

export default async function JournalsPage({
  searchParams,
}: Readonly<{
  searchParams: Promise<{ q?: string; city?: string; projectType?: string; risk?: string }>;
}>) {
  const { q, city, projectType, risk } = await searchParams;
  const session = await getAuthContext();
  const directory = await getSiteJournalDirectory({
    q,
    city,
    projectType,
    risk: risk === "stable" || risk === "watch" || risk === "risk" || risk === "all" ? (risk as HealthUi | "all") : undefined,
  });
  return (
    <div>
      <QueryNotice configured={directory.meta.configured} error={directory.meta.error} />
      <JournalsFeedView
        journals={directory.journals.data}
        cities={directory.facets.cities}
        types={directory.facets.types}
        pulse={directory.pulse}
        signedIn={Boolean(session.userId)}
        filters={{ q, city, projectType, risk }}
      />
    </div>
  );
}
