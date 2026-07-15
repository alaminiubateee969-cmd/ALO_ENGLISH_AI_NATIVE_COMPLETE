import Link from "next/link";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";
import { Card, EmptyState, PortalShell, StatTile, STUDENT_NAV } from "@/components/portal/PortalShell";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function MyCertificatesPage() {
  const session = await getServerSession();
  if (!session?.user) return null;

  const student = await prisma.student.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });

  const certificates = student
    ? await prisma.certificate.findMany({
        where: { studentId: student.id },
        orderBy: { issuedAt: "desc" },
        include: {
          result: {
            select: {
              examType: { select: { name: true } },
            },
          },
        },
      })
    : [];

  return (
    <PortalShell
      role="student"
      roleLabel="Student"
      navItems={STUDENT_NAV}
      activePath="/student/certificates"
      title="My certificates"
      subtitle="All certificates you've earned"
      userName={session.user.name}
    >
      <div className="grid gap-4 sm:grid-cols-3">
        <StatTile label="Total certificates" value={certificates.length} accent="green" />
        <StatTile label="Active" value={certificates.filter((c) => c.status === "issued").length} accent="blue" />
        <StatTile label="Revoked" value={certificates.filter((c) => c.status === "revoked").length} accent="orange" />
      </div>

      <div className="mt-6">
        {certificates.length === 0 ? (
          <EmptyState message="No certificates yet. Complete a mock test with a passing score to earn your first certificate." />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {certificates.map((c) => (
              <Card key={c.id}>
                <div className="flex items-center justify-between">
                  <span className="text-3xl">🏆</span>
                  <span className={`text-xs font-medium ${c.status === "issued" ? "text-emerald-600" : "text-red-600"}`}>
                    {c.status}
                  </span>
                </div>
                <h3 className="mt-3 font-semibold text-alo-navy">{c.examName}</h3>
                <p className="mt-1 text-xs text-alo-faint">
                  Issued {formatDate(c.issuedAt)} · {c.certificateCode}
                </p>
                <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-xs text-alo-faint">Score</p>
                    <p className="font-semibold text-alo-navy">{c.overallScore}</p>
                  </div>
                  <div>
                    <p className="text-xs text-alo-faint">Band</p>
                    <p className="font-semibold text-alo-navy">{c.bandEstimate ?? "—"}</p>
                  </div>
                </div>
                <Link
                  href={`/verify/${c.verificationHash}`}
                  className="mt-4 block w-full rounded-lg bg-alo-soft-blue px-4 py-2 text-center text-xs font-semibold text-alo-blue transition hover:bg-blue-100"
                >
                  View / verify certificate
                </Link>
              </Card>
            ))}
          </div>
        )}
      </div>
    </PortalShell>
  );
}
