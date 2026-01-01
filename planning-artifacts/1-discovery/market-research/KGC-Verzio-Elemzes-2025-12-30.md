# KGC ERP - Verzió Elemzés és E2E Folyamat Terv

**Dátum**: 2025-12-30
**Verzió**: 1.0
**Elemző**: Mary (Analyst)
**Projekt**: KGC ERP v7 Tervezés

---

## 1. Executive Summary

### 1.1 Főbb Változások

A KGC ERP rendszer 2025 decemberében jelentős evolúción ment keresztül:

- **v3 (2025-12-12)**: Baseline verzió - Ügyfélnek elküldött komplett diagram csomag (~40-50 diagram)
- **v6 (2025-12-29)**: Részben frissített verzió - **Csak Inventory modul (5 diagram)** készült el
- **v7 (tervezett)**: Teljes körű frissítés az új követelmények (2025-12-16/29 transcriptek) alapján

### 1.2 Kritikus Gap-ek

⚠️ **ÓRIÁSI HIÁNY**: A v6-ban csak az Inventory modul 5 diagramja készült el, a többi modul **TELJESEN HIÁNYZIK**:

- ❌ Bérlés modul teljes folyamata
- ❌ Szervíz modul teljes folyamata
- ❌ Értékesítés modul
- ❌ Pénzügy modul
- ❌ Beszerzés/Bevételezés modul
- ❌ CRM/Partner kezelés
- ❌ HR modul

### 1.3 Javasolt Következő Lépések

1. **AZONNAL**: Transcript-ekből hiányzó folyamatok azonosítása
2. **v7 Diagram Terv**: Összes modul átdolgozása/kiegészítése
3. **ADR szükségletek**: Architektúra döntések dokumentálása (pl. kaució kezelés)
4. **E2E Folyamatok**: Komplett user journey-k definiálása

---

## 2. Verzió Timeline

```
v3 (2025-12-12)
│
├─ Baseline: ~40-50 diagram
├─ Összes modul: Bérlés, Szervíz, Inventory, Pénzügy, stb.
├─ Ügyfélnek átadva
│
v6 (2025-12-29)
│
├─ ⚠️ RÉSZLEGES: Csak Inventory modul (5 diagram)
├─ Új követelmények (transcript 2025-12-16, 2025-12-29)
├─ Hiányzik: 90% a diagramokból
│
v7 (2025-12-30 - tervezés alatt) ← MOST KÉSZÜLÜNK
│
├─ Teljes frissítés
├─ Minden modul átdolgozása
├─ Új funkciók beépítése
└─ E2E folyamatok
```

---

## 3. Verzió Összehasonlító Táblázat

### 3.1 Inventory / Raktárkezelés Modul

| Folyamat/Feature | v3 (2025-12-12) | v6 (2025-12-29) | Transcript (2025-12-29) | Gap | Prioritás |
|------------------|-----------------|-----------------|------------------------|-----|-----------|
| **Bérlési Folyamat** | ✅ Diagram létezett | ✅ **Frissítve** (inv-01) | ✅ Multi-location picking igény | ⚠️ v2.0 funkcionalitás hiányzik | **MAGAS** |
| **Inventory API (checkBergepAvailability)** | ❓ Ismeretlen | ✅ **ÚJ** (inv-02) | ✅ Multi-warehouse query | ⚠️ Multi-location query frissítés kell | **MAGAS** |
| **Ügyfél Bérlési Út** | ❓ Ismeretlen | ✅ **ÚJ** (inv-03) | ✅ Picking lista UI bővítés | ⚠️ UX layer hiányzik | **KÖZEPES** |
| **Webhook Szinkronizáció** | ❓ Ismeretlen | ✅ Diagram (inv-04) | ✅ Változatlan v2.0-ban | ✅ Kész | **ALACSONY** |
| **Bérgép Státusz Átmenetek** | ❓ Ismeretlen | ✅ Diagram (inv-05) | ✅ Változatlan v2.0-ban | ✅ Kész | **ALACSONY** |
| **Multi-Location (v2.0)** | ❌ Nem volt | ⚠️ Csak megjegyzésekben | ✅ ADR-016, CIKK_LOCATION tábla | ❌ **HIÁNYZIK DIAGRAM** | **KRITIKUS** |
| **Serial Number Tracking** | ❓ Ismeretlen | ✅ Spec-ben | ✅ Bérgép követés | ⚠️ Flow diagram hiányzik | **MAGAS** |
| **Polc/Doboz Helykód** | ❌ Nem volt | ❌ Nincs | ✅ **ÚJ igény** (transcript) | ❌ **HIÁNYZIK** | **KRITIKUS** |

---

### 3.2 Bérlés Modul

| Folyamat/Feature | v3 (2025-12-12) | v6 (2025-12-29) | Transcript (2025-12-29) | Gap | Prioritás |
|------------------|-----------------|-----------------|------------------------|-----|-----------|
| **Ügyfél Azonosítás** | ✅ Volt | ❌ **HIÁNYZIK** | ✅ Személyi igazolvány kérdés | ❌ **DÖNTÉSI FA HIÁNYZIK** | **KRITIKUS** |
| **Törzs Ügyfél Kezelés** | ✅ Volt | ❌ **HIÁNYZIK** | ✅ Kártyaalapú törzs rendszer | ❌ **HIÁNYZIK** | **KRITIKUS** |
| **Kaució Fizetés** | ✅ Volt | ❌ **HIÁNYZIK** | ✅ Készpénz/Kártya/Blokkolás | ❌ **HIÁNYZIK + ADR KELL** | **KRITIKUS** |
| **Kaució Visszatartás** | ⚠️ Részleges? | ❌ **HIÁNYZIK** | ✅ **ÚJ**: Sérülés vizsgálat workflow | ❌ **HIÁNYZIK + ADR KELL** | **KRITIKUS** |
| **Bérleti Díj Számítás** | ✅ Volt | ❌ **HIÁNYZIK** | ✅ Napi/Heti/30 nap, Ünnepnap kezelés | ❌ **HIÁNYZIK** | **KRITIKUS** |
| **Késedelmi Díj** | ✅ Volt | ❌ **HIÁNYZIK** | ✅ Automatikus számítás, Hétvége 1.5 nap | ❌ **HIÁNYZIK** | **MAGAS** |
| **Bérlés Hosszabbítás** | ❓ Ismeretlen | ❌ **HIÁNYZIK** | ✅ Automatikus + manuális | ❌ **HIÁNYZIK** | **MAGAS** |
| **Gép Visszavétel** | ✅ Volt? | ❌ **HIÁNYZIK** | ✅ Vizuális ellenőrzés, kép/videó | ❌ **HIÁNYZIK** | **MAGAS** |
| **Tartozékok Kezelés** | ❓ Ismeretlen | ❌ **HIÁNYZIK** | ✅ Töltő, akkumulátor, stb. | ❌ **HIÁNYZIK** | **KÖZEPES** |

---

### 3.3 Szervíz Modul

| Folyamat/Feature | v3 (2025-12-12) | v6 (2025-12-29) | Transcript (2025-12-29) | Gap | Prioritás |
|------------------|-----------------|-----------------|------------------------|-----|-----------|
| **Gép Felvétel** | ✅ Volt | ❌ **HIÁNYZIK** | ✅ Bevizsgálási díj | ❌ **HIÁNYZIK** | **KRITIKUS** |
| **Munkalap Generálás** | ✅ Volt | ❌ **HIÁNYZIK** | ✅ Vonalkód matrica, doboz hozzárendelés | ❌ **HIÁNYZIK** | **KRITIKUS** |
| **Munkalap Életciklus** | ✅ Volt | ❌ **HIÁNYZIK** | ✅ Árajánlat → Jóváhagyás → Javítás → Számlázható | ❌ **HIÁNYZIK** | **KRITIKUS** |
| **Prioritás Kezelés** | ❓ Ismeretlen | ❌ **HIÁNYZIK** | ✅ Sürgős, Garanciális, Normál | ❌ **HIÁNYZIK** | **MAGAS** |
| **Garanciális Folyamat** | ❓ Ismeretlen | ❌ **HIÁNYZIK** | ✅ 2 hét törvényi határidő | ❌ **HIÁNYZIK** | **MAGAS** |
| **Árajánlat Készítés** | ✅ Volt? | ❌ **HIÁNYZIK** | ✅ Elfogadás/Elutasítás → Javítás/Visszaadás | ❌ **HIÁNYZIK** | **MAGAS** |
| **Visszaadás (szétszedve/összerakva)** | ❌ Nem volt | ❌ **HIÁNYZIK** | ✅ **ÚJ igény**: Döntési pont | ❌ **HIÁNYZIK** | **KÖZEPES** |
| **Alkatrész Rendelés Szervízhez** | ✅ Volt? | ❌ **HIÁNYZIK** | ✅ Munkalaphoz kötött, polc/doboz | ❌ **HIÁNYZIK** | **MAGAS** |
| **Robbantott Ábra Kezelés** | ❓ Ismeretlen | ❌ **HIÁNYZIK** | ✅ Géptípus/gyári szám alapú keresés | ❌ **HIÁNYZIK** | **MAGAS** |
| **Külsős Gép Felvétel** | ❓ Ismeretlen | ❌ **HIÁNYZIK** | ✅ Nem KGC gép szervizbe hozása | ❌ **HIÁNYZIK** | **KÖZEPES** |
| **Kárfelvételi Jegyzőkönyv** | ❌ Nem volt | ❌ **HIÁNYZIK** | ✅ **ÚJ**: Bérlés sérüléshez | ❌ **HIÁNYZIK + ADR KELL** | **KRITIKUS** |
| **Polc/Doboz Nyomkövetés** | ❌ Nem volt | ❌ **HIÁNYZIK** | ✅ **ÚJ**: QR kód, vonalkód | ❌ **HIÁNYZIK** | **KRITIKUS** |

---

### 3.4 Pénzügy Modul

| Folyamat/Feature | v3 (2025-12-12) | v6 (2025-12-29) | Transcript (2025-12-29) | Gap | Prioritás |
|------------------|-----------------|-----------------|------------------------|-----|-----------|
| **Számla Bevételezés** | ✅ Volt | ❌ **HIÁNYZIK** | ✅ Email/Papír/Elektronikus | ❌ **HIÁNYZIK** | **KRITIKUS** |
| **OCR Számla Beolvasás** | ❌ Nem volt | ❌ **HIÁNYZIK** | ✅ **ÚJ igény**: Automatizálás | ❌ **HIÁNYZIK** | **MAGAS** |
| **Számlázás (Bérlés)** | ✅ Volt | ❌ **HIÁNYZIK** | ✅ Készpénz/Kártya/Átutalás | ❌ **HIÁNYZIK** | **KRITIKUS** |
| **Számlázás (Szervíz)** | ✅ Volt | ❌ **HIÁNYZIK** | ✅ Munkalap → Számla | ❌ **HIÁNYZIK** | **KRITIKUS** |
| **Kaució Elszámolás** | ⚠️ Részleges? | ❌ **HIÁNYZIK** | ✅ Kártya visszautalás, készpénz | ❌ **HIÁNYZIK + ADR KELL** | **KRITIKUS** |
| **Részletfizetés** | ❓ Ismeretlen | ❌ **HIÁNYZIK** | ✅ Megemlítve | ❌ **HIÁNYZIK** | **KÖZEPES** |
| **Napi Pénztár Zárás** | ✅ Volt? | ❌ **HIÁNYZIK** | ✅ Kártya/Készpénz reconciliation | ❌ **HIÁNYZIK** | **MAGAS** |
| **Szállító Kezelés (Feketézés)** | ⚠️ Workaround? | ❌ **HIÁNYZIK** | ✅ "Szállító" módszer (NAV kockázat) | ❌ **HIÁNYZIK + AUDIT KELL** | **KRITIKUS** |

---

### 3.5 Beszerzés / Bevételezés Modul

| Folyamat/Feature | v3 (2025-12-12) | v6 (2025-12-29) | Transcript (2025-12-29) | Gap | Prioritás |
|------------------|-----------------|-----------------|------------------------|-----|-----------|
| **Megrendelés Kosár** | ✅ Volt | ❌ **HIÁNYZIK** | ✅ Dupla rendelés probléma | ❌ **HIÁNYZIK + FIX KELL** | **KRITIKUS** |
| **Automatikus Rendelés** | ❌ Nem volt | ❌ **HIÁNYZIK** | ✅ Készlet szint alapján | ❌ **HIÁNYZIK** | **MAGAS** |
| **Beszállító API Integráció** | ❌ Nem volt | ❌ **HIÁNYZIK** | ✅ Makita, Stihl, Hikoki, stb. | ❌ **HIÁNYZIK** | **MAGAS** |
| **Árak Automatikus Frissítés** | ❌ Nem volt | ❌ **HIÁNYZIK** | ✅ Excel/API lekérés | ❌ **HIÁNYZIK** | **MAGAS** |
| **Rendelés vs. Számla Párosítás** | ⚠️ Manuális? | ❌ **HIÁNYZIK** | ✅ Rendelésszám nyomkövetés | ❌ **HIÁNYZIK** | **KRITIKUS** |
| **Hiány Kezelés** | ⚠️ Manuális? | ❌ **HIÁNYZIK** | ✅ Hiány raktár, reklamáció | ❌ **HIÁNYZIK** | **MAGAS** |
| **Vonalkód Csippantás** | ⚠️ Részleges? | ❌ **HIÁNYZIK** | ✅ Bevételezés során | ❌ **HIÁNYZIK** | **KRITIKUS** |
| **Munkalaphoz Kötött Rendelés** | ❌ Nem volt | ❌ **HIÁNYZIK** | ✅ **ÚJ**: Szervíz alkatrész | ❌ **HIÁNYZIK** | **KRITIKUS** |
| **Dobozba Szortírozás** | ❌ Nem volt | ❌ **HIÁNYZIK** | ✅ **ÚJ**: Munkalap → Doboz | ❌ **HIÁNYZIK** | **MAGAS** |

---

### 3.6 CRM / Partner Kezelés

| Folyamat/Feature | v3 (2025-12-12) | v6 (2025-12-29) | Transcript (2025-12-29) | Gap | Prioritás |
|------------------|-----------------|-----------------|------------------------|-----|-----------|
| **Ügyfél Adatkezelés** | ✅ Volt | ❌ **HIÁNYZIK** | ✅ Adategyeztetés (6 hónap) | ❌ **HIÁNYZIK** | **KRITIKUS** |
| **Fekete/Fehér Lista** | ❌ Nem volt | ❌ **HIÁNYZIK** | ✅ **ÚJ**: Franchise megosztás | ❌ **HIÁNYZIK + GDPR** | **KRITIKUS** |
| **Pontozási Rendszer** | ❌ Nem volt | ❌ **HIÁNYZIK** | ✅ **ÚJ**: Ügyfél minősítés | ❌ **HIÁNYZIK** | **MAGAS** |
| **Megjegyzések** | ⚠️ Volt? | ❌ **HIÁNYZIK** | ✅ Kód alapú jelölések | ❌ **HIÁNYZIK** | **KÖZEPES** |
| **Twenty CRM Integráció** | ❌ Nem volt | ❌ **HIÁNYZIK** | ✅ Mentioned in transcript | ❌ **HIÁNYZIK** | **KÖZEPES** |

---

### 3.7 Egyéb Funkciók

| Folyamat/Feature | v3 (2025-12-12) | v6 (2025-12-29) | Transcript (2025-12-29) | Gap | Prioritás |
|------------------|-----------------|-----------------|------------------------|-----|-----------|
| **Vonalkód Generálás** | ⚠️ Részleges? | ❌ **HIÁNYZIK** | ✅ Nincs gyári → Generálás | ❌ **HIÁNYZIK** | **KRITIKUS** |
| **Cikkszám → Vonalkód Váltás** | ❌ Nem volt | ❌ **HIÁNYZIK** | ✅ **ÚJ**: Paradigmaváltás | ❌ **HIÁNYZIK** | **KRITIKUS** |
| **Kép/Videó Rögzítés** | ❌ Nem volt | ❌ **HIÁNYZIK** | ✅ **ÚJ**: AI képfelismerés | ❌ **HIÁNYZIK** | **MAGAS** |
| **AI Chat Asszisztens** | ❌ Nem volt | ❌ **HIÁNYZIK** | ✅ **ÚJ**: Koko/Jani támogatás | ❌ **HIÁNYZIK** | **KÖZEPES** |
| **Audit Trail** | ❓ Ismeretlen | ❌ **HIÁNYZIK** | ✅ **ÚJ**: Ki, mit, mikor | ❌ **HIÁNYZIK** | **KRITIKUS** |
| **Email Szabályok** | ❌ Nem volt | ❌ **HIÁNYZIK** | ✅ **ÚJ**: Számlák automatikus szortírozás | ❌ **HIÁNYZIK** | **KÖZEPES** |

---

## 4. E2E Folyamatok Részletesen

### E2E-1: Bérlés Teljes Folyamat

**Főbb lépések:**
1. Ügyfél azonosítás (személyi igazolvány? / törzsvendég?)
2. Gép kiválasztás (készlet ellenőrzés → Inventory API)
3. Kaució felvétel (kártya blokkolás / készpénz?)
4. Tartozékok rögzítése (töltő, akkumulátor)
5. Vizuális dokumentálás (360° kép/videó + AI)
6. Bérleti díj rögzítése (napi/heti/30 nap kalkuláció)
7. Szerződés aláírás (digitális tablet)
8. Gép kiadás (státusz: bent → kint)
9. **Visszavétel:**
   - Késés ellenőrzés → Automatikus késedelmi díj
   - Vizuális ellenőrzés (AI összehasonlítás)
   - Sérülés? → Kárfelvételi jegyzőkönyv → Szervízbe küldés → Kaució visszatartás
   - Tartozékok komplett? → Hiány rögzítés
10. Kaució elszámolás (kártya visszautalás / készpénz visszaadás)
11. Bérlés lezárása (státusz: kint → bent / szervíz)

**Érintett rendszerek:** KGC ERP, Twenty CRM, Inventory, Pénzügy, Szervíz
**Diagram típus:** User Journey + Swimlane + Döntési Fa
**Komplexitás:** **NAGYON MAGAS** (50+ lépés, 15+ döntési pont)
**Státusz:** ❌ **v6-ban TELJESEN HIÁNYZIK**

---

### E2E-2: Szervíz Teljes Folyamat

**Főbb lépések:**
1. Gép beérkezés (külsős / belsős / bérlés sérült)
2. Bevizsgálási díj fizetés (opcionális árajánlatnál)
3. Munkalap generálás (vonalkód matrica)
4. Doboz/polc hozzárendelés (QR kód)
5. Prioritás meghatározás (sürgős / garanciális / normál)
6. Diagnózis
7. Árajánlat készítés → Ügyfél jóváhagyás (email/SMS/telefon)
8. Alkatrész rendelés (munkalaphoz kötött)
   - Robbantott ábra keresés (géptípus/gyári szám)
   - Kosárba helyezés (munkalap azonosító)
   - Rendelés leadás → Beszállító API
9. Alkatrész bevételezés (munkalaphoz automatikus hozzárendelés)
10. Javítás elvégzése
11. Tesztelés
12. Munkalap lezárása (státusz: elkészült → számlázható)
13. Ügyfél értesítés
14. Kiadás (szétszedve / összerakva?)
15. Számlázás + Fizetés

**Érintett rendszerek:** KGC ERP, Inventory, Pénzügy, Beszerzés
**Diagram típus:** Swimlane (Pult/Szervíz/Beszerzés) + State Machine (Munkalap)
**Komplexitás:** **NAGYON MAGAS** (40+ lépés, 10+ döntési pont)
**Státusz:** ❌ **v6-ban TELJESEN HIÁNYZIK**

---

### E2E-3: Beszerzés → Bevételezés → Raktározás

**Főbb lépések:**
1. Készlet monitoring (automatikus riasztás alacsony szintnél)
2. Rendelési kosár összeállítása
   - Ügyfél árat néz → **NE** menjen a kosárba automatikusan
   - Szervíz munkalaphoz rendel → Automatikusan kosárba (munkalap ID)
3. Rendelés leadás (beszállítónként)
   - API integráció (Makita, Stihl, stb.)
   - Email / Web scraping (ha nincs API)
4. Rendelés nyomkövetés (nyitott tételek)
5. Termék beérkezés (értesítés)
6. **Bevételezés:**
   - Számla párosítás (rendelésszám alapján)
   - Vonalkód csippantás (minden tétel)
   - Eltérés kezelés (hiány → hiány raktár → reklamáció email)
7. **Szortírozás:**
   - Bolt raktár
   - Szervíz munkalaphoz (dobozba, munkalap ID matrica)
   - Bérlés raktár
8. Polc/doboz helyre rakás (QR kód párosítás)
9. Készlet frissítés (real-time)

**Érintett rendszerek:** KGC ERP, Inventory, Pénzügy, Beszállító API-k
**Diagram típus:** Swimlane (Beszerzés/Raktár/Szervíz) + Flowchart
**Komplexitás:** **MAGAS** (30+ lépés, 8+ döntési pont)
**Státusz:** ❌ **v6-ban TELJESEN HIÁNYZIK**

---

### E2E-4: Pénzügy - Napi Zárás

**Főbb lépések:**
1. Számlák összegyűjtése (email szabályok → központi inbox)
2. OCR beolvasás (papír számlák)
3. Számla → Rendelés párosítás
4. Pénztár zárás (készpénz + kártya reconciliation)
5. Kauciók elszámolása
6. Szállító tételek lezárása (napi "feketézés" - **AUDIT KOCKÁZAT**)
7. Napi riport generálás
8. Könyvelő export

**Érintett rendszerek:** KGC ERP, Pénzügy, OCR szolgáltatás
**Diagram típus:** Flowchart + Döntési Fa
**Komplexitás:** **KÖZEPES** (20+ lépés, 5+ döntési pont)
**Státusz:** ❌ **v6-ban TELJESEN HIÁNYZIK**

---

### E2E-5: CRM - Ügyfél Életciklus

**Főbb lépések:**
1. Első kontaktus (bolt/telefon/web)
2. Ügyfél adatfelvétel (személyi igazolvány scan)
3. Adategyeztetés (6 hónap timer)
4. Tranzakciók rögzítése (bérlés/szervíz/vásárlás)
5. Pontozás frissítése (pl. koszosan hozta vissza → -1 pont)
6. Fekete/Fehér lista kezelés (franchise megosztás - **GDPR KÉRDÉS**)
7. Törzsvendég státusz (automatikus feltételek)
8. Marketing (Twenty CRM integráció?)

**Érintett rendszerek:** KGC ERP, Twenty CRM
**Diagram típus:** User Journey + State Machine
**Komplexitás:** **KÖZEPES** (15+ lépés, 6+ döntési pont)
**Státusz:** ❌ **v6-ban TELJESEN HIÁNYZIK**

---

## 5. Gap Összefoglaló

### 5.1 ÚJ Folyamatok (transcript-ben van, v6-ban NINCS)

🆕 **Bérlés modul teljes újragondolás:**
- Kaució kártya blokkolás (bank API?)
- Kaució visszatartás + kárfelvételi jegyzőkönyv
- Vizuális dokumentálás (360° kép + AI összehasonlítás)
- Tartozékok nyomkövetés
- Személyi igazolvány scan (kötelező? / opcionális?)
- Törzsvendég kártyaalapú rendszer

🆕 **Szervíz modul kiegészítések:**
- Polc/doboz QR kód tracking
- Munkalaphoz kötött alkatrész rendelés
- Szétszedve/összerakva visszaadás döntés
- Robbantott ábra géptípus/gyári szám keresés
- Külsős gép felvétel

🆕 **Beszerzés/Bevételezés:**
- Dupla rendelés megakadályozás (kosár logika fix)
- Munkalaphoz automatikus hozzárendelés
- Dobozba szortírozás (munkalap ID matrica)
- Hiány raktár + automatikus reklamáció

🆕 **Pénzügy:**
- OCR számla beolvasás
- Email szabályok (központi számla inbox)
- Kártya kaució visszautalás logika
- Szállító tételek audit trail (**NAV kockázat!**)

🆕 **CRM:**
- Fekete/Fehér lista (franchise megosztás - **GDPR!**)
- Pontozási rendszer
- Kódolt megjegyzések (pl. IBM holocaust példa alapján - **ETIKAI KÉRDÉS!**)

🆕 **Egyéb:**
- Vonalkód generálás (nincs gyári → rendszer generál)
- Cikkszám → Vonalkód paradigmaváltás
- AI Chat asszisztens (Koko/Jani - support bot)
- Audit trail (ki, mit, mikor)

---

### 5.2 FRISSÍTENDŐ Folyamatok (v6-ban van, de változott)

⚠️ **Inventory modul:**
- Multi-Location picking javaslat (v2.0 - ADR-016)
- Multi-warehouse query (checkBergepAvailability módosítás)
- Picking lista UI (raktáros: melyik polcról?)

⚠️ **Bérlési díj számítás:**
- Napi/Heti/30 nap egyszerűsítés (hétvége/ünnep NEM számít)
- Automatikus késedelmi díj (hétvége = 1.5 nap)

---

### 5.3 TÖRLENDŐ / DEPRECATED

❌ **Egyelőre nincs explicit törlendő funkció**, de:
- "Szállító" workaround a feketézéshez → **AUDIT KOCKÁZAT**, átgondolás szükséges
- Manuális cikkszám kezelés → Vonalkód centrikus rendszerre váltás

---

## 6. Diagram Terv (v7-hez)

### 6.1 KRITIKUS Prioritás (azonnal elkészítendő)

1. **Bérlés - Teljes E2E Folyamat** (50+ lépés)
   - Swimlane: Ügyfél / Pult / Raktár / Pénzügy
   - Döntési fa: Személyi igazolvány? Törzsvendég? Kaució típus?
   - User Journey: Ügyfél perspektíva
   - State Machine: Bérlés státusz (pending → aktív → késés → lezárt)

2. **Kaució Kezelés - Részletes Flow** (ADR szükséges!)
   - Kártya blokkolás logika
   - Visszatartás workflow (sérülés vizsgálat)
   - Elszámolás (visszautalás / készpénz)
   - Edge case-ek: Kaució nélkül, részleges visszatartás, stb.

3. **Szervíz - Teljes E2E Folyamat** (40+ lépés)
   - Swimlane: Pult / Szervíz / Beszerzés / Raktár
   - Munkalap életciklus (State Machine)
   - Polc/doboz tracking (QR kód párosítás)

4. **Beszerzés/Bevételezés - Dupla Rendelés Fix** (20+ lépés)
   - Flowchart: Kosár logika (ügyfél árat néz NE menjen kosárba!)
   - Munkalaphoz automatikus hozzárendelés
   - Szortírozás (Bolt/Szervíz/Bérlés)

5. **Vonalkód Generálás és Paradigmaváltás** (15+ lépés)
   - Flowchart: Nincs gyári vonalkód → Generálás
   - Cikkszám → Vonalkód centrikus működés
   - Alkalmazottak betanítása (UI hints)

6. **Pénzügy - Számla Bevételezés és Napi Zárás** (25+ lépés)
   - Flowchart: Email szabályok → OCR → Párosítás
   - Szállító tételek kezelése (AUDIT KOCKÁZAT!)

---

### 6.2 MAGAS Prioritás (1-2 héten belül)

7. **Inventory - Multi-Location Picking** (v2.0 feature)
   - Algorithm: Kiadási prioritás (pörgős készlet)
   - UI: Polc választó raktárosnak
   - Picking lista generálás

8. **CRM - Fekete/Fehér Lista + Pontozás** (GDPR compliance!)
   - Data Model: Partner adatbázis bővítés
   - Privacy: Franchise megosztás szabályok
   - Kódolt jelölések (etikai megfontolások)

9. **Szervíz - Robbantott Ábra Keresés** (20+ lépés)
   - Flowchart: Géptípus / Gyári szám alapú keresés
   - API integráció (Parts.cat, gyárak)
   - Fallback: Manuális feltöltés

10. **Bérlés - Vizuális Dokumentálás** (AI integráció)
    - Flowchart: 360° kép rögzítés
    - AI összehasonlítás (kivétel vs visszahozatal)
    - Sérülés detektálás

---

### 6.3 KÖZEPES Prioritás (1 hónapon belül)

11. **Bérlés - Tartozékok Kezelés** (15+ lépés)
12. **Szervíz - Szétszedve/Összerakva Döntés** (5+ lépés)
13. **Pénzügy - Részletfizetés** (10+ lépés)
14. **AI Chat Asszisztens - Koko/Jani** (Support bot integráció)
15. **Email Szabályok - Számlák Szortírozása** (Outlook Rules)
16. **Audit Trail - Ki, Mit, Mikor** (Minden entitáshoz)

---

## 7. ADR Igények (Architektúra Döntés Rekordok)

### ADR-??? Kaució Kártya Blokkolás

**Probléma:**
- Kártya kaució: pénz blokkolása (hold) vs azonnali levonás?
- Bank API támogatja-e a hold funkciót?
- Visszautalás logika (különbözet kezelés ha hosszabbítás)

**Javasolt Döntés:**
1. **Kutatás**: Melyik bank API támogatja a "hold" műveletet?
2. **Fallback**: Ha nincs hold → Azonnali levonás + visszautalás (reconciliation)
3. **Számla**: Kaució 0% ÁFA tételként szerepel (pénzügyi egyeztetés)

**Státusz**: ⚠️ DÖNTÉSRE VÁR

---

### ADR-??? Kaució Visszatartás Workflow

**Probléma:**
- Sérült gép visszajön → Kaució visszatartás + Kárfelvételi jegyzőkönyv
- Bérlés státusz: "függő elszámolás"
- Szervízbe küldés → Munkalap → Költség meghatározás → Kaució elszámolás

**Javasolt Döntés:**
1. **Bérlés státusz**: "pending_settlement" (új státusz)
2. **Kárfelvételi jegyzőkönyv**: Sablon + Ügyfél aláírás (digitális)
3. **Kapcsolt munkalap**: Bérlés ID → Szervíz munkalap ID (foreign key)
4. **Email értesítés**: Ügyfél + Fizető fél (ha eltér)

**Státusz**: ⚠️ DÖNTÉSRE VÁR

---

### ADR-??? Fekete/Fehér Lista GDPR Compliance

**Probléma:**
- Franchise megosztás: Egyik bolt adatait látja a másik
- GDPR: Személyes adatok megosztása ügyfél beleegyezése nélkül?
- Etikai kérdés: Kódolt jelölések (IBM holocaust párhuzam!)

**Javasolt Döntés:**
1. **GDPR Audit**: Jogi vélemény kérése
2. **Opt-in**: Ügyfél beleegyezése a franchise hálózati megosztáshoz
3. **Anonimizálás**: Ne név, csak hash vagy ID megosztása
4. **Kódok**: Etikusan semleges jelölések (NE színek, csak kategóriák)

**Státusz**: ❌ **KRITIKUS - JOGI VÉLEMÉNY SZÜKSÉGES**

---

### ADR-??? Szállító Tételek vs Feketézés

**Probléma:**
- Jelenlegi workaround: Készpénz bérlés → "Szállító" tétel (napi záráskor törlés)
- NAV audit kockázat: Tranzakciók nincsenek rögzítve
- Szolgáltatás (bérlés) ≠ Termék (ezért működött eddig?)

**Javasolt Döntés:**
1. **Audit Trail**: Minden készpénz bérlés KÜLÖN entitás (NE szállító!)
2. **Bizonylat**: "Bérlési nyugta" (0 Ft - csak regisztráció)
3. **Napi zárás**: Reconciliation (kassza vs rendszer)
4. **NAV riport**: Külön szolgáltatás kategória

**Státusz**: ⚠️ **KRITIKUS - KÖNYVELŐI VÉLEMÉNY SZÜKSÉGES**

---

### ADR-016 Multi-Location Raktárkezelés (MEGLÉVŐ)

**Probléma**: Már dokumentálva van
**Státusz**: ✅ Elfogadva (v2.0 feature)

---

## 8. Kérdések Javo!-hoz

### 8.1 Kaució Kezelés

1. **Kártya blokkolás**: Melyik bankkal dolgozik a KGC? Támogatja-e a "hold" műveletet az API-juk?
2. **Visszatartás**: Ha sérült gépet hoz vissza az ügyfél, DE nincs kaució (törzsvendég) → Mi a folyamat?
3. **Elszámolás**: Kártya kaució esetén, ha hosszabbít az ügyfél → Visszautalás + újra blokkolás? Vagy különbözet kezelés?

### 8.2 Személyi Igazolvány Kezelés

4. **Kötelező?**: Minden ügyfélnek kötelező személyi igazolvány? Vagy van kivétel (törzsvendég)?
5. **Scan**: Scan-eli a rendszer a személyi igazolványt (GDPR!)? Vagy csak ellenőrzés?
6. **Adattárolás**: Személyi igazolvány szám tárolása? Vagy csak validáció?

### 8.3 Fekete/Fehér Lista

7. **GDPR**: Van-e jogi vélemény a franchise hálózati adatmegosztásról?
8. **Opt-in**: Kér-e a KGC ügyfél beleegyezést az adatmegosztáshoz?
9. **Kódok**: Milyen jelöléseket szeretnének? (Szín? Ikon? Szöveg kategória?)

### 8.4 Szervíz - Robbantott Ábra

10. **API-k**: Mely gyáraktól van API hozzáférés? (Makita, Stihl, Robert, stb.)
11. **Parts.cat**: Van előfizetés? Működik minden géptípushoz?
12. **Feltöltés**: Ki tölti fel a hiányzó robbantott ábrákat? (Adminisztrátor? Szervizes?)

### 8.5 Beszerzés

13. **Beszállító API**: Mely cégeknél van API? (Makita, Stihl, Hikoki, Agrofork, stb.)
14. **Árak**: Hány cég küldi Excel-ben az árakat? Milyen gyakran frissülnek?
15. **Dupla rendelés**: Jelenleg hányszor fordul elő havonta? (Baseline mérés)

### 8.6 Pénzügy

16. **OCR**: Van preferált OCR szolgáltató? (Google Vision, Azure, Open Source?)
17. **Szállító tételek**: Könyvelő elfogadja a jelenlegi "workaround"-ot? Vagy audit kockázat?
18. **NAV**: Volt-e valaha NAV ellenőrzés a bérlési bizonylatok kapcsán?

### 8.7 Egyéb

19. **Vonalkód generálás**: Milyen formátum? (EAN-13, Code 128, QR?)
20. **AI Chat**: Koko/Jani - Ki tölti fel a tudásbázist? (FAQ-k, termékinfók)
21. **Audit Trail**: Minden módosítást naplózunk? Vagy csak kritikus műveleteket?

---

## 9. Következő Lépések (Akcióterv)

### Fázis 1: Gap Analízis Lezárása (1 hét)

- [ ] **Javo! visszajelzés** a 21 kérdésre
- [ ] **GDPR jogi vélemény** kérése (Fekete/Fehér lista)
- [ ] **Könyvelői konzultáció** (Szállító tételek)
- [ ] **Bank API kutatás** (Kaució blokkolás)

### Fázis 2: Kritikus ADR-ek Megírása (1 hét)

- [ ] ADR-??? Kaució Kártya Blokkolás
- [ ] ADR-??? Kaució Visszatartás Workflow
- [ ] ADR-??? Fekete/Fehér Lista GDPR
- [ ] ADR-??? Szállító Tételek vs Audit Trail

### Fázis 3: Diagram Készítés (2-3 hét)

**Hét 1:**
- [ ] Bérlés - Teljes E2E Folyamat (Swimlane + User Journey)
- [ ] Kaució Kezelés - Részletes Flow (Flowchart + State Machine)

**Hét 2:**
- [ ] Szervíz - Teljes E2E Folyamat (Swimlane + State Machine)
- [ ] Beszerzés/Bevételezés - Dupla Rendelés Fix (Flowchart)

**Hét 3:**
- [ ] Inventory - Multi-Location Picking (Algorithm + UI)
- [ ] Pénzügy - Számla Bevételezés (Flowchart)
- [ ] Vonalkód Generálás (Flowchart)

### Fázis 4: v7 HTML Generálás (1 hét)

- [ ] Összes diagram SVG export
- [ ] HTML template frissítés (v6 mintára)
- [ ] Interaktív elemek (expand/collapse, notes, dark mode)
- [ ] Változáskövetés (v3 → v6 → v7 diff táblázat)

### Fázis 5: Review és Tesztelés (1 hét)

- [ ] Javo! + Team átnézés
- [ ] Hiányosságok pótlása
- [ ] **v7 Véglegesítés** (2025-01-15?)

---

## 10. Összegzés

### Kritikus Megállapítások

1. **v6 NAGYON HIÁNYOS**: Csak Inventory modul (5 diagram), a többi **90% hiányzik**
2. **Transcript gazdag**: 2025-12-16 és 2025-12-29 jegyzőkönyvek rengeteg új igényt tartalmaznak
3. **Paradigmaváltás**: Cikkszám → Vonalkód, Papír → Digitális, Manuális → AI
4. **Jogi kockázatok**: GDPR (fekete lista), NAV audit (szállító tételek)
5. **Technikai kihívások**: Bank API (kaució), OCR (számlák), AI (képfelismerés)

### Javaslat

**SÜRGŐS**: v7 diagram terv végrehajtása a fenti ütemterv szerint. **Cél**: 2025-01-15 → Komplett v7 diagram csomag (40-50 diagram) + ADR-ek + Kérdések tisztázása.

---

**Készítette**: Mary (Analyst)
**Dátum**: 2025-12-30
**Következő review**: 2025-01-05 (Javo! visszajelzés után)
