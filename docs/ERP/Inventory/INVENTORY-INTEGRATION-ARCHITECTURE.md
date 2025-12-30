# KGC ERP - Inventory/Raktárkezelés Modul - Integrációs Architektúra

**Verzió:** 1.0
**Dátum:** 2025-12-29
**Státusz:** 📦 Core Modul | Tervezési Fázis
**Szerző:** Winston (Architect Agent)
**Modultípus:** 🔷 **CORE MODUL** (nem plugin, kötelező komponens)

---

## 📋 Executive Summary

Az **Inventory/Raktárkezelés modul** a KGC ERP **központi készletkezelő rendszere**, amely egységesíti a bérgépek, értékesítési termékek és szerviz alkatrészek nyilvántartását. Ez egy **CORE modul** - nem opcionális plugin, hanem a rendszer alapvető építőköve, amelyre a Bérlés, Értékesítés és Szerviz modulok közvetlenül épülnek.

### Kulcs Jellemzők

- ✅ **Központosított CIKK entitás** - Minden fizikai tétel egy táblában
- ✅ **Multi-Warehouse támogatás** - 2-5 raktár/telephely kezelése
- ✅ **Serial Number tracking** - Bérgépek egyedi azonosítása
- ✅ **Shelf-Row-Column lokáció** - Pontos tárolási helyek (pl. A12-03-05)
- ✅ **Bérgép státusz workflow** - bent → kint → szerviz → bent
- ✅ **Real-time készletfrissítés** - Bérlés/értékesítés/szerviz műveletek szinkronban
- ✅ **Készletmozgás nyomon követés** - Audit trail minden művelethez

---

## 🏗️ Architektúrális Pozíció

### Core Modul vs Plugin Modul

| Tulajdonság | Core Modulok | Plugin Modulok |
|-------------|--------------|----------------|
| **Példák** | Bérlés, Szerviz, Értékesítés, Pénzügy, **Inventory** | Support AI, CRM, HR |
| **Opcionális?** | ❌ Nem | ✅ Igen (feature flag) |
| **Ki-bekapcsolható?** | ❌ Nem | ✅ Igen (runtime) |
| **Integráció típus** | Direct DB táblák, shared schema | API + Webhook, saját schema |
| **Függőség iránya** | Egymástól függenek | Core-tól függenek |

**Inventory státusza:** **CORE MODUL** - A Bérlés/Szerviz/Értékesítés modulok közvetlenül hivatkoznak az `inventory.cikk` táblára. Nem kapcsolható ki.

---

## 🗂️ Adatmodell - Központosított CIKK Entitás

### 1. Fő Tábla: `cikk`

```sql
CREATE TABLE kgc.cikk (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Típus megkülönböztetés (logikai szeparáció)
  berlet BOOLEAN DEFAULT FALSE,        -- TRUE = bérgép
  alkatresz BOOLEAN DEFAULT FALSE,     -- TRUE = szerviz alkatrész
  -- Ha mindkettő FALSE → értékesítési termék

  -- Alapadatok
  megnevezes TEXT NOT NULL,
  leiras TEXT,
  kategoria_id UUID REFERENCES kgc.kategoria(id),
  gyarto TEXT,
  modell TEXT,

  -- Raktár információk
  warehouse_id UUID NOT NULL REFERENCES kgc.warehouse(id),
  location_code TEXT,                  -- Shelf-Row-Column (pl. A12-03-05)
  mennyiseg INTEGER NOT NULL DEFAULT 0,
  min_keszlet INTEGER DEFAULT 0,       -- Minimum készlet riasztáshoz

  -- Bérgép specifikus adatok (csak ha berlet = TRUE)
  serial_number TEXT,                  -- Gyári szám (UNIQUE per warehouse)
  beszerzesi_datum DATE,
  utolso_szerviz_datum DATE,

  -- Árazás
  beszerzes_ar DECIMAL(10,2),
  eladas_ar DECIMAL(10,2),
  berles_dij_napi DECIMAL(10,2),       -- Napi bérleti díj (ha berlet = TRUE)

  -- Metaadatok
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES kgc.users(id),
  archived BOOLEAN DEFAULT FALSE,

  -- Kritikus constraint-ek (v4.2 review alapján)
  CONSTRAINT unique_serial_number
    UNIQUE(warehouse_id, serial_number)
    WHERE serial_number IS NOT NULL,
  CONSTRAINT check_quantity_non_negative
    CHECK (mennyiseg >= 0)
);

-- Performance indexek (v4.2 review alapján)
CREATE INDEX idx_cikk_warehouse ON cikk(warehouse_id);
CREATE INDEX idx_cikk_location ON cikk(location_code);
CREATE INDEX idx_cikk_berlet ON cikk(berlet) WHERE berlet = TRUE;
CREATE INDEX idx_cikk_alkatresz ON cikk(alkatresz) WHERE alkatresz = TRUE;
CREATE INDEX idx_cikk_kategoria ON cikk(kategoria_id);
```

### 2. Bérgép Státusz Tábla: `bergep_status`

```sql
CREATE TABLE kgc.bergep_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cikk_id UUID NOT NULL REFERENCES kgc.cikk(id) ON DELETE CASCADE,

  -- Státusz workflow
  status TEXT NOT NULL CHECK (status IN (
    'bent',      -- Raktárban, bérelhető
    'kint',      -- Kibérelve
    'szerviz',   -- Szervizben
    'destroyed', -- Megsemmisült (v4.2 review)
    'lost',      -- Elveszett (v4.2 review)
    'sold'       -- Eladva, már nem bérgép (v4.2 review)
  )),

  -- Kapcsolódó műveletek (opcionális, NULL ha bent)
  rental_id UUID REFERENCES kgc.rentals(id),
  service_id UUID REFERENCES kgc.service_jobs(id),

  -- Státusz változás időpontja
  status_since TIMESTAMP DEFAULT NOW(),
  notes TEXT,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  -- Kritikus constraint-ek (v4.2 review alapján)
  CONSTRAINT unique_cikk_status UNIQUE(cikk_id),  -- 1 bérgép = 1 státusz
  CONSTRAINT check_status_rental CHECK (
    (status = 'kint' AND rental_id IS NOT NULL) OR
    (status = 'szerviz' AND service_id IS NOT NULL) OR
    (status IN ('bent', 'destroyed', 'lost', 'sold') AND rental_id IS NULL AND service_id IS NULL)
  )
);

-- Index
CREATE INDEX idx_bergep_status_status ON bergep_status(status);
CREATE INDEX idx_bergep_status_rental ON bergep_status(rental_id) WHERE rental_id IS NOT NULL;
CREATE INDEX idx_bergep_status_service ON bergep_status(service_id) WHERE service_id IS NOT NULL;
```

### 3. Készletmozgás Tábla: `inventory_movement`

```sql
CREATE TABLE kgc.inventory_movement (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cikk_id UUID NOT NULL REFERENCES kgc.cikk(id),

  -- Művelettípus
  movement_type TEXT NOT NULL CHECK (movement_type IN (
    'beerkezett',        -- Beszerzés
    'kiadva_berles',     -- Bérléshez kiadva
    'visszaerkezet_berles', -- Bérlésből visszaérkezett
    'kiadva_szerviz',    -- Szervizbe küldve
    'visszaerkezet_szerviz', -- Szervizből visszaérkezett
    'eladva',            -- Értékesítés
    'selejtezett',       -- Megsemmisítve
    'transfer_ki',       -- Raktárak közötti kimenő mozgatás
    'transfer_be'        -- Raktárak közötti bejövő mozgatás
  )),

  -- Mennyiség és lokáció
  quantity INTEGER NOT NULL,
  from_warehouse_id UUID REFERENCES kgc.warehouse(id),
  to_warehouse_id UUID REFERENCES kgc.warehouse(id),
  from_location TEXT,
  to_location TEXT,

  -- Kapcsolódó műveletek
  rental_id UUID REFERENCES kgc.rentals(id),
  service_id UUID REFERENCES kgc.service_jobs(id),
  order_id UUID REFERENCES kgc.orders(id),

  -- Metaadatok
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES kgc.users(id)
);

-- Index a kereséshez és audithoz
CREATE INDEX idx_inventory_movement_cikk_date ON inventory_movement(cikk_id, created_at DESC);
CREATE INDEX idx_inventory_movement_type ON inventory_movement(movement_type);
CREATE INDEX idx_inventory_movement_warehouse ON inventory_movement(to_warehouse_id, created_at DESC);
```

### 4. Warehouse Tábla: `warehouse`

```sql
CREATE TABLE kgc.warehouse (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  code TEXT NOT NULL UNIQUE,           -- Rövid kód (pl. BP-01, SZ-01)

  -- Címadatok
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  postal_code TEXT,
  country TEXT DEFAULT 'HU',

  -- Kapcsolattartó
  manager_id UUID REFERENCES kgc.employees(id),
  phone TEXT,
  email TEXT,

  -- Státusz
  active BOOLEAN DEFAULT TRUE,
  is_default BOOLEAN DEFAULT FALSE,    -- Default raktár új cikkekhez

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Constraint: Csak 1 default raktár lehet
CREATE UNIQUE INDEX idx_warehouse_default ON warehouse(is_default) WHERE is_default = TRUE;
```

---

## 🔗 Integráció a Core Modulokkal

### 1. Bérlés Modul Integráció

#### Bérlés Indítása
```typescript
// NestJS - RentalService
async createRental(data: CreateRentalDto): Promise<Rental> {
  const transaction = await this.db.transaction();

  try {
    // 1. Ellenőrizzük a bérgép elérhetőségét
    const bergep = await this.inventoryService.checkBergepAvailability(
      data.bergepId,
      data.rentalStart,
      data.rentalEnd
    );

    if (!bergep.available) {
      throw new BadRequestException(`Bérgép nem elérhető (státusz: ${bergep.status})`);
    }

    // 2. Létrehozzuk a bérlést
    const rental = await this.rentalRepo.create(data);

    // 3. Frissítjük a bérgép státuszát
    await this.inventoryService.updateBergepStatus({
      cikkId: data.bergepId,
      status: 'kint',
      rentalId: rental.id
    });

    // 4. Készletmozgás naplózása
    await this.inventoryService.logMovement({
      cikkId: data.bergepId,
      movementType: 'kiadva_berles',
      quantity: 1,
      rentalId: rental.id
    });

    await transaction.commit();
    return rental;

  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}
```

#### Bérlés Visszaadása
```typescript
async returnRental(rentalId: string): Promise<void> {
  const transaction = await this.db.transaction();

  try {
    const rental = await this.rentalRepo.findOne(rentalId);

    // Bérgép státusz frissítése
    await this.inventoryService.updateBergepStatus({
      cikkId: rental.bergepId,
      status: 'bent',
      rentalId: null
    });

    // Készletmozgás naplózása
    await this.inventoryService.logMovement({
      cikkId: rental.bergepId,
      movementType: 'visszaerkezet_berles',
      quantity: 1,
      rentalId: rental.id
    });

    // Bérlés lezárása
    rental.returnedAt = new Date();
    await this.rentalRepo.save(rental);

    await transaction.commit();

  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}
```

### 2. Szerviz Modul Integráció

#### Szerviz Feladat Létrehozása
```typescript
async createServiceJob(data: CreateServiceJobDto): Promise<ServiceJob> {
  const transaction = await this.db.transaction();

  try {
    const serviceJob = await this.serviceJobRepo.create(data);

    if (data.bergepId) {
      // Ha bérgép → státusz frissítés
      await this.inventoryService.updateBergepStatus({
        cikkId: data.bergepId,
        status: 'szerviz',
        serviceId: serviceJob.id
      });

      await this.inventoryService.logMovement({
        cikkId: data.bergepId,
        movementType: 'kiadva_szerviz',
        quantity: 1,
        serviceId: serviceJob.id
      });
    }

    await transaction.commit();
    return serviceJob;

  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}
```

#### Alkatrész Felhasználás
```typescript
async useServicePart(serviceId: string, partId: string, quantity: number): Promise<void> {
  // Készlet ellenőrzés
  const available = await this.inventoryService.checkStockAvailability(partId, quantity);

  if (!available) {
    throw new BadRequestException(`Insufficient stock for part ${partId}`);
  }

  // Készlet csökkentés
  await this.inventoryService.decreaseStock({
    cikkId: partId,
    quantity,
    serviceId,
    movementType: 'kiadva_szerviz'
  });
}
```

### 3. Értékesítés Modul Integráció

#### Rendelés Feldolgozása
```typescript
async processOrder(orderId: string): Promise<void> {
  const order = await this.orderRepo.findOne(orderId, { relations: ['items'] });
  const transaction = await this.db.transaction();

  try {
    for (const item of order.items) {
      // Készlet ellenőrzés
      const stock = await this.inventoryService.getStock(item.cikkId);

      if (stock.mennyiseg < item.quantity) {
        // Backorder kezelés (v4.2 review)
        order.status = 'backordered';
        await this.notifyBackorder(order.id, item.cikkId);
        continue;
      }

      // Készlet csökkentés
      await this.inventoryService.decreaseStock({
        cikkId: item.cikkId,
        quantity: item.quantity,
        orderId: order.id,
        movementType: 'eladva'
      });
    }

    await transaction.commit();

  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}
```

---

## 🔄 API Végpontok (Belső Core API)

**Megjegyzés:** Ezek **belső API-k** a Core modulokon belül (nem REST végpontok külső plugin-eknek). A Backend NestJS szolgáltatások közötti direkt hívások.

### InventoryService Methods

```typescript
class InventoryService {
  // Készlet ellenőrzés
  async checkStockAvailability(cikkId: string, quantity: number): Promise<boolean>
  async getStock(cikkId: string): Promise<CikkEntity>

  // Bérgép kezelés
  async checkBergepAvailability(cikkId: string, startDate: Date, endDate: Date): Promise<{available: boolean, status: string}>
  async updateBergepStatus(data: UpdateBergepStatusDto): Promise<void>

  // Készlet műveletek
  async increaseStock(data: StockChangeDto): Promise<void>
  async decreaseStock(data: StockChangeDto): Promise<void>
  async transferStock(data: TransferStockDto): Promise<void>

  // Audit trail
  async logMovement(data: LogMovementDto): Promise<void>
  async getMovementHistory(cikkId: string, filters?: MovementFilters): Promise<InventoryMovement[]>

  // Raktár műveletek
  async getWarehouseStock(warehouseId: string): Promise<CikkEntity[]>
  async getLowStockItems(warehouseId?: string): Promise<CikkEntity[]>
}
```

---

## 📊 Üzleti Logika és Validációk

### 1. Negatív Készlet Védelem (v4.2 Kritikus Javítás)

```typescript
async decreaseStock(data: StockChangeDto): Promise<void> {
  const cikk = await this.cikkRepo.findOne(data.cikkId);

  if (cikk.mennyiseg - data.quantity < 0) {
    throw new BadRequestException(
      `Insufficient stock. Available: ${cikk.mennyiseg}, Requested: ${data.quantity}`
    );
  }

  // Atomikus frissítés
  await this.cikkRepo.update(
    { id: data.cikkId },
    { mennyiseg: () => `mennyiseg - ${data.quantity}` }
  );

  // Mozgás naplózása
  await this.logMovement({
    cikkId: data.cikkId,
    movementType: data.movementType,
    quantity: -data.quantity,
    ...data
  });
}
```

### 2. Serial Number Duplikáció Védelem

```typescript
async createBergep(data: CreateBergepDto): Promise<CikkEntity> {
  if (data.serialNumber) {
    // Ellenőrizzük az egyediséget a warehouse-on belül
    const existing = await this.cikkRepo.findOne({
      where: {
        warehouseId: data.warehouseId,
        serialNumber: data.serialNumber
      }
    });

    if (existing) {
      throw new ConflictException(
        `Serial number ${data.serialNumber} already exists in warehouse ${data.warehouseId}`
      );
    }
  }

  const bergep = await this.cikkRepo.create({
    ...data,
    berlet: true,
    mennyiseg: 1  // Bérgép mindig 1 db
  });

  // Státusz inicializálása
  await this.bergepStatusRepo.create({
    cikkId: bergep.id,
    status: 'bent'
  });

  return bergep;
}
```

### 3. Bérgép Státusz Workflow Validáció

```typescript
async updateBergepStatus(data: UpdateBergepStatusDto): Promise<void> {
  const currentStatus = await this.bergepStatusRepo.findOne({
    where: { cikkId: data.cikkId }
  });

  // Státusz átmenet validáció
  const validTransitions = {
    'bent': ['kint', 'szerviz', 'sold', 'lost', 'destroyed'],
    'kint': ['bent', 'szerviz'],
    'szerviz': ['bent', 'destroyed']
  };

  if (!validTransitions[currentStatus.status]?.includes(data.status)) {
    throw new BadRequestException(
      `Invalid status transition: ${currentStatus.status} → ${data.status}`
    );
  }

  // Frissítés
  await this.bergepStatusRepo.update(
    { cikkId: data.cikkId },
    {
      status: data.status,
      rentalId: data.rentalId ?? null,
      serviceId: data.serviceId ?? null,
      statusSince: new Date(),
      notes: data.notes
    }
  );
}
```

### 4. Low Stock Riasztás

```typescript
async checkLowStock(): Promise<CikkEntity[]> {
  const lowStockItems = await this.cikkRepo.find({
    where: {
      mennyiseg: LessThanOrEqual(this.db.raw('min_keszlet')),
      archived: false
    }
  });

  // Értesítések küldése
  for (const item of lowStockItems) {
    await this.notificationService.send({
      type: 'low_stock_alert',
      cikkId: item.id,
      currentStock: item.mennyiseg,
      minStock: item.minKeszlet,
      warehouse: item.warehouseId
    });
  }

  return lowStockItems;
}
```

---

## 🚀 Telepítés és Inicializálás

### 1. Database Migration

```bash
# Inventory táblák létrehozása
npx prisma migrate deploy --name inventory-initial

# Vagy alembic (ha Python backend)
alembic upgrade head
```

### 2. Alapértelmezett Raktár Létrehozása

```typescript
async initializeDefaultWarehouse(): Promise<void> {
  const defaultExists = await this.warehouseRepo.findOne({
    where: { isDefault: true }
  });

  if (!defaultExists) {
    await this.warehouseRepo.create({
      name: 'Központi Raktár',
      code: 'BP-01',
      address: 'Budapest, Példa utca 1.',
      city: 'Budapest',
      postalCode: '1111',
      country: 'HU',
      active: true,
      isDefault: true
    });
  }
}
```

### 3. Kategória Struktúra (Opcionális)

```sql
-- Kategóriák létrehozása
INSERT INTO kgc.kategoria (name, parent_id) VALUES
  ('Bérgépek', NULL),
    ('Emelőgépek', (SELECT id FROM kategoria WHERE name = 'Bérgépek')),
    ('Targoncák', (SELECT id FROM kategoria WHERE name = 'Bérgépek')),
  ('Alkatrészek', NULL),
    ('Hidraulika', (SELECT id FROM kategoria WHERE name = 'Alkatrészek')),
    ('Elektromos', (SELECT id FROM kategoria WHERE name = 'Alkatrészek')),
  ('Értékesítési termékek', NULL);
```

---

## 🧪 Tesztelési Stratégia

### Unit Tesztek

```typescript
describe('InventoryService', () => {
  describe('decreaseStock', () => {
    it('should throw error when stock insufficient', async () => {
      const cikk = { id: 'uuid', mennyiseg: 5 };
      jest.spyOn(cikkRepo, 'findOne').mockResolvedValue(cikk);

      await expect(
        service.decreaseStock({ cikkId: 'uuid', quantity: 10 })
      ).rejects.toThrow('Insufficient stock');
    });

    it('should decrease stock and log movement', async () => {
      const cikk = { id: 'uuid', mennyiseg: 10 };
      jest.spyOn(cikkRepo, 'findOne').mockResolvedValue(cikk);

      await service.decreaseStock({ cikkId: 'uuid', quantity: 5 });

      expect(cikkRepo.update).toHaveBeenCalledWith(
        { id: 'uuid' },
        { mennyiseg: expect.anything() }
      );
      expect(movementRepo.create).toHaveBeenCalled();
    });
  });

  describe('updateBergepStatus', () => {
    it('should reject invalid status transition', async () => {
      const status = { cikkId: 'uuid', status: 'kint' };
      jest.spyOn(bergepStatusRepo, 'findOne').mockResolvedValue(status);

      await expect(
        service.updateBergepStatus({ cikkId: 'uuid', status: 'sold' })
      ).rejects.toThrow('Invalid status transition');
    });
  });
});
```

### Integration Tesztek

```typescript
describe('Rental Integration with Inventory', () => {
  it('should update bergep status when rental created', async () => {
    const bergep = await createTestBergep({ status: 'bent' });

    const rental = await rentalService.createRental({
      bergepId: bergep.id,
      customerId: 'customer-uuid',
      rentalStart: new Date(),
      rentalEnd: addDays(new Date(), 7)
    });

    const updatedStatus = await bergepStatusRepo.findOne({
      where: { cikkId: bergep.id }
    });

    expect(updatedStatus.status).toBe('kint');
    expect(updatedStatus.rentalId).toBe(rental.id);
  });

  it('should create inventory movement when rental returned', async () => {
    const rental = await createTestRental({ status: 'active' });

    await rentalService.returnRental(rental.id);

    const movements = await inventoryMovementRepo.find({
      where: { rentalId: rental.id }
    });

    expect(movements).toHaveLength(2);  // kiadva + visszaerkezet
    expect(movements[1].movementType).toBe('visszaerkezet_berles');
  });
});
```

---

## 📈 Teljesítmény és Skálázás

### 1. Database Query Optimalizálás

```sql
-- Bérgép státusz lekérdezés optimalizálva
EXPLAIN ANALYZE
SELECT c.*, bs.status, bs.rental_id, bs.service_id
FROM kgc.cikk c
LEFT JOIN kgc.bergep_status bs ON c.id = bs.cikk_id
WHERE c.berlet = TRUE
  AND c.warehouse_id = 'warehouse-uuid'
  AND bs.status = 'bent';

-- Index használat: idx_cikk_berlet + idx_bergep_status_status
-- Várható query time: < 50ms (1000 bérgép esetén)
```

### 2. Caching Stratégia

```typescript
// Redis cache az aktív bérgépek státuszához
async getBergepStatus(cikkId: string): Promise<BergepStatusEntity> {
  const cacheKey = `bergep:status:${cikkId}`;

  // Cache lookup
  const cached = await this.redis.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }

  // DB query
  const status = await this.bergepStatusRepo.findOne({
    where: { cikkId }
  });

  // Cache 5 percre
  await this.redis.setex(cacheKey, 300, JSON.stringify(status));

  return status;
}

// Cache invalidáció státusz változáskor
async updateBergepStatus(data: UpdateBergepStatusDto): Promise<void> {
  await this.bergepStatusRepo.update(/* ... */);

  // Cache törlése
  await this.redis.del(`bergep:status:${data.cikkId}`);
}
```

### 3. Batch Műveletek

```typescript
// Tömeges készlet frissítés (pl. éves leltár után)
async batchUpdateStock(updates: BatchStockUpdate[]): Promise<void> {
  const transaction = await this.db.transaction();

  try {
    for (const batch of chunk(updates, 100)) {
      await this.cikkRepo.update(batch);

      // Movement log batch insert
      await this.movementRepo.createMany(
        batch.map(u => ({
          cikkId: u.cikkId,
          movementType: 'inventory_adjustment',
          quantity: u.newQuantity - u.oldQuantity,
          notes: 'Leltár korrekció'
        }))
      );
    }

    await transaction.commit();

  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}
```

---

## 💰 Költségbecslés

### Fejlesztési Költségek

| Komponens | Becsült idő | Óradíj | Költség |
|-----------|-------------|--------|---------|
| Adatmodell + Migration | 1 nap | €50/óra | €400 |
| InventoryService implementáció | 3 nap | €50/óra | €1,200 |
| Bérlés integráció | 2 nap | €50/óra | €800 |
| Szerviz integráció | 2 nap | €50/óra | €800 |
| Értékesítés integráció | 1 nap | €50/óra | €400 |
| Unit + Integration tesztek | 3 nap | €50/óra | €1,200 |
| QA + Bug fixes | 2 nap | €50/óra | €800 |
| **ÖSSZESEN** | **14 nap** | - | **€5,600** |

### Működési Költségek

- **Database tárhely:** Benne a PostgreSQL-ben (0 extra költség)
- **Redis cache:** Benne a Redis konténerben (0 extra költség)
- **Monitoring:** Prometheus + Grafana (0 extra költség)

**Havi extra költség:** **€0** (Core modul, nincs külső függőség)

---

## 🎯 Következő Lépések

### Fázis 6: Inventory Modul Implementáció (3 hét)

**Hét 1: Alapok**
- [ ] Database migration scriptek (8 kritikus SQL fix)
- [ ] `cikk`, `bergep_status`, `inventory_movement`, `warehouse` táblák
- [ ] InventoryService alapműveletek (CRUD)
- [ ] Unit tesztek

**Hét 2: Integrációk**
- [ ] Bérlés modul integráció (státusz frissítés)
- [ ] Szerviz modul integráció (alkatrész felhasználás)
- [ ] Értékesítés modul integráció (készlet csökkentés)
- [ ] Integration tesztek

**Hét 3: Validáció és Optimalizálás**
- [ ] Negatív készlet védelem
- [ ] Serial number duplikáció védelem
- [ ] Státusz workflow validáció
- [ ] Redis caching implementáció
- [ ] E2E tesztek (Bérlés → Inventory → Visszaadás)
- [ ] Performance testing (1000+ bérgép esetén)

---

## 📞 Kapcsolódó Dokumentumok

| Dokumentum | Hely | Leírás |
|------------|------|--------|
| KGC Architektúra Összefoglaló | `docs/deployment/KGC-ERP-Teljes-Architektura-Osszefoglalo-2025-12-29.md` | v4.2 Teljes rendszer architektúra |
| Inventory Diagramok | `docs/ERP/Inventory/kgc-inventory-*.excalidraw` | Architektúra és adatfolyam diagramok |
| Support Plugin Integráció | `docs/ERP/Support/KGC-SUPPORT-INTEGRATION-ARCHITECTURE.md` | Plugin modul példa |
| ADR-002 Deployment | `docs/architecture/ADR-002-deployment-offline-strategy.md` | Telepítési stratégia |

---

**Verzió:** 1.0
**Frissítve:** 2025-12-29
**Készítő:** Winston (Architect Agent)

**Változási Napló:**
- **v1.0** (2025-12-29) - Első kiadás: Core modul integráció specifikáció + v4.2 review javításokkal
