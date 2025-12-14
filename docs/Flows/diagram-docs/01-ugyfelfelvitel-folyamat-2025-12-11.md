# 1. Ügyfél Felvétel és Bérlés - Folyamatábra

## Diagram Alapinformációk

| Tulajdonság | Érték |
|-------------|-------|
| **Fájlnév** | `1-ugyfelfelvitel-folyamat-2025-12-11.excalidraw` |
| **Típus** | Folyamatábra (Flowchart) |
| **Modul** | Partner & Bérlés |
| **Verzió** | v2.0 (Fit-Gap frissítés) |
| **Dátum** | 2025-12-11 |
| **Kategória** | 1. rész - Ügyfél Felvétel és Bérlés |
| **Forrás ADR-ek** | ADR-013 (kaució szabályok) |

---

## Részletes Leírás

Ez a diagram a KGC ERP rendszer **alapvető bérlési folyamatát** mutatja be elejétől a végéig. A v2.0 verzió tartalmazza:
- **MyPos kártyás kaució** kezelés (2% kényelmi díj)
- **Tartozékok és kellékek** pipálása
- **Fizikai kiadó/visszavevő** rögzítése
- **Kaució visszatérítés** szabályok (ADR-013)

---

## Folyamat Lépései

### 1. FÁZIS: GÉP KIADÁSA

#### 1.1 Kezdés és Belépés
- **Trigger**: Ügyfél beérkezik a boltba
- **Első lépés**: Felhasználó belép a rendszerbe
- **Hitelesítés**: Ügyféltér gépeken automatikus (Szint 0)

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

**Új ügyfél rögzítése (bővített - Fit-Gap):**
- Név (kötelező)
- Állandó lakcím (kötelező)
- Igazolványszám (kötelező)
- 🆕 Anyja neve (kötelező)
- 🆕 Születési hely, idő (kötelező)
- 🆕 Tartózkodási hely (ha eltér - opcionális)
- Telefon (ajánlott)
- Email (opcionális - e-számla esetén kötelező)
- ❌ TAJ szám (eltávolítva - nem szükséges)

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
│          🆕 ÁFA típus auto      │
│          Cégadatok betöltése    │
└─────────────────────────────────┘
```

**FONTOS ÜZLETI SZABÁLY:**
> A szerződés MINDIG a magánszeméllyel köttetik!
> A cég csak a számlázás címzettje lehet.
> Ez biztosítja a felelősség egyértelműségét.

**🆕 ÁFA típus automatikus meghatározás:**
- HU adószám (8+1+2) → Magyar
- EU formátum (pl. DE123456789) → EU
- Egyéb → Harmadik ország

#### 1.4 Bérlés Indítása
- Partner/Cég kiválasztása után
- "Új bérlés indítása" gomb

#### 1.5 Időtartam Választás 🆕 BŐVÍTETT
```
┌─────────────────────────────────┐
│      DÖNTÉSI PONT #3            │
│   "Bérlési időtartam?"          │
├─────────────────────────────────┤
│  Fél nap  = 50% napi díj        │
│  1 nap    = 100% napi díj       │
│  🆕 Hétvége = 150% (1.5 nap)    │
│  0 nap    = Szállítólevél       │
│             (csak törzsügyfelek)│
└─────────────────────────────────┘
```

**Hétvége opció (ÚJ):**
- Szombat reggel → Hétfő reggel
- Automatikus 1.5 nap számítás
- Fél nap kedvezmény hétvégére

#### 1.6 Gép Kiválasztása
- Cikkszám/vonalkód alapján
- Kategória + típus alapján szűrés
- Csak "bent" státuszú gépek választhatók

#### 1.7 🆕 Tartozékok és Kellékek Pipálása
```
┌─────────────────────────────────────────────────────────────────┐
│              🆕 TARTOZÉKOK KIVÁLASZTÁSA                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Kötelező kellékek (ingyenes):                                  │
│  ☑ Védőszemüveg                                                 │
│  ☑ Használati útmutató                                          │
│                                                                 │
│  Opcionális kellékek (ingyenes):                                │
│  ☐ Kesztyű                                                      │
│  ☐ Fülvédő                                                      │
│                                                                 │
│  Fizetős tartozékok:                                            │
│  ☐ Vésőszár (2.500 Ft)                                          │
│  ☐ Fúrószár készlet (4.000 Ft)                                  │
│  ☐ Tartalék akku (15.000 Ft kaució)                             │
│                                                                 │
│  A fizetős tartozékok vonalkódja rögzítve!                      │
│  Ha nem hozza vissza → automatikus számlázás                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### 1.8 Kaució Rögzítése 🆕 BŐVÍTETT (MyPos)
```
┌─────────────────────────────────────────────────────────────────┐
│                    🆕 KAUCIÓ KEZELÉS (MyPos)                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Kaució összege: [ 50.000 ] Ft                                  │
│                                                                 │
│  Fizetési mód:                                                  │
│  (•) Készpénz                                                   │
│  ( ) Bankkártya (MyPos) → +2% kényelmi díj                      │
│  ( ) Átutalás (csak meghatalmazott listás cégek)                │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  [Ha KÁRTYA választva:]                                         │
│                                                                 │
│  Kényelmi díj (2%): 1.000 Ft                                    │
│  ⚠️ Ezt MOST kell fizetni (számlára kerül)!                     │
│                                                                 │
│  Visszatérítésnél: 50.000 Ft × 0.98 = 49.000 Ft                 │
│  (A 2% már levonva, mert gép elvitelkor fizette)                │
│                                                                 │
│  [MyPos terminál beolvasás - kártya token mentés]               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**MyPos kaució szabályok:**
1. Kártyás fizetésnél +2% kényelmi díj (ÁFA tartalom: könyvelővel egyeztetni!)
2. A 2% díjat a gép elvitelkor fizeti az ügyfél
3. A kártya token mentésre kerül a visszatérítéshez
4. Visszatérítés CSAK ugyanarra a kártyára történhet

#### 1.9 🆕 Fizikai Kiadó Rögzítése
```
┌─────────────────────────────────┐
│     🆕 KI ADJA KI A GÉPET?      │
├─────────────────────────────────┤
│  Fizikai kiadó személy:         │
│  [ Levente ▼ ]                  │
│                                 │
│  (Ez a rendszer felhasználótól  │
│   KÜLÖNBÖZŐ személy lehet!)     │
│                                 │
│  A felelősségrevonás miatt!     │
└─────────────────────────────────┘
```

#### 1.10 Rögzítés és Szerződés
- Bérlés adatok mentése az adatbázisba
- Szerződés automatikus generálása
- Vonalkód generálása a szerződéshez
- 🆕 Tartozéklista a szerződésen

#### 1.11 Nyomtatás
Két példány kerül nyomtatásra:
1. **Bolti példány** - vonalkóddal (a visszavételhez)
2. **Ügyfél példány** - vonalkód nélkül
3. 🆕 **Tartozéklista** - mindkét példányon

#### 1.12 Gép Kiadva
- Státusz: `aktív`
- Gép státusza: `kint`
- Bérlés nyilvántartásba véve
- 🆕 Tartozékok kiadva jelölve

---

### 2. FÁZIS: GÉP VISSZAHOZÁSA

#### 2.1 Vonalkód Beolvasás
- A bolti szerződés-példány vonalkódjának beolvasása
- Automatikus bérlés azonosítás

#### 2.2 🆕 Ki Hozta Vissza?
```
┌─────────────────────────────────────────────────────────────────┐
│                   🆕 VISSZAHOZÓ AZONOSÍTÁS                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Ki hozta vissza a gépet?                                       │
│  (•) Eredeti bérlő (Kovács János)                               │
│  ( ) Más személy                                                │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  [Ha "Más személy" választva:]                                  │
│                                                                 │
│  Ügyfél típus: ( ) Magánszemély  (•) Céges                      │
│                                                                 │
│  [CÉGES - ADR-013 A3:]                                          │
│  Név: [Kiss Péter_______________]                               │
│  ✅ Meghatalmazott listán szerepel (ABC Kft. - 2025.01.15 óta)  │
│  → Kaució visszaadható!                                         │
│                                                                 │
│  [MAGÁNSZEMÉLY - ADR-013 A1:]                                   │
│  ⚠️ Meghatalmazás szükséges!                                    │
│  [ ] Meghatalmazás csatolva (PDF/fotó)                          │
│  → Csak meghatalmazással adható vissza kaució!                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### 2.3 🆕 Tartozékok Visszavétele
```
┌─────────────────────────────────────────────────────────────────┐
│              🆕 TARTOZÉKOK VISSZAVÉTELE                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Kiadott tartozékok:                                            │
│  ☑ Védőszemüveg ............................ visszahozta ✅     │
│  ☑ Használati útmutató ..................... visszahozta ✅     │
│  ☑ Kesztyű ................................. visszahozta ✅     │
│  ☐ Vésőszár (2.500 Ft) ..................... NEM hozta vissza!  │
│                                                                 │
│  ⚠️ Hiányzó tételek számlázásra kerülnek!                       │
│  Összeg: 2.500 Ft                                               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### 2.4 🆕 Fizikai Visszavevő Rögzítése
```
┌─────────────────────────────────┐
│   🆕 KI VETTE VISSZA A GÉPET?   │
├─────────────────────────────────┤
│  Fizikai visszavevő személy:    │
│  [ Péter ▼ ]                    │
│                                 │
│  (A felelősségrevonás miatt!)   │
└─────────────────────────────────┘
```

#### 2.5 Késés Ellenőrzés
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

#### 2.6 🆕 Kár Ellenőrzés
```
┌─────────────────────────────────────────────────────────────────┐
│                   🆕 KÁR ELLENŐRZÉS                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Van kár a gépen?                                               │
│  ( ) Nincs kár → Kaució visszaadás                              │
│  (•) Van kár                                                    │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  [Ha "Van kár" választva:]                                      │
│                                                                 │
│  Kár típusa:                                                    │
│  ( ) Könnyen megállapítható → Azonnali számlázás                │
│  (•) Bevizsgálás szükséges → Kaució benntartás                  │
│                                                                 │
│  [AZONNALI SZÁMLÁZÁS:]                                          │
│  Kár leírása: [________________________]                        │
│  Összeg: [________] Ft                                          │
│  → Számla kiállítás + maradék kaució visszaadás                 │
│                                                                 │
│  [BEVIZSGÁLÁS - JEGYZŐKÖNYV:]                                   │
│  🆕 Kaució jegyzőkönyv készítése (ADR-013)                      │
│  Kár leírása: [________________________]                        │
│  Becsült költség: [________] Ft                                 │
│  Benntartott kaució: [________] Ft                              │
│  Fotók: [📷 Feltöltés]                                          │
│  Ügyfél aláírása: [ ] Igen                                      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### 2.7 Kaució Visszaadása 🆕 BŐVÍTETT (ADR-013)
```
┌─────────────────────────────────────────────────────────────────┐
│                   🆕 KAUCIÓ VISSZATÉRÍTÉS                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Eredeti kaució: 50.000 Ft                                      │
│  Fizetési mód: Bankkártya (MyPos)                               │
│  Token: **** **** **** 4521                                     │
│                                                                 │
│  Levonások:                                                     │
│  - Késési díj: 0 Ft                                             │
│  - Kárpótlás: 0 Ft                                              │
│  - Hiányzó tartozék: 2.500 Ft                                   │
│  - Kényelmi díj (2%): már levonva gép elvitelkor                │
│                                                                 │
│  ═══════════════════════════════════════════════════════════    │
│  Visszatérítendő: 47.500 Ft                                     │
│  (kártyára: 47.500 × 0.98 = 46.550 Ft)                          │
│                                                                 │
│  Visszatérítés módja:                                           │
│  (•) Bankkártyára (eredeti kártyára)                            │
│  ( ) Készpénz (csak meghatalmazással! - ADR-013 B2)             │
│                                                                 │
│  [Ha "Készpénz" választva:]                                     │
│  ⚠️ Készpénzes visszaadáshoz meghatalmazás szükséges!           │
│  [ ] Meghatalmazás csatolva                                     │
│  Átvevő személyi ig. szám: [________]                           │
│  Átvételi elismervény: [Generálás]                              │
│                                                                 │
│                      [VISSZATÉRÍTÉS]                            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### 2.8 Gép Visszavétele
- Bérlés státusz: `lezárt`
- Gép státusz: `bent`
- Naplózás (ki vette vissza rendszerben + fizikailag, mikor)
- 🆕 Tartozékok visszavéve jelölve

#### 2.9 Vége
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
| 🆕 | Új funkció (Fit-Gap) | - |

---

## Kapcsolódó Entitások

- **PARTNER** - Ügyfél alapadatok (bővített)
- **CÉG** - Céges számlázási adatok (ÁFA típus)
- **CÉG_MEGHATALMAZOTT** - 🆕 Átutalásra jogosultak
- **BÉRLÉS** - Bérlési tranzakció (MyPos mezők)
- **BÉRLÉS_TARTOZÉK** - 🆕 Kiadott kellékek
- **KAUCIÓ_JEGYZŐKÖNYV** - 🆕 Benntartott kaució dokumentáció
- **CIKK** - Bérgép adatok
- **FELHASZNÁLÓ** - Rendszer felhasználók

---

## Üzleti Szabályok Összefoglalása

1. **Szerződés mindig magánszeméllyel** - Cég csak számla címzett
2. **Kaució készpénz VAGY kártya** - Kártyánál +2% kényelmi díj
3. **Kártyás visszatérítés csak ugyanarra a kártyára** - Token alapú
4. **Vonalkód kötelező** - A visszavételhez szükséges
5. **Késési díj automatikus** - Rendszer számítja
6. **Két példány nyomtatás** - Bolt + Ügyfél
7. **Tartozékok pipálása** - Kiadáskor és visszavételkor
8. **Fizikai kiadó/visszavevő** - Felelősségrevonáshoz
9. **Meghatalmazás (ADR-013):**
   - Magánszemélynél: mindig kell ha más hozza vissza
   - Cégnél: listán szereplők OK, egyébként kell
10. **Készpénzes visszaadás** - Csak meghatalmazással (ADR-013 B2)

---

## Változásnapló

| Verzió | Dátum | Változás |
|--------|-------|----------|
| v1.0 | 2024-11 | Eredeti verzió |
| v2.0 | 2025-12-11 | MyPos kaució, tartozékok, fizikai kiadó/visszavevő, ADR-013 szabályok |

---

## Kapcsolódó Dokumentumok

| Dokumentum | Leírás |
|------------|--------|
| [01-ugyfelfelvitel-erd-2025-12-11.md](01-ugyfelfelvitel-erd-2025-12-11.md) | Entitás diagram (frissített) |
| [01-ugyfelfelvitel-dontesi-fa-2025-12-11.md](01-ugyfelfelvitel-dontesi-fa-2025-12-11.md) | Döntési fa (frissített) |
| [ADR-013-fit-gap-dontesek.md](../../architecture/ADR-013-fit-gap-dontesek.md) | Kaució és meghatalmazás döntések |
