# 2. Értékesítés - Folyamatábra

## Diagram Alapinformációk

| Tulajdonság | Érték |
|-------------|-------|
| **Fájlnév** | `2-ertekesites-folyamat.excalidraw` |
| **Típus** | Folyamatábra (Flowchart) |
| **Modul** | Értékesítés & Készletkezelés |
| **Verzió** | v1.0 |
| **Kategória** | 2. rész - Cikk kezelés és Eladás |

---

## Részletes Leírás

Ez a diagram a KGC ERP rendszer **értékesítési és beszerzési folyamatát** mutatja be. A folyamat két fő ágra oszlik:
1. **Új cikk felvétele** - Ha a termék még nincs a rendszerben
2. **Bevételezés és értékesítés** - Meglévő vagy új cikkek készletre vétele és eladása

---

## Folyamat Lépései

### 1. FÁZIS: CIKK ELLENŐRZÉS

#### 1.1 Kezdő Döntési Pont
```
┌─────────────────────────────────┐
│      DÖNTÉSI PONT #1            │
│   "Cikk létezik a rendszerben?" │
├─────────────────────────────────┤
│  IGEN → Bevételezéshez ugrás    │
│         (meglévő cikkszámmal)   │
│                                 │
│  NEM  → Új cikk felvétele       │
│         (teljes adatfelvétel)   │
└─────────────────────────────────┘
```

**Cikk keresés módjai:**
- Cikkszám alapján (egyedi azonosító)
- Vonalkód alapján (EAN/UPC)
- Megnevezés alapján (részleges egyezés)
- Cikkcsoport + gyártó kombinációval

---

### 2. FÁZIS: ÚJ CIKK FELVÉTELE (ha szükséges)

#### 2.1 Új Cikk Felvétele
```
┌─────────────────────────────────────────────────────────────────┐
│                    ÚJ CIKK FELVÉTEL FOLYAMAT                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. Cikkcsoport választás                                       │
│     ├─ Alkatrész (általános)                                    │
│     ├─ Bérgép                                                   │
│     ├─ Bérszerszám                                              │
│     ├─ Díjak                                                    │
│     ├─ FGS                                                      │
│     ├─ Makita                                                   │
│     ├─ Lukas                                                    │
│     ├─ Mérőműszer                                               │
│     └─ Egyéb                                                    │
│                                                                 │
│  2. Beszállító megadása                                         │
│     ├─ Meglévő beszállító választás                             │
│     └─ Vagy új beszállító felvétel                              │
│                                                                 │
│  3. Vonalkód + ÁFA beállítás                                    │
│     ├─ Vonalkód megadása (opcionális)                           │
│     ├─ ÁFA típus: 27% / 5% / 0% / AAM                           │
│     └─ Tárhely megadása (opcionális)                            │
│                                                                 │
│  4. Cikk rögzítése                                              │
│     └─ Adatbázisba mentés                                       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Új cikk kötelező mezők:**
| Mező | Leírás | Példa |
|------|--------|-------|
| Cikkszám | Egyedi azonosító | "MAK-DDF481" |
| Megnevezés | Termék neve | "Makita akkus fúró" |
| Cikkcsoport | Kategória | "Makita" |
| Beszállító | Szállító | "Makita Hungary" |
| ÁFA típus | Adókulcs | "27%" |

**Opcionális mezők:**
- Vonalkód (EAN-13)
- Tárhely (polc/hely kód)
- Beszerzési ár
- Eladási ár
- Alkatrész jelölés

---

### 3. FÁZIS: BEVÉTELEZÉS

#### 3.1 Bevételezés Indítása
```
┌─────────────────────────────────┐
│        BEVÉTELEZÉS              │
│    (Beszállítói számla)         │
├─────────────────────────────────┤
│  A bevételezés = áru beérkezés  │
│  beszállítói számla alapján     │
│                                 │
│  Trigger: Új áruszállítmány     │
└─────────────────────────────────┘
```

#### 3.2 Számla Adatok Megadása
```
Beszállítói számla adatok:
├─ Bizonylat szám (belső)
├─ Számla szám (beszállító számlája)
├─ Dátum
├─ Fizetési mód
│   ├─ Készpénz
│   └─ Átutalás
├─ Pénznem (HUF / EUR)
├─ Bruttó összeg
├─ Nettó összeg
└─ Fuvarköltség (opcionális)
```

#### 3.3 Tételek Hozzáadása
```
Minden tétel tartalmazza:
├─ Cikkszám (keresés/vonalkód)
├─ Mennyiség (db)
├─ Egységár (beszerzési)
└─ Összeg (automatikus)
```

**Tétel hozzáadás folyamata:**
1. Cikkszám beírása vagy vonalkód beolvasás
2. Mennyiség megadása
3. Egységár megadása (beszerzési ár)
4. "Hozzáadás" → Tétel listára kerül
5. Ismétlés további tételekhez

#### 3.4 Összeg Ellenőrzés
```
┌─────────────────────────────────┐
│      DÖNTÉSI PONT #2            │
│   "Összeg egyezik?"             │
├─────────────────────────────────┤
│  Számított: Σ(tétel összegek)   │
│  Megadott: Beszállító számla    │
├─────────────────────────────────┤
│  OK   → Bevételezés rögzítése   │
│                                 │
│  HIBA → Javítás szükséges       │
│         (vissza a tételekhez)   │
└─────────────────────────────────┘
```

**Eltérés okai:**
- Hibás mennyiség
- Hibás egységár
- Hiányzó tétel
- Kerekítési különbség

#### 3.5 Bevételezés Rögzítése
```
Sikeres bevételezés:
├─ BEVÉTELEZÉS rekord létrejön
├─ BEVÉTELEZÉS_TÉTEL rekordok létrejönnek
├─ CIKK készlet értékek frissülnek (+)
└─ KÉSZLET_MOZGÁS napló bejegyzés
```

---

### 4. FÁZIS: KÉSZLET ÁTCSOPORTOSÍTÁS (opcionális)

#### 4.1 Nagy Céges Cikkszám
```
┌─────────────────────────────────┐
│      DÖNTÉSI PONT #3            │
│   "Nagy céges cikkszám kell?"   │
├─────────────────────────────────┤
│  Speciális eset: Beszállítótól  │
│  kapott cikkszám → saját cikksz │
├─────────────────────────────────┤
│  IGEN → Készlet átcsoportosítás │
│                                 │
│  NEM  → Egyenes értékesítés     │
└─────────────────────────────────┘
```

**Készlet átcsoportosítás:**
```
Eredeti cikk: BES-12345 (beszállító kódja)
    └─ Készlet: -10 db

Új cikk: KGC-12345 (saját kód)
    └─ Készlet: +10 db
```

**Mikor szükséges:**
- Beszállító saját kódja van a terméken
- Belső nyilvántartáshoz saját kód kell
- Árazási stratégia miatt más cikkszámra kell

---

### 5. FÁZIS: ÉRTÉKESÍTÉS

#### 5.1 Értékesítés Indítása
```
┌─────────────────────────────────┐
│        ÉRTÉKESÍTÉS              │
│    (Partner + cikkszám)         │
├─────────────────────────────────┤
│  Input:                         │
│  • Partner (1. rész alapján)    │
│  • Cikkszám (vonalkód/keresés)  │
│  • Mennyiség                    │
│                                 │
│  Output:                        │
│  • Eladási tranzakció           │
│  • Készlet csökkenés            │
└─────────────────────────────────┘
```

#### 5.2 Számla Kiállítása
```
Számla típusok:
├─ Készpénzes nyugta (magánszemély)
├─ Számla (céges vevő)
└─ Szállítólevél (halasztott fizetés)

Számla tartalma:
├─ Vevő adatok (Partner/Cég)
├─ Tételek (cikk, menny, ár)
├─ Összesítés (nettó, ÁFA, bruttó)
└─ Fizetési információk
```

---

## Folyamat Összefoglaló

```
Új áru beérkezés
       │
       ▼
┌──────────────┐    NEM    ┌──────────────┐
│ Cikk létezik?│─────────>│ Új cikk      │
└──────┬───────┘          │ felvétele    │
       │IGEN              └──────┬───────┘
       │                         │
       └────────────┬────────────┘
                    │
                    ▼
           ┌──────────────┐
           │ Bevételezés  │
           │ (számla)     │
           └──────┬───────┘
                  │
                  ▼
           ┌──────────────┐
           │ Készlet      │
           │ frissül      │
           └──────┬───────┘
                  │
                  ▼
        ┌─────────────────┐    IGEN   ┌────────────────┐
        │Átcsoportosítás? │──────────>│ Átcsoportosítás│
        └────────┬────────┘           └───────┬────────┘
                 │NEM                         │
                 └────────────┬───────────────┘
                              │
                              ▼
                     ┌──────────────┐
                     │ Értékesítés  │
                     │ (eladás)     │
                     └──────┬───────┘
                            │
                            ▼
                     ┌──────────────┐
                     │ Számla       │
                     │ kiállítás    │
                     └──────────────┘
```

---

## Jelmagyarázat

| Szimbólum | Jelentés | Szín |
|-----------|----------|------|
| ▭ (Zöld keret) | Új cikk felvétel | Zöld |
| ▭ (Lila keret) | Bevételezés / Átcsoportosítás | Lila |
| ▭ (Kék keret) | Folyamat lépés | Kék |
| ◇ (Rombusz) | Döntési pont | Narancssárga |
| ▭ (Zöld háttér) | Fontos művelet | Zöld |
| ▭ (Piros háttér) | Hiba / Javítás | Piros |
| ▭ (Kék háttér) | Számlázás | Kék |

---

## Kapcsolódó Entitások

- **CIKK** - Termékek/szolgáltatások
- **CIKKCSOPORT** - Kategorizálás
- **BESZÁLLÍTÓ** - Szállítók nyilvántartása
- **BEVÉTELEZÉS** - Beszállítói számlák fejléc
- **BEVÉTELEZÉS_TÉTEL** - Bevételezés tételek
- **KÉSZLET_MOZGÁS** - Készletváltozás napló

---

## Üzleti Szabályok

1. **Cikkszám egyediség** - Egy cikkszám csak egyszer létezhet
2. **Készlet konzisztencia** - Bevételezés = készlet növekedés
3. **Összeg egyeztetés** - Bevételezés összege = tételek összege
4. **ÁFA kezelés** - Minden cikkhez ÁFA típus kötelező
5. **Átcsoportosítás** - Készlet nem vész el, csak átmozog

---

## Kapcsolódó Dokumentumok

- [02-ertekesites-erd.md](02-ertekesites-erd.md) - Adatmodell
- [01-ugyfelfelvitel-folyamat.md](01-ugyfelfelvitel-folyamat.md) - Partner kezelés (előfeltétel)
