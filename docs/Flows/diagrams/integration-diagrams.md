# KGC ERP Integration Diagrams

**Dátum:** 2025-12-19
**Kapcsolódó:** ADR-015 (CRM Support Integration Strategy)

---

## 1. Rendszer Architektúra Diagram

**Fájl:** [integration-system-architecture.excalidraw](integration-system-architecture.excalidraw)

```mermaid
graph TB
    subgraph "KGC ERP ECOSYSTEM"
        subgraph CHATWOOT["CHATWOOT (Support)"]
            CW_DB[(PostgreSQL<br/>chatwoot_db)]
            CW_REDIS[(Redis /1)]
            CW_PORT["Port: 3001"]
            CW_TECH["Ruby on Rails<br/>Vue.js<br/>REST API"]
        end

        subgraph TWENTY["TWENTY CRM (Sales)"]
            TW_DB[(PostgreSQL<br/>twenty_db)]
            TW_REDIS[(Redis /2)]
            TW_PORT["Port: 3002"]
            TW_TECH["NestJS<br/>React + Recoil<br/>GraphQL + REST"]
        end

        subgraph KGC["KGC ERP (Core)"]
            KGC_DB[(PostgreSQL<br/>kgc_erp)]
            KGC_REDIS[(Redis /0)]
            KGC_PORT["Port: 3000"]
            KGC_MOD["Bérlés<br/>Szerviz<br/>Értékesítés<br/>Multi-tenant"]
        end

        subgraph INTEGRATION["INTEGRATION LAYER (Node.js)"]
            INT_WH["Webhook Router"]
            INT_BUS["Event Bus<br/>(RabbitMQ)"]
            INT_SYNC["Data Sync Service<br/>(Adapters)"]
            INT_MAP["Mapping Service"]
            INT_LOG["Audit Log"]
        end

        subgraph SHARED["Shared Services"]
            REDIS_SHARED[(Redis Shared)]
            RABBITMQ[RabbitMQ]
            PROXY[Traefik/Nginx]
        end
    end

    CHATWOOT -->|REST + Webhooks| INTEGRATION
    TWENTY -->|GraphQL + Webhooks| INTEGRATION
    KGC -->|REST + Events| INTEGRATION
    INTEGRATION -.->|uses| SHARED
```

---

## 2. Adatfolyam Diagram (Data Flow)

### Use Case A: Partner Szinkronizáció

```mermaid
sequenceDiagram
    participant KGC as KGC ERP
    participant INT as Integration Layer
    participant CW as Chatwoot
    participant TW as Twenty

    Note over KGC: Partner felvétel (pult)
    KGC->>KGC: INSERT INTO public.partner
    KGC->>INT: Event: partner.created

    par Parallel Sync
        INT->>CW: POST /api/v1/contacts
        CW-->>INT: contact_id: 12345
    and
        INT->>TW: GraphQL createPerson
        TW-->>INT: person_id: uuid-abc
    end

    INT->>KGC: UPDATE partner SET<br/>chatwoot_contact_id,<br/>twenty_person_id

    Note over KGC,TW: Partner szinkronizálva mind 3 rendszerben
```

### Use Case B: Support Ticket → Szerviz Munkalap

```mermaid
sequenceDiagram
    participant Customer as Ügyfél
    participant CW as Chatwoot Widget
    participant INT as Integration Layer
    participant KGC as KGC ERP
    participant Tech as Szervizes

    Customer->>CW: "A kompresszor nem indul"
    CW->>CW: conversation_created
    CW->>INT: Webhook: conversation_created

    Note over INT: Lookup KGC Partner<br/>by chatwoot_contact_id

    INT->>KGC: POST /api/munkalapok<br/>{partner_id, hibajelenseg,<br/>chatwoot_conversation_id}
    KGC-->>INT: munkalap_id: xyz-123

    INT->>INT: Log audit trail

    Note over Tech: Szerviz értesítés
    Tech->>KGC: Munkalap megnyitása
    KGC->>KGC: Link: Chatwoot conversation
```

### Use Case C: Sales Opportunity → Franchise Tenant

```mermaid
sequenceDiagram
    participant TW as Twenty CRM
    participant INT as Integration Layer
    participant KGC as KGC ERP

    Note over TW: Sales Pipeline
    TW->>TW: Opportunity: "KGC Győr"<br/>Stage: Won
    TW->>INT: Webhook: opportunity.updated

    Note over INT: Lookup KGC Partner<br/>by twenty_person_id

    INT->>KGC: POST /api/tenants<br/>{partner_id, nev: "KGC Győr",<br/>tipus: "franchise",<br/>csomag: "pro"}

    KGC-->>INT: tenant_id: tenant_fr01

    Note over KGC: Franchise tenant created<br/>Onboarding workflow trigger
```

### Use Case D: Munkalap Státusz → Chatwoot Értesítés

```mermaid
sequenceDiagram
    participant Tech as Szervizes
    participant KGC as KGC ERP
    participant INT as Integration Layer
    participant CW as Chatwoot
    participant Customer as Ügyfél

    Tech->>KGC: Munkalap státusz:<br/>javítás → elkészült
    KGC->>INT: Event: munkalap.status_changed

    Note over INT: Check: Van<br/>chatwoot_conversation_id?

    alt Has conversation_id
        INT->>CW: POST /conversations/{id}/messages<br/>"A javítás elkészült!"
        CW->>Customer: Email/SMS értesítés
    else No conversation_id
        Note over INT: Skip (nem chat-ből érkezett)
    end
```

---

## 3. Sequence Diagram - Webhook Interactions

### Chatwoot → KGC (Conversation Created)

```mermaid
sequenceDiagram
    participant CW as Chatwoot
    participant WH as Webhook Router
    participant EB as Event Bus
    participant DS as Data Sync Service
    participant KGC as KGC ERP
    participant DB as PostgreSQL

    CW->>WH: POST /webhooks/chatwoot<br/>{event: conversation_created}
    WH-->>CW: 200 OK (immediate ack)

    WH->>EB: Publish: chatwoot.event

    EB->>DS: Subscribe: chatwoot.event
    DS->>DS: Extract kgc_partner_id<br/>from custom_attributes

    alt Partner ID exists
        DS->>KGC: POST /api/munkalapok
        KGC->>DB: INSERT INTO munkalap
        DB-->>KGC: munkalap_id
        KGC-->>DS: Success
        DS->>DB: INSERT INTO integration_log<br/>{status: success}
    else Partner ID missing
        DS->>DB: INSERT INTO integration_log<br/>{status: skipped}
    end
```

### Twenty → KGC (Opportunity Won)

```mermaid
sequenceDiagram
    participant TW as Twenty CRM
    participant WH as Webhook Router
    participant EB as Event Bus
    participant DS as Data Sync Service
    participant KGC as KGC ERP
    participant DB as PostgreSQL

    TW->>WH: POST /webhooks/twenty<br/>{event: opportunity.updated,<br/>stage: won}
    WH-->>TW: 200 OK (immediate ack)

    WH->>EB: Publish: twenty.event

    EB->>DS: Subscribe: twenty.event
    DS->>DB: SELECT partner<br/>WHERE twenty_person_id = ?
    DB-->>DS: partner_id

    DS->>KGC: POST /api/tenants<br/>{partner_id, csomag}
    KGC->>DB: INSERT INTO tenants
    DB-->>KGC: tenant_id
    KGC-->>DS: Success

    DS->>DB: INSERT INTO integration_log<br/>{status: success}

    Note over KGC: Trigger onboarding<br/>workflow
```

### KGC → Chatwoot/Twenty (Partner Created)

```mermaid
sequenceDiagram
    participant KGC as KGC ERP
    participant EB as Event Bus
    participant DS as Data Sync Service
    participant CW as Chatwoot
    participant TW as Twenty
    participant DB as PostgreSQL

    KGC->>EB: Publish: partner.created<br/>{partner_id}

    EB->>DS: Subscribe: partner.created
    DS->>DB: SELECT partner WHERE id = ?
    DB-->>DS: Partner data

    par Parallel Sync
        DS->>CW: POST /api/v1/contacts<br/>{name, email, phone,<br/>custom_attributes: {kgc_partner_id}}
        CW-->>DS: contact_id: 12345
    and
        DS->>TW: GraphQL createPerson<br/>{name, email, phone,<br/>customFields: {kgcPartnerId}}
        TW-->>DS: person_id: uuid-abc
    end

    DS->>DB: UPDATE partner SET<br/>chatwoot_contact_id = 12345,<br/>twenty_person_id = 'uuid-abc'

    DS->>DB: INSERT INTO integration_log<br/>{event: partner_synced,<br/>status: success}
```

---

## 4. Entity Relationship Diagram (Integration Tables)

```mermaid
erDiagram
    PARTNER ||--o{ INTEGRATION_LOG : "triggers"
    PARTNER {
        uuid id PK
        string nev
        string email
        string telefon
        bigint chatwoot_contact_id FK "External ID"
        uuid twenty_person_id FK "External ID"
        enum sync_status "synced, pending, error"
        timestamp last_sync_at
        uuid tenant_id FK
    }

    INTEGRATION_LOG {
        uuid id PK
        enum event_type "partner_created, conversation_created, etc"
        enum source_system "kgc, chatwoot, twenty"
        jsonb payload "Full event data"
        enum status "success, failed, retry"
        string error_message
        timestamp created_at
        uuid partner_id FK
    }

    MUNKALAP ||--o| CHATWOOT_CONVERSATION : "linked_to"
    MUNKALAP {
        uuid id PK
        uuid partner_id FK
        string hibajelenseg
        enum statusz
        bigint chatwoot_conversation_id FK "External ID"
        uuid tenant_id FK
    }

    CHATWOOT_CONVERSATION {
        bigint id PK "External system"
        bigint contact_id
        jsonb custom_attributes
        text last_message
    }

    TENANT ||--o| TWENTY_OPPORTUNITY : "created_from"
    TENANT {
        uuid id PK
        string nev
        enum tipus "sajat, franchise"
        uuid partner_id FK
        uuid twenty_opportunity_id FK "External ID"
    }

    TWENTY_OPPORTUNITY {
        uuid id PK "External system"
        uuid person_id
        enum stage "won, lost, negotiation"
        decimal amount
    }

    SYNC_STATUS {
        uuid id PK
        enum entity_type "partner, munkalap, tenant"
        uuid entity_id
        enum system "chatwoot, twenty"
        string external_id
        enum sync_status "synced, pending, error"
        timestamp last_sync_at
        int retry_count
    }
```

### Táblák Leírása

#### public.partner (KGC Master)
- **chatwoot_contact_id**: Chatwoot Contact.id
- **twenty_person_id**: Twenty Person.id
- **sync_status**: enum ('synced', 'pending', 'error')
- **last_sync_at**: Utolsó sikeres szinkronizáció

#### integration_log (Audit Trail)
- **event_type**: 'partner_created', 'conversation_created', 'opportunity_won', stb.
- **source_system**: 'kgc', 'chatwoot', 'twenty'
- **payload**: JSONB (teljes event adat)
- **status**: 'success', 'failed', 'retry'
- **Retention**: 7 év (compliance)

#### tenant_xxx.munkalap
- **chatwoot_conversation_id**: Link Chatwoot conversation-höz (opcionális)
- Ha NULL → Nem chat-ből érkezett

#### sync_status (Optional - Advanced)
- Finomabb szinkronizáció tracking entitásonként
- Retry logic kezelés
- System-specifikus external ID-k

---

## 5. Deployment Diagram (Docker Compose)

```mermaid
graph TB
    subgraph "Docker Host"
        subgraph "Network: kgc-network"
            CW[chatwoot:3001]
            TW[twenty:3002]
            KGC[kgc-erp:3000]
            INT[kgc-integration:3003]

            CW_PG[(postgres-chatwoot:5432)]
            TW_PG[(postgres-twenty:5432)]
            KGC_PG[(postgres-kgc:5432)]

            REDIS[(redis:6379)]
            RABBITMQ[rabbitmq:5672<br/>15672 mgmt]

            PROXY[traefik:80/443]
        end

        subgraph "Volumes"
            V_CW[chatwoot-data]
            V_TW[twenty-data]
            V_KGC[kgc-data]
            V_REDIS[redis-data]
            V_RMQ[rabbitmq-data]
        end
    end

    PROXY -->|routes| CW
    PROXY -->|routes| TW
    PROXY -->|routes| KGC
    PROXY -->|routes| INT

    CW --> CW_PG
    TW --> TW_PG
    KGC --> KGC_PG

    CW --> REDIS
    TW --> REDIS
    KGC --> REDIS
    INT --> REDIS

    INT --> RABBITMQ

    CW_PG --> V_CW
    TW_PG --> V_TW
    KGC_PG --> V_KGC
    REDIS --> V_REDIS
    RABBITMQ --> V_RMQ

    INT -->|REST| CW
    INT -->|GraphQL| TW
    INT -->|REST| KGC
```

### Docker Compose Konfiguráció

```yaml
version: '3.8'

services:
  # === Applications ===
  chatwoot:
    image: chatwoot/chatwoot:latest
    ports:
      - "3001:3000"
    environment:
      POSTGRES_HOST: postgres-chatwoot
      REDIS_URL: redis://redis:6379/1
    depends_on:
      - postgres-chatwoot
      - redis
    networks:
      - kgc-network

  twenty:
    image: twentycrm/twenty:latest
    ports:
      - "3002:3000"
    environment:
      PG_DATABASE_URL: postgresql://twenty@postgres-twenty:5432/twenty
      REDIS_URL: redis://redis:6379/2
    depends_on:
      - postgres-twenty
      - redis
    networks:
      - kgc-network

  kgc-erp:
    image: kgc-erp:latest
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgresql://kgc@postgres-kgc:5432/kgc_erp
      REDIS_URL: redis://redis:6379/0
    depends_on:
      - postgres-kgc
      - redis
    networks:
      - kgc-network

  kgc-integration:
    image: kgc-integration:latest
    ports:
      - "3003:3000"
    environment:
      KGC_API_URL: http://kgc-erp:3000
      CHATWOOT_API_URL: http://chatwoot:3001
      TWENTY_API_URL: http://twenty:3002
      RABBITMQ_URL: amqp://rabbitmq:5672
    depends_on:
      - kgc-erp
      - chatwoot
      - twenty
      - rabbitmq
    networks:
      - kgc-network

  # === Databases ===
  postgres-chatwoot:
    image: postgres:15
    volumes:
      - chatwoot-data:/var/lib/postgresql/data
    networks:
      - kgc-network

  postgres-twenty:
    image: postgres:15
    volumes:
      - twenty-data:/var/lib/postgresql/data
    networks:
      - kgc-network

  postgres-kgc:
    image: postgres:15
    volumes:
      - kgc-data:/var/lib/postgresql/data
    networks:
      - kgc-network

  # === Shared Services ===
  redis:
    image: redis:7-alpine
    volumes:
      - redis-data:/data
    networks:
      - kgc-network

  rabbitmq:
    image: rabbitmq:3-management
    ports:
      - "15672:15672"  # Management UI
    volumes:
      - rabbitmq-data:/var/lib/rabbitmq
    networks:
      - kgc-network

  traefik:
    image: traefik:v2.10
    command:
      - "--api.insecure=true"
      - "--providers.docker=true"
    ports:
      - "80:80"
      - "443:443"
      - "8080:8080"  # Dashboard
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
    networks:
      - kgc-network

networks:
  kgc-network:
    driver: bridge

volumes:
  chatwoot-data:
  twenty-data:
  kgc-data:
  redis-data:
  rabbitmq-data:
```

### Port Mapping

| Service | Internal Port | External Port | Purpose |
|---------|---------------|---------------|---------|
| Chatwoot | 3000 | 3001 | Support platform |
| Twenty | 3000 | 3002 | CRM platform |
| KGC ERP | 3000 | 3000 | Core ERP |
| Integration Layer | 3000 | 3003 | Webhook router + sync |
| RabbitMQ Management | 15672 | 15672 | Message queue UI |
| Traefik Dashboard | 8080 | 8080 | Proxy dashboard |

### Network Isolation

- **kgc-network**: Izolált Docker bridge network
- Alkalmazások csak ezen belül kommunikálnak
- External hozzáférés csak Traefik-en keresztül (TLS termination)

---

## Diagram Használati Útmutató

### Excalidraw Megnyitása

1. Töltsd le az Excalidraw desktop app-ot: https://excalidraw.com
2. Nyisd meg a `.excalidraw` fájlt
3. Szerkeszd igény szerint

### Mermaid Diagramok Renderelése

**VS Code Extension:**
```bash
# Install Mermaid Preview extension
code --install-extension bierner.markdown-mermaid
```

**Online Editor:**
- https://mermaid.live

**Markdown Preview:**
- GitHub automatikusan rendereli a mermaid blokkokat
- GitLab is támogatja

### Diagramok Frissítése

**Ha változik az architektúra:**
1. Frissítsd a Mermaid kódot (egyszerűbb)
2. Generálj újra PNG/SVG exportot (ha kell)
3. Commit mindkét fájlt (`.md` és `.excalidraw`)

**Verziókövetés:**
- Git diff működik `.md` fájlokon
- `.excalidraw` JSON - nehezebb diff, de human-readable

---

## Kapcsolódó Dokumentumok

| Dokumentum | Elérési út |
|------------|------------|
| ADR-015: Integration Strategy | [ADR-015-CRM-Support-Integration-Strategy.md](../../architecture/ADR-015-CRM-Support-Integration-Strategy.md) |
| KGC PRD | [prd.md](../../prd.md) |
| Moduláris Architektúra | [ADR-014-modular-architektura-vegleges.md](../../architecture/ADR-014-modular-architektura-vegleges.md) |

---

**Készült:** 2025-12-19
**Státusz:** Végleges
