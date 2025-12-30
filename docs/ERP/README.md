# KGC ERP - Modul Dokumentáció (CORE + PLUGIN)

**Frissítve:** 2025-12-29
**Verzió:** 2.0
**Szerző:** Winston (Architect Agent)

---

## 📚 Áttekintés

Ez a könyvtár tartalmazza a KGC ERP **CORE és PLUGIN moduljainak** integrációs dokumentációját és diagramjait.

### 🔷 CORE Modulok vs 🔌 PLUGIN Modulok

**CORE Modulok** (kötelező komponensek):
- ❌ **Nem kapcsolhatók ki** - A rendszer alapvető építőköve
- ✅ **Direct DB integráció** - Közös `kgc` schema, direkt tábla hivatkozások
- ✅ **Egymástól függenek** - Bérlés → Inventory, Szerviz → Inventory

**PLUGIN Modulok** (opcionális komponensek):
- ✅ **Önállóan működnek** - A KGC ERP CORE független tőlük
- ✅ **Runtime ki-bekapcsolható** - Feature flag alapú enable/disable
- ✅ **API-First integráció** - RESTful API-k + Webhook események
- ✅ **Graceful degradation** - Modul hiba nem blokkolja a főrendszert

---

## 🗂️ Struktúra

```
docs/ERP/
├── KGC-ERP-Module-Integration.html   # 🌐 Főoldal (interaktív HTML)
├── README.md                           # 📄 Ez a fájl
│
├── 🔷 CORE MODULOK
│   └── Inventory/                      # 📦 Inventory/Raktárkezelés Modul
│       ├── INVENTORY-INTEGRATION-ARCHITECTURE.md   # Teljes specifikáció
│       ├── kgc-inventory-integration-architecture.excalidraw   # Architektúra diagram
│       └── kgc-inventory-dataflow.excalidraw                   # Adatfolyam diagram (DFD)
│
└── 🔌 PLUGIN MODULOK
    ├── Support/                        # 🤖 Kokó AI Support Modul
    │   ├── KGC-SUPPORT-INTEGRATION-ARCHITECTURE.md   # 69 oldal teljes specifikáció
    │   ├── SUP-PRD-1.md                              # Support PRD (Gemini AI, Chatwoot)
    │   ├── SUP-ARCHITECTURE-1.md                     # Support belső architektúra
    │   ├── kgc-support-integration-architecture.excalidraw   # Plugin architektúra diagram
    │   ├── kgc-support-integration-architecture.svg          # ↑ SVG export
    │   ├── kgc-support-dataflow.excalidraw                   # Adatfolyam diagram (DFD)
    │   └── kgc-support-dataflow.svg                          # ↑ SVG export
    │
    ├── CRM/                            # 📊 CRM Modul (jövőbeli)
    │   └── (Hamarosan...)
    │
    └── HR/                             # 👥 HR Modul (jövőbeli)
        └── (Hamarosan...)
```

---

## 📦 Inventory Modul (🔷 CORE MODUL)

### Státusz
**✅ Aktív** - Teljes dokumentáció és diagramok elkészülve (v4.2)

### Modultípus
**🔷 CORE MODUL** - Nem opcionális, a Bérlés/Szerviz/Értékesítés modulok alapvető komponense

### Fő Dokumentumok
1. **[INVENTORY-INTEGRATION-ARCHITECTURE.md](Inventory/INVENTORY-INTEGRATION-ARCHITECTURE.md)**
   - Központosított CIKK entitás (bérgépek, termékek, alkatrészek)
   - Multi-Warehouse támogatás (2-5 raktár)
   - Serial Number tracking (bérgépekhez)
   - Bérgép státusz workflow (bent → kint → szerviz → bent)
   - Core modul integrációk (Bérlés, Szerviz, Értékesítés, Pénzügy)
   - Költségbecslés: €5,600 fejlesztés (14 nap)

### Diagramok (7 db Excalidraw)

**Architecture & Data Flow (2 db):**
- **[Integration Architecture](Inventory/kgc-inventory-integration-architecture.excalidraw)** - Inventory komponensek + Core modulok integrációja
- **[Data Flow Diagram (DFD)](Inventory/kgc-inventory-dataflow.excalidraw)** - API hívások és adatfolyamok (Bérlés/Szerviz/Értékesítés → Inventory)

**Flowcharts (5 db):** *(részletek: [Inventory/README.md](Inventory/README.md))*
1. **[Bérlési Folyamat](Inventory/flowcharts/kgc-business-process-berles.excalidraw)** - Business Process Flow (8 lépés, 2 döntés)
2. **[Inventory API Logika](Inventory/flowcharts/kgc-algorithm-inventory-api.excalidraw)** - Algorithm/Logic Flow: `checkBergepAvailability()` (7 lépés, 4 döntés)
3. **[Ügyfél Bérlési Út](Inventory/flowcharts/kgc-user-journey-berles.excalidraw)** - User Journey Flow (6 lineáris lépés)
4. **[Webhook Szinkronizáció](Inventory/flowcharts/kgc-data-pipeline-webhook-sync.excalidraw)** - Data Pipeline: Webhook → Inventory sync (7 lépés, 2 döntés)
5. **[Bérgép Státusz Átmenetek](Inventory/flowcharts/kgc-bergep-status-transitions.excalidraw)** - State Machine (6 állapot, 8 átmenet)

### Integrációs Pontok (Core Modulok)
| Core Modul | Integráció Típus | Funkciók |
|-----------|------------------|----------|
| **Bérlés** | Direct Service Call | checkBergepAvailability, updateBergepStatus (kint/bent) |
| **Szerviz** | Direct Service Call | updateBergepStatus (szerviz), useServicePart (alkatrész felhasználás) |
| **Értékesítés** | Direct Service Call | checkStockAvailability, decreaseStock (készlet csökkentés) |
| **Pénzügy** | Direct Service Call | getStockValuation (készlet értékelés) |

### Adatmodell (PostgreSQL kgc schema)
- **cikk** - Központosított CIKK tábla (berlet/alkatresz/termék logikai szeparációval)
- **bergep_status** - Bérgép státusz (bent, kint, szerviz, destroyed, lost, sold)
- **inventory_movement** - Készletmozgás audit trail
- **warehouse** - Raktár/telephely

### Kritikus Constraint-ek (v4.2 Review)
```sql
-- Serial number duplikáció védelem
UNIQUE(warehouse_id, serial_number) WHERE serial_number IS NOT NULL

-- Egy bérgép = egy státusz
UNIQUE(cikk_id) ON bergep_status

-- Negatív készlet védelem
CHECK (mennyiseg >= 0)
```

---

## 🤖 Support Modul (🔌 PLUGIN MODUL)

### Státusz
**✅ Aktív** - Teljes dokumentáció és diagramok elkészülve

### Fő Dokumentumok
1. **[KGC-SUPPORT-INTEGRATION-ARCHITECTURE.md](Support/KGC-SUPPORT-INTEGRATION-ARCHITECTURE.md)** (69 oldal)
   - Plugin architektúra részletezése
   - 6 API endpoint + 5 webhook esemény
   - Deployment stratégia (Docker, On-Premise)
   - Biztonság (API Key, HMAC, GDPR)
   - Tesztelési forgatókönyvek
   - Költségbecslés: $40-110/hó

2. **SUP-PRD-1.md** - Termékkövetelmények
   - Gemini 2.0 Flash AI motor
   - Chatwoot integráció
   - 24/7 chatbot támogatás
   - Többnyelvű (HU/EN)

3. **SUP-ARCHITECTURE-1.md** - Belső architektúra
   - Chatwoot → Context Manager → Gemini API
   - Calendar Service (Google Calendar)
   - Email/Discord integráció

### Diagramok (Excalidraw + SVG)
- **Plugin Architektúra** - Rendszer felépítés (KGC CORE + Integration Layer + Support Plugin)
- **Adatfolyam (DFD)** - API Pull + Webhook Push folyamatok

### Integrációs Pontok
| KGC Modul | Integráció Típus | Funkciók |
|-----------|------------------|----------|
| **Bérlés** | API + Webhook | Bérlés státusz, késés értesítés |
| **Szerviz** | API + Webhook | Munkalap státusz, árajánlat/javítás kész értesítés, időpontfoglalás |
| **Értékesítés** | API + Webhook | Rendelés státusz, áru beérkezés értesítés |
| **Ügyfélkezelés** | API | Telefonszám alapú azonosítás, GDPR cascade delete |

---

## 📊 CRM Modul (🔌 PLUGIN MODUL - Tervezett)

### Státusz
**🟡 Tervezés alatt** - Dokumentáció elkészítésre vár

### Tervezett Funkciók
- Ügyfél kapcsolati menedzsment
- Lead követés és konverzió
- Marketing kampány integráció
- Értékesítési pipeline
- Ügyfél szegmentáció

### Integrációs Pontok (tervezett)
- Partner/Cég adatok szinkronizáció
- Bérlési/vásárlási előzmények
- Szerviz interakciók nyomon követése
- Support chatbot kapcsolatok

---

## 👥 HR Modul (🔌 PLUGIN MODUL - Tervezett)

### Státusz
**🟡 Tervezés alatt** - Dokumentáció elkészítésre vár

### Tervezett Funkciók
- Munkavállalói nyilvántartás
- Jelenlét követés
- Szabadság menedzsment
- Teljesítmény értékelés
- Bérszámfejtés előkészítés

### Integrációs Pontok (tervezett)
- Felhasználói szerepkörök (RBAC)
- Franchise partner dolgozók
- Szerviz technikusok allokáció
- Bérlési kézbesítők/sofőrök

---

## 🌐 Interaktív HTML Nézet

**Megnyitás:** [KGC-ERP-Module-Integration.html](KGC-ERP-Module-Integration.html)

### Funkciók
- ✅ **Sötét/Világos mód** - Témák közötti váltás
- ✅ **Modul navigáció** - Support / CRM / HR (sidebar)
- ✅ **SVG diagramok beágyazva** - Interaktív megjelenítés
- ✅ **Kollapsz részletek** - Diagram magyarázatok expand/collapse
- ✅ **Nyomtatható** - Print-friendly formátum
- ✅ **Bővíthető struktúra** - CRM/HR modulok hozzáadhatóak

### Használat
1. Nyisd meg a HTML fájlt böngészőben
2. Válassz modult a bal oldali menüből
3. Navigálj az Áttekintés / Architektúra / Adatfolyam / Dokumentáció fülök között
4. Használd a sötét mód gombot a jobb felső sarokban

---

## 🛠️ Fejlesztői Eszközök

### SVG Konverzió
Az Excalidraw diagramok SVG-re konvertálása:

```bash
# Egy diagram konvertálása
node docs/Flows/scripts/convert-to-svg.js docs/ERP/Support/diagram.excalidraw

# Batch konverzió (összes .excalidraw fájl egy mappában)
node docs/Flows/scripts/convert-to-svg.js --batch docs/ERP/Support/
```

### Új Modul Hozzáadása

1. **Könyvtár létrehozása:**
   ```bash
   mkdir -p docs/ERP/NewModule
   ```

2. **Dokumentumok készítése:**
   - `NewModule-INTEGRATION-ARCHITECTURE.md` - Integrációs specifikáció
   - `NewModule-PRD.md` - Termékkövetelmények
   - `*.excalidraw` - Diagramok (Excalidraw formátumban)

3. **SVG exportálás:**
   ```bash
   node docs/Flows/scripts/convert-to-svg.js --batch docs/ERP/NewModule/
   ```

4. **HTML frissítése:**
   - Nyisd meg `KGC-ERP-Module-Integration.html`
   - Másold a Support modul struktúráját
   - Cseréld ki a modul specifikus részeket (név, szín, tartalom)
   - Adj hozzá új sidebar menüpontot és content szekciót

---

## 📋 Dokumentációs Standard

### Modul Integrációs Dokumentum (kötelező)
Minden modulhoz egy `{MODULE}-INTEGRATION-ARCHITECTURE.md` fájl szükséges, amely tartalmazza:

1. **Executive Summary** - 1-2 bekezdés áttekintés
2. **Architektúrális Elvek** - Plugin architektúra, integráció módszere
3. **Integrációs Pontok** - Mely KGC modulokkal integrálódik, hogyan
4. **Plugin Menedzsment** - Feature flag, lifecycle, health check
5. **API Specifikáció** - Endpoint-ok, webhook-ok, autentikáció
6. **Adatszinkronizáció** - Pull/Push stratégia, adattárolás
7. **Deployment** - Docker, On-Premise, konfiguráció
8. **Módosítások** - Mit kell változtatni a KGC ERP-ben és a modulban
9. **Biztonság** - API auth, GDPR, adatvédelem
10. **Tesztelés** - Unit, integráció, E2E tesztek
11. **Költségbecslés** - Üzemeltetés, fejlesztés
12. **Implementációs Ütemterv** - Fázisok, határidők

### Diagram Követelmények
- **Excalidraw formátum** (.excalidraw) - Szerkeszthető forrás
- **SVG export** (.svg) - HTML beágyazáshoz
- Minimum 2 diagram / modul:
  1. **Architektúra diagram** - Plugin struktúra, komponensek
  2. **Adatfolyam diagram (DFD)** - API/Webhook folyamatok

### Színkódok (HTML modulokhoz)
- **Inventory (CORE):** Zöld (#2e7d32 / #c8e6c9)
- **Support (PLUGIN):** Lila (#7b1fa2 / #e1bee7)
- **CRM (PLUGIN):** Zöld-kék (#00695c / #b2dfdb)
- **HR (PLUGIN):** Narancs (#e64a19 / #ffccbc)

---

## 🚀 Következő Lépések

### Inventory Modul (🔷 CORE)
- ✅ Teljes dokumentáció (v4.2)
- ✅ Diagramok (Architecture + DFD + 5 Flowchart)
- ✅ Dedikált README ([Inventory/README.md](Inventory/README.md))
- ⏳ HTML hozzáadás (interaktív oldal)
- ⏳ Implementáció (3 hét, Fázis 6 - lásd architektúra doc)
  - Hét 1: Adatmodell + kritikus SQL fix-ek
  - Hét 2: Core modul integrációk
  - Hét 3: Tesztelés + validáció

### Support Modul (🔌 PLUGIN)
- ✅ Teljes dokumentáció
- ✅ Diagramok (Architecture + DFD)
- ✅ HTML integráció
- ⏳ Implementáció (4 hét, 4 fázis szerint)

### CRM Modul (🔌 PLUGIN)
- ⏳ PRD készítés
- ⏳ Integrációs architektúra tervezés
- ⏳ Diagramok készítése
- ⏳ HTML hozzáadás

### HR Modul (🔌 PLUGIN)
- ⏳ PRD készítés
- ⏳ Integrációs architektúra tervezés
- ⏳ Diagramok készítése
- ⏳ HTML hozzáadás

---

## 📞 Kapcsolódó Dokumentumok

| Dokumentum | Hely | Leírás |
|------------|------|--------|
| KGC PRD | `docs/prd.md` | Főrendszer termékkövetelmények |
| KGC Diagram Index | `docs/Flows/diagram-docs/INDEX.md` | 30 KGC ERP folyamat diagram |
| ADR-002 Deployment | `docs/architecture/ADR-002-deployment-offline-strategy.md` | Telepítési stratégia |
| ADR-001 Multi-Tenant | `docs/architecture/ADR-001-franchise-multitenancy.md` | Franchise architektúra |

---

**Verzió Történet:**
- **1.0** (2025-12-28) - Első kiadás: Support modul teljes dokumentáció + HTML
- **2.0** (2025-12-29) - Inventory (CORE) modul hozzáadva: Teljes dokumentáció + 7 diagram (Architecture + DFD + 5 Flowchart), dedikált README
