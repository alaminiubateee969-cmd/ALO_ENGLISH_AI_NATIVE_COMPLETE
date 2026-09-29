import { db } from "@/lib/db";
const TYPES=new Set(["MULTIPLE_CHOICE","MULTIPLE_RESPONSE","TRUE_FALSE","TRUE_FALSE_NOT_GIVEN","YES_NO_NOT_GIVEN","MATCHING","MATCHING_HEADINGS","SENTENCE_COMPLETION","SUMMARY_COMPLETION","NOTE_COMPLETION","TABLE_COMPLETION","FORM_COMPLETION","FILL_BLANK","REORDER","SHORT_ANSWER","ESSAY","SPEAKING","CHART_DESCRIPTION"]);
export async function runQualityGate(questionId:string){
 const q=await db.question.findUnique({where:{id:questionId},include:{practiceSet:{include:{examType:true}}}}); if(!q) throw new Error("Question not found"); const errors:string[]=[];
 if(!q.prompt.trim()) errors.push("prompt missing"); if(!q.section.trim()) errors.push("section missing"); if(!TYPES.has(q.type)) errors.push("unsupported type"); if(q.points<=0) errors.push("invalid points"); if(!["EASY","MEDIUM","HARD"].includes(q.difficulty)) errors.push("invalid difficulty");
 if(q.type==="MULTIPLE_CHOICE"){try{const o=JSON.parse(q.options||"[]");if(!Array.isArray(o)||o.length<2)errors.push("invalid options");if(q.correctIndex==null||q.correctIndex<0||q.correctIndex>=o.length)errors.push("invalid answer index");}catch{errors.push("options JSON invalid");}}
 const duplicate=await db.question.findFirst({where:{id:{not:q.id},prompt:{equals:q.prompt}},select:{id:true}}); if(duplicate) errors.push(`exact duplicate ${duplicate.id}`);
 const status=errors.length?"REJECTED":"ACTIVE"; await db.question.update({where:{id:q.id},data:{status}}); return {questionId,status,errors};
}
