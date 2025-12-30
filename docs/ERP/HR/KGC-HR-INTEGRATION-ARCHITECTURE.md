# KGC-HR Rendszer Integrációs Architektúra

**Szerző:** Winston (Architect ügynök)
**Dátum:** 2025-12-28
**Verzió:** 1.0
**Státusz:** Tervezet

---

## Executive Summary

A KGC ERP rendszer HR modulja egy **opcionális, plugin-alapú integráció**, amely a **Horilla HRMS** nyílt forráskódú platformot használja munkavállaló adminisztrációra, jelenlét nyilvántartásra és szabadság kezelésre.

### Kulcs Követelmények

1. **Opcionális legyen** - A KGC ERP működjön HR modul nélkül is
2. **Pluginként** viselkedjen - Runtime enable/disable támogatás
3. **Lazán csatolódjon** - API-alapú integráció, minimális függőség
4. **Jelenlét nyilvántartást támogasson** - Attendance tracking Horilla-ban
5. **Szabadság kezelést biztosítson** - Leave management és approval workflow
6. **Employee törzsadatokat kezeljen** - Alapvető munkavállaló info + role
7. **KGC legyen a master** - Employee adatok KGC-ben jönnek létre, Horilla read-only view

### Stratégiai Döntések

```
┌─────────────────────────────────────────────┐
│  KGC ERP CORE (Független HR-től)            │
│  • Employee törzsadatok (id, név, role)     │
│  • Egyszerű employee lista view             │
└─────────────────────────────────────────────┘
                    ↓ (Opcionális)
        [HR_MODULE_ENABLED=true/false]
                    ↓
┌─────────────────────────────────────────────┐
│  HR MODULE PLUGIN (Horilla HRMS)            │
│  • Attendance (jelenlét nyilvántartás)      │
│  • Leave Management (szabadság kezelés)     │
│  • Employee profiles (gazdagított adatok)   │
│  • HR Helpdesk (belső ticketing)            │
└─────────────────────────────────────────────┘
```

**Költségbecslés:** ~$5-30/hó franchise partner-enként (legolcsóbb modul)

---

## 1. Modul Áttekintés

### 1.1 Horilla HRMS Platform

**Horilla** egy Django-alapú, nyílt forráskódú HR menedzsment rendszer.

- **Repository:** https://github.com/horilla-opensource/horilla
- **License:** LGPL-2.1 (kereskedelmi használat engedélyezett, módosítás nyílt marad)
- **Technológia:** Python, Django, PostgreSQL, Bootstrap
- **Deployment:** Docker Compose
- **API:** Django REST Framework
- **Status:** 959 GitHub stars, aktív fejlesztés

### 1.2 Választott Horilla Modulok

A KGC számára **3 prioritási modul** integrálása:

| Prioritás | Horilla Modul | KGC Használat |
|-----------|---------------|---------------|
| **#1** | **Attendance Tracking** | Jelenlét nyilvántartás (ki dolgozik ma, ki volt beteg) |
| **#2** | **Leave Management** | Szabadság/távollét igénylés és jóváhagyás |
| **#3** | **Employee Management** | Alapvető employee törzsadatok + role kezelés |

**NEM használt Horilla modulok:**
- ❌ Recruitment & Onboarding (toborzás külön folyamat)
- ❌ Payroll Processing (külön bérszámfejtő rendszer)
- ❌ Performance Management (teljesítményértékelés opcionális később)
- ❌ Asset Management (eszközkezelés KGC inventory-ban)

### 1.3 Django REST API Architektúra

A KGC REST API és a Horilla Django REST API közötti integráció:

```
KGC REST API (webhooks)
    ↓
Django REST Adapter (middleware service)
    ↓
Horilla REST API (Django endpoints)
```

**Különbség a CRM GraphQL megoldástól:**
- ✅ Egyszerűbb: REST → REST (nincs GraphQL fordítás)
- ✅ Natív Django REST Framework támogatás
- ✅ Standard HTTP methods (GET, POST, PUT, DELETE)

---

## 2. Plugin Architektúra Diagram

```
┌──────────────────────────────────────────────────────────────────┐
│                       KGC ERP CORE                                │
│               (Független a HR modultól)                           │
├──────────────────────────────────────────────────────────────────┤
│   ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐        │
│   │  Bérlés  │  │Értékesítés│  │ Szerviz  │  │Ügyfélkez.│        │
│   │  Modul   │  │   Modul   │  │  Modul   │  │  Modul   │        │
│   └──────────┘  └──────────┘  └──────────┘  └──────────┘        │
│   ┌──────────────────────────────────────────────────────┐       │
│   │          Integration Layer (Plugin Manager)          │       │
│   │  • Plugin Discovery                                  │       │
│   │  • Runtime Enable/Disable                            │       │
│   │  • API Gateway Routing                               │       │
│   │  • Webhook Registry                                  │       │
│   │  • Data Sync Manager                                 │       │
│   └──────────────────────────────────────────────────────┘       │
└─────────────────────────┼────────────────────────────────────────┘
                          │
                          ▼ (Optional)
                 [HR_MODULE_ENABLED]
                          │
                          ▼
┌──────────────────────────────────────────────────────────────────┐
│                  HR MODULE PLUGIN                                 │
│                  (Horilla HRMS - Self-Hosted)                     │
├──────────────────────────────────────────────────────────────────┤
│   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│   │  Django REST │  │  Attendance  │  │    Leave     │          │
│   │   Adapter    │  │   Tracking   │  │  Management  │          │
│   └──────────────┘  └──────────────┘  └──────────────┘          │
│   ┌──────────────┐  ┌──────────────┐                            │
│   │   Employee   │  │ HR Helpdesk  │                            │
│   │   Profiles   │  │  (Ticketing) │                            │
│   └──────────────┘  └──────────────┘                            │
└──────────────────────────────────────────────────────────────────┘
```

**Nincs külső service** (mint CRM-nél a Mailchimp) - minden self-hosted.

---

## 3. Integrációs Pontok a KGC Folyamataiban

### 3.1 Employee Lifecycle Events

**KGC Master adatfolyam:**

| KGC Esemény | HR Művelet | Horilla REST Endpoint |
|-------------|------------|----------------------|
| `employee.created` | Employee létrehozás Horilla-ban | `POST /api/employee/` |
| `employee.updated` | Employee frissítés | `PUT /api/employee/{id}/` |
| `employee.deleted` | Employee törlés (GDPR) | `DELETE /api/employee/{id}/` |
| `employee.role_changed` | Role/Department update | `PATCH /api/employee/{id}/` |

**Webhook Payload példa:**

```json
{
  "event": "employee.created",
  "timestamp": "2025-12-28T10:30:00Z",
  "data": {
    "kgc_employee_id": "EMP-001",
    "first_name": "János",
    "last_name": "Kovács",
    "email": "janos.kovacs@kgc.hu",
    "phone": "+36301234567",
    "role": "Technikus",
    "department": "Szerviz",
    "hire_date": "2025-01-15",
    "is_active": true
  }
}
```

### 3.2 Attendance Tracking (Jelenlét Nyilvántartás)

**Horilla funkció:** Attendance modul
**KGC használat:** Napi jelenlét rögzítése, betegállomány követés

**Adatfolyam:**

```
1. Munkavállaló bejelentkezik Horilla-ban (web/mobile)
   → Attendance record created (check-in time)

2. Munkavállaló kijelentkezik
   → Attendance record updated (check-out time, total hours)

3. KGC lekérdezi: "Ki dolgozik ma?"
   → GET /api/attendance/today/
   → Response: Lista aktív munkavállalókról
```

**KGC használati esetek:**
- Szerviz vezető ellenőrzi: "Mennyi technikus van ma munkaképes állapotban?"
- HR riport: "Havi ledolgozott órák összesítése"

**NEM használt Horilla Attendance funkciók:**
- ❌ Geofencing (helyszín alapú bejelentkezés)
- ❌ Biometric/Face detection
- ❌ Shift scheduling (műszak tervezés - opcionális később)

### 3.3 Leave Management (Szabadság Kezelés)

**Horilla funkció:** Leave Management modul
**KGC használat:** Szabadság/betegállomány igénylés és jóváhagyás

**Workflow:**

```
1. Munkavállaló igényel szabadságot (Horilla web UI)
   → Leave request created (status: pending)

2. Manager jóváhagyja/elutasítja (Horilla approval workflow)
   → Leave request updated (status: approved/rejected)

3. KGC lekérdezi: "Ki van szabadságon ma?"
   → GET /api/leave/today/
   → Response: Lista szabadságon lévő munkavállalókról
```

**Leave típusok:**
- Éves szabadság (Annual Leave)
- Betegszabadság (Sick Leave)
- Fizetés nélküli szabadság (Unpaid Leave)
- Egyéb távollét (Other)

**KGC használati esetek:**
- Szerviz vezető: "Van-e elegendő technikus a mai napi munkához?"
- HR dashboard: "Hány szabadságnap maradt János Kovácsnak?"

### 3.4 Employee Törzsadatok (Basic Info)

**KGC Master → Horilla Sync:**

| KGC Mező | Horilla Mező | Megjegyzés |
|----------|--------------|------------|
| `employee_id` | `kgc_employee_id` | Egyedi azonosító (KGC primary key) |
| `first_name` | `first_name` | Keresztnév |
| `last_name` | `last_name` | Vezetéknév |
| `email` | `email` | Email cím (login credential) |
| `phone` | `phone` | Telefonszám |
| `role` | `job_position` | Munkakör (Technikus, Értékesítő, stb.) |
| `department` | `department` | Szervezeti egység (Szerviz, Értékesítés) |
| `hire_date` | `hire_date` | Belépés dátuma |
| `is_active` | `is_active` | Aktív/Inaktív státusz |

**NEM szinkronizált adatok (Horilla-ban marad):**
- Attendance history (jelenlét előzmények)
- Leave balances (szabadság egyenleg)
- HR documents (HR dokumentumok)
- Performance reviews (teljesítményértékelés - ha később használjuk)

**Payroll adatok:** NEM tárolódnak (csak role/department törzsadat)

---

## 4. API Specifikáció

### 4.1 KGC → Horilla Webhook Push

**Endpoint (Horilla oldali webhook receiver):**

```
POST https://horilla.kgc.hu/api/webhooks/kgc/
```

**Authentication:**
```
Authorization: Bearer {HORILLA_API_KEY}
X-KGC-Signature: {HMAC-SHA256 signature}
```

**Employee Created Event:**

```json
POST /api/webhooks/kgc/
{
  "event": "employee.created",
  "timestamp": "2025-12-28T10:30:00Z",
  "data": {
    "kgc_employee_id": "EMP-001",
    "first_name": "János",
    "last_name": "Kovács",
    "email": "janos.kovacs@kgc.hu",
    "phone": "+36301234567",
    "role": "Technikus",
    "department": "Szerviz",
    "hire_date": "2025-01-15",
    "is_active": true
  }
}
```

**Horilla Response:**

```json
{
  "status": "success",
  "horilla_employee_id": 42,
  "kgc_employee_id": "EMP-001",
  "message": "Employee created successfully"
}
```

### 4.2 KGC ← Horilla Query (Read-Only)

**Attendance Today Query:**

```
GET https://horilla.kgc.hu/api/attendance/today/
Authorization: Bearer {KGC_API_KEY}
```

**Response:**

```json
{
  "date": "2025-12-28",
  "total_employees": 15,
  "present": 12,
  "absent": 1,
  "on_leave": 2,
  "employees": [
    {
      "kgc_employee_id": "EMP-001",
      "name": "János Kovács",
      "status": "present",
      "check_in": "2025-12-28T08:00:00Z",
      "check_out": null,
      "hours_worked": 2.5
    },
    {
      "kgc_employee_id": "EMP-002",
      "name": "Anna Nagy",
      "status": "on_leave",
      "leave_type": "Annual Leave",
      "leave_start": "2025-12-28",
      "leave_end": "2025-12-30"
    }
  ]
}
```

**Leave Balance Query:**

```
GET https://horilla.kgc.hu/api/leave/balance/{kgc_employee_id}/
Authorization: Bearer {KGC_API_KEY}
```

**Response:**

```json
{
  "kgc_employee_id": "EMP-001",
  "name": "János Kovács",
  "leave_balances": {
    "annual_leave": {
      "total": 20,
      "used": 8,
      "remaining": 12
    },
    "sick_leave": {
      "total": 10,
      "used": 2,
      "remaining": 8
    }
  },
  "pending_requests": 1
}
```

### 4.3 Django REST Adapter Implementation

**Adapter Service (middleware):**

```python
# Django REST Adapter - Employee webhook handler
import requests
from django.conf import settings

def handle_employee_created(webhook_data):
    """Handle employee.created webhook from KGC"""
    if not is_hr_module_enabled():
        logger.info('HR module disabled, skipping sync')
        return

    # Transform KGC data to Horilla format
    horilla_payload = {
        'employee_id': webhook_data['kgc_employee_id'],
        'badge_id': webhook_data['kgc_employee_id'],  # Horilla requirement
        'first_name': webhook_data['first_name'],
        'last_name': webhook_data['last_name'],
        'email': webhook_data['email'],
        'phone': webhook_data['phone'],
        'job_position_id': get_job_position_id(webhook_data['role']),
        'department_id': get_department_id(webhook_data['department']),
        'date_joining': webhook_data['hire_date'],
        'is_active': webhook_data['is_active']
    }

    try:
        response = requests.post(
            f"{settings.HORILLA_API_URL}/api/employee/",
            json=horilla_payload,
            headers={
                'Authorization': f"Bearer {settings.HORILLA_API_KEY}",
                'Content-Type': 'application/json'
            },
            timeout=10
        )
        response.raise_for_status()
        logger.info(f"Employee {webhook_data['kgc_employee_id']} created in Horilla")
    except requests.RequestException as e:
        logger.error(f"Horilla sync failed (non-critical): {e}")
        # Graceful degradation - KGC continues working

def is_hr_module_enabled():
    """Check if HR module is enabled via feature flag"""
    return os.getenv('HR_MODULE_ENABLED', 'false').lower() == 'true'

def get_job_position_id(role_name):
    """Map KGC role to Horilla job_position_id"""
    role_mapping = {
        'Technikus': 1,
        'Értékesítő': 2,
        'HR Manager': 3,
        'Adminisztrátor': 4
    }
    return role_mapping.get(role_name, 99)  # 99 = "Other"

def get_department_id(department_name):
    """Map KGC department to Horilla department_id"""
    dept_mapping = {
        'Szerviz': 1,
        'Értékesítés': 2,
        'HR': 3,
        'Adminisztráció': 4
    }
    return dept_mapping.get(department_name, 99)  # 99 = "Other"
```

---

## 5. Helpdesk Stratégia (Külön Kezelés)

### 5.1 Két Független Helpdesk Rendszer

```
┌────────────────────────────────────┐
│  SUPPORT HELPDESK                  │
│  (Chatwoot + Gemini AI)            │
│                                    │
│  • Külső ügyfél ticketek          │
│  • Bérlési kérdések                │
│  • Szerviz státusz lekérdezés      │
│  • Értékesítési érdeklődés         │
│  • AI chatbot asszisztencia        │
└────────────────────────────────────┘

┌────────────────────────────────────┐
│  HR HELPDESK                       │
│  (Horilla Ticketing)               │
│                                    │
│  • Belső munkavállaló kérések      │
│  • Szabadság jóváhagyás            │
│  • Bérszámfejtési kérdések         │
│  • Eszközkérés                     │
│  • HR policy dokumentumok          │
└────────────────────────────────────┘
```

**Nincs integráció a két rendszer között** - külön kezelik őket.

**Indoklás:**
- ✅ Egyszerűbb architektúra (nincs cross-system ticket sync)
- ✅ Chatwoot nem HR-specifikus (nincs leave approval workflow)
- ✅ Horilla ticketing natívan támogatja az HR use-case-eket
- ✅ Adatvédelem: belső HR ticketek (bér, teljesítmény) elkülönítve a külső support-tól

**Employee adatok megosztása:**
- Chatwoot látja az employee neveket (customer record-ként)
- Support agent tudja: "János Kovács (Technikus) küldte a ticketet"
- De nem látja a HR adatokat (jelenlét, szabadság, fizetés)

---

## 6. Deployment & Konfiguráció

### 6.1 Docker Compose Konfiguráció

```yaml
# docker-compose.hr.yml
version: '3.8'

services:
  horilla-hrms:
    image: horilla/horilla:latest
    environment:
      - DATABASE_URL=postgresql://horilla:password@hr-db:5432/horilla
      - SECRET_KEY=${HORILLA_SECRET_KEY}
      - DEBUG=False
      - ALLOWED_HOSTS=horilla.kgc.hu
    ports:
      - "8000:8000"
    networks:
      - hr-network
      - hr-integration
    depends_on:
      - hr-db
    volumes:
      - horilla-media:/app/media
      - horilla-static:/app/static

  hr-rest-adapter:
    image: kgc-hr-adapter:latest
    environment:
      - KGC_API_URL=http://kgc-api:3000
      - HORILLA_API_URL=http://horilla-hrms:8000
      - HORILLA_API_KEY=${HORILLA_API_KEY}
      - HR_MODULE_ENABLED=${HR_MODULE_ENABLED}
    networks:
      - hr-integration
    depends_on:
      - horilla-hrms

  hr-db:
    image: postgres:14-alpine
    environment:
      - POSTGRES_DB=horilla
      - POSTGRES_USER=horilla
      - POSTGRES_PASSWORD=password
    volumes:
      - hr-db-data:/var/lib/postgresql/data
    networks:
      - hr-network

networks:
  hr-network:
    internal: true
  hr-integration:
    external: true

volumes:
  hr-db-data:
  horilla-media:
  horilla-static:
```

### 6.2 Feature Flag Konfiguráció

```bash
# .env fájl
HR_MODULE_ENABLED=true

# KGC API környezeti változó
export HR_MODULE_ENABLED=true

# Horilla API key (generated in Horilla admin)
export HORILLA_API_KEY=hrm_sk_1234567890abcdef

# Horilla webhook secret (for signature validation)
export HORILLA_WEBHOOK_SECRET=whsec_abcdef1234567890
```

### 6.3 Horilla Initial Setup

**1. Horilla telepítés (Docker):**

```bash
cd /opt/kgc-erp/hr
docker-compose -f docker-compose.hr.yml up -d
```

**2. Database migration:**

```bash
docker-compose exec horilla-hrms python manage.py migrate
docker-compose exec horilla-hrms python manage.py createsuperuser
```

**3. REST API token generálás:**

```bash
# Login to Horilla admin: http://horilla.kgc.hu:8000/admin
# Navigate to: Settings → API Keys → Generate New Key
# Copy API key → Add to .env as HORILLA_API_KEY
```

**4. Job Positions & Departments létrehozása:**

```sql
-- Insert default job positions
INSERT INTO horilla_job_position (name, description) VALUES
  ('Technikus', 'Szerviz technikus'),
  ('Értékesítő', 'Értékesítési munkatárs'),
  ('HR Manager', 'HR vezető'),
  ('Adminisztrátor', 'Adminisztratív munkatárs');

-- Insert default departments
INSERT INTO horilla_department (name, description) VALUES
  ('Szerviz', 'Szerviz osztály'),
  ('Értékesítés', 'Értékesítési osztály'),
  ('HR', 'Humán erőforrás osztály'),
  ('Adminisztráció', 'Adminisztrációs osztály');
```

---

## 7. Biztonsági Megfontolások

### 7.1 GDPR Compliance

**Cascade Delete:**
- KGC-ben employee törlés → Horilla-ban is törlődik (employee.deleted webhook)
- Horilla attendance/leave történet is törlődik (GDPR right to be forgotten)

**Data Minimization:**
- Csak szükséges employee adatok szinkronizálása (nincs payroll összeg, bankszámla)
- Sensitive HR adatok (performance review, disciplinary) Horilla-ban marad, KGC nem látja

**Encryption:**
- HTTPS/TLS minden API híváshoz
- Database encryption at rest (PostgreSQL encrypted volumes)

**Access Control:**
- Django REST API key authentication
- Role-based permissions (Horilla RBAC)
- Csak HR manager láthatja az összes employee adatot

### 7.2 API Biztonság

**Webhook Signature Validation:**

```python
import hmac
import hashlib

def validate_webhook_signature(payload, signature, secret):
    """Validate HMAC-SHA256 signature for KGC webhooks"""
    expected_signature = hmac.new(
        secret.encode('utf-8'),
        payload.encode('utf-8'),
        hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(signature, expected_signature)

# Usage in webhook handler
def webhook_handler(request):
    signature = request.headers.get('X-KGC-Signature')
    if not validate_webhook_signature(request.body, signature, WEBHOOK_SECRET):
        return JsonResponse({'error': 'Invalid signature'}, status=403)
    # Process webhook...
```

**Rate Limiting:**
- 100 kérés/perc/partner (Horilla API rate limit)
- 429 Too Many Requests response túllépés esetén

**IP Whitelist:**
- Csak KGC szerverek IP címei hívhatják a Horilla API-t
- Nginx/Apache szintű IP filtering

---

## 8. Költségbecslés

| Komponens | Havi Költség | Megjegyzés |
|-----------|--------------|------------|
| **Horilla HRMS** | $0 (self-hosted) | Open-source, Django alapú |
| **PostgreSQL Database** | $0 (self-hosted) | KGC szerverrel megosztva |
| **Django REST Adapter** | $0 (self-developed) | Python service |
| **Szerver költség** | +$0-20 | Ha KGC infrastruktúrán (kis overhead) |
| **Backup & Storage** | $5-10 | HR DB backup |
| **NINCS külső service** | $0 | (CRM-nél Mailchimp $20-40) |

**Összesen:** ~**$5-30/hó** franchise partner-enként

**Legolcsóbb modul a háromból** (Support: $40-110, CRM: $25-80, HR: $5-30)

---

## 9. Implementációs Időzítés

### Fázis 1: Alapinfrastruktúra (1 hét)
- Horilla Docker telepítés
- PostgreSQL DB setup
- Django REST Adapter skeleton
- API authentication konfiguráció

### Fázis 2: Employee Sync (1 hét)
- `employee.created/updated/deleted` webhook handler
- Django REST API endpoint implementáció
- Job position & department mapping
- Unit és integrációs tesztek

### Fázis 3: Attendance Integration (1 hét)
- Attendance query endpoint (`GET /api/attendance/today/`)
- KGC dashboard widget: "Ki dolgozik ma?"
- Horilla web UI testreszabás (magyar nyelv)
- Mobile app testing (ha használjuk)

### Fázis 4: Leave Management (1 hét)
- Leave query endpoint (`GET /api/leave/balance/{id}/`)
- KGC dashboard widget: "Ki van szabadságon?"
- Leave approval workflow testing
- Email notifications setup

### Fázis 5: Tesztelés & Dokumentáció (1 hét)
- E2E tesztek
- Load testing
- Felhasználói dokumentáció (Horilla használat)
- Admin guide (HR manager-ek számára)

### Fázis 6: Éles Indítás (1 hét)
- Pilot deployment (1-2 franchise)
- Employee onboarding (meglévő munkavállalók importálása)
- Monitoring & alerting setup
- Rollout terv finalizálása

**Teljes időigény:** 6-7 hét

---

## 10. Használati Esetek (Use Cases)

### 10.1 Szerviz Vezető Napi Rutinja

**Reggeli ellenőrzés:**

```
1. KGC dashboard megnyitása
2. "HR Status" widget mutatja:
   - 12 technikus dolgozik ma
   - 1 technikus betegállományban
   - 2 technikus szabadságon
3. Munkalapok elosztása az elérhető 12 technikus között
```

**API hívás háttérben:**

```
GET /api/attendance/today/?department=Szerviz
Response:
{
  "present": 12,
  "absent": 1,
  "on_leave": 2,
  "employees": [...]
}
```

### 10.2 HR Manager Szabadság Jóváhagyás

**Workflow:**

```
1. János Kovács igényel 3 nap szabadságot (Horilla web UI)
2. HR Manager kap email értesítést
3. HR Manager bejelentkezik Horilla-ba
4. Ellenőrzi: János-nak van-e elég szabadságnap egyenlege? (12 nap maradt)
5. Ellenőrzi: Nincs-e túl sok technikus szabadságon ugyanakkor? (nem)
6. Jóváhagyja a kérelmet
7. János kap email értesítést: "Szabadságod jóváhagyva"
```

**Nincs KGC integráció** - teljes workflow Horilla-ban.

### 10.3 Munkavállaló Jelenlét Rögzítés

**Napi bejelentkezés:**

```
1. János Kovács megérkezik a munkahelyre (08:00)
2. Bejelentkezik Horilla web UI-on (vagy mobile app)
   - Username: janos.kovacs@kgc.hu
   - Password: ****
3. Kattint: "Check In" gomb
4. Horilla rögzíti:
   - Check-in time: 2025-12-28 08:00:00
   - Location: Office (ha geo van engedélyezve)
5. Munka végén: "Check Out" gomb
6. Horilla számítja: Total hours: 8.5
```

**KGC lekérdezés (opcionális):**

```
HR dashboard mutatja: "János Kovács ma 8.5 órát dolgozott"
```

---

## 11. Összehasonlítás a Support és CRM Modulokkal

| Szempont | Support | CRM | HR |
|----------|---------|-----|-----|
| **Platform** | Chatwoot + Gemini AI | Twenty CRM | Horilla HRMS |
| **Technológia** | Ruby, Python, PostgreSQL | Node.js, GraphQL, PostgreSQL | Python, Django, PostgreSQL |
| **API** | REST + AI API | GraphQL | Django REST |
| **Külső Service** | Gemini AI ($20-50/hó) | Mailchimp ($20-40/hó) | Nincs ($0) |
| **Adapter Komplexitás** | Közepes (AI wrapper) | Magas (GraphQL fordítás) | Alacsony (REST→REST) |
| **Havi Költség** | $40-110/franchise | $25-80/franchise | **$5-30/franchise** |
| **Prioritás** | #1: AI Chatbot, #2: Ticket Mgmt | #1: Service History, #2: Marketing | #1: Attendance, #2: Leave |
| **Master Data** | KGC Master (customers) | KGC Master (contacts) | **KGC Master (employees)** |
| **Helpdesk** | Külső ügyfél ticketek | N/A | Belső HR ticketek (külön) |

**HR Előnyei:**
- ✅ Legolcsóbb modul ($5-30/hó)
- ✅ Legegyszerűbb API integráció (REST→REST)
- ✅ Nincs külső függőség (self-contained)
- ✅ Django stack (Python közösség, sok developer)

---

## 12. Kockázatok és Mitigáció

### 12.1 Kockázatok

| Kockázat | Valószínűség | Hatás | Súlyosság |
|----------|--------------|-------|-----------|
| Horilla verzió frissítés API breaking change | Közepes | Magas | 🟠 Közepes |
| HR modul leállás → KGC attendance adatok elérhetetlenek | Alacsony | Közepes | 🟢 Alacsony |
| GDPR compliance sérülés (cascade delete nem működik) | Alacsony | Magas | 🟡 Közepes |
| Employee sync conflict (ugyanaz az email cím) | Közepes | Alacsony | 🟢 Alacsony |

### 12.2 Mitigációs Stratégiák

**1. API Version Pinning:**
```yaml
# docker-compose.hr.yml
horilla-hrms:
  image: horilla/horilla:1.2.0  # Fixed version, not "latest"
```

**2. Graceful Degradation:**
```python
try:
    horilla_response = query_horilla_attendance()
except HorillaAPIError:
    logger.warning("Horilla unavailable, showing basic employee list")
    fallback_employee_list = get_kgc_employees()  # KGC basic data
```

**3. GDPR Automated Testing:**
```python
def test_employee_cascade_delete():
    """Test that employee deletion cascades to Horilla"""
    employee = create_test_employee()
    delete_employee_in_kgc(employee.id)
    time.sleep(2)  # Allow webhook processing
    assert not horilla_employee_exists(employee.id)
```

**4. Email Uniqueness Validation:**
```python
def validate_employee_email(email):
    """Check email uniqueness before sync"""
    if kgc_employee_exists(email):
        raise ValidationError(f"Employee with email {email} already exists")
```

---

## 13. Jövőbeli Kiterjesztések (Opcionális)

### 13.1 Fázis 2 Modulok (később)

**Performance Management:**
- Teljesítményértékelés workflow
- KPI tracking
- 360-degree feedback

**Asset Management:**
- Munkavállalóhoz rendelt eszközök (laptop, telefon, autó)
- Eszköz kiadás/visszavétel tracking
- Karbantartási naplózás

**Shift Scheduling:**
- Műszak tervezés (Szerviz technikusok)
- Shift swap requests
- On-call rotáció

### 13.2 Mobilalkalmazás

**Horilla Mobile App** (ha elérhető):
- Jelenlét rögzítés mobilról
- Szabadság igénylés útközben
- Push notifications (szabadság jóváhagyva)

### 13.3 KGC Dashboard Widgets

**HR Status Widget:**
```
┌─────────────────────────────┐
│  HR Áttekintés - Ma         │
├─────────────────────────────┤
│  ✅ Dolgozik:       12 fő   │
│  🏥 Betegállomány:   1 fő   │
│  🏖️ Szabadságon:     2 fő   │
│  ⏰ Össz munkaóra:  96 óra  │
└─────────────────────────────┘
```

---

## Melléklet A: Horilla REST API Endpoints

### Employee Management

```
GET    /api/employee/                # List all employees
POST   /api/employee/                # Create employee
GET    /api/employee/{id}/           # Get employee details
PUT    /api/employee/{id}/           # Update employee
DELETE /api/employee/{id}/           # Delete employee
PATCH  /api/employee/{id}/           # Partial update
```

### Attendance

```
GET    /api/attendance/today/                    # Today's attendance
GET    /api/attendance/?date={YYYY-MM-DD}        # Specific date
GET    /api/attendance/{employee_id}/history/    # Employee history
POST   /api/attendance/checkin/                  # Check in
POST   /api/attendance/checkout/                 # Check out
```

### Leave Management

```
GET    /api/leave/                               # List leave requests
POST   /api/leave/                               # Create leave request
GET    /api/leave/{id}/                          # Get leave details
PUT    /api/leave/{id}/approve/                  # Approve leave
PUT    /api/leave/{id}/reject/                   # Reject leave
GET    /api/leave/balance/{employee_id}/         # Leave balance
```

---

## Melléklet B: Webhook Payload Példák

### Employee Created

```json
{
  "event": "employee.created",
  "timestamp": "2025-12-28T10:30:00Z",
  "signature": "sha256:abcdef1234567890",
  "data": {
    "kgc_employee_id": "EMP-001",
    "first_name": "János",
    "last_name": "Kovács",
    "email": "janos.kovacs@kgc.hu",
    "phone": "+36301234567",
    "role": "Technikus",
    "department": "Szerviz",
    "hire_date": "2025-01-15",
    "is_active": true
  }
}
```

### Employee Updated

```json
{
  "event": "employee.updated",
  "timestamp": "2025-12-28T11:00:00Z",
  "signature": "sha256:fedcba0987654321",
  "data": {
    "kgc_employee_id": "EMP-001",
    "changes": {
      "role": "Senior Technikus",
      "department": "Szerviz"
    }
  }
}
```

### Employee Deleted (GDPR)

```json
{
  "event": "employee.deleted",
  "timestamp": "2025-12-28T12:00:00Z",
  "signature": "sha256:1234567890abcdef",
  "data": {
    "kgc_employee_id": "EMP-001",
    "reason": "employee_left",
    "gdpr_deletion": true
  }
}
```

---

## Dokumentum Verzió Információ

**Verzió:** 1.0
**Utolsó Frissítés:** 2025-12-28
**Következő Review:** 2025-01-15
**Státusz:** Tervezet

**Változások:**
- 2025-12-28: Kezdeti verzió (Winston - Architect ügynök)

---

**Kapcsolódó Dokumentumok:**
- [KGC-Support Integration Architecture](../Support/KGC-SUPPORT-INTEGRATION-ARCHITECTURE.md)
- [KGC-CRM Integration Architecture](../CRM/KGC-CRM-INTEGRATION-ARCHITECTURE.md)
- [KGC ERP Module Integration HTML](../KGC-ERP-Module-Integration.html)

**Készítette:** Winston - AI Architect Agent
**Projekt:** KGC ERP v3.0 - HR Module Integration
**Kliens:** KGC (Kisgép Centrum)
