"use client";

import { useState, useTransition } from "react";
import { Award, Briefcase, FolderKanban, ImageIcon, Video } from "lucide-react";
import { InitialsAvatar } from "@/components/identity/visuals";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useSession } from "@/components/providers/session-provider";
import { createPost } from "@/lib/actions/network";
import { hueFromId, initialsFromName } from "@/lib/domain/passport-strength";
import type { Post, PublicProfile } from "@/lib/types/identity";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";

const POST_TYPES = [
  ["update", "Update"],
  ["project_completion", "Project completion"],
  ["hiring", "Hiring"],
  ["gig_requirement", "Gig"],
  ["job_vacancy", "Job"],
  ["certification", "Credential"],
  ["site_progress", "Site progress"],
  ["skill_achievement", "Skill"],
] as const;

export function PostComposer({ openOnMount = false }: { openOnMount?: boolean }) {
  const { profile } = useSession();
  const router = useRouter();
  const [open, setOpen] = useState(openOnMount);
  const [body, setBody] = useState("");
  const [postType, setPostType] = useState("update");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

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
          <InitialsAvatar initials={initialsFromName(profile.fullName)} hue={hueFromId(profile.id)} size={44} />
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
            <Button key={label as string} variant="ghost" size="sm" onClick={() => setOpen(true)}>
              <Icon />
              {label as string}
            </Button>
          ))}
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
}: {
  post: Post;
  author?: PublicProfile | null;
  organisationName?: string | null;
}) {
  const name = author?.fullName ?? organisationName ?? "Member";
  const href = author ? `/people/${author.handle}` : "#";
  return (
    <Card className="p-4">
      <div className="flex gap-3">
        <InitialsAvatar
          initials={initialsFromName(name)}
          hue={author ? hueFromId(author.id) : 250}
          size={44}
          className={!author ? "rounded-xl" : undefined}
        />
        <div>
          {author ? (
            <Link href={href} className="text-sm font-semibold hover:text-primary">
              {name}
            </Link>
          ) : (
            <p className="text-sm font-semibold">{name}</p>
          )}
          <p className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })} · {post.postType.replaceAll("_", " ")}
          </p>
          <p className="mt-3 text-sm leading-6">{post.body}</p>
        </div>
      </div>
    </Card>
  );
}
