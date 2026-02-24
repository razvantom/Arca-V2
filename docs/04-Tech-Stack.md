# ARCA v2 — Tech Stack (Decizie oficială)

## 1) Rezumat
ARCA v2 va fi construită ca o platformă multi-client (Web + Android + iOS) cu un singur backend API.

Stack ales:
- Backend: **NestJS (TypeScript)**
- ORM / Migrations: **Prisma**
- Web: **Next.js**
- Mobile: **React Native (Expo)**
- DB Primary: **PostgreSQL**
- DB Replica (read-only / hot backup): **MySQL**
- Data redundancy: **CDC (Debezium + event pipeline)**

---

## 2) Motivație (de ce acest stack)
- Un singur limbaj (TypeScript) pe backend + web + (aproape tot) mobile → viteză mare de dezvoltare.
- NestJS oferă structură enterprise (module, DI, guards) → ideal pentru RBAC + scope enforcement.
- Next.js → admin dashboard + SSR când e util.
- React Native (Expo) → livrare rapidă pe Android/iOS și notificări push.
- Postgres ca primary → tranzacții solide + replicare logică bună + JSONB.
- MySQL ca replica → backup hot + BI/read workloads separate.

---

## 3) Componente
### 3.1 Backend
- NestJS API (REST în MVP)
- Module MVP: auth, users, roles, scope, counties, organizations, memberships, leadership, documents, finance, audit
- Validation: class-validator
- Auth: JWT access + refresh (rotație refresh)
- Guards: RBAC + ScopeGuard (obligatoriu pe toate endpoint-urile)

### 3.2 Web
- Next.js App
- UI: (alegere în etapa UI) shadcn/ui sau MUI
- Auth: cookie-based session sau token storage (decidem în Security doc)
- Pagini principale: dashboard, filiale, organizații, membri, adeziuni, documente, financiar, rapoarte, admin

### 3.3 Mobile
- React Native Expo
- Focus inițial: login, profil, sondaje, evenimente (check-in), notificări, documente relevante
- Navigație: React Navigation
- Push: Expo Notifications (MVP) → ulterior Firebase/APNs direct dacă e nevoie

---

## 4) Baze de date & redundanță
- PostgreSQL: primary write (source of truth)
- MySQL: replica read-only / hot backup
- Replicare: CDC (Debezium) + pipeline evenimente (Etapa 3/4)

Regulă: aplicația NU scrie direct în MySQL.

---

## 5) DevOps / local dev
- Docker Compose pentru dev local:
  - postgres
  - mysql
  - (mai târziu) redpanda/kafka + debezium + consumer
- Envs:
  - backend/.env
  - web/.env.local
  - mobile/.env

---

## 6) Convenții repo
- `backend/` — NestJS API
- `web/` — Next.js
- `mobile/` — React Native (Expo)
- `infrastructure/` — docker, db, cdc, monitoring
- `docs/` — documentație decizii + arhitectură

---

## 7) Non-goals (în MVP)
- GraphQL (posibil ulterior)
- Microservicii (pornim monolit modular)
- Dual-write în două DB-uri (evităm)
