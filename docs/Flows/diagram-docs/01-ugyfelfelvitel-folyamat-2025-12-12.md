# 1. Ügyfél Felvétel Folyamat v3.0

## Diagram Alapinformációk

| Tulajdonság | Érték |
|-------------|-------|
| **Fájlnév** | `01-ugyfelfelvitel-folyamat-2025-12-12.excalidraw` |
| **Típus** | Flowchart (Folyamatábra) |
| **Modul** | Bérlés / Ügyfélkezelés |
| **Verzió** | v3.0 |
| **Dátum** | 2025-12-12 |
| **Státusz** | MÓDOSÍTOTT |
| **Forrás** | fit-gap-analysis-2025-12-12.md |

---

## Részletes Leírás

Ez a folyamatábra a **bérlés indítási folyamatot** mutatja be az új **R.1/R.2 Kiadási Javaslat** integrációval. A kezelő kap egy tárhely javaslatot a rendszertől, amit elfogadhat vagy felülbírálhat indoklással.

---

## Folyamat Lépései

```
┌─────────────────────────────────────────────────────────────┐
│                    BÉRLÉS INDÍTÁS                           │
│                  (R.1/R.2 Integráció)                       │
└─────────────────────────────────────────────────────────────┘

    ┌──────────┐
    │  Kezdés  │
    └────┬─────┘
         │
    ┌────▼─────────────────┐
    │ Partner/Ügyfél       │
    │ azonosítás           │
    └────┬─────────────────┘
         │
    ┌────▼─────────────────┐
    │ Bérlés indítása      │
    │ (időtartam választás)│
    └────┬─────────────────┘
         │
    ┌────▼─────────────────┐
    │ Bérgép kiválasztása  │
    │ (cikkszám/vonalkód)  │
    └────┬─────────────────┘
         │
    ┌────▼─────────────────────────────────────┐
    │ 🆕 R.1 Kiadási Javaslat                  │
    │                                          │
    │ KÉSZLET_HELY lekérdezés                  │
    │ prioritás szerint rendezve               │
    │ → Tárhely javaslat lista                 │
    └────┬─────────────────────────────────────┘
         │
    ┌────▼─────────────────┐
    │  R.2 Kezelő          │
    │  elfogadja?          │◄────────────────┐
    └────┬──────┬──────────┘                 │
         │      │                            │
     IGEN│      │NEM                         │
         │      │                            │
         │ ┌────▼─────────────────────────┐  │
         │ │ Felülbírálás:                │  │
         │ │ • Másik tárhely választás    │  │
         │ │ • Indoklás KÖTELEZŐ          │  │
         │ │ • KIADASI_AUDIT log          │──┘
         │ └──────────────────────────────┘
         │
    ┌────▼─────────────────┐
    │ Kaució rögzítése     │
    │ (készpénz/kártya)    │
    └────┬─────────────────┘
         │
    ┌────▼─────────────────┐
    │ KÉSZLET_HELY         │
    │ frissítés            │
    │ + KÉSZLET_MOZGÁS log │
    └────┬─────────────────┘
         │
    ┌────▼─────┐
    │   Vége   │
    └──────────┘
```

---

## R.1 Kiadási Javaslat Algoritmus

```sql
-- R.1 Algoritmus: Tárhely javaslatok prioritás szerint
SELECT
    tarhely_kod,
    mennyiseg,
    kiadasi_prioritas
FROM KESZLET_HELY
WHERE cikk_id = @cikk_id
  AND aktiv = TRUE
  AND mennyiseg > 0
ORDER BY kiadasi_prioritas ASC;

-- Eredmény: Legkisebb prioritás = legelső javaslat
```

### Prioritás Értelmezése

| Prioritás | Hely típus | Elérhetőség |
|-----------|------------|-------------|
| 1 | Pult | Leggyorsabb |
| 2 | Eladótér | Gyors |
| 3 | Raktár eleje | Közepes |
| 4 | Raktár hátulja | Lassabb |
| 5 | Távoli | Leglassabb |

---

## R.2 Felülbírálás Kezelése

### Kötelező Indoklások

| Kód | Jelentés | Leírás |
|-----|----------|--------|
| `SERULT` | Sérült termék | A javasolt helyről sérült terméket találtak |
| `LELTARELTERES` | Leltáreltérés | A rendszer szerinti készlet nem egyezik |
| `UGYFEL_KERES` | Ügyfél kérés | Az ügyfél specifikus terméket kér |
| `HOZZAFERHETO` | Könnyebb hozzáférés | A felülírt hely könnyebben elérhető |
| `EGYEB` | Egyéb | Szabad szöveges indoklás |

### KIADASI_AUDIT Bejegyzés

```sql
INSERT INTO KIADASI_AUDIT (
    tenant_id,
    cikk_id,
    javasolt_tarhely,
    valasztott_tarhely,
    indoklas_kod,
    indoklas_szoveg,
    felhasznalo_id,
    datum
) VALUES (
    @tenant_id,
    @cikk_id,
    @r1_javaslat,      -- R.1 által javasolt
    @kezelő_valasztas, -- Kezelő választása
    @indoklas_kod,     -- SERULT/EGYEB/stb.
    @szabad_szoveg,    -- Ha EGYEB
    @felhasznalo_id,
    NOW()
);
```

---

## Készletváltozás Rögzítése

### KÉSZLET_HELY Frissítés

```sql
-- Kiadásnál csökkentés
UPDATE KESZLET_HELY
SET mennyiseg = mennyiseg - @kiadott_db,
    utolso_frissites = NOW()
WHERE cikk_id = @cikk_id
  AND tarhely_kod = @valasztott_tarhely;
```

### KÉSZLET_MOZGÁS Log

```sql
INSERT INTO KESZLET_MOZGAS (
    tenant_id,
    cikk_id,
    tipus,           -- '-' (kiadás)
    mennyiseg,
    tarhely_kod,     -- 🆕 melyik tárhelyről
    megjegyzes,
    datum,
    rogzito_id
) VALUES (
    @tenant_id,
    @cikk_id,
    '-',
    @kiadott_db,
    @valasztott_tarhely,
    'Bérlés kiadás',
    NOW(),
    @felhasznalo_id
);
```

---

## Változások Összefoglalója

| Lépés | Korábbi | Új (v3.0) |
|-------|---------|-----------|
| Tárhely választás | Manuális | R.1 automatikus javaslat |
| Felülbírálás | Nincs naplózás | KIADASI_AUDIT + indoklás |
| Készlet frissítés | CIKK.keszlet | KÉSZLET_HELY.mennyiseg |
| Mozgás naplózás | Nincs tárhely | + tarhely_kod mező |

---

## Kapcsolódó Dokumentumok

- [02-keszlet-multi-location-erd-2025-12-12.md](02-keszlet-multi-location-erd-2025-12-12.md) - KÉSZLET_HELY entitás
- [02-kiadasi-optimalizacio-folyamat-2025-12-12.md](02-kiadasi-optimalizacio-folyamat-2025-12-12.md) - R.1/R.2 algoritmus részletei
- [fit-gap-analysis-2025-12-12.md](../fit-gap-analysis-2025-12-12.md) - Követelmény forrás
