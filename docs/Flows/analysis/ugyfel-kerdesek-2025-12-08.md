# KGC ERP v3 - Ügyfél Kérdések

**Készítette:** BMAD Team (Analyst + Architect)
**Dátum:** 2025-12-08
**Státusz:** ⏳ Válaszra vár
**Kapcsolódó:** architect-review-2025-12-08.md

---

## Összefoglaló

Az alábbi **6 kritikus kérdést** kell megválaszolni a fejlesztés folytatásához. Ezek a kérdések az Architect review során merültek fel, és befolyásolják az adatbázis sémát, a biztonsági követelményeket és az üzleti logikát.

---

## 1. TAJ Szám Kezelése

**Háttér:** A jelenlegi rendszerben a PARTNER entitásban van `taj_szam` mező (opcionális). Az ügyfél megjegyzése szerint: *"TAJ szám nem kell."*

**Kérdés:** Van-e jelenleg TAJ szám adat a rendszerben?

| Válasz | Következmény |
|--------|--------------|
| ❌ Nincs adat | `DROP COLUMN taj_szam` - teljes törlés |
| ✅ Van adat | Megtartjuk, de "deprecated" jelölés a dokumentációban |

### Válasz:

```
[ ] Nincs adat a rendszerben → TÖRÖLJÜK
[ ] Van adat → MEGTARTJUK (deprecated)
```

**Megjegyzés:** _________________________________________________

---

## 2. MyPos PCI-DSS Compliance

**Háttér:** A kártyás kaució kezeléshez MyPos integrációt tervezünk. A payment token (kártya azonosító) tárolása biztonsági kérdéseket vet fel.

**Kérdés:** Szükséges-e PCI-DSS audit a kártyás kaució tároláshoz?

| Válasz | Következmény | Költség |
|--------|--------------|---------|
| ❌ Nem kell | Egyszerű titkosított token tárolás | Alacsony |
| ✅ Kell | External tokenization + éves audit | Magas |

**Kiegészítő kérdés:** A MyPos szerződésben van-e erre vonatkozó kitétel?

### Válasz:

```
[ ] Nem szükséges PCI-DSS audit
[ ] Szükséges PCI-DSS audit
[ ] Nem tudom - MyPos-nál érdeklődni kell
```

**Megjegyzés:** _________________________________________________

---

## 3. Dolgozói Kedvezmény Limit

**Háttér:** Az ügyfél megjegyzése szerint: *"A bérgépekért pl. nem kell fizetniük."* Kérdés, hogy ez korlátlan-e.

**Kérdés:** Van-e havi/éves limit a dolgozói ingyenes bérlésekre?

| Válasz | Következmény |
|--------|--------------|
| ❌ Nincs limit | 100% kedvezmény mindig, audit log a visszaélés ellen |
| ✅ Van limit | `max_berles_havonta` mező + automatikus ellenőrzés |

### Válasz:

```
[ ] Nincs limit - korlátlan ingyenes bérlés
[ ] Van limit:
    - Maximum _____ db bérlés / hónap
    - VAGY maximum _____ Ft értékben / hónap
    - VAGY egyéb: _________________________________
```

**Megjegyzés:** _________________________________________________

---

## 4. Kaució Visszatérítési Határidő

**Háttér:** MyPos kártyás visszatérítés esetén a token (kártya azonosító) csak korlátozott ideig érvényes.

**Technikai korlát:** MyPos token **30-180 napig** él, utána manuális visszatérítés szükséges (banki átutalás).

**Kérdés:** Mi a maximális időtartam, amíg a kauciót vissza kell fizetni?

| Opció | Leírás | Kockázat |
|-------|--------|----------|
| A) 30 nap | Biztonságos, token biztosan él | Alacsony |
| B) 90 nap | Általános gyakorlat | Közepes |
| C) 180 nap | Maximum MyPos limit | Magas |
| D) Egyéb | Egyedi időtartam | ? |

### Válasz:

```
[ ] A) 30 nap
[ ] B) 90 nap
[ ] C) 180 nap
[ ] D) Egyéb: _____ nap
```

**Mi történjen, ha lejár a token?**
```
[ ] Automatikus banki átutalás
[ ] Manuális visszatérítés (értesítés a kezelőnek)
[ ] Egyéb: _________________________________
```

**Megjegyzés:** _________________________________________________

---

## 5. Céges Meghatalmazott Érvényesség

**Háttér:** Az ügyfél megjegyzése szerint: *"Átutalásnál csak a cég által megadott személyek vihessenek gépet."* A meghatalmazásnak van-e lejárati ideje?

**Kérdés:** A céges meghatalmazások lejárnak-e valaha, vagy határozatlan idejűek?

| Válasz | Következmény |
|--------|--------------|
| ❌ Határozatlan | `ervenyesseg_vege = NULL` alapértelmezett |
| ✅ Lejár | Kötelező lejárati dátum + automatikus értesítés |

### Válasz:

```
[ ] Határozatlan idejű (nem jár le)
[ ] Lejár:
    - Alapértelmezett időtartam: _____ hónap / év
    - Értesítés lejárat előtt: _____ nappal
```

**Ki hosszabbíthatja meg?**
```
[ ] Csak a cég (új dokumentum)
[ ] Bármelyik meghatalmazott
[ ] Bolt vezetője
```

**Megjegyzés:** _________________________________________________

---

## 6. Audit Log Megőrzési Időszak

**Háttér:** A bérlési audit log (ki adta ki, ki vette vissza, károk) és a device session adatok tárolási időtartama GDPR szempontból fontos.

**Jogi háttér:** Polgári jogi követelések elévülése **5 év** (Ptk. 6:22.§).

**Kérdés:** Mennyi ideig tároljuk az audit adatokat?

| Opció | GDPR | Tárhely | Jogi védelem |
|-------|------|---------|--------------|
| A) 1 év | ✅ Biztonságos | ~10 MB/év | ⚠️ Korlátozott |
| B) 3 év | ⚠️ Indoklás kell | ~30 MB/év | ✅ Közepes |
| C) 5 év | ⚠️ Indoklás kell | ~50 MB/év | ✅ Teljes |
| D) Korlátlan | 🔴 GDPR kockázat | Növekvő | ✅ Teljes |

### Válasz:

```
[ ] A) 1 év
[ ] B) 3 év
[ ] C) 5 év (javasolt - elévülési idő)
[ ] D) Korlátlan
```

**Automatikus törlés vagy archiválás?**
```
[ ] Automatikus törlés a megőrzési idő után
[ ] Archiválás (offline tárolás)
[ ] Manuális döntés
```

**Megjegyzés:** _________________________________________________

---

## Válaszadás Összefoglaló

Kérjük, töltse ki az alábbi összefoglaló táblázatot:

| # | Kérdés | Válasz |
|---|--------|--------|
| 1 | TAJ szám | [ ] Törlés / [ ] Megtartás |
| 2 | PCI-DSS | [ ] Nem kell / [ ] Kell / [ ] Tisztázni |
| 3 | Kedvezmény limit | [ ] Nincs / [ ] Van: _______ |
| 4 | Kaució visszafizetés | _______ nap |
| 5 | Meghatalmazott | [ ] Határozatlan / [ ] Lejár: _______ |
| 6 | Audit log | [ ] 1év / [ ] 3év / [ ] 5év / [ ] Korlátlan |

---

## Gyors Válasz Formátum

Ha gyorsan szeretne válaszolni, használja ezt a formátumot:

```
1. TAJ: [nincs/van] → [töröljük/megtartjuk]
2. PCI-DSS: [nem kell/kell/tisztázni]
3. Kedvezmény limit: [nincs/van: X db/hó]
4. Kaució visszafizetés: [30/90/180/X] nap
5. Meghatalmazott: [határozatlan/lejár: X hónap]
6. Audit log: [1/3/5/korlátlan] év
```

---

## Kapcsolódó Dokumentumok

| Dokumentum | Útvonal |
|------------|---------|
| Architect Review | `/home/javo/DEV/KGC-2/docs/Flows/analysis/architect-review-2025-12-08.md` |
| Diagram Frissítési Terv | `/home/javo/DEV/KGC-2/docs/Flows/analysis/diagram-update-plan-v3.md` |
| Fit-Gap Analízis | `/home/javo/DEV/KGC-2/docs/Flows/analysis/fit-gap-2025-12-07.md` |
| CSV Megjegyzések | `/home/javo/DEV/KGC-2/docs/Flows/kgc-notes-1765134941556.csv` |

---

## Következő Lépések

1. ⏳ Ügyfél válaszol a kérdésekre
2. 📝 BMAD Team feldolgozza a válaszokat
3. 📋 ADR-ek készítése a döntések alapján
4. 🔧 Sprint 1 indítása

---

**Válasz határidő:** _________________

**Kitöltötte:** _________________

**Dátum:** _________________
