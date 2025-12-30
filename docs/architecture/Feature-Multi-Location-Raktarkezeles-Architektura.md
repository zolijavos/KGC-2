# Feature Architektúra: Multi-Location Raktárkezelés (Inventory v2.0)

**Feature ID:** FIT-GAP-001
**Prioritás:** 🔴 KRITIKUS
**Komplexitás:** 🔴 MAGAS (13-21 SP)
**Típus:** ❌ MAJOR GAP - Teljes funkció hiányzik
**Verzió:** 2.0
**Dátum:** 2025-12-29
**Architect:** Winston 🏗️

---

## 📋 Executive Summary

A jelenlegi KGC ERP rendszerben egy cikk **csak egyetlen tárolóhelyen** (`cikk.location_code`) kezelhető. Ez lehetetlenné teszi a **pörgős készlet stratégiát**, ahol ugyanaz a cikk több helyen is van (pl. pörgős polc + tartalék polc), és automatikusan a kisebb készletből kell először kiadni a tőkelekötés minimalizálása érdekében.

**Üzleti probléma:**
> "Egy cikket nem lehetett több tárhelyen kezelni... mindig a kisebbről kezdjen el kiadni... pörgő raktárkészlet."

**Megoldás:** **Inventory v2.0** - Új `cikk_location` tábla bevezetése, ami lehetővé teszi ugyanazon cikk többszörös lokációban történő tárolását **kiadási prioritással** és **automatikus picking javaslattal**.

### Üzleti Érték
- ✅ **Tőkelekötés csökkentése:** Kisebb mennyiségű "pörgős" polcok használata (30-40% csökkenés)
- ✅ **Raktári útvonal optimalizálás:** Legközelebbi/leggyorsabb polc automatikus javaslata
- ✅ **Folyamatos feltöltés támogatása:** Tartalék polcok + aktív polcok kezelése
- ✅ **Audit trail:** Lokáció szintű készletmozgás nyomon követése

### Technikai Hatás
- **Új entitás:** `cikk_location` (bin-level multi-location)
- **Módosított entitás:** `cikk` (master record, összesített készlet)
- **Új service:** Kiadási javaslat algoritmus (picking suggestion engine)
- **UI módosítások:** Bevételezés (tárhely választó), Kiadás (picking lista)
- **Breaking change:** ❌ Nincs - backward compatible (migration script biztosítva)

---

## 🎯 Követelmény Részletezés

### Forrás
**Fit-Gap Analízis:** `/docs/KGC-ERP-v3-Fit-Gap-Analízis-2025-12-29.md` - Követelmény #1
**Inventory Összehasonlítás:** `/docs/Inventory-Modul-vs-Fit-Gap-Követelmények.md`
**Transcript:** `KGC-notes-2025-12-16-01.md`, sor 32-55

### Idézet (üzleti igény)
> "Nem tudom hogy ebben benne van és ez ki van küszöbölni de valahogy hogy a cikkeket nem lehetett tár helyenként kezelni... egy cikket nem lehetett több tárhelyen kezelni... mindig a kisebbtől kezdjen el kiadni... pörgő raktárkészletet."

### Jelenlegi Probléma

**Példa üzleti eset:**

| Cikk | Raktár | Polc | Mennyiség | Kívánt Logika |
|------|--------|------|-----------|---------------|
| M10 csavar | BP-01 | A1-01-01 | 5 db | **1. prioritás** (pörgős, közel) |
| M10 csavar | BP-01 | B2-03-05 | 50 db | 2. prioritás (tartalék, távol) |
| M10 csavar | SZ-01 | C1-01-01 | 30 db | 3. prioritás (másik raktár) |

**Jelenleg:**
- A rendszer **nem tudja** ugyanazt a M10 csavart 3 különböző helyen kezelni
- Egy `cikk` rekord = egy `location_code`
- Kiadásnál nincs automatikus "melyik polcról" javaslat

**Inventory v2.0 megoldás:**
- M10 csavar = 1 `cikk` master rekord (összesen 85 db)
- 3 db `cikk_location` rekord (A1: 5 db, B2: 50 db, C1: 30 db)
- Kiadási javaslat: "Kérnek 8 db-ot → Javaslat: 5 db A1-ről + 3 db B2-ről"

---

## 🏗️ Technikai Megoldás

### 1. Adatmodell Módosítások

#### 1.1 ÚJ TÁBLA: `cikk_location` (Bin-Level Multi-Location)

```sql
-- PostgreSQL migration script
CREATE TABLE kgc.cikk_location (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Foreign Keys
  cikk_base_id UUID NOT NULL REFERENCES kgc.cikk(id) ON DELETE CASCADE,
  warehouse_id UUID NOT NULL REFERENCES kgc.warehouse(id) ON DELETE RESTRICT,

  -- Location & Quantity
  location_code TEXT NOT NULL,  -- A12-03-05 (Shelf-Row-Column)
  mennyiseg INTEGER NOT NULL DEFAULT 0,

  -- Picking Strategy
  kiadasi_prioritas INTEGER DEFAULT 99,  -- 1 = highest priority (pörgős)
  prioritas_tipus VARCHAR(20) DEFAULT 'manual'
    CHECK (prioritas_tipus IN ('manual', 'spatial', 'fifo', 'lifo', 'pörgős')),

  -- Metadata
  utolso_frissites TIMESTAMP DEFAULT NOW(),
  letrehozva TIMESTAMP DEFAULT NOW(),
  megjegyzes TEXT,

  -- Constraints
  CONSTRAINT unique_location UNIQUE(cikk_base_id, warehouse_id, location_code),
  CONSTRAINT check_quantity CHECK (mennyiseg >= 0),
  CONSTRAINT check_priority CHECK (kiadasi_prioritas BETWEEN 1 AND 999)
);

-- Indexes for Performance
CREATE INDEX idx_cikk_location_base ON kgc.cikk_location(cikk_base_id);
CREATE INDEX idx_cikk_location_warehouse ON kgc.cikk_location(warehouse_id);
CREATE INDEX idx_cikk_location_priority ON kgc.cikk_location(kiadasi_prioritas);
CREATE INDEX idx_cikk_location_qty ON kgc.cikk_location(mennyiseg) WHERE mennyiseg > 0;

-- Comments (dokumentáció)
COMMENT ON TABLE kgc.cikk_location IS 'Bin-level inventory tracking - multiple locations per item';
COMMENT ON COLUMN kgc.cikk_location.kiadasi_prioritas IS 'Picking priority: 1=highest (pörgős), 999=lowest (reserve)';
COMMENT ON COLUMN kgc.cikk_location.prioritas_tipus IS 'Priority calculation strategy: manual, spatial, fifo, lifo, pörgős';
```

**Példa adatok:**

```sql
-- M10 csavar - 3 lokáció
INSERT INTO kgc.cikk_location (cikk_base_id, warehouse_id, location_code, mennyiseg, kiadasi_prioritas, prioritas_tipus) VALUES
  ('cikk-m10-uuid', 'BP-01-uuid', 'A1-01-01', 5, 1, 'pörgős'),       -- Pörgős polc
  ('cikk-m10-uuid', 'BP-01-uuid', 'B2-03-05', 50, 10, 'manual'),     -- Tartalék polc
  ('cikk-m10-uuid', 'SZ-01-uuid', 'C1-01-01', 30, 20, 'manual');     -- Másik raktár
```

---

#### 1.2 MÓDOSÍTOTT TÁBLA: `cikk` (Master Record)

```sql
-- Backward compatible bővítés
ALTER TABLE kgc.cikk
  -- Összesített készlet (computed column)
  ADD COLUMN mennyiseg_osszesitett INTEGER GENERATED ALWAYS AS (
    COALESCE((SELECT SUM(mennyiseg) FROM kgc.cikk_location WHERE cikk_base_id = cikk.id), mennyiseg)
  ) STORED,

  -- Multi-location flag
  ADD COLUMN multi_location_enabled BOOLEAN DEFAULT FALSE,

  -- Deprecation notice
  ADD COLUMN location_code_deprecated BOOLEAN DEFAULT FALSE;

-- Comment az átálláshoz
COMMENT ON COLUMN kgc.cikk.mennyiseg_osszesitett IS 'Aggregated stock from all locations (cikk_location.mennyiseg SUM)';
COMMENT ON COLUMN kgc.cikk.multi_location_enabled IS 'If TRUE, use cikk_location table; if FALSE, use legacy cikk.mennyiseg';
COMMENT ON COLUMN kgk.cikk.location_code_deprecated IS 'If TRUE, location_code field is deprecated, use cikk_location instead';

-- Migration helper view
CREATE OR REPLACE VIEW kgc.v_cikk_stock AS
SELECT
  c.id AS cikk_id,
  c.nev AS cikk_nev,
  c.cikkszam,
  c.warehouse_id AS default_warehouse_id,
  CASE
    WHEN c.multi_location_enabled THEN c.mennyiseg_osszesitett
    ELSE c.mennyiseg
  END AS aktualis_keszlet,
  c.multi_location_enabled,
  COUNT(cl.id) AS location_count
FROM kgc.cikk c
  LEFT JOIN kgc.cikk_location cl ON cl.cikk_base_id = c.id
GROUP BY c.id;
```

---

#### 1.3 MÓDOSÍTOTT TÁBLA: `inventory_movement` (Audit Trail)

```sql
-- Lokáció szintű audit trail
ALTER TABLE kgc.inventory_movement
  ADD COLUMN from_location_id UUID REFERENCES kgc.cikk_location(id),
  ADD COLUMN to_location_id UUID REFERENCES kgc.cikk_location(id),

  -- Fallback ha még nincs cikk_location (migration alatt)
  ADD COLUMN from_location_code TEXT,
  ADD COLUMN to_location_code TEXT;

-- Index a gyors lekérdezéshez
CREATE INDEX idx_inv_movement_from_loc ON kgc.inventory_movement(from_location_id) WHERE from_location_id IS NOT NULL;
CREATE INDEX idx_inv_movement_to_loc ON kgk.inventory_movement(to_location_id) WHERE to_location_id IS NOT NULL;

COMMENT ON COLUMN kgc.inventory_movement.from_location_id IS 'Source bin location (NULL if warehouse-level transfer)';
COMMENT ON COLUMN kgc.inventory_movement.to_location_id IS 'Destination bin location';
```

---

### 2. Kiadási Javaslat Algoritmus (Picking Suggestion Engine)

#### 2.1 Service Layer - TypeScript

```typescript
// services/InventoryService.ts

interface PickingSuggestion {
  location_id: string;
  location_code: string;
  warehouse_id: string;
  warehouse_name: string;
  quantity: number;           // Javasolt kiadási mennyiség
  available_stock: number;    // Elérhető készlet ezen a helyen
  priority: number;           // Kiadási prioritás
  priority_type: string;      // manual, spatial, pörgős, stb.
}

interface PickingRequest {
  cikkId: string;
  requestedQty: number;
  preferredWarehouseId?: string;  // Opcionális: preferált raktár
  allowMultiWarehouse?: boolean;  // Engedélyezett-e több raktárból kiadni?
}

async function suggestPickingLocations(
  request: PickingRequest
): Promise<PickingSuggestion[]> {

  const { cikkId, requestedQty, preferredWarehouseId, allowMultiWarehouse = true } = request;

  // 1. Cikk ellenőrzés és multi-location státusz
  const cikk = await this.cikkRepo.findById(cikkId);
  if (!cikk) {
    throw new NotFoundError(`Cikk nem található: ${cikkId}`);
  }

  if (!cikk.multi_location_enabled) {
    // Legacy mode: egyetlen lokáció
    return this.getLegacyPickingSuggestion(cikk, requestedQty);
  }

  // 2. Lekérdezés: elérhető lokációk prioritás szerint
  const queryBuilder = this.cikkLocationRepo
    .createQueryBuilder('cl')
    .leftJoinAndSelect('cl.warehouse', 'w')
    .where('cl.cikk_base_id = :cikkId', { cikkId })
    .andWhere('cl.mennyiseg > 0')  // Csak ahol van készlet
    .orderBy('cl.kiadasi_prioritas', 'ASC')   // Prioritás szerint növekvő
    .addOrderBy('cl.mennyiseg', 'ASC');       // Kisebb mennyiség először (pörgős)

  // Preferált raktár szűrés
  if (preferredWarehouseId) {
    if (allowMultiWarehouse) {
      // Preferált raktár first, majd mások
      queryBuilder.addOrderBy(
        `CASE WHEN cl.warehouse_id = '${preferredWarehouseId}' THEN 0 ELSE 1 END`,
        'ASC'
      );
    } else {
      // CSAK preferált raktár
      queryBuilder.andWhere('cl.warehouse_id = :warehouseId', { warehouseId: preferredWarehouseId });
    }
  }

  const locations = await queryBuilder.getMany();

  if (locations.length === 0) {
    throw new InsufficientStockException(
      `Nincs elérhető készlet a cikkhez: ${cikk.nev} (${cikk.cikkszam})`
    );
  }

  // 3. Picking javaslat generálás (greedy algoritmus)
  const suggestions: PickingSuggestion[] = [];
  let remaining = requestedQty;

  for (const loc of locations) {
    if (remaining <= 0) break;

    const pickQty = Math.min(loc.mennyiseg, remaining);

    suggestions.push({
      location_id: loc.id,
      location_code: loc.location_code,
      warehouse_id: loc.warehouse_id,
      warehouse_name: loc.warehouse.name,
      quantity: pickQty,
      available_stock: loc.mennyiseg,
      priority: loc.kiadasi_prioritas,
      priority_type: loc.prioritas_tipus
    });

    remaining -= pickQty;
  }

  // 4. Validáció: elég készlet van-e?
  if (remaining > 0) {
    const totalAvailable = suggestions.reduce((sum, s) => sum + s.quantity, 0);
    throw new InsufficientStockException(
      `Elégtelen készlet. Elérhető: ${totalAvailable} db, Kért: ${requestedQty} db`,
      {
        cikkId,
        requested: requestedQty,
        available: totalAvailable,
        shortfall: remaining
      }
    );
  }

  return suggestions;
}

// Legacy támogatás (backward compatibility)
async function getLegacyPickingSuggestion(
  cikk: Cikk,
  requestedQty: number
): Promise<PickingSuggestion[]> {

  if (cikk.mennyiseg < requestedQty) {
    throw new InsufficientStockException(
      `Elégtelen készlet. Elérhető: ${cikk.mennyiseg} db, Kért: ${requestedQty} db`
    );
  }

  return [{
    location_id: null,
    location_code: cikk.location_code || 'UNKNOWN',
    warehouse_id: cikk.warehouse_id,
    warehouse_name: cikk.warehouse?.name || 'Alapértelmezett',
    quantity: requestedQty,
    available_stock: cikk.mennyiseg,
    priority: 1,
    priority_type: 'legacy'
  }];
}
```

---

#### 2.2 Készletcsökkentés Multi-Location Módon

```typescript
// services/InventoryService.ts

async function decreaseStock(
  cikkId: string,
  quantity: number,
  warehouseId: string,
  movementType: string = 'kiadva_berles',
  options?: {
    pickingSuggestions?: PickingSuggestion[];  // Előre generált javaslat
    allowOverride?: boolean;
    userId: string;
  }
): Promise<InventoryMovement[]> {

  const cikk = await this.cikkRepo.findById(cikkId);

  // Multi-location mode
  if (cikk.multi_location_enabled) {

    // 1. Picking javaslat (ha nincs megadva, generálunk)
    const suggestions = options?.pickingSuggestions ||
      await this.suggestPickingLocations({
        cikkId,
        requestedQty: quantity,
        preferredWarehouseId: warehouseId
      });

    // 2. Tranzakció indítása
    return await this.entityManager.transaction(async transactionalEM => {

      const movements: InventoryMovement[] = [];

      for (const suggestion of suggestions) {

        // Lokáció lekérése és lock (race condition védelem)
        const location = await transactionalEM
          .getRepository(CikkLocation)
          .findOne({
            where: { id: suggestion.location_id },
            lock: { mode: 'pessimistic_write' }  // Row-level lock
          });

        if (!location) {
          throw new Error(`Location not found: ${suggestion.location_id}`);
        }

        if (location.mennyiseg < suggestion.quantity) {
          throw new ConcurrencyException(
            `Készlet megváltozott! Elérhető: ${location.mennyiseg}, Kért: ${suggestion.quantity}`
          );
        }

        // Készlet csökkentése
        location.mennyiseg -= suggestion.quantity;
        location.utolso_frissites = new Date();
        await transactionalEM.save(location);

        // Audit trail bejegyzés
        const movement = transactionalEM.create(InventoryMovement, {
          cikk_id: cikkId,
          warehouse_id: location.warehouse_id,
          from_location_id: location.id,
          from_location_code: location.location_code,
          to_location_id: null,
          to_location_code: null,
          quantity: -suggestion.quantity,  // Negatív = kiadás
          movement_type: movementType,
          movement_date: new Date(),
          user_id: options?.userId
        });

        movements.push(await transactionalEM.save(movement));
      }

      return movements;
    });

  } else {
    // Legacy mode: egyetlen csökkentés
    return this.decreaseStockLegacy(cikk, quantity, movementType, options?.userId);
  }
}
```

---

### 3. Kiadási Prioritás Stratégiák

#### 3.1 Prioritás Típusok

| Stratégia | Leírás | Prioritás Számítás | Use Case |
|-----------|--------|-------------------|----------|
| **Manual** | Kézi prioritás | Admin állítja be (1-999) | Teljes kontroll, egyedi esetek |
| **Spatial (Térbeli)** | Fizikai távolság alapján | Közelebbi polc = alacsonyabb szám | Gyors kiszolgálás, raktári optimalizálás |
| **Pörgős** | Kisebb készlet először | Mennyiség alapján (kis → nagy) | Tőkelekötés minimalizálás ⭐ |
| **FIFO** | First-In-First-Out | Legrégebbi először | Lejárati idős termékek |
| **LIFO** | Last-In-First-Out | Legújabb először | Specifikus logisztika |

#### 3.2 Prioritás Kiszámítás Algoritmus

```typescript
// services/LocationPriorityService.ts

type PriorityStrategy = 'manual' | 'spatial' | 'pörgős' | 'fifo' | 'lifo';

interface PriorityCalculationContext {
  location: CikkLocation;
  warehouse: Warehouse;
  spatialMap?: Map<string, number>;  // location_code → distance_score
}

async function calculatePriority(
  strategy: PriorityStrategy,
  context: PriorityCalculationContext
): Promise<number> {

  switch (strategy) {

    case 'manual':
      // Kézi prioritás - nem változik
      return context.location.kiadasi_prioritas;

    case 'spatial':
      // Térbeli: fizikai távolság a kiadási ponttól
      const distanceScore = context.spatialMap?.get(context.location.location_code) || 999;
      return Math.round(distanceScore);  // Közelebbi = kisebb szám

    case 'pörgős':
      // Kisebb mennyiség = magasabb prioritás (alacsonyabb szám)
      // Példa: 5 db → prioritás 5, 50 db → prioritás 50
      return Math.min(context.location.mennyiseg, 999);

    case 'fifo':
      // Legrégebbi először (utolso_frissites alapján)
      const daysSinceUpdate = Math.floor(
        (Date.now() - context.location.utolso_frissites.getTime()) / (1000 * 60 * 60 * 24)
      );
      return Math.max(1, 999 - daysSinceUpdate);  // Régebbi = alacsonyabb szám

    case 'lifo':
      // Legújabb először
      const daysSinceUpdate2 = Math.floor(
        (Date.now() - context.location.utolso_frissites.getTime()) / (1000 * 60 * 60 * 24)
      );
      return Math.min(daysSinceUpdate2 + 1, 999);  // Újabb = alacsonyabb szám

    default:
      return 99;  // Default közepes prioritás
  }
}

// Batch update: újraszámolás egy cikk összes lokációjára
async function recalculateAllPriorities(
  cikkId: string,
  strategy: PriorityStrategy
): Promise<void> {

  const locations = await this.cikkLocationRepo.find({
    where: { cikk_base_id: cikkId },
    relations: ['warehouse']
  });

  // Spatial map generálás (ha spatial stratégia)
  let spatialMap: Map<string, number> | undefined;
  if (strategy === 'spatial') {
    spatialMap = await this.generateSpatialDistanceMap(locations);
  }

  // Prioritások újraszámítása
  for (const location of locations) {
    const newPriority = await this.calculatePriority(strategy, {
      location,
      warehouse: location.warehouse,
      spatialMap
    });

    location.kiadasi_prioritas = newPriority;
    location.prioritas_tipus = strategy;
  }

  await this.cikkLocationRepo.save(locations);
}
```

---

### 4. UI/UX Módosítások

#### 4.1 Bevételezési Képernyő - Tárhely Választó

**Komponens:** `src/components/Inventory/StockReceiptForm.tsx`

```tsx
// StockReceiptForm.tsx - Multi-location bevételezés

interface LocationSelectorProps {
  cikkId: string;
  warehouseId: string;
  onLocationSelected: (locationCode: string, isNew: boolean) => void;
}

function LocationSelector({ cikkId, warehouseId, onLocationSelected }: LocationSelectorProps) {
  const [existingLocations, setExistingLocations] = useState<CikkLocation[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<string>('');
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newLocationCode, setNewLocationCode] = useState('');

  useEffect(() => {
    // Meglévő lokációk betöltése
    fetchExistingLocations(cikkId, warehouseId).then(setExistingLocations);
  }, [cikkId, warehouseId]);

  const handleSelectExisting = (locationCode: string) => {
    setSelectedLocation(locationCode);
    setIsCreatingNew(false);
    onLocationSelected(locationCode, false);
  };

  const handleCreateNew = () => {
    setIsCreatingNew(true);
    setSelectedLocation('');
  };

  const handleNewLocationSubmit = () => {
    if (!newLocationCode.trim()) {
      alert('Tárhely kód megadása kötelező!');
      return;
    }

    // Validálás: formátum A12-03-05
    if (!/^[A-Z]\d{1,2}-\d{1,2}-\d{1,2}$/.test(newLocationCode)) {
      alert('Helytelen formátum! Példa: A12-03-05');
      return;
    }

    onLocationSelected(newLocationCode, true);
  };

  return (
    <Box sx={{ border: '1px solid #ddd', p: 2, borderRadius: 1 }}>
      <Typography variant="h6" gutterBottom>
        Tárolási Hely Kiválasztása
      </Typography>

      {/* Meglévő lokációk listája */}
      {existingLocations.length > 0 && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Meglévő lokációk ezen cikkhez:
          </Typography>

          <RadioGroup value={selectedLocation} onChange={(e) => handleSelectExisting(e.target.value)}>
            {existingLocations.map(loc => (
              <FormControlLabel
                key={loc.id}
                value={loc.location_code}
                control={<Radio />}
                label={
                  <Box>
                    <Typography variant="body1">
                      <strong>{loc.location_code}</strong> - Jelenlegi: {loc.mennyiseg} db
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Prioritás: {loc.kiadasi_prioritas} ({loc.prioritas_tipus})
                    </Typography>
                  </Box>
                }
              />
            ))}
          </RadioGroup>
        </Box>
      )}

      <Divider sx={{ my: 2 }} />

      {/* Új lokáció létrehozása */}
      <Box>
        <Button
          variant={isCreatingNew ? 'contained' : 'outlined'}
          startIcon={<AddLocationIcon />}
          onClick={handleCreateNew}
          fullWidth
        >
          Új Tárolási Hely Létrehozása
        </Button>

        {isCreatingNew && (
          <Box sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Tárhely Kód (pl. A12-03-05)"
              placeholder="A12-03-05"
              value={newLocationCode}
              onChange={(e) => setNewLocationCode(e.target.value.toUpperCase())}
              helperText="Formátum: SHELF-ROW-COLUMN (pl. A12-03-05)"
              sx={{ mb: 1 }}
            />

            <FormControl fullWidth sx={{ mb: 1 }}>
              <InputLabel>Prioritás Típus</InputLabel>
              <Select defaultValue="pörgős">
                <MenuItem value="pörgős">Pörgős (ajánlott)</MenuItem>
                <MenuItem value="manual">Kézi prioritás</MenuItem>
                <MenuItem value="spatial">Térbeli (távolság alapján)</MenuItem>
                <MenuItem value="fifo">FIFO (régi először)</MenuItem>
              </Select>
            </FormControl>

            <Button
              variant="contained"
              color="success"
              onClick={handleNewLocationSubmit}
              fullWidth
            >
              Új Lokáció Mentése
            </Button>
          </Box>
        )}
      </Box>
    </Box>
  );
}
```

---

#### 4.2 Kiadási Képernyő - Picking Javaslat

**Komponens:** `src/components/Inventory/PickingSuggestionPanel.tsx`

```tsx
// PickingSuggestionPanel.tsx - Automatikus picking javaslat megjelenítése

interface PickingSuggestionPanelProps {
  cikkId: string;
  requestedQty: number;
  warehouseId: string;
  onConfirm: (suggestions: PickingSuggestion[]) => void;
  onOverride: () => void;
}

function PickingSuggestionPanel({
  cikkId,
  requestedQty,
  warehouseId,
  onConfirm,
  onOverride
}: PickingSuggestionPanelProps) {

  const [suggestions, setSuggestions] = useState<PickingSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPickingSuggestions();
  }, [cikkId, requestedQty, warehouseId]);

  const loadPickingSuggestions = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await inventoryApi.suggestPickingLocations({
        cikkId,
        requestedQty,
        preferredWarehouseId: warehouseId
      });

      setSuggestions(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <CircularProgress />;
  }

  if (error) {
    return (
      <Alert severity="error">
        <AlertTitle>Hiba a picking javaslat generálásakor</AlertTitle>
        {error}
      </Alert>
    );
  }

  return (
    <Paper sx={{ p: 2, bgcolor: '#f5f5f5' }}>
      <Typography variant="h6" gutterBottom>
        📦 Javasolt Kiadási Helyek ({requestedQty} db)
      </Typography>

      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Prioritás</TableCell>
              <TableCell>Tárhely</TableCell>
              <TableCell>Raktár</TableCell>
              <TableCell align="right">Javasolt Mennyiség</TableCell>
              <TableCell align="right">Elérhető</TableCell>
              <TableCell>Típus</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {suggestions.map((sug, index) => (
              <TableRow key={sug.location_id} sx={{ bgcolor: index === 0 ? '#e8f5e9' : 'inherit' }}>
                <TableCell>
                  <Chip
                    label={sug.priority}
                    size="small"
                    color={sug.priority <= 5 ? 'success' : 'default'}
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="body2" fontWeight="bold">
                    {sug.location_code}
                  </Typography>
                </TableCell>
                <TableCell>{sug.warehouse_name}</TableCell>
                <TableCell align="right">
                  <Typography variant="body1" fontWeight="bold" color="primary">
                    {sug.quantity} db
                  </Typography>
                </TableCell>
                <TableCell align="right">{sug.available_stock} db</TableCell>
                <TableCell>
                  <Chip label={sug.priority_type} size="small" variant="outlined" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
        <Button
          variant="contained"
          color="success"
          startIcon={<CheckIcon />}
          onClick={() => onConfirm(suggestions)}
          fullWidth
        >
          Javaslat Elfogadása
        </Button>

        <Button
          variant="outlined"
          color="warning"
          startIcon={<EditIcon />}
          onClick={onOverride}
        >
          Manuális Felülbírálás
        </Button>
      </Box>

      {suggestions.length > 1 && (
        <Alert severity="info" sx={{ mt: 2 }}>
          💡 A javaslat több lokációból történő kiadást tartalmaz (split picking).
          Kérem, győződjön meg arról, hogy mindkét helyről történik a tényleges kivét!
        </Alert>
      )}
    </Paper>
  );
}
```

---

### 5. Folyamat Módosítások

#### 5.1 Bevételezési Folyamat (02-ertekesites-folyamat.md - 3. FÁZIS)

**Módosított lépések:**

```yaml
3.1 Áru Beérkezés:
  - Szállítólevél átvétele
  - Fizikai ellenőrzés

3.2 Bevételezés Indítása:
  - Új bevételezés rögzítése
  - Szállító kiválasztása

3.3 Tételek Hozzáadása:
  - Cikk kiválasztása (vonalkód/kereső)

  ÚJ LÉPÉS 3.3a: Tárolási Hely Megadása
    [DÖNTÉSI PONT]

    IF cikk.multi_location_enabled = TRUE:
      ├─ Meglévő lokációk listázása (jelenlegi készlettel)
      ├─ Választási opciók:
      │   ├─ [1] Meglévő lokációhoz hozzáadás (dropdown)
      │   └─ [2] Új lokáció létrehozása (input: A12-03-05)
      │
      └─ Lokáció kiválasztás/létrehozás
          ├─ location_code (kötelező)
          ├─ kiadasi_prioritas (opcionális, default: 99)
          └─ prioritas_tipus (pörgős/manual/spatial/fifo)

    ELSE (legacy mode):
      └─ location_code egyszerű input (régi működés megmarad)

  - Mennyiség megadása
  - Egységár

3.4 Bevételezés Véglegesítése:
  IF multi_location:
    → INSERT INTO cikk_location (mennyiseg frissítés)
    → INSERT INTO inventory_movement (audit trail lokációval)
  ELSE:
    → UPDATE cikk SET mennyiseg = mennyiseg + [qty]
    → INSERT INTO inventory_movement (legacy audit)
```

---

#### 5.2 Kiadási Folyamat (01-ugyfelfelvitel-folyamat.md - 1. FÁZIS Bérlés)

**Módosított lépések:**

```yaml
1.6 Gép Kiválasztása:
  - Cikk keresése (vonalkód/név)
  - Ellenőrzés: van-e elegendő készlet?

  ÚJ LÉPÉS 1.6a: Picking Javaslat Generálás
    [AUTOMATIKUS FOLYAMAT]

    IF cikk.multi_location_enabled = TRUE:

      Backend hívás:
        inventoryApi.suggestPickingLocations({
          cikkId: [selected cikk],
          requestedQty: [rental qty],
          preferredWarehouseId: [current warehouse]
        })

      → Picking javaslat lista megjelenítése:
        ┌──────────────────────────────────────────────┐
        │ 📦 Javasolt Kiadási Helyek (8 db)            │
        ├────┬───────────┬─────────┬─────────┬────────┤
        │ Pri│ Tárhely   │ Raktár  │ Mennyiség│ Típus │
        ├────┼───────────┼─────────┼─────────┼────────┤
        │  1 │ A1-01-01  │ BP-01   │  5 db   │ pörgős│
        │ 10 │ B2-03-05  │ BP-01   │  3 db   │ manual│
        └────┴───────────┴─────────┴─────────┴────────┘

  ÚJ LÉPÉS 1.6b: Picking Megerősítés
    [DÖNTÉSI PONT]

    Kezelő választása:
      ├─ [ELFOGAD] → Javaslat szerint kiad (split picking)
      │              → Backend: decreaseStock(suggestions)
      │              → Mindegyik lokációból -qty
      │
      └─ [FELÜLBÍRÁL] → Manuális lokáció választás
                      → Kezelő kiválasztja konkrét lokációt
                      → Audit log: override reason (kötelező)

1.7 Bérlés Rögzítése:
  - Normál bérlési adatok
  - Inventory mozgás automatikusan rögzítve (multi-location aware)
```

---

### 6. Adatmigráció és Backward Compatibility

#### 6.1 Migráció Script (PostgreSQL)

```sql
-- ===================================================================
-- INVENTORY V2.0 MIGRATION SCRIPT
-- Meglévő készlet áttelepítése cikk_location táblába
-- ===================================================================

BEGIN;

-- STEP 1: Tábla és indexek létrehozása (már megvan fent)
-- ... (cikk_location, indexes, constraints)

-- STEP 2: Meglévő készlet átmigrálása
-- Minden meglévő cikk rekordból egy cikk_location rekord lesz

INSERT INTO kgc.cikk_location (
  cikk_base_id,
  warehouse_id,
  location_code,
  mennyiseg,
  kiadasi_prioritas,
  prioritas_tipus,
  utolso_frissites
)
SELECT
  c.id AS cikk_base_id,
  c.warehouse_id,
  COALESCE(c.location_code, 'MIGRATED-DEFAULT') AS location_code,
  c.mennyiseg,
  50 AS kiadasi_prioritas,  -- Középső prioritás
  'manual' AS prioritas_tipus,
  NOW() AS utolso_frissites
FROM kgc.cikk c
WHERE c.mennyiseg > 0  -- Csak ahol van készlet
  AND NOT EXISTS (
    -- Elkerüljük a duplikációt, ha már van cikk_location rekord
    SELECT 1 FROM kgc.cikk_location cl
    WHERE cl.cikk_base_id = c.id
  );

-- STEP 3: Multi-location flag aktiválás (fokozatos, csak ahol kell)
-- Egyelőre NEM aktiváljuk automatikusan, manuális átállás kell

UPDATE kgc.cikk
SET
  multi_location_enabled = FALSE,  -- Explicit false, opt-in model
  location_code_deprecated = FALSE
WHERE TRUE;

-- STEP 4: Validáció
DO $$
DECLARE
  legacy_count INT;
  migrated_count INT;
BEGIN
  SELECT COUNT(*) INTO legacy_count FROM kgc.cikk WHERE mennyiseg > 0;
  SELECT COUNT(DISTINCT cikk_base_id) INTO migrated_count FROM kgc.cikk_location;

  RAISE NOTICE 'Validáció:';
  RAISE NOTICE '  Legacy cikk rekordok (mennyiseg > 0): %', legacy_count;
  RAISE NOTICE '  Migrált cikk_location rekordok (unique cikk): %', migrated_count;

  IF migrated_count < legacy_count THEN
    RAISE WARNING 'Nem minden cikk lett átmigrálva! Ellenőrzés szükséges.';
  ELSE
    RAISE NOTICE '✓ Migráció sikeres!';
  END IF;
END $$;

COMMIT;

-- ===================================================================
-- POST-MIGRATION: FOKOZATOS ÁT ÁLLÍTÁS
-- Cikkenként lehet multi-location-re átállítani
-- ===================================================================

-- Példa: Egy adott cikk átállítása multi-location-re
UPDATE kgc.cikk
SET multi_location_enabled = TRUE
WHERE cikkszam = 'M10-CSAVAR';  -- Konkrét cikk

-- Példa: Összes cikk átállítása (ÓVATOSAN!)
-- UPDATE kgc.cikk SET multi_location_enabled = TRUE WHERE TRUE;
```

#### 6.2 Backward Compatibility Stratégia

**3 Üzemmód:**

| Mód | Leírás | `cikk.multi_location_enabled` | Működés |
|-----|--------|-------------------------------|---------|
| **Legacy** | Régi rendszer (1 location/cikk) | `FALSE` | `cikk.mennyiseg` és `cikk.location_code` használatos |
| **Hybrid** | Átállás alatt (vegyes) | `FALSE` (default) / `TRUE` (opt-in) | Cikkenként különböző |
| **Multi-Location** | Teljes Inventory v2.0 | `TRUE` | `cikk_location` tábla használatos |

**API Backward Compatibility:**

```typescript
// API endpoint: POST /api/inventory/decrease-stock

// RÉGI (deprecated, de támogatott)
POST /api/inventory/decrease-stock
{
  "cikkId": "uuid",
  "quantity": 10,
  "warehouseId": "warehouse-uuid"
  // locationCode: nincs megadva → automatikus picking
}

// ÚJ (ajánlott, explicit picking)
POST /api/inventory/decrease-stock
{
  "cikkId": "uuid",
  "quantity": 10,
  "warehouseId": "warehouse-uuid",
  "pickingSuggestions": [  // ÚJ
    { "location_id": "loc-1", "quantity": 5 },
    { "location_id": "loc-2", "quantity": 5 }
  ]
}
```

---

### 7. Tesztelési Stratégia

#### 7.1 Unit Tesztek

```typescript
// tests/services/InventoryService.test.ts

describe('InventoryService - Multi-Location', () => {

  describe('suggestPickingLocations', () => {

    it('should suggest single location when enough stock available', async () => {
      // Setup: M10 csavar, A1 polc: 50 db, prioritás: 1
      await createTestLocation({
        cikk_id: 'cikk-m10',
        location_code: 'A1-01-01',
        mennyiseg: 50,
        kiadasi_prioritas: 1
      });

      const suggestions = await service.suggestPickingLocations({
        cikkId: 'cikk-m10',
        requestedQty: 10,
        preferredWarehouseId: 'BP-01'
      });

      expect(suggestions).toHaveLength(1);
      expect(suggestions[0].location_code).toBe('A1-01-01');
      expect(suggestions[0].quantity).toBe(10);
    });

    it('should suggest split picking from multiple locations', async () => {
      // Setup: M10 csavar, A1: 5 db (pri 1), B2: 50 db (pri 10)
      await createTestLocation({ location_code: 'A1-01-01', mennyiseg: 5, kiadasi_prioritas: 1 });
      await createTestLocation({ location_code: 'B2-03-05', mennyiseg: 50, kiadasi_prioritas: 10 });

      const suggestions = await service.suggestPickingLocations({
        cikkId: 'cikk-m10',
        requestedQty: 8
      });

      expect(suggestions).toHaveLength(2);
      expect(suggestions[0]).toMatchObject({ location_code: 'A1-01-01', quantity: 5 });
      expect(suggestions[1]).toMatchObject({ location_code: 'B2-03-05', quantity: 3 });
    });

    it('should respect priority ordering (pörgős first)', async () => {
      await createTestLocation({ location_code: 'B2-03-05', mennyiseg: 100, kiadasi_prioritas: 50 });
      await createTestLocation({ location_code: 'A1-01-01', mennyiseg: 10, kiadasi_prioritas: 1 });  // Pörgős

      const suggestions = await service.suggestPickingLocations({
        cikkId: 'cikk-m10',
        requestedQty: 15
      });

      // A1 (pri 1) kell először kimerüljön, majd B2 (pri 50)
      expect(suggestions[0].location_code).toBe('A1-01-01');
      expect(suggestions[0].quantity).toBe(10);
      expect(suggestions[1].location_code).toBe('B2-03-05');
      expect(suggestions[1].quantity).toBe(5);
    });

    it('should throw InsufficientStockException when not enough stock', async () => {
      await createTestLocation({ mennyiseg: 5 });

      await expect(
        service.suggestPickingLocations({ cikkId: 'cikk-m10', requestedQty: 10 })
      ).rejects.toThrow(InsufficientStockException);
    });

    it('should prefer warehouse when specified', async () => {
      await createTestLocation({ warehouse_id: 'BP-01', location_code: 'A1', mennyiseg: 20, prioritas: 10 });
      await createTestLocation({ warehouse_id: 'SZ-01', location_code: 'C1', mennyiseg: 100, prioritas: 1 });

      const suggestions = await service.suggestPickingLocations({
        cikkId: 'cikk-m10',
        requestedQty: 10,
        preferredWarehouseId: 'BP-01',
        allowMultiWarehouse: false
      });

      expect(suggestions).toHaveLength(1);
      expect(suggestions[0].warehouse_id).toBe('BP-01');
    });
  });

  describe('decreaseStock - Multi-Location', () => {

    it('should decrease stock from suggested locations', async () => {
      const loc1 = await createTestLocation({ location_code: 'A1', mennyiseg: 5 });
      const loc2 = await createTestLocation({ location_code: 'B2', mennyiseg: 50 });

      await service.decreaseStock('cikk-m10', 8, 'BP-01', 'kiadva_berles', {
        pickingSuggestions: [
          { location_id: loc1.id, quantity: 5 },
          { location_id: loc2.id, quantity: 3 }
        ],
        userId: 'user-123'
      });

      // Ellenőrzés
      const updatedLoc1 = await locationRepo.findById(loc1.id);
      const updatedLoc2 = await locationRepo.findById(loc2.id);

      expect(updatedLoc1.mennyiseg).toBe(0);   // 5 - 5
      expect(updatedLoc2.mennyiseg).toBe(47);  // 50 - 3
    });

    it('should create audit trail for each location decrease', async () => {
      const loc1 = await createTestLocation({ mennyiseg: 10 });

      await service.decreaseStock('cikk-m10', 5, 'BP-01', 'kiadva_berles', {
        pickingSuggestions: [{ location_id: loc1.id, quantity: 5 }],
        userId: 'user-123'
      });

      const movements = await movementRepo.find({ where: { cikk_id: 'cikk-m10' } });

      expect(movements).toHaveLength(1);
      expect(movements[0]).toMatchObject({
        from_location_id: loc1.id,
        quantity: -5,
        movement_type: 'kiadva_berles',
        user_id: 'user-123'
      });
    });

    it('should handle race condition with pessimistic lock', async () => {
      const loc = await createTestLocation({ mennyiseg: 10 });

      // Szimuláljuk a concurrent hozzáférést
      const promise1 = service.decreaseStock('cikk-m10', 8, 'BP-01', 'test', {
        pickingSuggestions: [{ location_id: loc.id, quantity: 8 }]
      });

      const promise2 = service.decreaseStock('cikk-m10', 8, 'BP-01', 'test', {
        pickingSuggestions: [{ location_id: loc.id, quantity: 8 }]
      });

      // Egyik sikerül, másik hibát dob (nincs elég készlet)
      const results = await Promise.allSettled([promise1, promise2]);

      const successes = results.filter(r => r.status === 'fulfilled');
      const failures = results.filter(r => r.status === 'rejected');

      expect(successes).toHaveLength(1);
      expect(failures).toHaveLength(1);
      expect((failures[0] as any).reason).toBeInstanceOf(ConcurrencyException);
    });
  });
});
```

---

#### 7.2 Integrációs Tesztek

```typescript
// tests/integration/multi-location-flow.test.ts

describe('Multi-Location Inventory Integration', () => {

  it('E2E: Receive stock → Suggest picking → Decrease stock', async () => {

    // 1. Cikk létrehozása multi-location engedélyezéssel
    const cikk = await request(app)
      .post('/api/cikk')
      .send({
        nev: 'Test Cikk',
        cikkszam: 'TEST-001',
        multi_location_enabled: true
      });

    expect(cikk.body.multi_location_enabled).toBe(true);

    // 2. Bevételezés - 50 db B2 polcra (tartalék)
    await request(app)
      .post('/api/inventory/receive')
      .send({
        cikkId: cikk.body.id,
        warehouseId: 'BP-01',
        locationCode: 'B2-03-05',
        quantity: 50,
        priorityType: 'manual',
        priority: 10
      })
      .expect(200);

    // 3. Bevételezés - 5 db A1 polcra (pörgős)
    await request(app)
      .post('/api/inventory/receive')
      .send({
        cikkId: cikk.body.id,
        warehouseId: 'BP-01',
        locationCode: 'A1-01-01',
        quantity: 5,
        priorityType: 'pörgős',
        priority: 1
      })
      .expect(200);

    // 4. Picking javaslat kérése (8 db)
    const suggestionRes = await request(app)
      .post('/api/inventory/suggest-picking')
      .send({
        cikkId: cikk.body.id,
        requestedQty: 8,
        preferredWarehouseId: 'BP-01'
      })
      .expect(200);

    const suggestions = suggestionRes.body;

    expect(suggestions).toHaveLength(2);
    expect(suggestions[0]).toMatchObject({
      location_code: 'A1-01-01',
      quantity: 5,
      priority: 1
    });
    expect(suggestions[1]).toMatchObject({
      location_code: 'B2-03-05',
      quantity: 3,
      priority: 10
    });

    // 5. Készlet csökkentés (javaslat alapján)
    await request(app)
      .post('/api/inventory/decrease-stock')
      .send({
        cikkId: cikk.body.id,
        quantity: 8,
        warehouseId: 'BP-01',
        pickingSuggestions: suggestions
      })
      .expect(200);

    // 6. Ellenőrzés: készlet frissült?
    const locations = await request(app)
      .get(`/api/cikk/${cikk.body.id}/locations`)
      .expect(200);

    expect(locations.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ location_code: 'A1-01-01', mennyiseg: 0 }),   // 5 - 5
        expect.objectContaining({ location_code: 'B2-03-05', mennyiseg: 47 })   // 50 - 3
      ])
    );
  });

  it('E2E: Legacy mode still works (backward compatibility)', async () => {

    // Régi cikk (multi_location_enabled = FALSE)
    const legacyCikk = await request(app)
      .post('/api/cikk')
      .send({
        nev: 'Legacy Cikk',
        mennyiseg: 100,
        location_code: 'A1-01-01',
        multi_location_enabled: false  // Legacy mode
      });

    // Régi API használat (nincs picking suggestion)
    await request(app)
      .post('/api/inventory/decrease-stock')
      .send({
        cikkId: legacyCikk.body.id,
        quantity: 10
        // pickingSuggestions: NINCS megadva
      })
      .expect(200);

    // Ellenőrzés: egyszerű mennyiseg csökkenés
    const updated = await request(app).get(`/api/cikk/${legacyCikk.body.id}`);
    expect(updated.body.mennyiseg).toBe(90);  // 100 - 10
  });
});
```

---

## 📊 Riportok és Metrikák

### Riportok

**1. Lokáció szintű készletlista:**

```sql
-- Riport: Cikkek lokációnként (multi-location aware)
SELECT
  c.cikkszam,
  c.nev AS cikk_nev,
  w.name AS raktar,
  cl.location_code,
  cl.mennyiseg,
  cl.kiadasi_prioritas,
  cl.prioritas_tipus,
  cl.utolso_frissites
FROM kgc.cikk c
  JOIN kgc.cikk_location cl ON cl.cikk_base_id = c.id
  JOIN kgc.warehouse w ON w.id = cl.warehouse_id
WHERE c.multi_location_enabled = TRUE
  AND cl.mennyiseg > 0
ORDER BY c.cikkszam, cl.kiadasi_prioritas ASC;
```

**2. Pörgős készlet riport:**

```sql
-- Riport: Pörgős polcok (kis mennyiségű lokációk)
SELECT
  c.cikkszam,
  c.nev,
  cl.location_code,
  cl.mennyiseg,
  cl.kiadasi_prioritas,
  CASE
    WHEN cl.mennyiseg <= 10 THEN '🔴 Kritikus'
    WHEN cl.mennyiseg <= 20 THEN '🟡 Figyelmeztetés'
    ELSE '🟢 Megfelelő'
  END AS pörgős_statusz
FROM kgc.cikk c
  JOIN kgc.cikk_location cl ON cl.cikk_base_id = c.id
WHERE cl.prioritas_tipus = 'pörgős'
  AND cl.mennyiseg > 0
ORDER BY cl.mennyiseg ASC;
```

---

## 🚀 Implementációs Ütemterv

### Sprint Breakdown (13-21 SP, 4 hét)

| Hét | Fázis | Feladatok | SP | Deliverable |
|-----|-------|-----------|-----|-------------|
| **Hét 1** | Adatmodell + Backend | • `cikk_location` tábla létrehozása<br>• Migráció script meglévő készletre<br>• `suggestPickingLocations()` algoritmus<br>• `decreaseStock()` multi-location aware<br>• Unit tesztek (80%+ coverage) | **5 SP** | Backend API ready |
| **Hét 2** | UI - Bevételezés | • Location Selector komponens<br>• Bevételezési képernyő módosítás<br>• Új/meglévő lokáció választó<br>• Prioritás típus választó<br>• E2E tesztek (bevételezés) | **3 SP** | Bevételezés multi-loc ready |
| **Hét 3** | UI - Kiadás | • Picking Suggestion Panel<br>• Kiadási képernyő integráció<br>• Automatikus javaslat megjelenítés<br>• Felülbírálás flow<br>• E2E tesztek (kiadás) | **5 SP** | Kiadás multi-loc ready |
| **Hét 4** | Riportok + Tesztelés | • Lokáció riportok<br>• Pörgős készlet riport<br>• Integrációs tesztek teljes flow<br>• Performance optimization<br>• Dokumentáció finalizálás | **3 SP** | Production ready |

**Teljes időigény:** 4 hét (2 backend dev + 2 frontend dev parallel)

---

## ✅ Sikerességi Kritériumok (KPI-k)

### Funkcionális Sikerkritériumok

✅ **DONE Definíció:**
1. Egy cikk minimum 2 különböző lokációban kezelhető (100% esetek)
2. Picking javaslat automatikusan prioritás szerint generálódik (100%)
3. Pörgős polc kiürül először, tartalék másodikként (95%+ helyesség)
4. Legacy cikkek továbbra is működnek változatlanul (0 regresszió)
5. Migráció sikeres: 100% meglévő készlet átkerül `cikk_location`-be

### Teljesítmény Kritériumok

| Metrika | Jelenlegi | Cél | Mérés |
|---------|-----------|-----|-------|
| Picking javaslat generálás | N/A | < 200ms | 100 lokáció esetén |
| Készletcsökkentés (multi-loc) | N/A | < 500ms | 5 lokációból split picking |
| Bevételezési UI válaszidő | ~1 sec | 1.5 sec | Új lokáció választó betöltés |
| Riport generálás (lokáció) | N/A | < 2 sec | 1000 cikk, 5000 lokáció |

### Üzleti Siker Mérőszámok

**6 hónap után:**
- ✅ **Tőkelekötés csökkentése:** -30% a pörgős polcok használata miatt
- ✅ **Raktári bejárás optimalizálás:** -20% idő (gyorsabb picking)
- ✅ **Készlethiány esetek:** -50% (jobb láthatóság több lokáción)

---

## 📄 Kapcsolódó Dokumentumok

| Dokumentum | Hely | Kapcsolat |
|------------|------|-----------|
| **Fit-Gap Analízis** | `/docs/KGC-ERP-v3-Fit-Gap-Analízis-2025-12-29.md` | Követelmény #1 forrása |
| **Inventory Modul Összehasonlítás** | `/docs/Inventory-Modul-vs-Fit-Gap-Követelmények.md` | Gap analysis és v2.0 javaslat |
| **Inventory CORE Modul** | `/docs/ERP/Inventory/INVENTORY-INTEGRATION-ARCHITECTURE.md` | Alapvető architektúra (v1.0) |
| **Bevételezési Folyamat** | `/docs/Flows/diagram-docs/02-ertekesites-folyamat.md` | Módosított folyamat |
| **Bérlési Folyamat** | `/docs/Flows/diagram-docs/01-ugyfelfelvitel-folyamat.md` | Módosított kiadási folyamat |

---

## ✅ Verzió Történet

| Verzió | Dátum | Változások |
|--------|-------|------------|
| **2.0** | 2025-12-29 | Inventory v2.0 - Multi-location funkció teljes specifikáció |

---

**🤖 Dokumentum vége**

_Generated by Winston 🏗️ (Architect Agent) @ BMAD Method v6_
_Team: Mary 📊 (Analyst), John 📋 (PM), Winston 🏗️ (Architect)_
_Project: KGC ERP v3.0 Fit-Gap Implementation_
