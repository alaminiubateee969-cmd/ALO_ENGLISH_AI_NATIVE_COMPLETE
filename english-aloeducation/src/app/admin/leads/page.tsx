import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";
import { Card, EmptyState, PortalShell, StatTile, ADMIN_NAV } from "@/components/portal/PortalShell";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

const STATUS_FLOW = ["new", "contacted", "qualified", "enrolled", "lost"];

async function getLeads() {
  const [leads, statusCounts] = await Promise.all([
    prisma.lead.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
      include: { owner: { select: { name: true } } },
    }),
    prisma.lead.groupBy({
      by: ["status"],
      _count: { status: true },
    }),
  ]);
  return { leads, statusCounts };
}

export default async function AdminLeadsPage() {
  const session = await getServerSession();
  if (!session?.user) return null;

  const { leads, statusCounts } = await getLeads();
  const newLeads = statusCounts.find((s) => s.status === "new")?._count.status ?? 0;
  const qualified = statusCounts.find((s) => s.status === "qualified")?._count.status ?? 0;
  const enrolled = statusCounts.find((s) => s.status === "enrolled")?._count.status ?? 0;

  return (
    <PortalShell
      role="admin"
      roleLabel="Admin"
      navItems={ADMIN_NAV}
      activePath="/admin/leads"
      title="Leads CRM"
      subtitle="Marketing leads captured from website & ambassadors"
      userName={session.user.name}
    >
      <div className="grid gap-4 sm:grid-cols-4">
        <StatTile label="Total leads" value={leads.length} accent="blue" />
        <StatTile label="New" value={newLeads} accent="orange" />
        <StatTile label="Qualified" value={qualified} accent="navy" />
        <StatTile label="Enrolled" value={enrolled} accent="green" />
      </div>

      <Card title="Lead pipeline" className="mt-6">
        {leads.length === 0 ? (
          <EmptyState message="No leads captured yet. Leads submitted through the contact form will appear here." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-alo-soft-blue text-left text-xs uppercase text-alo-faint">
                  <th className="py-2 pr-4">Name</th>
                  <th className="py-2 pr-4">Contact</th>
                  <th className="py-2 pr-4">Interest</th>
                  <th className="py-2 pr-4">Country</th>
                  <th className="py-2 pr-4">Source</th>
                  <th className="py-2 pr-4">Owner</th>
                  <th className="py-2 pr-4">Created</th>
                  <th className="py-2 pr-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((l) => (
                  <tr key={l.id} className="border-b border-alo-soft-blue">
                    <td className="py-2 pr-4 font-medium text-alo-navy">{l.name}</td>
                    <td className="py-2 pr-4 text-xs">
                      <p>{l.email ?? "—"}</p>
                      <p className="text-alo-faint">{l.phone ?? ""}</p>
                    </td>
                    <td className="py-2 pr-4">{l.interest ?? "—"}</td>
                    <td className="py-2 pr-4">{l.targetCountry ?? "—"}</td>
                    <td className="py-2 pr-4 text-xs">{l.source}</td>
                    <td className="py-2 pr-4 text-xs">{l.owner?.name ?? "Unassigned"}</td>
                    <td className="py-2 pr-4 text-alo-muted">{formatDate(l.createdAt)}</td>
                    <td className="py-2 pr-4">
                      <StatusPill status={l.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card title="Pipeline by status" className="mt-6">
        <div className="flex flex-wrap gap-3">
          {STATUS_FLOW.map((s) => {
            const count = statusCounts.find((x) => x.status === s)?._count.status ?? 0;
            return (
              <div key={s} className="flex-1 rounded-xl border border-alo-card bg-white p-4 text-center">
                <p className="text-xs uppercase text-alo-faint">{s}</p>
                <p className="mt-1 text-2xl font-bold text-alo-navy">{count}</p>
              </div>
            );
          })}
        </div>
      </Card>
    </PortalShell>
  );
}

function StatusPill({ status }: { status: string }) {
  const colors: Record<string, string> = {
    new: "bg-blue-50 text-blue-700",
    contacted: "bg-amber-50 text-amber-700",
    qualified: "bg-purple-50 text-purple-700",
    enrolled: "bg-emerald-50 text-emerald-700",
    lost: "bg-red-50 text-red-700",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${colors[status] ?? "bg-gray-100 text-gray-700"}`}>
      {status}
    </span>
  );
}
