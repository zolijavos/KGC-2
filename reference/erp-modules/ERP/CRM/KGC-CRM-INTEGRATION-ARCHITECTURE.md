# KGC-CRM Rendszer Integrációs Architektúra

**Szerző:** Winston (Architect ügynök)
**Dátum:** 2025-12-28
**Verzió:** 1.0
**Státusz:** Tervezet

---

## Executive Summary

Ez a dokumentum definiálja a **Twenty CRM rendszer** integrálását a **KGC ERP v2** rendszerbe **önálló, ki-bekapcsolható modulként**. Az integráció célja, hogy a CRM modul:

1. **Opcionális legyen** - A KGC ERP működjön CRM modul nélkül is
2. **Pluginként** viselkedjen - Runtime enable/disable támogatás
3. **Lazán csatolódjon** - API-alapú integráció, minimális függőség
4. **Szolgáltatás előzményeket szinkronizáljon** - Bérlések, szervizek, értékesítés CRM-be
5. **Marketing automatizációt támogasson** - Email kampányok, ügyfél szegmentáció
6. **KGC legyen a master** - Partner adatok KGC-ben jönnek létre, CRM read-only view

---

## 1. Architektúrális Elvek

### 1.1 Plugin Architektúra

```
┌─────────────────────────────────────────────────────────────────────┐
│                         KGC ERP CORE                                 │
│                   (Független a CRM-től)                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐       │
│   │  Bérlés   │  │ Értékesítés│  │  Szerviz  │  │Ügyfélkez. │       │
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
│   │  • Data Sync Manager                                      │     │
│   └───────────────────────────────────────────────────────────┘     │
│                           │                                          │
└───────────────────────────┼──────────────────────────────────────────┘
                            │
                            ▼ (Optional)
┌─────────────────────────────────────────────────────────────────────┐
│                     CRM MODULE PLUGIN                                │
│                      (Twenty CRM - Self-Hosted)                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   ┌────────────────┐  ┌────────────────┐  ┌────────────────┐       │
│   │  GraphQL       │  │ Contact/Lead   │  │ Marketing      │       │
│   │  Adapter       │  │ Management     │  │ Automation     │       │
│   └────────────────┘  └────────────────┘  └────────────────┘       │
│                                                                      │
│   ┌────────────────┐  ┌────────────────┐  ┌────────────────┐       │
│   │  Service       │  │ Email Campaign │  │ Analytics      │       │
│   │  History       │  │ Engine         │  │ Dashboard      │       │
│   └────────────────┘  └────────────────┘  └────────────────┘       │
│                                                                      │
│   CRM modul státusz: ENABLED / DISABLED                             │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### 1.2 Integráció Módszerei

| Mód | Leírás | Használat |
|-----|--------|-----------|
| **API-First (REST → GraphQL)** | KGC REST API → GraphQL Adapter → Twenty | Partner szinkronizáció, szolgáltatás előzmények |
| **Webhook Push** | KGC ERP eseményeket küld a CRM-nek | Bérlés kész, szerviz kész, rendelés teljesítve |
| **Read-Only Sync** | KGC master → CRM slave (egyirányú) | Partner adatok CRM-ben csak olvashatók |
| **Feature Flags** | Runtime ki/be kapcsolás | `CRM_MODULE_ENABLED=true/false` |

---

## 2. Twenty CRM Áttekintés

### 2.1 Twenty CRM Jellemzők

**GitHub:** https://github.com/twentyhq/twenty
**Típus:** Open-source, modern CRM, GraphQL API
**Deployment:** Docker-based, self-hosted
**Technológia:** React + NestJS + GraphQL + PostgreSQL

**Előnyök KGC számára:**
- ✅ Self-hosted - teljes adat kontroll
- ✅ Személyre szabható - frontend + backend
- ✅ GraphQL API - rugalmas adatlekérdezés
- ✅ Modern UI - React-based
- ✅ Ingyenes - open-source

**Kihívások:**
- ⚠️ GraphQL adapter réteg szükséges (KGC REST → Twenty GraphQL)
- ⚠️ Custom field-ek létrehozása (bérlés előzmények, szerviz ID-k)
- ⚠️ Marketing automatizáció nem beépített (saját fejlesztés vagy integráció)

### 2.2 Twenty Személyre Szabás KGC-hez

**Egyedi entitások (Twenty Custom Objects):**

```graphql
# KGC Partner (Twenty Contact kiterjesztése)
type KGCContact {
  id: ID!
  name: String!
  phone: String!
  email: String
  company: String
  is_business: Boolean!

  # KGC-specifikus mezők
  kgc_customer_id: String!  # KGC Customer ID
  payment_status: String!    # good, late, blocked
  total_rentals: Int!
  total_revenue: Float!
  last_rental_date: DateTime
  last_service_date: DateTime

  # Kapcsolatok
  rental_history: [RentalRecord]
  service_history: [ServiceRecord]
  sales_history: [SalesRecord]
}

# Bérlési előzmény
type RentalRecord {
  id: ID!
  kgc_rental_id: String!
  machine_name: String!
  rental_start: DateTime!
  rental_end: DateTime!
  total_days: Int!
  total_cost: Float!
  status: String!  # completed, late, active
}

# Szerviz előzmény
type ServiceRecord {
  id: ID!
  kgc_worklog_id: String!
  machine_type: String!
  issue_description: String!
  repair_cost: Float!
  status: String!  # completed, in_progress
  completed_at: DateTime
}

# Értékesítési előzmény
type SalesRecord {
  id: ID!
  kgc_order_id: String!
  items: [OrderItem]
  total_amount: Float!
  order_date: DateTime!
  status: String!  # delivered, pending
}
```

---

## 3. Integrációs Pontok a KGC ERP Folyamataiban

### 3.1 Ügyfélkezelés Modul

**Integrációs Pont:** Partner létrehozás és szinkronizáció

| KGC ERP Funkció | CRM Integráció | API Flow |
|-----------------|----------------|----------|
| Új partner létrehozása | Automatikus CRM contact sync | KGC creates → Webhook → CRM creates contact |
| Partner adatok módosítása | CRM contact frissítés | KGC updates → Webhook → CRM updates contact |
| Partner törlése (GDPR) | CRM contact cascade delete | KGC deletes → Webhook → CRM deletes contact |
| Partner státusz változás | CRM mezők frissítése (payment_status) | KGC status change → Webhook → CRM update |

**Adatcsere példa (KGC → CRM):**

```json
{
  "event": "customer.created",
  "data": {
    "customer_id": "C-123",
    "name": "Kovács János",
    "phone": "+36301234567",
    "email": "kovacs@example.com",
    "company": null,
    "is_business": false,
    "created_at": "2025-12-28T10:00:00Z"
  }
}
```

**CRM GraphQL Mutation:**

```graphql
mutation CreateContact {
  createContact(data: {
    name: "Kovács János"
    phone: "+36301234567"
    email: "kovacs@example.com"
    customFields: {
      kgc_customer_id: "C-123"
      payment_status: "good"
      total_rentals: 0
      total_revenue: 0
    }
  }) {
    id
    name
  }
}
```

### 3.2 Bérlés Modul

**Integrációs Pont:** Bérlési előzmények szinkronizálása (Prioritás #1)

| KGC ERP Funkció | CRM Integráció | API Flow |
|-----------------|----------------|----------|
| Bérlés lezárása | CRM-be rental record mentése | KGC rental ends → Webhook → CRM creates rental_history |
| Késés kezelés | CRM payment_status frissítés | Late rental → Webhook → CRM updates payment_status="late" |
| Statisztika update | CRM total_rentals, total_revenue | Rental complete → Webhook → CRM aggregate update |

**Adatcsere példa:**

```json
{
  "event": "rental.completed",
  "data": {
    "rental_id": "R-2025-001",
    "customer_id": "C-123",
    "machine_name": "Makita talajvágó",
    "rental_start": "2025-12-25",
    "rental_end": "2025-12-28",
    "total_days": 3,
    "total_cost": 45000,
    "status": "completed"
  }
}
```

### 3.3 Szerviz Modul

**Integrációs Pont:** Szerviz előzmények szinkronizálása (Prioritás #1)

| KGC ERP Funkció | CRM Integráció | API Flow |
|-----------------|----------------|----------|
| Munkalap lezárása | CRM-be service record mentése | KGC worklog complete → Webhook → CRM creates service_history |
| Javítás költség | CRM total_service_revenue frissítés | Repair complete → Webhook → CRM aggregate |
| Utolsó szerviz dátum | CRM last_service_date frissítés | Service complete → Webhook → CRM update field |

**Adatcsere példa:**

```json
{
  "event": "service.completed",
  "data": {
    "worklog_id": "M-2025-0123",
    "customer_id": "C-123",
    "machine_type": "Husqvarna láncfűrész",
    "issue_description": "Lánc és láncvezető csere",
    "repair_cost": 18500,
    "completed_at": "2025-12-28T15:00:00Z",
    "status": "completed"
  }
}
```

### 3.4 Értékesítés Modul

**Integrációs Pont:** Értékesítési előzmények szinkronizálása

| KGC ERP Funkció | CRM Integráció | API Flow |
|-----------------|----------------|----------|
| Rendelés teljesítése | CRM-be sales record mentése | KGC order delivered → Webhook → CRM creates sales_history |
| Értékesítési statisztika | CRM total_sales, total_revenue | Order complete → Webhook → CRM aggregate |

**Adatcsere példa:**

```json
{
  "event": "order.delivered",
  "data": {
    "order_id": "O-2025-0456",
    "customer_id": "C-123",
    "items": [
      {
        "sku": "MAK-DGA452",
        "name": "Makita akkus fúró",
        "quantity": 2,
        "unit_price": 89000,
        "total": 178000
      }
    ],
    "total_amount": 178000,
    "order_date": "2025-12-20",
    "delivered_at": "2025-12-28"
  }
}
```

---

## 4. Plugin Menedzsment

### 4.1 Konfiguráció (Feature Flag)

**Környezeti változók (KGC ERP):**

```bash
# .env fájl
CRM_MODULE_ENABLED=true                # Plugin aktív/inaktív
CRM_API_URL=http://localhost:3000       # Twenty CRM URL
CRM_GRAPHQL_ENDPOINT=http://localhost:3000/graphql
CRM_API_KEY=crm_api_key_here            # GraphQL auth token
CRM_WEBHOOK_SECRET=crm_webhook_secret   # Webhook validáció
CRM_SYNC_MODE=async                     # async | sync
```

**GraphQL Adapter Konfiguráció:**

```javascript
// KGC ERP - GraphQL adapter setup
const { GraphQLClient } = require('graphql-request');

const crmClient = new GraphQLClient(process.env.CRM_GRAPHQL_ENDPOINT, {
  headers: {
    authorization: `Bearer ${process.env.CRM_API_KEY}`,
  },
});

function isCRMModuleEnabled() {
  return process.env.CRM_MODULE_ENABLED === 'true';
}
```

### 4.2 Plugin Lifecycle

```
┌─────────────────────────────────────────────────────────────┐
│                  PLUGIN LIFECYCLE                            │
└─────────────────────────────────────────────────────────────┘

1. DISCOVERY
   ├─ KGC ERP bootoláskor ellenőrzi: CRM_MODULE_ENABLED
   ├─ Ha true → próbál kapcsolódni CRM_GRAPHQL_ENDPOINT
   ├─ GraphQL query: { __schema { types { name } } }
   └─ Ha sikeres → Plugin status: ACTIVE

2. RUNTIME ENABLE
   ├─ Admin UI: "CRM modul bekapcsolása"
   ├─ Frissíti .env fájlt vagy DB config-ot
   ├─ GraphQL schema introspection (custom fields ellenőrzés)
   ├─ Webhook subscription: KGC → CRM
   └─ Initial data sync (opcionális): KGC partners → CRM contacts

3. RUNTIME DISABLE
   ├─ Admin UI: "CRM modul kikapcsolása"
   ├─ CRM_MODULE_ENABLED = false
   ├─ Leállítja webhook küldéseket
   └─ CRM API hívások kimaradnak (graceful degradation)

4. HEALTH CHECK
   ├─ Periodikus: GraphQL query { __typename } (minden 5 perc)
   ├─ Ha DOWN → Admin warning, de KGC ERP működik tovább
   └─ Ha UP → Plugin status: HEALTHY
```

---

## 5. API Specifikáció

### 5.1 KGC ERP → CRM (Push Webhook + GraphQL Adapter)

**Architektúra:**

```
KGC ERP Event → Webhook Queue → GraphQL Adapter → Twenty CRM
```

**Webhook-ok (KGC → CRM Adapter):**

| Event | Webhook URL | GraphQL Mutation |
|-------|-------------|------------------|
| `customer.created` | `/webhook/kgc/customer-created` | `createContact` |
| `customer.updated` | `/webhook/kgc/customer-updated` | `updateContact` |
| `customer.deleted` | `/webhook/kgc/customer-deleted` | `deleteContact` |
| `rental.completed` | `/webhook/kgc/rental-completed` | `createRentalRecord` |
| `service.completed` | `/webhook/kgc/service-completed` | `createServiceRecord` |
| `order.delivered` | `/webhook/kgc/order-delivered` | `createSalesRecord` |

**GraphQL Adapter példa (Webhook → Mutation):**

```javascript
// CRM GraphQL Adapter - Rental completed handler
async function handleRentalCompleted(webhookData) {
  if (!isCRMModuleEnabled()) {
    console.log('CRM module disabled, skipping sync');
    return;
  }

  const mutation = `
    mutation CreateRentalRecord($data: RentalRecordInput!) {
      createRentalRecord(data: $data) {
        id
        kgc_rental_id
      }
    }
  `;

  const variables = {
    data: {
      contact_id: await getContactByKGCId(webhookData.customer_id),
      kgc_rental_id: webhookData.rental_id,
      machine_name: webhookData.machine_name,
      rental_start: webhookData.rental_start,
      rental_end: webhookData.rental_end,
      total_days: webhookData.total_days,
      total_cost: webhookData.total_cost,
      status: 'completed'
    }
  };

  try {
    const result = await crmClient.request(mutation, variables);
    console.log('CRM rental record created:', result);
  } catch (error) {
    // CRM hiba nem blokkolja a KGC ERP műveletet
    console.error('CRM sync failed (non-critical):', error.message);
  }
}
```

### 5.2 CRM → KGC ERP (Read-Only Query)

**CRM UI Query-k** (Twenty frontend lekérdezésekhez):

**Opció 1: CRM közvetlenül lekérdezi a KGC API-t (optional)**

Ha a CRM frontend friss adatokat akar (pl. aktív bérlések):

```javascript
// Twenty CRM frontend - KGC API lekérdezés (opcionális)
async function fetchActiveRentals(kgcCustomerId) {
  const response = await fetch(`${KGC_API_URL}/api/customers/${kgcCustomerId}/active-rentals`, {
    headers: {
      'Authorization': `Bearer ${KGC_API_KEY}`
    }
  });
  return response.json();
}
```

**Opció 2: Csak szinkronizált adatok használata (recommended)**

A CRM csak a már szinkronizált `rental_history`, `service_history` adatokat használja - **nem kérdez vissza a KGC-hez**.

---

## 6. Marketing Automatizáció (Email Kampányok)

### 6.1 Email Kampány Trigger-ek

**Kampány típusok:**

| Kampány Neve | Trigger | Cél | Tartalom |
|--------------|---------|-----|----------|
| **Bérlés Lejárat Emlékeztető** | Bérlés lejárat -1 nap | Időben visszahozás | "Holnap lejár a bérlés, kérjük hozza vissza" |
| **Szerviz Kész Értesítés** | Munkalap státusz → kész | Átvétel ösztönzés | "Gépét javítottuk, átvehető!" |
| **Upsell Ajánlat** | Bérlés gyakoriság > 3/hó | Értékesítés | "Gyakori bérlő? Vegye meg 15% kedvezménnyel!" |
| **Inaktív Ügyfél Re-engagement** | Utolsó bérlés > 6 hónap | Reaktiválás | "Hiányzik! Íme 10% kedvezmény következő bérlésre" |
| **Új Termék Értesítés** | Új gép beérkezés | Cross-sell | "Új Makita fúrók érkeztek, bérelje ki!" |

**Technológia:**

**Opció A: Twenty beépített email (ha van modul)**
- Twenty UI-ból manuális kampány indítás
- Szegmentáció: total_rentals > X, last_rental_date < Y

**Opció B: SMTP Email Service (Gmail SMTP) - Recommended**
- KGC → CRM szinkronizálja a contact-okat
- CRM trigger → Gmail SMTP email küldés
- Kampány logika: CRM-ben (egyszerű email triggerek)

**Opció C: Custom Email Service (saját fejlesztés)**
- CRM adapter modul email küldő komponenst tartalmaz
- Node.js + Nodemailer + Template engine

**Döntés:** Kezdjük **Opció B (Gmail SMTP)**, legegyszerűbb, ingyenes, gyors MVP.

### 6.2 Email Kampány Implementáció (Gmail SMTP példa)

**Architektúra:**

```
KGC ERP → CRM (Twenty) → Gmail SMTP → Email Campaign
```

**CRM → Gmail SMTP Email Küldés:**

```javascript
// CRM GraphQL Adapter - Gmail SMTP email sender
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransporter({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // TLS
  auth: {
    user: process.env.GMAIL_USER, // pl. 'kgc-crm@gmail.com'
    pass: process.env.GMAIL_APP_PASSWORD, // App-specific password
  },
});

async function sendEmailToContact(contact, emailType) {
  const templates = {
    rental_expiring: {
      subject: `${contact.name}, a bérlésed hamarosan lejár!`,
      html: `<p>Kedves ${contact.name},</p>
             <p>A bérlésed holnap lejár. Szeretnéd meghosszabbítani?</p>`,
    },
    vip_welcome: {
      subject: `Üdvözlünk VIP ügyfélként, ${contact.name}!`,
      html: `<p>Gratulálunk! VIP státuszt értél el ${contact.total_rentals} bérlés után.</p>`,
    },
  };

  const template = templates[emailType];

  try {
    await transporter.sendMail({
      from: `"KGC Support" <${process.env.GMAIL_USER}>`,
      to: contact.email,
      subject: template.subject,
      html: template.html,
    });
    console.log('Email sent successfully:', contact.email);
  } catch (error) {
    console.error('Email send failed:', error.message);
  }
}
```

**Email Automation példa (CRM triggerrel):**

```yaml
# CRM Automation: Bérlés Lejárat Emlékeztető
Trigger: rental.end_date = tomorrow
Delay: 0 minutes
Action: Send email "Bérlés Lejárat Emlékeztető"
Template:
  Subject: "Holnap lejár a bérlése - KGC"
  Body: |
    Kedves {{FNAME}}!

    Emlékeztetünk, hogy holnap ({{RENTAL_END_DATE}}) lejár a {{MACHINE_NAME}} bérlése.

    Kérjük, hozza vissza a gépet időben!

    Üdvözlettel,
    KGC Csapat
```

**KGC → Gmail SMTP Email Trigger:**

```javascript
// KGC ERP - Bérlés lejárat emlékeztető trigger
async function checkRentalExpiringSoon() {
  const rentalsExpiringSoon = await db.rentals.find({
    rental_end: { $eq: moment().add(1, 'day').format('YYYY-MM-DD') },
    status: 'active'
  });

  for (const rental of rentalsExpiringSoon) {
    // Email küldés Gmail SMTP-n keresztül
    await sendRentalExpiringEmail({
      email: rental.customer.email,
      name: rental.customer.name,
      rentalEndDate: rental.rental_end,
      machineName: rental.machine_name
    });
  }
}

// Cron job: Minden nap 10:00-kor
cron.schedule('0 10 * * *', checkRentalExpiringSoon);
```

---

## 7. Deployment Architektúra

### 7.1 Docker Compose Integráció

**Opció A: Külön stack-ek (Recommended)**

```yaml
# KGC ERP - docker-compose.yml
version: '3.8'
services:
  kgc-api:
    image: kgc-erp-api:latest
    environment:
      - CRM_MODULE_ENABLED=true
      - CRM_API_URL=http://twenty-crm:3000
      - CRM_GRAPHQL_ENDPOINT=http://twenty-crm:3000/graphql
      - CRM_API_KEY=${CRM_API_KEY}
    networks:
      - kgc-network
      - crm-integration  # Közös hálózat

# CRM - docker-compose.crm.yml
version: '3.8'
services:
  twenty-crm:
    image: twentyhq/twenty:latest
    environment:
      - PG_DATABASE_URL=postgresql://twenty:password@crm-db:5432/twenty
      - FRONT_BASE_URL=http://localhost:3000
      - SERVER_URL=http://localhost:3000
    ports:
      - "3000:3000"
    networks:
      - crm-network
      - crm-integration  # Közös hálózat
    depends_on:
      - crm-db

  crm-db:
    image: postgres:15
    environment:
      POSTGRES_USER: twenty
      POSTGRES_PASSWORD: password
      POSTGRES_DB: twenty
    volumes:
      - crm-db-data:/var/lib/postgresql/data
    networks:
      - crm-network

  crm-graphql-adapter:
    image: kgc-crm-adapter:latest  # Custom adapter szolgáltatás
    environment:
      - KGC_API_URL=http://kgc-api:3000
      - CRM_GRAPHQL_ENDPOINT=http://twenty-crm:3000/graphql
      - CRM_API_KEY=${CRM_API_KEY}
      - MAILCHIMP_API_KEY=${MAILCHIMP_API_KEY}
    networks:
      - crm-integration

volumes:
  crm-db-data:

networks:
  crm-network:
  crm-integration:
```

**Indítás:**

```bash
# KGC ERP mindig elindul
docker-compose up -d

# CRM modul opcionálisan
docker-compose -f docker-compose.crm.yml up -d
```

### 7.2 Twenty CRM Személyre Szabás (Custom Fields)

**Twenty Admin UI - Custom Objects létrehozása:**

1. **Rental Record** custom object:
   - kgc_rental_id (Text)
   - machine_name (Text)
   - rental_start (Date)
   - rental_end (Date)
   - total_days (Number)
   - total_cost (Currency)
   - status (Select: completed, late, active)
   - contact (Relation → Contact)

2. **Service Record** custom object:
   - kgc_worklog_id (Text)
   - machine_type (Text)
   - issue_description (Text)
   - repair_cost (Currency)
   - status (Select: completed, in_progress)
   - completed_at (DateTime)
   - contact (Relation → Contact)

3. **Contact custom fields**:
   - kgc_customer_id (Text, unique)
   - payment_status (Select: good, late, blocked)
   - total_rentals (Number)
   - total_revenue (Currency)
   - last_rental_date (Date)
   - last_service_date (Date)

**GraphQL Schema Validation:**

```graphql
# Twenty GraphQL introspection query
query IntrospectCustomFields {
  __type(name: "Contact") {
    fields {
      name
      type {
        name
      }
    }
  }
}
```

---

## 8. Adatszinkronizáció Stratégia

### 8.1 Szinkronizációs Módok

| Stratégia | Leírás | Használat |
|-----------|--------|-----------|
| **Event-Driven (Webhook)** | KGC esemény → CRM azonnali frissítés | Partner változások, szolgáltatás befejezés |
| **Batch Sync (Napi)** | Bulk export KGC → CRM (éjjel) | Initial data load, nagyobb történelmi adatok |
| **Real-Time Query** | CRM lekérdezi KGC-t friss adatért (optional) | Aktív bérlések real-time státusz |

**Implementált stratégia:**

1. **Partner adatok**: Event-Driven (create/update/delete webhook)
2. **Szolgáltatás előzmények**: Event-Driven (rental/service/order complete webhook)
3. **Initial data load**: Batch Sync (egyszeri, CRM enable-kor)
4. **Real-time query**: NEM (CRM csak historikus adatokat tárol)

### 8.2 Initial Data Sync (CRM Enable-kor)

**Első alkalommal CRM modul engedélyezésekor:**

```javascript
// KGC ERP - Initial CRM sync
async function performInitialCRMSync() {
  console.log('Starting initial CRM sync...');

  // 1. Sync all customers → CRM contacts
  const customers = await db.customers.find({ active: true });
  console.log(`Syncing ${customers.length} customers...`);

  for (const customer of customers) {
    await syncCustomerToCRM(customer);
  }

  // 2. Sync all rental history (last 12 months)
  const rentals = await db.rentals.find({
    rental_end: { $gte: moment().subtract(12, 'months').toDate() },
    status: 'completed'
  });
  console.log(`Syncing ${rentals.length} rental records...`);

  for (const rental of rentals) {
    await syncRentalToCRM(rental);
  }

  // 3. Sync all service history (last 12 months)
  const services = await db.worklogs.find({
    completed_at: { $gte: moment().subtract(12, 'months').toDate() },
    status: 'completed'
  });
  console.log(`Syncing ${services.length} service records...`);

  for (const service of services) {
    await syncServiceToCRM(service);
  }

  console.log('Initial CRM sync completed!');
}
```

### 8.3 GDPR Compliance

**Cascade Delete (KGC → CRM):**

```javascript
// KGC ERP - Customer delete (GDPR)
DELETE /api/customers/C-123

// Automatikus cascade:
1. KGC ERP törli customer rekordot
2. Webhook trigger: customer.deleted
3. CRM GraphQL Adapter fogadja:
   POST /webhook/kgc/customer-deleted
   { "customer_id": "C-123", "gdpr_reason": "user_request" }
4. CRM GraphQL Adapter törli:
   - Twenty Contact (where kgc_customer_id = "C-123")
   - Kapcsolódó Rental Records
   - Kapcsolódó Service Records
```

**GDPR Data Export:**

```graphql
# CRM GraphQL Query - Customer data export
query ExportCustomerData($kgcCustomerId: String!) {
  contact(where: { kgc_customer_id: { equals: $kgcCustomerId } }) {
    id
    name
    email
    phone
    rentalHistory {
      kgc_rental_id
      machine_name
      rental_start
      rental_end
      total_cost
    }
    serviceHistory {
      kgc_worklog_id
      machine_type
      repair_cost
      completed_at
    }
    salesHistory {
      kgc_order_id
      total_amount
      order_date
    }
  }
}
```

---

## 9. Biztonsági Megfontolások

### 9.1 GraphQL API Autentikáció

**Twenty CRM API Key generálás:**

```bash
# Twenty Admin UI:
Settings → API → Generate API Key
Scope: Full Access (read + write)
Name: KGC-ERP-Integration
```

**KGC → CRM GraphQL hívás védelem:**

```javascript
// GraphQL client setup
const crmClient = new GraphQLClient(process.env.CRM_GRAPHQL_ENDPOINT, {
  headers: {
    authorization: `Bearer ${process.env.CRM_API_KEY}`,
    'x-request-source': 'kgc-erp',
  },
});
```

**Webhook védelem (CRM → KGC Adapter):**

```javascript
// Webhook signature validation
const crypto = require('crypto');

function validateWebhook(request) {
  const signature = request.headers['x-kgc-signature'];
  const timestamp = request.headers['x-kgc-timestamp'];

  // Replay attack védelem
  if (Math.abs(Date.now() - parseInt(timestamp)) > 300000) { // 5 perc
    return false;
  }

  // HMAC signature check
  const payload = request.body;
  const expectedSig = crypto
    .createHmac('sha256', process.env.CRM_WEBHOOK_SECRET)
    .update(`${timestamp}.${JSON.stringify(payload)}`)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(`sha256=${expectedSig}`),
    Buffer.from(signature)
  );
}
```

### 9.2 Adatvédelem (GDPR)

**Minimális adatcsere elv:**

| Adat Típus | KGC → CRM Átadás? | Indoklás |
|------------|-------------------|----------|
| Ügyfél név, telefon, email | ✅ Igen | CRM alapfunkciókhoz szükséges |
| Bérlési/szerviz előzmények | ✅ Igen | Marketing szegmentációhoz |
| Pénzügyi egyenleg részletek | ❌ Nem | Érzékeny, csak payment_status flag (good/late/blocked) |
| NAV adószám | ❌ Nem | Érzékeny, CRM-nek nem kell |
| Személyi igazolvány | ❌ Nem | Érzékeny, CRM-nek nem kell |

**CRM hozzáférés korlátozás:**

```yaml
# Twenty RBAC (Role-Based Access Control)
Roles:
  - Marketing Manager:
      - Read: Contacts, Rental History, Service History
      - Write: Email Campaigns
      - No Access: Payment details, GDPR export

  - Sales Rep:
      - Read: Contacts, Sales History
      - Write: Contacts (update only)
      - No Access: Full customer delete

  - Admin:
      - Full Access: All
```

---

## 10. Teljesítmény és Skálázhatóság

### 10.1 GraphQL Query Teljesítmény

**Cél:**

| Művelet | Target Latency | Max Throughput |
|---------|----------------|----------------|
| Contact create (webhook) | <200ms | 50 req/s |
| Rental history sync | <300ms | 30 req/s |
| GraphQL aggregate query | <500ms | 20 req/s |

**Optimalizációk:**

```javascript
// GraphQL DataLoader pattern (N+1 query elkerülés)
const { DataLoader } = require('dataloader');

const contactLoader = new DataLoader(async (kgcCustomerIds) => {
  const query = `
    query GetContactsBatch($ids: [String!]!) {
      contacts(where: { kgc_customer_id: { in: $ids } }) {
        id
        kgc_customer_id
      }
    }
  `;

  const result = await crmClient.request(query, { ids: kgcCustomerIds });
  return kgcCustomerIds.map(id =>
    result.contacts.find(c => c.kgc_customer_id === id)
  );
});

// Használat: Batch webhook processing
async function syncRentalsBatch(rentals) {
  const contactIds = await Promise.all(
    rentals.map(r => contactLoader.load(r.customer_id))
  );
  // Most már batch-elt lekérdezés történt, nem N darab külön query
}
```

### 10.2 Webhook Queue (Async Processing)

```
┌────────────────────────────────────────────────────────────┐
│                  KGC ERP Backend                            │
├────────────────────────────────────────────────────────────┤
│                                                             │
│  Event: rental.completed                                    │
│      │                                                       │
│      ▼                                                       │
│  ┌─────────────────┐                                        │
│  │  Redis Queue    │  (BullMQ - async processing)           │
│  │  Bull/BullMQ    │                                        │
│  └────────┬────────┘                                        │
│           │                                                  │
│           ▼                                                  │
│  ┌─────────────────┐                                        │
│  │ CRM Webhook     │ → GraphQL Mutation → Twenty CRM       │
│  │ Worker (async)  │                                        │
│  └─────────────────┘                                        │
│                                                             │
└────────────────────────────────────────────────────────────┘
```

**Előnyök:**
- ✅ KGC ERP nem blokkol CRM hívásra
- ✅ Retry logika (3x újrapróbálkozás, exponential backoff)
- ✅ CRM leállás esetén buffered queue
- ✅ Rate limiting (max 50 req/s)

---

## 11. Költségbecslés

### 11.1 CRM Modul Üzemeltetési Költségek

| Komponens | Havi Költség | Megjegyzés |
|-----------|--------------|------------|
| **Twenty CRM** | $0 (self-hosted) | Open-source, Docker alapú |
| **PostgreSQL Database** | $0 (self-hosted) | KGC szerverrel megosztva vagy külön container |
| **Gmail SMTP** | $0 (ingyenes) | 500 email/nap Gmail fiókkal, 2000/nap Google Workspace-szel |
| **GraphQL Adapter** | $0 (self-developed) | Node.js service, KGC infrastruktúrán |
| **Szerver költség** | +$0-30 | Ha ugyanazon a szerveren fut mint a KGC ERP |
| **Backup & Storage** | $5-10 | CRM DB backup (S3 vagy helyi) |

**Összesen:** ~$5-40/hó **franchise partner-enként**

**ROI:**
- Lead követés automatizálása: 5-10 óra/hó admin időmegtakarítás
- Email kampányok: 15-20% customer retention növekedés (industry benchmark)
- Szolgáltatás előzmények láthatósága: Jobb upsell lehetőségek

### 11.2 Fejlesztési Költségbecslés

| Feladat | Effort | Felelős |
|---------|--------|---------|
| **Twenty CRM setup + customization** | 2 nap | DevOps + CRM admin |
| **GraphQL Adapter fejlesztés** | 3 nap | Backend dev |
| **KGC ERP webhook integráció** | 2 nap | Backend dev |
| **Initial data sync script** | 1 nap | Backend dev |
| **Gmail SMTP email sender** | 0.5 nap | Backend dev |
| **Admin UI - CRM Plugin Manager** | 1 nap | Frontend dev |
| **Tesztelés (integration + E2E)** | 2 nap | QA + Dev |
| **Dokumentáció** | 1 nap | Tech Writer |

**Összesen:** ~13 fejlesztői nap (~$6,500-13,000 one-time)

---

## 12. Implementációs Ütemterv

### Fázis 1: Alapok (1 hét)

- [ ] Twenty CRM Docker telepítés
- [ ] Custom fields létrehozása (Contact, RentalRecord, ServiceRecord)
- [ ] KGC ERP: Feature flag infrastruktúra (`CRM_MODULE_ENABLED`)
- [ ] GraphQL Adapter skeleton (connection test)
- [ ] Docker compose frissítés (külön stack-ek)

### Fázis 2: Partner Szinkronizáció (1 hét)

- [ ] KGC webhook: `customer.created`, `customer.updated`, `customer.deleted`
- [ ] GraphQL Adapter: Contact CRUD műveletek
- [ ] Initial data sync script (all customers → CRM contacts)
- [ ] GDPR cascade delete implementáció
- [ ] Webhook autentikáció (HMAC signature)

### Fázis 3: Szolgáltatás Előzmények (1 hét)

- [ ] KGC webhook: `rental.completed`, `service.completed`, `order.delivered`
- [ ] GraphQL Adapter: RentalRecord, ServiceRecord, SalesRecord create
- [ ] Aggregate statistics update (total_rentals, total_revenue)
- [ ] Initial data sync script (12 months history)
- [ ] Teszt forgatókönyvek (rental complete → CRM record megjelenik)

### Fázis 4: Email Marketing Automatizáció (1 hét)

- [ ] Gmail SMTP konfigurálás (app-specific password)
- [ ] Email template-ek készítése (bérlés emlékeztető, upsell)
- [ ] CRM trigger logika (rental_expiring, vip_welcome stb.)
- [ ] Nodemailer integráció + error handling
- [ ] Kampány tesztelés (dev email-ekkel)

### Fázis 5: Admin UI & Finomhangolás (1 hét)

- [ ] Admin UI: CRM Plugin Manager (enable/disable, health status)
- [ ] Admin UI: Initial sync trigger gomb
- [ ] Admin UI: CRM statistics dashboard (sync status, last sync time)
- [ ] Health check monitoring
- [ ] Performance optimalizáció (DataLoader, query caching)

### Fázis 6: Tesztelés és Élesítés (1 hét)

- [ ] Integráció tesztek (webhook flow végig)
- [ ] E2E tesztek (KGC rental complete → CRM record → Gmail email küldés)
- [ ] Performance tesztek (100+ webhook/s terhelés)
- [ ] Admin + user dokumentáció
- [ ] Pilot telepítés 1 franchise partner-nél
- [ ] Monitoring & alerting setup

---

## 13. Tesztelési Stratégia

### 13.1 Integráció Tesztek

```javascript
// KGC ERP integration test suite
describe('CRM Module Integration', () => {

  it('should create CRM contact when KGC customer is created', async () => {
    // 1. Create KGC customer
    const customer = await createCustomer({
      name: 'Teszt János',
      phone: '+36301112233',
      email: 'teszt@example.com'
    });

    // 2. Wait for webhook processing
    await sleep(2000);

    // 3. Verify CRM contact exists
    const crmContact = await crmClient.request(`
      query {
        contact(where: { kgc_customer_id: { equals: "${customer.id}" } }) {
          id
          name
          email
        }
      }
    `);

    expect(crmContact.contact.name).toBe('Teszt János');
    expect(crmContact.contact.email).toBe('teszt@example.com');
  });

  it('should create rental record when rental is completed', async () => {
    // 1. Complete rental in KGC
    const rental = await completeRental('R-2025-TEST');

    // 2. Wait for webhook processing
    await sleep(2000);

    // 3. Verify CRM rental record exists
    const crmRental = await crmClient.request(`
      query {
        rentalRecord(where: { kgc_rental_id: { equals: "R-2025-TEST" } }) {
          id
          machine_name
          total_cost
        }
      }
    `);

    expect(crmRental.rentalRecord.total_cost).toBe(rental.total_cost);
  });

  it('should continue operation if CRM API is down', async () => {
    // 1. Mock CRM API failure
    mockCrmApiDown();

    // 2. KGC ERP művelet sikeres, csak warning log
    const customer = await createCustomer({ name: 'Teszt' });
    expect(customer).toBeDefined();
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining('CRM sync failed')
    );
  });
});
```

### 13.2 E2E Teszt Forgatókönyv

**Teszt Eset: Bérlés befejezés → CRM sync → Gmail email kampány**

1. **Előkészület:**
   - KGC ERP: `CRM_MODULE_ENABLED=true`
   - Twenty CRM: Aktív, custom fields létrehozva
   - Gmail SMTP: Konfigurálva (app-specific password)
   - Teszt ügyfél: Nagy Péter (+36309876543, peter.nagy@test.hu)

2. **Lépések:**
   ```
   [KGC ERP Admin]
   1. Bérlés lezárása: R-2025-TEST, Nagy Péter, Makita fúró, 3 nap, 15000 Ft
   2. "Mentés" gomb

   [KGC ERP Backend]
   3. Rental frissítés DB-ben: status = "completed"
   4. Webhook trigger: POST /webhook/kgc/rental-completed

   [CRM GraphQL Adapter]
   5. Webhook fogadás + validáció
   6. GraphQL Mutation: createRentalRecord
   7. Contact update: total_rentals += 1, total_revenue += 15000

   [Twenty CRM]
   8. Rental Record létrejön (kgc_rental_id: R-2025-TEST)
   9. Contact frissül (total_rentals: 11 → Nagy Péter VIP státuszt kap)

   [Email Trigger]
   10. CRM trigger: total_rentals >= 10 → VIP welcome email trigger
   11. Gmail SMTP email küldés: "VIP Üdvözlő Email"

   [Nagy Péter Email]
   12. Email érkezik: "Köszönjük hűségét! VIP státusz - 10% kedvezmény"
   ```

3. **Elvárt Eredmény:**
   - ✅ Rental Record létrejött CRM-ben 30 másodpercen belül
   - ✅ Contact total_rentals frissült
   - ✅ VIP státusz trigger aktiválódott
   - ✅ Email kiküldve Gmail SMTP-n keresztül 1 percen belül
   - ✅ KGC ERP audit log: "CRM rental sync successful: R-2025-TEST"

---

## 14. Kockázatok és Mitigáció

| Kockázat | Valószínűség | Hatás | Mitigáció |
|----------|--------------|-------|-----------|
| CRM modul leállás | Közepes | Alacsony | **Graceful degradation**: KGC ERP működik tovább, webhook-ok queue-ba |
| GraphQL API teljesítmény | Alacsony | Közepes | DataLoader pattern, query caching, webhook queue |
| Twenty CRM customization limit | Alacsony | Közepes | Fork Twenty repo, self-host, teljes kontroll |
| Gmail SMTP napi limit túllépés | Alacsony | Alacsony | 500 email/nap elég kis franchise-hoz, Google Workspace → 2000/nap |
| GDPR compliance probléma | Alacsony | Magas | Cascade delete, audit log, GDPR export query |
| Initial data sync timeout | Közepes | Alacsony | Batch processing, progress tracking, resume capability |

---

## 15. Kapcsolódó Dokumentumok

| Dokumentum | Hely | Leírás |
|------------|------|--------|
| KGC PRD | `docs/prd.md` | KGC ERP követelmények |
| Support Integráció | `docs/ERP/Support/KGC-SUPPORT-INTEGRATION-ARCHITECTURE.md` | Support modul plugin architektúra |
| KGC Diagram Index | `docs/Flows/diagram-docs/INDEX.md` | 30 üzleti folyamat diagram |
| ADR-002 Deployment | `docs/architecture/ADR-002-deployment-offline-strategy.md` | On-premise telepítés |
| Twenty CRM Docs | https://twenty.com/developers | Twenty GraphQL API dokumentáció |

---

## 16. Következtetések

### Kulcs Döntések

1. **Plugin Architektúra** ✅ - CRM modul teljesen opcionális, runtime enable/disable
2. **Twenty CRM Self-Hosted** ✅ - Open-source, teljes személyre szabhatóság
3. **GraphQL Adapter Réteg** ✅ - KGC REST API → Twenty GraphQL translation
4. **KGC Master Data Source** ✅ - Partner adatok KGC-ben jönnek létre, CRM sync
5. **Szolgáltatás Előzmények Sync** ✅ - Bérlés, szerviz, értékesítés CRM-be
6. **Email Marketing (Gmail SMTP)** ✅ - Ingyenes, egyszerű, gyors MVP
7. **Graceful Degradation** ✅ - CRM hiba nem blokkolja a KGC ERP-t
8. **GDPR Cascade** ✅ - Ügyfél törlés automatikusan propagálódik

### Értéknövelés a KGC ERP-hez

- **Ügyfél élmény**: Személyre szabott marketing, lifecycle alapú kampányok
- **Értékesítési hatékonyság**: Szolgáltatás előzmények 360° view, upsell lehetőségek
- **Bevétel**: Customer retention 15-20% növekedés (email marketing)
- **Franchise vonzerő**: Modern CRM + marketing automatizáció, versenyképesség

### Következő Lépések

1. ✅ **CRM Integrációs Spec** elkészült (ez a dokumentum)
2. ⏭️ **Diagramok készítése** (Architecture + DFD)
3. ⏭️ **HTML frissítés** (CRM tab aktiválása)
4. ⏭️ **HR Modul Integráció** (hasonló struktúra)
5. ⏭️ **Összevont diagram** (KGC + Support + CRM + HR egyben)

---

**Dokumentum Verzió:** 1.0
**Utolsó Frissítés:** 2025-12-28
**Következő Review:** 2025-01-15
