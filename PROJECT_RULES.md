# ARCA v2 — Project Rules (Strict)

## Data
- PostgreSQL = primary write (source of truth)
- MySQL = read-only replica via CDC
- Never dual-write from application code.

## Access control
- Filialele (județele) MUST NOT see each other.
- Scope enforcement happens in backend for every query.

## Geo registration requirement
On register, user MUST select:
- County (Județ)
- Organization/UAT
- Locality
- Polling section

Backend MUST validate chain:
- org.countyId == countyId
- locality.organizationId == orgId
- pollingSection.localityId == localityId

## Logging
- Audit log for every mutation.
- Export logging mandatory (who/what/when/filters).
