# KGC ERP - Garanciális Javítás

## Diagram Információk

| Tulajdonság | Érték |
|-------------|-------|
| **Fájlnév** | 8-garancialis-javitas.excalidraw |
| **Típus** | Folyamatábra + ERD |
| **Kategória** | 8. Új Követelmények |
| **Modul** | Szerviz |
| **Verzió** | KGC ERP v2 |
| **Forrás** | Zsuzsa jegyzetei: "Garanciális javítások elszámolása (Makita: norma alapján, más cégeknél egyedi elbírálás)" |

---

## Áttekintés

A garanciális javítások kezelése két fő típusra oszlik:
1. **Norma rendszer** (pl. Makita) - Fix munkadíjak és alkatrészárak hibakód alapján
2. **Egyedi elbírálás** - Árajánlat alapú, gyártói jóváhagyással

---

## Folyamatábra

```
                              ┌─────────────┐
                              │ Gép behozás │
                              │ szervizbe   │
                              └──────┬──────┘
                                     │
                                     ▼
                              ┌─────────────┐
                              │ Garanciális │
                              │  javítás?   │
                              └──────┬──────┘
                               ┌─────┴─────┐
                               │           │
                              NEM        IGEN
                               │           │
                               ▼           ▼
                        ┌──────────┐ ┌─────────────┐
                        │ Normál   │ │  Gyártó     │
                        │ szerviz  │ │  típusa?    │
                        │ folyamat │ └──────┬──────┘
                        └──────────┘   ┌────┴────┐
                                       │         │
                                    MAKITA    EGYÉB
                                       │         │
                    ┌──────────────────┘         └──────────────────┐
                    │                                               │
                    ▼                                               ▼
    ┌───────────────────────────────┐           ┌───────────────────────────────┐
    │    🔴 MAKITA NORMA RENDSZER   │           │     🟣 EGYEDI ELBÍRÁLÁS       │
    ├───────────────────────────────┤           ├───────────────────────────────┤
    │                               │           │                               │
    │ 1. Hibakód kiválasztás        │           │ 1. Részletes diagnosztika     │
    │    (M-001, M-002, stb.)       │           │    + Fotó dokumentáció        │
    │                               │           │                               │
    │ 2. Norma táblázat lekérés     │           │ 2. Árajánlat készítés         │
    │    • Fix munkadíj             │           │    • Becsült munkadíj         │
    │    • Alkatrész lista ár       │           │    • Alkatrész árak           │
    │    • Max javítási idő         │           │                               │
    │                               │           │ 3. Gyártónak küldés           │
    │ 3. Javítás elvégzése          │           │    → Email / Portál           │
    │                               │           │    → Jóváhagyás várása        │
    │ 4. Garancia claim benyújtás   │           │                               │
    │    → Makita online portál     │           │ 4. Javítás (ha jóváhagyva)    │
    │    → Automatikus kitöltés     │           │                               │
    │                               │           │ 5. Egyedi elszámolás          │
    │ 5. Jóváírás érkezése          │           │    → Lehet részleges is       │
    │    → Átutalás a cégnél        │           │                               │
    └───────────────────────────────┘           └───────────────────────────────┘
```

---

## 1. Makita Norma Rendszer

### Működési Elv

A Makita (és más nagy gyártók) norma rendszert használnak, ahol minden hibatípushoz **fix díjak** tartoznak.

### Norma Táblázat Példa

| Hibakód | Leírás | Munkadíj | Max idő | Alkatrész ár példa |
|---------|--------|----------|---------|-------------------|
| M-001 | Motor csere | 8.500 Ft | 45 perc | 15.000 Ft |
| M-002 | Szénkefe csere | 3.200 Ft | 20 perc | 2.500 Ft |
| M-003 | Kapcsoló csere | 4.500 Ft | 30 perc | 4.800 Ft |
| M-004 | Csapágy csere | 5.800 Ft | 40 perc | 3.200 Ft |
| M-005 | Hajtómű javítás | 12.000 Ft | 60 perc | 8.500 Ft |
| M-006 | Elektronika | 6.500 Ft | 35 perc | Változó |

### Claim Benyújtás Folyamata

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         MAKITA GARANCIA CLAIM                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  1. MUNKALAP LÉTREHOZÁS                                                     │
│     └─ Ügyfél adatok, gép adatok, hiba leírás                               │
│                                                                              │
│  2. HIBAKÓD KIVÁLASZTÁS                                                     │
│     └─ Legördülő menüből a megfelelő norma kód                              │
│     └─ Rendszer automatikusan betölti a munkadíjat                          │
│                                                                              │
│  3. ALKATRÉSZ KIVÁLASZTÁS                                                   │
│     └─ Makita alkatrész katalógusból                                        │
│     └─ Norma ár automatikus                                                 │
│                                                                              │
│  4. JAVÍTÁS ELVÉGZÉSE                                                       │
│     └─ Idő mérés (max idő figyelés)                                         │
│                                                                              │
│  5. CLAIM GENERÁLÁS                                                         │
│     └─ KGC ERP → Makita portál API                                          │
│     └─ Automatikus adatfeltöltés                                            │
│                                                                              │
│  6. JÓVÁÍRÁS KÖVETÉS                                                        │
│     └─ Státusz: benyújtva → feldolgozás → jóváhagyva → fizetve              │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Egyedi Elbírálás (Egyéb Gyártók)

### Mikor Használjuk

- Nincs norma rendszer a gyártónál
- Speciális/ritka hiba
- Régebbi, de még garanciális gép
- Import termékek

### Folyamat

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         EGYEDI GARANCIA ELBÍRÁLÁS                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  1. DIAGNOSZTIKA                                                            │
│     ├─ Részletes hibaleírás                                                 │
│     ├─ Fotó dokumentáció (kötelező!)                                        │
│     └─ Becsült munkaidő                                                     │
│                                                                              │
│  2. ÁRAJÁNLAT KÉSZÍTÉS                                                      │
│     ├─ Munkadíj kalkuláció                                                  │
│     ├─ Alkatrész lista + árak                                               │
│     └─ Összesítés                                                           │
│                                                                              │
│  3. GYÁRTÓNAK KÜLDÉS                                                        │
│     ├─ Email: garancia@gyarto.hu                                            │
│     │   VAGY                                                                │
│     └─ Portál: gyarto.hu/garancia                                           │
│                                                                              │
│  4. VÁLASZ VÁRÁSA                                                           │
│     ├─ Jóváhagyva → Javítás                                                 │
│     ├─ Részben jóváhagyva → Módosított javítás                              │
│     └─ Elutasítva → Ügyfél értesítés                                        │
│                                                                              │
│  5. ELSZÁMOLÁS                                                              │
│     ├─ Átutalás                                                             │
│     ├─ Jóváírás következő rendelésből                                       │
│     └─ Alkatrész visszaküldés (csere esetén)                                │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Gyártók és Elszámolási Módok

| Gyártó | Elbírálás | Elszámolás | Portál |
|--------|-----------|------------|--------|
| **Makita** | Norma | Átutalás | makita.hu/szerviz |
| **Bosch** | Egyedi | Jóváírás | bosch-pt.com/warranty |
| **Stihl** | Részben norma | Átutalás | stihl.hu/partner |
| **Husqvarna** | Egyedi | Alkatrész csere | husqvarna.com/pro |
| **DeWalt** | Norma | Átutalás | dewalt.hu/garancia |
| **Egyéb** | Egyedi | Email alapú | - |

---

## ERD - Új Entitások

### GARANCIA_SZERZŐDÉS

A gyártókkal kötött garancia keretszerződések tárolása.

```sql
CREATE TABLE garancia_szerzodes (
    szerzodes_id        SERIAL PRIMARY KEY,
    tenant_id           UUID NOT NULL,              -- ADR-001
    gyarto_id           INTEGER REFERENCES beszallito(beszallito_id),
    nev                 VARCHAR(200) NOT NULL,      -- "Makita garancia 2024"
    tipus               VARCHAR(30) NOT NULL,       -- norma / egyedi
    norma_tabla_url     VARCHAR(500),               -- Ha norma: CSV/API URL
    portal_url          VARCHAR(500),               -- Online claim felület
    email               VARCHAR(200),               -- Claim email cím
    api_kulcs           VARCHAR(200),               -- API integráció (ha van)
    elszamolas_mod      VARCHAR(30) NOT NULL,       -- atutalas/jovairas/alkatresz
    ervenyesseg_kezdet  DATE NOT NULL,
    ervenyesseg_veg     DATE,
    aktiv               BOOLEAN DEFAULT TRUE,
    created_at          TIMESTAMP DEFAULT NOW(),
    updated_at          TIMESTAMP DEFAULT NOW()
);
```

### Tipus Értékek

| Típus | Leírás |
|-------|--------|
| `norma` | Fix díjas norma rendszer |
| `egyedi` | Egyedi elbírálás minden esetben |
| `hibrid` | Alapvető hibák normával, komplex egyedi |

### Elszámolás Módok

| Mód | Leírás |
|-----|--------|
| `atutalas` | Gyártó átutalja az összeget |
| `jovairas` | Következő rendelésből levonás |
| `alkatresz` | Cserealkatrész küldése |

---

### NORMA_TETEL

Makita típusú norma rendszer tételei.

```sql
CREATE TABLE norma_tetel (
    norma_id            SERIAL PRIMARY KEY,
    szerzodes_id        INTEGER REFERENCES garancia_szerzodes(szerzodes_id),
    hibakod             VARCHAR(50) NOT NULL,       -- M-001, M-002...
    leiras              VARCHAR(500) NOT NULL,
    munkadij            DECIMAL(10,2) NOT NULL,     -- Fix munkadíj
    max_ido_perc        INTEGER,                    -- Max javítási idő
    gep_kategoria       VARCHAR(100),               -- Melyik gépekre vonatkozik
    aktiv               BOOLEAN DEFAULT TRUE,
    created_at          TIMESTAMP DEFAULT NOW(),

    UNIQUE(szerzodes_id, hibakod)
);
```

---

### GARANCIA_CLAIM

Az egyes garanciális javítások elszámolásai.

```sql
CREATE TABLE garancia_claim (
    claim_id            SERIAL PRIMARY KEY,
    tenant_id           UUID NOT NULL,              -- ADR-001
    munkalap_id         INTEGER REFERENCES munkalap(munkalap_id),
    szerzodes_id        INTEGER REFERENCES garancia_szerzodes(szerzodes_id),

    -- Hiba adatok
    hibakod             VARCHAR(50),                -- Norma esetén
    hiba_leiras         TEXT,                       -- Egyedi esetén részletes

    -- Pénzügyi adatok
    munkadij            DECIMAL(10,2) NOT NULL,
    alkatresz_ertek     DECIMAL(10,2) DEFAULT 0,
    osszesen            DECIMAL(10,2) NOT NULL,

    -- Státusz követés
    statusz             VARCHAR(30) NOT NULL,
    benyujtas_datum     DATE,
    valasz_datum        DATE,
    jovairas_datum      DATE,

    -- Egyedi elbírálás
    arajanlat_url       VARCHAR(500),               -- Csatolt árajánlat
    foto_urls           JSONB,                      -- Fotó dokumentáció
    gyarto_valasz       TEXT,                       -- Gyártó válasza

    -- Elszámolás
    jovahagyott_osszeg  DECIMAL(10,2),              -- Lehet kevesebb!
    elszamolas_mod      VARCHAR(30),

    offline_sync        BOOLEAN DEFAULT FALSE,      -- ADR-002
    created_at          TIMESTAMP DEFAULT NOW(),
    updated_at          TIMESTAMP DEFAULT NOW()
);
```

### Claim Státuszok

| Státusz | Leírás |
|---------|--------|
| `draft` | Készülőben |
| `benyujtva` | Gyártónak elküldve |
| `feldolgozas` | Gyártónál feldolgozás alatt |
| `jovahagy` | Jóváhagyva |
| `reszben` | Részben jóváhagyva |
| `elutasit` | Elutasítva |
| `fizetve` | Összeg megérkezett |

---

## Integráció a Szerviz Modullal

### Munkalap Kapcsolat

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      MUNKALAP → GARANCIA CLAIM                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  MUNKALAP (04-szerviz-munkalap)                                             │
│  ─────────────────────────────────                                          │
│  • munkalap_id                                                              │
│  • gep_adatok (sorozatszám, vásárlás dátum)                                │
│  • hiba_leiras                                                              │
│  • felhasznalt_alkatreszek                                                  │
│                     │                                                        │
│                     │ garanciális = true                                     │
│                     ▼                                                        │
│  GARANCIA_CLAIM                                                             │
│  ─────────────────────────────────                                          │
│  • Automatikus létrehozás                                                   │
│  • Munkadíj + alkatrész összesítés                                          │
│  • Gyártó szerződés kiválasztás                                             │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Garanciális Jelölés a Munkalapon

```sql
-- Munkalap tábla bővítés
ALTER TABLE munkalap ADD COLUMN garancialis BOOLEAN DEFAULT FALSE;
ALTER TABLE munkalap ADD COLUMN garancia_claim_id INTEGER REFERENCES garancia_claim(claim_id);
```

---

## Riportok

### Garanciális Javítások Összesítő

| Gyártó | Claim db | Összérték | Beérkezett | Függőben |
|--------|----------|-----------|------------|----------|
| Makita | 45 | 320.000 Ft | 280.000 Ft | 40.000 Ft |
| Bosch | 12 | 95.000 Ft | 95.000 Ft | 0 Ft |
| Stihl | 8 | 65.000 Ft | 45.000 Ft | 20.000 Ft |

### Szervizenként Garancia Teljesítmény

- Hány garanciális javítás
- Átlagos claim összeg
- Jóváhagyási arány
- Átlagos feldolgozási idő

---

## Kapcsolódó Dokumentumok

- [04-szerviz-folyamat.md](04-szerviz-folyamat.md) - Alap szerviz folyamat
- [04-szerviz-munkalap.md](04-szerviz-munkalap.md) - Munkalap állapotgép
- [04-szerviz-erd.md](04-szerviz-erd.md) - Szerviz entitások

---

## Jelmagyarázat

| Szimbólum | Jelentés |
|-----------|----------|
| 🔴 | Makita norma rendszer |
| 🟣 | Egyedi elbírálás |
| 📊 | Norma táblázat |
| 📋 | Garancia claim |
| 🔧 | Garancia szerződés |
| ✅ | Jóváhagyva |
| ⏳ | Feldolgozás alatt |
| ❌ | Elutasítva |
