# 4. Szerviz Modul - ERD (Entitás-Kapcsolat Diagram)

## Diagram Alapinformációk

| Tulajdonság | Érték |
|-------------|-------|
| **Fájlnév** | `4-szerviz-erd.excalidraw` |
| **Típus** | ERD (Entity-Relationship Diagram) |
| **Modul** | Szerviz |
| **Verzió** | v2.0 (Multi-tenant) |
| **Kategória** | 4. rész - Szerviz Modul |

---

## Részletes Leírás

Ez az ERD diagram a **szerviz modul adatmodelljét** mutatja be. A szerviz entitások a következő fő területeket fedik le:
- Munkalap nyilvántartás
- Szerviz tételek (alkatrészek, munkadíj)
- Árajánlat kezelés
- Nagy céges (belső ügyfél) kezelés

---

## Entitások Részletes Leírása

### 1. PARTNER Entitás (Ügyfél)

A szervizbe hozott gépek tulajdonosai.

```
┌─────────────────────────────────────┐
│            PARTNER                  │
├─────────────────────────────────────┤
│ PK  partner_id (INT)                │
│     tenant_id (UUID) 🏢             │
├─────────────────────────────────────┤
│     nev (VARCHAR)                   │
│     adoszam (VARCHAR)               │
│     cim (VARCHAR)                   │
│     telefon (VARCHAR)               │
│     email (VARCHAR)                 │
└─────────────────────────────────────┘
```

**Kapcsolat a szervizhez:**
- Egy partner több munkalapot indíthat
- Partner adatok a számlázáshoz szükségesek

---

### 2. MUNKALAP Entitás (Központi entitás)

A szerviz folyamat központi entitása.

```
┌─────────────────────────────────────┐
│           MUNKALAP                  │
├─────────────────────────────────────┤
│ PK  munkalap_szam (VARCHAR)         │  ← Egyedi azonosító (ML-YYYY-NNNNN)
├─────────────────────────────────────┤
│ FK  ugyfél_id (INT)                 │  → PARTNER
│ FK  felvevo_id (INT)                │  → FELHASZNALO
│     gep_azonosito (VARCHAR)         │  ← Gép belső azonosító
│     geptipus (VARCHAR)              │  ← Gyártó + modell
│     felvetel_datum (DATETIME)       │  ← Felvétel időpontja
│     problema_leiras (TEXT)          │  ← Ügyfél által leírt hiba
│     statusz (ENUM)                  │  ← Munkalap státusza
│     vonalkod (VARCHAR)              │  ← Generált vonalkód
└─────────────────────────────────────┘
```

**Munkalap szám formátum:**
- `ML-YYYY-NNNNN` (pl. ML-2024-00123)
- Év + sorszám kombinációja
- Egyedi a rendszerben

**Státusz értékek:**
| Kód | Jelentés | Leírás |
|-----|----------|--------|
| `felveve` | Felvéve | Gép beérkezett |
| `arajanalt` | Árajánlat | Árajánlat készült |
| `javitas_alatt` | Javítás alatt | Munka folyamatban |
| `szamlazható` | Számlázható | Javítás kész, várja számlázást |

---

### 3. MUNKALAP_TETEL Entitás

Egy munkalaphoz tartozó tételek (alkatrészek, munkadíj).

```
┌─────────────────────────────────────┐
│        MUNKALAP_TETEL               │
├─────────────────────────────────────┤
│ PK  tetel_id (INT)                  │
├─────────────────────────────────────┤
│ FK  munkalap_id (VARCHAR)           │  → MUNKALAP
│ FK  cikkszam (VARCHAR)              │  → CIKK
│     mennyiseg (INT)                 │  ← Felhasznált mennyiség
│     egysegar (DECIMAL)              │  ← Egységár
│     megjegyzes (TEXT)               │  ← Megjegyzés a tételhez
└─────────────────────────────────────┘
```

**Tétel típusok:**
- Alkatrész (készletről)
- Munkadíj (szolgáltatás)
- Kiszállás (ha van)

**Nullás kifuttatás esetén:**
- `egysegar = 0` (nagy céges folyamat)
- Készlet NEM csökken
- Csak nyomon követési célra

---

### 4. ARAJANALT Entitás

Árajánlatok nyilvántartása.

```
┌─────────────────────────────────────┐
│           ARAJANALT                 │
├─────────────────────────────────────┤
│ PK  arajanalt_szam (VARCHAR)        │  ← Árajánlat azonosító
├─────────────────────────────────────┤
│ FK  munkalap_id (VARCHAR)           │  → MUNKALAP
│ FK  vevo_id (INT)                   │  → PARTNER (címzett)
│     hivatkozasi_szam (VARCHAR)      │  ← Külső hivatkozás
│     osszeg (DECIMAL)                │  ← Végösszeg
│     statusz (ENUM)                  │  ← Árajánlat státusz
│     oradij (DECIMAL)                │  ← Munkadíj/óra
└─────────────────────────────────────┘
```

**Árajánlat státuszok:**
| Kód | Jelentés |
|-----|----------|
| `keszitett` | Elkészítve, ügyfélnek elküldve |
| `elfogadva` | Ügyfél elfogadta |
| `elutasitva` | Ügyfél elutasította |
| `lejart` | Érvényesség lejárt |

---

### 5. FELHASZNALO Entitás

A szerviz felvételt végző felhasználók.

```
┌─────────────────────────────────────┐
│          FELHASZNALO                │
├─────────────────────────────────────┤
│ PK  felhasznalo_id (INT)            │
├─────────────────────────────────────┤
│     nev (VARCHAR)                   │  ← Teljes név
│     kod (VARCHAR)                   │  ← Gyors azonosító
│     szerepkor (ENUM)                │  ← RBAC szerepkör
└─────────────────────────────────────┘
```

---

### 6. CIKK Entitás

Alkatrészek és szolgáltatások.

```
┌─────────────────────────────────────┐
│              CIKK                   │
├─────────────────────────────────────┤
│ PK  cikkszam (VARCHAR)              │
├─────────────────────────────────────┤
│     megnevezes (VARCHAR)            │
│     egysegar (DECIMAL)              │
│     keszlet (INT)                   │
│     vonalkod (VARCHAR)              │
└─────────────────────────────────────┘
```

---

### 7. BELSO_UGYFÉL Entitás

Nagy céges partnerek telephelyei.

```
┌─────────────────────────────────────┐
│         BELSO_UGYFÉL                │
├─────────────────────────────────────┤
│ PK  kod (VARCHAR)                   │  ← Belső kód
├─────────────────────────────────────┤
│ FK  fo_partner_id (INT)             │  → PARTNER (fő cég)
│     telephely (VARCHAR)             │  ← Telephely neve/címe
│     megjegyzes (TEXT)               │  ← Megjegyzések
└─────────────────────────────────────┘
```

**Mire szolgál:**
- Nagy cégek több telephellyel rendelkezhetnek
- Minden telephely külön "belső ügyfél"
- A számlázás a fő partnerre megy
- A követés telephely szinten történik

---

## Kapcsolatok (Relationships)

### Kapcsolati Diagram

```
┌─────────────┐         ┌─────────────────┐         ┌─────────────┐
│  PARTNER    │────1:N──│    MUNKALAP     │────1:N──│ MUNKALAP_   │
│             │         │                 │         │   TETEL     │
└──────┬──────┘         └────────┬────────┘         └──────┬──────┘
       │                         │                         │
       │                         │ 1:N                     │ N:1
       │                    ┌────┴────┐                    │
       │                    │         │                    │
       │            ┌───────┴───┐     │            ┌───────┴───┐
       │            │ ARAJANALT │     │            │   CIKK    │
       │            └───────────┘     │            └───────────┘
       │                              │
       │ 1:N                          │ N:1
       │                              │
┌──────┴──────┐               ┌───────┴───────┐
│BELSO_UGYFÉL │               │ FELHASZNALO   │
└─────────────┘               └───────────────┘
```

### Kapcsolat Részletek

| Kapcsolat | Típus | Leírás |
|-----------|-------|--------|
| PARTNER → MUNKALAP | 1:N | Egy partner több munkalapot indíthat |
| MUNKALAP → MUNKALAP_TETEL | 1:N | Egy munkalapnak több tétele lehet |
| MUNKALAP → ARAJANALT | 1:N | Egy munkalaphoz több árajánlat készülhet |
| FELHASZNALO → MUNKALAP | 1:N | Egy felhasználó több munkalapot vehet fel |
| CIKK → MUNKALAP_TETEL | 1:N | Egy cikk több tételben szerepelhet |
| PARTNER → BELSO_UGYFÉL | 1:N | Egy partnernek több telephelye lehet |

---

## Adatbázis Indexek

```sql
-- Munkalap keresés
CREATE INDEX idx_munkalap_statusz ON MUNKALAP(statusz);
CREATE INDEX idx_munkalap_datum ON MUNKALAP(felvetel_datum);
CREATE INDEX idx_munkalap_ugyfél ON MUNKALAP(ugyfél_id);

-- Tétel keresés
CREATE INDEX idx_tetel_munkalap ON MUNKALAP_TETEL(munkalap_id);
CREATE INDEX idx_tetel_cikk ON MUNKALAP_TETEL(cikkszam);

-- Árajánlat keresés
CREATE INDEX idx_arajanalt_munkalap ON ARAJANALT(munkalap_id);
CREATE INDEX idx_arajanalt_statusz ON ARAJANALT(statusz);
```

---

## Megjegyzések

### Fontos üzleti szabályok

1. **BELSO_UGYFÉL entitás**
   - Nagy céges telephelyek követésére szolgál
   - A fő partner a "fo_partner_id" mezőben van
   - Lehetővé teszi a telephely szintű kimutatásokat

2. **ARAJANALT entitás**
   - Csak nagy céges folyamatban használatos
   - A "hivatkozasi_szam" a cég belső azonosítója
   - Státusz követi az elfogadást

3. **Státusz a számlázáshoz**
   - CSAK "Számlázható" státuszban lehet számlát kiállítani
   - Más státuszban a számlázás blokkolva van
   - Ez biztosítja a folyamat betartását

---

## Jelmagyarázat

| Jelölés | Jelentés |
|---------|----------|
| 🏢 | Multi-tenant mező |
| PK | Primary Key |
| FK | Foreign Key |
| ENUM | Felsorolás típus |
| 1:N | Egy-a-többhöz kapcsolat |
| N:1 | Több-az-egyhez kapcsolat |

---

## 8. Garanciális Javítás Entitások (8. rész bővítés) 🆕

### GARANCIA_SZERZŐDÉS Entitás

Gyártói garancia keretszerződések nyilvántartása.

```
┌─────────────────────────────────────┐
│      GARANCIA_SZERZŐDÉS             │
├─────────────────────────────────────┤
│ PK  garancia_id (INT)               │
├─────────────────────────────────────┤
│ FK  gyarto_id (INT)                 │  → BESZÁLLÍTÓ
│     gyarto_nev (VARCHAR)            │  ← Makita, Bosch, stb.
│     garancia_honap (INT)            │  ← 12, 24, 36
│     szerv_tipus (ENUM)              │  ← norma/egyedi
│     norma_tabla_url (VARCHAR)       │  ← Excel/PDF link
│     elszamolas_mod (VARCHAR)        │
│     aktiv (BOOL)                    │
└─────────────────────────────────────┘
```

**Szerviz típusok:**
| Típus | Leírás |
|-------|--------|
| `norma` | Makita norma táblázat alapján (fix perc/munka) |
| `egyedi` | Egyedi elbírálás (fotó + leírás alapján) |

---

### GARANCIA_CLAIM Entitás

Garanciális javítás elszámolások.

```
┌─────────────────────────────────────┐
│         GARANCIA_CLAIM              │
├─────────────────────────────────────┤
│ PK  claim_id (INT)                  │
├─────────────────────────────────────┤
│ FK  munkalap_id (VARCHAR)           │  → MUNKALAP
│ FK  garancia_id (INT)               │  → GARANCIA_SZERZŐDÉS
│     bejelentes_datum (DATE)         │
│     hiba_leiras (TEXT)              │
│     statusz (ENUM)                  │
│     norma_perc (INT)                │
│     dijazas_osszeg (DECIMAL)        │
│     fizetve (BOOL)                  │
└─────────────────────────────────────┘
```

---

### NORMA_TÉTEL Entitás

Makita norma táblázat tételei.

```
┌─────────────────────────────────────┐
│          NORMA_TÉTEL                │
├─────────────────────────────────────┤
│ PK  norma_id (INT)                  │
├─────────────────────────────────────┤
│ FK  garancia_id (INT)               │  → GARANCIA_SZERZŐDÉS
│     hibakod (VARCHAR)               │  ← Pl. "DHP453-MOT-01"
│     hiba_nev (VARCHAR)              │
│     norma_perc (INT)                │  ← Fix javítási idő
│     anyag_tartalmazott (BOOL)       │
│     megjegyzes (TEXT)               │
└─────────────────────────────────────┘
```

---

## Kapcsolódó Dokumentumok

- [04-szerviz-folyamat.md](04-szerviz-folyamat.md) - Szerviz folyamatábra
- [04-szerviz-munkalap.md](04-szerviz-munkalap.md) - Munkalap életciklus
- [01-ugyfelfelvitel-erd.md](01-ugyfelfelvitel-erd.md) - Partner entitás részletek
- [08-garancialis-javitas.md](08-garancialis-javitas.md) - Garanciális javítás részletes folyamat 🆕
