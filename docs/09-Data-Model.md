# ARCA v2 — Data Model

## 1) Overview (Piramidă)
Structură:
**BPC (Național) → Filială (Județ) → Organizație (UAT) → Membru**

Reguli:
- 1 Filială = 1 Județ
- Organizațiile (UAT) aparțin unui județ
- Membrii aparțin unei organizații
- Filialele nu se văd între ele (scope enforced în backend)

---

## 2) Identitate (User)
### User
- id (uuid)
- email (optional, unique)
- phone (optional, unique)
- passwordHash
- firstName, lastName
- status: ACTIVE/SUSPENDED
- timestamps

### UserProfile (geo obligatoriu)
- userId (PK/FK)
- countyId
- organizationId (UAT)
- localityId
- pollingSectionId
- timestamps

Regulă: UserProfile se completează la REGISTER.

Validări:
- organization.countyId == countyId
- locality.organizationId == organizationId
- pollingSection.localityId == localityId

---

## 3) Acces (RBAC + Scope)
### Role
- key (ex: ADMIN_ARCA, COUNTY_PRESIDENT, ORG_TREASURER, MEMBER, SUPPORTER)
- name
- scopeType: GLOBAL/COUNTY/ORG/SELF
- sortOrder

### AccessAssignment (cine ce rol are și unde)
- userId
- roleId
- countyId (optional; obligatoriu pentru roluri COUNTY)
- organizationId (optional; obligatoriu pentru roluri ORG)
- startAt, endAt

Reguli:
- GLOBAL → fără countyId/orgId
- COUNTY → are countyId
- ORG → are organizationId
- SELF → fără scope binding (implicit user)

---

## 4) Geo (din Excel)
### County
- id
- name
- slug

### Organization (UAT)
- id
- countyId
- siruta (optional)
- name

### Locality
- id
- organizationId
- name

### PollingSection
- id
- localityId
- number
- code (optional)
- name

---

## 5) Membership / Adeziune
### Membership
- id (uuid)
- userId
- organizationId
- status: PENDING/ACTIVE/REJECTED/SUSPENDED
- appliedAt
- approvedAt (optional)
- approvedById (optional)

Reguli:
- la REGISTER: se creează Membership PENDING pentru organizația aleasă
- la APPROVE: devine ACTIVE + approvedAt/by + se acordă rol MEMBER

---

## 6) Leadership (Conduceri)
### LeadershipAssignment
- id (uuid)
- userId
- unitType: NATIONAL/COUNTY/ORG
- countyId (optional)
- organizationId (optional)
- function: PRESIDENT/VICE_PRESIDENT/SECRETARY/TREASURER
- startAt, endAt

---

## 7) Unit modules (repetate pe niveluri)
Recomandare: folosim conceptul de UNIT (unitate operațională), implementat în cod prin:
- unitType + countyId/orgId (sau bpc singleton)

Module standard pe unitate:
- Documents
- FinanceTransactions (income/expense)
- ConsumptionIndex
- Logistics (opțional)

---

## 8) Audit
### AuditLog
- id
- actorUserId
- action (string: CREATE/UPDATE/DELETE/APPROVE/EXPORT/LOGIN...)
- entity (string)
- entityId (string optional)
- scopeType (GLOBAL/COUNTY/ORG/SELF)
- countyId/orgId (optional)
- meta (JSON) — details, filters, ip, userAgent
- createdAt

Obligatoriu pentru:
- orice mutation
- workflow actions
- export
