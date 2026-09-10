import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PhotoFrame } from "@/components/identity/media-photo";
import { getAuthContext } from "@/lib/data/query";
import { resolveForumTarget } from "@/lib/data/identiti";
import { isForumEntityType } from "@/lib/domain/identiti-routes";
import { outboundDiscussionUrl, resolveForumLink } from "@/lib/integrations/vantage-forums";

export default async function ForumGoPage({
  params,
}: Readonly<{
  params: Promise<{ entityType: string; entityId: string }>;
}>) {
  const { entityType, entityId } = await params;
  if (!isForumEntityType(entityType)) notFound();
  const target = await resolveForumTarget(entityType, entityId);
  if (!target) notFound();
  const link = await resolveForumLink(entityType, entityId);
  const existing = outboundDiscussionUrl(link);
  if (existing) redirect(existing);
  const session = await getAuthContext();
  return (
    <Card className="mx-auto max-w-xl overflow-hidden">
      <PhotoFrame
        src={target.brand.coverPath || target.brand.logoPath}
        alt={`${target.brand.name} cover`}
        className="h-36"
      />
      <div className="p-6">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Vantage Forums</p>
      <h1 className="mt-2 text-2xl font-semibold">No Vantage thread mapped yet</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        {target.brand.name} does not have a linked Vantage thread yet. IDENTITI does not host forum content; once a
        thread is mapped, this link will take you directly to Vantage. No API key is placed in the URL.
      </p>
      <div className="mt-6 flex flex-wrap gap-2">
        <Button asChild>
          <Link href={session.userId ? `/forum/new/${entityType}/${entityId}` : `/auth/sign-in?next=/forum/go/${entityType}/${entityId}`}>
            Start a signed discussion
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link href={target.returnPath}>Back to {target.brand.name}</Link>
        </Button>
      </div>
      </div>
    </Card>
  );
}
