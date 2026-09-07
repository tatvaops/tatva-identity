"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Building2, Briefcase, Hammer, Search, UserRound } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { searchPlaceholder } from "@/lib/config";
import { cn } from "@/lib/utils";
import type { SearchDiscovery } from "@/lib/data/discovery";

const STORAGE_KEY = "tatva-recent-searches";
const MAX_RECENT = 6;

const CATEGORIES = [
  { href: "/search?type=people", label: "People", icon: UserRound },
  { href: "/companies", label: "Companies", icon: Building2 },
  { href: "/service-brands", label: "Service brands", icon: Building2 },
  { href: "/product-brands", label: "Product brands", icon: Briefcase },
  { href: "/projects", label: "Projects", icon: Hammer },
  { href: "/jobs", label: "Jobs", icon: Briefcase },
  { href: "/gigs", label: "Gigs", icon: Hammer },
  { href: "/services", label: "Services", icon: Search },
] as const;

function readRecent(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string").slice(0, MAX_RECENT) : [];
  } catch {
    return [];
  }
}

function writeRecent(query: string) {
  const next = [query, ...readRecent().filter((item) => item.toLowerCase() !== query.toLowerCase())].slice(0, MAX_RECENT);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

export function SearchBox({
  initialQuery = "",
  size = "header",
  entity,
}: {
  initialQuery?: string;
  size?: "header" | "page";
  entity?: string;
}) {
  const router = useRouter();
  const [q, setQ] = useState(initialQuery);
  const [open, setOpen] = useState(false);
  const [recent, setRecent] = useState<string[]>([]);
  const [discovery, setDiscovery] = useState<SearchDiscovery | null>(null);
  const listId = useId();
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onPointer(event: MouseEvent) {
      if (!wrapRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  function go(value: string) {
    const query = value.trim();
    if (query) writeRecent(query);
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (entity && entity !== "all") params.set("type", entity);
    const qs = params.toString();
    router.push(qs ? `/search?${qs}` : "/search");
    setOpen(false);
  }

  function openPanel() {
    setRecent(readRecent());
    setOpen(true);
    if (!discovery) {
      void fetch("/api/search/discover")
        .then((response) => (response.ok ? response.json() : null))
        .then((payload: SearchDiscovery | null) => {
          if (payload) setDiscovery(payload);
        })
        .catch(() => undefined);
    }
  }

  const groups: { key: keyof SearchDiscovery; label: string }[] = [
    { key: "people", label: "People" },
    { key: "serviceBrands", label: "Service brands" },
    { key: "projects", label: "Projects" },
    { key: "jobs", label: "Jobs" },
    { key: "gigs", label: "Gigs" },
  ];

  return (
    <div ref={wrapRef} className="relative w-full">
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          go(q);
        }}
      >
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={openPanel}
          placeholder={searchPlaceholder}
          aria-label="Search people, companies, projects, jobs and skills"
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls={listId}
          className={cn("bg-surface-muted pl-9", size === "page" ? "h-11" : "h-9")}
        />
      </form>
      {open ? (
        <div
          id={listId}
          className="absolute z-50 mt-1.5 w-full min-w-[min(100%,28rem)] overflow-hidden rounded-md border border-border bg-white shadow-md"
        >
          <div className="grid grid-cols-2 gap-1 border-b border-border p-2 sm:grid-cols-4">
            {CATEGORIES.map((category) => (
              <Link
                key={category.href}
                href={category.href}
                className="flex items-center gap-2 px-2 py-1.5 text-xs font-medium text-text-secondary hover:bg-surface-muted hover:text-foreground"
                onClick={() => setOpen(false)}
              >
                <category.icon className="size-3.5 text-muted-foreground" aria-hidden />
                {category.label}
              </Link>
            ))}
          </div>
          {recent.length > 0 && !q.trim() ? (
            <div className="border-b border-border py-1">
              <p className="px-3 py-1.5 type-micro">Recent searches</p>
              {recent.map((item) => (
                <button
                  key={item}
                  type="button"
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted"
                  onClick={() => {
                    setQ(item);
                    go(item);
                  }}
                >
                  <Search className="size-3.5 text-muted-foreground" aria-hidden />
                  {item}
                </button>
              ))}
            </div>
          ) : null}
          {discovery ? (
            <div className="max-h-72 overflow-y-auto p-2">
              {groups.map((group) => {
                const items = discovery[group.key];
                if (!items.length) return null;
                return (
                  <div key={group.key} className="mb-2 last:mb-0">
                    <p className="px-2 py-1 type-micro">{group.label}</p>
                    {items.slice(0, 3).map((item) => (
                      <Link
                        key={item.id}
                        href={item.href}
                        className="block px-2 py-1.5 hover:bg-surface-muted"
                        onClick={() => setOpen(false)}
                      >
                        <p className="truncate text-sm font-medium">{item.title}</p>
                        {item.subtitle ? <p className="truncate text-xs text-muted-foreground">{item.subtitle}</p> : null}
                      </Link>
                    ))}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="px-3 py-3 text-xs text-muted-foreground">Looking across the live network…</p>
          )}
        </div>
      ) : null}
    </div>
  );
}
