"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bell, Briefcase, Building2, Hammer, Menu, MessageCircle, Search, UserRound } from "lucide-react";
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

export function Wordmark({ compact = false }: Readonly<{ compact?: boolean }>) {
  return (
    <Link href="/" className="flex shrink-0 items-center gap-2.5" aria-label="Tatva IDENTITI home">
      <span className="grid size-8 place-items-center bg-brand text-[11px] font-semibold tracking-[0.08em] text-white">
        TI
      </span>
      {!compact ? (
        <span className="leading-none">
          <span className="block text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">Tatva</span>
          <span className="mt-0.5 block text-[15px] font-semibold tracking-[0.14em] text-foreground">IDENTITI</span>
        </span>
      ) : null}
    </Link>
  );
}

function NavLink({
  href,
  label,
  active,
}: Readonly<{ href: string; label: string; active: boolean }>) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "whitespace-nowrap border-b-2 px-2 py-3 text-[13px] font-medium transition-colors",
        active ? "border-brand text-foreground" : "border-transparent text-muted-foreground hover:text-foreground",
      )}
    >
      {label}
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

  const primary = [
    { href: "/service-brands", label: "Service brands" },
    { href: "/product-brands", label: "Product brands" },
    { href: "/professionals", label: "Professionals" },
    { href: "/gig-workers", label: "Gig workers" },
    { href: "/projects", label: "Projects" },
    { href: "/journals", label: "Site journals" },
    { href: "/careers", label: "Careers" },
    { href: "/forums", label: "Brand forum" },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-white/92 pt-[env(safe-area-inset-top)] backdrop-blur-md">
      <div className="page-wrap flex h-14 items-center gap-3 px-4 sm:px-6">
        <Wordmark />
        <nav className="hidden min-w-0 flex-1 items-center xl:flex" aria-label="Primary">
          {primary.map((item) => {
            const onOwnProfile =
              Boolean(profile) &&
              pathname === profileHref &&
              (item.href === "/gig-workers" || item.href === "/professionals");
            const active = pathname.startsWith(item.href) && !onOwnProfile;
            return <NavLink key={item.href} href={item.href} label={item.label} active={active} />;
          })}
          {isPlatformAdmin ? <NavLink href="/admin" label="Admin" active={pathname.startsWith("/admin")} /> : null}
        </nav>

        <div className="ml-auto flex items-center gap-1">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="hidden lg:inline-flex xl:hidden">
                Explore
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuLabel>Network</DropdownMenuLabel>
              {primary.map((item) => (
                <DropdownMenuItem key={item.href} asChild>
                  <Link href={item.href}>{item.label}</Link>
                </DropdownMenuItem>
              ))}
              {isPlatformAdmin ? (
                <DropdownMenuItem asChild>
                  <Link href="/admin">Admin</Link>
                </DropdownMenuItem>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>

          <Link
            href="/search"
            className="grid size-9 place-items-center text-muted-foreground transition-colors hover:bg-surface-muted hover:text-foreground"
            aria-label={copy.search}
          >
            <Search className="size-4" />
          </Link>
          {userId ? (
            <Link
              href="/messages"
              className="hidden size-9 place-items-center text-muted-foreground transition-colors hover:bg-surface-muted hover:text-foreground md:grid"
              aria-label="Messages"
            >
              <MessageCircle className="size-4" />
            </Link>
          ) : null}
          <Link
            href="/notifications"
            className="relative grid size-9 place-items-center text-muted-foreground transition-colors hover:bg-surface-muted hover:text-foreground"
            aria-label={copy.notifications}
          >
            <Bell className="size-4" />
            {unreadNotificationCount > 0 ? (
              <span className="absolute right-1.5 top-1.5 size-1.5 rounded-full bg-brand" aria-hidden />
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
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuLabel>Opportunities</DropdownMenuLabel>
              <DropdownMenuItem asChild>
                <Link href="/careers">Careers</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/jobs">Jobs</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/gigs">Gigs</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/companies">Companies</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/services">Services</Link>
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
                <button
                  type="button"
                  aria-label="Account menu"
                  aria-current={profileActive ? "page" : undefined}
                  className="rounded-full"
                >
                  <InitialsAvatar
                    initials={initialsFromName(profile.fullName)}
                    hue={hueFromId(profile.id)}
                    size={28}
                    src={profile.avatarPath}
                  />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>{profile.fullName}</DropdownMenuLabel>
                <DropdownMenuItem asChild>
                  <Link href={profileHref}>View passport</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/passport">Edit passport</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/feed">Feed</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/messages">Messages</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/applications">{copy.applications}</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/saved">Saved</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/insights">Insights</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/network">Network</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/settings">Settings</Link>
                </DropdownMenuItem>
                {isPlatformAdmin ? (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/admin">Operations</Link>
                    </DropdownMenuItem>
                  </>
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
    {
      href: "/professionals",
      label: "People",
      icon: UserRound,
      match: (path: string) => path.startsWith("/professionals") || path.startsWith("/gig-workers") || path.startsWith("/people"),
    },
    {
      href: "/careers",
      label: "Careers",
      icon: Briefcase,
      match: (path: string) => path.startsWith("/careers") || path.startsWith("/jobs") || path.startsWith("/gigs"),
    },
    {
      href: "/projects",
      label: "Proof",
      icon: Hammer,
      match: (path: string) => path.startsWith("/projects") || path.startsWith("/journals"),
    },
    { href: "/messages", label: "Inbox", icon: MessageCircle, match: (path: string) => path.startsWith("/messages") },
  ];

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden"
      aria-label="Mobile"
    >
      <ul className="grid grid-cols-6">
        {items.map((item) => {
          const active = item.match(pathname);
          return (
            <li key={item.label}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-14 flex-col items-center justify-center gap-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground",
                  active && "text-foreground",
                )}
              >
                <item.icon className={cn("size-5", active && "text-brand")} aria-hidden />
                {item.label}
              </Link>
            </li>
          );
        })}
        <li>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex min-h-14 w-full flex-col items-center justify-center gap-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground"
                aria-label="More navigation"
              >
                <Menu className="size-5" aria-hidden />
                More
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="top" align="end" className="mb-2 w-52">
              <DropdownMenuLabel>Explore</DropdownMenuLabel>
              <DropdownMenuItem asChild>
                <Link href="/service-brands">Service brands</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/product-brands">Product brands</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/companies">Companies</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/journals">Site journals</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/forums">Brand forum</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/feed">Feed</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/search">Search</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/notifications">Notifications</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/settings">Settings</Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </li>
      </ul>
    </nav>
  );
}

export function DesktopSidebar({ children }: Readonly<{ children: React.ReactNode }>) {
  return <aside className="hidden space-y-3 lg:block">{children}</aside>;
}

export function AppShell({ children, bleed = false }: Readonly<{ children: React.ReactNode; bleed?: boolean }>) {
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
