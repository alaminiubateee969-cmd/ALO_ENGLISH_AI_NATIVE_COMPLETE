import { db } from "@/lib/db";

export class InventoryInsufficientError extends Error {}

/** Creates an attempt and immutable, student-unique question assignment atomically. */
export async function allocateExamQuestions(userId: string, practiceSetId: string) {
  return db.$transaction(async (tx) => {
    const student = await tx.student.findUnique({ where: { userId }, select: { id: true } });
    if (!student) throw new Error("Canonical student profile missing");
    const set = await tx.practiceSet.findFirst({
      where: { id: practiceSetId, isActive: true, examType: { isActive: true } },
      include: { examType: true, questions: { where: { status: "ACTIVE" }, orderBy: [{ section: "asc" }, { order: "asc" }] } },
    });
    if (!set) throw new InventoryInsufficientError("Exam is not active");

    const served = new Set((await tx.studentQuestionHistory.findMany({
      where: { studentId: student.id }, select: { questionId: true },
    })).map((item) => item.questionId));
    const seen = new Set<string>();
    const questions = set.questions.filter((question) => {
      if (served.has(question.id) || seen.has(question.id)) return false;
      seen.add(question.id);
      return true;
    });
    // A production set is only playable when every configured active question can
    // be allocated. We never silently shorten an exam or reuse served questions.
    if (!questions.length || questions.length !== set.questions.length) {
      throw new InventoryInsufficientError(
        `Exam inventory insufficient: ${questions.length}/${set.questions.length} unique questions available for this student`
      );
    }

    const attempt = await tx.attempt.create({ data: { userId, practiceSetId, status: "IN_PROGRESS" } });
    await tx.attemptQuestion.createMany({ data: questions.map((question, position) => ({
      attemptId: attempt.id, questionId: question.id, position, section: question.section,
    })) });
    await tx.studentQuestionHistory.createMany({ data: questions.map((question) => ({
      studentId: student.id, questionId: question.id, attemptId: attempt.id, examCode: set.examType.code,
    })) });
    await tx.timelineEntry.create({ data: {
      entityType: "STUDENT", entityId: student.id, action: "EXAM_START",
      description: `${set.examType.code} attempt started`, userId,
      metadata: JSON.stringify({ attemptId: attempt.id, practiceSetId, questionCount: questions.length }),
    }});
    return { attempt, questionCount: questions.length };
  });
}
