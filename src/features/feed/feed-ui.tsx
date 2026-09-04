"use client";

import { useRef, useState, useTransition } from "react";
import { Award, Briefcase, FolderKanban, ImageIcon, Video } from "lucide-react";
import { InitialsAvatar } from "@/components/identity/visuals";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useSession } from "@/components/providers/session-provider";
import { addComment, createPost, reportPost, togglePostReaction } from "@/lib/actions/network";
import { uploadPublicImage } from "@/lib/actions/media";
import { hueFromId, initialsFromName } from "@/lib/domain/passport-strength";
import type { Post, PostComment, PublicProfile } from "@/lib/types/identity";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";

const POST_TYPES = [
  ["update", "Professional update"],
  ["project_completion", "Project completion"],
  ["before_after", "Before / after"],
  ["hiring", "Hiring"],
  ["gig_requirement", "Gig"],
  ["job_vacancy", "Job"],
  ["certification", "Credential"],
  ["case_study", "Case study"],
  ["product_service", "Service announcement"],
  ["site_progress", "Site progress"],
  ["skill_achievement", "Achievement"],
  ["project_milestone", "Project update"],
] as const;

const POST_TYPE_LABEL: Record<string, string> = {
  update: "Professional update",
  project_completion: "Project",
  before_after: "Project",
  hiring: "Hiring",
  gig_requirement: "Gig",
  job_vacancy: "Job",
  certification: "Credential",
  new_employee: "Professional update",
  work_anniversary: "Professional update",
  project_milestone: "Project",
  vendor_completion: "Project",
  case_study: "Project",
  product_service: "Service",
  site_progress: "Project",
  skill_achievement: "Achievement",
};

export function PostComposer({ openOnMount = false }: { openOnMount?: boolean }) {
  const { profile } = useSession();
  const router = useRouter();
  const [open, setOpen] = useState(openOnMount);
  const [body, setBody] = useState("");
  const [postType, setPostType] = useState("update");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const photoInput = useRef<HTMLInputElement>(null);
  const [photoPath, setPhotoPath] = useState<string | null>(null);

  if (!profile) {
    return (
      <Card className="p-4 text-sm">
        <Link href="/auth/sign-in?next=/feed" className="text-primary hover:underline">
          Sign in
        </Link>{" "}
        to share an update, project, achievement or opportunity.
      </Card>
    );
  }

  return (
    <>
      <Card className="p-4">
        <div className="flex gap-3">
          <InitialsAvatar initials={initialsFromName(profile.fullName)} hue={hueFromId(profile.id)} size={44} src={profile.avatarPath} />
          <button
            className="h-11 flex-1 rounded-full border border-border bg-muted/50 px-4 text-left text-sm text-muted-foreground hover:bg-muted"
            onClick={() => setOpen(true)}
          >
            Share an update, project, achievement or opportunity...
          </button>
        </div>
        <div className="mt-3 flex flex-wrap gap-1">
          {[
            ["Photo", ImageIcon],
            ["Video", Video],
            ["Project", FolderKanban],
            ["Job", Briefcase],
            ["Credential", Award],
          ].map(([label, Icon]) => (
            <Button
              key={label as string}
              variant="ghost"
              size="sm"
              onClick={() => {
                if (label === "Photo") photoInput.current?.click();
                else setOpen(true);
              }}
            >
              <Icon />
              {label as string}
            </Button>
          ))}
          <input
            ref={photoInput}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (!file) return;
              start(async () => {
                const data = new FormData();
                data.set("file", file);
                data.set("kind", "post");
                const result = await uploadPublicImage(data);
                if (!result.ok) {
                  setError(result.error);
                  return;
                }
                setPhotoPath(result.id ?? null);
                setOpen(true);
              });
            }}
          />
        </div>
      </Card>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogTitle>Share with the work network</DialogTitle>
          <label className="mt-3 block text-sm font-medium" htmlFor="post-type">
            Type
          </label>
          <select
            id="post-type"
            className="mt-1 h-10 w-full rounded-lg border border-input px-3 text-sm"
            value={postType}
            onChange={(e) => setPostType(e.target.value)}
          >
            {POST_TYPES.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="What did you complete, hire for, or verify?"
            className="mt-3 min-h-32"
          />
          {photoPath ? <p className="mt-2 text-xs text-muted-foreground">Photo attached.</p> : null}
          {error && <p className="mt-2 text-sm text-rose-700">{error}</p>}
          <div className="mt-4 flex justify-end">
            <Button
              disabled={pending}
              onClick={() =>
                start(async () => {
                  const result = await createPost(body, postType);
                  if (!result.ok) {
                    setError(result.error);
                    return;
                  }
                  setBody("");
                  setPhotoPath(null);
                  setOpen(false);
                  router.refresh();
                })
              }
            >
              Post
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function PostCard({
  post,
  author,
  organisationName,
  comments = [],
  commentAuthors = [],
}: {
  post: Post;
  author?: PublicProfile | null;
  organisationName?: string | null;
  comments?: PostComment[];
  commentAuthors?: PublicProfile[];
}) {
  const name = author?.fullName ?? organisationName ?? "Member";
  const href = author ? `/people/${author.handle}` : "#";
  const router = useRouter();
  const { userId } = useSession();
  const [comment, setComment] = useState("");
  const [liked, setLiked] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  return (
    <Card className="p-4">
      <div className="flex gap-3">
        <InitialsAvatar
          initials={initialsFromName(name)}
          hue={author ? hueFromId(author.id) : 250}
          size={44}
          src={author?.avatarPath}
          className={!author ? "rounded-xl" : undefined}
        />
        <div className="min-w-0 flex-1">
          {author ? (
            <Link href={href} className="text-sm font-semibold hover:text-primary">
              {name}
            </Link>
          ) : (
            <p className="text-sm font-semibold">{name}</p>
          )}
          <p className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
          </p>
          <Badge variant="outline" className="mt-2">
            {POST_TYPE_LABEL[post.postType] ?? post.postType.replaceAll("_", " ")}
          </Badge>
          <p className="mt-3 text-sm leading-6">{post.body}</p>
          {comments.length > 0 ? (
            <ul className="mt-4 space-y-3 border-t border-border pt-3">
              {comments.map((comment) => {
                const commentAuthor = commentAuthors.find((person) => person.id === comment.authorId);
                return (
                  <li key={comment.id} className="text-sm">
                    {commentAuthor ? (
                      <Link href={`/people/${commentAuthor.handle}`} className="font-medium hover:text-primary">
                        {commentAuthor.fullName}
                      </Link>
                    ) : (
                      <span className="font-medium">Member</span>
                    )}
                    <p className="mt-0.5 text-muted-foreground">{comment.body}</p>
                  </li>
                );
              })}
            </ul>
          ) : null}
          <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-3">
            <Button
              type="button"
              size="sm"
              variant={liked ? "secondary" : "outline"}
              disabled={!userId || pending}
              onClick={() =>
                start(async () => {
                  const result = await togglePostReaction(post.id, liked);
                  if (!result.ok) {
                    setError(result.error);
                    return;
                  }
                  setLiked(!liked);
                  router.refresh();
                })
              }
            >
              {liked ? "Liked" : "Like"}
            </Button>
            {userId ? (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                disabled={pending}
                onClick={() => {
                  if (!window.confirm("Report this post to platform operators?")) return;
                  start(async () => {
                    const result = await reportPost(post.id, "inappropriate");
                    if (!result.ok) {
                      setError(result.error);
                      return;
                    }
                    setError(null);
                    router.refresh();
                  });
                }}
              >
                Report
              </Button>
            ) : null}
          </div>
          {userId ? (
            <form
              className="mt-3 space-y-2"
              onSubmit={(event) => {
                event.preventDefault();
                start(async () => {
                  const result = await addComment(post.id, comment);
                  if (!result.ok) {
                    setError(result.error);
                    return;
                  }
                  setComment("");
                  router.refresh();
                });
              }}
            >
              <label className="sr-only" htmlFor={`comment-${post.id}`}>
                Comment
              </label>
              <Textarea
                id={`comment-${post.id}`}
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                placeholder="Write a comment"
                className="min-h-16"
              />
              <Button type="submit" size="sm" disabled={pending}>
                Comment
              </Button>
            </form>
          ) : null}
          {error ? (
            <p className="mt-2 text-sm text-rose-700" role="alert">
              {error}
            </p>
          ) : null}
        </div>
      </div>
    </Card>
  );
}
