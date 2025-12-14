# 2. Készlet Multi-location ERD

## Diagram Alapinformációk

| Tulajdonság | Érték |
|-------------|-------|
| **Fájlnév** | `2-keszlet-multi-location-erd-2025-12-12.excalidraw` |
| **Típus** | ERD (Entity-Relationship Diagram) |
| **Modul** | Készletkezelés |
| **Verzió** | v3.0 |
| **Dátum** | 2025-12-12 |
| **Státusz** | ÚJ |
| **Forrás** | fit-gap-analysis-2025-12-12.md |

---

## Részletes Leírás

Ez az ERD diagram a **multi-location készletkezelés** adatmodelljét mutatja be. Az új `KÉSZLET_HELY` entitás lehetővé teszi, hogy egy cikk több fizikai tárhelyen legyen nyilvántartva, külön mennyiséggel és kiadási prioritással.

---

## Új Entitás: KÉSZLET_HELY

A `CIKK` és a fizikai `TÁRHELY` közötti N:M kapcsolatot valósítja meg.

```
┌─────────────────────────────────────────────────────────────┐
│                      KÉSZLET_HELY                           │
│                   (Inventory Location)                       │
├─────────────────────────────────────────────────────────────┤
│ PK  keszlet_hely_id    INT           Egyedi azonosító       │
│     tenant_id          UUID          Multi-tenant azonosító │
├─────────────────────────────────────────────────────────────┤
│ FK  cikk_id            INT           → CIKK                 │
│     tarhely_kod        VARCHAR(20)   Fizikai hely kódja     │
│     mennyiseg          INT           Darabszám ezen a helyen│
│     kiadasi_prioritas  INT           Kiadási sorrend (1=első)│
│     utolso_frissites   DATETIME      Utolsó mozgás időpontja│
│     aktiv              BOOLEAN       Aktív tárhely-e        │
│     created_at         DATETIME      Létrehozás             │
│     updated_at         DATETIME      Módosítás              │
└─────────────────────────────────────────────────────────────┘
```

### Mezők Részletezése

| Mező | Típus | Kötelező | Leírás |
|------|-------|----------|--------|
| `keszlet_hely_id` | INT | PK | Auto-increment azonosító |
| `tenant_id` | UUID | Igen | Franchise partner azonosító (ADR-001) |
| `cikk_id` | INT (FK) | Igen | Termék hivatkozás |
| `tarhely_kod` | VARCHAR(20) | Igen | Strukturált helykód (pl. A1-POLC-03) |
| `mennyiseg` | INT | Igen | Aktuális készlet ezen a helyen (>=0) |
| `kiadasi_prioritas` | INT | Igen | 1 = legmagasabb prioritás (legközelebb/legpörgősebb) |
| `utolso_frissites` | DATETIME | Nem | Utolsó be/kivét időpontja |
| `aktiv` | BOOLEAN | Igen | Használható-e ez a tárhely |

### Tárhely Kód Formátum

```
Formátum: {ZÓNA}{SOR}-{TÍPUS}-{SZINT}

Példák:
├── A1-POLC-01    → A zóna, 1. sor, Polc, 1. szint
├── A1-POLC-02    → A zóna, 1. sor, Polc, 2. szint
├── B2-RAKTAR-00  → B zóna, 2. sor, Raktár, földszint
├── P1-PULT-01    → Pult zóna, 1. pult, 1. szint
└── K1-KIJARAT-00 → Kijárat melletti gyors hozzáférés
```

### Kiadási Prioritás Értelmezése

| Prioritás | Jelentés | Használat |
|-----------|----------|-----------|
| 1 | Legmagasabb | Pult melletti, leggyorsabban elérhető |
| 2 | Magas | Eladótér, könnyen hozzáférhető |
| 3 | Közepes | Raktár első sorok |
| 4 | Alacsony | Raktár hátsó rész |
| 5 | Legalacsonyabb | Távoli raktár, ritkán használt |

---

## Módosított Entitás: CIKK

```
┌─────────────────────────────────────────────────────────────┐
│                         CIKK                                │
│                    (Módosítások v3.0)                       │
├─────────────────────────────────────────────────────────────┤
│     ...meglévő mezők...                                     │
├─────────────────────────────────────────────────────────────┤
│     keszlet            INT    🔄 KALKULÁLT MEZŐ             │
│                               (SUM(KÉSZLET_HELY.mennyiseg)) │
│     alap_tarhely       VARCHAR   Alapértelmezett tárhely    │
│                               (bevételezéshez javasolt)     │
└─────────────────────────────────────────────────────────────┘
```

### Változások

| Régi | Új | Magyarázat |
|------|-----|------------|
| `tarhely: VARCHAR` | `alap_tarhely: VARCHAR` | Átnevezés, opcionális |
| `keszlet: INT` (tárolt) | `keszlet: INT` (kalkulált) | Összeg a KÉSZLET_HELY-ből |

### Készlet Számítás

```sql
-- Cikk összkészlete
SELECT
    c.cikk_id,
    c.cikkszam,
    COALESCE(SUM(kh.mennyiseg), 0) AS keszlet
FROM CIKK c
LEFT JOIN KESZLET_HELY kh ON c.cikk_id = kh.cikk_id AND kh.aktiv = TRUE
GROUP BY c.cikk_id, c.cikkszam;
```

---

## Módosított Entitás: KÉSZLET_MOZGÁS

```
┌─────────────────────────────────────────────────────────────┐
│                    KÉSZLET_MOZGÁS                           │
│                   (Módosítások v3.0)                        │
├─────────────────────────────────────────────────────────────┤
│ PK  mozgas_id          INT           Egyedi azonosító       │
├─────────────────────────────────────────────────────────────┤
│ FK  cikk_id            INT           → CIKK                 │
│     tipus              ENUM(+/-)     Növekedés/Csökkenés    │
│     mennyiseg          INT           Változás mértéke       │
│ 🆕 tarhely_kod         VARCHAR(20)   Melyik tárhelyről/re   │
│ 🆕 forras_tarhely      VARCHAR(20)   Átcsoportosításnál     │
│ 🆕 cel_tarhely         VARCHAR(20)   Átcsoportosításnál     │
│     megjegyzes         VARCHAR       Mozgás oka             │
│     datum              DATETIME      Időpont                │
│ FK  rogzito_id         INT           → FELHASZNÁLÓ          │
└─────────────────────────────────────────────────────────────┘
```

### Új Mezők

| Mező | Típus | Leírás |
|------|-------|--------|
| `tarhely_kod` | VARCHAR(20) | Érintett tárhely (be/kivét) |
| `forras_tarhely` | VARCHAR(20) | Átcsoportosításnál: honnan |
| `cel_tarhely` | VARCHAR(20) | Átcsoportosításnál: hova |

### Mozgás Típusok Bővítve

| Típus | Művelet | tarhely_kod | forras | cel |
|-------|---------|-------------|--------|-----|
| `+` | Bevételezés | Cél hely | - | - |
| `-` | Kiadás (eladás/bérlés) | Forrás hely | - | - |
| `T` | Átcsoportosítás | - | Honnan | Hova |
| `L` | Leltár korrekció | Érintett hely | - | - |

---

## Kapcsolati Diagram

```
                    ┌─────────────────┐
                    │    CIKK         │
                    │ (alap_tarhely)  │
                    └────────┬────────┘
                             │ 1
                             │
                             │ N
                    ┌────────┴────────┐
                    │  KÉSZLET_HELY   │
                    │ (tarhely_kod,   │
                    │  mennyiseg,     │
                    │  prioritas)     │
                    └────────┬────────┘
                             │ 1
                             │
                             │ N
                    ┌────────┴────────┐
                    │ KÉSZLET_MOZGÁS  │
                    │ (tarhely_kod,   │
                    │  forras/cel)    │
                    └─────────────────┘
```

### Kapcsolatok

| Kapcsolat | Típus | Kardinalitás |
|-----------|-------|--------------|
| CIKK → KÉSZLET_HELY | 1:N | Egy cikk több tárhelyen |
| KÉSZLET_HELY → KÉSZLET_MOZGÁS | 1:N | Egy helyhez több mozgás |

---

## Indexek

```sql
-- Gyors keresés cikk + tárhely alapján
CREATE UNIQUE INDEX idx_keszlet_hely_cikk_tarhely
    ON KESZLET_HELY(cikk_id, tarhely_kod);

-- Prioritás szerinti rendezés
CREATE INDEX idx_keszlet_hely_prioritas
    ON KESZLET_HELY(cikk_id, kiadasi_prioritas);

-- Tenant szűrés
CREATE INDEX idx_keszlet_hely_tenant
    ON KESZLET_HELY(tenant_id);

-- Mozgás audit
CREATE INDEX idx_keszlet_mozgas_tarhely
    ON KESZLET_MOZGAS(tarhely_kod, datum);
```

---

## Üzleti Szabályok

1. **Készlet konzisztencia:** `CIKK.keszlet = SUM(KÉSZLET_HELY.mennyiseg WHERE aktiv=TRUE)`
2. **Egyedi tárhely:** Egy cikk egy tárhelyen csak egyszer szerepelhet
3. **Prioritás egyediség:** Egy cikknél a prioritás egyedi legyen
4. **Negatív készlet tilalom:** `KÉSZLET_HELY.mennyiseg >= 0`
5. **Mozgás naplózás:** Minden készletváltozás KÉSZLET_MOZGÁS bejegyzést generál

---

## Kapcsolódó Dokumentumok

- [02-ertekesites-erd.md](02-ertekesites-erd.md) - Alap CIKK entitás
- [02-kiadasi-optimalizacio-folyamat-2025-12-12.md](02-kiadasi-optimalizacio-folyamat-2025-12-12.md) - Kiadási algoritmus
- [fit-gap-analysis-2025-12-12.md](../fit-gap-analysis-2025-12-12.md) - Követelmény forrás
