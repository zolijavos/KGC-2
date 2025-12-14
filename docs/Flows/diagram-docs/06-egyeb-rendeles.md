# 6. Egyéb - Megrendelés Folyamat

## Diagram Alapinformációk

| Tulajdonság | Érték |
|-------------|-------|
| **Fájlnév** | `6-egyeb-rendeles.excalidraw` |
| **Típus** | Folyamatábra (Flowchart) |
| **Modul** | Megrendelés |
| **Verzió** | v1.0 |
| **Kategória** | 6. rész - Egyéb funkciók |

---

## Részletes Leírás

Ez a diagram az **ügyfél megrendelés teljes életciklusát** mutatja be két fő fázisban:
1. **Rendelés felvétel** - Ügyfél igény rögzítése
2. **Beérkezés folyamat** - Termék beérkezése és átadás

---

## 1. RENDELÉS FELVÉTEL FOLYAMAT

### Kezdő Pont

```
┌─────────────────────────────────┐
│   Ügyfél rendelni szeretne     │
│         (Trigger)              │
└─────────────────────────────────┘
```

### Döntési Pont #1: Van már cikkszám?

```
         ┌────────────────────────┐
         │   VAN MÁR CIKKSZÁM?    │
         └───────────┬────────────┘
                     │
        ┌────────────┴────────────┐
        │                         │
       IGEN                      NEM
        │                         │
        ▼                         ▼
┌──────────────────┐     ┌──────────────────┐
│  Cikkszám beírás │     │  Cikk felvétele  │
│  Rendelőlap      │     │  (új cikk)       │
│  generálás       │     │                  │
└──────────────────┘     └────────┬─────────┘
                                  │
                                  └──► vissza
```

**Ha nincs cikkszám:**
- Új cikk felvétele szükséges (lásd: 2. rész - Értékesítés)
- Cikkszám létrehozása után folytatható a rendelés

---

### Döntési Pont #2: Nagy értékű tétel?

```
         ┌────────────────────────┐
         │   NAGY ÉRTÉKŰ TÉTEL?   │
         └───────────┬────────────┘
                     │
        ┌────────────┴────────────┐
        │                         │
       IGEN                      NEM
        │                         │
        ▼                         │
┌──────────────────┐              │
│  Előleg bekérés  │              │
│  és rögzítés     │              │
└────────┬─────────┘              │
         │                        │
         └────────────┬───────────┘
                      │
                      ▼
              (folytatás)
```

**Előleg bekérés:**
- Magas értékű termékeknél ajánlott
- Összeg meghatározása (általában 30-50%)
- Rögzítés a rendszerben
- Kapcsolás a rendeléshez

---

### Döntési Pont #3: Sürgős rendelés?

```
         ┌────────────────────────┐
         │   SÜRGŐS RENDELÉS?     │
         └───────────┬────────────┘
                     │
        ┌────────────┴────────────┐
        │                         │
       IGEN                      NEM
        │                         │
        ▼                         │
┌──────────────────┐              │
│ Pipa bekapcsolás │              │
│ + Külön          │              │
│   megrendelés    │              │
└────────┬─────────┘              │
         │                        │
         └────────────┬───────────┘
                      │
                      ▼
         ┌──────────────────────┐
         │ Beszállító kiválasztás│
         │ Rendelőlap nyomtatás │
         └───────────┬──────────┘
                     │
                     ▼
         ┌──────────────────────┐
         │  Ügyfél megkapja     │
         │  a rendelőlapot      │
         └──────────────────────┘
```

**Sürgős rendelés kezelése:**
```
┌────────────────────────────────────────────────────────────────┐
│  ⚠️ SÜRGŐS PIPA                                                │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Ha a "Sürgős" pipa be van kapcsolva:                          │
│  • Külön megrendelés generálódik                               │
│  • Kiemelt kezelést kap                                        │
│  • Gyorsabb szállítás kérhető                                  │
│                                                                │
│  ⚠️ FIGYELEM: A sürgős pipát KI KELL VENNI beérkezéskor,       │
│  különben DUPLIKÁLÓDIK a rendelés!                             │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

---

## 2. BEÉRKEZÉS FOLYAMAT

### Trigger

```
┌─────────────────────────────────┐
│      Termék beérkezik          │
│         (START)                │
└─────────────────────────────────┘
```

### Lépések

```
┌─────────────────────────────────────────────────────────────────┐
│                   BEÉRKEZÉS FOLYAMAT                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. Rendszer jelzi: Kinek, milyen rendelés#                     │
│     └─ Automatikus értesítés a felhasználóknak                  │
│     └─ Rendelés azonosító megjelenítése                         │
│                                                                 │
│  2. Megrendelőlap megkeresése                                   │
│     └─ Rendelés szám alapján keresés                            │
│     └─ Fizikai papír megkeresése (ha van)                       │
│                                                                 │
│  3. Ügyfél értesítése                                           │
│     └─ Telefonos értesítés                                      │
│     └─ SMS/Email (ha be van állítva)                            │
│                                                                 │
│  4. Átvétel + Számlázás (előleg beszámítás)                     │
│     └─ Termék fizikai átadása                                   │
│     └─ Előleg levonása (ha volt)                                │
│     └─ Különbözet kifizetése                                    │
│     └─ Számla kiállítása                                        │
│                                                                 │
│  5. Rendelés lezárva                                            │
│     └─ Státusz: "Teljesítve"                                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Figyelmeztetés

```
┌────────────────────────────────────────────────────────────────┐
│  ⚠️ FIGYELEM!                                                  │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  A "Sürgős" pipa kivétele KÖTELEZŐ a beérkezés feldolgozása    │
│  előtt!                                                        │
│                                                                │
│  Ha nem vesszük ki:                                            │
│  → A rendelés DUPLIKÁLÓDIK                                     │
│  → Újra bekerül a rendelési listába                            │
│  → Felesleges megrendelés a beszállítónál                      │
│                                                                │
│  Megoldás:                                                     │
│  1. Beérkezéskor ellenőrizni a "Sürgős" státuszt               │
│  2. Ha be van pipálva, KIVENNI                                 │
│  3. Majd folytatni a feldolgozást                              │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

---

## Teljes Folyamat Összefoglaló

```
┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│  RENDELÉS FELVÉTEL                    BEÉRKEZÉS                  │
│  ─────────────────                    ─────────                  │
│                                                                  │
│  Ügyfél rendelni szeretne             Termék beérkezik           │
│         │                                    │                   │
│         ▼                                    ▼                   │
│  Van már cikkszám? ─NO─► Cikk felvétel       │                   │
│         │YES                                 │                   │
│         ▼                                    │                   │
│  Nagy értékű? ─YES─► Előleg bekérés          │                   │
│         │                                    │                   │
│         ▼                                    │                   │
│  Sürgős? ─YES─► Sürgős pipa                  │                   │
│         │                                    │                   │
│         ▼                                    ▼                   │
│  Beszállító kiválasztás              Rendszer jelzi              │
│         │                                    │                   │
│         ▼                                    ▼                   │
│  Rendelőlap nyomtatás                Megrendelőlap keresés       │
│         │                                    │                   │
│         ▼                                    ▼                   │
│  Ügyfél megkapja                     Ügyfél értesítése           │
│  a rendelőlapot                              │                   │
│         │                                    ▼                   │
│         │                            Átvétel + Számlázás         │
│         │                            (előleg beszámítás)         │
│         │                                    │                   │
│         │                                    ▼                   │
│         └────────────────────────────► Rendelés lezárva          │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## Jelmagyarázat

| Szimbólum/Szín | Jelentés |
|----------------|----------|
| ◯ (Zöld) | Kezdet/Vég |
| ▭ (Kék) | Folyamat lépés |
| ◇ (Piros) | Döntési pont |
| ▭ (Narancssárga) | Opcionális lépés |
| ▭ (Piros háttér) | Sürgős/Figyelem |
| ▭ (Lila) | Eredmény |

---

## Kapcsolódó Entitások

- **MEGRENDELÉS** - Rendelés fejléc
- **MEGRENDELÉS_TÉTEL** - Rendelt tételek
- **PARTNER** - Megrendelő ügyfél
- **CIKK** - Rendelt termék
- **BESZÁLLÍTÓ** - Szállító partner

---

## Kapcsolódó Dokumentumok

- [02-ertekesites-folyamat.md](02-ertekesites-folyamat.md) - Cikk felvétel
- [06-egyeb-felhasznalo.md](06-egyeb-felhasznalo.md) - Felhasználók
- [01-ugyfelfelvitel-folyamat.md](01-ugyfelfelvitel-folyamat.md) - Partner kezelés
