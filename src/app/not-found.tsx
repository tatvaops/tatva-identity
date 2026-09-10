import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 px-4 text-center">
      <p className="type-micro">IDENTITI</p>
      <h1 className="type-page">Couldn&apos;t find that page</h1>
      <p className="max-w-md text-sm text-muted-foreground">The address may have changed, or the record is no longer public.</p>
      <div className="mt-2 flex gap-2">
        <Button asChild>
          <Link href="/search">Search the network</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/">Discover</Link>
        </Button>
      </div>
    </div>
  );
}
