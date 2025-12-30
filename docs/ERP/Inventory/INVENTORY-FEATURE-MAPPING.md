# Inventory Flowchartok vs. Feature Diagramok - Kapcsolat Elemzés

**Verzió:** 1.0
**Dátum:** 2025-12-29
**Szerző:** Winston (Architect Agent)

---

## 📋 Áttekintés

Ez a dokumentum magyarázza, hogyan kapcsolódnak az **Inventory modul alapvető flowchart-jai** (`docs/ERP/Inventory/flowcharts/`) az **architektúra szintű Feature diagramokhoz** (`docs/architecture/Feature-*.excalidraw`).

**Kulcs megállapítás:**
- Az **Inventory flowchart-ok** az **alapvető (v1.0) működést** mutatják be
- A **Feature diagramok** a **v2.0+ bővítéseket** és **kritikus GAP-okat** dokumentálják

---

## 🎯 Inventory Flowchartok (Alap Működés - v1.0)

### Hely: `docs/ERP/Inventory/flowcharts/`

Ezek az **általános, modul-független folyamatokat** mutatják be:

| # | Flowchart | Fókusz | Verzió |
|---|-----------|--------|--------|
| 1 | **[kgc-business-process-berles.excalidraw](flowcharts/kgc-business-process-berles.excalidraw)** | Bérlési folyamat (Bérlés modul perspektíva) | v1.0 |
| 2 | **[kgc-algorithm-inventory-api.excalidraw](flowcharts/kgc-algorithm-inventory-api.excalidraw)** | `checkBergepAvailability()` API logika | v1.0 |
| 3 | **[kgc-user-journey-berles.excalidraw](flowcharts/kgc-user-journey-berles.excalidraw)** | Ügyfél bérlési út (UX perspektíva) | v1.0 |
| 4 | **[kgc-data-pipeline-webhook-sync.excalidraw](flowcharts/kgc-data-pipeline-webhook-sync.excalidraw)** | Webhook szinkronizáció (Plugin modulok) | v1.0 |
| 5 | **[kgc-bergep-status-transitions.excalidraw](flowcharts/kgc-bergep-status-transitions.excalidraw)** | Bérgép státusz átmenetek (state machine) | v1.0 |

**Jellemzők:**
- ✅ Egyszerű, egy tárolóhely / cikk (`cikk.location_code`)
- ✅ Alapvető készlet elérhető? ellenőrzés
- ✅ Státusz alapú tracking (bent, kint, szerviz)
- ❌ **NINCS** multi-location támogatás
- ❌ **NINCS** kiadási prioritás / picking javaslat

---

## 🚀 Feature Diagramok (Bővített Működés - v2.0+)

### Hely: `docs/architecture/Feature-*.excalidraw`

Ezek **konkrét üzleti GAP-okat** oldanak meg, amelyek **módosítják** az alapvető Inventory működést:

### 🔴 KRITIKUS: Feature-Multi-Location (Inventory v2.0)

| Fájl | Típus | GAP Megoldás |
|------|-------|--------------|
| **[Feature-Multi-Location-Raktarkezeles-Architektura.md](../../architecture/Feature-Multi-Location-Raktarkezeles-Architektura.md)** | Architektúra (47K) | Új `cikk_location` tábla, kiadási prioritás, pörgős készlet |
| **[Feature-Multi-Location-Kiadas-Flowchart.excalidraw](../../architecture/Feature-Multi-Location-Kiadas-Flowchart.excalidraw)** | Flowchart (43K) | **Picking javaslat algoritmus** - melyik polcról kiadni? |
| **[Feature-Multi-Location-Bevetelezes-Flowchart.excalidraw](../../architecture/Feature-Multi-Location-Bevetelezes-Flowchart.excalidraw)** | Flowchart (39K) | **Bevételezés többszörös lokációra** - polc választó UI |

**Új adatmodell:**
```sql
-- v1.0: Egy cikk = egy tárolóhely
cikk.location_code = "A12-03-05"  -- Single location

-- v2.0: Egy cikk = N tárolóhely
cikk_location[0].location_code = "A1-01-01"  (5 db, prioritás: 1)
cikk_location[1].location_code = "B2-03-05"  (50 db, prioritás: 2)
cikk_location[2].location_code = "C1-01-01"  (30 db, prioritás: 3)
```

**Üzleti probléma (idézet):**
> "Nem tudom hogy ebben benne van és ez ki van küszöbölni de valahogy hogy a cikkeket nem lehetett tár helyenként kezelni... egy cikket nem lehetett több tárhelyen kezelni... mindig a kisebbtől kezdjen el kiadni... pörgő raktárkészletet."

---

## 🔗 Kapcsolat Térképezés

### Hogyan befolyásolják a Feature diagramok az Inventory flowchart-okat?

| Inventory Flowchart (v1.0) | Befolyásoló Feature (v2.0) | Változás Típusa | Részletek |
|----------------------------|---------------------------|-----------------|-----------|
| **1. Business Process - Bérlés** | Feature-Multi-Location-Kiadas | 🟡 **Módosul** | "Készlet ellenőrzés" lépés → **picking javaslat** (melyik polcról?) |
| **2. Algorithm - API Logika** | Feature-Multi-Location-Raktarkezeles | 🔴 **Major változás** | `checkBergepAvailability()` → többszörös `cikk_location` ellenőrzés |
| **3. User Journey - Bérlés** | Feature-Multi-Location-Kiadas | 🟡 **Módosul** | UI: Raktáros picking lista generálása (nem csak "Van-e?") |
| **4. Webhook Sync** | *Nem érintett* | ✅ **Nincs változás** | Webhook továbbra is `updateBergepStatus()` hívja |
| **5. Bérgép Státusz** | *Nem érintett* | ✅ **Nincs változás** | Státusz átmenetek függetlenek a tárolóhelytől |

---

## 🎨 Vizuális Kapcsolat

```
┌─────────────────────────────────────────────────────────────┐
│ INVENTORY FLOWCHARTOK (v1.0 - Alap Működés)                 │
│ docs/ERP/Inventory/flowcharts/                              │
└─────────────────────────────────────────────────────────────┘
                          │
                          │ v2.0 Upgrade
                          │ Multi-Location Feature
                          ▼
┌─────────────────────────────────────────────────────────────┐
│ FEATURE DIAGRAMOK (v2.0 - Bővített Működés)                 │
│ docs/architecture/Feature-Multi-Location-*.excalidraw       │
│                                                              │
│  ✅ Új táblák: cikk_location                                 │
│  ✅ Új logika: Picking javaslat algoritmus                   │
│  ✅ Új UI: Polc választó (bevételezés), Picking lista (kiadás)│
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 Konkrét Példa: Bérlési Folyamat Módosulása

### v1.0 (jelenlegi Inventory flowchart)

**Flowchart:** `kgc-business-process-berles.excalidraw`

```
START → Igény → [Van elérhető bérgép?] → Jóváhagyás → API call → Szerződés → END
                       ↓ NEM
                     REJECT
```

**Logika:**
- **Egyszerű ellenőrzés:** `SELECT * FROM cikk WHERE id=? AND mennyiseg > 0`
- **Eredmény:** Van (igen) vagy Nincs (nem)

### v2.0 (Multi-Location Feature módosítással)

**Flowchart:** `Feature-Multi-Location-Kiadas-Flowchart.excalidraw`

```
START → Igény → [Van elérhető?] → [Egy vagy több lokáció?]
                       ↓ NEM                   ↓ TÖBB
                     REJECT            Picking javaslat algoritmus
                                                ↓
                                       [Polc A1: 5 db, B2: 50 db]
                                                ↓
                                       Raktáros picking lista
                                                ↓
                                       Jóváhagyás → Szerződés → END
```

**Logika:**
```sql
-- v1.0
SELECT mennyiseg FROM cikk WHERE id = ? AND warehouse_id = ?

-- v2.0
SELECT location_code, mennyiseg, kiadasi_prioritas
FROM cikk_location
WHERE cikk_base_id = ? AND warehouse_id = ?
ORDER BY kiadasi_prioritas ASC  -- Először pörgős polcról!
```

**Picking javaslat (példa):**
- Kérés: 8 db M10 csavar
- Javaslat:
  1. 5 db A1-01-01 polcról (prioritás: 1, pörgős)
  2. 3 db B2-03-05 polcról (prioritás: 2, tartalék)

---

## 🛠️ Implementációs Stratégia

### Fázis 1: v1.0 Alapok (jelenlegi Inventory flowchartok)
- Idő: 3 hét
- Cél: Alapvető Inventory működés (egy location/cikk)
- Eredmény: Bérlés/Szerviz/Értékesítés működik

### Fázis 2: v2.0 Multi-Location (Feature diagramok)
- Idő: +2 hét
- Cél: `cikk_location` tábla, picking algoritmus, UI módosítások
- Eredmény: Pörgős készlet + automatikus picking javaslat

**Prioritás:**
- v1.0 = 🔴 **KRITIKUS** (MVP)
- v2.0 = 🟠 **MAGAS** (Post-MVP, első bővítés)

---

## 📋 Checklist - Feature Integráció

Ha implementálod a Multi-Location Feature-t, frissíteni kell:

### Érintett Flowchartok

- [ ] `kgc-business-process-berles.excalidraw`
  - **Módosítás:** "Készlet ellenőrzés" → "Picking javaslat generálás"

- [ ] `kgc-algorithm-inventory-api.excalidraw`
  - **Módosítás:** `checkBergepAvailability()` algoritmus bővítése (multi-location query)

- [ ] `kgc-user-journey-berles.excalidraw`
  - **Módosítás:** UI lépés hozzáadása: "Raktáros picking lista átvétele"

### Nem Érintett Flowchartok

- ✅ `kgc-data-pipeline-webhook-sync.excalidraw` - Nincs változás (Webhook továbbra is státusz frissítést triggerel)
- ✅ `kgc-bergep-status-transitions.excalidraw` - Nincs változás (Státusz független a tárolóhelytől)

---

## 🔗 Kapcsolódó Dokumentumok

| Dokumentum | Hely | Típus |
|------------|------|-------|
| **Inventory v1.0 Architektúra** | [INVENTORY-INTEGRATION-ARCHITECTURE.md](INVENTORY-INTEGRATION-ARCHITECTURE.md) | Alap specifikáció |
| **Inventory v2.0 Feature** | [docs/architecture/Feature-Multi-Location-Raktarkezeles-Architektura.md](../../architecture/Feature-Multi-Location-Raktarkezeles-Architektura.md) | GAP megoldás |
| **Fit-Gap Analízis** | [docs/KGC-ERP-v3-Fit-Gap-Analízis-2025-12-29.md](../../KGC-ERP-v3-Fit-Gap-Analízis-2025-12-29.md) | Üzleti követelmények |
| **Inventory vs Fit-Gap** | [docs/Inventory-Modul-vs-Fit-Gap-Követelmények.md](../../Inventory-Modul-vs-Fit-Gap-Követelmények.md) | GAP összehasonlítás |

---

## 🎯 Összefoglalás

**Egyszerű válasz a kérdésre:**

1. **Inventory flowchartok** = **v1.0 alap működés** (egy location/cikk)
2. **Feature-Multi-Location diagramok** = **v2.0 bővítés** (N location/cikk)
3. **Kapcsolat:** A Feature diagramok **módosítják** az 1-3. flowchart logikáját (picking javaslat + UI változások)
4. **4-5. flowchart változatlan** marad (webhook, státusz átmenetek)

**Fejlesztési sorrend:**
1. Először implementáld a **v1.0 flowchart-ok** szerinti logikát (MVP)
2. Utána bővítsd ki a **Feature-Multi-Location** diagramok szerint (Post-MVP)

---

**Verzió Történet:**
- **1.0** (2025-12-29) - Első kiadás: Inventory flowchartok vs. Feature diagramok kapcsolat elemzés
