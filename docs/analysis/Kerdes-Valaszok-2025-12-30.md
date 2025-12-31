# KGC ERP - Követelmény Tisztázó Kérdések - Válaszok

**Dátum**: 2025-12-30
**Résztvevők**: Javo! + Mary (Analyst Agent)
**Cél**: 22 kritikus kérdés megválaszolása a diagramok és ADR-ek készítéséhez

---

## 📊 ÖSSZEFOGLALÓ

**Státusz**: ✅ Mind a 22 kérdés megválaszolva
**Döntések**: Tiszta iránymutatás minden főbb modulhoz
**Következő lépés**: ADR-ek írása + Excalidraw diagramok készítése

---

## 1. AI CHATBOT (KOKO) - 4 kérdés

### Q1: Chatbot scope
**Kérdés**: Mit tanuljon meg a Koko rendszer?
**Válasz**: ✅ **Minden terület**
- Bérlési folyamatok
- Szerviz információk
- Pénzügyi kérdések
- Termékinformációk

**Impact**: Teljes tudásbázis felépítése szükséges minden modulhoz

---

### Q2: Jóváhagyási workflow
**Kérdés**: Ki fogja jóváhagyni az új AI válaszokat?
**Válasz**: ✅ **Admin felhasználó (1 szintű)**

**Impact**: Egyszerűbb workflow, kevesebb approval complexity

---

### Q3: AI szolgáltatás
**Kérdés**: Milyen AI szolgáltatást használjunk?
**Válasz**: ✅ **Google Gemini Flash**

**Indok**:
- Managed service (kevesebb ops teher)
- Költséghatékony
- Gyors válaszidő
- Konzisztens a Google ökoszisztémával

**Impact**: ADR-016 döntés: Gemini Flash API integráció

---

### Q4: Multi-language támogatás
**Kérdés**: Milyen nyelveken működjön?
**Válasz**: ✅ **Magyar + Angol**

**Impact**:
- Tudásbázis dupla nyelven
- Prompt engineering mindkét nyelvre
- UI multi-language támogatás

---

## 2. BESZERZÉSI MODUL - 4 kérdés

### Q5: Szállítói API-k elérhetősége
**Kérdés**: Van már API hozzáférés a szállítókhoz?
**Válasz**: ✅ **Még nincs, de tervezve van mindegyikhez**
- Makita: Tervezett
- Bosch: Tervezett
- Hikoki: Tervezett
- Agroforg: Tervezett

**Impact**:
- API integráció fejlesztés szükséges
- Átmeneti scraping megoldás kell
- Adapter pattern minden szállítóhoz

---

### Q6: Web scraping engedélyezése
**Kérdés**: Megengedett-e scraping ha nincs API?
**Válasz**: ✅ **Igen, átmenetileg megengedett**

**Impact**:
- Scraping engine fejlesztés
- Rate limiting implementálás
- Fallback mechanism API hiányában

---

### Q7: Árfrissítési frekvencia
**Kérdés**: Milyen gyakran frissüljön az árinfó?
**Válasz**: ✅ **Hibrid (Naponta auto sync + manuális frissítés)**

**Impact**:
- Scheduled job (cron) naponta
- Admin override UI
- Change tracking árváltozásokhoz

---

### Q8: Robbantott táblák szinkronizálása
**Kérdés**: Hogyan frissüljenek a parts diagramok?
**Válasz**: ✅ **Hibrid (Auto sync API-ról + manuális override/upload)**

**Impact**:
- Auto import job
- File upload interface adminoknak
- Version control robbantott táblákhoz

---

## 3. 3D FOTÓZÁS - 4 kérdés

### Q9: Hardver (kamera)
**Kérdés**: Milyen eszközzel készülnek a 360° fotók?
**Válasz**: ✅ **Normál mobil telefon kamerája**

**Impact**:
- PWA mobil app fejlesztés
- Kamera permission handling
- Cross-platform support (iOS/Android)
- Nincs szükség speciális hardware-re

---

### Q10: Fotózási workflow - Ki fotózza?
**Kérdés**: Ki lesz felelős a fotózásért?
**Válasz**: ✅ **Bérlés kiadósor munkatársa** (minden kiadáskor/visszavételkor)

**Impact**:
- UX optimalizálás gyors fotózásra
- Training szükséges kiadósori dolgozóknak
- Offline capable fotózás (sync később)

---

### Q11: AI model típusa
**Kérdés**: Milyen AI megoldás a termékazonosításhoz?
**Válasz**: ✅ **D) Gemini Vision API**

**Indok**:
- Konzisztens a Koko chatbot Gemini Flash-sel
- Managed service
- Jó accuracy sérülésfelismeréshez

**Impact**: ADR-020 döntés: Gemini Vision API integráció

---

### Q12: Storage (tárhely igény)
**Kérdés**: Mennyi fotó tárhely szükséges?
**Válasz**: ✅ **D) Cloud storage, nincs limit** (skálázható)

**Impact**:
- Google Cloud Storage használata
- CDN fotókhoz
- Lifecycle policy (régi fotók archíválás)

---

## 4. EMAIL-SZÁL KEZELÉS - 3 kérdés

### Q13: Email provider
**Kérdés**: Milyen email rendszert használtok?
**Válasz**: ✅ **A) Gmail / Google Workspace**

**Impact**:
- Gmail API integráció
- OAuth2 authentication
- Thread tracking Gmail-specifikus logikával

**ADR kapcsolat**: ADR-018 (Email-szál feldolgozás)

---

### Q14: Automatizálás szintje
**Kérdés**: Mennyire automatizált legyen az email feldolgozás?
**Válasz**: ✅ **D) Hibrid** (Gmail Rules + API ahol szükséges)

**Impact**:
- Basic routing Gmail filters-szel
- Complex parsing Gmail API + custom logic
- Fallback manual handling

---

### Q15: Email címek száma
**Kérdés**: Hány email címről érkeznek számlák?
**Válasz**: ✅ **B) 2-3 inbox** (beszerzés, pénzügy, egyéb)

**Impact**:
- Multi-mailbox monitoring
- Routing logic inbox alapján
- Shared mailbox permissions

---

## 5. HELYKÖVETÉS (RAKTÁR) - 3 kérdés

### Q16: Fizikai raktár méret
**Kérdés**: Mekkora a raktár?
**Válasz**: ✅ **C + D) Nagy raktár (100+ polc, 2000+ slot) + Több lokáció** (franchise)

**Impact**:
- Multi-tenant architecture kritikus
- Location-aware inventory
- Cross-location transfer flow
- Scalability requirements magasak

**ADR kapcsolat**: ADR-021 (Helykövetés hierarchia)

---

### Q17: Vonalkód nyomtatás
**Kérdés**: Milyen nyomtatókkal készülnek a vonalkódok?
**Válasz**: ✅ **A + E) Dedikált label printer tervezve** (Zebra/Brother, de még nincs hardver)

**Impact**:
- Zebra/Brother driver integráció
- Print server setup
- Label template designer UI
- Hardware beszerzés tervezése

---

### Q18: Mobil eszközök vonalkód scaneléshez
**Kérdés**: Mivel történik a beolvasás?
**Válasz**: ✅ **A + B) Kézi scanner + Mobil app** (vegyes használat)

**Impact**:
- Dual interface support
- Barcode scanner SDK integráció
- PWA kamera-based scanning
- Hardware compatibility testing

**ADR kapcsolat**: ADR-022 (Vonalkód stratégia)

---

## 6. HELYESÍTŐ SZÁMLA - 2 kérdés

### Q19: Könyvelési gyakorlat
**Kérdés**: Hogyan kezeli jelenleg a könyvelés a helyesítő számlákat?
**Válasz**: ✅ **D) Nincs még kialakult gyakorlat** (szabadon tervezhető)

**Impact**:
- Zöldmezős tervezés
- Best practice szerinti megoldás választása
- Könyvelői egyeztetés szükséges később

**ADR kapcsolat**: ADR-023 (Credit note handling)

---

### Q20: Számlázz.hu credit note támogatás
**Kérdés**: Támogatja-e a Számlázz.hu a credit note-okat?
**Válasz**: ✅ **B) Részben támogatja** (manual workaround szükséges)

**Impact**:
- Számlázz.hu API limitációk kezelése
- Custom credit note flow
- Workaround dokumentálása

---

## 7. PRIORITIZÁLÁS ÉS TIMELINE - 2 kérdés

### Q21: MVP határok
**Kérdés**: Mi a minimum funkció launch-hoz?
**Válasz**: ✅ **G) Full scope - Minden új funkció**

**MVP tartalom**:
- ✅ Bérlés
- ✅ Szervíz
- ✅ Beszerzés modul
- ✅ AI Chatbot (Koko)
- ✅ 3D Fotózás
- ✅ Email-szál kezelés
- ✅ Helykövetés (3-szintű)

**Impact**:
- Ambiciózus scope
- Fázisos fejlesztés ajánlott
- Parallel team work szükséges
- Tight integration testing

---

### Q22: Launch timeline
**Kérdés**: Mikor legyen az éles indulás?
**Válasz**: ✅ **B) 3-6 hónap** (kiérlelt verzió, teljes scope)

**Impact**:
- Realistic timeline full scope-hoz
- Sprint planning: 6-12 sprint (~2 hetes sprintek)
- Parallel development streams
- Early beta testing szükséges

---

## 📋 KÖVETKEZŐ LÉPÉSEK

### 1. ADR Dokumentumok Írása (Architect agent)
**7 új ADR készítendő:**

1. **ADR-016**: AI Chatbot (Koko) Architektúra
   - Döntés: Gemini Flash API
   - Magyar + Angol támogatás
   - Admin approval workflow

2. **ADR-017**: Szállítói API Integráció Stratégia
   - Adapter pattern minden szállítóhoz
   - Scraping fallback
   - Hibrid árfrissítés (naponta + manual)

3. **ADR-018**: Email-Szál Feldolgozás
   - Gmail API
   - Hibrid (Rules + API)
   - 2-3 inbox monitoring

4. **ADR-019**: OCR Megoldás Számlákhoz
   - (További egyeztetés szükséges)

5. **ADR-020**: 3D Fotózás és Termékazonosítás
   - Gemini Vision API
   - Mobil app (PWA)
   - Cloud Storage

6. **ADR-021**: Helykövetés (Polc-Doboz-Raklap) Hierarchia
   - Multi-tenant architecture
   - Location-aware inventory
   - 100+ polc, 2000+ slot scale

7. **ADR-022**: Vonalkód vs QR Kód Stratégia
   - Hibrid (scanner + mobil app)
   - Zebra/Brother label printer
   - QR matrix nyomtatás

**3 frissítendő ADR:**
- ADR-002: Deployment (offline email sync, OCR local)
- ADR-014: Moduláris architektúra (+Beszerzés, +AI modul)
- ADR-015: CRM/Support integráció (+Koko chatbot)

---

### 2. Excalidraw Diagramok (create-excalidraw-* workflows)

**13 új diagram:**
1. Koko System Architecture
2. Koko Learning Loop
3. Koko User Journey
4. Beszerzési Teljes Folyamat
5. Szállítói API Integráció
6. Email-Szál Feldolgozás
7. Szállítólevél vs Számla Szétválasztás
8. 360° Fotó Capture Workflow
9. AI Termékazonosítás Pipeline
10. Helykövetés Hierarchia (ER Diagram)
11. Vonalkódmátrix Nyomtatás Workflow
12. Helyesítő Számla (Credit Note) Flow
13. Számla Email-szál Routing

**5 frissítendő diagram:**
1. Bérlés Master Flow (+360° fotó)
2. Szerviz Flow (+bérlésszám, +helykód, +vonalkódmátrix)
3. Pénzügy Flow (+email-szálak, +OCR, +helyesítő)
4. Visszavétel Flow (+360° compare, +AI sérülés)
5. Raktár Flow (polc → polc+doboz+raklap)

---

### 3. HTML v7 Generálás (Tech-Writer agent)
- Fájl: `KGC-ERP-v7-Final-2025-12-30.html`
- Minden diagram beágyazva
- Portable (offline működik)

---

### 4. PRD Frissítés (PM agent)
- Végleges követelmények bevezetése
- Új modulok dokumentálása
- Technikai döntések rögzítése

---

## 🎯 PROJEKT PARAMÉTEREK

**Scope**: Full (minden új funkció)
**Timeline**: 3-6 hónap
**Team size**: TBD
**Tech stack**:
- Backend: NestJS + PostgreSQL
- Frontend: PWA (offline-first)
- AI: Google Gemini (Flash + Vision)
- Email: Gmail API
- Storage: Google Cloud Storage
- Printing: Zebra/Brother label printers
- Mobile: PWA + Scanner SDK

---

**Dokumentum vége**

**Készítette**: Mary (Analyst Agent)
**Jóváhagyta**: Javo!
**Következő**: ADR írás (Architect agent)
