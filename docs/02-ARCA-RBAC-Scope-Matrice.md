# ARCA v2 — RBAC + Scope (Matrice roluri și acces)

## 1) Principiu
Accesul este definit de:
- **ROL** (cine e)
- **SCOPE** (unde are voie: global / județ / organizație / self)
- **PERMISIUNI** (ce are voie: view/create/edit/delete/approve/export)

Regulă-cheie: **Filialele (județele) nu se văd între ele.**  
Doar **Admini ARCA** au vizibilitate globală.

---

## 2) Scope-uri
- **GLOBAL**: vede/gestionează tot.
- **COUNTY**: vede/gestionează doar în județul său.
- **ORG**: vede/gestionează doar în organizația sa.
- **SELF**: vede doar datele proprii + interacțiuni permise (sondaje/evenimente).

---

## 3) Roluri (din aplicația existentă)
### 3.1. GLOBAL
- **Admini ARCA** (Superadmin)

### 3.2. COUNTY (Filială)
- Președinte filială
- Vicepreședinte filială
- Secretar filială
- Trezorier filială

### 3.3. ORG (Organizație)
- Președinte organizație
- Vicepreședinte organizație
- Secretar organizație
- Trezorier organizație

### 3.4. SELF
- Membru
- Simpatizant (implicit / default)

---

## 4) Module (grupate)
### A) Administrare structură
- Filiale (Județe)
- Organizații teritoriale (UAT)
- Conduceri (BPC/Filială/Organizație)
- Membri
- Adeziuni

### B) Logistică / Documente / Financiar (pe unitate)
- Documente (BPC/Filială/Organizație)
- Încasări / Cheltuieli
- Index consum
- Logistică (opțional)

### C) Activitate / Mobilizare
- Evenimente + Prezență
- Sondaje + Participare
- Proiecte (etape/notificări/discuții)
- Activități media

### D) Guvernanță / Politici
- Ministere + membri
- Comisii + membri
- Propuneri legislative
- Bibliotecă politică

### E) Admin tehnic / Audit
- Utilizatori
- Roluri & permisiuni
- Audit log / export log
- Setări globale

---

## 5) Matrice permisiuni (v1 propusă)

Legendă permisiuni:
- **R** = Read/View
- **C** = Create
- **U** = Update/Edit
- **D** = Delete
- **A** = Approve/Validate (workflow)
- **X** = Export (CSV/PDF etc.)
- **M** = Manage permissions/roles (admin)

### 5.1. Admini ARCA (GLOBAL)
- Structură: R C U D X M
- Conduceri: R C U D X
- Membri & Adeziuni: R C U D A X
- Documente: R C U D X
- Financiar: R C U D X
- Evenimente/Sondaje/Proiecte: R C U D X
- Guvernanță: R C U D X
- Audit: R (ne-editabil)

### 5.2. Președinte filială (COUNTY)
- Structură județ: R (Filiala) | R C U (Organizații din județ) | R (alte județe: NONE)
- Conduceri: R C U (Filială + Organizații din județ) | D: opțional restricționat
- Membri & Adeziuni: R (în județ) | A (aprobare/validare) | X: DA (în județ)
- Documente filială: R C U D (în județ)
- Financiar filială: R C U D X (în județ)
- Evenimente/Sondaje: R (în județ, dacă există) | C: opțional (dacă vrei evenimente județene)
- Guvernanță: R (global read-only sau doar ce e public intern)

### 5.3. Vicepreședinte filială (COUNTY)
- Similar Președinte filială, dar:
  - A (approve) la Adeziuni: opțional (după regula ta)
  - X (export): opțional (dacă vrei control strict)

### 5.4. Secretar filială (COUNTY)
- Structură: R (județ + organizații)
- Membri: R C U (în județ)
- Adeziuni: R (în județ) | A: opțional (de regulă NU)
- Documente: R C U (în județ) | D: limitat
- Financiar: R (în județ) | C/U: de regulă NU
- Export: limitat

### 5.5. Trezorier filială (COUNTY)
- Financiar: R C U X (în județ), D: limitat
- Documente: R (în județ) + upload doar la financiar
- Membri: R (în județ) (fără edit, în mod normal)
- Adeziuni: R (în județ) (fără approve)
- Export: DA (financiar)

---

### 5.6. Președinte organizație (ORG)
- Structură: R (organizația proprie)
- Conduceri: R C U (doar în organizație)
- Membri: R C U (doar în organizație)
- Adeziuni: R A (doar în organizație)
- Documente: R C U D (doar în organizație)
- Financiar: R C U X (doar în organizație)
- Export: DA (doar în organizație; opțional restricționat)

### 5.7. Vicepreședinte organizație (ORG)
- Similar, dar A/X pot fi opționale.

### 5.8. Secretar organizație (ORG)
- Membri: R C U (doar în organizație)
- Adeziuni: R (A: opțional)
- Documente: R C U (D limitat)
- Financiar: R (fără edit)

### 5.9. Trezorier organizație (ORG)
- Financiar: R C U X (doar în organizație)
- Documente: R + upload financiar
- Membri: R (fără edit)
- Adeziuni: R (fără approve)

---

### 5.10. Membru (SELF/ORG)
- SELF: R/U profil propriu (limitat)
- ORG: R (anunțuri/documente publice interne ale organizației)
- Evenimente: R + confirmare prezență (dacă e permis)
- Sondaje: R + participare
- Documente: R (doar cele permise membrilor)
- Financiar: NONE
- Export: NONE

### 5.11. Simpatizant (SELF)
- SELF: R/U profil minim (limitat)
- Evenimente: R + prezență (dacă e permis)
- Sondaje: R + participare (dacă e permis)
- Acces la restul: NONE

---

## 6) Reguli obligatorii în backend (scope enforcement)
- Orice listare/afișare este filtrată automat:
  - COUNTY: doar județul atașat rolului
  - ORG: doar organizația atașată rolului
  - SELF: doar user_id curent
- Nicio filtrare “doar în UI” — totul se impune la nivel de API.

---

## 7) Audit & Export control (recomandat obligatoriu)
- Log pentru:
  - accesare listări sensibile
  - export (cine/ce/când)
  - modificări (before/after)
- Dreptul de export să fie explicit și rar (în special la nivel județ).
