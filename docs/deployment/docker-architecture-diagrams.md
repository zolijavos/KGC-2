# KGC ERP - Docker Architektúra Vizualizációk

**3 különböző formátumban ugyanaz a Docker architektúra**

---

## 1️⃣ Mermaid.js Diagram (GitHub Native Rendering)

### Docker Compose Services Áttekintés

```mermaid
graph TB
    subgraph "Internet"
        USER[👤 User Browser]
    end

    subgraph "Hostinger VPS"
        subgraph "Frontend Network"
            NGINX[🌐 Nginx Reverse Proxy<br/>:80, :443]
            FRONTEND[⚛️ KGC Frontend<br/>React + Vite<br/>:5173]
        end

        subgraph "Backend Network"
            BACKEND[🔧 KGC Backend<br/>NestJS + TypeScript<br/>:3000]
            POSTGRES[(🗄️ PostgreSQL 15<br/>:5432<br/>4 Schemas)]
            REDIS[(💾 Redis 7<br/>:6379<br/>Cache + Session)]
        end

        subgraph "Volumes"
            VOL_PG[📦 postgres_data]
            VOL_REDIS[📦 redis_data]
            VOL_UPLOADS[📦 uploads]
        end
    end

    USER -->|HTTPS| NGINX
    NGINX -->|Proxy| FRONTEND
    NGINX -->|/api| BACKEND

    FRONTEND -->|API Calls| BACKEND
    BACKEND -->|SQL| POSTGRES
    BACKEND -->|Cache| REDIS

    POSTGRES -.->|Persist| VOL_PG
    REDIS -.->|Persist| VOL_REDIS
    BACKEND -.->|Store Files| VOL_UPLOADS

    classDef network fill:#e1f5ff,stroke:#0288d1,stroke-width:2px
    classDef service fill:#fff3e0,stroke:#f57c00,stroke-width:2px
    classDef data fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px
    classDef volume fill:#e8f5e9,stroke:#388e3c,stroke-width:2px

    class NGINX,FRONTEND network
    class BACKEND,POSTGRES,REDIS service
    class VOL_PG,VOL_REDIS,VOL_UPLOADS volume
```

---

### Docker Compose Dependencies (Függőségi Fa)

```mermaid
graph TD
    COMPOSE[docker-compose.yml]

    COMPOSE --> PG[postgres]
    COMPOSE --> REDIS[redis]
    COMPOSE --> BACKEND[kgc-backend]
    COMPOSE --> FRONTEND[kgc-frontend]
    COMPOSE --> NGINX[nginx]

    BACKEND -.depends_on.-> PG
    BACKEND -.depends_on.-> REDIS
    FRONTEND -.depends_on.-> BACKEND
    NGINX -.depends_on.-> FRONTEND

    PG --> VOL_PG[postgres_data volume]
    REDIS --> VOL_REDIS[redis_data volume]

    classDef compose fill:#ffeb3b,stroke:#f57f17,stroke-width:3px
    classDef service fill:#e3f2fd,stroke:#1976d2,stroke-width:2px
    classDef volume fill:#c8e6c9,stroke:#388e3c,stroke-width:2px

    class COMPOSE compose
    class PG,REDIS,BACKEND,FRONTEND,NGINX service
    class VOL_PG,VOL_REDIS volume
```

---

### Network Isolation (Hálózati Elkülönítés)

```mermaid
graph LR
    subgraph "frontend network"
        NGINX[nginx]
        FRONTEND[kgc-frontend]
        BACKEND_F[kgc-backend]
    end

    subgraph "backend network"
        BACKEND_B[kgc-backend]
        POSTGRES[postgres]
        REDIS[redis]
    end

    NGINX --> FRONTEND
    NGINX --> BACKEND_F
    FRONTEND --> BACKEND_F

    BACKEND_B --> POSTGRES
    BACKEND_B --> REDIS

    BACKEND_F -.same container.-> BACKEND_B

    classDef frontend fill:#e1f5ff,stroke:#0288d1,stroke-width:2px
    classDef backend fill:#fff3e0,stroke:#f57c00,stroke-width:2px

    class NGINX,FRONTEND,BACKEND_F frontend
    class BACKEND_B,POSTGRES,REDIS backend
```

---

### Deployment Lifecycle (docker-compose parancsok)

```mermaid
sequenceDiagram
    participant Dev as 👨‍💻 Developer
    participant Docker as 🐳 Docker Engine
    participant Containers as 📦 Containers
    participant Volumes as 💾 Volumes

    Note over Dev,Volumes: docker compose up -d

    Dev->>Docker: docker compose up -d
    Docker->>Docker: Parse docker-compose.yml
    Docker->>Volumes: Create volumes (if not exist)
    Docker->>Docker: Pull images (postgres, redis, etc)
    Docker->>Containers: Create containers
    Docker->>Containers: Start containers (dependency order)
    Containers->>Dev: ✅ All services running

    Note over Dev,Volumes: docker compose down

    Dev->>Docker: docker compose down
    Docker->>Containers: Stop containers
    Docker->>Containers: Remove containers
    Volumes->>Volumes: ✅ Data persists!
    Docker->>Dev: ✅ Cleanup complete

    Note over Dev,Volumes: docker compose restart

    Dev->>Docker: docker compose restart
    Docker->>Containers: Restart containers (quick)
    Containers->>Dev: ✅ Restarted (data intact)
```

---

## 2️⃣ ASCII Diagram (Terminal-Friendly)

### Teljes Architektúra

```
┌─────────────────────────────────────────────────────────────────────┐
│                    HOSTINGER VPS SZERVER                            │
│                     (Ubuntu 22.04 LTS)                              │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │                    DOCKER ENGINE                              │ │
│  │                                                               │ │
│  │  ┌─────────────────────────────────────────────────────────┐ │ │
│  │  │              FRONTEND NETWORK (bridge)                  │ │ │
│  │  │                                                         │ │ │
│  │  │  ┌──────────┐        ┌──────────┐        ┌─────────┐  │ │ │
│  │  │  │  NGINX   │───────→│   KGC    │───────→│  KGC    │  │ │ │
│  │  │  │  Proxy   │  HTTP  │ Frontend │  HTTP  │ Backend │  │ │ │
│  │  │  │          │        │          │        │         │  │ │ │
│  │  │  │ Port: 80 │        │Port: 5173│        │Port:3000│  │ │ │
│  │  │  │     443  │        │          │        │         │  │ │ │
│  │  │  └────┬─────┘        └──────────┘        └────┬────┘  │ │ │
│  │  │       │                                        │       │ │ │
│  │  │       │ SSL/TLS                    ┌───────────┘       │ │ │
│  │  │       │ Let's Encrypt              │                   │ │ │
│  │  └───────┼────────────────────────────┼───────────────────┘ │ │
│  │          │                            │                     │ │
│  │          │                            ▼                     │ │
│  │  ┌───────┼────────────────────────────────────────────────┐ │ │
│  │  │       │       BACKEND NETWORK (bridge)                 │ │ │
│  │  │       │                                                │ │ │
│  │  │       │       ┌───────────┐        ┌──────────┐       │ │ │
│  │  │       └──────→│ PostgreSQL│◄───────│  Redis   │       │ │ │
│  │  │               │    DB     │        │  Cache   │       │ │ │
│  │  │               │           │        │          │       │ │ │
│  │  │               │Port: 5432 │        │Port: 6379│       │ │ │
│  │  │               │           │        │          │       │ │ │
│  │  │               │ 4 Schemas:│        │• Session │       │ │ │
│  │  │               │ • kgc     │        │• Cache   │       │ │ │
│  │  │               │ • twenty  │        │• PubSub  │       │ │ │
│  │  │               │ • chatwoot│        │          │       │ │ │
│  │  │               │ • horilla │        │          │       │ │ │
│  │  │               └─────┬─────┘        └──────────┘       │ │ │
│  │  │                     │                                 │ │ │
│  │  └─────────────────────┼─────────────────────────────────┘ │ │
│  │                        │                                   │ │
│  │  ┌─────────────────────┼─────────────────────────────────┐ │ │
│  │  │         DOCKER VOLUMES (Persistent Storage)           │ │ │
│  │  │                     │                                 │ │ │
│  │  │  ┌──────────────────┴────────────────────┐            │ │ │
│  │  │  │ postgres_data/                        │            │ │ │
│  │  │  │   ├─ kgc.partners                     │            │ │ │
│  │  │  │   ├─ kgc.rentals                      │            │ │ │
│  │  │  │   ├─ kgc.invoices                     │            │ │ │
│  │  │  │   └─ twenty.people, chatwoot.*, etc   │            │ │ │
│  │  │  └───────────────────────────────────────┘            │ │ │
│  │  │                                                        │ │ │
│  │  │  ┌───────────────────────────────────────┐            │ │ │
│  │  │  │ redis_data/                           │            │ │ │
│  │  │  │   └─ dump.rdb (Redis persistence)     │            │ │ │
│  │  │  └───────────────────────────────────────┘            │ │ │
│  │  │                                                        │ │ │
│  │  │  ┌───────────────────────────────────────┐            │ │ │
│  │  │  │ uploads/                              │            │ │ │
│  │  │  │   └─ invoices/pdf/, attachments/      │            │ │ │
│  │  │  └───────────────────────────────────────┘            │ │ │
│  │  └────────────────────────────────────────────────────────┘ │ │
│  └───────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘

INTERNET → :80/:443 → Nginx → Frontend (:5173) → Backend (:3000) → DB
```

---

### Port Mapping

```
┌──────────────────────────────────────────────────────┐
│              PORT MAPPING (VPS ↔ Containers)         │
└──────────────────────────────────────────────────────┘

VPS External      →    Container Internal
─────────────────      ──────────────────────
:80 (HTTP)        →    nginx:80
:443 (HTTPS)      →    nginx:443

CSAK BELSŐ HÁLÓZATON (nem látható kívülről):
─────────────────────────────────────────────────
localhost:5173    →    kgc-frontend:5173
localhost:3000    →    kgc-backend:3000
localhost:5432    →    postgres:5432
localhost:6379    →    redis:6379

Nginx reverse proxy routing:
────────────────────────────
/              → kgc-frontend:5173
/api/*         → kgc-backend:3000
/crm/*         → twenty-frontend:3001 (később)
/support/*     → chatwoot-frontend:3002 (később)
/hr/*          → horilla-frontend:3003 (később)
```

---

### Container Communication (Hogyan beszélnek egymással)

```
┌─────────────────────────────────────────────────────────┐
│          CONTAINER HÁLÓZATI KOMMUNIKÁCIÓ                │
└─────────────────────────────────────────────────────────┘

KGC Backend → PostgreSQL:
─────────────────────────
  DATABASE_URL=postgresql://postgres:***@postgres:5432/kgc_production
                                        ^^^^^^^^
                        Container név (Docker DNS feloldja)

  Latency: < 1ms (ugyanazon VPS-en, Docker network)


KGC Backend → Redis:
────────────────────
  REDIS_URL=redis://redis:6379
                     ^^^^^
              Container név (Docker DNS feloldja)

  Latency: < 1ms


KGC Frontend → KGC Backend:
───────────────────────────
  VITE_API_URL=http://kgc-backend:3000/api
                     ^^^^^^^^^^^
                Container név (frontend network-ön keresztül)

  Latency: < 1ms


NGINX → KGC Frontend:
─────────────────────
  proxy_pass http://kgc-frontend:5173;
                     ^^^^^^^^^^^^
                Container név (nginx.conf-ban)
```

---

## 3️⃣ Egyszerűsített "Building Blocks" Diagram

### MVP Fázis (5 Konténer)

```
┌──────────────────────────────────────────────────────┐
│                    MVP STACK                         │
│                  (3 hét fejlesztés)                  │
└──────────────────────────────────────────────────────┘

┌─────────┐
│ NGINX   │ ← Reverse proxy, SSL termination
│  :80    │
│  :443   │
└────┬────┘
     │
     ├───────────────┬─────────────┐
     ▼               ▼             ▼
┌─────────┐   ┌──────────┐   ┌─────────┐
│   KGC   │   │   KGC    │   │ Static  │
│Frontend │   │ Backend  │   │  Files  │
│ (React) │   │ (NestJS) │   │         │
└─────────┘   └────┬─────┘   └─────────┘
                   │
        ┌──────────┴──────────┐
        ▼                     ▼
   ┌─────────┐          ┌─────────┐
   │PostgreSQL│         │  Redis  │
   │ 4 Schema │         │ Cache + │
   │         │         │ Session │
   └─────────┘          └─────────┘
```

---

### Teljes Rendszer (11 Konténer - 9 hét után)

```
┌──────────────────────────────────────────────────────┐
│                  TELJES STACK                        │
│              (8-9 hét fejlesztés után)               │
└──────────────────────────────────────────────────────┘

                    ┌─────────┐
                    │  NGINX  │
                    │  :80    │
                    │  :443   │
                    └────┬────┘
                         │
    ┌────────────────────┼────────────────────┐
    │                    │                    │
    ▼                    ▼                    ▼
┌─────────┐       ┌──────────┐       ┌──────────┐
│   KGC   │       │  Twenty  │       │ Chatwoot │
│Frontend │       │ Frontend │       │ Frontend │
│ (React) │       │ (React)  │       │  (Vue)   │
└────┬────┘       └────┬─────┘       └────┬─────┘
     │                 │                   │
     ▼                 ▼                   ▼
┌─────────┐       ┌──────────┐       ┌──────────┐
│   KGC   │       │  Twenty  │       │ Chatwoot │
│ Backend │       │ Backend  │       │ Backend  │
│(NestJS) │       │ (Node.js)│       │  (Rails) │
└────┬────┘       └────┬─────┘       └────┬─────┘
     │                 │                   │
     │                 │                   │
     ▼                 ▼                   ▼
┌─────────┐       ┌──────────┐       ┌──────────┐
│ Horilla │       │PostgreSQL│       │  Redis   │
│Frontend │       │ (Közös)  │       │ (Közös)  │
│ (React) │       │ 4 Schema │       │          │
└────┬────┘       └──────────┘       └──────────┘
     │
     ▼
┌─────────┐
│ Horilla │
│ Backend │
│(Django) │
└─────────┘
```

---

## 🎯 Összehasonlítás: Melyik Formátumot Mikor?

| Formátum | Használat | Előny | Hátrány |
|----------|-----------|-------|---------|
| **Mermaid.js** | GitHub README, dokumentáció | Auto-render GitHub-ban, professzionális | Syntax tanulás |
| **ASCII** | Code comments, terminal | Mindenütt látható, git diff friendly | Limitált vizuális |
| **Excalidraw** | Prezentációk, stakeholderek | Interaktív, szép, drag&drop | Külön tool kell |

---

## 📦 Fájlok a Projektben

```
kgc-erp-deployment/
├── docs/
│   └── deployment/
│       ├── docker-architecture-diagrams.md     ← EZ A FÁJL (Mermaid + ASCII)
│       ├── KGC-Docker-Architecture.excalidraw  ← Excalidraw (készíthető)
│       └── KGC-Docker-Architecture.svg         ← Export (Excalidraw-ból)
│
└── docker-compose.yml                          ← Valódi konfiguráció
```

---

## 🚀 Következő Lépések

**Szeretnél még:**
1. ✅ Excalidraw interaktív diagramot is?
2. ✅ Docker Compose fájl magyarázatot (sorról sorra)?
3. ✅ Konkrét docker parancsok példákkal?

**Minden formátum készen áll - mondj, melyik kell még!** 🎨
