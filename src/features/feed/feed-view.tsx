import type { ReactNode } from "react";
import Link from "next/link";
import { Bookmark, FolderKanban, Users } from "lucide-react";
import { ProfileMiniCard } from "@/components/cards/entity-cards";
import { DesktopSidebar } from "@/components/layout/app-shell";
import { EmptyState, QueryNotice } from "@/components/states/empty-state";
import { PostCard, PostComposer } from "@/features/feed/feed-ui";
import { Card } from "@/components/ui/card";
import { getAuthContext } from "@/lib/data/query";
import { getProfileById, getOrganisationById, listCommentsForPosts, listFeedPosts, listJobs, listGigs, listOrganisations, listPublicProfiles } from "@/lib/data/network";
import { JobCard, GigCard, CompanyCard, PersonCard } from "@/components/cards/entity-cards";

export async function FeedView({ compose = false }: { compose?: boolean }) {
  const session = await getAuthContext();
  const posts = await listFeedPosts();
  const people = await listPublicProfiles();
  const companies = await listOrganisations();
  const jobs = await listJobs();
  const gigs = await listGigs();

  const authors = await Promise.all(
    posts.data.map((p) => (p.authorProfileId ? getProfileById(p.authorProfileId) : Promise.resolve({ data: null }))),
  );
  const orgs = await Promise.all(
    posts.data.map((p) =>
      p.authorOrganisationId ? getOrganisationById(p.authorOrganisationId) : Promise.resolve({ data: null }),
    ),
  );
  const comments = await listCommentsForPosts(posts.data.map((post) => post.id));
  const commentAuthorIds = [...new Set(comments.data.map((comment) => comment.authorId))];
  const commentAuthorRows = await Promise.all(commentAuthorIds.map((id) => getProfileById(id)));
  const commentAuthors = commentAuthorRows.map((row) => row.data).filter((row): row is NonNullable<typeof row> => Boolean(row));

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
          posts.data.map((post, i) => (
            <PostCard
              key={post.id}
              post={post}
              author={authors[i]?.data}
              organisationName={orgs[i]?.data?.name}
              comments={comments.data.filter((comment) => comment.postId === post.id)}
              commentAuthors={commentAuthors}
            />
          ))
        )}
      </section>
      <aside className="hidden space-y-4 xl:block">
        <Rail title="People">
          {people.data.slice(0, 3).map((p) => (
            <PersonCard key={p.id} profile={p} />
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
