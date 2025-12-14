# 2. Kiadási Optimalizáció Folyamat

## Diagram Alapinformációk

| Tulajdonság | Érték |
|-------------|-------|
| **Fájlnév** | `2-kiadasi-optimalizacio-folyamat-2025-12-12.excalidraw` |
| **Típus** | Folyamatábra (Flowchart) |
| **Modul** | Készletkezelés |
| **Verzió** | v3.0 |
| **Dátum** | 2025-12-12 |
| **Státusz** | ÚJ |
| **Forrás** | fit-gap-analysis-2025-12-12.md |

---

## Részletes Leírás

Ez a diagram a **"pörgős raktárkészlet"** támogatásához szükséges kiadási optimalizációs algoritmust mutatja be. A rendszer automatikusan javasolja, melyik tárhelyről vegye ki a kezelő a terméket.

---

## Folyamat Áttekintés

```
┌─────────────────────────────────────────────────────────────────────┐
│                    KIADÁSI OPTIMALIZÁCIÓ                            │
│              (R.1 + R.2 Algoritmus)                                 │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Trigger: Cikk kiválasztása bérléshez/eladáshoz                    │
│                                                                     │
│  R.1: Raktári Kiadási Javaslat Algoritmus                          │
│       └─ KÉSZLET_HELY rekordok listázása prioritás szerint          │
│                                                                     │
│  R.2: Javaslat Megerősítése                                        │
│       └─ Kezelő elfogadja vagy felülbírálja (audit!)               │
│                                                                     │
│  Eredmény: Konkrét tárhely a kivételhez                            │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## R.1: Raktári Kiadási Javaslat Algoritmus

### Folyamat Lépései

```
┌─────────────────────────────────────────────────────────────────────┐
│                    R.1 ALGORITMUS                                    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  INPUT: cikk_id, kívánt_mennyiség                                  │
│                                                                     │
│  1. KÉSZLET_HELY lekérdezés                                        │
│     └─ WHERE cikk_id = :cikk_id AND aktiv = TRUE                   │
│     └─ ORDER BY kiadasi_prioritas ASC                              │
│                                                                     │
│  2. Elégséges készlet ellenőrzés                                   │
│     └─ Összesen >= kívánt_mennyiség?                               │
│                                                                     │
│  3. Javaslat összeállítása                                         │
│     └─ Prioritás szerint haladva kijelöli a helyeket               │
│     └─ Amíg el nem éri a kívánt mennyiséget                        │
│                                                                     │
│  OUTPUT: Lista [{tarhely_kod, javaslat_mennyiseg}]                 │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### SQL Példa

```sql
-- R.1 Algoritmus: Kiadási javaslat generálása
WITH ranked_locations AS (
    SELECT
        kh.tarhely_kod,
        kh.mennyiseg,
        kh.kiadasi_prioritas,
        SUM(kh.mennyiseg) OVER (
            ORDER BY kh.kiadasi_prioritas
            ROWS UNBOUNDED PRECEDING
        ) AS running_total
    FROM KESZLET_HELY kh
    WHERE kh.cikk_id = :cikk_id
      AND kh.aktiv = TRUE
      AND kh.mennyiseg > 0
    ORDER BY kh.kiadasi_prioritas
)
SELECT
    tarhely_kod,
    mennyiseg AS elerheto,
    kiadasi_prioritas,
    CASE
        WHEN running_total <= :kivant_mennyiseg THEN mennyiseg
        WHEN running_total - mennyiseg < :kivant_mennyiseg
            THEN :kivant_mennyiseg - (running_total - mennyiseg)
        ELSE 0
    END AS javaslat_mennyiseg
FROM ranked_locations
WHERE running_total - mennyiseg < :kivant_mennyiseg
   OR running_total <= :kivant_mennyiseg;
```

### Példa Eredmény

**Input:** cikk_id=123, kívánt_mennyiség=5

| tarhely_kod | elérhető | prioritás | javaslat |
|-------------|----------|-----------|----------|
| P1-PULT-01 | 2 | 1 | **2** |
| A1-POLC-02 | 3 | 2 | **3** |
| B2-RAKTAR-00 | 20 | 4 | 0 |

**Javaslat:** 2 db a P1-PULT-01-ről + 3 db az A1-POLC-02-ről = 5 db

---

## R.2: Javaslat Megerősítése

### Folyamat Lépései

```
┌─────────────────────────────────────────────────────────────────────┐
│                    R.2 MEGERŐSÍTÉS                                   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  1. Javaslat megjelenítése a Kezelőnek                             │
│     └─ Táblázat: tárhely, mennyiség, prioritás                     │
│     └─ Vizuális jelzés: ajánlott helyek kiemelve                   │
│                                                                     │
│  2. Döntési pont: Elfogadja a javaslatot?                          │
│     │                                                               │
│     ├─ IGEN → Folytatás a kiválasztott helyekkel                   │
│     │                                                               │
│     └─ NEM → Felülbírálás                                          │
│              └─ Kezelő választ más helyet                           │
│              └─ KÖTELEZŐ: Indoklás megadása                         │
│              └─ Audit log bejegyzés                                 │
│                                                                     │
│  3. Készlet lefoglalás (opcionális)                                │
│     └─ Más felhasználók ne vehessék ki közben                      │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Felülbírálás Indoklás Típusok

| Kód | Indoklás | Leírás |
|-----|----------|--------|
| `SERULT` | Sérült termék | A javasolt helyen lévő áru sérült |
| `LELTARELTERES` | Leltár eltérés | Nem annyi van a polcon, mint a rendszerben |
| `UGYFEL_KERES` | Ügyfél kérése | Az ügyfél konkrét darabot kér |
| `HOZZAFERHETO` | Könnyebb hozzáférés | Másik hely gyorsabban elérhető |
| `EGYEB` | Egyéb | Szabad szöveges indoklás |

### Audit Log Struktúra

```sql
CREATE TABLE KIADASI_AUDIT (
    audit_id         SERIAL PRIMARY KEY,
    datum            DATETIME DEFAULT NOW(),
    felhasznalo_id   INT REFERENCES FELHASZNALO(felhasznalo_id),
    cikk_id          INT REFERENCES CIKK(cikk_id),
    javaslat_json    JSONB,      -- R.1 eredeti javaslata
    vegso_json       JSONB,      -- Ténylegesen használt
    felulbiralt      BOOLEAN,    -- Volt-e felülbírálás
    indoklas_kod     VARCHAR(20),
    indoklas_szoveg  TEXT,
    tenant_id        UUID
);
```

---

## Döntési Fa

```
                         ┌─────────────┐
                         │   Kezdés    │
                         │ (Cikk kiv.) │
                         └──────┬──────┘
                                │
                                ▼
                    ┌───────────────────────┐
                    │  R.1: Lekérdezés      │
                    │  KÉSZLET_HELY táblából│
                    └───────────┬───────────┘
                                │
                                ▼
                         ┌─────────────┐
                         │  Van elég   │
                         │  készlet?   │
                         └──────┬──────┘
                        ┌───────┴───────┐
                        │               │
                       NEM            IGEN
                        │               │
                        ▼               ▼
               ┌──────────────┐ ┌───────────────────┐
               │ Hibaüzenet:  │ │ Javaslat lista    │
               │ Nincs elég   │ │ megjelenítése     │
               │ készlet!     │ └─────────┬─────────┘
               └──────────────┘           │
                                          ▼
                                   ┌─────────────┐
                                   │  Kezelő     │
                                   │  elfogadja? │
                                   └──────┬──────┘
                                  ┌───────┴───────┐
                                  │               │
                                IGEN            NEM
                                  │               │
                                  ▼               ▼
                         ┌──────────────┐ ┌──────────────────┐
                         │ Kiadás a     │ │ Felülbírálás     │
                         │ javasolt     │ │ - Másik hely     │
                         │ helyekről    │ │ - Indoklás köt.  │
                         └───────┬──────┘ │ - Audit log      │
                                 │        └────────┬─────────┘
                                 │                 │
                                 └────────┬────────┘
                                          │
                                          ▼
                              ┌─────────────────────┐
                              │ KÉSZLET_HELY        │
                              │ mennyiség frissítés │
                              └──────────┬──────────┘
                                         │
                                         ▼
                              ┌─────────────────────┐
                              │ KÉSZLET_MOZGÁS      │
                              │ bejegyzés (audit)   │
                              └──────────┬──────────┘
                                         │
                                         ▼
                                   ┌─────────┐
                                   │  Vége   │
                                   └─────────┘
```

---

## Optimalizációs Stratégiák

### 1. Prioritás Alapú (Térbeli)

```
Cél: Raktáros útvonalának minimalizálása

Beállítás:
├── kiadasi_prioritas = 1 → Pult mellett
├── kiadasi_prioritas = 2 → Eladótér
├── kiadasi_prioritas = 3 → Raktár eleje
└── kiadasi_prioritas = 4 → Raktár hátulja

Algoritmus: Mindig a legkisebb prioritásúról vesz ki
```

### 2. Készletszint Alapú (Pörgős)

```
Cél: Tőkelekötés minimalizálása, folyamatos feltöltés

Beállítás:
├── kiadasi_prioritas = dinamikus
├── A kisebb készletű helyeket előnyben részesíti
└── "Just-in-time" feltöltés támogatása

Algoritmus: Mindig a legkisebb mennyiségű helyről kezd
```

### 3. Hibrid (Ajánlott)

```
Cél: Térbeli és pörgős előnyök kombinálása

Szabályok:
1. Ha az 1-es prioritású helyen van elég → onnan vesz
2. Ha nincs elég → prioritás szerint halad
3. Több helyről is vehet, ha szükséges

Algoritmus: Prioritás + mennyiség kombináció
```

---

## UI Mockup

```
┌─────────────────────────────────────────────────────────────────────┐
│  KIADÁSI JAVASLAT - MAK-DDF481 (Makita fúró)                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Kívánt mennyiség: [5] db                                          │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ # │ Tárhely      │ Elérhető │ Javasolt │ Prioritás │        │   │
│  ├───┼──────────────┼──────────┼──────────┼───────────┼────────┤   │
│  │ 1 │ P1-PULT-01   │    2 db  │   2 db   │    1      │ [✓]    │   │
│  │ 2 │ A1-POLC-02   │    3 db  │   3 db   │    2      │ [✓]    │   │
│  │ 3 │ B2-RAKTAR-00 │   20 db  │   0 db   │    4      │ [ ]    │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  Összesen javasolt: 5 db ✓                                         │
│                                                                     │
│  ┌──────────────────┐  ┌──────────────────┐                        │
│  │  ✓ ELFOGADOM     │  │  ✎ FELÜLBÍRÁOM  │                        │
│  └──────────────────┘  └──────────────────┘                        │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Offline Működés (ADR-002)

```
┌─────────────────────────────────────────────────────────────────────┐
│                    OFFLINE MÓD                                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  1. KÉSZLET_HELY adatok szinkronizálása                            │
│     └─ IndexedDB-ben tárolva                                       │
│     └─ Server → Client irányban                                    │
│                                                                     │
│  2. R.1 algoritmus lokálisan fut                                   │
│     └─ JavaScript implementáció                                     │
│                                                                     │
│  3. Kiadás rögzítése "pending" státusszal                          │
│     └─ Online visszatéréskor szinkronizálás                        │
│                                                                     │
│  4. Konfliktus kezelés                                             │
│     └─ Ha közben más is kivett → figyelmeztetés                    │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Kapcsolódó Dokumentumok

- [02-keszlet-multi-location-erd-2025-12-12.md](02-keszlet-multi-location-erd-2025-12-12.md) - KÉSZLET_HELY entitás
- [01-ugyfelfelvitel-folyamat.md](01-ugyfelfelvitel-folyamat.md) - Bérlés folyamat
- [02-ertekesites-folyamat.md](02-ertekesites-folyamat.md) - Értékesítés folyamat
- [fit-gap-analysis-2025-12-12.md](../fit-gap-analysis-2025-12-12.md) - Követelmény forrás
