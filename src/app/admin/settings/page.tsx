import type { Metadata } from "next";
import Link from "next/link";
import { AdminHeader, AdminTable, adminDate } from "@/features/admin/admin-chrome";
import { AdminActionButton } from "@/features/admin/admin-action";
import { AdminGrantForm, AdminMintCredentialForm } from "@/features/admin/admin-forms";
import { adminRevokeCredential, adminRevokeOperator, adminSetSeedEnabled } from "@/lib/admin/actions";
import { listAdminCredentials, listAdminOperators, loadAdminStats } from "@/lib/admin/data";
import { Card } from "@/components/ui/card";
import { bootstrapAdminHandles, bootstrapAdminUserIds } from "@/lib/admin/bootstrap";

export const metadata: Metadata = { title: "Settings" };

export default async function AdminSettingsPage() {
  const [stats, operators, credentials] = await Promise.all([loadAdminStats(), listAdminOperators(), listAdminCredentials()]);
  const bootstrapHandles = bootstrapAdminHandles();
  const bootstrapIds = bootstrapAdminUserIds();
  return (
    <div>
      <AdminHeader
        title="Settings"
        body="Demonstration data visibility and who can open this console. The first operator can also be listed in PLATFORM_ADMIN_HANDLES."
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <p className="text-sm font-semibold">Demonstration data</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Seed rows are labelled demonstration data. Turning this off hides them from public directories without deleting them.
          </p>
          <p className="mt-3 text-sm">Currently {stats?.seedEnabled ? "visible" : "hidden"}.</p>
          <div className="mt-3">
            <AdminActionButton
              label={stats?.seedEnabled ? "Hide demonstration data" : "Show demonstration data"}
              action={adminSetSeedEnabled.bind(null, !stats?.seedEnabled)}
            />
          </div>
        </Card>
        <Card className="p-5">
          <p className="text-sm font-semibold">Bootstrap list</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Handles and user IDs in server env can enter this console on first visit. This is not a public backdoor.
          </p>
          <p className="mt-3 text-sm">
            Handles: {bootstrapHandles.length ? bootstrapHandles.map((h) => `@${h}`).join(", ") : "none set"}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            User IDs listed: {bootstrapIds.length}
          </p>
        </Card>
      </div>
      <Card className="mt-4 p-5">
        <p className="text-sm font-semibold">Grant an operator</p>
        <p className="mt-1 mb-3 text-sm text-muted-foreground">
          Enter a public profile handle. They will see Operations in the account menu after refresh.
        </p>
        <AdminGrantForm />
      </Card>
      <h2 className="mb-3 mt-8 text-lg font-semibold">Operators</h2>
      <AdminTable headers={["Person", "Granted by", "Since", "Actions"]}>
        {operators.map((row) => (
          <tr key={row.profile_id}>
            <td className="px-3 py-3">
              {row.person ? (
                <Link href={`/admin/people/${row.profile_id}`} className="font-medium hover:text-primary">
                  {row.person.full_name}
                </Link>
              ) : (
                row.profile_id
              )}
              <p className="text-xs text-muted-foreground">@{row.person?.handle}</p>
            </td>
            <td className="px-3 py-3 text-muted-foreground">{row.grantor?.full_name ?? "—"}</td>
            <td className="px-3 py-3 text-muted-foreground">{adminDate(row.created_at)}</td>
            <td className="px-3 py-3">
              <AdminActionButton
                label="Revoke"
                variant="destructive"
                confirm="Revoke operations access for this person?"
                action={adminRevokeOperator.bind(null, row.profile_id)}
              />
            </td>
          </tr>
        ))}
      </AdminTable>
      <Card className="mt-8 p-5">
        <p className="text-sm font-semibold">Vantage API credentials</p>
        <p className="mt-1 mb-3 text-sm text-muted-foreground">
          Only a hash is stored. The plaintext token is shown once. Use it as the Bearer token on the discussion-created webhook.
        </p>
        <AdminMintCredentialForm />
      </Card>
      <h2 className="mb-3 mt-8 text-lg font-semibold">Minted credentials</h2>
      <AdminTable headers={["Name", "Scopes", "Last used", "Actions"]}>
        {credentials.map((row) => (
          <tr key={row.id}>
            <td className="px-3 py-3">
              {row.name}
              {row.revoked_at ? <p className="text-xs text-muted-foreground">Revoked {adminDate(row.revoked_at)}</p> : null}
            </td>
            <td className="px-3 py-3 text-muted-foreground">{(row.scopes ?? []).join(", ")}</td>
            <td className="px-3 py-3 text-muted-foreground">{row.last_used_at ? adminDate(row.last_used_at) : "—"}</td>
            <td className="px-3 py-3">
              {row.revoked_at ? null : (
                <AdminActionButton
                  label="Revoke"
                  variant="destructive"
                  confirm="Revoke this credential?"
                  action={adminRevokeCredential.bind(null, row.id)}
                />
              )}
            </td>
          </tr>
        ))}
      </AdminTable>
    </div>
  );
}
