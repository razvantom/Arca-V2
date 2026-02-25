# Backend (NestJS + Prisma)

## Cerințe
- Node.js 18+
- Docker

## 1) Pornește bazele de date (dev)
Din rădăcina repo:
```bash
docker compose -f infrastructure/docker-compose.yml up -d
```

## 2) Config `.env`
În `backend/`, copiază:
```bash
cp .env.example .env
```

## 3) Instalează dependențe
```bash
cd backend
npm install
```

## 4) Migrate + Seed (Județe/UAT/Localități/Secții de votare + SUPER_ADMIN)
Excel-ul trebuie să fie în:
`backend/prisma/data/Judete-UAT-SectiiVOT.xlsx`

Apoi:
```bash
npx prisma migrate dev
npm run prisma:seed
```

Seed-ul creează și un utilizator admin implicit:
- email: `admin@arca.local`
- parolă: `Admin123!`
- rol: `SUPER_ADMIN` (scope `GLOBAL`)

## 5) Rulează API
```bash
npm run start:dev
```

## Endpoints utile
- Health: `GET /api/v1/health`
- Județe: `GET /api/v1/geo/counties`
- UAT din județ: `GET /api/v1/geo/counties/:countyId/organizations`
- Localități din UAT: `GET /api/v1/geo/organizations/:orgId/localities`
- Secții din localitate: `GET /api/v1/geo/localities/:localityId/polling-sections`

## Auth (MVP)
- Register: `POST /api/v1/auth/register` (setează județ/UAT/localitate/secție)
- Login: `POST /api/v1/auth/login`
