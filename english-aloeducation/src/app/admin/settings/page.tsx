import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";
import { Card, EmptyState, PortalShell, ADMIN_NAV } from "@/components/portal/PortalShell";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

async function getSettings() {
  const settings = await prisma.setting.findMany({
    orderBy: { key: "asc" },
  });
  return settings;
}

export default async function AdminSettingsPage() {
  const session = await getServerSession();
  if (!session?.user) return null;

  const settings = await getSettings();

  return (
    <PortalShell
      role="admin"
      roleLabel="Admin"
      navItems={ADMIN_NAV}
      activePath="/admin/settings"
      title="System settings"
      subtitle="Platform-wide configuration"
      userName={session.user.name}
    >
      <Card title="Application settings">
        {settings.length === 0 ? (
          <EmptyState message="No settings configured yet. Run the seed script to populate defaults." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-alo-soft-blue text-left text-xs uppercase text-alo-faint">
                  <th className="py-2 pr-4">Key</th>
                  <th className="py-2 pr-4">Value</th>
                  <th className="py-2 pr-4">Secret</th>
                  <th className="py-2 pr-4">Updated</th>
                </tr>
              </thead>
              <tbody>
                {settings.map((s) => (
                  <tr key={s.id} className="border-b border-alo-soft-blue">
                    <td className="py-2 pr-4 font-mono text-xs text-alo-navy">{s.key}</td>
                    <td className="py-2 pr-4 font-mono text-xs">
                      {s.isSecret ? "••••••••••••" : s.value}
                    </td>
                    <td className="py-2 pr-4">{s.isSecret ? "Yes" : "No"}</td>
                    <td className="py-2 pr-4 text-alo-muted">{formatDate(s.updatedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card title="Environment" className="mt-6">
        <p className="text-sm text-alo-muted">
          Environment variables (DATABASE_URL, NEXTAUTH_SECRET, SMTP_* etc.) are
          configured via <code className="rounded bg-alo-soft-gray px-1.5 py-0.5 text-xs">.env</code> on
          the server and are not editable from this UI.
        </p>
      </Card>
    </PortalShell>
  );
}
