# KGC ERP v3.0 - Interaktív Diagram Rendszer

> Komplett ERP rendszer dokumentáció interaktív folyamatábrákkal és üzleti logika vizualizációval.

## Gyors Áttekintés

| Elem | Érték |
|------|-------|
| **Diagramok** | 46 SVG |
| **Modulok** | 18 üzleti modul |
| **Új v3.0 funkciók** | 8 modul |
| **Portable HTML** | Egyetlen fájl, offline működik |

## Fő Funkciók

### Interaktív Master Flowchart
- **~120 elem** egyetlen átfogó diagramon
- Ügyfélközpontú nézet (customer journey)
- Kattintható modulok részletes nézetekhez
- Animált nyilak a folyamatok között

### Színkódolás
| Szín | Jelentés |
|------|----------|
| 🔵 Kék (`#1976d2`) | Meglévő modulok |
| 🟢 Zöld (`#388e3c`) | Új v3.0 funkciók |
| 🟠 Narancs (`#f57c00`) | Döntési pontok |

## Modulok

### Fő Üzleti Folyamatok
- **Bérlés** - Bérgép kiadás, kaució kezelés, MyPos integráció
- **Eladás** - Termék értékesítés, számlázás, NAV integráció
- **Szerviz** - Munkalap kezelés, garanciális javítás
- **Árajánlat** - Árkalkuláció, konverzió követés *(ÚJ)*
- **Visszavétel** - Bérlés lezárás, kaució visszaadás

### Új v3.0 Modulok
- **R.1/R.2 Kiadási Javaslat** - Automatikus tárhely optimalizáció
- **P5 Automatizált Elszámolás** - Bank/Futár → Számla párosítás (pontozás: 40+35+15+10)
- **N.3 Értesítések** - PWA Push (Firebase FCM, Service Worker)
- **Multi-location Készlet** - KÉSZLET_HELY entitás, kiadási prioritás

## Fájlok

### HTML Kimenetek
```
docs/Flows/
├── KGC-ERP-Portable-2025-12-14.html    # Portable verzió (46 SVG beágyazva)
├── KGC-ERP-Interaktiv-2025-12-14.html  # Interaktív verzió
└── KGC-ERP-v3-Diagramok-2025-12-12.html # v3.0 változások összefoglaló
```

### Diagramok
```
docs/Flows/diagrams/
├── 00-kgc-erp-master-flow-2025-12-12.*  # Master flowchart
├── 01-ugyfelfelvitel-*                   # Bérlés folyamat
├── 02-ertekesites-*                      # Eladás folyamat
├── 03-arajanlat-*                        # Árajánlat
├── 04-szerviz-*                          # Szerviz
├── 05-penzugy-*                          # Pénzügy
├── 06-visszavetel-*                      # Visszavétel
├── 07-ertesitesek-*                      # Értesítések
└── ...                                   # + további diagramok
```

### Generátor Scriptek
```
docs/Flows/scripts/
├── generate-portable-html.js   # Portable HTML generátor
├── generate-html.js            # Interaktív HTML generátor
└── convert-to-svg.js           # Excalidraw → SVG konverter
```

## Használat

### Portable HTML Megtekintése
Egyszerűen nyisd meg böngészőben:
```
docs/Flows/KGC-ERP-Portable-2025-12-14.html
```
- Nincs szükség szerverre
- Offline is működik
- Minden diagram beágyazva

### HTML Újragenerálása
```bash
cd docs/Flows/scripts
node generate-portable-html.js
```

### Excalidraw → SVG Konverzió
```bash
cd docs/Flows/scripts
node convert-to-svg.js
```

## Technológiák

| Technológia | Használat |
|-------------|-----------|
| **Alpine.js** | Interaktivitás, nézet váltás |
| **TailwindCSS** | Stílusok (CDN) |
| **Excalidraw** | Diagram szerkesztés |
| **SVG** | Vektorgrafikus megjelenítés |

## Prompt Template

Más projektekhez használható prompt template:
```
docs/Flows/PROMPT-Interaktiv-Diagram-HTML.md
```

Ez a template leírja, hogyan készíts hasonló interaktív HTML dokumentációt bármely projekthez.

## BMAD Method

A projekt a **BMad Method v6** agilis fejlesztési módszertant használja:

```
.bmad/
├── core/     # Keretrendszer alap
├── bmm/      # BMad Method Modul (PM, Architect, DEV, stb.)
├── bmb/      # BMad Builder
└── cis/      # Creative Intelligence Suite
```

### Workflow-k Indítása
```bash
# Projekt inicializálás
/bmad:bmm:workflows:workflow-init

# Story létrehozása
/bmad:bmm:workflows:create-story

# Kód implementálás
/bmad:bmm:workflows:dev-story
```

## Licensz

Belső projekt - KGC Kft.

---

*Generálva: 2025-12-14 | Claude Code + BMad Method v6*
