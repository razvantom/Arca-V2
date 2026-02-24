# ARCA v2

Platformă națională de organizare (Web + Android + iOS)
Arhitectură piramidală: Național → Filială (Județ) → Organizație → Membru

---

## 1) Arhitectură generală

- Backend API (single source of truth)
- PostgreSQL (Primary write DB)
- MySQL (Replica read-only)
- Web App (Admin + Dashboard)
- Mobile App (Android + iOS)
- CDC pipeline pentru replicare

---

## 2) Structura repo

arca-v2/
│
├── backend/
│   ├── src/
│   │   ├── modules/
│   │   │   ├── auth/
│   │   │   ├── users/
│   │   │   ├── counties/
│   │   │   ├── organizations/
│   │   │   ├── memberships/
│   │   │   ├── leadership/
│   │   │   ├── documents/
│   │   │   ├── finance/
│   │   │   ├── events/
│   │   │   ├── surveys/
│   │   │   ├── projects/
│   │   │   ├── governance/
│   │   │   └── audit/
│   │   ├── common/
│   │   ├── config/
│   │   └── main.ts
│   ├── prisma/ or migrations/
│   ├── docker/
│   └── README.md
│
├── web/
│   ├── src/
│   │   ├── pages/
│   │   ├── components/
│   │   ├── layouts/
│   │   └── services/
│   ├── public/
│   └── README.md
│
├── mobile/
│   ├── app/
│   │   ├── screens/
│   │   ├── components/
│   │   ├── navigation/
│   │   └── services/
│   └── README.md
│
├── infrastructure/
│   ├── docker-compose.yml
│   ├── postgres/
│   ├── mysql/
│   ├── cdc/
│   └── monitoring/
│
├── docs/
│   ├── 01-ARCA-Piramida-Aplicatiei.md
│   ├── 02-ARCA-RBAC-Scope-Matrice.md
│   ├── 03-Data-Redundancy-Strategy.md
│   └── architecture-diagram.md
│
└── README.md
