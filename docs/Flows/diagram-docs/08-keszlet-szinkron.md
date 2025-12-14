# KGC ERP - Készlet Szinkronizáció

## Diagram Információk

| Tulajdonság | Érték |
|-------------|-------|
| **Fájlnév** | 8-keszlet-szinkron.excalidraw |
| **Típus** | Architektúra + Folyamatábra |
| **Kategória** | 8. Új Követelmények |
| **Modul** | Készlet / Webshop |
| **Verzió** | KGC ERP v2 |
| **Forrás** | Zsuzsa jegyzetei: "A honlapnak ismernie kell a teljes országos készletet, és a vevő keresésekor meg kell jelennie, hogy mely boltokban érhető el az adott gép" |

---

## Áttekintés

A készlet szinkronizáció biztosítja, hogy:
1. A **webshop** valós időben lássa az összes bolt készletét
2. A **vevő** tudja, hol érhető el a keresett termék
3. A **központ** aggregált statisztikákat lásson
4. A **franchise partnerek** maguk döntsenek a készlet megosztásról

---

## Architektúra Áttekintés

```
                           ┌─────────────────────────────┐
                           │     🌐 WEBSHOP              │
                           │   (Vevő böngész)            │
                           └──────────────┬──────────────┘
                                          │ API
                                          ▼
                           ┌─────────────────────────────┐
                           │  🏢 KÖZPONTI KÉSZLET NÉZET  │
                           │  (Aggregált View)           │
                           │                             │
                           │  • Valós idejű frissítés    │
                           │  • Minden bolt összesítve   │
                           └──────────────┬──────────────┘
                                          │
                    ┌─────────────────────┼─────────────────────┐
                    │                     │                     │
                    ▼                     ▼                     ▼
           ┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐
           │  🏪 KGC Központ │   │  🏪 Franchise 1 │   │  🏪 Franchise N │
           │  tenant: KGC-01 │   │  tenant: FRAN-01│   │  tenant: FRAN-N │
           │  Készlet: 150 db│   │  Készlet: 45 db │   │  Készlet: 30 db │
           └─────────────────┘   └─────────────────┘   └─────────────────┘
```

---

## Vevői Élmény

### Keresés a Webshopban

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            🔍 TERMÉK KERESÉS                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Keresés: [Makita fúrógép________________] [🔍 Keresés]                     │
│                                                                              │
│  ═══════════════════════════════════════════════════════════════════════   │
│                                                                              │
│  📦 Makita DHP453 Akkus ütvefúró-csavarozó                                  │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                              │
│  [📷 Kép]    Ár: 89.900 Ft                                                  │
│              ⭐⭐⭐⭐⭐ (23 értékelés)                                       │
│                                                                              │
│              📍 ELÉRHETŐSÉG:                                                 │
│              ┌────────────────────────────────────────────────────────────┐ │
│              │ ✅ KGC Központ (Budapest)         3 db   [🛒 Kosárba]      │ │
│              │ ✅ Franchise Szeged               1 db   [🛒 Kosárba]      │ │
│              │ ❌ Franchise Debrecen             0 db   [📧 Értesítés]    │ │
│              │ ✅ Franchise Győr                 2 db   [🛒 Kosárba]      │ │
│              └────────────────────────────────────────────────────────────┘ │
│                                                                              │
│              🚚 Szállítás: 1-2 munkanap a kiválasztott boltból              │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Foglalás Folyamat

```
┌─────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ Keresés │────▶│ Bolt választ│────▶│  Foglalás   │────▶│ Visszajelzés│
└─────────┘     └─────────────┘     └─────────────┘     └─────────────┘
                                           │
                                           ▼
                                    ┌─────────────┐
                                    │ Készlet -1  │
                                    │ Foglalt +1  │
                                    └─────────────┘
```

---

## Adatmodell

### KÉSZLET_AGGREGÁLT View

```sql
CREATE VIEW keszlet_aggregalt AS
SELECT
    c.cikk_id,
    c.nev AS cikk_nev,
    c.cikkszam,
    c.kategoria,
    t.tenant_id,
    t.nev AS bolt_nev,
    t.varos,
    t.cim,
    t.telefon,
    t.nyitvatartas,
    COALESCE(k.mennyiseg, 0) AS keszlet,
    COALESCE(k.foglalt, 0) AS foglalt,
    COALESCE(k.mennyiseg, 0) - COALESCE(k.foglalt, 0) AS elerheto,
    k.utolso_frissites
FROM cikk c
CROSS JOIN tenant t
LEFT JOIN keszlet k ON k.cikk_id = c.cikk_id
                   AND k.tenant_id = t.tenant_id
WHERE t.aktiv = true
  AND t.keszlet_publikus = true
  AND c.aktiv = true;
```

### TENANT Bővítés

```sql
ALTER TABLE tenant ADD COLUMN keszlet_publikus BOOLEAN DEFAULT true;
ALTER TABLE tenant ADD COLUMN varos VARCHAR(100);
ALTER TABLE tenant ADD COLUMN cim TEXT;
ALTER TABLE tenant ADD COLUMN telefon VARCHAR(50);
ALTER TABLE tenant ADD COLUMN nyitvatartas JSONB;
ALTER TABLE tenant ADD COLUMN gps_lat DECIMAL(10,8);
ALTER TABLE tenant ADD COLUMN gps_lon DECIMAL(11,8);
```

### FOGLALÁS Entitás

```sql
CREATE TABLE foglalas (
    foglalas_id         SERIAL PRIMARY KEY,
    cikk_id             INTEGER REFERENCES cikk(cikk_id),
    tenant_id           UUID NOT NULL,
    mennyiseg           INTEGER NOT NULL,
    vevo_nev            VARCHAR(200),
    vevo_email          VARCHAR(200),
    vevo_telefon        VARCHAR(50),
    statusz             VARCHAR(30) NOT NULL,  -- aktiv/atvett/lejart/torolt
    letrehozva          TIMESTAMP DEFAULT NOW(),
    ervenyes_ig         TIMESTAMP NOT NULL,    -- Meddig érvényes
    atveve              TIMESTAMP,
    created_at          TIMESTAMP DEFAULT NOW()
);
```

### Foglalás Státuszok

| Státusz | Leírás |
|---------|--------|
| `aktiv` | Foglalás él, készlet blokkolva |
| `atvett` | Vevő átvette a terméket |
| `lejart` | Nem vette át időben, készlet felszabadult |
| `torolt` | Vevő lemondta |

---

## API Endpoints

### Készlet Lekérdezés

```
GET /api/v1/products/{cikkszam}/availability

Response:
{
  "cikkszam": "MAK-DHP453",
  "nev": "Makita DHP453 Akkus ütvefúró",
  "kategoria": "Elektromos kéziszerszám",
  "locations": [
    {
      "tenant_id": "KGC-01",
      "bolt": "KGC Központ",
      "varos": "Budapest",
      "cim": "Fő utca 1.",
      "telefon": "+36 1 234 5678",
      "elerheto": 3,
      "nyitvatartas": {
        "hetfo": "07:00-16:00",
        "kedd": "07:00-16:00",
        ...
      },
      "tavolsag_km": 5.2  // Ha vevő megadta lokációját
    },
    {
      "tenant_id": "FRAN-01",
      "bolt": "Franchise Szeged",
      "varos": "Szeged",
      "cim": "Kossuth tér 5.",
      "elerheto": 1,
      ...
    }
  ],
  "osszes_elerheto": 4
}
```

### Foglalás Létrehozás

```
POST /api/v1/reservations

Request:
{
  "cikk_id": 1234,
  "tenant_id": "KGC-01",
  "mennyiseg": 1,
  "vevo": {
    "nev": "Kovács János",
    "email": "kovacs@email.hu",
    "telefon": "+36 30 123 4567"
  }
}

Response:
{
  "foglalas_id": 5678,
  "statusz": "aktiv",
  "ervenyes_ig": "2024-01-20T18:00:00Z",
  "atveheto": {
    "bolt": "KGC Központ",
    "cim": "Budapest, Fő utca 1."
  }
}
```

---

## Szinkronizációs Folyamat

### Event-Driven Frissítés

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     KÉSZLET VÁLTOZÁS SZINKRONIZÁCIÓ                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  1. TRIGGER AKTIVÁLÓDIK                                                     │
│     └─ Készlet változás történt (bevételezés, eladás, bérlés, visszavét)   │
│                                                                              │
│  2. POSTGRES TRIGGER                                                        │
│     └─ AFTER INSERT/UPDATE/DELETE ON keszlet                               │
│     └─ NOTIFY keszlet_change, '{cikk_id, tenant_id, uj_mennyiseg}'         │
│                                                                              │
│  3. BACKEND LISTENER                                                        │
│     └─ Node.js figyeli a NOTIFY-t                                          │
│     └─ Redis pub/sub üzenet küldése                                        │
│                                                                              │
│  4. CACHE INVALIDÁCIÓ                                                       │
│     └─ Redis cache törlése az érintett cikkre                              │
│     └─ CDN cache invalidáció (Cloudflare API)                              │
│                                                                              │
│  5. REAL-TIME PUSH                                                          │
│     └─ WebSocket üzenet az aktív böngészőknek                              │
│     └─ "Készlet frissült" vizuális jelzés                                  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### PostgreSQL Trigger

```sql
CREATE OR REPLACE FUNCTION notify_keszlet_change()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM pg_notify(
        'keszlet_change',
        json_build_object(
            'cikk_id', COALESCE(NEW.cikk_id, OLD.cikk_id),
            'tenant_id', COALESCE(NEW.tenant_id, OLD.tenant_id),
            'operation', TG_OP,
            'mennyiseg', NEW.mennyiseg,
            'timestamp', NOW()
        )::text
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER keszlet_change_trigger
AFTER INSERT OR UPDATE OR DELETE ON keszlet
FOR EACH ROW EXECUTE FUNCTION notify_keszlet_change();
```

### Node.js Listener

```typescript
import { Client } from 'pg';
import Redis from 'ioredis';

const pgClient = new Client();
const redis = new Redis();

await pgClient.connect();
await pgClient.query('LISTEN keszlet_change');

pgClient.on('notification', async (msg) => {
  const data = JSON.parse(msg.payload);

  // 1. Cache invalidáció
  await redis.del(`keszlet:${data.cikk_id}`);

  // 2. Pub/Sub üzenet
  await redis.publish('keszlet-updates', JSON.stringify(data));

  // 3. WebSocket broadcast
  io.to(`cikk:${data.cikk_id}`).emit('keszlet-update', data);
});
```

---

## Adatvédelmi Szabályok

### Mi Látható Kinek?

| Adat | Vevő (Webshop) | Franchise | Központ |
|------|----------------|-----------|---------|
| Készlet mennyiség | ✅ (ha publikus) | ✅ Saját | ✅ Összes |
| Bolt neve, címe | ✅ | ✅ | ✅ |
| Eladási ár | ✅ (ha egységes) | ✅ Saját | ✅ Összes |
| Beszerzési ár | ❌ | ✅ Saját | ✅ Összes |
| Árrés, profit | ❌ | ✅ Saját | ❌ (Franchise) |
| Pénzügyi adatok | ❌ | ✅ Saját | ❌ |

### Franchise Beállítások

```sql
-- Franchise partner dönthet a megosztásról
UPDATE tenant
SET keszlet_publikus = true  -- vagy false
WHERE tenant_id = 'FRAN-01';
```

---

## Minimum Készlet és Automatikus Rendelés

### CIKK Bővítés

```sql
ALTER TABLE cikk ADD COLUMN min_keszlet INTEGER DEFAULT 0;
ALTER TABLE cikk ADD COLUMN rendelesi_pont INTEGER DEFAULT 0;
ALTER TABLE cikk ADD COLUMN auto_rendeles BOOLEAN DEFAULT false;
ALTER TABLE cikk ADD COLUMN alapertelmezett_beszallito_id INTEGER;
```

### Automatikus Rendelés Trigger

```sql
CREATE OR REPLACE FUNCTION check_min_keszlet()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.mennyiseg <= (
        SELECT rendelesi_pont FROM cikk WHERE cikk_id = NEW.cikk_id
    ) THEN
        INSERT INTO rendeles_javaslat (
            cikk_id, tenant_id, javasolt_mennyiseg, ok
        ) VALUES (
            NEW.cikk_id,
            NEW.tenant_id,
            (SELECT min_keszlet FROM cikk WHERE cikk_id = NEW.cikk_id) - NEW.mennyiseg,
            'Készlet a rendelési pont alatt'
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

---

## Teljesítmény Optimalizálás

### Indexek

```sql
-- Gyors keresés cikkszám alapján
CREATE INDEX idx_keszlet_cikk ON keszlet(cikk_id);

-- Tenant szűrés
CREATE INDEX idx_keszlet_tenant ON keszlet(tenant_id);

-- Kombinált index a view-hoz
CREATE INDEX idx_keszlet_cikk_tenant ON keszlet(cikk_id, tenant_id);

-- Készlet szűrés (csak ahol van)
CREATE INDEX idx_keszlet_mennyiseg ON keszlet(mennyiseg) WHERE mennyiseg > 0;
```

### Cache Stratégia

| Adat | TTL | Invalidáció |
|------|-----|-------------|
| Cikk alapadatok | 1 óra | Cikk módosításkor |
| Készlet adatok | 30 sec | Minden változáskor |
| Bolt adatok | 1 nap | Bolt módosításkor |
| Aggregált lista | 1 perc | Bármely változáskor |

---

## Kapcsolódó Dokumentumok

- [02-ertekesites-erd.md](02-ertekesites-erd.md) - CIKK, KÉSZLET entitások
- [07-erd-uj-entitasok.md](07-erd-uj-entitasok.md) - FRANCHISE_PARTNER
- [08-holding-struktura.md](08-holding-struktura.md) - Tenant hierarchia
- [08-deployment-architektura.md](08-deployment-architektura.md) - Infrastruktúra

---

## Jelmagyarázat

| Szimbólum | Jelentés |
|-----------|----------|
| 🏢 | Központi nézet |
| 🏪 | Bolt / Franchise |
| 🌐 | Webshop |
| 👤 | Vevő |
| ✅ | Elérhető |
| ❌ | Nem elérhető |
| 📍 | Lokáció |
| 🔄 | Szinkronizáció |
