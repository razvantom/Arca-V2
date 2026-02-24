
---

## 📄 `docs/07-Security.md`

```md
# ARCA v2 — Security (RBAC + Scope + Audit)

## 1) Obiectiv
Securitatea trebuie să fie impusă în backend.
Regulă cheie: filialele nu se văd între ele.

---

## 2) Auth
- JWT access token (scurt: ex 15 min)
- Refresh token (rotație + invalidare)
- 2FA recomandat pentru Admini ARCA și conduceri (etapă ulterioară)

---

## 3) RBAC (Role Based Access Control)
Roluri:
- Admini ARCA (GLOBAL)
- Președinte/Vice/Secretar/Trezorier filială (COUNTY)
- Președinte/Vice/Secretar/Trezorier organizație (ORG)
- Membru (SELF/ORG limited)
- Simpatizant (SELF minimal)

Permisiuni:
- view/create/update/delete/approve/export/manage

---

## 4) Scope enforcement (criticul sistemului)
Scope-uri:
- GLOBAL: fără restricții
- COUNTY: doar județul atribuit
- ORG: doar organizația atribuită
- SELF: doar user-ul curent

Implementare:
- Guard de autentificare
- Guard RBAC (permisiuni)
- Guard de scope (filtrează / blochează)

Reguli:
- Nicio interogare nu trebuie să se execute fără filtrare de scope.
- Parametri precum `countyId` sau `orgId` sunt ignorați sau validați strict dacă nu e GLOBAL.

---

## 5) Data protection
- Validări input (DTO + whitelist)
- Rate limiting (login + endpoints grele)
- CORS strict
- Helmet / secure headers

---

## 6) Audit & Export Control
Audit log pentru:
- create/update/delete
- approve/reject/suspend (workflow)
- login / refresh / logout
- export (cine/ce/când/filtre folosite)
- download documente (opțional, pentru sensibil)

Export control:
- permisiune explicită `export:<module>`
- exporturile la nivel județ sunt restricționate (recomandat)

---

## 7) Document security
- Storage separat (S3/MinIO)
- Metadate în DB
- Policy per rol (cine vede ce categorie)
- (opțional) watermarking pentru PDF-uri exportate

---

## 8) GDPR / privacy (direcție)
- Minimization: colectăm doar ce trebuie
- Masking: câmpuri sensibile vizibile doar la roluri autorizate
- Retention policy + delete/anonymize (unde e legal posibil)
