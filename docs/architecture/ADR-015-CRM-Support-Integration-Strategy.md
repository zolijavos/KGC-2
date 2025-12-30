# ADR-015: CRM és Support Integráció - Chatwoot + Twenty

**Dátum:** 2025-12-19
**Státusz:** Javaslat
**Résztvevők:** Javo!, BMad Orchestrator
**Kapcsolódó ADR-ek:** ADR-014 (Moduláris Architektúra)

---

## Összefoglaló

A KGC ERP moduláris felépítéséhez **Chatwoot (Support)** és **Twenty (CRM)** integrációja javasolt standalone mikroszolgáltatásként, API-alapú loosely-coupled architektúrával.

### ✅ Ajánlott Megközelítés

**Mikroszolgáltatás + Event-Driven Architektúra**
- Chatwoot: Support/Help Desk (önálló alkalmazás)
- Twenty: CRM/Sales Pipeline (önálló alkalmazás)
- KGC ERP: Core business logic (bérlés, szerviz, értékesítés)
- Integration Layer: REST/GraphQL + Webhooks

---

## Tartalomjegyzék

1. [Miért Chatwoot + Twenty?](#miért-chatwoot--twenty)
2. [Platform Elemzés](#platform-elemzés)
3. [Integrációs Architektúra](#integrációs-architektúra)
4. [Moduláris Integráció Stratégia](#moduláris-integráció-stratégia)
5. [Adatfolyam és Szinkronizáció](#adatfolyam-és-szinkronizáció)
6. [Implementációs Terv](#implementációs-terv)
7. [Haszon-Elemzés (Business Value)](#haszon-elemzés)
8. [Rizikók és Mitigáció](#rizikók-és-mitigáció)
9. [Alternatívák](#alternatívák)

---

## Miért Chatwoot + Twenty?

### Döntési Mátrix

| Szempont | Chatwoot (Support) | Twenty (CRM) | Egyedi Fejlesztés |
|----------|-------------------|--------------|-------------------|
| **Fejlesztési idő** | ✅ 0 hónap (kész) | ✅ 0 hónap (kész) | ❌ 6-12 hónap |
| **Költség** | ✅ Ingyenes (GPL) | ✅ Ingyenes (GPL) | ❌ 80k-150k € |
| **Funkció lefedettség** | ✅ 90% | ✅ 85% | ✅ 100% (custom) |
| **Moduláris integráció** | ✅ REST/Webhook | ✅ GraphQL/Webhook | ⚠️ Tight coupling |
| **Self-hosting** | ✅ Docker | ✅ Docker | ✅ Saját |
| **Testreszabhatóság** | ✅ MIT licenc | ✅ GPL licenc | ✅ Teljes |
| **Közösségi support** | ✅ Aktív | ✅ Növekvő | ❌ Nincs |
| **Frissítések** | ✅ Rendszeres | ✅ Rendszeres | ⚠️ Saját felelősség |
| **Vendor lock-in** | ⚠️ Közepes | ⚠️ Közepes | ✅ Nincs |

### Ajánlás: Chatwoot + Twenty ✅

**Indokok:**
1. **Gyors piacra lépés:** 0 fejlesztési idő a core funkciókra
2. **Költséghatékonyság:** Ingyenes vs 80k-150k € egyedi fejlesztés
3. **Moduláris:** API-alapú integráció, nem tight coupling
4. **Proven technology:** Több ezer aktív telepítés, battle-tested
5. **KGC fókusz:** Erőforrások a core ERP funkcióira

---

## Platform Elemzés

### Chatwoot (Support Platform)

**GitHub:** https://github.com/chatwoot/chatwoot
**Csillagok:** 20k+ ⭐
**Licenc:** MIT (kereskedelmi használatra alkalmas)

#### Technológiai Stack

| Réteg | Technológia | KGC Kompatibilitás |
|-------|-------------|-------------------|
| **Backend** | Ruby on Rails | ⚠️ Eltérő (KGC: Node.js/Python TBD) |
| **Frontend** | Vue.js | ✅ Kompatibilis (Vue opció KGC-ben) |
| **Adatbázis** | PostgreSQL | ✅ KGC is PostgreSQL |
| **Cache** | Redis | ✅ KGC-ben is szükséges |
| **Deployment** | Docker | ✅ KGC is Docker-alapú |

#### Core Funkciók

| Funkció | Leírás | KGC Használat |
|---------|--------|---------------|
| **Omnichannel Inbox** | Email, WhatsApp, Facebook, Instagram, SMS | Ügyfél support központosítás |
| **Live Chat Widget** | Weboldal beágyazás | KGC webshop/franchise oldalak |
| **Ticketing System** | Jegy kezelés, státuszok, prioritások | Szerviz munkalap támogatás |
| **Knowledge Base** | Self-service help center | Termékkatalógus, GYIK |
| **AI Agent (Captain)** | Automatikus válaszok | 1. szintű support automatizálás |
| **Team Collaboration** | Belső jegyzetek, mention-ök | Szerviz ↔ Pult kommunikáció |
| **Automation Rules** | Auto-assignment, canned responses | Workflow automatizálás |
| **Reports & Analytics** | Response time, CSAT, agent performance | Support minőség mérés |

#### API Képességek

```yaml
API típusok:
  - Platform API: Multi-tenant kezelés (KGC franchise-hoz)
  - Application API: Account-szintű műveletek
  - Client API: Chat widget interakciók

Authentication:
  - API Key (platform/user/agent bot)
  - HMAC (client API)

Endpoints:
  Contacts:
    - list, create, show, update, delete, search, filter
  Conversations:
    - list, create, details, filter, meta counts
  Messages:
    - list, create, delete
  Inboxes:
    - list, get, create, update
  Teams:
    - Agents, custom attributes, automation rules

Webhooks:
  Events:
    - conversation_created
    - conversation_updated
    - conversation_status_changed
    - message_created
  Payload: JSON HTTP POST
```

---

### Twenty CRM (Sales Pipeline)

**GitHub:** https://github.com/twentyhq/twenty
**Csillagok:** 22k+ ⭐
**Licenc:** GPL-3.0 (open source)

#### Technológiai Stack

| Réteg | Technológia | KGC Kompatibilitás |
|-------|-------------|-------------------|
| **Backend** | NestJS (Node.js) | ✅ Node.js KGC backend opció |
| **Frontend** | React + Recoil | ✅ Modern stack, portolható |
| **Adatbázis** | PostgreSQL | ✅ KGC is PostgreSQL |
| **Cache** | Redis | ✅ KGC-ben is szükséges |
| **Queue** | BullMQ | ✅ Background job processing |
| **Deployment** | Docker + Nx monorepo | ✅ KGC is Docker |

#### Core Funkciók

| Funkció | Leírás | KGC Használat |
|---------|--------|---------------|
| **Contact Management** | People + Companies (B2B + B2C) | KGC Partner törzs szinkron |
| **Sales Pipeline** | Kanban/Table views, custom stages | Értékesítési lehetőségek (franchise) |
| **Custom Objects** | Flexibilis adatmodell | KGC-specifikus entitások (bérgép, munkalap) |
| **Email Integration** | Mailbox sync, thread view | Ügyfél kommunikáció történet |
| **Tasks & Notes** | Feladat kezelés, jegyzetek | Follow-up emlékeztetők |
| **Workflow Automation** | Trigger-based actions | Lead → Ügyfél konverzió |
| **Permissions (RBAC)** | Workspace + Object level | KGC franchise jogosultság kiegészítés |
| **API & Webhooks** | REST + GraphQL | KGC integráció |

#### API Képességek

```yaml
API típusok:
  - REST API: Standard CRUD műveletek
  - GraphQL API: Flexibilis query-k

Authentication:
  - API Key (Bearer token)
  - Generálás: Settings > Developers

Endpoints:
  People (Contacts):
    - create, read, update, delete
    - search, filter, custom fields
  Companies:
    - create, read, update, delete
    - link people, custom attributes
  Opportunities (Deals):
    - pipeline stages, amounts, close dates
  Tasks:
    - create, assign, due dates
  Notes:
    - attach to people/companies

Webhooks:
  Events:
    - record_created (people, companies, opportunities)
    - record_updated
    - record_deleted
  Payload: JSON HTTP POST
  Security: Token-based validation (custom)
```

---

## Integrációs Architektúra

### Architektúra Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           KGC ERP ECOSYSTEM                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────────┐         ┌──────────────────┐         ┌─────────────┐ │
│  │   CHATWOOT       │         │   TWENTY CRM     │         │   KGC ERP   │ │
│  │   (Support)      │         │   (Sales)        │         │   (Core)    │ │
│  ├──────────────────┤         ├──────────────────┤         ├─────────────┤ │
│  │ PostgreSQL (saját)│         │ PostgreSQL (saját)│         │ PostgreSQL │ │
│  │ Redis            │         │ Redis            │         │ Redis       │ │
│  │ Port: 3001       │         │ Port: 3002       │         │ Port: 3000  │ │
│  └────────┬─────────┘         └────────┬─────────┘         └──────┬──────┘ │
│           │                            │                           │        │
│           │ REST API                   │ GraphQL + REST            │        │
│           │ Webhooks                   │ Webhooks                  │        │
│           │                            │                           │        │
│           └────────────────┬───────────┴───────────────┬───────────┘        │
│                            │                           │                    │
│                   ┌────────▼───────────────────────────▼──────────┐         │
│                   │     INTEGRATION LAYER (Node.js)               │         │
│                   ├───────────────────────────────────────────────┤         │
│                   │  • Webhook Router                             │         │
│                   │  • Event Bus (Redis Pub/Sub / RabbitMQ)       │         │
│                   │  • Data Sync Service                          │         │
│                   │  • API Gateway (Optional: Kong / Traefik)     │         │
│                   │  • Mapping Service (KGC ↔ Chatwoot ↔ Twenty) │         │
│                   └───────────────────────────────────────────────┘         │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                    KÖZPONTI ADATBÁZIS (PostgreSQL)                      │ │
│  │  ┌───────────────────────────────────────────────────────────────────┐ │ │
│  │  │  public.partner (Master)                                          │ │ │
│  │  │  • id (UUID)                                                      │ │ │
│  │  │  • chatwoot_contact_id (external_id)                             │ │ │
│  │  │  • twenty_person_id (external_id)                                │ │ │
│  │  │  • sync_status (enum: synced, pending, error)                    │ │ │
│  │  │  • last_sync_at (timestamp)                                      │ │ │
│  │  └───────────────────────────────────────────────────────────────────┘ │ │
│  │                                                                          │ │
│  │  ┌───────────────────────────────────────────────────────────────────┐ │ │
│  │  │  integration_log (Audit Trail)                                    │ │ │
│  │  │  • event_type (partner_created, conversation_created, etc.)      │ │ │
│  │  │  • source_system (kgc, chatwoot, twenty)                         │ │ │
│  │  │  • payload (JSONB)                                               │ │ │
│  │  │  • status (success, failed, retry)                               │ │ │
│  │  └───────────────────────────────────────────────────────────────────┘ │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Deployment Architektúra (Docker Compose)

```yaml
version: '3.8'

services:
  # KGC Core ERP
  kgc-erp:
    image: kgc-erp:latest
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://kgc:password@postgres:5432/kgc_erp
      - REDIS_URL=redis://redis:6379/0
      - CHATWOOT_API_URL=http://chatwoot:3001
      - TWENTY_API_URL=http://twenty:3002
    depends_on:
      - postgres
      - redis

  # Chatwoot (Support)
  chatwoot:
    image: chatwoot/chatwoot:latest
    ports:
      - "3001:3000"
    environment:
      - POSTGRES_HOST=postgres-chatwoot
      - POSTGRES_DATABASE=chatwoot_production
      - REDIS_URL=redis://redis:6379/1
      - INSTALLATION_ENV=docker
    depends_on:
      - postgres-chatwoot
      - redis

  # Twenty CRM
  twenty:
    image: twentycrm/twenty:latest
    ports:
      - "3002:3000"
    environment:
      - PG_DATABASE_URL=postgresql://twenty:password@postgres-twenty:5432/twenty
      - REDIS_URL=redis://redis:6379/2
    depends_on:
      - postgres-twenty
      - redis

  # Integration Layer
  kgc-integration:
    image: kgc-integration:latest
    ports:
      - "3003:3000"
    environment:
      - KGC_API_URL=http://kgc-erp:3000
      - CHATWOOT_API_URL=http://chatwoot:3001
      - CHATWOOT_API_KEY=${CHATWOOT_API_KEY}
      - TWENTY_API_URL=http://twenty:3002
      - TWENTY_API_KEY=${TWENTY_API_KEY}
      - RABBITMQ_URL=amqp://rabbitmq:5672
    depends_on:
      - kgc-erp
      - chatwoot
      - twenty
      - rabbitmq

  # Adatbázisok (Izolált)
  postgres:
    image: postgres:15
    volumes:
      - kgc-postgres-data:/var/lib/postgresql/data

  postgres-chatwoot:
    image: postgres:15
    volumes:
      - chatwoot-postgres-data:/var/lib/postgresql/data

  postgres-twenty:
    image: postgres:15
    volumes:
      - twenty-postgres-data:/var/lib/postgresql/data

  # Közös szolgáltatások
  redis:
    image: redis:7-alpine
    volumes:
      - redis-data:/data

  rabbitmq:
    image: rabbitmq:3-management
    ports:
      - "15672:15672"  # Management UI
    volumes:
      - rabbitmq-data:/var/lib/rabbitmq

volumes:
  kgc-postgres-data:
  chatwoot-postgres-data:
  twenty-postgres-data:
  redis-data:
  rabbitmq-data:
```

---

## Moduláris Integráció Stratégia

### 1. Loosely Coupled Architecture

**Cél:** Chatwoot/Twenty cseréje NE törje a KGC ERP-t

**Implementáció:**

```typescript
// KGC ERP - Integration Adapter Pattern

interface ISupportSystem {
  createContact(partner: Partner): Promise<ExternalContact>;
  createTicket(data: TicketData): Promise<ExternalTicket>;
  getConversations(partnerId: string): Promise<Conversation[]>;
}

interface ICRMSystem {
  createPerson(partner: Partner): Promise<ExternalPerson>;
  createOpportunity(data: OpportunityData): Promise<ExternalOpportunity>;
  syncDeals(): Promise<Deal[]>;
}

// Chatwoot Adapter
class ChatwootAdapter implements ISupportSystem {
  async createContact(partner: Partner): Promise<ExternalContact> {
    const response = await axios.post(`${CHATWOOT_URL}/api/v1/contacts`, {
      name: partner.nev,
      email: partner.email,
      phone_number: partner.telefon,
      custom_attributes: {
        kgc_partner_id: partner.id,
        kgc_tenant: partner.tenant_id
      }
    }, {
      headers: { 'api_access_token': CHATWOOT_API_KEY }
    });

    return { id: response.data.payload.contact.id, source: 'chatwoot' };
  }

  // ... többi metódus
}

// Twenty Adapter
class TwentyCRMAdapter implements ICRMSystem {
  async createPerson(partner: Partner): Promise<ExternalPerson> {
    const mutation = `
      mutation CreatePerson($data: PersonCreateInput!) {
        createPerson(data: $data) {
          id
          name { firstName lastName }
          email
          phone
        }
      }
    `;

    const variables = {
      data: {
        name: {
          firstName: partner.keresztnev,
          lastName: partner.vezeteknev
        },
        email: partner.email,
        phone: partner.telefon,
        customFields: {
          kgcPartnerId: partner.id
        }
      }
    };

    const response = await graphqlClient.request(mutation, variables);
    return { id: response.createPerson.id, source: 'twenty' };
  }

  // ... többi metódus
}

// Dependency Injection
const supportSystem: ISupportSystem = new ChatwootAdapter();
const crmSystem: ICRMSystem = new TwentyCRMAdapter();

// KGC ERP használja az interfészt, NEM a konkrét implementációt
class PartnerService {
  async createPartner(data: PartnerInput) {
    const partner = await this.repo.create(data);

    // Async sync (fire-and-forget)
    eventBus.publish('partner.created', { partnerId: partner.id });

    return partner;
  }
}
```

### 2. Event-Driven Szinkronizáció

**Pattern:** Webhook + Event Bus (RabbitMQ vagy Redis Pub/Sub)

```typescript
// Integration Layer - Webhook Router

app.post('/webhooks/chatwoot', async (req, res) => {
  const event = req.body;

  // Acknowledge immediately (2xx response)
  res.status(200).json({ received: true });

  // Process async
  await eventBus.publish('chatwoot.event', {
    type: event.event,
    payload: event
  });
});

// Event Handler
eventBus.subscribe('chatwoot.event', async (message) => {
  const { type, payload } = message;

  switch(type) {
    case 'conversation_created':
      await handleNewConversation(payload);
      break;
    case 'message_created':
      await handleNewMessage(payload);
      break;
  }
});

async function handleNewConversation(data) {
  const kgcPartnerId = data.conversation.custom_attributes.kgc_partner_id;

  if (!kgcPartnerId) return; // Nem KGC partner

  // Szerviz munkalap létrehozása (opcionális)
  await kgcAPI.post('/munkalapok', {
    partner_id: kgcPartnerId,
    forras: 'chatwoot_conversation',
    chatwoot_conversation_id: data.conversation.id,
    hibajelenseg: data.conversation.messages[0]?.content || 'N/A'
  });

  // Log audit trail
  await logIntegrationEvent({
    event_type: 'conversation_to_munkalap',
    source_system: 'chatwoot',
    payload: data,
    status: 'success'
  });
}
```

### 3. Adatszinkronizáció Stratégia

| Adat | Sync Irány | Trigger | Gyakoriság |
|------|-----------|---------|------------|
| **Partner (Contact)** | KGC → Chatwoot → Twenty | Partner created/updated | Real-time (webhook) |
| **Conversations** | Chatwoot → KGC | New conversation | Real-time |
| **Munkalap → Ticket** | KGC → Chatwoot | Munkalap created | Real-time |
| **Sales Opportunity** | Twenty → KGC | Deal won | Real-time |
| **Email kommunikáció** | Twenty ↔ Chatwoot | Email sent/received | Real-time |
| **Riportok** | KGC ← Chatwoot/Twenty | Analytics | Batch (napi) |

---

## Adatfolyam és Szinkronizáció

### Use Case 1: Új Ügyfél Felvétel (KGC → Chatwoot → Twenty)

```
1. KGC ERP: Partner felvétel (pult)
   └─ POST /api/partners
      ├─ INSERT INTO public.partner
      └─ Publish event: 'partner.created'

2. Integration Layer: Event handler
   └─ Subscribe 'partner.created'
      ├─ Chatwoot API: POST /api/v1/contacts
      │  └─ Chatwoot Contact ID: 12345
      │
      ├─ Twenty API: GraphQL createPerson mutation
      │  └─ Twenty Person ID: uuid-abc-123
      │
      └─ UPDATE public.partner SET
            chatwoot_contact_id = 12345,
            twenty_person_id = 'uuid-abc-123',
            sync_status = 'synced',
            last_sync_at = NOW()

3. Eredmény:
   ✅ Partner KGC-ben
   ✅ Contact Chatwoot-ban
   ✅ Person Twenty-ben
   ✅ External ID-k linkelve
```

### Use Case 2: Ügyfél Support Kérés (Chatwoot → KGC Munkalap)

```
1. Ügyfél: Live chat a KGC weboldalon (Chatwoot widget)
   └─ "A bérelt kompresszor nem indul"

2. Chatwoot: Conversation created
   └─ Webhook: POST /webhooks/chatwoot
      Event: conversation_created
      Payload: {
        conversation: {
          id: 67890,
          contact_id: 12345,
          messages: [{
            content: "A bérelt kompresszor nem indul"
          }]
        }
      }

3. Integration Layer:
   └─ Lookup KGC Partner (chatwoot_contact_id = 12345)
      ├─ Partner ID: uuid-xyz-789
      │
      └─ KGC API: POST /api/munkalapok
         {
           partner_id: 'uuid-xyz-789',
           geptipus: 'Kompresszor', // Auto-detect vagy később
           hibajelenseg: 'A bérelt kompresszor nem indul',
           forras: 'chatwoot_chat',
           chatwoot_conversation_id: 67890,
           statusz: 'felveve'
         }

4. Szervizes:
   └─ KGC ERP: Munkalap lista
      ├─ Új munkalap látható
      ├─ Link: "Chatwoot beszélgetés megtekintése"
      └─ Státusz frissítés → Chatwoot-ban is látható (opcionális)

5. Eredmény:
   ✅ Support ticket → Szerviz munkalap
   ✅ Automatikus routing
   ✅ Kontextus megőrzés (chat history)
```

### Use Case 3: Sales Opportunity → Értékesítés (Twenty → KGC)

```
1. Twenty CRM: Sales pipeline
   └─ Opportunity: "KGC Győr franchise ajánlat"
      Stage: "Negotiation" → "Won"
      Amount: 50,000 EUR

2. Twenty: Webhook
   └─ POST /webhooks/twenty
      Event: opportunity.updated
      Payload: {
        opportunity: {
          id: 'uuid-deal-123',
          stage: 'won',
          amount: 50000,
          person_id: 'uuid-person-456'
        }
      }

3. Integration Layer:
   └─ Lookup KGC Partner (twenty_person_id = 'uuid-person-456')
      ├─ Partner ID: uuid-kgc-partner-999
      │
      └─ KGC API: POST /api/tenants (Franchise létrehozás)
         {
           nev: 'KGC Győr',
           partner_id: 'uuid-kgc-partner-999',
           tipus: 'franchise',
           csomag: 'pro', // Twenty opportunity custom field
           modules_enabled: {
             berles: true,
             szerviz: true,
             ertekesites: true
           }
         }

4. Eredmény:
   ✅ Sales win → Franchise tenant automatikus létrehozás
   ✅ Onboarding workflow trigger
   ✅ Sales és Operations szinkron
```

### Use Case 4: Szerviz Munkalap Állapot → Chatwoot Értesítés

```
1. KGC Szerviz: Munkalap státusz frissítés
   └─ Státusz: 'javítás' → 'elkészült'

2. KGC ERP: Webhook
   └─ Publish event: 'munkalap.status_changed'

3. Integration Layer:
   └─ Check: Van chatwoot_conversation_id?
      ├─ IGEN:
      │  └─ Chatwoot API: POST /api/v1/conversations/{id}/messages
      │     {
      │       content: "A javítás elkészült! Átvehető a gépe.",
      │       message_type: 'outgoing',
      │       private: false
      │     }
      │
      └─ NEM:
         └─ Skip (nem chat-ből érkezett munkalap)

4. Ügyfél:
   └─ Chatwoot értesítés (email/SMS/push)
      "Új üzenet a szervizzel kapcsolatban"

5. Eredmény:
   ✅ Automatikus ügyfél tájékoztatás
   ✅ Csatorna: ahol indították (live chat)
   ✅ Kontextus megőrzés
```

---

## Implementációs Terv

### Fázis 1: Infrastruktúra Setup (1-2 hét)

**Feladatok:**
1. Docker Compose setup (Chatwoot + Twenty + Integration Layer)
2. PostgreSQL adatbázisok létrehozása (izolált)
3. Redis + RabbitMQ setup
4. Alapvető hálózat konfigurálás
5. Reverse proxy setup (Traefik/Nginx)

**Deliverables:**
- `docker-compose.yml`
- `.env.example` (API kulcsok, URL-ek)
- Deployment dokumentáció

### Fázis 2: Chatwoot Integráció (2-3 hét)

**Feladatok:**
1. Chatwoot account setup + API kulcs
2. KGC Partner → Chatwoot Contact szinkron
   - Partner created webhook handler
   - Chatwoot API createContact implementáció
3. Chatwoot → KGC Munkalap konverzió
   - Conversation webhook handler
   - Munkalap auto-create logic
4. Live chat widget beágyazás (KGC webshop)
5. Knowledge Base setup (GYIK cikkek)

**Deliverables:**
- `ChatwootAdapter.ts`
- Webhook routes (`/webhooks/chatwoot`)
- Partner table migration (chatwoot_contact_id mező)
- Widget integráció dokumentáció

### Fázis 3: Twenty CRM Integráció (2-3 hét)

**Feladatok:**
1. Twenty workspace setup + API kulcs
2. KGC Partner → Twenty Person szinkron
   - GraphQL createPerson mutation
   - Custom fields mapping (KGC partner ID)
3. Twenty → KGC Sales Opportunity szinkron
   - Deal won → Franchise tenant create
   - Webhook handler implementáció
4. Email integration (Twenty mailbox sync)
5. Sales pipeline konfiguráció (KGC stages)

**Deliverables:**
- `TwentyCRMAdapter.ts`
- GraphQL client setup
- Partner table migration (twenty_person_id mező)
- Sales workflow dokumentáció

### Fázis 4: Bi-directional Sync (1-2 hét)

**Feladatok:**
1. Chatwoot ↔ Twenty email sync
   - Email Twenty-ben → Chatwoot conversation
   - Chatwoot email → Twenty activity log
2. Conflict resolution strategy
   - Last-Write-Wins + audit log
   - Manual conflict resolution UI (admin)
3. Bulk data migration (meglévő partnerek)
4. Sync monitoring dashboard

**Deliverables:**
- Sync service (`DataSyncService.ts`)
- Migration script (`migrate-partners.ts`)
- Admin dashboard (sync status)

### Fázis 5: Testing és Optimalizáció (1-2 hét)

**Feladatok:**
1. Integration testing (E2E)
2. Performance testing (webhook latency)
3. Failover testing (Chatwoot/Twenty downtime)
4. Documentation finalizálás
5. Training (csapat)

**Deliverables:**
- Test suite (Jest/Mocha)
- Performance report
- User guide
- Admin guide

**ÖSSZESEN:** 7-12 hét (2-3 hónap)

---

## Haszon-Elemzés

### Business Value Mátrix

| Haszon | Leírás | Becsült Érték (€/év) |
|--------|--------|---------------------|
| **Support Automatizálás** | AI agent (Captain) 40% support ticket automatizál | 15,000 - 20,000 |
| **Gyorsabb válaszidő** | Omnichannel inbox → 50% gyorsabb response time | 10,000 - 15,000 |
| **Lead konverzió növelés** | CRM pipeline → 20% több franchise partner | 30,000 - 50,000 |
| **Ügyfél elégedettség** | Self-service knowledge base → 30% kevesebb support call | 8,000 - 12,000 |
| **Sales produktivitás** | Twenty automation → 25% több deal agent-enként | 20,000 - 30,000 |
| **Munkalap routing** | Chatwoot chat → KGC munkalap auto-create | 5,000 - 8,000 |
| **Franchise onboarding** | Twenty deal → KGC tenant auto-create | 10,000 - 15,000 |
| **ÖSSZESEN** | | **98,000 - 150,000 €/év** |

### ROI Kalkuláció (3 év)

| Költség Típus | 1. év (€) | 2. év (€) | 3. év (€) | Összesen |
|---------------|-----------|-----------|-----------|----------|
| **Kezdeti Setup** | | | | |
| - Infrastruktúra (Docker, VPS) | 2,000 | 0 | 0 | 2,000 |
| - Fejlesztés (Integration Layer) | 15,000 | 0 | 0 | 15,000 |
| - Chatwoot customization | 5,000 | 0 | 0 | 5,000 |
| - Twenty customization | 3,000 | 0 | 0 | 3,000 |
| - Testing + Training | 3,000 | 0 | 0 | 3,000 |
| **Működési Költség** | | | | |
| - Hosting (self-hosted) | 3,000 | 3,500 | 4,000 | 10,500 |
| - Karbantartás (part-time dev) | 8,000 | 8,000 | 8,000 | 24,000 |
| - Support (Chatwoot/Twenty közösség) | 0 | 0 | 0 | 0 |
| **ÖSSZES KÖLTSÉG** | **39,000** | **11,500** | **12,000** | **62,500** |
| | | | | |
| **Haszon (konzervatív)** | 98,000 | 110,000 | 120,000 | 328,000 |
| **Nettó Haszon** | 59,000 | 98,500 | 108,000 | **265,500** |
| **ROI** | 151% | 857% | 900% | **425%** |

**Megtérülés:** ~5 hónap (39k költség / 98k éves haszon * 12 hó)

### Alternatív Költség (Egyedi Fejlesztés)

| Komponens | Becsült Fejlesztési Idő | Költség (€) |
|-----------|------------------------|-------------|
| Support ticketing rendszer | 3-4 hónap | 40,000 - 50,000 |
| Live chat widget + omnichannel | 2-3 hónap | 25,000 - 35,000 |
| CRM (contact + pipeline) | 4-5 hónap | 50,000 - 70,000 |
| Knowledge base | 1-2 hónap | 15,000 - 20,000 |
| Automation engine | 2-3 hónap | 25,000 - 35,000 |
| **ÖSSZESEN** | **12-17 hónap** | **155,000 - 210,000** |

**Megtakarítás Chatwoot + Twenty esetén:**
- Fejlesztési költség: 155k - 210k (egyedi) vs 28k (integráció) = **127k - 182k € megtakarítás**
- Idő piacra lépés: 12-17 hónap vs 2-3 hónap = **9-14 hónap gyorsabb**

---

## Rizikók és Mitigáció

### Rizikó Mátrix

| Rizikó | Valószínűség | Hatás | Mitigáció |
|--------|--------------|-------|-----------|
| **Chatwoot/Twenty breaking changes** | Közepes | Közepes | - Verzió lock (Docker image tag)<br>- Abstraction layer (adapter pattern)<br>- Regression testing CI-ben |
| **API rate limiting** | Alacsony | Alacsony | - Batch sync (off-peak hours)<br>- Cache layer (Redis)<br>- Queue-based sync (RabbitMQ) |
| **Data consistency (sync failures)** | Közepes | Magas | - Retry logic (exponential backoff)<br>- Dead letter queue<br>- Admin manual retry UI<br>- Audit log minden sync-hez |
| **Vendor lock-in (Chatwoot/Twenty)** | Közepes | Közepes | - Interface-based architecture<br>- Data export scripts (backup)<br>- Monitoring + alerting (Sentry) |
| **Security (API keys exposure)** | Alacsony | Magas | - Secrets management (Vault/1Password)<br>- Environment variables (.env)<br>- HTTPS only<br>- API key rotation policy |
| **Performance (webhook latency)** | Alacsony | Közepes | - Async processing (event bus)<br>- Acknowledge webhook immediately (2xx)<br>- Process in background worker |
| **Multi-tenant isolation breach** | Alacsony | Kritikus | - Tenant ID validáció minden sync-nél<br>- Custom attributes: kgc_tenant_id<br>- Integration tests tenant szeparációra |
| **Downtime (Chatwoot/Twenty)** | Alacsony | Közepes | - Health check endpoints<br>- Fallback: KGC ERP standalone mode<br>- Graceful degradation (queue-ba ír) |

---

## Alternatívák

### Alternatíva 1: Minden Egyedi Fejlesztés

| Szempont | Érték |
|----------|-------|
| Költség | 155k - 210k € |
| Idő | 12-17 hónap |
| Kontroll | ✅ Teljes |
| Vendor Lock-in | ✅ Nincs |
| Közösségi Support | ❌ Nincs |
| **Ajánlás** | ❌ NEM (túl drága, lassú) |

### Alternatíva 2: SaaS Megoldások (Intercom + Salesforce)

| Szempont | Érték |
|----------|-------|
| Költség | 20k - 40k €/év (licenc díj) |
| Idő | 1-2 hónap (setup) |
| Kontroll | ⚠️ Korlátozott |
| Vendor Lock-in | ❌ Erős |
| Testreszabhatóság | ⚠️ Limitált |
| Data Ownership | ❌ SaaS cégnél |
| **Ajánlás** | ❌ NEM (vendor lock-in, drága long-term) |

### Alternatíva 3: Chatwoot + Egyedi CRM

| Szempont | Érték |
|----------|-------|
| Költség | 70k - 100k € |
| Idő | 6-9 hónap |
| Kontroll | ⚠️ CRM-re teljes, Support Chatwoot |
| Vendor Lock-in | ⚠️ Chatwoot |
| **Ajánlás** | ⚠️ MAYBE (ha Twenty nem elég) |

### Alternatíva 4: **Chatwoot + Twenty (AJÁNLOTT)** ✅

| Szempont | Érték |
|----------|-------|
| Költség | 28k € (setup) + 11-12k €/év |
| Idő | 2-3 hónap |
| Kontroll | ⚠️ Adapter layer-en keresztül teljes |
| Vendor Lock-in | ⚠️ Közepes (open source, cserélhető) |
| Közösségi Support | ✅ Aktív (Chatwoot: 20k+ star, Twenty: 22k+) |
| Testreszabhatóság | ✅ Forkolható, MIT/GPL licenc |
| **Ajánlás** | ✅ IGEN (gyors, olcsó, proven tech) |

---

## Következő Lépések

### 1. Döntési Checkpoint

**Kérdések Javo! számára:**
- ✅ Chatwoot + Twenty integráció elfogadható?
- ⚠️ Self-hosting vs Managed hosting? (Chatwoot Cloud: 79$/hó, Twenty Cloud: TBD)
- ⚠️ Melyik fázist prioritizáljuk? (Chatwoot vagy Twenty először?)

### 2. Pilot Program (1-2 hónap)

**Cél:** Validálni az architektúrát kis skálán

**Feladatok:**
1. Chatwoot + Twenty Docker Compose setup (1 hét)
2. Partner szinkronizáció MVP (KGC → Chatwoot/Twenty) (1 hét)
3. Live chat widget teszt (KGC website) (1 hét)
4. Értékelés (performance, usability, developer experience) (1 hét)

**Döntési pont:** Ha sikeres → Full implementáció (Fázis 1-5)

### 3. Full Implementáció (2-3 hónap)

**BMad Method workflow:**
```bash
/bmad:bmm:workflows:workflow-init
→ Epic: CRM és Support Integráció
   → Story 1: Chatwoot Infrastructure Setup
   → Story 2: Partner Sync (KGC → Chatwoot)
   → Story 3: Conversation → Munkalap Routing
   → Story 4: Twenty CRM Infrastructure
   → Story 5: Sales Pipeline Integration
   → Story 6: Bi-directional Email Sync
   → Story 7: Monitoring Dashboard
   → Story 8: Documentation & Training
```

---

## Kapcsolódó Dokumentumok

| Dokumentum | Elérési út |
|------------|------------|
| KGC PRD | [/docs/prd.md](../prd.md) |
| Moduláris Architektúra | [/docs/architecture/ADR-014-modular-architektura-vegleges.md](ADR-014-modular-architektura-vegleges.md) |
| ERPNext vs KGC Fit-Gap | [/docs/analysis/ERPNext-vs-KGC-FitGap-2025-12-19.md](../analysis/ERPNext-vs-KGC-FitGap-2025-12-19.md) |
| Chatwoot GitHub | https://github.com/chatwoot/chatwoot |
| Twenty GitHub | https://github.com/twentyhq/twenty |
| Chatwoot Docs | https://developers.chatwoot.com |
| Twenty Docs | https://twenty.com/developers |

---

## Összefoglaló

### ✅ Ajánlott Megoldás: Chatwoot + Twenty

**Indokok:**
1. **Gyors piacra lépés:** 2-3 hónap vs 12-17 hónap (egyedi fejlesztés)
2. **Költséghatékony:** 28k € vs 155-210k € (megtakarítás: 127-182k €)
3. **Proven technology:** Battle-tested, 20k+ GitHub stars mindkettő
4. **Moduláris architektúra:** Loosely coupled, cserélhető (adapter pattern)
5. **Self-hosting:** Teljes adat kontroll, nincs SaaS vendor lock-in
6. **Open source:** Forkolható, testreszabható, közösségi support
7. **ROI:** 425% (3 év), megtérülés ~5 hónap

**Következő lépés:** Pilot program indítása (Docker Compose + MVP szinkronizáció)

---

**Készült:** BMad Orchestrator
**Dátum:** 2025-12-19
**Státusz:** Javaslat (Javo! jóváhagyásra vár)
