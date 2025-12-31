# E2E Blueprint: Bérlés Teljes Folyamat

**Dokumentum**: KGC-E2E-001
**Verzió**: 1.0
**Dátum**: 2025-12-30
**Elemző**: Mary (Analyst)
**Prioritás**: 🔥 KRITIKUS

---

## 1. Folyamat Áttekintés

### 1.1 Leírás

A bérlés a KGC ERP központi folyamata, amely az ügyfél első kontaktusától a gép visszavételéig és elszámolásig tart. A folyamat összetett, mert több modult érint (CRM, Inventory, Pénzügy, Szervíz), és számos döntési pontot tartalmaz.

### 1.2 Metrikák

| Metrika | Érték |
|---------|-------|
| **Lépések száma** | **~60+** |
| **Döntési pontok** | **~20+** |
| **Érintett modulok** | 5 (CRM, Inventory, Pénzügy, Szervíz, Bérlés) |
| **Érintett szerepkörök** | 4 (Ügyfél, Pult munkatárs, Raktáros, Pénzügyes) |
| **Kritikus integrációk** | 4 (Bank API, Twenty CRM, AI képfelismerés, Email/SMS) |
| **ADR függőségek** | 3 (Kaució blokkolás, Sérülés workflow, GDPR) |
| **Becsült átfutás** | 15-30 perc (normál), 45+ perc (bonyolult eset) |

---

## 2. Résztvevők (Actors)

| Actor | Szerep | Felelősség |
|-------|--------|------------|
| **Ügyfél** | Bérlő | Gép igénylése, adatok megadása, aláírás, átvétel, visszahozás |
| **Pult Munkatárs** | Bérlésfelvevő | Ügyfél azonosítás, szerződés, kaució, kiadás, visszavétel |
| **Raktáros** | Készletkezelő | Gép előkészítés, tartozékok ellenőrzés, polcra helyezés |
| **Pénzügyes** | Számláző | Kaució elszámolás, számla kiállítás, napi zárás |
| **Szervizes** | Javító | Sérült gép átvétel, diagnosztika, javítási árajánlat |
| **Rendszer (KGC ERP)** | Automatizáció | Státusz követés, riasztások, számítások, email/SMS |

---

## 3. Fő Folyamat - Swimlane Terv

```
┌─────────────────────────────────────────────────────────────────────┐
│                      BÉRLÉS TELJES FOLYAMAT (E2E)                   │
│                                                                       │
│  ÜGYFÉL      │  PULT      │  RENDSZER    │  RAKTÁR   │  PÉNZÜGY    │
└─────────────────────────────────────────────────────────────────────┘

[START: Ügyfél bejön]
     │
     ▼
┌─────────────────┐
│ 1. AZONOSÍTÁS   │ ← 🔥 KRITIKUS DÖNTÉSI PONT
└─────────────────┘
     │
     ├─► Törzsvendég? (kártya van?)
     │        ├─ IGEN → [Gyors útvonal: Kártya scan → Adatok betöltés]
     │        └─ NEM  → [Lassú útvonal: Kézi adatfelvétel]
     │
     ├─► Személyi igazolvány kötelező? ⚠️ ADR FÜGGŐSÉG
     │        ├─ IGEN → [Scan/Fénykép → OCR → Validáció]
     │        └─ NEM  → [Skip]
     │
     ▼
┌─────────────────┐
│ 2. GÉP VÁLASZTÁS│
└─────────────────┘
     │
     ├─► Ügyfél: "Milyen gép kell?"
     │
     ├─► Pult: Inventory API Query (checkBergepAvailability)
     │          ↓
     │    [Multi-warehouse keresés]
     │          ↓
     │    Van elérhető?
     │        ├─ IGEN → [Gép lista megjelenítés]
     │        └─ NEM  → [Alternatíva ajánlás / Foglalás]
     │
     ▼
┌─────────────────┐
│ 3. TARTOZÉKOK   │
└─────────────────┘
     │
     ├─► Raktáros: Gép előkészítés
     │        ↓
     │    [Tartozékok ellenőrzés]
     │        - Töltő van?
     │        - Akkumulátor van?
     │        - Egyéb (kézikönyv, stb.)?
     │
     ├─► Rendszer: Tartozék lista generálás
     │        ↓
     │    [Vonalkód matrica nyomtatás]
     │
     ▼
┌──────────────────────┐
│ 4. VIZUÁLIS DOKUM.   │ ← 🆕 ÚJ FUNKCIÓ (AI)
└──────────────────────┘
     │
     ├─► Pult: Tablet/Telefon kamera
     │        ↓
     │    [360° fénykép sorozat]
     │        - Elölről
     │        - Hátulról
     │        - Oldalt (2x)
     │        - Felülről
     │        - Kritikus pontok (pl. óra, kijelző)
     │
     ├─► Rendszer: AI képfelismerés
     │        ↓
     │    [Baseline létrehozás]
     │        - Géptípus azonosítás
     │        - Sérülések detektálása (ha van)
     │        - Hiányzó alkatrészek (ha van)
     │
     ▼
┌─────────────────┐
│ 5. KAUCIÓ      │ ← 🔥 KRITIKUS DÖNTÉSI PONT + ADR FÜGGŐSÉG
└─────────────────┘
     │
     ├─► Törzsvendég?
     │        ├─ IGEN → [Kaució mentesség? / Csökkentett kaució?]
     │        └─ NEM  → [Teljes kaució]
     │
     ├─► Fizetési mód?
     │        ├─ Kártya   → [Blokkolás vs Levonás] ⚠️ ADR-??? (Bank API)
     │        ├─ Készpénz → [Bevétel rögzítés]
     │        └─ Átutalás → [Előleg várás]
     │
     ├─► KÁRTYA BLOKKOLÁS (ha támogatott):
     │        1. Bank API: hold(összeg, kártya_id, lejárat=30nap)
     │        2. Rendszer: Kaució státusz = "blocked"
     │        3. Bizonylat: 0% ÁFA tétel (nem tranzakció, csak blokkolás)
     │
     ├─► KÁRTYA LEVONÁS (ha nincs blokkolás):
     │        1. Bank API: charge(összeg, kártya_id)
     │        2. Rendszer: Kaució státusz = "paid"
     │        3. Számla: Kaució 100000 Ft (0% ÁFA)
     │        4. ⚠️ Figyelem: Visszautalás kell később!
     │
     ▼
┌──────────────────────┐
│ 6. BÉRLETI DÍJ      │
└──────────────────────┘
     │
     ├─► Időtartam?
     │        ├─ 1 nap    → [Napi díj]
     │        ├─ 2-6 nap  → [Napi díj * napok]
     │        ├─ 7-29 nap → [Heti díj * hetek]
     │        └─ 30+ nap  → [Havi díj]
     │
     ├─► Rendszer: Bérleti díj kalkuláció
     │        ↓
     │    [Ünnepnapok NEM számítanak] 🆕 ÚJ SZABÁLY
     │    [Hétvégék NEM számítanak]   🆕 ÚJ SZABÁLY
     │        ↓
     │    Minimum bérleti díj? (pl. 1 nap)
     │
     ├─► Fizetési mód?
     │        ├─ Előre   → [Számla + Fizetés MOST]
     │        ├─ Utólag  → [Számla visszahozáskor]
     │        └─ Kaució  → [Kaució beszámítás] 🆕
     │
     ▼
┌─────────────────┐
│ 7. SZERZŐDÉS    │
└─────────────────┘
     │
     ├─► Rendszer: Bérlési szerződés generálás (PDF)
     │        ↓
     │    [Sablonból]
     │        - Ügyfél adatok
     │        - Gép adatok (gyári szám!)
     │        - Tartozékok lista
     │        - Bérleti díj
     │        - Kaució összege
     │        - Időtartam
     │        - Visszahozás határidő
     │        - Aláírás helyek (Ügyfél + Pult)
     │
     ├─► Aláírás?
     │        ├─ Digitális → [Tablet aláírás pad → PDF-be burn]
     │        └─ Papír     → [Nyomtatás → Aláírás → Scan → PDF csatolás]
     │
     ├─► Email/SMS értesítés:
     │        - Ügyfél: Szerződés PDF
     │        - Fizető fél (ha eltér): Értesítés
     │
     ▼
┌─────────────────┐
│ 8. GÉPKIADÁS    │
└─────────────────┘
     │
     ├─► Rendszer: Inventory API → updateBergepStatus()
     │        ↓
     │    cikk_status: "bent" → "kint"
     │    rental_id: <bérlés azonosító>
     │    expected_return: <visszahozás határidő>
     │
     ├─► Raktáros: Gép átadás ügyfélnek
     │        ↓
     │    [Tartozékok átadás]
     │    [Használati útmutató (opcionális)]
     │
     ├─► Ügyfél: Gép átvétel
     │
     ▼
┌─────────────────────────────────────┐
│       [GÉPNÉL VAN AZ ÜGYFÉLNÉL]     │
│            (IDŐZÍTETT VÁRAKOZÁS)     │
└─────────────────────────────────────┘
     │
     ▼ (Ügyfél visszahozza a gépet)
     │
┌──────────────────────┐
│ 9. VISSZAVÉTEL      │ ← 🔥 KRITIKUS DÖNTÉSI PONT
└──────────────────────┘
     │
     ├─► Rendszer: Késés ellenőrzés
     │        ↓
     │    [Visszahozás határidő < Ma?]
     │        ├─ IGEN → [Késedelmi díj kalkuláció]
     │        │          ↓
     │        │     (Ma - Határidő) * Napi díj * 1.5
     │        │     Hétvége = 1.5 nap 🆕
     │        │     Ünnepnap = 0.5 nap 🆕
     │        │
     │        └─ NEM  → [Nincs késedelmi díj]
     │
     ├─► Pult: Vizuális ellenőrzés (AI asszisztált)
     │        ↓
     │    [360° fénykép sorozat ÚJRA]
     │        ↓
     │    Rendszer: AI összehasonlítás (Baseline vs Most)
     │        ↓
     │    Sérülés detektálva?
     │        ├─ IGEN → [🚨 KRITIKUS ELÁGAZÁS: Sérülés Workflow]
     │        └─ NEM  → [Folytatás: Tartozékok]
     │
     ▼
┌─────────────────────────────────────────────────┐
│ 🚨 SÉRÜLÉS WORKFLOW (ha AI detektált problémát) │ ← ⚠️ ADR-??? FÜGGŐSÉG
└─────────────────────────────────────────────────┘
     │
     ├─► Pult: Manuális ellenőrzés
     │        ↓
     │    [AI által jelölt területek átnézése]
     │        ↓
     │    Valóban sérült?
     │        ├─ NEM (AI tévedett) → [Folytatás: Tartozékok]
     │        └─ IGEN → [Sérülés rögzítés]
     │
     ├─► Pult: Kárfelvételi jegyzőkönyv
     │        ↓
     │    [Sablon kitöltés]
     │        - Sérülés típusa (külső / belső / funkcionális)
     │        - Helye (AI által detektált)
     │        - Fotók (AI által készített + kézi kiegészítés)
     │        - Okozó (ügyfél / elhasználódás / gyári hiba?)
     │        - Becsült javítási költség (ha nyilvánvaló)
     │
     ├─► Ügyfél: Károkozás elismerése?
     │        ├─ IGEN → [Aláírás digitális/papír]
     │        └─ NEM  → [Vita rögzítés → Eszkaláció (későbbi rendezés)]
     │
     ├─► Rendszer: Bérlés státusz = "pending_settlement"
     │        ↓
     │    [Kaució VISSZATARTÁS]
     │        - Kaució státusz: "blocked" → "held_pending"
     │        - Üzenet: "Sérülés vizsgálat alatt, kauciót nem adjuk vissza"
     │
     ├─► Rendszer → Szervíz modul integráció
     │        ↓
     │    [Szervíz munkalap automatikus generálás]
     │        - Munkalap típus: "Bérlés sérülés"
     │        - Prioritás: "Normál" (ha nem sürgős)
     │        - Hivatkozás: rental_id
     │        - Hibaleírás: Kárfelvételi jegyzőkönyv szövege
     │        - Fotók: AI képek + kézi fotók
     │
     ├─► Szervizes: Munkalap átvétel
     │        ↓
     │    [Diagnosztika]
     │        ↓
     │    [Árajánlat készítés]
     │        ↓
     │    Rendszer: Árajánlat → Bérlés modul
     │        ↓
     │    [Kaució vs Javítási költség összehasonlítás]
     │        ├─ Költség < Kaució → [Kaució beszámítás]
     │        ├─ Költség = Kaució → [Kaució teljes felhasználás]
     │        └─ Költség > Kaució → [Kaució + Pótdíj számla]
     │
     ├─► Email/SMS értesítés ÜGYFÉLNEK + FIZETŐ FÉLNEK:
     │        "A gép javítása XXX Ft-ba kerül. Kaució: YYY Ft. Különbözet: ZZZ Ft."
     │        "Kaució elszámolás: ..."
     │
     ├─► Szervíz: Javítás (ha ügyfél elfogadja)
     │        ↓
     │    [Munkalap lezárása]
     │        ↓
     │    Rendszer: Bérlés státusz = "settled"
     │
     ├─► Pénzügy: Kaució elszámolás
     │        ↓
     │    [Ha kártya blokkolás volt:]
     │        - Bank API: release_hold(részben/teljesen)
     │        - Különbözet visszautalás (ha van)
     │        - Számla: Javítási költség (különbözet ha kaució < költség)
     │
     │    [Ha kártya levonás volt:]
     │        - Bank API: refund(különbözet, ha van)
     │        - Számla: Módosító számla? / Helyesbítő?
     │
     ▼
┌─────────────────┐
│ 10. TARTOZÉKOK  │ (ha NINCS sérülés, vagy már elszámolva)
└─────────────────┘
     │
     ├─► Pult: Tartozékok ellenőrzés
     │        ↓
     │    [Vonalkód csippantás mind]
     │        - Töltő?
     │        - Akkumulátor?
     │        - Egyéb?
     │
     ├─► Rendszer: Összehasonlítás (kiadáskor vs visszahozáskor)
     │        ↓
     │    Hiányzik valami?
     │        ├─ IGEN → [Hiány díj kalkuláció]
     │        │          ↓
     │        │     [Tartozék lista ár → Számla]
     │        │
     │        └─ NEM  → [Minden komplett ✓]
     │
     ▼
┌───────────────────────┐
│ 11. KAUCIÓ ELSZÁMOLÁS │ (ha NINCS sérülés)
└───────────────────────┘
     │
     ├─► Rendszer: Elszámolás összesítés
     │        ↓
     │    [Kaució - Késedelmi díj - Hiány díj - Hosszabbítás díj]
     │        ↓
     │    Visszajáró összeg?
     │
     ├─► KÁRTYA BLOKKOLÁS (ha támogatott):
     │        1. Bank API: release_hold(összeg)
     │        2. Különbözet visszautalás (ha van)
     │        3. Rendszer: Kaució státusz = "released"
     │        4. Bizonylat: Elszámolás nyugta
     │
     ├─► KÁRTYA LEVONÁS (ha nincs blokkolás):
     │        1. Bank API: refund(visszajáró összeg)
     │        2. Rendszer: Kaució státusz = "refunded"
     │        3. Számla: Helyesbítő számla (kaució - levonások)
     │        ⚠️ FIGYELEM: Pénzügyi zárás bonyolult!
     │
     ├─► KÉSZPÉNZ:
     │        1. Pénztár: Kifizetés
     │        2. Rendszer: Kaució státusz = "returned_cash"
     │        3. Nyugta
     │
     ▼
┌─────────────────┐
│ 12. GÉP VISSZAVÉT│
└─────────────────┘
     │
     ├─► Rendszer: Inventory API → updateBergepStatus()
     │        ↓
     │    cikk_status: "kint" → "bent" (vagy "szerviz" ha sérült volt)
     │    rental_id: NULL
     │    last_rental: <bérlés azonosító>
     │
     ├─► Raktáros: Gép polcra helyezés
     │        ↓
     │    [QR kód scan (polc) + Vonalkód (gép)]
     │        ↓
     │    Rendszer: Készlet frissítés (real-time)
     │
     ▼
┌─────────────────┐
│ 13. BÉRLÉS LEZÁR│
└─────────────────┘
     │
     ├─► Rendszer: Bérlés státusz = "closed"
     │        ↓
     │    [Teljes audit log rögzítés]
     │        - Ki vette fel?
     │        - Mikor?
     │        - Mennyi volt a bérleti díj?
     │        - Volt-e késés?
     │        - Volt-e sérülés?
     │        - Kaució elszámolás részletei
     │
     ├─► Email/SMS értesítés:
     │        - Ügyfél: "Bérlés lezárva. Köszönjük!"
     │        - Fizető fél (ha eltér): "Elszámolás: ..."
     │
     ▼
[END]
```

---

## 4. Döntési Pontok Részletesen

### DP-1: Törzsvendég Azonosítás

**Kérdés**: Van-e törzsvendég kártyája?

**Opciók**:
- **IGEN** → Gyors útvonal
  - Kártya scan (vonalkód/RFID)
  - Adatok automatikus betöltés (név, cím, telefon, stb.)
  - Személyi igazolvány **OPCIONÁLIS** (ha van adategyeztetés időzítő, akkor kötelező)
  - Kaució **CSÖKKENTETT** vagy **NINCS** (beállítástól függ)

- **NEM** → Lassú útvonal
  - Személyi igazolvány **KÖTELEZŐ** (⚠️ ADR függőség - döntés függvénye)
  - Kézi adatfelvétel (név, cím, telefon, stb.)
  - OCR (ha van személyi scan)
  - Kaució **TELJES**

**Következmény**:
- Gyors útvonal: 2-3 perc
- Lassú útvonal: 5-10 perc

---

### DP-2: Személyi Igazolvány Kötelező?

⚠️ **ADR FÜGGŐSÉG**: ADR-??? (Személyi igazolvány kezelés)

**Kérdés**: Minden esetben kötelező személyi igazolvány?

**Opciók**:
- **A) Mindig kötelező**
  - ✅ Előny: Biztonság, hiteles adatok, jogbiztonság
  - ❌ Hátrány: Törzsvendégek sértődnek, lassú folyamat

- **B) Opcionális (törzsvendégnél nem kell)**
  - ✅ Előny: Gyors folyamat, ügyfél elégedettség
  - ❌ Hátrány: Adatok elavulhatnak, kockázat (pl. lakcímváltozás)

- **C) Időzített kötelező (pl. 6 havonta)**
  - ✅ Előny: Kompromisszum (gyors + biztonság)
  - ❌ Hátrány: Rendszer karbantartás (timer), alkalmazottak betartása

**Javaslat**: **C opció** - Rendszer timer (6 hónap), automatikus riasztás pult munkatársnak.

---

### DP-3: Kaució Típus

⚠️ **ADR FÜGGŐSÉG**: ADR-??? (Kaució kártya blokkolás)

**Kérdés**: Kártya blokkolás (hold) vagy azonnali levonás?

**Opciók**:
- **A) Blokkolás (hold)** - HA BANK TÁMOGATJA
  - ✅ Előny: Ügyfél pénze nem megy el, csak zárolva, visszaadás gyors
  - ✅ Előny: Pénzügyi elszámolás egyszerű
  - ❌ Hátrány: Nem minden bank támogatja

- **B) Azonnali levonás** - HA NINCS BLOKKOLÁS
  - ✅ Előny: Minden banknál működik
  - ❌ Hátrány: Pénzügyi elszámolás bonyolult (visszautalás, különbözet, stb.)
  - ❌ Hátrány: Számla kiállítás (kaució 0% ÁFA, helyesbítő számla, stb.)

**Kutatás szükséges**: Melyik bank API-t használja a KGC? Támogatja-e a hold műveletet?

**Példa bankok**:
- ✅ OTP (PSD2 API) - Hold támogatott
- ❓ Revolut Business - Kutatás szükséges
- ❓ K&H - Kutatás szükséges

---

### DP-4: Sérülés Detektálás (AI)

**Kérdés**: AI detektált sérülést, valóban sérült?

**Opciók**:
- **A) IGEN - Valóban sérült**
  - → Kárfelvételi jegyzőkönyv
  - → Kaució visszatartás
  - → Szervízbe küldés

- **B) NEM - AI tévedett**
  - → Manuális felülbírálás
  - → Folytatás (tartozékok ellenőrzés)
  - → AI képzés (feedback loop - hibás detektálás)

**AI Hibaarány**:
- **Cél**: <5% False Positive (téves sérülés detektálás)
- **Baseline**: Manuális ellenőrzés 100% (jelenleg)

---

### DP-5: Károkozás Elismerés

**Kérdés**: Ügyfél elismeri a károkozást?

**Opciók**:
- **A) IGEN - Elismeri**
  - → Aláírás kárfelvételi jegyzőkönyvön
  - → Kaució visszatartás jogos
  - → Szervíz folytatás

- **B) NEM - Nem ismeri el (vita)**
  - → Vita rögzítés (szöveg + fotók)
  - → Eszkaláció (később: egyeztetés telefonon / face-to-face)
  - → Kaució MÉGIS visszatartva (de vitatott státusz)
  - → ⚠️ Jogi kockázat: Ügyfél beperelheti a KGC-t

**Javasolt megoldás**:
- **Biztosítás**: Gépek biztosítva vannak?
- **Jogi**: Van-e általános szerződési feltétel (ÁSZF), ami ezt rendezi?
- **Alternatíva**: Kompromisszum (pl. 50-50% megosztás?)

---

## 5. Kritikus Integrációk

### INT-1: Bank API (Kaució Blokkolás)

**Követelmény**: Kártya kaució blokkolása (hold) 30 napra

**API Műveletek**:
1. `POST /api/v1/payment/hold`
   - Request: `{ card_id, amount, duration_days, reference }`
   - Response: `{ hold_id, status, expires_at }`

2. `POST /api/v1/payment/release_hold`
   - Request: `{ hold_id, release_amount }`
   - Response: `{ status, released_amount, refunded_at }`

3. `POST /api/v1/payment/capture_hold`
   - Request: `{ hold_id, capture_amount }`
   - Response: `{ transaction_id, captured_amount }`

**Fallback** (ha nincs hold):
1. `POST /api/v1/payment/charge`
   - Request: `{ card_id, amount, description }`
   - Response: `{ transaction_id, status }`

2. `POST /api/v1/payment/refund`
   - Request: `{ transaction_id, refund_amount }`
   - Response: `{ refund_id, status }`

---

### INT-2: Twenty CRM (Ügyfél Adatok)

**Követelmény**: Ügyfél adatok szinkronizálása

**API Műveletek**:
1. `GET /api/v1/customers?email={email}`
   - Response: `{ customer_id, name, email, phone, address, loyalty_tier }`

2. `POST /api/v1/customers`
   - Request: `{ name, email, phone, address, ... }`
   - Response: `{ customer_id }`

3. `PATCH /api/v1/customers/{id}`
   - Request: `{ field: value, ... }`
   - Response: `{ customer_id, updated_at }`

**Webhook** (CRM → KGC):
- `customer.updated` → Frissítés KGC-ben

---

### INT-3: AI Képfelismerés (Sérülés Detektálás)

**Követelmény**: 360° kép sorozat → Sérülés detektálás

**AI Szolgáltatás Opciók**:
- **Google Cloud Vision AI** (fizetős, magas pontosság)
- **Azure Computer Vision** (fizetős, ML integrálható)
- **Open Source (pl. YOLO v8)** (ingyenes, saját hoszt, tréning szükséges)

**API Példa** (Google Vision):
1. `POST /api/v1/vision/analyze`
   - Request: `{ images: [base64, ...], baseline_images: [base64, ...] }`
   - Response: `{ differences: [{ type, location, confidence, severity }] }`

**Sérülés Típusok**:
- `scratch` (karcolás)
- `dent` (horpadás)
- `crack` (repedés)
- `missing_part` (hiányzó alkatrész)
- `discoloration` (elszíneződés)

---

### INT-4: Email/SMS Értesítések

**Követelmény**: Automatikus értesítések küldése

**Email Template-ek**:
1. **Bérlés indítás**:
   - Címzett: Ügyfél + Fizető fél (ha eltér)
   - Tartalom: Szerződés PDF, Visszahozás határidő, Kapcsolat

2. **Késés riasztás** (automatikus, ha lejárt):
   - Címzett: Ügyfél + Fizető fél
   - Tartalom: Késési díj információ, Visszahozás sürgősség

3. **Sérülés vizsgálat**:
   - Címzett: Ügyfél + Fizető fél
   - Tartalom: Kárfelvételi jegyzőkönyv PDF, Becsült javítási költség, Kaució visszatartás

4. **Bérlés lezárás**:
   - Címzett: Ügyfél + Fizető fél
   - Tartalom: Elszámolás részletek, Kaució visszautalás, Köszönjük

**SMS Template-ek**:
- Csak kritikus: Késés, Sérülés, Lezárás
- Max 160 karakter

---

## 6. Adatmodell (Entitások)

### Entitás: `rental` (Bérlés)

```sql
CREATE TABLE rental (
    id UUID PRIMARY KEY,

    -- Kapcsolatok
    customer_id UUID REFERENCES customer(id),
    payer_id UUID REFERENCES customer(id), -- ha eltér
    item_id UUID REFERENCES inventory_item(id), -- bérgép
    warehouse_id UUID REFERENCES warehouse(id),

    -- Státusz
    status VARCHAR(50) CHECK (status IN (
        'draft',              -- Még nem végleges
        'active',             -- Aktív bérlés (gép kint)
        'overdue',            -- Késésben van
        'pending_settlement', -- Visszahozva, de elszámolás függőben (sérülés vizsgálat)
        'settled',            -- Elszámolva (kaució rendezve)
        'closed'              -- Lezárva (minden rendben)
    )),

    -- Időpontok
    rented_at TIMESTAMP,
    expected_return_at TIMESTAMP,
    returned_at TIMESTAMP,

    -- Bérleti díj
    rental_fee_daily DECIMAL(10,2),
    rental_fee_weekly DECIMAL(10,2),
    rental_fee_monthly DECIMAL(10,2),
    rental_period_type VARCHAR(20), -- 'daily', 'weekly', 'monthly'
    rental_period_count INTEGER,
    rental_fee_total DECIMAL(10,2),

    -- Késedelmi díj
    overdue_days INTEGER DEFAULT 0,
    overdue_fee DECIMAL(10,2) DEFAULT 0,

    -- Kaució
    deposit_amount DECIMAL(10,2),
    deposit_payment_method VARCHAR(50), -- 'card', 'cash', 'transfer'
    deposit_status VARCHAR(50) CHECK (deposit_status IN (
        'none',          -- Nincs kaució (törzsvendég)
        'blocked',       -- Kártya blokkolva (hold)
        'paid',          -- Kártya levonva / készpénz befizetve
        'held_pending',  -- Visszatartva (sérülés vizsgálat)
        'released',      -- Feloldva (blokkolás megszűnt)
        'refunded',      -- Visszautalva (kártya)
        'returned_cash'  -- Visszaadva (készpénz)
    )),
    deposit_transaction_id VARCHAR(255), -- Bank API transaction ID

    -- Tartozékok
    accessories JSONB, -- [{ name, barcode, qty }]
    accessories_returned JSONB,
    accessories_missing JSONB,
    accessories_missing_fee DECIMAL(10,2) DEFAULT 0,

    -- Vizuális dokumentálás
    photos_checkout JSONB, -- [{ url, timestamp, ai_analysis }]
    photos_return JSONB,

    -- Sérülés
    damage_detected BOOLEAN DEFAULT FALSE,
    damage_report_id UUID REFERENCES damage_report(id),
    service_workorder_id UUID REFERENCES service_workorder(id),

    -- Audit
    created_by UUID REFERENCES user(id),
    updated_by UUID REFERENCES user(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

---

### Entitás: `damage_report` (Kárfelvételi Jegyzőkönyv)

```sql
CREATE TABLE damage_report (
    id UUID PRIMARY KEY,
    rental_id UUID REFERENCES rental(id),

    -- Sérülés részletei
    damage_type VARCHAR(50), -- 'external', 'internal', 'functional'
    damage_location TEXT,
    damage_description TEXT,
    damage_photos JSONB, -- [{ url, ai_detected }]

    -- Okozó
    cause VARCHAR(50), -- 'customer', 'wear_and_tear', 'factory_defect'
    customer_acknowledged BOOLEAN,
    customer_signature_url VARCHAR(255), -- Digitális aláírás

    -- Költség
    estimated_repair_cost DECIMAL(10,2),
    actual_repair_cost DECIMAL(10,2),

    -- Státusz
    status VARCHAR(50) CHECK (status IN (
        'draft',       -- Még nem végleges
        'disputed',    -- Ügyfél nem ismeri el
        'confirmed',   -- Ügyfél elismerte
        'settled'      -- Elszámolva
    )),

    -- Audit
    created_by UUID REFERENCES user(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

---

## 7. UI/UX Mockup Igények

### Képernyő 1: Bérlés Indítás (Pult)

**Layout**:
```
┌─────────────────────────────────────────────────┐
│  KGC ERP - Bérlés Felvétel                      │
├─────────────────────────────────────────────────┤
│                                                  │
│  [1. ÜGYFÉL AZONOSÍTÁS]                         │
│                                                  │
│  ┌─────────────────┐  ┌─────────────────┐       │
│  │ Törzsvendég     │  │ Új Ügyfél       │       │
│  │ [Kártya scan]   │  │ [Adatfelvétel]  │       │
│  └─────────────────┘  └─────────────────┘       │
│                                                  │
│  ┌───────────────────────────────────┐          │
│  │ Személyi igazolvány kötelező?    │          │
│  │ [ ] IGEN  [ ] NEM (törzsvendég)  │          │
│  └───────────────────────────────────┘          │
│                                                  │
│  [Következő: Gép választás] ▶                   │
│                                                  │
└─────────────────────────────────────────────────┘
```

---

### Képernyő 2: Vizuális Dokumentálás (Tablet)

**Layout**:
```
┌─────────────────────────────────────────────────┐
│  📷 360° Kép Rögzítés                           │
├─────────────────────────────────────────────────┤
│                                                  │
│  ┌─────────────────────────────────┐            │
│  │                                 │            │
│  │     [KAMERA PREVIEW]            │            │
│  │                                 │            │
│  │     Fénykép elölről             │            │
│  │                                 │            │
│  └─────────────────────────────────┘            │
│                                                  │
│  Fénykép lista:                                 │
│  ✅ Elölről                                     │
│  ⏳ Hátulról   ← MOST EZ KÖVETKEZIK             │
│  ⬜ Bal oldal                                   │
│  ⬜ Jobb oldal                                  │
│  ⬜ Felülről                                    │
│  ⬜ Kritikus pontok (óra, kijelző)              │
│                                                  │
│  [Visszavonás]  [Tovább: Kaució] ▶              │
│                                                  │
└─────────────────────────────────────────────────┘
```

---

### Képernyő 3: Kaució Felvétel

**Layout**:
```
┌─────────────────────────────────────────────────┐
│  💰 Kaució Felvétel                             │
├─────────────────────────────────────────────────┤
│                                                  │
│  Kaució összege: 100 000 Ft                     │
│                                                  │
│  Fizetési mód:                                   │
│  ┌─────────────────┐  ┌─────────────────┐       │
│  │ 💳 Kártya       │  │ 💵 Készpénz     │       │
│  │ [Blokkolás]     │  │ [Bevétel]       │       │
│  └─────────────────┘  └─────────────────┘       │
│                                                  │
│  ┌─────────────────┐                            │
│  │ 🏦 Átutalás     │                            │
│  │ [Előleg várás]  │                            │
│  └─────────────────┘                            │
│                                                  │
│  ⚠️ Kártya blokkolás: Bank API támogatott       │
│  ✅ Összeg: 100 000 Ft blokkolva 30 napra       │
│                                                  │
│  [Vissza]  [Tovább: Szerződés] ▶                │
│                                                  │
└─────────────────────────────────────────────────┘
```

---

### Képernyő 4: Sérülés Detektálás (AI Asszisztált)

**Layout**:
```
┌─────────────────────────────────────────────────┐
│  🤖 AI Sérülés Ellenőrzés                       │
├─────────────────────────────────────────────────┤
│                                                  │
│  ⚠️ Sérülés detektálva!                         │
│                                                  │
│  ┌─────────────────────────────────┐            │
│  │                                 │            │
│  │  [BASELINE vs MOST ÖSSZEHASONLÍTÁS]         │
│  │                                 │            │
│  │  🔴 Karcolás (elöl, jobb sarok) │            │
│  │  Confidence: 92%                │            │
│  │                                 │            │
│  └─────────────────────────────────┘            │
│                                                  │
│  Manuális ellenőrzés szükséges!                 │
│                                                  │
│  ┌─────────────────┐  ┌─────────────────┐       │
│  │ ✅ Valóban      │  │ ❌ AI tévedett  │       │
│  │ sérült          │  │ (folytatás)     │       │
│  └─────────────────┘  └─────────────────┘       │
│                                                  │
│  → Ha valóban sérült: Kárfelvételi jegyzőkönyv  │
│                                                  │
└─────────────────────────────────────────────────┘
```

---

## 8. Tesztelési Forgatókönyvek

### TC-1: Boldog Útvonal (Happy Path)

**Előfeltétel**: Törzsvendég ügyfél, nincs sérülés, időben visszahozza

**Lépések**:
1. Pult: Kártya scan → Ügyfél adatok betöltés ✅
2. Pult: Gép választás → Inventory API query ✅
3. Raktár: Gép előkészítés → Tartozékok csippantás ✅
4. Pult: 360° kép (baseline) ✅
5. Pult: Kaució blokkolás (kártya) → Bank API ✅
6. Pult: Bérleti díj kalkuláció (3 nap) ✅
7. Pult: Szerződés aláírás (digitális) ✅
8. Pult: Gép kiadás → Inventory API status update ✅
9. **(3 nap múlva)** Ügyfél visszahozza ✅
10. Pult: Késés ellenőrzés → NINCS ✅
11. Pult: 360° kép (return) → AI összehasonlítás → **NINCS SÉRÜLÉS** ✅
12. Pult: Tartozékok csippantás → **MINDEN MEGVAN** ✅
13. Pénzügy: Kaució feloldás (blokkolás release) ✅
14. Rendszer: Bérlés lezárás ✅
15. Email: Ügyfél értesítés ✅

**Elvárt eredmény**: Bérlés státusz = `closed`, Kaució státusz = `released`, Ügyfél elégedett

---

### TC-2: Sérült Gép (Damage Path)

**Előfeltétel**: Ügyfél sérült géppel hoz vissza

**Lépések**:
1-9. *Mint TC-1* ✅
10. Pult: 360° kép (return) → AI összehasonlítás → **SÉRÜLÉS DETEKTÁLVA** 🚨
11. Pult: Manuális ellenőrzés → **VALÓBAN SÉRÜLT** ✅
12. Pult: Kárfelvételi jegyzőkönyv kitöltés ✅
13. Ügyfél: Károkozás elismerés → **ALÁÍRÁS** ✅
14. Rendszer: Bérlés státusz = `pending_settlement` ⏳
15. Rendszer: Kaució státusz = `held_pending` ⏳
16. Rendszer: Szervíz munkalap generálás ✅
17. Szervíz: Diagnosztika → Javítási árajánlat (30 000 Ft) ✅
18. Rendszer: Árajánlat → Bérlés modul ✅
19. Email: Ügyfél értesítés (kaució - 30k = 70k visszajár) ✅
20. Szervíz: Javítás ✅
21. Pénzügy: Kaució elszámolás (70k visszautalás) ✅
22. Rendszer: Bérlés státusz = `settled` → `closed` ✅

**Elvárt eredmény**: Kaució részben visszatartva, javítási költség levonva, ügyfél értesítve

---

### TC-3: Késés (Overdue Path)

**Előfeltétel**: Ügyfél 5 napot késik (3+5=8 nap összesen)

**Lépések**:
1-8. *Mint TC-1* ✅
9. **(8 nap múlva)** Ügyfél visszahozza (5 nap késés) 🚨
10. Rendszer: Késés ellenőrzés → **5 NAP KÉSÉS** ✅
11. Rendszer: Késedelmi díj kalkuláció:
    - 5 nap * Napi díj * 1.5 = 5 * 10k * 1.5 = **75 000 Ft** ✅
12. Pult: 360° kép (return) → Nincs sérülés ✅
13. Pult: Tartozékok csippantás → Minden megvan ✅
14. Pénzügy: Kaució elszámolás:
    - Kaució: 100 000 Ft
    - Késedelmi díj: 75 000 Ft
    - Visszajár: 25 000 Ft ✅
15. Email: Ügyfél értesítés (késedelmi díj részletezve) ✅
16. Pénzügy: 25k visszautalás ✅
17. Rendszer: Bérlés lezárás ✅

**Elvárt eredmény**: Késedelmi díj automatikusan levonva, különbözet visszajár

---

## 9. Sikerkritériumok

| KPI | Cél | Mérés |
|-----|-----|-------|
| **Átlagos bérlés felvételi idő** | <10 perc (törzsvendég), <15 perc (új ügyfél) | Timer (rendszer) |
| **Kaució elszámolás pontosság** | 100% (nincs eltérés) | Audit (havi) |
| **AI sérülés detektálás pontosság** | >95% (False Positive <5%) | Manuális ellenőrzés vs AI (100 minta) |
| **Késedelmi díj automatizáció** | 100% (nincs manuális számítás) | Audit (havi) |
| **Ügyfél elégedettség** | >90% (NPS) | Survey (bérlés lezárás után) |
| **Pénzügyi zárás hibaarány** | <1% (kaució elszámolás) | Könyvelői audit (havi) |

---

## 10. Kockázatok és Mitigálások

| Kockázat | Valószínűség | Hatás | Mitigálás |
|----------|--------------|-------|-----------|
| **Bank API nem támogatja blokkolást** | Közepes | Magas | Fallback: Azonnali levonás + visszautalás (komplikáltabb) |
| **AI téves sérülés detektálás** | Magas (kezdetben) | Közepes | Manuális felülbírálat + AI tréning (feedback loop) |
| **Ügyfél nem ismeri el károkozást** | Alacsony | Magas | ÁSZF, biztosítás, jogi konzultáció |
| **GDPR probléma (személyi scan)** | Közepes | Magas | Jogi vélemény, adatvédelmi szabályzat, opt-in |
| **Személyi igazolvány kötelező → Törzsvendég sértődés** | Magas | Közepes | Időzített kötelező (6 hónap), magyarázat (új rendszer) |
| **Kártya visszautalás bonyolult (különbözet)** | Közepes | Közepes | Pénzügyi folyamatok dokumentálása, könyvelői training |

---

**Következő lépés**: ADR-ek megírása + Diagram készítés (Excalidraw)

**Készítette**: Mary (Analyst)
**Státusz**: ✅ Kész (Review várakozás)
**Következő review**: 2025-01-05
