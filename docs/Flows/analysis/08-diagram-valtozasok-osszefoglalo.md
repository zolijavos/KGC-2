# KGC ERP - Diagram Változások Összefoglaló

## Dokumentum Információk

| Tulajdonság | Érték |
|-------------|-------|
| **Dátum** | 2025-12-03 |
| **Verzió** | 1.1 |
| **Forrás** | KGC Találkozó 2025-12-01, 2025-12-02 |
| **Státusz** | Elkészült |

---

## Áttekintés

A 2025. december 1-2-i találkozón elhangzottak alapján a KGC ERP diagram dokumentáció az alábbi változásokon esett át:

```
┌─────────────────────────────────────────────────────────────────┐
│                    DIAGRAM VÁLTOZÁSOK                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Eredeti állapot:     21 diagram                                │
│  Új állapot:          26 diagram (+5 új)                        │
│  Frissített régi:     4 diagram                                 │
│  Új entitások:        13 db                                     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 1. Új Diagramok (8. rész)

### 1.1 Holding Struktúra
| Fájl | Típus | Tartalom |
|------|-------|----------|
| `8-holding-struktura.excalidraw` | Architektúra | KGC Holding → Leányvállalatok hierarchia |
| `08-holding-struktura.md` | Dokumentáció | Tulajdonosi viszonyok, adómentes osztalék |

**Új entitások:**
- `HOLDING` - Anyavállalat
- `LEÁNYVÁLLALAT` - Gyermekcégek

---

### 1.2 Részletfizetés Folyamat
| Fájl | Típus | Tartalom |
|------|-------|----------|
| `8-reszletfizetes-folyamat.excalidraw` | Folyamatábra | Előleg → Részletek → Végszámla |
| `08-reszletfizetes-folyamat.md` | Dokumentáció | Max 12 havi terv, automatikus díjbekérők |

**Új entitások:**
- `RÉSZLETFIZETÉSI_TERV` - Törlesztési ütemezés
- `TÖRLESZTÉS` - Egyedi részletek
- `ELŐLEG` - Előlegszámlák
- `DÍJBEKÉRŐ` - Fizetési felszólítások

---

### 1.3 Garanciális Javítás
| Fájl | Típus | Tartalom |
|------|-------|----------|
| `8-garancialis-javitas.excalidraw` | Folyamatábra + ERD | Makita norma vs. egyedi elbírálás |
| `08-garancialis-javitas.md` | Dokumentáció | Gyártói elszámolás, norma táblázatok |

**Új entitások:**
- `GARANCIA_SZERZŐDÉS` - Gyártói keretszerződések
- `GARANCIA_CLAIM` - Javítás elszámolások
- `NORMA_TÉTEL` - Fix javítási idők (Makita)

---

### 1.4 Deployment Architektúra
| Fájl | Típus | Tartalom |
|------|-------|----------|
| `8-deployment-architektura.excalidraw` | Architektúra | Felhő vs. Hibrid vs. On-Premise |
| `08-deployment-architektura.md` | Dokumentáció | ADR-002 bővítés, offline stratégia |

**ADR-002 bővítések:**
- PWA offline működés részletezése
- IndexedDB lokális tárolás
- Background Sync API

---

### 1.5 Készlet Szinkronizáció
| Fájl | Típus | Tartalom |
|------|-------|----------|
| `8-keszlet-szinkron.excalidraw` | Architektúra + API | Országos készlet láthatóság |
| `08-keszlet-szinkron.md` | Dokumentáció | Webshop API, real-time sync |

**Új entitások:**
- `FOGLALÁS` - Online foglalások kezelése

---

## 2. Frissített Régi Diagramok

### 2.1 Szerviz ERD (04)
| Változás | Leírás |
|----------|--------|
| **Fájl** | `4-szerviz-erd.excalidraw` |
| **Bővítés** | +3 entitás: GARANCIA_SZERZŐDÉS, GARANCIA_CLAIM, NORMA_TÉTEL |
| **Cél** | Garanciális javítás támogatása |

```
Régi:  MUNKALAP ─── PARTNER
       │
       └─── CIKK

Új:    MUNKALAP ─── PARTNER
       │
       ├─── CIKK
       │
       └─── GARANCIA_CLAIM ─── GARANCIA_SZERZŐDÉS ─── NORMA_TÉTEL
```

---

### 2.2 Értékesítés ERD (02)
| Változás | Leírás |
|----------|--------|
| **Fájl** | `2-ertekesites-erd.excalidraw` |
| **Bővítés** | +2 entitás: ELŐLEG, DÍJBEKÉRŐ |
| **Cél** | Részletfizetés támogatása |

```
Régi:  SZÁMLA ─── PARTNER
       │
       └─── SZÁMLA_TÉTEL

Új:    SZÁMLA ─── PARTNER ─── ELŐLEG
       │                  │
       └─── SZÁMLA_TÉTEL  └─── DÍJBEKÉRŐ
```

---

### 2.3 Pénzügy Folyamat (05)
| Változás | Leírás |
|----------|--------|
| **Fájl** | `5-penzugy-folyamat.excalidraw` |
| **Bővítés** | +1 szekció: 5. RÉSZLETFIZETÉS |
| **Cél** | Nagy összegű megrendelések kezelése |

**Új folyamat lépések:**
1. Nagy összegű megrendelés trigger
2. Előleg számla kiállítása (30%)
3. Részletfizetési terv készítése
4. Havi díjbekérők automatikus küldése
5. Végszámla kiállítása

---

### 2.4 Új Entitások ERD (07)
| Változás | Leírás |
|----------|--------|
| **Fájl** | `7-erd-uj-entitasok.excalidraw` |
| **Bővítés** | +1 referencia: HOLDING kapcsolat |
| **Cél** | Franchise → Holding hierarchia |

```sql
-- Új mező a FRANCHISE_PARTNER entitásban
ALTER TABLE franchise_partner
ADD COLUMN holding_id INTEGER REFERENCES holding(holding_id);
```

---

## 3. Új Entitások Összesítő

| # | Entitás | Modul | Diagram |
|---|---------|-------|---------|
| 1 | HOLDING | Szervezet | 08-holding-struktura |
| 2 | LEÁNYVÁLLALAT | Szervezet | 08-holding-struktura |
| 3 | RÉSZLETFIZETÉSI_TERV | Pénzügy | 08-reszletfizetes-folyamat |
| 4 | TÖRLESZTÉS | Pénzügy | 08-reszletfizetes-folyamat |
| 5 | ELŐLEG | Pénzügy | 08-reszletfizetes-folyamat, 02-ertekesites-erd |
| 6 | DÍJBEKÉRŐ | Pénzügy | 08-reszletfizetes-folyamat, 02-ertekesites-erd |
| 7 | GARANCIA_SZERZŐDÉS | Szerviz | 08-garancialis-javitas, 04-szerviz-erd |
| 8 | GARANCIA_CLAIM | Szerviz | 08-garancialis-javitas, 04-szerviz-erd |
| 9 | NORMA_TÉTEL | Szerviz | 08-garancialis-javitas, 04-szerviz-erd |
| 10 | FOGLALÁS | Készlet | 08-keszlet-szinkron |

---

## 4. Kereszthivatkozások

### Új dokumentumok kapcsolatai:

```
08-holding-struktura.md
    └─→ 07-erd-uj-entitasok.md (FRANCHISE_PARTNER bővítés)

08-reszletfizetes-folyamat.md
    ├─→ 02-ertekesites-erd.md (ELŐLEG, DÍJBEKÉRŐ)
    └─→ 05-penzugy-folyamat.md (5. szekció)

08-garancialis-javitas.md
    └─→ 04-szerviz-erd.md (GARANCIA entitások)

08-deployment-architektura.md
    └─→ ADR-002 (Offline működés)

08-keszlet-szinkron.md
    └─→ 02-ertekesites-erd.md (KÉSZLET, CIKK)
```

---

## 5. Fájlok Listája

### Új fájlok (10 db):
| Típus | Fájl |
|-------|------|
| Excalidraw | `diagrams/8-holding-struktura.excalidraw` |
| Excalidraw | `diagrams/8-reszletfizetes-folyamat.excalidraw` |
| Excalidraw | `diagrams/8-garancialis-javitas.excalidraw` |
| Excalidraw | `diagrams/8-deployment-architektura.excalidraw` |
| Excalidraw | `diagrams/8-keszlet-szinkron.excalidraw` |
| Markdown | `diagram-docs/08-holding-struktura.md` |
| Markdown | `diagram-docs/08-reszletfizetes-folyamat.md` |
| Markdown | `diagram-docs/08-garancialis-javitas.md` |
| Markdown | `diagram-docs/08-deployment-architektura.md` |
| Markdown | `diagram-docs/08-keszlet-szinkron.md` |

### Módosított fájlok (9 db):
| Típus | Fájl | Változás |
|-------|------|----------|
| Excalidraw | `diagrams/4-szerviz-erd.excalidraw` | +Garancia entitások |
| Excalidraw | `diagrams/2-ertekesites-erd.excalidraw` | +Előleg, Díjbekérő |
| Excalidraw | `diagrams/5-penzugy-folyamat.excalidraw` | +Részletfizetés szekció |
| Excalidraw | `diagrams/7-erd-uj-entitasok.excalidraw` | +Holding referencia |
| Markdown | `diagram-docs/04-szerviz-erd.md` | +Garancia szekció |
| Markdown | `diagram-docs/02-ertekesites-erd.md` | +Pénzügyi entitások |
| Markdown | `diagram-docs/05-penzugy-folyamat.md` | +Részletfizetés szekció |
| Markdown | `diagram-docs/07-erd-uj-entitasok.md` | +Holding kapcsolat |
| Markdown | `diagram-docs/INDEX.md` | Frissített lista |

---

## 6. Következő Lépések

| Prioritás | Feladat | Státusz |
|-----------|---------|---------|
| 1 | INDEX.md frissítése | ✅ Kész |
| 2 | Fit-Gap analízis | ✅ Kész |
| 3 | Új diagramok létrehozása | ✅ Kész |
| 4 | Régi diagramok frissítése | ✅ Kész |
| 5 | PRD bővítése az új entitásokkal | ✅ Kész (v1.1) |
| 6 | Architektúra dokumentum frissítése | ✅ Kész (ADR-001, ADR-002 v1.1) |

---

## Kapcsolódó Dokumentumok

- [INDEX.md](../diagram-docs/INDEX.md) - Diagram katalógus
- [07-fit-gap-folyamatok.md](07-fit-gap-folyamatok.md) - Fit-Gap analízis
- [KGC-notes-2025-12-1.all.md](../transcripts/KGC-notes-2025-12-1.all.md) - Találkozó jegyzőkönyv

---

*Generálva: 2025-12-03*
