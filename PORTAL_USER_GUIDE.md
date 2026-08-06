# Portal User Guide

## Available Portals

### Student Portal (`/student/dashboard`)
**Access**: Login with STUDENT role
**Features**:
- View applications and documents
- Book appointments
- Send messages
- Take practice tests (English exam platform)
- View exam results and AI feedback

### Partner Portal (`/partner/dashboard`)
**Access**: Login with PARTNER role
**Features**:
- View referred leads and students
- Track commissions
- Manage referrals
- Send messages
- View reports

### Employee Portal (`/employee/dashboard`)
**Access**: Login with COUNSELOR, APPLICATION_TEAM, VISA_OFFICER, or SUPPORT_STAFF role
**Features**:
- Manage assigned leads and students
- Process applications
- Create tasks and appointments
- Upload documents
- Send messages
- View reports

### Admin Portal (`/admin/dashboard`)
**Access**: Login with ADMIN or SUPER_ADMIN role
**Features**:
- Full CRM management
- User management
- University/course/scholarship management
- View audit logs
- System settings
- AI agent status

### Super Admin Portal (`/super-admin/dashboard`)
**Access**: Login with SUPER_ADMIN role
**Features**:
- Everything in Admin Portal
- AI agent workforce control
- Integration health monitoring
- System-wide configuration

## Login
1. Visit `/login`
2. Enter email and password
3. You will be redirected to the appropriate dashboard based on your role

## Logout
Click the "Logout" button in the dashboard header.

## Password Reset
1. Visit `/forgot-password`
2. Enter your email
3. Check email for reset link
4. Visit `/reset-password?token=xxx`
5. Enter new password (minimum 12 characters)
