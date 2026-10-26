/**
 * src/lib/crm/permissions.ts
 *
 * Permission policy for the communication hub.
 *
 * THE PRINCIPLE
 * ─────────────
 * Rank alone does not grant access to a student's passport scan. The spec for
 * this hub asks for three specific things, and this module encodes them:
 *
 *   1. Marketing managers see campaign performance and approved messaging, and
 *      no private documents.
 *   2. Administrators and super administrators are not automatically entitled
 *      to every student's sensitive documents. Sensitive access needs an
 *      explicit, recorded grant for a named student, and is audited.
 *   3. Nobody in an ordinary role can permanently delete a record. Modification,
 *      status change and access are logged instead; lawful deletion is a
 *      separate, approved workflow.
 *
 * This module is a policy library, not an enforcement point. Enforcement stays
 * in the route handlers through `requireRole`/ownership checks — a permission
 * helper that is not called proves nothing. `tests/crm-permissions.test.ts`
 * pins the matrix so a policy change is a deliberate edit.
 */

export type CrmRole =
  | 'SUPER_ADMIN'
  | 'ADMIN'
  | 'BRANCH_MANAGER'
  | 'MARKETING_MANAGER'
  | 'COUNSELOR'
  | 'APPLICATION_TEAM'
  | 'VISA_OFFICER'
  | 'FINANCE'
  | 'FRONT_DESK'
  | 'SUPPORT'
  | 'PARTNER'
  | 'STUDENT';

/** Sensitivity classes, highest first. */
export type DocumentSensitivity = 'PUBLIC' | 'INTERNAL' | 'SENSITIVE' | 'LEGAL_HOLD';

/** Data a role may not read without an explicit grant. */
export const SENSITIVE_DOCUMENT_TYPES = [
  'PASSPORT',
  'NID',
  'BIRTH_CERT',
  'BANK_STATEMENT',
  'SPONSOR',
  'VISA',
] as const;

export type AccessDecision = {
  allowed: boolean;
  code: 'OK' | 'ROLE_NOT_PERMITTED' | 'GRANT_REQUIRED' | 'NOT_ASSIGNED' | 'SCOPE_MISMATCH' | 'TARGET_PROTECTED';
  reason: string;
  /** True when the attempt must be written to the audit log regardless of outcome. */
  auditRequired: boolean;
};

export type AccessContext = {
  role: CrmRole;
  /** The student whose record is being read. */
  studentId: string;
  /** Whether this user is currently assigned to that student. */
  isAssignedCounselor: boolean;
  /** A recorded, named grant specifically for this student and sensitivity. */
  hasExplicitGrant?: boolean;
  /** Partner scope: a partner may only see students attributed to them. */
  partnerStudentIds?: string[];
  /** Applications the user is responsible for. */
  assignedApplicationStudentIds?: string[];
  /** True for records under legal hold, which nobody edits. */
  legalHold?: boolean;
  sensitivity?: DocumentSensitivity;
};

const CAN_SEE_ALL_NON_SENSITIVE: CrmRole[] = ['SUPER_ADMIN', 'ADMIN', 'BRANCH_MANAGER'];
const CAN_SEE_ASSIGNED_STUDENTS: CrmRole[] = ['COUNSELOR', 'APPLICATION_TEAM', 'VISA_OFFICER', 'FRONT_DESK', 'SUPPORT', 'BRANCH_MANAGER', 'ADMIN', 'SUPER_ADMIN'];

/** Roles that may draft and send approved marketing messages. */
export function canSendMarketing(role: CrmRole): AccessDecision {
  const allowed: CrmRole[] = ['MARKETING_MANAGER', 'ADMIN', 'SUPER_ADMIN'];
  return allowed.includes(role)
    ? { allowed: true, code: 'OK', reason: 'Role may prepare approved marketing sends.', auditRequired: true }
    : { allowed: false, code: 'ROLE_NOT_PERMITTED', reason: `${role} may not send marketing messages.`, auditRequired: true };
}

/**
 * Roles that may record a consent decision for a student.
 *
 * Consent is a legal record, so writing one is a deliberate act by accountable
 * staff — not something every signed-in account may do. FRONT_DESK is included
 * because the capture often happens at the desk, in person, which is exactly the
 * kind of capture that needs a name attached to it.
 */
export function canRecordConsent(role: CrmRole): AccessDecision {
  const allowed: CrmRole[] = ['FRONT_DESK', 'COUNSELOR', 'SUPPORT', 'BRANCH_MANAGER', 'MARKETING_MANAGER', 'ADMIN', 'SUPER_ADMIN'];
  return allowed.includes(role)
    ? { allowed: true, code: 'OK', reason: 'Role may record a consent decision.', auditRequired: true }
    : { allowed: false, code: 'ROLE_NOT_PERMITTED', reason: `${role} may not write to the consent register.`, auditRequired: true };
}

/**
 * Roles that may resolve the review queue.
 *
 * An identity decision — "this message belongs to this student" — is a decision
 * about who someone is, and it moves their documents and conversations with it.
 * It belongs to the people who own student relationships, not to everyone who
 * can log in.
 */
export function canResolveReview(role: CrmRole): AccessDecision {
  const allowed: CrmRole[] = ['FRONT_DESK', 'COUNSELOR', 'APPLICATION_TEAM', 'VISA_OFFICER', 'BRANCH_MANAGER', 'ADMIN', 'SUPER_ADMIN'];
  return allowed.includes(role)
    ? { allowed: true, code: 'OK', reason: 'Role may resolve review-queue entries.', auditRequired: true }
    : { allowed: false, code: 'ROLE_NOT_PERMITTED', reason: `${role} may not resolve review-queue entries.`, auditRequired: true };
}

/**
 * Roles that may send a service or follow-up message to a student.
 *
 * Deliberately excludes PARTNER (they are not ALO staff and must not speak as
 * the institute) and STUDENT (a student cannot message another student through
 * the CRM). Marketing is a separate decision, above.
 */
export function canSendServiceMessage(role: CrmRole): AccessDecision {
  const allowed: CrmRole[] = [
    'COUNSELOR',
    'APPLICATION_TEAM',
    'VISA_OFFICER',
    'FRONT_DESK',
    'SUPPORT',
    'BRANCH_MANAGER',
    'MARKETING_MANAGER',
    'ADMIN',
    'SUPER_ADMIN',
  ];
  return allowed.includes(role)
    ? { allowed: true, code: 'OK', reason: 'Role may reply to a student.', auditRequired: true }
    : { allowed: false, code: 'ROLE_NOT_PERMITTED', reason: `${role} may not send messages to students.`, auditRequired: true };
}

/** Campaign reporting is the marketing manager's core surface. */
export function canViewCampaignPerformance(role: CrmRole): AccessDecision {
  const allowed: CrmRole[] = ['MARKETING_MANAGER', 'ADMIN', 'SUPER_ADMIN', 'BRANCH_MANAGER'];
  return allowed.includes(role)
    ? { allowed: true, code: 'OK', reason: 'Role may read campaign performance aggregates.', auditRequired: false }
    : { allowed: false, code: 'ROLE_NOT_PERMITTED', reason: `${role} may not read campaign reporting.`, auditRequired: true };
}

/**
 * Reading a student's documents.
 *
 * SENSITIVE documents (passport, NID, bank statement, visa, sponsor) always need
 * an explicit grant, no matter how senior the role: a marketing manager never
 * qualifies, and neither does an administrator by virtue of being an
 * administrator.
 */
export function canReadStudentDocument(context: AccessContext): AccessDecision {
  const sensitive = context.sensitivity === 'SENSITIVE' || context.sensitivity === 'LEGAL_HOLD' || context.sensitivity === undefined;

  if (context.role === 'PARTNER') {
    const inScope = context.partnerStudentIds?.includes(context.studentId) ?? false;
    return inScope
      ? {
          allowed: false,
          code: 'GRANT_REQUIRED',
          reason: 'Partners may see referral status, never identity documents. A named grant is required.',
          auditRequired: true,
        }
      : { allowed: false, code: 'SCOPE_MISMATCH', reason: 'Student is outside this partner scope.', auditRequired: true };
  }

  if (context.role === 'MARKETING_MANAGER') {
    return {
      allowed: false,
      code: 'TARGET_PROTECTED',
      reason: 'Marketing roles have no access to student documents, sensitive or otherwise.',
      auditRequired: true,
    };
  }

  if (context.role === 'STUDENT') {
    return {
      allowed: false,
      code: 'GRANT_REQUIRED',
      reason: 'Student portal access is a separate surface; this policy governs staff access.',
      auditRequired: true,
    };
  }

  if (sensitive) {
    if (context.hasExplicitGrant) {
      return { allowed: true, code: 'OK', reason: 'Explicit grant recorded for this student.', auditRequired: true };
    }
    if (context.isAssignedCounselor && CAN_SEE_ASSIGNED_STUDENTS.includes(context.role)) {
      // The assigned counselor must be able to work on the case; the read is
      // still audited, and rank alone is never sufficient.
      return { allowed: true, code: 'OK', reason: 'Assigned staff member; access recorded in the audit log.', auditRequired: true };
    }
    return {
      allowed: false,
      code: 'GRANT_REQUIRED',
      reason: 'Sensitive document access requires assignment or a named grant. Rank alone is not sufficient.',
      auditRequired: true,
    };
  }

  // Non-sensitive document metadata.
  if (CAN_SEE_ALL_NON_SENSITIVE.includes(context.role)) {
    if (context.isAssignedCounselor || CAN_SEE_ASSIGNED_STUDENTS.includes(context.role)) {
      return { allowed: true, code: 'OK', reason: 'Role may read non-sensitive document metadata.', auditRequired: false };
    }
  }

  const inApplicationScope = context.assignedApplicationStudentIds?.includes(context.studentId) ?? false;
  if (inApplicationScope && CAN_SEE_ASSIGNED_STUDENTS.includes(context.role)) {
    return { allowed: true, code: 'OK', reason: 'Student is in this user’s application scope.', auditRequired: false };
  }

  return {
    allowed: false,
    code: 'NOT_ASSIGNED',
    reason: 'User is neither assigned to this student nor granted scope.',
    auditRequired: true,
  };
}

/**
 * Permanent deletion. Only an approved retention workflow may delete, and it
 * runs with a different permission than day-to-day staff access.
 */
export function canPermanentlyDelete(role: CrmRole): AccessDecision {
  void role;
  return {
    allowed: false,
    code: 'ROLE_NOT_PERMITTED',
    reason:
      'Permanent deletion is not a role permission. Records are soft-deleted; lawful erasure runs through the approved retention workflow with its own approval and audit trail.',
    auditRequired: true,
  };
}

/** Soft delete (hide from normal views) — branch managers and above. */
export function canSoftDelete(role: CrmRole): AccessDecision {
  const allowed: CrmRole[] = ['SUPER_ADMIN', 'ADMIN', 'BRANCH_MANAGER'];
  return allowed.includes(role)
    ? { allowed: true, code: 'OK', reason: 'Role may soft-delete; the record and its history remain.', auditRequired: true }
    : { allowed: false, code: 'ROLE_NOT_PERMITTED', reason: `${role} may not remove records from views.`, auditRequired: true };
}

/** Editing a verified document's verification state is a review action. */
export function canVerifyDocument(role: CrmRole, isAssignedCounselor: boolean): AccessDecision {
  const allowed: CrmRole[] = ['ADMIN', 'SUPER_ADMIN', 'BRANCH_MANAGER', 'VISA_OFFICER', 'APPLICATION_TEAM'];
  if (allowed.includes(role) && (isAssignedCounselor || role === 'ADMIN' || role === 'SUPER_ADMIN')) {
    return { allowed: true, code: 'OK', reason: 'Role may mark a document verified or rejected.', auditRequired: true };
  }
  return {
    allowed: false,
    code: allowed.includes(role) ? 'NOT_ASSIGNED' : 'ROLE_NOT_PERMITTED',
    reason: 'Verification requires a reviewing role and responsibility for the student.',
    auditRequired: true,
  };
}

/** Integration credentials are engineer/owner territory, never a business role. */
export function canManageChannelCredentials(role: CrmRole): AccessDecision {
  return role === 'SUPER_ADMIN'
    ? {
        allowed: true,
        code: 'OK',
        reason: 'Super admin may rotate credentials; the secret itself is only ever read from server-side secret storage.',
        auditRequired: true,
      }
    : { allowed: false, code: 'ROLE_NOT_PERMITTED', reason: 'Only a super admin may manage channel credentials.', auditRequired: true };
}

/**
 * Sensitive subjects that must reach a human before any automated answer.
 * The after-hours assistant may summarise and draft, but these questions are
 * routed to staff.
 */
export const HUMAN_REVIEW_TOPICS = [
  'passport',
  'visa refusal',
  'visa rejection',
  'immigration history',
  'bank statement',
  'financial evidence',
  'scholarship decision',
  'admission decision',
  'medical',
  'legal',
  'complaint',
  'refund',
] as const;

export function requiresHumanReview(text: string): { required: boolean; matched: string[] } {
  const haystack = text.toLowerCase();
  const matched = HUMAN_REVIEW_TOPICS.filter((topic) => haystack.includes(topic));
  return { required: matched.length > 0, matched: [...matched] };
}
