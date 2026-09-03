"use client";

import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { searchPlaceholder } from "@/lib/config";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "tatva-recent-searches";
const MAX_RECENT = 6;

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
  const listId = useId();
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onPointer(event: MouseEvent) {
      if (!wrapRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onPointer);
    return () => document.removeEventListener("mousedown", onPointer);
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
          onFocus={() => {
            setRecent(readRecent());
            setOpen(true);
          }}
          placeholder={searchPlaceholder}
          aria-label="Search people, companies, projects, jobs and skills"
          aria-autocomplete="list"
          aria-expanded={open && recent.length > 0 && !q}
          aria-controls={listId}
          className={cn("bg-secondary pl-9", size === "page" ? "h-12" : "h-9")}
        />
      </form>
      {open && recent.length > 0 && !q.trim() && (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-50 mt-1 w-full overflow-hidden rounded-xl border border-border bg-white py-1 shadow-lg"
        >
          <li className="px-3 py-1.5 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
            Recent searches
          </li>
          {recent.map((item) => (
            <li key={item} role="option" aria-selected={false}>
              <button
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
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
