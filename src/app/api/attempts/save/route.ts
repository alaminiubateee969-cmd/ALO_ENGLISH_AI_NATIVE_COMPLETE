import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { ok, badRequest, notFound, forbidden } from "@/lib/responses";
import { withErrorHandler } from "@/lib/responses";
import { z } from "zod";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
const schema = z.object({ attemptId: z.string().cuid(), questionId: z.string().cuid(), answer: z.string().max(10000).optional(), markedForReview: z.boolean().optional(), clear: z.boolean().optional() });
export async function POST(req: Request): Promise<Response> {
 return withErrorHandler(async () => {
  const user=await requireAuth(); const parsed=schema.safeParse(await req.json().catch(()=>null));
  if(!parsed.success) return badRequest(parsed.error.issues[0]?.message||"Validation failed");
  const {attemptId,questionId,markedForReview,clear}=parsed.data; const answer=parsed.data.answer?.trim();
  const attempt=await db.attempt.findUnique({where:{id:attemptId},select:{userId:true,status:true}});
  if(!attempt) return notFound("Attempt not found"); if(attempt.userId!==user.id) return forbidden("Not your attempt"); if(attempt.status!=="IN_PROGRESS") return badRequest("Attempt is not in progress");
  const assigned=await db.attemptQuestion.findUnique({where:{attemptId_questionId:{attemptId,questionId}},select:{id:true}});
  if(!assigned) return badRequest("Question is not assigned to this attempt");
  if(clear){ await db.attemptAnswer.deleteMany({where:{attemptId,questionId}}); return ok({saved:true,cleared:true,attemptId,questionId},"Answer cleared"); }
  const existing=await db.attemptAnswer.findUnique({where:{attemptId_questionId:{attemptId,questionId}},select:{answer:true}});
  const value=answer || existing?.answer; if(!value) return badRequest("answer is required before marking for review");
  const saved=await db.attemptAnswer.upsert({where:{attemptId_questionId:{attemptId,questionId}},create:{attemptId,questionId,answer:value,markedForReview:markedForReview??false},update:{...(answer?{answer}:{}),...(markedForReview!==undefined?{markedForReview}:{}),answeredAt:new Date()},select:{questionId:true,answer:true,markedForReview:true,answeredAt:true,updatedAt:true}});
  return ok({saved:true,attemptId,...saved},"Answer saved");
 });
}
