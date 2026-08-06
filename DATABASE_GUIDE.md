# Database Guide

## Database Engine
SQLite via Prisma ORM (single-server deployment)

## Schema Location
`prisma/schema.prisma` — 25 models

## Models Overview

### Authentication (4)
- User: email, passwordHash, role, status, branchId, departmentId
- Branch: name, address, phone, timezone
- Department: name, branchId
- PasswordReset: userId, token, expiresAt

### CRM Core (4)
- Lead: name, email, phone, source, status, counselorId
- Student: name, email, phone, nationality, passportNumber
- Partner: organizationName, commissionRate
- Commission: partnerId, studentId, amount, status

### Education Catalog (4)
- Country: name, code, flag
- University: name, countryId, city, isPublished
- Course: universityId, name, level, tuitionFee
- Scholarship: universityId, name, amount, deadline

### Applications & Documents (2)
- Application: studentId, courseId, status, assignedTo
- Document: studentId, type, fileName, ocrStatus

### Communications (2)
- Message: channel, direction, body, leadId, studentId
- Notification: userId, title, body, readAt

### Workflow (3)
- Task: title, status, priority, dueDate, assigneeId
- Appointment: title, startTime, endTime, studentId
- TimelineEntry: entityType, entityId, action

### Audit & Config (2)
- AuditLog: userId, action, resource, ipAddress
- Setting: key, value

### Exam Platform (4)
- ExamType: code, name, category
- PracticeSet: examTypeId, title, durationMin
- Attempt: userId, practiceSetId, status
- Score: attemptId, overall, confidence, providerUsed

## Migration Commands
```bash
# Development (creates migration + applies)
bun run db:migrate:dev

# Production (applies existing migrations, non-interactive)
bun run db:migrate

# Generate Prisma Client
bun run db:generate

# Seed database
bun run db:seed
```

## Safe Migration Rules
1. Always backup before migration: `bash scripts/backup.sh`
2. Never use `migrate dev` in production
3. Never use `migrate reset` in production
4. Test migrations on a copy first
5. Verify schema: `bun prisma validate`

## Backup
```bash
bash scripts/backup.sh
# Creates timestamped .tar.gz in BACKUP_DIR
```

## Restore
```bash
bash scripts/restore.sh <archive> --confirm
# Checksum verified, current DB backed up before overwrite
```
