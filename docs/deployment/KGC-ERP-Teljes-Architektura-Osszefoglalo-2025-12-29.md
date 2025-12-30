# KGC ERP - Teljes Architektúra Összefoglaló

**Verzió:** 4.2
**Dátum:** 2025-12-29
**Státusz:** 📦 Plugin Architektúra + Inventory/Raktárkezelés + Architektúra Review ✅ | Tervezési Fázis
**Prioritás:** 🏠 Bérlés MVP (3 hét) → 📦 Inventory (3 hét) → 🔌 Plugin Modulok (opcionális)
**Review:** ✅ Winston (Architect) - 30 finding (8 kritikus, 12 magas, 10 közepes)

---

## 📋 Executive Summary

A KGC ERP egy **plugin-alapú hibrid architektúrájú** rendszer, amely ötvözi az **egyedi fejlesztésű core modulokat** (Bérlés, Szervíz, Értékesítés, Pénzügy, **🆕 Raktárkezelés/Inventory**) és az **opcionális plugin modulokat** (Support AI, CRM, HR) valamint a **magyar NAV-integrációt** (Számlázz.hu).

### 🆕 Inventory/Raktárkezelés Modul (v4.1)

**Központosított CIKK entitás** minden készlethez:
- **Bérgépek** (BGP, BSZ) - `berlet=true` flag + státusz (bent/kint/szerviz) + serial number
- **Értékesítési termékek** - normál készlet tracking
- **Szerviz alkatrészek** (ALK) - `alkatresz=true` flag

**Funkciók:**
- ✅ Multi-Warehouse (2-5 raktár/telephely)
- ✅ Raktári Lokációk (Polc-Sor-Oszlop: A12-03-05)
- ✅ Serial Number Tracking (bérgépekhez kritikus)
- ✅ Bérgép Státusz (bent/kint/szerviz)
- ✅ Készletmozgás Napló
- ✅ Inventory Audit/Leltár
- ✅ Stock Transfer (telephelyek között)

**Fejlesztési idő:** 3 hét (Fázis 6)

### 🎯 Kulcs Döntések (Frissítve)

| Terület | Döntés | Verzió |
|---------|--------|--------|
| **Infrastruktúra** | 1 Hostinger VPS (KVM 8: 8 vCPU, 32GB RAM, 400GB NVMe) | v3.0 ✅ |
| **Adatbázis** | 1 PostgreSQL példány (4 logikai schema) | v3.0 ✅ |
| **Orchestration** | Docker Compose (3-5 konténer MVP, 11+ teljes rendszer) | v3.0 ✅ |
| **Projekt struktúra** | Monorepo + Git Submodules | v3.0 ✅ |
| **Fejlesztési módszer** | Iteratív: MVP (3 hét) → Full System (8-9 hét) | v3.0 ✅ |
| **🆕 Modul Filozófia** | **Plugin Architektúra** - Runtime enable/disable modulok | v4.0 🎉 |
| **🆕 Support Modul** | Kokó AI (Gemini 2.0 + Chatwoot) - Opcionális plugin | v4.0 🤖 |
| **🆕 CRM Modul** | Twenty CRM (self-hosted) - Opcionális plugin | v4.0 📊 |
| **🆕 HR Modul** | Horilla HRMS (Django) - Opcionális plugin | v4.0 👥 |

### 💰 Költségek (Frissítve)

| Tétel | Havi | Éves | Megjegyzés |
|-------|------|------|------------|
| **Hostinger VPS KVM 8** | €18 | €216 | 8 vCPU, 32GB RAM, 400GB NVMe |
| **Domain + DNS** | - | €15 | `kgc-erp.hu` + subdomainek |
| **SSL Tanúsítvány** | €0 | €0 | Let's Encrypt (ingyenes auto-renewal) |
| **Számlázz.hu API** | változó | ~€100 | €0.10-0.30/számla (becsült) |
| **🆕 Support Modul (Kokó AI)** | €37-100 | €450-1200 | Gemini API (context caching) - OPCIONÁLIS |
| **🆕 CRM Modul (Twenty)** | €0 | €0 | Self-hosted (már benne VPS-ben) - OPCIONÁLIS |
| **🆕 HR Modul (Horilla)** | €5-30 | €60-360 | Franchise partner-enként - OPCIONÁLIS |
| **ÖSSZESEN (alap)** | **~€25** | **~€330** | Core ERP modulok |
| **ÖSSZESEN (plugin-ekkel)** | **~€67-155** | **~€840-1900** | Core + Mind a 3 plugin |

**Megjegyzés:** A plugin modulok teljesen opcionálisak. Az alap KGC ERP (Bérlés, Szervíz, Értékesítés, Pénzügy) ~€25/hó költséggel működik plugin-ek nélkül is.

---

## 🆕 1. PLUGIN ARCHITEKTÚRA (ÚJ V4.0)

### 1.1 Filozófia: Opcionális, Lazán Csatolt Modulok

**Alapelv:** Minden nem-core funkció (Support, CRM, HR) **plugin modulként** integrálódik a rendszerbe.

```
┌──────────────────────────────────────────────────────────────┐
│                     KGC ERP CORE                             │
│         (Független a plugin moduloktól)                      │
│                                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│  │ BÉRLÉS   │  │ÉRTÉKESÍTÉS│  │ SZERVÍZ  │  │ PÉNZÜGY  │    │
│  │          │  │          │  │          │  │          │    │
│  │• Szerződés│ │• Termék  │  │• Munkalap│  │• Számla  │    │
│  │• Árazás  │  │• Készlet │  │• Alkatrész│ │• Fizetés │    │
│  │• Kifizetés│ │• Rendelés│  │• Munkaóra│  │• Számlázz│    │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘    │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │       Integration Layer (Plugin Manager)               │  │
│  │                                                        │  │
│  │  • Plugin Discovery & Registry                        │  │
│  │  • Runtime Enable/Disable (Feature Flags)             │  │
│  │  • API Gateway Routing                                │  │
│  │  • Webhook Event Bus                                  │  │
│  │  • Health Check & Monitoring                          │  │
│  └────────────────────────────────────────────────────────┘  │
│                           │                                  │
└───────────────────────────┼──────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
┌───────────────┐  ┌───────────────┐  ┌───────────────┐
│ 🤖 SUPPORT    │  │ 📊 CRM        │  │ 👥 HR         │
│ PLUGIN        │  │ PLUGIN        │  │ PLUGIN        │
│               │  │               │  │               │
│ Kokó AI       │  │ Twenty CRM    │  │ Horilla HRMS  │
│ • Gemini AI   │  │ • GraphQL API │  │ • Django API  │
│ • Chatwoot    │  │ • Marketing   │  │ • Jelenlét    │
│ • 24/7 Chatbot│  │ • Campaigns   │  │ • Szabadság   │
│               │  │               │  │               │
│ ENABLED ✅    │  │ ENABLED ✅    │  │ ENABLED ✅    │
└───────────────┘  └───────────────┘  └───────────────┘
```

### 1.2 Plugin Jellemzők

| Jellemző | Leírás | Implementáció |
|----------|--------|---------------|
| **Opcionális** | KGC ERP core működik a plugin nélkül is | Feature flag: `{MODULE}_ENABLED=true/false` |
| **Runtime toggle** | Ki/be kapcsolható újradeployment nélkül | Admin panel vagy ENV var |
| **Lazán csatolt** | API-first integráció, nincs közös kódbázis | RESTful API + Webhook események |
| **Graceful degradation** | Plugin hiba nem blokkolja a főrendszert | Try-catch, fallback, health check |
| **Független deployment** | Plugin külön konténerben, verziókezelése független | Docker Compose services |
| **Adatok szinkronizálása** | KGC push/webhook → Plugin pull/cache | Egyirányú vagy kétirányú sync |

### 1.3 Integráció Módszerei

```
┌──────────────────────────────────────────────────────────────┐
│                   KGC ERP CORE API                           │
│                                                              │
│  REST API Endpoints:                                         │
│  GET  /api/rentals/{id}           (Bérlés adatok)           │
│  GET  /api/services/{id}          (Szervíz adatok)          │
│  GET  /api/products/{id}          (Termék adatok)           │
│  GET  /api/customers/{phone}      (Ügyfél azonosítás)       │
│                                                              │
│  Webhook Események:                                          │
│  POST /webhooks/rental.started                              │
│  POST /webhooks/service.completed                           │
│  POST /webhooks/order.fulfilled                             │
└──────────────────────────────────────────────────────────────┘
        │                   │                   │
        │ (API Pull)        │ (Webhook Push)    │
        ▼                   ▼                   ▼
┌───────────────┐  ┌───────────────┐  ┌───────────────┐
│ Support Plugin│  │ CRM Plugin    │  │ HR Plugin     │
│               │  │               │  │               │
│ Lekérdezi:    │  │ Fogadja:      │  │ Szinkronizál: │
│ • Szerviz     │  │ • Szolgáltatás│  │ • Employee    │
│   státusz     │  │   előzmények  │  │   törzsadatok │
│ • Ügyfél info │  │ • Marketing   │  │ • Jelenlét    │
│               │  │   trigger     │  │               │
└───────────────┘  └───────────────┘  └───────────────┘
```

---

## 🤖 2. SUPPORT PLUGIN MODUL (Kokó AI)

### 2.1 Áttekintés

**Szerepe:** 24/7 intelligens ügyfélszolgálat AI chatbot-tal (Gemini 2.0 Flash Exp)

**Technológia Stack:**
- **AI Motor:** Google Gemini 2.0 Flash Experimental
- **Chat Platform:** Chatwoot (open-source)
- **Context Manager:** Custom Node.js service
- **Calendar:** Google Calendar API (időpontfoglalás)
- **Deployment:** Docker Compose (3 konténer: Chatwoot + Context Manager + Redis)

**Státusz:** ✅ Teljes dokumentáció elkészült (69 oldal spec)

### 2.2 Fő Funkciók

| Funkció | Leírás | Integrációs Pont |
|---------|--------|------------------|
| **Szerviz Státusz Lekérdezés** | "Hol tart a gépem javítása?" | `GET /api/services/{id}` |
| **Rendelés Követés** | "Mikor érkezik be a rendelésem?" | `GET /api/orders/{id}` |
| **Időpontfoglalás** | "Szeretnék időpontot szervizre" | Google Calendar + `POST /api/services/appointments` |
| **Késés Értesítés** | "Miért késik a bérlés visszaadása?" | `GET /api/rentals/{id}` |
| **Ügyfél Azonosítás** | Telefonszám alapú auth | `GET /api/customers/{phone}` |
| **Többnyelvű Támogatás** | Magyar / Angol válaszok | Gemini prompt config |

### 2.3 Költségbecslés

| Költség Elem | Havi Mennyiség | Ár | Összeg |
|--------------|----------------|-----|--------|
| **Gemini API (Context Caching)** | 1M token prompt + 500K output | $0.04/1M input (cached) | $40-60/hó |
| **Chatwoot Hosting** | Benne VPS-ben (self-hosted) | €0 | €0 |
| **Google Calendar API** | Ingyenes tier (10K req/nap) | €0 | €0 |
| **Redis Cache** | Benne VPS-ben | €0 | €0 |
| **🔥 Context Caching Megtakarítás** | 75%-os token költség csökkentés | - | **-€120/hó** |
| **ÖSSZESEN** | - | - | **€37-55/hó** |

**Optimalizáció:** Context Caching használata 75% költségmegtakarítást eredményez!

### 2.4 Integrációs API-k

**KGC → Support (API Pull):**
```http
GET /api/services/{service_id}/status
GET /api/rentals/{rental_id}/status
GET /api/orders/{order_id}/status
GET /api/customers/{phone_number}
```

**KGC → Support (Webhook Push):**
```http
POST /webhooks/support/rental.started
POST /webhooks/support/service.completed
POST /webhooks/support/order.fulfilled
POST /webhooks/support/service.quote-ready
POST /webhooks/support/product.arrived
```

**Dokumentáció:** [docs/ERP/Support/KGC-SUPPORT-INTEGRATION-ARCHITECTURE.md](../ERP/Support/KGC-SUPPORT-INTEGRATION-ARCHITECTURE.md)

---

## 📊 3. CRM PLUGIN MODUL (Twenty CRM)

### 3.1 Áttekintés

**Szerepe:** Ügyfélkapcsolat menedzsment, marketing automatizáció, sales pipeline

**Technológia Stack:**
- **Platform:** Twenty CRM (self-hosted, open-source)
- **API:** GraphQL
- **Frontend:** React (beágyazott iframe a KGC UI-ba)
- **Backend:** Node.js + PostgreSQL
- **Deployment:** Docker Compose (2 konténer: Twenty Backend + Frontend)

**Státusz:** ✅ Teljes dokumentáció elkészült (42K spec)

### 3.2 Fő Funkciók

| Funkció | Leírás | Integrációs Pont |
|---------|--------|------------------|
| **Szolgáltatás Előzmények** | Bérlések, szervizek, vásárlások CRM-be szinkronizálása | Webhook push: `rental.completed`, `service.completed` |
| **Lead Követés** | Sales pipeline, konverziós arány tracking | CRM belső funkció |
| **Marketing Kampányok** | Email kampányok, ügyfél szegmentáció | CRM belső funkció + Twenty API |
| **Customer 360° View** | Teljes ügyfél interakciós előzmény | GraphQL query: KGC adatok aggregálása |
| **Partner Szinkronizáció** | KGC partner adatok → Twenty (read-only) | Egyirányú sync: KGC master → Twenty slave |

### 3.3 Adatforrás: KGC Master

**Stratégiai döntés:** A partner törzsadatok **KGC-ben** jönnek létre és tárolódnak. Twenty CRM **read-only view**-t kap.

```
┌────────────────────────────────────────────────────────────┐
│  KGC ERP (MASTER)                                          │
│                                                            │
│  Partner Törzsadatok:                                      │
│  • Név, cím, telefon, email                                │
│  • Partner típus (magán/cég)                               │
│  • Partner státusz (aktív/inaktív)                         │
│                                                            │
│  Szolgáltatási Adatok:                                     │
│  • Bérlési előzmények                                      │
│  • Szervíz előzmények                                      │
│  • Vásárlási előzmények                                    │
└────────────────────────────────────────────────────────────┘
                    │
                    │ (Webhook Push vagy Cron Sync)
                    ▼
┌────────────────────────────────────────────────────────────┐
│  Twenty CRM (SLAVE - Read-Only View)                       │
│                                                            │
│  Importált Adatok (csak olvasható):                        │
│  • Partner alapadatok (szinkronizálva)                     │
│  • Szolgáltatási interakciók (szinkronizálva)              │
│                                                            │
│  CRM Belső Funkciók (írható):                              │
│  • Lead státusz (nincs KGC-ben)                            │
│  • Marketing kampány tagság                                │
│  • Sales pipeline pozíció                                  │
│  • Notes & Activity log (CRM specifikus)                   │
└────────────────────────────────────────────────────────────┘
```

### 3.4 Költségbecslés

| Költség Elem | Összeg | Megjegyzés |
|--------------|--------|------------|
| **Twenty CRM (self-hosted)** | €0/hó | Open-source, benne VPS-ben |
| **PostgreSQL schema (CRM)** | €0/hó | Közös PostgreSQL példány |
| **GraphQL Adapter fejlesztés** | Egyszeri | 2-3 nap fejlesztés |
| **ÖSSZESEN** | **€0/hó** | Infrastruktúra költség nincs |

**Dokumentáció:** [docs/ERP/CRM/KGC-CRM-INTEGRATION-ARCHITECTURE.md](../ERP/CRM/KGC-CRM-INTEGRATION-ARCHITECTURE.md)

---

## 👥 4. HR PLUGIN MODUL (Horilla HRMS)

### 4.1 Áttekintés

**Szerepe:** HR adminisztráció, jelenlét nyilvántartás, szabadság kezelés

**Technológia Stack:**
- **Platform:** Horilla HRMS (open-source)
- **Framework:** Python + Django
- **API:** Django REST Framework
- **Frontend:** Bootstrap (beágyazott iframe a KGC UI-ba)
- **Deployment:** Docker Compose (1 konténer: Horilla Backend + Frontend)

**Státusz:** ✅ Teljes dokumentáció elkészült (32K spec)

### 4.2 Fő Funkciók

| Funkció | Leírás | Integrációs Pont |
|---------|--------|------------------|
| **Attendance Tracking** | Jelenlét nyilvántartás (ki dolgozik ma, ki beteg) | Horilla belső funkció |
| **Leave Management** | Szabadság/távollét igénylés és jóváhagyás | Horilla belső funkció |
| **Employee Törzsadatok** | Alapvető munkavállaló info + role kezelés | Egyirányú sync: KGC master → Horilla slave |
| **Shift Planning** | Műszak beosztás (opcionális) | Horilla belső funkció |
| **HR Helpdesk** | Belső ticketing (opcionális) | Horilla belső funkció |

### 4.3 Adatforrás: KGC Master

```
┌────────────────────────────────────────────────────────────┐
│  KGC ERP (MASTER)                                          │
│                                                            │
│  Employee Törzsadatok:                                     │
│  • ID, név, email, telefon                                 │
│  • Role (admin, technikus, értékesítő)                     │
│  • Státusz (aktív/inaktív)                                 │
└────────────────────────────────────────────────────────────┘
                    │
                    │ (Cron Sync - 5 percenként)
                    ▼
┌────────────────────────────────────────────────────────────┐
│  Horilla HRMS (SLAVE - Enhanced View)                     │
│                                                            │
│  Importált Adatok (szinkronizálva):                        │
│  • Employee alapadatok (csak olvasható)                    │
│                                                            │
│  HR Belső Funkciók (írható):                               │
│  • Attendance records (jelenlét)                           │
│  • Leave requests (szabadság)                              │
│  • Employee profiles (gazdagított adatok)                  │
└────────────────────────────────────────────────────────────┘
```

### 4.4 Költségbecslés

| Költség Elem | Összeg | Megjegyzés |
|--------------|--------|------------|
| **Horilla HRMS (self-hosted)** | €0/hó | Open-source, benne VPS-ben |
| **PostgreSQL schema (HR)** | €0/hó | Közös PostgreSQL példány |
| **🆕 Opcionális cloud sync** | €5-30/hó franchise | Ha multi-location attendance tracking kell |
| **ÖSSZESEN** | **€0-30/hó** | Franchise mérettől függ |

**Dokumentáció:** [docs/ERP/HR/KGC-HR-INTEGRATION-ARCHITECTURE.md](../ERP/HR/KGC-HR-INTEGRATION-ARCHITECTURE.md)

---

## 🏗️ 5. RENDSZERARCHITEKTÚRA (FRISSÍTETT V4.0)

### 5.1 Teljes Komponens Áttekintés

```
┌─────────────────────────────────────────────────────────────────────┐
│                         KGC ERP ÖKOSZISZTÉMA v4.0                   │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │                   FRONT-END RÉTEG                             │ │
│  │                                                               │ │
│  │  KGC Admin UI (React + TypeScript + Vite)                    │ │
│  │                                                               │ │
│  │  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐   │ │
│  │  │Dashb││Bérlés││Szerviz││Értékes││Pénzügy││Chat ││Plugin││  │ │
│  │  │     ││     ││     ││     ││     ││WS   ││Mgr  ││  │ │
│  │  │5 API││CRUD ││CRUD ││CRUD ││Számla││Msg  ││     ││  │ │
│  │  └──┬──┘└──┬──┘└──┬──┘└──┬──┘└──┬──┘└──┬──┘└──┬──┘   │ │
│  │     │     │     │     │     │     │     │      │ │
│  │     │     │     │     │     │     │     ▼      │ │
│  │     │     │     │     │     │     │  ┌─────────────┐ │ │
│  │     │     │     │     │     │     │  │🤖 Support  ││ │ │
│  │     │     │     │     │     │     │  │📊 CRM      ││ │ │
│  │     │     │     │     │     │     │  │👥 HR       ││ │ │
│  │     │     │     │     │     │     │  │ (iframe)   ││ │ │
│  │     │     │     │     │     │     │  └─────────────┘ │ │
│  └─────┼─────┼─────┼─────┼─────┼─────┼─────────────────┘ │
│        │     │     │     │     │     │                   │
└────────┼─────┼─────┼─────┼─────┼─────┼───────────────────┘
         │     │     │     │     │     │
         ▼     ▼     ▼     ▼     ▼     ▼
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
│  │  │  │ BÉRLÉS   │  │ SZERVÍZ  │  │ÉRTÉKESÍTÉS│  │PÉNZÜGY │ │ │ │
│  │  │  │ (Rental) │  │ (Service)│  │  (Sales)  │  │(Finance│ │ │ │
│  │  │  │          │  │          │  │          │  │        │ │ │ │
│  │  │  │• Szerződés│ │• Munkalap│  │• Rendelés│  │• Számla│ │ │ │
│  │  │  │• Árazás  │  │• Hibajegy│  │• Partner │  │• Fizet │ │ │ │
│  │  │  │• Kifizetés│ │• Munkaóra│  │• Árazás  │  │• Szla.hu│ │ │ │
│  │  │  └─────┬────┘  └────┬─────┘  └────┬─────┘  └───┬────┘ │ │ │
│  │  │        │            │             │            │      │ │ │
│  │  │        └────────────┼─────────────┼────────────┘      │ │ │
│  │  │                     │             │                   │ │ │
│  │  └─────────────────────┼─────────────┼───────────────────┘ │ │
│  │                        │             │                     │ │
│  │  ┌─────────────────────┴─────────────┴───────────────────┐ │ │
│  │  │         🆕 RAKTÁRKEZELÉS/INVENTORY MODUL 🆕            │ │ │
│  │  │          (Központosított Készletnyilvántartás)         │ │ │
│  │  │                                                        │ │ │
│  │  │  • CIKK (Bérgépek + Termékek + Alkatrészek)           │ │ │
│  │  │  • Multi-Warehouse (2-5 raktár)                       │ │ │
│  │  │  • Serial Number + Raktári Lokációk                   │ │ │
│  │  │  • Bérgép Státusz (bent/kint/szerviz)                 │ │ │
│  │  │  • Készletmozgás Napló + Leltár                       │ │ │
│  │  └────────────────────┬───────────────────────────────────┘ │ │
│  │                       │                                     │ │
│  │  ┌────────────────────┴───────────────────────────────────┐ │ │
│  │  │               MEGOSZTOTT MODULOK                       │ │ │
│  │  │                                                        │ │ │
│  │  │  ┌─────────┐ ┌─────────┐ ┌────────┐ ┌────────────┐   │ │ │
│  │  │  │ Ügyfél  │ │  Chat   │ │  Auth  │ │ Employee   │   │ │ │
│  │  │  │(Customer│ │(Internal│ │  (JWT) │ │(Worker Mgmt│   │ │ │
│  │  │  └────┬────┘ └────┬────┘ └───┬────┘ └─────┬──────┘   │ │ │
│  │  │       │           │          │            │          │ │ │
│  │  └───────┼───────────┼──────────┼────────────┼──────────┘ │ │
│  │          │           │          │            │           │ │
│  │  ┌───────┴───────────┴──────────┴────────────┴─────────┐ │ │
│  │  │          🆕 PLUGIN INTEGRATION LAYER 🆕              │ │ │
│  │  │                                                     │ │ │
│  │  │  • Plugin Discovery & Registry                     │ │ │
│  │  │  • Feature Flags (runtime enable/disable)          │ │ │
│  │  │  • API Gateway Routing                             │ │ │
│  │  │  • Webhook Event Bus                               │ │ │
│  │  │  • Health Check & Monitoring                       │ │ │
│  │  │                                                     │ │ │
│  │  │  ┌─────────┐ ┌──────────┐ ┌─────────┐             │ │ │
│  │  │  │Support  │ │   CRM    │ │   HR    │             │ │ │
│  │  │  │Adapter  │ │ Adapter  │ │ Adapter │             │ │ │
│  │  │  │(REST)   │ │(GraphQL) │ │(Django) │             │ │ │
│  │  │  └─────────┘ └──────────┘ └─────────┘             │ │ │
│  │  └─────────────────────────────────────────────────────┘ │ │
│  └───────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
         │           │            │
         ▼           ▼            ▼
┌─────────────────────────────────────────────────────────────────┐
│                        PLUGIN MODULOK (OPCIONÁLIS)              │
│                                                                 │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐  │
│  │  🤖 SUPPORT      │  │  📊 CRM          │  │  👥 HR       │  │
│  │  (Kokó AI)       │  │  (Twenty)        │  │  (Horilla)   │  │
│  │                  │  │                  │  │              │  │
│  │ • Chatwoot       │  │ • GraphQL API    │  │ • Django API │  │
│  │ • Gemini 2.0     │  │ • Marketing      │  │ • Attendance │  │
│  │ • Context Mgr    │  │ • Sales Pipeline │  │ • Leave Mgmt │  │
│  │ • Calendar API   │  │ • Customer 360   │  │ • Shift Plan │  │
│  └──────────────────┘  └──────────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────────────┘
         │           │            │
         ▼           ▼            ▼
┌─────────────────────────────────────────────────────────────────┐
│                        ADAT RÉTEG                               │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │         PostgreSQL 15+ (Single Instance)                 │  │
│  │                                                          │  │
│  │  ┌────────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐ │  │
│  │  │    kgc     │  │ support │  │   crm   │  │   hr    │ │  │
│  │  │  (schema)  │  │(schema) │  │(schema) │  │(schema) │ │  │
│  │  │            │  │         │  │         │  │         │ │  │
│  │  │• customers │  │• convers│  │• contacts│ │• employ.│ │  │
│  │  │• rentals   │  │• messages│ │• leads  │  │• attenda│ │  │
│  │  │• services  │  │• tickets│  │• opport.│  │• leaves │ │  │
│  │  │• products  │  │• kb_docs│  │• tasks  │  │• shifts │ │  │
│  │  │• invoices  │  │         │  │         │  │         │ │  │
│  │  │• employees │  │         │  │         │  │         │ │  │
│  │  │• chat_rooms│  │         │  │         │  │         │ │  │
│  │  └────────────┘  └─────────┘  └─────────┘  └─────────┘ │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              Redis (Cache + Session + PubSub)            │  │
│  │  • Dashboard aggregáció cache (1 min TTL)                │  │
│  │  • Session store (JWT token-ek)                          │  │
│  │  • Chat PubSub (WebSocket üzenetek)                      │  │
│  │  • Rate limiting                                         │  │
│  │  • 🆕 Plugin health status cache                         │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### 5.2 Főbb Változások v3.0 → v4.0

| Komponens | v3.0 (2025-12-21) | v4.0 (2025-12-29) | Változás |
|-----------|-------------------|-------------------|----------|
| **Modulok** | Twenty, Chatwoot, Horilla (benne core-ban) | Support, CRM, HR **plugin modulok** | ✅ Plugin architektúra |
| **Integráció** | iframe beágyazás + adapter | Plugin Manager + Feature Flags + API | ✅ Lazább csatolás |
| **PostgreSQL** | 4 schema (kgc, twenty, chatwoot, horilla) | 4 schema (kgc, support, crm, hr) | ✅ Átnevezés (konzisztencia) |
| **Chat** | Chatwoot (külső support) | Chatwoot (Support plugin része) | ✅ Ügyfélszolgálat plugin |
| **CRM** | Twenty (benne core) | Twenty (CRM plugin) | ✅ Opcionális modul |
| **HR** | Horilla (benne core) | Horilla (HR plugin) | ✅ Opcionális modul |
| **Support AI** | Nincs | Kokó AI (Gemini + Chatwoot plugin) | 🎉 ÚJ modul |
| **Feature Flags** | Nincs | ENV: `{MODULE}_ENABLED=true/false` | 🎉 Runtime toggle |
| **Költség** | ~€230/év | €330/év (alap) vagy €840-1900/év (plugin-ekkel) | ⚠️ Plugin-ek opcionálisak |

---

## 📦 6. CORE BUSINESS MODULOK (VÁLTOZATLAN v3.0-ból)

### 6.1 🏠 Bérlés Modul (RENTAL) - **MVP PRIORITÁS**

**Üzleti funkciók:**
- Bérleti szerződés létrehozás és kezelés
- Partner hozzárendelés (ügyfél)
- Bérelt eszköz/ingatlan tracking
- Árazási modellek (napi/heti/havi díj)
- Kifizetési követés
- Visszaadási folyamat
- Automatikus számla generálás (Számlázz.hu)

**Kapcsolódó plugin integráció:**
- **Support Plugin:** Késés értesítés, státusz lekérdezés
- **CRM Plugin:** Bérlési előzmények szinkronizálása

### 6.2 📦 Raktárkezelés/Inventory Modul (INVENTORY) - **MEGOSZTOTT ALAP MODUL**

**Szerepe:** Központosított készletnyilvántartás minden modulhoz (Bérlés, Szervíz, Értékesítés)

#### 6.2.1 Központosított CIKK Entitás

**Filozófia:** Egyetlen `CIKK` adatbázis minden típusú készletre, de **logikai elkülönítés** attribútumokkal.

```
┌────────────────────────────────────────────────────────────┐
│              KÖZPONTI CIKK ENTITÁS (Inventory)             │
│                                                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │   BÉRGÉPEK   │  │  ÉRTÉKESÍTÉS │  │  ALKATRÉSZEK │    │
│  │   (BGP/BSZ)  │  │   (Normál)   │  │    (ALK)     │    │
│  │              │  │              │  │              │    │
│  │ • berlet=true│  │ • berlet=false│ │ • alkatresz= │    │
│  │ • Státusz:   │  │ • Normál     │  │   true       │    │
│  │   - bent     │  │   készlet    │  │ • Szervizhez │    │
│  │   - kint     │  │   tracking   │  │   használt   │    │
│  │   - szerviz  │  │              │  │              │    │
│  │ • Serial #   │  │              │  │              │    │
│  └──────────────┘  └──────────────┘  └──────────────┘    │
│                                                            │
│  Közös attribútumok minden cikkhez:                        │
│  • id, cikk_kod, megnevezes, leiras                        │
│  • cikkcsoport (BGP, BSZ, ALK, normál kategóriák)          │
│  • serial_number (egyedi eszköz azonosító - opcionális)    │
│  • mennyiseg (aktuális készlet)                            │
│  • ar, afa_kulcs                                           │
│  • warehouse_id (melyik raktárban)                         │
│  • location_code (Polc-Sor-Oszlop, pl: A12-03-05)         │
└────────────────────────────────────────────────────────────┘
```

#### 6.2.2 Fő Funkciók

| Funkció | Leírás | Példa |
|---------|--------|-------|
| **Multi-Warehouse** | 2-5 raktár/telephely támogatás | Budapest, Debrecen, Szeged, stb. |
| **Raktári Lokációk** | Polc-Sor-Oszlop szintű tárolás | `A12-03-05` = A épület, 12-es polc, 3. sor, 5. oszlop |
| **Serial Number Tracking** | Egyedi eszköz azonosítók (bérgépekhez kritikus) | Makita MA120 - Saját belső kód + gyári sorszám |
| **Cikkcsoportok** | Logikai szegmentálás | BGP (Bérgép), BSZ (Bérszerszám), ALK (Alkatrész), ÉRT (Értékesítés) |
| **Bérgép Státusz** | `berlet=true` cikkeknél: `bent`, `kint`, `szerviz` | Makita talajvágó: `bent` → kiadható |
| **Készletmozgás Napló** | Ki, mikor, miért (vett ki/tett be) | `2025-12-29 10:30 - Kiss János - Bérlés R-2025-001` |
| **Minimum Készlet Riasztás** | Értesítés ha készlet < minimum | Email/notification ha alkatrész < 5 db |
| **Inventory Valuation** | Készlet értéke (beszerzési ár * mennyiség) | Teljes raktár értéke: 15.000.000 Ft |
| **Stock Transfer** | Telephelyek közötti átcsoportosítás | Budapest → Debrecen: 10 db csavar |
| **Inventory Audit/Leltár** | Leltározási funkció | Éves leltár: tervezett vs. tényleges készlet |

#### 6.2.3 Adatmodell (Főbb Táblák)

```sql
-- Központi CIKK entitás
CREATE TABLE cikk (
  id UUID PRIMARY KEY,
  cikk_kod VARCHAR(50) UNIQUE,        -- Belső kód (pl: MA120)
  megnevezes VARCHAR(255),            -- Makita talajvágó
  leiras TEXT,
  cikkcsoport VARCHAR(10),            -- BGP, BSZ, ALK, ÉRT

  -- Logikai flagek
  berlet BOOLEAN DEFAULT FALSE,       -- Bérlésre szánt gép?
  alkatresz BOOLEAN DEFAULT FALSE,    -- Szerviz alkatrész?

  -- Készlet info
  mennyiseg DECIMAL(10,2),            -- Aktuális készlet
  egyseg VARCHAR(10),                 -- db, kg, m, stb.
  ar DECIMAL(10,2),                   -- Eladási ár
  beszerzes_ar DECIMAL(10,2),         -- Beszerzési ár
  afa_kulcs INTEGER,                  -- 27%, 5%, stb.

  -- Raktári info
  warehouse_id UUID REFERENCES warehouse(id),
  location_code VARCHAR(20),          -- A12-03-05
  min_keszlet DECIMAL(10,2),          -- Minimum riasztás

  -- Serial number (opcionális, bérgépeknél kötelező)
  serial_number VARCHAR(100),         -- Gyári sorszám vagy saját kód

  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- Raktárak (Telephelyek)
CREATE TABLE warehouse (
  id UUID PRIMARY KEY,
  nev VARCHAR(100),                   -- Budapest - Fő raktár
  cim VARCHAR(255),
  aktiv BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP
);

-- Készletmozgás napló
CREATE TABLE inventory_movement (
  id UUID PRIMARY KEY,
  cikk_id UUID REFERENCES cikk(id),
  warehouse_id UUID REFERENCES warehouse(id),

  mozgas_tipus VARCHAR(20),           -- BE, KI, TRANSFER, LELTÁR
  mennyiseg DECIMAL(10,2),            -- +10 vagy -5
  location_code_from VARCHAR(20),     -- Honnan
  location_code_to VARCHAR(20),       -- Hova

  ref_tipus VARCHAR(50),              -- RENTAL, SERVICE, SALE, TRANSFER
  ref_id UUID,                        -- Hivatkozás bérlés/szerviz/rendelés ID-ra

  megjegyzes TEXT,                    -- "Bérlés R-2025-001"
  user_id UUID REFERENCES employee(id),

  created_at TIMESTAMP
);

-- Bérgép státusz (csak berlet=true cikkeknél)
CREATE TABLE bergep_status (
  id UUID PRIMARY KEY,
  cikk_id UUID REFERENCES cikk(id),  -- Csak berlet=true

  status VARCHAR(20),                 -- bent, kint, szerviz
  rental_id UUID,                     -- Melyik bérléshez kiadva (ha kint)
  service_id UUID,                    -- Melyik szervizben (ha szerviz)

  updated_at TIMESTAMP,
  updated_by UUID REFERENCES employee(id)
);

-- Leltár (Inventory Audit)
CREATE TABLE inventory_audit (
  id UUID PRIMARY KEY,
  warehouse_id UUID REFERENCES warehouse(id),
  audit_date DATE,
  status VARCHAR(20),                 -- IN_PROGRESS, COMPLETED

  total_items INTEGER,                -- Hány cikk volt leltározva
  discrepancies INTEGER,              -- Hány eltérés

  created_by UUID REFERENCES employee(id),
  created_at TIMESTAMP
);

CREATE TABLE inventory_audit_line (
  id UUID PRIMARY KEY,
  audit_id UUID REFERENCES inventory_audit(id),
  cikk_id UUID REFERENCES cikk(id),

  expected_qty DECIMAL(10,2),         -- Rendszerben lévő mennyiség
  actual_qty DECIMAL(10,2),           -- Tényleges leltár
  difference DECIMAL(10,2),           -- Eltérés

  megjegyzes TEXT
);
```

#### 6.2.4 Integráció Más Modulokkal

**Bérlés Modul:**
```
Bérlés indítása (RENTAL.status = active)
      ↓
Inventory Modul: bergep_status.status = 'kint'
      ↓
Inventory Movement napló: "KI - Bérlés R-2025-001"
      ↓
Bérlés visszavétele (RENTAL.returned_at)
      ↓
bergep_status.status = 'bent' vagy 'szerviz'
      ↓
Inventory Movement napló: "BE - Visszavétel R-2025-001"
```

**Szervíz Modul:**
```
Munkalap létrehozása (SERVICE_TICKET)
      ↓
Alkatrész felhasználás (MUNKALAP_TETEL)
      ↓
Inventory Modul: cikk.mennyiseg csökkentés (alkatresz=true)
      ↓
Inventory Movement napló: "KI - Szerviz ST-2025-042"
      ↓
Ha bérgép javítása: bergep_status.status = 'szerviz'
      ↓
Javítás kész: bergep_status.status = 'bent'
```

**Értékesítés Modul:**
```
Rendelés leadása (ORDER)
      ↓
Készlet ellenőrzés (cikk.mennyiseg >= order_qty?)
      ↓
Ha OK: Rendelés jóváhagyás
      ↓
Inventory Modul: cikk.mennyiseg csökkentés
      ↓
Inventory Movement napló: "KI - Rendelés ORD-2025-123"
      ↓
Ha mennyiseg < min_keszlet → Riasztás email
```

#### 6.2.5 UI Funkciók (Frontend)

| Képernyő | Funkció |
|----------|---------|
| **Készlet Áttekintés** | Összes cikk táblázat (szűrhető cikkcsoport, raktár, státusz szerint) |
| **Cikk Részletek** | Serial number, lokáció, mozgástörténet, fotók |
| **Bérgép Státusz Dashboard** | Hány gép `bent` / `kint` / `szerviz` státuszban (bérlés modulhoz kritikus) |
| **Raktári Térkép** | Visual layout (polcok, sorok, oszlopok - későbbi feature) |
| **Készletmozgás Napló** | Keresés (cikk, user, időszak szerint) |
| **Leltár Menedzselés** | Leltár indítás, tételek rögzítése, eltérések jelentés |
| **Minimum Készlet Riasztások** | Lista az alacsony készletű cikkekről |
| **Stock Transfer** | Telephelyek közötti átcsoportosítás UI |

#### 6.2.6 API Példák

```http
# Készlet lekérdezés (cikk szerint)
GET /api/inventory/items?cikkcsoport=BGP&warehouse_id=uuid&status=bent

# Cikk részletek (serial number tracking)
GET /api/inventory/items/{cikk_id}

# Bérgép státusz módosítás
PUT /api/inventory/rental-items/{cikk_id}/status
{
  "status": "kint",
  "rental_id": "uuid",
  "user_id": "uuid"
}

# Készletmozgás rögzítés
POST /api/inventory/movements
{
  "cikk_id": "uuid",
  "warehouse_id": "uuid",
  "mozgas_tipus": "KI",
  "mennyiseg": -5,
  "ref_tipus": "SERVICE",
  "ref_id": "uuid",
  "megjegyzes": "Szerviz alkatrész felhasználás"
}

# Stock transfer (telephelyek között)
POST /api/inventory/transfer
{
  "cikk_id": "uuid",
  "from_warehouse_id": "uuid",
  "to_warehouse_id": "uuid",
  "mennyiseg": 10,
  "user_id": "uuid"
}

# Leltár indítás
POST /api/inventory/audits
{
  "warehouse_id": "uuid",
  "audit_date": "2025-12-31"
}

# Leltár tétel rögzítés
POST /api/inventory/audits/{audit_id}/lines
{
  "cikk_id": "uuid",
  "expected_qty": 50,
  "actual_qty": 48,
  "megjegyzes": "Hiány: 2 db csavar"
}
```

#### 6.2.7 Költségbecslés (Fejlesztés)

| Fázis | Időtartam | Funkciók |
|-------|-----------|----------|
| **Alap Inventory** | 1 hét | CIKK entitás, warehouse, cikkcsoportok, alap CRUD |
| **Serial Number + Lokáció** | 3 nap | Serial tracking, raktári lokációk (Polc-Sor-Oszlop) |
| **Bérgép Státusz** | 2 nap | `bergep_status` tábla, státusz tracking (bent/kint/szerviz) |
| **Készletmozgás Napló** | 2 nap | `inventory_movement` tábla, integráció Bérlés/Szervíz/Értékesítés |
| **Multi-Warehouse + Transfer** | 3 nap | Stock transfer UI + API, warehouse váltás |
| **Leltár Funkció** | 2 nap | Inventory audit kezdés, tételek, eltérések jelentés |
| **Frontend UI** | 1 hét | Készlet áttekintés, cikk részletek, bérgép dashboard, leltár UI |
| **ÖSSZESEN** | **~3 hét** | Teljes Inventory modul |

**Kapcsolódó plugin integráció:**
- **Support Plugin:** Készlet státusz lekérdezés ("Van-e raktáron?")

---

### 6.3 🔧 Szervíz Modul (SERVICE)

**Üzleti funkciók:**
- Munkalap (service ticket) létrehozás
- Hibajegy kezelés
- **Alkatrész felhasználás tracking** (Inventory modulból)
- Munkaóra rögzítés (dolgozónként)
- Garanciális vs. fizetős munka elkülönítés
- Szolgáltatási számla generálás
- **Bérgép szerviz státusz** (Inventory modul: `bergep_status.status = 'szerviz'`)

**Kapcsolódó plugin integráció:**
- **Support Plugin:** Szerviz státusz lekérdezés, időpontfoglalás, munka kész értesítés
- **CRM Plugin:** Szervíz előzmények szinkronizálása
- **🆕 Inventory Modul:** Alkatrész készlet csökkentés, bérgép státusz kezelés

---

### 6.4 🛒 Értékesítés Modul (SALES)

**Üzleti funkciók:**
- Termék katalógus kezelés
- **Készlet (inventory) ellenőrzés** (Inventory modulból)
- Rendelés kezelés
- Árazás és ÁFA kalkuláció
- Eladási számla generálás
- **Minimum készlet riasztás** (Inventory modul funkció)

**Kapcsolódó plugin integráció:**
- **Support Plugin:** Rendelés követés, beérkezés értesítés
- **CRM Plugin:** Vásárlási előzmények szinkronizálása
- **🆕 Inventory Modul:** Készlet csökkentés rendeléskor, készlet elérhetőség

---

### 6.5 💰 Pénzügy Modul (FINANCE)

**Üzleti funkciók:**
- Számla generálás (Számlázz.hu integráció)
- Fizetési tracking (készpénz, kártya, átutalás)
- NAV feladás automatizálás
- Pénzügyi jelentések
- ÁFA bevallás előkészítés

**Kapcsolódó plugin integráció:**
- **CRM Plugin:** Fizetési előzmények aggregálása

---

## 🖥️ 7. DEPLOYMENT ARCHITEKTÚRA (FRISSÍTETT)

### 7.1 Docker Compose Konténerek

#### **MVP Fázis (3 hét) - 5 Konténer:**

```yaml
services:
  postgres:       # PostgreSQL (kgc schema only MVP-ben)
  redis:          # Cache + Session + PubSub
  kgc-backend:    # NestJS API
  kgc-frontend:   # React UI
  nginx:          # Reverse proxy + SSL
```

#### **Teljes Rendszer (Plugin-ek nélkül) - 5 Konténer:**

Változatlan, mint MVP.

#### **Teljes Rendszer (Minden Plugin-nel) - 14 Konténer:**

```yaml
services:
  # Core (5 konténer)
  postgres:              # PostgreSQL (4 schema: kgc, support, crm, hr)
  redis:                 # Cache + Session + PubSub
  kgc-backend:           # NestJS API + Plugin Manager
  kgc-frontend:          # React UI
  nginx:                 # Reverse proxy + SSL

  # Support Plugin (3 konténer)
  chatwoot-backend:      # Chatwoot API (Ruby on Rails)
  chatwoot-frontend:     # Chatwoot UI (Vue.js)
  support-context-mgr:   # Context Manager + Gemini AI (Node.js)

  # CRM Plugin (2 konténer)
  twenty-backend:        # Twenty API (Node.js + GraphQL)
  twenty-frontend:       # Twenty UI (React)

  # HR Plugin (1 konténer)
  horilla:               # Horilla (Django backend + frontend combined)

  # Számlázz.hu Adapter (1 konténer - opcionális külön konténer)
  szamlazz-adapter:      # Számlázz.hu API adapter service

  # Monitoring (2 konténer - opcionális)
  prometheus:            # Metrics collection
  grafana:               # Metrics dashboard
```

**Összesen:** 14 konténer (teljes stack plugin-ekkel + monitoring)

### 7.2 Hálózati Routing (Nginx)

```
Internet → Cloudflare CDN (opcionális) → Hostinger VPS
                                              ↓
                                         Nginx (:80, :443)
                                              ↓
    ┌─────────────────────┬─────────────────┬─────────────────┬─────────────────┐
    │                     │                 │                 │                 │
    ▼                     ▼                 ▼                 ▼                 ▼
kgc-frontend:5173   kgc-backend:3000  chatwoot:3002   twenty:3001      horilla:8000
    │                     │                 │                 │                 │
    /                   /api            /support           /crm              /hr
```

**Domain struktúra:**
- `kgc-erp.hu` → KGC Frontend (React)
- `kgc-erp.hu/api` → KGC Backend (NestJS)
- `kgc-erp.hu/support` → Support Plugin (Chatwoot UI) **OPCIONÁLIS**
- `kgc-erp.hu/crm` → CRM Plugin (Twenty UI) **OPCIONÁLIS**
- `kgc-erp.hu/hr` → HR Plugin (Horilla UI) **OPCIONÁLIS**

---

## 🚀 8. FEJLESZTÉSI ROADMAP (FRISSÍTETT)

### 8.1 Fázis 1-3: MVP (3 hét) - VÁLTOZATLAN

**Fókusz:** Bérlés modul + Számlázz.hu integráció + Alap UI

**Kimenet:**
- ✅ KGC Backend (Auth + Partner + Rental + Invoice)
- ✅ KGC Frontend (Login + Dashboard + Bérlés CRUD)
- ✅ Számlázz.hu API működik
- ✅ Production deploy (`https://kgc-erp.hu`)

### 8.2 Fázis 4-5: Szervíz + Értékesítés (3 hét) - VÁLTOZATLAN

**Kimenet:**
- ✅ Szervíz modul backend + frontend
- ✅ Értékesítés modul backend + frontend

### 8.3 🆕 Fázis 6: Inventory/Raktárkezelés Modul (3 hét)

**Cél:** Központosított készletnyilvántartás minden modulhoz

**Feladatok:**
- [ ] **CIKK entitás** (központi készlet: bérgépek + termékek + alkatrészek)
- [ ] **Cikkcsoportok** (BGP, BSZ, ALK, ÉRT kategóriák)
- [ ] **Multi-Warehouse** (2-5 raktár/telephely támogatás)
- [ ] **Serial Number Tracking** (egyedi eszköz azonosítók - bérgépekhez kritikus)
- [ ] **Raktári Lokációk** (Polc-Sor-Oszlop: A12-03-05)
- [ ] **Bérgép Státusz Kezelés** (bergep_status: bent/kint/szerviz)
- [ ] **Készletmozgás Napló** (inventory_movement tábla)
- [ ] **Stock Transfer** (telephelyek közötti átcsoportosítás)
- [ ] **Inventory Audit/Leltár** (leltározási funkció)
- [ ] **Frontend UI:**
  - Készlet áttekintés (táblázat, szűrők)
  - Cikk részletek (serial #, lokáció, mozgástörténet)
  - Bérgép státusz dashboard (bent/kint/szerviz)
  - Készletmozgás napló
  - Leltár menedzsment UI
  - Minimum készlet riasztások
- [ ] **Integráció Bérlés modulba** (bérgép kiadás/visszavétel)
- [ ] **Integráció Szervíz modulba** (alkatrész felhasználás)
- [ ] **Integráció Értékesítés modulba** (készlet csökkentés rendeléskor)
- [ ] **API dokumentáció** (Swagger)
- [ ] **Unit + Integration tesztek**

**Kimenet:**
- ✅ Inventory modul teljes backend + frontend működik
- ✅ Bérgépek, termékek, alkatrészek egy központi CIKK entitásban
- ✅ Multi-warehouse + serial number + raktári lokációk
- ✅ Készletmozgás napló minden tranzakcióhoz
- ✅ Leltározási funkció

---

### 8.4 🆕 Fázis 7: Plugin Manager (1 hét)

**Cél:** Plugin integráció alap infrastruktúra

**Feladatok:**
- [ ] Plugin Discovery & Registry implementálás
- [ ] Feature Flag rendszer (ENV config)
- [ ] API Gateway Routing (plugin endpoint delegálás)
- [ ] Webhook Event Bus (plugin esemény továbbítás)
- [ ] Health Check endpoint minden plugin-hez
- [ ] Admin UI: Plugin menedzsment képernyő

**Kimenet:**
- ✅ Plugin Manager működik
- ✅ Feature flag: `SUPPORT_MODULE_ENABLED`, `CRM_MODULE_ENABLED`, `HR_MODULE_ENABLED`

### 8.5 🆕 Fázis 8: Support Plugin Integráció (2 hét)

**Cél:** Kokó AI Support modul deployment + integráció

**Feladatok:**
- [ ] Chatwoot docker deploy (backend + frontend)
- [ ] Support Context Manager fejlesztés (Node.js)
- [ ] Gemini API integráció
- [ ] KGC → Support API endpoint-ok (`GET /api/services/{id}`, stb.)
- [ ] KGC → Support webhook-ok (service.completed, stb.)
- [ ] Google Calendar API integráció (időpontfoglalás)
- [ ] Tesztelés: Gemini válaszok, Context Caching

**Kimenet:**
- ✅ `kgc-erp.hu/support` elérhető
- ✅ Chatbot működik (HU/EN)
- ✅ Költség: €37-55/hó

### 8.6 🆕 Fázis 9: CRM Plugin Integráció (1.5 hét)

**Cél:** Twenty CRM deployment + szolgáltatás előzmények szinkronizálása

**Feladatok:**
- [ ] Twenty docker deploy (backend + frontend)
- [ ] GraphQL Adapter fejlesztés (KGC REST → Twenty GraphQL)
- [ ] Partner szinkronizáció (KGC master → Twenty slave)
- [ ] Szolgáltatás előzmények webhook (rental.completed → CRM)
- [ ] SSO integráció (JWT shared secret)
- [ ] UI: iframe beágyazás KGC-be

**Kimenet:**
- ✅ `kgc-erp.hu/crm` elérhető
- ✅ Partner adatok szinkronizálva
- ✅ Költség: €0/hó (self-hosted)

### 8.7 🆕 Fázis 10: HR Plugin Integráció (1 hét)

**Cél:** Horilla HR deployment + employee szinkronizálás

**Feladatok:**
- [ ] Horilla docker deploy
- [ ] Employee szinkronizáció (KGC master → Horilla slave)
- [ ] Attendance tracking beállítás
- [ ] Leave management workflow config
- [ ] SSO integráció (JWT)
- [ ] UI: iframe beágyazás KGC-be

**Kimenet:**
- ✅ `kgc-erp.hu/hr` elérhető
- ✅ Employee adatok szinkronizálva
- ✅ Költség: €0-30/hó

### 8.7 Timeline Összefoglaló (Frissített)

| Fázis | Időtartam | Kimenet | Kumulált |
|-------|-----------|---------|----------|
| Fázis 1-3: MVP | 3 hét | Bérlés modul production | 3 hét |
| Fázis 4-5: Szervíz + Értékesítés | 3 hét | Core business modulok | 6 hét |
| 🆕 Fázis 6: Inventory/Raktárkezelés | **3 hét** | Központosított készletnyilvántartás | **9 hét** |
| 🆕 Fázis 7: Plugin Manager | 1 hét | Plugin infrastruktúra | 10 hét |
| 🆕 Fázis 8: Support Plugin | 2 hét | Kokó AI chatbot | 12 hét |
| 🆕 Fázis 9: CRM Plugin | 1.5 hét | Twenty CRM integráció | 13.5 hét |
| 🆕 Fázis 10: HR Plugin | 1 hét | Horilla HR integráció | 14.5 hét |
| **ÖSSZESEN** | **~15 hét** | **Teljes KGC ERP + Inventory + Minden Plugin** | - |

**Megjegyzés:**
- **Core ERP + Inventory (Fázis 1-6)**: **9 hét** - Teljes működő ERP raktárkezeléssel
- **Plugin-ek (Fázis 7-10)**: **opcionálisak** - Support, CRM, HR modulok
- **Minimum működőképes rendszer**: Fázis 1-6 (9 hét)

---

## 🎯 9. KULCS DÖNTÉSEK ÖSSZEFOGLALÓJA (FRISSÍTETT)

### 9.1 Architektúra Döntések

| Kérdés | v3.0 Döntés | v4.0 Döntés | Változás |
|--------|-------------|-------------|----------|
| **Modul integráció** | iframe beágyazás | Plugin Manager + API | ✅ Lazább csatolás |
| **Support rendszer** | Chatwoot (manual) | Kokó AI (Gemini chatbot) | 🎉 AI automatizáció |
| **CRM** | Twenty (kötelező) | Twenty (opcionális plugin) | ✅ Opcionális |
| **HR** | Horilla (kötelező) | Horilla (opcionális plugin) | ✅ Opcionális |
| **Feature Toggle** | Nincs | ENV: `{MODULE}_ENABLED` | 🎉 Runtime ki/be kapcsolás |
| **Költség optimalizáció** | Nincs | Gemini Context Caching (75% megtakarítás) | 💰 €120/hó megtakarítás |

### 9.2 Miért Plugin Architektúra?

| Előny | Leírás |
|-------|--------|
| **Alacsonyabb belépési költség** | Alap ERP €25/hó, plugin-ek csak ha kell |
| **Fokozatos bevezetés** | MVP → Core → Plugin-ek (step-by-step) |
| **Skálázhatóság** | Plugin-ek külön konténerben, külön scaling |
| **Vendor lock-in elkerülés** | Plugin cserélhető (pl. Twenty → másik CRM) |
| **Karbantarthatóság** | Plugin hiba nem blokkolja a core-t |
| **Tesztelhetőség** | Plugin-ek külön unit + integration tesztek |

---

## 📊 10. KÖVETKEZŐ LÉPÉSEK (FRISSÍTETT)

### Azonnali (1-3 nap)

- [ ] **Domain név** fenntartás ellenőrzése (kgc-erp.hu)
- [ ] **Hostinger VPS** monitoring setup (CPU/RAM/Disk alert)
- [ ] **GitHub repo-k** ellenőrzése:
  - `kgc-erp-deployment` (fő repo)
  - `kgc-backend` (NestJS)
  - `kgc-frontend` (React)
- [ ] **Számlázz.hu** API kulcs tesztelés
- [ ] **🆕 Plugin Module Design** finalizálása (ez a dokumentum jóváhagyása)

### Rövid távú (1-2 hét)

- [ ] **Fázis 6 indítás:** Plugin Manager fejlesztés
- [ ] **Support Plugin dokumentáció** review (69 oldal spec validálás)
- [ ] **CRM Plugin dokumentáció** review
- [ ] **HR Plugin dokumentáció** review

### Középtávú (3-4 hét)

- [ ] **Fázis 7:** Support Plugin deploy (Kokó AI)
- [ ] **Gemini API** költség monitoring (Context Caching hatékonyság)
- [ ] **Pilot tesztelés:** 5 user a Support chatbot-tal

### Hosszú távú (8-12 hét)

- [ ] **Fázis 8-9:** CRM + HR plugin deploy
- [ ] **Full System Integration Testing**
- [ ] **Production Monitoring:** Grafana + Prometheus setup

---

## 🔍 11. KOCKÁZATOK ÉS MITIGÁCIÓ (FRISSÍTETT)

| Kockázat | Valószínűség | Hatás | Mitigáció |
|----------|--------------|-------|-----------|
| **Plugin hiba blokkolja core-t** | Közepes | Kritikus | Feature flag disable → graceful degradation |
| **Gemini API költség túllépés** | Közepes | Közepes | Context Caching + rate limiting + havi budget alert |
| **Twenty/Horilla upstream törés** | Közepes | Közepes | Git fork + selective merge + staging tesztelés |
| **PostgreSQL kapacitás kimerül** | Alacsony | Magas | Plugin-ek opcionális schema-k, később sharding |
| **Hostinger VPS túlterhelt** | Közepes | Magas | Plugin-ek külön VPS-re költöztetése (ha szükséges) |
| **🆕 Support AI hallucináció** | Közepes | Közepes | Confidence threshold + human escalation |
| **🆕 GDPR nem-megfelelés** | Alacsony | Kritikus | Plugin-ek GDPR audit + cascade delete |

---

## 📚 12. KAPCSOLÓDÓ DOKUMENTUMOK

### Modul Integrációk

| Dokumentum | Hely | Méret | Leírás |
|------------|------|-------|--------|
| **🌐 Interaktív HTML** | [docs/ERP/KGC-ERP-Module-Integration.html](../ERP/KGC-ERP-Module-Integration.html) | 185K | 3 modul (Support, CRM, HR) navigálható HTML |
| **Support Integráció** | [docs/ERP/Support/KGC-SUPPORT-INTEGRATION-ARCHITECTURE.md](../ERP/Support/KGC-SUPPORT-INTEGRATION-ARCHITECTURE.md) | 33K | 69 oldal teljes spec |
| **CRM Integráció** | [docs/ERP/CRM/KGC-CRM-INTEGRATION-ARCHITECTURE.md](../ERP/CRM/KGC-CRM-INTEGRATION-ARCHITECTURE.md) | 42K | GraphQL adapter, partner sync |
| **HR Integráció** | [docs/ERP/HR/KGC-HR-INTEGRATION-ARCHITECTURE.md](../ERP/HR/KGC-HR-INTEGRATION-ARCHITECTURE.md) | 32K | Django REST, attendance, leave |
| **ERP README** | [docs/ERP/README.md](../ERP/README.md) | 8K | Plugin filozófia, dokumentációs standard |

### Architektúra Diagramok

| Diagram | Hely | Formátum | Leírás |
|---------|------|----------|--------|
| **Rendszer Architektúra** | [docs/ERP/kgc-erp-system-architecture.svg](../ERP/kgc-erp-system-architecture.svg) | SVG (7.4K) | Teljes KGC rendszer komponensek |
| **Teljes Adatfolyam** | [docs/ERP/kgc-erp-dataflow.svg](../ERP/kgc-erp-dataflow.svg) | SVG (6.0K) | Core + Plugin adatfolyamok |
| **Support Plugin Arch** | [docs/ERP/Support/kgc-support-integration-architecture.svg](../ERP/Support/kgc-support-integration-architecture.svg) | SVG (9.0K) | Plugin struktúra |
| **Support Dataflow** | [docs/ERP/Support/kgc-support-dataflow.svg](../ERP/Support/kgc-support-dataflow.svg) | SVG (11K) | API + Webhook folyamatok |
| **CRM Plugin Arch** | [docs/ERP/CRM/crm-plugin-architecture.svg](../ERP/CRM/crm-plugin-architecture.svg) | SVG (5.9K) | Twenty integráció |
| **CRM Dataflow** | [docs/ERP/CRM/crm-dataflow.svg](../ERP/CRM/crm-dataflow.svg) | SVG (8.9K) | GraphQL adapter flow |
| **HR Plugin Arch** | [docs/ERP/HR/hr-plugin-architecture.svg](../ERP/HR/hr-plugin-architecture.svg) | SVG (8.1K) | Horilla integráció |
| **HR Dataflow** | [docs/ERP/HR/hr-dataflow.svg](../ERP/HR/hr-dataflow.svg) | SVG (14K) | Django REST sync |

### Korábbi Dokumentumok (v3.0)

| Dokumentum | Hely | Státusz |
|------------|------|---------|
| **v3.0 Összefoglaló** | [docs/deployment/KGC-ERP-Teljes-Architektura-Osszefoglalo.md](KGC-ERP-Teljes-Architektura-Osszefoglalo.md) | 📦 Archivált (2025-12-21) |
| **ADR-001 Multi-Tenant** | [docs/architecture/ADR-001-franchise-multitenancy.md](../architecture/ADR-001-franchise-multitenancy.md) | ✅ Érvényes |
| **ADR-002 Deployment** | [docs/architecture/ADR-002-deployment-offline-strategy.md](../architecture/ADR-002-deployment-offline-strategy.md) | ✅ Érvényes |

---

## 🎉 13. ÖSSZEGZÉS

### v4.0-4.1 Főbb Újdonságok

1. **🔌 Plugin Architektúra** (v4.0) - Opcionális, lazán csatolt modulok (Support, CRM, HR)
2. **🤖 Kokó AI Support** (v4.0) - Gemini 2.0 Flash chatbot + Context Caching (75% megtakarítás)
3. **📊 CRM Plugin** (v4.0) - Twenty CRM (self-hosted, GraphQL, €0/hó)
4. **👥 HR Plugin** (v4.0) - Horilla HRMS (Django, attendance, leave, €0-30/hó)
5. **🎚️ Feature Flags** (v4.0) - Runtime enable/disable: `{MODULE}_ENABLED=true/false`
6. **📦 Inventory/Raktárkezelés** (v4.1) - Központosított CIKK entitás + Multi-Warehouse + Serial Number + Bérgép Státusz
7. **💰 Költség Optimalizáció** - Alap €25/hó, plugin-ekkel €67-155/hó

### Rendszer Áttekintés (Frissített v4.1)

**KGC ERP = Core + Inventory + Opcionális Plugin-ek:**
- **5 Core Business Modul** (Bérlés, Szervíz, Értékesítés, Pénzügy, **🆕 Inventory**) → **Saját fejlesztés**
- **3 Plugin Modul** (Support AI, CRM, HR) → **Opcionális integráció**
- **1 NAV Integráció** (Számlázz.hu) → **Magyar számla generálás**

**🆕 Inventory Modul Integráció:**
- **Bérlés modul** ← Bérgép kiadás/visszavétel (státusz: bent/kint/szerviz)
- **Szervíz modul** ← Alkatrész felhasználás tracking
- **Értékesítés modul** ← Készlet csökkentés rendeléskor

**Deployment:**
- **1 Hostinger VPS** (€18/hó)
- **1 PostgreSQL** (4 schema: kgc, support, crm, hr)
- **Docker Compose** (5 konténer alap, 14 teljes plugin-ekkel)

**Timeline:**
- **9 hét Core ERP + Inventory** (Bérlés + Szervíz + Értékesítés + Pénzügy + Raktárkezelés)
- **15 hét Teljes Rendszer** (Core + Inventory + Plugin Manager + Mind a 3 plugin)

**Következő lépés:**
- ✅ **v4.1 Jóváhagyás** (ez a dokumentum - frissítve Inventory modullal)
- ✅ **Fázis 6 Indítás:** Inventory/Raktárkezelés modul fejlesztés (3 hét)

---

**Verzió:** 4.2
**Frissítve:** 2025-12-29
**Készítők:** Winston (Architect), John (PM), Amelia (Dev), Bob (SM)

**Változási Napló:**
- **v1.0** (2025-11-XX) - Kezdeti tervezet
- **v2.0** (2025-12-XX) - Hostinger VPS döntés
- **v3.0** (2025-12-21) - Hibrid architektúra (Core + Twenty + Chatwoot + Horilla)
- **v4.0** (2025-12-29 reggel) - 🎉 **Plugin Architektúra** + Kokó AI Support + CRM/HR plugin-ek + Feature Flags
- **v4.1** (2025-12-29 este) - 📦 **Inventory/Raktárkezelés Modul** + Központosított CIKK entitás + Multi-Warehouse + Serial Number Tracking + Bérgép Státusz
- **v4.2** (2025-12-29 éjszaka) - 🔍 **Architektúra Review** (Winston) + 30 finding (8 kritikus javítás: indexek, constraint-ek, PgBouncer, Secrets, Monitoring kötelező) + Költségbecslés frissítés

---

## 🔍 14. ARCHITEKTÚRA REVIEW EREDMÉNYEK (2025-12-29 - Winston)

### 14.1 Review Összefoglaló

**Elvégezve:** 2025-12-29 (Winston - Architect Agent)
**Terjedelem:** Teljes rendszer architektúra (Inventory + 5 Core + 3 Plugin modul)
**Talált problémák:** **30 finding** (8 kritikus, 12 magas, 10 közepes)

### 14.2 🚨 KRITIKUS JAVÍTÁSOK (AZONNAL SZÜKSÉGES)

#### 14.2.1 Adatbázis Integritás Javítások

**Probléma 1: Hiányzó indexek**
```sql
-- Performance kritikus indexek:
CREATE INDEX idx_cikk_warehouse ON cikk(warehouse_id);
CREATE INDEX idx_cikk_location ON cikk(location_code);
CREATE INDEX idx_cikk_berlet ON cikk(berlet) WHERE berlet = TRUE;
CREATE INDEX idx_inventory_movement_cikk_date ON inventory_movement(cikk_id, created_at DESC);
CREATE INDEX idx_bergep_status_status ON bergep_status(status);
```

**Probléma 2: Serial Number UNIQUE constraint hiányzik**
```sql
-- Kritikus: Duplikált serial numberek megakadályozása
ALTER TABLE cikk ADD CONSTRAINT unique_serial_number
  UNIQUE(warehouse_id, serial_number)
  WHERE serial_number IS NOT NULL;
```

**Probléma 3: Bérgép státusz validáció**
```sql
-- Egy bérgépnek csak 1 státusza lehet
ALTER TABLE bergep_status ADD CONSTRAINT unique_cikk_status UNIQUE(cikk_id);

-- Státusz konzisztencia
ALTER TABLE bergep_status ADD CONSTRAINT check_status_rental
  CHECK (
    (status = 'kint' AND rental_id IS NOT NULL) OR
    (status = 'szerviz' AND service_id IS NOT NULL) OR
    (status = 'bent' AND rental_id IS NULL AND service_id IS NULL)
  );
```

**Probléma 4: Cross-schema foreign key-ek**
```sql
-- CRM Plugin → KGC Customer linkek
ALTER TABLE crm.contacts
  ADD CONSTRAINT fk_kgc_customer
  FOREIGN KEY (kgc_customer_id)
  REFERENCES kgc.customers(id) ON DELETE CASCADE;

-- HR Plugin → KGC Employee linkek
ALTER TABLE hr.employees
  ADD CONSTRAINT fk_kgc_employee
  FOREIGN KEY (kgc_employee_id)
  REFERENCES kgc.employees(id) ON DELETE CASCADE;
```

#### 14.2.2 Docker Compose Javítások

**Probléma 5: PostgreSQL Connection Pooling**
```yaml
services:
  # ÚJ konténer - PgBouncer connection pooler
  pgbouncer:
    image: pgbouncer/pgbouncer:latest
    environment:
      DATABASES_HOST: postgres
      DATABASES_PORT: 5432
      DATABASES_DBNAME: kgc_erp
      POOL_MODE: transaction
      MAX_CLIENT_CONN: 1000
      DEFAULT_POOL_SIZE: 25
    depends_on:
      - postgres
    networks:
      - kgc-network

  # Minden konténer pgbouncer-t használja postgres helyett
  kgc-backend:
    environment:
      DATABASE_HOST: pgbouncer  # postgres helyett
```

**Probléma 6: Docker Secrets**
```yaml
secrets:
  gemini_api_key:
    external: true
  szamlazz_api_key:
    external: true
  postgres_password:
    external: true

services:
  support-context-mgr:
    secrets:
      - gemini_api_key
    environment:
      GEMINI_API_KEY_FILE: /run/secrets/gemini_api_key
```

**Probléma 7: Monitoring KÖTELEZŐ (nem opcionális)**
```yaml
services:
  # KÖTELEZŐ production komponensek
  prometheus:
    image: prom/prometheus:latest
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus-data:/prometheus
    networks:
      - kgc-network

  grafana:
    image: grafana/grafana:latest
    environment:
      GF_SECURITY_ADMIN_PASSWORD: ${GRAFANA_ADMIN_PASSWORD}
    volumes:
      - grafana-data:/var/lib/grafana
    networks:
      - kgc-network
```

#### 14.2.3 Application Layer Javítások

**Probléma 8: Negatív készlet validáció**
```typescript
// NestJS - InventoryService
async checkStockAvailability(
  cikkId: string,
  requestedQty: number
): Promise<boolean> {
  const cikk = await this.cikkRepo.findOne(cikkId);

  if (cikk.mennyiseg + requestedQty < 0) {
    throw new BadRequestException(
      `Insufficient stock. Available: ${cikk.mennyiseg}, Requested: ${Math.abs(requestedQty)}`
    );
  }

  return true;
}
```

**Probléma 9: Bérgép elveszett/megsemmisült státusz**
```typescript
// Bérgép státusz enum bővítése
enum BergepStatus {
  BENT = 'bent',
  KINT = 'kint',
  SZERVIZ = 'szerviz',
  DESTROYED = 'destroyed',  // ÚJ: Megsemmisült
  LOST = 'lost',            // ÚJ: Elveszett
  SOLD = 'sold'             // ÚJ: Eladva (már nem bérgép)
}
```

**Probléma 10: Rate Limiting (Support Plugin)**
```typescript
// Context Manager - Rate limiter
import { RateLimiterRedis } from 'rate-limiter-flexible';

const rateLimiter = new RateLimiterRedis({
  storeClient: redisClient,
  keyPrefix: 'gemini_api',
  points: 100,        // 100 request
  duration: 60,       // per minute
});

await rateLimiter.consume(userId);  // Throw if limit exceeded
```

### 14.3 ⚠️ MAGAS PRIORITÁSÚ JAVÍTÁSOK (1-2 HÉTEN BELÜL)

1. **Inventory → Support Plugin API integráció**
   ```http
   GET /api/inventory/stock-check/{cikk_id}?warehouse_id=uuid
   Response: { "available": true, "quantity": 15, "location": "A12-03-05" }
   ```

2. **Default Warehouse koncepció**
   - Config: `DEFAULT_WAREHOUSE_ID` ENV variable
   - User preference: Per-user default warehouse táblában

3. **Backorder kezelés (Értékesítés modul)**
   - `order_status = 'backordered'` state
   - Email notification ha készlet újra elérhető

4. **GDPR Chat History Retention (Support Plugin)**
   - 90 napos retention policy
   - Cron job: Auto-delete régi chat-ek

5. **PostgreSQL Backup Stratégia**
   ```bash
   # Daily backup script
   #!/bin/bash
   pg_dump -h postgres -U kgc_user -n kgc > /backups/kgc_$(date +%Y%m%d).sql
   pg_dump -h postgres -U kgc_user -n support > /backups/support_$(date +%Y%m%d).sql
   ```

6. **Nginx SSL/TLS Setup**
   ```yaml
   services:
     certbot:
       image: certbot/certbot
       volumes:
         - ./certbot/conf:/etc/letsencrypt
         - ./certbot/www:/var/www/certbot
       command: certonly --webroot -w /var/www/certbot --email admin@kgc-erp.hu -d kgc-erp.hu --agree-tos
   ```

### 14.4 📝 KÖZEPES PRIORITÁSÚ JAVÍTÁSOK (2-4 HÉTEN BELÜL)

7. Szervíz: Visszáru flow specifikáció
8. CRM: Twenty upstream frissítési stratégia dokumentálása
9. HR: Multi-location attendance tracking design
10. Testing fázisok (QA/UAT) hozzáadása roadmap-hez
11. Data Migration fázis (ha van legacy rendszer)
12. Training & Documentation fázis
13. VPS skálázási terv (ha 14 konténer túl sok 32GB RAM-hoz)

### 14.5 💰 KÖLTSÉGBECSLÉS FRISSÍTÉS

**Korábban hiányzó költségek:**

| Tétel | Egyszeri | Havi | Megjegyzés |
|-------|----------|------|------------|
| **Fejlesztési költség** | €30,000 | - | 1 senior dev × 15 hét × €50/óra × 40 óra/hét |
| **Support staff (human backup)** | - | €500-1000 | Part-time agent (chatbot backup) |
| **PgBouncer konténer** | - | €0 | Benne VPS-ben |
| **Monitoring (Prometheus + Grafana)** | - | €0 | Benne VPS-ben (KÖTELEZŐ!) |
| **Backup tárhely (offsite)** | - | €10-20 | Backblaze B2 / AWS S3 |

**Frissített havi költség (production):**
- **Alap (Core ERP)**: ~€35-45/hó (backup + support staff-fel)
- **Plugin-ekkel**: ~€77-175/hó

### 14.6 🎯 KÖVETKEZŐ LÉPÉSEK (FRISSÍTVE)

**Azonnal (1-2 nap):**
- [ ] ✅ **v4.2 Jóváhagyás** (ez a review eredménye)
- [ ] Database migration script készítése (8 kritikus SQL javítás)
- [ ] Docker Compose frissítése (PgBouncer + Secrets + Monitoring)

**Rövid távú (1 hét):**
- [ ] Inventory adatmodell finalizálása (SQL constraint-ekkel)
- [ ] Application layer validációk implementálása
- [ ] PostgreSQL backup script + cron job

**Középtávú (Fázis 6 - 3 hét):**
- [ ] Inventory modul fejlesztés (frissített spec szerint)
- [ ] Unit + Integration tesztek (negatív készlet, serial number dup, stb.)
- [ ] Excalidraw diagramok frissítése (Inventory modul hozzáadása)

---

🎯 **JAVASLAT: v4.2 JÓVÁHAGYÁS - ARCHITEKTÚRA REVIEW EREDMÉNYEIVEL FRISSÍTVE!**

**Változások v4.1 → v4.2:**
- 8 kritikus adatbázis javítás (indexek, constraint-ek)
- PgBouncer connection pooler hozzáadása
- Docker Secrets management
- Monitoring kötelezővé tétele (Prometheus + Grafana)
- Költségbecslés frissítése (fejlesztési + support staff költségek)
- 30 finding dokumentálása és priorizálása
