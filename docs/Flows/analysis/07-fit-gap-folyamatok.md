# KGC ERP - Fit-Gap Analízis
## Meglévő Folyamatok vs. Találkozón Elhangzott Követelmények

| Tulajdonság | Érték |
|-------------|-------|
| **Dokumentum típus** | Fit-Gap Analízis |
| **Készült** | 2025-12-03 |
| **Forrás - Meglévő** | 21 Excalidraw diagram + dokumentáció |
| **Forrás - Új** | KGC-notes-2025-12-1.all.md + KGC-notes-2025-12-02-01.md |
| **Státusz** | Aktív elemzés |

---

## Összefoglaló

| Kategória | Darabszám |
|-----------|-----------|
| ✅ **FIT** (Teljesen lefedett) | 12 |
| 🔶 **PARTIAL** (Részben lefedett) | 8 |
| ❌ **GAP** (Hiányzik) | 11 |

---

## 1. FIT - Teljesen Lefedett Követelmények

Ezek a követelmények már szerepelnek a meglévő diagramokban és dokumentációkban.

### 1.1 Automatikus Értesítések

| Szempont | Meglévő | Találkozó Igény | Státusz |
|----------|---------|-----------------|---------|
| **Diagram** | [07-ertesitesek-folyamat.md](../diagram-docs/07-ertesitesek-folyamat.md) | Rendelés beérkezett értesítés | ✅ FIT |
| **Entitás** | ÉRTESÍTÉS (5 mező + státusz) | - | ✅ FIT |
| **Csatornák** | SMS + Email | SMS + Email | ✅ FIT |
| **Trigger események** | Bevételezés, lejárat, késés, fizetés | Ugyanezek | ✅ FIT |

**Megjegyzés**: A Zsuzsa által kért "automatikus értesítés az ügyfélnek az áru beérkezésekor" már szerepel a `rendelés_beérkezett` esemény típusként.

---

### 1.2 Fizetési Fegyelem

| Szempont | Meglévő | Találkozó Igény | Státusz |
|----------|---------|-----------------|---------|
| **Diagram** | [07-fizetesi-fegyelem.md](../diagram-docs/07-fizetesi-fegyelem.md) | Lejárt számlával ne lehessen újat adni | ✅ FIT |
| **Blokkolás** | Aktív tartozás esetén tiltás | Ugyanez | ✅ FIT |
| **NAV ellenőrzés** | Adószám validáció | Adószám manuális ellenőrzés automatizálása | ✅ FIT |

---

### 1.3 E-Számla Automatikus Feldolgozás

| Szempont | Meglévő | Találkozó Igény | Státusz |
|----------|---------|-----------------|---------|
| **Diagram** | [07-e-szamla-folyamat.md](../diagram-docs/07-e-szamla-folyamat.md) | Dedikált email a számláknak | ✅ FIT |
| **Feldolgozás** | NAV XML + PDF OCR | E-számla automatikus fogadás | ✅ FIT |
| **Előzetes bevételezés** | Áru érkezésekor véglegesítés | Ugyanez | ✅ FIT |

**Zsuzsa igénye**: "Fontos lenne egy csak számlabefogadásra használt e-mail cím, ahová minden e-számla érkezik."
**Meglévő megoldás**: `szamlak@kisgepcentrum.hu` dedikált email cím IMAP listener-rel.

---

### 1.4 Automatikus Árazás

| Szempont | Meglévő | Találkozó Igény | Státusz |
|----------|---------|-----------------|---------|
| **Diagram** | [07-arrazas-automatizalas.md](../diagram-docs/07-arrazas-automatizalas.md) | Árrés szabályozás cikkcsoportonként | ✅ FIT |
| **Entitás** | ÁRRÉS_KATEGÓRIA | Ugyanez | ✅ FIT |
| **Jóváhagyás** | 20% eltérés felett vezetői | Ugyanez | ✅ FIT |

**Zsuzsa igénye**: "Szigorítani kell az árazást/bevételezést, mert a manuális árrés beállítás (akár 170%) nagy eltéréseket okoz."
**Meglévő megoldás**: Min/Max árrés százalékok cikkcsoportonként definiálva.

---

### 1.5 Multi-Tenant Architektúra

| Szempont | Meglévő | Találkozó Igény | Státusz |
|----------|---------|-----------------|---------|
| **ADR** | ADR-001 Multi-Tenant | Franchise partnerek elkülönítése | ✅ FIT |
| **Megvalósítás** | tenant_id minden entitásban | Ugyanez | ✅ FIT |
| **RLS** | PostgreSQL Row Level Security | Ugyanez | ✅ FIT |

---

### 1.6 RBAC Jogosultságok

| Szempont | Meglévő | Találkozó Igény | Státusz |
|----------|---------|-----------------|---------|
| **Diagram** | [06-egyeb-felhasznalo.md](../diagram-docs/06-egyeb-felhasznalo.md) | Jogosultsági hierarchia | ✅ FIT |
| **Szintek** | 6 szint (SUPER → VIEWER) | Hozzáférés korlátozás | ✅ FIT |
| **Pénzügyi védelem** | Csak BRANCH+ látja | Franchise ne lássa a pénzügyet | ✅ FIT |

**Zsuzsa igénye**: "Teljes mélységig (pl. pénzügyi összesítések) ne lásson bele más"
**Meglévő megoldás**: RBAC mátrix - pénzügyi funkciók csak BRANCH_MANAGER+ szinten.

---

### 1.7 Munka-Gép Kapcsolat (Kereső funkció)

| Szempont | Meglévő | Találkozó Igény | Státusz |
|----------|---------|-----------------|---------|
| **Entitás** | MUNKA_GÉP_KAPCSOLAT | Munka alapján gép keresés | ✅ FIT |
| **Példák** | "téglafal fúrása" → Fúrógép | Ugyanez | ✅ FIT |
| **Prioritás** | 1-10 skála | Legalkalmasabb gép | ✅ FIT |

**Zsuzsa igénye**: "Kereső funkcióra, ahol az ügyfél nem a gépet, hanem a munkát adja meg"
**Meglévő megoldás**: MUNKA_GÉP_KAPCSOLAT entitás prioritással.

---

### 1.8 Karbantartási Útmutatók

| Szempont | Meglévő | Találkozó Igény | Státusz |
|----------|---------|-----------------|---------|
| **Entitás** | KARBANTARTÁS_ÚTMUTATÓ | Géptípusok karbantartása | ✅ FIT |
| **Időszakok** | téli, nyári, hosszú_távú | Téli tárolás előtti karbantartás | ✅ FIT |
| **Tartalom** | Lépések + képek + videó URL | Képekkel illusztrálva | ✅ FIT |

**Zsuzsa igénye**: "Zoli elkezdte összeírni a különböző géptípusok hosszú távú tároláshoz szükséges karbantartási folyamatait"
**Meglévő megoldás**: KARBANTARTÁS_ÚTMUTATÓ entitás JSON lépésekkel.

---

### 1.9 Franchise Partner Kezelés

| Szempont | Meglévő | Találkozó Igény | Státusz |
|----------|---------|-----------------|---------|
| **Entitás** | FRANCHISE_PARTNER | Franchise boltok kezelése | ✅ FIT |
| **Csomagok** | kölcsönző, szerviz, komplett | Ugyanez | ✅ FIT |
| **Statisztika** | statisztika_lathato mező | Központ látja, partner nem | ✅ FIT |

---

### 1.10 Szerviz Munkalap

| Szempont | Meglévő | Találkozó Igény | Státusz |
|----------|---------|-----------------|---------|
| **Diagram** | [04-szerviz-folyamat.md](../diagram-docs/04-szerviz-folyamat.md) | Szerviz folyamat | ✅ FIT |
| **Állapotok** | 7 állapot | Ugyanez | ✅ FIT |

---

### 1.11 Bevételezés

| Szempont | Meglévő | Találkozó Igény | Státusz |
|----------|---------|-----------------|---------|
| **Diagram** | [02-ertekesites-folyamat.md](../diagram-docs/02-ertekesites-folyamat.md) | Bevételezés | ✅ FIT |
| **Készlet kezelés** | Automatikus készlet növelés | Ugyanez | ✅ FIT |

---

### 1.12 Bérlési Folyamat

| Szempont | Meglévő | Találkozó Igény | Státusz |
|----------|---------|-----------------|---------|
| **Diagram** | [01-ugyfelfelvitel-folyamat.md](../diagram-docs/01-ugyfelfelvitel-folyamat.md) | Bérlés alap | ✅ FIT |
| **Visszavétel** | Dokumentált | Ugyanez | ✅ FIT |

---

## 2. PARTIAL - Részben Lefedett Követelmények

Ezek a követelmények részben szerepelnek, de bővítésre szorulnak.

### 2.1 Offline Működés

| Szempont | Meglévő | Találkozó Igény | GAP |
|----------|---------|-----------------|-----|
| **ADR** | ADR-002 PWA Offline | Van offline mód | ✅ |
| **Szinkronizáció** | IndexedDB + háttér sync | Ugyanez | ✅ |
| **Teljes offline** | Nincs részletezve | "Internet nélkül is működjön mint most" | 🔶 PARTIAL |

**Találkozón elhangzott**:
- "Mi van, ha nincs internet?"
- "Kell olyan opció, hogy le tudja tölteni"
- Starlink mint backup megoldás említve

**Hiányzik**:
- [ ] Teljes offline működés specifikáció
- [ ] Adatbázis lokális másolat stratégia
- [ ] Conflict resolution részletek
- [ ] Offline időtartam limitek

**Diagram módosítás szükséges**: ADR-002 bővítése részletes offline stratégiával

---

### 2.2 Felhő vs. Hibrid Architektúra

| Szempont | Meglévő | Találkozó Igény | GAP |
|----------|---------|-----------------|-----|
| **Architektúra** | Feltételezett felhő | Felhő + hibrid opció | 🔶 PARTIAL |
| **Deployment** | Nincs specifikálva | "Saját szerveren is futtatható" | 🔶 PARTIAL |

**Találkozón elhangzott**:
- "Felhő, de hibrid megoldással"
- "Ha valaki a saját szerverén akarja tárolni"
- "Van amelyik technológia csak felhőben működik"

**Hiányzik**:
- [ ] Deployment stratégia diagram
- [ ] On-premise vs. Cloud összehasonlítás
- [ ] Hibrid architektúra diagram
- [ ] Technológia stack döntés dokumentálása

**Új diagram szükséges**: `08-deployment-architektura.excalidraw`

---

### 2.3 Készlet Láthatóság (Franchise)

| Szempont | Meglévő | Találkozó Igény | GAP |
|----------|---------|-----------------|-----|
| **Készlet** | Tenant szeparált | Országos készlet láthatóság | 🔶 PARTIAL |
| **Webshop** | Nincs | "Honlapnak ismernie kell a teljes országos készletet" | 🔶 PARTIAL |

**Zsuzsa igénye**: "A vevő keresésekor meg kell jelennie, hogy mely boltokban érhető el az adott gép"

**Hiányzik**:
- [ ] Központi készlet aggregáció
- [ ] Webshop készlet szinkronizáció
- [ ] "Elérhető itt:" funkció

**Diagram módosítás szükséges**: ERD bővítés KÉSZLET_NÉZET entitással

---

### 2.4 Rendelés Utánkövetés

| Szempont | Meglévő | Találkozó Igény | GAP |
|----------|---------|-----------------|-----|
| **Rendelés** | [06-egyeb-rendeles.md](../diagram-docs/06-egyeb-rendeles.md) | Van rendelés | ✅ |
| **Utánkövetés** | Értesítés megrendelés beérkezésekor | "Nincs megfelelő utánkövetés" | 🔶 PARTIAL |

**Zsuzsa igénye**: "Nincs megfelelő utánkövetés a megrendelt termékek esetében (az ügyfél elfelejti, ha megérkezett)"

**Hiányzik**:
- [ ] Rendelés státusz követés dashboard
- [ ] Automatikus emlékeztetők sorozata
- [ ] Ügyfél portál rendelés státusszal

---

### 2.5 Szerviz Alkatrész Raktárkezelés

| Szempont | Meglévő | Találkozó Igény | GAP |
|----------|---------|-----------------|-----|
| **Szerviz** | Munkalap + alkatrész | Alap szerviz | ✅ |
| **Raktár** | Általános készlet | "Alkatrészek raktárra vételét/levételét azonosítható személyhez kötni" | 🔶 PARTIAL |

**Hiányzik**:
- [ ] Alkatrész mozgás audit trail
- [ ] Szervizenként alkatrész felhasználás
- [ ] Ki vette le a raktárból?

---

### 2.6 Robbantott Ábrák és Cikkszámok

| Szempont | Meglévő | Találkozó Igény | GAP |
|----------|---------|-----------------|-----|
| **Alkatrész** | Cikk entitás | Robbantott ábrák | 🔶 PARTIAL |
| **Keresés** | Cikkszám alapján | "Robbantott ábrák és cikkszámok alapján lehessen rendelni" | 🔶 PARTIAL |

**Hiányzik**:
- [ ] ROBBANTOTT_ÁBRA entitás
- [ ] Vizuális alkatrész kereső
- [ ] Gép → Robbantott ábra → Alkatrész kapcsolat

---

### 2.7 Statisztikák és Riportok

| Szempont | Meglévő | Találkozó Igény | GAP |
|----------|---------|-----------------|-----|
| **Lekérdezések** | Említve a dokumentációban | Részletes statisztikák | 🔶 PARTIAL |
| **Szűrések** | Általános | "Fontosak a szűrések és a statisztikák" | 🔶 PARTIAL |

**Zsuzsa igényei**:
- Bérgépek termelt haszna
- Szervizesek teljesítménye
- Kölcsönzés, eladás, szerviz bontásban

**Hiányzik**:
- [ ] Részletes riport specifikáció
- [ ] Dashboard tervek
- [ ] KPI definíciók

---

### 2.8 Előleg Kezelés

| Szempont | Meglévő | Találkozó Igény | GAP |
|----------|---------|-----------------|-----|
| **Fizetés** | Általános számlázás | Előleg rögzítés | 🔶 PARTIAL |

**Zsuzsa igénye**: "Probléma az előlegek rögzítése"

**Hiányzik**:
- [ ] ELŐLEG entitás
- [ ] Előleg → Végszámla összekapcsolás
- [ ] Előleg automatikus levonás

---

## 3. GAP - Hiányzó Követelmények

Ezek a követelmények egyáltalán nem szerepelnek a meglévő diagramokban.

### 3.1 Holding Struktúra

| Szempont | Meglévő | Találkozó Igény | Prioritás |
|----------|---------|-----------------|-----------|
| **Diagram** | ❌ NINCS | Holding társaság struktúra | 🔴 MAGAS |

**Találkozón elhangzott részletek**:
- "Nektek van egy cégetek, nekünk van egy, összerakjuk egy holdingba"
- Holding = anyavállalat + leányvállalatok
- Stratégiai irányítás a holdingnál
- Operatív működés a leányoknál
- Pénzek adómentesen mozgathatók
- Marketing központosítható

**Szükséges új elemek**:
- [ ] `08-holding-struktura.excalidraw` - Új diagram
- [ ] HOLDING entitás
- [ ] LEÁNYVÁLLALAT entitás
- [ ] Holding → Tenant kapcsolat
- [ ] Központi szolgáltatások (marketing, IT) modell

---

### 3.2 Részletfizetés és Díjbekérő

| Szempont | Meglévő | Találkozó Igény | Prioritás |
|----------|---------|-----------------|-----------|
| **Diagram** | ❌ NINCS | Részletfizetés kezelése | 🔴 MAGAS |

**Zsuzsa igénye**: "A részletfizetés, az előlegszámla és a díjbekérő rendesen nem működik"

**Szükséges új elemek**:
- [ ] `08-reszletfizetes-folyamat.excalidraw` - Új diagram
- [ ] RÉSZLETFIZETÉSI_TERV entitás
- [ ] DÍJBEKÉRŐ entitás
- [ ] Törlesztés ütemezés
- [ ] Automatikus emlékeztetők részletfizetéshez

---

### 3.3 Garanciális Javítások Kezelése

| Szempont | Meglévő | Találkozó Igény | Prioritás |
|----------|---------|-----------------|-----------|
| **Diagram** | ❌ NINCS | Garancia elszámolás | 🔴 MAGAS |

**Zsuzsa igénye**: "Garanciális javítások elszámolása (Makita: norma alapján, más cégeknél egyedi elbírálás)"

**Szükséges új elemek**:
- [ ] `08-garancialis-javitas.excalidraw` - Új diagram
- [ ] GARANCIA_SZERZŐDÉS entitás
- [ ] NORMA_TÁBLÁZAT (pl. Makita normák)
- [ ] Gyártó → Elszámolás szabály kapcsolat
- [ ] Garancia claim workflow

---

### 3.4 Pályázati/MÁV Rendhagyó Szerződések

| Szempont | Meglévő | Találkozó Igény | Prioritás |
|----------|---------|-----------------|-----------|
| **Diagram** | ❌ NINCS | Speciális szerződések | 🟡 KÖZEPES |

**Zsuzsa igénye**: "Pályázaton nyert szerződések, pl. MÁV javítások: az árajánlat összegét arányosan kell elosztani a gépekre"

**Szükséges új elemek**:
- [ ] KERETSZERZŐDÉS entitás
- [ ] Összeg → Gépek arányos elosztás logika
- [ ] Speciális elszámolási szabályok

---

### 3.5 Bonyolult Beszállítói Láncok

| Szempont | Meglévő | Találkozó Igény | Prioritás |
|----------|---------|-----------------|-----------|
| **Diagram** | ❌ NINCS | Email alapú rendelés | 🟡 KÖZEPES |

**Zsuzsa igénye**: "Bonyolult beszállítói láncok kezelése (ahol e-mailen kell rajzot, majd árajánlatot kérni)"

**Szükséges új elemek**:
- [ ] BESZÁLLÍTÓ bővítés (kommunikáció típus)
- [ ] Ajánlatkérés workflow
- [ ] Email template kezelés

---

### 3.6 PDF Használati Utasítások

| Szempont | Meglévő | Találkozó Igény | Prioritás |
|----------|---------|-----------------|-----------|
| **Diagram** | ❌ NINCS | Letölthető PDF | 🟡 KÖZEPES |

**Zsuzsa igénye**: "A termékek mellett legyen letölthető PDF magyar használati utasítás"

**Szükséges új elemek**:
- [ ] CIKK bővítés (hasznalati_utasitas_url mező)
- [ ] Dokumentum tároló integráció
- [ ] Webshop PDF letöltés funkció

---

### 3.7 Használati Videók (AI Generált)

| Szempont | Meglévő | Találkozó Igény | Prioritás |
|----------|---------|-----------------|-----------|
| **Diagram** | ❌ NINCS | AI videó generálás | 🟢 ALACSONY |

**Zsuzsa igénye**: "Szeretnének minden géphez használati videót készíteni... a program automatikusan tudjon ilyen videókat készíteni"

**Megjegyzés**: Ez egy jövőbeli AI integráció, nem v1 scope.

---

### 3.8 3D Termék Megjelenítés

| Szempont | Meglévő | Találkozó Igény | Prioritás |
|----------|---------|-----------------|-----------|
| **Diagram** | ❌ NINCS | 3D forgatható gépek | 🟢 ALACSONY |

**Találkozón elhangzott**: "Rákattintasz egy képre és 3D-t csinál... forgathatod"

**Megjegyzés**: Marketing/webshop funkció, nem core ERP.

---

### 3.9 Minimum Készlet Automatikus Rendelés

| Szempont | Meglévő | Találkozó Igény | Prioritás |
|----------|---------|-----------------|-----------|
| **Diagram** | ❌ NINCS | Auto rendelés | 🟡 KÖZEPES |

**Zsuzsa igénye**: "Állíthassanak be minimum készletet az automatikus rendeléshez"

**Szükséges új elemek**:
- [ ] CIKK bővítés (min_keszlet, rendelesi_pont)
- [ ] Automatikus rendelés trigger
- [ ] Beszállító → Rendelés generálás

---

### 3.10 Vásárlási Kötelezettség/Sztornó

| Szempont | Meglévő | Találkozó Igény | Prioritás |
|----------|---------|-----------------|-----------|
| **Diagram** | ❌ NINCS | Kötelezettség és sztornó | 🟡 KÖZEPES |

**Zsuzsa igénye**: "Vevői vásárlási kötelezettség (vagy annak hiányában előleg) rendszere, és a sztornózás lehetősége"

---

### 3.11 Központi vs. Helyi Szerviz Logisztika

| Szempont | Meglévő | Találkozó Igény | Prioritás |
|----------|---------|-----------------|-----------|
| **Diagram** | ❌ NINCS | Szerviz logisztika | 🟡 KÖZEPES |

**Zsuzsa igénye**: "Helyi szerviz hiányában a központi szerviz és egy logisztikai kör kiépítése"

**Szükséges új elemek**:
- [ ] Szerviz routing logika
- [ ] Szállítás követés
- [ ] Franchise → Központ szerviz workflow

---

## 4. Összefoglaló Diagram Módosítások

### 4.1 Meglévő Diagramok Módosítása

| Diagram | Módosítás | Prioritás |
|---------|-----------|-----------|
| `ADR-002 Offline` | Bővítés részletes offline stratégiával | 🔴 MAGAS |
| `07-erd-uj-entitasok` | ELŐLEG, GARANCIA_SZERZŐDÉS hozzáadás | 🔴 MAGAS |
| `02-ertekesites-erd` | ROBBANTOTT_ÁBRA, min_keszlet mezők | 🟡 KÖZEPES |
| `04-szerviz-erd` | Alkatrész audit trail | 🟡 KÖZEPES |
| `06-egyeb-rendeles` | Részletfizetés, díjbekérő integráció | 🔴 MAGAS |

### 4.2 Új Diagramok Szükségesek

| Diagram | Leírás | Prioritás |
|---------|--------|-----------|
| `08-holding-struktura.excalidraw` | Holding/leányvállalat struktúra | 🔴 MAGAS |
| `08-reszletfizetes-folyamat.excalidraw` | Részletfizetés workflow | 🔴 MAGAS |
| `08-garancialis-javitas.excalidraw` | Garancia elszámolás | 🔴 MAGAS |
| `08-deployment-architektura.excalidraw` | Cloud/Hybrid/On-prem | 🔴 MAGAS |
| `08-keszlet-szinkron.excalidraw` | Országos készlet láthatóság | 🟡 KÖZEPES |

---

## 5. Prioritási Mátrix

```
                        SÜRGŐSSÉG
                   MAGAS         ALACSONY
              ┌─────────────┬─────────────┐
        MAGAS │ ⬛ KRITIKUS  │ ⬜ FONTOS    │
              │             │             │
              │ • Holding   │ • PDF utas. │
   HATÁS      │ • Részletf. │ • Min készl.│
              │ • Garancia  │ • Sztornó   │
              │ • Offline   │             │
              ├─────────────┼─────────────┤
     ALACSONY │ ⬜ ALACSONY  │ ⬜ KÉSŐBB    │
              │             │             │
              │ • Robbant.á.│ • 3D termék │
              │ • Stat.rip. │ • AI videó  │
              │             │             │
              └─────────────┴─────────────┘
```

---

## 6. Javasolt Következő Lépések

### Azonnali (1-2 hét)
1. ⬜ ADR-002 Offline stratégia részletezése
2. ⬜ Holding struktúra diagram elkészítése
3. ⬜ Részletfizetés entitás és folyamat tervezése

### Rövid távú (1 hónap)
4. ⬜ Garancia kezelés specifikáció
5. ⬜ Deployment architektúra döntés
6. ⬜ Készlet szinkronizáció tervezése

### Közép távú (2-3 hónap)
7. ⬜ Robbantott ábrák integráció
8. ⬜ Részletes riport specifikáció
9. ⬜ PDF használati utasítás rendszer

---

## 7. Kapcsolódó Dokumentumok

| Dokumentum | Hely |
|------------|------|
| Diagram Index | [INDEX.md](../diagram-docs/INDEX.md) |
| Vezetői Összefoglaló | [01-vezetoi-osszefoglalo.md](01-vezetoi-osszefoglalo.md) |
| Holding Modell | [02-holding-modell-elemzes.md](02-holding-modell-elemzes.md) |
| Cselekvési Terv | [04-cselekvesi-terv.md](04-cselekvesi-terv.md) |
| Technológiai Döntések | [05-technologiai-dontesek.md](05-technologiai-dontesek.md) |

---

## Verzió Történet

| Verzió | Dátum | Változás |
|--------|-------|----------|
| 1.0 | 2025-12-03 | Első kiadás - 31 követelmény elemzése |
