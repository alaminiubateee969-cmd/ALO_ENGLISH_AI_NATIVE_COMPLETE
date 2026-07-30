# Database Documentation

## Database: SQLite via Prisma ORM

## Models (28 total)

### Auth & RBAC (4)
- User: email, passwordHash, role, status, branchId, departmentId
- Branch: name, address, phone, timezone
- Department: name, branchId
- PasswordReset: userId, token, expiresAt

### CRM Core (4)
- Lead: name, email, phone, source, status, counselorId, partnerId
- Student: name, email, phone, nationality, passportNumber, counselorId
- Partner: organizationName, commissionRate
- Commission: partnerId, studentId, amount, status

### Education Catalog (4)
- Country: name, code, flag
- University: name, countryId, city, isPublished
- Course: universityId, name, level, tuitionFee
- Scholarship: universityId, name, amount, deadline

### Applications & Documents (2)
- Application: studentId, courseId, status, assignedTo
- Document: studentId, type, fileName, ocrStatus, ocrData

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

## Migration Workflow
- Dev: bun run db:migrate:dev (prisma migrate dev)
- Prod: bun run db:migrate (prisma migrate deploy)
- Never use migrate dev in production
- Always backup before migration
