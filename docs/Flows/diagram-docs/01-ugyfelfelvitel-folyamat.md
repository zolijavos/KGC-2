# 1. Ügyfél Felvétel és Bérlés - Folyamatábra

## Diagram Alapinformációk

| Tulajdonság | Érték |
|-------------|-------|
| **Fájlnév** | `1-ugyfelfelvitel-folyamat.excalidraw` |
| **Típus** | Folyamatábra (Flowchart) |
| **Modul** | Partner & Bérlés |
| **Verzió** | v1.0 |
| **Kategória** | 1. rész - Ügyfél Felvétel és Bérlés |

---

## Részletes Leírás

Ez a diagram a KGC ERP rendszer **alapvető bérlési folyamatát** mutatja be elejétől a végéig. A folyamat két fő szakaszra oszlik:
1. **Gép kiadása** (bérlés indítása)
2. **Gép visszavétele** (bérlés lezárása)

---

## Folyamat Lépései

### 1. FÁZIS: GÉP KIADÁSA

#### 1.1 Kezdés és Belépés
- **Trigger**: Ügyfél beérkezik a boltba
- **Első lépés**: Felhasználó belép a rendszerbe (bejelentkezés)
- **Hitelesítés**: Felhasználónév + jelszó alapú

#### 1.2 Ügyfél Azonosítás
```
┌─────────────────────────────────┐
│      DÖNTÉSI PONT #1            │
│   "Meglévő ügyfél?"             │
├─────────────────────────────────┤
│  IGEN → Ügyfél keresése         │
│         és kiválasztása         │
│                                 │
│  NEM  → Új ügyfél adatok        │
│         rögzítése               │
└─────────────────────────────────┘
```

**Meglévő ügyfél keresése:**
- Név alapján
- Telefonszám alapján
- Igazolványszám alapján
- Vonalkódos azonosító alapján

**Új ügyfél rögzítése:**
- Név (kötelező)
- Cím (kötelező)
- Igazolványszám (kötelező)
- TAJ szám (opcionális)
- Telefon (ajánlott)
- Email (opcionális - e-számla esetén kötelező)

#### 1.3 Ügyfél Típus Meghatározás
```
┌─────────────────────────────────┐
│      DÖNTÉSI PONT #2            │
│   "Magánszemély vagy Cég?"      │
├─────────────────────────────────┤
│  MAGÁN → Közvetlen szerződés    │
│          a magánszeméllyel      │
│                                 │
│  CÉG   → Adószám beírása        │
│          NAV ellenőrzés         │
│          Cégadatok betöltése    │
└─────────────────────────────────┘
```

**FONTOS ÜZLETI SZABÁLY:**
> A szerződés MINDIG a magánszeméllyel köttetik!
> A cég csak a számlázás címzettje lehet.
> Ez biztosítja a felelősség egyértelműségét.

#### 1.4 Bérlés Indítása
- Partner/Cég kiválasztása után
- "Új bérlés indítása" gomb

#### 1.5 Időtartam Választás
```
┌─────────────────────────────────┐
│      DÖNTÉSI PONT #3            │
│   "Bérlési időtartam?"          │
├─────────────────────────────────┤
│  +5 óra  = Fél nap (50% díj)    │
│  +1 nap  = Teljes nap (100%)    │
│  +3 óra  = NEM HASZNÁLT         │
│  0 nap   = Szállítólevél        │
│            (csak törzsügyfelek) │
└─────────────────────────────────┘
```

**Megjegyzések:**
- A "3 óra" opció jelenleg nem aktív
- A "0 nap" (szállítólevél) csak megbízható törzsügyfeleknek adható, későbbi elszámolással

#### 1.6 Gép Kiválasztása
- Cikkszám/vonalkód alapján
- Kategória + típus alapján szűrés
- Csak "bent" státuszú gépek választhatók

#### 1.7 Kaució Rögzítése
```
┌─────────────────────────────────┐
│     FONTOS LÉPÉS                │
│     (zöld kiemelés)             │
├─────────────────────────────────┤
│  • Kaució összeg rögzítése      │
│  • CSAK KÉSZPÉNZ fogadható!     │
│  • Megjegyzés mező kitöltése    │
│    (opcionális)                 │
└─────────────────────────────────┘
```

#### 1.8 Rögzítés és Szerződés
- Bérlés adatok mentése az adatbázisba
- Szerződés automatikus generálása
- Vonalkód generálása a szerződéshez

#### 1.9 Nyomtatás
Két példány kerül nyomtatásra:
1. **Bolti példány** - vonalkóddal (a visszavételhez)
2. **Ügyfél példány** - vonalkód nélkül

#### 1.10 Gép Kiadva
- Státusz: `aktív`
- Gép státusza: `kint`
- Bérlés nyilvántartásba véve

---

### 2. FÁZIS: GÉP VISSZAHOZÁSA

#### 2.1 Vonalkód Beolvasás
- A bolti szerződés-példány vonalkódjának beolvasása
- Automatikus bérlés azonosítás

#### 2.2 Késés Ellenőrzés
```
┌─────────────────────────────────┐
│      DÖNTÉSI PONT #4            │
│   "Késett a gép?"               │
├─────────────────────────────────┤
│  IGEN → Késési díj rögzítése    │
│         (0.5, 1, 2... nap)      │
│         Számla kiállítása       │
│                                 │
│  NEM  → Gép visszavétele        │
│         (nincs plusz díj)       │
└─────────────────────────────────┘
```

**Késési díj számítás:**
- Fél nap (0.5) = 50% napi díj
- Minden további nap = 100% napi díj

#### 2.3 Gép Visszavétele
- Bérlés státusz: `lezárt`
- Gép státusz: `bent`
- Naplózás (ki vette vissza, mikor)

#### 2.4 Kaució Visszaadása
- Teljes kaució visszajár
- Készpénzben
- Naplózva a rendszerben

#### 2.5 Vége
- Folyamat lezárva
- Minden adat archiválva

---

## Jelmagyarázat

| Szimbólum | Jelentés | Szín |
|-----------|----------|------|
| ◯ (Ellipszis) | Kezdés/Vége | Kék/Zöld |
| ▭ (Téglalap) | Folyamat lépés | Kék |
| ◇ (Rombusz) | Döntési pont | Narancssárga |
| ▭ (Zöld téglalap) | Fontos lépés | Zöld |
| ▭ (Piros szaggatott) | Figyelmeztetés | Piros |

---

## Kapcsolódó Entitások

- **PARTNER** - Ügyfél alapadatok
- **CÉG** - Céges számlázási adatok
- **BÉRLÉS** - Bérlési tranzakció
- **CIKK** - Bérgép adatok
- **FELHASZNÁLÓ** - Rendszer felhasználók

---

## Üzleti Szabályok Összefoglalása

1. **Szerződés mindig magánszeméllyel** - Cég csak számla címzett
2. **Kaució csak készpénzben** - Nincs kártya/átutalás
3. **Vonalkód kötelező** - A visszavételhez szükséges
4. **Késési díj automatikus** - Rendszer számítja
5. **Két példány nyomtatás** - Bolt + Ügyfél

---

## Technikai Megjegyzések

- A diagram forrása: `KGC-ERP-Workflow`
- Excalidraw v2 formátum
- Háttérszín: fehér (`#ffffff`)
- Rácsméret: 20px
