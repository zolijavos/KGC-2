# KGC ERP - Garanciális Javítás

## Diagram Információk

| Tulajdonság | Érték |
|-------------|-------|
| **Fájlnév** | 8-garancialis-javitas.excalidraw |
| **Típus** | Folyamatábra + ERD + Döntési fa |
| **Kategória** | 8. Új Követelmények |
| **Modul** | Szerviz |
| **Verzió** | KGC ERP v3.0 (2025-12-11) |
| **Forrás** | Zsuzsa jegyzetei, fit-gap-2025-12-07, ADR-013 |

---

## Változások v3.0 (2025-12-11)

### ADR-013 Döntések Implementálása

| Döntés | Leírás |
|--------|--------|
| **Bevizsgálási díj** | Garanciálisnál default 0 Ft, indoklás kötelező ha > 0 |
| **intake_type** | Új mező: warranty/repair/quote - előre meghatározza a folyamatot |
| **Tartozék checklist** | SZERVIZ_TARTOZÉK entitás integráció |

### Új Elemek

- Bevizsgálási díj döntési fa
- intake_type alapú folyamat elágazás
- Tartozék dokumentáció a garanciális igényhez
- Belső megjegyzések (internal_notes) mező

---

## Áttekintés

A garanciális javítások kezelése három fő típusra oszlik:
1. **Norma rendszer** (pl. Makita) - Fix munkadíjak és alkatrészárak hibakód alapján
2. **Egyedi elbírálás** - Árajánlat alapú, gyártói jóváhagyással
3. **Hibrid** - Alapvető hibák normával, komplex egyedi elbírálással

---

## Intake Típus Döntés (intake_type)

```
                              ┌─────────────────┐
                              │  Gép bevétel    │
                              │   szervizbe     │
                              └────────┬────────┘
                                       │
                                       ▼
                        ┌──────────────────────────────┐
                        │  intake_type meghatározása   │
                        │                              │
                        │  ┌────────────────────────┐  │
                        │  │ 1. warranty - Garancia │  │
                        │  │ 2. repair   - Javítás  │  │
                        │  │ 3. quote    - Árajánlat│  │
                        │  └────────────────────────┘  │
                        └──────────────┬───────────────┘
                               ┌───────┴───────┐
                               │               │
                           warranty        repair/quote
                               │               │
                               ▼               ▼
              ┌─────────────────────────┐  ┌─────────────────────────┐
              │  Garanciális folyamat   │  │    Normál szerviz       │
              │                         │  │    (04-szerviz-erd)     │
              │  • Bevizsgálási díj: 0  │  │                         │
              │  • Garancia ellenőrzés  │  │  • Bevizsgálási díj     │
              │  • Gyártó szerződés     │  │    kalkuláció           │
              └────────────┬────────────┘  └─────────────────────────┘
                           │
                           ▼
                  ┌─────────────────┐
                  │  Gyártó típusa? │
                  └────────┬────────┘
                    ┌──────┴──────┐
                    │             │
                 NORMA         EGYEDI
                    │             │
                    ▼             ▼
        ┌───────────────┐  ┌───────────────┐
        │ Makita/DeWalt │  │ Bosch/Stihl   │
        │ norma rendszer│  │ egyedi elbír. │
        └───────────────┘  └───────────────┘
```

---

## Bevizsgálási Díj Döntési Fa (ADR-013)

```
                    ┌─────────────────────────────────┐
                    │      BEVIZSGÁLÁSI DÍJ          │
                    │         DÖNTÉSI FA              │
                    └─────────────────┬───────────────┘
                                      │
                                      ▼
                    ┌─────────────────────────────────┐
                    │  intake_type = "warranty"?      │
                    └─────────────────┬───────────────┘
                              ┌───────┴───────┐
                              │               │
                            IGEN            NEM
                              │               │
                              ▼               ▼
          ┌───────────────────────────┐  ┌───────────────────────────┐
          │ bevizsgalasi_dij = 0 Ft   │  │ Normál árazás             │
          │ (alapértelmezett)         │  │ (04-szerviz díjszabás)    │
          └─────────────┬─────────────┘  └───────────────────────────┘
                        │
                        ▼
          ┌───────────────────────────┐
          │ Van indokolt felár?       │
          │ (pl. többlet diagnosztika)│
          └─────────────┬─────────────┘
                  ┌─────┴─────┐
                  │           │
                NEM        IGEN
                  │           │
                  ▼           ▼
    ┌───────────────────┐  ┌───────────────────────────────┐
    │ bevizsgalasi_dij  │  │ bevizsgalasi_dij > 0          │
    │ marad 0 Ft        │  │                               │
    └───────────────────┘  │ ⚠️ KÖTELEZŐ:                   │
                           │ internal_notes-ba indoklás    │
                           │ beírása                       │
                           │                               │
                           │ Példa: "Gyártó nem ismeri el  │
                           │ normál körülmények között,    │
                           │ részletes hibakeresés szükséges│
                           │ volt az ügyfél hibájának      │
                           │ megállapításához"             │
                           └───────────────────────────────┘
```

### Üzleti Szabályok (ADR-013)

| Szabály | Részletek |
|---------|-----------|
| **Default** | warranty intake esetén bevizsgalasi_dij = 0 |
| **Kivétel** | Ha > 0, akkor internal_notes kötelező |
| **Validáció** | UI figyelmeztet, ha warranty + díj > 0 de nincs indoklás |
| **Audit** | Minden nem-0 bevizsgálási díjat logolni kell |

---

## Garanciális Folyamat (Teljes)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      GARANCIÁLIS JAVÍTÁS FOLYAMAT (v3.0)                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  1. BEVÉTELEZÉS                                                              │
│     ├─ Ügyfél adatok rögzítés (PARTNER)                                     │
│     ├─ Gép adatok (sorozatszám, vásárlás dátum)                             │
│     ├─ intake_type = "warranty" kiválasztás                                 │
│     └─ 📋 SZERVIZ_TARTOZÉK checklist kitöltése                              │
│        • Tok/táska: ☐ van / ☐ nincs                                         │
│        • Töltő: ☐ van / ☐ nincs                                             │
│        • Akkumulátor(ok): ☐ db                                              │
│        • Penge/fej/tartozék: ☐ van / ☐ nincs                                │
│        • Doboz: ☐ van / ☐ nincs                                             │
│                                                                              │
│  2. GARANCIA ELLENŐRZÉS                                                     │
│     ├─ Vásárlási dátum vs jelen dátum                                       │
│     ├─ Garancia időtartam (gyártó függő: 1-3 év)                            │
│     ├─ Sorozatszám érvényesség                                              │
│     └─ ⚠️ Ha nem garanciális: intake_type → "repair"                         │
│                                                                              │
│  3. BEVIZSGÁLÁSI DÍJ (ADR-013)                                              │
│     ├─ warranty esetén: 0 Ft (alapértelmezett)                              │
│     └─ Ha > 0: internal_notes kötelező indoklás                             │
│                                                                              │
│  4. GYÁRTÓ SZERZŐDÉS MEGHATÁROZÁS                                           │
│     ├─ GARANCIA_SZERZŐDÉS lekérés gyártó alapján                            │
│     └─ tipus: norma / egyedi / hibrid                                       │
│                                                                              │
│  5. JAVÍTÁSI FOLYAMAT                                                       │
│     ├─ NORMA: hibakód kiválasztás → fix munkadíj                            │
│     └─ EGYEDI: árajánlat → gyártó jóváhagyás                                │
│                                                                              │
│  6. GARANCIA CLAIM LÉTREHOZÁS                                               │
│     ├─ GARANCIA_CLAIM rekord                                                │
│     ├─ Fotó dokumentáció csatolás (MUNKALAP_CSATOLMÁNY)                     │
│     ├─ Tartozék lista csatolás (SZERVIZ_TARTOZÉK)                           │
│     └─ Benyújtás gyártónak                                                  │
│                                                                              │
│  7. ELSZÁMOLÁS                                                              │
│     ├─ Gyártói válasz rögzítés                                              │
│     ├─ Jóváhagyott összeg                                                   │
│     └─ Fizetési státusz követés                                             │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
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
│     ├─ Ügyfél adatok, gép adatok, hiba leírás                               │
│     ├─ intake_type = "warranty"                                             │
│     └─ bevizsgalasi_dij = 0 (ADR-013)                                       │
│                                                                              │
│  2. TARTOZÉK DOKUMENTÁCIÓ                                                   │
│     └─ SZERVIZ_TARTOZÉK checklist kitöltése                                 │
│        (fontos a visszaadáshoz!)                                            │
│                                                                              │
│  3. HIBAKÓD KIVÁLASZTÁS                                                     │
│     └─ Legördülő menüből a megfelelő norma kód                              │
│     └─ Rendszer automatikusan betölti a munkadíjat                          │
│                                                                              │
│  4. ALKATRÉSZ KIVÁLASZTÁS                                                   │
│     └─ Makita alkatrész katalógusból                                        │
│     └─ Norma ár automatikus                                                 │
│                                                                              │
│  5. JAVÍTÁS ELVÉGZÉSE                                                       │
│     └─ Idő mérés (max idő figyelés)                                         │
│                                                                              │
│  6. FOTÓ DOKUMENTÁCIÓ                                                       │
│     └─ MUNKALAP_CSATOLMÁNY-ba fotók feltöltése                              │
│     └─ Kötelező: hiba fotó, javított állapot                                │
│                                                                              │
│  7. CLAIM GENERÁLÁS                                                         │
│     └─ KGC ERP → Makita portál API                                          │
│     └─ Automatikus adatfeltöltés                                            │
│                                                                              │
│  8. JÓVÁÍRÁS KÖVETÉS                                                        │
│     └─ Státusz: benyujtva → feldolgozas → jovahagy → fizetve               │
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
│     ├─ Fotó dokumentáció (MUNKALAP_CSATOLMÁNY - kötelező!)                  │
│     ├─ Becsült munkaidő                                                     │
│     └─ internal_notes: technikai részletek                                  │
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
│     └─ Elutasítva → Ügyfél értesítés + díj átalakítás                       │
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

## ERD - Entitások (v3.0)

### MUNKALAP Bővítés (04-szerviz-erd referencia)

```sql
-- A 04-szerviz-erd-2025-12-11.md-ben definiált mezők
-- Garancia szempontjából releváns:

ALTER TABLE munkalap ADD COLUMN intake_type VARCHAR(20) DEFAULT 'repair';
  -- warranty: garanciális (bevizsgálási díj = 0 alapból)
  -- repair: fizetős javítás
  -- quote: csak árajánlat

ALTER TABLE munkalap ADD COLUMN bevizsgalasi_dij DECIMAL(10,2) DEFAULT 0;
  -- ADR-013: warranty esetén default 0, ha > 0 indoklás kell

ALTER TABLE munkalap ADD COLUMN internal_notes TEXT;
  -- Belső megjegyzések (pl. bevizsgálási díj indoklás)

ALTER TABLE munkalap ADD COLUMN garancialis BOOLEAN DEFAULT FALSE;
ALTER TABLE munkalap ADD COLUMN garancia_claim_id INTEGER REFERENCES garancia_claim(claim_id);
```

### SZERVIZ_TARTOZÉK (04-szerviz-erd referencia)

```sql
-- Tartozék checklist a garanciális igényhez fontos!
CREATE TABLE szerviz_tartozek (
    tartozek_id         SERIAL PRIMARY KEY,
    munkalap_id         INTEGER REFERENCES munkalap(munkalap_id),
    tartozek_tipus      VARCHAR(100) NOT NULL,
      -- tok_taska, tolto, akkumulator, penge_fej, doboz, egyeb
    darabszam           INTEGER DEFAULT 1,
    allapot             VARCHAR(50),
      -- jo, serult, hianyos
    megjegyzes          TEXT,
    foto_url            VARCHAR(500),
    visszaadva          BOOLEAN DEFAULT FALSE,
    visszaadas_datum    TIMESTAMP,
    created_at          TIMESTAMP DEFAULT NOW()
);

-- Index a gyors lekéréshez
CREATE INDEX idx_szerviz_tartozek_munkalap ON szerviz_tartozek(munkalap_id);
```

### MUNKALAP_CSATOLMÁNY (04-szerviz-erd referencia)

```sql
-- Fotók és dokumentumok
CREATE TABLE munkalap_csatolmany (
    csatolmany_id       SERIAL PRIMARY KEY,
    munkalap_id         INTEGER REFERENCES munkalap(munkalap_id),
    tipus               VARCHAR(50) NOT NULL,
      -- foto_bevetel, foto_hiba, foto_javitas, foto_keszre, dokumentum
    url                 VARCHAR(500) NOT NULL,
    leiras              VARCHAR(500),
    feltolto_user_id    INTEGER REFERENCES felhasznalo(user_id),
    created_at          TIMESTAMP DEFAULT NOW()
);
```

---

### GARANCIA_SZERZŐDÉS

A gyártókkal kötött garancia keretszerződések tárolása.

```sql
CREATE TABLE garancia_szerzodes (
    szerzodes_id        SERIAL PRIMARY KEY,
    tenant_id           UUID NOT NULL,              -- ADR-001
    gyarto_id           INTEGER REFERENCES beszallito(beszallito_id),
    nev                 VARCHAR(200) NOT NULL,      -- "Makita garancia 2024"
    tipus               VARCHAR(30) NOT NULL,       -- norma / egyedi / hibrid
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

### Típus Értékek

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

### GARANCIA_CLAIM (v3.0)

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

    -- v3.0: Bevizsgálási díj referencia
    bevizsgalasi_dij    DECIMAL(10,2) DEFAULT 0,    -- Általában 0 warranty-nél
    bevizsgalasi_indoklas TEXT,                     -- ADR-013: kötelező ha > 0

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

-- v3.0: Tartozék referencia a claim-hez
CREATE TABLE garancia_claim_tartozek (
    id                  SERIAL PRIMARY KEY,
    claim_id            INTEGER REFERENCES garancia_claim(claim_id),
    tartozek_id         INTEGER REFERENCES szerviz_tartozek(tartozek_id),
    atvett              BOOLEAN DEFAULT TRUE,       -- Átvettük az ügyféltől
    visszaadva          BOOLEAN DEFAULT FALSE,      -- Visszaadtuk
    megjegyzes          TEXT
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

### Munkalap → Garancia Claim Kapcsolat

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      MUNKALAP → GARANCIA CLAIM (v3.0)                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  MUNKALAP (04-szerviz-erd-2025-12-11)                                       │
│  ─────────────────────────────────────                                      │
│  • munkalap_id                                                              │
│  • intake_type = "warranty"           ← Garanciális jelölés                 │
│  • bevizsgalasi_dij = 0               ← ADR-013 alapértelmezett             │
│  • internal_notes                     ← Indoklás ha díj > 0                 │
│  • gep_adatok (sorozatszám, vásárlás dátum)                                │
│  • hiba_leiras                                                              │
│  • felhasznalt_alkatreszek                                                  │
│                     │                                                        │
│                     │ Ha intake_type = "warranty"                            │
│                     ▼                                                        │
│  SZERVIZ_TARTOZÉK                                                           │
│  ─────────────────────────────────────                                      │
│  • Tok/táska, töltő, akkumulátor checklist                                 │
│  • Fontos: visszaadásnál egyeztetés                                        │
│                     │                                                        │
│                     ▼                                                        │
│  MUNKALAP_CSATOLMÁNY                                                        │
│  ─────────────────────────────────────                                      │
│  • Fotó dokumentáció                                                        │
│  • Kötelező garanciális igényhez                                           │
│                     │                                                        │
│                     ▼                                                        │
│  GARANCIA_CLAIM                                                             │
│  ─────────────────────────────────────                                      │
│  • Automatikus létrehozás                                                   │
│  • Munkadíj + alkatrész összesítés                                          │
│  • Gyártó szerződés kiválasztás                                             │
│  • Tartozék lista referencia                                                │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Riportok

### Garanciális Javítások Összesítő

| Gyártó | Claim db | Összérték | Beérkezett | Függőben |
|--------|----------|-----------|------------|----------|
| Makita | 45 | 320.000 Ft | 280.000 Ft | 40.000 Ft |
| Bosch | 12 | 95.000 Ft | 95.000 Ft | 0 Ft |
| Stihl | 8 | 65.000 Ft | 45.000 Ft | 20.000 Ft |

### Bevizsgálási Díj Riport (ADR-013)

| Munkalap | intake_type | bevizsgalasi_dij | Indoklás |
|----------|-------------|------------------|----------|
| ML-2025-001 | warranty | 0 Ft | - |
| ML-2025-002 | warranty | 3.500 Ft | "Ügyféli sérülés megállapítása" |
| ML-2025-003 | repair | 5.000 Ft | - |

### Szervizenként Garancia Teljesítmény

- Hány garanciális javítás
- Átlagos claim összeg
- Jóváhagyási arány
- Átlagos feldolgozási idő
- Bevizsgálási díj kivétel aránya

---

## Validációs Szabályok (ADR-013)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    BEVIZSGÁLÁSI DÍJ VALIDÁCIÓ                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  IF intake_type = "warranty" AND bevizsgalasi_dij > 0:                      │
│      REQUIRE internal_notes IS NOT NULL AND internal_notes != ''            │
│      SHOW WARNING: "Garanciális javításnál bevizsgálási díj szokatlan.     │
│                    Kérjük indokolja a Belső megjegyzések mezőben."          │
│      LOG: audit_log(user_id, munkalap_id, 'warranty_inspection_fee',        │
│           bevizsgalasi_dij)                                                  │
│                                                                              │
│  IF intake_type = "warranty":                                               │
│      SET bevizsgalasi_dij = 0 (UI alapértelmezett)                          │
│      DISABLE bevizsgalasi_dij input (csak explicit feloldással)             │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Kapcsolódó Dokumentumok

- [04-szerviz-erd-2025-12-11.md](04-szerviz-erd-2025-12-11.md) - Szerviz entitások (intake_type, tartozék)
- [04-szerviz-folyamat.md](04-szerviz-folyamat.md) - Alap szerviz folyamat
- [04-szerviz-munkalap.md](04-szerviz-munkalap.md) - Munkalap állapotgép
- [ADR-013](../architecture/adr/ADR-013-operational-decisions.md) - Bevizsgálási díj döntés

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
| ⚠️ | Validáció/figyelmeztetés |
| 📸 | Fotó dokumentáció kötelező |
