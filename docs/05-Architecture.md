# ARCA v2 — Architecture

## 1) Scop
ARCA v2 este o platformă multi-client (Web + Android + iOS) cu un singur backend API.
Model organizațional piramidal:
**Național (BPC) → Filială (Județ) → Organizație (UAT) → Membri**

Regulă: **filialele nu se văd între ele**; doar **Admini ARCA** au vizibilitate globală.

---

## 2) Componente
### 2.1 Backend API (NestJS)
Responsabilități:
- Auth (JWT access + refresh)
- RBAC + Scope enforcement (GLOBAL / COUNTY / ORG / SELF)
- CRUD pentru module MVP
- Workflow Adeziuni
- Audit log + export log
- Upload/download documente (S3 compatible / MinIO în dev)
- Integrare notificări (mai târziu)

### 2.2 Web App (Next.js)
Scop: administrare completă + rapoarte + dashboard.
- Interfață pentru Admini ARCA, roluri filială, roluri organizație.

### 2.3 Mobile App (React Native Expo)
Scop: operațiuni rapide:
- autentificare
- profil
- evenimente (prezență / check-in)
- sondaje (participare)
- notificări
- acces documente relevante

### 2.4 Data layer
- PostgreSQL = primary write (source of truth)
- MySQL = replica read-only (hot backup / analytics)
- CDC pipeline: Debezium → event stream → consumer → MySQL (implementat după MVP core)

---

## 3) Module backend (monolit modular)
### Core
- auth
- users
- roles-permissions
- scope
- audit

### Piramidă
- counties (filiale/județe)
- organizations (UAT)
- memberships (membri + adeziuni)
- leadership (conduceri)

### Logistică (pe unitate)
- documents
- finance (încasări/cheltuieli/index)
- logistics (opțional)

### Activitate
- events (+ attendance)
- surveys (+ participation)
- projects

### Guvernanță
- governance (ministere, comisii, propuneri, bibliotecă)

---

## 4) Principii critice
### 4.1 Scope enforcement în backend
Nu există “security by UI”.
Toate endpoint-urile verifică scope-ul și filtrează automat datele.

### 4.2 Audit by default
Orice acțiune relevantă (create/update/delete/approve/export) este logată.
Exporturile sunt logate explicit.

### 4.3 Separarea responsabilităților
- Web = funcții complete
- Mobile = funcții esențiale + UX rapid
- Backend = singurul loc unde se aplică regulile de acces și business logic

---

## 5) Deployment (direcție)
- dev: docker compose (postgres, mysql, minio)
- staging: same stack + CDC opțional
- prod: postgres primary + cdc + mysql replica + object storage + monitoring

---

## 6) MVP scope (fazat)
### MVP 1 (Structură + oameni + acces)
- Auth + RBAC + scope
- Filiale (județe)
- Organizații (UAT)
- Membri + Adeziuni (workflow)
- Conduceri

### MVP 2 (logistică)
- Documente (unitate)
- Financiar (unitate)

### MVP 3 (activitate)
- Evenimente + prezență
- Sondaje + participare
- Proiecte

### MVP 4 (guvernanță)
- Ministere, comisii, propuneri, bibliotecă

---

## 7) Observabilitate
- audit logs în DB
- request logging (fără date sensibile)
- metrics (prometheus) + dashboard (grafana) ulterior
