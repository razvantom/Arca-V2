# ARCA v2 — Piramida aplicației (Structură + Module + Legături)

## 1) Obiectiv
ARCA v2 este o platformă unificată (Web + Android + iOS) pentru organizarea unei structuri naționale pe model piramidal:

**Național (B.P.C.) → Filială (Județ) → Organizații teritoriale (UAT) → Membri**

Regulă-cheie: **Filialele NU se văd între ele.** Doar **Admini ARCA** (superadmin/global) pot vedea tot.

---

## 2) Entități nucleu (piramida)

### 2.1. Nivel Național (B.P.C.)
**Scop:** coordonare centrală + documente + financiar + conducere.

Module standard la nivel Național:
- Conducere B.P.C.
- Documente B.P.C.
- Financiar B.P.C. (Încasări / Cheltuieli / Index consum)

---

### 2.2. Nivel Filială (Județ)
**Definiție:** 1 Filială = 1 Județ  
**Scop:** organizează toate organizațiile teritoriale din județ; are propriile documente/financiar/logistică.

Module standard la nivel Filială:
- Conducere filială
- Documente filială
- Financiar filială (Încasări / Cheltuieli / Index consum)
- Logistică (opțional: inventar, sarcini, resurse)
- Administrare organizații teritoriale (UAT) din județ

Reguli:
- Filiala vede doar datele din județul ei.
- Filialele între ele: **fără vizibilitate**.

---

### 2.3. Nivel Organizație teritorială (UAT)
**Definiție:** organizație locală dintr-un județ (comună / sat / oraș / sector etc.)  
**Scop:** evidență membri + conducere + documente + financiar + activitate locală.

Module standard la nivel Organizație:
- Conducere organizație
- Membri organizație
- Adeziune (workflow)
- Documente organizație
- Financiar organizație (Încasări / Cheltuieli / Index consum)
- Logistică (opțional)

Reguli:
- Organizația vede doar membrii și datele proprii.
- Organizațiile din același județ sunt vizibile **doar** pentru rolurile de filială (scope județ).

---

### 2.4. Nivel Membru / Simpatizant (persoane)
**Scop:** identitate unică + asociere la organizație + participare la evenimente/sondaje + profil.

Tipuri:
- Membru (asociat unei organizații)
- Simpatizant (poate fi neasociat / asociere light)

Workflow:
- Adeziune: (Nou) → (În verificare) → (Aprobat) / (Respins) / (Suspendat)

---

## 3) Nuclee de referință (conectoare)
### 3.1. Utilizator (Identitate)
- Utilizatorul este identitatea centrală.
- Rolurile (conducere, membru) sunt “atriburi/assignments” ale utilizatorului.

### 3.2. Localități / UAT / Județe
- Toate entitățile operaționale trebuie să fie legate de Județ și/sau UAT pentru filtrare corectă și rapoarte.

---

## 4) Module transversale (nu țin de un singur nivel)
Aceste module au legături către persoane și/sau unități (național/filială/organizație):

### 4.1. Proiecte
- Proiecte în derulare
  - Etape proiect
  - Notificări
  - Discuții

### 4.2. Evenimente
- Evenimente naționale (și opțional evenimente județene/locale)
  - Prezență eveniment (check-in / listă participanți / status)

### 4.3. Sondaje
- Sondaje
  - Participă (răspunsuri / status completare)

### 4.4. Media
- Activități media (campanii / comunicare / acțiuni)

### 4.5. Guvernanță / Politici publice
- Ministere
  - Membrii minister
- Comisii
  - Membrii comisie
- Propuneri legislative
- Bibliotecă politică

---

## 5) Model de date recomandat (standardizare pentru repetare)
Pentru a evita 3 seturi separate de tabele (național/filială/organizație), se recomandă conceptul de:

**UNIT (unitate)**
- tip: NATIONAL | COUNTY | ORG
- ref_id: id-ul entității reale (BPC / Filială / Organizație)

Apoi modulele standard devin:
- Documents(unit_id, ...)
- FinanceTransactions(unit_id, ...)
- ConsumptionIndex(unit_id, ...)
- LeadershipAssignments(unit_id, user_id, role, mandate_dates, ...)

---

## 6) Izolare / vizibilitate (principii)
- Toate interogările sunt filtrate pe **scope** în backend (nu doar în UI).
- Scope-uri:
  - GLOBAL (Admini ARCA)
  - COUNTY (roluri filială) — limitat la județ
  - ORG (roluri organizație) — limitat la organizație
  - SELF (membru/simpatizant) — date proprii + ce i se permite

---

## 7) Livrabile MVP (prima versiune funcțională)
MVP trebuie să includă obligatoriu:
- Auth + RBAC + scope enforcement
- Piramida: Filiale (județe) → Organizații (UAT) → Membri + Adeziune
- Conducere (filială + organizație)
- Documente pe unitate
- Financiar pe unitate (încasări/cheltuieli/index)
- Rapoarte minimale (membri pe organizație/județ; activitate financiară)

---

## 8) Platforme (Web + Android + iOS)
- Un singur backend API.
- Web: dashboard administrativ + funcții complete.
- Mobile: funcții optimizate (prezență, sondaje, notificări, acces rapid la documente esențiale).
