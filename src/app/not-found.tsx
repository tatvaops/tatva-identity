import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 px-4 text-center">
      <h1 className="text-xl font-semibold">We could not find that page</h1>
      <p className="text-sm text-muted-foreground">Try search, or open the work network feed.</p>
      <Button asChild>
        <Link href="/feed">Go to feed</Link>
      </Button>
    </div>
  );
}
