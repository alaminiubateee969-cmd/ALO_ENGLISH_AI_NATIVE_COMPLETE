import { db } from "@/lib/db";
import { runQualityGate } from "./QualityGateAgent";

export const AGENT_TYPES = ["ExamOrchestratorAgent","QuestionGenerationAgent","QualityGateAgent","QuestionInventoryAgent","ExamQuestionAllocationAgent","PerformanceAnalyticsAgent","DailyLearningLoopAgent","StudentAssistantAgent","CRMAgent"] as const;
export async function runAgentJob(agentType: string, input: Record<string, unknown>) {
 const job=await db.agentJob.create({data:{agentType,status:"QUEUED",input:JSON.stringify(input)}});
 await db.agentJob.update({where:{id:job.id},data:{status:"RUNNING",startedAt:new Date()}});
 try {
  let output: unknown;
  if(agentType==="QualityGateAgent") output=await runQualityGate(String(input.questionId||""));
  else if(agentType==="CRMAgent") output=await syncCrmActivity(input);
  else if(agentType==="PerformanceAnalyticsAgent") output=await analyzePerformance(String(input.studentId||""));
  else throw new Error(`No local executor registered for ${agentType}`);
  return db.agentJob.update({where:{id:job.id},data:{status:"COMPLETED",output:JSON.stringify(output),completedAt:new Date()}});
 } catch(error) {
  await db.agentJob.update({where:{id:job.id},data:{status:"FAILED",error:error instanceof Error?error.message:"Unknown error",completedAt:new Date(),retryCount:{increment:1}}}); throw error;
 }
}
async function syncCrmActivity(input: Record<string,unknown>){
 const studentId=String(input.studentId||""); if(!studentId) throw new Error("studentId required");
 const row=await db.timelineEntry.create({data:{entityType:"STUDENT",entityId:studentId,action:String(input.action||"ACTIVITY"),description:String(input.description||"Student activity"),metadata:JSON.stringify(input)}}); return {activityId:row.id};
}
async function analyzePerformance(studentId:string){
 if(!studentId) throw new Error("studentId required"); const student=await db.student.findUnique({where:{id:studentId},select:{userId:true}}); if(!student?.userId) throw new Error("Student not linked");
 const scores=await db.score.findMany({where:{userId:student.userId},orderBy:{createdAt:"desc"}}); const average=scores.length?scores.reduce((s,x)=>s+x.overall,0)/scores.length:0;
 const skill="GENERAL"; await db.studentProgress.upsert({where:{studentId_skill:{studentId,skill}},create:{studentId,skill,completed:scores.length,accuracy:average/9,lastScore:scores[0]?.overall},update:{completed:scores.length,accuracy:average/9,lastScore:scores[0]?.overall,lastActivityAt:new Date()}});
 return {attempts:scores.length,average};
}
