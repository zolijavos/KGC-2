# 2. Értékesítés - ERD (Entitás-Kapcsolat Diagram)

## Diagram Alapinformációk

| Tulajdonság | Érték |
|-------------|-------|
| **Fájlnév** | `2-ertekesites-erd.excalidraw` |
| **Típus** | ERD (Entity-Relationship Diagram) |
| **Modul** | Értékesítés & Készletkezelés |
| **Verzió** | v2.0 (Multi-tenant) |
| **Kategória** | 2. rész - Cikk kezelés és Eladás |

---

## Részletes Leírás

Ez az ERD diagram az **értékesítési modul adatmodelljét** mutatja be. A v2.0 verzió tartalmazza a **multi-tenant** (ADR-001) támogatást a CIKK entitásnál, valamint az **automatikus árazás** (Árrés kategória) referenciát.

---

## Entitások Részletes Leírása

### 1. CIKK Entitás (Fő entitás)

A rendszer termék- és szolgáltatás-nyilvántartásának központi entitása.

```
┌─────────────────────────────────────┐
│              CIKK                   │
├─────────────────────────────────────┤
│ PK  cikk_id (INT)                   │
│     tenant_id (UUID) 🏢             │  ← Multi-tenant azonosító
├─────────────────────────────────────┤
│     cikkszam (VARCHAR) UNIQUE       │  ← Egyedi cikkszám
│     megnevezes (VARCHAR)            │  ← Termék megnevezése
│ FK  cikkcsoport_id (INT)            │  → CIKKCSOPORT
│ FK  beszallito_id (INT)             │  → BESZÁLLÍTÓ
│ FK  arres_kategoria_id (INT) 💰     │  → ÁRRÉS_KATEGÓRIA (v7.0)
│     tarhely (VARCHAR)               │  ← Polc/hely kód
│     vonalkod (VARCHAR)              │  ← EAN/UPC kód
│     afa_tipus (ENUM)                │  ← 27%/5%/0%/AAM
│     beszerzesi_ar (DECIMAL)         │  ← Nettó beszerzési ár
│     eladasi_ar (DECIMAL)            │  ← Bruttó eladási ár
│     keszlet (INT)                   │  ← Aktuális készlet
│     eladas_engedelyezve (BOOL)      │  ← Eladható-e
│     alkatresz (BOOL)                │  ← Alkatrész jelölés
│     aktiv (BOOL)                    │  ← Aktív tétel
│     letrehozva (DATETIME)           │  ← Létrehozás időpont
│     offline_sync (BOOL) 📶          │  ← PWA offline jelzés
│ FK  rogzito_id (INT)                │  → FELHASZNÁLÓ
└─────────────────────────────────────┘
```

**Mezők magyarázata:**

| Mező | Típus | Leírás |
|------|-------|--------|
| `cikk_id` | INT | Egyedi azonosító (auto-increment) |
| `tenant_id` | UUID | Franchise partner azonosító |
| `cikkszam` | VARCHAR | Belső cikkszám (pl. "MAK-DDF481") |
| `megnevezes` | VARCHAR | Termék neve |
| `cikkcsoport_id` | INT (FK) | Kategória hivatkozás |
| `beszallito_id` | INT (FK) | Beszállító hivatkozás |
| `arres_kategoria_id` | INT (FK) | Automatikus árazás kategória |
| `tarhely` | VARCHAR | Fizikai tárolási hely |
| `vonalkod` | VARCHAR | Gyári vonalkód |
| `afa_tipus` | ENUM | Áfa kulcs típusa |
| `beszerzesi_ar` | DECIMAL | Nettó beszerzési ár (HUF) |
| `eladasi_ar` | DECIMAL | Bruttó eladási ár (HUF) |
| `keszlet` | INT | Aktuális darabszám |
| `eladas_engedelyezve` | BOOL | Értékesíthető flag |
| `alkatresz` | BOOL | Alkatrész-e (különleges kezelés) |
| `aktiv` | BOOL | Aktív/inaktív státusz |
| `offline_sync` | BOOL | Offline létrehozva jelzés |

**ÁFA típusok:**
| Kód | Jelentés | Kulcs |
|-----|----------|-------|
| `AFA_27` | Általános | 27% |
| `AFA_5` | Kedvezményes | 5% |
| `AFA_0` | Mentes | 0% |
| `AAM` | Alanyi adómentes | - |

---

### 2. CIKKCSOPORT Entitás

Cikkek kategorizálására szolgáló entitás.

```
┌─────────────────────────────────────┐
│           CIKKCSOPORT               │
├─────────────────────────────────────┤
│ PK  cikkcsoport_id (INT)            │
├─────────────────────────────────────┤
│     nev (VARCHAR)                   │  ← Csoport megnevezése
│     kod (VARCHAR)                   │  ← Rövid kód
│     aktiv (BOOL)                    │  ← Használható-e
└─────────────────────────────────────┘
```

**Előre definiált cikkcsoportok:**
| Kód | Név | Leírás |
|-----|-----|--------|
| ALK | Alkatrész | Általános alkatrészek |
| BGP | Bérgép | Bérelhető gépek |
| BSZ | Bérszerszám | Bérelhető szerszámok |
| DIJ | Díjak | Szolgáltatási díjak |
| FGS | FGS | FGS márka termékek |
| MAK | Makita | Makita termékek |
| LUK | Lukas | Lukas termékek |
| MER | Mérőműszer | Mérőeszközök |
| EGY | Egyéb | Egyéb termékek |

---

### 3. BESZÁLLÍTÓ Entitás

Szállítók nyilvántartása.

```
┌─────────────────────────────────────┐
│           BESZÁLLÍTÓ                │
├─────────────────────────────────────┤
│ PK  beszallito_id (INT)             │
├─────────────────────────────────────┤
│     nev (VARCHAR)                   │  ← Beszállító neve
│     kod (VARCHAR)                   │  ← Rövid azonosító
│     cim (VARCHAR)                   │  ← Székhely címe
│     aktiv (BOOL)                    │  ← Aktív partner-e
└─────────────────────────────────────┘
```

**Példa beszállítók:**
- Makita Hungary Kft.
- Bosch Magyarország
- FGS Group
- Helyi nagykereskedők

---

### 4. BEVÉTELEZÉS Entitás (Fejléc)

Beszállítói számlák nyilvántartása - fejléc adatok.

```
┌─────────────────────────────────────┐
│           BEVÉTELEZÉS               │
├─────────────────────────────────────┤
│ PK  bevetelez_id (INT)              │
├─────────────────────────────────────┤
│     bizonylat_szam (VARCHAR)        │  ← Belső bizonylat szám
│     szamla_szam (VARCHAR)           │  ← Beszállító számla sz.
│     datum (DATE)                    │  ← Bevételezés dátuma
│     fizetes_mod (ENUM)              │  ← Készpénz/Átutalás
│     penznem (ENUM: HUF/EUR)         │  ← Pénznem
│     brutto_osszeg (DECIMAL)         │  ← Teljes bruttó
│     netto_osszeg (DECIMAL)          │  ← Teljes nettó
│     fuvarkoltseg (DECIMAL)          │  ← Szállítási költség
│ FK  rogzito_id (INT)                │  → FELHASZNÁLÓ
│     rogzites_datum (DATETIME)       │  ← Rögzítés időpont
└─────────────────────────────────────┘
```

**Fizetési módok:**
| Kód | Jelentés |
|-----|----------|
| `keszpenz` | Készpénzes fizetés |
| `atutalas` | Banki átutalás |

**Pénznemek:**
| Kód | Jelentés |
|-----|----------|
| `HUF` | Magyar forint |
| `EUR` | Euró |

---

### 5. BEVÉTELEZÉS_TÉTEL Entitás

Bevételezés tételsorai - a konkrét cikkek és mennyiségek.

```
┌─────────────────────────────────────┐
│        BEVÉTELEZÉS_TÉTEL            │
├─────────────────────────────────────┤
│ PK  tetel_id (INT)                  │
├─────────────────────────────────────┤
│ FK  bevetelez_id (INT)              │  → BEVÉTELEZÉS
│ FK  cikk_id (INT)                   │  → CIKK
│     mennyiseg (INT)                 │  ← Darabszám
│     egysegar (DECIMAL)              │  ← Egységár (nettó)
│     osszeg (DECIMAL)                │  ← Tétel összeg
└─────────────────────────────────────┘
```

**Számított mező:**
```
osszeg = mennyiseg × egysegar
```

---

### 6. KÉSZLET_MOZGÁS Entitás

Készletváltozások naplózása - audit trail.

```
┌─────────────────────────────────────┐
│         KÉSZLET_MOZGÁS              │
├─────────────────────────────────────┤
│ PK  mozgas_id (INT)                 │
├─────────────────────────────────────┤
│ FK  cikk_id (INT)                   │  → CIKK
│     tipus (ENUM: +/-)               │  ← Növekedés/Csökkenés
│     mennyiseg (INT)                 │  ← Változás mértéke
│     megjegyzes (VARCHAR)            │  ← Mozgás oka
│     datum (DATETIME)                │  ← Időpont
│ FK  rogzito_id (INT)                │  → FELHASZNÁLÓ
└─────────────────────────────────────┘
```

**Mozgás típusok:**
| Típus | Jelentés | Példa |
|-------|----------|-------|
| `+` | Készlet növekedés | Bevételezés, visszavét |
| `-` | Készlet csökkenés | Eladás, selejtezés |

**Tipikus megjegyzések:**
- "Bevételezés #123"
- "Eladás - Partner: Kiss János"
- "Átcsoportosítás → KGC-12345"
- "Leltárkülönbözet"
- "Selejtezés - Sérült"

---

## Kapcsolatok (Relationships)

### Kapcsolati Diagram

```
                    ┌─────────────┐
                    │ CIKKCSOPORT │
                    └──────┬──────┘
                           │ 1
                           │
                           │ N
┌─────────────┐    ┌───────┴──────┐    ┌─────────────────┐
│ BESZÁLLÍTÓ  │───<│    CIKK      │>───│ KÉSZLET_MOZGÁS  │
└─────────────┘ 1  └───────┬──────┘ 1  └─────────────────┘
       N                   │ N                   N
                           │
                           │
              ┌────────────┴────────────┐
              │                         │
              │    ┌────────────────┐   │
              │    │ BEVÉTELEZÉS    │   │
              │    │   _TÉTEL       │   │
              │    └───────┬────────┘   │
              │            │ N          │
              │            │            │
              │            │ 1          │
              │    ┌───────┴────────┐   │
              │    │  BEVÉTELEZÉS   │   │
              │    └────────────────┘   │
              │                         │
              └─────────────────────────┘
```

### Kapcsolat Részletek

| Kapcsolat | Típus | Kardinalitás | Leírás |
|-----------|-------|--------------|--------|
| CIKK → CIKKCSOPORT | FK | N:1 | Egy cikk egy csoporthoz tartozik |
| CIKK → BESZÁLLÍTÓ | FK | N:1 | Egy cikk egy beszállítótól jön |
| CIKK → KÉSZLET_MOZGÁS | FK | 1:N | Egy cikknek több mozgása lehet |
| BEVÉTELEZÉS → BEV_TÉTEL | FK | 1:N | Egy bevételezésnek több tétele |
| CIKK → BEV_TÉTEL | FK | 1:N | Egy cikk több tételben szerepelhet |

---

## Adatbázis Indexek

```sql
-- Cikk keresés
CREATE UNIQUE INDEX idx_cikk_cikkszam ON CIKK(cikkszam);
CREATE INDEX idx_cikk_tenant ON CIKK(tenant_id);
CREATE INDEX idx_cikk_vonalkod ON CIKK(vonalkod);
CREATE INDEX idx_cikk_csoport ON CIKK(cikkcsoport_id);
CREATE INDEX idx_cikk_beszallito ON CIKK(beszallito_id);

-- Bevételezés keresés
CREATE INDEX idx_bevetelez_datum ON BEVETELEZ(datum);
CREATE INDEX idx_bevetelez_szamla ON BEVETELEZ(szamla_szam);

-- Készlet mozgás
CREATE INDEX idx_keszlet_cikk ON KESZLET_MOZGAS(cikk_id);
CREATE INDEX idx_keszlet_datum ON KESZLET_MOZGAS(datum);
```

---

## Készlet Számítás

A CIKK.keszlet mező értéke a KÉSZLET_MOZGÁS táblából számítható:

```sql
SELECT
    c.cikk_id,
    c.cikkszam,
    SUM(CASE WHEN km.tipus = '+' THEN km.mennyiseg
             WHEN km.tipus = '-' THEN -km.mennyiseg
        END) AS szamitott_keszlet
FROM CIKK c
LEFT JOIN KESZLET_MOZGAS km ON c.cikk_id = km.cikk_id
GROUP BY c.cikk_id, c.cikkszam;
```

**Megjegyzés:** A CIKK.keszlet denormalizált mező a gyorsabb lekérdezéshez. A KÉSZLET_MOZGÁS tábla az audit célokra szolgál.

---

## Jelmagyarázat

| Jelölés | Jelentés |
|---------|----------|
| 🏢 | Multi-tenant mező (ADR-001) |
| 📶 | Offline sync mező (ADR-002) |
| 💰 | Automatikus árazás kapcsolat (7.rész) |
| PK | Primary Key |
| FK | Foreign Key |
| UNIQUE | Egyedi érték |
| ENUM | Felsorolás típus |

---

## 7. Pénzügyi Entitások (8. rész bővítés) 🆕

### ELŐLEG Entitás

Előleg számlák kezelése nagyobb összegű rendeléseknél.

```
┌─────────────────────────────────────┐
│            ELŐLEG                   │
├─────────────────────────────────────┤
│ PK  eloleg_id (INT)                 │
├─────────────────────────────────────┤
│ FK  partner_id (INT)                │  → PARTNER
│ FK  megrendeles_id (INT)            │  → Megrendelés
│     osszeg (DECIMAL)                │  ← Előleg összeg (Ft)
│     befizetve (DATETIME)            │  ← Befizetés időpontja
│     szamla_szam (VARCHAR)           │  ← Előlegszámla szám
│     statusz (ENUM)                  │  ← varakozik/befizetve/elszamolva
│     tenant_id (UUID) 🏢             │
└─────────────────────────────────────┘
```

**Státusz értékek:**
| Érték | Leírás |
|-------|--------|
| `varakozik` | Előleg kiállítva, fizetésre vár |
| `befizetve` | Előleg beérkezett |
| `elszamolva` | Végszámlán elszámolva |

---

### DÍJBEKÉRŐ Entitás

Fizetési felszólítások és emlékeztetők.

```
┌─────────────────────────────────────┐
│           DÍJBEKÉRŐ                 │
├─────────────────────────────────────┤
│ PK  dijbekero_id (INT)              │
├─────────────────────────────────────┤
│ FK  partner_id (INT)                │  → PARTNER
│ FK  szamla_id (INT)                 │  → SZÁMLA
│     osszeg (DECIMAL)                │  ← Tartozás összeg
│     hatarido (DATE)                 │  ← Fizetési határidő
│     kuldve (DATETIME)               │  ← Küldés időpontja
│     fizetve (DATETIME)              │  ← Beérkezés időpontja
│     statusz (ENUM)                  │  ← kuldott/fizetve/kesedelmes
│     tenant_id (UUID) 🏢             │
└─────────────────────────────────────┘
```

**Státusz értékek:**
| Érték | Leírás |
|-------|--------|
| `kuldott` | Díjbekérő kiküldve |
| `fizetve` | Összeg beérkezett |
| `kesedelmes` | Határidő lejárt, nem fizetve |

---

## Kapcsolódó Dokumentumok

- [02-ertekesites-folyamat.md](02-ertekesites-folyamat.md) - Folyamatábra
- [07-arrazas-automatizalas.md](07-arrazas-automatizalas.md) - Automatikus árazás
- [01-ugyfelfelvitel-erd.md](01-ugyfelfelvitel-erd.md) - Partner entitások
- [08-reszletfizetes-folyamat.md](08-reszletfizetes-folyamat.md) - Részletfizetés folyamat 🆕
