import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getAuthContext } from "@/lib/data/query";
import { resolveForumTarget } from "@/lib/data/identiti";
import { appOrigin, isForumEntityType } from "@/lib/domain/identiti-routes";
import { startDiscussionRedirect } from "@/lib/integrations/vantage-forums";

export default async function ForumNewPage({
  params,
}: {
  params: Promise<{ entityType: string; entityId: string }>;
}) {
  const { entityType, entityId } = await params;
  if (!isForumEntityType(entityType)) notFound();
  const session = await getAuthContext();
  if (!session.userId) redirect(`/auth/sign-in?next=/forum/new/${entityType}/${entityId}`);
  const target = await resolveForumTarget(entityType, entityId);
  if (!target) notFound();
  const started = await startDiscussionRedirect({
    userId: session.userId,
    entityType,
    entityId,
    brandId: target.brandId,
    productId: target.productId,
    returnUrl: `${appOrigin()}${target.returnPath}`,
  });
  if ("url" in started) redirect(started.url);
  return (
    <Card className="mx-auto max-w-xl p-6">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Vantage Forums</p>
      <h1 className="mt-2 text-2xl font-semibold">Cannot start this discussion yet</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        {started.error} IDENTITI will not invent a live Vantage thread. Set the forum signing key, then try again. This
        never auto-publishes a post.
      </p>
      <Button className="mt-6" variant="outline" asChild>
        <Link href={target.returnPath}>Back to profile</Link>
      </Button>
    </Card>
  );
}
