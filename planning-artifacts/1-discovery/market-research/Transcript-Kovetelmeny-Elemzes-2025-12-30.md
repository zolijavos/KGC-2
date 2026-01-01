# KGC ERP - Transcript Követelmény Elemzés

**Dátum**: 2025-12-30
**Verzió**: 1.0
**Forrás**: KGC-notes-2025-12-29-01.md + KGC-notes-2025-12-16-01.md
**Elemző**: Explore Agent + Claude Sonnet 4.5

---

## Executive Summary

Két transcript fájl teljes elemzése alapján azonosítottuk az összes új és módosult követelményt. A 2025-12-16-os verzióhoz képest jelentős új modulok és funkciók kerültek be:

**Új modulok:**
- AI Chatbot (Koko rendszer)
- Beszerzési/Bevételezési modul
- 3D vizualizáció és termékazonosítás

**Kritikus kiegészítések:**
- Helykövetés (polchely + dobozhely + raklap)
- Email-alapú számlafigyelés
- Szállítói API integráció
- Vonalkódmátrix rendszer

---

## 1. LEGÚJABB KÖVETELMÉNYEK (2025-12-29)

### 1.1 ÚJ ÜZLETI FOLYAMATOK

#### 1. AI-támogatott Chatbot és Support Rendszer (Koko)
**Leírás:** Önállóan tanuló AI asszisztens többcsatornás támogatással

**Főbb lépések:**
- Felhasználói interakciók automatikus rögzítése
- Jóváhagyás-alapú tanulás (admin approval)
- Discord, email, web csatornák integráció
- Tudásbázis szinkronizáció
- Előszűrés és szaktanácsadás

**Érintett rendszerek:** Support (Chatwoot), Custom Chat, Email, Discord

**Diagram típus:** Architecture + Data Flow

---

#### 2. Beszerzési/Bevételezési Folyamat
**Leírás:** Szállítói integrációval automatizált beszerzési rendszer

**Főbb lépések:**
- Szállítói árlisták automatikus lekérése (API/scraping)
- Megrendelés leadása
- Szállítólevél vs számla szétválasztása
- Automatikus bevételezés
- Hiány-raktár (in-between) kezelés
- Helyesítő számlák (credit notes)

**Érintett rendszerek:** KGC ERP, Szállítói API-k (Makita, Bosch, Hikoki), Email, Inventory

**Diagram típus:** Business Process + Data Flow + System Architecture

---

#### 3. Invoice/Számla Management Rendszer
**Leírás:** Elektronikus és papíralapú számlafeldolgozás

**Főbb lépések:**
- Email-szál figyelés (threading)
- OCR feldolgozás (papír számlák)
- Szállítólevél vs számla szétválasztása
- Előlegszámla kezelés
- Nyitott tételek követése
- Teljesítési vs könyvelési dátum

**Érintett rendszerek:** Email, OCR szolgáltatás, Finance Module, Számlázz.hu

**Diagram típus:** Data Flow + Integration Architecture

---

#### 4. 3D Vizualizáció és Termékazonosítás
**Leírás:** AI-alapú gép/termék azonosítás és állapotfelmérés

**Főbb lépések:**
- 360 fokos fotózás (minden gépről)
- AI-alapú képfelismerés
- Sérülések automatikus észlelése
- Videó dokumentálás
- Összehasonlítás rendszerképpel

**Érintett rendszerek:** KGC ERP, AI/ML szolgáltatás, Kamera/fotó rendszer

**Diagram típus:** User Journey + Technical Architecture

---

### 1.2 ÚJ FUNKCIÓK/FEATURES

#### A. Számla Menedzsment
- **Szállítólevél vs Számla**: Külön kezelés, email threading
- **Előlegszámla**: Dedikált flow
- **Helyesítő számlák**: Credit note feldolgozás
- **Több-számlás rendelések**: Egy megrendelés több számla
- **Email irányítás**: Szálak szerinti automatizált routing

#### B. Készlet Kezelés
- **Helyenkénti nyilvántartás**: Polchely (K1, P5) + Dobozhely (D-17) + Raklap
- **Vonalkód hierarchia**: Termék/Doboz/Hely szeparálása
- **Automatikus újraárazás**: Fali kihelyezett termékek
- **Helykód rendszer**: 3 szintű hierarchia (Rack-Shelf-Box)

#### C. Beszerzés Optimalizálás
- **Súlyozott átlagár**: Kalkuláció multiple beszerzésből
- **Listáár vs Beszerzési ár**: Automatikus margin számítás
- **Szállítói ár-szinkronizáció**: API-alapú real-time update
- **Pályázati árak**: Fix árak 3 évre rögzítése

#### D. Szerviz Munkafolyamatok
- **Bevizsgálási díj**: Automatikus levonás végleges számlából
- **Szétszerelt/összeszerelt**: Visszaadás opció
- **Vonalkódmátrix**: Munkalaphoz nyomtatás
- **Helykód-alapú követés**: Gép lokációja raktárban
- **Garanciális prioritás**: 2 hetes törvényi határidő jelzése

#### E. HR/Munkafolyamat Kezelés
- **Jóváhagyási worklist**: Pending approval items
- **Félbehagyott munkafolyamatok**: Unfinished items with "Ne piszkáld" lock
- **Kódos azonosítás**: 2-3 számjegyű alkalmazotti kód minden művelethez
- **Audit trail**: Teljes nyomkövetés
- **Local/szerver szinkron**: Offline capable with sync

---

### 1.3 MÓDOSÍTOTT/KIEGÉSZÍTETT FOLYAMATOK

| Folyamat | Volt (2025-12-16) | Lett (2025-12-29) | Változás Jellege |
|----------|-------------------|-------------------|------------------|
| **Bevételezés** | Manuális csippantás | Rendelés-alapú félautomata | +Automatizálás |
| **Számlázás** | Papír + manuális | Email-automata + OCR | +Digitalizálás |
| **Árazás** | Fix % (20/50/100%) | Piaci/pályázati/egyedi | +Rugalmasság |
| **Raktározás** | Csak polchely | Polc+doboz+raklap | +Granularitás |
| **Gépátvétel** | Vizuális ellenőrzés | 360° fotó + AI videó | +Dokumentáció |
| **Szervíz munkalap** | Önálló entitás | Bérlésszámhoz kötve | +Integráció |

---

### 1.4 ÚJ ADATOK/ENTITÁSOK

#### A. Szállítói API/Adatbázis
**Entitás:** `SzallítoiAPI`
- `szállító_id` (FK)
- `api_endpoint`
- `auth_token`
- `robbantott_tabla_url` (parts diagram)
- `gyári_szám` (model number)
- `alkatrész_lista` (JSON)
- `listáár`
- `beszerzési_ár`
- `készlet_info`

#### B. Helykövetés Entitások
**Entitás:** `Helykód`
- `hely_id` (PK)
- `hely_tipus` (ENUM: polc, doboz, raklap)
- `hely_kód` (string, pl. "K1-P5-D17")
- `szint_1` (rack/aisle)
- `szint_2` (shelf)
- `szint_3` (box)
- `max_kapacitás`
- `jelenlegi_kapacitás`

#### C. Dokumentáció Entitások
**Entitás:** `VonalkódMátrix`
- `mátrix_id` (PK)
- `gép_id` (FK)
- `bérlés_id` (FK - opcionális)
- `munkalap_id` (FK - opcionális)
- `barcode_data` (QR matrix)
- `helykód` (FK)
- `nyomtatva_dátum`

**Entitás:** `RobbantottTábla`
- `tábla_id` (PK)
- `gép_típus_id` (FK)
- `gyári_szám`
- `alkatrész_lista` (JSON array)
- `diagram_kép_url`
- `forrás` (szállítói API)

#### D. Pénzügyi Entitások
**Entitás:** `HelyesítőSzámla`
- `helyesítő_id` (PK)
- `eredeti_számla_id` (FK)
- `credit_note_szám`
- `helyesítés_oka`
- `helyesített_összeg`
- `helyesítés_dátum`
- `teljesítés_dátum`

**Entitás:** `EmailSzál`
- `szál_id` (PK)
- `subject`
- `thread_id` (email provider)
- `kapcsolódó_számla_id` (FK)
- `kapcsolódó_megrendelés_id` (FK)
- `üzenetek` (JSON array)

#### E. Időbeli Entitások
**Attribútumok hozzáadása meglévőkhöz:**
- `teljesítési_dátum` → `Számla`, `Szállítólevél`
- `könyvelési_dátum` → `Számla`
- `garanciális_határidő` (2 hét) → `Munkalap`
- `szállítási_becsült_idő` → `Megrendelés`
- `pályázat_ár_érvényesség` (3 év) → `Termék`

---

## 2. KORÁBBI KÖVETELMÉNYEK (2025-12-16)

### 2.1 BÉRLÉSI FOLYAMATOK

#### A. Ügyfél-azonosítás és Regisztráció
**Főbb lépések:**
1. Törzsügyfél vs új ügyfél ellenőrzés
2. Személyigazolvány/cégadatok rögzítése
3. Adatok félévenkénti egyeztetése
4. Pontozási rendszer update (fehér/fekete lista)

**Entitások:**
- `Partner` (cég/magánszemély)
- `PartnerPontozás` (trust score)

---

#### B. Kaució Kezelés
**Főbb lépések:**
1. Kaució összeg meghatározása
2. Fizetés (készpénz/kártya - MyPos)
3. Kaució blokkolás bérlés alatt
4. Kárvizsgálat (ha van sérülés)
5. Kaució visszaadása vagy részleges visszatartás
6. Elszámolás (számla/storno)

**Kaució státuszok:**
- `PENDING` → Még nincs fizetve
- `BLOKKOLVA` → Bérlés alatt
- `VIZSGALAT_ALATT` → Kárvizsgálat folyik
- `VISSZATARTVA` → Kár miatt visszatartva
- `VISSZAADVA` → Teljes visszaadás
- `RESZLEGESEN_ELSZAMOLVA` → Részben levonva

**Entitások:**
- `Kaució`
  - `kaució_id` (PK)
  - `bérlés_id` (FK)
  - `összeg`
  - `státusz` (ENUM)
  - `fizetési_mód` (készpénz/kártya)
  - `blokkolva_ig` (dátum)
  - `visszatartás_oka` (string - opcionális)
  - `kárfelvételi_jegyzőkönyv_id` (FK - opcionális)

---

#### C. Pénzügyi Folyamatok
**Bérleti díj számítás:**
- Napi, heti, havi tarifák
- Hétvége/ünnepnap kezelés:
  - **Opció A**: Hétvégék nem számítanak bele (default)
  - **Opció B**: Hétvégék is számítanak (explicit kérés)
- Késedelmi díj automatikus számítás
- Hosszabbítás kezelés

**Számítási példa:**
```
Kölcsönzés: Péntek 14:00 - Hétfő 09:00
Opció A (hétvége mentes): 2 nap (péntek, hétfő)
Opció B (hétvégés): 4 nap (péntek, szombat, vasárnap, hétfő)
```

**Entitások:**
- `BérlésiDíj`
  - `díj_id` (PK)
  - `bérlés_id` (FK)
  - `napi_díj`
  - `heti_díj`
  - `havi_díj`
  - `hétvége_számítás` (BOOL)
  - `késedelmi_díj` (calculated)
  - `teljes_összeg`

---

#### D. Szervíz Munkafolyamatok (2025-12-16)
**Főbb lépések:**
1. Felvétel (gép típus, hibaleírás)
2. Bevizsgálási díj fizetése (fix minimum: 5000 Ft)
3. Diagnosztika
4. Árajánlat készítés
5. Javítás (alkatrész + munka)
6. Összeszerelés (vagy szétszerelve marad - extra díj)
7. Visszaadás/átvétel

**Munkalap kapcsolás bérléshez:**
- Ha bérlés közben szervizbe kerül → `munkalap.bérlés_id` (FK)
- Ezzel automatikusan látszik a bérlés státusza

**Entitások:**
- `Munkalap`
  - `munkalap_id` (PK)
  - `gép_id` (FK)
  - `bérlés_id` (FK - opcionális)
  - `bevizsgálási_díj` (fix 5000 Ft min)
  - `hibaleírás`
  - `diagnosztika`
  - `árajánlat_összeg`
  - `javítási_költség`
  - `alkatrész_költség`
  - `munkadíj`
  - `összeszerelés_díj` (opcionális)
  - `prioritás` (ENUM: normál, garanciális, szerződéses)

---

#### E. Munkafolyamat Kezelés (2025-12-16)
**Kódos azonosítás:**
- 3-4 számjegyű alkalmazotti kód
- Minden tranzakcióhoz audit trail
- Local storage + szerver szinkronizáció

**"Ne piszkáld" zár:**
- Félbehagyott feladatok lock-olása
- Escape gomb → munkafolyamat szüneteltetés
- Worklist-en látható pending items

**Entitások:**
- `MunkafolyamatLock`
  - `lock_id` (PK)
  - `felhasználó_kód` (3-4 digit)
  - `entitás_típus` (bérlés/munkalap/stb.)
  - `entitás_id`
  - `lock_időpont`
  - `unlock_várt_időpont` (opcionális)

---

#### F. Partnerségi Funkciók (2025-12-16)
**Pontozási rendszer:**
- 1-5 csillag
- 5 csillag alatt nem adni gépet (policy)

**Fehér/fekete lista:**
- Fehér: Megbízható törzs partnerek (automata jóváhagyás)
- Fekete: Problémás ügyfelek (manuális ellenőrzés kötelező)

**Franchise megosztás:**
- Több bolt között adat sharing
- Központi pontozás
- Országos készlet láthatóság

**Entitások:**
- `PartnerPontozás`
  - `pontozás_id` (PK)
  - `partner_id` (FK)
  - `csillag` (1-5)
  - `lista_típus` (ENUM: fehér, fekete, normál)
  - `jegyzet`
  - `utolsó_frissítés`

---

## 3. DELTA ELEMZÉS (2025-12-16 → 2025-12-29)

### 3.1 ✨ Valóban Új Dolgok (korábban nem voltak)

| # | Funkció/Modul | Leírás | Komplexitás |
|---|---------------|--------|-------------|
| 1 | **AI Chatbot (Koko)** | Önállóan tanuló asszisztens multi-channel | ⭐⭐⭐⭐⭐ Nagyon Magas |
| 2 | **Beszerzési Modul** | Szállítói API, auto ár-sync, bevételezés | ⭐⭐⭐⭐ Magas |
| 3 | **3D Fotózás/Vizualizáció** | 360° fotó, AI termékazonosítás | ⭐⭐⭐⭐ Magas |
| 4 | **Szállítólevél vs Számla szét** | Email-szálak, külön entitások | ⭐⭐⭐ Közepes |
| 5 | **Helykövetés (polc+doboz+raklap)** | 3-szintű raktár hierarchia | ⭐⭐⭐ Közepes |
| 6 | **Vonalkódmátrix nyomtatás** | QR kód géphez, munkalaphoz | ⭐⭐ Alacsony |
| 7 | **Robbantott tábla (parts diagram)** | Szállítói API-ból gyári alkatrészlista | ⭐⭐⭐ Közepes |
| 8 | **Helyesítő számlák (credit notes)** | Dedikált flow pénzügyhöz | ⭐⭐ Alacsony |

---

### 3.2 📝 Kiegészítések Meglévő Folyamatokhoz

| Folyamat (2025-12-16) | Kiegészítés (2025-12-29) | Változás Típusa |
|-----------------------|--------------------------|-----------------|
| **Munkafolyamat-kezelés** | Work list, unfinished items, szerver-szinkron | ⬆️ KITERJESZTÉS |
| **Szervíz munkalap** | Vonalkódmátrix-nyomtatás, helykód-követés | ⬆️ KIEGÉSZÍTÉS |
| **Kaució** | Pontosabb státuszok, vizsgálat alatti phase | ⬆️ FINOMÍTÁS |
| **Pénzügy** | Helyesítő számlák, email-szálak, OCR | ⬆️ KITERJESZTÉS |
| **Raktár** | Polc → Polc+Doboz+Raklap hierarchia | ⬆️ BŐVÍTÉS |
| **Árazás** | Fix % → Piaci/pályázati/egyedi árak | ⬆️ RUGALMASSÁG |

---

### 3.3 ✅ Változatlan Alapfolyamatok

Ezek a folyamatok **NEM változtak** alapvetően (csak apró kiegészítések):

1. **Bérlési alapfolyamat**: Bérlő, fizető, kaució, gép kiadás, visszavétel
2. **Szervíz alaplogika**: Munkalap, bevizsgálás, javítás, visszaadás
3. **Ügyfél-azonosítás**: Törzsügyfél check, személyigazolvány, cégadatok
4. **Pontozási rendszer**: Fehér/fekete lista, 5 csillag szabály
5. **Franchise modell**: Központi adatmegosztás

---

## 4. ÖSSZES KÖVETELMÉNY ÖSSZESÍTVE (DEDUPLIKÁLVA)

### 4.1 MODULOK ÉS KOMPONENSEK

#### A. Core Modulok (Kötelező)
1. ✅ **KGC ERP Core** - Bérlés, szervíz, pénzügy, raktár
2. ✅ **HR (Horilla fork)** - Jelenlét, szabadság, profilok, bérszámfejtés
3. ✅ **CRM (Twenty fork)** - Marketing, sales, ügyfélkezelés
4. ✅ **Support (Chatwoot fork)** - Email, chat, ticket
5. 🆕 **Finance Module (egyedi)** - Számlázz.hu + NAV integráció

#### B. Bővítmények/Pluginek
- 🆕 **Beszerzés modul** - Szállítói API, bevételezés, árfigyelés
- 🆕 **AI Chatbot (Koko)** - Multi-channel support, auto-learning
- 🆕 **3D Vizualizáció** - Termékazonosítás, 360° fotó, AI
- **HR pluginek**: Recruitment, teljesítmény, asset management
- **CRM pluginek**: Marketing automation, advanced analytics

---

### 4.2 FŐBB ÜZLETI FOLYAMATOK (E2E)

#### E2E-1: 🔵 BÉRLÉS TELJES FOLYAMAT
**Lépések:**
1. Ügyfél azonosítás (törzsügyfél check → CRM)
2. Kaució meghatározás + fizetés (MyPos)
3. Gép kiválasztás (Inventory check - multi-location)
4. 360° fotózás (3D modul - gép állapot)
5. Kiadás (vonalkódmátrix nyomtatás)
6. Bérlés alatt → Szervizbe kerülhet (munkalap kapcsolás)
7. Visszavétel (állapot ellenőrzés, 360° fotó compare)
8. Kaució elszámolás (visszaadás/részleges visszatartás)
9. Számla kiállítás (Számlázz.hu + NAV)

**Érintett rendszerek:**
- KGC ERP, Twenty CRM, Inventory, 3D Modul, Chatwoot, Finance, Számlázz.hu

**Komplexitás:** ⭐⭐⭐⭐⭐ Nagyon Magas (30+ lépés, 7 rendszer)

**Diagramok:**
- User Journey (bérlő perspektíva)
- Swimlane (részlegek közötti interakció)
- Data Flow (rendszerek közötti adatáramlás)
- State Machine (bérlés státuszok)

---

#### E2E-2: 🟢 SZERVÍZ FOLYAMAT
**Lépések:**
1. Felvétel (gép adatok, hibaleírás)
2. Vonalkódmátrix nyomtatás (helykód rendszer)
3. Bevizsgálási díj fizetése (5000 Ft min)
4. Diagnosztika (robbantott tábla check - szállítói API)
5. Árajánlat (alkatrészek + munka)
6. Jóváhagyás
7. Javítás (garanciális prioritás: 2 hét)
8. Összeszerelés (vagy szétszerelve marad - opció)
9. Kaució elszámolás (ha bérlésből jött)
10. Visszaadás

**Érintett rendszerek:**
- KGC ERP, Szállítói API, Inventory, Finance

**Komplexitás:** ⭐⭐⭐⭐ Magas (20+ lépés, 4 rendszer)

**Diagramok:**
- Business Process Flowchart
- Swimlane (szervizes + admin)
- Decision Tree (garanciális vs normál vs szerződéses)

---

#### E2E-3: 🟡 BESZERZÉS ÉS BEVÉTELEZÉS
**Lépések:**
1. Készlet ellenőrzés (low stock alert)
2. Szállítói árak lekérése (API/scraping)
3. Megrendelés leadása (súlyozott átlagár kalkuláció)
4. Szállítólevél érkezés (email-szál figyelés)
5. Számla érkezés (külön email vagy később)
6. OCR feldolgozás (ha papír számla)
7. Szállítólevél vs Számla egyeztetés
8. Bevételezés (vonalkód scan, helykód hozzárendelés)
9. Helyesítő számla kezelés (credit note - ha van)
10. Készlet frissítés (polc+doboz+raklap)
11. Árak frissítése (listáár vs beszerzési ár)

**Érintett rendszerek:**
- KGC ERP, Szállítói API-k, Email, OCR, Inventory, Finance

**Komplexitás:** ⭐⭐⭐⭐⭐ Nagyon Magas (25+ lépés, 6 rendszer)

**Diagramok:**
- Business Process (megrendeléstől készletig)
- Integration Architecture (szállítói API-k)
- Data Flow (email → OCR → ERP)
- State Machine (megrendelés státuszok)

---

#### E2E-4: 🔴 RAKTÁR ÉS HELYKÖVETÉS
**Lépések:**
1. Termék érkezés (beszerzésből vagy visszavétel)
2. Vonalkód generálás (ha új termék)
3. Helykód hozzárendelés (polc-doboz-raklap hierarchia)
4. Vonalkódmátrix nyomtatás
5. Fizikai elhelyezés
6. Kiadás (vonalkód scan)
7. Helykód felszabadítás
8. Visszavétel → újra helykód hozzárendelés

**Érintett rendszerek:**
- KGC ERP, Inventory, Vonalkód nyomtató

**Komplexitás:** ⭐⭐⭐ Közepes (15 lépés, 3 rendszer)

**Diagramok:**
- Flowchart (helykövetés logika)
- ER Diagram (Helykód hierarchia)
- User Journey (raktáros perspektíva)

---

#### E2E-5: 🟣 PÉNZÜGYI FOLYAMAT (SZÁMLA)
**Lépések:**
1. Email-szál figyelés (számlák)
2. Email parsing (subject, attachments)
3. OCR (ha PDF/kép számla)
4. Szállítólevél vs Számla szétválasztás
5. Adatok kinyerése (összeg, dátum, tételek)
6. Megrendeléshez párosítás
7. Helyesítő számla kezelés (credit note)
8. Könyvelés (teljesítési vs könyvelési dátum)
9. Számlázz.hu szinkronizáció
10. NAV Online bejelentés

**Érintett rendszerek:**
- Email, OCR, Finance Module, Számlázz.hu, NAV API

**Komplexitás:** ⭐⭐⭐⭐ Magas (20 lépés, 5 rendszer)

**Diagramok:**
- Data Flow (email → ERP → NAV)
- Integration Architecture (Számlázz.hu + NAV)
- Business Process (számla feldolgozás)

---

#### E2E-6: 🟠 AI CHATBOT (KOKO)
**Lépések:**
1. Felhasználói kérdés (Discord/Email/Web)
2. NLP feldolgozás (intent detection)
3. Tudásbázis keresés
4. Válasz generálás (AI)
5. Admin jóváhagyás (ha új típusú kérdés)
6. Válasz küldése
7. Feedback gyűjtés
8. Tanulás (model update)

**Érintett rendszerek:**
- Chatwoot, Custom Chat, Discord API, Email, AI/ML szolgáltatás

**Komplexitás:** ⭐⭐⭐⭐⭐ Nagyon Magas (AI/ML, multi-channel)

**Diagramok:**
- Architecture (AI pipeline)
- Data Flow (kérdés → válasz)
- Learning Loop (feedback → retrain)

---

### 4.3 KRITIKUS ADATMEZŐK/ENTITÁSOK (RENDSZEREZETT)

#### A. Partner/Ügyfél
```sql
Partner:
- partner_id (PK)
- név
- cím
- telefon, email
- típus (ENUM: magánszemély, cég)
- törzsügyfél (BOOL)
- pontozás (FK → PartnerPontozás)
- fehér_lista, fekete_lista (BOOL)

PartnerPontozás:
- pontozás_id (PK)
- partner_id (FK)
- csillag (1-5)
- jegyzet
- utolsó_frissítés
```

#### B. Bérlés
```sql
Bérlés:
- bérlés_id (PK)
- bérlő_id (FK → Partner)
- fizető_id (FK → Partner)
- gép_id (FK)
- kaució_id (FK → Kaució)
- kiadás_dátum
- tervezett_visszavétel
- tényleges_visszavétel
- bérleti_díj_típus (ENUM: napi, heti, havi)
- hétvége_számítás (BOOL)
- késedelmi_díj (calculated)
- 360_fotó_kiadás_url
- 360_fotó_visszavétel_url
- vonalkódmátrix_id (FK)

Kaució:
- kaució_id (PK)
- bérlés_id (FK)
- összeg
- státusz (ENUM: pending, blokkolva, visszatartva, visszaadva, részlegesen_elszámolva)
- fizetési_mód (készpénz/kártya)
- blokkolva_ig
- visszatartás_oka
- kárfelvételi_jegyzőkönyv_id (FK)
```

#### C. Szervíz/Munkalap
```sql
Munkalap:
- munkalap_id (PK)
- gép_id (FK)
- bérlés_id (FK - opcionális, ha bérlés közben szervizbe)
- felvétel_dátum
- bevizsgálási_díj (min 5000 Ft)
- hibaleírás
- diagnosztika
- árajánlat_összeg
- jóváhagyva (BOOL)
- javítási_költség
- alkatrész_költség
- munkadíj
- összeszerelés_díj (opcionális)
- prioritás (ENUM: normál, garanciális, szerződéses)
- garanciális_határidő (2 hét)
- vonalkódmátrix_id (FK)
- helykód_id (FK - raktárban hol van)
- robbantott_tábla_id (FK)
```

#### D. Beszerzés/Megrendelés
```sql
Megrendelés:
- megrendelés_id (PK)
- szállító_id (FK → Szállító)
- megrendelés_dátum
- szállítási_becsült_idő
- státusz (ENUM: pending, szállítólevél_érkezett, számla_érkezett, bevételezve, lezárva)
- szállítólevél_id (FK)
- számlák (FK[] → Számla) - több is lehet

MegrendelésTétel:
- tétel_id (PK)
- megrendelés_id (FK)
- termék_id (FK)
- mennyiség
- listáár
- beszerzési_ár
- margin (%)

Szállító:
- szállító_id (PK)
- név
- api_endpoint (ha van API)
- auth_token
- email_cím (számlák)
```

#### E. Pénzügy/Számla
```sql
Számla:
- számla_id (PK)
- típus (ENUM: szállítói, vevői, előleg, helyesítő)
- számla_szám
- megrendelés_id (FK - opcionális)
- szállító_id (FK - ha szállítói)
- partner_id (FK - ha vevői)
- teljesítési_dátum
- könyvelési_dátum
- bruttó_összeg
- nettó_összeg
- áfa
- email_szál_id (FK → EmailSzál)
- ocr_feldolgozva (BOOL)
- számlázz_hu_id (external ID)

HelyesítőSzámla:
- helyesítő_id (PK)
- eredeti_számla_id (FK)
- credit_note_szám
- helyesítés_oka
- helyesített_összeg
- helyesítés_dátum

EmailSzál:
- szál_id (PK)
- subject
- thread_id
- kapcsolódó_számla_id (FK)
- kapcsolódó_megrendelés_id (FK)
- üzenetek (JSON)
```

#### F. Raktár/Inventory
```sql
Helykód:
- hely_id (PK)
- hely_típus (ENUM: polc, doboz, raklap)
- hely_kód (string, pl. "K1-P5-D17")
- szint_1 (rack)
- szint_2 (shelf)
- szint_3 (box)
- max_kapacitás
- jelenlegi_kapacitás

Készlet:
- készlet_id (PK)
- termék_id (FK)
- helykód_id (FK)
- mennyiség
- vonalkód
- doboz_vonalkód (ha van)

VonalkódMátrix:
- mátrix_id (PK)
- gép_id (FK)
- bérlés_id (FK - opcionális)
- munkalap_id (FK - opcionális)
- barcode_data (QR matrix)
- helykód_id (FK)
- nyomtatva_dátum
```

#### G. AI/Chatbot
```sql
KokoChatLog:
- log_id (PK)
- csatorna (ENUM: discord, email, web)
- felhasználó_id
- kérdés
- válasz
- intent
- confidence (%)
- admin_jóváhagyva (BOOL)
- tanulva (BOOL)
- timestamp

KokoTudásbázis:
- kb_id (PK)
- kategória
- kérdés_pattern
- válasz_template
- példák (JSON)
- utolsó_update
```

#### H. 3D Vizualizáció
```sql
GépFotó360:
- fotó_id (PK)
- gép_id (FK)
- bérlés_id (FK - opcionális, kiadáskor/visszavételkor)
- munkalap_id (FK - opcionális, szervíznél)
- fotó_url_array (JSON - 36 kép 10°-onként)
- videó_url (opcionális)
- ai_elemzés_eredmény (JSON - sérülések, állapot)
- készítés_dátum
```

#### I. Szállítói Integráció
```sql
SzállítóiAPI:
- api_id (PK)
- szállító_id (FK)
- api_endpoint
- auth_token
- utolsó_sync_dátum

RobbantottTábla:
- tábla_id (PK)
- gép_típus_id (FK)
- gyári_szám
- alkatrész_lista (JSON)
- diagram_kép_url
- forrás (szállítói API)
```

---

### 4.4 KRITIKUS FUNKCIÓK LISTÁJA

#### 🔴 KRITIKUS (MVP-hez kötelező)

1. ✅ **Bérlési modul**
   - Ügyfél azonosítás
   - Kaució kezelés (blokkolás, visszaadás)
   - Bérleti díj számítás (hétvége/ünnepnap)
   - Számla kiállítás (Számlázz.hu + NAV)

2. ✅ **Szervíz munkalap**
   - Felvétel, bevizsgálás, javítás
   - Bérléshez kapcsolás
   - Garanciális prioritás
   - Alkatrész keresés

3. ✅ **Raktár (alapszintű)**
   - Készletnyilvántartás
   - Vonalkód kezelés
   - Helykövetés (minimum polchely szint)

4. ✅ **Pénzügyi alapfolyamatok**
   - Számlázz.hu integráció
   - NAV Online bejelentés
   - Kaució elszámolás
   - Bevételezési számla

5. ✅ **Partner/Ügyfél adatbázis**
   - CRUD műveletek
   - Törzsügyfél kezelés
   - Pontozási rendszer (alapszintű)

---

#### 🟠 MAGAS PRIORITÁS (hamarosan kell)

6. 🆕 **Beszerzési modul**
   - Megrendelés leadása
   - Szállítólevél vs Számla
   - Bevételezés félautomata
   - Árfigyelés (API/scraping)

7. 🆕 **Email-szál kezelés**
   - Számlák automatikus routing
   - Thread tracking
   - OCR integráció

8. 🆕 **Helykövetés (teljes)**
   - Polc + Doboz + Raklap hierarchia
   - Vonalkódmátrix nyomtatás
   - Helykód rendszer

9. 🆕 **Helyesítő számlák**
   - Credit note flow
   - Könyvelési szétválasztás

10. 🆕 **AI Chatbot (Koko)**
    - Multi-channel support
    - Tudásbázis tanulás
    - Admin jóváhagyás workflow

11. 🆕 **3D Fotózás/Azonosítás**
    - 360° fotó capture
    - AI termékazonosítás
    - Sérülés detektálás

---

#### 🟡 KÖZEPES PRIORITÁS (később)

12. **Szállítói API integráció**
    - Makita, Bosch, Hikoki API-k
    - Robbantott táblák szinkronizáció
    - Árfrissítés automatizálás

13. **Bérszámfejtés** (HR modul)
    - Jelenléti ív integráció
    - Túlóra kezelés
    - Adóbevallás

14. **CRM szint**
    - Sales pipeline
    - Marketing automation
    - Lead scoring

15. **Advanced analytics**
    - Dashboardok
    - Reportok
    - Előrejelzések

---

#### 🟢 ALACSONY/JÖVŐBELI

16. **3D nyomtatás integráció** (alkatrész gyártás)
17. **Vasútspecifikus gépekaznos** (robbantott táblák)
18. **Pályázat-kezelő** (fix áras szerződések)
19. **Franchise portál** (független bolt UI-k)
20. **White label customization** (brand per tenant)

---

## 5. GAP ÖSSZEFOGLALÓ

### 5.1 ÚJ FOLYAMATOK (Transcript VAN, Diagram NINCS)

| # | Folyamat | Komplexitás | Prioritás | Diagram Típus |
|---|----------|-------------|-----------|---------------|
| 1 | **AI Chatbot (Koko)** | ⭐⭐⭐⭐⭐ | 🟠 Magas | Architecture + Learning Loop |
| 2 | **Beszerzési folyamat** | ⭐⭐⭐⭐⭐ | 🟠 Magas | Business Process + Integration |
| 3 | **Számla email-szál** | ⭐⭐⭐⭐ | 🟠 Magas | Data Flow + Integration |
| 4 | **3D fotózás/azonosítás** | ⭐⭐⭐⭐ | 🟠 Magas | User Journey + Architecture |
| 5 | **Helyesítő számla** | ⭐⭐⭐ | 🟡 Közepes | Business Process |
| 6 | **Vonalkódmátrix** | ⭐⭐ | 🔴 Kritikus | Flowchart |
| 7 | **Helykövetés (3-szint)** | ⭐⭐⭐ | 🔴 Kritikus | ER Diagram + Flowchart |
| 8 | **Robbantott tábla sync** | ⭐⭐⭐ | 🟡 Közepes | Integration Architecture |

---

### 5.2 FRISSÍTENDŐ FOLYAMATOK (Van diagram, DE változott)

| Meglévő Diagram | Változás | Frissítés Típusa |
|-----------------|----------|------------------|
| **Bérlés alapfolyamat** | +360° fotó, +vonalkódmátrix | 🔵 Kiegészítés (2-3 lépés) |
| **Szervíz munkalap** | +bérlésszám kapcsolás, +helykód követés | 🔵 Kiegészítés (2 lépés) |
| **Raktár** | Polc → Polc+Doboz+Raklap hierarchia | 🟡 Jelentős átdolgozás |
| **Árazás** | Fix % → Piaci/pályázati/egyedi | 🟡 Logika változás |
| **Pénzügy** | +Email-szálak, +OCR, +helyesítő | 🔵 Kiegészítés (3-4 lépés) |

---

### 5.3 TÖRÖLHETŐ/DEPRECATED (Ha van)

*Transcript alapján NINCS deprecated követelmény - minden korábbi továbbra is érvényes, csak bővült.*

---

## 6. EXCALIDRAW DIAGRAM TERV (v7-hez)

### 6.1 ÚJ DIAGRAMOK (készítendő)

#### A. AI Chatbot (Koko) - 3 diagram

**1. Koko System Architecture**
- **Típus:** Technical Architecture
- **Elemek (~20):**
  - Discord API, Email Gateway, Web Interface
  - NLP Engine, Intent Classifier
  - Tudásbázis, Admin Approval Queue
  - Feedback Loop, Model Retraining
- **Komplexitás:** ⭐⭐⭐⭐⭐
- **Becsült idő:** 4-6 óra

**2. Koko Learning Loop**
- **Típus:** Data Flow + State Machine
- **Elemek (~15):**
  - Felhasználói kérdés → Válasz → Feedback → Jóváhagyás → Tanulás
  - State transitions
- **Komplexitás:** ⭐⭐⭐⭐
- **Becsült idő:** 2-3 óra

**3. Koko User Journey**
- **Típus:** User Journey (multi-channel)
- **Elemek (~12):**
  - Discord bot interakció
  - Email thread
  - Web chat
- **Komplexitás:** ⭐⭐⭐
- **Becsült idő:** 2 óra

---

#### B. Beszerzési Modul - 4 diagram

**4. Beszerzési Teljes Folyamat**
- **Típus:** Business Process (E2E)
- **Elemek (~25):**
  - Készlet check → Szállítói árak → Megrendelés → Szállítólevél → Számla → Bevételezés
- **Komplexitás:** ⭐⭐⭐⭐⭐
- **Becsült idő:** 5-7 óra

**5. Szállítói API Integráció**
- **Típus:** Integration Architecture
- **Elemek (~18):**
  - Makita API, Bosch API, Hikoki API
  - Auth flow, Rate limiting
  - Data sync, Error handling
- **Komplexitás:** ⭐⭐⭐⭐
- **Becsült idő:** 3-4 óra

**6. Email-Szál Feldolgozás**
- **Típus:** Data Flow
- **Elemek (~15):**
  - Email receive → Parsing → Thread matching → Számla vs Szállítólevél → OCR
- **Komplexitás:** ⭐⭐⭐⭐
- **Becsült idő:** 3 óra

**7. Szállítólevél vs Számla Szétválasztás**
- **Típus:** Decision Tree + Flowchart
- **Elemek (~12):**
  - Döntési pontok
  - Párosítási logika
- **Komplexitás:** ⭐⭐⭐
- **Becsült idő:** 2 óra

---

#### C. 3D Vizualizáció - 2 diagram

**8. 360° Fotó Capture Workflow**
- **Típus:** User Journey + Flowchart
- **Elemek (~15):**
  - Kamera setup → 36 fotó (10°-onként) → Upload → AI processing
- **Komplexitás:** ⭐⭐⭐⭐
- **Becsült idő:** 2-3 óra

**9. AI Termékazonosítás Pipeline**
- **Típus:** Technical Architecture
- **Elemek (~12):**
  - Image preprocessing → ML model → Sérülés detektálás → Jelentés
- **Komplexitás:** ⭐⭐⭐⭐
- **Becsült idő:** 2-3 óra

---

#### D. Helykövetés - 2 diagram

**10. Helykövetés Hierarchia (ER Diagram)**
- **Típus:** Entity-Relationship + Hierarchy
- **Elemek (~10):**
  - Polc → Doboz → Raklap
  - Vonalkód kapcsolatok
- **Komplexitás:** ⭐⭐⭐
- **Becsült idő:** 2 óra

**11. Vonalkódmátrix Nyomtatás Workflow**
- **Típus:** Flowchart
- **Elemek (~8):**
  - Gép → QR generálás → Nyomtatás → Fizikai felragasztás
- **Komplexitás:** ⭐⭐
- **Becsült idő:** 1 óra

---

#### E. Pénzügyi - 2 diagram

**12. Helyesítő Számla (Credit Note) Flow**
- **Típus:** Business Process
- **Elemek (~10):**
  - Eredeti számla → Probléma → Credit note → Elszámolás
- **Komplexitás:** ⭐⭐⭐
- **Becsült idő:** 1-2 óra

**13. Számla Email-szál Routing**
- **Típus:** Data Flow + Decision Tree
- **Elemek (~12):**
  - Email arrive → Subject parse → Thread match → Route to entity
- **Komplexitás:** ⭐⭐⭐
- **Becsült idő:** 2 óra

---

### 6.2 FRISSÍTENDŐ DIAGRAMOK (meglévő + kiegészítés)

| Meglévő Diagram | Kiegészítés | Új Elemek | Becsült Idő |
|-----------------|-------------|-----------|-------------|
| **01 - Bérlés Master Flow** | +360° fotó lépések (kiadás/visszavétel) | +2-3 elem | 1 óra |
| **04 - Szerviz Flow** | +Bérlésszám kapcsolás, +helykód követés, +vonalkódmátrix | +3 elem | 1-2 óra |
| **05 - Pénzügy Flow** | +Email-szálak, +OCR, +helyesítő számlák | +4-5 elem | 2 óra |
| **06 - Visszavétel Flow** | +360° fotó compare, +AI sérülés detektálás | +2 elem | 1 óra |
| **09 - Raktár Flow** | Polc → Polc+Doboz+Raklap hierarchia | +5-7 elem | 2-3 óra |

---

### 6.3 ÖSSZESEN

**Új diagramok:** 13 db
**Frissítendő diagramok:** 5 db
**Becsült teljes idő:** 35-50 óra (Excalidraw-ban)

---

## 7. ADR (ARCHITECTURE DECISION RECORDS) IGÉNYEK

### 7.1 ÚJ ADR-ek (készítendő)

#### ADR-016: AI Chatbot (Koko) Architektúra
**Döntés témája:** Önállóan tanuló chatbot rendszer implementálása
**Alternatívák:**
- A) Saját NLP + ML pipeline (TensorFlow/PyTorch)
- B) Managed szolgáltatás (OpenAI GPT API)
- C) Hibrid (managed intent + saját tudásbázis)

**Döntés:** (TBD - Javo!-val egyeztetni)

**Érintett folyamatok:** Support, Email, Discord, Custom Chat

**Kritikusság:** 🟠 Magas

---

#### ADR-017: Szállítói API Integráció Stratégia
**Döntés témája:** Hogyan integráljuk a különböző szállítói API-kat (Makita, Bosch, Hikoki, stb.)?
**Alternatívák:**
- A) Direkt API hívások minden szállítóhoz (custom connectors)
- B) Unified API layer (adapter pattern)
- C) Web scraping (ha nincs API)

**Döntés:** (TBD)

**Érintett folyamatok:** Beszerzés, Inventory, Pricing

**Kritikusság:** 🟠 Magas

---

#### ADR-018: Email-Szál Feldolgozás (Számlák)
**Döntés témája:** Email thread tracking és számla automatizálás
**Alternatívák:**
- A) IMAP + custom parsing
- B) Gmail API / Outlook API
- C) Email szolgáltatás (SendGrid, Mailgun) + webhooks

**Döntés:** (TBD)

**Érintett folyamatok:** Pénzügy, Beszerzés

**Kritikusság:** 🟠 Magas

---

#### ADR-019: OCR Megoldás Számlákhoz
**Döntés témája:** Papíralapú számlák feldolgozása
**Alternatívák:**
- A) Google Cloud Vision API
- B) AWS Textract
- C) Azure Form Recognizer
- D) Tesseract (open-source, helyi)

**Döntés:** (TBD)

**Érintett folyamatok:** Pénzügy

**Kritikusság:** 🟡 Közepes

---

#### ADR-020: 3D Fotózás és Termékazonosítás
**Döntés témája:** 360° fotó capture és AI elemzés
**Alternatívák:**
- A) Custom ML model (transfer learning - ResNet/YOLO)
- B) Managed Computer Vision API (Google Vision, AWS Rekognition)
- C) 3D scanning hardware (LiDAR)

**Döntés:** (TBD)

**Érintett folyamatok:** Bérlés, Szervíz

**Kritikusság:** 🟡 Közepes

---

#### ADR-021: Helykövetés (Polc-Doboz-Raklap) Hierarchia
**Döntés témája:** Hogyan modellezzük a 3-szintű raktár hierarchiát?
**Alternatívák:**
- A) Nested JSON (flexible)
- B) Separate tables + FK-k (relational)
- C) Graph database (Neo4j - ha komplex queries)

**Döntés:** (TBD)

**Érintett folyamatok:** Raktár, Inventory

**Kritikusság:** 🔴 Kritikus

---

#### ADR-022: Vonalkód vs QR Kód Stratégia
**Döntés témája:** Milyen típusú kódokat használjunk (vonalkód, QR, NFC)?
**Alternatívák:**
- A) Csak vonalkód (1D barcode)
- B) QR kód (2D, több adat)
- C) NFC tag (drága, de robust)
- D) Hibrid (vonalkód + QR mindenhol)

**Döntés:** (TBD)

**Érintett folyamatok:** Minden (raktár, bérlés, szervíz)

**Kritikusság:** 🔴 Kritikus

---

#### ADR-023: Helyesítő Számla (Credit Note) Kezelés
**Döntés témája:** Hogyan kezeljük könyvelésileg a helyesítő számlákat?
**Alternatívák:**
- A) Separate entity (HelyesítőSzámla table)
- B) Számla version history
- C) Számla státusz változás (canceled + new)

**Döntés:** (TBD)

**Érintett folyamatok:** Pénzügy

**Kritikusság:** 🟡 Közepes

---

### 7.2 FRISSÍTENDŐ ADR-ek (meglévő + kiegészítés)

| ADR | Téma | Kiegészítés | Kritikusság |
|-----|------|-------------|-------------|
| **ADR-002** | Deployment és offline stratégia | +Email sync offline, +OCR local processing | 🟡 Közepes |
| **ADR-014** | Moduláris architektúra | +Beszerzés modul, +AI modul | 🟠 Magas |
| **ADR-015** | CRM/Support integráció | +Koko chatbot integráció | 🟠 Magas |

---

## 8. KÉRDÉSEK JAVO!-HOZ (TISZTÁZANDÓ)

### 8.1 AI Chatbot (Koko)

1. **Chatbot scope:** Mely területekre tanulja meg a rendszert? (Bérlés, szervíz, pénzügy, termékek, stb.?)
2. **Jóváhagyási workflow:** Ki fogja jóváhagyni az új válaszokat? (Admin, vagy több szintű?)
3. **Preferred AI szolgáltatás:** OpenAI GPT, vagy saját hosted model?
4. **Multi-language:** Csak magyar, vagy később angol/német is?

---

### 8.2 Beszerzési Modul

5. **Szállítói API-k:** Mely szállítókkal van már API megállapodás?
   - Makita: ✅ ❓
   - Bosch: ✅ ❓
   - Hikoki: ✅ ❓
   - Agroforg: ✅ ❓

6. **Web scraping:** Ha nincs API, megengedett-e scraping? (jogi kockázat)
7. **Árfrissítési frekvencia:** Naponta/hetente/valós időben?
8. **Robbantott táblák:** Automatikusan szinkronizálva, vagy manuális import?

---

### 8.3 3D Fotózás

9. **Hardver:** Milyen kamerát használunk? (normál mobil kamera / speciális 360° / LiDAR?)
10. **Fotózási workflow:** Ki fogja fotózni? (bérlés kiadósor / raktáros / dedikált fotós?)
11. **AI model:** Saját tanítás, vagy managed service? (Google Vision, AWS Rekognition)
12. **Storage:** Mennyi fotó tárhely kell? (1 gép = 36 kép * 2 alkalom = 72 kép → 100 MB / gép?)

---

### 8.4 Email-Szál Kezelés

13. **Email provider:** Gmail / Outlook / saját szerver?
14. **Automatizálás szintje:** Outlook Rules elegendő, vagy API-alapú parsing kell?
15. **Email címek:** Hány email címről érkeznek számlák? (külön inbox / shared mailbox?)

---

### 8.5 Helykövetés

16. **Fizikai raktár:** Mekkora? Hány polc / doboz / raklap slot? (becsült)
17. **Vonalkód nyomtatás:** Milyen nyomtatók vannak? (label printer / normál nyomtató + matrica?)
18. **Mobil eszközök:** Van-e vonalkód scanner (kézi), vagy mobil app-pal scan-elünk?

---

### 8.6 Helyesítő Számla

19. **Könyvelés:** Hogyan kezelik jelenleg? (új számla, vagy credit note?)
20. **Számlázz.hu:** Támogatja-e automatikusan a credit note-okat?

---

### 8.7 Prioritizálás

21. **MVP határok:** Mi a minimum funkció ami kell a launch-hoz?
   - Bérlés ✅
   - Szervíz ✅
   - Beszerzés ❓
   - AI Chatbot ❓
   - 3D Fotózás ❓

22. **Launch timeline:** Mikor szeretnéd éleslni az első verziót?

---

## 9. KÖVETKEZŐ LÉPÉSEK (JAVASLAT)

### 9.1 Azonnali (1-2 nap)

1. ✅ **Transcript elemzés** → KÉSZ (ez a dokumentum)
2. ⏭️ **Javo!-val egyeztetés** → Kérdések megválaszolása (8. fejezet)
3. ⏭️ **ADR döntések** → 7 új ADR megírása (vagy Javo! dönt)

---

### 9.2 Rövid távú (1 hét)

4. ⏭️ **Excalidraw diagramok készítése**
   - Új diagramok: 13 db
   - Frissítések: 5 db
   - Becsült idő: 40-50 óra (Architect agent + Excalidraw expert)

5. ⏭️ **HTML v7 generálás**
   - `KGC-ERP-v7-Final-2025-12-30.html`
   - Minden diagram beágyazva
   - Portable (offline működik)

---

### 9.3 Közép távú (2-3 hét)

6. ⏭️ **PRD frissítés** (ha diagramok + ADR-ek készen vannak)
7. ⏭️ **Epic/Story lebontás** (implementációs fázishoz)

---

## 10. ÖSSZEFOGLALÓ

**Főbb megállapítások:**

1. **Jelentős evolúció történt:** 2025-12-16 → 2025-12-29 között sok új modul és funkció.

2. **3 teljesen új modul:**
   - AI Chatbot (Koko)
   - Beszerzési/Bevételezési rendszer
   - 3D Vizualizáció

3. **Kritikus kiegészítések:**
   - Helykövetés (3-szintű hierarchia)
   - Email-szál feldolgozás
   - Helyesítő számlák
   - Vonalkódmátrix

4. **13 új diagram + 5 frissítés** szükséges.

5. **7 új ADR** készítendő.

6. **21 kérdés** tisztázandó Javo!-val.

**Következő lépés:** Javo! döntése a kérdésekre, majd Excalidraw diagramok készítése.

---

**Dokumentum vége.**

**Agent ID:** a7efe54 (folytatáshoz resumelhető)