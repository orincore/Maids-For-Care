---
name: admin-system
description: Multi-role admin auth system with DB-backed admins, JWT tokens, activity logs, and role permissions
metadata:
  type: project
---

## Admin Auth System (implemented 2026-06-28)

**Roles:** `super_admin` > `admin` > `support_agent`

**Login flow:**
- Hardcoded super_admin via env vars: `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_SECRET_KEY`
- DB admins (stored in `Admin` collection) use bcrypt passwords — no secret key needed
- Both return JWT signed with `ADMIN_JWT_SECRET`
- Token stored in `localStorage.adminToken`, user in `localStorage.adminUser`

**Key files:**
- `models/Admin.ts` — DB admin users, ROLE_PERMISSIONS matrix
- `models/ActivityLog.ts` — all admin write actions are logged
- `lib/adminAuth.ts` — JWT gen/verify, `getAdminFromRequest`, `requirePermission`, `hasPermission`
- `lib/activityLogger.ts` — `logActivity(admin, action, resource, resourceId, details, request)`
- `app/api/auth/admin/login/route.ts` — handles both hardcoded and DB login

**API routes:**
- `POST /api/admin/admins` — create sub-admin (super_admin only)
- `PATCH/DELETE /api/admin/admins/[id]` — update/delete sub-admin
- `GET /api/admin/logs` — paginated activity logs (admin + super_admin)

**Frontend (`app/admin/page.tsx`):**
- Tabs: Overview, Services, Users, Bookings, Providers, Reviews, Logs, Admins
- Tabs shown based on user role permissions
- Mobile hamburger menu + dropdown tab selector on mobile
- Admins tab: role permission reference cards + create/disable/delete admin modal
- Logs tab: searchable/paginated activity log table

**Why:**
Replaced hardcoded single-admin system with DB-backed multi-admin supporting 3 roles with granular permissions. Activity logging for audit compliance.
