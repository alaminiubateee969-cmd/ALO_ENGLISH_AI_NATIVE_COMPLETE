import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";
import { Card, EmptyState, PortalShell, TEACHER_NAV } from "@/components/portal/PortalShell";

export const dynamic = "force-dynamic";

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

async function getClasses(teacherId: string) {
  return prisma.class.findMany({
    where: { teacherId },
    orderBy: { createdAt: "desc" },
    include: {
      course: { select: { id: true, title: true, category: true } },
      schedules: { orderBy: { dayOfWeek: "asc" } },
      _count: { select: { attendances: true } },
    },
  });
}

export default async function TeacherClassesPage() {
  const session = await getServerSession();
  if (!session?.user) return null;

  const teacher = await prisma.teacher.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });

  const classes = teacher ? await getClasses(teacher.id) : [];

  return (
    <PortalShell
      role="teacher"
      roleLabel="Teacher"
      navItems={TEACHER_NAV}
      activePath="/teacher/classes"
      title="My classes"
      subtitle="Classes you're currently teaching"
      userName={session.user.name}
    >
      {classes.length === 0 ? (
        <EmptyState message="No classes assigned yet. Contact an administrator if you believe this is an error." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {classes.map((c) => (
            <Card key={c.id}>
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold uppercase text-emerald-700">
                  {c.course.category}
                </span>
                <span className={`text-xs font-medium ${c.isActive ? "text-emerald-600" : "text-alo-faint"}`}>
                  {c.isActive ? "Active" : "Inactive"}
                </span>
              </div>
              <h3 className="mt-3 text-lg font-semibold text-alo-navy">{c.name}</h3>
              <p className="mt-1 text-sm text-alo-muted">{c.course.title}</p>

              {c.schedules.length > 0 && (
                <div className="mt-4">
                  <p className="text-xs uppercase text-alo-faint">Schedule</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {c.schedules.map((s) => (
                      <span key={s.id} className="rounded-md bg-alo-soft-gray px-2 py-1 text-xs text-alo-navy">
                        {DAY_NAMES[s.dayOfWeek]} {s.startTime}–{s.endTime}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-4 flex items-center justify-between text-sm text-alo-faint">
                <span>Room: {c.room ?? "TBD"}</span>
                <span>Capacity: {c.capacity}</span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </PortalShell>
  );
}
