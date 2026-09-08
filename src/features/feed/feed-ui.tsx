"use client";

import { useRef, useState, useTransition } from "react";
import { Award, Briefcase, FolderKanban, ImageIcon, Video } from "lucide-react";
import { InitialsAvatar } from "@/components/identity/visuals";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useSession } from "@/components/providers/session-provider";
import { addComment, createPost, deleteOwnPost, reportPost, togglePostReaction } from "@/lib/actions/network";
import { uploadPublicImage } from "@/lib/actions/media";
import { PhotoFrame } from "@/components/identity/media-photo";
import { YoutubeEmbed } from "@/components/identity/youtube-embed";
import { personPublicHref } from "@/lib/domain/identiti-routes";
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
  const videoInput = useRef<HTMLInputElement>(null);
  const [photoPath, setPhotoPath] = useState<string | null>(null);
  const [youtubeUrl, setYoutubeUrl] = useState("");

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
            className="h-11 flex-1 border border-border bg-surface-muted px-4 text-left text-sm text-muted-foreground hover:bg-muted"
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
                else if (label === "Video") videoInput.current?.click();
                else if (label === "Project") {
                  setPostType("project_completion");
                  setOpen(true);
                } else if (label === "Job") {
                  setPostType("job_vacancy");
                  setOpen(true);
                } else if (label === "Credential") {
                  setPostType("certification");
                  setOpen(true);
                } else setOpen(true);
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
          <input
            ref={videoInput}
            type="file"
            accept="video/mp4,video/webm"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (!file) return;
              start(async () => {
                const data = new FormData();
                data.set("file", file);
                data.set("kind", "video");
                const result = await uploadPublicImage(data);
                if (!result.ok) {
                  setError(result.error);
                  return;
                }
                setYoutubeUrl(result.id ?? "");
                setPostType("site_progress");
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
          <label className="mt-3 block text-sm font-medium" htmlFor="post-video">
            Video (optional)
          </label>
          <Input
            id="post-video"
            value={youtubeUrl}
            onChange={(event) => setYoutubeUrl(event.target.value)}
            placeholder="https://www.youtube.com/watch?v=… or upload from this device"
            className="mt-1"
          />
          <input
            type="file"
            accept="video/mp4,video/webm"
            className="mt-2 block w-full text-xs file:mr-2 file:rounded-md file:border-0 file:bg-zinc-100 file:px-2 file:py-1 file:text-xs"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (!file) return;
              start(async () => {
                const data = new FormData();
                data.set("file", file);
                data.set("kind", "video");
                const result = await uploadPublicImage(data);
                if (!result.ok) {
                  setError(result.error);
                  return;
                }
                setYoutubeUrl(result.id ?? "");
              });
            }}
          />
          <p className="mt-1 text-xs text-muted-foreground">Upload from this device (MP4 or WebM, under 50 MB)</p>
          {photoPath ? <p className="mt-2 text-xs text-muted-foreground">Photo attached and will publish with this update.</p> : null}
          {youtubeUrl && !youtubeUrl.startsWith("http") ? (
            <p className="mt-2 text-xs text-muted-foreground">Video attached and will publish with this update.</p>
          ) : null}
          {error && <p className="mt-2 text-sm text-rose-700">{error}</p>}
          <div className="mt-4 flex justify-end">
            <Button
              disabled={pending}
              onClick={() =>
                start(async () => {
                  const result = await createPost(body, postType, photoPath, youtubeUrl);
                  if (!result.ok) {
                    setError(result.error);
                    return;
                  }
                  setBody("");
                  setPhotoPath(null);
                  setYoutubeUrl("");
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
  liked = false,
  likeCount = 0,
}: {
  post: Post;
  author?: PublicProfile | null;
  organisationName?: string | null;
  comments?: PostComment[];
  commentAuthors?: PublicProfile[];
  liked?: boolean;
  likeCount?: number;
}) {
  const name = author?.fullName ?? organisationName ?? "Member";
  const href = author ? personPublicHref(author.handle, author.occupationMode) : "#";
  const router = useRouter();
  const { userId } = useSession();
  const [comment, setComment] = useState("");
  const [likedState, setLiked] = useState(liked);
  const [count, setCount] = useState(likeCount);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  return (
    <article className="border border-border bg-white p-4">
      <div className="flex gap-3">
        <InitialsAvatar
          initials={initialsFromName(name)}
          hue={author ? hueFromId(author.id) : 250}
          size={44}
          src={author?.avatarPath}
          className={!author ? "rounded-md" : undefined}
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
            {[author?.headline, author?.classification, formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })]
              .filter(Boolean)
              .join(" · ")}
          </p>
          <Badge variant="outline" className="mt-2">
            {POST_TYPE_LABEL[post.postType] ?? post.postType.replaceAll("_", " ")}
          </Badge>
          <p className="mt-3 text-sm leading-6">{post.body}</p>
          {post.mediaPath ? <PhotoFrame src={post.mediaPath} alt="" className="mt-3 h-64" /> : null}
          <YoutubeEmbed url={post.youtubeUrl} title={`${name} video`} />
          {comments.length > 0 ? (
            <ul className="mt-4 space-y-3 border-t border-border pt-3">
              {comments.map((comment) => {
                const commentAuthor = commentAuthors.find((person) => person.id === comment.authorId);
                return (
                  <li key={comment.id} className="text-sm">
                    {commentAuthor ? (
                      <Link href={personPublicHref(commentAuthor.handle, commentAuthor.occupationMode)} className="font-medium hover:text-primary">
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
              variant={likedState ? "secondary" : "outline"}
              disabled={!userId || pending}
              onClick={() =>
                start(async () => {
                  const result = await togglePostReaction(post.id, likedState);
                  if (!result.ok) {
                    setError(result.error);
                    return;
                  }
                  setLiked(!likedState);
                  setCount((value) => Math.max(0, value + (likedState ? -1 : 1)));
                  router.refresh();
                })
              }
            >
              {likedState ? "Liked" : "Like"}
              {count > 0 ? ` · ${count}` : ""}
            </Button>
            {userId === post.authorProfileId ? (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                disabled={pending}
                onClick={() =>
                  start(async () => {
                    const result = await deleteOwnPost(post.id);
                    if (!result.ok) setError(result.error);
                    else router.refresh();
                  })
                }
              >
                Delete
              </Button>
            ) : null}
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
    </article>
  );
}
