import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ServiceBrandView } from "@/features/identiti/service-brand-view";
import { QueryNotice } from "@/components/states/empty-state";
import { getAuthContext } from "@/lib/data/query";
import {
  getBrandAi,
  getBrandPerformance,
  getIdentitiBrand,
  listBrandStrengths,
  listBrandVideos,
  listBrandPeople,
  listIdentitiProjects,
  recordIdentitiEvent,
} from "@/lib/data/identiti";
import { listSavedItems } from "@/lib/data/workspace";
import { entityMetadata } from "@/lib/domain/seo";

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const brand = await getIdentitiBrand(slug);
  if (!brand.data) return { title: "Service brand" };
  return entityMetadata({
    title: brand.data.name,
    description: brand.data.tagline ?? brand.data.about,
    path: `/service-brands/${brand.data.slug}`,
    image: brand.data.coverPath ?? brand.data.logoPath,
  });
}

export default async function ServiceBrandPage({ params }: PageProps) {
  const { slug } = await params;
  const brand = await getIdentitiBrand(slug);
  if (brand.meta.error) return <QueryNotice configured={brand.meta.configured} error={brand.meta.error} />;
  if (!brand.data || brand.data.passportKind !== "service_brand") {
    if (!brand.meta.configured) return <QueryNotice configured={false} error={null} />;
    notFound();
  }
  const current = brand.data;
  const session = await getAuthContext();
  const [projects, performance, strengths, videos, ai, saved, people] = await Promise.all([
    listIdentitiProjects(current.id),
    getBrandPerformance(current.id),
    listBrandStrengths(current.id),
    listBrandVideos(current.id),
    getBrandAi(current.id),
    session.userId ? listSavedItems(session.userId) : Promise.resolve({ data: [] }),
    listBrandPeople(current.id),
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
      people={people}
      saved={saved.data.some((row) => row.entityKind === "organisation" && row.entityId === current.id)}
      signedIn={Boolean(session.userId)}
    />
  );
}
