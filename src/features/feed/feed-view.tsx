import type { ReactNode } from "react";
import Link from "next/link";
import { Bookmark, FolderKanban, Users } from "lucide-react";
import { CompanyCard, GigCard, JobCard, PersonCard, ProfileMiniCard } from "@/components/cards/entity-cards";
import { DesktopSidebar } from "@/components/layout/app-shell";
import { PageNav } from "@/components/layout/page-nav";
import { EmptyState, QueryNotice } from "@/components/states/empty-state";
import { PostCard, PostComposer } from "@/features/feed/feed-ui";
import { Card } from "@/components/ui/card";
import { getAuthContext } from "@/lib/data/query";
import {
  getConnectionStates,
  getOrganisationsByIds,
  getProfilesByIds,
  listCommentsForPosts,
  listFeedPosts,
  listGigs,
  listJobs,
  listOrganisations,
  listPostReactionState,
  listPublicProfiles,
} from "@/lib/data/network";

const PAGE_SIZE = 20;

export async function FeedView({ compose = false, page = 1 }: { compose?: boolean; page?: number }) {
  const session = await getAuthContext();
  const currentPage = Math.max(1, page);
  const posts = await listFeedPosts({ viewerId: session.userId, page: currentPage, pageSize: PAGE_SIZE });
  const [reactions, people, companies, jobs, gigs] = await Promise.all([
    listPostReactionState(
      posts.data.map((post) => post.id),
      session.userId,
    ),
    listPublicProfiles({}, { pageSize: 6 }),
    listOrganisations(undefined, undefined, { pageSize: 2 }),
    listJobs({}, { pageSize: 2 }),
    listGigs({}, { pageSize: 2 }),
  ]);

  const authorIds = [...new Set(posts.data.map((post) => post.authorProfileId).filter((id): id is string => Boolean(id)))];
  const orgIds = [...new Set(posts.data.map((post) => post.authorOrganisationId).filter((id): id is string => Boolean(id)))];
  const authors = await getProfilesByIds(authorIds);
  const authorById = new Map(authors.map((person) => [person.id, person]));
  const orgs = await getOrganisationsByIds(orgIds);
  const orgById = new Map(orgs.map((org) => [org.id, org] as const));
  const comments = await listCommentsForPosts(posts.data.map((post) => post.id));
  const commentAuthors = await getProfilesByIds([...new Set(comments.data.map((comment) => comment.authorId))]);
  const railStates = await getConnectionStates(session.userId, people.data.slice(0, 3).map((person) => person.id));

  return (
    <div className="grid gap-4 lg:grid-cols-[240px_minmax(0,640px)_300px] lg:justify-center">
      <DesktopSidebar>
        {session.profile ? (
          <ProfileMiniCard profile={session.profile} />
        ) : (
          <Card className="p-4 text-sm">
            <Link href="/auth/sign-in" className="text-primary hover:underline">
              Sign in
            </Link>{" "}
            to use your passport and network.
          </Card>
        )}
        <Card className="p-3 text-sm">
          <Link href="/passport" className="flex items-center gap-2 rounded-lg px-2 py-2 hover:bg-muted">
            <FolderKanban className="size-4" /> Professional passport
          </Link>
          <Link href="/network" className="flex items-center gap-2 rounded-lg px-2 py-2 hover:bg-muted">
            <Users className="size-4" /> My network
          </Link>
          <Link href="/jobs" className="flex items-center gap-2 rounded-lg px-2 py-2 hover:bg-muted">
            <Bookmark className="size-4" /> Jobs & gigs
          </Link>
          {session.isPlatformAdmin ? (
            <Link href="/admin" className="flex items-center gap-2 rounded-lg px-2 py-2 hover:bg-muted">
              Operations console
            </Link>
          ) : null}
        </Card>
      </DesktopSidebar>
      <section className="space-y-3">
        <QueryNotice configured={posts.meta.configured} error={posts.meta.error} />
        <PostComposer openOnMount={compose} />
        {posts.data.length === 0 ? (
          <EmptyState
            title="No posts yet"
            body="When professionals and organisations publish updates, they will appear here."
          />
        ) : (
          posts.data.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              author={post.authorProfileId ? authorById.get(post.authorProfileId) ?? null : null}
              organisationName={post.authorOrganisationId ? orgById.get(post.authorOrganisationId)?.name ?? null : null}
              comments={comments.data.filter((comment) => comment.postId === post.id)}
              commentAuthors={commentAuthors}
              liked={reactions.liked.has(post.id)}
              likeCount={reactions.counts.get(post.id) ?? 0}
            />
          ))
        )}
        <PageNav
          path="/feed"
          page={currentPage}
          hasMore={posts.data.length === PAGE_SIZE}
          total={posts.total}
          params={compose ? { compose: "1" } : undefined}
        />
      </section>
      <aside className="hidden space-y-4 xl:block">
        <Rail title="People">
          {people.data.slice(0, 3).map((p) => (
            <PersonCard key={p.id} profile={p} connectionState={railStates.get(p.id) ?? "connect"} />
          ))}
          {people.data.length === 0 && <p className="text-sm text-muted-foreground">No professionals yet.</p>}
        </Rail>
        <Rail title="Companies">
          {companies.data.slice(0, 2).map((o) => (
            <CompanyCard key={o.id} org={o} />
          ))}
          {companies.data.length === 0 && <p className="text-sm text-muted-foreground">No organisations yet.</p>}
        </Rail>
        <Rail title="Jobs">
          {jobs.data.slice(0, 2).map((j) => (
            <JobCard key={j.id} job={j} />
          ))}
          {jobs.data.length === 0 && <p className="text-sm text-muted-foreground">No jobs yet.</p>}
        </Rail>
        <Rail title="Gigs">
          {gigs.data.slice(0, 2).map((g) => (
            <GigCard key={g.id} gig={g} />
          ))}
          {gigs.data.length === 0 && <p className="text-sm text-muted-foreground">No gigs yet.</p>}
        </Rail>
      </aside>
    </div>
  );
}

function Rail({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <p className="mb-2 text-sm font-semibold">{title}</p>
      <div className="space-y-3">{children}</div>
    </div>
  );
}
