# Contributing — ARCA v2

## Rules (must-follow)
1. REST API only: `/api/v1/...`
2. PostgreSQL is the ONLY write database. MySQL is replica read-only.
3. Every non-public endpoint MUST enforce:
   - AuthGuard
   - RBACGuard
   - ScopeGuard (GLOBAL/COUNTY/ORG/SELF)
4. All mutations MUST be audited (create/update/delete/approve/export).
5. No security logic in UI — backend is the source of truth.
6. Keep modules isolated: controller + service + dto + tests.
7. Do not commit secrets. Use `.env.example`.

## Required docs to follow
- docs/05-Architecture.md
- docs/07-Security.md
- docs/02-ARCA-RBAC-Scope-Matrice.md
