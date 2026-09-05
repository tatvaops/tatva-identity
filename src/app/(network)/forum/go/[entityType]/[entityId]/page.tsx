import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getAuthContext } from "@/lib/data/query";
import { resolveForumTarget } from "@/lib/data/identiti";
import { isForumEntityType } from "@/lib/domain/identiti-routes";
import { outboundDiscussionUrl, resolveForumLink } from "@/lib/integrations/vantage-forums";

export default async function ForumGoPage({
  params,
}: {
  params: Promise<{ entityType: string; entityId: string }>;
}) {
  const { entityType, entityId } = await params;
  if (!isForumEntityType(entityType)) notFound();
  const target = await resolveForumTarget(entityType, entityId);
  if (!target) notFound();
  const link = await resolveForumLink(entityType, entityId);
  const existing = outboundDiscussionUrl(link);
  if (existing) redirect(existing);
  const session = await getAuthContext();
  return (
    <Card className="mx-auto max-w-xl p-6">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Vantage Forums</p>
      <h1 className="mt-2 text-2xl font-semibold">Discussion is not mapped yet</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        IDENTITI does not host this thread. When Vantage returns a thread slug for {target.brand.name}, this page will
        send you there. No API key is placed in the URL.
      </p>
      <div className="mt-6 flex flex-wrap gap-2">
        <Button asChild>
          <Link href={session.userId ? `/forum/new/${entityType}/${entityId}` : `/auth/sign-in?next=/forum/go/${entityType}/${entityId}`}>
            Start a signed discussion
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link href={target.returnPath}>Back to profile</Link>
        </Button>
      </div>
    </Card>
  );
}
