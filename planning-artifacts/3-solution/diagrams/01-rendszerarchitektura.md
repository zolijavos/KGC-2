# KGC ERP - Rendszerarchitektúra Diagram

**Diagram típus:** Technikai Architektúra (Rétegelt)
**Verzió:** 2.0
**Dátum:** 2025-12-20

---

## Teljes Rendszerarchitektúra (Layered Architecture)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│                         PREZENTÁCIÓS RÉTEG                                  │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │                    KGC Admin UI (React + TypeScript)                  │ │
│  │                                                                       │ │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐ │ │
│  │  │ Unified  │  │ Partner  │  │ Support  │  │HR Admin  │  │   Chat   │ │ │
│  │  │Dashboard │  │ Detail   │  │ Tickets  │  │          │  │  Widget  │ │ │
│  │  │          │  │          │  │          │  │          │  │          │ │ │
│  │  │ (Natív)  │  │(iframe)  │  │(iframe)  │  │(iframe)  │  │(Natív)   │ │ │
│  │  │          │  │          │  │          │  │          │  │          │ │ │
│  │  │• 5 rdsz. │  │• Twenty  │  │• Chatwoot│  │• Horilla │  │• WebSock │ │ │
│  │  │  API     │  │  CRM     │  │  Support │  │  HR      │  │• Valós   │ │ │
│  │  │  aggr.   │  │          │  │          │  │          │  │  idejű   │ │ │
│  │  │• KPI-k   │  │          │  │          │  │          │  │          │ │ │
│  │  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘ │ │
│  │         │                 │                 │                │       │ │
│  └─────────┼─────────────────┼─────────────────┼────────────────┼───────┘ │
│            │                 │                 │                │         │
└────────────┼─────────────────┼─────────────────┼────────────────┼─────────┘
             │                 │                 │                │
             │   API Calls     │  iframe embed   │ iframe embed   │ WS conn
             │   (REST/GQL)    │  (SSO token)    │ (SSO token)    │
             │                 │                 │                │
             ▼                 ▼                 ▼                ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│                         ALKALMAZÁS RÉTEG                                    │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    KGC Backend (NestJS + TypeScript)                │   │
│  │                                                                     │   │
│  │  ┌────────────────────────────────────────────────────────────────┐│   │
│  │  │                    API Gateway Layer                           ││   │
│  │  │                                                                ││   │
│  │  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐  ││   │
│  │  │  │ GraphQL  │  │   REST   │  │ WebSocket│  │     SSO      │  ││   │
│  │  │  │  Server  │  │   API    │  │  Gateway │  │   Service    │  ││   │
│  │  │  │          │  │          │  │          │  │              │  ││   │
│  │  │  │ • Schema │  │ • CRUD   │  │ • Socket │  │ • JWT issue  │  ││   │
│  │  │  │ • Resolver│ │ • Filter │  │   rooms  │  │ • Token      │  ││   │
│  │  │  │ • Type   │  │ • Paging │  │ • Events │  │   validation │  ││   │
│  │  │  └──────────┘  └──────────┘  └──────────┘  └──────────────┘  ││   │
│  │  └────────────────────────────────────────────────────────────────┘│   │
│  │                                                                     │   │
│  │  ┌────────────────────────────────────────────────────────────────┐│   │
│  │  │                    Business Logic Layer                        ││   │
│  │  │                                                                ││   │
│  │  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐  ││   │
│  │  │  │ Bérlés   │  │ Szerviz  │  │ Áruház   │  │   Finance    │  ││   │
│  │  │  │ Module   │  │ Module   │  │ Module   │  │   Module     │  ││   │
│  │  │  │          │  │          │  │          │  │              │  ││   │
│  │  │  │ • Díjak  │  │ • Munka- │  │ • Készlet│  │ • Teljesítés │  ││   │
│  │  │  │ • Bérlők │  │   lapok  │  │ • Árak   │  │ • ÁFA tábla  │  ││   │
│  │  │  │ • Gépek  │  │ • Javítás│  │ • Rendelés│ │ • Leltár    │  ││   │
│  │  │  └──────────┘  └──────────┘  └──────────┘  │ • Zárás      │  ││   │
│  │  │                                             │ • Számlázz.hu│  ││   │
│  │  │                                             │   adapter    │  ││   │
│  │  │                                             └──────────────┘  ││   │
│  │  └────────────────────────────────────────────────────────────────┘│   │
│  │                                                                     │   │
│  │  ┌────────────────────────────────────────────────────────────────┐│   │
│  │  │                Integration Adapter Layer                       ││   │
│  │  │                                                                ││   │
│  │  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐  ││   │
│  │  │  │ Twenty   │  │ Chatwoot │  │ Horilla  │  │ Számlázz.hu  │  ││   │
│  │  │  │ Adapter  │  │ Adapter  │  │ Adapter  │  │  Adapter     │  ││   │
│  │  │  │          │  │          │  │          │  │              │  ││   │
│  │  │  │ • GraphQL│  │ • REST   │  │ • REST   │  │ • SOAP API   │  ││   │
│  │  │  │ • Person │  │ • Contact│  │ • Employee│ │ • Invoice    │  ││   │
│  │  │  │ • Deal   │  │ • Ticket │  │ • Leave  │  │ • NAV XML    │  ││   │
│  │  │  └──────────┘  └──────────┘  └──────────┘  └──────────────┘  ││   │
│  │  └────────────────────────────────────────────────────────────────┘│   │
│  │                                                                     │   │
│  │  ┌────────────────────────────────────────────────────────────────┐│   │
│  │  │               Synchronization Service (Cron)                   ││   │
│  │  │                                                                ││   │
│  │  │  • Partner sync job (5 perc) → Twenty + Chatwoot              ││   │
│  │  │  • Dolgozó sync job (5 perc) → Horilla                        ││   │
│  │  │  • Dashboard cache refresh (1 perc) → 5 rendszer aggregáció   ││   │
│  │  │  • Retry queue processor (1 perc) → Failed sync-ek újrapróbája││   │
│  │  └────────────────────────────────────────────────────────────────┘│   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │   Twenty     │  │  Chatwoot    │  │  Horilla HR  │  │ Számlázz.hu  │   │
│  │   (Fork)     │  │   (Fork)     │  │   (Fork)     │  │  (External)  │   │
│  │              │  │              │  │              │  │              │   │
│  │ • TypeScript │  │ • Ruby/Rails │  │ • Python/Dj. │  │ • Cloud SaaS │   │
│  │ • GraphQL API│  │ • REST API   │  │ • REST API   │  │ • SOAP/REST  │   │
│  │ • Modified   │  │ • Modified   │  │ • Modified   │  │ • NAV API 3.0│   │
│  │   theme (KGC)│  │   theme (KGC)│  │   theme (KGC)│  │              │   │
│  │ • SSO ✓      │  │ • SSO ✓      │  │ • SSO ✓      │  │ • API auth   │   │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
             │                 │                 │                │
             │ SQL queries     │ SQL queries     │ SQL queries    │ HTTPS
             │                 │                 │                │
             ▼                 ▼                 ▼                ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│                            ADAT RÉTEG                                       │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │                         PostgreSQL 15                                 │ │
│  │                   (Single Instance, Multi-Schema)                     │ │
│  │                                                                       │ │
│  │  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐  ┌─────┐│ │
│  │  │  kgc schema    │  │ twenty schema  │  │chatwoot schema │  │horil││ │
│  │  │                │  │                │  │                │  │la   ││ │
│  │  │ Tables:        │  │ Tables:        │  │ Tables:        │  │schem││ │
│  │  │ • partners     │  │ • persons      │  │ • contacts     │  │a    ││ │
│  │  │ • users        │  │ • deals        │  │ • conversations│  │     ││ │
│  │  │ • berlesek     │  │ • activities   │  │ • messages     │  │Table││ │
│  │  │ • szervizek    │  │ • pipelines    │  │ • teams        │  │s:   ││ │
│  │  │ • cikkek       │  │                │  │                │  │• emp││ │
│  │  │ • szamlak      │  │                │  │                │  │loy. ││ │
│  │  │                │  │                │  │                │  │• lea││ │
│  │  │ External IDs:  │  │                │  │                │  │ve   ││ │
│  │  │ • twenty_id    │  │                │  │                │  │• att││ │
│  │  │ • chat_id      │  │                │  │                │  │end. ││ │
│  │  │ • horilla_id   │  │                │  │                │  │     ││ │
│  │  └────────────────┘  └────────────────┘  └────────────────┘  └─────┘│ │
│  │                                                                       │ │
│  │  Connection Pool (pgBouncer):                                        │ │
│  │  • Max connections: 200                                              │ │
│  │  • Pool mode: transaction                                            │ │
│  │                                                                       │ │
│  │  Backup Strategy:                                                    │ │
│  │  • Full backup: Napi (2:00 AM)                                       │ │
│  │  • Incremental: 6 óránként                                           │ │
│  │  • Retention: 30 nap (Wasabi S3)                                     │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│                       INFRASTRUKTÚRA RÉTEG                                  │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │                    Docker Compose (Hetzner VPS)                       │ │
│  │                   8 vCPU, 32GB RAM, 500GB NVMe SSD                    │ │
│  │                                                                       │ │
│  │  Containers:                                                          │ │
│  │  • kgc-backend (NestJS)        - Port 3000                            │ │
│  │  • kgc-frontend (React)        - Port 80/443 (Nginx)                  │ │
│  │  • twenty-server               - Port 3001                            │ │
│  │  • chatwoot-server             - Port 3002                            │ │
│  │  • horilla-server              - Port 3003                            │ │
│  │  • postgres                    - Port 5432                            │ │
│  │  • redis (cache)               - Port 6379                            │ │
│  │  • nginx (reverse proxy)       - Port 80/443                          │ │
│  │                                                                       │ │
│  │  Networks:                                                            │ │
│  │  • frontend-net (public)                                              │ │
│  │  • backend-net (internal)                                             │ │
│  │  • database-net (internal)                                            │ │
│  │                                                                       │ │
│  │  Volumes:                                                             │ │
│  │  • postgres-data (persistent)                                         │ │
│  │  • redis-data (persistent)                                            │ │
│  │  • uploads (shared NFS)                                               │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │                      Monitoring & Logging                             │ │
│  │                                                                       │ │
│  │  • Uptime Robot (external)                                            │ │
│  │  • Docker logs → Loki (retention: 7 nap)                              │ │
│  │  • Metrics: Prometheus + Grafana                                      │ │
│  │  • Alerting: Email + SMS (kritikus hibák)                             │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Komponens Kapcsolatok

### API Kommunikáció

| Forrás | Cél | Protokoll | Auth | Payload |
|--------|-----|-----------|------|---------|
| KGC Frontend | KGC Backend | REST/GraphQL | JWT | JSON |
| KGC Backend | Twenty | GraphQL | API Key | JSON |
| KGC Backend | Chatwoot | REST | API Token | JSON |
| KGC Backend | Horilla | REST | API Token | JSON |
| KGC Backend | Számlázz.hu | SOAP/REST | Agent Key | XML/JSON |
| KGC Frontend | Twenty (iframe) | iframe | SSO Token | - |
| KGC Frontend | Chatwoot (iframe) | iframe | SSO Token | - |
| KGC Frontend | Horilla (iframe) | iframe | SSO Token | - |
| KGC Frontend | KGC Backend (Chat) | WebSocket | JWT | JSON |

### Adatfolyam Irányok

```
Partner adatok:
KGC → Twenty (5 perc sync)
KGC → Chatwoot (5 perc sync)

Dolgozó adatok:
KGC → Horilla (5 perc sync)

Számla adatok:
KGC ↔ Számlázz.hu (valós idejű)

Chat üzenetek:
KGC ↔ KGC (WebSocket, valós idejű)

Dashboard adatok:
Twenty → KGC (1 perc cache)
Chatwoot → KGC (1 perc cache)
Horilla → KGC (1 perc cache)
Számlázz.hu → KGC (1 perc cache)
```

---

## Skálázhatósági Megfontolások

### Horizontális Skálázás

```
┌─────────────────────────────────────────┐
│         Load Balancer (Nginx)           │
└────────┬────────────┬────────────┬──────┘
         │            │            │
         ▼            ▼            ▼
    ┌────────┐   ┌────────┐   ┌────────┐
    │ KGC    │   │ KGC    │   │ KGC    │
    │Backend │   │Backend │   │Backend │
    │ Node 1 │   │ Node 2 │   │ Node 3 │
    └────────┘   └────────┘   └────────┘
         │            │            │
         └────────────┼────────────┘
                      ▼
              ┌────────────────┐
              │   PostgreSQL   │
              │   (Primary)    │
              └────────┬───────┘
                       │ Replication
                       ▼
              ┌────────────────┐
              │   PostgreSQL   │
              │   (Replica)    │
              │   (Read-only)  │
              └────────────────┘
```

**100+ felhasználó esetén:**
- 3 KGC Backend node (load balanced)
- PostgreSQL read replica (dashboard queries)
- Redis cluster (cache)
- CDN (static assets - Cloudflare)

---

**Készítette:** Winston (Architect)
**Verzió:** 2.0
**Dátum:** 2025-12-20
