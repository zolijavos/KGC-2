# KGC ERP v2 - Diagram Dokumentáció Index

## Projekt Információk

| Tulajdonság | Érték |
|-------------|-------|
| **Projekt** | KGC ERP (Kisgép Centrum) |
| **Verzió** | v2 |
| **Diagramok száma** | 30 db |
| **Dokumentáció nyelv** | Magyar |
| **Generálás dátuma** | 2024 (frissítve: 2025-12-04) |

---

## Tartalomjegyzék

### 1. Ügyfél Felvétel és Bérlés (5 diagram)

| # | Dokumentum | Diagram Típus | Leírás |
|---|------------|---------------|--------|
| 1.1 | [01-ugyfelfelvitel-folyamat.md](01-ugyfelfelvitel-folyamat.md) | Folyamatábra | Bérlési folyamat teljes körű leírása |
| 1.2 | [01-ugyfelfelvitel-erd.md](01-ugyfelfelvitel-erd.md) | ERD | Partner, Cég, Bérlés, Cikk entitások |
| 1.3 | [01-ugyfelfelvitel-dfd.md](01-ugyfelfelvitel-dfd.md) | DFD | Adatáramlási diagram |
| 1.4 | [01-ugyfelfelvitel-dontesi-fa.md](01-ugyfelfelvitel-dontesi-fa.md) | Döntési Fa | Bérlési döntési pontok |
| 1.5 | [01-ugyfelfelvitel-rendszer.md](01-ugyfelfelvitel-rendszer.md) | Architektúra | 3 rétegű rendszer felépítés |

### 2. Értékesítés és Készlet (3 diagram)

| # | Dokumentum | Diagram Típus | Leírás |
|---|------------|---------------|--------|
| 2.1 | [02-ertekesites-folyamat.md](02-ertekesites-folyamat.md) | Folyamatábra | Cikk felvétel, bevételezés, értékesítés |
| 2.2 | [02-ertekesites-erd.md](02-ertekesites-erd.md) | ERD | Cikk, Cikkcsoport, Beszállító, Készlet |
| 2.3 | [02-keszletmozgas-dfd.md](02-keszletmozgas-dfd.md) | DFD | Készlet mozgások: Bevételezés, Átcsoportosítás, Eladás |

### 3. Bérgép Kezelés (1 diagram)

| # | Dokumentum | Diagram Típus | Leírás |
|---|------------|---------------|--------|
| 3.1 | [03-bergep-folyamat.md](03-bergep-folyamat.md) | Folyamatábra | Bérgép kód, állapotok, vásárlási ár |

### 4. Szerviz Modul (3 diagram)

| # | Dokumentum | Diagram Típus | Leírás |
|---|------------|---------------|--------|
| 4.1 | [04-szerviz-folyamat.md](04-szerviz-folyamat.md) | Folyamatábra | Szerviz felvétel, diagnosztika, javítás |
| 4.2 | [04-szerviz-erd.md](04-szerviz-erd.md) | ERD | Munkalap, Árajánlat, Belső_Ügyfél |
| 4.3 | [04-szerviz-munkalap.md](04-szerviz-munkalap.md) | Állapotgép | Munkalap életciklus |

### 5. Pénzügy és Adminisztráció (2 diagram)

| # | Dokumentum | Diagram Típus | Leírás |
|---|------------|---------------|--------|
| 5.1 | [05-penzugy-folyamat.md](05-penzugy-folyamat.md) | Folyamatábra | Befizetések, zárás, leltár |
| 5.2 | [05-penzugy-archivalas.md](05-penzugy-archivalas.md) | Struktúra | Bizonylat archiválási rendszer |

### 6. Egyéb Funkciók (2 diagram)

| # | Dokumentum | Diagram Típus | Leírás |
|---|------------|---------------|--------|
| 6.1 | [06-egyeb-felhasznalo.md](06-egyeb-felhasznalo.md) | RBAC | Felhasználó kezelés, 6 szerepkör |
| 6.2 | [06-egyeb-rendeles.md](06-egyeb-rendeles.md) | Folyamatábra | Rendelés folyamat, sürgős kezelés |

### 7. Új Funkciók - 7. rész (5 diagram)

| # | Dokumentum | Diagram Típus | Leírás |
|---|------------|---------------|--------|
| 7.1 | [07-ertesitesek-folyamat.md](07-ertesitesek-folyamat.md) | Folyamatábra | Automatikus SMS/Email értesítések |
| 7.2 | [07-fizetesi-fegyelem.md](07-fizetesi-fegyelem.md) | Döntési Fa | Tartozás blokkolás, NAV ellenőrzés |
| 7.3 | [07-e-szamla-folyamat.md](07-e-szamla-folyamat.md) | Folyamatábra | E-számla automatikus feldolgozás |
| 7.4 | [07-arrazas-automatizalas.md](07-arrazas-automatizalas.md) | Folyamatábra | Automatikus árazás rendszer |
| 7.5 | [07-erd-uj-entitasok.md](07-erd-uj-entitasok.md) | ERD | 5 új entitás (Értesítés, Franchise, stb.) |

### 8. Új Követelmények - 8. rész (5 diagram) 🆕

| # | Dokumentum | Diagram Típus | Leírás |
|---|------------|---------------|--------|
| 8.1 | [08-holding-struktura.md](08-holding-struktura.md) | Szervezeti | Holding társaság, leányvállalatok |
| 8.2 | [08-reszletfizetes-folyamat.md](08-reszletfizetes-folyamat.md) | Folyamatábra + ERD | Előleg, díjbekérő, részletfizetés |
| 8.3 | [08-garancialis-javitas.md](08-garancialis-javitas.md) | Folyamatábra + ERD | Makita norma vs. egyedi elbírálás |
| 8.4 | [08-deployment-architektura.md](08-deployment-architektura.md) | Architektúra | Felhő vs. Hibrid vs. On-Premise |
| 8.5 | [08-keszlet-szinkron.md](08-keszlet-szinkron.md) | Architektúra + API | Országos készlet, webshop integráció |

### 9. Rendszer Architektúra (4 diagram) 🆕

| # | Dokumentum | Diagram Típus | Leírás |
|---|------------|---------------|--------|
| 9.1 | [09-kgc-system-architecture.md](09-kgc-system-architecture.md) | Rendszer Architektúra | 5 rétegű architektúra (License → Cloud → Deploy → PWA → Paper) |
| 9.2 | [09-franchise-adatfolyam.md](09-franchise-adatfolyam.md) | Adatfolyam | Multi-tenant adatfolyam, RLS izoláció, Holding struktúra |
| 9.3 | [09-offline-szinkron-sequence.md](09-offline-szinkron-sequence.md) | Szekvencia | 15 lépéses PWA offline szinkronizáció (Online → Offline → Sync) |
| 9.4 | [09-rbac-hierarchia.md](09-rbac-hierarchia.md) | RBAC Hierarchia | 6 szerepkör hierarchia + jogosultsági mátrix |

---

## Diagram Típusok Összefoglaló

| Típus | Darabszám | Leírás |
|-------|-----------|--------|
| **Folyamatábra** | 11 | Üzleti folyamatok lépései |
| **ERD** | 7 | Adatbázis entitások és kapcsolatok |
| **Döntési Fa** | 2 | Döntési logika vizualizáció |
| **DFD** | 2 | Adatáramlási diagram |
| **Állapotgép** | 1 | Objektum életciklus |
| **Architektúra** | 4 | Rendszer felépítés (+ 09-kgc-system-architecture) |
| **Struktúra** | 1 | Mappák/fájlok szervezése |
| **RBAC** | 2 | Jogosultság mátrix (+ 09-rbac-hierarchia) |
| **Szervezeti** | 1 | Vállalati struktúra |
| **Adatfolyam** | 1 | Multi-tenant adatfolyam (09-franchise-adatfolyam) |
| **Szekvencia** | 1 | PWA offline szinkronizáció (09-offline-szinkron-sequence) |

---

## Architektúrális Döntések (ADR)

A dokumentációban hivatkozott ADR-ek:

| ADR | Név | Leírás |
|-----|-----|--------|
| **ADR-001** | Franchise Multi-Tenant Architektúra | tenant_id, RLS PostgreSQL, Holding struktúra |
| **ADR-002** | Deployment & Offline Strategy | PWA, IndexedDB, Background Sync, 3 telepítési mód |
| **ADR-003** | White Label Strategy | Licenc csomagok, theming, feature flags |

---

## Entitások Gyors Áttekintés

### Alap Entitások

| Entitás | Modul | Leírás |
|---------|-------|--------|
| PARTNER | Bérlés | Ügyfelek (magán + cég) |
| CÉG | Bérlés | Céges partnerek bővített adatai |
| BÉRLÉS | Bérlés | Bérlési tranzakciók |
| CIKK | Készlet | Termékek és gépek |
| CIKKCSOPORT | Készlet | Termék kategóriák |
| BESZÁLLÍTÓ | Készlet | Beszállítók nyilvántartása |
| BEVÉTELEZÉS | Készlet | Árubevételezés |
| KÉSZLET_MOZGÁS | Készlet | Raktármozgások |
| MUNKALAP | Szerviz | Szerviz munkalapok |
| ÁRAJÁNLAT | Szerviz | Szerviz árajánlatok |
| FELHASZNÁLÓ | Rendszer | Rendszer felhasználók |

### Új Entitások (7. rész)

| Entitás | Modul | Leírás |
|---------|-------|--------|
| ÉRTESÍTÉS | Értesítés | SMS/Email értesítések |
| MUNKA_GÉP_KAPCSOLAT | Bérlés | Munkák és gépek összerendelése |
| KARBANTARTÁS_ÚTMUTATÓ | Szerviz | Szezonális karbantartás lépések |
| FRANCHISE_PARTNER | Multi-tenant | Franchise partnerek kezelése |
| ÁRRÉS_KATEGÓRIA | Árazás | Automatikus árazás szabályok |

### Új Entitások (8. rész) 🆕

| Entitás | Modul | Leírás |
|---------|-------|--------|
| HOLDING | Vállalati | Holding társaság adatai |
| LEÁNYVÁLLALAT | Vállalati | Holding alatti cégek |
| RÉSZLETFIZETÉSI_TERV | Pénzügy | Részletfizetés ütemezés |
| TÖRLESZTÉS | Pénzügy | Egyes törlesztési tételek |
| ELŐLEG | Pénzügy | Előleg számlák kezelése |
| DÍJBEKÉRŐ | Pénzügy | Fizetési felszólítások |
| GARANCIA_SZERZŐDÉS | Szerviz | Gyártói garancia keretszerződések |
| GARANCIA_CLAIM | Szerviz | Garanciális javítás elszámolások |
| NORMA_TÉTEL | Szerviz | Makita norma táblázat tételek |
| FOGLALÁS | Készlet | Webshop foglalások |

---

## Modulok és Funkcionalitás

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           KGC ERP v2 MODULOK                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐ │
│  │    BÉRLÉS     │  │   ÉRTÉKESÍTÉS │  │    SZERVIZ    │  │    PÉNZÜGY    │ │
│  │               │  │               │  │               │  │               │ │
│  │ • Partner kez.│  │ • Cikk felvét.│  │ • Munkalap    │  │ • Befizetések │ │
│  │ • Bérlés ind. │  │ • Bevételezés │  │ • Diagnoszt.  │  │ • Számlázás   │ │
│  │ • Visszavétel │  │ • Értékesítés │  │ • Árajánlat   │  │ • Zárások     │ │
│  │ • Késés kez.  │  │ • Készlet kez.│  │ • Javítás     │  │ • Leltár      │ │
│  └───────────────┘  └───────────────┘  └───────────────┘  └───────────────┘ │
│                                                                              │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐ │
│  │  ÉRTESÍTÉSEK  │  │   E-SZÁMLA    │  │    ÁRAZÁS     │  │  FELHASZNÁLÓ  │ │
│  │   (7. rész)   │  │   (7. rész)   │  │   (7. rész)   │  │               │ │
│  │ • SMS/Email   │  │ • Auto fogadás│  │ • Árrés kat.  │  │ • RBAC        │ │
│  │ • Emlékeztet. │  │ • Parsing     │  │ • Auto számít.│  │ • 6 szerepkör │ │
│  │ • Késés értés.│  │ • Előz. bev.  │  │ • Jóváhagyás  │  │ • Audit       │ │
│  └───────────────┘  └───────────────┘  └───────────────┘  └───────────────┘ │
│                                                                              │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐ │
│  │   HOLDING     │  │ RÉSZLETFIZETÉS│  │   GARANCIA    │  │   FOGLALÁS    │ │
│  │   (8. rész)   │  │   (8. rész)   │  │   (8. rész)   │  │   (8. rész)   │ │
│  │ • Anyavállalat│  │ • Előleg      │  │ • Makita norma│  │ • Webshop int.│ │
│  │ • Leányvállal.│  │ • Díjbekérő   │  │ • Claim kez.  │  │ • Készlet sync│ │
│  │ • Konszolidált│  │ • Törlesztés  │  │ • Egyedi elb. │  │ • Országos klt│ │
│  └───────────────┘  └───────────────┘  └───────────────┘  └───────────────┘ │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Fájl Struktúra

```
docs/
├── architecture/                      # Architektúrális döntések (ADR)
│   ├── ADR-001-franchise-multitenancy.md
│   ├── ADR-002-deployment-offline-strategy.md
│   └── ADR-003-white-label-strategy.md
│
├── diagrams/                          # Rendszer architektúra diagramok
│   ├── kgc-system-architecture.excalidraw
│   ├── franchise-adatfolyam.excalidraw
│   ├── offline-szinkron-sequence.excalidraw
│   └── rbac-hierarchia.excalidraw
│
└── Flows/
    ├── diagrams/                      # Üzleti folyamat diagramok (26 db)
    │   ├── 1-ugyfelfelvitel-*.excalidraw
    │   ├── 2-ertekesites-*.excalidraw
    │   ├── ...
    │   └── 8-keszlet-szinkron.excalidraw
    │
    ├── diagram-docs/                  # Ez a dokumentációs mappa (30 md)
    │   ├── INDEX.md                   # Ez a fájl
    │   ├── 01-*.md                    # Ügyfél/Bérlés (5 db)
    │   ├── 02-*.md                    # Értékesítés/Készlet (3 db)
    │   ├── 03-*.md                    # Bérgép (1 db)
    │   ├── 04-*.md                    # Szerviz (3 db)
    │   ├── 05-*.md                    # Pénzügy (2 db)
    │   ├── 06-*.md                    # Egyéb (2 db)
    │   ├── 07-*.md                    # 7. rész (5 db)
    │   ├── 08-*.md                    # 8. rész (5 db)
    │   └── 09-*.md                    # Architektúra (4 db)
    │
    ├── 7.resz.md                      # 7. rész követelmények
    ├── 8.resz.md                      # 8. rész követelmények
    └── KGC-ERP-v2-Diagramok.html      # Interaktív HTML nézet (30 diagram)
```

---

## Kapcsolódó Dokumentumok

| Dokumentum | Hely | Leírás |
|------------|------|--------|
| PRD | `docs/prd.md` | Termék követelmények (v1.1) |
| ADR-001 | `docs/architecture/ADR-001-franchise-multitenancy.md` | Multi-tenant architektúra |
| ADR-002 | `docs/architecture/ADR-002-deployment-offline-strategy.md` | Telepítés és offline stratégia |
| ADR-003 | `docs/architecture/ADR-003-white-label-strategy.md` | White Label licencelés |
| 7. rész követelmények | `docs/Flows/7.resz.md` | Franchise, értesítések, árazás |
| 8. rész követelmények | `docs/Flows/8.resz.md` | Holding, részletfizetés, garancia |
| Interaktív HTML | `docs/Flows/KGC-ERP-v2-Diagramok.html` | 30 SVG diagram + jegyzetek |

---

## Használati Útmutató

### Navigáció

1. **Kategória alapján** - A dokumentumok 01-09 prefix alapján szervezettek
2. **Típus alapján** - A fájlnév végződése jelzi a típust (folyamat, erd, dfd, stb.)
3. **Kereszthivatkozások** - Minden dokumentum tartalmaz "Kapcsolódó Dokumentumok" szekciót

### Keresés

- **Entitás keresés** - Az ERD dokumentumokban találod a tábla definíciókat
- **Folyamat keresés** - A folyamatábra dokumentumok tartalmazzák az üzleti logikát
- **Döntési pont keresés** - Döntési fa dokumentumok vagy folyamatábrák "Döntési Pontok" szekciója

### Karbantartás

- Új diagram hozzáadása: Excalidraw fájl + MD dokumentum készítése
- Index frissítése: Új bejegyzés a megfelelő kategóriába

---

## Verzió Történet

| Verzió | Dátum | Változás |
|--------|-------|----------|
| 1.0 | 2024 | Első kiadás - 21 diagram dokumentációval |
| 1.1 | 2025-12-03 | 8. rész: 5 új diagram (Holding, Részletfizetés, Garancia, Deployment, Készlet sync) |
| 1.2 | 2025-12-04 | Készletmozgás DFD dokumentálása (korábban dokumentálatlan diagram) |
| 1.3 | 2025-12-04 | 9. rész: 4 architektúra diagram (System, Franchise adatfolyam, Offline sync, RBAC) |
| 1.4 | 2025-12-04 | ADR leírások pontosítva, 8. rész modulok hozzáadva, fájlstruktúra frissítve |

---

## Jelmagyarázat (Globális)

| Szimbólum | Jelentés |
|-----------|----------|
| `○` | Kezdet/Vége (folyamatábra) |
| `□` | Folyamat lépés |
| `◇` | Döntési pont |
| `→` | Folyamat/kapcsolat irány |
| `🔑` | Primary Key |
| FK | Foreign Key |
| ✅ | Sikeres / Engedélyezett |
| ❌ | Hiba / Tiltott |
| ⚠️ | Figyelmeztetés |
| 📧 | Email |
| 📱 | SMS |
| 💰 | Pénzügy |
| 🔧 | Szerviz |
| 📦 | Készlet/Csomag |
