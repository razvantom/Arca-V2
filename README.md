# ARCA v2 (Web + Android + iOS)

Stack:
- Backend: NestJS + Prisma (PostgreSQL primary)
- Web: Next.js
- Mobile: React Native Expo
- Redundanță: MySQL replica (read-only) prin CDC (după MVP)

## Quick start (dev)

### 1) Pornește DB-urile
```bash
docker compose -f infrastructure/docker-compose.yml up -d
```

### 2) Backend (API)
```bash
cd backend
cp .env.example .env
npm install
npx prisma migrate dev
npm run prisma:seed
npm run start:dev
```

### 3) Web
```bash
cd web
cp .env.local.example .env.local
npm install
npm run dev
```

### 4) Mobile
```bash
cd mobile
cp .env.example .env
npm install
npx expo start
```

## Date GEO (Județe/UAT/Localități/Secții)
Fișierul Excel este inclus în:
`backend/prisma/data/Judete-UAT-SectiiVOT.xlsx`

Seed-ul îl importă în PostgreSQL.

## Docs
Vezi folderul `docs/` pentru arhitectură, RBAC/scope și redundanță.
