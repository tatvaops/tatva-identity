import Link from "next/link";

export function SkipLink({ label }: { label: string }) {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-primary focus:px-3 focus:py-2 focus:text-sm focus:text-white"
    >
      {label}
    </a>
  );
}

export function PageNav({
  path,
  page,
  hasMore,
  params,
}: {
  path: string;
  page: number;
  hasMore: boolean;
  params?: Record<string, string | undefined>;
}) {
  if (page <= 1 && !hasMore) return null;
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params ?? {})) {
    if (value) query.set(key, value);
  }
  const hrefFor = (nextPage: number) => {
    query.set("page", String(nextPage));
    return `${path}?${query.toString()}`;
  };
  return (
    <nav className="mt-4 flex items-center justify-between text-sm" aria-label="Pagination">
      {page > 1 ? (
        <Link className="text-primary hover:underline" href={hrefFor(page - 1)}>
          Previous
        </Link>
      ) : (
        <span />
      )}
      <span className="text-muted-foreground">Page {page}</span>
      {hasMore ? (
        <Link className="text-primary hover:underline" href={hrefFor(page + 1)}>
          Next
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}
