# Inventory Modul vs. Fit-Gap Követelmények - Összehasonlítás

**Dátum:** 2025-12-29
**Elemző:** BMAD Szakértői Csapat
**Forrás dokumentumok:**
- `/docs/ERP/Inventory/INVENTORY-INTEGRATION-ARCHITECTURE.md`
- `/docs/KGC-ERP-v3-Fit-Gap-Analízis-2025-12-29.md`

---

## 🎯 Executive Summary

Az **Inventory/Raktárkezelés CORE modul** részben átfedésben van a Fit-Gap analízisben azonosított követelményekkel, de **nem teljes mértékben** megoldja azokat. A modul jelenleg **warehouse-level** (raktárak közötti) multi-location kezelést támogat, de **shelf-level** (polcok közötti, egy raktáron belüli) multi-location funkcionalitás hiányzik.

### Státusz: ⚠️ RÉSZLEGES ÁTFEDÉS

| Fit-Gap Követelmény | Inventory Modul Állapot | GAP Státusz |
|---------------------|------------------------|-------------|
| **#1 Multi-location raktárkezelés** | ⚠️ **RÉSZLEGES** | 🟡 KÖZEPES GAP |
| #2 Kaució visszatartás | ✅ FÜGGETLEN | - |
| #3 Automatikus banki elszámolás | ✅ FÜGGETLEN | - |
| #4 Munkalap-Bérlés kapcsolat | ✅ FÜGGETLEN | - |

**Következtetés:** Az Inventory modul **alapot ad** a multi-location kezeléshez, de **kiegészítésre szorul** a teljes követelmény megoldásához.

---

## 📊 Részletes Összehasonlítás

### ✅ MIT OLD MEG az Inventory Modul?

#### 1. Multi-Warehouse (Raktárak Közötti Kezelés)

**Inventory modul képességek:**

```sql
-- Warehouse tábla: több raktár támogatása
CREATE TABLE kgc.warehouse (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,  -- BP-01, SZ-01, stb.
  address TEXT,
  city TEXT,
  active BOOLEAN DEFAULT TRUE
);

-- Cikk tábla: warehouse_id hivatkozással
CREATE TABLE kgc.cikk (
  warehouse_id UUID REFERENCES warehouse(id),
  location_code TEXT,  -- A12-03-05
  mennyiseg INTEGER
);
```

**Mit jelent ez a gyakorlatban?**
- ✅ Budapest raktár: 50 db CIKK_A
- ✅ Szeged raktár: 30 db CIKK_A
- ✅ Transfer raktárok között: `movement_type = 'transfer_ki' / 'transfer_be'`

**Üzleti érték:**
- Multi-site inventory visibility
- Stock transfer between warehouses
- Location-based stock reports

---

#### 2. Shelf-Row-Column Lokáció (Fizikai Hely)

**Inventory modul képességek:**

```sql
-- location_code TEXT mező
-- Példa értékek: "A12-03-05" (Shelf-Row-Column)
SELECT * FROM cikk WHERE location_code = 'A12-03-05';
```

**Mit jelent ez a gyakorlatban?**
- ✅ Egy cikk rekord tárolási helye: A12-03-05
- ✅ Raktáros tudja, hogy "hol van" a termék

**Korlátozás:**
- ❌ **Egy cikk = egy location_code** (1:1 kapcsolat)
- ❌ Nem lehet ugyanaz a cikk több polcon (multi-bin)

---

#### 3. Készletmozgás Audit Trail

**Inventory modul képességek:**

```sql
CREATE TABLE inventory_movement (
  movement_type TEXT,  -- beerkezett, kiadva_berles, transfer_ki, stb.
  from_warehouse_id UUID,
  to_warehouse_id UUID,
  from_location TEXT,
  to_location TEXT
);
```

**Mit jelent ez a gyakorlatban?**
- ✅ Teljes mozgástörténet (ki, mikor, honnan, hova)
- ✅ Raktárak közötti mozgás nyomon követése
- ✅ Audit compliance

---

### ❌ MIT NEM OLD MEG az Inventory Modul?

#### 1. Intra-Warehouse Multi-Location (Polcok Közötti, Pörgős Készlet)

**Fit-Gap követelmény #1:**
> "Egy cikket nem lehetett több tárhelyen kezelni... mindig a kisebbtől kezdjen el kiadni... pörgő raktárkészlet."

**Inventory modul jelenlegi megoldása:**

```sql
-- JELENLEGI ADATMODELL (KORLÁTOZÁS):
INSERT INTO cikk (warehouse_id, location_code, mennyiseg)
VALUES ('BP-01', 'A12-03-05', 20);

-- Ha ugyanaz a cikk más polcon is van:
-- NINCS MEGOLDÁS → Új rekord kellene, de akkor 2 külön cikk lesz
```

**Probléma:**
- Ugyanaz a cikk (pl. "M10 csavar") **nem lehet** több helyen ugyanabban a raktárban
- Nincs "pörgős készlet" logika (melyik helyről adjunk ki először)

**Példa üzleti eset:**

| Raktár | Polc | Mennyiség | Kiadási Prioritás (ideális) |
|--------|------|-----------|------------------------------|
| BP-01  | A1-01-01 | 5 db | **1 (pörgős, közel)** |
| BP-01  | B2-03-05 | 50 db | 2 (tartalék, távol) |
| SZ-01  | C1-01-01 | 30 db | 3 (másik raktár) |

**Jelenlegi Inventory modul:**
- ❌ Nem tudja kezelni ugyanazon cikk többszörös lokációját egy raktáron belül
- ❌ Nincs `kiadasi_prioritas` mező
- ❌ Nincs "kiadási javaslat" algoritmus

---

#### 2. Dinamikus Készletallokáció

**Fit-Gap követelmény #1:**
> "Optimalizálni a raktári bejárási útvonalat... támogatni a folyamatos feltöltés stratégiát."

**Jelenlegi hiányosság:**

Példa: Rendelés 8 db-ra, és van:
- A1 polc: 3 db
- B2 polc: 10 db

**Ideális rendszer:**
- Automatikusan javasolja: "3 db A1-ről + 5 db B2-ről"
- Optimalizálja a kiadási sorrendet (legközelebbi polc first)

**Inventory modul:**
- ❌ Nincs ilyen logika
- ❌ Egy location_code / cikk → nincs split allokáció

---

## 🔄 Inventory Modul Kiegészítési Javaslat

### Megoldás: Inventory Modul Bővítése (v2.0)

Az Inventory modul **megtartható** alapként, de új funkcionalitás szükséges:

#### 1. ÚJ TÁBLA: `cikk_location` (Bin-level Multi-location)

```sql
CREATE TABLE kgc.cikk_location (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  cikk_base_id UUID NOT NULL,  -- FK → cikk(id) (master record)
  warehouse_id UUID NOT NULL REFERENCES kgc.warehouse(id),
  location_code TEXT NOT NULL,  -- A12-03-05

  mennyiseg INTEGER NOT NULL DEFAULT 0,
  kiadasi_prioritas INTEGER DEFAULT 99,  -- 1 = legmagasabb prioritás

  utolso_frissites TIMESTAMP DEFAULT NOW(),

  CONSTRAINT unique_location UNIQUE(cikk_base_id, warehouse_id, location_code),
  CONSTRAINT check_quantity CHECK (mennyiseg >= 0)
);

CREATE INDEX idx_cikk_location_base ON cikk_location(cikk_base_id);
CREATE INDEX idx_cikk_location_warehouse ON cikk_location(warehouse_id);
CREATE INDEX idx_cikk_location_priority ON cikk_location(kiadasi_prioritas);
```

#### 2. MÓDOSÍTOTT: `cikk` Tábla (Master Record)

```sql
-- A cikk tábla lesz a "master" rekord (összesített készlet)
ALTER TABLE kgc.cikk
  ADD COLUMN mennyiseg_osszesitett INTEGER GENERATED ALWAYS AS (
    SELECT SUM(mennyiseg) FROM cikk_location WHERE cikk_base_id = cikk.id
  ) STORED;

-- location_code → DEPRECATED (kompatibilitás miatt megmarad, de nem használjuk)
```

#### 3. ÚJ FUNKCIÓ: Kiadási Javaslat Algoritmus

```typescript
// InventoryService új metódus
async suggestPickingLocations(
  cikkId: string,
  requestedQty: number,
  warehouseId: string
): Promise<PickingSuggestion[]> {

  // Lekérdezés: összes lokáció növekvő prioritás szerint
  const locations = await this.cikkLocationRepo.find({
    where: {
      cikk_base_id: cikkId,
      warehouse_id: warehouseId,
      mennyiseg: MoreThan(0)  // Csak ahol van készlet
    },
    order: { kiadasi_prioritas: 'ASC', mennyiseg: 'ASC' }  // Prioritás, majd kisebb készlet először
  });

  const suggestions: PickingSuggestion[] = [];
  let remaining = requestedQty;

  for (const loc of locations) {
    if (remaining <= 0) break;

    const pickQty = Math.min(loc.mennyiseg, remaining);
    suggestions.push({
      location_code: loc.location_code,
      quantity: pickQty,
      priority: loc.kiadasi_prioritas
    });

    remaining -= pickQty;
  }

  if (remaining > 0) {
    throw new InsufficientStockException(
      `Insufficient stock. Available: ${requestedQty - remaining}, Requested: ${requestedQty}`
    );
  }

  return suggestions;
}
```

---

## 📋 Frissített Fit-Gap Státusz

### Követelmény #1: Multi-location Raktárkezelés

| Aspektus | Inventory Modul (Jelenlegi) | Inventory v2.0 (Javasolt Bővítés) | Fit-Gap Follow-up Státusz |
|----------|----------------------------|-------------------------------------|---------------------------|
| **Multi-warehouse** | ✅ MEGVAN | ✅ MEGVAN | ✅ TELJES FEDÉS |
| **Shelf-Row-Column** | ✅ MEGVAN (1 location/cikk) | ✅ BŐVÍTVE (multi-location) | 🟡 KIEGÉSZÍTÉS SZÜKSÉGES |
| **Intra-warehouse multi-bin** | ❌ NINCS | ✅ cikk_location tábla | 🔴 GAP (v2.0-ban MEGOLDVA) |
| **Kiadási prioritás** | ❌ NINCS | ✅ kiadasi_prioritas mező | 🔴 GAP (v2.0-ban MEGOLDVA) |
| **Kiadási javaslat algoritmus** | ❌ NINCS | ✅ suggestPickingLocations() | 🔴 GAP (v2.0-ban MEGOLDVA) |
| **Pörgős készlet stratégia** | ❌ NINCS | ✅ Prioritás alapú picking | 🔴 GAP (v2.0-ban MEGOLDVA) |

---

## 🚀 Implementációs Stratégia

### Opció A: Inventory v2.0 Inkrementális Bővítés ⭐ AJÁNLOTT

**Előnyök:**
- ✅ Meglévő Inventory modul építkezik tovább (nem új modul)
- ✅ Kompatibilitás megőrzése (cikk tábla megmarad master record)
- ✅ Fokozatos migráció lehetséges

**Lépések:**
1. **Fázis 1 (Hét 1):** `cikk_location` tábla létrehozása
2. **Fázis 2 (Hét 2):** Kiadási algoritmus implementálása
3. **Fázis 3 (Hét 3):** UI/UX: Picking suggestion screen
4. **Fázis 4 (Hét 4):** Meglévő készlet migráció `cikk` → `cikk_location`

**Költség becsült:** +3-4 hét fejlesztés (Inventory modul v1.0: 3 hét, v2.0 bővítés: +4 hét)

---

### Opció B: Fit-Gap Követelmény Külön Implementálása

**Hátrányok:**
- ❌ Duplikált logika (Inventory modul + új készletkezelés)
- ❌ Maintenance overhead (2 rendszer)

**Nem ajánlott.**

---

## 🎯 Javasolt Döntés

### 📌 Inventory v2.0 = Fit-Gap #1 Megoldás

**Ajánlás:**
1. ✅ Az Inventory CORE modult **bővítsük** (ne írjuk felül)
2. ✅ Új funkciók: `cikk_location` tábla + picking algoritmus
3. ✅ Meglévő warehouse/transfer funkciók **megtartása**
4. ✅ Fit-Gap #1 követelmény **teljes mértékben megoldva** Inventory v2.0-val

**Frissített Roadmap:**

```
Sprint 1-2: Inventory v2.0 (Multi-bin, Pörgős Készlet) - 4 hét
  ├─ Hét 1: cikk_location tábla + adatmodell
  ├─ Hét 2: Kiadási javaslat algoritmus
  ├─ Hét 3: UI/UX (picking suggestions)
  └─ Hét 4: Migráció + tesztelés

Sprint 3-4: Fit-Gap #2-4 (Kaució, Munkalap, stb.) - 4 hét
```

---

## 📄 Következtetés

### Inventory Modul Helye a Fit-Gap Megoldásban

| Követelmény | Megoldás | Státusz |
|-------------|----------|---------|
| **#1 Multi-location raktárkezelés** | **Inventory v2.0 bővítés** | 🟡 INVENTORY CORE kiegészítéssel MEGOLDHATÓ |
| #2 Kaució visszatartás | Bérlés modul módosítás | ✅ FÜGGETLEN (nincs Inventory kapcsolat) |
| #3 Automatikus banki elszámolás | Pénzügy modul új API | ✅ FÜGGETLEN |
| #4 Munkalap-Bérlés kapcsolat | Szerviz/Bérlés FK | ✅ FÜGGETLEN |

### Végső Javaslat

Az **Inventory CORE modul** részleges megoldást ad, de teljes Fit-Gap lefedéshez **v2.0 bővítés szükséges**. Ez nem ellentmond a Fit-Gap analízisnek, hanem **finomítja** azt:

- Fit-Gap #1 megoldása = **Inventory v2.0**
- Új entitás: `cikk_location` (bin-level multi-location)
- Új funkció: Picking suggestion (pörgős készlet)

**A többi Fit-Gap követelmény (2-10) független az Inventory modultól.**

---

**🤖 Dokumentum vége**

_Generated by BMAD Analyst Team (Winston 🏗️ Architect)_
