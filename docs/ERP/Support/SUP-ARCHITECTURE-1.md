# Rendszer Architektúra

## Kokó - AI Ügyfélszolgálati Asszisztens

**Verzió:** 2.0
**Dátum:** 2025-12-27

---

## 1. Architektúra áttekintés

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         FRONTEND LAYER                                   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   ┌──────────────┐    ┌──────────────┐    ┌──────────────┐              │
│   │   Chatwoot   │    │    Email     │    │   Discord    │              │
│   │    Widget    │    │   Inbound    │    │    Server    │              │
│   │  (Weboldal)  │    │              │    │              │              │
│   └──────┬───────┘    └──────┬───────┘    └──────┬───────┘              │
│          │                   │                   │                       │
└──────────┼───────────────────┼───────────────────┼───────────────────────┘
           │                   │                   │
           ▼                   ▼                   ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      CHATWOOT CORE (Rails)                               │
│                           Port: 3000                                     │
├─────────────────────────────────────────────────────────────────────────┤
│   • Inbox kezelés           • Agent assignment                          │
│   • Conversation routing    • Webhook dispatcher                        │
│   • Contact management      • Message storage                           │
└──────────────────────────────────┬──────────────────────────────────────┘
                                   │
                         Webhook (message_created)
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    AI MIDDLEWARE LAYER (Python)                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   ┌────────────────┐         ┌────────────────┐         ┌────────────┐  │
│   │   ai-chatbot   │◄───────►│ context-manager│◄───────►│   Redis    │  │
│   │   Port: 5001   │         │   Port: 5004   │         │ Port: 6379 │  │
│   │                │         │                │         │            │  │
│   │ • Webhook      │         │ • Cache Mgmt   │         │ • Sessions │  │
│   │ • Routing      │         │ • KB Loader    │         │ • Stats    │  │
│   │ • Booking      │         │ • Memory       │         │ • Memory   │  │
│   │ • Email notify │         │ • Admin UI     │         │            │  │
│   └────────┬───────┘         └────────┬───────┘         └────────────┘  │
│            │                          │                                  │
│            │         ┌────────────────┴────────────────┐                │
│            │         │                                 │                │
│            ▼         ▼                                 ▼                │
│   ┌────────────────┐ ┌────────────────┐ ┌────────────────────────────┐  │
│   │ gemini-proxy   │ │calendar-service│ │    discord-bridge          │  │
│   │  Port: 5000    │ │  Port: 5002    │ │    Port: 8080              │  │
│   │                │ │                │ │                            │  │
│   │ • Gemini API   │ │ • Google Cal   │ │ • Discord Bot              │  │
│   │ • Fallback     │ │ • Booking      │ │ • Ticket system            │  │
│   └────────────────┘ └────────────────┘ └────────────────────────────┘  │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           DATA LAYER                                     │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   ┌────────────────┐    ┌────────────────┐    ┌────────────────┐        │
│   │   PostgreSQL   │    │  Knowledge     │    │    Memory      │        │
│   │   Port: 5432   │    │    Base        │    │    Store       │        │
│   │                │    │                │    │                │        │
│   │ • Chatwoot DB  │    │ /knowledge-    │    │ /memory/       │        │
│   │ • Users        │    │   bases/       │    │ • Preferences  │        │
│   │ • Messages     │    │ • _global/     │    │ • History      │        │
│   │ • Contacts     │    │ • mfl-support/ │    │ • Decisions    │        │
│   └────────────────┘    └────────────────┘    └────────────────┘        │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Komponensek részletezése

### 2.1 ai-chatbot (Port: 5001)

**Felelősség:** Webhook kezelés, AI válasz koordináció, üzenet routing

**Fő fájl:** `/opt/chatwoot/ai-chatbot/app.py`

**Endpoints:**
| Endpoint | Method | Leírás |
|----------|--------|--------|
| `/webhook` | POST | Chatwoot webhook fogadás |
| `/health` | GET | Health check |
| `/api/chat` | POST | Direct chat API |

**Funkciók:**
- Webhook események feldolgozása (message_created, conversation_created)
- Bounce email és auto-reply szűrés
- Nyelvfelismerés és routing
- Email notification küldés
- Hangüzenet feldolgozás
- Typing indicator kezelés

### 2.2 context-manager (Port: 5004)

**Felelősség:** Tudásbázis kezelés, Gemini cache, memória, admin UI

**Fő fájl:** `/opt/chatwoot/context-manager/app.py`

**Endpoints:**
| Endpoint | Method | Leírás |
|----------|--------|--------|
| `/query` | POST | AI lekérdezés cached kontextussal |
| `/cache/{project_id}` | GET | Cache lekérés/létrehozás |
| `/cache/{project_id}/refresh` | POST | Cache frissítés |
| `/memory/{project_id}` | GET/POST | Memory CRUD |
| `/memory/{project_id}/extract` | POST | Auto memory extraction |
| `/memory/{project_id}/forget` | DELETE | Memory törlés (GDPR) |
| `/projects` | GET | Projekt lista |
| `/stats` | GET | Használati statisztikák |
| `/admin/*` | GET | Admin UI |

**Funkciók:**
- Gemini Context Caching (75% költségmegtakarítás)
- Multi-tenant tudásbázis kezelés
- Hosszú távú memória perzisztencia
- Admin dashboard
- Token/költség tracking

### 2.3 gemini-proxy (Port: 5000)

**Felelősség:** Gemini API proxy, fallback kezelés

**Fő fájl:** `/opt/chatwoot/gemini-proxy/app.py`

**Funkciók:**
- Gemini 2.0 Flash API hívások
- Rate limiting
- Fallback válaszok API hiba esetén
- Request/response logging

### 2.4 calendar-service (Port: 5002)

**Felelősség:** Google Calendar integráció

**Fő fájl:** `/opt/chatwoot/calendar-service/app.py`

**Endpoints:**
| Endpoint | Method | Leírás |
|----------|--------|--------|
| `/slots` | GET | Szabad időpontok lekérdezése |
| `/book` | POST | Időpont foglalás |
| `/cancel` | DELETE | Foglalás lemondása |

### 2.5 discord-bridge (Port: 8080)

**Felelősség:** Discord integráció

**Fő fájl:** `/opt/chatwoot/discord-bridge/bot.py`

**Funkciók:**
- Discord bot működtetés
- Ticket rendszer
- Chatwoot szinkronizáció
- Memory extraction ticket lezáráskor

### 2.6 stats-service (Port: 5003)

**Felelősség:** Analitika és statisztikák

**Fő fájl:** `/opt/chatwoot/stats-service/app.py`

---

## 3. Adatfolyamok

### 3.1 Üzenet feldolgozás

```
1. User küld üzenetet
   └─► Chatwoot Widget / Email / Discord

2. Chatwoot fogadja
   └─► message_created webhook

3. ai-chatbot/webhook
   ├─► Bounce/auto-reply check
   ├─► Nyelvfelismerés
   ├─► Audio detection
   └─► Routing

4. context-manager/query
   ├─► Cache check/create
   ├─► Memory load
   ├─► Gemini API call
   └─► Response

5. ai-chatbot
   ├─► Confidence calculation
   ├─► Response formatting
   └─► Chatwoot API send

6. User kapja a választ
```

### 3.2 Email loop prevention

```
Incoming Email
    │
    ▼
┌─────────────────────────────────────┐
│ conversation_created webhook        │
│                                     │
│ 1. Check mail_subject for:          │
│    - "undelivered", "mailer-daemon" │
│    - "delivery failed", "bounced"   │
│    - "out of office", "auto-reply"  │
│                                     │
│ 2. Check sender email for:          │
│    - mailer-daemon@                 │
│    - postmaster@                    │
│    - noreply@, no-reply@            │
│                                     │
│ 3. If any match → SKIP (return 200) │
└─────────────────────────────────────┘
    │
    ▼ (if passed)
Normal processing
```

### 3.3 Context Caching

```
┌─────────────────────────────────────────────────────────────┐
│                   GEMINI CONTEXT CACHING                     │
└─────────────────────────────────────────────────────────────┘

First Request (No Cache):
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│ User Query   │────►│ Load KB Docs │────►│ Create Cache │
│              │     │ (~50KB)      │     │ (TTL: 1 hour)│
└──────────────┘     └──────────────┘     └──────┬───────┘
                                                  │
                                                  ▼
                                          ┌──────────────┐
                                          │ Gemini API   │
                                          │ Full price   │
                                          │ $0.075/1M    │
                                          └──────────────┘

Subsequent Requests (Cached):
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│ User Query   │────►│ Get Cache    │────►│ Gemini API   │
│              │     │ (instant)    │     │ Cached price │
└──────────────┘     └──────────────┘     │ $0.01875/1M  │
                                          │ (75% OFF!)   │
                                          └──────────────┘
```

---

## 4. Adattárolás

### 4.1 PostgreSQL (Chatwoot)

```sql
-- Fő táblák
conversations    -- Beszélgetések
messages         -- Üzenetek
contacts         -- Kontaktok
inboxes          -- Csatornák
users            -- Operátorok
```

### 4.2 Redis

```
# Kulcs struktúra
chatwoot:context:stats:{project_id}    -- Statisztikák
chatwoot:memory:{project_id}:{key}     -- Memory entries
chatwoot:session:{conversation_id}     -- Session data
```

### 4.3 Fájlrendszer

```
/opt/chatwoot/
├── knowledge-bases/
│   ├── _global/              # Közös tudás
│   │   ├── company_info.md
│   │   └── faq.md
│   └── mfl-support/          # Projekt-specifikus
│       ├── services.md
│       └── pricing.md
│
├── memory/
│   └── mfl-support/
│       ├── identity.json     # Bot identitás
│       ├── decisions.json    # Fontos döntések
│       └── customers/        # Ügyfél adatok
│
└── context-manager/data/
    └── projects.json         # Projekt konfiguráció
```

---

## 5. Külső integrációk

### 5.1 Google APIs

| API | Használat |
|-----|-----------|
| Gemini 2.0 Flash Exp | AI válasz generálás |
| Google Calendar | Időpontfoglalás |
| Google Cloud TTS | (Tervezett) Hangszintézis |

### 5.2 Egyéb

| Szolgáltatás | Használat |
|--------------|-----------|
| OpenAI Whisper | Hangüzenet transzkripció |
| Discord API | Discord bot |
| SMTP (Hostinger) | Email küldés |

---

## 6. Biztonság

### 6.1 Hálózati biztonság

```
┌─────────────────────────────────────────────────────────────┐
│                        NGINX                                 │
│                     (Reverse Proxy)                          │
│                                                              │
│   HTTPS ──► Port 443 ──► chatwoot:3000                      │
│                                                              │
│   Internal services: 127.0.0.1 only                         │
│   - ai-chatbot:5001                                         │
│   - context-manager:5004                                    │
│   - gemini-proxy:5000                                       │
└─────────────────────────────────────────────────────────────┘
```

### 6.2 API kulcsok

- `.env` fájlban tárolva
- `.gitignore`-ban védve
- Docker secrets (production)

### 6.3 Email védelem

- Bounce email szűrés
- Auto-reply detection
- Sender address validation
- Rate limiting

---

## 7. Monitoring

### 7.1 Health Checks

```bash
# Minden szolgáltatás
curl http://localhost:5001/health  # ai-chatbot
curl http://localhost:5004/health  # context-manager
curl http://localhost:5000/health  # gemini-proxy
curl http://localhost:3000/api/v1  # chatwoot
```

### 7.2 Logok

```bash
# Összes log
docker compose logs -f

# Specifikus szolgáltatás
docker logs chatwoot-ai-chatbot-1 -f
docker logs chatwoot-context-manager-1 -f
```

### 7.3 Statisztikák

```bash
curl http://localhost:5004/stats
```

Válasz:
```json
{
  "total_queries": 1234,
  "total_tokens": 567890,
  "estimated_cost_usd": 12.34,
  "cache_hit_rate": 0.85,
  "avg_response_time_ms": 2850
}
```

---

## 8. Skálázás

### 8.1 Horizontális skálázás

```yaml
# docker-compose.yaml
ai-chatbot:
  deploy:
    replicas: 3

context-manager:
  deploy:
    replicas: 2
```

### 8.2 Redis cluster

Production környezetben Redis Cluster ajánlott a memória és session kezeléshez.

---

## 9. Disaster Recovery

### 9.1 Backup

```bash
# PostgreSQL backup
docker exec chatwoot-postgres-1 pg_dump -U postgres chatwoot_production > backup.sql

# Knowledge base backup
tar -czf kb_backup.tar.gz /opt/chatwoot/knowledge-bases/

# Memory backup
tar -czf memory_backup.tar.gz /opt/chatwoot/memory/
```

### 9.2 Restore

```bash
# PostgreSQL restore
cat backup.sql | docker exec -i chatwoot-postgres-1 psql -U postgres chatwoot_production
```

---

## 10. Kapcsolódó dokumentumok

- [README.md](../README.md) - Projekt áttekintés
- [PRD.md](PRD.md) - Product Requirements
- [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md) - Implementációs terv
- [koko/KOKO_PROJECT_STATUS.md](../koko/KOKO_PROJECT_STATUS.md) - Projekt státusz
