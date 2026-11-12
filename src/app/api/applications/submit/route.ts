/**
 * POST /api/applications/submit — Submit Form B (full application)
 * PUT  /api/applications/submit — Save Form B progress (autosave)
 *
 * Form B sections:
 *   A) Personal Information
 *   B) Contact Information
 *   C) Passport Details
 *   D) Education History (JSON array, dynamic rows)
 *   E) English Proficiency (JSON array, dynamic rows)
 *   F) Work Experience (JSON array, optional)
 *   G) Recommendation Letters (JSON array, optional)
 *   H) Visa History
 *   I) Admission Preferences (JSON array)
 *   J) Funding Information
 *   K) Notes
 */

import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { ok, badRequest, notFound, forbidden } from "@/lib/responses";
import { withErrorHandler } from "@/lib/responses";
import { audit, getClientIp } from "@/lib/audit";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const formBSchema = z.object({
  draftId: z.string().cuid(),
  // A) Personal Information
  givenName: z.string().min(1, "Given name is required"),
  familyName: z.string().min(1, "Family name is required"),
  gender: z.string().optional(),
  nationality: z.string().optional(),
  dateOfBirth: z.string().optional(),
  maritalStatus: z.string().optional(),
  cityOfBirth: z.string().optional(),
  countryOfBirth: z.string().optional(),
  officeAddress: z.string().optional(),
  // B) Contact Information
  primaryEmail: z.string().email("Valid email required"),
  altEmail: z.string().optional(),
  mobileCountryCode: z.string().optional(),
  mobileNumber: z.string().min(1, "Mobile number required"),
  altCountryCode: z.string().optional(),
  altNumber: z.string().optional(),
  presentAddress: z.string().optional(),
  permanentAddress: z.string().optional(),
  emergencyName: z.string().optional(),
  emergencyRelation: z.string().optional(),
  emergencyCountryCode: z.string().optional(),
  emergencyNumber: z.string().optional(),
  // C) Passport
  hasPassport: z.boolean().optional(),
  passportNumber: z.string().optional(),
  placeOfIssue: z.string().optional(),
  issueDate: z.string().optional(),
  expireDate: z.string().optional(),
  // D) Education History (JSON)
  educationHistory: z.string().optional(), // JSON array
  // E) English Proficiency
  hasEnglishTest: z.boolean().optional(),
  englishTests: z.string().optional(), // JSON array
  // F) Work Experience
  hasWorkExperience: z.boolean().optional(),
  workExperience: z.string().optional(), // JSON array
  // G) References
  hasReferences: z.boolean().optional(),
  references: z.string().optional(), // JSON array
  // H) Visa History
  hasVisa: z.boolean().optional(),
  visaHistory: z.string().optional(),
  hasVisaRefusal: z.boolean().optional(),
  visaRefusalDetails: z.string().optional(),
  hasImmigrationHistory: z.boolean().optional(),
  immigrationDetails: z.string().optional(),
  hasMedicalCondition: z.boolean().optional(),
  medicalDetails: z.string().optional(),
  hasCriminalOffense: z.boolean().optional(),
  criminalDetails: z.string().optional(),
  // I) Admission Preferences
  admissionPreferences: z.string().optional(),
  // J) Funding
  fundingStatus: z.string().optional(),
  sponsor: z.string().optional(),
  sourceOfFund: z.string().optional(),
  // K) Notes
  notes: z.string().optional(),
  // Submit or save?
  submit: z.boolean().optional(),
});

export async function POST(req: Request) {
  return withErrorHandler(async () => {
    const user = await requireAuth();

    const body = await req.json().catch(() => null);
    if (!body) return badRequest("Invalid JSON body");

    const parsed = formBSchema.safeParse(body);
    if (!parsed.success) return badRequest(parsed.error.issues[0]?.message || "Invalid");

    const { draftId, submit, dateOfBirth, issueDate, expireDate, ...formData } = parsed.data;

    // Verify draft ownership
    const draft = await db.applicationDraft.findUnique({ where: { id: draftId } });
    if (!draft) return notFound("Application not found");
    if (draft.userId !== user.id && user.role !== "COUNSELOR" && user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
      return forbidden("Access denied");
    }

    // Prepare data with date conversions
    const data: Record<string, unknown> = { ...formData, draftId, userId: user.id };
    if (dateOfBirth) data.dateOfBirth = new Date(dateOfBirth);
    if (issueDate) data.issueDate = new Date(issueDate);
    if (expireDate) data.expireDate = new Date(expireDate);

    if (submit) {
      data.status = "SUBMITTED";
      data.submittedAt = new Date();
    }

    // Upsert Form B
    const existingFormB = await db.applicationFormB.findUnique({ where: { draftId } });
    let formB;
    if (existingFormB) {
      formB = await db.applicationFormB.update({
        where: { draftId },
        data,
      });
    } else {
      formB = await db.applicationFormB.create({ data: data as any });
    }

    // Update draft status if submitting
    if (submit) {
      await db.applicationDraft.update({
        where: { id: draftId },
        data: { status: "IN_REVIEW" },
      });

      const ip = getClientIp(req);
      await audit("APPLICATIONS_UPDATE", {
        userId: user.id,
        resource: "application:" + draftId,
        ipAddress: ip,
        metadata: { action: "submitted", formBId: formB.id },
      });
    }

    return ok(
      { formBId: formB.id, submitted: !!submit },
      submit ? "Application submitted successfully" : "Progress saved"
    );
  });
}
