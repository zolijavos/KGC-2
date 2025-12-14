# KGC ERP v2 - Fit-Gap Analízis

**Dátum:** 2025-12-11
**Készítette:** Winston (Architect Agent)
**Források:**
- `/docs/Flows/diagram-docs/` - 30 dokumentált folyamat
- `/docs/Flows/transcripts/` - Új követelmények (2025-11-26 – 2025-12-09)

---

## Tartalomjegyzék

1. [Összefoglaló](#összefoglaló)
2. [FIT - Megfelelő folyamatok](#fit---megfelelő-folyamatok)
3. [GAP - Hiányzó/módosítandó folyamatok](#gap---hiányzómódosítandó-folyamatok)
4. [Prioritási Mátrix](#prioritási-mátrix)
5. [Módosítandó Diagramok](#módosítandó-diagramok)
6. [Új Diagramok Szükségesek](#új-diagramok-szükségesek)

---

## Összefoglaló

| Kategória | Darabszám | Státusz |
|-----------|-----------|---------|
| **FIT** (megfelelő) | 18 | ✅ Nincs módosítás |
| **PARTIAL FIT** (részben megfelelő) | 8 | ⚠️ Módosítás szükséges |
| **GAP** (hiányzik) | 12 | ❌ Új folyamat szükséges |
| **ÖSSZESEN** | 38 | |

### ✅ Döntések Státusza

A Fit-Gap analízis során felmerült nyitott kérdések lezárva. Részletek: [ADR-013-fit-gap-dontesek.md](../architecture/ADR-013-fit-gap-dontesek.md)

| # | Kérdés | Döntés | ADR |
|---|--------|--------|-----|
| 1 | Garanciális bevizsgálási díj | Felhasználó dönt (figyelmeztetéssel, 0 Ft default) | ADR-013 |
| 2 | Ügyféltér belépési kód | 4 számjegyű PIN | ADR-013 |
| 3 | Kaució visszatérítés szabályok | A1+A3+B2 (meghatalmazási matrix) | ADR-013 |
| 4 | Audit log megőrzés | 7 év (NAV törvény) | ADR-013 |
| 5 | Árazási stratégia | E) Kombinált hierarchia | ADR-012 |

### Kritikus GAP-ek (Azonnali figyelmet igényelnek)

| # | GAP | Érintett Modul | Prioritás |
|---|-----|----------------|-----------|
| 1 | Garanciális javítás integrálása szerviz folyamatba | Szerviz | 🔴 KRITIKUS |
| 2 | Többszintű belépési rendszer (public terminal + személyes kód) | Auth/RBAC | 🔴 KRITIKUS |
| 3 | Automatikus árazás (brand/beszállító függő margin) | Értékesítés | 🔴 KRITIKUS |
| 4 | Szerviz belső kommunikációs csatorna | Szerviz | 🟡 MAGAS |
| 5 | Fájlfeltöltés szerviz munkalaphoz | Szerviz | 🟡 MAGAS |

---

## FIT - Megfelelő folyamatok

Ezek a folyamatok megfelelnek az új követelményeknek, **nem igényelnek módosítást**:

| # | Folyamat | Dokumentum | Státusz |
|---|----------|------------|---------|
| 1 | Ügyfél felvétel alapfolyamat | `01-ugyfelfelvitel-folyamat.md` | ✅ FIT |
| 2 | Ügyfél ERD (Partner, Cég) | `01-ugyfelfelvitel-erd.md` | ✅ FIT |
| 3 | Ügyfél DFD | `01-ugyfelfelvitel-dfd.md` | ✅ FIT |
| 4 | Bérlési döntési fa | `01-ugyfelfelvitel-dontesi-fa.md` | ✅ FIT |
| 5 | Bérgép folyamat alap | `03-bergep-folyamat.md` | ✅ FIT |
| 6 | Szerviz munkalap életciklus | `04-szerviz-munkalap.md` | ✅ FIT |
| 7 | Pénzügy archiválás | `05-penzugy-archivalas.md` | ✅ FIT |
| 8 | Rendelés folyamat | `06-egyeb-rendeles.md` | ✅ FIT |
| 9 | E-számla folyamat | `07-e-szamla-folyamat.md` | ✅ FIT |
| 10 | Holding struktúra | `08-holding-struktura.md` | ✅ FIT |
| 11 | Részletfizetés folyamat | `08-reszletfizetes-folyamat.md` | ✅ FIT |
| 12 | Deployment architektúra | `08-deployment-architektura.md` | ✅ FIT |
| 13 | Készlet szinkron | `08-keszlet-szinkron.md` | ✅ FIT |
| 14 | System architektúra | `09-kgc-system-architecture.md` | ✅ FIT |
| 15 | Franchise adatfolyam | `09-franchise-adatfolyam.md` | ✅ FIT |
| 16 | Offline szinkron sequence | `09-offline-szinkron-sequence.md` | ✅ FIT |
| 17 | Új entitások ERD | `07-erd-uj-entitasok.md` | ✅ FIT |
| 18 | Értékesítés ERD | `02-ertekesites-erd.md` | ✅ FIT |

---

## GAP - Hiányzó/módosítandó folyamatok

### PARTIAL FIT - Módosítást igénylő folyamatok

#### 1. Szerviz Folyamat ⚠️

**Dokumentum:** `04-szerviz-folyamat.md`

| Jelenlegi | Új Követelmény | GAP |
|-----------|----------------|-----|
| Munkalap felvétel: Javítás/Árajánlat | **Garancia opció hiányzik** a munkalap felvételnél | ❌ GAP |
| Nincs | Belső kommunikációs mező (szerviz → pult) | ❌ GAP |
| Nincs | Fájl/fotó feltöltés lehetőség | ❌ GAP |
| Nincs | Tartozékok checklist (lánc, kard, doboz, markolat) | ❌ GAP |

**Transcript forrás (12-09):**
> "nekem ezek a diagrammok nem tükrözik... hol találkoztam azzal garancia. Ugye van az, hogy javításra felvét. Nincs opciója a garanciának... már a munkalapon szerepelnie kell garanciának"

> "valamilyen fájlfeltöltési lehetőség... mikor átvesszük, nem vesszük észre... fényképeket, de azt külön odaadni egyszerűbb, ha föl lehetne tölteni mellé"

**Szükséges módosítás:**
```
MUNKALAP FELVÉTEL (Módosított):
├─ Típus választás (ÚJ!):
│   ├─ [1] Normál javítás
│   ├─ [2] Árajánlat kérés
│   └─ [3] Garanciális javítás  ← ÚJ
├─ Tartozékok checklist ← ÚJ
├─ Fotó feltöltés opció ← ÚJ
└─ Belső megjegyzés (szerviz → pult) ← ÚJ
```

---

#### 2. Értékesítés Folyamat ⚠️

**Dokumentum:** `02-ertekesites-folyamat.md`

| Jelenlegi | Új Követelmény | GAP |
|-----------|----------------|-----|
| Manuális árrés beállítás | Automatikus árazás (cikkcsoport + beszállító alapján) | ❌ GAP |
| Nincs | Kollégák NE módosíthassák az árakat | ❌ GAP |
| Nincs | Kedvezmény látható legyen (ha olcsóbban adják) | ❌ GAP |
| Nincs | Árcédula nyomtatás bevételezéskor (ha ár változott) | ❌ GAP |

**Transcript forrás (12-08):**
> "nem lehet egységes haszonkulcsot állítani mindenre, mert például bizonyos márkáknál tartanunk kell az aktuális listaárat, van ami mehet 60%-al, van ami csak a 20-at bírja el"

> "kollégák ne módosíthassanak az árakon, ha valamit olcsóbban adnak, annak látszania kell a rögzítésnél, hogy kedvezményt adott"

> "Bevételezéskor jó lenne, ha feldobna egy ilyen lehetőséget vagy a címkenyomtatóra automatikusan küldené"

**Szükséges módosítás:**
```
BEVÉTELEZÉS (Módosított):
├─ Árrés beállítás automatikus (cikkcsoport + beszállító szabály)
├─ Ár módosítás → Jóváhagyás szükséges (RBAC)
├─ Kedvezmény mező kötelező (ha listaár alatt)
└─ Ár változás figyelés:
    └─ Ha beszerzési ár változott:
        ├─ Figyelmeztetés megjelenítés
        └─ Árcédula nyomtatás felajánlás
```

---

#### 3. Felhasználó Kezelés / RBAC ⚠️ ✅ DÖNTÉS MEGHOZVA

**Dokumentum:** `06-egyeb-felhasznalo.md`, `09-rbac-hierarchia.md`

| Jelenlegi | Új Követelmény | GAP | Döntés |
|-----------|----------------|-----|--------|
| Személyes bejelentkezés | Alapszintű "közös" belépés ügyféltérben | ✅ ELDÖNTVE | Szint 0 auto |
| 6 fix szerepkör | Emelt funkciók saját kóddal kérhetők | ✅ ELDÖNTVE | **4 számjegyű PIN** |
| Nincs | Session kezelés (bezárás után kijelentkezés) | ✅ ELDÖNTVE | 5 perc inaktivitás |

**Döntés (ADR-013):**
- PIN kód formátum: **4 számjegy** (0000-9999)
- Biztonsági szabályok:
  - 3 hibás próbálkozás → 1 perc várakozás
  - 10 hibás próbálkozás → Admin értesítés
  - 5 perc inaktivitás → Visszaáll Szint 0-ra

**Végleges belépési szintek:**
```
BELÉPÉSI SZINTEK (Eldöntve):
├─ SZINT 0: Automatikus (ügyféltér gépek) - PIN NEM kell
│   ├─ Bérlés indítás/visszavétel
│   ├─ Szerviz felvétel
│   └─ Értékesítés
│
├─ SZINT 1: PIN kód (4 számjegy, egyéni)
│   ├─ Bevételezés
│   ├─ Statisztikák
│   └─ Ügyfél részletek
│
├─ SZINT 2: Admin (PIN + jogosultság)
│   ├─ Ár módosítás
│   ├─ Pénzügy
│   └─ Riportok
│
└─ Session: 5 perc inaktivitás → SZINT 0
```

---

#### 4. Fizetési Fegyelem ⚠️

**Dokumentum:** `07-fizetesi-fegyelem.md`

| Jelenlegi | Új Követelmény | GAP |
|-----------|----------------|-----|
| Tartozás figyelmeztetés | NAV adószám online ellenőrzés | ❌ GAP |
| Nincs | Lejárt számla → Új számla blokkolás (halasztott fizetésnél) | ❌ GAP |

**Transcript forrás (12-1.all):**
> "Az utalási számlát (halasztott fizetés) kapó ügyfeleknél szigorítani kell (lejárt számlával ne lehessen újat adni), és az adószámokat manuálisan kell ellenőrizni"

---

#### 5. Garanciális Javítás ⚠️ ✅ DÖNTÉS MEGHOZVA

**Dokumentum:** `08-garancialis-javitas.md`

| Jelenlegi | Új Követelmény | GAP | Döntés |
|-----------|----------------|-----|--------|
| Makita norma dokumentálva | **Nincs szerviz munkalap integrációja** | ❌ GAP | Integrálni |
| Egyedi elbírálás dokumentálva | Bevizsgálási díj eltérés (garancia = 0 Ft) | ✅ ELDÖNTVE | **B) Felhasználó dönt** |

**Döntés (ADR-013):**
- Bevizsgálási díj alapértelmezett: **0 Ft** garanciálisnál
- Módosítható: **IGEN** (figyelmeztetéssel)
- Ha mégis felszámítják: **indoklás kötelező** (audit)

---

#### 6. Pénzügy Folyamat ⚠️

**Dokumentum:** `05-penzugy-folyamat.md`

| Jelenlegi | Új Követelmény | GAP |
|-----------|----------------|-----|
| Alapfolyamatok | Előlegszámla kezelés hiányos | ❌ GAP |
| Nincs | Díjbekérő folyamat | ❌ GAP |
| Nincs | MyPOS token visszatérítés folyamat | ❌ GAP |

---

#### 7. Értesítések Folyamat ⚠️

**Dokumentum:** `07-ertesitesek-folyamat.md`

| Jelenlegi | Új Követelmény | GAP |
|-----------|----------------|-----|
| Késés értesítés | Megrendelés beérkezés értesítés | ❌ GAP |
| Nincs | Meghatalmazott lista érvényesség ellenőrzés (fél évente) | ❌ GAP |

---

#### 8. Árazás Automatizálás ⚠️

**Dokumentum:** `07-arrazas-automatizalas.md`

| Jelenlegi | Új Követelmény | GAP |
|-----------|----------------|-----|
| Árrés kategóriák (egyszerű) | Brand + Beszállító + Értékhatár kombináció | ❌ GAP |
| Nincs | Listaár védelem (bizonyos márkáknál kötelező) | ❌ GAP |

---

### FULL GAP - Teljesen új folyamatok szükségesek

#### 1. Szerviz Belső Kommunikáció ❌ ÚJ

**Nincs dokumentum**

**Követelmény (12-09):**
> "legyen egy belső kommunikációs csatorna... a szervíz tud a pultossal kommunikálni... a szervíz egy csomó üzenetet ír a pultnak, hogy mit mondjon majd az ügyfélnek"

**Szükséges folyamat:**
```
SZERVIZ → PULT KOMMUNIKÁCIÓ:
├─ Munkalaphoz csatolt belső megjegyzések
├─ Csak pultos látja (ügyfél NEM)
├─ Villogó értesítés kiadáskor
├─ Típusok:
│   ├─ Ügyfélnek elmondandó (kötelező olvasás)
│   ├─ Probléma jelzés (opcionális)
│   └─ Figyelmeztetés (sárga/piros)
└─ Audit: Ki, mikor írta
```

---

#### 2. Fájlfeltöltés Szervizhez ❌ ÚJ

**Nincs dokumentum**

**Követelmény (12-09):**
> "valamilyen fájfeltöltési lehetőség... mikor szétszedjük a karburátort... fotókat... föl tudná azonnal tölteni mellé"

**Szükséges folyamat:**
```
MUNKALAP KÉPFELTÖLTÉS:
├─ Felvételkor (ügyfél tér)
│   ├─ Gép állapot fotók
│   └─ Tartozékok fotó
├─ Szervizben
│   ├─ Talált problémák (pl. "ezt találtuk benne")
│   ├─ Alkatrész állapot
│   └─ Kész gép fotó
├─ Formátum: JPG/PNG, max 5MB
├─ Zebra eszközről közvetlen feltöltés
└─ Árajánlathoz csatolható
```

---

#### 3. Szervizes Alkatrész Rendelés ❌ ÚJ

**Nincs dokumentum**

**Követelmény (11-26-01):**
> "szervizeseknek saját rendelő ablaka lenne... munkalapról egy belső kosárba pakolhatná a szükséges alkatrészeket... egy-egy alkatrész beérkezésekor rögtön látná, hogy melyik géphez érkezett"

**Szükséges folyamat:**
```
SZERVIZES RENDELÉS:
├─ Munkalapról "Kosárba" gomb
├─ Szervizes saját kosár/rendelés lista
├─ Beérkezéskor:
│   ├─ Auto értesítés
│   └─ Géphez rendelve jelenik meg
├─ Mini raktár személyenként
├─ Felelősség: rossz rendelés = szervizes
└─ Kollektív felelősség: nagy raktár hiány
```

---

#### 4. Robbantott Ábra Adatbázis ❌ ÚJ

**Nincs dokumentum**

**Követelmény (11-26-01):**
> "elég lenne géptípust beütni, azonnal dobná a rendszer a robbantott ábrát és az alkatrész listát, az elérhetőségekkel és az árakkal"

**Szükséges folyamat:**
```
ROBBANTOTT ÁBRA KEZELÉS:
├─ Géptípus → Robbantott ábra (PDF/kép)
├─ Alkatrész lista (cikkszámokkal)
├─ Beszállító elérhetőség
├─ Aktuális árak
├─ Készlet státusz:
│   ├─ Boltban van
│   ├─ Beszállítónál van (hány nap)
│   └─ Nem elérhető
├─ Prioritás: Makita, Hikoki (egyszerűbb)
└─ Franchise: elérhető, de NEM exportálható
```

---

#### 5. Dolgozói Kedvezmény Rendszer ❌ ÚJ

**Nincs dokumentum**

**Követelmény (12-09):**
> "van-e havi éves limit a dolgoző ingyenes bérésekre?... vásárláshoz meg be kell állítani dolgozói kedvezményt százalék"

**Szükséges folyamat:**
```
DOLGOZÓI KEDVEZMÉNY:
├─ Bérlés:
│   ├─ Ingyenes (de követett)
│   ├─ Limit beállítható (opcionális)
│   └─ Csak otthoni munkára (szabály)
├─ Vásárlás:
│   ├─ Kedvezmény %: beállítható
│   ├─ Pl. beszerzési ár + ÁFA
│   └─ Max összeg/hó (opcionális)
└─ Riport: dolgozói használat kimutatás
```

---

#### 6. Kaució Token Kezelés (MyPOS) ❌ ÚJ ✅ DÖNTÉS MEGHOZVA

**Nincs dokumentum** → Új dokumentum szükséges

**Döntés (ADR-013):** A1 + A3 + B2 kombináció

| Eset | Szabály | Döntés |
|------|---------|--------|
| Más hozza vissza (magánszemély) | A1 | Mindig meghatalmazás szükséges |
| Más hozza vissza (céges) | A3 | Ha meghatalmazott listán szerepel → OK |
| Készpénzes visszaadás | B2 | Csak meghatalmazással + személyi ig. szám |

**Végleges folyamat:**
```
KAUCIÓ VISSZATÉRÍTÉS (Eldöntve):
├─ Eredeti bérlő hozza vissza:
│   ├─ Van kártyája → Kártyára visszautalás
│   └─ Nincs kártyája → Meghatalmazás + készpénz
│
├─ Más személy hozza vissza:
│   ├─ MAGÁNSZEMÉLY → Meghatalmazás KÖTELEZŐ
│   └─ CÉGES:
│       ├─ Listán szerepel → OK ✅
│       └─ Nincs listán → Meghatalmazás KÖTELEZŐ
│
└─ Készpénzes visszaadás (ha nincs kártya):
    ├─ Meghatalmazás KÖTELEZŐ
    ├─ Átvételi elismervény
    └─ Személyi ig. szám rögzítése
```

---

#### 7. Meghatalmazott Érvényesség ❌ ÚJ

**Nincs dokumentum**

**Követelmény (12-09):**
> "automatikusan kiküld egy rendszert, mit tudom én fél évente, hogy egyeztetés céljából"

**Szükséges folyamat:**
```
MEGHATALMAZOTT KEZELÉS:
├─ Céges partner → Meghatalmazott lista
├─ Érvényesség:
│   ├─ Határozatlan (alapértelmezett)
│   └─ Cég felelőssége a frissítés
├─ Automatikus értesítés:
│   ├─ 6 havonta email
│   ├─ "Kérjük erősítse meg a listát"
│   └─ Válasz nélkül: Figyelmeztetés
└─ Audit log: ki vett át, mikor
```

---

#### 8. Szerviz Statisztika (Tünet → Javítás) ❌ ÚJ

**Nincs dokumentum**

**Követelmény (11-26-01):**
> "Ha minden szerviz információjához hozzáférünk, akkor születhet egy statisztika, hogy bizonyos tünetek felvételekor milyen javítások történtek egy adott géptípusnál"

**Szükséges folyamat:**
```
SZERVIZ TUDÁSBÁZIS:
├─ Géptípus + Tünet → Gyakori javítások
├─ Adatforrás: Lezárt munkalapok
├─ Átvételkor javaslat:
│   └─ "Hasonló problémánál X javítás volt Y%-ban"
├─ Franchise: megosztott tudásbázis
└─ Nem exportálható (védett)
```

---

#### 9. Minimum Készlet Auto Rendelés ❌ ÚJ

**Nincs dokumentum**

**Követelmény (11-26-01, 12-1.all):**
> "a teljes raktárkészletet figyelné a rendszer és ha valami a megadott minimum alá esik, akkor rendelésbe rakja cégekre bontva"

**Szükséges folyamat:**
```
AUTO RENDELÉS:
├─ Cikkenként: minimum készlet szint
├─ Beszállítónként: minimum rendelési érték
├─ Trigger: készlet < minimum
├─ Rendelési javaslat generálás
├─ Jóváhagyás után: rendelés küldés
└─ Franchise: bolt szinten is beállítható
```

---

#### 10. PDF Használati Utasítás ❌ ÚJ

**Nincs dokumentum**

**Követelmény (12-1.all):**
> "a termékek mellett legyen letölthető PDF magyar használati utasítás... a legtöbb probléma a helytelen használatból adódik"

---

#### 11. Munka Alapú Gép Keresés ❌ ÚJ

**Nincs dokumentum**

**Követelmény (12-1.all):**
> "kereső funkcióra, ahol az ügyfél nem a gépet, hanem a munkát adja meg (pl. 'téglafal fúrása'), és a rendszer a legalkalmasabb bérelhető vagy megvásárolható gépet dobja fel"

---

#### 12. TAJ Szám Törlés ❌ ADATMIGRÁCIÓS

**Követelmény (12-09):**
> "a tajszám... nekünk semmi köz... nincs adat töröljük teljesen"

**Teendő:** Partner tábla TAJ_SZAM mező törlése + migráció.

---

## Prioritási Mátrix

### 🔴 KRITIKUS (MVP előtt szükséges)

| # | GAP | Indoklás |
|---|-----|----------|
| 1 | Garanciális opció szerviz munkalapnál | Alapvető üzleti igény, napi használat |
| 2 | Többszintű belépés (ügyféltér) | Biztonsági és használhatósági kritikus |
| 3 | Automatikus árazás alapok | Egységes árak, hibamegelőzés |
| 4 | Ár módosítás védelem (RBAC) | Bevétel védelem |

### 🟡 MAGAS (MVP után, 1. fázis)

| # | GAP | Indoklás |
|---|-----|----------|
| 5 | Szerviz belső kommunikáció | Minőség javítás |
| 6 | Fájlfeltöltés munkalaphoz | Transzparencia, bizonyítás |
| 7 | Szervizes alkatrész kosár | Hatékonyság növelés |
| 8 | Kaució token kezelés | Pénzügyi biztonság |
| 9 | NAV adószám ellenőrzés | Fizetési fegyelem |

### 🟢 KÖZEPES (2. fázis)

| # | GAP | Indoklás |
|---|-----|----------|
| 10 | Robbantott ábra adatbázis | Hosszú távú érték |
| 11 | Szerviz statisztika (tudásbázis) | Franchise érték |
| 12 | Minimum készlet auto rendelés | Automatizálás |
| 13 | Dolgozói kedvezmény rendszer | Belső szabályozás |
| 14 | Meghatalmazott érvényesség | Compliance |

### ⚪ ALACSONY (3. fázis / Nice-to-have)

| # | GAP | Indoklás |
|---|-----|----------|
| 15 | PDF használati utasítás | Marketing érték |
| 16 | Munka alapú gép keresés | Ügyfélélmény |

---

## Módosítandó Diagramok

| # | Diagram | Módosítás típusa | Fájl |
|---|---------|------------------|------|
| 1 | Szerviz folyamat | Garancia opció + Fotó + Belső komment | `4-szerviz-folyamat.excalidraw` |
| 2 | Szerviz ERD | Új mezők (foto_url, belso_megjegyzes) | `4-szerviz-erd.excalidraw` |
| 3 | Értékesítés folyamat | Auto árazás + Kedvezmény mező | `2-ertekesites-folyamat.excalidraw` |
| 4 | RBAC hierarchia | Szint 0/1/2 belépés | `9-rbac-hierarchia.md` |
| 5 | Fizetési fegyelem | NAV ellenőrzés + Blokkolás | `7-fizetesi-fegyelem.excalidraw` |
| 6 | Garanciális javítás | Szerviz integrációs link | `8-garancialis-javitas.excalidraw` |
| 7 | Pénzügy folyamat | Előleg + Díjbekérő | `5-penzugy-folyamat.excalidraw` |
| 8 | Értesítések | Megrendelés beérkezés + Meghatalmazott | `7-ertesitesek-folyamat.excalidraw` |

---

## Új Diagramok Szükségesek

| # | Új Diagram | Típus | Prioritás |
|---|------------|-------|-----------|
| 1 | Szerviz Belső Kommunikáció | Folyamatábra | 🟡 MAGAS |
| 2 | Munkalap Fájlfeltöltés | DFD | 🟡 MAGAS |
| 3 | Szervizes Alkatrész Rendelés | Folyamatábra | 🟡 MAGAS |
| 4 | Kaució Token Kezelés | Folyamatábra + Döntési fa | 🟡 MAGAS |
| 5 | Dolgozói Kedvezmény | ERD + Folyamat | 🟢 KÖZEPES |
| 6 | Robbantott Ábra Adatbázis | ERD + DFD | 🟢 KÖZEPES |
| 7 | Szerviz Tudásbázis | Architektúra | 🟢 KÖZEPES |
| 8 | Auto Rendelés | Folyamatábra | 🟢 KÖZEPES |
| 9 | Meghatalmazott Kezelés | Folyamatábra | 🟢 KÖZEPES |

---

## Következő Lépések

1. ✅ ~~**Nyitott kérdések megválaszolása**~~ - Döntések dokumentálva (ADR-013)
2. ✅ ~~**Árazási stratégia**~~ - Kombinált hierarchia elfogadva (ADR-012)
3. ⏳ **Validáció** - Fit-Gap elemzés átnézése Zoli/Zsuzsi-val
4. ⏳ **Prioritás véglegesítés** - MVP scope döntés
5. ⏳ **Diagram módosítások** - Kritikus GAP-ek beépítése (8 diagram)
6. ⏳ **Új diagramok** - Prioritás szerinti elkészítés (9 új diagram)
7. ⏳ **PRD frissítés** - Új követelmények dokumentálása

---

## Kapcsolódó Dokumentumok

| Dokumentum | Hely |
|------------|------|
| **Döntések (Fit-Gap)** | [ADR-013-fit-gap-dontesek.md](../architecture/ADR-013-fit-gap-dontesek.md) |
| **Árazási Stratégia** | [ADR-012-arastrategia-opciok.md](../architecture/ADR-012-arastrategia-opciok.md) |
| Jelenlegi diagramok | `/docs/Flows/diagrams/` |
| Diagram dokumentációk | `/docs/Flows/diagram-docs/` |
| Transcripts | `/docs/Flows/transcripts/` |
| PRD | `/docs/prd.md` |
| Architektúra ADR-ek | `/docs/architecture/` |
