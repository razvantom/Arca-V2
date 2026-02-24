# ARCA v2 — Architecture Diagram

```mermaid
flowchart TB
  subgraph Clients
    W[Web (Next.js)]
    M[Mobile (React Native Expo)]
  end

  subgraph Backend
    API[NestJS API]
    AUTH[Auth + RBAC + Scope Guards]
    AUDIT[Audit + Export Log]
    MODS[Modules: counties/orgs/memberships/leadership/docs/finance/...]
  end

  subgraph Data
    PG[(PostgreSQL PRIMARY)]
    CDC[CDC: Debezium + Event Stream]
    MY[(MySQL REPLICA - read-only)]
    OBJ[(Object Storage: S3/MinIO)]
  end

  W --> API
  M --> API

  API --> AUTH
  API --> MODS
  API --> AUDIT

  MODS --> PG
  AUDIT --> PG

  API --> OBJ

  PG --> CDC --> MY
