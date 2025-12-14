# KGC ERP - Új Entitások (7. rész)

## Diagram Információk

| Tulajdonság | Érték |
|-------------|-------|
| **Fájlnév** | 7-erd-uj-entitasok.excalidraw |
| **Típus** | ERD (Entity-Relationship Diagram) |
| **Kategória** | 7. Új Funkciók |
| **Modul** | Adatmodell bővítés |
| **Verzió** | KGC ERP v2 |

---

## Áttekintés

A 7. rész 5 új entitást vezet be a KGC ERP rendszerbe, amelyek új funkcionalitásokat támogatnak: automatikus értesítések, munka-gép kapcsolatok, karbantartási útmutatók, franchise partnerek és árrés kategóriák.

---

## Entitás Áttekintés

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                         KGC ERP - ÚJ ENTITÁSOK (7. rész)                      │
│                       Entity-Relationship Diagram - 5 új entitás              │
└──────────────────────────────────────────────────────────────────────────────┘

    ┌─────────────────┐     ┌─────────────────────────┐     ┌────────────────────────┐
    │                 │     │                         │     │                        │
    │   📧 ÉRTESÍTÉS  │     │  🔧 MUNKA_GÉP_KAPCSOLAT │     │ 📖 KARBANTARTÁS_ÚTMUTATÓ│
    │                 │     │                         │     │                        │
    └────────┬────────┘     └────────────┬────────────┘     └────────────────────────┘
             │                           │
             │                           │
             ▼                           ▼
    ┌─────────────────┐        ┌─────────────────┐
    │  👤 PARTNER     │        │   📦 CIKK       │
    │   (meglévő)     │        │   (meglévő)     │
    └─────────────────┘        └─────────────────┘

    ┌─────────────────────────┐     ┌─────────────────────────┐
    │                         │     │                         │
    │   🏪 FRANCHISE_PARTNER  │     │   💰 ÁRRÉS_KATEGÓRIA    │
    │                         │     │                         │
    └─────────────────────────┘     └─────────────────────────┘
```

---

## 1. ÉRTESÍTÉS Entitás

### Leírás
Az automatikus értesítések tárolására szolgáló entitás. Támogatja az SMS és Email csatornákat, valamint különböző értesítési típusokat.

### Séma

```sql
CREATE TABLE ertesites (
    ertesites_id    SERIAL PRIMARY KEY,
    tenant_id       UUID NOT NULL,           -- ADR-001
    tipus           VARCHAR(50) NOT NULL,
    ugyfél_id       INTEGER REFERENCES partner(partner_id),
    csatorna        VARCHAR(20) NOT NULL,
    tartalom        TEXT NOT NULL,
    kuldve          TIMESTAMP,
    statusz         VARCHAR(30) NOT NULL,
    hiba_uzenet     TEXT,
    offline_sync    BOOLEAN DEFAULT FALSE,   -- ADR-002
    created_at      TIMESTAMP DEFAULT NOW(),
    updated_at      TIMESTAMP DEFAULT NOW()
);
```

### Mezők

| Mező | Típus | Leírás | Kötelező |
|------|-------|--------|----------|
| `ertesites_id` | INT (PK) | Egyedi azonosító | ✅ |
| `tenant_id` | UUID (FK) | Multi-tenant azonosító (ADR-001) | ✅ |
| `tipus` | ENUM | Értesítés típusa | ✅ |
| `ugyfél_id` | INT (FK) | Partner hivatkozás | ✅ |
| `csatorna` | ENUM | Kommunikációs csatorna | ✅ |
| `tartalom` | TEXT | Üzenet tartalma | ✅ |
| `kuldve` | DATETIME | Küldés időpontja | ❌ |
| `statusz` | ENUM | Küldés státusza | ✅ |
| `hiba_uzenet` | TEXT | Hiba esetén részletek | ❌ |
| `offline_sync` | BOOLEAN | Offline sync flag (ADR-002) | ✅ |

### Tipus Értékek

| Érték | Leírás |
|-------|--------|
| `rendelés_beérkezett` | Megrendelt áru megérkezett |
| `fizetési_emlékeztető` | Lejárt számla emlékeztető |
| `lejárat_közeleg` | Bérlés lejárat előtt 1 nap |
| `tartozás` | Lejárt tartozás értesítés |

### Csatorna Értékek

| Érték | Leírás |
|-------|--------|
| `sms` | SMS üzenet (Twilio/Nexmo) |
| `email` | Email üzenet (SendGrid/SMTP) |

### Státusz Értékek

| Érték | Leírás |
|-------|--------|
| `pending` | Várakozik küldésre |
| `küldött` | Sikeresen elküldve |
| `kézbesített` | Kézbesítés megerősítve |
| `hiba` | Sikertelen küldés |

### Kapcsolatok

```
ÉRTESÍTÉS ────────────────▶ PARTNER
          ugyfél_id (FK)     partner_id (PK)
          N:1 kapcsolat
```

---

## 2. MUNKA_GÉP_KAPCSOLAT Entitás

### Leírás
A munkák és gépek közötti kapcsolatot definiálja, meghatározva mely gépek alkalmasak mely munkákra. Ez támogatja a gép ajánlást a bérlési folyamatban.

### Séma

```sql
CREATE TABLE munka_gep_kapcsolat (
    munka_id        SERIAL PRIMARY KEY,
    tenant_id       UUID NOT NULL,           -- ADR-001
    munka_nev       VARCHAR(200) NOT NULL,
    gep_id          INTEGER REFERENCES cikk(cikk_id),
    prioritas       INTEGER CHECK (prioritas BETWEEN 1 AND 10),
    alkalmas        BOOLEAN DEFAULT TRUE,
    offline_sync    BOOLEAN DEFAULT FALSE,   -- ADR-002
    created_at      TIMESTAMP DEFAULT NOW()
);
```

### Mezők

| Mező | Típus | Leírás | Kötelező |
|------|-------|--------|----------|
| `munka_id` | INT (PK) | Egyedi azonosító | ✅ |
| `tenant_id` | UUID (FK) | Multi-tenant azonosító | ✅ |
| `munka_nev` | VARCHAR | Munka megnevezése | ✅ |
| `gep_id` | INT (FK) | Cikk (gép) hivatkozás | ✅ |
| `prioritas` | INT | Ajánlási sorrend (1-10) | ❌ |
| `alkalmas` | BOOLEAN | Gép alkalmas a munkára | ✅ |

### Munka Példák

| Munka Név | Alkalmas Gépek |
|-----------|----------------|
| `téglafal fúrása` | Fúrógép, Ütvefúró |
| `fűnyírás` | Fűnyíró, Fűkasza |
| `beton vágás` | Betonvágó, Sarokcsiszoló |
| `faágak vágása` | Láncfűrész, Ágvágó |
| `csempe vágás` | Csempevágó, Flex |

### Kapcsolatok

```
MUNKA_GÉP_KAPCSOLAT ────────────────▶ CIKK
                    gep_id (FK)        cikk_id (PK)
                    N:1 kapcsolat
```

---

## 3. KARBANTARTÁS_ÚTMUTATÓ Entitás

### Leírás
Géptípusokhoz tartozó karbantartási útmutatók tárolása. Tartalmazza a szezonális (téli, nyári) és hosszú távú tárolási instrukciókat.

### Séma

```sql
CREATE TABLE karbantartas_utmutato (
    utmutato_id     SERIAL PRIMARY KEY,
    tenant_id       UUID NOT NULL,           -- ADR-001
    geptipus        VARCHAR(200) NOT NULL,
    idoszak         VARCHAR(50) NOT NULL,
    lepesek         JSONB NOT NULL,
    kepek           JSONB,
    video_url       VARCHAR(500),
    offline_sync    BOOLEAN DEFAULT FALSE,   -- ADR-002
    created_at      TIMESTAMP DEFAULT NOW(),
    updated_at      TIMESTAMP DEFAULT NOW()
);
```

### Mezők

| Mező | Típus | Leírás | Kötelező |
|------|-------|--------|----------|
| `utmutato_id` | INT (PK) | Egyedi azonosító | ✅ |
| `tenant_id` | UUID (FK) | Multi-tenant azonosító | ✅ |
| `geptipus` | VARCHAR | Gép típus megnevezése | ✅ |
| `idoszak` | ENUM | Karbantartási időszak | ✅ |
| `lepesek` | JSON | Karbantartási lépések | ✅ |
| `kepek` | JSON | Illusztrációs képek | ❌ |
| `video_url` | VARCHAR | Oktatóvideó URL | ❌ |

### Időszak Értékek

| Érték | Leírás |
|-------|--------|
| `téli` | Téli tárolás előtti karbantartás |
| `nyári` | Szezon eleji előkészítés |
| `hosszú_távú` | Hosszú tárolás előtti teendők |

### JSON Struktúra - Lépések

```json
{
  "lepesek": [
    {
      "sorszam": 1,
      "leiras": "Üzemanyag leengedése",
      "figyelmeztetés": "Tűzveszélyes!"
    },
    {
      "sorszam": 2,
      "leiras": "Olajcsere elvégzése",
      "szükséges_anyag": "SAE 30 olaj"
    },
    {
      "sorszam": 3,
      "leiras": "Légszűrő tisztítása/cseréje"
    }
  ]
}
```

---

## 4. FRANCHISE_PARTNER Entitás

### Leírás
Franchise partnerek kezelése a multi-tenant rendszerben. Különböző csomagok (kölcsönző, szerviz, komplett) és jogosultságok definiálása.

### Séma

```sql
CREATE TABLE franchise_partner (
    partner_id          SERIAL PRIMARY KEY,
    tenant_id           UUID NOT NULL UNIQUE,    -- ADR-001
    nev                 VARCHAR(200) NOT NULL,
    csomag              VARCHAR(50) NOT NULL,
    telephelyek         JSONB,
    jogosultsagok       JSONB,
    statisztika_lathato BOOLEAN DEFAULT FALSE,
    aktiv               BOOLEAN DEFAULT TRUE,
    szerzodes_kezdet    DATE NOT NULL,
    szerzodes_veg       DATE,
    created_at          TIMESTAMP DEFAULT NOW(),
    updated_at          TIMESTAMP DEFAULT NOW()
);
```

### Mezők

| Mező | Típus | Leírás | Kötelező |
|------|-------|--------|----------|
| `partner_id` | INT (PK) | Egyedi azonosító | ✅ |
| `tenant_id` | UUID (FK) | Tenant azonosító (egyedi) | ✅ |
| `nev` | VARCHAR | Partner neve | ✅ |
| `csomag` | ENUM | Előfizetési csomag | ✅ |
| `telephelyek` | JSON | Telephelyek listája | ❌ |
| `jogosultsagok` | JSON | Speciális jogosultságok | ❌ |
| `statisztika_lathato` | BOOLEAN | Központi statisztikák láthatósága | ✅ |
| `aktiv` | BOOLEAN | Aktív státusz | ✅ |
| `szerzodes_kezdet` | DATE | Szerződés kezdete | ✅ |
| `szerzodes_veg` | DATE | Szerződés vége | ❌ |

### Csomag Értékek

| Érték | Leírás | Funkciók |
|-------|--------|----------|
| `kölcsönző` | Csak bérlés modul | Bérlés, Készlet |
| `szerviz` | Csak szerviz modul | Szerviz, Munkalap |
| `komplett` | Teljes rendszer | Minden modul |

### JSON Struktúra - Telephelyek

```json
{
  "telephelyek": [
    {
      "nev": "Központi telephely",
      "cim": "1234 Budapest, Fő utca 1.",
      "telefon": "+36 1 234 5678",
      "fo_telephely": true
    },
    {
      "nev": "Fiók",
      "cim": "5678 Szeged, Mellék utca 2.",
      "telefon": "+36 62 123 456",
      "fo_telephely": false
    }
  ]
}
```

---

## 5. ÁRRÉS_KATEGÓRIA Entitás

### Leírás
Cikkcsoportokhoz rendelt árrés szabályok az automatikus árazáshoz. Alap, minimum és maximum árrés százalékok definiálása.

### Séma

```sql
CREATE TABLE arres_kategoria (
    kategoria_id    SERIAL PRIMARY KEY,
    tenant_id       UUID NOT NULL,           -- ADR-001
    cikkcsoport     VARCHAR(100) NOT NULL,
    arres_szazalek  DECIMAL(5,2) NOT NULL,
    min_arres       DECIMAL(5,2) NOT NULL,
    max_arres       DECIMAL(5,2) NOT NULL,
    aktiv           BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMP DEFAULT NOW(),
    updated_at      TIMESTAMP DEFAULT NOW(),

    UNIQUE(tenant_id, cikkcsoport)
);
```

### Mezők

| Mező | Típus | Leírás | Kötelező |
|------|-------|--------|----------|
| `kategoria_id` | INT (PK) | Egyedi azonosító | ✅ |
| `tenant_id` | UUID (FK) | Multi-tenant azonosító | ✅ |
| `cikkcsoport` | VARCHAR (FK) | Cikkcsoport hivatkozás | ✅ |
| `arres_szazalek` | DECIMAL | Alap árrés % | ✅ |
| `min_arres` | DECIMAL | Minimum árrés % | ✅ |
| `max_arres` | DECIMAL | Maximum árrés % | ✅ |
| `aktiv` | BOOLEAN | Aktív státusz | ✅ |

### Alapértelmezett Értékek

| Cikkcsoport | Alap % | Min % | Max % |
|-------------|--------|-------|-------|
| Alkatrész | 35% | 25% | 50% |
| Kisgép | 25% | 15% | 40% |
| Nagykerti gép | 20% | 10% | 30% |
| Fogyóanyag | 50% | 35% | 80% |
| Szolgáltatás | 40% | 30% | 60% |

---

## Kapcsolati Diagram

```
                           ┌─────────────────────┐
                           │                     │
                           │     TENANT (RLS)    │
                           │                     │
                           └──────────┬──────────┘
                                      │
           ┌──────────────────────────┼──────────────────────────┐
           │                          │                          │
           ▼                          ▼                          ▼
    ┌─────────────┐           ┌─────────────┐           ┌─────────────┐
    │  ÉRTESÍTÉS  │           │  FRANCHISE  │           │    ÁRRÉS    │
    │             │           │   PARTNER   │           │  KATEGÓRIA  │
    └──────┬──────┘           └─────────────┘           └──────┬──────┘
           │                                                    │
           │ ugyfél_id                                   cikkcsoport
           ▼                                                    ▼
    ┌─────────────┐                                     ┌─────────────┐
    │   PARTNER   │                                     │ CIKKCSOPORT │
    │  (meglévő)  │                                     │  (meglévő)  │
    └─────────────┘                                     └─────────────┘
                                                               │
                                                               ▼
    ┌─────────────┐                                     ┌─────────────┐
    │   MUNKA_    │         gep_id                      │    CIKK     │
    │    GÉP      │─────────────────────────────────────│  (meglévő)  │
    │  KAPCSOLAT  │                                     └─────────────┘
    └─────────────┘

    ┌─────────────┐
    │KARBANTARTÁS │
    │   ÚTMUTATÓ  │
    └─────────────┘
```

---

## Multi-Tenant Megjegyzés (ADR-001)

```
┌─────────────────────────────────────────────────────────────────┐
│              🏢 MULTI-TENANT MEGJEGYZÉS (ADR-001)                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Minden új entitás tartalmaz tenant_id mezőt a multi-tenant     │
│  elkülönítéshez.                                                │
│                                                                  │
│  Row Level Security (RLS) a PostgreSQL-ben biztosítja az        │
│  adatizolációt.                                                 │
│                                                                  │
│  A Franchise_Partner.tenant_id kötelező, más entitások          │
│  központi vagy franchise kontextusban is működhetnek.           │
│                                                                  │
│  RLS Policy példa:                                              │
│  ─────────────────                                              │
│  CREATE POLICY tenant_isolation ON ertesites                    │
│    USING (tenant_id = current_setting('app.tenant_id')::uuid); │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 6. Holding Kapcsolat (8. rész bővítés) 🆕

### FRANCHISE_PARTNER Bővítés

A 8. részben bevezetett Holding struktúra miatt a FRANCHISE_PARTNER entitás bővül:

```sql
-- 8. rész bővítés
ALTER TABLE franchise_partner ADD COLUMN holding_id INTEGER REFERENCES holding(holding_id);
```

### Új Kapcsolat

```
┌─────────────────────────────────────────────────────────────────┐
│                    HOLDING HIERARCHIA                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│                      ┌─────────────────┐                        │
│                      │     HOLDING     │  (8. rész új entitás)  │
│                      │  🏢 KGC Holding  │                        │
│                      └────────┬────────┘                        │
│                               │ 1:N                             │
│               ┌───────────────┼───────────────┐                 │
│               │               │               │                 │
│               ▼               ▼               ▼                 │
│     ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │
│     │ FRANCHISE   │  │ FRANCHISE   │  │ FRANCHISE   │          │
│     │  PARTNER    │  │  PARTNER    │  │  PARTNER    │          │
│     │ (KGC-01)    │  │ (FRAN-01)   │  │ (FRAN-02)   │          │
│     └─────────────┘  └─────────────┘  └─────────────┘          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Új Mező

| Mező | Típus | Leírás |
|------|-------|--------|
| `holding_id` | INT (FK) | Holding hivatkozás (opcionális) |

> Részletes Holding struktúra: [08-holding-struktura.md](08-holding-struktura.md)

---

## Kapcsolódó Dokumentumok

- [07-ertesitesek-folyamat.md](07-ertesitesek-folyamat.md) - ÉRTESÍTÉS használata
- [07-arrazas-automatizalas.md](07-arrazas-automatizalas.md) - ÁRRÉS_KATEGÓRIA használata
- [01-ugyfelfelvitel-erd.md](01-ugyfelfelvitel-erd.md) - PARTNER entitás
- [02-ertekesites-erd.md](02-ertekesites-erd.md) - CIKK, CIKKCSOPORT entitások
- [08-holding-struktura.md](08-holding-struktura.md) - Holding struktúra részletek 🆕

---

## Jelmagyarázat

| Szimbólum | Jelentés |
|-----------|----------|
| 🔑 | Primary Key (PK) |
| FK | Foreign Key |
| 📧 | Értesítés entitás |
| 🔧 | Munka-gép kapcsolat |
| 📖 | Karbantartás útmutató |
| 🏪 | Franchise partner |
| 💰 | Árrés kategória |
| 🏢 | Holding (8. rész) 🆕 |
| 👤 | Partner (meglévő) |
| 📦 | Cikk (meglévő) |
| Színes | Új entitás |
| Szürke | Meglévő referencia |
