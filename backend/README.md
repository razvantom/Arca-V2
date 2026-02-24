# Backend (NestJS)

## Setup (dev)
1. Pornește DB-urile:
   - `docker compose -f infrastructure/docker-compose.yml up -d`

2. Instalează dependențe:
   - `npm install`

3. Configurează `.env`:
   - `DATABASE_URL="postgresql://arca:arca@localhost:5432/arca"`

4. Prisma:
   - `npx prisma migrate dev`
   - `npx prisma generate`

5. Run:
   - `npm run start:dev`
