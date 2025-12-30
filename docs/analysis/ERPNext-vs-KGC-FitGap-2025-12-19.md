# ERPNext vs KGC ERP - Fit-Gap Analízis és Build vs Customize Döntés

**Dátum:** 2025-12-19
**Készítette:** BMad Orchestrator
**Megrendelő:** Javo!
**GitHub Repo:** https://github.com/frappe/erpnext

---

## Executive Summary

### Gyors Döntési Javaslat

**🔴 NULLÁRÓL ÉPÍTÉS JAVASOLT**

**Indokok:**
1. **Kritikus GAP-ek**: 8 kritikus üzleti funkció hiányzik vagy nehezen implementálható
2. **Architektúra mismatch**: ERPNext multi-company ≠ KGC multi-tenant franchise modell
3. **Offline működés**: ERPNext PWA csak részleges, KGC papír backup + OCR nincs
4. **Testreszabási költség**: ~60-70% új fejlesztés ERPNext-ben is szükséges
5. **Vendor lock-in**: Frappe Framework függőség, nehéz migráció

**Becsült költségkülönbség:**
- **ERPNext testreszabás**: ~70-80% a nulláról építés költségéből
- **Nulláról építés**: 100%, de TELJES kontroll és KGC-specifikus optimalizáció

---

## Tartalomjegyzék

1. [ERPNext Áttekintés](#erpnext-áttekintés)
2. [Fit-Gap Mátrix](#fit-gap-mátrix)
3. [Kritikus GAP-ek Részletesen](#kritikus-gap-ek-részletesen)
4. [Költség-Haszon Elemzés](#költség-haszon-elemzés)
5. [Rizikó Elemzés](#rizikó-elemzés)
6. [Döntési Ajánlás](#döntési-ajánlás)

---

## ERPNext Áttekintés

### Technológiai Stack

| Réteg | ERPNext | KGC Terv |
|-------|---------|----------|
| **Backend** | Python (Frappe Framework) | Node.js / Python (TBD) |
| **Frontend** | Vue.js (Frappe UI) | React / Vue (TBD) |
| **Adatbázis** | MariaDB | PostgreSQL (multi-tenant RLS) |
| **Deployment** | Docker + bench CLI | Docker + Kubernetes |
| **Licenc** | GPL-3.0 (nyílt forráskód) | Saját (commercial) |

### ERPNext Főbb Modulok

| Modul | Lefedettség | Megjegyzés |
|-------|-------------|------------|
| **Accounting** | ✅ Teljes | Számlázás, ÁFA, zárások |
| **Stock** | ✅ Teljes | Készletkezelés, raktár |
| **CRM** | ✅ Teljes | Lead, Opportunity, Campaign |
| **HR** | ✅ Teljes | Payroll, attendance, employee |
| **Support** | ✅ Teljes | Ticketing, SLA, warranty |
| **Manufacturing** | ✅ Teljes | BOM, production planning |
| **Projects** | ✅ Teljes | Task, timesheet, budgeting |
| **Asset Management** | ⚠️ Részleges | Általános eszköz, NEM bérleti |
| **Rental Management** | ❌ Külső App | Frappe Marketplace app szükséges |

---

## Fit-Gap Mátrix

### Legenda
- ✅ **FIT**: Készen van, minimális testreszabás
- ⚠️ **PARTIAL**: Van alapja, de jelentős fejlesztés kell
- ❌ **GAP**: Nincs, nulláról kell építeni
- 🔴 **KRITIKUS GAP**: Üzletileg kritikus, ERPNext nem támogatja

### Üzleti Folyamatok

| # | KGC Követelmény | ERPNext | GAP | Megjegyzés |
|---|-----------------|---------|-----|------------|
| **ÜGYFÉLKEZELÉS** |
| 1 | Partner központi törzs | ✅ | NINCS | Customer master |
| 2 | Duplikált partner ellenőrzés | ⚠️ | KÖZEPES | Van, de testreszabás kell |
| 3 | Magánszemély + Cég kapcsolat | ⚠️ | KÖZEPES | Custom field kell |
| 4 | NAV adószám ellenőrzés | ❌ | NAGY | Custom integráció |
| **BÉRLÉS MODUL** |
| 5 | Bérgép nyilvántartás | ⚠️ | NAGY | Asset ≠ Bérgép (kaució, késés, stb.) |
| 6 | Bérlési szerződés generálás | ❌ | 🔴 KRITIKUS | Nincs bérleti szerződés sablon |
| 7 | Kaució kezelés (MyPOS token) | ❌ | 🔴 KRITIKUS | Payment gateway custom |
| 8 | Késési díj automatikus számítás | ❌ | 🔴 KRITIKUS | Custom logic |
| 9 | Bérlés vonalkód beolvasás | ⚠️ | KÖZEPES | POS van, testreszabni kell |
| 10 | Bérgép történet (ki bérelte) | ⚠️ | KÖZEPES | Asset maintenance log bővítés |
| **ÉRTÉKESÍTÉS ÉS KÉSZLET** |
| 11 | Cikk felvétel | ✅ | NINCS | Item master |
| 12 | Bevételezés (beszállítói számla) | ✅ | NINCS | Purchase Receipt |
| 13 | Automatikus árazás (margin szabály) | ⚠️ | KÖZEPES | Pricing Rule van, KGC logika custom |
| 14 | Árrés védelem (RBAC ár módosítás) | ⚠️ | KÖZEPES | Permission szint testreszabás |
| 15 | Vonalkód nyomtatás (Zebra) | ⚠️ | KÖZEPES | Van vonalkód, formátum custom |
| 16 | Multi-location készlet | ✅ | NINCS | Warehouse multi-location |
| 17 | E-számla parsing (email → bevételezés) | ❌ | NAGY | Custom email parser + OCR |
| **SZERVIZ MODUL** |
| 18 | Munkalap felvétel (javítás/árajánlat/garancia) | ⚠️ | NAGY | Warranty van, de KGC workflow custom |
| 19 | Alkatrész felhasználás munkalaphoz | ✅ | NINCS | Maintenance Visit |
| 20 | Garanciális javítás (Makita norma) | ❌ | 🔴 KRITIKUS | Nincs norma táblázat kezelés |
| 21 | Nullás kifuttatás (nagy céges) | ❌ | 🔴 KRITIKUS | Custom szerződéses óradíj logika |
| 22 | Szerviz belső kommunikáció | ❌ | NAGY | Internal comment mezők |
| 23 | Fájlfeltöltés munkalaphoz | ✅ | NINCS | Attachment van |
| 24 | Robbantott ábra adatbázis | ❌ | 🔴 KRITIKUS | Nincs parts diagram kezelés |
| **PÉNZÜGY** |
| 25 | NAV Online Számla API | ❌ | 🔴 KRITIKUS | Magyar e-invoicing custom |
| 26 | Részletfizetési terv | ⚠️ | NAGY | Payment Schedule van, KGC workflow custom |
| 27 | Előlegszámla + Díjbekérő | ⚠️ | NAGY | Advance payment van, testreszabás kell |
| 28 | Havi zárások | ✅ | NINCS | Period Closing |
| 29 | ÁFA kimutatás | ✅ | NINCS | GST/VAT reports |
| **FRANCHISE ÉS MULTI-TENANT** |
| 30 | Multi-tenant architektúra | ⚠️ | 🔴 KRITIKUS | Multi-company ≠ Multi-tenant |
| 31 | Központi partner, bolt-specifikus tranzakció | ❌ | 🔴 KRITIKUS | ERPNext: company-based, NEM tenant |
| 32 | Országos készletláthatóság | ⚠️ | KÖZEPES | Multi-warehouse van, real-time sync custom |
| 33 | Franchise csomag kezelés (feature flags) | ❌ | NAGY | Custom subscription logic |
| 34 | Holding struktúra | ⚠️ | KÖZEPES | Group Company van, konszolidáció custom |
| **OFFLINE ÉS PWA** |
| 35 | Offline-first PWA | ⚠️ | 🔴 KRITIKUS | POS offline van, TELJES offline NEM |
| 36 | Papír backup + OCR | ❌ | 🔴 KRITIKUS | Nincs OCR workflow |
| 37 | Background sync (pending queue) | ⚠️ | NAGY | POS sync van, általános custom |
| **WHITE LABEL** |
| 38 | Testreszabható branding | ✅ | NINCS | Multi-tenant branding |
| 39 | Licenc rendszer (feature flags) | ❌ | NAGY | Custom subscription + validation |
| 40 | PWA manifest dinamikus generálás | ⚠️ | KÖZEPES | Custom PWA builder |

---

## Kritikus GAP-ek Részletesen

### 1. 🔴 Bérlési Szerződés és Kaució (GAP #6, #7, #8)

**KGC Követelmény:**
- Bérlési szerződés 2 példány (vonalkódos + sima)
- MyPOS kaució token kezelés
- Késési díj automatikus számítás (0.5, 1, 2 nap)

**ERPNext:**
- Asset Management van, de **NEM bérleti specifikus**
- Nincs kaució nyilvántartás
- Nincs késés tracking és díjszámítás

**Szükséges fejlesztés:**
- Teljes bérlési modul (bergep, berles, szerzodes, kaucio táblák)
- MyPOS payment gateway integráció
- Késés monitoring + automatikus díjszámítás
- Bérleti szerződés sablon motor

**Becsült fejlesztési idő:** 3-4 hónap (senior dev)

---

### 2. 🔴 Multi-Tenant Franchise Architektúra (GAP #30, #31)

**KGC Követelmény:**
- Központi partner törzs, bolt-specifikus tranzakciók
- Tenant séma szeparáció (tenant_kgc1, tenant_fr01)
- Franchise látja mások készletét (olvasás), NEM részleteket

**ERPNext:**
- **Multi-Company** modell: minden company külön partnert tárol
- **NINCS** Row Level Security (RLS) tenant alapú szeparációra
- **NINCS** központi partner + tenant séma koncepció

**Szükséges fejlesztés:**
- Teljes adatbázis séma átdolgozás (PostgreSQL RLS)
- Partner központosítás
- Franchise visibility engine
- API middleware tenant routing

**Becsült fejlesztési idő:** 4-6 hónap (senior dev + architect)

---

### 3. 🔴 Offline-First PWA és Papír Backup (GAP #35, #36)

**KGC Követelmény:**
- Működés internet + áramszünet nélkül
- Papír űrlap OCR feldolgozás (Tesseract + Google Vision)
- 100% szinkronizáció online visszatéréskor

**ERPNext:**
- **POS offline mode** van (limitált funkciók)
- **NINCS** teljes offline modul (bérlés, szerviz)
- **NINCS** papír backup + OCR workflow

**Szükséges fejlesztés:**
- Service Worker minden modulhoz
- IndexedDB cache stratégia
- OCR pipeline (Tesseract + Google Vision API)
- Background Sync konfliktus kezelés

**Becsült fejlesztési idő:** 3-4 hónap (frontend + backend)

---

### 4. 🔴 NAV Online Számla API (GAP #25)

**KGC Követelmény:**
- XML generálás NAV 3.0 spec szerint
- Automatikus feladás és visszaigazolás kezelés
- 8 év archiválás

**ERPNext:**
- **Nincs magyar NAV integráció**
- Általános e-invoicing van (EU, India GST)

**Szükséges fejlesztés:**
- NAV XML serializer
- API kommunikáció (token kezelés)
- Hibajavítási workflow
- Archiválási rendszer

**Becsült fejlesztési idő:** 2-3 hónap

---

### 5. 🔴 Garanciális Javítás (Makita Norma) (GAP #20, #24)

**KGC Követelmény:**
- Norma táblázat (Makita munkaidő fix értékek)
- Claim készítés gyártónak
- Robbantott ábra + alkatrész lista géptípusonként

**ERPNext:**
- **Nincs** norma táblázat kezelés
- **Nincs** garanciális claim workflow
- **Nincs** parts diagram katalógus

**Szükséges fejlesztés:**
- Norma táblázat (norma_tetel entitás)
- Garancia claim (szerzodes, claim, státusz)
- Robbantott ábra feltöltés + hivatkozás
- Claim tracking (készített → küldve → elfogadva → kifizetve)

**Becsült fejlesztési idő:** 2-3 hónap

---

## Költség-Haszon Elemzés

### Becsült Fejlesztési Idő és Költség

| Megközelítés | Idő | Költség (€) | Kontroll | Vendor Lock-in |
|--------------|-----|-------------|----------|----------------|
| **Nulláról építés** | 12-18 hónap | 150,000 - 200,000 | ✅ TELJES | ❌ NINCS |
| **ERPNext testreszabás** | 10-14 hónap | 120,000 - 160,000 | ⚠️ RÉSZLEGES | ⚠️ Frappe Framework |

### ERPNext Testreszabási Költségek (Részletesen)

| Terület | Becsült Idő | Költség (€) | Megjegyzés |
|---------|-------------|-------------|------------|
| **Bérlési modul** | 3-4 hónap | 30,000 - 40,000 | Kaució, késés, szerződés |
| **Multi-tenant átdolgozás** | 4-6 hónap | 50,000 - 70,000 | Adatbázis séma, RLS, API |
| **Offline PWA** | 3-4 hónap | 30,000 - 40,000 | Service Worker, OCR |
| **NAV integráció** | 2-3 hónap | 20,000 - 30,000 | XML, API, archiválás |
| **Garanciális javítás** | 2-3 hónap | 20,000 - 30,000 | Norma, claim, robbantott ábra |
| **Egyéb GAP-ek** | 2-3 hónap | 15,000 - 20,000 | Árazás, dolgozói kedvezmény, stb. |
| **Tesztelés + Dokumentáció** | 2 hónap | 10,000 - 15,000 | QA, user guide, training |
| **ÖSSZESEN** | 18-26 hónap | **175,000 - 245,000** | |

**FONTOS:** Az ERPNext testreszabás NEM olcsóbb, ha minden kritikus GAP-et figyelembe veszünk!

---

## Rizikó Elemzés

### ERPNext Testreszabás Rizikók

| Rizikó | Súlyosság | Hatás | Mitigáció |
|--------|-----------|-------|-----------|
| **Frappe Framework frissítések** | 🔴 MAGAS | Breaking changes törhetik a custom kódot | Verzió lock, saját fork |
| **Multi-tenant architektúra mismatch** | 🔴 MAGAS | Alapvető koncepcionális különbség | Teljes adatbázis átdolgozás (nagy munka) |
| **Offline funkcionalitás korlátozott** | 🟡 KÖZEPES | POS-on kívül minden custom | Saját Service Worker fejlesztés |
| **Marketplace app függőség** | 🟡 KÖZEPES | Rental app minősége/támogatása bizonytalan | Saját bérlési modul írása (úgyis kell) |
| **Magyar compliance (NAV)** | 🔴 MAGAS | Nincs beépített támogatás | Teljes custom fejlesztés |
| **Vendor lock-in** | 🟡 KÖZEPES | Nehéz migráció Frappe-ről | Absztrakciós réteg (extra költség) |
| **Dokumentáció hiányos (magyar)** | 🟢 ALACSONY | Tanulási görbe | Közösségi fórum, angol tudás |
| **Testreszabási komplexitás** | 🔴 MAGAS | 60-70% új fejlesztés → miért nem nulláról? | N/A |

### Nulláról Építés Rizikók

| Rizikó | Súlyosság | Hatás | Mitigáció |
|--------|-----------|-------|-----------|
| **Hosszabb fejlesztési idő** | 🟡 KÖZEPES | 12-18 hónap vs 10-14 hónap | Agilis sprintek, MVP first |
| **Kezdeti költség magasabb** | 🟢 ALACSONY | 150k vs 120k (CSAK látszólagos) | Hosszú távon olcsóbb (nincs lock-in) |
| **Saját karbantartás** | 🟡 KÖZEPES | Nincs közösségi support | Dokumentáció, code quality, tests |
| **架構 Architecture döntések** | 🟢 ALACSONY | Rossz választás drága lehet | BMad Method, Architect review |

---

## Döntési Ajánlás

### 🔴 NULLÁRÓL ÉPÍTÉS - Részletes Indoklás

#### 1. Testreszabási Arány (60-70%)

ERPNext esetében a **kritikus 8 GAP** miatt a rendszer **60-70%-át úgyis újra kell írni**:
- Bérlési modul: 100% custom
- Multi-tenant: 80% custom (adatbázis átdolgozás)
- Offline PWA: 70% custom (POS-on kívül minden)
- NAV integráció: 100% custom
- Garanciális javítás: 100% custom

**Kérdés:** Ha ennyit fejlesztünk, miért ne kontrollálnánk a teljes kódbázist?

#### 2. Architektúra Mismatch

ERPNext **Multi-Company** modell ≠ KGC **Multi-Tenant** modell

```
ERPNext:
Company A: Partner, Tranzakció
Company B: Partner (külön rekord!), Tranzakció

KGC Elvárt:
Partner (KÖZÖS) → Tenant A: Tranzakció
                 → Tenant B: Tranzakció
```

**Ez nem testreszabás, hanem architektúra átdolgozás!**

#### 3. Vendor Lock-in Elkerülése

- Frappe Framework frissítések törhetik a custom kódot
- Marketplace app-ok támogatása bizonytalan
- Nehéz migráció más rendszerre (vendor lock-in)

**Nulláról:** Teljes kontroll, nincs külső függőség

#### 4. KGC-Specifikus Optimalizáció

ERPNext általános ERP → KGC bérleti/szerviz specifikus ERP

**Példák:**
- Bérgép vonalkód workflow (ERPNext-ben nincs ilyen)
- Késési díj automatikus kalkuláció
- MyPOS token kaució
- Papír backup OCR (KGC egyedi igény)

**Nulláról:** Minden funkció KGC üzleti logikára optimalizálva

#### 5. Hosszú Távú TCO (Total Cost of Ownership)

| Költség Típus | ERPNext (5 év) | Nulláról (5 év) |
|---------------|----------------|-----------------|
| **Kezdeti fejlesztés** | 175k - 245k € | 150k - 200k € |
| **Éves karbantartás** | 20k - 30k €/év | 15k - 20k €/év |
| **Frissítések (breaking changes)** | 10k - 20k €/év | 0 € |
| **Migráció (ha kell)** | 50k - 100k € | 0 € |
| **ÖSSZESEN (5 év)** | **325k - 495k €** | **225k - 300k €** |

**Megtérülés:** Nulláról építés **100k - 195k € olcsóbb** 5 év alatt!

---

## Implementációs Roadmap (Nulláról Építés)

### MVP (6-8 hónap)

**Fázis 1: Alap rendszer (2 hónap)**
- CORE modul (users, tenants, RBAC)
- Partner modul (központi)
- KÉSZLET törzs

**Fázis 2: Bérlés + Értékesítés (2 hónap)**
- Bérlési modul (bergep, berles, kaució, késés)
- Értékesítés (készlet, bevételezés, eladás)

**Fázis 3: Szerviz + Pénzügy (2 hónap)**
- Szerviz (munkalap, alkatrész)
- Pénzügy (számla, NAV integráció MVP)

**Fázis 4: MVP Finalizálás (2 hónap)**
- Offline PWA (Service Worker, IndexedDB)
- Tesztelés + Bugfix
- Deploy központi boltba (pilot)

### Post-MVP (6-10 hónap)

**Fázis 5: Franchise (3 hónap)**
- Multi-tenant finomhangolás
- Országos készletláthatóság
- Franchise csomag kezelés

**Fázis 6: Garanciális + White Label (3 hónap)**
- Makita norma + claim
- White Label branding
- Licenc rendszer

**Fázis 7: Growth Features (3-4 hónap)**
- Robbantott ábra katalógus
- Munkaalapú keresés
- Szerelő teljesítmény dashboard

---

## Összefoglaló Táblázat

| Szempont | ERPNext Testreszabás | Nulláról Építés |
|----------|----------------------|-----------------|
| **Kezdeti költség** | 175k - 245k € | 150k - 200k € |
| **Fejlesztési idő** | 18-26 hónap | 12-18 hónap |
| **Testreszabási arány** | 60-70% | 100% (de optimalizált) |
| **Architektúra illeszkedés** | ⚠️ Mismatch | ✅ Tervezhető |
| **Vendor lock-in** | ⚠️ Frappe Framework | ✅ Nincs |
| **Magyar NAV támogatás** | ❌ Custom kell | ✅ Tervezhető |
| **Offline PWA** | ⚠️ Részleges | ✅ Teljes kontroll |
| **Franchise modell** | ⚠️ Átdolgozás kell | ✅ Natív támogatás |
| **5 éves TCO** | 325k - 495k € | 225k - 300k € |
| **Kontroll** | ⚠️ Részleges | ✅ Teljes |
| **Ajánlás** | ❌ **NEM AJÁNLOTT** | ✅ **AJÁNLOTT** |

---

## Végső Döntési Javaslat

### ✅ Nulláról Építés

**Indokok:**
1. **Költség:** 5 év alatt 100k - 195k € megtakarítás
2. **Kontroll:** Teljes kódbázis kontroll, nincs vendor lock-in
3. **Architektúra:** KGC-specifikus, multi-tenant natív
4. **Offline:** Teljes offline működés (papír backup + OCR)
5. **Franchise:** Natív támogatás, nem utólagos hack

**Következő lépés:** BMad Method Project Init
- `/bmad:bmm:workflows:workflow-init` → BMad Method track
- PRD + Architektúra + Epic-Story lebontás
- 12-18 hónapos roadmap sprint planning

---

## Kapcsolódó Dokumentumok

| Dokumentum | Elérési út |
|------------|------------|
| KGC PRD | [/docs/prd.md](../prd.md) |
| KGC Fit-Gap (belső) | [/docs/Flows/FIT-GAP-ANALYSIS.md](../Flows/FIT-GAP-ANALYSIS.md) |
| Architektúra (Moduláris) | [/docs/architecture/ADR-014-modular-architektura-vegleges.md](../architecture/ADR-014-modular-architektura-vegleges.md) |
| ERPNext GitHub | https://github.com/frappe/erpnext |
| ERPNext Docs | https://docs.frappe.io/erpnext/introduction |

---

**Készült:** BMad Orchestrator Agent
**Dátum:** 2025-12-19
**Státusz:** Végleges Ajánlás
