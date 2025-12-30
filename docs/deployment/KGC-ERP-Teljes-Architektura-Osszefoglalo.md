# KGC ERP - Teljes Architektúra Összefoglaló

**Verzió:** 3.0
**Dátum:** 2025-12-21
**Státusz:** 📋 Tervezési Fázis
**Prioritás:** 🏠 Bérlés Modul MVP (3 hét)

---

## 📋 Executive Summary

A KGC ERP egy **hibrid architektúrájú** rendszer, amely ötvözi az **egyedi fejlesztésű core modulokat** (Bérlés, Szervíz, Áruház, Chat) és a **bevált open-source integrációkat** (Twenty CRM, Chatwoot Support, Horilla HR).

**Kulcs döntések:**
- ✅ **1 Hostinger VPS** (KVM 8: 8 vCPU, 32GB RAM, 400GB NVMe)
- ✅ **1 PostgreSQL példány** (4 logikai schema)
- ✅ **Docker Compose** orchestration (3-5 konténer kezdetben, 11 végső állapot)
- ✅ **Monorepo + Git Submodules** stratégia
- ✅ **Iteratív fejlesztés:** MVP (3 hét) → Full System (8-9 hét)

**Költségek:**
- Hostinger VPS: **$20/hó** (~€18/hó)
- Domain + SSL: **€15/év** (Let's Encrypt ingyenes)
- Számlázz.hu API: **€0** (alapcsomag ingyenes, számlánként díjas)
- **Összesen:** ~€230/év infrastruktúra

---

## 🏗️ 1. RENDSZERARCHITEKTÚRA ÁTTEKINTÉS

### 1.1 Teljes Rendszer Komponensek

```
┌─────────────────────────────────────────────────────────────────────┐
│                         KGC ERP ÖKOSZISZTÉMA                        │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │                   FRONT-END RÉTEG                             │ │
│  │                                                               │ │
│  │  KGC Admin UI (React + TypeScript + Vite)                    │ │
│  │                                                               │ │
│  │  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──┐ │ │
│  │  │Dashb.││Bérlés││Szervíz││Áruház││Partner││Support││HR ││Ch││ │
│  │  │      ││      ││      ││      ││Detail ││Ticket ││   ││at││ │
│  │  │Natív ││Natív ││Natív ││Natív ││iframe ││iframe ││ifr││Wg││ │
│  │  │5 API ││CRUD  ││CRUD  ││CRUD  ││Twenty ││Chtwoot││Hor││WS││ │
│  │  └──┬───┘└──┬───┘└──┬───┘└──┬───┘└──┬────┘└──┬────┘└─┬─┘└┬─┘ │ │
│  │     │      │      │      │      │        │      │    │  │ │
│  └─────┼──────┼──────┼──────┼──────┼────────┼──────┼────┼──┘ │
│        │      │      │      │      │        │      │    │    │
└────────┼──────┼──────┼──────┼──────┼────────┼──────┼────┼────┘
         │      │      │      │      │        │      │    │
         ▼      ▼      ▼      ▼      ▼        ▼      ▼    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        BACKEND RÉTEG                                │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │              KGC Backend (NestJS + TypeScript)                │ │
│  │                                                               │ │
│  │  ┌─────────────────────────────────────────────────────────┐ │ │
│  │  │                  CORE BUSINESS MODULOK                  │ │ │
│  │  │                                                         │ │ │
│  │  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────┐ │ │ │
│  │  │  │ BÉRLÉS   │  │ SZERVÍZ  │  │ ÁRUHÁZ   │  │  CHAT  │ │ │ │
│  │  │  │ (Rental) │  │ (Service)│  │  (Shop)  │  │        │ │ │ │
│  │  │  │          │  │          │  │          │  │        │ │ │ │
│  │  │  │• Szerződés│ │• Munkalap│  │• Termék  │  │• Szoba │ │ │ │
│  │  │  │• Árazás  │  │• Hibajegy│  │• Készlet │  │• Üzenet│ │ │ │
│  │  │  │• Kifizetés│ │• Alkatrész│ │• Rendelés│  │• Fájl  │ │ │ │
│  │  │  │• Visszaadás│ │• Munkaóra│ │• Árazás  │  │• Értesít│ │ │ │
│  │  │  └─────┬────┘  └────┬─────┘  └────┬─────┘  └───┬────┘ │ │ │
│  │  │        │            │             │            │      │ │ │
│  │  └────────┼────────────┼─────────────┼────────────┼──────┘ │ │
│  │           │            │             │            │        │ │
│  │  ┌────────┴────────────┴─────────────┴────────────┴──────┐ │ │
│  │  │               MEGOSZTOTT MODULOK                      │ │ │
│  │  │                                                       │ │ │
│  │  │  ┌─────────┐ ┌─────────┐ ┌────────┐ ┌────────────┐  │ │ │
│  │  │  │ Partner │ │ Pénzügy │ │  Auth  │ │     HR     │  │ │ │
│  │  │  │  (CRM)  │ │(Finance)│ │  (JWT) │ │ (Employee) │  │ │ │
│  │  │  └────┬────┘ └────┬────┘ └───┬────┘ └─────┬──────┘  │ │ │
│  │  │       │           │          │            │         │ │ │
│  │  └───────┼───────────┼──────────┼────────────┼─────────┘ │ │
│  │          │           │          │            │           │ │
│  │  ┌───────┴───────────┴──────────┴────────────┴─────────┐ │ │
│  │  │           INTEGRATION ADAPTER LAYER                 │ │ │
│  │  │                                                     │ │ │
│  │  │  ┌─────────┐ ┌──────────┐ ┌─────────┐ ┌──────────┐│ │ │
│  │  │  │ Twenty  │ │ Chatwoot │ │ Horilla │ │Számlázz  ││ │ │
│  │  │  │ Adapter │ │ Adapter  │ │ Adapter │ │.hu API   ││ │ │
│  │  │  │(GraphQL)│ │  (REST)  │ │ (REST)  │ │ (REST)   ││ │ │
│  │  │  └─────────┘ └──────────┘ └─────────┘ └──────────┘│ │ │
│  │  └─────────────────────────────────────────────────────┘ │ │
│  └───────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
         │           │            │            │
         ▼           ▼            ▼            ▼
┌─────────────────────────────────────────────────────────────────┐
│                        ADAT RÉTEG                               │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │         PostgreSQL 15+ (Single Instance)                 │  │
│  │                                                          │  │
│  │  ┌────────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐ │  │
│  │  │    kgc     │  │ twenty  │  │chatwoot │  │ horilla │ │  │
│  │  │  (schema)  │  │(schema) │  │(schema) │  │(schema) │ │  │
│  │  │            │  │         │  │         │  │         │ │  │
│  │  │• partners  │  │• people │  │• convers│  │• employ.│ │  │
│  │  │• rentals   │  │• compan.│  │• message│  │• attenda│ │  │
│  │  │• services  │  │• opport.│  │• tickets│  │• leaves │ │  │
│  │  │• products  │  │• tasks  │  │         │  │         │ │  │
│  │  │• invoices  │  │         │  │         │  │         │ │  │
│  │  │• employees │  │         │  │         │  │         │ │  │
│  │  │• chat_rooms│  │         │  │         │  │         │ │  │
│  │  │• messages  │  │         │  │         │  │         │ │  │
│  │  └────────────┘  └─────────┘  └─────────┘  └─────────┘ │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              Redis (Cache + Session + PubSub)            │  │
│  │  • Dashboard aggregáció cache (1 min TTL)                │  │
│  │  • Session store (JWT token-ek)                          │  │
│  │  • Chat PubSub (WebSocket üzenetek)                      │  │
│  │  • Rate limiting                                         │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📦 2. CORE BUSINESS MODULOK RÉSZLETESEN

### 2.1 🏠 Bérlés Modul (RENTAL) - **MVP PRIORITÁS**

**Üzleti funkciók:**
- Bérleti szerződés létrehozás és kezelés
- Partner hozzárendelés (ügyfél)
- Bérelt eszköz/ingatlan tracking
- Árazási modellek (napi/heti/havi díj)
- Kifizetési követés
- Visszaadási folyamat
- Automatikus számla generálás (Számlázz.hu)

**Adatfolyam:**
```
Partner kiválasztása
      ↓
Bérleti szerződés létrehozás
      ↓
Árazás kalkuláció (időtartam alapján)
      ↓
Szerződés aktiválás
      ↓
Kifizetési tracking (részletfizetés)
      ↓
Visszaadás rögzítés
      ↓
Végszámla generálás (Számlázz.hu API)
      ↓
NAV feladás (automatikus)
```

**Kapcsolódó entitások:**
- `rental_contracts` - Bérleti szerződések
- `rental_items` - Bérelt eszközök/ingatlanok
- `rental_payments` - Kifizetések
- `rental_returns` - Visszaadások
- `invoices` - Számlák (megosztott modul)

---

### 2.2 🔧 Szervíz Modul (SERVICE)

**Üzleti funkciók:**
- Munkalap (service ticket) létrehozás
- Hibajegy kezelés
- Alkatrész felhasználás tracking
- Munkaóra rögzítés (dolgozónként)
- Garanciális vs. fizetős munka elkülönítés
- Szolgáltatási számla generálás
- Chatwoot integráció (support ticket → service ticket)

**Adatfolyam:**
```
Partner bejelentés (hiba)
      ↓
Service Ticket létrehozás
      ↓
Dolgozó hozzárendelés
      ↓
Alkatrész felhasználás rögzítés
      ↓
Munkaóra rögzítés
      ↓
Munkalap lezárás
      ↓
Számla generálás (Számlázz.hu)
      ↓
Chatwoot ticket lezárás (integráció)
```

**Kapcsolódó entitások:**
- `service_tickets` - Munkalapok
- `service_parts` - Alkatrészek
- `service_labor` - Munkaóra
- `service_warranty` - Garancia
- `invoices` - Számlák
- `chatwoot.conversations` - Chatwoot ticket-ek (integráció)

---

### 2.3 🛒 Áruház Modul (SHOP)

**Üzleti funkciók:**
- Termék katalógus kezelés
- Készlet (inventory) tracking
- Rendelés kezelés
- Árazás és ÁFA kalkuláció
- Eladási számla generálás
- Minimum készlet riasztás

**Adatfolyam:**
```
Partner rendelés leadás
      ↓
Termékek hozzáadás (kosár)
      ↓
Készlet ellenőrzés
      ↓
Rendelés visszaigazolás
      ↓
Készlet csökkentés
      ↓
Számla generálás (Számlázz.hu)
      ↓
Kiszállítás rögzítés
```

**Kapcsolódó entitások:**
- `products` - Termékek
- `product_categories` - Kategóriák
- `inventory` - Készlet
- `orders` - Rendelések
- `order_items` - Rendelési tételek
- `invoices` - Számlák

---

### 2.4 💬 Chat Modul (INTERNAL COMMUNICATION)

**Üzleti funkciók:**
- Valós idejű belső kommunikáció
- Csoportos szobák (projektek, csapatok)
- Közvetlen üzenetek (1-1)
- Fájl megosztás
- Értesítések (push notification)
- Üzenet archíválás

**Technológia:**
- **WebSocket** (Socket.io vagy native WebSocket)
- **Redis PubSub** (multi-instance scaling support)
- **PostgreSQL** (üzenet persistence)

**Adatfolyam:**
```
Dolgozó belép szobába (WebSocket connect)
      ↓
Üzenet küldés (client → server)
      ↓
Redis PubSub broadcast (server → all connected clients)
      ↓
PostgreSQL mentés (persistence)
      ↓
Push notification (ha offline dolgozó)
```

**Kapcsolódó entitások:**
- `chat_rooms` - Szobák (csoportok)
- `chat_messages` - Üzenetek
- `chat_participants` - Résztvevők
- `chat_attachments` - Fájlok
- `employees` - Dolgozók (megosztott modul)

**Különbség Chatwoot vs. Chat:**
- **Chatwoot** = Külső ügyfélszolgálat (partnerek support ticket-jei)
- **Chat** = Belső dolgozói kommunikáció (Slack-szerű)

---

## 🔗 3. INTEGRÁCIÓK (3rd Party)

### 3.1 Twenty CRM

**Szerepe:** Partner kezelés bővítése (CRM funkciók)

**Integráció:**
- iframe beágyazás a KGC UI-ban
- SSO (JWT shared secret)
- Partner szinkronizáció: KGC → Twenty (5 percenként cron)
- Webhook: Twenty → KGC (ha CRM-ben módosítanak partnert)

**Mikor használják?**
- Sales csapat (folyamatos partnerkapcsolat menedzsment)
- Marketing (kampányok, pipeline tracking)

---

### 3.2 Chatwoot Support

**Szerepe:** Ügyfélszolgálati ticket kezelés (külső partnerek)

**Integráció:**
- iframe beágyazás a KGC UI-ban
- SSO (JWT)
- Ticket szinkronizáció: Chatwoot → KGC Service Ticket (opcionális)

**Mikor használják?**
- Support csapat (partner bejelentések)
- Szerviz csapat (ha support ticket → szervíz munkalapot generál)

---

### 3.3 Horilla HR

**Szerepe:** HR adminisztráció (szabadság, jelenlét, bérezés)

**Integráció:**
- iframe beágyazás a KGC UI-ban
- SSO (JWT)
- Dolgozó szinkronizáció: KGC → Horilla (5 percenként cron)

**Mikor használják?**
- HR admin (szabadság jóváhagyások, jelenléti ív)
- Dolgozók (saját adatok megtekintése)

---

### 3.4 Számlázz.hu API

**Szerepe:** Magyar NAV-kompatibilis számla generálás és feladás

**Integráció:**
- REST API (közvetlen hívás KGC Backend-ből)
- Szinkron művelet (számla generáláskor azonnal hívás)
- PDF + XML visszakapás (tárolás KGC adatbázisban)

**Mikor használják?**
- Bérlés modul (bérleti díj számla)
- Szervíz modul (javítási számla)
- Áruház modul (eladási számla)

---

## 🖥️ 4. DEPLOYMENT ARCHITEKTÚRA

### 4.1 Hostinger VPS Konfiguráció

**Szerver specifikáció:**
- **Csomag:** Hostinger KVM 8
- **CPU:** 8 vCPU (AMD EPYC)
- **RAM:** 32 GB
- **Storage:** 400 GB NVMe SSD
- **Bandwidth:** 32 TB/hó
- **Költség:** $19.99/hó (~€18/hó)

**Operációs rendszer:**
- Ubuntu 22.04 LTS (vagy 24.04 LTS)

**Telepített szoftverek:**
- Docker Engine 25+
- Docker Compose 2.24+
- Nginx (reverse proxy)
- Certbot (Let's Encrypt SSL)
- UFW (Uncomplicated Firewall)

---

### 4.2 Docker Compose Architektúra

#### **MVP Fázis (3 hét) - 5 Konténer:**

```yaml
services:
  # 1. PostgreSQL adatbázis
  postgres:
    image: postgres:15-alpine
    volumes:
      - postgres_data:/var/lib/postgresql/data
    environment:
      POSTGRES_DB: kgc_production
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ***
    ports:
      - "5432:5432"
    networks:
      - backend
    resources:
      limits:
        memory: 8GB
        cpus: '2'

  # 2. Redis cache + session + PubSub
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    networks:
      - backend
    resources:
      limits:
        memory: 2GB
        cpus: '0.5'

  # 3. KGC Backend (NestJS)
  kgc-backend:
    build: ./apps/kgc-backend
    environment:
      NODE_ENV: production
      DATABASE_URL: postgresql://postgres:***@postgres:5432/kgc_production?schema=kgc
      REDIS_URL: redis://redis:6379
      SZAMLAZZ_HU_AGENT_KEY: ***
      JWT_SECRET: ***
    ports:
      - "3000:3000"
    depends_on:
      - postgres
      - redis
    networks:
      - backend
      - frontend
    resources:
      limits:
        memory: 4GB
        cpus: '2'

  # 4. KGC Frontend (React)
  kgc-frontend:
    build: ./apps/kgc-frontend
    environment:
      VITE_API_URL: http://kgc-backend:3000
    ports:
      - "5173:5173"
    depends_on:
      - kgc-backend
    networks:
      - frontend
    resources:
      limits:
        memory: 2GB
        cpus: '1'

  # 5. Nginx Reverse Proxy
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./nginx/ssl:/etc/nginx/ssl
    depends_on:
      - kgc-frontend
      - kgc-backend
    networks:
      - frontend
    resources:
      limits:
        memory: 512MB
        cpus: '0.5'

networks:
  frontend:
    driver: bridge
  backend:
    driver: bridge

volumes:
  postgres_data:
```

#### **Teljes Rendszer (8-9 hét) - 11 Konténer:**

**Hozzáadódik:**
- `twenty` (Twenty CRM backend - Node.js)
- `twenty-frontend` (Twenty frontend - React)
- `chatwoot-backend` (Chatwoot API - Ruby on Rails)
- `chatwoot-frontend` (Chatwoot UI - Vue.js)
- `horilla-backend` (Horilla API - Python/Django)
- `horilla-frontend` (Horilla UI - React)

---

### 4.3 Hálózati Architektúra

```
Internet
   ↓
Cloudflare CDN (opcionális, későbbi optimalizáció)
   ↓
Hostinger VPS (Public IP: XXX.XXX.XXX.XXX)
   ↓
Nginx Reverse Proxy (:80, :443)
   ├─ / → kgc-frontend:5173
   ├─ /api → kgc-backend:3000
   ├─ /crm → twenty-frontend:3001 (később)
   ├─ /support → chatwoot-frontend:3002 (később)
   └─ /hr → horilla-frontend:3003 (később)
```

**Domain név (később):**
- `kgc-erp.hu` - Fő KGC UI
- `crm.kgc-erp.hu` - Twenty CRM (CNAME)
- `support.kgc-erp.hu` - Chatwoot (CNAME)
- `hr.kgc-erp.hu` - Horilla HR (CNAME)

**SSL tanúsítvány:**
- Let's Encrypt (ingyenes, automatikus renewal)
- Certbot + Nginx plugin

---

### 4.4 Adatbázis Struktúra

**Egy PostgreSQL példány, 4 schema:**

```
kgc_production (Database)
├── kgc (Schema)          ← KGC Core adatok
│   ├── partners
│   ├── rentals
│   ├── rental_payments
│   ├── services
│   ├── service_parts
│   ├── products
│   ├── orders
│   ├── invoices
│   ├── employees
│   ├── chat_rooms
│   └── chat_messages
│
├── twenty (Schema)       ← Twenty CRM adatok
│   ├── people
│   ├── companies
│   ├── opportunities
│   └── tasks
│
├── chatwoot (Schema)     ← Chatwoot Support adatok
│   ├── conversations
│   ├── messages
│   └── contacts
│
└── horilla (Schema)      ← Horilla HR adatok
    ├── employees
    ├── attendance
    └── leave_requests
```

**Miért 4 schema, nem 1 DB?**

✅ **Erőforrás optimalizáció** (1 PG instance vs 4 külön)
✅ **Backup egyszerűsödés** (1 `pg_dump` minden adat)
✅ **Cross-schema query** lehetőség (ha szükséges)
✅ **Collision elkerülés** (minden rendszernek saját `users` táblája)
✅ **Security** (SQL injection egy schema-n belül marad)

---

## 📁 5. PROJEKT STRUKTÚRA

### 5.1 Monorepo + Git Submodules Stratégia

```
kgc-erp-deployment/          # Fő deployment repo (új, saját)
├── docker-compose.yml       # Master orchestration
├── docker-compose.dev.yml   # Development overrides
├── .env.production          # Production környezeti változók
├── .env.development         # Development környezeti változók
│
├── nginx/                   # Reverse proxy config
│   ├── nginx.conf
│   └── ssl/                 # Let's Encrypt certok
│       ├── fullchain.pem
│       └── privkey.pem
│
├── apps/                    # Git submodule-ok
│   ├── kgc-backend/         # Submodule: Saját backend
│   │   └── .git (→ github.com/kgc-erp/kgc-backend)
│   │
│   ├── kgc-frontend/        # Submodule: Saját frontend
│   │   └── .git (→ github.com/kgc-erp/kgc-frontend)
│   │
│   ├── twenty/              # Submodule: Twenty fork
│   │   └── .git (→ github.com/kgc-erp/twenty-fork)
│   │
│   ├── chatwoot/            # Submodule: Chatwoot fork
│   │   └── .git (→ github.com/kgc-erp/chatwoot-fork)
│   │
│   └── horilla/             # Submodule: Horilla fork
│       └── .git (→ github.com/kgc-erp/horilla-fork)
│
├── scripts/
│   ├── deploy.sh            # Production deploy
│   ├── backup.sh            # Database backup
│   ├── rollback.sh          # Rollback last deploy
│   └── init-db.sh           # Initialize 4 schemas
│
└── README.md
```

**Git Workflow:**

```bash
# 1. Deployment repo klónozás
git clone git@github.com:kgc-erp/kgc-erp-deployment.git
cd kgc-erp-deployment

# 2. Submodule-ok inicializálás
git submodule init
git submodule update --recursive

# 3. Egy submodule frissítése (pl. kgc-backend)
cd apps/kgc-backend
git pull origin main
cd ../..
git add apps/kgc-backend
git commit -m "Update kgc-backend to latest"
git push

# 4. Deploy
./scripts/deploy.sh
```

---

### 5.2 Miért Submodule-ok?

✅ **Külön repo-k megtartása** (független verziókezelés)
✅ **Egy helyről deploy-olható** az egész stack
✅ **Fork-ok upstream sync** könnyű (git remote add upstream)
✅ **CI/CD egyszerűsödik** (GitHub Actions egy repo-ból)
✅ **Fejlesztői szabadság** (külön dolgozhatnak backend/frontend-en)

---

## 🚀 6. FEJLESZTÉSI ROADMAP

### 6.1 Fázis 1: Infrastruktúra Alap (3 nap)

**Cél:** Hostinger VPS előkészítés + Docker környezet

**Feladatok:**
- [ ] Hostinger VPS login (SSH kulcs beállítás)
- [ ] Ubuntu 22.04 frissítés + alapcsomagok
- [ ] Docker + Docker Compose telepítés
- [ ] UFW firewall konfiguráció (csak 22, 80, 443 port nyitva)
- [ ] PostgreSQL konténer indítás + 4 schema létrehozás
- [ ] Redis konténer indítás
- [ ] Nginx reverse proxy alap konfiguráció
- [ ] SSL (Let's Encrypt) - később, domain név után

**Kimenet:**
- ✅ VPS készen áll
- ✅ PostgreSQL + Redis fut
- ✅ Nginx proxy fut (HTTP only még)

---

### 6.2 Fázis 2A: KGC Backend MVP - Auth + Partner (3 nap)

**Cél:** Alapvető backend infrastruktúra

**Feladatok:**
- [ ] NestJS projekt scaffold
- [ ] TypeORM setup + PostgreSQL kapcsolat
- [ ] Auth modul (JWT, login/logout)
- [ ] Partner CRUD API
- [ ] Swagger API dokumentáció
- [ ] Unit tesztek (70%+ coverage)

**API Endpoints:**
```
POST   /api/auth/login
POST   /api/auth/logout
GET    /api/auth/me

GET    /api/partners
POST   /api/partners
GET    /api/partners/:id
PUT    /api/partners/:id
DELETE /api/partners/:id
```

**Kimenet:**
- ✅ Backend API elérhető `http://VPS_IP:3000/api`
- ✅ Swagger UI: `http://VPS_IP:3000/api/docs`

---

### 6.3 Fázis 2B: Bérlés Modul Backend (4 nap)

**Cél:** Bérlési core funkciók API-ja

**Feladatok:**
- [ ] Rental modul (NestJS module)
- [ ] Bérleti szerződés CRUD
- [ ] Árazási logika (napi/heti/havi ár kalkuláció)
- [ ] Kifizetési tracking API
- [ ] Visszaadási API
- [ ] Unit + Integration tesztek

**API Endpoints:**
```
GET    /api/rentals
POST   /api/rentals
GET    /api/rentals/:id
PUT    /api/rentals/:id
DELETE /api/rentals/:id

POST   /api/rentals/:id/payments
GET    /api/rentals/:id/payments

POST   /api/rentals/:id/return
```

**Kimenet:**
- ✅ Bérlés modul teljes CRUD működik
- ✅ Tesztek lefutnak (100% pass rate)

---

### 6.4 Fázis 2C: Számlázz.hu Integráció (3 nap)

**Cél:** Automatikus számlagenerálás és NAV feladás

**Feladatok:**
- [ ] Számlázz.hu API kulcs beszerzés
- [ ] Számla generálási service (NestJS)
- [ ] NAV XML + PDF visszakapás
- [ ] Invoice tábla (kgc.invoices)
- [ ] Webhook endpoint Számlázz.hu-nak (státusz frissítés)

**API Endpoints:**
```
POST   /api/invoices/generate
GET    /api/invoices/:id
GET    /api/invoices/:id/pdf
```

**Adatfolyam:**
```
Rental/Service/Order lezárás
      ↓
POST /api/invoices/generate
      ↓
Számlázz.hu API hívás (REST)
      ↓
PDF + XML visszakapás
      ↓
kgc.invoices mentés
      ↓
NAV státusz tracking
```

**Kimenet:**
- ✅ Számla generálás működik
- ✅ PDF letölthető
- ✅ NAV státusz nyomon követhető

---

### 6.5 Fázis 3A: KGC Frontend MVP (5 nap)

**Cél:** React UI a bérlés modulhoz

**Feladatok:**
- [ ] Vite + React + TypeScript scaffold
- [ ] TanStack Router (routing)
- [ ] TanStack Query (API state)
- [ ] Tailwind CSS + shadcn/ui (komponensek)
- [ ] Login screen + auth flow
- [ ] Partner lista + CRUD képernyők
- [ ] Bérlés lista + CRUD képernyők
- [ ] Dashboard (alapvető KPI-k)

**Képernyők:**
```
/login                  - Login form
/dashboard              - KPI overview
/partners               - Partner lista
/partners/:id           - Partner részletek
/rentals                - Bérlés lista
/rentals/new            - Új bérlés
/rentals/:id            - Bérlés részletek
```

**Kimenet:**
- ✅ UI elérhető `http://VPS_IP:5173`
- ✅ Partner CRUD működik
- ✅ Bérlés CRUD működik

---

### 6.6 Fázis 3B: Production Deploy + Pilot (2 nap)

**Cél:** MVP production-ba állítás és pilot tesztelés

**Feladatok:**
- [ ] Domain név vásárlás (pl: `kgc-erp.hu`)
- [ ] DNS beállítás (A record → VPS IP)
- [ ] SSL tanúsítvány (Let's Encrypt)
- [ ] Nginx konfiguráció (domain + HTTPS)
- [ ] Production deploy script
- [ ] 5 pilot user regisztrálás
- [ ] Valós bérlési adatok feltöltés (10-20 teszt szerződés)
- [ ] Pilot feedback gyűjtés

**Kimenet:**
- ✅ `https://kgc-erp.hu` elérhető
- ✅ Pilot userek tudnak dolgozni
- ✅ Feedback dokumentum készül

---

### 6.7 Fázis 4: Szervíz Modul (1.5 hét)

**Ütemezés:** Week 4-5 (post-MVP)

**Feladatok:**
- Service modul backend (NestJS)
- Service UI (React képernyők)
- Chatwoot integráció alapok (SSO + iframe)

---

### 6.8 Fázis 5: Áruház Modul (1.5 hét)

**Ütemezés:** Week 6-7 (post-MVP)

**Feladatok:**
- Shop modul backend (termék, készlet, rendelés)
- Shop UI (React képernyők)

---

### 6.9 Fázis 6: Chat Modul (1 hét)

**Ütemezés:** Week 8

**Feladatok:**
- WebSocket server (Socket.io)
- Redis PubSub setup
- Chat UI (React komponensek)
- Push notification (optional)

---

### 6.10 Fázis 7: Teljes Integráció (1 hét)

**Ütemezés:** Week 9

**Feladatok:**
- Twenty CRM fork + deploy
- Chatwoot teljes integráció
- Horilla HR fork + deploy
- Unified Dashboard (5 rendszer aggregáció)

---

## 📊 7. KÖLTSÉGVETÉS ÖSSZESÍTŐ

### 7.1 Infrastruktúra Költségek (Éves)

| Tétel | Havi | Éves | Megjegyzés |
|-------|------|------|------------|
| Hostinger VPS KVM 8 | €18 | €216 | 8 vCPU, 32GB RAM, 400GB NVMe |
| Domain név (.hu) | - | €15 | `kgc-erp.hu` + 4 subdomain (CNAME) |
| SSL tanúsítvány | €0 | €0 | Let's Encrypt (ingyenes) |
| Számlázz.hu API | változó | ~€100 | Számlánként díjas (€0.10-0.30/számla) |
| **ÖSSZESEN** | **~€25** | **~€330** | **Első év** |

### 7.2 Fejlesztési Költségek (Idő)

| Fázis | Időtartam | Kimenet |
|-------|-----------|---------|
| MVP (Bérlés) | 3 hét | Production-ready bérlés modul |
| Szervíz modul | 1.5 hét | Munkalap kezelés |
| Áruház modul | 1.5 hét | Termék + készlet |
| Chat modul | 1 hét | Belső kommunikáció |
| Integrációk | 1 hét | Twenty + Chatwoot + Horilla |
| **ÖSSZESEN** | **8-9 hét** | **Teljes KGC ERP rendszer** |

---

## 🎯 8. KULCS DÖNTÉSEK ÖSSZEFOGLALÓJA

### 8.1 Architektúra Döntések

| Kérdés | Döntés | Indoklás |
|--------|--------|----------|
| **Hány VPS szerver?** | 1 Hostinger VPS | Költséghatékony, elég kapacitás, egyszerűbb DevOps |
| **Projekt struktúra?** | Monorepo + Submodules | Külön repók megtartása + központi deploy |
| **Adatbázis?** | 1 PostgreSQL, 4 schema | Erőforrás optimalizáció, egyszerűbb backup |
| **Fejlesztési sorrend?** | Bérlés MVP → Szervíz → Áruház → Integrációk | Üzleti érték prioritás |
| **Frontend tech?** | React + TypeScript + Vite | Modern, gyors, TypeScript type-safety |
| **Backend tech?** | NestJS + TypeScript | Enterprise-grade, jó dokumentáció |
| **Chat megoldás?** | Saját WebSocket (Socket.io) | Nincs külső dependency, teljes kontroll |

---

### 8.2 Miért NEM választottunk alternatívákat?

| Alternatíva | Miért NEM? |
|-------------|------------|
| **Több VPS szerver** | 5x költség, bonyolultabb hálózat, túl korai optimalizáció |
| **Külön PostgreSQL példányok** | 4x memory overhead, bonyolult backup, cross-query lehetetlen |
| **SaaS Chat (pl. Slack)** | Havi $8/user (~€100/hó 12 userrel), adat külső szerveren |
| **Rocketchat (self-hosted chat)** | Felesleges komplexitás, még egy rendszer menedzselése |
| **All-in-one ERP (Odoo, ERPNext)** | Nehéz customizáció, vendor lock-in, magyar NAV support hiányzik |

---

## 📝 9. KÖVETKEZŐ LÉPÉSEK (ACTION ITEMS)

### Azonnali (1-3 nap)

- [ ] **Domain név vásárlás** (pl: `kgc-erp.hu`) - OPCIONÁLIS (MVP-hez IP is elég)
- [ ] **GitHub organization** létrehozás (`kgc-erp`)
- [ ] **GitHub repo-k** létrehozás:
  - `kgc-erp-deployment` (fő repo)
  - `kgc-backend` (NestJS)
  - `kgc-frontend` (React)
- [ ] **Számlázz.hu fiók** regisztráció + API kulcs
- [ ] **Hostinger VPS** SSH kulcs beállítás

### Rövid távú (1 hét)

- [ ] **Fázis 1** végrehajtás (Infrastruktúra)
- [ ] **Fázis 2A** indítás (Backend scaffold)

### Középtávú (3 hét)

- [ ] **MVP deploy** production-ba
- [ ] **Pilot tesztelés** (5 user)
- [ ] **Feedback iteráció**

---

## 🔍 10. KOCKÁZATOK ÉS MITIGÁCIÓ

| Kockázat | Valószínűség | Hatás | Mitigáció |
|----------|--------------|-------|-----------|
| **Hostinger VPS kapacitás kimerül** | Alacsony | Közepes | Monitoring (Grafana), autoscale terv Docker Swarm-ra |
| **Számlázz.hu API változás** | Alacsony | Magas | Adapter pattern (könnyen cserélhető provider) |
| **PostgreSQL single point of failure** | Közepes | Kritikus | Napi backup (pg_dump), later: streaming replication |
| **SSL tanúsítvány lejár** | Alacsony | Közepes | Certbot auto-renewal (cron job) |
| **Chat WebSocket skálázás** | Közepes | Közepes | Redis PubSub (horizontális skálázáshoz készen áll) |
| **Twenty/Chatwoot/Horilla upstream frissítés törés** | Közepes | Közepes | Git fork + selective merge, staging környezetben tesztelés |

---

## 📞 11. SUPPORT ÉS DOKUMENTÁCIÓ

**Dokumentáció helye:**
- `docs/deployment/` - Ez az összefoglaló + részletes setup guide-ok (később)
- `docs/architecture/` - Architektúra diagramok (meglévő)
- `README.md` - Gyors indítás (minden repo-ban)

**Kapcsolat:**
- Tech Lead: `tech@kgc-erp.hu` (később)
- GitHub Issues: `github.com/kgc-erp/kgc-erp-deployment/issues`

---

## 🎉 12. ÖSSZEGZÉS

**KGC ERP = Hibrid Rendszer:**
- **4 Core Business Modul** (Bérlés, Szervíz, Áruház, Chat) → **Saját fejlesztés**
- **4 Supporting System** (Twenty CRM, Chatwoot, Horilla, Számlázz.hu) → **Integráció**

**Deployment:**
- **1 Hostinger VPS** (€18/hó)
- **1 PostgreSQL** (4 schema)
- **Docker Compose** (5 konténer MVP, 11 teljes)

**Timeline:**
- **3 hét MVP** (Bérlés modul)
- **8-9 hét teljes rendszer** (minden modul + integrációk)

**Következő lépés:**
- ✅ **Infrastruktúra setup** (Fázis 1 - 3 nap)

---

**Verzió:** 3.0
**Frissítve:** 2025-12-21
**Készítők:** Winston (Architect), John (PM), Amelia (Dev), Bob (SM), Caravaggio (Presentation Master)

🎯 **JAVASLAT: AZONNALI INDÍTÁS FÁZIS 1-gyel!**
