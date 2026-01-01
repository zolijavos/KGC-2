# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## KRITIKUS SZABÁLY - MINDIG BMAD MÓDSZERREL DOLGOZZ

**KÖTELEZŐ**: Minden fejlesztési feladathoz BMAD ügynököket és BMAD workflow-kat használj! Soha ne dolgozz a BMAD keretrendszeren kívül.

- **Nyelv**: Magyar - minden kommunikáció és dokumentum magyarul készüljön
- **Módszer**: Mindig a megfelelő BMAD workflow-t indítsd el a `/bmad:bmm:workflows:*` parancsokkal
- **Code review MINDIG adversarial**: minimum 3-10 konkrét problémát kell találnia

## Projekt Státusz

**Aktuális fázis**: PRD és Architektúra tervezés (Fázis 2-3)
**Megjegyzés**: Jelenleg nincs alkalmazás forráskód - ez egy tervezési/dokumentációs projekt. A tényleges implementáció a BMAD Fázis 4-ben kezdődik.

## Projekt Áttekintés

**KGC ERP v3.0** - Kisgépcentrum ERP/Értékesítés-kezelő rendszer franchise hálózat támogatással és white label értékesítési modellel.

| Jellemző | Érték |
|----------|-------|
| **Domain** | Kiskereskedelem / Bérleti rendszer / Szerviz menedzsment |
| **Komplexitás** | Magas (multi-tenant, offline-first PWA, NAV integráció) |
| **Track** | BMad Method Level 2-3 |
| **Stack** | NestJS + PostgreSQL + PWA (tervezett) |

### Üzleti Domének

- **Bérlés**: Bérgép kiadás, kaució kezelés (MyPos), hosszú távú szerződések
- **Eladás**: Termék értékesítés, NAV Online számlázás (Számlázz.hu API)
- **Szerviz**: Munkalap kezelés, garanciális javítás (Makita norma)
- **Árajánlat**: Árkalkuláció, konverzió követés (ÚJ v3.0)
- **Pénzügy**: Havi zárás, ÁFA, cégszerződéses elszámolás

### Integrációs Stratégia (5 Rendszer)

Hibrid architektúra: iframe + API + forráskód módosítás

1. **Twenty CRM** (fork) - Ügyfélkapcsolat kezelés
2. **Chatwoot** (fork) - Ügyfélszolgálat, support ticket
3. **Horilla HR** (fork) - Humánerőforrás menedzsment
4. **Custom Chat** (egyedi) - Belső kommunikáció
5. **KGC Finance + Számlázz.hu** - Pénzügy, NAV Online számla

Részletek: `docs/architecture/README.md`

## Projekt Struktúra

```
_bmad/                    # BMAD keretrendszer
├── core/                 # Keretrendszer alap, config.yaml
├── bmm/                  # BMad Method Modul (PM, Architect, DEV, TEA, SM)
│   ├── agents/           # 12 specializált ügynök
│   ├── workflows/        # 34 workflow 4 fázisban
│   └── teams/            # Előre konfigurált ügynök csoportok
├── bmb/                  # BMad Builder - Egyedi ügynök/workflow létrehozás
└── cis/                  # Creative Intelligence Suite

docs/
├── prd.md                # Fő PRD dokumentum
├── architecture/         # 15+ ADR, integrációs stratégia
│   └── diagrams/         # Technikai diagramok
└── Flows/                # Interaktív diagram rendszer
    ├── diagrams/         # 46 SVG diagram
    ├── scripts/          # Generátor scriptek (Node.js)
    └── KGC-ERP-Portable-*.html  # Self-contained HTML
```

## BMAD Workflow-k

### Leggyakoribb Workflow-k

```bash
# Státusz és inicializálás
/bmad:bmm:workflows:workflow-init     # Projekt inicializálás
/bmad:bmm:workflows:workflow-status   # Aktuális fázis ellenőrzése
/bmad:bmm:workflows:sprint-status     # Sprint státusz

# Tervezés
/bmad:bmm:workflows:prd               # PRD készítés (PM)
/bmad:bmm:workflows:architecture      # Architektúra tervezés (Architect)

# Implementáció (Fázis 4)
/bmad:bmm:workflows:create-epics-stories  # Epic/Story generálás PRD-ből
/bmad:bmm:workflows:create-story          # Következő story elkészítése
/bmad:bmm:workflows:story-ready           # Story ready-for-dev
/bmad:bmm:workflows:dev-story             # Story implementálás (DEV)
/bmad:bmm:workflows:code-review           # Adversarial review (3-10 hiba!)
/bmad:bmm:workflows:story-done            # Story lezárás
```

### Story Életciklus

`backlog → drafted → ready-for-dev → in-progress → review → done`

## Gyakori Parancsok

### Diagram Generálás

```bash
cd docs/Flows/scripts
node generate-portable-html.js    # Portable HTML (46 SVG beágyazva)
node generate-html.js             # Interaktív HTML
node convert-to-svg.js            # Excalidraw → SVG
```

**Kimenet**: `docs/Flows/KGC-ERP-Portable-YYYY-MM-DD.html`

## Fontos ADR-ek

Architektúra döntéseket érintő változtatás előtt olvasd el a releváns ADR-t!

| ADR | Téma |
|-----|------|
| ADR-001 | Franchise multi-tenancy |
| ADR-002 | Deployment és offline stratégia (PWA, papír backup) |
| ADR-003 | White label értékesítési stratégia |
| ADR-009/014 | Moduláris architektúra döntés |
| ADR-015 | CRM/Support integráció (Twenty + Chatwoot) |

Teljes lista: `docs/architecture/`

## BMAD Konfiguráció

- **Fő config**: `_bmad/core/config.yaml`
- **User**: `Javo!`
- **Nyelv**: Hungarian
- **Output**: `{project-root}/docs`
- **Workflow státusz**: `bmm-workflow-status.yaml` (ha létezik)
- **Sprint státusz**: `sprint-status.yaml` (ha létezik)

## Fejlesztési Irányelvek

1. **BMAD kötelező** - Minden feladat workflow-n keresztül
2. **Friss kontextus** - Minden workflow új agent spawn-nal
3. **Magyar nyelv** - Dokumentumok és kommunikáció magyarul
4. **ADR változásnál** - Új ADR készítése architektúra döntésekhez
5. **Diagram frissítés** - Excalidraw → SVG → HTML újragenerálás

## Licensz

Belső projekt - KGC Kft.
