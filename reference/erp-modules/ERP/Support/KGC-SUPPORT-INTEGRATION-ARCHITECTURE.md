# KGC-Support Rendszer Integrációs Architektúra

**Szerző:** Winston (Architect ügynök)
**Dátum:** 2025-12-28
**Verzió:** 1.0
**Státusz:** Tervezet

---

## Executive Summary

Ez a dokumentum definiálja a **Kokó AI Support rendszer** integrálását a **KGC ERP v2** rendszerbe **önálló, ki-bekapcsolható modulként**. Az integráció célja, hogy a Support modul:

1. **Opcionális legyen** - A KGC ERP működjön Support modul nélkül is
2. **Pluginként** viselkedjen - Runtime enable/disable támogatás
3. **Lazán csatolódjon** - API-alapú integráció, minimális függőség
4. **Adatokat megosson** - Releváns ERP adatok elérése a Support rendszer számára
5. **Értéket adjon** - 24/7 ügyfélszolgálat, szerviz státusz lekérdezés, időpontfoglalás

---

## 1. Architektúrális Elvek

### 1.1 Plugin Architektúra

```
┌─────────────────────────────────────────────────────────────────────┐
│                         KGC ERP CORE                                 │
│                   (Független a Support-tól)                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐       │
│   │  Bérlés   │  │ Értékesítés│  │  Szerviz  │  │  Pénzügy  │       │
│   │  Modul    │  │   Modul    │  │   Modul   │  │   Modul   │       │
│   └───────────┘  └───────────┘  └───────────┘  └───────────┘       │
│                                                                      │
│   ┌───────────────────────────────────────────────────────────┐     │
│   │          Integration Layer (Plugin Manager)               │     │
│   │                                                            │     │
│   │  • Plugin Discovery                                        │     │
│   │  • Runtime Enable/Disable                                 │     │
│   │  • API Gateway Routing                                    │     │
│   │  • Webhook Registry                                       │     │
│   └───────────────────────────────────────────────────────────┘     │
│                           │                                          │
└───────────────────────────┼──────────────────────────────────────────┘
                            │
                            ▼ (Optional)
┌─────────────────────────────────────────────────────────────────────┐
│                     SUPPORT MODULE PLUGIN                            │
│                      (Kokó AI System)                                │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   ┌────────────────┐  ┌────────────────┐  ┌────────────────┐       │
│   │  Chatwoot      │  │ Context Manager│  │ Calendar       │       │
│   │  Integration   │  │ + Gemini AI    │  │ Service        │       │
│   └────────────────┘  └────────────────┘  └────────────────┘       │
│                                                                      │
│   Support modul státusz: ENABLED / DISABLED                         │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### 1.2 Integráció Módszerei

| Mód | Leírás | Használat |
|-----|--------|-----------|
| **API-First** | RESTful API végpontok a KGC ERP-ben | Support lekérdezések (szerviz státusz, ügyfél info) |
| **Webhook Push** | KGC ERP eseményeket küld a Support-nak | Munkalap változás, beérkezés értesítés |
| **Shared Data Store** | Közös Redis/DB view néhány entitáshoz | Valós idejű cache (opcionális) |
| **Feature Flags** | Runtime ki/be kapcsolás | `SUPPORT_MODULE_ENABLED=true/false` |

---

## 2. Integrációs Pontok a KGC ERP Folyamataiban

### 2.1 Bérlés Modul

**Integrációs Pont:** Bérlés státusz lekérdezés, késés értesítés

| KGC ERP Funkció | Support Integráció | API Endpoint |
|-----------------|-------------------|--------------|
| Bérlés indítása | Automatikus üdvözlő üzenet (opcionális) | `POST /api/support/notifications/rental-started` |
| Késés bekövetkezése | Chatbot tud válaszolni késés státuszról | `GET /api/rentals/{rental_id}/status` |
| Visszavétel | Elégedettségi kérdőív trigger (opcionális) | `POST /api/support/notifications/rental-ended` |

**Adatcsere:**
```json
{
  "rental_id": "R-2025-001",
  "customer_phone": "+36301234567",
  "machine_name": "Makita talajvágó",
  "rental_start": "2025-12-28",
  "rental_end": "2025-12-30",
  "status": "active",
  "late_days": 0
}
```

### 2.2 Szerviz Modul

**Integrációs Pont:** Munkalap státusz követés, időpontfoglalás

| KGC ERP Funkció | Support Integráció | API Endpoint |
|-----------------|-------------------|--------------|
| Munkalap felvétel | Chatbot keres + előjegyez időpontot | `POST /api/service/appointments` |
| Diagnosztika kész | Automatikus értesítés: "Árajánlat kész" | `POST /api/support/notifications/quote-ready` |
| Javítás kész | Automatikus értesítés: "Gép átvehető" | `POST /api/support/notifications/repair-done` |
| Státusz lekérdezés | Chatbot válaszol: "Munkalap M-123 diagnosztikában" | `GET /api/service/worklogs/{worklog_id}/status` |

**Adatcsere:**
```json
{
  "worklog_id": "M-2025-0123",
  "customer_phone": "+36301234567",
  "machine_type": "Fűnyíró",
  "status": "diagnosztika", // diagnosztika, árajánlat, javítás, kész
  "estimated_completion": "2025-12-30",
  "quote_amount": 15000,
  "technician_notes": "Gyújtógyertya csere szükséges"
}
```

### 2.3 Értékesítés/Megrendelés Modul

**Integrációs Pont:** Rendelés státusz, áru beérkezés

| KGC ERP Funkció | Support Integráció | API Endpoint |
|-----------------|-------------------|--------------|
| Megrendelés felvétel | Chatbot tájékoztat várható időről | `GET /api/orders/{order_id}/estimated-arrival` |
| Áru beérkezik | Automatikus értesítés SMS/Email/Chat | `POST /api/support/notifications/order-arrived` |
| Készlet lekérdezés | "Van-e raktáron X termék?" | `GET /api/inventory/check?sku={sku}&location={location}` |

**Adatcsere:**
```json
{
  "order_id": "O-2025-0456",
  "customer_phone": "+36301234567",
  "items": [
    {
      "sku": "MAK-DGA452",
      "name": "Makita akkus fúró",
      "quantity": 2,
      "status": "beérkezett"
    }
  ],
  "notification_sent": true
}
```

### 2.4 Ügyfélkezelés

**Integrációs Pont:** Ügyfél autentikáció, kontakt info

| KGC ERP Funkció | Support Integráció | API Endpoint |
|-----------------|-------------------|--------------|
| Partner keresés | Chatbot azonosít telefonszám alapján | `GET /api/customers/by-phone/{phone}` |
| Duplikáció ellenőrzés | Support javasol merge-t ha duplumot talál | `GET /api/customers/duplicates?name={name}&phone={phone}` |
| GDPR törlés | Support memória is törlődik | `DELETE /api/customers/{customer_id}` (cascade) |

**Adatcsere:**
```json
{
  "customer_id": "C-123",
  "name": "Kovács János",
  "phone": "+36301234567",
  "email": "kovacs@example.com",
  "company": null,
  "is_business": false,
  "active_rentals": 1,
  "pending_repairs": 0,
  "payment_status": "good" // good, late, blocked
}
```

---

## 3. Plugin Menedzsment

### 3.1 Konfiguráció (Feature Flag)

**Környezeti változók (KGC ERP):**

```bash
# .env fájl
SUPPORT_MODULE_ENABLED=true              # Plugin aktív/inaktív
SUPPORT_API_URL=http://localhost:5001    # Kokó ai-chatbot URL
SUPPORT_CONTEXT_URL=http://localhost:5004 # Kokó context-manager URL
SUPPORT_API_KEY=secret_key_here          # API autentikáció
SUPPORT_WEBHOOK_SECRET=webhook_secret    # Webhook validáció
```

**Futásidejű ellenőrzés (backend példa - Node.js/Python):**

```javascript
// KGC ERP backend - plugin check
function isSupportModuleEnabled() {
  return process.env.SUPPORT_MODULE_ENABLED === 'true';
}

// Webhook küldés csak ha engedélyezve
async function notifyCustomerOrderArrived(order) {
  if (!isSupportModuleEnabled()) {
    console.log('Support module disabled, skipping notification');
    return;
  }

  try {
    await axios.post(`${process.env.SUPPORT_API_URL}/api/notifications/order-arrived`, {
      order_id: order.id,
      customer_phone: order.customer.phone,
      items: order.items
    }, {
      headers: { 'X-API-Key': process.env.SUPPORT_API_KEY }
    });
  } catch (error) {
    // Support modul hiba nem blokkolja a KGC ERP műveletet
    console.error('Support notification failed (non-critical):', error.message);
  }
}
```

### 3.2 Plugin Lifecycle

```
┌─────────────────────────────────────────────────────────────┐
│                  PLUGIN LIFECYCLE                            │
└─────────────────────────────────────────────────────────────┘

1. DISCOVERY
   ├─ KGC ERP bootoláskor ellenőrzi: SUPPORT_MODULE_ENABLED
   ├─ Ha true → próbál kapcsolódni SUPPORT_API_URL/health
   └─ Ha sikeres → Plugin status: ACTIVE

2. RUNTIME ENABLE
   ├─ Admin UI: "Support modul bekapcsolása"
   ├─ Frissíti .env fájlt vagy DB config-ot
   ├─ Újraolvassa konfigurációt (no restart needed)
   └─ Webhook subscription: KGC → Support

3. RUNTIME DISABLE
   ├─ Admin UI: "Support modul kikapcsolása"
   ├─ SUPPORT_MODULE_ENABLED = false
   ├─ Leállítja webhook küldéseket
   └─ Support API hívások kimaradnak (graceful degradation)

4. HEALTH CHECK
   ├─ Periodikus: GET /api/support/health (minden 5 perc)
   ├─ Ha DOWN → Admin warning, de KGC ERP működik tovább
   └─ Ha UP → Plugin status: HEALTHY
```

---

## 4. API Specifikáció

### 4.1 KGC ERP → Support (Push Webhook)

Support modul feliratkozik KGC ERP eseményekre:

| Event | Webhook URL | Payload |
|-------|-------------|---------|
| `rental.started` | `/webhook/kgc/rental-started` | `{rental_id, customer, machine}` |
| `rental.ended` | `/webhook/kgc/rental-ended` | `{rental_id, customer, satisfaction_survey}` |
| `service.quote_ready` | `/webhook/kgc/quote-ready` | `{worklog_id, customer, quote_amount}` |
| `service.repair_done` | `/webhook/kgc/repair-done` | `{worklog_id, customer, pickup_info}` |
| `order.arrived` | `/webhook/kgc/order-arrived` | `{order_id, customer, items[]}` |

**Webhook Autentikáció:**
```http
POST /webhook/kgc/order-arrived
Content-Type: application/json
X-KGC-Signature: sha256=<HMAC signature>
X-KGC-Timestamp: 1703765432

{
  "event": "order.arrived",
  "data": { ... }
}
```

### 4.2 Support → KGC ERP (Pull API)

Chatbot lekérdezésekhez readonly API-k:

| Endpoint | Method | Leírás | Auth |
|----------|--------|--------|------|
| `/api/customers/by-phone/{phone}` | GET | Ügyfél info telefonszám alapján | API Key |
| `/api/rentals/{rental_id}/status` | GET | Bérlés aktuális státusza | API Key |
| `/api/service/worklogs/{worklog_id}/status` | GET | Munkalap státusz + becsült készség | API Key |
| `/api/orders/{order_id}/status` | GET | Rendelés státusz | API Key |
| `/api/inventory/check` | GET | Készlet elérhetőség raktáranként | API Key |
| `/api/service/appointments` | POST | Időpont foglalás (ha engedélyezett) | API Key |

**API Példa:**

```http
GET /api/service/worklogs/M-2025-0123/status
Authorization: Bearer <SUPPORT_API_KEY>

Response 200:
{
  "worklog_id": "M-2025-0123",
  "customer": {
    "id": "C-456",
    "name": "Nagy Péter",
    "phone": "+36309876543"
  },
  "machine": "Husqvarna láncfűrész 450e",
  "status": "javítás",
  "status_hu": "Javítás folyamatban",
  "estimated_completion": "2025-12-30T17:00:00Z",
  "quote_accepted": true,
  "quote_amount": 18500,
  "technician_notes": "Lánc és láncvezető csere. Készen várható 12/30 délután.",
  "can_pickup": false
}
```

---

## 5. Adatszinkronizáció Stratégia

### 5.1 Shared Data vs. API Pull

**Design Döntés:** **API Pull + Event-Driven Notifications**

| Megközelítés | Előny | Hátrány | Döntés |
|--------------|-------|---------|--------|
| Shared Database | Gyors, real-time | Tight coupling, schema lock | ❌ Nem használjuk |
| Data Replication | Support saját cache-el | Sync complexity, lag | ⚠️ Csak Long-Term Memory-hez |
| API Pull minden lekérdezésnél | Loose coupling, friss adat | Latency, API load | ✅ **Elsődleges** |
| Event-Driven Cache | Best of both | Complexity | ✅ **Másodlagos** (Redis cache) |

**Implementált stratégia:**

1. **Ügyfél alapadatok** → API Pull minden chatbot interakciónál
2. **Hosszú távú chatbot memória** → Support saját tárolója (már megvan: `/memory/`)
3. **Real-time események** → KGC ERP push webhook-ok
4. **Statikus tudásbázis** → Support saját knowledge-base (termékek, árak, GYIK)

### 5.2 Memória és Adatvédelem (GDPR)

**Support modul saját memória fájljai:**
```
/opt/chatwoot/memory/
├── kgc-support/
│   ├── identity.json            # Chatbot persona
│   ├── decisions.json           # Üzleti döntések (árak, garancia szabályok)
│   └── customers/
│       ├── C-123.json           # Ügyfél preferenciák, chat history
│       └── C-456.json
```

**GDPR Cascade Delete:**
```javascript
// KGC ERP - ügyfél törlés
DELETE /api/customers/C-123

// Automatikus cascade:
1. KGC ERP törli ügyfél rekordot
2. Webhook trigger: customer.deleted
3. Support modul fogadja:
   POST /webhook/kgc/customer-deleted
   { "customer_id": "C-123", "gdpr_reason": "user_request" }
4. Support törli:
   - /memory/kgc-support/customers/C-123.json
   - Chatwoot contact
   - Redis cache kulcsok
```

---

## 6. Deployment Architektúra

### 6.1 Docker Compose Integráció

**Opció A: Külön stack-ek (Recommended)**

```yaml
# KGC ERP - docker-compose.yml
version: '3.8'
services:
  kgc-api:
    image: kgc-erp-api:latest
    environment:
      - SUPPORT_MODULE_ENABLED=true
      - SUPPORT_API_URL=http://support-chatbot:5001
      - SUPPORT_API_KEY=${SUPPORT_API_KEY}
    networks:
      - kgc-network
      - support-integration  # Közös hálózat

# Support - docker-compose.support.yml
version: '3.8'
services:
  support-chatbot:
    image: koko-ai-chatbot:latest
    environment:
      - KGC_API_URL=http://kgc-api:3000
      - KGC_API_KEY=${KGC_API_KEY}
    networks:
      - support-network
      - support-integration  # Közös hálózat

  chatwoot:
    image: chatwoot/chatwoot:latest
    # ... (mint az eredeti Support architektúrában)
```

**Indítás:**
```bash
# KGC ERP mindig elindul
docker-compose up -d

# Support modul opcionálisan
docker-compose -f docker-compose.support.yml up -d
```

**Opció B: Egységes stack (Alternatív)**

```yaml
# docker-compose.yml
services:
  kgc-api:
    # ...

  # Support modul (opcionális, ha SUPPORT_MODULE_ENABLED=true)
  support-chatbot:
    image: koko-ai-chatbot:latest
    profiles: ["support"]  # Docker Compose profiles

  chatwoot:
    profiles: ["support"]
```

**Indítás profile-lal:**
```bash
# KGC ERP + Support
docker-compose --profile support up -d

# Csak KGC ERP
docker-compose up -d
```

### 6.2 On-Premise Telepítés

**Franchise partner telepítés (ADR-002 alapján):**

```
┌─────────────────────────────────────────────────────────────┐
│              FRANCHISE PARTNER LOKÁCIÓ                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  KGC ERP (On-Premise Docker)                           │ │
│  │  • PostgreSQL                                          │ │
│  │  • Backend API                                         │ │
│  │  • PWA Frontend                                        │ │
│  │  • Sync Agent → Cloud HQ                              │ │
│  └────────────────────────────────────────────────────────┘ │
│                          │                                   │
│                          │ (Optional)                        │
│                          ▼                                   │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Support Modul (Plugin)                                │ │
│  │  • Chatwoot (local)                                    │ │
│  │  • Kokó AI Chatbot                                     │ │
│  │  • Context Manager                                     │ │
│  │  • Gemini API (Cloud)                                  │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Config per franchise:**
```bash
# Franchise A - Support enabled
SUPPORT_MODULE_ENABLED=true
CHATWOOT_ACCOUNT_ID=kgc-franchise-a
KNOWLEDGE_BASE_PATH=/opt/chatwoot/knowledge-bases/kgc-franchise-a/

# Franchise B - Support disabled
SUPPORT_MODULE_ENABLED=false
```

---

## 7. Módosítások Összefoglalása

### 7.1 KGC ERP Módosítások

| Komponens | Módosítás Típus | Leírás |
|-----------|----------------|--------|
| **Backend API** | ✅ Új Endpoint-ok | 6 új readonly API (customers, rentals, service, orders, inventory) |
| **Backend API** | ✅ Webhook Küldés | 5 esemény hook (rental, service, order) |
| **Backend Config** | ✅ Feature Flag | `SUPPORT_MODULE_ENABLED` env változó |
| **Admin UI** | ✅ Plugin Manager | Support modul enable/disable gomb, health status |
| **Database** | ⚠️ Opcionális index | Gyorsabb `/by-phone` lookup: `CREATE INDEX idx_customer_phone ON customers(phone)` |

**Fejlesztési Effort:** ~2-3 nap (API-k + webhook-ok + admin UI)

### 7.2 Support Modul Módosítások

| Komponens | Módosítás Típus | Leírás |
|-----------|----------------|--------|
| **ai-chatbot** | ✅ KGC Webhook Handler | 5 új webhook endpoint fogadás |
| **context-manager** | ✅ KGC Tudásbázis | `/knowledge-bases/kgc-support/` mappa KGC-specifikus GYIK-kel |
| **context-manager** | ✅ KGC API Client | HTTP kliensek a KGC ERP API-khoz |
| **Chatwoot** | ⚠️ Multi-Account | Minden franchise külön Chatwoot account (már támogatott) |

**Fejlesztési Effort:** ~1-2 nap (webhook handler-ek + API client wrapper)

---

## 8. Biztonsági Megfontolások

### 8.1 API Autentikáció

**KGC ERP API védelem:**

```http
# Support → KGC hívás
GET /api/customers/by-phone/+36301234567
Authorization: Bearer kgc_api_key_abc123
X-Request-ID: uuid-here
```

**API Key generálás:**
- Admin UI: "Support integráció" menü → "API Key generálás"
- Key scope: `support:read` (csak readonly műveletek)
- Rotation: 90 naponta, vagy revoke gomb

**Webhook védelem:**

```javascript
// KGC ERP webhook küldés
const crypto = require('crypto');
const timestamp = Date.now();
const payload = JSON.stringify(eventData);
const signature = crypto
  .createHmac('sha256', process.env.SUPPORT_WEBHOOK_SECRET)
  .update(`${timestamp}.${payload}`)
  .digest('hex');

// HTTP headers
headers: {
  'X-KGC-Signature': `sha256=${signature}`,
  'X-KGC-Timestamp': timestamp
}
```

```python
# Support webhook fogadás validáció
import hmac
import hashlib
import time

def validate_webhook(request):
    signature = request.headers.get('X-KGC-Signature')
    timestamp = request.headers.get('X-KGC-Timestamp')

    # Replay attack védelem
    if abs(time.time() - int(timestamp)) > 300:  # 5 perc
        return False

    # Signature check
    payload = request.body.decode('utf-8')
    expected_sig = hmac.new(
        WEBHOOK_SECRET.encode(),
        f"{timestamp}.{payload}".encode(),
        hashlib.sha256
    ).hexdigest()

    return hmac.compare_digest(f'sha256={expected_sig}', signature)
```

### 8.2 Adatvédelem

**Minimális adatcsere elv:**

| Adat Típus | Átadás? | Indoklás |
|------------|---------|----------|
| Ügyfél név, telefon | ✅ Igen | Azonosításhoz szükséges |
| Email | ✅ Igen | Értesítéshez szükséges |
| Bérlési/szerviz státusz | ✅ Igen | Chatbot válaszhoz szükséges |
| NAV adószám | ❌ Nem | Érzékeny, nem kell a chatbot-nak |
| Pénzügyi egyenleg | ⚠️ Csak összeg | Részletek nem, csak "tartozás van/nincs" |
| Személyi igazolvány szám | ❌ Nem | Érzékeny, nem kell |

**GDPR Compliance:**
- Support modul memória törlése cascade-del
- API audit log minden hívásról (ki, mit, mikor lekérdezett)
- Chatbot disclaimer: "Ez egy AI asszisztens, nem helyettesíti az emberi ügyfélszolgálatot"

---

## 9. Tesztelési Stratégia

### 9.1 Integráció Tesztek

```javascript
// KGC ERP integration test suite
describe('Support Module Integration', () => {

  it('should disable webhooks when SUPPORT_MODULE_ENABLED=false', async () => {
    process.env.SUPPORT_MODULE_ENABLED = 'false';
    const order = await createOrder({ customer_id: 'C-123' });
    await markOrderArrived(order.id);

    // Webhook NEM ment ki
    expect(webhookMock).not.toHaveBeenCalled();
  });

  it('should send webhook when SUPPORT_MODULE_ENABLED=true', async () => {
    process.env.SUPPORT_MODULE_ENABLED = 'true';
    const order = await createOrder({ customer_id: 'C-123' });
    await markOrderArrived(order.id);

    // Webhook elment
    expect(webhookMock).toHaveBeenCalledWith(
      expect.objectContaining({
        event: 'order.arrived',
        data: expect.objectContaining({ order_id: order.id })
      })
    );
  });

  it('should continue operation if Support API is down', async () => {
    supportApiMock.mockRejectedValue(new Error('Connection refused'));

    // KGC ERP művelet sikeres, csak warning log
    const order = await createOrder({ customer_id: 'C-123' });
    expect(order).toBeDefined();
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining('Support notification failed')
    );
  });
});
```

### 9.2 E2E Teszt Forgatókönyv

**Teszt Eset: Szerviz munkalap javítás kész → Chatbot értesítés**

1. **Előkészület:**
   - KGC ERP: `SUPPORT_MODULE_ENABLED=true`
   - Support modul: Chatwoot aktív, Gemini elérhető
   - Teszt ügyfél: Kovács János (+36301112233)

2. **Lépések:**
   ```
   [KGC ERP Admin]
   1. Szerviz munkalap státusz: "javítás" → "kész"
   2. "Mentés" gomb

   [KGC ERP Backend]
   3. Munkalap frissítés DB-ben
   4. Webhook trigger: POST /webhook/kgc/repair-done

   [Support ai-chatbot]
   5. Webhook fogadás + validáció
   6. Chatwoot conversation lookup (Kovács János)
   7. Üzenet küldés: "Jó hírem van! A Husqvarna láncfűrésze kész, átvehető."

   [Ügyfél]
   8. Chatwoot widget értesítés (ha online)
   9. VAGY Email (ha offline)
   ```

3. **Elvárt Eredmény:**
   - ✅ Ügyfél kap értesítést 30 másodpercen belül
   - ✅ Chatbot üzenet tartalmazza: gép neve, munkalap ID, összeg
   - ✅ KGC ERP audit log: "Support notification sent: M-2025-0123"

**Teszt Eset: Support modul disabled → Graceful degradation**

1. **Előkészület:**
   - KGC ERP: `SUPPORT_MODULE_ENABLED=false`

2. **Lépések:**
   ```
   [KGC ERP Admin]
   1. Szerviz munkalap státusz: "kész"
   2. "Mentés" gomb

   [KGC ERP Backend]
   3. Munkalap frissítés DB-ben
   4. Webhook check: if (!isSupportModuleEnabled()) return;
   5. Webhook SKIP
   ```

3. **Elvárt Eredmény:**
   - ✅ Munkalap sikeresen frissült
   - ✅ Ügyfél NEM kapott automatikus értesítést (manuálisan SMS/telefon)
   - ✅ Nincs error log

---

## 10. Teljesítmény és Skálázhatóság

### 10.1 API Teljesítmény Célok

| Endpoint | Target Latency | Max Throughput |
|----------|----------------|----------------|
| `GET /api/customers/by-phone/{phone}` | <100ms | 100 req/s |
| `GET /api/service/worklogs/{id}/status` | <150ms | 50 req/s |
| `POST /webhook/*` | <50ms (async ack) | 200 req/s |

**Optimalizációk:**

```sql
-- Gyorsabb phone lookup
CREATE INDEX idx_customer_phone ON customers(phone);

-- Munkaalap státusz denormalizálva (ha szükséges)
ALTER TABLE worklogs ADD COLUMN status_summary JSONB;
-- { "status": "javítás", "estimated_completion": "2025-12-30", ... }
```

### 10.2 Webhook Queue (Opcionális, nagy volumen esetén)

```
┌────────────────────────────────────────────────────────────┐
│                  KGC ERP Backend                            │
├────────────────────────────────────────────────────────────┤
│                                                             │
│  Event: order.arrived                                       │
│      │                                                       │
│      ▼                                                       │
│  ┌─────────────────┐                                        │
│  │  Redis Queue    │  (Opcionális, nagy volumen esetén)    │
│  │  Bull/BullMQ    │                                        │
│  └────────┬────────┘                                        │
│           │                                                  │
│           ▼                                                  │
│  ┌─────────────────┐                                        │
│  │ Webhook Worker  │ → POST /webhook/kgc/order-arrived     │
│  │  (async retry)  │                                        │
│  └─────────────────┘                                        │
│                                                             │
└────────────────────────────────────────────────────────────┘
```

**Előnyök:**
- Retry logika (3x újrapróbálkozás)
- Support leállás esetén buffered queue
- KGC ERP nem blokkol webhook hibán

---

## 11. Költségbecslés

### 11.1 Support Modul Üzemeltetési Költségek

| Komponens | Havi Költség | Megjegyzés |
|-----------|--------------|------------|
| **Gemini API** | $15-30 | ~10,000 chatbot interakció/hó (context cache 75% kedvezmény) |
| **Chatwoot** | $0 (self-hosted) | Docker alapú, saját szerver |
| **OpenAI Whisper** | $5-10 | Hangüzenet transzkripció (alacsony volumen) |
| **Google Calendar API** | $0 | Ingyenes (limit alatt) |
| **SMS értesítések** | $20-50 | ~500 SMS/hó (opcionális, KGC dönti el) |
| **Szerver költség** | +$0-20 | Ha ugyanazon a szerveren fut mint a KGC ERP |

**Összesen:** ~$40-110/hó **franchise partner-enként**

**ROI:**
- Automatizált ügyfélszolgálat: 10-20 óra/hó munkaerő megtakarítás
- 24/7 elérhetőség: ügyfél elégedettség növekedés
- Időpontfoglalás automatizálás: admin terheltség csökkenés

### 11.2 Fejlesztési Költségbecslés

| Feladat | Effort | Felelős |
|---------|--------|---------|
| KGC ERP API endpoint-ok | 2 nap | Backend dev |
| KGC ERP webhook integráció | 1 nap | Backend dev |
| Admin UI - Plugin Manager | 1 nap | Frontend dev |
| Support webhook handler-ek | 1 nap | Support dev |
| KGC tudásbázis feltöltés | 0.5 nap | Content/Product |
| Integráció tesztek | 1 nap | QA + Dev |
| Dokumentáció | 0.5 nap | Tech Writer |

**Összesen:** ~7 fejlesztői nap (~$3,500-7,000 one-time)

---

## 12. Implementációs Ütemterv

### Fázis 1: Alapok (1 hét)

- [ ] KGC ERP: Feature flag infrastruktúra
- [ ] KGC ERP: 3 alap API (customers, rentals, service)
- [ ] Support: Webhook handler skeleton
- [ ] Docker compose frissítés (külön stack-ek)

### Fázis 2: Webhook Integráció (1 hét)

- [ ] KGC ERP: 5 webhook implementáció
- [ ] Support: KGC event handler-ek
- [ ] API/Webhook autentikáció
- [ ] Teszt környezet setup

### Fázis 3: Tudásbázis és Finomhangolás (1 hét)

- [ ] Support: KGC-specifikus knowledge base
- [ ] Chatbot persona finomhangolás (KGC brand voice)
- [ ] Admin UI: Plugin Manager
- [ ] Health check + monitoring

### Fázis 4: Tesztelés és Élesítés (1 hét)

- [ ] Integráció tesztek
- [ ] E2E tesztek valós adatokkal
- [ ] Performance tesztek
- [ ] Dokumentáció (admin + user guide)
- [ ] Pilot telepítés 1 franchise partner-nél

---

## 13. Kockázatok és Mitigáció

| Kockázat | Valószínűség | Hatás | Mitigáció |
|----------|--------------|-------|-----------|
| Support modul leállás | Közepes | Alacsony | **Graceful degradation**: KGC ERP működik tovább, webhook-ok skip-elődnek |
| API teljesítmény probléma | Alacsony | Közepes | DB index-ek, Redis cache, webhook queue |
| GDPR compliance probléma | Alacsony | Magas | Cascade delete, audit log, minimális adatcsere |
| Chatbot rossz válasz | Közepes | Közepes | Confidence score, human handover gomb, tudásbázis validáció |
| Webhook loop (infinite retry) | Alacsony | Közepes | Max 3 retry, exponenciális backoff, dead letter queue |

---

## 14. Kapcsolódó Dokumentumok

| Dokumentum | Hely | Leírás |
|------------|------|--------|
| Support PRD | `docs/ERP/Support/SUP-PRD-1.md` | Kokó AI termékkövetelmények |
| Support Architektúra | `docs/ERP/Support/SUP-ARCHITECTURE-1.md` | Support rendszer architektúra |
| KGC PRD | `docs/prd.md` | KGC ERP követelmények |
| KGC Diagram Index | `docs/Flows/diagram-docs/INDEX.md` | 30 üzleti folyamat diagram |
| ADR-002 Deployment | `docs/architecture/ADR-002-deployment-offline-strategy.md` | On-premise telepítés |

---

## 15. Következtetések

### Kulcs Döntések

1. **Plugin Architektúra** ✅ - Support modul teljesen opcionális, runtime enable/disable
2. **API-First Integráció** ✅ - Loose coupling, KGC ERP független marad
3. **Event-Driven Notifications** ✅ - Push webhook-ok real-time értesítésekhez
4. **Graceful Degradation** ✅ - Support hiba nem blokkolja a KGC ERP-t
5. **GDPR Cascade** ✅ - Ügyfél törlés automatikusan propagálódik

### Értéknövelés a KGC ERP-hez

- **Ügyfél élmény**: 24/7 chatbot támogatás, automatikus értesítések
- **Hatékonyság**: Adminok időt takarítanak meg (státusz lekérdezések, időpontfoglalás)
- **Bevétel**: White Label lehetőség - Support modul külön árképzéssel értékesíthető
- **Franchise vonzerő**: Modern, AI-alapú ügyfélszolgálat vonzza a partnereket

---

**Dokumentum Verzió:** 1.0
**Utolsó Frissítés:** 2025-12-28
**Következő Review:** 2025-01-15
