warn The configuration property `package.json#prisma` is deprecated and will be removed in Prisma 7. Please migrate to a Prisma config file (e.g., `prisma.config.ts`).
For more information, see: https://pris.ly/prisma-config

-- DropIndex
DROP INDEX "Score_providerUsed_idx";

-- AlterTable
ALTER TABLE "User" ADD COLUMN "educationalId" TEXT;

-- CreateTable
CREATE TABLE "Certificate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "certificateNumber" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "attemptId" TEXT NOT NULL,
    "examTypeCode" TEXT NOT NULL,
    "examTypeName" TEXT NOT NULL,
    "overallScore" REAL,
    "listeningScore" REAL,
    "readingScore" REAL,
    "writingScore" REAL,
    "speakingScore" REAL,
    "interestedInCounseling" BOOLEAN NOT NULL DEFAULT false,
    "interestedLeadId" TEXT,
    "interestedAt" DATETIME,
    "emailedAt" DATETIME,
    "filePath" TEXT,
    "issuedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Certificate_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Certificate_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "Attempt" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DailyQuestionVariant" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "dailySetId" TEXT NOT NULL,
    "variantIndex" INTEGER NOT NULL,
    "practiceSetId" TEXT NOT NULL,
    "questionIds" TEXT NOT NULL,
    "questionCount" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DailyQuestionVariant_dailySetId_fkey" FOREIGN KEY ("dailySetId") REFERENCES "DailyQuestionSet" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AttemptVariantExposure" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "attemptId" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AttemptVariantExposure_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "DailyQuestionVariant" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "AttemptVariantExposure_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "Attempt" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CertificateSequence" (
    "year" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "lastValue" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Subject" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "CourseIntake" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "courseId" TEXT NOT NULL,
    "month" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "deadline" DATETIME,
    CONSTRAINT "CourseIntake_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ApplicationDraft" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "courseId" TEXT,
    "universityId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "source" TEXT NOT NULL DEFAULT 'FORM_A',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ApplicationDraft_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ApplicationDraft_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ApplicationDraft_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "University" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ApplicationFormB" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "draftId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "givenName" TEXT NOT NULL,
    "familyName" TEXT NOT NULL,
    "gender" TEXT,
    "nationality" TEXT,
    "dateOfBirth" DATETIME,
    "maritalStatus" TEXT,
    "cityOfBirth" TEXT,
    "countryOfBirth" TEXT,
    "officeAddress" TEXT,
    "primaryEmail" TEXT NOT NULL,
    "altEmail" TEXT,
    "mobileCountryCode" TEXT,
    "mobileNumber" TEXT,
    "altCountryCode" TEXT,
    "altNumber" TEXT,
    "presentAddress" TEXT,
    "permanentAddress" TEXT,
    "emergencyName" TEXT,
    "emergencyRelation" TEXT,
    "emergencyCountryCode" TEXT,
    "emergencyNumber" TEXT,
    "hasPassport" BOOLEAN NOT NULL DEFAULT false,
    "passportNumber" TEXT,
    "placeOfIssue" TEXT,
    "issueDate" DATETIME,
    "expireDate" DATETIME,
    "educationHistory" TEXT NOT NULL,
    "hasEnglishTest" BOOLEAN NOT NULL DEFAULT false,
    "englishTests" TEXT NOT NULL,
    "hasWorkExperience" BOOLEAN NOT NULL DEFAULT false,
    "workExperience" TEXT NOT NULL,
    "hasReferences" BOOLEAN NOT NULL DEFAULT false,
    "references" TEXT NOT NULL,
    "hasVisa" BOOLEAN NOT NULL DEFAULT false,
    "visaHistory" TEXT NOT NULL,
    "hasVisaRefusal" BOOLEAN NOT NULL DEFAULT false,
    "visaRefusalDetails" TEXT,
    "hasImmigrationHistory" BOOLEAN NOT NULL DEFAULT false,
    "immigrationDetails" TEXT,
    "hasMedicalCondition" BOOLEAN NOT NULL DEFAULT false,
    "medicalDetails" TEXT,
    "hasCriminalOffense" BOOLEAN NOT NULL DEFAULT false,
    "criminalDetails" TEXT,
    "admissionPreferences" TEXT NOT NULL,
    "fundingStatus" TEXT,
    "sponsor" TEXT,
    "sourceOfFund" TEXT,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "counselorId" TEXT,
    "counselorComment" TEXT,
    "submittedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ApplicationFormB_draftId_fkey" FOREIGN KEY ("draftId") REFERENCES "ApplicationDraft" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ApplicationFormB_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ApplicationDocument" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "applicationId" TEXT NOT NULL,
    "section" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "counselorComment" TEXT,
    "uploadedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" DATETIME,
    "reviewedBy" TEXT,
    CONSTRAINT "ApplicationDocument_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "ApplicationDraft" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Attempt" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "practiceSetId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'IN_PROGRESS',
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" DATETIME,
    "durationMin" INTEGER,
    "attemptNumber" INTEGER NOT NULL DEFAULT 1,
    "submittedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "deviceId" TEXT,
    "deviceFingerprint" TEXT,
    "tabSwitchCount" INTEGER NOT NULL DEFAULT 0,
    "lastTabSwitchAt" DATETIME,
    CONSTRAINT "Attempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Attempt_practiceSetId_fkey" FOREIGN KEY ("practiceSetId") REFERENCES "PracticeSet" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Attempt" ("attemptNumber", "createdAt", "durationMin", "expiresAt", "id", "practiceSetId", "startedAt", "status", "submittedAt", "updatedAt", "userId") SELECT "attemptNumber", "createdAt", "durationMin", "expiresAt", "id", "practiceSetId", "startedAt", "status", "submittedAt", "updatedAt", "userId" FROM "Attempt";
DROP TABLE "Attempt";
ALTER TABLE "new_Attempt" RENAME TO "Attempt";
CREATE INDEX "Attempt_userId_idx" ON "Attempt"("userId");
CREATE INDEX "Attempt_status_idx" ON "Attempt"("status");
CREATE INDEX "Attempt_userId_practiceSetId_idx" ON "Attempt"("userId", "practiceSetId");
CREATE INDEX "Attempt_expiresAt_idx" ON "Attempt"("expiresAt");
CREATE INDEX "Attempt_deviceId_idx" ON "Attempt"("deviceId");
CREATE TABLE "new_DailyQuestionSet" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "examTypeCode" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "practiceSetId" TEXT,
    "isGenerated" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_DailyQuestionSet" ("createdAt", "date", "examTypeCode", "id", "isGenerated", "practiceSetId") SELECT "createdAt", "date", "examTypeCode", "id", "isGenerated", "practiceSetId" FROM "DailyQuestionSet";
DROP TABLE "DailyQuestionSet";
ALTER TABLE "new_DailyQuestionSet" RENAME TO "DailyQuestionSet";
CREATE INDEX "DailyQuestionSet_examTypeCode_date_idx" ON "DailyQuestionSet"("examTypeCode", "date");
CREATE UNIQUE INDEX "DailyQuestionSet_examTypeCode_date_key" ON "DailyQuestionSet"("examTypeCode", "date");
CREATE TABLE "new_FreeQuota" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "examTypeCode" TEXT NOT NULL,
    "attemptsUsed" INTEGER NOT NULL DEFAULT 0,
    "attemptsLimit" INTEGER NOT NULL DEFAULT 3,
    "isAloStudent" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_FreeQuota" ("attemptsLimit", "attemptsUsed", "createdAt", "id", "isAloStudent", "updatedAt", "userId") SELECT "attemptsLimit", "attemptsUsed", "createdAt", "id", "isAloStudent", "updatedAt", "userId" FROM "FreeQuota";
DROP TABLE "FreeQuota";
ALTER TABLE "new_FreeQuota" RENAME TO "FreeQuota";
CREATE INDEX "FreeQuota_userId_idx" ON "FreeQuota"("userId");
CREATE INDEX "FreeQuota_examTypeCode_idx" ON "FreeQuota"("examTypeCode");
CREATE INDEX "FreeQuota_userId_examTypeCode_idx" ON "FreeQuota"("userId", "examTypeCode");
CREATE UNIQUE INDEX "FreeQuota_userId_examTypeCode_key" ON "FreeQuota"("userId", "examTypeCode");
CREATE TABLE "new_Message" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "channel" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "senderId" TEXT,
    "senderName" TEXT,
    "senderHandle" TEXT,
    "recipientId" TEXT,
    "recipientName" TEXT,
    "recipientHandle" TEXT,
    "body" TEXT NOT NULL,
    "attachments" TEXT,
    "status" TEXT NOT NULL DEFAULT 'SENT',
    "leadId" TEXT,
    "studentId" TEXT,
    "partnerId" TEXT,
    "applicationId" TEXT,
    "internalNote" TEXT,
    "aiSummary" TEXT,
    "readAt" DATETIME,
    "conversationId" TEXT,
    "providerMessageId" TEXT,
    "idempotencyKey" TEXT,
    "rawPayloadHash" TEXT,
    "sentAt" DATETIME,
    "deliveredAt" DATETIME,
    "failedReason" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Message_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Message_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Message_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Message" ("aiSummary", "applicationId", "attachments", "body", "channel", "conversationId", "createdAt", "deliveredAt", "direction", "failedReason", "id", "idempotencyKey", "internalNote", "leadId", "partnerId", "providerMessageId", "rawPayloadHash", "readAt", "recipientHandle", "recipientId", "recipientName", "senderHandle", "senderId", "senderName", "sentAt", "status", "studentId") SELECT "aiSummary", "applicationId", "attachments", "body", "channel", "conversationId", "createdAt", "deliveredAt", "direction", "failedReason", "id", "idempotencyKey", "internalNote", "leadId", "partnerId", "providerMessageId", "rawPayloadHash", "readAt", "recipientHandle", "recipientId", "recipientName", "senderHandle", "senderId", "senderName", "sentAt", "status", "studentId" FROM "Message";
DROP TABLE "Message";
ALTER TABLE "new_Message" RENAME TO "Message";
CREATE UNIQUE INDEX "Message_idempotencyKey_key" ON "Message"("idempotencyKey");
CREATE INDEX "Message_channel_idx" ON "Message"("channel");
CREATE INDEX "Message_leadId_idx" ON "Message"("leadId");
CREATE INDEX "Message_studentId_idx" ON "Message"("studentId");
CREATE INDEX "Message_createdAt_idx" ON "Message"("createdAt");
CREATE INDEX "Message_conversationId_idx" ON "Message"("conversationId");
CREATE UNIQUE INDEX "Message_channel_providerMessageId_key" ON "Message"("channel", "providerMessageId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Certificate_certificateNumber_key" ON "Certificate"("certificateNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Certificate_attemptId_key" ON "Certificate"("attemptId");

-- CreateIndex
CREATE INDEX "Certificate_userId_idx" ON "Certificate"("userId");

-- CreateIndex
CREATE INDEX "Certificate_attemptId_idx" ON "Certificate"("attemptId");

-- CreateIndex
CREATE INDEX "Certificate_examTypeCode_idx" ON "Certificate"("examTypeCode");

-- CreateIndex
CREATE INDEX "Certificate_certificateNumber_idx" ON "Certificate"("certificateNumber");

-- CreateIndex
CREATE INDEX "DailyQuestionVariant_dailySetId_idx" ON "DailyQuestionVariant"("dailySetId");

-- CreateIndex
CREATE UNIQUE INDEX "DailyQuestionVariant_dailySetId_variantIndex_key" ON "DailyQuestionVariant"("dailySetId", "variantIndex");

-- CreateIndex
CREATE UNIQUE INDEX "AttemptVariantExposure_attemptId_key" ON "AttemptVariantExposure"("attemptId");

-- CreateIndex
CREATE INDEX "AttemptVariantExposure_userId_idx" ON "AttemptVariantExposure"("userId");

-- CreateIndex
CREATE INDEX "AttemptVariantExposure_variantId_idx" ON "AttemptVariantExposure"("variantId");

-- CreateIndex
CREATE UNIQUE INDEX "AttemptVariantExposure_userId_variantId_key" ON "AttemptVariantExposure"("userId", "variantId");

-- CreateIndex
CREATE UNIQUE INDEX "Subject_name_key" ON "Subject"("name");

-- CreateIndex
CREATE INDEX "Subject_category_idx" ON "Subject"("category");

-- CreateIndex
CREATE INDEX "CourseIntake_courseId_idx" ON "CourseIntake"("courseId");

-- CreateIndex
CREATE UNIQUE INDEX "CourseIntake_courseId_month_year_key" ON "CourseIntake"("courseId", "month", "year");

-- CreateIndex
CREATE INDEX "ApplicationDraft_userId_idx" ON "ApplicationDraft"("userId");

-- CreateIndex
CREATE INDEX "ApplicationDraft_status_idx" ON "ApplicationDraft"("status");

-- CreateIndex
CREATE INDEX "ApplicationDraft_courseId_idx" ON "ApplicationDraft"("courseId");

-- CreateIndex
CREATE UNIQUE INDEX "ApplicationFormB_draftId_key" ON "ApplicationFormB"("draftId");

-- CreateIndex
CREATE INDEX "ApplicationFormB_userId_idx" ON "ApplicationFormB"("userId");

-- CreateIndex
CREATE INDEX "ApplicationFormB_status_idx" ON "ApplicationFormB"("status");

-- CreateIndex
CREATE INDEX "ApplicationDocument_applicationId_idx" ON "ApplicationDocument"("applicationId");

-- CreateIndex
CREATE INDEX "ApplicationDocument_section_idx" ON "ApplicationDocument"("section");

-- CreateIndex
CREATE INDEX "ApplicationDocument_status_idx" ON "ApplicationDocument"("status");

-- CreateIndex
CREATE UNIQUE INDEX "User_educationalId_key" ON "User"("educationalId");

