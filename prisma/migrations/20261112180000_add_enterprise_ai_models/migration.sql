-- CreateTable
CREATE TABLE "AIModel" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "capabilities" TEXT NOT NULL,
    "evaluatedAt" DATETIME,
    "approvedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
-- CreateTable
CREATE TABLE "Skill" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "requiredKnowledge" TEXT,
    "compatibleAgents" TEXT,
    "version" TEXT NOT NULL DEFAULT '1.0.0',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
-- CreateTable
CREATE TABLE "PromptTemplate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "department" TEXT NOT NULL,
    "agent" TEXT,
    "purpose" TEXT NOT NULL,
    "version" TEXT NOT NULL DEFAULT '1.0.0',
    "variables" TEXT,
    "systemInstructions" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
-- CreateTable
CREATE TABLE "SOP" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "department" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "steps" TEXT NOT NULL,
    "requiredSkills" TEXT,
    "allowedAgents" TEXT,
    "version" TEXT NOT NULL DEFAULT '1.0.0',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
-- CreateTable
CREATE TABLE "ConstitutionalRule" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "enforcement" TEXT NOT NULL DEFAULT 'BLOCK',
    "version" TEXT NOT NULL DEFAULT '1.0.0',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
-- CreateTable
CREATE TABLE "DCCAssessment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "departmentId" TEXT NOT NULL,
    "sopCoverage" REAL NOT NULL DEFAULT 0,
    "knowledgeCoverage" REAL NOT NULL DEFAULT 0,
    "skillCoverage" REAL NOT NULL DEFAULT 0,
    "testPassRate" REAL NOT NULL DEFAULT 0,
    "kpiAchievement" REAL NOT NULL DEFAULT 0,
    "securityCompliance" REAL NOT NULL DEFAULT 100,
    "auditCompliance" REAL NOT NULL DEFAULT 100,
    "selfRecoverySuccess" REAL NOT NULL DEFAULT 0,
    "humanEscalationRate" REAL NOT NULL DEFAULT 100,
    "status" TEXT NOT NULL DEFAULT 'UNDER_REVIEW',
    "assessedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
-- CreateTable
CREATE TABLE "Workflow" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "department" TEXT,
    "trigger" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "steps" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
-- CreateTable
CREATE TABLE "EnterpriseEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "payload" TEXT NOT NULL,
    "source" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
-- CreateIndex
CREATE UNIQUE INDEX "AIModel_name_key" ON "AIModel"("name");
-- CreateIndex
CREATE INDEX "AIModel_provider_status_idx" ON "AIModel"("provider", "status");
-- CreateIndex
CREATE INDEX "AIModel_status_idx" ON "AIModel"("status");
-- CreateIndex
CREATE UNIQUE INDEX "Skill_name_key" ON "Skill"("name");
-- CreateIndex
CREATE INDEX "Skill_category_status_idx" ON "Skill"("category", "status");
-- CreateIndex
CREATE INDEX "Skill_status_idx" ON "Skill"("status");
-- CreateIndex
CREATE INDEX "PromptTemplate_department_status_idx" ON "PromptTemplate"("department", "status");
-- CreateIndex
CREATE INDEX "PromptTemplate_agent_status_idx" ON "PromptTemplate"("agent", "status");
-- CreateIndex
CREATE INDEX "PromptTemplate_status_idx" ON "PromptTemplate"("status");
-- CreateIndex
CREATE INDEX "SOP_department_status_idx" ON "SOP"("department", "status");
-- CreateIndex
CREATE INDEX "SOP_status_idx" ON "SOP"("status");
-- CreateIndex
CREATE INDEX "ConstitutionalRule_category_active_idx" ON "ConstitutionalRule"("category", "active");
-- CreateIndex
CREATE INDEX "ConstitutionalRule_active_idx" ON "ConstitutionalRule"("active");
-- CreateIndex
CREATE INDEX "DCCAssessment_departmentId_status_idx" ON "DCCAssessment"("departmentId", "status");
-- CreateIndex
CREATE INDEX "DCCAssessment_status_idx" ON "DCCAssessment"("status");
-- CreateIndex
CREATE INDEX "Workflow_department_status_idx" ON "Workflow"("department", "status");
-- CreateIndex
CREATE INDEX "Workflow_trigger_status_idx" ON "Workflow"("trigger", "status");
-- CreateIndex
CREATE INDEX "Workflow_status_idx" ON "Workflow"("status");
-- CreateIndex
CREATE INDEX "EnterpriseEvent_type_createdAt_idx" ON "EnterpriseEvent"("type", "createdAt");
-- CreateIndex
CREATE INDEX "EnterpriseEvent_createdAt_idx" ON "EnterpriseEvent"("createdAt");
-- CreateIndex
CREATE INDEX "EnterpriseEvent_source_idx" ON "EnterpriseEvent"("source");
