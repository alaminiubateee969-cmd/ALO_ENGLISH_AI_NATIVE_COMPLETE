import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";
import { Card, EmptyState, PortalShell, STUDENT_NAV } from "@/components/portal/PortalShell";
import { formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function MyMessagesPage() {
  const session = await getServerSession();
  if (!session?.user) return null;

  const student = await prisma.student.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });

  const messages = student
    ? await prisma.message.findMany({
        where: { recipientId: student.id },
        orderBy: { createdAt: "desc" },
        take: 100,
      })
    : [];

  const unread = messages.filter((m) => !m.isRead).length;

  return (
    <PortalShell
      role="student"
      roleLabel="Student"
      navItems={STUDENT_NAV}
      activePath="/student/messages"
      title="Messages"
      subtitle={`${unread} unread · ${messages.length} total`}
      userName={session.user.name}
    >
      <Card>
        {messages.length === 0 ? (
          <EmptyState message="No messages yet. You'll receive notifications about your courses, exams, and certificates here." />
        ) : (
          <ul className="divide-y divide-alo-soft-blue">
            {messages.map((m) => (
              <li
                key={m.id}
                className={`flex items-start justify-between py-4 ${
                  !m.isRead ? "bg-alo-soft-blue/40" : ""
                } -mx-2 px-2 rounded-lg`}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    {!m.isRead && <span className="h-2 w-2 rounded-full bg-alo-orange" />}
                    <p className="font-semibold text-alo-navy">{m.subject}</p>
                  </div>
                  <p className="mt-1 line-clamp-2 text-sm text-alo-muted">{m.body}</p>
                </div>
                <p className="ml-4 shrink-0 text-xs text-alo-faint">{formatDateTime(m.createdAt)}</p>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </PortalShell>
  );
}
