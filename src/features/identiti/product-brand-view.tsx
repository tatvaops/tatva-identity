"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { BadgeCheck, CirclePlay } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PhotoFrame } from "@/components/identity/media-photo";
import { SaveButton } from "@/components/identity/save-button";
import { PersonCard } from "@/components/cards/entity-cards";
import { presentAiReview } from "@/lib/domain/ai-review";
import type { IdentitiBrand, IdentitiProject } from "@/lib/data/identiti";
import type { AiReviewRecord, AiReviewSource } from "@/lib/domain/ai-review";
import type { PublicProfile } from "@/lib/types/identity";
import { IdentitiChip, IdentitiSection, OverlayHero, StarRating } from "@/features/identiti/identiti-chrome";

type Product = {
  id: string;
  slug: string;
  name: string;
  application_family: string;
  category: string | null;
  description: string | null;
  indicative_price_label: string | null;
  photo_url: string | null;
};

type ProductUse = {
  id: string;
  application: string | null;
  location: string | null;
  endorsement: string | null;
  product: Product | null;
  project: IdentitiProject | null;
};

export function ProductBrandView({
  brand,
  products,
  uses,
  projects,
  videos,
  people,
  ai,
  saved,
  signedIn,
}: {
  brand: IdentitiBrand;
  products: Product[];
  uses: ProductUse[];
  projects: IdentitiProject[];
  videos: { id: string; title: string; youtube_url: string; duration_label: string | null }[];
  people: PublicProfile[];
  ai: { settings: { source: AiReviewSource; enabled: boolean; minimumSourceCount: number } | null; review: AiReviewRecord | null };
  saved: boolean;
  signedIn: boolean;
}) {
  const families = useMemo(() => [...new Set(products.map((product) => product.application_family).filter(Boolean))], [products]);
  const [family, setFamily] = useState<string>(families[0] ?? "all");
  const pulse = presentAiReview(ai.review, ai.settings ?? { source: "google_reviews", enabled: true, minimumSourceCount: 5 });
  const proof = uses.filter((row) => row.project);
  const visible = family === "all" ? products : products.filter((product) => product.application_family === family);
  const discuss = signedIn ? `/forum/new/product_brand/${brand.id}` : `/auth/sign-in?next=/product-brands/${brand.slug}`;
  const factory = videos[0];

  return (
    <div className="space-y-6 pb-14">
      <section className="overflow-hidden rounded-[28px] border border-[#e2e5ef] bg-white shadow-[0_18px_60px_rgba(20,28,73,.09)]">
        <OverlayHero src={brand.coverPath} alt={`${brand.name} materials`}>
          <div className="mb-2 flex flex-wrap gap-2">
            {brand.gstVerified ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                <BadgeCheck className="size-3" /> TatvaOps verified
              </span>
            ) : null}
            <span className="rounded-full bg-white/15 px-2.5 py-1 text-xs font-semibold backdrop-blur">
              {brand.categoryLabel ?? "Product brand"}
            </span>
          </div>
          <h1 className="text-3xl font-black tracking-tight sm:text-4xl">{brand.name}</h1>
        </OverlayHero>
        <div className="grid gap-6 p-5 sm:p-7 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <StarRating value={brand.averageRating} count={brand.verifiedReviewCount || null} />
            <p className="mt-3 max-w-3xl text-[15px] leading-7 text-[#555c78]">{brand.about}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            {signedIn ? (
              <SaveButton kind="organisation" id={brand.id} saved={saved} />
            ) : (
              <Button asChild variant="outline" className="rounded-xl px-5 py-3 font-bold">
                <Link href={`/auth/sign-in?next=/product-brands/${brand.slug}`}>Save brand</Link>
              </Button>
            )}
            <Button asChild className="rounded-xl px-5 py-3 font-bold">
              <Link href={discuss}>Ask the community</Link>
            </Button>
            {brand.website ? (
              <Button asChild variant="outline" className="rounded-xl px-5 py-3 font-bold">
                <a href={brand.website} target="_blank" rel="noreferrer">
                  Download catalogue
                </a>
              </Button>
            ) : null}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-y-5 border-t border-[#eceef4] px-5 py-5 sm:grid-cols-3 sm:px-7">
          <Stat value={brand.city ?? "—"} label="In the market" />
          <Stat value={brand.servingRegions ?? brand.serviceAreas[0] ?? "—"} label="Dealer points" />
          <Stat value={brand.averageRating != null ? `${brand.averageRating.toFixed(1)}/5` : "—"} label="Installer rating" />
        </div>
      </section>

      <IdentitiSection eyebrow="Choose by application" title="Product families">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setFamily("all")}
            className={`rounded-full border px-3 py-2 text-sm font-semibold ${family === "all" ? "border-[#2437d4] bg-[#eef0ff] text-[#2437d4]" : "border-[#dfe2eb] text-[#656b85]"}`}
          >
            All families
          </button>
          {families.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setFamily(item)}
              className={`rounded-full border px-3 py-2 text-sm font-semibold ${family === item ? "border-[#2437d4] bg-[#eef0ff] text-[#2437d4]" : "border-[#dfe2eb] text-[#656b85]"}`}
            >
              {item}
            </button>
          ))}
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {visible.map((product) => (
            <Link key={product.id} href={`/product-brands/${brand.slug}/products/${product.slug}`} className="overflow-hidden rounded-2xl border border-[#e4e6ef]">
              <PhotoFrame src={product.photo_url} alt="" className="h-40" />
              <div className="p-5">
                <p className="text-xs text-[#7a7f99]">{product.category ?? product.application_family}</p>
                <h3 className="mt-1 text-lg font-bold text-[#111a42]">{product.name}</h3>
                <p className="mt-2 text-sm text-[#747a95]">{product.description}</p>
                {product.indicative_price_label ? <p className="mt-3 text-sm font-medium">Indicative retail · {product.indicative_price_label}</p> : null}
              </div>
            </Link>
          ))}
        </div>
      </IdentitiSection>

      {(proof.length > 0 || projects.length > 0) && (
        <IdentitiSection eyebrow="Application proof" title="See the material in real projects">
          <p className="mb-4 text-sm text-[#747a95]">
            Projects where this brand’s products were used, tagged by professionals and interior teams.
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            {(proof.length ? proof : projects.map((project) => ({ id: project.id, product: null, project, application: null, location: project.city, endorsement: null }))).map((row) => (
              <Link key={row.id} href={`/projects/${row.project!.slug}`} className="overflow-hidden rounded-2xl border border-[#e4e6ef]">
                <PhotoFrame src={row.project!.coverImageUrl} alt="" className="h-40" />
                <div className="p-5">
                  <IdentitiChip>{row.product?.name ?? "Verified project uploads"}</IdentitiChip>
                  <h3 className="mt-3 text-lg font-bold text-[#111a42]">{row.project!.name}</h3>
                  <p className="text-sm text-[#747a95]">{row.application || row.location || row.project!.city}</p>
                  {row.endorsement ? <p className="mt-2 text-sm text-[#555c78]">{row.endorsement}</p> : null}
                </div>
              </Link>
            ))}
          </div>
        </IdentitiSection>
      )}

      {people.length > 0 ? (
        <IdentitiSection eyebrow="Used by verified professionals" title="People who specify or install this brand">
          <div className="grid gap-3 md:grid-cols-2">
            {people.map((person) => (
              <PersonCard key={person.id} profile={person} />
            ))}
          </div>
        </IdentitiSection>
      ) : null}

      {factory ? (
        <a href={factory.youtube_url} target="_blank" rel="noreferrer" className="grid gap-3 rounded-2xl bg-[#111a42] p-5 text-white sm:grid-cols-[1fr_auto] sm:items-center">
          <div className="flex items-center gap-4">
            <CirclePlay className="size-8" />
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#aeb7ff]">
                Factory tour{factory.duration_label ? ` · ${factory.duration_label}` : ""}
              </p>
              <p className="mt-1 font-bold">{factory.title}</p>
            </div>
          </div>
          <span className="rounded-xl bg-white px-4 py-2.5 text-center text-sm font-bold text-[#111a42]">Watch videos</span>
        </a>
      ) : null}

      <IdentitiSection eyebrow="AI review" title="What customers are saying">
        <IdentitiChip active>{pulse.sourceLabel}</IdentitiChip>
        {pulse.state === "ready" && pulse.review ? (
          <p className="mt-4 text-[15px] leading-7 text-[#303757]">{pulse.review.summary}</p>
        ) : (
          <p className="mt-4 text-sm text-[#747a95]">Not enough eligible sources for a labelled summary yet.</p>
        )}
      </IdentitiSection>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="min-w-0">
      <div className="text-xl font-extrabold tracking-tight text-[#111a42]">{value}</div>
      <div className="mt-1 text-xs leading-5 text-[#7a7f99]">{label}</div>
    </div>
  );
}
