# KGC ERP v7.0 - PRD Discovery Q&A Session

**Dátum:** 2026-01-01
**Résztvevők:** Javo! (Product Owner) + PM Agent (Facilitator)
**Cél:** PRD v2.0 (BMad Method Reset) követelmények tisztázása

---

## 📋 Beszélgetés Összefoglalója

Ez a dokumentum tartalmazza a teljes PRD discovery session során felmerült kérdéseket és Javo! válaszait. Ezek a válaszok alapozzák meg a PRD v2.0 tartalmat.

---

## 1️⃣ PROJEKT IRÁNY ÉS FÓKUSZ

### Q1: Mi a projekt fejlesztési iránya?
**PM Agent kérdés:** "Melyik irányba szeretnél elindulni a PRD-vel?"
- Új funkcionalitást építeni (pl. HR modul aktiválása, CRM kiegészítések)?
- Meglévő Core modulokat továbbfejleszteni (Bérlés, Szerviz, Inventory)?
- Plugin integrációkat finomhangolni (Support chatbot, CRM workflow, HR jelenlét)?
- Új AI funkciókat hozzáadni (OCR számlák, 3D fotó)?

**Javo! válasz:** `2` (Meglévő Core modulok továbbfejlesztése)

---

## 2️⃣ FŐ PROBLÉMA ÉS PRIORITÁSOK

### Q2: Mi a fő fájdalom pont?
**PM Agent kérdés:** "Mi a fő fájdalom pont amit meg szeretnél oldani ezekben a modulokban?"

**Javo! válasz:**
- **Fő probléma:** Az áruk nyomon követése
- **Prioritás:** Mindhárom Core modul (Bérlés, Szerviz, Értékesítés)
- **Leggyakoribb műveletek:** Árumozgatás
- **Legnagyobb kihívás:** Raktározási rendszer - áruk nyomonkövetése

**Részletezés:**
- Nehézkes árumozgatás nyilvántartása mindhárom Core modulban
- Raktározási rendszer nem támogatja megfelelően a real-time inventory tracking-et
- Multi-warehouse környezetben bizonytalan az áruk pontos helyzete

---

## 3️⃣ KLASSZIFIKÁCIÓ VALIDÁLÁS

### Q3: Project Type klasszifikáció
**PM Agent elemzés:** SaaS B2B Platform

**Indokok:**
- Multi-tenant architektúra (franchise partners)
- Dashboard/UI több role-hoz (pénztáros, admin, franchise)
- Subscription/transaction-based pricing modell
- Enterprise-level integrations (Chatwoot, Twenty, Horilla)

**Javo! validálás:** ✅ Jóváhagyva

---

### Q4: Domain klasszifikáció
**PM Agent elemzés:** Equipment Rental & Service Management - HIGH Complexity

**Indokok:**
- Multi-tenant franchise architektúra
- Offline-first működés (ADR-002)
- Real-time inventory tracking több warehouse-ban
- Összetett üzleti folyamatok (~60 lépés bérlésben)
- Kritikus integrációk (NAV, MyPos, AI szolgáltatások)
- GDPR compliance

**Javo! validálás:** ✅ Jóváhagyva

---

### Q5: Offline működés prioritása
**PM Agent kérdés:** "Az offline működés prioritás?"

**Javo! válasz:** `nem, SaaS a lényeg`

**Hatás a klasszifikációra:**
- ❌ Offline-first NEM prioritás (ADR-002 alacsonyabb prioritású)
- ✅ SaaS modell központi szerep
- ✅ Online-first deployment stratégia
- ✅ Real-time szinkronizáció fontosabb mint offline működés

---

## 4️⃣ AMI KÜLÖNLEGESSÉ TESZI A TERMÉKET

### Q6: Egyedi jellemzők validálása
**PM Agent elemzés:**

1. **Inventory-Centric Architektúra SaaS Modellben**
   - Minden modul (Bérlés, Szerviz, Értékesítés) központi inventory tracking-re épül
   - Real-time árumozgatás nyilvántartás multi-warehouse környezetben
   - Serial number tracking + helykód rendszer (K-P-D: Kommandó-Polc-Doboz)
   - Vonalkód/QR kód integráció gyors árumozgatáshoz

2. **Bérlés-Specifikus Workflow**
   - Bérgép státusz lifecycle (bent → kint → szerviz → bent)
   - Tartozékok kezelése (töltő, akkumulátor)
   - Kaució + visszatartás + késedelmi díj automatizálás

3. **Offline-First PWA**
   - Működés áramszünet/internet kimaradás esetén
   - Lokális adattárolás + szinkronizáció

4. **Franchise-Ready Multi-Tenancy**
   - Központosított inventory láthatóság
   - Partner-specifikus árképzés és kedvezmények
   - RLS (Row Level Security) adatszeparáció

**Javo! korrekció:**
- ❌ "Az offline működés NEM prioritás, SaaS a lényeg"

**Frissített lista:**
1. ✅ Inventory-Centric Architektúra SaaS Modellben (változatlan)
2. ✅ Franchise-Ready Multi-Tenancy (változatlan)
3. ✅ AI-Driven Automatizáció (Koko chatbot, OCR, 3D fotó AI)
4. ✅ Bérlés-Specifikus Workflow (változatlan)
5. ✅ Transaction-Based SaaS Pricing

**Javo! validálás:** ✅ Jóváhagyva frissített listával

---

## 5️⃣ MEGLÉVŐ DOKUMENTÁCIÓ INTEGRÁLÁSA

### Q7: Horilla HR modul információk
**PM Agent kérdés:** "A Horilla HR megoldásról nem látok infót, ami ebben a mappában van `/root/LABS/KGCERP/KGC-2/docs/ERP`, ezeket az infókat is tartalmazd?"

**Javo! válasz:** `igen`

**Eredmény:**
- ✅ ERP dokumentáció átmásolva `reference/erp-modules/` mappába
- ✅ 4 ERP modul dokumentáció integrálva:
  - `ERP/README.md` - Modul áttekintés
  - `ERP/HR/KGC-HR-INTEGRATION-ARCHITECTURE.md` - Horilla HRMS integráció
  - `ERP/CRM/KGC-CRM-INTEGRATION-ARCHITECTURE.md` - Twenty CRM integráció
  - `ERP/Inventory/INVENTORY-INTEGRATION-ARCHITECTURE.md` - Inventory modul teljes spec

**Új információk Horilla HR-ről:**
- Django-alapú, nyílt forráskódú HR menedzsment rendszer
- LGPL-2.1 licenc (kereskedelmi használat engedélyezett)
- 3 prioritási modul: Attendance Tracking, Leave Management, Employee Management
- Költség: $5-30/hó franchise partner-enként (legolcsóbb plugin modul)
- Plugin architektúra - opcionális, ki-bekapcsolható

---

## 6️⃣ PRIMARY USERS ÉS PRICING

### Q8: Primary users meghatározása
**Korábban megadott információ (Option B választáskor):**

**Javo! válasz:**
- **Primary users:** Pénztáros eladó + Központi admin

**Szerepkörök:**
- **Pénztáros eladó:** Napi árumozgatás, bérlés kiadás/visszavétel, raktári műveletek
- **Központi admin:** Inventory oversight, multi-warehouse kezelés, franchise koordináció

---

### Q9: Pricing modell
**Korábban megadott információ (Option B választáskor):**

**Javo! válasz:** `Transaction-based pricing`

**Implementáció:**
- Rugalmas árképzés bérlési/szerviz/értékesítési tranzakciók alapján
- Franchise partnerek pay-per-use modellje
- DevOps-monitored metrics napi review-val
- Transparent cost tracking partner-szinten

---

### Q10: Success metrics mérési stratégia
**Korábban megadott információ (Option B választáskor):**

**Javo! válasz:** `DevOps felelős a monitoringért, kezdetben napi szinten nézzük a metrikákat`

**Implementáció:**
- DevOps monitoring infrastructure
- Napi metrika review kezdetben
- Később opcionális: heti/havi aggregált review

---

## 7️⃣ SIKERKRITÉRIUMOK (FOLYAMATBAN)

### Q11: Felhasználói siker - "aha!" pillanat (Pénztáros eladó)
**PM Agent kérdés:** "Mi lenne az a pillanat amikor a pénztáros eladó azt mondja 'végre, ez az amit vártam!'?"

**Opciók:**
- A) Vonalkód beolvasás → azonnali helymeghatározás < 2 másodperc?
- B) Árumozgatás rögzítése < 30 másodperc vs. régi rendszer 3-5 perc?

**Javo! válasz:** `B) Árumozgatás rögzítése < 30 másodperc` ✅

**Hatás:**
- **Jelenlegi rendszer:** Árumozgatás rögzítése ~3-5 perc
- **v7.0 cél:** < 30 másodperc (10x gyorsabb!)
- **"Aha!" pillanat:** Vonalkód scan → gyors helykód bevitel → mentés < 30 mp
- **Mérési metrika:** Átlagos árumozgatási művelet ideje

---

### Q12: Felhasználói siker - "aha!" pillanat (Központi admin)
**PM Agent kérdés:** "Mi lenne az a pillanat amikor a központi admin azt mondja 'most már látom az egész képet!'?"

**Opciók:**
- A) Real-time inventory láthatóság az összes warehouse-ban?
- B) Áruk pontos helye (K-P-D kód) egy kattintással?

**Javo! válasz:** `B) Áruk pontos helye (K-P-D kód) egy kattintással` ✅

**Hatás:**
- **Jelenlegi rendszer:** Áruk helye bizonytalan vagy lassú lekérdezés
- **v7.0 cél:** K-P-D kód (Kommandó-Polc-Doboz) egy kattintással látható
- **"Aha!" pillanat:** Dashboard → cikk keresés → azonnal látja pontos helyet minden warehouse-ban
- **Mérési metrika:** Inventory lookup response time + helykód pontosság

---

### Q13: Üzleti siker - Franchise partnerek timeline
**PM Agent kérdés:** "Mennyi idő alatt szeretnéd elérni a 10+ franchise partnert?"

**Opciók:**
- A) 3 hónap?
- B) 6 hónap?
- C) 12 hónap?

**Javo! válasz:** `3 hónap` ✅

**Hatás:**
- **Üzleti cél:** 10+ franchise partner csatlakozása első 3 hónapban
- **Agresszív timeline:** Gyors piacra lépés szükséges
- **Go-to-market stratégia:** Intenzív értékesítési kampány az induláskor
- **Mérési metrika:** Franchise partnerek száma / hónap

---

### Q14: Üzleti siker - White Label értékesítés timeline
**PM Agent kérdés:** "A White Label értékesítés (5+ licenc) realisztikus első évre, vagy inkább 2. év?"

**Javo! válasz:** `NEM prioritás - Phase 2 vagy később, esetleg nem is lesz` ✅

**Hatás:**
- **MVP fókusz:** Franchise partner onboarding (3 hónap, 10+ partner)
- **White Label:** Későbbi iteráció vagy elvetett funkcionalitás
- **Üzleti stratégia:** Saját franchise hálózat építése elsődleges, licenc értékesítés másodlagos
- **Scope egyszerűsítés:** Kevesebb komplexitás az MVP-ben (nincs white-label customization layer)

---

### Q15: Üzleti siker - Kritikus metrika
**PM Agent kérdés:** "Mi a kritikus üzleti metrika amivel méred hogy 'működik'?"

**Opciók:**
- Tranzakciók száma / hó?
- Partner aktivitás (hány tranzakció / partner)?
- Árumozgatási műveletek száma / nap?

**Javo! válasz:** ⏳ KÉSŐBBI VÁLASZ (Step 3 folytatása később)

---

### Q16: Műveletek gyorsítása - Konkrét számok
**PM Agent kérdés:** "50%-kal gyorsabb műveletek - Konkrétan mit mérsz?"

**Opciók:**
- Bérlés kiadási folyamat: jelenleg ~X perc → célként Y perc?
- Árumozgatás rögzítése: jelenleg ~X perc → célként Y perc?
- Inventory lekérdezés: jelenleg ~X másodperc → célként Y másodperc?

**Javo! válasz:** ⏳ KÉSŐBBI VÁLASZ (Step 3 folytatása később)

---

## 8️⃣ DOMAIN-SPECIFIC COMPLIANCE ÉS REGULATORY KÖVETELMÉNYEK (KÉSŐBBI VÁLASZ)

### Q17: NAV Online Számlázás
**PM Agent kérdés:** "NAV Online Számlázás integráció részletei?"

**Opciók:**
- Kötelező magyar jogszabályi integráció státusza?
- Van már NAV API tapasztalat/dokumentáció?
- Real-time számlakiállítás kell vagy batch feldolgozás?

**Javo! válasz:** ⏳ KÉSŐBBI VÁLASZ (Domain Exploration)

---

### Q18: GDPR Compliance
**PM Agent kérdés:** "GDPR adatvédelmi követelmények mélysége az MVP-ben?"

**Opciók:**
- Milyen mélységű GDPR compliance kell az MVP-ben?
- Kell-e explicit user consent management?
- Cascade delete automatikus vagy manuális jóváhagyással?

**Javo! válasz:** ⏳ KÉSŐBBI VÁLASZ (Domain Exploration)

---

### Q19: Payment Compliance (PCI DSS)
**PM Agent kérdés:** "MyPos payment integráció compliance szintje?"

**Opciók:**
- MyPos integráció mélysége: csak kaució blokkolás vagy teljes payment processing?
- PCI DSS Level (pl. Level 4 SAQ A-EP) - self-assessment elég?
- Tároljátok-e kártyaadatokat vagy csak MyPos tokeneket?

**Javo! válasz:** ⏳ KÉSŐBBI VÁLASZ (Domain Exploration)

---

### Q20: Franchise Multi-Tenancy Security
**PM Agent kérdés:** "Franchise partnerek közötti adatszeparáció és láthatósági szabályok?"

**Opciók:**
- Partner-ok láthatják-e egymás inventory-jét? (cross-tenant visibility)
- RLS PostgreSQL szinten elég vagy alkalmazás szinten is kell permission check?
- Van-e "super admin" aki minden partnert lát?

**Javo! válasz:** ⏳ KÉSŐBBI VÁLASZ (Domain Exploration)

---

### Q21: Equipment Liability & Insurance
**PM Agent kérdés:** "Bérleti eszköz felelősség és biztosítási követelmények?"

**Opciók:**
- Bérleti szerződés digitális aláírás kell?
- Sérülések fotó dokumentálás + AI detection (ADR-020) elegendő?
- Biztosítási integráció kell vagy csak manual claim filing?

**Javo! válasz:** ⏳ KÉSŐBBI VÁLASZ (Domain Exploration)

---

### Q22: Financial Regulations (Kaució, Késedelmi Díj)
**PM Agent kérdés:** "Pénzügyi automatizálás szabályai (kaució, késedelmi díj)?"

**Opciók:**
- Késedelmi díj automatikus számítás szabályai (%-os vagy fix összeg)?
- Kaució visszatérítés max ideje (pl. 30 nap)?
- Pénzügyi audit trail: minden tranzakcióhoz immutable log?

**Javo! válasz:** ⏳ KÉSŐBBI VÁLASZ (Domain Exploration)

---

## 9️⃣ SAAS B2B PLATFORM SPECIFIKUS KÖVETELMÉNYEK (KÉSŐBBI VÁLASZ)

### Q23: RBAC Permission Matrix - Role-specifikus jogosultságok

**PM Agent kérdés:** "Pontosan milyen permission-ök járnak a 4 fő role-hoz?"

**Kontextus:**
A PRD-ben 4 fő role van:
1. **Pénztáros eladó** (Kata journey)
2. **Központi admin** (László journey)
3. **Franchise partner tulajdonos** (Péter journey)
4. **DevOps admin** (Anna journey)

**Opciók:**
- **Pénztáros eladó:**
  - READ: Saját warehouse inventory, bérlési tranzakciók
  - WRITE: Árumozgatás rögzítés, K-P-D kód bevitel, bérlés kiadás/visszavétel
  - NO ACCESS: Központi admin dashboard, más franchise partnerek adatai, pricing config

- **Központi admin:**
  - READ: Minden warehouse inventory, cross-warehouse analytics, franchise partner dashboards
  - WRITE: Cross-warehouse transfer workflow, warehouse config, inventory oversight
  - NO ACCESS: DevOps admin funkciók (RLS schema creation, tenant provisioning)

- **Franchise partner tulajdonos:**
  - READ: Saját partner bevételi dashboard, készlet analytics, transaction breakdown
  - WRITE: Warehouse konfigurálás (K-P-D rendszer módosítás), user management saját partneren belül
  - NO ACCESS: Más partnerek adatai, központi admin funkciók, pricing tier változtatás

- **DevOps admin:**
  - READ: Tenant status, partner onboarding history, system health metrics
  - WRITE: Franchise onboarding wizard, RLS schema creation, tenant provisioning, pricing tier assignment
  - NO ACCESS: Franchise partnerek üzleti adatai (bevétel, inventory details) - csak metadata

**Javo! válasz:** ⏳ KÉSŐBBI VÁLASZ (SaaS B2B Deep Dive)

**Hatás:**
- RBAC matrix dokumentálása a PRD-ben
- PostgreSQL RLS policy definíciók (ADR-001 kiegészítése)
- Frontend route protection logika
- API endpoint permission middleware

---

### Q24: Subscription Tiers - Transaction-based pricing részletei

**PM Agent kérdés:** "Pontosabban milyen tier-eket látsz a transaction-based pricing modellben?"

**Opciók:**
- **Model A - Tisztán transaction-based (nincs fix díj):**
  - Bérlés tranzakció: 500 Ft/db
  - Szerviz munkalap: 300 Ft/db
  - Értékesítés: 200 Ft/db
  - Nincs havi minimum, pay-as-you-go

- **Model B - Tier-alapú (fix díj + per-transaction):**
  - **Startup tier:** 0-100 tranzakció/hó = 20k Ft fix + 500 Ft/tranzakció fölötte
  - **Standard tier:** 101-500 tranzakció/hó = 50k Ft fix + 300 Ft/tranzakció fölötte
  - **Enterprise tier:** 500+ tranzakció/hó = egyedi árazás

- **Model C - AI usage tier + transaction pricing:**
  - **Startup tier:** 100 AI query/hó + pay-per-transaction
  - **Standard tier:** 1000 AI query/hó + pay-per-transaction (kedvezményes tranzakció díj)
  - **Enterprise tier:** unlimited AI + pay-per-transaction (legkedvezőbb díj)

**Javo! válasz:** ⏳ KÉSŐBBI VÁLASZ (SaaS B2B Deep Dive)

**Hatás:**
- Pricing strategy dokumentum kidolgozása (pricing-strategy.md)
- Metering service specifikáció (tranzakció számláló logika)
- Billing dashboard design (partner látja a breakdown-t)
- Tier upgrade/downgrade workflow

---

### Q25: Integration List - Prioritási sorrend és MVP scope

**PM Agent kérdés:** "Melyik integrációk CORE (kötelező MVP-ben) és melyik PLUGIN (opcionális)?"

**Kontextus:**
A következő integrációk szerepelnek az ADR-ekben:
1. **NAV Online Számlázás** (ADR-013) - Kötelező, magyar jogszabály
2. **MyPos Payment** (ADR-005) - Kaució blokkolás
3. **Chatwoot Support** (ADR-015) - Multi-channel support
4. **Twenty CRM** (ADR-015) - Lead tracking, marketing
5. **Horilla HRMS** (ADR-015) - Jelenlét, szabadság
6. **Google Gemini AI** (ADR-016-020) - Chatbot, OCR, Vision, Email parsing
7. **Beszállító API-k** (ADR-017) - Makita, Stihl, Hikoki

**Javasolt bontás:**

**CORE integrations (MVP must-have):**
- ✅ NAV Online Számlázás (jogszabályi kötelezettség)
- ✅ MyPos Payment (kaució blokkolás - bérlés core funkció)
- ✅ Gemini AI Koko Chatbot (ADR-016 - Innovation core)
- ❓ Beszállító API-k (ADR-017 - fontos, de fallback: manuális CSV import)

**PLUGIN integrations (Phase 2 vagy opcionális):**
- 🔌 Chatwoot Support (ADR-015 - Support modul opcionális)
- 🔌 Twenty CRM (ADR-015 - CRM modul opcionális)
- 🔌 Horilla HRMS (ADR-015 - HR modul opcionális)
- 🔌 Gemini OCR/Vision/Email (ADR-018-020 - AI Extended features)

**Javo! válasz:** ⏳ KÉSŐBBI VÁLASZ (SaaS B2B Deep Dive)

**Hatás:**
- MVP scope finalizálása
- Integration priority roadmap
- PLUGIN modulok ki/bekapcsolhatósága (ADR-014 Modular Architecture)
- Franchise partner pricing (ha PLUGIN modulokat használ → extra díj?)

---

### Q26: Compliance Requirements - MVP vs. Phase 2

**PM Agent kérdés:** "Melyik compliance területek KRITIKUSAK az MVP-ben és melyik tolható Phase 2-re?"

**Kontextus:**
Domain Exploration Q17-Q22 kérdéseket gyűjtöttük (NAV, GDPR, PCI DSS, Multi-tenancy security, Equipment liability, Financial regulations).

**Javasolt MVP compliance scope:**

**KRITIKUS (MVP must-have):**
- ✅ **NAV Online Számlázás** - Magyar jogszabály, nincs kompromisszum
- ✅ **GDPR alapok** - User data delete, cascade delete, consent management
- ✅ **Audit Trail** - Immutable logging (ADR-006) minden tranzakcióhoz
- ✅ **Multi-tenancy RLS** - Franchise partner izoláció (ADR-001) - security critical

**KÖZEPES PRIORITÁS (MVP nice-to-have vagy Phase 2):**
- ❓ **PCI DSS** - MyPos integráció esetén tokenization elég MVP-ben? Teljes compliance Phase 2?
- ❓ **Equipment Liability dokumentáció** - AI-powered fotó sérülésdetektálás (ADR-020) elegendő vagy digitális szerződés aláírás is kell?

**ALACSONY PRIORITÁS (Phase 2):**
- ⏸️ **Financial regulations részletes audit** - Kaució/késedelmi díj alapvető logika MVP-ben, részletes pénzügyi audit Phase 2
- ⏸️ **ISO 27001 compliance** - Ha enterprise tier-t akarunk később (nagy cégek követelménye)

**Javo! válasz:** ⏳ KÉSŐBBI VÁLASZ (SaaS B2B Deep Dive)

**Hatás:**
- Compliance roadmap kidolgozása
- MVP scope csökkentése vagy növelése compliance alapján
- Phase 2 planning (mely compliance területek tolhatók)
- Franchise partner compliance transparency (milyen szabályoknak felelnek meg)

---

## 📊 DÖNTÉSEK ÖSSZEFOGLALÓJA (EDDIG)

| Kérdés | Válasz | Státusz |
|--------|--------|---------|
| **Projekt irány** | Meglévő Core modulok továbbfejlesztése | ✅ Rögzítve |
| **Fő probléma** | Áruk nyomon követése | ✅ Rögzítve |
| **Prioritás** | Mindhárom Core modul, főleg Inventory | ✅ Rögzítve |
| **Leggyakoribb műveletek** | Árumozgatás | ✅ Rögzítve |
| **Project Type** | SaaS B2B Platform | ✅ Rögzítve |
| **Domain** | Equipment Rental & Service - HIGH complexity | ✅ Rögzítve |
| **Offline működés** | NEM prioritás, SaaS a lényeg | ✅ Rögzítve |
| **ERP dokumentáció** | Integrálva (HR, CRM, Inventory) | ✅ Rögzítve |
| **Primary users** | Pénztáros eladó + Központi admin | ✅ Rögzítve |
| **Pricing modell** | Transaction-based | ✅ Rögzítve |
| **Metrics stratégia** | DevOps monitoring, napi review | ✅ Rögzítve |
| **Felhasználói siker (pénztáros)** | "aha!" pillanat definíció | ⏳ Folyamatban |
| **Felhasználói siker (admin)** | "aha!" pillanat definíció | ⏳ Folyamatban |
| **Franchise partner timeline** | 10+ partner időkeret | ⏳ Folyamatban |
| **White Label timeline** | 5+ licenc időkeret | ⏳ Folyamatban |
| **Kritikus üzleti metrika** | Mérési fókusz | ⏳ Folyamatban |
| **Műveletek gyorsítása** | Konkrét számok (perc/másodperc) | ⏳ Folyamatban |

---

## 🎯 KÖVETKEZŐ LÉPÉSEK

**Aktuális workflow állapot:**
- ✅ Step 1: Workflow Initialization - Kész
- ✅ Step 2: Project & Domain Discovery - Kész
- ⏳ Step 3: Success Criteria Definition - **FOLYAMATBAN**
- ⏹️ Step 4-11: Várakozik

**Várakozó válaszok (Q11-Q16):**
A Success Criteria Definition befejezéséhez szükséges még 6 kérdés megválaszolása a felhasználói és üzleti sikerkritériumokról.

---

**Dokumentum vége** - Frissítve: 2026-01-01
