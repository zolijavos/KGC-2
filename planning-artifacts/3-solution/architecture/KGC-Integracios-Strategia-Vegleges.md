# KGC Integrációs Stratégia - Végleges Megoldás

**Dokumentum típus:** Architekturális Döntés (Techno-Funkcionális)
**Verzió:** 2.0
**Dátum:** 2025-12-20
**Utolsó frissítés:** 2025-12-20 (Horilla HR + Pénzügyi modul hozzáadva)
**Státusz:** ⏳ Jóváhagyásra vár

---

## Vezetői Összefoglaló

A KGC ERP rendszer **öt külső rendszerrel/modullal** integrálódik az optimális működés érdekében:

1. **Twenty CRM** - Ügyfélkapcsolat kezelés (értékesítés, deals, partnertörténet)
2. **Chatwoot** - Ügyfélszolgálati platform (support ticketek, beszélgetések)
3. **Horilla HR** - Humánerőforrás menedzsment (dolgozók, jelenlét, szabadság, toborzás)
4. **Custom Chat** - Belső dolgozói kommunikáció (valós idejű üzenetek)
5. **KGC Finance + Számlázz.hu** - Egyedi pénzügyi modul (teljesítések, ÁFA, leltár) + NAV integráció

**Választott megoldás:** Hibrid iframe beágyazás (Twenty/Chatwoot/Horilla) + API integráció + forráskód módosítás + Egyedi pénzügyi modul (Számlázz.hu SaaS)

**Becsült implementációs idő:** 5.5 hét
**Becsült kezdeti költség:** ~50,400 €
**3 éves TCO:** ~91,000 € (vs ~240,000-300,000 € teljes natív)
**Költségmegtakarítás:** ~150,000-210,000 € (70%)
**Várható felhasználói elfogadás:** Magas (egységes felület, gyors működés, NAV compliance)

---

## 1. Üzleti Kontextus

### Használati Arányok
- **80%** - KGC ERP használat (bérlés, szerviz, áruház, pénzügy)
- **15%** - CRM használat (értékesítés, deal tracking)
- **5%** - Support használat (ügyfélszolgálati ticketek)
- **Alkalmanként** - HR használat (dolgozói adminisztráció, jelenlét, szabadság)

### Kulcs Követelmények
✅ Gyors implementáció (franchise hálózat indulás előtt)
✅ Egységes vizuális megjelenés (KGC brand)
✅ Hatékony működés (egyszerűség > komplexitás)
✅ Skálázhatóság (100+ felhasználó 1 éven belül)
✅ Alacsony karbantartási igény (IT fókusz az ERP-n marad)

---

## 2. Integrációs Stratégia

### 2.1 Twenty CRM Integráció

**Megközelítés:** iframe beágyazás + forráskód testreszabás

**Mit jelent ez a gyakorlatban?**
- A Twenty CRM teljes funkciókészlete elérhető a KGC felületén belül
- A Twenty kinézete KGC design-ra módosítva (kék színvilág, KGC logo)
- Egyetlen bejelentkezés (SSO) - felhasználó nem kell kétszer bejelentkezzen
- Partner adatok szinkronizálva (KGC → Twenty, 5 percenként)

**Felhasználói élmény:**
```
Partner oldal megnyitása (Kovács János)
├─ Bal oldal: KGC adatok (bérletek, szerviz előzmények)
└─ Jobb oldal: Twenty CRM panel
    ├─ Deals (értékesítési lehetőségek)
    ├─ Jegyzetek
    ├─ Feladatok
    └─ Aktivitások timeline

Vizuális érzet: Egységes KGC felület (Twenty is kék design)
```

**Miért ezt választottuk?**
- ✅ **Gyorsaság:** 1 hét implementáció vs 6-8 hónap egyedi CRM építés
- ✅ **Teljesség:** Twenty összes funkciója elérhető (email, automation, riportok)
- ✅ **Karbantartás:** Twenty fejlődik → KGC automatikusan új funkciókat kap
- ✅ **Költség:** ~6,000 € vs ~63,000 € (egyedi CRM esetén)

**Kompromisszum:**
- ⚠️ iframe = külön panel (nem teljesen natív KGC komponens)
- ✅ DE: 85% brand egységesség (theme módosítással)

---

### 2.2 Chatwoot Support Integráció

**Megközelítés:** iframe beágyazás + forráskód testreszabás

**Mit jelent ez a gyakorlatban?**
- Chatwoot support panel beágyazva a KGC partner oldalakba
- KGC design (kék színek, KGC logo)
- SSO (egyetlen bejelentkezés)
- Partner szinkronizáció (KGC → Chatwoot, 5 percenként)

**Felhasználói élmény:**
```
Partner oldal → "Support" tab
├─ Korábbi beszélgetések listája
├─ Nyitott ticketek (státusz színkóddal)
├─ Új beszélgetés indítása gomb
└─ Canned responses (gyors válaszok)

Vizuális érzet: KGC zöld-kék design
```

**Miért ezt választottuk?**
- ✅ **Funkcionalitás:** Chatwoot érett platform (canned responses, assignments, SLA)
- ✅ **Költség:** ~3,000 € vs ~18,000 € (egyedi support UI építés)
- ✅ **Karbantartás:** Chatwoot bug fix-ek automatikusan bekerülnek

**Kompromisszum:**
- ⚠️ Support használat alacsony (5%) → iframe tökéletes erre
- ✅ Nincs szükség fancy custom UI-ra

---

### 2.3 Custom Belső Chat (Valós Idejű)

**Megközelítés:** Teljes egyedi fejlesztés (natív KGC komponens)

**Mit jelent ez a gyakorlatban?**
- Jobb alsó sarokban lebegő chat gomb (Messenger-szerű)
- 1-to-1 üzenetek belső dolgozók között
- Valós idejű értesítések (WebSocket technológia)
- Online/offline státusz jelzés
- Böngésző értesítések (toast popups)

**Felhasználói élmény:**
```
1. Admin dolgozik a KGC-ben (munkalap szerkesztés)
2. Jobb alsó sarokban: Chat ikon (💬) + (3) unread badge
3. Kattintás → Felugrik chat ablak
   ├─ Dolgozók listája (🟢 online / 🔴 offline)
   ├─ Keresés (név alapján)
   └─ Kiválasztás → Beszélgetés ablak
4. Üzenet küldés → Másik dolgozó azonnal látja
5. Hangjelzés + toast notification ("Kovács János üzent")
```

**Példa használat:**
```
Admin (Budapest): "Szia, a #12345 munkalap készen van?"
Technikus (Debrecen): "Igen, lezárva! ✓"

Időbélyeg: 10:23 vs 10:25 (2 perc válaszidő)
VS hagyományos: Email (30 perc) vagy telefon (megszakítja a munkát)
```

**Miért egyedi fejlesztés (nem Mattermost)?**
- ✅ **Egyszerűség:** Csak 1-to-1 chat kell (nincs szükség group chat, file sharing, video call-ra)
- ✅ **Integráció:** KGC UI-ba teljesen beágyazva (nincs context switch)
- ✅ **Kontroll:** Teljes testreszabhatóság (pl. munkalap linkek automatikus előnézete)
- ✅ **Költség:** ~4,800 € vs Mattermost ~3,780 € (hasonló, de jobb UX)

**Technológia:**
- Backend: NestJS + Socket.io (WebSocket)
- Frontend: React komponens
- Adattárolás: PostgreSQL (chat_messages tábla)
- Real-time: WebSocket kapcsolat (instant push)

**Korlátok (MVP):**
- ❌ Nincs group chat (csak 1-to-1)
- ❌ Nincs file attachment (csak text)
- ❌ Nincs video call

**Későbbi bővítés (ha igény van):**
- Group chat (+16 óra fejlesztés)
- File sharing (+8 óra)
- Video call (Jitsi integráció, +12 óra)

---

### 2.4 Horilla HR Integráció

**Megközelítés:** iframe beágyazás + forráskód testreszabás

**Mit jelent ez a gyakorlatban?**
- Horilla HR panel beágyazva a KGC csapat/dolgozók oldalakba
- KGC design (kék színek, KGC logo)
- SSO (egyetlen bejelentkezés)
- Dolgozó szinkronizáció (KGC User → Horilla Employee, 5 percenként)

**Felhasználói élmény:**
```
Csapat menü → "HR Adatok" tab
├─ Dolgozók listája
├─ Jelenlét nyilvántartás
├─ Szabadság kérelmek
├─ Toborzás (álláshirdetések, jelentkezők)
└─ Bérkalkuláció exportok

Vizuális érzet: KGC kék design
```

**Miért Horilla?**
- ✅ **PostgreSQL natív:** Egyetlen DB (KGC + Twenty + Chatwoot + Horilla)
- ✅ **Tech stack match:** Python/Django (jó REST API dokumentáció)
- ✅ **Alapfunkciók elegendők:** Dolgozók, jelenlét, szabadság, toborzás (nincs túlkomplexitás)
- ✅ **Költség:** ~3,600 € vs ~18,000 € (egyedi HR UI építés)

**Kompromisszum:**
- ⚠️ HR használat alkalmi (nem napi) → iframe tökéletes erre
- ✅ Nincs szükség komplex payroll-ra (könyvelő külön kezeli)

**Alternatívák elvetése:**
- ❌ Frappe HRMS: MariaDB preferred (PostgreSQL partial support)
- ❌ OrangeHRM: MySQL only (nem PostgreSQL)

---

### 2.5 Pénzügyi Modul (Egyedi Fejlesztés + Számlázz.hu)

**Megközelítés:** Egyedi KGC modul + Számlázz.hu API integráció

**Mit jelent ez a gyakorlatban?**
- KGC Pénzügy modul: Befizetések, ÁFA tábla, zárások, leltár, riportok
- Számlázz.hu: Számlakiállítás, NAV XML feladás, adószám ellenőrzés
- Tiszta feladatmegosztás (KGC = üzleti logika, Számlázz.hu = compliance)

**Felhasználói élmény:**
```
Pénzügy menü:
├─ Teljesítések (befizetések)
│   • Nyitott tartozások (rózsaszín = lejárt)
│   • Részteljesítés support
│   • Fizetési mód (átutalás/készpénz/kártya)
│
├─ Havi Zárás
│   • ÁFA tábla export (könyvelőnek)
│   • NAV feladott számlák listája
│   • Bizonylat összesítők
│
├─ Napi Zárás
│   • Bérleti díj + szerviz + értékesítés külön
│   • Export fájl (25_02_06 formátum)
│
├─ Leltár
│   • Program készlet vs valós eltérés
│   • Korrekciók követése
│
└─ Riportok
    • Számla összesítők
    • Cikk mozgások
    • Szerelő hatékonyság
```

**Számlázz.hu integráció (API):**
```
KGC → Számlázz.hu:
1. Számla adatok küldése (partner, tételek, összeg)
2. Számlázz.hu: PDF generálás + NAV XML feladás
3. PDF + NAV státusz visszaküldése KGC-nek
4. KGC: Számla archiválás (/bizonylatok/szamlak/)
```

**Miért NEM open-source accounting?**
- ❌ **Magyar NAV API:** Egyetlen open-source platform sem támogatja natívan
- ❌ **Számlázz.hu integráció:** Duplikáció lenne (2 számlázó engine)
- ❌ **KGC egyedi folyamatok:** Szállítólevél számlázás, bérleti díj automatizmus, garanciális elszámolás, napi zárás

**Kompromisszum:**
- ⚠️ Számlázz.hu költség: ~65-210 €/év (csomag függő)
- ✅ DE: NAV compliance garantált (Számlázz.hu felelőssége)
- ✅ 50% olcsóbb, mint open-source accounting adaptálása + NAV custom fejlesztés

**Költség:**
- Egyedi KGC modul: 80 óra × 150 € = 12,000 €
- Számlázz.hu (3 év): 630 € (alap) vagy 1,890 € (profi)
- **Total:** 12,630-13,890 € vs ~35,000 € (open-source + NAV)

---

### 2.6 Unified Dashboard (API Integráció)

**Megközelítés:** Natív KGC komponens + API aggregáció

**Mit jelent ez a gyakorlatban?**
- Egyetlen dashboard oldal kombinál adatokat mind az 5 rendszerből
- Valós idejű KPI-k (percenkénti frissítés)
- Gyors betöltés (API cache-eléssel)

**Felhasználói élmény:**
```
KGC Dashboard (Franchise Igazgató)
┌────────────────────────────────────────────────────────────┐
│ Havi Áttekintés (2025 December)                            │
├──────────┬──────────┬──────────┬──────────┬──────────────┤
│ Új Deals │ Bérletek │ Support  │ Dolgozók │ Havi Bevétel │
│ (Twenty) │ (KGC)    │(Chatwoot)│(Horilla) │ (KGC)        │
│    15    │   120    │    8     │    25    │   450k Ft    │
│  ↑ 20%   │  ↑ 5%    │  ↓ 15%   │  → 0%    │   ↑ 12%      │
└──────────┴──────────┴──────────┴──────────┴──────────────┘

[Részletes riport letöltése (PDF) ↓]
```

**Hogyan működik a háttérben?**
1. Felhasználó megnyitja a dashboard oldalt
2. KGC backend **párhuzamosan** hív 5 API-t:
   - Twenty GraphQL API → deals adatok
   - Chatwoot REST API → ticket adatok
   - Horilla REST API → dolgozók, jelenlét
   - Számlázz.hu API → NAV feladott számlák, ÁFA
   - KGC saját DB → bérletek, bevétel, készlet
3. Adatok cache-elése (1 perc)
4. Aggregált válasz frontend-nek
5. React komponens rendereli a kártyákat

**Teljesítmény:**
- Betöltési idő: ~900ms (5 API parallel hívás)
- Cache: 1 perc (100 user esetén is gyors)
- Frissítés: Automatikus 60 másodpercenként

**Miért natív komponens (nem iframe)?**
- ✅ **Sebesség:** Gyorsabb, mint 5 külön iframe betöltése
- ✅ **Testreszabás:** KGC-specifikus KPI-k (pl. "garanciális javítások száma", "bérleti díj késések")
- ✅ **Egységesség:** 100% KGC design

---

## 3. Adatszinkronizáció

### Szinkronizációs Logika

**Partner létrehozás/módosítás KGC-ben:**
```
1. Admin létrehoz új partnert (Kovács János)
2. KGC adatbázis: INSERT partner tábla
3. Partner státusz: "pending_sync"
4. Háttérfolyamat (5 percenként):
   a) Lekéri "pending_sync" partnereket
   b) Twenty API: createPerson() → twentyPersonId = "abc-123"
   c) Chatwoot API: createContact() → chatwootContactId = 456
   d) KGC DB update:
      - partner.twenty_person_id = "abc-123"
      - partner.chatwoot_contact_id = 456
      - partner.sync_status = "synced"
      - partner.last_sync_at = NOW()
```

**Dolgozó létrehozás/módosítás KGC-ben:**
```
1. Admin létrehoz új user-t (Nagy Éva)
2. KGC adatbázis: INSERT user tábla
3. User státusz: "pending_hr_sync"
4. Háttérfolyamat (5 percenként):
   a) Lekéri "pending_hr_sync" user-eket
   b) Horilla API: createEmployee() → horillaEmployeeId = 789
   c) KGC DB update:
      - user.horilla_employee_id = 789
      - user.sync_status = "synced"
      - user.last_sync_at = NOW()
```

**Számla kiállítás KGC-ben:**
```
1. Admin létrehoz számlát (bérlés/szerviz/értékesítés)
2. KGC: Számla adatok validálása
3. Számlázz.hu API: createInvoice()
   → PDF generálás + NAV XML feladás
4. Számlázz.hu visszaad:
   - szamlazzHuId
   - pdfUrl
   - navStatus ("feladva" / "hiba")
5. KGC: PDF letöltés + archiválás (/bizonylatok/szamlak/)
6. KGC DB update:
   - szamla.szamlazz_hu_id = szamlazzHuId
   - szamla.nav_status = navStatus
   - szamla.pdf_path = "/bizonylatok/szamlak/2025-001.pdf"
```

**Szinkronizációs gyakoriság:**
- Partner adatok: 5 percenként (cron job)
- Dolgozó adatok: 5 percenként (cron job)
- Számlák: Valós idejű (szinkron API call)
- Dashboard metrics: 1 percenként (cache)
- Chat üzenetek: Valós idejű (WebSocket)

**Hibakezelés:**
```
Ha Twenty API elérhetetetlen:
1. Retry 3x (exponential backoff: 1s, 5s, 15s)
2. Ha minden retry sikertelen:
   - partner.sync_status = "failed"
   - partner.sync_error = "Twenty API timeout"
3. Admin értesítés (email)
4. Következő cron job újrapróbálja
```

---

## 4. Felhasználói Munkafolyamat Példák

### 4.1 Új Partner Regisztráció

```
1. Admin: KGC → Partner menü → "Új partner hozzáadása"
2. Űrlap kitöltése (név, email, telefon, cím)
3. Mentés gomb → KGC adatbázis
4. 5 perc múlva (háttérben):
   - Twenty-ben megjelenik a partner (CRM)
   - Chatwoot-ban contact létrejön (support)
5. Admin megnyitja partner oldalt:
   - Bal oldal: KGC adatok ✓
   - Jobb oldal: Twenty CRM panel (már látszik a partner) ✓
   - Support tab: Chatwoot panel (contact elérhető) ✓
```

**Felhasználói észrevétel:** "Minden automatikusan szinkronban van!"

---

### 4.2 Értékesítési Folyamat (Deal Management)

```
1. Sales admin: Partner oldal → "CRM" tab
2. Twenty panel betöltődik (KGC design)
3. "Új deal létrehozása" gomb
4. Deal részletek:
   - Név: "Új franchise bérleti szerződés"
   - Összeg: 50,000 Ft
   - Státusz: "Tárgyalás"
5. Mentés → Twenty adatbázis
6. Deal státusz változtatás: "Tárgyalás" → "Lezárt (WON)"

JÖVŐBELI BŐVÍTÉS (egyedi KGC flow):
7. [Lezárás és Franchise létrehozása] gomb
   → Egy kattintással:
      a) Deal lezárása (Twenty)
      b) Franchise tenant létrehozása (KGC)
      c) Bérleti szerződés sablon generálás (KGC)
      d) Chatwoot onboarding ticket (support)
```

---

### 4.3 Support Ticket Kezelés

```
1. Ügyfél: Email küld a support@kgc.hu címre
2. Chatwoot: Automatikus conversation létrehozás
3. Admin: KGC → Partner oldal → "Support" tab
4. Chatwoot panel betöltődik (KGC design)
5. Látja az új beszélgetést:
   - "Gép szervíz kérdés" (NYITOTT)
   - Ügyfél üzenet: "A bérleti gép meghibásodott..."
6. Admin válaszol (Chatwoot UI-n belül)
7. Canned response választás: "Technikus kirendelése"
8. Ticket lezárása

OPCIONÁLIS (egyedi KGC flow):
9. "Munkalap létrehozása" gomb (KGC integráció)
   → Chatwoot ticket → KGC szerviz munkalap
```

---

### 4.4 HR Adminisztráció (Dolgozó Felvétel)

```
1. Admin: KGC → Csapat menü → "Új dolgozó hozzáadása"
2. Űrlap kitöltése (név, email, pozíció, belépési dátum)
3. Mentés gomb → KGC user tábla
4. 5 perc múlva (háttérben):
   - Horilla-ban employee rekord létrejön
5. Admin megnyitja "HR Adatok" tab:
   - Horilla panel betöltődik (KGC design)
   - Dolgozó megjelenik listában
   - Szabadság egyenleg, jelenlét tracking elérhető
```

**Felhasználói észrevétel:** "HR adatok külön rendszerben, de egyetlen bejelentkezéssel elérhető!"

---

### 4.5 Számlakiállítás (Bérleti Díj)

```
1. Admin: KGC → Bérlés modul → "Havi számlázás"
2. Rendszer: Automatikusan összegyűjti a havi bérleti díjakat
3. Partner kiválasztása (pl. Kovács János)
4. Számla előnézet:
   - Tételek: Bérgép XY, 30 nap × 500 Ft/nap = 15,000 Ft
   - ÁFA 27%: 4,050 Ft
   - Összesen: 19,050 Ft
5. "Számla kiállítása" gomb
6. Számlázz.hu API:
   → PDF generálás
   → NAV XML feladás
   → Státusz: "Sikeresen feladva"
7. KGC: PDF archiválás + teljesítés tracking
```

**Felhasználói észrevétel:** "Számla automatikusan NAV-nak is feladódik, nem kell kézzel!"

---

### 4.6 Belső Chat Használat

```
Scenario: Technikus terepen, adminnak kérdése van

1. Admin (Budapest, laptop):
   - Jobb alsó sarok: Chat ikon (💬)
   - Kattintás → Chat ablak felugrik
   - User lista: Kovács János (🟢 online)
   - Kiválasztás

2. Chat ablak:
   ┌────────────────────────────────┐
   │ ← Kovács János        🟢  [X] │
   ├────────────────────────────────┤
   │ 10:23                          │
   │   Szia! A #12345 munkalap      │
   │   készen van?                  │
   │                                │
   │               10:25            │
   │    Igen, lezárva! ✓            │
   │                                │
   ├────────────────────────────────┤
   │ [Üzenet írása...]        [📤] │
   └────────────────────────────────┘

3. Technikus (Debrecen, mobil/tablet):
   - Toast notification: "Új üzenet (Admin)"
   - Chat widget megnyitása
   - Válasz gépelése
   - Enter/Send gomb

4. Admin: Azonnal látja a választ (WebSocket push)

Időmegtakarítás:
- Email: ~30 perc válaszidő
- Telefon: Megszakítja a technikus munkáját
- Chat: 2 perc, nem invazív
```

---

## 5. Miért ez a Megoldás? (Döntési Logika)

### Alternatívák Mérlegelése

#### ❌ Alternatíva 1: Teljes Natív UI (Twenty/Chatwoot API-kkal)

**Mit jelentene:**
- Saját CRM UI építése (deal táblák, űrlapok, timeline)
- Saját support UI (ticket kezelés, canned responses)

**Miért NEM ezt választottuk:**
- ⏱️ **Idő:** 6-8 hónap fejlesztés (vs 4 hét iframe)
- 💰 **Költség:** ~108,000 € (vs ~35,000 € hibrid)
- 🔧 **Karbantartás:** Twenty API változás → KGC UI frissítés szükséges (12-15k €/év)
- 📉 **Feature gap:** Soha nem érjük utol Twenty fejlődését (40 commit/hét)
- ⚠️ **Stratégiai rizikó:** IT fókusz eltolódik az ERP-ről a CRM-re

**Mikor lenne indokolt:**
- Ha CRM a core business (pl. CRM software vállalat)
- Ha 100% egyedi folyamatok kellenek a CRM-ben
- Ha mobil-first kritikus (natív app szükséges)

**KGC esetében:** CRM csak 15% használat → NEM indokolt

---

#### ❌ Alternatíva 2: Mattermost (Belső Chat helyett)

**Mit jelentene:**
- Mattermost telepítés (Slack-clone)
- Külön alkalmazás (nem KGC UI-n belül)

**Miért NEM ezt választottuk:**
- 🔄 **Context switch:** Felhasználó vált KGC ↔ Mattermost között
- 📱 **Mobil:** Külön Mattermost app szükséges
- 🎯 **Over-engineering:** Group chat, file sharing, video call NEM kell (csak 1-to-1)
- 💰 **Költség:** Hasonló (~3,780 €), de rosszabb UX

**Mikor lenne indokolt:**
- Ha teljes team collaboration kell (channels, threads)
- Ha file sharing kritikus
- Ha video call integrált kell legyen

**KGC esetében:** Egyszerű 1-to-1 chat elég → Custom jobb UX

---

### ✅ Választott Megoldás Előnyei

| Szempont | Eredmény |
|----------|----------|
| **Implementációs idő** | 5.5 hét (vs 8-10 hónap natív) |
| **Kezdeti költség** | ~40,600 € (vs ~144,000 € teljes natív) |
| **Brand egységesség** | 85% (theme módosítással 3 platform) |
| **Feature completeness** | 100% (Twenty/Chatwoot/Horilla teljes) |
| **Karbantartás** | Közepes (~5,400 €/év) |
| **Skálázhatóság** | 100+ user (cache-elt dashboard) |
| **IT fókusz** | 75% ERP, 25% integráció ✓ |
| **NAV compliance** | 100% (Számlázz.hu garantált) |
| **Stratégiai rugalmasság** | Twenty/Chatwoot cserélhető (vendor lock-in elkerülése) |

---

## 6. Forráskód Módosítások Előnye

**Miért kritikus, hogy hozzáférünk a forráskódhoz?**

### 6.1 Single Sign-On (SSO)

**Probléma vanilla rendszerrel:**
```
Felhasználó: Bejelentkezik KGC-be
→ Megnyitja Partner oldalt
→ Twenty iframe betölt
→ Twenty kéri a bejelentkezést ÚJRA ❌
```

**Megoldás forráskód módosítással:**
```
Twenty forráskódban:
- KGC JWT token elfogadása
- Automatikus session létrehozás
- Felhasználó NEM veszi észre (seamless)

Eredmény: 1x bejelentkezés az összes rendszerbe ✓
```

**Fejlesztési idő:**
- Vanilla: OAuth2 setup (16 óra)
- Forráskód módosítás: 8 óra
- **Megtakarítás: 8 óra (~1,200 €)**

---

### 6.2 Brand Testreszabás (Theme)

**Probléma vanilla rendszerrel:**
```
KGC: Kék design (#1e40af)
Twenty: Lila design (#7c3aed)
Chatwoot: Zöld design (#1f93ff)

→ Vizuális törés, nem professzionális érzés
```

**Megoldás forráskód módosítással:**
```
Twenty theme.ts:
- primary: '#1e40af' (KGC kék)
- logo: 'kgc-logo.svg'

Chatwoot _variables.scss:
- $color-primary: #1e40af

Eredmény: Egységes KGC design (85% brand consistency) ✓
```

**Fejlesztési idő:**
- CSS override (iframe): 8 óra (buggy, nem 100%)
- Forráskód módosítás: 4 óra (tiszta, stabil)
- **Megtakarítás: 4 óra (~600 €)**

---

### 6.3 Automatikus Webhook Konfiguráció

**Probléma vanilla rendszerrel:**
```
Minden új Chatwoot conversation:
- Manuális webhook setup szükséges
- Admin felületen config minden tenant-hez
```

**Megoldás forráskód módosítással:**
```
Chatwoot conversation.rb:
after_create :notify_kgc_system

def notify_kgc_system
  RestClient.post('https://kgc.hu/api/webhooks/chatwoot', {...})
end

Eredmény: Automatikus integráció, 0 manuális konfig ✓
```

**Fejlesztési idő:**
- Manuális setup: 4 óra minden tenant-hez
- Forráskód módosítás: 6 óra (1x)
- **Megtakarítás: Long-term (10+ tenant esetén)**

---

## 7. Technikai Architektúra Áttekintés

```
┌────────────────────────────────────────────────────────────────┐
│         Felhasználói Réteg (Browser)                           │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ KGC Admin UI (React)                                     │  │
│  │ ┌─────────┬─────────┬─────────┬─────────┬────────────┐ │  │
│  │ │Dashboard│ Partner │ Support │HR Admin │Chat Widget │ │  │
│  │ │(Natív)  │ Detail  │ Tickets │         │(Natív)     │ │  │
│  │ │         │┌───────┐│┌───────┐│┌───────┐│            │ │  │
│  │ │API aggr.││Twenty ││Chatwoot│││Horilla││ WebSocket  │ │  │
│  │ │5 syst.  ││(iframe││(iframe)│││(ifr.) ││            │ │  │
│  │ │         │└───────┘│└───────┘│└───────┘│            │ │  │
│  │ └─────────┴─────────┴─────────┴─────────┴────────────┘ │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────┘
            │              │              │            │
            ▼              ▼              ▼            ▼
┌────────────────────────────────────────────────────────────────┐
│         Alkalmazás Réteg                                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐  │
│  │ KGC      │  │ Twenty   │  │ Chatwoot │  │ Horilla HR   │  │
│  │ Backend  │  │ (Fork)   │  │ (Fork)   │  │ (Fork)       │  │
│  │ NestJS   │  │ Modified │  │ Modified │  │ Modified     │  │
│  │          │  │ Theme ✓  │  │ Theme ✓  │  │ Theme ✓      │  │
│  │ API:     │  │ SSO ✓    │  │ SSO ✓    │  │ SSO ✓        │  │
│  │ • GraphQL│  │          │  │          │  │              │  │
│  │ • REST   │  │ GraphQL  │  │ REST API │  │ REST API     │  │
│  │ • WS     │  │ API      │  │          │  │              │  │
│  └────┬─────┘  └──────────┘  └──────────┘  └──────────────┘  │
│       │                                                        │
│       │ ┌────────────────────────────────────────┐            │
│       └─┤ KGC Finance Module (NestJS)            │            │
│         │ • Teljesítések, ÁFA tábla              │            │
│         │ • Leltár, napi zárás                   │            │
│         │ • Számlázz.hu API adapter ✓            │            │
│         └────────────────────────────────────────┘            │
│                              │                                 │
│                              ▼                                 │
│         ┌────────────────────────────────────┐                │
│         │ Számlázz.hu (External SaaS)        │                │
│         │ • PDF számlák                      │                │
│         │ • NAV Online Számla API (3.0)      │                │
│         │ • ÁFA compliance                   │                │
│         └────────────────────────────────────┘                │
└────────────────────────────────────────────────────────────────┘
            │              │              │            │
            ▼              ▼              ▼            ▼
┌────────────────────────────────────────────────────────────────┐
│         Adat Réteg                                             │
│  ┌───────────────────────────────────────────────────────────┐│
│  │ PostgreSQL                                                ││
│  │ ┌──────────┬──────────┬─────────────┬───────────────────┐││
│  │ │ KGC      │ Twenty   │ Chatwoot    │ Horilla schema    │││
│  │ │ schema   │ schema   │ schema      │                   │││
│  │ │          │          │             │                   │││
│  │ │ External │          │             │                   │││
│  │ │ IDs:     │          │             │                   │││
│  │ │• twenty_ │          │             │                   │││
│  │ │  id      │          │             │                   │││
│  │ │• chat_id │          │             │                   │││
│  │ │• horilla_│          │             │                   │││
│  │ │  emp_id  │          │             │                   │││
│  │ └──────────┴──────────┴─────────────┴───────────────────┘││
│  └───────────────────────────────────────────────────────────┘│
└────────────────────────────────────────────────────────────────┘
```

**Komponensek:**
- **KGC Backend:** Központi orchestráció, API aggregáció (5 rendszer), szinkronizáció
- **Twenty (Fork):** Módosított CRM (theme, SSO)
- **Chatwoot (Fork):** Módosított support (theme, SSO)
- **Horilla HR (Fork):** Módosított HR (theme, SSO)
- **KGC Finance Module:** Egyedi pénzügyi modul (Számlázz.hu integráció)
- **Számlázz.hu:** Külső SaaS (PDF számla, NAV API)
- **PostgreSQL:** Közös adatbázis (4 schema, external ID kapcsolatok)

---

## 8. Implementációs Ütemterv

### Fázis 1: Alapok (1 hét)
- [ ] Twenty repository fork + theme módosítás
- [ ] Chatwoot repository fork + theme módosítás
- [ ] Horilla HR repository fork + theme módosítás
- [ ] Docker Compose setup (összes szolgáltatás)
- [ ] PostgreSQL schema migration (external ID mezők: twenty_id, chat_id, horilla_emp_id)

**Deliverable:** Működő Twenty + Chatwoot + Horilla (KGC design)

---

### Fázis 2: Integráció (2 hét)
- [ ] KGC Backend API adapters (Twenty GraphQL, Chatwoot REST, Horilla REST)
- [ ] SSO implementáció (Twenty + Chatwoot + Horilla)
- [ ] Partner szinkronizáció (cron job, 5 perc)
- [ ] Dolgozó szinkronizáció (KGC → Horilla, 5 perc cron)
- [ ] Unified Dashboard API endpoint (5 rendszer aggregáció)

**Deliverable:** Szinkronizált adatok, SSO működik (3 platform)

---

### Fázis 3: Pénzügyi Modul + Számlázz.hu (2 hét)
- [ ] KGC Finance Module: Backend (NestJS)
  - [ ] Teljesítések API
  - [ ] ÁFA tábla lekérdezés
  - [ ] Napi zárás automatizálás
  - [ ] Leltár kezelés
- [ ] Számlázz.hu API adapter
  - [ ] Számla generálás endpoint
  - [ ] NAV státusz lekérdezés
  - [ ] PDF visszatöltés
- [ ] Finance Module UI (Admin)
  - [ ] Teljesítések kezelő
  - [ ] ÁFA táblázat nézet
  - [ ] Leltár korrekció felület

**Deliverable:** Számlázz.hu integráció működik, pénzügyi folyamatok digitalizálva

---

### Fázis 4: UI Komponensek (1 hét)
- [ ] KGC Frontend: Unified Dashboard (5 rendszer)
- [ ] KGC Frontend: Partner detail (iframe Twenty + Chatwoot)
- [ ] KGC Frontend: HR Admin (iframe Horilla)
- [ ] Custom Chat: Backend (WebSocket gateway)
- [ ] Custom Chat: Frontend (floating widget)

**Deliverable:** Teljes felhasználói élmény

---

### Fázis 5: Tesztelés + Üzembe helyezés (0.5 hét)
- [ ] User acceptance testing (5-10 felhasználó pilot)
- [ ] Performance testing (100 user szimulálás)
- [ ] Production deployment
- [ ] Dokumentáció (user manual, admin guide)

**Deliverable:** Éles rendszer, felhasználói képzés

---

## 9. Sikerkritériumok (KPI-k)

### Technikai Metrikák
- ✅ Dashboard betöltési idő < 1 másodperc
- ✅ Chat üzenet delay < 500ms (WebSocket)
- ✅ Sync accuracy > 99.5% (5 perc késés elfogadható)
- ✅ Uptime > 99% (havi 7 óra tervezett karbantartás)

### Felhasználói Metrikák
- ✅ Felhasználói elfogadás > 80% (user survey)
- ✅ Chat adoption > 60% (aktív használók 2 hét után)
- ✅ Support ticket resolution time -30% (Chatwoot hatékonyság)
- ✅ Sales cycle time -20% (Twenty CRM tracking)

### Üzleti Metrikák
- ✅ Franchise onboarding idő < 2 hét (integrált folyamat)
- ✅ IT karbantartási idő < 20 óra/hó (automatizálás)
- ✅ ROI: 12 hónap alatt megtérülés

---

## 10. Kockázatok és Mérséklés

### Kockázat 1: Twenty/Chatwoot Breaking Changes
**Valószínűség:** Közepes (2-3x/év)
**Hatás:** Közepes (sync megszakad, UI torzul)
**Mérséklés:**
- Forráskód fork → upstream merge kontrolálható
- Staging környezet (tesztelés production előtt)
- Rollback terv (előző stabil verzió)

### Kockázat 2: Teljesítmény Skálázási Problémák
**Valószínűség:** Alacsony (100+ user esetén)
**Hatás:** Közepes (lassú dashboard)
**Mérséklés:**
- Redis cache (dashboard API)
- Database indexek (external ID mezők)
- Load testing (50-100-150 user szimulálás)

### Kockázat 3: Felhasználói Ellenállás (Change Management)
**Valószínűség:** Közepes (új rendszer)
**Hatás:** Magas (alacsony adoption)
**Mérséklés:**
- Pilot program (5-10 early adopter)
- User training (videós anyagok)
- Change champions (franchise managerek mint advocate-ok)

---

## 11. Következő Lépések

### Azonnali (1 hét)
1. ✅ Jóváhagyás (ez a dokumentum)
2. ⏳ Dev környezet setup (Docker Compose)
3. ⏳ Twenty/Chatwoot/Horilla fork létrehozása
4. ⏳ Számlázz.hu API kulcs beszerzés

### Rövid távú (1.5 hónap)
5. ⏳ Fázis 1-5 implementáció (5.5 hét)
6. ⏳ Pilot program (5 felhasználó)
7. ⏳ User feedback iteráció

### Közép távú (3-6 hónap)
7. ⏳ Production rollout (100 felhasználó)
8. ⏳ Mobil PWA fejlesztés (offline support)
9. ⏳ Advanced features (custom workflows)

---

## 12. Összefoglalás

**Végleges döntés:** Hibrid iframe beágyazás + API integráció + forráskód testreszabás + Egyedi pénzügyi modul

**Alap filozófia:**
> "A helyes eszközt a helyes helyen használjuk. Twenty kiváló CRM, Chatwoot kiváló support, Horilla kiváló HR - használjuk őket vanilla-ként (iframe). Magyar-specifikus pénzügy? Egyedi fejlesztés + Számlázz.hu SaaS. KGC egyedi ERP - erre fókuszáljunk. Integráció: egyszerű, hatékony, karbantartható."

**Kulcs előnyök:**
- ⚡ Gyors indulás (5.5 hét)
- 💰 Költséghatékony (~40,600 € vs ~144,000 € teljes egyedi)
- 🎨 Egységes brand (85% theme módosítással)
- 🔧 Alacsony karbantartás (IT fókusz az ERP-n marad)
- 📈 Skálázható (100+ felhasználó)
- 🔄 Rugalmas (Twenty/Chatwoot/Horilla cserélhető)
- 🇭🇺 Magyar NAV compliance (Számlázz.hu garantált)

**Kompromisszumok:**
- ⚠️ iframe = nem 100% natív UI (de 85% brand egységesség)
- ⚠️ Forráskód fork (3 platform) = upstream merge karbantartás (évente ~30 óra)
- ⚠️ Számlázz.hu függőség = külső SaaS (de költséghatékony + NAV compliance biztos)

**Ajánlás:** Jóváhagyás és azonnali indítás! 🚀

---

## 13. Részletes Költség Breakdown (3 éves TCO)

### Kezdeti Fejlesztési Költségek (0. év)

| Komponens | Fejlesztési idő | Költség |
|-----------|-----------------|---------|
| **Twenty CRM integráció** | 1.5 hét × 150 €/h = 60h | 9,000 € |
| - Fork + theme + SSO + sync | | |
| **Chatwoot Support integráció** | 1 hét × 150 €/h = 40h | 6,000 € |
| - Fork + theme + SSO + sync | | |
| **Horilla HR integráció** | 1.5 hét × 150 €/h = 60h | 9,000 € |
| - Fork + theme + SSO + dolgozó sync | | |
| **Custom Chat modul** | 1 hét × 150 €/h = 40h | 6,000 € |
| - WebSocket backend + floating widget | | |
| **KGC Finance modul** | 2 hét × 150 €/h = 80h | 12,000 € |
| - Teljesítések, ÁFA, leltár, zárás | | |
| **Számlázz.hu adapter** | Fenti Finance modulba | (0 €) |
| **Unified Dashboard** | 0.5 hét × 150 €/h = 20h | 3,000 € |
| - 5 rendszer API aggregáció | | |
| **Tesztelés + Deployment** | 0.5 hét × 150 €/h = 20h | 3,000 € |
| **Hosting setup (Docker Compose)** | 2 nap × 150 €/h = 16h | 2,400 € |
| **SUBTOTAL Kezdeti Fejlesztés** | | **50,400 €** |

### Hosting Költségek (évente)

| Szolgáltatás | Specifikáció | Költség/év |
|--------------|--------------|------------|
| **VPS (hetzner.com)** | 8 vCPU, 32GB RAM, 500GB NVMe | 780 € |
| - KGC Backend + Twenty + Chatwoot + Horilla + PostgreSQL | | |
| **Backup tárhely** | 100GB offsite backup (Wasabi S3) | 72 € |
| **Domain + SSL** | kgc-erp.hu + wildcard SSL (Let's Encrypt) | 15 € |
| **Számlázz.hu SaaS** | Alap csomag (210 €/év) VAGY Profi (630 €/év) | 210-630 € |
| **Monitoring (Uptime Robot)** | Alap csomag | 0 € (free) |
| **CDN (Cloudflare)** | Alap csomag | 0 € (free) |
| **SUBTOTAL Hosting (évi)** | | **1,077-1,497 €/év** |

### Karbantartási Költségek (évente)

| Tevékenység | Becsült idő | Költség/év |
|-------------|-------------|------------|
| **Upstream merge (Twenty + Chatwoot + Horilla)** | 30 óra/év × 150 € | 4,500 € |
| - Breaking changes követése, merge konfliktusok | | |
| **Security patch-ek** | 10 óra/év × 150 € | 1,500 € |
| **Performance tuning** | 8 óra/év × 150 € | 1,200 € |
| **User support (bug fixes)** | 15 óra/év × 150 € | 2,250 € |
| **Feature enhancements (minor)** | 20 óra/év × 150 € | 3,000 € |
| **SUBTOTAL Karbantartás (évi)** | | **12,450 €/év** |

### 3 Éves Total Cost of Ownership (TCO)

| Költség típus | Év 0 | Év 1 | Év 2 | Év 3 | **TOTAL (3 év)** |
|---------------|------|------|------|------|------------------|
| **Kezdeti fejlesztés** | 50,400 € | - | - | - | 50,400 € |
| **Hosting (alap Számlázz.hu)** | - | 1,077 € | 1,077 € | 1,077 € | 3,231 € |
| **Hosting (profi Számlázz.hu)** | - | 1,497 € | 1,497 € | 1,497 € | 4,491 € |
| **Karbantartás** | - | 12,450 € | 12,450 € | 12,450 € | 37,350 € |
| **TOTAL (alap Sz.hu)** | 50,400 € | 13,527 € | 13,527 € | 13,527 € | **90,981 €** |
| **TOTAL (profi Sz.hu)** | 50,400 € | 13,947 € | 13,947 € | 13,947 € | **92,241 €** |

### Összehasonlítás: Teljes Natív Fejlesztés vs Hibrid

| Szempont | Hibrid (választott) | Teljes natív | Delta |
|----------|---------------------|--------------|-------|
| **Fejlesztési idő** | 5.5 hét | 8-10 hónap | **10x gyorsabb** |
| **Kezdeti költség** | 50,400 € | 180,000-240,000 € | **~78% olcsóbb** |
| **3 éves TCO (alap)** | 90,981 € | 240,000-300,000 € | **~70% olcsóbb** |
| **Karbantartás/év** | 12,450 € | 25,000-35,000 € | **~60% olcsóbb** |
| **Kockázat** | Közepes (fork merge) | Alacsony (full control) | Trade-off |
| **Feature completeness** | 100% (azonnal) | 100% (10 hónap múlva) | **8 hónap előny** |

**Megjegyzés:** Natív fejlesztési becslés (8-10 hónap):
- Twenty-szerű CRM: 3-4 hónap (25,000-35,000 €)
- Chatwoot-szerű Support: 2-3 hónap (18,000-25,000 €)
- Horilla-szerű HR: 2-3 hónap (18,000-25,000 €)
- Custom Chat: 1 hónap (6,000-8,000 €)
- Finance modul: 2 hónap (12,000-15,000 €)

**Ajánlás indoklása:**
1. **Költségmegtakarítás:** ~150,000-210,000 € 3 év alatt
2. **Time-to-market:** 5.5 hét vs 8-10 hónap = **8 hónap előny**
3. **Proven solutions:** Twenty/Chatwoot/Horilla production-ready (vs saját 1.0 verzió kockázat)
4. **Magyar NAV compliance:** Számlázz.hu garantált működés (vs DIY NAV API kockázat)

---

**Készítette:** Winston (Architect), John (PM), Amelia (Dev), Mary (Analyst)
**Utolsó frissítés:** 2025-12-20
**Státusz:** ⏳ Jóváhagyásra vár
