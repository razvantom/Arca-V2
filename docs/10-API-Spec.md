# ARCA v2 — API Spec (REST /api/v1)

Base URL:
- `/api/v1`

## 1) Auth
### POST /auth/register
Request:
```json
{
  "email": "user@example.com",
  "phone": "+407xxxxxxxx",
  "password": "StrongPassword123!",
  "firstName": "Ion",
  "lastName": "Popescu",
  "countyId": 1,
  "organizationId": 10,
  "localityId": 100,
  "pollingSectionId": 1000
}
