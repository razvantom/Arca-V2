
---

## 📄 `docs/06-API-Standards.md`

```md
# ARCA v2 — API Standards (REST)

## 1) Principii
- REST în MVP (clar, testabil, ușor de integrat)
- Versionare: `/api/v1/...`
- Răspunsuri consistente: `data`, `meta`, `error`
- Pagination by default pentru listări mari
- Filtrare și sortare standardizate
- Scope enforcement în backend (implicit)

---

## 2) Convenții endpoint-uri
- List:    `GET    /api/v1/<resource>`
- Read:    `GET    /api/v1/<resource>/:id`
- Create:  `POST   /api/v1/<resource>`
- Update:  `PATCH  /api/v1/<resource>/:id`
- Delete:  `DELETE /api/v1/<resource>/:id`

Acțiuni workflow:
- `POST /api/v1/memberships/:id/approve`
- `POST /api/v1/memberships/:id/reject`
- `POST /api/v1/memberships/:id/suspend`

---

## 3) Pagination
Query params:
- `page` (default 1)
- `pageSize` (default 25, max 200)

Response:
- `meta.page`
- `meta.pageSize`
- `meta.total`

---

## 4) Filtering & sorting
Filtrare:
- `?search=...`
- `?status=...`
- `?countyId=...` (doar admin; la COUNTY/ORG este implicit)

Sortare:
- `?sortBy=createdAt&sortDir=desc`

---

## 5) Erori
Format recomandat:
```json
{
  "error": {
    "code": "FORBIDDEN",
    "message": "Not allowed for this scope",
    "details": []
  }
}
