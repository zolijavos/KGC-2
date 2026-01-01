# Inventory/Raktárkezelés Modul - Dokumentáció

**Verzió:** 1.1
**Frissítve:** 2025-12-29
**Modultípus:** 🔷 **CORE MODUL** (kötelező, nem opcionális)
**Státusz:** ✅ Teljes dokumentáció + 7 diagram

---

## 📚 Áttekintés

Az **Inventory/Raktárkezelés modul** a KGC ERP központi készletkezelő rendszere. Ez egy **CORE modul** - nem kapcsolható ki, a Bérlés, Szerviz és Értékesítés modulok közvetlenül függenek tőle.

### Fő Funkciók

- ✅ **Központosított CIKK entitás** - Bérgépek, termékek, alkatrészek egy táblában
- ✅ **Multi-Warehouse támogatás** - 2-5 raktár/telephely
- ✅ **Serial Number tracking** - Bérgépek egyedi azonosítása
- ✅ **Bérgép státusz workflow** - bent (elérhető) → kint (kiadva) → szerviz → bent
- ✅ **Real-time készletfrissítés** - Core modulok szinkronban
- ✅ **Készletmozgás nyomon követés** - Teljes audit trail

---

## 📂 Dokumentumok

### 1. Integrációs Architektúra (Teljes Specifikáció)

**Fájl:** [INVENTORY-INTEGRATION-ARCHITECTURE.md](INVENTORY-INTEGRATION-ARCHITECTURE.md)

**Tartalom:**
- Executive Summary (központosított CIKK, Multi-Warehouse, Serial Number)
- Architektúrális pozíció (Core vs Plugin modulok)
- Adatmodell (PostgreSQL táblák, constraint-ek, indexek)
- Core modul integrációk (Bérlés, Szerviz, Értékesítés, Pénzügy)
- API endpoint-ok (checkBergepAvailability, updateBergepStatus, stb.)
- Deployment stratégia (On-Premise PostgreSQL)
- Biztonság (RBAC, franchise izolálás)
- Tesztelési forgatókönyvek
- Költségbecslés (€5,600 / 14 nap)
- Implementációs ütemterv (6 fázis, 3 hét)

**Oldal:** ~25 oldal teljes dokumentáció

### 2. Feature Mapping Dokumentum (v1.0 vs v2.0)

**Fájl:** [INVENTORY-FEATURE-MAPPING.md](INVENTORY-FEATURE-MAPPING.md)

**Tartalom:**
- Inventory flowchartok vs. Feature diagramok kapcsolat elemzés
- v1.0 (alap működés) vs. v2.0 (multi-location bővítés)
- Konkrét példa: Bérlési folyamat módosulása
- Checklist: Mely flowchartok érintettek a Feature implementációnál
- Fejlesztési stratégia (v1.0 MVP → v2.0 Post-MVP)

**Kulcs megállapítás:**
> Az Inventory flowchartok az **alapvető (v1.0) működést** mutatják (egy location/cikk). A `docs/architecture/Feature-Multi-Location-*.excalidraw` diagramok a **v2.0 bővítést** dokumentálják (N location/cikk + picking javaslat)

---

## 🎨 Diagramok

### Architecture & Data Flow Diagrams (2 db)

| Diagram | Típus | Fájl | Leírás |
|---------|-------|------|--------|
| **Integration Architecture** | Excalidraw | [kgc-inventory-integration-architecture.excalidraw](kgc-inventory-integration-architecture.excalidraw) | Inventory komponensek + Core modulok integrációja |
| **Data Flow Diagram (DFD)** | Excalidraw | [kgc-inventory-dataflow.excalidraw](kgc-inventory-dataflow.excalidraw) | API hívások és adatfolyamok (Bérlés/Szerviz/Értékesítés → Inventory) |

### Flowcharts (5 db)

A `flowcharts/` mappában részletes folyamatábrák találhatók:

| # | Flowchart | Típus | Fájl | Leírás |
|---|-----------|-------|------|--------|
| 1 | **Bérlési Folyamat** | Business Process | [kgc-business-process-berles.excalidraw](flowcharts/kgc-business-process-berles.excalidraw) | Ügyfél bérlési igény → készlet ellenőrzés → jóváhagyás → szerződés → kiszállítás (8 lépés, 2 döntés) |
| 2 | **Inventory API Logika** | Algorithm/Logic Flow | [kgc-algorithm-inventory-api.excalidraw](flowcharts/kgc-algorithm-inventory-api.excalidraw) | `checkBergepAvailability()` függvény belső működése: validációk, státusz ellenőrzések, error handling (7 lépés, 4 döntés) |
| 3 | **Ügyfél Bérlési Út** | User Journey | [kgc-user-journey-berles.excalidraw](flowcharts/kgc-user-journey-berles.excalidraw) | Ügyfél perspektívából a bérlési folyamat: igény felmérés → készlet → választás → szerződés → átvétel (6 lineáris lépés) |
| 4 | **Webhook Szinkronizáció** | Data Pipeline | [kgc-data-pipeline-webhook-sync.excalidraw](flowcharts/kgc-data-pipeline-webhook-sync.excalidraw) | Webhook event → HMAC ellenőrzés → adatkinyerés → Inventory API hívás → logging (7 lépés, 2 döntés) |
| 5 | **Bérgép Státusz Átmenetek** | State Machine | [kgc-bergep-status-transitions.excalidraw](flowcharts/kgc-bergep-status-transitions.excalidraw) | Bérgép életciklus: bent ↔ kint ↔ szerviz, terminal státuszok: sold, lost, destroyed (6 állapot, 8 átmenet) |

**Formátum:** Minden diagram Excalidraw formátumban, profi stílussal (standard font, sima vonalak, Inventory színek: #2e7d32 / #c8e6c9)

**Megnyitás:** [https://excalidraw.com](https://excalidraw.com)

---

## 🗂️ Adatmodell (PostgreSQL kgc schema)

### Fő Táblák

| Tábla | Leírás | Rekordok (várható) |
|-------|--------|--------------------|
| **cikk** | Központosított CIKK tábla (berlet/alkatresz/termék logikai szeparációval) | 5,000-10,000 |
| **warehouse** | Raktár/telephely (2-5 lokáció) | 2-5 |
| **bergep_status** | Bérgép státusz (bent, kint, szerviz, destroyed, lost, sold) | ~500-1,000 |
| **inventory_movement** | Készletmozgás audit trail | ~50,000/év |
| **kategoria** | Cikk kategóriák (hierarchikus) | ~50-100 |

### Kritikus Constraint-ek (v4.2 Review)

```sql
-- Serial number duplikáció védelem
UNIQUE(warehouse_id, serial_number) WHERE serial_number IS NOT NULL

-- Egy bérgép = egy státusz
UNIQUE(cikk_id) ON bergep_status

-- Negatív készlet védelem
CHECK (mennyiseg >= 0)
```

### Performance Indexek

```sql
CREATE INDEX idx_cikk_warehouse ON cikk(warehouse_id);
CREATE INDEX idx_cikk_location ON cikk(location_code);
CREATE INDEX idx_cikk_berlet ON cikk(berlet) WHERE berlet = TRUE;
CREATE INDEX idx_cikk_alkatresz ON cikk(alkatresz) WHERE alkatresz = TRUE;
```

---

## 🔌 Integrációs Pontok (Core Modulok)

| Core Modul | Integráció Típus | Funkciók | API Endpoint-ok |
|-----------|------------------|----------|----------------|
| **Bérlés** | Direct Service Call | Bérgép elérhető? Státusz: bent → kint | `checkBergepAvailability()`, `updateBergepStatus()` |
| **Szerviz** | Direct Service Call | Státusz: szerviz, alkatrész felhasználás | `updateBergepStatus()`, `useServicePart()` |
| **Értékesítés** | Direct Service Call | Készlet ellenőrzés, készlet csökkentés | `checkStockAvailability()`, `decreaseStock()` |
| **Pénzügy** | Direct Service Call | Készlet értékelés, beszerzési/eladási ár | `getStockValuation()` |

**Integráció módja:** Direct database service calls ugyanazon `kgc` PostgreSQL schema-ban.

---

## 📊 Bérgép Státuszok (State Machine)

```
bent (Available) ─────────────────────┐
  │                                   │
  │ bérlés indul                      │ visszahozva
  ▼                                   │
kint (Rented) ──────────────────────────┘
  │                                   │
  │ probléma                          │
  ▼                                   ▼
szerviz (Service) ────────────────→ bent
                    javítás kész

Terminal státuszok (egyirányú):
- bent → sold (eladva)
- bent → lost (elveszett)
- bent → destroyed (selejtezve)
```

---

## 🚀 Implementációs Ütemterv

### Fázis 1-3: Előkészítés (2 nap)
- Database schema létrehozás
- Migration script-ek
- Seed data (raktárak, kategóriák)

### Fázis 4: Inventory Service (5 nap)
- `checkBergepAvailability()`
- `updateBergepStatus()`
- `checkStockAvailability()`
- `decreaseStock()`
- `useServicePart()`
- `getStockValuation()`

### Fázis 5: Core Modul Integrációk (4 nap)
- Bérlés modul → Inventory API
- Szerviz modul → Inventory API
- Értékesítés modul → Inventory API
- Pénzügy modul → Inventory API

### Fázis 6: Tesztelés & Validáció (3 nap)
- Unit tesztek (API endpoint-ok)
- Integrációs tesztek (Core modulok)
- Performance tesztek (1000+ bérgép)
- UAT franchise környezetben

**Összes időigény:** 14 nap (~3 hét)
**Költségbecslés:** €5,600 fejlesztés

---

## 💰 Költségbecslés

| Tervezés | Fejlesztés | Tesztelés | Dokumentáció | **Összes** |
|----------|-----------|-----------|--------------|------------|
| 2 nap | 9 nap | 3 nap | (meglévő) | **14 nap** |
| €800 | €3,600 | €1,200 | - | **€5,600** |

**Üzemeltetési költség:** Nincs külön (PostgreSQL On-Premise)

---

## 🧪 Tesztelési Forgatókönyvek

### 1. Bérgép Elérhető? (Happy Path)
```
Input: cikk_id = "uuid-bergep-1", warehouse_id = "uuid-warehouse-bp"
Expected: TRUE (státusz = "bent", warehouse egyezik)
```

### 2. Bérgép Kint Van (Reject Path)
```
Input: cikk_id = "uuid-bergep-2" (státusz = "kint")
Expected: FALSE
```

### 3. Serial Number Duplikáció (Constraint Védelem)
```
INSERT cikk (serial_number = "SN12345", warehouse_id = "uuid-warehouse-bp")
INSERT cikk (serial_number = "SN12345", warehouse_id = "uuid-warehouse-bp")
Expected: ERROR (UNIQUE constraint violation)
```

### 4. Negatív Készlet (Constraint Védelem)
```
UPDATE cikk SET mennyiseg = -5 WHERE id = "uuid-cikk-1"
Expected: ERROR (CHECK constraint violation)
```

---

## 📞 Kapcsolódó Dokumentumok

| Dokumentum | Hely | Leírás |
|------------|------|--------|
| **KGC ERP Főoldal** | [docs/ERP/README.md](../README.md) | Összes modul áttekintése (Support, CRM, HR, Inventory) |
| **KGC PRD** | [docs/prd.md](../../prd.md) | Főrendszer termékkövetelmények |
| **KGC Diagram Index** | [docs/Flows/diagram-docs/INDEX.md](../../Flows/diagram-docs/INDEX.md) | 30 KGC ERP folyamat diagram |
| **ADR-002 Deployment** | [docs/architecture/ADR-002-deployment-offline-strategy.md](../../architecture/ADR-002-deployment-offline-strategy.md) | Telepítési stratégia |
| **ADR-001 Multi-Tenant** | [docs/architecture/ADR-001-franchise-multitenancy.md](../../architecture/ADR-001-franchise-multitenancy.md) | Franchise architektúra |

---

## 🛠️ Fejlesztői Eszközök

### Excalidraw Diagramok Megnyitása

1. Nyisd meg [https://excalidraw.com](https://excalidraw.com)
2. File → Open → Válaszd ki a `.excalidraw` fájlt
3. Szerkeszd és mentsd

### SVG Export (opcionális)

```bash
# Egy diagram konvertálása SVG-re
node docs/Flows/scripts/convert-to-svg.js docs/ERP/Inventory/kgc-inventory-integration-architecture.excalidraw

# Batch konverzió (összes .excalidraw fájl)
node docs/Flows/scripts/convert-to-svg.js --batch docs/ERP/Inventory/flowcharts/
```

---

**Verzió Történet:**
- **1.0** (2025-12-29) - Első kiadás: Teljes architektúra dokumentáció + 2 diagram (Architecture + DFD)
- **1.1** (2025-12-29) - 5 flowchart hozzáadva: Business Process, Algorithm, User Journey, Data Pipeline, State Machine
