# KGC Offline Szinkronizáció (PWA) - Szekvencia Diagram

## Diagram Alapinformációk

| Tulajdonság | Érték |
|-------------|-------|
| **Fájlnév** | offline-szinkron-sequence.excalidraw |
| **Típus** | Szekvencia diagram |
| **Verzió** | 1.0 |
| **Létrehozva** | 2025-12-03 |
| **Forrás** | ADR-002-deployment-offline-strategy.md |

---

## Áttekintés

Ez a szekvencia diagram bemutatja a KGC ERP v2 PWA (Progressive Web App) offline működését és szinkronizációját. A diagram 15 lépésben vezeti végig a teljes folyamatot három különböző állapotban:

1. **Online mód** - Normál működés, közvetlen szerver kommunikáció
2. **Offline mód** - Hálózat nélküli működés, lokális tárolás
3. **Szinkronizáció** - Online visszatéréskor az adatok felszinkronizálása

---

## Szereplők (Lifeline-ok)

```
┌──────────────┐    ┌────────────────┐    ┌─────────────┐    ┌──────────┐
│   PWA App    │    │ Service Worker │    │  IndexedDB  │    │  Szerver │
│    (Kék)     │    │   (Narancs)    │    │   (Lila)    │    │  (Zöld)  │
└──────────────┘    └────────────────┘    └─────────────┘    └──────────┘
       │                    │                    │                 │
       │                    │                    │                 │
       ▼                    ▼                    ▼                 ▼
    Felhasználói        Workbox           Browser Storage     PostgreSQL
    interfész          alapú SW          ~150 MB limit           + API
```

### Technológiák

| Komponens | Technológia | Megjegyzés |
|-----------|-------------|------------|
| PWA App | React + Vite | SPA, offline-képes |
| Service Worker | Workbox 7.x | Google könyvtár |
| IndexedDB | Dexie.js | IndexedDB wrapper |
| Szerver | NestJS + PostgreSQL | REST API |

---

## 1. Online Mód (5 lépés)

**Normál működés, hálózat elérhető**

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                           🟢 ONLINE MÓD                                       │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  PWA App            Service Worker          IndexedDB            Szerver    │
│     │                     │                     │                    │      │
│     │ ─── 1. API kérés ──→│                     │                    │      │
│     │    (bérlés indítás) │                     │                    │      │
│     │                     │                     │                    │      │
│     │                     │──── 2. Network First ────────────────────→│      │
│     │                     │      (hálózat először)                   │      │
│     │                     │                     │                    │      │
│     │                     │←─── 3. Válasz (siker/hiba) ──────────────│      │
│     │                     │                     │                    │      │
│     │                     │──── 4. Cache frissítés ──→│              │      │
│     │                     │                     │                    │      │
│     │←─ 5. UI frissítés ──│                     │                    │      │
│     │      (siker)        │                     │                    │      │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Lépések részletezése (Online)

| Lépés | Irány | Leírás | Adatok |
|-------|-------|--------|--------|
| 1 | PWA → SW | Felhasználói művelet API hívása | `POST /api/rentals { customerId, items }` |
| 2 | SW → Szerver | Network First stratégia | HTTP kérés HTTPS-en |
| 3 | Szerver → SW | Szerver válasz | `{ id: 123, status: "active" }` |
| 4 | SW → IDB | Lokális cache frissítése | Dexie put() |
| 5 | SW → PWA | UI értesítése | React state update |

---

## 2. Offline Mód (5 lépés)

**Hálózat nem elérhető, lokális működés**

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                           🔴 OFFLINE MÓD                                      │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  PWA App            Service Worker          IndexedDB            Szerver    │
│     │                     │                     │                    │      │
│     │ ─── 6. API kérés ──→│                     │                    │      │
│     │    (bérlés indítás) │                     │                    │      │
│     │                     │                     │                    │      │
│     │                     │──── 7. Network First ───────────────── ❌│      │
│     │                     │      Hálózat nem elérhető!               │      │
│     │                     │                     │                    │      │
│     │                     │─ 8. Pending Queue-ba mentés ─→│         │      │
│     │                     │                     │                    │      │
│     │                     │←──── 9. localId generálás ────│         │      │
│     │                     │     (pl. local_abc123)        │          │      │
│     │                     │                     │                    │      │
│     │←─ 10. UI frissítés ─│                     │                    │      │
│     │    (pending ⏳)     │                     │                    │      │
│                                                                              │
│  ┌─────────────────────┐                                                    │
│  │ ⏳ 3 pending        │                                                    │
│  │ Szinkronra vár      │                                                    │
│  └─────────────────────┘                                                    │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Lépések részletezése (Offline)

| Lépés | Irány | Leírás | Adatok |
|-------|-------|--------|--------|
| 6 | PWA → SW | Felhasználói művelet | Ugyanaz, mint online |
| 7 | SW → Szerver | Hálózati hiba | `navigator.onLine = false` |
| 8 | SW → IDB | Pending queue-ba mentés | `pendingSync.add({ action, payload, timestamp })` |
| 9 | IDB → SW | Lokális ID generálás | `local_${uuid()}` |
| 10 | SW → PWA | UI frissítés pending státusszal | Sárga badge megjelenítés |

### Pending Queue Struktúra

```typescript
interface PendingOperation {
  id: string;           // local_abc123
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  entity: 'rental' | 'sale' | 'service' | 'customer';
  payload: object;      // Eredeti kérés adatai
  timestamp: number;    // Unix timestamp
  retryCount: number;   // 0-5 között
  status: 'pending' | 'syncing' | 'failed';
}
```

---

## 3. Szinkronizáció (5 lépés)

**Online visszatérés, adatok felszinkronizálása**

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                   🔄 SZINKRONIZÁCIÓ (Online visszatérés)                     │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  PWA App            Service Worker          IndexedDB            Szerver    │
│     │                     │                     │                    │      │
│     │                     │←─ 11. Pending Queue lekérés ─│           │      │
│     │                     │                     │                    │      │
│     │                     │──── 12. Background Sync ─────────────────→│      │
│     │                     │      (sorban, egyesével)                 │      │
│     │                     │                     │                    │      │
│     │                     │←─── 13. Szerver ID + timestamp ──────────│      │
│     │                     │                     │                    │      │
│     │                     │─ 14. localId → serverId mapping ─→│      │      │
│     │                     │                     │                    │      │
│     │←─ 15. UI frissítés ─│                     │                    │      │
│     │    (✅ szinkron)    │                     │                    │      │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Lépések részletezése (Szinkronizáció)

| Lépés | Irány | Leírás | Adatok |
|-------|-------|--------|--------|
| 11 | IDB → SW | Pending műveletek betöltése | `getAllPending()` |
| 12 | SW → Szerver | Background Sync API | FIFO sorrend, retry logic |
| 13 | Szerver → SW | Valódi ID visszaadása | `{ serverId: 456, syncedAt }` |
| 14 | SW → IDB | ID mapping mentése | `local_abc123 → 456` |
| 15 | SW → PWA | UI véglegesítés | Zöld pipa, pending badge eltűnik |

### Background Sync Konfiguráció

```javascript
// Service Worker regisztráció
navigator.serviceWorker.ready.then((registration) => {
  registration.sync.register('sync-pending-operations');
});

// Workbox konfiguráció
import { BackgroundSyncPlugin } from 'workbox-background-sync';

const bgSyncPlugin = new BackgroundSyncPlugin('pendingQueue', {
  maxRetentionTime: 24 * 60, // 24 óra (percben)
  onSync: async ({ queue }) => {
    // Egyedi sync logika
    const entries = await queue.getAll();
    for (const entry of entries) {
      await syncEntry(entry);
      await queue.delete(entry.id);
    }
  }
});
```

---

## Konfliktus Kezelés (Last-Write-Wins)

```
┌────────────────────────────────────────────────────────────────┐
│                   ⚠️ KONFLIKTUS KEZELÉS                        │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Stratégia: Last-Write-Wins (LWW)                              │
│                                                                │
│  1. Szerver visszaad ütközést (409 Conflict)                  │
│  2. updatedAt összehasonlítás                                 │
│  3. Frissebb verzió nyer                                      │
│  4. Konfliktus log-ba mentés                                  │
│  5. Admin áttekintheti                                        │
│                                                                │
│  ✅ Előnyök:                                                   │
│    • Egyszerű implementáció                                   │
│    • Automatikus feloldás                                     │
│    • Minimális felhasználói interakció                        │
│                                                                │
│  ⚠️ Hátrányok:                                                 │
│    • Adatvesztés lehetséges                                   │
│    • Nem minden esetben "helyes" az eredmény                  │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### Konfliktus Log Tábla

```sql
CREATE TABLE conflict_log (
  id SERIAL PRIMARY KEY,
  entity_type VARCHAR(50) NOT NULL,      -- 'rental', 'sale', etc.
  entity_id UUID NOT NULL,
  local_version JSONB NOT NULL,          -- Offline változat
  server_version JSONB NOT NULL,         -- Szerver változat
  winner VARCHAR(10) NOT NULL,           -- 'local' vagy 'server'
  resolved_at TIMESTAMP DEFAULT NOW(),
  resolved_by VARCHAR(50) DEFAULT 'auto', -- 'auto' vagy user_id
  tenant_id UUID NOT NULL
);
```

---

## IndexedDB Tárolás

```
┌────────────────────────────────────────────────────────────────┐
│                   💾 INDEXEDDB TÁROLÁS                         │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Tárolók (Object Stores):                                      │
│                                                                │
│  📦 customers     ~10 MB   (ügyféladatok cache)               │
│  📦 products     ~100 MB   (termékkatalógus, képek nélkül)    │
│  📦 rentalEquip   ~1 MB    (bérleti eszközök)                 │
│  📦 pendingSync  ~10 MB    (várakozó műveletek)               │
│  📦 syncMeta      ~1 KB    (utolsó szinkron idő)              │
│                                                                │
│  ────────────────────────────────                              │
│  Összesen:       ~150 MB   (mobil limit figyelembevételével)  │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### Dexie.js Séma

```typescript
import Dexie from 'dexie';

class KgcDatabase extends Dexie {
  customers!: Table<Customer, string>;
  products!: Table<Product, string>;
  rentalEquip!: Table<RentalEquipment, string>;
  pendingSync!: Table<PendingOperation, string>;
  syncMeta!: Table<SyncMetadata, string>;

  constructor() {
    super('kgc-erp');

    this.version(1).stores({
      customers: 'id, name, phone, tenant_id, updatedAt',
      products: 'id, sku, name, category, tenant_id, updatedAt',
      rentalEquip: 'id, productId, status, tenant_id',
      pendingSync: 'id, entity, action, timestamp, status',
      syncMeta: 'key'
    });
  }
}

export const db = new KgcDatabase();
```

---

## Cache Stratégiák (Workbox)

```
┌────────────────────────────────────────────────────────────────┐
│                   🔧 CACHE STRATÉGIÁK                          │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Workbox Stratégiák típusonként:                               │
│                                                                │
│  🔵 CacheFirst         - Statikus tartalom (cikkek, képek)    │
│     └─ Cache-ből, ha van; különben hálózat                    │
│                                                                │
│  🟢 StaleWhileRevalidate - Ügyfelek, termékek                 │
│     └─ Cache-ből azonnal, háttérben frissít                   │
│                                                                │
│  🟠 NetworkFirst       - Írás műveletek (CREATE/UPDATE)       │
│     └─ Hálózat először; ha nincs: queue-ba                    │
│                                                                │
│  🔴 NetworkOnly        - NAV számlázás, fizetés               │
│     └─ Kizárólag online (nincs offline fallback)              │
│                                                                │
│  ⏱️ Background Sync    - 24 óra retention                     │
│     └─ Ennyi ideig próbálkozik újra                           │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### Workbox Konfiguráció

```javascript
// vite.config.ts - Workbox plugin
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      workbox: {
        runtimeCaching: [
          {
            urlPattern: /\/api\/products/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'products-cache',
              expiration: { maxEntries: 1000, maxAgeSeconds: 86400 }
            }
          },
          {
            urlPattern: /\/api\/customers/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'customers-cache',
              expiration: { maxEntries: 5000, maxAgeSeconds: 3600 }
            }
          },
          {
            urlPattern: /\/api\/(rentals|sales|services)/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'transactions-cache',
              networkTimeoutSeconds: 10,
              plugins: [bgSyncPlugin]
            }
          },
          {
            urlPattern: /\/api\/nav/,
            handler: 'NetworkOnly'
          }
        ]
      }
    })
  ]
});
```

---

## UI Állapot Jelzések

| Állapot | Ikon | Szín | Jelentés |
|---------|------|------|----------|
| Online + szinkron | ✅ | Zöld | Minden rendben, adatok szinkronban |
| Online + pending | ⏳ | Sárga | Online, de vannak várakozó műveletek |
| Offline + működik | 📴 | Szürke | Offline mód, lokális adatokkal dolgozik |
| Offline + pending | 📴⏳ | Narancs | Offline, várakozó műveletek gyűlnek |
| Szinkronizálás | 🔄 | Kék | Aktív szinkronizáció folyamatban |
| Hiba | ❌ | Piros | Szinkronizációs hiba (retry szükséges) |

### React Komponens Példa

```tsx
function SyncStatusBadge() {
  const { isOnline, pendingCount, isSyncing } = useSyncStatus();

  if (isSyncing) {
    return <Badge color="blue" icon={<SyncIcon spin />}>Szinkronizálás...</Badge>;
  }

  if (!isOnline) {
    return <Badge color="orange" icon={<OfflineIcon />}>
      Offline {pendingCount > 0 && `(${pendingCount} várakozik)`}
    </Badge>;
  }

  if (pendingCount > 0) {
    return <Badge color="yellow" icon={<ClockIcon />}>
      {pendingCount} szinkronra vár
    </Badge>;
  }

  return <Badge color="green" icon={<CheckIcon />}>Szinkronban</Badge>;
}
```

---

## Kapcsolódó Dokumentumok

- [ADR-002: Deployment & Offline Strategy](../architecture/ADR-002-deployment-offline-strategy.md)
- [KGC Rendszer Architektúra](kgc-system-architecture.md)
- [PRD v1.1](../prd.md) - 2.2 Offline működés követelmények

---

## Változásnapló

| Dátum | Verzió | Változás |
|-------|--------|----------|
| 2025-12-03 | 1.0 | Dokumentáció létrehozása |
