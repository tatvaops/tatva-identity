import Link from "next/link";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/states/empty-state";
import type { PassportStrength } from "@/lib/domain/passport-strength";
import type { Organisation } from "@/lib/types/identity";

export function InsightsView({
  viewCount,
  connectionCount,
  followerCount,
  applicationCount,
  receivedCount,
  passport,
  organisations,
}: {
  viewCount: number;
  connectionCount: number;
  followerCount: number;
  applicationCount: number;
  receivedCount: number;
  passport: PassportStrength;
  organisations: Organisation[];
}) {
  const metrics = [
    viewCount > 0 ? { label: "Profile views", value: viewCount } : null,
    connectionCount > 0 ? { label: "Connections", value: connectionCount } : null,
    followerCount > 0 ? { label: "Followers", value: followerCount } : null,
    applicationCount > 0 ? { label: "Applications you sent", value: applicationCount } : null,
    receivedCount > 0 ? { label: "Applications received", value: receivedCount } : null,
  ].filter((row): row is { label: string; value: number } => row !== null);
  const missing = passport.components.filter((item) => !item.complete);

  return (
    <div className="space-y-4">
      {metrics.length === 0 ? (
        <EmptyState title="No activity yet" body="Views, connections and applications appear here only after they happen." />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {metrics.map((metric) => (
            <Card key={metric.label} className="p-4">
              <p className="text-2xl font-semibold tabular-nums">{metric.value}</p>
              <p className="mt-1 text-sm text-muted-foreground">{metric.label}</p>
            </Card>
          ))}
        </div>
      )}
      <Card className="p-5">
        <p className="text-sm font-semibold">Passport completeness</p>
        <p className="mt-1 text-2xl font-semibold tabular-nums">{passport.completeness}%</p>
        <ul className="mt-3 space-y-1 text-sm">
          {passport.components.map((item) => (
            <li key={item.id} className="flex justify-between gap-3">
              <span>{item.label}</span>
              <span className="text-muted-foreground">{item.detail}</span>
            </li>
          ))}
        </ul>
        {missing.length > 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">
            Still missing: {missing.map((item) => item.label.toLowerCase()).join(", ")}.{" "}
            <Link className="text-primary hover:underline" href="/passport">
              Open passport
            </Link>
          </p>
        ) : null}
      </Card>
      {organisations.length > 0 ? (
        <Card className="p-5 text-sm">
          <p className="font-semibold">Your organisations</p>
          <ul className="mt-2 space-y-1">
            {organisations.map((org) => (
              <li key={org.id}>
                <Link className="text-primary hover:underline" href={`/companies/${org.slug}`}>
                  {org.name}
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}
    </div>
  );
}
