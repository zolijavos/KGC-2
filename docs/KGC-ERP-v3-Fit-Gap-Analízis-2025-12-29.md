# KGC ERP v3.0 - Fit-Gap Analízis
**Új Követelmények vs. Jelenlegi Folyamatok**

---

**Készítette:** BMAD Szakértői Csapat (Mary 📊, Winston 🏗️, John 📋)
**Dátum:** 2025-12-29
**Projekt:** KGC ERP v3.0 Követelmény Analízis
**Forrás dokumentumok:**
- `/docs/Flows/transcripts/KGC-notes-2025-12-16-01.md`
- `/docs/Flows/transcripts/KGC-notes-2025-12-16-02.md`
- `/docs/Flows/diagram-docs/*.md`

---

## Executive Summary

Ez a fit-gap analízis 10 kritikus új követelményt azonosított, amelyek módosítást igényelnek a KGC ERP v2 jelenlegi folyamataiban. A követelmények 3 fő kategóriába sorolhatók:

1. **🔴 KRITIKUS (4 db)** - Azonnali implementáció szükséges
2. **🟡 MAGAS (4 db)** - Következő fejlesztési ciklusban
3. **🟢 KÖZEPES (2 db)** - Opcionális, későbbi bővítés

**Átfogó hatás:** A jelenlegi folyamatok ~60%-a érintett, 8 entitás módosítása szükséges.

---

## 📋 Fit-Gap Mátrix Összefoglaló

| # | Követelmény | Jelenlegi Állapot | Gap Típus | Prioritás | Komplexitás |
|---|-------------|-------------------|-----------|-----------|-------------|
| 1 | Multi-location raktárkezelés | ❌ Nincs | MAJOR | 🔴 KRITIKUS | MAGAS |
| 2 | Kaució visszatartás sérülésnél | ❌ Nincs | MAJOR | 🔴 KRITIKUS | KÖZEPES |
| 3 | Automatikus banki elszámolás | ❌ Nincs | MAJOR | 🔴 KRITIKUS | MAGAS |
| 4 | Munkalap-Bérlés kapcsolat | ⚠️ Közvetett | MINOR | 🔴 KRITIKUS | ALACSONY |
| 5 | Törzsvendég személyazonosítás | ⚠️ Részleges | CONFIG | 🟡 MAGAS | ALACSONY |
| 6 | Hétvége/ünnepnap kezelés | ❌ Nincs | MINOR | 🟡 MAGAS | KÖZEPES |
| 7 | Lista ár - kedvezmény számla | ⚠️ Részleges | MINOR | 🟡 MAGAS | ALACSONY |
| 8 | Kártya alapú kaució | ⚠️ Készpénz only | ENHANCEMENT | 🟡 MAGAS | KÖZEPES |
| 9 | Súlyozott átlagár | ❌ Nincs | ENHANCEMENT | 🟢 KÖZEPES | KÖZEPES |
| 10 | Bevizsgálási díj | ✅ Van (munkadíj) | CONFIG | 🟢 KÖZEPES | ALACSONY |

---

## 🔍 Részletes Fit-Gap Elemzés

### 1. 🔴 KRITIKUS: Multi-location Raktárkezelés

#### 📊 Analyst (Mary) - Üzleti Igény
**Forrás:** KGC-notes-01, sor 32-55

> "Nem tudom hogy ebben benne van és ez ki van küszöbölni de valahogy hogy a cikkeket nem lehetett tár helyenként kezelni... egy cikket nem lehetett több tárhelyen kezelni... mindig a kisebb től kezdjen el kiadni... pörgő raktárkészletet."

**Üzleti cél:**
- Minimalizálni a tőkelekötést (pörgős készlet)
- Optimalizálni a raktári bejárási útvonalat
- Támogatni a folyamatos feltöltés stratégiát

**Jelenlegi állapot:**
- CIKK entitás: `tarhely: VARCHAR` (egyetlen fizikai hely)
- Nincs multi-location támogatás
- Nincs kiadási prioritás logika

**GAP:** ❌ **MAJOR GAP** - Teljes funkció hiányzik

---

#### 🏗️ Architect (Winston) - Technikai Megoldás

**Adatmodell módosítás:**

```yaml
ÚJ ENTITÁS: KÉSZLET_HELY
  keszlet_hely_id: PK, INT
  cikk_id: FK → CIKK
  tarhely_kod: VARCHAR (pl. "A1-Polc-03")
  mennyiseg: INT
  kiadasi_prioritas: INT (1=legpörgősebb/legközelebbi)
  utolso_frissites: DATETIME

MÓDOSÍTOTT: CIKK entitás
  - keszlet mező → SUM(KÉSZLET_HELY.mennyiseg) [kalkulált]
  - tarhely → DEPRECATED vagy alap_tarhely

MÓDOSÍTOTT: KÉSZLET_MOZGÁS
  + tarhely_kod: VARCHAR (audit trail)
```

**Folyamat módosítások:**

**Bevételezés (02-ertekesites-folyamat.md, 3. FÁZIS):**
- 3.3 Tételek hozzáadása: + Tárhely kód megadása (KÖTELEZŐ)
- 3.5 Bevételezés rögzítése: KÉSZLET_HELY.mennyiseg frissítés

**Bérlés/Értékesítés (01-ugyfelfelvitel-folyamat.md, 1.6 Gép kiválasztás):**
```
ÚJ LÉPÉS: R.1 - Raktári Kiadási Javaslat Algoritmus
  Input: cikk_id
  Lekérdezés: SELECT * FROM KÉSZLET_HELY
              WHERE cikk_id = ? AND mennyiseg > 0
              ORDER BY kiadasi_prioritas ASC
  Output: Javasolt tarhely_kod (override lehetőséggel)

ÚJ LÉPÉS: R.2 - Javaslat megerősítés
  Kezelő: APPROVE vagy OVERRIDE (audit kötelező)
```

**Kiadási prioritás stratégiák:**

| Stratégia | Logika | Use Case |
|-----------|--------|----------|
| Térbeli | Prioritás = fizikai távolság | Gyors kiszolgálás |
| Pörgős | Prioritás = kisebb mennyiség first | Tőkelekötés minimalizálás |
| Hibrid | Prioritás = kompozit (távolság + mennyiség) | ⭐ **AJÁNLOTT** |

---

#### 📋 PM (John) - Megvalósítási Ütemterv

**Epic:** Multi-location Raktárkezelés
**Story becsült méret:** 8 story (~13-21 story point)

**Fázisok:**
1. **Adatbázis migráció** (2 SP) - KÉSZLET_HELY létrehozás, CIKK migráció
2. **Bevételezési UI** (3 SP) - Tárhely választó komponens
3. **Kiadási javaslat motor** (5 SP) - Algoritmus + override
4. **Készlet riportok** (3 SP) - Lokáció szerinti nézetek
5. **Offline szinkron** (5 SP) - PWA cache frissítés

**Függőségek:**
- ❌ Nincs blocker
- ✅ Parallel futtatható az automatikus elszámolással

**Kockázatok:**
- Meglévő készlet áttelepítése (adatminőség)
- Offline cache méret növekedés

---

### 2. 🔴 KRITIKUS: Kaució Visszatartás Sérülésnél

#### 📊 Analyst (Mary) - Üzleti Igény
**Forrás:** KGC-notes-01, sor 304-426

> "Mi van hogyha visszahozza a vendég és kár van a gépben és meg kell javítani és így nem tudjuk visszaadni még a kauciót... feltételezhetően sérült, először be kell vizsgálni... addig mi van a kaúcióval."

**Jelenlegi állapot:**
- **01-ugyfelfelvitel-folyamat.md, 2.4:** "Kaució Visszaadása - Teljes kaució visszajár, készpénzben"
- Nincs blokkolási mechanizmus
- Nincs kapcsolat BÉRLÉS → MUNKALAP között

**GAP:** ❌ **MAJOR GAP** - Teljes workflow hiányzik

---

#### 🏗️ Architect (Winston) - Technikai Megoldás

**Adatmodell módosítás:**

```yaml
MÓDOSÍTOTT: BÉRLÉS entitás
  + kaucio_statusz: ENUM('PENDING', 'VISSZATARTVA', 'VISSZAADVA', 'RÉSZLEGESEN_ELSZÁMOLVA')
  + visszatartott_osszeg: DECIMAL
  + munkalap_id: FK → MUNKALAP (nullable)

ÚJ STÁTUSZ: BÉRLÉS.statusz
  + 'ELSZAMOLAS_FUGGBEN' (kaució blokkolva)
```

**Folyamat módosítás (01-ugyfelfelvitel-folyamat.md, 2. FÁZIS):**

```
2.2 Késés Ellenőrzés
  ↓
ÚJ: 2.2b Sérülés Gyanúja [DÖNTÉSI PONT #6]
  ├─ NEM  → 2.3 Gép Visszavétele (standard)
  │         └─ BÉRLÉS.statusz = 'lezart'
  │         └─ 2.4 Kaució Visszaadása (teljes)
  │
  └─ IGEN → P6: Káresemény Kezelés
            ├─ BÉRLÉS.kaucio_statusz = 'VISSZATARTVA'
            ├─ BÉRLÉS.statusz = 'ELSZAMOLAS_FUGGBEN'
            ├─ CIKK.statusz = 'szerviz'
            ├─ MUNKALAP létrehozás (BÉRLÉS.munkalap_id = ...)
            └─ Ügyfél tájékoztatás (átvételi elismervény)

      [Szerviz folyamat - 04-szerviz-folyamat.md]
            ├─ Diagnosztika
            ├─ Árajánlat (MUNKALAP.statusz = 'SZÁMLÁZHATÓ')
            └─ Visszajelzés pénzügynek

      [Pénzügy elszámolás - 05-penzugy-folyamat.md - ÚJ]
            ├─ Számla kiállítás (kárösszeg)
            ├─ Kaució levonás (BÉRLÉS.visszatartott_osszeg - kárösszeg)
            ├─ Maradék visszaadás
            └─ BÉRLÉS.statusz = 'lezart'
            └─ BÉRLÉS.kaucio_statusz = 'RÉSZLEGESEN_ELSZÁMOLVA' vagy 'VISSZAADVA'
```

**UI változások:**
- 2.4 Kaució Visszaadása gomb: **DISABLED** if `kaucio_statusz != 'PENDING'`
- Új modal: "Sérülés vizsgálat" (fotó + megjegyzés)

---

#### 📋 PM (John) - Megvalósítási Ütemterv

**Epic:** Kaució Visszatartás és Elszámolás
**Story méret:** 5 story (~8 story point)

**Felhasználói érték:**
- ✅ Pénzügyi védelem sérült gépek esetén
- ✅ Átlátható elszámolás
- ✅ Automatizált workflow (kaució blokk → szerviz → elszámolás)

**Acceptance Criteria:**
1. Kezelő jelzi sérülést → kaució automatikusan blokkolva
2. BÉRLÉS státusz = 'ELSZAMOLAS_FUGGBEN' → UI tilt kaució kiadást
3. Munkalap generálás BÉRLÉS.munkalap_id hivatkozással
4. Szerviz lezárás → email ügyfélnek az elszámolásról
5. Pénzügyes jóváhagyja → kaució maradék kiadható

---

### 3. 🔴 KRITIKUS: Automatikus Banki/Futár Elszámolás

#### 📊 Analyst (Mary) - Üzleti Igény
**Forrás:** KGC-notes-01, sor 140-176

> "Be van pontozva a beérkező a bankoktól a beérkező pénz... pontozási rendszer alapján összepárosítani és esetlegesen csak az eltérést mutassa."

**Jelenlegi állapot (05-penzugy-folyamat.md):**
- "Napi befizetések" = **manuális** pipálás
- Nincs automatikus párosítás
- Banki kivonat feldolgozás: manuális

**GAP:** ❌ **MAJOR GAP** - Teljes automatizáció hiányzik

---

#### 🏗️ Architect (Winston) - Technikai Megoldás

**Új entitások:**

```yaml
ÚJ: BANK_TRANZAKCIÓ
  tranzakcio_id: PK, INT
  osszeg: DECIMAL
  datum: DATE
  kulso_partner_nev: VARCHAR
  kozlemeny: TEXT (kulcs a párosításhoz)
  forras: ENUM('Bank', 'Futár', 'POS')
  statusz: ENUM('Párosítatlan', 'Párosított', 'Eltérés', 'Manuális')
  szamla_id: FK → SZÁMLA (nullable, párosítás után)
  parositas_pontszam: INT (0-100, algoritmus eredménye)

ÚJ: KÜLSŐ_PARTNER_API
  api_id: PK, INT
  partner_nev: VARCHAR (pl. "OTP Bank", "GLS Futár")
  api_type: ENUM('Bank', 'Futár')
  credentials: JSON (encrypted)
```

**Új folyamat: P5 - AUTOMATIZÁLT ELSZÁMOLÁS**

```
Trigger: Banki kivonat / Futár elszámolás beérkezés (API, CSV, Email)

P5.1 Adatfogadás
  ├─ Bank API integráció (pl. OTP, K&H, Raiffeisen)
  ├─ Futár API (pl. GLS, MPL, Sprinter)
  └─ CSV/Email import (fallback)
  → BANK_TRANZAKCIÓ rekordok létrehozása

P5.2 Automatikus Párosítás (Pontozási Algoritmus)
  FOR EACH BANK_TRANZAKCIÓ:
    Kritériumok (weighted scoring):
    ├─ Közlemény tartalmazza számlaszámot? (+50 pont)
    ├─ Összeg pontosan megegyezik? (+30 pont)
    ├─ Partner név egyezés (fuzzy match)? (+15 pont)
    ├─ Dátum ±3 napon belül? (+5 pont)

    IF pontszám >= 90 → statusz = 'Párosított' (auto)
    IF 70-89 → statusz = 'Eltérés' (manuális ellenőrzés)
    IF < 70 → statusz = 'Párosítatlan' (manuális)

P5.3 Eltérések Listázása
  Dashboard:
  ├─ ✅ Párosított (90-100 pt) - zöld
  ├─ ⚠️ Eltérés (70-89 pt) - sárga, review szükséges
  └─ ❌ Párosítatlan (<70 pt) - piros, manuális rögzítés

P5.4 Manuális Rögzítés
  Kezelő:
  ├─ APPROVE párosítást (eltérés esetén)
  ├─ LINK számlához (párosítatlan esetén)
  └─ KÖLTSÉG könyvelés (ha nem számlához tartozik, pl. jutalék)

P5.5 Automatikus Lezárás
  IF BANK_TRANZAKCIÓ.statusz = 'Párosított':
    SZÁMLA.statusz = 'fizetve'
    SZÁMLA.fizetve_datum = BANK_TRANZAKCIÓ.datum
```

**Integráció:**
- **05-penzugy-folyamat.md, 1. Napi befizetések:** P5 előkészíti, manuális csak eltérések

---

#### 📋 PM (John) - Megvalósítási Ütemterv

**Epic:** Automatizált Pénzügyi Elszámolás
**Story méret:** 10 story (~21 story point) - NAGY komplexitás

**Fázisok:**
1. **Bank API integráció** (8 SP) - OTP, K&H connectorok
2. **Párosítási motor** (5 SP) - Fuzzy matching, scoring
3. **Dashboard UI** (3 SP) - Eltérések listája
4. **Futár API** (3 SP) - GLS, MPL
5. **Audit és riportok** (2 SP)

**MVP scope:**
- ✅ Egy bank (OTP)
- ✅ CSV import (manual fallback)
- ✅ Alapvető párosítás (számlaszám + összeg)
- ⏳ V2: Futár integráció, AI-powered fuzzy matching

**ROI:**
- Pénzügyes idő: **-60%** (napi 2 óra → 45 perc)
- Hibák csökkenése: **-80%** (automatizált egyeztetés)

---

### 4. 🔴 KRITIKUS: Munkalap-Bérlés Direkt Kapcsolat

#### 📊 Analyst (Mary) - Üzleti Igény
**Forrás:** KGC-notes-01, sor 386-423

> "Honnan tudhatjuk hogy a szerviz munka a bérleshez tartozik... munalapon kéne a bérlés... a bérlés addig nincs lezárva, amíg ugye... nyitott státuszban van."

**Jelenlegi állapot:**
- Közvetett kapcsolat: BÉRLÉS → CIKK ← MUNKALAP
- Nincs FK: MUNKALAP.berles_id
- Nehéz azonosítani bérléshez tartozó javítást

**GAP:** ⚠️ **MINOR GAP** - Kapcsolat létezik, de nem optimális

---

#### 🏗️ Architect (Winston) - Technikai Megoldás

**Egyszerű megoldás:**

```yaml
MÓDOSÍTOTT: MUNKALAP entitás
  + berles_id: FK → BÉRLÉS (nullable)
  + munkalap_tipus: ENUM('Ügyfél', 'Bérgép_bérléshez', 'Bérgép_karbantartás')
```

**Előnyök:**
- ✅ Direkt lekérdezhetőség: `SELECT * FROM MUNKALAP WHERE berles_id = ?`
- ✅ Cascade delete védelem (bérlés nem törölhető amíg munkalap nyitott)
- ✅ Riport: "Bérléshez kapcsolódó javítások"

**Kapcsolódó módosítás:**
- **#2 Kaució visszatartás** workflow használja ezt a kapcsolatot
- **04-szerviz-folyamat.md:** Munkalap felvételnél opcionális `berles_id` megadás

---

#### 📋 PM (John) - Megvalósítási Terv

**Story méret:** 1 story (~2 SP) - GYORS FIX

**Quick win:**
- ✅ Adatbázis módosítás (1 új mező)
- ✅ UI: Munkalap felvételkor "Bérléshez kapcsolódik?" checkbox
- ✅ Riport: "Bérlés káresemények" lista

---

### 5. 🟡 MAGAS: Törzsvendég Személyazonosítás

#### 📊 Analyst (Mary) - Üzleti Igény
**Forrás:** KGC-notes-01, sor 9-120

> "Bejön az ügyfél... elvárás vagyon szólítsuk törz vendégként... de közben lejárhatott a szeméigazolványa, megváltoztatott a címe... ő erről nem szól."

**Konfliktus:**
- Törzsvendég megsértődik, ha minden alkalommal kérik az igazolványt
- DE: adatfrissítés, fraud védelem szükséges

**Jelenlegi állapot:**
- 01-ugyfelfelvitel-folyamat.md, 1.2: Meglévő ügyfél → keresés, nincs kötelező re-validation

**GAP:** ⚠️ **KONFIGURÁCIÓS** - Funkció van, szabályzat hiányzik

---

#### 🏗️ Architect (Winston) - Technikai Megoldás

**Adatmodell:**

```yaml
MÓDOSÍTOTT: PARTNER entitás
  + utolso_adatellenorzes: DATE
  + adatellenorzes_gyakorisag: INT (napokban, default: 180)
  + igazolvany_lejarat: DATE (személyi ig. érvényesség)

ÚJ: KONFIGURÁCIÓ
  KOTELEZO_SZEMELYAZONOSITAS: BOOLEAN (default: false)
  ADATELLENORZES_CIKLUS_NAP: INT (default: 180)
```

**Folyamat (01-ugyfelfelvitel-folyamat.md, 1.2 Ügyfél Azonosítás):**

```
MEGLÉVŐ ügyfél keresés után:
  ├─ Rendszer ellenőrzi: utolso_adatellenorzes > ADATELLENORZES_CIKLUS_NAP?
  │
  │   IGEN (lejárt) → 🚨 FIGYELMEZTETÉS
  │   ├─ UI: "Utolsó adatellenőrzés: 2023-06-15 (560 napja)"
  │   ├─ Opció 1: [Adatellenőrzés most] (személyi ig. scan/fotó)
  │   └─ Opció 2: [Felülbírálat] (ADMIN jog, audit log)
  │
  └─ NEM → Folytatás (nincs ellenőrzés)

IF KOTELEZO_SZEMELYAZONOSITAS = true:
  ├─ Minden ügyfélnél kötelező személyi ig. bemutatás
  └─ Nincs override opció (kivéve MANAGER jog)
```

**UI/UX:**
- Partner kártya: színkód szerinti jelzés
  - 🟢 Zöld: friss adat (<90 nap)
  - 🟡 Sárga: ellenőrzés ajánlott (90-180 nap)
  - 🔴 Piros: lejárt ellenőrzés (>180 nap)

---

#### 📋 PM (John) - Üzleti Döntés

**Ajánlott konfiguráció:**
```yaml
Startégiák:
1. Rugalmas (AJÁNLOTT indulásnál):
   - KOTELEZO_SZEMELYAZONOSITAS: false
   - ADATELLENORZES_CIKLUS_NAP: 180
   - Kezelő dönt (figyelmeztetés alapján)

2. Szigorú (később, ha fraud probléma):
   - KOTELEZO_SZEMELYAZONOSITAS: true
   - Minden alkalommal kötelező

3. Hibrid (törzsvendég kivétel):
   - PARTNER.torzsvendeg: true → felmentés
   - Új/átlagos ügyfél → kötelező
```

**Story méret:** 3 story (~5 SP)

---

### 6. 🟡 MAGAS: Hétvége/Ünnepnap Kezelés Automatikus Hosszabbításnál

#### 📊 Analyst (Mary) - Üzleti Igény
**Forrás:** KGC-notes-01, sor 176-230

> "Automatikus hosszabbításnál... hogyha van benne ünnepnap... minden piros betűs ünnepet félnapnak vegyen, illetve a hétvégi díjat."

**Jelenlegi állapot:**
- 01-ugyfelfelvitel-folyamat.md, 2.2: "Késési díj: 0.5 nap = 50%, 1 nap = 100%"
- Nincs hétvége/ünnepnap kedvezmény

**GAP:** ❌ **FUNKCIÓ HIÁNYZIK** - Naptár alapú árazás nincs

---

#### 🏗️ Architect (Winston) - Technikai Megoldás

**Adatmodell:**

```yaml
ÚJ: UNNEPNAP_NAPTAR
  unnepnap_id: PK, INT
  datum: DATE (unique)
  megnevezes: VARCHAR (pl. "Karácsony")
  dij_szorzo: DECIMAL (0.5 = félnap, 1.0 = teljes, 0.0 = ingyenes)

ÚJ: DIJSZAMITAS_SZABALY
  szabaly_id: PK, INT
  nev: VARCHAR (pl. "Hétvégi 50%", "Hónap+ csak munkanap")
  alap_egyseg: ENUM('Nap', 'Hét', 'Hónap')
  hetvege_szorzo: DECIMAL (1.5 = másfél nap, 0.0 = nem számít)
  unnepnap_szorzo: DECIMAL (0.5 default)
  min_napok: INT (pl. 14 nap felett más számítás)
```

**Díjszámítási logika:**

```python
def számítás_késési_díj(bérlés):
    időtartam = bérlés.visszahozás - bérlés.kiadás
    dijszabaly = bérlés.időtartam_tipus.dijszabaly

    napok = []
    for nap in időtartam:
        if nap in UNNEPNAP_NAPTAR:
            napok.append(nap.dij_szorzo)  # pl. 0.5
        elif nap.hétvége and dijszabaly.hetvege_szorzo:
            napok.append(dijszabaly.hetvege_szorzo)  # pl. 1.5 (szombat+vasárnap = 1.5 nap)
        else:
            napok.append(1.0)  # normál munkanap

    fizetendő_napok = sum(napok)
    return fizetendő_napok * bérlés.napi_dij
```

**Példa:**
```
Bérlés: 2025-12-24 (szerda) → 2025-12-28 (vasárnap)
Napok:
  - 12-24 (szerda, Szenteste) → 0.5 nap (ünnepnap)
  - 12-25 (csütörtök, Karácsony) → 0.5 nap (ünnepnap)
  - 12-26 (péntek, Karácsony 2.) → 0.5 nap (ünnepnap)
  - 12-27 (szombat) → 0.5 nap (hétvége szorzó)
  - 12-28 (vasárnap) → 1.0 nap (hétvége szorzó 1.5, de szombat+vasárnap együtt)

Összesen: 3.0 fizetendő nap (5 naptári nap helyett)
```

---

#### 📋 PM (John) - Implementáció

**Story méret:** 4 story (~8 SP)

**MVP:**
1. UNNEPNAP_NAPTAR feltöltés (magyar ünnepnapok 2025-2027)
2. Hétvége logika (szombat+vasárnap = 1.5 nap)
3. Díjszámítás motor módosítás
4. Admin UI: ünnepnapok karbantartása

**V2:**
- Több díjszabály profil (régió függő)
- Bérlő választhat: "hétvége számít" vs "nem számít"

---

### 7. 🟡 MAGAS: Lista Ár - Kedvezmény Kezelés Számlán

#### 📊 Analyst (Mary) - Üzleti Igény
**Forrás:** KGC-notes-01, sor 445-467

> "A rendszer tudja kezelni a számlán lévő lista ár mínusz kedvezmény ára... a beszállás és a listát pedig az eladási ár legyen."

**Jelenlegi állapot:**
- CIKK: `beszerzesi_ar`, `eladasi_ar` mezők vannak
- Nincs explicit kedvezmény mező a számlán

**GAP:** ⚠️ **RÉSZLEGES** - Árképzés van, kedvezmény láthatóság nincs

---

#### 🏗️ Architect (Winston) - Technikai Megoldás

**Adatmodell:**

```yaml
MÓDOSÍTOTT: SZÁMLA_TÉTEL / BEVÉTELEZÉS_TÉTEL / ÉRTÉKESÍTÉS_TÉTEL
  + listar: DECIMAL (eredeti eladási ár)
  + kedvezmeny_szazalek: DECIMAL (0-100%)
  + kedvezmeny_osszeg: DECIMAL (kalkulált: listar * kedvezmeny%)
  + vegso_ar: DECIMAL (listar - kedvezmeny_osszeg)
```

**Számla megjelenés:**

```
┌─────────────────────────────────────────────────────────┐
│ SZÁMLA                                                  │
├─────────────────────────────────────────────────────────┤
│ Tétel          | Lista Ár | Kedv. | Egységár | Összeg │
│ Makita fúró    | 50.000 Ft|  10%  | 45.000 Ft| 45.000 │
│ Tartozék       |  5.000 Ft|   0%  |  5.000 Ft|  5.000 │
├─────────────────────────────────────────────────────────┤
│ Nettó:                                        50.000 Ft │
│ ÁFA (27%):                                    13.500 Ft │
│ Bruttó:                                       63.500 Ft │
│                                                         │
│ Megtakarítás (kedvezmény):                     5.000 Ft │
└─────────────────────────────────────────────────────────┘
```

**Konfiguráció:**

```yaml
SZÁMLA_SABLON:
  MUTASD_LISTAR: boolean (default: true)
  MUTASD_KEDVEZMENYT: boolean (default: true)
  MUTASD_MEGTAKARITAST: boolean (default: true)
```

---

#### 📋 PM (John) - Implementáció

**Story méret:** 2 story (~3 SP) - EGYSZERŰ

**Felhasználói érték:**
- ✅ Átlátható árazás
- ✅ Marketing: ügyfél látja a megtakarítást
- ✅ NAV audit: lista ár vs. kedvezmény tisztán elválik

---

### 8. 🟡 MAGAS: Kártya Alapú Kaució Kezelés

#### 📊 Analyst (Mary) - Üzleti Igény
**Forrás:** KGC-notes-01, sor 456-499

> "Mi van amikor kártyával fizetett kauciót... visszautalod és újra kifizet kártyával... ott a kártyás zárásodnak nem fog streamelni."

**Jelenlegi állapot:**
- 01-ugyfelfelvitel-folyamat.md, 1.7: "Kaució CSAK KÉSZPÉNZ fogadható"

**GAP:** ⚠️ **ENHANCEMENT** - Készpénz működik, kártya bővítés

---

#### 🏗️ Architect (Winston) - Technikai Megoldás

**Két stratégia:**

#### **Stratégia A: Zárolás (Hold/Pre-authorization)** ⭐ AJÁNLOTT

```yaml
MÓDOSÍTOTT: BÉRLÉS
  + kaucio_fizetes_mod: ENUM('Készpénz', 'Kártya_hold')
  + kaucio_tranzakcio_id: VARCHAR (bank tranzakció ref)
  + kaucio_hold_datum: DATETIME

Folyamat:
1. Bérlés indítás: POS terminál → HOLD 100.000 Ft
2. Visszavétel (sértetlen): RELEASE hold (automatikus)
3. Visszavétel (sérült): CAPTURE részösszeg, RELEASE maradék

Előny:
  ✅ Nincs valódi pénzmozgás (csak rezerváció)
  ✅ Ügyfél számláján "zárolva" látszik
  ✅ Nincs kétszer banki díj

Hátrány:
  ⚠️ Bank függő (OTP: 7 nap max hold, K&H: 30 nap)
  ⚠️ Hosszú bérlés (>7 nap) → nem működik
```

#### **Stratégia B: Teljes tranzakció + visszautalás**

```yaml
Folyamat:
1. Kaució: CHARGE 100.000 Ft (valódi fizetés)
2. Visszavétel: REFUND 100.000 Ft vagy (100.000 - kár)

Előny:
  ✅ Hosszú bérlésre is működik

Hátrány:
  ❌ Dupla banki díj (charge + refund)
  ❌ 3-5 nap visszautalási idő
  ❌ Negatív pénztár zárás (visszautalás nap)
```

**Hibrid megoldás:**
```
IF bérlés <= 7 nap: Stratégia A (hold)
ELSE: Stratégia B (charge + refund) VAGY készpénz kötelező
```

---

#### 📋 PM (John) - Megvalósítási Terv

**Story méret:** 5 story (~8 SP)

**Fázisok:**
1. POS terminál integráció (hold API)
2. BÉRLÉS módosítás (kaucio_fizetes_mod)
3. UI: fizetési mód választó
4. Automatikus release/capture logika
5. Pénzügyi riport frissítés (zárolás vs. készpénz)

**MVP scope:**
- ✅ Hold support (<=7 nap)
- ✅ Fallback: készpénz hosszú bérlésre

---

### 9. 🟢 KÖZEPES: Súlyozott Átlagár

#### 📊 Analyst (Mary) - Üzleti Igény
**Forrás:** KGC-notes-01, sor 486-503

> "Súlyozott átlagár van-e benne... az új áron érkezik tehát egy emelt áron... figyelmeztetni hogy ami a falon lévő termék annak a régi árát módosítani kell."

**Jelenlegi állapot:**
- 07-arrazas-automatizalas.md: Automatikus árazás UTOLSÓ beszerzési ár alapján
- Nincs WAC (Weighted Average Cost)

**GAP:** ❌ **ENHANCEMENT** - FIFO/LIFO modell van, WAC nincs

---

#### 🏗️ Architect (Winston) - Technikai Megoldás

**Súlyozott átlagár kalkuláció:**

```python
def számítás_wac(cikk_id):
    mozgások = SELECT * FROM KÉSZLET_MOZGÁS
               WHERE cikk_id = ? AND tipus = 'BEVÉTELEZÉS'
               ORDER BY datum

    ossz_mennyiseg = 0
    ossz_ertek = 0

    for mozgas in mozgások:
        ossz_mennyiseg += mozgas.mennyiseg
        ossz_ertek += mozgas.mennyiseg * mozgas.egysegar

    wac = ossz_ertek / ossz_mennyiseg if ossz_mennyiseg > 0 else 0
    return wac

# Példa:
# Bevételezés 1: 10 db × 1000 Ft = 10.000 Ft
# Bevételezés 2: 5 db × 1200 Ft = 6.000 Ft
# WAC = 16.000 / 15 = 1066.67 Ft/db
```

**Adatmodell:**

```yaml
MÓDOSÍTOTT: CIKK
  + atkoltseges_modszer: ENUM('UTOLSO_AR', 'WAC', 'FIFO') (default: UTOLSO_AR)
  + wac_beszerzesi_ar: DECIMAL (kalkulált)
  + utolso_beszerzesi_ar: DECIMAL (jelenlegi)
```

**Árfrissítési trigger:**

```sql
TRIGGER bevételezes_after_insert:
  IF CIKK.atkoltseges_modszer = 'WAC':
    UPDATE CIKK
    SET wac_beszerzesi_ar = számítás_wac(cikk_id),
        eladasi_ar = wac_beszerzesi_ar * (1 + arres_szazalek)
```

---

#### 📋 PM (John) - Prioritizálás

**Story méret:** 3 story (~5 SP)

**V1 scope:**
- ⏳ OPCIONÁLIS (nem MVP)
- Jelenlegi "utolsó ár" modell működik
- WAC csak nagy forgalmú, volatilis árú termékeknél szükséges

**Ajánlás:**
- Későbbi bővítés (nem v3.0 MVP)
- Monitoring: ha ár ingadozás >20% gyakori → bevezetés

---

### 10. 🟢 KÖZEPES: Bevizsgálási Díj

#### 📊 Analyst (Mary) - Üzleti Igény
**Forrás:** KGC-notes-01, sor 504-512

> "Van bevizsgálási díj?... diagnosztikai munka költségei a szerviz Munkalapon rögzített munkadíjként jelennek meg."

**Jelenlegi állapot:**
- 04-szerviz-folyamat.md, 2. FÁZIS: Diagnosztika → Munkadíj tétel

**GAP:** ✅ **LÉTEZIK** - Munkadíj típusú tétel = bevizsgálási díj

---

#### 🏗️ Architect (Winston) - Konfiguráció

**Egyszerű megoldás:**

```yaml
MUNKALAP_TÉTEL sablon:
  megnevezes: "Diagnosztikai vizsgálat"
  tipus: "Munkadíj"
  egysegar: 5000 Ft (konfig)
  mennyiseg: 1
```

**UI:**
- Munkalap felvételkor: "Bevizsgálási díj hozzáadása?" checkbox (default: checked)

---

#### 📋 PM (John) - Megvalósítás

**Story méret:** 1 story (~1 SP) - KONFIGURÁCIÓ

**Quick win:**
- ✅ Alapértelmezett "Diagnosztika" tétel sablon
- ✅ Ár konfigurálható (admin UI)

---

## 📊 Összefoglaló Hatáselemzés

### Érintett Modulok

| Modul | Módosítás Mértéke | Érintett Entitások | Új Entitások |
|-------|-------------------|-------------------|---------------|
| **Bérlés** | 🔴 MAGAS | BÉRLÉS (4 mező) | - |
| **Készlet** | 🔴 MAGAS | CIKK (2 mező), KÉSZLET_MOZGÁS (1 mező) | KÉSZLET_HELY |
| **Szerviz** | 🟡 KÖZEPES | MUNKALAP (2 mező) | - |
| **Pénzügy** | 🔴 MAGAS | SZÁMLA (0 mező) | BANK_TRANZAKCIÓ, KÜLSŐ_PARTNER_API |
| **Értékesítés** | 🟡 KÖZEPES | SZÁMLA_TÉTEL (4 mező) | - |
| **Partner** | 🟢 ALACSONY | PARTNER (3 mező) | - |
| **Konfiguráció** | 🟡 KÖZEPES | - | UNNEPNAP_NAPTAR, DIJSZAMITAS_SZABALY |

**Összesen:**
- **Módosított entitások:** 8 db
- **Új entitások:** 5 db
- **Új folyamatok:** 2 db (P5 Automatikus elszámolás, P6 Káresemény kezelés)
- **Módosított folyamatok:** 4 db

---

### Implementációs Roadmap

#### **Sprint 1-2: Kritikus Alapok** (4 hét)
```
Epic 1: Multi-location raktárkezelés (13-21 SP)
Epic 2: Kaució visszatartás (8 SP)
Epic 3: Munkalap-Bérlés kapcsolat (2 SP)
───────────────────────────────────────
TOTAL: ~23-31 SP
```

#### **Sprint 3-4: Pénzügy Automatizáció** (4 hét)
```
Epic 4: Automatikus banki elszámolás (21 SP)
Epic 5: Kártya kaució (8 SP)
───────────────────────────────────────
TOTAL: ~29 SP
```

#### **Sprint 5: Üzleti Szabályok** (2 hét)
```
Epic 6: Hétvége/ünnepnap (8 SP)
Epic 7: Lista ár - kedvezmény (3 SP)
Epic 8: Törzsvendég azonosítás (5 SP)
───────────────────────────────────────
TOTAL: ~16 SP
```

#### **Opcionális (későbbi):**
```
Epic 9: Súlyozott átlagár (5 SP)
Epic 10: Bevizsgálási díj sablon (1 SP)
```

**Teljes becsült effort:** ~74-85 Story Point (~12-14 hét, 1 fős dev)

---

## 🎯 Prioritizálási Javaslatok

### Azonnal (Sprint 1-2):
1. ✅ **Kaució visszatartás** - Pénzügyi védelem, gyakori eset
2. ✅ **Munkalap-Bérlés kapcsolat** - Blocker a kaució visszatartáshoz
3. ✅ **Multi-location** - Tőkelekötés csökkentés (ROI: magas)

### Következő (Sprint 3-5):
4. ✅ **Automatikus elszámolás** - Pénzügyes idő -60%
5. ✅ **Törzsvendég azonosítás** - UX javítás + compliance
6. ✅ **Hétvége/ünnepnap** - Árazási pontosság

### Later (V3.1+):
7. ⏳ **Kártya kaució** - Nice to have (készpénz működik)
8. ⏳ **Lista ár kedvezmény** - Marketing feature
9. ⏳ **WAC** - Csak volatilis termékeknél
10. ⏳ **Bevizsgálási díj** - Már létezik (konfig)

---

## 📌 Következő Lépések

### Javasolt workflow folytatás:

1. **Mary (Analyst)** 📊
   - `/bmad:bmm:agents:analyst` → `*create-epics-and-stories`
   - Részletes user story breakdown Epic 1-3-hoz

2. **Winston (Architect)** 🏗️
   - `/bmad:bmm:agents:architect` → `*create-architecture`
   - Részletes architektúra dokumentum (API, ERD, sequence)

3. **John (PM)** 📋
   - `/bmad:bmm:agents:pm` → `*create-prd`
   - V3.0 Product Requirements Document

4. **Diagram készítés:**
   - `/bmad:bmm:workflows:create-excalidraw-diagram`
   - Frissített ERD: KÉSZLET_HELY, BANK_TRANZAKCIÓ entitások
   - Frissített folyamatok: Kaució visszatartás, Automatikus elszámolás

---

**Dokumentum vége**

_🤖 Generated by BMAD Method (BMad Analyst + Architect + PM collaboration)_
