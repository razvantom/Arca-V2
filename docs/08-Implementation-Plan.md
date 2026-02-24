# ARCA v2 — Implementation Plan (MVP)

## Sprint 1 — Security Core
1. Auth: register/login/refresh/logout
2. RBAC + ScopeGuard (GLOBAL/COUNTY/ORG/SELF)
3. AuditLog model + interceptor

## Sprint 2 — Pyramid Core
4. Counties CRUD (ADMIN only)
5. Organizations/UAT CRUD (ADMIN only)
6. Memberships + Adeziuni workflow:
   - PENDING → ACTIVE/REJECTED/SUSPENDED
7. Leadership assignments

## Sprint 3 — Unit Modules
8. Documents (upload, categories, permissions)
9. Finance (income/expense/index)

## Sprint 4 — Activity
10. Events + attendance
11. Surveys + participation
12. Projects

## Sprint 5 — Governance
13. Ministries + members
14. Commissions + members
15. Legislative proposals
16. Political library

## Acceptance criteria (global)
- No cross-county leakage possible.
- Register enforces geo selection.
- All mutations audited.
