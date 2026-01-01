# KGC ERP Verzió Elemzés - Gyors Összefoglaló

**Dátum**: 2025-12-30
**Elemző**: Mary (Analyst)

---

## 📊 Numerikus Összefoglaló

| Metrika | v3 (2025-12-12) | v6 (2025-12-29) | v7 (terv) |
|---------|-----------------|-----------------|-----------|
| **Összes diagram** | ~40-50 | **5** ❌ | ~50-60 |
| **Modulok lefedettek** | ~8-10 | **1** (Inventory) | ~12-15 |
| **Új igények** (transcript alapján) | - | - | **50+** 🆕 |
| **Kritikus gap-ek** | - | **45+** ❌ | - |
| **ADR szükséges** | - | - | **4-6** ⚠️ |

---

## 🎯 Modul Lefedettség

| Modul | v3 Status | v6 Status | v7 Szükséges | Prioritás |
|-------|-----------|-----------|--------------|-----------|
| **Inventory / Raktár** | ✅ Volt | ✅ 5 diagram (v1.0 + v2.0 hint) | ⚠️ Multi-location teljes | **MAGAS** |
| **Bérlés** | ✅ Volt | ❌ **HIÁNYZIK** | ✅ Teljes újraírás (kaució, stb.) | **🔥 KRITIKUS** |
| **Szervíz** | ✅ Volt | ❌ **HIÁNYZIK** | ✅ Teljes újraírás (polc/doboz, stb.) | **🔥 KRITIKUS** |
| **Pénzügy** | ✅ Volt | ❌ **HIÁNYZIK** | ✅ OCR, kaució elszámolás | **🔥 KRITIKUS** |
| **Beszerzés/Bevételezés** | ⚠️ Részleges? | ❌ **HIÁNYZIK** | ✅ Dupla rendelés fix, API | **🔥 KRITIKUS** |
| **CRM / Partner** | ⚠️ Részleges? | ❌ **HIÁNYZIK** | ✅ Fekete/fehér lista (GDPR!) | **MAGAS** |
| **Értékesítés** | ❓ Ismeretlen | ❌ **HIÁNYZIK** | ⚠️ Tisztázandó | **KÖZEPES** |
| **HR** | ❌ Nem volt | ❌ **HIÁNYZIK** | ⚠️ Plugin (Gorilla) | **ALACSONY** |
| **Support** | ❌ Nem volt | ❌ **HIÁNYZIK** | ⚠️ Koko/Jani AI bot | **KÖZEPES** |

---

## 🚨 Top 10 Kritikus Gap

| # | Gap | Érintett Modul | v6 Status | Komplexitás | Blokkoló? |
|---|-----|----------------|-----------|-------------|-----------|
| 1 | **Kaució Kezelés (kártya blokkolás, visszatartás)** | Bérlés | ❌ Hiányzik | 🔥🔥🔥 Nagyon magas | ✅ **IGEN** |
| 2 | **Dupla Rendelés Fix** | Beszerzés | ❌ Hiányzik | 🔥🔥 Magas | ✅ **IGEN** |
| 3 | **Szervíz Munkalap → Alkatrész Rendelés** | Szervíz + Beszerzés | ❌ Hiányzik | 🔥🔥🔥 Nagyon magas | ✅ **IGEN** |
| 4 | **Polc/Doboz QR Kód Nyomkövetés** | Szervíz + Inventory | ❌ Hiányzik | 🔥🔥 Magas | ✅ **IGEN** |
| 5 | **Vonalkód Generálás (nincs gyári)** | Inventory | ❌ Hiányzik | 🔥 Közepes | ⚠️ Részben |
| 6 | **Fekete/Fehér Lista (GDPR!)** | CRM | ❌ Hiányzik | 🔥🔥 Magas (jogi!) | ⚠️ Részben |
| 7 | **OCR Számla Beolvasás** | Pénzügy | ❌ Hiányzik | 🔥 Közepes | ❌ NEM |
| 8 | **Szállító Tételek Audit Trail** | Pénzügy | ❌ Hiányzik | 🔥🔥 Magas (NAV!) | ⚠️ Részben |
| 9 | **Személyi Igazolvány Kezelés** | Bérlés + CRM | ❌ Hiányzik | 🔥 Közepes | ❌ NEM |
| 10 | **Vizuális Dokumentálás (AI)** | Bérlés + Szervíz | ❌ Hiányzik | 🔥🔥🔥 Nagyon magas | ❌ NEM |

---

## 📈 v7 Diagram Terv - Gyors Checklist

### 🔥 KRITIKUS (1-2 hét)

- [ ] **Bérlés E2E** (Swimlane + User Journey + State Machine) → ~10 diagram
  - [ ] Ügyfél azonosítás (személyi igazolvány döntési fa)
  - [ ] Kaució felvétel (kártya vs készpénz)
  - [ ] Kaució visszatartás (sérülés workflow)
  - [ ] Kaució elszámolás (visszautalás logika)
  - [ ] Vizuális dokumentálás (AI)
  - [ ] Tartozékok nyomkövetés
  - [ ] Bérlés státusz gép (State Machine)

- [ ] **Szervíz E2E** (Swimlane + State Machine) → ~8 diagram
  - [ ] Munkalap életciklus
  - [ ] Polc/doboz QR tracking
  - [ ] Munkalaphoz alkatrész rendelés
  - [ ] Robbantott ábra keresés
  - [ ] Szétszedve/összerakva döntés

- [ ] **Beszerzés/Bevételezés** (Flowchart + Swimlane) → ~5 diagram
  - [ ] Dupla rendelés fix (kosár logika)
  - [ ] Munkalaphoz automatikus hozzárendelés
  - [ ] Szortírozás (Bolt/Szervíz/Bérlés)

- [ ] **Pénzügy Alapok** (Flowchart) → ~4 diagram
  - [ ] Számla bevételezés (Email + OCR + Papír)
  - [ ] Napi zárás (Szállító tételek!)

- [ ] **Inventory v2.0** (Algorithm + UI) → ~3 diagram
  - [ ] Multi-location picking javaslat
  - [ ] Polc választó UI

### 🟠 MAGAS (2-4 hét)

- [ ] **CRM** (User Journey + Data Model) → ~4 diagram
  - [ ] Fekete/fehér lista (GDPR compliance!)
  - [ ] Pontozási rendszer

- [ ] **Vonalkód Rendszer** (Flowchart) → ~2 diagram
  - [ ] Generálás (nincs gyári)
  - [ ] Paradigmaváltás (cikkszám → vonalkód)

- [ ] **AI Funkciók** (Sequence Diagram) → ~3 diagram
  - [ ] Kép/videó rögzítés + összehasonlítás
  - [ ] Chat asszisztens (Koko/Jani)

### 🟢 KÖZEPES (1-2 hónap)

- [ ] **Értékesítés** (ha szükséges) → ~3-5 diagram
- [ ] **HR Plugin** (Gorilla integráció) → ~2-3 diagram
- [ ] **Support Bot** (Koko/Jani teljes) → ~2-3 diagram
- [ ] **Audit Trail** (minden entitáshoz) → ~2 diagram

---

## ⚠️ Kritikus Döntések (ADR Szükséges)

### ADR-??? Kaució Kártya Blokkolás

**Kérdés**: Bank API támogatja-e a "hold" műveletet?

**Opciók**:
- A) ✅ Hold támogatott → Blokkolás + feloldás
- B) ❌ Nincs hold → Azonnali levonás + visszautalás (reconciliation)

**Következmény**:
- B opció: Komplikáltabb számla elszámolás (különbözet kezelés)
- B opció: Pénzügyi zárás bonyolultabb (kauciók nyomkövetése)

**Döntés**: ⏳ VÁRAKOZIK (bank API kutatás)

---

### ADR-??? Fekete/Fehér Lista GDPR

**Kérdés**: Franchise hálózaton belül megosztható-e ügyfél pontozás?

**Opciók**:
- A) ✅ Opt-in (ügyfél beleegyezés) + Anonimizálás
- B) ❌ Nincs megosztás (csak lokális bolt)

**Következmény**:
- B opció: Nem védett a franchise hálózat (rossz ügyfél újra próbálkozhat)

**Döntés**: ⏳ VÁRAKOZIK (jogi vélemény)

---

### ADR-??? Szállító Tételek vs Audit Trail

**Kérdés**: Készpénz bérlés bizonylat nélkül → NAV kockázat?

**Opciók**:
- A) ✅ Külön entitás (bérlési nyugta - 0 Ft)
- B) ⚠️ Marad szállító tétel (jelenlegi workaround)

**Következmény**:
- B opció: NAV audit esetén bírság kockázat
- A opció: Könyvelői munka nő (több bizonylat)

**Döntés**: ⏳ VÁRAKOZIK (könyvelői vélemény)

---

## 🎯 Javasolt Munkarend

### Hét 1 (2025-01-01 - 2025-01-07)

**Cél**: Döntések tisztázása + Kritikus ADR-ek

- [ ] **Javo! Meeting**: 21 kérdés megválaszolása
- [ ] **Jogi konzultáció**: GDPR (fekete lista)
- [ ] **Könyvelői konzultáció**: Szállító tételek
- [ ] **Bank API kutatás**: Kaució blokkolás
- [ ] **ADR megírás**: 3-4 kritikus döntés

### Hét 2-3 (2025-01-08 - 2025-01-21)

**Cél**: Kritikus diagramok (Bérlés + Szervíz + Beszerzés)

- [ ] **Bérlés E2E**: 10 diagram elkészítése
- [ ] **Szervíz E2E**: 8 diagram elkészítése
- [ ] **Beszerzés/Bevételezés**: 5 diagram elkészítése

### Hét 4 (2025-01-22 - 2025-01-28)

**Cél**: Magas prioritás (Inventory v2.0, CRM, Pénzügy)

- [ ] **Inventory v2.0**: 3 diagram
- [ ] **CRM**: 4 diagram
- [ ] **Pénzügy**: 4 diagram
- [ ] **Vonalkód**: 2 diagram

### Hét 5 (2025-01-29 - 2025-02-04)

**Cél**: v7 HTML generálás + Review

- [ ] **SVG export**: Összes diagram
- [ ] **HTML sablon**: Frissítés (v6 mintára)
- [ ] **Interaktivitás**: Expand/collapse, notes, dark mode
- [ ] **Változáskövetés**: v3 → v6 → v7 táblázat
- [ ] **Team review**: Javo! + Csapat átnézés

### Hét 6 (2025-02-05 - 2025-02-11)

**Cél**: Finalizálás + Átadás

- [ ] **Hiányosságok pótlása**
- [ ] **v7 Véglegesítés**
- [ ] **Átadás Javo!-nak**
- [ ] **Következő fázis**: Implementáció tervezés

---

## 📞 Azonnali Akciók

### Javo!-tól kért visszajelzés (48 órán belül):

1. ✅ / ❌ Kaució kártya blokkolás (melyik bank?)
2. ✅ / ❌ Személyi igazolvány kötelező?
3. ✅ / ❌ Fekete lista GDPR OK?
4. ✅ / ❌ Szállító tételek könyvelői OK?
5. ✅ / ❌ OCR számla szolgáltató preferencia?

### Csapattól kért input (1 héten belül):

- **DEV Lead**: Bank API kutatás (kaució blokkolás feasibility)
- **UX Designer**: Polc választó UI mockup (Multi-location picking)
- **Architekt**: ADR-ek review (kaució, GDPR, audit trail)
- **PM**: v7 ütemterv jóváhagyás

---

**Készítette**: Mary (Analyst)
**Státusz**: ⏳ Javo! visszajelzésre vár
**Következő update**: 2025-01-05
