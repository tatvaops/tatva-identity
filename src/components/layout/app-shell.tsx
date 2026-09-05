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
import { SearchBox } from "@/features/search/search-box";
import { useSession } from "@/components/providers/session-provider";
import { useDictionary } from "@/components/providers/locale-provider";
import { SkipLink } from "@/components/layout/page-nav";
import { hueFromId, initialsFromName } from "@/lib/domain/passport-strength";
import { signOut } from "@/lib/actions/network";
import { cn } from "@/lib/utils";

export function Wordmark({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-2">
      <span className="grid size-8 place-items-center rounded-lg bg-[#0b1f3a] text-[11px] font-bold text-white">TI</span>
      {!compact && (
        <span className="leading-tight">
          <span className="block text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Tatva</span>
          <span className="block text-[15px] font-semibold tracking-tight">IDENTITI</span>
        </span>
      )}
    </Link>
  );
}

export function GlobalHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { profile, userId, isPlatformAdmin } = useSession();
  const copy = useDictionary();
  const profileHref = profile ? `/people/${profile.handle}` : "/auth/sign-in";
  const profileActive = profile ? pathname === `/people/${profile.handle}` : pathname.startsWith("/auth");
  const items = [
    { href: "/service-brands", label: "Service brand" },
    { href: "/product-brands", label: "Product brand" },
    { href: "/professionals", label: "Professional" },
    { href: "/gig-workers", label: "Gig worker" },
    { href: "/forums", label: "Brand forum" },
    ...(isPlatformAdmin ? [{ href: "/admin", label: "Admin control" }] : []),
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-white/95 pt-[env(safe-area-inset-top)] backdrop-blur">
      <div className="page-wrap flex h-14 items-center gap-3 px-4">
        <Wordmark />
        <div className="hidden min-w-0 flex-1 md:block">
          <div className="mx-auto max-w-2xl">
            <SearchBox />
          </div>
        </div>
        <nav className="ml-auto hidden items-stretch lg:flex" aria-label="Primary">
          {items.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-w-[88px] flex-col items-center justify-center px-1 text-[11px] text-muted-foreground hover:text-foreground",
                  active && "text-foreground",
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
              "flex min-w-[64px] flex-col items-center justify-center px-1 text-[11px] text-muted-foreground hover:text-foreground",
              profileActive && "text-foreground",
            )}
          >
            {copy.profile}
          </Link>
        </nav>
        <Link href="/search" className="ml-auto md:hidden" aria-label={copy.search}>
          <Search className="size-5" />
        </Link>
        <Link href="/notifications" className="md:hidden" aria-label={copy.notifications}>
          <Bell className="size-5" />
        </Link>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="hidden md:inline-flex">
              Business
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Business</DropdownMenuLabel>
            <DropdownMenuItem asChild>
              <Link href="/companies">Browse companies</Link>
            </DropdownMenuItem>
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
                <Link href="/insights">Insights</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/applications">{copy.applications}</Link>
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
  const copy = useDictionary();
  const profileHref = profile ? `/people/${profile.handle}` : "/auth/sign-in";
  const items = [
    { href: "/service-brands", label: "Services", icon: Building2 },
    { href: "/product-brands", label: "Products", icon: Briefcase },
    { href: "/professionals", label: "Executive", icon: UserRound },
    { href: "/gig-workers", label: "Gig worker", icon: Hammer },
    { href: "/forums", label: "Forum", icon: MessageCircle },
  ];
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-white pb-[env(safe-area-inset-bottom)] lg:hidden"
      aria-label="Mobile"
    >
      <ul className="grid grid-cols-5">
        {items.map((item) => {
          const path = item.href.split("?")[0]!;
          const active =
            item.label === copy.profile
              ? pathname === path
              : pathname.startsWith(path);
          return (
            <li key={item.label}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-14 flex-col items-center justify-center gap-0.5 text-[11px] text-muted-foreground",
                  active && "text-foreground",
                )}
              >
                <item.icon className="size-5" aria-hidden />
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
  const copy = useDictionary();
  return (
    <div className="min-h-screen pb-[calc(4rem+env(safe-area-inset-bottom))] lg:pb-0">
      <SkipLink label={copy.skip} />
      <GlobalHeader />
      <main id="main-content" className="page-wrap px-3 py-4 md:px-6 md:py-6">
        {children}
      </main>
      <MobileBottomNav />
    </div>
  );
}
