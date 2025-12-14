# KGC ERP - Rendszer Architektúra

## Diagram Alapinformációk

| Tulajdonság | Érték |
|-------------|-------|
| **Fájlnév** | `kgc-system-architecture.excalidraw` |
| **Típus** | Architektúra Diagram |
| **Modul** | Teljes Rendszer |
| **Verzió** | v2.0 |
| **Kapcsolódó ADR** | ADR-001, ADR-002, ADR-003 |
| **Készült** | 2025-12-02 |

---

## Áttekintés

Ez a diagram a KGC ERP rendszer **teljes architektúráját** mutatja be, 5 fő rétegben:

1. **License Server** - Központi licenc kezelés
2. **Cloud Layer (SaaS)** - Felhő infrastruktúra
3. **Deployment Layer** - Telepítési modellek
4. **PWA Offline Layer** - Offline működés
5. **Paper Backup Layer** - Papír alapú vészhelyzet

---

## 1. License Server Réteg

### 1.1 Funkciók

| Funkció | Leírás |
|---------|--------|
| **Aktiválás** | Licenc kulcs aktiválása telepítéskor |
| **Validálás** | Havi online ellenőrzés |
| **Feature Flags** | Csomag alapú funkció korlátozás |
| **Verzió követés** | Frissítés értesítések |

### 1.2 Architektúra

```
┌─────────────────────────────────────────────────────────────┐
│                    🔐 LICENSE SERVER                         │
│              (Központi - KGC által üzemeltetett)            │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │   Aktiválás  │  │  Validálás   │  │ Feature Flags│       │
│  │              │  │  (havonta)   │  │              │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐                         │
│  │  Verzió      │  │   Licenc DB  │                         │
│  │  Követés     │  │              │                         │
│  └──────────────┘  └──────────────┘                         │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 1.3 Licenc Típusok (ADR-003)

| Csomag | Felhasználók | Boltok | Főbb Funkciók |
|--------|--------------|--------|---------------|
| **Basic** | 3 | 1 | Bérlés, Értékesítés |
| **Pro** | 10 | 5 | + Szerviz, Offline PWA |
| **Enterprise** | Korlátlan | Korlátlan | + Franchise, API |

---

## 2. Cloud Layer (SaaS)

### 2.1 Komponensek

```
┌─────────────────────────────────────────────────────────────┐
│                    ☁️ CLOUD LAYER (SaaS)                     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐     ┌──────────────┐                      │
│  │ Load Balancer│────►│  App Server  │ (Node.js x2)         │
│  │   (nginx)    │     │              │                      │
│  └──────────────┘     └──────┬───────┘                      │
│                              │                               │
│         ┌────────────────────┼────────────────────┐         │
│         ▼                    ▼                    ▼         │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐ │
│  │  PostgreSQL  │     │    Redis     │     │   MinIO/S3   │ │
│  │  Primary +   │     │   Cache      │     │   (Files)    │ │
│  │  Replica     │     │              │     │              │ │
│  └──────────────┘     └──────────────┘     └──────────────┘ │
│                              │                               │
│                       ┌──────▼───────┐                      │
│                       │ Sync Service │                      │
│                       └──────────────┘                      │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Komponens Részletek

| Komponens | Technológia | Funkció |
|-----------|-------------|---------|
| **Load Balancer** | nginx | Terheléselosztás, SSL termination |
| **App Server** | Node.js | REST API, üzleti logika |
| **PostgreSQL** | Primary + Replica | Adatbázis, RLS tenant izoláció |
| **Redis** | Cache | Session, gyakori lekérdezések |
| **MinIO/S3** | Object Storage | Fájlok, dokumentumok, képek |
| **Sync Service** | Custom | Készlet szinkronizáció (1-5 perc) |

### 2.3 Hosting Opciók

| Provider | Előny | Használat |
|----------|-------|-----------|
| **Hetzner Cloud** | EU, GDPR, költséghatékony | Elsődleges |
| **DigitalOcean** | Egyszerű | Alternatíva |
| **AWS/Azure** | Enterprise | Nagy ügyfelek |

---

## 3. Deployment Layer

### 3.1 Telepítési Modellek

```
┌─────────────────────────────────────────────────────────────┐
│                   🏢 DEPLOYMENT LAYER                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐    │
│  │  KGC Központ  │  │  White Label  │  │  White Label  │    │
│  │    (Cloud)    │  │   GépBérlet   │  │   RentMaster  │    │
│  │               │  │  (On-Prem)    │  │   (Cloud)     │    │
│  │  tenant_type: │  │               │  │               │    │
│  │   'central'   │  │  Docker Host  │  │  Cloud Tenant │    │
│  │               │  │               │  │   (Pro)       │    │
│  │  Franchise    │  │  Sync Agent   │  │               │    │
│  │  partnerek    │  │  (opcionális) │  │               │    │
│  └───────────────┘  └───────────────┘  └───────────────┘    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 On-Premise Telepítés (Docker)

```yaml
# docker-compose.yml struktúra
services:
  nginx:      # Webszerver (:80/:443)
  backend:    # API (:3000)
  frontend:   # PWA (:8080)
  postgres:   # Adatbázis (:5432)
  redis:      # Cache (:6379)
  sync-agent: # Központ szinkron (opcionális)
```

### 3.3 Tenant Típusok

| Típus | Leírás | Példa |
|-------|--------|-------|
| **central** | KGC központ + franchise partnerek | Kisgépcentrum |
| **franchise** | Önálló franchise tenant | KGC Győr |
| **white_label** | Saját márkás telepítés | GépBérlet Pro |

---

## 4. PWA Offline Layer

### 4.1 Architektúra

```
┌─────────────────────────────────────────────────────────────┐
│                    📱 PWA OFFLINE LAYER                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │   Service    │  │  IndexedDB   │  │  Background  │       │
│  │   Worker     │──│  (~150MB)    │──│  Sync Queue  │       │
│  │  (Workbox)   │  │              │  │              │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
│                           │                                  │
│                    ┌──────▼───────┐                         │
│                    │ Last-Write-  │                         │
│                    │    Wins      │                         │
│                    │ Konfliktus   │                         │
│                    └──────────────┘                         │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 4.2 IndexedDB Tárolás

| Store | Méret | Tartalom |
|-------|-------|----------|
| **customers** | ~10 MB | Ügyfelek (~10,000) |
| **products** | ~100 MB | Cikkek (~50,000) |
| **rentalEquipment** | ~1 MB | Bérgépek (~500) |
| **pendingSync** | ~10 MB | Offline műveletek |
| **syncMeta** | ~1 KB | Szinkron státusz |
| **Összesen** | **~150 MB** | |

### 4.3 Cache Stratégiák (Workbox)

| Stratégia | Használat | Példa |
|-----------|-----------|-------|
| **CacheFirst** | Statikus adatok | Cikkek, bérgépek |
| **StaleWhileRevalidate** | Ügyféladatok | Partner lista |
| **NetworkFirst** | Írási műveletek | Bérlés, számla |
| **NetworkOnly** | Online-only | NAV számlázás |

### 4.4 Offline Funkciók

| Funkció | Offline | Megjegyzés |
|---------|---------|------------|
| Ügyfél keresés | ✅ | Cache-ből |
| Új ügyfél | ✅ | Pending queue |
| Bérlés indítás | ✅ | Pending queue |
| Készlet lekérdezés | ⚠️ | Utolsó ismert |
| Számla kiállítás | ❌ | NAV online kötelező |
| Vonalkód olvasás | ✅ | Lokális |

---

## 5. Paper Backup Layer

### 5.1 Vészhelyzet Rendszer

```
┌─────────────────────────────────────────────────────────────┐
│                    📄 PAPER BACKUP LAYER                     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │  OCR-Ready   │  │   QR Kódos   │  │  Vészhelyzet │       │
│  │   Űrlapok    │──│  Azonosítás  │──│    Csomag    │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
│         │                                                    │
│         ▼                                                    │
│  ┌──────────────┐  ┌──────────────┐                         │
│  │  Szkennelés  │──│  Tesseract   │                         │
│  │    / Fotó    │  │ + G.Vision   │                         │
│  └──────────────┘  └──────────────┘                         │
│                           │                                  │
│                    ┌──────▼───────┐                         │
│                    │   Manuális   │                         │
│                    │   Validálás  │                         │
│                    └──────────────┘                         │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 5.2 Vészhelyzet Csomag Tartalma

| Elem | Darab | Cél |
|------|-------|-----|
| Bérlési bizonylat | 50 db | Gép kiadás/visszavétel |
| Szerviz felvételi lap | 30 db | Munkalap indítás |
| Ügyfél adatlap | 20 db | Új ügyfél rögzítés |
| Készlet ellenőrző | 10 db | Leltár |
| Referencia anyagok | - | Árlisták, kódok |
| Toll, vonalzó, számológép | - | Eszközök |

### 5.3 OCR Feldolgozás

| Lépés | Leírás |
|-------|--------|
| 1. Szkennelés | Multifunkciós nyomtató vagy telefon |
| 2. QR kód | Űrlap típus automatikus felismerés |
| 3. OCR | Tesseract (ingyenes) + Google Vision (pontosabb) |
| 4. Validálás | Emberi ellenőrzés, javítás |
| 5. Rögzítés | Adatbázisba mentés, eredeti archiválás |

---

## Kapcsolódó Dokumentumok

| Dokumentum | Kapcsolat |
|------------|-----------|
| [ADR-001](../architecture/ADR-001-franchise-multitenancy.md) | Multi-tenant architektúra |
| [ADR-002](../architecture/ADR-002-deployment-offline-strategy.md) | Offline stratégia |
| [ADR-003](../architecture/ADR-003-white-label-strategy.md) | White Label termék |
| [franchise-adatfolyam.md](franchise-adatfolyam.md) | Tenant adatfolyam |
| [offline-szinkron-sequence.md](offline-szinkron-sequence.md) | Szinkron részletek |
| [rbac-hierarchia.md](rbac-hierarchia.md) | Jogosultságok |

---

## Összefoglaló

### Kulcs Architektúra Döntések

| Döntés | Választás | Indoklás |
|--------|-----------|----------|
| Adatbázis | Single DB + tenant_id | Egyszerű, költséghatékony |
| Izoláció | PostgreSQL RLS | Automatikus tenant szűrés |
| Offline | PWA + IndexedDB | Egy kódbázis, minden platform |
| Konfliktus | Last-Write-Wins | Egyszerű, érthető |
| Backup | OCR-ready papír | Teljes körű resilience |

### Resilience Szintek

```
1. Normál működés    → Cloud SaaS
2. Hálózat kiesés    → PWA Offline (IndexedDB)
3. Áramszünet        → Paper Backup (OCR)
```

---

*Dokumentáció készült: 2025-12-04*
*Kapcsolódó diagram: kgc-system-architecture.excalidraw*
