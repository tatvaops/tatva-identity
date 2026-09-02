"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bell, Briefcase, Home, MessageSquare, Plus, Search, UserRound, Users } from "lucide-react";
import { useState } from "react";
import { InitialsAvatar } from "@/components/identity/visuals";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { useSession } from "@/components/providers/session-provider";
import { product, searchPlaceholder } from "@/lib/config";
import { hueFromId, initialsFromName } from "@/lib/domain/passport-strength";
import { signOut } from "@/lib/actions/network";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/feed", label: "Home", icon: Home },
  { href: "/network", label: "My Network", icon: Users },
  { href: "/jobs", label: "Jobs", icon: Briefcase },
  { href: "/messages", label: "Messages", icon: MessageSquare },
  { href: "/notifications", label: "Notifications", icon: Bell },
];

export function Wordmark({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-2">
      <span className="grid size-8 place-items-center rounded-lg bg-primary text-[11px] font-bold text-white">TI</span>
      {!compact && <span className="text-[15px] font-semibold tracking-tight">{product.name}</span>}
    </Link>
  );
}

export function GlobalHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const [q, setQ] = useState("");
  const { profile, userId } = useSession();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-white/95 backdrop-blur">
      <div className="page-wrap flex h-14 items-center gap-3 px-4">
        <Wordmark />
        <form
          className="hidden min-w-0 flex-1 md:block"
          onSubmit={(e) => {
            e.preventDefault();
            router.push(`/search?q=${encodeURIComponent(q)}`);
          }}
        >
          <div className="relative max-w-xl">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={searchPlaceholder}
              className="h-9 bg-[#eef3f8] pl-9"
              aria-label="Search"
            />
          </div>
        </form>
        <nav className="ml-auto hidden items-stretch lg:flex" aria-label="Primary">
          {nav.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex w-[76px] flex-col items-center justify-center gap-0.5 text-[11px] text-muted-foreground hover:text-foreground",
                  active && "text-foreground",
                )}
              >
                <item.icon className="size-5" />
                {item.label}
              </Link>
            );
          })}
          <Link
            href={profile ? `/people/${profile.handle}` : "/auth/sign-in"}
            className={cn(
              "flex w-[76px] flex-col items-center justify-center gap-0.5 text-[11px] text-muted-foreground hover:text-foreground",
              pathname.startsWith("/people") && "text-foreground",
            )}
          >
            {profile ? (
              <InitialsAvatar initials={initialsFromName(profile.fullName)} hue={hueFromId(profile.id)} size={22} />
            ) : (
              <UserRound className="size-5" />
            )}
            Profile
          </Link>
        </nav>
        <Link href="/search" className="ml-auto md:hidden" aria-label="Search">
          <Search className="size-5" />
        </Link>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="hidden md:inline-flex">
              For Business
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Organisations</DropdownMenuLabel>
            <DropdownMenuItem asChild>
              <Link href="/companies">Browse companies</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/jobs">Jobs</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/gigs">Gigs</Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        {userId && profile ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="hidden md:block" aria-label="Account menu">
                <InitialsAvatar initials={initialsFromName(profile.fullName)} hue={hueFromId(profile.id)} size={32} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>{profile.fullName}</DropdownMenuLabel>
              <DropdownMenuItem asChild>
                <Link href={`/people/${profile.handle}`}>View profile</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/passport">Professional passport</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/settings">Settings</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={() => {
                  void signOut();
                  router.push("/");
                  router.refresh();
                }}
              >
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button size="sm" className="hidden md:inline-flex" asChild>
            <Link href="/auth/sign-in">Sign in</Link>
          </Button>
        )}
      </div>
    </header>
  );
}

export function MobileBottomNav() {
  const pathname = usePathname();
  const { profile } = useSession();
  const items = [
    { href: "/feed", label: "Home", icon: Home },
    { href: "/network", label: "Network", icon: Users },
    { href: "/feed?compose=1", label: "Post", icon: Plus },
    { href: "/jobs", label: "Jobs", icon: Briefcase },
    { href: profile ? `/people/${profile.handle}` : "/auth/sign-in", label: "Profile", icon: UserRound },
  ];
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-white pb-[env(safe-area-inset-bottom)] lg:hidden" aria-label="Mobile">
      <ul className="grid grid-cols-5">
        {items.map((item) => {
          const path = item.href.split("?")[0]!;
          const active = pathname.startsWith(path) && item.label !== "Post";
          return (
            <li key={item.label}>
              <Link
                href={item.href}
                className={cn(
                  "flex min-h-14 flex-col items-center justify-center gap-0.5 text-[11px] text-muted-foreground",
                  active && "text-primary",
                )}
              >
                <item.icon className="size-5" />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function DesktopSidebar({ children }: { children: React.ReactNode }) {
  return <aside className="hidden space-y-3 lg:block">{children}</aside>;
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen pb-16 lg:pb-0">
      <GlobalHeader />
      <main className="page-wrap px-3 py-4 md:px-6 md:py-6">{children}</main>
      <MobileBottomNav />
    </div>
  );
}
