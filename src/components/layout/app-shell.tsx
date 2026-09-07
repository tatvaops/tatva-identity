"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bell, Briefcase, Building2, Hammer, MessageCircle, Search, UserRound } from "lucide-react";
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
import { useSession } from "@/components/providers/session-provider";
import { useDictionary } from "@/components/providers/locale-provider";
import { SkipLink } from "@/components/layout/page-nav";
import { hueFromId, initialsFromName } from "@/lib/domain/passport-strength";
import { signOut } from "@/lib/actions/network";
import { cn } from "@/lib/utils";

export function Wordmark({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-2.5">
      <span className="grid size-8 place-items-center bg-brand text-[11px] font-semibold tracking-[0.08em] text-white">
        TI
      </span>
      {!compact && (
        <span className="leading-none">
          <span className="block text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">Tatva</span>
          <span className="mt-0.5 block text-[15px] font-semibold tracking-[0.14em] text-foreground">IDENTITI</span>
        </span>
      )}
    </Link>
  );
}

export function GlobalHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { profile, userId, isPlatformAdmin, unreadNotificationCount } = useSession();
  const copy = useDictionary();
  const profileHref = profile
    ? profile.occupationMode === "blue_collar" || profile.occupationMode === "contractor"
      ? `/gig-workers/${profile.handle}`
      : `/professionals/${profile.handle}`
    : userId
      ? "/onboarding"
      : "/auth/sign-in";
  const profileActive = Boolean(
    profile &&
      (pathname === profileHref ||
        pathname === `/people/${profile.handle}` ||
        pathname === `/passport/${profile.handle}`),
  );
  const items = [
    { href: "/service-brands", label: "Service brands" },
    { href: "/product-brands", label: "Product brands" },
    { href: "/professionals", label: "Professionals" },
    { href: "/gig-workers", label: "Gig workers" },
    { href: "/projects", label: "Projects" },
    { href: "/forums", label: "Vantage" },
    ...(isPlatformAdmin ? [{ href: "/admin", label: "Admin" }] : []),
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-white/92 pt-[env(safe-area-inset-top)] backdrop-blur-md">
      <div className="page-wrap flex h-14 items-center gap-4 px-4 sm:px-6">
        <Wordmark />
        <nav className="hidden min-w-0 flex-1 items-center lg:flex" aria-label="Primary">
          {items.map((item) => {
            const onOwnProfile =
              Boolean(profile) &&
              pathname === profileHref &&
              (item.href === "/gig-workers" || item.href === "/professionals");
            const active = pathname.startsWith(item.href) && !onOwnProfile;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "border-b-2 px-2.5 py-3 text-[13px] font-medium transition-colors",
                  active
                    ? "border-brand text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground",
                )}
              >
                {item.label}
              </Link>
            );
          })}
          <Link
            href={profileHref}
            aria-current={profileActive ? "page" : undefined}
            className={cn(
              "border-b-2 px-2.5 py-3 text-[13px] font-medium transition-colors",
              profileActive ? "border-brand text-foreground" : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {copy.profile}
          </Link>
        </nav>
        <div className="flex items-center gap-1.5">
          <Link
            href="/search"
            className="grid size-9 place-items-center text-muted-foreground hover:bg-surface-muted hover:text-foreground"
            aria-label={copy.search}
          >
            <Search className="size-4" />
          </Link>
          {userId ? (
            <Link
              href="/messages"
              className="hidden size-9 place-items-center text-muted-foreground hover:bg-surface-muted hover:text-foreground md:grid"
              aria-label="Messages"
            >
              <MessageCircle className="size-4" />
            </Link>
          ) : null}
          <Link
            href="/notifications"
            className="relative grid size-9 place-items-center text-muted-foreground hover:bg-surface-muted hover:text-foreground"
            aria-label={copy.notifications}
          >
            <Bell className="size-4" />
            {unreadNotificationCount > 0 ? (
              <span className="absolute right-1.5 top-1.5 size-1.5 rounded-full bg-brand" />
            ) : null}
            {unreadNotificationCount > 0 ? (
              <span className="sr-only">{unreadNotificationCount} unread</span>
            ) : null}
          </Link>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="hidden md:inline-flex">
                Work
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Opportunities</DropdownMenuLabel>
              <DropdownMenuItem asChild>
                <Link href="/jobs">Jobs</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/gigs">Gigs</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/services">Services</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/companies">Companies</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/companies/new">Create organisation</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/jobs/create">Post a job</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/gigs/create">Post a gig</Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          {userId && profile ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button aria-label="Account menu" className="rounded-full">
                  <InitialsAvatar initials={initialsFromName(profile.fullName)} hue={hueFromId(profile.id)} size={28} src={profile.avatarPath} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>{profile.fullName}</DropdownMenuLabel>
                <DropdownMenuItem asChild>
                  <Link href={profileHref}>View profile</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/notifications">Notifications</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/network">Network</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/passport">Professional passport</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/insights">Insights</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/applications">{copy.applications}</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/saved">Saved</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/passport/documents">{copy.documents}</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/graph">Work graph</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/settings">Settings</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/feed">Feed</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/jobs">Jobs</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/messages">Messages</Link>
                </DropdownMenuItem>
                {isPlatformAdmin ? (
                  <DropdownMenuItem asChild>
                    <Link href="/admin">Operations</Link>
                  </DropdownMenuItem>
                ) : null}
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
            <Button size="sm" asChild>
              <Link href="/auth/sign-in">Sign in</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}

export function MobileBottomNav() {
  const pathname = usePathname();
  const items = [
    { href: "/", label: "Discover", icon: Building2, match: (path: string) => path === "/" },
    { href: "/professionals", label: "People", icon: UserRound, match: (path: string) => path.startsWith("/professionals") || path.startsWith("/gig-workers") || path.startsWith("/people") },
    { href: "/jobs", label: "Work", icon: Briefcase, match: (path: string) => path.startsWith("/jobs") || path.startsWith("/gigs") },
    { href: "/projects", label: "Proof", icon: Hammer, match: (path: string) => path.startsWith("/projects") },
    { href: "/messages", label: "Inbox", icon: MessageCircle, match: (path: string) => path.startsWith("/messages") },
  ];
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-white pb-[env(safe-area-inset-bottom)] lg:hidden"
      aria-label="Mobile"
    >
      <ul className="grid grid-cols-5">
        {items.map((item) => {
          const active = item.match(pathname);
          return (
            <li key={item.label}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-14 flex-col items-center justify-center gap-0.5 text-[10px] font-medium tracking-wide uppercase text-muted-foreground",
                  active && "text-foreground",
                )}
              >
                <item.icon className={cn("size-5", active && "text-brand")} aria-hidden />
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

export function AppShell({ children, bleed = false }: { children: React.ReactNode; bleed?: boolean }) {
  const copy = useDictionary();
  return (
    <div className="min-h-screen pb-[calc(4rem+env(safe-area-inset-bottom))] lg:pb-0">
      <SkipLink label={copy.skip} />
      <GlobalHeader />
      <main id="main-content" className={bleed ? "w-full" : "page-wrap px-3 py-5 md:px-6 md:py-7"}>
        {children}
      </main>
      <MobileBottomNav />
    </div>
  );
}
