import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();
const failures: string[] = [];

async function main() {
  const [users, students, orphanStudents, studentUsers, examTypes, activeExamTypes,
    attempts, results, crmActivities, agentLearnings, learningMaterials] = await Promise.all([
    db.user.count(), db.student.count(), db.student.count({ where: { userId: null } }),
    db.user.count({ where: { role: "STUDENT" } }), db.examType.count(),
    db.examType.count({ where: { isActive: true } }), db.attempt.count(), db.score.count(),
    db.timelineEntry.count({ where: { entityType: "STUDENT" } }), db.agentLearning.count(),
    db.studyMaterial.count({ where: { isActive: true } }),
  ]);
  const linkedStudents = await db.student.count({ where: { userId: { not: null } } });
  const orphanUsers = Math.max(0, studentUsers - linkedStudents);
  const duplicateEmails = await db.$queryRaw<Array<{ count: bigint }>>`
    SELECT COUNT(*) AS count FROM (SELECT lower(email) FROM User GROUP BY lower(email) HAVING COUNT(*) > 1)
  `;
  const exams = await db.examType.findMany({
    orderBy: { code: "asc" },
    include: { practiceSets: { include: { questions: true } } },
  });
  const brokenQuestions = await db.question.count({ where: {
    OR: [{ prompt: "" }, { points: { lte: 0 } }, { section: "" }, { type: "" }],
  } });
  const duplicateQuestions = await db.$queryRaw<Array<{ count: bigint }>>`
    SELECT COUNT(*) AS count FROM (SELECT lower(trim(prompt)) FROM Question GROUP BY lower(trim(prompt)) HAVING COUNT(*) > 1)
  `;

  if (orphanUsers) failures.push(`${orphanUsers} STUDENT users have no Student profile`);
  if (orphanStudents) failures.push(`${orphanStudents} Student rows have no User`);
  if (Number(duplicateEmails[0]?.count || 0)) failures.push("duplicate normalized emails exist");
  if (brokenQuestions) failures.push(`${brokenQuestions} structurally broken questions exist`);
  for (const exam of exams.filter((item) => item.isActive)) {
    const playable = exam.practiceSets.flatMap((set) => set.isActive ? set.questions : [])
      .filter((question) => question.status === "ACTIVE" && question.prompt.trim() && question.points > 0);
    if (!playable.length) failures.push(`${exam.code} is active with zero playable questions`);
  }

  console.log(JSON.stringify({
    generatedAt: new Date().toISOString(), users, students, orphanUsers, orphanStudents,
    duplicateEmails: Number(duplicateEmails[0]?.count || 0), examTypes, activeExamTypes,
    questionsByExam: Object.fromEntries(exams.map((exam) => [exam.code,
      exam.practiceSets.reduce((sum, set) => sum + set.questions.filter((q) => q.status === "ACTIVE").length, 0)])),
    brokenQuestions, duplicateQuestions: Number(duplicateQuestions[0]?.count || 0),
    attempts, answers: await db.attemptAnswer.count(), results, crmActivities,
    agentJobs: await db.agentJob.count(), agentLearnings, learningMaterials,
    questionHistory: await db.studentQuestionHistory.count(),
    practiceAttempts: await db.practiceAttempt.count(),
    status: failures.length ? "FAIL" : "PASS", failures,
  }, null, 2));
  if (failures.length) process.exitCode = 1;
}

main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(() => db.$disconnect());
