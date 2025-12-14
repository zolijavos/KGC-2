# 2. Értékesítés ERD v3.0 (Módosítások)

## Diagram Alapinformációk

| Tulajdonság | Érték |
|-------------|-------|
| **Fájlnév** | `02-ertekesites-erd-2025-12-12.excalidraw` |
| **Típus** | ERD (Entity-Relationship Diagram) |
| **Modul** | Értékesítés / Készletkezelés |
| **Verzió** | v3.0 |
| **Dátum** | 2025-12-12 |
| **Státusz** | MÓDOSÍTOTT |
| **Forrás** | fit-gap-analysis-2025-12-12.md |

---

## Részletes Leírás

Ez az ERD diagram a **CIKK** és **KÉSZLET_MOZGÁS** entitások módosításait mutatja be a multi-location készletkezelés támogatásához. A változások biztosítják, hogy minden készletmozgás nyomon követhető legyen tárhely szinten.

---

## Módosított Entitás: CIKK

```
┌─────────────────────────────────────────────────────────────┐
│                         CIKK                                │
│                    (Módosítások v3.0)                       │
├─────────────────────────────────────────────────────────────┤
│ PK  cikk_id            INT           Egyedi azonosító       │
│     tenant_id          UUID          Multi-tenant azonosító │
│     cikkszam           VARCHAR       UNIQUE, üzleti kód     │
│     megnevezes         VARCHAR       Terméknév              │
├─────────────────────────────────────────────────────────────┤
│ FK  cikkcsoport_id     INT           → CIKKCSOPORT          │
│ FK  beszallito_id      INT           → PARTNER              │
│ FK  arres_kategoria_id INT           → ARRES_KATEGORIA      │
├─────────────────────────────────────────────────────────────┤
│     vonalkod           VARCHAR       EAN/UPC kód            │
│     afa_tipus          ENUM          ÁFA kulcs              │
│     beszerzesi_ar      DECIMAL       Nettó beszerzés        │
│     eladasi_ar         DECIMAL       Bruttó eladási ár      │
├─────────────────────────────────────────────────────────────┤
│ 🔄  keszlet            INT           KALKULÁLT MEZŐ!        │
│                                      SUM(KÉSZLET_HELY.      │
│                                          mennyiseg)         │
├─────────────────────────────────────────────────────────────┤
│ 🔄  alap_tarhely       VARCHAR       Alapértelmezett        │
│                                      tárhely (átnevezve     │
│                                      tarhely-ről)           │
├─────────────────────────────────────────────────────────────┤
│     aktiv              BOOLEAN       Forgalmazható-e        │
│     offline_sync       BOOLEAN       Offline szinkron       │
└─────────────────────────────────────────────────────────────┘
```

### Mezőváltozások

| Régi mező | Új mező | Változás |
|-----------|---------|----------|
| `tarhely: VARCHAR` | `alap_tarhely: VARCHAR` | Átnevezés |
| `keszlet: INT` (tárolt) | `keszlet: INT` (kalkulált) | Számított érték |

### Készlet Számítás

```sql
-- CIKK.keszlet = SUM(KÉSZLET_HELY.mennyiseg)
SELECT
    c.cikk_id,
    c.cikkszam,
    c.megnevezes,
    COALESCE(SUM(kh.mennyiseg), 0) AS keszlet
FROM CIKK c
LEFT JOIN KESZLET_HELY kh
    ON c.cikk_id = kh.cikk_id
    AND kh.aktiv = TRUE
WHERE c.tenant_id = @tenant_id
GROUP BY c.cikk_id, c.cikkszam, c.megnevezes;
```

---

## Módosított Entitás: KÉSZLET_MOZGÁS

```
┌─────────────────────────────────────────────────────────────┐
│                    KÉSZLET_MOZGÁS                           │
│                   (Bővített v3.0)                           │
├─────────────────────────────────────────────────────────────┤
│ PK  mozgas_id          INT           Egyedi azonosító       │
│     tenant_id          UUID          Multi-tenant azonosító │
├─────────────────────────────────────────────────────────────┤
│ FK  cikk_id            INT           → CIKK                 │
│     tipus              ENUM          +/-/T/L                │
│     mennyiseg          INT           Változás mértéke       │
│     megjegyzes         VARCHAR       Mozgás oka/leírása     │
│     datum              DATETIME      Mozgás időpontja       │
│ FK  rogzito_id         INT           → FELHASZNÁLÓ          │
├─────────────────────────────────────────────────────────────┤
│ 🆕  tarhely_kod        VARCHAR(20)   Érintett tárhely       │
│                                      (be/kivétnél)          │
├─────────────────────────────────────────────────────────────┤
│ 🆕  forras_tarhely     VARCHAR(20)   Átcsoportosításnál:    │
│                                      honnan                 │
├─────────────────────────────────────────────────────────────┤
│ 🆕  cel_tarhely        VARCHAR(20)   Átcsoportosításnál:    │
│                                      hova                   │
└─────────────────────────────────────────────────────────────┘
```

### Új Mezők Részletezése

| Mező | Típus | Kötelező | Leírás |
|------|-------|----------|--------|
| `tarhely_kod` | VARCHAR(20) | Feltételes | Be/kivétnél kitöltendő |
| `forras_tarhely` | VARCHAR(20) | Feltételes | T típusnál kötelező |
| `cel_tarhely` | VARCHAR(20) | Feltételes | T típusnál kötelező |

---

## Mozgás Típusok (Bővített)

```
┌─────────────────────────────────────────────────────────────┐
│                 MOZGÁS TÍPUSOK v3.0                         │
├─────────────────────────────────────────────────────────────┤
│ +  = Bevételezés (készlet nő)                               │
│      → tarhely_kod: hova került                             │
│                                                             │
│ -  = Kiadás (eladás/bérlés)                                │
│      → tarhely_kod: honnan ment ki                         │
│                                                             │
│ T  = Átcsoportosítás 🆕                                     │
│      → forras_tarhely: honnan                              │
│      → cel_tarhely: hova                                   │
│                                                             │
│ L  = Leltár korrekció                                       │
│      → tarhely_kod: melyik helyen korrigálva               │
└─────────────────────────────────────────────────────────────┘
```

### Típus Használati Mátrix

| Típus | Művelet | tarhely_kod | forras_tarhely | cel_tarhely |
|-------|---------|-------------|----------------|-------------|
| `+` | Bevételezés | ✓ Cél hely | - | - |
| `-` | Kiadás | ✓ Forrás hely | - | - |
| `T` | Átcsoportosítás | - | ✓ Honnan | ✓ Hova |
| `L` | Leltár korrekció | ✓ Érintett hely | - | - |

---

## Kapcsolati Diagram

```
                    ┌─────────────────────┐
                    │        CIKK         │
                    │   (alap_tarhely,    │
                    │    keszlet=SUM)     │
                    └──────────┬──────────┘
                               │ 1
                               │
               ┌───────────────┼───────────────┐
               │               │               │
               │ N             │ N             │ N
      ┌────────▼────────┐ ┌────▼────┐ ┌───────▼────────┐
      │  KÉSZLET_HELY   │ │ SZÁMLA_ │ │ KÉSZLET_MOZGÁS │
      │  (mennyiseg,    │ │  TÉTEL  │ │ (tarhely_kod,  │
      │   prioritas)    │ │         │ │  forras/cel)   │
      └─────────────────┘ └─────────┘ └────────────────┘
```

### Kapcsolatok

| Kapcsolat | Típus | Leírás |
|-----------|-------|--------|
| CIKK → KÉSZLET_HELY | 1:N | Egy cikk több tárhelyen |
| CIKK → KÉSZLET_MOZGÁS | 1:N | Egy cikkhez több mozgás |
| KÉSZLET_HELY → KÉSZLET_MOZGÁS | 1:N | Tárhelyhez mozgások (implicit) |

---

## Hivatkozott Entitás: KÉSZLET_HELY

```
┌─────────────────────────────────────────────────────────────┐
│                    KÉSZLET_HELY                             │
│          (Részletek: 02-keszlet-multi-location-erd)         │
├─────────────────────────────────────────────────────────────┤
│ FK  cikk_id            INT           → CIKK                 │
│     tarhely_kod        VARCHAR(20)   Fizikai hely kódja     │
│     mennyiseg          INT           Darabszám ezen helyen  │
│     kiadasi_prioritas  INT           Kiadási sorrend        │
├─────────────────────────────────────────────────────────────┤
│ CIKK.keszlet = SUM(KÉSZLET_HELY.mennyiseg)                  │
└─────────────────────────────────────────────────────────────┘
```

---

## Változások Összefoglalója

### CIKK Módosítások

| Változás | Régi | Új |
|----------|------|-----|
| Készlet mező | Tárolt érték | Kalkulált (SUM) |
| Tárhely mező | `tarhely` | `alap_tarhely` |
| Készlet forrás | Direkt | KÉSZLET_HELY aggregáció |

### KÉSZLET_MOZGÁS Bővítések

| Új mező | Cél |
|---------|-----|
| `tarhely_kod` | Egyszerű be/kivét helye |
| `forras_tarhely` | Átcsoportosítás forrás |
| `cel_tarhely` | Átcsoportosítás cél |
| Tipus `T` | Új típus: átcsoportosítás |

---

## Kapcsolódó Dokumentumok

- [02-keszlet-multi-location-erd-2025-12-12.md](02-keszlet-multi-location-erd-2025-12-12.md) - KÉSZLET_HELY részletek
- [02-ertekesites-erd.md](02-ertekesites-erd.md) - Alap értékesítés ERD
- [fit-gap-analysis-2025-12-12.md](../fit-gap-analysis-2025-12-12.md) - Követelmény forrás
