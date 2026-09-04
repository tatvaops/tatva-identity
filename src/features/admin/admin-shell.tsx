"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { Wordmark } from "@/components/layout/app-shell";
import { SkipLink } from "@/components/layout/page-nav";
import { InitialsAvatar } from "@/components/identity/visuals";
import { ADMIN_NAV } from "@/lib/admin/nav";
import { hueFromId, initialsFromName } from "@/lib/domain/passport-strength";
import { cn } from "@/lib/utils";
import type { PublicProfile } from "@/lib/types/identity";

export function AdminShell({
  profile,
  children,
}: {
  profile: PublicProfile;
  children: ReactNode;
}) {
  const pathname = usePathname();
  return (
    <div className="min-h-screen bg-[#f3f4f6]">
      <SkipLink label="Skip to operations content" />
      <div className="flex min-h-screen">
        <aside className="hidden w-64 shrink-0 border-r border-zinc-800 bg-zinc-950 text-zinc-100 lg:flex lg:flex-col">
          <div className="flex items-center gap-2 border-b border-zinc-800 px-4 py-4">
            <ShieldCheck className="size-5 text-indigo-400" aria-hidden />
            <div>
              <p className="text-sm font-semibold">Operations</p>
              <p className="text-[11px] text-zinc-400">Tatva Identity</p>
            </div>
          </div>
          <nav className="flex-1 space-y-0.5 p-3" aria-label="Operations">
            {ADMIN_NAV.map((item) => {
              const active = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "block rounded-lg px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-900 hover:text-white",
                    active && "bg-zinc-900 text-white",
                  )}
                >
                  <span className="font-medium">{item.label}</span>
                  <span className="mt-0.5 block text-[11px] text-zinc-500">{item.description}</span>
                </Link>
              );
            })}
          </nav>
          <div className="border-t border-zinc-800 p-4 text-xs text-zinc-500">
            Operator actions are audited. Hire, Quote and Vertex work history stay out of this console.
          </div>
        </aside>
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-white px-4">
            <div className="lg:hidden">
              <Wordmark compact />
            </div>
            <p className="hidden text-sm font-medium text-muted-foreground sm:block">Platform operations</p>
            <div className="ml-auto flex items-center gap-3">
              <Link href="/feed" className="text-sm text-primary hover:underline">
                Back to network
              </Link>
              <div className="flex items-center gap-2">
                <InitialsAvatar initials={initialsFromName(profile.fullName)} hue={hueFromId(profile.id)} size={28} src={profile.avatarPath} />
                <span className="hidden text-sm sm:inline">{profile.fullName}</span>
              </div>
            </div>
          </header>
          <nav className="flex gap-1 overflow-x-auto border-b border-border bg-white px-3 py-2 lg:hidden" aria-label="Operations mobile">
            {ADMIN_NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="shrink-0 rounded-full border border-border px-3 py-1 text-xs font-medium"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <main id="main-content" className="flex-1 px-4 py-6 md:px-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}

export function AdminDenied({ message }: { message?: string | null }) {
  const body =
    message === "Admin database access is not configured."
      ? "The operations console needs a service-role key on the server. It is not a public directory."
      : "This route is only for platform operators. It is not a public directory and it does not bypass Vertex. Ask an existing operator to grant your handle, or set PLATFORM_ADMIN_HANDLES for the first operator.";
  return (
    <div className="mx-auto max-w-lg px-4 py-24 text-center">
      <ShieldCheck className="mx-auto size-10 text-muted-foreground" aria-hidden />
      <h1 className="mt-4 text-xl font-semibold">Operations console</h1>
      <p className="mt-2 text-sm text-muted-foreground">{body}</p>
      <Link href="/feed" className="mt-6 inline-block text-sm font-medium text-primary hover:underline">
        Return to the network
      </Link>
    </div>
  );
}
