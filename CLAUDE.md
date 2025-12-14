# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## KRITIKUS SZABÁLY - MINDIG BMAD MÓDSZERREL DOLGOZZ

**KÖTELEZŐ**: Minden fejlesztési feladathoz BMAD ügynököket és BMAD workflow-kat használj! Soha ne dolgozz a BMAD keretrendszeren kívül.

- **Nyelv**: Magyar - minden kommunikáció és dokumentum magyarul készüljön
- **Módszer**: Mindig a megfelelő BMAD workflow-t indítsd el a `/bmad:bmm:workflows:*` parancsokkal
- **Ügynökök**: A feladatnak megfelelő BMAD ügynököt használd (PM, Architect, SM, DEV, stb.)

## Projekt Áttekintés

Ez egy **BMad Method v6** projekt munkaterület egy KGC (ERP/Értékesítés-kezelő) rendszer fejlesztéséhez. A BMad Method egy AI-vezérelt agilis fejlesztési módszertan specializált ügynökökkel és workflow-kkal.

## BMad Method Architektúra

### Modul Struktúra

```
.bmad/
├── core/           # Keretrendszer alap - BMad Master ügynök, core feladatok, erőforrások
├── bmm/            # BMad Method Modul - Fő fejlesztési orchestráció
│   ├── agents/     # PM, Analyst, Architect, SM, DEV, TEA, UX-Designer, Tech-Writer
│   └── workflows/  # 34 workflow 4 fázisban
├── bmb/            # BMad Builder - Egyedi ügynökök/workflow-k létrehozása
├── cis/            # Creative Intelligence Suite - Ötletelés, design thinking
└── _cfg/           # Konfigurációs manifestek
```

### Fő Ügynökök

- **Analyst** - Workflow inicializálás, projekt elemzés
- **PM** - PRD készítés, követelmények kezelése
- **Architect** - Rendszer architektúra, technikai döntések
- **SM (Scrum Master)** - Sprint tervezés, story kezelés
- **DEV** - Kód implementáció, kód review
- **TEA** - Teszt mérnök
- **UX-Designer** - UI/UX tervezési dokumentumok

### Fejlesztési Fázisok

1. **Fázis 1 (Elemzés)** - Opcionális: ötletelés, kutatás, termék brief
2. **Fázis 2 (Tervezés)** - Kötelező: PRD vagy tech-spec
3. **Fázis 3 (Megoldás)** - Architektúra (BMad Method/Enterprise track esetén)
4. **Fázis 4 (Implementáció)** - Story-ról story-ra fejlesztés

### Három Tervezési Sáv

- **Quick Flow** - Hibajavítások, egyszerű funkciók (csak tech-spec, tipikusan 1-15 story)
- **BMad Method** - Termékek, platformok (PRD + Architektúra, 10-50+ story)
- **Enterprise Method** - Megfelelőség, multi-tenant (PRD + Architektúra + Security/DevOps/Test)

## BMAD Workflow-k Használata

### Workflow-k Indítása Slash Parancsokkal

A workflow-k `/bmad:bmm:workflows:*` slash parancsokként érhetők el. Legfontosabb workflow-k:

- `/bmad:bmm:workflows:workflow-init` - Projekt inicializálás és tervezési sáv kiválasztása
- `/bmad:bmm:workflows:workflow-status` - Aktuális fázis és következő lépések ellenőrzése
- `/bmad:bmm:workflows:prd` - PRD (Termék Követelmény Dokumentum) készítés
- `/bmad:bmm:workflows:architecture` - Rendszer architektúra tervezés
- `/bmad:bmm:workflows:sprint-planning` - Sprint követés inicializálása
- `/bmad:bmm:workflows:create-story` - Következő story elkészítése az epicekből
- `/bmad:bmm:workflows:dev-story` - Story implementálása
- `/bmad:bmm:workflows:code-review` - Elkészült story review-ja

### Workflow Használati Szabályok

- **Friss kontextus** minden workflow-hoz a hallucinációk elkerülése érdekében
- A workflow-k automatikusan frissítik a `bmm-workflow-status.yaml` és `sprint-status.yaml` fájlokat
- Story életciklus: `backlog → drafted → ready → in-progress → review → done`

## Projekt Dokumentáció Helye

- `.bmad/bmm/docs/` - BMad Method dokumentáció és útmutatók
- `docs/` - Projekt-specifikus dokumentum kimeneti mappa
- `docs/Flows/` - Üzleti folyamat dokumentáció (magyar)
- `docs/ERP/` - ERP rendszer referencia dokumentáció

## Ügynök Aktiválás

Az ügynökök a `.bmad/[modul]/agents/` mappában lévő markdown fájlokból töltődnek be. Minden ügynök:
1. Beolvassa a `{project-root}/{bmad_folder}/core/config.yaml` beállításokat
2. Számozott menüt jelenít meg az elérhető workflow-kkal
3. Parancsokat fogad: menü szám, `*rövidítés`, vagy természetes nyelv

## Konfiguráció

Fő beállítások a `.bmad/core/config.yaml` fájlban:
- `user_name`: "Javo!"
- `communication_language`: Magyar
- `document_output_language`: Magyar
- `output_folder`: `{project-root}/docs`
