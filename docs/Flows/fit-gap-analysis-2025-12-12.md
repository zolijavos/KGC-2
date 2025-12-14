# KGC ERP Fit-Gap Analízis - 2025-12-12

## Dokumentum Információk

| Tulajdonság | Érték |
|-------------|-------|
| **Dátum** | 2025-12-12 |
| **Verzió** | v1.0 |
| **Forrás** | KGC-notes-2025-12-12-01.md, KGC-notes-2025-12-12-02.md |
| **Összehasonlítás** | Aktuális diagram-docs (2025-12-11) |

---

## Összefoglaló

| Kategória | Követelmények | FIT | GAP | Részleges |
|-----------|---------------|-----|-----|-----------|
| Multi-location Készlet | 4 | 0 | 4 | 0 |
| Automatizált Elszámolás | 3 | 0 | 3 | 0 |
| PWA Push Értesítések | 1 | 0 | 1 | 0 |
| **ÖSSZESEN** | **8** | **0** | **8** | **0** |

---

## 1. Multi-location Készletkezelés (GAP)

### 1.1 Új Követelmény: KÉSZLET_HELY Entitás

**Forrás:** KGC-notes-2025-12-12-01.md

**Követelmény leírása:**
Egy cikk több fizikai tárhelyen (polc, raktár zóna) legyen nyilvántartható, külön mennyiséggel és kiadási prioritással.

| Mező | Típus | Leírás |
|------|-------|--------|
| `keszlet_hely_id` | PK, INT | Egyedi azonosító |
| `cikk_id` | FK, INT | Termék hivatkozás |
| `tarhely_kod` | VARCHAR | Fizikai hely kódja (pl. A1-Polc-03) |
| `mennyiseg` | INT | Ezen a helyen lévő darabszám |
| `kiadasi_prioritas` | INT | Kiadási sorrend (1 = legelőrébb) |
| `utolso_frissites` | DATETIME | Utolsó mozgás időpontja |

**Jelenlegi állapot (02-ertekesites-erd.md):**

```
CIKK entitás:
├── tarhely: VARCHAR     ← EGYETLEN tárolási hely
├── keszlet: INT         ← Denormalizált összesen
└── Nincs multi-location támogatás
```

| Státusz | Értékelés |
|---------|-----------|
| **GAP** | A jelenlegi modell csak **egy** tárhelyet támogat cikkenként. A `CIKK.tarhely` mező VARCHAR típusú, nem kapcsolódik külön entitáshoz. |

**Szükséges változtatások:**
1. Új `KÉSZLET_HELY` entitás létrehozása
2. `CIKK.keszlet` → kalkulált mező (összeg a KÉSZLET_HELY-ből)
3. `CIKK.tarhely` → `alap_tarhely` átnevezés vagy elhagyás

---

### 1.2 Új Követelmény: Kiadási Optimalizáció ("Pörgős Készlet")

**Forrás:** KGC-notes-2025-12-12-01.md

**Követelmény leírása:**
A rendszer automatikusan javasolja, melyik tárhelyről vegye ki a kezelő a terméket, a `kiadasi_prioritas` alapján (legkisebb készletű hely előnyben).

**Új folyamat lépések:**
| Lépés | Leírás |
|-------|--------|
| **R.1** | Raktári Kiadási Javaslat Algoritmus - listázza a helyeket prioritás szerint |
| **R.2** | Javaslat megerősítése/felülbírálása (audit trail kötelező) |

**Jelenlegi állapot (01-ugyfelfelvitel-folyamat.md, 03-bergep-folyamat.md):**

```
Bérlés indítása:
├── 1.6 Gép kiválasztása (cikkszám alapján)
├── Nincs tárhely-specifikus javaslat
└── Nincs kiadási optimalizáció
```

| Státusz | Értékelés |
|---------|-----------|
| **GAP** | A jelenlegi folyamatban nincs raktári kiadási javaslat. A kezelő szabadon választ, nincs optimalizáció a készletforgás vagy bejárási útvonal alapján. |

**Szükséges változtatások:**
1. R.1 algoritmus beépítése a bérlés és értékesítés folyamatba
2. R.2 megerősítés/felülbírálás UI elem
3. Audit log a felülbírálásokhoz

---

### 1.3 Új Követelmény: KÉSZLET_MOZGÁS Bővítés

**Forrás:** KGC-notes-2025-12-12-01.md

**Követelmény leírása:**
A készletmozgás naplóba rögzíteni kell a konkrét tárhelyet is.

**Új mező:**
| Mező | Típus | Leírás |
|------|-------|--------|
| `tarhely_kod` | VARCHAR | Melyik helyről/helyre történt a mozgás |

**Jelenlegi állapot (02-ertekesites-erd.md):**

```
KÉSZLET_MOZGÁS entitás:
├── cikk_id (FK)
├── tipus (+/-)
├── mennyiseg
├── megjegyzes
├── datum
└── rogzito_id
❌ Nincs tarhely_kod mező!
```

| Státusz | Értékelés |
|---------|-----------|
| **GAP** | A jelenlegi `KÉSZLET_MOZGÁS` entitás nem tartalmazza a tárhelyet. Az audit trail nem mutatja, melyik fizikai helyről történt a kiadás. |

**Szükséges változtatások:**
1. `tarhely_kod: VARCHAR` mező hozzáadása
2. Bevételezés és kiadás folyamatokban a tárhely rögzítése

---

### 1.4 Új Követelmény: Bevételezés Tárhely Megadás

**Forrás:** KGC-notes-2025-12-12-01.md

**Követelmény leírása:**
Bevételezéskor kötelező legyen megadni, melyik tárhelyre kerül az áru.

**Jelenlegi állapot (02-ertekesites-folyamat.md):**

```
3. FÁZIS - Bevételezés:
├── 3.3 Tételek hozzáadása (mennyiség, egységár)
└── ❌ Nincs tárhely megadás kötelező!
```

| Státusz | Értékelés |
|---------|-----------|
| **GAP** | A bevételezési folyamat nem tartalmaz tárhely megadási lépést. A `CIKK.tarhely` mező statikus, nem frissül bevételezéskor. |

**Szükséges változtatások:**
1. Új lépés: "Tárhely kiválasztása" a bevételezés tételeinél
2. `KÉSZLET_HELY.mennyiseg` frissítése bevételezéskor
3. UI dropdown a létező tárhelyekhez

---

## 2. Automatizált Pénzügyi Elszámolás (GAP)

### 2.1 Új Követelmény: BANK_TRANZAKCIÓ Entitás

**Forrás:** KGC-notes-2025-12-12-02.md

**Követelmény leírása:**
Külső rendszerekből (bank, futár) beérkező pénzmozgások tárolása automatikus párosításhoz.

| Mező | Típus | Leírás |
|------|-------|--------|
| `tranzakcio_id` | PK, INT | Egyedi azonosító |
| `osszeg` | DECIMAL | Beérkezett összeg |
| `datum` | DATE | Tranzakció dátuma |
| `kulso_partner` | VARCHAR | Bank/futár neve |
| `kozlemeny` | VARCHAR | Közlemény (párosítás kulcs!) |
| `forras` | ENUM | Bank/Futár/Egyéb |
| `statusz` | ENUM | Párosítatlan/Párosított/Eltérés |

**Jelenlegi állapot (05-penzugy-folyamat.md):**

```
Napi befizetések folyamat:
├── Trigger: Bankkivonat megérkezett
├── 1. Teljesítések menüpont megnyitása
├── 2. Nyitott vevői tartozások listája
├── 3. Manuális pipa/összeg megadás
└── ❌ Nincs automatikus párosítás!
```

| Státusz | Értékelés |
|---------|-----------|
| **GAP** | A jelenlegi rendszer **teljesen manuális**. Nincs `BANK_TRANZAKCIÓ` entitás, nincs importálási lehetőség banki kivonatból, nincs automatikus illesztés. |

**Szükséges változtatások:**
1. `BANK_TRANZAKCIÓ` entitás létrehozása
2. `KÜLSŐ_PARTNER_API` entitás (bank/futár azonosítók)
3. Import funkció CSV/API-ból
4. Párosítási algoritmus

---

### 2.2 Új Követelmény: Automatikus Párosítási Algoritmus ("Pontozási Rendszer")

**Forrás:** KGC-notes-2025-12-12-02.md

**Követelmény leírása:**
A rendszer automatikusan párosítsa a beérkező tranzakciókat a nyitott számlákkal.

**Párosítási kritériumok:**
| Prioritás | Kritérium | Súly |
|-----------|-----------|------|
| 1 | Közleményben megtalálható a számlaszám | Magas |
| 2 | Összeg pontosan egyezik | Közepes |
| 3 | Dátum + partner azonosító egyezik | Alacsony |

**Jelenlegi állapot (05-penzugy-folyamat.md):**

```
Napi befizetések:
├── Színkódolás: Rózsaszín = LEJÁRT
├── Teljes fizetés: Pipa rárakása
├── Rész fizetés: Összeg megadása + megjegyzés
└── ❌ MINDEN MANUÁLIS!
```

| Státusz | Értékelés |
|---------|-----------|
| **GAP** | Nincs automatikus párosítási logika. A pénzügyes munkatársnak **kézzel** kell minden befizetést a számlához rendelnie. |

**Szükséges változtatások:**
1. P5.2 Előzetes Párosítás algoritmus
2. P5.3 Eltérés keresése (pontosan/részben/párosítatlan)
3. P5.4 Manuális rögzítés (csak eltérésekhez)
4. P5.5 Automatikus számla státusz frissítés

---

### 2.3 Új Követelmény: P5 - Automatizált Elszámolás Folyamat

**Forrás:** KGC-notes-2025-12-12-02.md

**Követelmény leírása:**
Új alfolyamat a Pénzügy modulban az automatikus elszámoláshoz.

| Lépés | Leírás |
|-------|--------|
| **P5.1** | Adatfogadás (banki kivonat, futár fájl) |
| **P5.2** | Előzetes párosítás (algoritmus) |
| **P5.3** | Eltérés keresése (lista generálás) |
| **P5.4** | Manuális rögzítés (csak eltérések) |
| **P5.5** | Lezárás (számla státusz → fizetve) |

**Jelenlegi állapot (05-penzugy-folyamat.md):**

```
Pénzügyi folyamatok:
├── 1. Napi befizetések (manuális)
├── 2. Havi zárás
├── 3. Szállítólevél számlázás
├── 4. Éves leltár
├── 5. Részletfizetés (8.rész bővítés)
└── ❌ Nincs P5 Automatizált Elszámolás!
```

| Státusz | Értékelés |
|---------|-----------|
| **GAP** | Az automatizált elszámolási folyamat **teljesen hiányzik** a jelenlegi dokumentációból. A források említik a NAV API-t, de banki/futár integrációt nem. |

**Szükséges változtatások:**
1. Új P5 folyamat definiálása
2. Bank API integráció (OTP, K&H, stb.)
3. Futár API integráció (GLS, DPD, stb.)
4. Automatikus számla státusz frissítés

---

## 3. PWA Push Értesítések (GAP)

### 3.1 Új Követelmény: Push Notification Csatorna

**Forrás:** KGC-notes-2025-12-12-02.md

**Követelmény leírása:**
A PWA alkalmazásra is szeretnének push notifikációkat, az email és SMS mellett.

**Jelenlegi állapot (07-ertesitesek-folyamat.md):**

```
Értesítési csatornák:
├── SMS (Twilio/Nexmo)
├── Email (SendGrid/SMTP)
└── ❌ Nincs PWA Push!

ÉRTESÍTÉS entitás:
├── csatorna: VARCHAR(20) -- sms/email
└── ❌ Nincs 'push' opció!
```

| Státusz | Értékelés |
|---------|-----------|
| **GAP** | A jelenlegi értesítési rendszer csak SMS és Email csatornákat támogat. PWA push notifications nincs implementálva. |

**Szükséges változtatások:**
1. `csatorna` ENUM bővítése: `sms/email/push`
2. Web Push API integráció (Firebase Cloud Messaging vagy hasonló)
3. Service Worker push handler a PWA-ban
4. Felhasználói push subscription kezelés
5. D3 döntési pont bővítése: SMS/Email/Push

---

## 4. Összesített GAP Lista

### Új Entitások (Létrehozandó)

| # | Entitás | Modul | Prioritás |
|---|---------|-------|-----------|
| 1 | `KÉSZLET_HELY` | Készlet | Magas |
| 2 | `BANK_TRANZAKCIÓ` | Pénzügy | Magas |
| 3 | `KÜLSŐ_PARTNER_API` | Pénzügy | Közepes |

### Meglévő Entitások Módosítása

| # | Entitás | Módosítás | Prioritás |
|---|---------|-----------|-----------|
| 1 | `CIKK` | `keszlet` → kalkulált; `tarhely` → opcionális | Magas |
| 2 | `KÉSZLET_MOZGÁS` | + `tarhely_kod` mező | Magas |
| 3 | `ÉRTESÍTÉS` | `csatorna` bővítés: `push` | Közepes |

### Új Folyamatok (Létrehozandó)

| # | Folyamat | Modul | Prioritás |
|---|----------|-------|-----------|
| 1 | R.1 Raktári Kiadási Javaslat | Készlet | Magas |
| 2 | R.2 Javaslat Megerősítés | Készlet | Magas |
| 3 | P5 Automatizált Elszámolás | Pénzügy | Magas |

### Meglévő Folyamatok Módosítása

| # | Folyamat | Módosítás | Prioritás |
|---|----------|-----------|-----------|
| 1 | Bevételezés (02) | + Tárhely megadás kötelező | Magas |
| 2 | Bérlés indítás (01) | + R.1/R.2 kiadási javaslat | Magas |
| 3 | Értékesítés (02) | + R.1/R.2 kiadási javaslat | Magas |
| 4 | Napi befizetések (05) | Opcionális automatizálás | Közepes |
| 5 | Értesítések (07) | + Push csatorna | Közepes |

---

## 5. Implementációs Javaslat

### Fázis 1 - Multi-location Készlet (Kritikus)

```
Hetű: 1-3
├── KÉSZLET_HELY entitás és migráció
├── KÉSZLET_MOZGÁS.tarhely_kod mező
├── Bevételezés folyamat módosítás
└── R.1/R.2 kiadási javaslat algoritmus
```

### Fázis 2 - Automatizált Elszámolás (Magas)

```
Hét: 4-6
├── BANK_TRANZAKCIÓ entitás
├── Bank/Futár import funkció
├── Párosítási algoritmus
└── P5 folyamat UI
```

### Fázis 3 - PWA Push Notifications (Közepes)

```
Hét: 7-8
├── FCM vagy Web Push integráció
├── Service Worker handler
├── Push subscription kezelés
└── ÉRTESÍTÉS entitás bővítés
```

---

## 6. Kérdések a Stakeholderek Felé

A pontos implementációhoz tisztázandó:

### Multi-location

1. **Kiadási prioritás definíciója:** Fizikai távolság vagy készletszint alapú?
2. **Tárhely kód formátum:** Strukturált (A1-03) vagy szabadszöveges?
3. **Offline működés:** A KÉSZLET_HELY adatok szinkronizálása hogyan?

### Automatizált Elszámolás

4. **Bank API:** Melyik bankokkal kell integrálni (OTP, K&H, Erste)?
5. **Futár API:** Melyik futárcégekkel (GLS, DPD, MPL)?
6. **Párosítási szabályok:** Mi a pontos súlyozás a kritériumoknál?

### Push Notifications

7. **Provider választás:** Firebase Cloud Messaging vagy más?
8. **Opt-in/opt-out:** Felhasználónkénti vagy globális beállítás?

---

## Kapcsolódó Dokumentumok

- [02-ertekesites-erd.md](diagram-docs/02-ertekesites-erd.md) - Készlet entitások
- [05-penzugy-folyamat.md](diagram-docs/05-penzugy-folyamat.md) - Pénzügyi folyamatok
- [07-ertesitesek-folyamat.md](diagram-docs/07-ertesitesek-folyamat.md) - Értesítési rendszer
- [KGC-notes-2025-12-12-01.md](transcripts/KGC-notes-2025-12-12-01.md) - Készlet követelmények
- [KGC-notes-2025-12-12-02.md](transcripts/KGC-notes-2025-12-12-02.md) - Pénzügy és Push követelmények
