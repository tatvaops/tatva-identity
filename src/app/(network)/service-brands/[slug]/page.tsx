import { notFound } from "next/navigation";
import { ServiceBrandView } from "@/features/identiti/service-brand-view";
import { QueryNotice } from "@/components/states/empty-state";
import { getAuthContext } from "@/lib/data/query";
import {
  getBrandAi,
  getBrandPerformance,
  getIdentitiBrand,
  listBrandStrengths,
  listBrandVideos,
  listIdentitiProjects,
  recordIdentitiEvent,
} from "@/lib/data/identiti";
import { listSavedItems } from "@/lib/data/workspace";

export default async function ServiceBrandPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const brand = await getIdentitiBrand(slug);
  if (brand.meta.error) return <QueryNotice configured={brand.meta.configured} error={brand.meta.error} />;
  if (!brand.data || brand.data.passportKind !== "service_brand") {
    if (!brand.meta.configured) return <QueryNotice configured={false} error={null} />;
    notFound();
  }
  const current = brand.data;
  const session = await getAuthContext();
  const [projects, performance, strengths, videos, ai, saved] = await Promise.all([
    listIdentitiProjects(current.id),
    getBrandPerformance(current.id),
    listBrandStrengths(current.id),
    listBrandVideos(current.id),
    getBrandAi(current.id),
    session.userId ? listSavedItems(session.userId) : Promise.resolve({ data: [] }),
  ]);
  await recordIdentitiEvent("brand_profile_view", "organisation", current.id);
  return (
    <ServiceBrandView
      brand={current}
      projects={projects}
      performance={performance}
      strengths={strengths}
      videos={videos}
      ai={ai}
      saved={saved.data.some((row) => row.entityKind === "organisation" && row.entityId === current.id)}
      signedIn={Boolean(session.userId)}
    />
  );
}
