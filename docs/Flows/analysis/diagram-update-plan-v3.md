# KGC ERP v3 - Diagram Frissítési Terv

**Készítette:** Mary (Business Analyst) + BMAD Team
**Dátum:** 2025-12-08
**Forrás:** KGC-ERP-v3-Diagramok.html megjegyzések (CSV export)
**Verzió:** 3.0

---

## Összefoglaló

Ez a dokumentum az ügyfél megjegyzéseit (CSV) **diagram-specifikusan** elemzi és meghatározza a szükséges módosításokat minden érintett diagramhoz.

### Érintett Diagramok

| # | CSV ID | Diagram Fájl | Változás Típus |
|---|--------|--------------|----------------|
| 1 | `1-ugyfelfelvitel-folyamat` | [01-ugyfelfelvitel-folyamat.md](../diagram-docs/01-ugyfelfelvitel-folyamat.md) | 🔴 Jelentős |
| 2 | `1-ugyfelfelvitel-dontesi-fa` | [01-ugyfelfelvitel-dontesi-fa.md](../diagram-docs/01-ugyfelfelvitel-dontesi-fa.md) | 🟠 Közepes |
| 3 | `1-ugyfelfelvitel-erd` | [01-ugyfelfelvitel-erd.md](../diagram-docs/01-ugyfelfelvitel-erd.md) | 🟠 Közepes |
| 4 | `2-ertekesites-erd` | [02-ertekesites-erd.md](../diagram-docs/02-ertekesites-erd.md) | 🟢 Minimális |
| 5 | `3-bergep-folyamat` | [03-bergep-folyamat.md](../diagram-docs/03-bergep-folyamat.md) | 🟠 Közepes |
| 6 | `4-szerviz-folyamat` | [04-szerviz-folyamat.md](../diagram-docs/04-szerviz-folyamat.md) | 🟠 Közepes |

### Új Diagramok Szükségesek

| # | Diagram Név | Típus | Indoklás |
|---|-------------|-------|----------|
| 1 | `10-mypos-kaucio-folyamat` | Folyamatábra | MyPos integráció kaució kezeléshez |
| 2 | `10-device-auth-folyamat` | Folyamatábra | Kiosk/gép-alapú bejelentkezés |
| 3 | `10-kedvezmeny-erd` | ERD | Dolgozói kedvezmény rendszer |

---

## 1. Diagram: `01-ugyfelfelvitel-folyamat.md`

### Ügyfél Megjegyzései (CSV)

```
"A belépésnél legyen egy alap belépési lehetőség, mert pl. ha Zoli nyitja reggel
a rendszert, akkor mindenki látni fogja a hozzáféréseit. Tehát 3db bolti gépen
alap felhasználási szintű belépés. A bevételező gépnél más jogosultsági szinttel
lehessen belépni..."

"Ügyfélnél bérlés esetében fontos, hogy a bérleti szerződés mindig magánszemélyre
szól, aki aláírja a dokumentumot. Csak a számla szól cégnévre..."

"Kaució: egy hónapja szerződtünk a MyPos-al, ahol van lehetőség kártyára
visszatenni pénzt..."

"A gép kiválasztásához fontos, hogy a szükséges kellékeket és a fizetős
tartozékokat be lehessen pipálni..."
```

### Jelenlegi Állapot vs. Új Követelmények

| Szekció | Jelenlegi (01-ugyfelfelvitel-folyamat.md) | Új Követelmény | Változás |
|---------|-------------------------------------------|----------------|----------|
| **1.1 Belépés** | "Felhasználó belép a rendszerbe (bejelentkezés)" - egyéni | 3 bolti gép közös alapszintű belépéssel | 🆕 ÚJ LÉPÉS |
| **1.7 Kaució** | "CSAK KÉSZPÉNZ fogadható!" | MyPos kártyás + 2% díj | 🔄 MÓDOSÍTÁS |
| **1.6 Gép kiválasztás** | Nincs tartozék kezelés | Kellékek, tartozékok pipálása | 🆕 ÚJ LÉPÉS |
| **1.8-1.10** | rogzito_id = rendszerben bejelentkezett | Fizikai kiadó személy rögzítése | 🔄 MÓDOSÍTÁS |
| **2.3 Visszavétel** | visszavevo_id = rendszerben bejelentkezett | Fizikai visszavevő személy rögzítése | 🔄 MÓDOSÍTÁS |

### Diagram Módosítási Terv

```
VÁLTOZTATÁSOK AZ EXCALIDRAW DIAGRAMON:

1. ÚJ KEZDŐ BLOKK (1.1 előtt):
   ┌─────────────────────────────────────┐
   │  BELÉPÉSI MÓD VÁLASZTÁS             │
   │  ┌───────────┬───────────┐          │
   │  │ Kiosk Mód │ Egyéni    │          │
   │  │ (bolti)   │ Bejelentk │          │
   │  └───────────┴───────────┘          │
   └─────────────────────────────────────┘

2. MÓDOSÍTOTT KAUCIÓ BLOKK (1.7):
   ┌─────────────────────────────────────┐
   │  KAUCIÓ TÍPUS?                      │
   │  ┌─────────┬─────────┬─────────┐    │
   │  │Készpénz │Kártya   │Átutalás │    │
   │  │(0%)     │(+2%)    │(cég)    │    │
   │  └─────────┴─────────┴─────────┘    │
   └─────────────────────────────────────┘

3. ÚJ TARTOZÉK BLOKK (1.6 után):
   ┌─────────────────────────────────────┐
   │  TARTOZÉKOK KIVÁLASZTÁSA            │
   │  ☐ Kesztyű    ☐ Védőszemüveg        │
   │  ☐ Akku (2.)  ☐ Szerszámtáska       │
   │  ☐ Egyéb: ________                  │
   └─────────────────────────────────────┘

4. MÓDOSÍTOTT KIADÁS/VISSZAVÉTEL:
   ┌─────────────────────────────────────┐
   │  KI ADTA KI FIZIKAILAG?             │
   │  [Dropdown: Péter, Levente, Zoli]   │
   └─────────────────────────────────────┘
```

### Dokumentáció Frissítés TODO

- [ ] Belépési mód választás szekció hozzáadása (1.0)
- [ ] Kaució blokk átírása (1.7) - MyPos támogatás
- [ ] Tartozék kiválasztás szekció hozzáadása (1.6.1)
- [ ] Fizikai kiadó/visszavevő személy rögzítés (1.10, 2.3)
- [ ] Dolgozói kedvezmény megjegyzés (1.4)
- [ ] Később fizetendő tételek szekció (1.6.2)

---

## 2. Diagram: `01-ugyfelfelvitel-dontesi-fa.md`

### Ügyfél Megjegyzései (CSV)

```
"Kártyás fizetésnél is van számla. Készpénz magánszemély számla vagy nem.
Ha nem számla, akkor egy háttér szállítólevélre mentődik."

"Gép visszavételkor, ha a géppel a felhasználó hibájából történt kár...
a kauciót benntartjuk. Erre nincs papír jelenleg, a gép visszahozatalkor
egy jegyzőkönyv kellene a benntartott kaucióról."
```

### Jelenlegi Állapot vs. Új Követelmények

| Döntési Pont | Jelenlegi | Új Követelmény | Változás |
|--------------|-----------|----------------|----------|
| **D4 Fizetési mód** | Kártya = nincs számla | Kártya = VAN számla | 🔄 MÓDOSÍTÁS |
| **D4 után** | - | Készpénz + nem számla → háttér szállítólevél | 🆕 ÚJ ÁG |
| **D5 után** | Nincs kár kezelés | Kár esetén → jegyzőkönyv | 🆕 ÚJ DÖNTÉS |

### Diagram Módosítási Terv

```
VÁLTOZTATÁSOK AZ EXCALIDRAW DIAGRAMON:

1. MÓDOSÍTOTT D4 (Fizetési Mód):
   ┌─────────────────────────────────────┐
   │      FIZETÉSI MÓD? (D4)             │
   └──────────────┬──────────────────────┘
                  │
   ┌──────────────┼──────────────┬───────────────┐
   │              │              │               │
Készpénz      Kártya       Átutalás
   │              │              │
   ▼              ▼              ▼
┌────────┐   ┌────────┐   ┌────────────┐
│Számla? │   │ Számla │   │Meghatalm.? │
│ I/N    │   │+2% díj │   │ellenőrzés  │
└───┬────┘   └────────┘   └────────────┘
    │
  ┌─┴──┐
 NEM  IGEN
  │     │
  ▼     ▼
┌─────────┐  ┌────────┐
│ Háttér  │  │ Számla │
│szállító-│  │kiállít │
│ levél   │  └────────┘
└─────────┘

2. ÚJ D6 DÖNTÉS (Visszavételnél):
   ┌─────────────────────────────────────┐
   │      KÁR VAN? (D6)                  │
   └──────────────┬──────────────────────┘
                  │
        ┌─────────┴─────────┐
        │                   │
      IGEN                 NEM
        │                   │
        ▼                   ▼
   ┌────────────┐    ┌────────────┐
   │Azonnal     │    │ Kaució     │
   │megállap.?  │    │ visszaadás │
   └─────┬──────┘    └────────────┘
         │
   ┌─────┴─────┐
  IGEN       NEM
   │          │
   ▼          ▼
┌────────┐ ┌────────────┐
│Számlázás│ │Jegyzőkönyv │
│ azonnal │ │+ kaució    │
└────────┘ │benntartás  │
           └────────────┘
```

### Dokumentáció Frissítés TODO

- [ ] D4 döntési pont átírása (Kártya = VAN számla)
- [ ] Háttér szállítólevél ág hozzáadása
- [ ] D6 döntési pont: Kár van? hozzáadása
- [ ] Jegyzőkönyv folyamat dokumentálása
- [ ] Átutalás + meghatalmazott ellenőrzés

---

## 3. Diagram: `01-ugyfelfelvitel-erd.md`

### Ügyfél Megjegyzései (CSV)

```
"Partner - FK rögzítő mit jelent? TAJ szám nem kell. Anyja nevét is fel szoktuk
venni, születési hely és idő, ha az állandólakcím nem egyezik a tartózkodási
hellyel, azt is. Tulajdonképpen ami a személyin és a lakcímkártyán szerepel
plusz e-mail és telefon."

"A cégeknél fontos, hogy rögzíthető legyen az ÁFA tartalom miatt, hogy magyar,
EU-n belüli vagy harmadik országbeli. Az ÁFA tartalom legyen automatikus."
```

### Jelenlegi Állapot vs. Új Követelmények

| Entitás | Mező | Jelenlegi | Változás |
|---------|------|-----------|----------|
| **PARTNER** | taj_szam | Opcionális | 🗑️ TÖRLÉS (nem kell) |
| **PARTNER** | mothers_name | ❌ Nincs | 🆕 HOZZÁADÁS |
| **PARTNER** | birth_place | ❌ Nincs | 🆕 HOZZÁADÁS |
| **PARTNER** | birth_date | ❌ Nincs | 🆕 HOZZÁADÁS |
| **PARTNER** | temporary_address | ❌ Nincs | 🆕 HOZZÁADÁS |
| **CÉG** | vat_zone | ❌ Nincs | 🆕 HOZZÁADÁS |

### ERD Módosítási Terv

```
PARTNER entitás bővítése:
┌─────────────────────────────────────┐
│            PARTNER                  │
├─────────────────────────────────────┤
│ PK  partner_id (INT)                │
│     tenant_id (UUID) 🏢             │
├─────────────────────────────────────┤
│     nev (VARCHAR)                   │
│     cim (VARCHAR)                   │  ← Állandó lakcím
│ 🆕  temporary_address (VARCHAR)     │  ← Tartózkodási hely
│     igazolvanyszam (VARCHAR)        │
│ ❌  taj_szam (VARCHAR) - TÖRÖLT     │
│ 🆕  mothers_name (VARCHAR)          │  ← Anyja neve
│ 🆕  birth_place (VARCHAR)           │  ← Születési hely
│ 🆕  birth_date (DATE)               │  ← Születési idő
│     telefon (VARCHAR)               │
│     email (VARCHAR)                 │
│     e_szamla (BOOLEAN)              │
│ FK  rogzito_id (INT)                │  → Magyarázat hozzáadása
└─────────────────────────────────────┘

CÉG entitás bővítése:
┌─────────────────────────────────────┐
│              CÉG                    │
├─────────────────────────────────────┤
│ PK  ceg_id (INT)                    │
│     tenant_id (UUID) 🏢             │
├─────────────────────────────────────┤
│ FK  partner_id (INT)                │
│     cegnev (VARCHAR)                │
│     adoszam (VARCHAR)               │
│     cim (VARCHAR)                   │
│     mukodo (BOOLEAN)                │
│     nav_ellenorzott (DATETIME)      │
│ 🆕  vat_zone (ENUM)                 │  ← HU/EU/NON_EU
│                                     │    Auto: adószám alapján
└─────────────────────────────────────┘
```

### Dokumentáció Frissítés TODO

- [ ] PARTNER: taj_szam mező törlése/opcionális jelzése
- [ ] PARTNER: mothers_name, birth_place, birth_date hozzáadása
- [ ] PARTNER: temporary_address mező hozzáadása
- [ ] PARTNER: rogzito_id magyarázat ("Ki rögzítette a partnert")
- [ ] CÉG: vat_zone enum hozzáadása (HU/EU/NON_EU)
- [ ] CÉG: Auto ÁFA logika dokumentálása

---

## 4. Diagram: `02-ertekesites-erd.md`

### Ügyfél Megjegyzései (CSV)

```
"A cikkcsoportoknak már nagy jelentősége nincs, anno a bontott leltár miatt
alakult ki... Ha mindennek vonalkódja van és digitális a leltár, akkor
gyorsabb lesz. Kiinduló készlettel a leltárban szereplő cikkekkel és az
5 évnél nem régebbi termékekkel indulnánk."
```

### Jelenlegi Állapot vs. Új Követelmények

| Elem | Jelenlegi | Új Követelmény | Változás |
|------|-----------|----------------|----------|
| **CIKKCSOPORT** | Kötelező FK | Opcionális, csökkentett jelentőség | 🟡 MEGJEGYZÉS |
| **Leltár** | Nincs specifikus | Vonalkód + digitális | ✅ MEGVAN |
| **Migráció** | - | 5 évnél nem régebbi | 📝 DOKUMENTÁLÁS |

### Dokumentáció Frissítés TODO

- [ ] CIKKCSOPORT jelentőség csökkentés megjegyzés
- [ ] Migráció szabály: 5 évnél nem régebbi termékek
- [ ] Vonalkódos digitális leltár kiemelése

---

## 5. Diagram: `03-bergep-folyamat.md`

### Ügyfél Megjegyzései (CSV)

```
"Az adatok megadásához még kellene a bérleti díj/24 óra. Kapcsolódó termékek
esetleg pl. vésőszárak, fúrószárak, akkuk stb"

"A bérgépnél az alapvető javításhoz szükséges cikkszámok is megjelenhetnének..."

"A bérlési idő beállításánál kellene egy hétvége opció, hogy ne kelljen
számolgatni. Tehát, ha szombaton viszi a gépet hétfőig, automatikusan
számolja a 1,5 napot (fél nap kedvezményt kapnak ilyenkor)."
```

### Jelenlegi Állapot vs. Új Követelmények

| Szekció | Jelenlegi | Új Követelmény | Változás |
|---------|-----------|----------------|----------|
| **Bérgép adatok** | napi_dij mező | + Kapcsolódó termékek lista | 🆕 ÚJ SZEKCIÓ |
| **Kimutatások** | - | + Gyakori javítási cikkszámok | 🆕 ÚJ SZEKCIÓ |
| **Időtartam** | felnap/1nap/0 | + HÉTVÉGE opció (1.5x) | 🆕 ÚJ ENUM |

### Diagram Módosítási Terv

```
VÁLTOZTATÁSOK AZ EXCALIDRAW DIAGRAMON:

1. BÉRGÉP ADATLAP BŐVÍTÉSE:
   ┌─────────────────────────────────────┐
   │  BÉRGÉP ADATOK                      │
   ├─────────────────────────────────────┤
   │  Kód: ST200                         │
   │  Megnevezés: Stihl TS400 Betonvágó  │
   │  Napi díj: 15.000 Ft                │
   │  Kaució: 50.000 Ft                  │
   │                                     │
   │  🆕 KAPCSOLÓDÓ TERMÉKEK:            │
   │  ├─ Vágókorong (VK-350)             │
   │  ├─ Védőszemüveg (VSZ-01)           │
   │  └─ Porálarcok (PA-5)               │
   │                                     │
   │  🆕 GYAKORI JAVÍTÁSI CIKKEK:        │
   │  ├─ Gyújtógyertya (GYG-STIHL-01)    │
   │  ├─ Légszűrő (LSZ-TS400)            │
   │  └─ Üzemanyagszűrő (USZ-TS400)      │
   └─────────────────────────────────────┘

2. IDŐTARTAM VÁLASZTÁS BŐVÍTÉSE:
   ┌─────────────────────────────────────┐
   │  BÉRLÉSI IDŐTARTAM?                 │
   ├─────────────────────────────────────┤
   │  ○ Fél nap (5 óra) - 50%            │
   │  ○ 1 nap - 100%                     │
   │  ○ 🆕 HÉTVÉGE (szo-hé) - 150%       │
   │  ○ Szállítólevél (0) - később       │
   └─────────────────────────────────────┘
```

### Dokumentáció Frissítés TODO

- [ ] Kapcsolódó termékek szekció hozzáadása
- [ ] Gyakori javítási cikkszámok szekció
- [ ] Hétvége opció (1.5 nap) az időtartam enumhoz
- [ ] ERD bővítés: BÉRGÉP_TARTOZÉK, BÉRGÉP_JAVÍTÁS_CIKK

---

## 6. Diagram: `04-szerviz-folyamat.md`

### Ügyfél Megjegyzései (CSV)

```
"A gép felvételekor 3 státuszban vehető fel a gép: - garanciális, - javításra,
- árajánlatra."

"A javításhoz jó lenne fájlokat csatolni, pl. garancialevelet, vásárlás
számláját. A gépek fotóját átvételkor."

"Egy kiválasztható (pipálható lista), hogy milyen tartozékkal jött be a gép:
markolat, burkolat, lánc, láncvezető, akkumulátor stb..."

"A szervizes belső információkat ""üzeneteket"" hagy a kollégáknak..."
```

### Jelenlegi Állapot vs. Új Követelmények

| Szekció | Jelenlegi | Új Követelmény | Változás |
|---------|-----------|----------------|----------|
| **1.3 Munkalap** | statusz: felveve/arajanalt/... | + intake_type: garanciális/javítás/árajánlat | 🆕 ÚJ MEZŐ |
| **1.2 Gép felvétel** | problema_leiras (TEXT) | + Tartozék checklist | 🆕 ÚJ BLOKK |
| **1.2 Gép felvétel** | - | + Fájl csatolás (garancia, számla, fotó) | 🆕 ÚJ BLOKK |
| **Kommunikáció** | megjegyzes | + internal_notes (csak belsős) | 🆕 ÚJ MEZŐ |

### Diagram Módosítási Terv

```
VÁLTOZTATÁSOK AZ EXCALIDRAW DIAGRAMON:

1. ÚJ FELVÉTELI TÍPUS BLOKK (1.2 után):
   ┌─────────────────────────────────────┐
   │  FELVÉTELI TÍPUS?                   │
   ├─────────────────────────────────────┤
   │  ○ Garanciális javítás              │
   │  ○ Normál javítás                   │
   │  ○ Árajánlat kérés                  │
   └─────────────────────────────────────┘

2. ÚJ TARTOZÉK CHECKLIST (1.2):
   ┌─────────────────────────────────────┐
   │  BEADOTT TARTOZÉKOK                 │
   ├─────────────────────────────────────┤
   │  ☐ Markolat     ☐ Lánc              │
   │  ☐ Láncvezető   ☐ Burkolat          │
   │  ☐ Akkumulátor  ☐ Töltő             │
   │  ☐ Egyéb: ________                  │
   │                                     │
   │  Megjegyzés: ___________________    │
   └─────────────────────────────────────┘

3. ÚJ CSATOLMÁNY BLOKK (1.2):
   ┌─────────────────────────────────────┐
   │  CSATOLMÁNYOK                       │
   ├─────────────────────────────────────┤
   │  📎 Garancialevél     [Feltöltés]   │
   │  📎 Vásárlási számla  [Feltöltés]   │
   │  📷 Gép fotó          [Kamera]      │
   └─────────────────────────────────────┘

4. BELSŐ ÜZENETEK (új):
   ┌─────────────────────────────────────┐
   │  🔒 BELSŐ ÜZENETEK (csak személyzet)│
   ├─────────────────────────────────────┤
   │  "Rossz üzemanyagot töltött az      │
   │   ügyfél" - Szervizes, 2025-12-07   │
   └─────────────────────────────────────┘
```

### Dokumentáció Frissítés TODO

- [ ] Felvételi típus (intake_type) szekció
- [ ] Tartozék checklist szekció és lista
- [ ] Csatolmány kezelés (garancia, számla, fotó)
- [ ] Belső üzenetek (internal_notes) szekció
- [ ] ERD bővítés: SZERVIZ_TARTOZÉK, MUNKALAP_CSATOLMÁNY

---

## Új Diagramok Terve

### 10-mypos-kaucio-folyamat.excalidraw

```
┌─────────────────────────────────────────────────────────────────┐
│                 MyPos KAUCIÓ FOLYAMAT                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────┐    ┌─────────────┐    ┌─────────────────┐         │
│  │ Kaució  │───▶│ Fizetési    │───▶│ Készpénz?       │         │
│  │ összeg  │    │ mód?        │    │ Kaució = 100%   │         │
│  └─────────┘    └──────┬──────┘    └─────────────────┘         │
│                        │                                        │
│                   Kártya                                        │
│                        │                                        │
│                        ▼                                        │
│              ┌─────────────────┐                                │
│              │ 2% díj fizetése │                                │
│              │ (pl. 1000 Ft)   │                                │
│              └────────┬────────┘                                │
│                       │                                         │
│                       ▼                                         │
│              ┌─────────────────┐                                │
│              │ MyPos terminál  │                                │
│              │ + token mentés  │                                │
│              └────────┬────────┘                                │
│                       │                                         │
│    ═══════════════════╪═════════════════════════════           │
│                       │                                         │
│              VISSZAHOZÁSKOR                                     │
│                       │                                         │
│                       ▼                                         │
│              ┌─────────────────┐                                │
│              │ Kár van?        │                                │
│              └────────┬────────┘                                │
│                  NEM  │  IGEN                                   │
│                   │   │   │                                     │
│                   ▼   │   ▼                                     │
│  ┌─────────────────┐  │  ┌─────────────────┐                   │
│  │MyPos visszatérít│  │  │Kaució benntart. │                   │
│  │Kaució - 2%      │  │  │+ Jegyzőkönyv    │                   │
│  │(ugyanaz kártya) │  │  └─────────────────┘                   │
│  └─────────────────┘  │                                         │
│                       │                                         │
└───────────────────────┴─────────────────────────────────────────┘
```

### 10-device-auth-folyamat.excalidraw

```
┌─────────────────────────────────────────────────────────────────┐
│              GÉP-ALAPÚ BEJELENTKEZÉS (KIOSK MÓD)                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  BOLTI GÉPEK (3 db)              HÁTTÉRGÉP                      │
│  ┌─────────────────┐            ┌─────────────────┐             │
│  │ Kiosk Mód       │            │ Backoffice Mód  │             │
│  │ Alapértelmezett │            │ Teljes jogosult.│             │
│  │ OPERATOR szint  │            │ Egyéni belépés  │             │
│  └────────┬────────┘            └────────┬────────┘             │
│           │                              │                      │
│           ▼                              ▼                      │
│  ┌─────────────────┐            ┌─────────────────┐             │
│  │ Közös PIN kód   │            │ Felhasználónév  │             │
│  │ (bekapcsolás)   │            │ + Jelszó        │             │
│  └────────┬────────┘            └─────────────────┘             │
│           │                                                     │
│           ▼                                                     │
│  ┌─────────────────┐                                            │
│  │ Művelet igényel │                                            │
│  │ magasabb jogot? │                                            │
│  └────────┬────────┘                                            │
│      NEM  │  IGEN                                               │
│       │   │   │                                                 │
│       ▼   │   ▼                                                 │
│  ┌────────┐   ┌─────────────────┐                               │
│  │Művelet │   │ Személyes kód   │                               │
│  │végrehaj│   │ beírása         │                               │
│  └────────┘   │ (átmeneti emel.)│                               │
│               └─────────────────┘                               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Összefoglaló: Frissítési Checklist

### Meglévő Diagramok Módosítása

| Diagram | Excalidraw | Markdown | Prioritás |
|---------|------------|----------|-----------|
| 01-ugyfelfelvitel-folyamat | 🔴 5 változás | 🔴 6 TODO | Sprint 1 |
| 01-ugyfelfelvitel-dontesi-fa | 🟠 3 változás | 🟠 5 TODO | Sprint 1 |
| 01-ugyfelfelvitel-erd | 🟠 7 mező | 🟠 6 TODO | Sprint 1 |
| 02-ertekesites-erd | 🟢 1 megjegy. | 🟢 3 TODO | Sprint 3 |
| 03-bergep-folyamat | 🟠 3 szekció | 🟠 4 TODO | Sprint 2 |
| 04-szerviz-folyamat | 🟠 4 blokk | 🟠 5 TODO | Sprint 2 |

### Új Diagramok Készítése

| Diagram | Típus | Prioritás |
|---------|-------|-----------|
| 10-mypos-kaucio-folyamat | Folyamatábra | Sprint 1 |
| 10-device-auth-folyamat | Folyamatábra | Sprint 2 |
| 10-kedvezmeny-erd | ERD | Sprint 2 |

---

## Változásnapló

| Verzió | Dátum | Változás |
|--------|-------|----------|
| 3.0 | 2025-12-08 | Diagram-specifikus frissítési terv (CSV megjegyzések alapján) |
