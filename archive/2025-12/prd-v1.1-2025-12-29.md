---
stepsCompleted: [1]
inputDocuments:
  - docs/prd.md
  - docs/ERP/Inventory/INVENTORY-INTEGRATION-ARCHITECTURE.md
  - docs/architecture/ADR-014-modular-architektura-vegleges.md
  - docs/architecture/ADR-013-fit-gap-dontesek.md
  - docs/Flows/FIT-GAP-ANALYSIS.md
  - docs/analysis/konkurencia-elemzes-gepberles-erp-2025-12-15.md
  - docs/analysis/ERPNext-vs-KGC-FitGap-2025-12-19.md
documentCounts:
  briefs: 0
  research: 2
  brainstorming: 0
  projectDocs: 5
workflowType: 'prd'
lastStep: 0
project_name: 'KGC-2'
user_name: 'Javo!'
date: '2025-12-29'
---

# KGC-2 - Termék Követelmény Dokumentum (PRD)

**Szerző:** Javo!
**Dátum:** 2025-12-03
**Verzió:** 1.1

---

## Executive Summary

A KGC ERP egy átfogó kiskereskedelmi/bérleti és szerviz menedzsment rendszer, amelyet a Kisgépcentrum Kft. számára fejlesztünk. A rendszer az aktuális (Ver:1.33z) rendszer teljes újragondolása, modern technológiákkal és kibővített funkciókkal, beleértve a franchise hálózat támogatását, white label értékesítési modellt, offline működést és multi-platform elérhetőséget.

A rendszer célközönsége:
- **Kisgépcentrum központ** - teljes funkciókészlet, franchise menedzsment
- **Franchise partnerek** - bérlés, szerviz, értékesítés (csomag függő)
- **White Label ügyfelek** - saját márkás ERP más bérleti/szerviz cégeknek

### Ami ezt a terméket különlegessé teszi

A KGC ERP egyesíti a bérleti, értékesítési és szerviz funkciókat egyetlen integrált rendszerben, amely:
1. **Offline-first PWA** - Működik internet és áramszünet esetén is (papír backup + OCR)
2. **Franchise-ready architektúra** - Multi-tenant, országos készletláthatóság
3. **White Label termék** - Értékesíthető más bérleti cégeknek
4. **Munkaalapú keresés** - Az ügyfél a munkát adja meg, nem a gépet keresi

---

## Projekt Osztályozás

**Technikai Típus:** SaaS B2B (B2C elemekkel)
**Domain:** Kiskereskedelem / ERP / Bérleti menedzsment
**Komplexitás:** Magas

### Projekt Kontextus

**Meglévő rendszer:** Kis és Nagykereskedelmi, Bérleti Rendszer Ver:1.33z
- 10+ év működési tapasztalat
- Részletes üzleti folyamatok dokumentálva (1-7.resz.md)
- Ismert problémák és hiányosságok (duplikált ügyfelek, offline működés hiánya, stb.)

**Fejlesztési Track:** BMad Method (PRD + Architektúra + Epic-Story lebontás)

### Domain Kontextus

**Kulcs domain elemek:**
- NAV online számlázás integráció (kötelező)
- GDPR megfelelőség (ügyfél adatok)
- Garanciális javítás elszámolás (Makita norma, egyedi)
- Nagy céges szerződéses számlázás (FGS, MÁV)
- Pénzügyi compliance (ÁFA, havi zárások)

---

## Sikerkritériumok

### Üzleti Sikermutatók

1. **Franchise hálózat** - 10+ franchise partner csatlakozása az első évben
2. **White Label értékesítés** - 5+ licenc értékesítése más bérleti cégeknek
3. **Offline megbízhatóság** - 0 adatvesztés áramszünet/internetkimaradás esetén
4. **Felhasználói elégedettség** - A napi műveletek 50%-kal gyorsabbak, mint a régi rendszerben

### Technikai Sikermutatók

1. **Rendszer rendelkezésre állás** - 99.5% uptime (tervezett karbantartáson kívül)
2. **Offline szinkronizáció** - 100% sikeres adatszinkronizáció online visszatéréskor
3. **PWA teljesítmény** - <3 másodperc első betöltés, <1 másodperc navigáció
4. **API válaszidő** - <200ms átlagos válaszidő

---

## Termék Scope

### MVP - Minimum Viable Product

Az MVP tartalmazza az összes alapvető üzleti funkciót, PLUSZ a stratégiai differenciáló funkciókat:

**Alap Modulok:**
1. **Ügyfélkezelés** - Partner felvétel, keresés, cég-személy kapcsolat, duplikáció ellenőrzés
2. **Bérlés modul** - Bérgép nyilvántartás, bérlési szerződés, kaució, visszavétel, késés kezelés
3. **Értékesítés modul** - Cikk felvétel, bevételezés, készletkezelés, számlázás
4. **Szerviz modul** - Munkalap kezelés, árajánlat, alkatrész nyilvántartás, státuszok
5. **Pénzügy modul** - Befizetések, NAV feladás, havi zárások, riportok
6. **Megrendelés modul** - Rendelés felvétel, előleg, beérkezés értesítés

**MVP Stratégiai Funkciók (ADR döntések alapján):**
7. **Franchise rendszer** - Multi-tenant architektúra, országos készletláthatóság, csomagok (ADR-001)
8. **On-premise telepítés** - Docker alapú, szinkron agent (ADR-002)
9. **PWA Offline működés** - Service Worker, IndexedDB, Background Sync (ADR-002)
10. **Papír backup + OCR** - Vészhelyzet csomag, digitalizálási workflow (ADR-002)
11. **White Label** - Branding konfiguráció, licenc rendszer, 3 csomag (ADR-003)

**MVP Új Funkciók (7.resz.md alapján):**
12. **Automatikus értesítések** - SMS/email az áru beérkezéskor
13. **Fizetési fegyelem** - Lejárt tartozás blokkolás, adószám NAV ellenőrzés
14. **Automatikus árazás** - Árrés kategóriák, kalkulált eladási ár
15. **E-számla automatizálás** - Dedikált email, parsing, előzetes bevételezés
16. **Jogosultsági rendszer** - Pozícióhoz kötött, hierarchikus RBAC

### Growth Features (Post-MVP)

1. **Munkaalapú keresés** - Munka → gép ajánlás, bérlés vs. vásárlás összehasonlítás
2. **Karbantartási tudásbázis** - Géptípusonkénti útmutatók, képek, videók
3. **Robbantott ábrás alkatrész rendelés** - Interaktív diagram, készletinfó
4. **Automatikus alkatrész levétel** - Munkalap lezáráskor készletcsökkentés
5. ~~**Garanciális javítás elszámolás**~~ → MVP-be került (8. rész) ✅
6. **Szerelő teljesítmény dashboard** - Gépek száma, árbevétel, hatékonyság
7. **Bérgép jövedelmezőség riport** - Bevétel, szerviz költség, ROI számítás
8. **Logisztikai integráció** - GLS/MPL futárszolgálat, szállítás követés

### Vision (Jövő)

1. **Automatikus videó generálás** - Használati videók tapasztalatok alapján
2. **AI-alapú diagnosztika** - Hibajelenség → javítási javaslat
3. **Prediktív karbantartás** - Gép üzemóra alapú szerviz emlékeztető
4. **Marketplace integráció** - Online bérlési platform
5. **ERP integrációk** - SAP, Microsoft Dynamics összekötés nagy ügyfeleknek
6. **IoT integráció** - Bérgépek GPS/üzemóra követése

---

## Domain-Specifikus Követelmények

### NAV Integráció

- Kötelező online számlázás (100.000 Ft felett)
- XML formátum a NAV specifikáció szerint
- Automatikus feladás, visszaigazolás kezelés
- Számla archiválás (8 év)

### Pénzügyi Megfelelőség

- ÁFA típusok: Normál (27%), Adómentes, Fordított adózás
- Havi zárások, ÁFA kimutatások könyvelőnek
- Részletfizetés nyilvántartás
- Előlegszámla és díjbekérő workflow

### GDPR Megfelelőség

- Ügyfél adatok minimalizálása
- Törlési jog biztosítása (ahol törvény engedi)
- Adatexport lehetőség
- Hozzájárulás nyilvántartás

---

## Multi-Tenancy Architektúra (ADR-001)

### Tenant Modell

```
KÖZPONT (tenant_type: 'central')
├── SUPER_ADMIN - Teljes hozzáférés
├── CENTRAL_ADMIN - Franchise kezelés, országos statisztikák
└── CENTRAL_OPERATOR - Központi bolt műveletek

FRANCHISE (tenant_type: 'franchise')
├── FRANCHISE_ADMIN - Saját tenant minden művelete
├── STORE_MANAGER - Napi műveletek, lokális statisztikák
└── OPERATOR - Tranzakciók, ügyfélkezelés
```

### Adatvédelem Szabályok

| Adat típus | SUPER_ADMIN | CENTRAL_ADMIN | FRANCHISE_ADMIN |
|------------|-------------|---------------|-----------------|
| Saját pénzügy | ✅ | ❌ | ✅ (csak saját) |
| Más franchise pénzügy | ✅ | ❌ | ❌ |
| Országos statisztika | ✅ | ✅ | ❌ |
| Országos készlet | ✅ | ✅ | ✅ (olvasás) |
| Adatexport | ✅ | ❌ | ❌ |

---

## Holding Struktúra (8. rész bővítés) 🆕

### Holding Hierarchia

A KGC Holding anyavállalatként működik, alatta leányvállalatok (regionális telephelyek):

```
KGC HOLDING KFT.
├── Kisgépcentrum Érd (központ)
├── Kisgépcentrum Győr
├── Kisgépcentrum Debrecen
└── ... további leányvállalatok
```

### Holding Előnyök

| Előny | Leírás |
|-------|--------|
| **Adómentes osztalék** | EU anyavállalat → leányvállalat 0% |
| **Konszolidált beszámolók** | Egységes csoport riportok |
| **Kockázat elkülönítés** | Regionális társaságok önálló felelőssége |
| **Skálázható terjeszkedés** | Új régió = új leányvállalat |

### Új Entitások

```sql
-- Holding tábla
CREATE TABLE holding (
    holding_id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    tax_number VARCHAR(15) NOT NULL,
    headquarters_address TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Leányvállalat (tenant kiterjesztése)
ALTER TABLE tenants ADD COLUMN holding_id UUID REFERENCES holding(holding_id);
ALTER TABLE tenants ADD COLUMN is_subsidiary BOOLEAN DEFAULT FALSE;
```

---

## White Label Termék (ADR-003)

### Termék Csomagok

| Csomag | Célcsoport | Felhasználók | Boltok | Főbb Funkciók |
|--------|------------|--------------|--------|---------------|
| **Basic** | Kis bérbeadók | 3 | 1 | Bérlés, Értékesítés, Készlet |
| **Pro** | Közepes cégek | 10 | 5 | + Szerviz, Offline PWA, Multi-bolt |
| **Enterprise** | Nagy cégek | Korlátlan | Korlátlan | + Franchise, API, Prioritás támogatás |

### Licenc Rendszer

- Online validálás + 30 nap offline grace period
- Feature flags alapú funkció korlátozás
- Automatikus verzió ellenőrzés és frissítés értesítés

---

## Részletfizetési Rendszer (8. rész bővítés) 🆕

### Folyamat Áttekintés

```
Nagy összegű megrendelés (200.000 Ft+)
        │
        ▼
┌───────────────────┐
│  Előleg számla    │ → 30% előleg azonnal
│  kiállítása       │
└────────┬──────────┘
         │
         ▼
┌───────────────────┐
│ Részletfizetési   │ → Max 12 hónapra bontható
│ terv készítése    │
└────────┬──────────┘
         │
         ▼
┌───────────────────┐
│ Havi díjbekérők   │ → Automatikus küldés
│ (email + SMS)     │
└────────┬──────────┘
         │
         ▼
┌───────────────────┐
│ Végszámla         │ → Utolsó részletnél
└───────────────────┘
```

### Üzleti Szabályok

| Paraméter | Érték |
|-----------|-------|
| Minimum összeghatár | 200.000 Ft |
| Előleg mértéke | 30% (konfigurálható) |
| Maximum futamidő | 12 hónap |
| Késedelmi kamat | 0% (nincs) |
| Díjbekérő küldés | Automatikus (hónap elején) |

### Új Entitások

```sql
-- Részletfizetési terv
CREATE TABLE reszletfizetesi_terv (
    terv_id UUID PRIMARY KEY,
    partner_id UUID REFERENCES partners(id),
    megrendeles_id UUID REFERENCES orders(id),
    teljes_osszeg DECIMAL(12,2),
    eloleg_osszeg DECIMAL(12,2),
    honapok_szama INTEGER CHECK (honapok_szama <= 12),
    havi_reszlet DECIMAL(12,2),
    statusz VARCHAR(20) DEFAULT 'aktiv',
    tenant_id UUID REFERENCES tenants(id),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Törlesztések
CREATE TABLE torlesztes (
    torlesztes_id UUID PRIMARY KEY,
    terv_id UUID REFERENCES reszletfizetesi_terv(terv_id),
    sorszam INTEGER,
    osszeg DECIMAL(12,2),
    esedekesseg DATE,
    fizetve BOOLEAN DEFAULT FALSE,
    fizetesi_datum DATE,
    tenant_id UUID REFERENCES tenants(id)
);

-- Előleg
CREATE TABLE eloleg (
    eloleg_id UUID PRIMARY KEY,
    partner_id UUID REFERENCES partners(id),
    megrendeles_id UUID REFERENCES orders(id),
    osszeg DECIMAL(12,2),
    szamla_szam VARCHAR(50),
    fizetve BOOLEAN DEFAULT FALSE,
    tenant_id UUID REFERENCES tenants(id)
);

-- Díjbekérő
CREATE TABLE dijbekero (
    dijbekero_id UUID PRIMARY KEY,
    torlesztes_id UUID REFERENCES torlesztes(torlesztes_id),
    partner_id UUID REFERENCES partners(id),
    kuldesi_datum DATE,
    email_kuldve BOOLEAN DEFAULT FALSE,
    sms_kuldve BOOLEAN DEFAULT FALSE,
    tenant_id UUID REFERENCES tenants(id)
);
```

---

## Garanciális Javítás Rendszer (8. rész bővítés) 🆕

### Kétféle Garanciális Elszámolás

| Típus | Jellemző | Példa |
|-------|----------|-------|
| **Makita Norma** | Fix munkaidő gyártói táblázat alapján | Láncfűrész lánccsere = 0.5 óra |
| **Egyedi Elbírálás** | Egyeztetés a gyártóval, nincs előre fix idő | Ritka hiba, speciális gép |

### Makita Norma Rendszer

```
Munkafelvétel (garanciális)
        │
        ▼
┌───────────────────┐
│ Norma táblázat    │ → Gyártói munkaidő lekérdezés
│ alapján idő       │
└────────┬──────────┘
         │
         ▼
┌───────────────────┐
│ Javítás elvégzése │
│ + Alkatrészek     │
└────────┬──────────┘
         │
         ▼
┌───────────────────┐
│ Claim készítése   │ → Makita felé küldés
│ (norma × óradíj)  │
└────────┬──────────┘
         │
         ▼
┌───────────────────┐
│ Elszámolás        │ → Gyártó fizet
└───────────────────┘
```

### Új Entitások

```sql
-- Garancia szerződés (gyártóval)
CREATE TABLE garancia_szerzodes (
    szerzodes_id UUID PRIMARY KEY,
    gyarto_id UUID REFERENCES partners(id),
    szerzodes_szam VARCHAR(50),
    oradij DECIMAL(10,2),
    ervenyesseg_kezdete DATE,
    ervenyesseg_vege DATE,
    tenant_id UUID REFERENCES tenants(id)
);

-- Garancia claim
CREATE TABLE garancia_claim (
    claim_id UUID PRIMARY KEY,
    munkalap_id UUID REFERENCES munkalapok(id),
    szerzodes_id UUID REFERENCES garancia_szerzodes(szerzodes_id),
    claim_tipus VARCHAR(20), -- 'norma' vagy 'egyedi'
    munkaorak DECIMAL(5,2),
    alkatresz_koltseg DECIMAL(12,2),
    statusz VARCHAR(20) DEFAULT 'keszitett',
    kuldve DATE,
    elfogadva DATE,
    kifizetve DATE,
    tenant_id UUID REFERENCES tenants(id)
);

-- Norma tételek (Makita munkaidő táblázat)
CREATE TABLE norma_tetel (
    norma_id UUID PRIMARY KEY,
    szerzodes_id UUID REFERENCES garancia_szerzodes(szerzodes_id),
    munka_kod VARCHAR(20),
    munka_leiras VARCHAR(255),
    norma_ora DECIMAL(5,2),
    gep_tipusok TEXT[], -- Mely gépekre vonatkozik
    tenant_id UUID REFERENCES tenants(id)
);
```

---

## Készlet Szinkronizáció és Online Foglalás (8. rész bővítés) 🆕

### Országos Készletláthatóság

```
┌─────────────────────────────────────────────────────────┐
│                    WEBSHOP                               │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Ügyfél keres: "Makita ütvefúró"                        │
│                                                          │
│  ┌───────────────────────────────────────────────────┐  │
│  │ Készleten:                                        │  │
│  │ • Érd: 3 db      [FOGLALÁS]                      │  │
│  │ • Győr: 1 db     [FOGLALÁS]                      │  │
│  │ • Debrecen: 2 db [FOGLALÁS]                      │  │
│  └───────────────────────────────────────────────────┘  │
│                                                          │
│  Frissítve: 2 perce                                     │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### Foglalási Folyamat

1. Ügyfél online foglal egy terméket
2. Készlet csökkentve (foglalt állapot)
3. 48 óra átvételre
4. Ha nem veszi át → foglalás felszabadul

### Új Entitás

```sql
-- Online foglalás
CREATE TABLE foglalas (
    foglalas_id UUID PRIMARY KEY,
    partner_id UUID REFERENCES partners(id),
    cikk_id UUID REFERENCES products(id),
    bolt_tenant_id UUID REFERENCES tenants(id), -- Melyik boltban
    mennyiseg INTEGER,
    foglalas_idopontja TIMESTAMP,
    atvetel_hatarido TIMESTAMP,
    statusz VARCHAR(20) DEFAULT 'aktiv', -- aktiv, atveve, lejart, torolt
    tenant_id UUID REFERENCES tenants(id)
);
```

---

## UX Alapelvek

### Vizuális Személyiség

- **Professzionális, praktikus** - Nem fancy, hanem hatékony
- **Magas kontraszt** - Raktári környezetben is olvasható
- **Nagy kattintási célpontok** - Érintőképernyő barát

### Kulcs Interakciók

1. **Vonalkód központú** - Minden azonosítás vonalkóddal (ügyfél, gép, munkalap, cikk)
2. **Gyors partner keresés** - Név, telefon, személyi szám alapján
3. **Egyérintéses műveletek** - Bérlés indítás, visszavétel, számlázás
4. **Offline jelzés** - Egyértelmű vizuális jelzés offline módban
5. **Pending szinkron** - Látható, hány művelet vár feltöltésre

---

## Funkcionális Követelmények

### Ügyfélkezelés (FR1-FR10)

- **FR1:** Felhasználók létrehozhatnak új ügyfelet minimális adatokkal (név, telefon)
- **FR2:** Bérléshez kötelező a személyi igazolvány szám, születési dátum, anyja neve
- **FR3:** Felhasználók társíthatnak céget magánszemélyhez (adószám NAV ellenőrzéssel)
- **FR4:** Rendszer figyelmeztet duplikált ügyfél létrehozásra (név + telefon egyezés)
- **FR5:** Felhasználók kereshetnek ügyfelet név, telefon, személyi, adószám alapján
- **FR6:** Felhasználók megtekinthetik az ügyfél bérlési, szerviz és számla előzményeit
- **FR7:** Adminok archiválhatják az inaktív ügyfeleket (X éve nem volt tranzakció)
- **FR8:** Rendszer jelzi a lejárt tartozással rendelkező ügyfelet (blokkolás opció)
- **FR9:** Felhasználók exportálhatják az ügyfél adatait (GDPR)
- **FR10:** Felhasználók beolvashatják a személyi igazolvány vonalkódját gyors felvételhez

### Bérlés Modul (FR11-FR25)

- **FR11:** Felhasználók indíthatnak új bérlést ügyfélhez
- **FR12:** Rendszer megjeleníti az elérhető bérgépeket (nem kiadott, nem szervizben)
- **FR13:** Felhasználók beállíthatják a bérlési időtartamot (azonnal, +3h, +5h, +1nap, szállítólevél)
- **FR14:** Felhasználók rögzíthetik a kaució összegét (nem fix, ügyfél függő)
- **FR15:** Felhasználók hozzáadhatnak megjegyzést a tartozékokról
- **FR16:** Rendszer generálja a bérleti szerződést (2 példány: vonalkódos + sima)
- **FR17:** Felhasználók lezárhatják a bérlést vonalkód beolvasással
- **FR18:** Rendszer számítja a késési díjat (villogó jelzés lejárt bérlésnél)
- **FR19:** Felhasználók rögzíthetik a késési napokat (0.5, 1, 2, stb.)
- **FR20:** Rendszer naplózza a bérlés teljes életciklusát (ki vette ki, ki vette vissza, mikor)
- **FR21:** Felhasználók megtekinthetik a bérgép teljes történetét (kik bérelték, bevétel, szerviz)
- **FR22:** Rendszer automatikusan értesíti az ügyfelet SMS/email-ben a lejárat előtt
- **FR23:** Rendszer automatikusan értesíti az ügyfelet, ha késésben van
- **FR24:** Felhasználók szűrhetik a lejárt bérléseket
- **FR25:** Franchise partnerek látják az országos bérgép készletet (olvasás)

### Értékesítés és Készlet (FR26-FR40)

- **FR26:** Felhasználók felvehetnek új cikket (cikkszám, megnevezés, csoport, beszállító, ÁFA)
- **FR27:** Felhasználók bevételezhetnek árut beszállítói számla alapján
- **FR28:** Rendszer támogatja a forint és euró számlákat (átváltás bank árfolyammal)
- **FR29:** Rendszer ellenőrzi a bevételezés és a számla összeg egyezését
- **FR30:** Felhasználók nyomtathatnak és beolvashatnak vonalkódot (Zebra nyomtató)
- **FR31:** Felhasználók értékesíthetnek cikket (vonalkód/cikkszám alapján)
- **FR32:** Rendszer automatikusan kalkulálja az eladási árat árrés kategória alapján
- **FR33:** Rendszer figyelmeztet, ha az árrés eltér a kategória alapértelmezéstől
- **FR34:** Felhasználók átcsoportosíthatják a készletet másik cikkszámra (nagy céges kód)
- **FR35:** Felhasználók kezelhetik a készletet (plusz/mínusz bizonylatok)
- **FR36:** Rendszer vezeti a minimum készlet szintet (figyelmeztetés, automatikus rendelés opció)
- **FR37:** Franchise partnerek látják az országos készletet (közel valós idő, 1-5 perc)
- **FR38:** Rendszer támogatja a fordított adózást és adómentes értékesítést
- **FR39:** Felhasználók feldolgozhatják az e-számlákat automatikusan (email → parsing → előzetes bevételezés)
- **FR40:** Rendszer naplózza minden cikk teljes mozgását (audit trail)

### Szerviz Modul (FR41-FR55)

- **FR41:** Felhasználók felvehetik a gépet szervizbe (géptípus, hibajelenség, vonalkód)
- **FR42:** Rendszer generál munkalapot egyedi azonosítóval
- **FR43:** Felhasználók kezelhetik a munkalap státuszokat (felvéve, árajánlat, javítás, elkészült, számlázható)
- **FR44:** Felhasználók rögzíthetik a felhasznált alkatrészeket a munkalapra
- **FR45:** Rendszer csak "számlázható" státuszban engedélyezi a számlázást
- **FR46:** Felhasználók készíthetnek árajánlatot a munkalapból
- **FR47:** Felhasználók kezelhetik a nagy céges "nullás kifuttatás" folyamatot
- **FR48:** Felhasználók rögzíthetik a szerződéses óradíjat (cégenként eltérő)
- **FR49:** Felhasználók csatolhatnak dokumentumokat (teljesítésigazolás, megrendelő)
- **FR50:** Rendszer követi a garanciális javításokat (Makita norma, egyedi)
- **FR51:** Felhasználók megtekinthetik a szerelők teljesítményét (gépszám, árbevétel)
- **FR52:** Rendszer automatikusan csökkenti a készletet a beszerelt alkatrészekkel (post-MVP)
- **FR53:** Felhasználók kezelhetik a belső ügyfélkódokat (nagy cég telephelyek)
- **FR54:** Franchise partnerek küldhetnek gépet központi szervizbe
- **FR55:** Rendszer követi a szerviz logisztikát (szállítás státusz)

### Megrendelés Modul (FR56-FR62)

- **FR56:** Felhasználók felvehetnek megrendelést ügyfélnek (cikkszám, mennyiség, beszállító)
- **FR57:** Felhasználók rögzíthetnek előleget a megrendeléshez
- **FR58:** Felhasználók jelölhetnek sürgős rendelést (külön kezelés)
- **FR59:** Rendszer jelzi a bevételezésnél, ha a cikk megrendeléshez tartozik
- **FR60:** Rendszer automatikusan értesíti az ügyfelet a megrendelés beérkezéséről
- **FR61:** Felhasználók lezárhatják és összesíthetik a rendeléseket beszállítónként
- **FR62:** Rendszer kezeli a vásárlási kötelezettséget (X nap után értesítés, Y nap után törlés)

### Pénzügy Modul (FR63-FR75)

- **FR63:** Felhasználók rögzíthetik a befizetéseket (teljes/rész)
- **FR64:** Rendszer jelzi a lejárt tartozásokat (rózsaszín)
- **FR65:** Felhasználók blokkolhatják az új számla kiállítást lejárt tartozás esetén
- **FR66:** Rendszer generálja és archiválja a számlákat (PDF, XML)
- **FR67:** Rendszer automatikusan feladja a számlákat a NAV-nak
- **FR68:** Felhasználók kezelhetik a szállítólevél számlázást (összevonva)
- **FR69:** Rendszer generálja a havi ÁFA kimutatást könyvelőnek
- **FR70:** Felhasználók végrehajthatják a napi/havi zárást
- **FR71:** Rendszer támogatja a részletfizetési tervet (emlékeztetőkkel)
- **FR72:** Rendszer támogatja az előlegszámla és díjbekérő workflow-t
- **FR73:** Rendszer támogatja az adószám NAV ellenőrzést (működő/nem működő cég)
- **FR74:** Felhasználók lekérdezhetik a bérgépek jövedelmezőségét
- **FR75:** Rendszer vezeti az éves leltárt (program vs. valós készlet, korrekció)

### Franchise és Multi-Tenant (FR76-FR85)

- **FR76:** Központ létrehozhat új franchise partnert (tenant)
- **FR77:** Központ hozzárendelheti a csomagot (kölcsönző/szerviz/komplett)
- **FR78:** Franchise admin kezelhet felhasználókat a saját tenant-ben
- **FR79:** Központ láthatja az aggregált statisztikákat (nem a részleteket)
- **FR80:** Franchise NEM láthat más franchise adatait
- **FR81:** Webshop megjelenítheti az országos készletet (melyik boltban elérhető)
- **FR82:** Franchise használhatja a központi szerviz szolgáltatást
- **FR83:** Központ beállíthatja a minimum készlet szinteket
- **FR84:** Rendszer támogatja a franchise-nak szállítást (logisztikai kör)
- **FR85:** Franchise saját bevételezést végezhet, ha nem központon keresztül vásárol

### Offline és PWA (FR86-FR92)

- **FR86:** Rendszer működik internet nélkül (olvasás cache-ből, írás pending queue-ba)
- **FR87:** Rendszer szinkronizálja az offline műveleteket online visszatéréskor
- **FR88:** Rendszer Last-Write-Wins konfliktuskezelést alkalmaz (audit log-gal)
- **FR89:** Rendszer megjeleníti az offline státuszt és a pending szinkron számot
- **FR90:** Admin áttekintheti és felülbírálhatja a konfliktus feloldásokat
- **FR91:** Rendszer telepíthető PWA-ként mobil eszközre
- **FR92:** Rendszer támogatja a push értesítéseket (bérlés lejárat, szinkron kész)

### Papír Backup és OCR (FR93-FR97)

- **FR93:** Rendszer biztosít előnyomott, OCR-ready űrlapokat (bérlés, szerviz, ügyfél)
- **FR94:** Űrlapok tartalmaznak QR kódot az automatikus azonosításhoz
- **FR95:** Felhasználók szkennelhetik/fotózhatják a kitöltött űrlapokat
- **FR96:** Rendszer OCR-rel feldolgozza a képeket (Tesseract + Google Vision hibrid)
- **FR97:** Felhasználók ellenőrizhetik és javíthatják az OCR eredményt mielőtt véglegesítik

### White Label (FR98-FR103)

- **FR98:** Rendszer támogatja a testreszabható branding-et (logo, színek, cég adatok)
- **FR99:** Rendszer dinamikusan generálja a PWA manifest-et a branding alapján
- **FR100:** Licenc szerver validálja a licenc kulcsot és a feature-öket
- **FR101:** Rendszer működik 30 napig offline licenc validálás nélkül (grace period)
- **FR102:** Lejárt licenc esetén a rendszer readonly módba vált
- **FR103:** Admin értesítést kap az elérhető frissítésekről

### Holding Struktúra (FR104-FR107) 🆕

- **FR104:** Központ definiálhat holding-leányvállalat hierarchiát
- **FR105:** Rendszer konszolidált riportokat generál holding szinten
- **FR106:** Leányvállalatok önálló pénzügyi elkülönítése biztosított
- **FR107:** Holding admin látja az összes leányvállalat aggregált statisztikáját

### Részletfizetés (FR108-FR115) 🆕

- **FR108:** Felhasználók létrehozhatnak részletfizetési tervet nagy összegű megrendeléshez
- **FR109:** Rendszer automatikusan kalkulálja a havi részleteket (összeg / hónapok)
- **FR110:** Felhasználók kiállíthatnak előlegszámlát (konfig. 30%)
- **FR111:** Rendszer automatikusan generál havi díjbekérőket
- **FR112:** Rendszer email + SMS emlékeztetőt küld esedékességkor
- **FR113:** Felhasználók nyomon követhetik a törlesztések állapotát
- **FR114:** Rendszer automatikusan kiállítja a végszámlát az utolsó törlesztésnél
- **FR115:** Maximum 12 hónapos futamidő korlátozás érvényesül

### Garanciális Javítás (FR116-FR123) 🆕

- **FR116:** Felhasználók rögzíthetnek garanciális javítást (Makita norma vagy egyedi)
- **FR117:** Rendszer automatikusan lekéri a norma munkaidőt a gyártói táblázatból
- **FR118:** Felhasználók készíthetnek garancia claim-et a gyártó felé
- **FR119:** Rendszer nyilvántartja a gyártói garanciális szerződéseket és óradíjakat
- **FR120:** Felhasználók követhetik a claim státuszát (készített → küldve → elfogadva → kifizetve)
- **FR121:** Rendszer riportot készít a garanciális javítások elszámolásáról
- **FR122:** Felhasználók kezelhetik a norma tételek katalógusát (gyártónként)
- **FR123:** Egyedi elbírálás esetén megjegyzés mező kötelező

### Online Foglalás (FR124-FR128) 🆕

- **FR124:** Webshop megjelenít országos készletet (bolt szerinti bontásban)
- **FR125:** Ügyfelek online foglalhatnak terméket egy adott boltban
- **FR126:** Foglalás automatikusan csökkenti az elérhető készletet
- **FR127:** Rendszer 48 óra után automatikusan felszabadítja a le nem vett foglalásokat
- **FR128:** Bolt értesítést kap új foglalásról (email + PWA push)

---

## Nem-Funkcionális Követelmények

### Teljesítmény

- **NFR1:** API válaszidő < 200ms az esetek 95%-ában
- **NFR2:** PWA első betöltés < 3 másodperc (3G hálózaton)
- **NFR3:** Offline cache méret < 200MB (mobil eszközökön)
- **NFR4:** Készlet szinkronizáció < 5 perc késleltetés
- **NFR5:** 100 egyidejű felhasználó támogatása tenant-enként

### Biztonság

- **NFR6:** Minden API végpont autentikációt igényel (JWT)
- **NFR7:** Jelszavak bcrypt hash-elve tárolva
- **NFR8:** HTTPS kötelező minden kapcsolathoz
- **NFR9:** Row Level Security (RLS) a tenant adatok elkülönítésére
- **NFR10:** Audit log minden adatmódosításról (ki, mikor, mit)
- **NFR11:** Automatikus session lejárat (8 óra inaktivitás)
- **NFR12:** Adatexport korlátozás (csak SUPER_ADMIN)

### Skálázhatóság

- **NFR13:** Horizontális skálázás támogatása (load balancer mögött)
- **NFR14:** 50+ franchise partner támogatása egyetlen adatbázissal
- **NFR15:** 100,000+ cikk kezelése tenant-enként
- **NFR16:** 5 év tranzakciós adat megőrzése online

### Elérhetőség

- **NFR17:** 99.5% uptime (SaaS verzió)
- **NFR18:** Automatikus failover PostgreSQL replikával
- **NFR19:** Napi automatikus backup (7 nap retention)
- **NFR20:** Disaster recovery < 4 óra RTO

### Integráció

- **NFR21:** NAV Online Számla API 3.0 támogatása
- **NFR22:** REST API white label ügyfeleknek (Enterprise csomag)
- **NFR23:** SMS gateway integráció (Twilio/Nexmo)
- **NFR24:** Email küldés (SMTP vagy SendGrid)
- **NFR25:** Futárszolgálat API integráció (GLS, MPL) - post-MVP

---

## PRD Összefoglaló

A KGC-2 ERP rendszer **128 funkcionális** és **25 nem-funkcionális** követelményt tartalmaz, amelyek lefedik:

- **Alap ERP funkciókat:** Ügyfél, Bérlés, Értékesítés, Szerviz, Pénzügy, Megrendelés
- **Stratégiai MVP funkciókat:** Franchise, White Label, Offline PWA, Papír Backup
- **Domain-specifikus követelményeket:** NAV, GDPR, Garanciális elszámolás
- **8. rész bővítések (2025-12-03):** 🆕
  - Holding struktúra (FR104-FR107)
  - Részletfizetés (FR108-FR115)
  - Garanciális javítás Makita norma (FR116-FR123)
  - Online foglalás / készlet szinkron (FR124-FR128)

### Új Entitások (8. rész)

| Entitás | Modul | Leírás |
|---------|-------|--------|
| `HOLDING` | Szervezet | Anyavállalat |
| `LEÁNYVÁLLALAT` | Szervezet | Regionális társaság |
| `RÉSZLETFIZETÉSI_TERV` | Pénzügy | Törlesztési ütemezés |
| `TÖRLESZTÉS` | Pénzügy | Havi részletek |
| `ELŐLEG` | Pénzügy | Előlegszámlák |
| `DÍJBEKÉRŐ` | Pénzügy | Fizetési emlékeztetők |
| `GARANCIA_SZERZŐDÉS` | Szerviz | Gyártói szerződések |
| `GARANCIA_CLAIM` | Szerviz | Javítás elszámolás |
| `NORMA_TÉTEL` | Szerviz | Fix munkaidők (Makita) |
| `FOGLALÁS` | Készlet | Online foglalások |

### Termék Érték Összefoglaló

A KGC ERP egy resilient, offline-first bérleti és szerviz menedzsment rendszer, amely egyesíti a 10+ év működési tapasztalatot modern technológiákkal. A franchise-ready architektúra és white label értékesítési modell lehetővé teszi a skálázható üzleti növekedést, míg az offline működés és papír backup biztosítja a zavartalan működést bármilyen körülmények között.

---

*Ez a PRD a Kisgépcentrum ERP lényegét ragadja meg - egy megbízható, praktikus rendszer, amely a valós üzleti igényekre épül.*

*Készült együttműködésben Javo! és John (BMAD PM) között.*

---

## Változásnapló

| Dátum | Verzió | Változás |
|-------|--------|----------|
| 2025-12-02 | 1.0 | Kezdeti PRD |
| 2025-12-03 | 1.1 | 8. rész bővítések: Holding, Részletfizetés, Garancia, Foglalás |
| 2025-12-29 | 1.2 | Workflow inicializálás: frontmatter hozzáadva, Beszerzés modul készítése kezdődik |
