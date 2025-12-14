# KGC ERP - Készletmozgás DFD (Data Flow Diagram)

| Tulajdonság | Érték |
|-------------|-------|
| **Diagram fájl** | `2-ertekesites-keszlet.excalidraw` |
| **Típus** | DFD (Adatfolyam diagram) |
| **Modul** | 2. Értékesítés - Készletmozgás |
| **Verzió** | 1.0 |
| **Készült** | 2024-11-28 |
| **Dokumentálva** | 2025-12-04 |

---

## Áttekintés

Ez a DFD diagram a **készletmozgás folyamatait** mutatja be az Értékesítés modulban. Szemlélteti hogyan áramlik a készlet a rendszerben a bevételezéstől az eladásig, beleértve az átcsoportosítást is.

```
┌─────────────────────────────────────────────────────────────────┐
│                    KÉSZLETMOZGÁS TÍPUSOK                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. BEVÉTELEZÉS      → Készlet +N (zöld)                        │
│  2. ÁTCSOPORTOSÍTÁS  → Készlet -N/+N (piros/zöld)               │
│  3. ELADÁS           → Készlet -N (piros)                       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 1. Bevételezés Folyamat

### 1.1 Adatfolyam

```
┌──────────────┐         ┌─────────────────┐         ┌─────────────┐
│  BESZÁLLÍTÓ  │ ──────► │  1.0 Bevételezés│ ──────► │ D1: Készlet │
│   (Külső)    │ Számla+ │                 │   +N    │             │
└──────────────┘ Termék  └─────────────────┘  darab  └─────────────┘
```

### 1.2 Leírás

| Elem | Típus | Funkció |
|------|-------|---------|
| BESZÁLLÍTÓ | Külső entitás | Árubeszállító partner |
| 1.0 Bevételezés | Folyamat | Áru fogadása, ellenőrzés, rögzítés |
| D1: Készlet | Adattár | Készlet nyilvántartás |

### 1.3 Kapcsolódó entitások

- `BESZÁLLÍTÓ` tábla
- `BEVÉTELEZÉS` tábla
- `BEVÉTELEZÉS_TÉTEL` tábla
- `CIKK.keszlet` mező frissítése

---

## 2. Átcsoportosítás Folyamat

### 2.1 Adatfolyam

```
┌──────────────────┐         ┌─────────────────┐         ┌─────────────┐
│ Eredeti cikkszám │ ──────► │  2.0 MÍNUSZ (-) │ ──────► │ D1: Készlet │
│   (Belső kód)    │         │                 │   -N    │             │
└──────────────────┘         └─────────────────┘  darab  └─────────────┘

┌──────────────────┐         ┌─────────────────┐         ┌─────────────┐
│ Vevő cikkszáma   │ ──────► │  3.0 PLUSZ (+)  │ ──────► │ D1: Készlet │
│ (FGS: 43 10 429) │         │                 │   +N    │             │
└──────────────────┘         └─────────────────┘  darab  └─────────────┘
```

### 2.2 Leírás

Az **átcsoportosítás** (vagy cikkszám-átnevezés) folyamat:

1. **MÍNUSZ művelet**: Az eredeti (belső) cikkszám készletéből kivonás
2. **PLUSZ művelet**: A vevő saját cikkszámára átkönyvelés

| Típus | Művelet | Készlet hatás |
|-------|---------|---------------|
| Eredeti cikk | MÍNUSZ | -N darab |
| Új cikk (vevőé) | PLUSZ | +N darab |

### 2.3 Üzleti cél

Ez a folyamat akkor használatos, amikor:
- A vevő saját cikkszámot használ (pl. FGS rendszerben)
- A belső cikkszámról át kell könyvelni a vevő cikkszámára
- Készlet-összesítőben mindkét cikkszám megjelenhet

### 2.4 Kapcsolódó entitások

- `KÉSZLET_MOZGÁS` tábla (tipus: 'ÁTCSOPORTOSÍTÁS')
- `CIKK` tábla (eredeti és új cikkszám)
- `CIKKCSOPORT` (kategorizálás)

---

## 3. Eladás Folyamat

### 3.1 Adatfolyam

```
┌──────────────┐         ┌─────────────────┐         ┌─────────────┐
│     VEVŐ     │ ──────► │ 4.0 Értékesítés │ ──────► │ D1: Készlet │
│  (Partner)   │ Megr.   │                 │   -N    │             │
└──────────────┘         └─────────────────┘  darab  └─────────────┘
```

### 3.2 Leírás

| Elem | Típus | Funkció |
|------|-------|---------|
| VEVŐ | Külső entitás | Vásárló partner |
| 4.0 Értékesítés | Folyamat | Értékesítési tranzakció |
| D1: Készlet | Adattár | Készlet csökkentése |

### 3.3 Kapcsolódó entitások

- `PARTNER` tábla (partner_tipus: 'VEVŐ')
- `ÉRTÉKESÍTÉS` tábla
- `ÉRTÉKESÍTÉS_TÉTEL` tábla
- `CIKK.keszlet` mező csökkentése

---

## 4. Jelmagyarázat

| Szimbólum | Jelentés | Szín |
|-----------|----------|------|
| Téglalap (vastag keret) | Külső entitás | Lila/Kék |
| Ellipszis | Folyamat | Narancssárga/Zöld/Piros |
| Nyitott téglalap | Adattár | Kék |
| +N nyíl | Készlet növekedés | 🟢 Zöld |
| -N nyíl | Készlet csökkenés | 🔴 Piros |

---

## 5. Összefoglalás

### 5.1 Készletmozgás típusok

| # | Típus | Forrás | Cél | Hatás |
|---|-------|--------|-----|-------|
| 1 | Bevételezés | Beszállító | Készlet | +N |
| 2a | Átcsoportosítás (ki) | Eredeti cikk | Készlet | -N |
| 2b | Átcsoportosítás (be) | Új cikk | Készlet | +N |
| 3 | Eladás | Készlet | Vevő | -N |

### 5.2 Diagram vs. ERD vs. Sync

Ez a diagram kiegészíti:

| Dokumentum | Tartalom | Cél |
|------------|----------|-----|
| **Ez a DFD** | Készlet mozgás folyamatok | Hogyan áramlik a készlet |
| `02-ertekesites-erd.md` | Adatmodell struktúra | Milyen táblák vannak |
| `08-keszlet-szinkron.md` | Szinkronizáció | Hogyan szinkronizálódik |

---

*Dokumentáció készült: 2025-12-04*
*Eredeti diagram: 2024-11-28*
