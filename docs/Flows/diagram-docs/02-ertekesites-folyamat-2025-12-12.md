# 2. Értékesítés Folyamat v3.0

## Diagram Alapinformációk

| Tulajdonság | Érték |
|-------------|-------|
| **Fájlnév** | `02-ertekesites-folyamat-2025-12-12.excalidraw` |
| **Típus** | Flowchart (Folyamatábra) |
| **Modul** | Értékesítés / Bevételezés |
| **Verzió** | v3.0 |
| **Dátum** | 2025-12-12 |
| **Státusz** | MÓDOSÍTOTT |
| **Forrás** | fit-gap-analysis-2025-12-12.md |

---

## Részletes Leírás

Ez a diagram a **bevételezés** és **értékesítés** módosított folyamatait mutatja be. Mindkét folyamat integrálva lett a multi-location készletkezeléssel és a kiadási javaslat (R.1/R.2) funkcióval.

---

## BEVÉTELEZÉS Folyamat (Módosított)

```
┌─────────────────────────────────────────────────────────────┐
│                BEVÉTELEZÉS (módosított) 🔄                  │
└─────────────────────────────────────────────────────────────┘

    ┌───────────────────────────────────────────┐
    │ 1. Beszállítói számla adatok              │
    │    (szám, dátum, összeg)                  │
    └────────────────┬──────────────────────────┘
                     │
    ┌────────────────▼──────────────────────────┐
    │ 2. Tételek hozzáadása                     │
    │    (cikk, mennyiség, ár)                  │
    └────────────────┬──────────────────────────┘
                     │
    ┌────────────────▼──────────────────────────┐
    │ 🆕 3. Tárhely megadás (KÖTELEZŐ!)         │
    │    Minden tételhez:                       │
    │    → Melyik KÉSZLET_HELY-re kerül         │
    │    → Dropdown: meglévő tárhelyek          │
    └────────────────┬──────────────────────────┘
                     │
    ┌────────────────▼──────────────────────────┐
    │ 4. Összeg ellenőrzés                      │
    │    (számított vs megadott)                │
    └────────────────┬──────────────────────────┘
                     │
    ┌────────────────▼──────────────────────────┐
    │ 5. Rögzítés                               │
    │    • BEVÉTELEZÉS + TÉTEL rekordok         │
    │ 🆕 • KÉSZLET_HELY.mennyiseg += n          │
    │ 🆕 • KÉSZLET_MOZGÁS (+, tarhely_kod)      │
    │    • CIKK.keszlet = SUM(kalkulált)        │
    └───────────────────────────────────────────┘
```

### Bevételezés SQL Műveletek

```sql
-- 1. KÉSZLET_HELY frissítés vagy létrehozás
INSERT INTO KESZLET_HELY (
    tenant_id, cikk_id, tarhely_kod,
    mennyiseg, kiadasi_prioritas, aktiv
)
VALUES (
    @tenant_id, @cikk_id, @tarhely_kod,
    @mennyiseg, @prioritas, TRUE
)
ON CONFLICT (cikk_id, tarhely_kod) DO UPDATE
SET mennyiseg = KESZLET_HELY.mennyiseg + @mennyiseg,
    utolso_frissites = NOW();

-- 2. KÉSZLET_MOZGÁS naplózás
INSERT INTO KESZLET_MOZGAS (
    tenant_id, cikk_id, tipus, mennyiseg,
    tarhely_kod, megjegyzes, datum, rogzito_id
) VALUES (
    @tenant_id, @cikk_id, '+', @mennyiseg,
    @tarhely_kod, 'Bevételezés', NOW(), @felhasznalo_id
);
```

---

## ÉRTÉKESÍTÉS Folyamat (Módosított)

```
┌─────────────────────────────────────────────────────────────┐
│                ÉRTÉKESÍTÉS (módosított) 🔄                  │
└─────────────────────────────────────────────────────────────┘

    ┌───────────────────────────────────────────┐
    │ 1. Partner kiválasztás                    │
    │    (meglévő vagy új)                      │
    └────────────────┬──────────────────────────┘
                     │
    ┌────────────────▼──────────────────────────┐
    │ 2. Cikk kiválasztás                       │
    │    (cikkszám / vonalkód)                  │
    └────────────────┬──────────────────────────┘
                     │
    ┌────────────────▼──────────────────────────┐
    │ 🆕 3. R.1 Kiadási Javaslat                │
    │    KÉSZLET_HELY lekérdezés                │
    │    prioritás szerint:                     │
    │    → Táblázat: hely, menny, prioritás     │
    │    → Kiemelt: javasolt helyek             │
    └────────────────┬──────────────────────────┘
                     │
    ┌────────────────▼──────────────────────────┐
    │ 🆕 4. R.2 Megerősítés                     │
    │    IGEN → Folytatás javaslattal           │
    │    NEM → Felülbírálás + indoklás          │
    │          KIADASI_AUDIT log                │
    └────────────────┬──────────────────────────┘
                     │
    ┌────────────────▼──────────────────────────┐
    │ 5. Számla kiállítás                       │
    │    (készpénz/kártya/átutalás)             │
    └───────────────────────────────────────────┘
```

### R.1 Kiadási Javaslat SQL

```sql
-- Tárhelyek prioritás szerint
SELECT
    kh.tarhely_kod,
    kh.mennyiseg,
    kh.kiadasi_prioritas,
    CASE kh.kiadasi_prioritas
        WHEN 1 THEN 'Pult (leggyorsabb)'
        WHEN 2 THEN 'Eladótér'
        WHEN 3 THEN 'Raktár eleje'
        WHEN 4 THEN 'Raktár hátulja'
        WHEN 5 THEN 'Távoli (leglassabb)'
    END AS hely_tipus
FROM KESZLET_HELY kh
WHERE kh.cikk_id = @cikk_id
  AND kh.aktiv = TRUE
  AND kh.mennyiseg > 0
ORDER BY kh.kiadasi_prioritas ASC;
```

### R.2 Felülbírálás Audit

```sql
-- Ha a kezelő felülbírálja a javaslatot
INSERT INTO KIADASI_AUDIT (
    tenant_id, cikk_id,
    javasolt_tarhely, valasztott_tarhely,
    indoklas_kod, indoklas_szoveg,
    felhasznalo_id, datum
) VALUES (
    @tenant_id, @cikk_id,
    @r1_javaslat, @kezelő_valasztas,
    @indoklas_kod, @szoveg,
    @felhasznalo_id, NOW()
);
```

---

## Kiadási Prioritás Rendszer

```
┌─────────────────────────────────────────────────────────────┐
│                   KIADÁSI PRIORITÁS                         │
├─────────────────────────────────────────────────────────────┤
│ 1 = Pult (leggyorsabb)                                      │
│     → Közvetlen ügyfélkiszolgálás                          │
│                                                             │
│ 2 = Eladótér                                               │
│     → Könnyen hozzáférhető polcok                          │
│                                                             │
│ 3 = Raktár eleje                                           │
│     → Első sorok, gyorsabban elérhető                      │
│                                                             │
│ 4 = Raktár hátulja                                         │
│     → Hátsó polcok, lassabb elérés                         │
│                                                             │
│ 5 = Távoli (leglassabb)                                    │
│     → Külső raktár, ritkán használt                        │
└─────────────────────────────────────────────────────────────┘
```

---

## Változások Összefoglalója

### BEVÉTELEZÉS Változások

| Lépés | Korábbi | Új (v3.0) |
|-------|---------|-----------|
| Tárhely | Opcionális egy mező | Kötelező minden tételnél |
| Készlet | CIKK.keszlet += n | KÉSZLET_HELY.mennyiseg += n |
| Naplózás | Alapvető mozgás | + tarhely_kod |

### ÉRTÉKESÍTÉS Változások

| Lépés | Korábbi | Új (v3.0) |
|-------|---------|-----------|
| Tárhely választás | Nincs | R.1 automatikus javaslat |
| Megerősítés | Nincs | R.2 elfogadás/felülbírálás |
| Felülbírálás | Nincs naplózás | KIADASI_AUDIT + indoklás |
| Készlet | CIKK.keszlet -= n | KÉSZLET_HELY.mennyiseg -= n |

---

## Felülbírálás Indoklás Kódok

| Kód | Jelentés |
|-----|----------|
| `SERULT` | Sérült termék a javasolt helyen |
| `LELTARELTERES` | Eltérés a nyilvántartásban |
| `UGYFEL_KERES` | Ügyfél specifikus kérése |
| `HOZZAFERHETO` | Könnyebb hozzáférés |
| `EGYEB` | Szabad szöveges indoklás |

---

## Kapcsolódó Dokumentumok

- [02-keszlet-multi-location-erd-2025-12-12.md](02-keszlet-multi-location-erd-2025-12-12.md) - KÉSZLET_HELY entitás
- [02-ertekesites-erd-2025-12-12.md](02-ertekesites-erd-2025-12-12.md) - ERD módosítások
- [02-kiadasi-optimalizacio-folyamat-2025-12-12.md](02-kiadasi-optimalizacio-folyamat-2025-12-12.md) - R.1/R.2 részletek
- [fit-gap-analysis-2025-12-12.md](../fit-gap-analysis-2025-12-12.md) - Követelmény forrás
