# KGC ERP - Részletfizetés Folyamat

## Diagram Információk

| Tulajdonság | Érték |
|-------------|-------|
| **Fájlnév** | 8-reszletfizetes-folyamat.excalidraw |
| **Típus** | Folyamatábra + ERD |
| **Kategória** | 8. Új Követelmények |
| **Modul** | Pénzügy |
| **Verzió** | KGC ERP v2 |
| **Forrás** | Zsuzsa jegyzetei: "A részletfizetés, az előlegszámla és a díjbekérő rendesen nem működik" |

---

## Áttekintés

Ez a diagram a három fő fizetési konstrukciót mutatja be:
1. **Előleg** - Megrendeléskor fizetett előleg, ami a végszámlából levonásra kerül
2. **Részletfizetés** - Nagy összegű vásárlás/szolgáltatás havi törlesztésre bontva
3. **Díjbekérő** - Fizetési felszólítás, ami nem számla

---

## Fizetési Módok Összehasonlítása

| Tulajdonság | Előleg | Részletfizetés | Díjbekérő |
|-------------|--------|----------------|-----------|
| **Mikor használjuk** | Megrendeléskor | Nagy összegeknél | Fizetés előtt |
| **Számla típus** | Előlegszámla + Végszámla | Egy számla + törlesztések | Nem számla |
| **ÁFA kezelés** | Előlegnél ÁFA fizetendő | Teljes ÁFA az elején | Nincs ÁFA |
| **Könyvelés** | Két számla | Egy számla + pénzügyi terv | Csak nyilvántartás |

---

## 1. Előleg Folyamat

### Folyamatábra

```
┌─────────┐
│ Kezdet  │
└────┬────┘
     │
     ▼
┌─────────────────┐
│ Megrendelés     │
│ felvétele       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Előleg %        │
│ meghatározás    │
│ (10-50%)        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Előlegszámla    │
│ kiállítása      │◀──────── ÁFA tartalmú!
└────────┬────────┘
         │
         ▼
   ┌───────────┐
   │ Befizetés │
   │ megtörtént│
   │     ?     │
   └─────┬─────┘
    IGEN │
         ▼
┌─────────────────┐
│ Áru/szolgáltatás│
│ teljesítése     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Végszámla       │
│ kiállítása      │◀──────── Előleg LEVONVA!
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Fennmaradó      │
│ összeg fizetése │
└────────┬────────┘
         │
         ▼
┌─────────┐
│  Vége   │
└─────────┘
```

### Előleg Százalékok

| Típus | Javasolt % | Megjegyzés |
|-------|------------|------------|
| Kis értékű megrendelés (<100.000 Ft) | 0-10% | Opcionális |
| Közepes (100.000-500.000 Ft) | 20-30% | Ajánlott |
| Nagy értékű (>500.000 Ft) | 30-50% | Kötelező |
| Egyedi gyártás | 50% | Mindig kötelező |

### Előlegszámla Tartalma

```
┌─────────────────────────────────────────────────────────────────┐
│                      ELŐLEGSZÁMLA                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Számla sorszám:    E-2024/0001                                 │
│  Megrendelés szám:  MR-2024/0123                                │
│                                                                  │
│  Megnevezés:        Előleg - [termék/szolgáltatás]              │
│  Teljes érték:      500.000 Ft                                  │
│  Előleg (30%):      150.000 Ft                                  │
│  ÁFA (27%):          40.500 Ft                                  │
│  ─────────────────────────────────                              │
│  Fizetendő:         190.500 Ft                                  │
│                                                                  │
│  ⚠️ Ez előlegszámla, a végszámla a teljesítéskor kerül          │
│     kiállításra, az előleg összege levonásra kerül.             │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Részletfizetés Folyamat

### Folyamatábra

```
┌─────────┐
│ Kezdet  │
└────┬────┘
     │
     ▼
┌─────────────────┐
│ Részletfizetési │
│ kérelem         │
└────────┬────────┘
         │
         ▼
   ┌───────────┐
   │ Hitelké-  │
   │ pesség    │
   │ ellenőrzés│
   └─────┬─────┘
         │
    ┌────┴────┐
    │         │
   OK       NEM OK
    │         │
    ▼         ▼
┌────────┐ ┌────────┐
│Terv    │ │Elutasí-│
│készítés│ │tás     │
└───┬────┘ └────────┘
    │
    ▼
┌─────────────────┐
│ Szerződés       │
│ aláírás         │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Számla kiállítás│
│ (teljes összeg) │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Törlesztési     │
│ ütemezés aktív  │
└────────┬────────┘
         │
         ▼
   ┌───────────┐      ┌─────────────────┐
   │ Havi      │◀─────│ Emlékeztető     │
   │ törlesztés│      │ értesítés       │
   └─────┬─────┘      └─────────────────┘
         │
    ┌────┴────┐
    │         │
 Fizet     Késik
    │         │
    ▼         ▼
┌────────┐ ┌────────────────┐
│Következő│ │Késedelmi díj   │
│részlet  │ │+ Blokkolás     │
└───┬────┘ │(07-fizetesi-   │
    │      │fegyelem szerint)│
    │      └────────────────┘
    ▼
   ┌───────────┐
   │ Utolsó    │
   │ részlet?  │
   └─────┬─────┘
    IGEN │
         ▼
┌─────────────────┐
│ Terv lezárása   │
│ (statusz: lezárt)│
└────────┬────────┘
         │
         ▼
┌─────────┐
│  Vége   │
└─────────┘
```

### Részletfizetési Terv Példa

```
┌─────────────────────────────────────────────────────────────────┐
│                   RÉSZLETFIZETÉSI TERV                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Partner:           Kovács János                                 │
│  Számla:            SZ-2024/0456                                │
│  Teljes összeg:     600.000 Ft                                  │
│  Törlesztések:      6 hónap                                     │
│  Havi összeg:       100.000 Ft                                  │
│                                                                  │
│  Ütemezés:                                                       │
│  ┌─────┬────────────┬──────────┬──────────┬─────────┐          │
│  │ #   │ Esedékesség│ Összeg   │ Befizetve│ Státusz │          │
│  ├─────┼────────────┼──────────┼──────────┼─────────┤          │
│  │ 1   │ 2024-02-15 │ 100.000  │ 100.000  │ ✅       │          │
│  │ 2   │ 2024-03-15 │ 100.000  │ 100.000  │ ✅       │          │
│  │ 3   │ 2024-04-15 │ 100.000  │ 50.000   │ ⚠️ Részl.│          │
│  │ 4   │ 2024-05-15 │ 100.000  │ -        │ ⏳ Várako│          │
│  │ 5   │ 2024-06-15 │ 100.000  │ -        │ ⏳ Várako│          │
│  │ 6   │ 2024-07-15 │ 100.000  │ -        │ ⏳ Várako│          │
│  └─────┴────────────┴──────────┴──────────┴─────────┘          │
│                                                                  │
│  Összesen befizetve: 250.000 Ft                                 │
│  Hátralék:           350.000 Ft                                 │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Hitelképesség Ellenőrzés

| Szempont | Ellenőrzés |
|----------|------------|
| Lejárt tartozás | Nincs-e aktív lejárt számla |
| Korábbi részletfizetés | Rendben fizetett-e korábban |
| Vásárlási előzmény | Hány éve ügyfél, vásárlási volumen |
| NAV státusz | Adószám érvényesség |

---

## 3. Díjbekérő Folyamat

### Folyamatábra

```
┌─────────┐
│ Kezdet  │
└────┬────┘
     │
     ▼
┌─────────────────┐
│ Díjbekérő       │
│ kiállítása      │◀──────── NEM számla!
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Küldés ügyfélnek│
│ (email/nyomtat) │
└────────┬────────┘
         │
         ▼
   ┌───────────┐
   │ Befizetés │
   │     ?     │
   └─────┬─────┘
    ┌────┴────┐
    │         │
  IGEN       NEM
    │         │
    ▼         ▼
┌────────┐ ┌────────────────┐
│Számla  │ │Emlékeztető     │
│kiállít.│ │küldése         │
└───┬────┘ └───────┬────────┘
    │              │
    │              ▼
    │        ┌───────────┐
    │        │ 3x próba  │
    │        │ után      │
    │        └─────┬─────┘
    │              │
    │              ▼
    │        ┌────────────────┐
    │        │Díjbekérő       │
    │        │sztornózása     │
    │        └────────────────┘
    │
    ▼
┌─────────┐
│  Vége   │
└─────────┘
```

### Díjbekérő vs. Számla

| Tulajdonság | Díjbekérő | Számla |
|-------------|-----------|--------|
| Jogi státusz | Nem bizonylat | Hivatalos bizonylat |
| ÁFA tartalom | Nincs ÁFA | ÁFA-s |
| NAV bejelentés | Nem kell | Kötelező |
| Könyvelés | Nem könyvelhető | Könyvelhető |
| Mikor | Fizetés ELŐTT | Fizetés UTÁN vagy egyszerre |

---

## ERD - Új Entitások

### RÉSZLETFIZETÉSI_TERV

```sql
CREATE TABLE reszletfizetesi_terv (
    terv_id             SERIAL PRIMARY KEY,
    tenant_id           UUID NOT NULL,              -- ADR-001
    partner_id          INTEGER REFERENCES partner(partner_id),
    szamla_id           INTEGER REFERENCES szamla(szamla_id),
    teljes_osszeg       DECIMAL(12,2) NOT NULL,
    torlesztesek_szama  INTEGER NOT NULL,           -- Hány részlet
    havi_osszeg         DECIMAL(12,2) NOT NULL,
    kezdo_datum         DATE NOT NULL,
    veg_datum           DATE NOT NULL,
    statusz             VARCHAR(30) NOT NULL,       -- aktiv/lezart/keses/felfuggesztett
    megjegyzes          TEXT,
    offline_sync        BOOLEAN DEFAULT FALSE,      -- ADR-002
    created_at          TIMESTAMP DEFAULT NOW(),
    updated_at          TIMESTAMP DEFAULT NOW()
);
```

### TÖRLESZTÉS

```sql
CREATE TABLE torleszt (
    torleszt_id         SERIAL PRIMARY KEY,
    terv_id             INTEGER REFERENCES reszletfizetesi_terv(terv_id),
    sorszam             INTEGER NOT NULL,           -- Hanyadik részlet
    esedekesseg         DATE NOT NULL,
    osszeg              DECIMAL(12,2) NOT NULL,
    befizetve           DECIMAL(12,2) DEFAULT 0,
    fizetes_datum       DATE,
    statusz             VARCHAR(30) NOT NULL,       -- pending/fizetve/reszbeni/keses
    keses_napok         INTEGER DEFAULT 0,
    kesedelmi_dij       DECIMAL(12,2) DEFAULT 0,
    created_at          TIMESTAMP DEFAULT NOW(),
    updated_at          TIMESTAMP DEFAULT NOW()
);
```

### ELŐLEG

```sql
CREATE TABLE eloleg (
    eloleg_id           SERIAL PRIMARY KEY,
    tenant_id           UUID NOT NULL,              -- ADR-001
    megrendeles_id      INTEGER REFERENCES megrendeles(megrendeles_id),
    eloleg_szamla_id    INTEGER REFERENCES szamla(szamla_id),
    vegszamla_id        INTEGER REFERENCES szamla(szamla_id),
    osszeg              DECIMAL(12,2) NOT NULL,
    szazalek            DECIMAL(5,2) NOT NULL,      -- Hány % előleg
    statusz             VARCHAR(30) NOT NULL,       -- pending/fizetve/felhasznalva
    fizetes_datum       DATE,
    offline_sync        BOOLEAN DEFAULT FALSE,      -- ADR-002
    created_at          TIMESTAMP DEFAULT NOW(),
    updated_at          TIMESTAMP DEFAULT NOW()
);
```

### DÍJBEKÉRŐ

```sql
CREATE TABLE dijbekero (
    dijbekero_id        SERIAL PRIMARY KEY,
    tenant_id           UUID NOT NULL,              -- ADR-001
    partner_id          INTEGER REFERENCES partner(partner_id),
    osszeg              DECIMAL(12,2) NOT NULL,
    leiras              TEXT NOT NULL,
    kiallitas_datum     DATE NOT NULL,
    hatarido            DATE NOT NULL,
    statusz             VARCHAR(30) NOT NULL,       -- aktiv/fizetve/sztornozva
    szamla_id           INTEGER REFERENCES szamla(szamla_id),  -- Ha fizetve, ide kerül a számla
    emlekeztetok_szama  INTEGER DEFAULT 0,
    offline_sync        BOOLEAN DEFAULT FALSE,      -- ADR-002
    created_at          TIMESTAMP DEFAULT NOW(),
    updated_at          TIMESTAMP DEFAULT NOW()
);
```

---

## Státusz Értékek

### Részletfizetési Terv Státuszok

| Státusz | Leírás |
|---------|--------|
| `aktiv` | Folyamatban lévő törlesztés |
| `lezart` | Minden részlet kifizetve |
| `keses` | Van késedelmes törlesztés |
| `felfuggesztett` | Ideiglenesen felfüggesztve |

### Törlesztés Státuszok

| Státusz | Leírás |
|---------|--------|
| `pending` | Még nem esedékes |
| `fizetve` | Teljes összeg befizetve |
| `reszbeni` | Részben fizetve |
| `keses` | Lejárt, nem fizetve |

### Előleg Státuszok

| Státusz | Leírás |
|---------|--------|
| `pending` | Előlegszámla kiállítva, nem fizetve |
| `fizetve` | Előleg befizetve |
| `felhasznalva` | Végszámlából levonva |

---

## Integráció Más Modulokkal

### Értesítések (07-ertesitesek-folyamat)

| Esemény | Értesítés típus |
|---------|-----------------|
| Törlesztés esedékes (3 nap előtt) | Email + SMS |
| Törlesztés lejárt | SMS (sürgős) |
| Előleg beérkezett | Email |
| Díjbekérő lejár | Email |

### Fizetési Fegyelem (07-fizetesi-fegyelem)

- Késedelmes törlesztés → Blokkolás aktiválódik
- Új részletfizetés nem engedélyezett lejárt tartozással

---

## Kapcsolódó Dokumentumok

- [07-fizetesi-fegyelem.md](07-fizetesi-fegyelem.md) - Késés kezelés
- [07-ertesitesek-folyamat.md](07-ertesitesek-folyamat.md) - Automatikus értesítések
- [05-penzugy-folyamat.md](05-penzugy-folyamat.md) - Általános pénzügyi folyamatok

---

## Jelmagyarázat

| Szimbólum | Jelentés |
|-----------|----------|
| 📋 | Előlegszámla |
| 📊 | Részletfizetési terv |
| 📨 | Díjbekérő |
| ✅ | Fizetve |
| ⏳ | Várakozik |
| ⚠️ | Részben fizetve / Figyelem |
| 🔑 | Primary Key |
| FK | Foreign Key |
