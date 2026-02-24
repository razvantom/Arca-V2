# ARCA v2 — Data Redundancy Strategy
## Varianta recomandată: Primary PostgreSQL + MySQL Replica (CDC)

---

## 1) Obiectiv

Asigurarea redundanței datelor, continuității operaționale și posibilității de fallback rapid,
fără a compromite consistența tranzacțională.

Strategia adoptată:

- PostgreSQL = PRIMARY (source of truth, write database)
- MySQL = REPLICA (read-only, hot backup)
- Replicare prin CDC (Change Data Capture) / event pipeline

---

## 2) Arhitectura generală

Client (Web / Android / iOS)
        |
        v
Backend API
        |
        v
PostgreSQL (PRIMARY WRITE DB)
        |
        v
CDC / Event Stream
        |
        v
MySQL (READ-ONLY REPLICA / HOT BACKUP)

---

## 3) Principiu fundamental

Există un singur "source of truth":
→ PostgreSQL

Toate operațiunile de:
- create
- update
- delete
- approve
- workflow

se execută EXCLUSIV în PostgreSQL.

MySQL nu este scris direct de aplicație.

---

## 4) Replicare prin CDC (Change Data Capture)

### 4.1. Ce este CDC?

CDC = mecanism care detectează modificările din PostgreSQL
și le transmite către un pipeline de replicare.

Opțiuni tehnice recomandate:
- Debezium + Kafka
- Logical replication + custom worker
- Outbox Pattern + message broker
- AWS DMS / cloud CDC (dacă e infrastructură cloud)

---

## 5) Flux de replicare

1. User face o acțiune (ex: creează membru)
2. Backend scrie în PostgreSQL
3. PostgreSQL generează event (logical replication)
4. CDC capturează modificarea
5. Worker aplică modificarea în MySQL
6. MySQL devine copie sincronizată (eventual cu delay minim)

---

## 6) Avantaje ale acestei strategii

### 6.1. Consistență ridicată
- Nu există dual-write direct din aplicație.
- Nu apar conflicte între baze.

### 6.2. Fallback rapid
Dacă PostgreSQL cade:
- MySQL poate fi promovat temporar ca PRIMARY.
- Se redirecționează conexiunile.
- Se poate sincroniza înapoi ulterior.

### 6.3. Audit simplificat
- Toate modificările trec printr-un singur punct (PostgreSQL).
- Logurile sunt centralizate.
- CDC oferă trasabilitate completă.

### 6.4. Backup hot permanent
MySQL poate funcționa ca:
- read-only analytics DB
- backup operațional live
- bază pentru BI / rapoarte grele

---

## 7) Ce NU facem (important)

❌ Nu implementăm dual-write din backend.
❌ Nu scriem simultan în ambele DB-uri.
❌ Nu permitem aplicației să scrie direct în MySQL.

---

## 8) Strategia de fallback

Scenariu: PostgreSQL indisponibil.

Pași:
1. Se blochează temporar scrierile.
2. Se verifică sincronizarea finală MySQL.
3. Se promovează MySQL la PRIMARY.
4. Se actualizează connection string în backend.
5. Se reconfigurează CDC în sens invers (opțional).

Revenirea:
- PostgreSQL se restaurează.
- Se resincronizează datele.
- Se repune ca PRIMARY.

---

## 9) Politica de backup

Pe lângă replicare:

- Backup zilnic complet PostgreSQL
- Backup incremental la 15-30 min (WAL archiving)
- Snapshot săptămânal MySQL
- Retenție minim 30 zile

---

## 10) Recomandare tehnică finală

PostgreSQL este ales ca PRIMARY deoarece:
- suportă mai bine JSONB
- are replicare logică matură
- are consistență tranzacțională solidă
- este mai robust pentru sisteme complexe (RBAC + audit + relații adânci)

MySQL rămâne:
- bază de redundanță
- bază pentru analytics
- fallback operațional

---

## 11) Concluzie

Strategia oferă:

✔ Consistență ridicată  
✔ Siguranță operațională  
✔ Posibilitate de disaster recovery  
✔ Scalabilitate viitoare  
✔ Separare clară între write și read  

Aceasta este arhitectura recomandată pentru ARCA v2.
