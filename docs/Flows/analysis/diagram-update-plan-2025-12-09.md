# KGC ERP v3 - Diagram Frissítési Terv

**Készítette:** Mary (Business Analyst) + BMAD Team
**Dátum:** 2025-12-09
**Forrás:** KGC-ERP-v3-Diagramok.html megjegyzések + ADR döntések
**Verzió:** 4.0
**Státusz:** Jóváhagyva

---

## Összefoglaló

Ez a dokumentum az ügyfél megjegyzéseit és az elfogadott ADR döntéseket **diagram-specifikusan** elemzi, és meghatározza a szükséges módosításokat minden érintett diagramhoz.

### Kapcsolódó ADR Döntések (Accepted)

| ADR | Téma | Hatás |
|-----|------|-------|
| [ADR-005](../../architecture/ADR-005-mypos-payment-token-2025-12-08.md) | MyPos Payment Token | Új diagram: 10-mypos-kaucio |
| [ADR-006](../../architecture/ADR-006-berles-audit-trail-2025-12-08.md) | Bérlés Audit Trail | Frissítés: 01-ugyfelfelvitel-folyamat |
| [ADR-007](../../architecture/ADR-007-employee-discount-2025-12-08.md) | Employee Discount | Új diagram: 10-kedvezmeny-erd |
| [ADR-008](../../architecture/ADR-008-device-auth-elevated-2025-12-08.md) | Device Auth | Új diagram: 10-device-auth |

---

## Vizuális Jelölések a HTML-ben

A frissített HTML fájlban az alábbi jelölések segítik az ügyfelet:

| Jelölés | Jelentés |
|---------|----------|
| 🔄 **FRISSÍTVE** | Meglévő diagram módosításra került |
| 🆕 **ÚJ** | Teljesen új diagram |
| 🔴 | Jelentős változás (5+ módosítás) |
| 🟠 | Közepes változás (2-4 módosítás) |
| 🟢 | Minimális változás (1 módosítás) |

---

## Érintett Diagramok Összefoglaló

### 🔄 Frissített Diagramok

| # | Diagram ID | Fájl | Változás | Prioritás |
|---|------------|------|----------|-----------|
| 1 | `1-ugyfelfelvitel-folyamat` | [01-ugyfelfelvitel-folyamat.md](../diagram-docs/01-ugyfelfelvitel-folyamat.md) | 🔴 Jelentős (6 módosítás) | Sprint 1 |
| 2 | `1-ugyfelfelvitel-dontesi-fa` | [01-ugyfelfelvitel-dontesi-fa.md](../diagram-docs/01-ugyfelfelvitel-dontesi-fa.md) | 🟠 Közepes (5 módosítás) | Sprint 1 |
| 3 | `1-ugyfelfelvitel-erd` | [01-ugyfelfelvitel-erd.md](../diagram-docs/01-ugyfelfelvitel-erd.md) | 🟠 Közepes (7 mező) | Sprint 1 |
| 4 | `2-ertekesites-erd` | [02-ertekesites-erd.md](../diagram-docs/02-ertekesites-erd.md) | 🟢 Minimális (1 megjegyzés) | Sprint 3 |
| 5 | `3-bergep-folyamat` | [03-bergep-folyamat.md](../diagram-docs/03-bergep-folyamat.md) | 🟠 Közepes (4 módosítás) | Sprint 2 |
| 6 | `4-szerviz-folyamat` | [04-szerviz-folyamat.md](../diagram-docs/04-szerviz-folyamat.md) | 🟠 Közepes (5 módosítás) | Sprint 2 |

### 🆕 Új Diagramok

| # | Diagram ID | Típus | ADR | Prioritás |
|---|------------|-------|-----|-----------|
| 1 | `10-mypos-kaucio-folyamat` | Folyamatábra | ADR-005 | Sprint 1 |
| 2 | `10-device-auth-folyamat` | Folyamatábra | ADR-008 | Sprint 2 |
| 3 | `10-kedvezmeny-erd` | ERD | ADR-007 | Sprint 2 |
| 4 | `10-berles-audit-erd` | ERD | ADR-006 | Sprint 1 |

---

## Részletes Frissítési Terv

### 1. 🔄 `01-ugyfelfelvitel-folyamat` - 🔴 JELENTŐS

**ADR hivatkozás:** ADR-006, ADR-008

#### Változások

| # | Szekció | Változás | ADR |
|---|---------|----------|-----|
| 1 | Belépés | + Kiosk mód választás (közös PIN) | ADR-008 |
| 2 | Kaució | + MyPos kártyás fizetés (+2% díj) | ADR-005 |
| 3 | Tartozék | + Kellékek, tartozékok kiválasztása | Ügyfél |
| 4 | Kiadás | + Fizikai kiadó személy rögzítése | ADR-006 |
| 5 | Visszavétel | + Fizikai visszavevő személy rögzítése | ADR-006 |
| 6 | Kedvezmény | + Dolgozói kedvezmény automatikus | ADR-007 |

#### Mockup Frissítések

```
ÚJ KEZDŐ BLOKK (1.1 előtt):
┌─────────────────────────────────────┐
│  🔓 BELÉPÉSI MÓD VÁLASZTÁS          │
│  ┌───────────┬───────────┐          │
│  │ Kiosk Mód │ Egyéni    │          │
│  │ (bolti)   │ Bejelentk │          │
│  └───────────┴───────────┘          │
│  ℹ️ ADR-008: Device Auth             │
└─────────────────────────────────────┘

MÓDOSÍTOTT KAUCIÓ BLOKK (1.7):
┌─────────────────────────────────────┐
│  💰 KAUCIÓ TÍPUS?                   │
│  ┌─────────┬─────────┬─────────┐    │
│  │Készpénz │Kártya   │Átutalás │    │
│  │(0%)     │(+2%)    │(cég)    │    │
│  └─────────┴─────────┴─────────┘    │
│  ℹ️ ADR-005: MyPos Integration       │
└─────────────────────────────────────┘

ÚJ AUDIT BLOKK (kiadásnál):
┌─────────────────────────────────────┐
│  👤 KI ADTA KI FIZIKAILAG?          │
│  [Dropdown: Péter, Levente, Zoli]   │
│  ℹ️ ADR-006: Audit Trail             │
└─────────────────────────────────────┘
```

---

### 2. 🔄 `01-ugyfelfelvitel-dontesi-fa` - 🟠 KÖZEPES

**ADR hivatkozás:** ADR-005, ADR-006

#### Változások

| # | Döntési Pont | Változás |
|---|--------------|----------|
| 1 | D4 Fizetési mód | Kártya = VAN számla (korábban: nincs) |
| 2 | D4 után | + Készpénz + nem számla → háttér szállítólevél |
| 3 | D5 után | + Kár esetén → jegyzőkönyv (ADR-006) |
| 4 | D6 új | Kár van? → Kaució benntartás/visszaadás |
| 5 | Kaució | + MyPos visszatérítés ág |

---

### 3. 🔄 `01-ugyfelfelvitel-erd` - 🟠 KÖZEPES

**Ügyfél visszajelzés alapján**

#### Mezők Változása

| Entitás | Mező | Művelet | Megjegyzés |
|---------|------|---------|------------|
| PARTNER | taj_szam | 🗑️ TÖRLÉS | "TAJ szám nem kell" |
| PARTNER | mothers_name | 🆕 HOZZÁADÁS | Anyja neve |
| PARTNER | birth_place | 🆕 HOZZÁADÁS | Születési hely |
| PARTNER | birth_date | 🆕 HOZZÁADÁS | Születési idő |
| PARTNER | temporary_address | 🆕 HOZZÁADÁS | Tartózkodási hely |
| CÉG | vat_zone | 🆕 HOZZÁADÁS | HU/EU/NON_EU (auto ÁFA) |
| PARTNER | rogzito_id | 📝 JAVÍTÁS | Magyarázat hozzáadása |

---

### 4. 🔄 `02-ertekesites-erd` - 🟢 MINIMÁLIS

#### Változások

| Elem | Változás |
|------|----------|
| CIKKCSOPORT | + Megjegyzés: "Csökkentett jelentőség" |
| Migráció | + Dokumentálás: "5 évnél nem régebbi termékek" |

---

### 5. 🔄 `03-bergep-folyamat` - 🟠 KÖZEPES

**Ügyfél visszajelzés alapján**

#### Változások

| # | Szekció | Változás |
|---|---------|----------|
| 1 | Bérgép adatok | + Kapcsolódó termékek lista |
| 2 | Kimutatások | + Gyakori javítási cikkszámok |
| 3 | Időtartam | + HÉTVÉGE opció (szombat-hétfő = 1.5 nap) |
| 4 | ERD | + BÉRGÉP_TARTOZÉK, BÉRGÉP_JAVÍTÁS_CIKK |

---

### 6. 🔄 `04-szerviz-folyamat` - 🟠 KÖZEPES

**Ügyfél visszajelzés alapján**

#### Változások

| # | Szekció | Változás |
|---|---------|----------|
| 1 | Felvételi típus | + garanciális/javítás/árajánlat enum |
| 2 | Tartozék | + Checklist (markolat, lánc, burkolat, stb.) |
| 3 | Csatolmány | + Garancialevél, számla, fotó feltöltés |
| 4 | Kommunikáció | + Belső üzenetek (internal_notes) |
| 5 | ERD | + SZERVIZ_TARTOZÉK, MUNKALAP_CSATOLMÁNY |

---

## Új Diagramok Részletes Terv

### 🆕 `10-mypos-kaucio-folyamat` (ADR-005)

**Típus:** Folyamatábra
**Sprint:** 1

```
┌─────────────────────────────────────────────────────────────────┐
│                 MyPos KAUCIÓ FOLYAMAT                           │
│                 📋 ADR-005 alapján                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────┐    ┌─────────────┐    ┌─────────────────┐         │
│  │ Kaució  │───▶│ Fizetési    │───▶│ Készpénz?       │         │
│  │ összeg  │    │ mód?        │    │ Kaució = 100%   │         │
│  └─────────┘    └──────┬──────┘    └─────────────────┘         │
│                        │                                        │
│                   Kártya                                        │
│                        │                                        │
│                        ▼                                        │
│              ┌─────────────────┐                                │
│              │ 2% díj fizetése │                                │
│              │ (pl. 1000 Ft)   │                                │
│              └────────┬────────┘                                │
│                       │                                         │
│                       ▼                                         │
│              ┌─────────────────┐                                │
│              │ MyPos terminál  │                                │
│              │ + TOKEN mentés  │  ◄── AES-256-GCM titkosítás    │
│              └────────┬────────┘                                │
│                       │                                         │
│    ═══════════════════╪═════════════════════════════           │
│                       │                                         │
│              VISSZAHOZÁSKOR                                     │
│                       │                                         │
│                       ▼                                         │
│              ┌─────────────────┐                                │
│              │ Kár van?        │                                │
│              └────────┬────────┘                                │
│                  NEM  │  IGEN                                   │
│                   │   │   │                                     │
│                   ▼   │   ▼                                     │
│  ┌─────────────────┐  │  ┌─────────────────┐                   │
│  │MyPos visszatérít│  │  │Kaució benntart. │                   │
│  │Kaució - 2%      │  │  │+ Jegyzőkönyv    │                   │
│  │(ugyanaz kártya) │  │  │(ADR-006)        │                   │
│  └─────────────────┘  │  └─────────────────┘                   │
│                       │                                         │
└───────────────────────┴─────────────────────────────────────────┘
```

---

### 🆕 `10-device-auth-folyamat` (ADR-008)

**Típus:** Folyamatábra
**Sprint:** 2

```
┌─────────────────────────────────────────────────────────────────┐
│              GÉP-ALAPÚ BEJELENTKEZÉS (KIOSK MÓD)                │
│              📋 ADR-008 alapján                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  BOLTI GÉPEK (3 db)              HÁTTÉRGÉP                      │
│  ┌─────────────────┐            ┌─────────────────┐             │
│  │ Kiosk Mód       │            │ Backoffice Mód  │             │
│  │ Alapértelmezett │            │ Teljes jogosult.│             │
│  │ OPERATOR szint  │            │ Egyéni belépés  │             │
│  └────────┬────────┘            └────────┬────────┘             │
│           │                              │                      │
│           ▼                              ▼                      │
│  ┌─────────────────┐            ┌─────────────────┐             │
│  │ Közös PIN kód   │            │ Felhasználónév  │             │
│  │ (bekapcsolás)   │            │ + Jelszó        │             │
│  └────────┬────────┘            └─────────────────┘             │
│           │                                                     │
│           ▼                                                     │
│  ┌─────────────────┐                                            │
│  │ Művelet igényel │                                            │
│  │ magasabb jogot? │                                            │
│  └────────┬────────┘                                            │
│      NEM  │  IGEN                                               │
│       │   │   │                                                 │
│       ▼   │   ▼                                                 │
│  ┌────────┐   ┌─────────────────┐                               │
│  │Művelet │   │ Személyes PIN   │ ◄── Elevated Session          │
│  │végrehaj│   │ beírása         │     (5 perc timeout)          │
│  └────────┘   │ → BRANCH_MANAGER│                               │
│               └─────────────────┘                               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

### 🆕 `10-kedvezmeny-erd` (ADR-007)

**Típus:** ERD
**Sprint:** 2

```
┌─────────────────────────────────────────────────────────────────┐
│              KEDVEZMÉNY RENDSZER ERD                            │
│              📋 ADR-007 alapján                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────────────┐      ┌──────────────────────────┐│
│  │   KEDVEZMÉNY_SZABÁLY     │      │  KEDVEZMÉNY_IGÉNYBEVÉTEL ││
│  ├──────────────────────────┤      ├──────────────────────────┤│
│  │ PK kedvezmeny_id         │──1:N─│ PK igenybevel_id         ││
│  │    tenant_id (UUID)      │      │    tenant_id (UUID)      ││
│  │    nev (VARCHAR)         │      │ FK kedvezmeny_id         ││
│  │    kod (VARCHAR)         │      │ FK user_id               ││
│  │    tipus (ENUM)          │      │    tranzakcio_tipus      ││
│  │    • berles              │      │ FK berles_id / szamla_id ││
│  │    • ertekesites         │      │    eredeti_osszeg        ││
│  │    • mindketto           │      │    kedvezmeny_osszeg     ││
│  │    kedvezmeny_tipus      │      │    fizetett_osszeg       ││
│  │    • szazalek            │      │    igenybevel_datum      ││
│  │    • fix_osszeg          │      └──────────────────────────┘│
│  │    • ingyenes            │                                  │
│  │    kedvezmeny_ertek      │                                  │
│  │    jogosult_szerepkorok  │  ◄── JSON: ["EMPLOYEE", ...]     │
│  │    limit_tipus           │                                  │
│  │    limit_ertek           │                                  │
│  │    aktiv (BOOLEAN)       │                                  │
│  └──────────────────────────┘                                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

### 🆕 `10-berles-audit-erd` (ADR-006)

**Típus:** ERD
**Sprint:** 1

```
┌─────────────────────────────────────────────────────────────────┐
│              BÉRLÉS AUDIT LOG ERD                               │
│              📋 ADR-006 alapján                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────────────┐      ┌──────────────────────────┐│
│  │        BÉRLÉS            │      │    BÉRLÉS_AUDIT_LOG      ││
│  ├──────────────────────────┤      ├──────────────────────────┤│
│  │ PK berles_id             │──1:N─│ PK log_id                ││
│  │    tenant_id             │      │    tenant_id             ││
│  │    ... (meglévő mezők)   │      │ FK berles_id             ││
│  └──────────────────────────┘      │    event_type (ENUM)     ││
│                                    │    • kiadas              ││
│                                    │    • visszavetel         ││
│                                    │    • kar_rogzites        ││
│                                    │    • kar_foto            ││
│                                    │    • statusz_valtozas    ││
│                                    │    • kaucio_benntartas   ││
│                                    │    event_timestamp       ││
│                                    │ FK user_id               ││
│                                    │    event_description     ││
│                                    │    kar_tipus             ││
│                                    │    kar_osszeg            ││
│                                    │    foto_url              ││
│                                    └──────────────────────────┘│
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Sprint Ütemezés

### Sprint 1 (Kritikus)

| Feladat | Típus | Becsült Pont |
|---------|-------|--------------|
| 01-ugyfelfelvitel-folyamat frissítése | 🔄 Frissítés | 5 |
| 01-ugyfelfelvitel-dontesi-fa frissítése | 🔄 Frissítés | 3 |
| 01-ugyfelfelvitel-erd frissítése | 🔄 Frissítés | 3 |
| 10-mypos-kaucio-folyamat létrehozása | 🆕 Új | 5 |
| 10-berles-audit-erd létrehozása | 🆕 Új | 3 |
| **Sprint 1 Összesen** | | **19** |

### Sprint 2 (Fontos)

| Feladat | Típus | Becsült Pont |
|---------|-------|--------------|
| 03-bergep-folyamat frissítése | 🔄 Frissítés | 3 |
| 04-szerviz-folyamat frissítése | 🔄 Frissítés | 3 |
| 10-device-auth-folyamat létrehozása | 🆕 Új | 5 |
| 10-kedvezmeny-erd létrehozása | 🆕 Új | 3 |
| **Sprint 2 Összesen** | | **14** |

### Sprint 3 (Alacsony)

| Feladat | Típus | Becsült Pont |
|---------|-------|--------------|
| 02-ertekesites-erd frissítése | 🔄 Frissítés | 1 |
| Dokumentáció véglegesítése | 📝 | 2 |
| **Sprint 3 Összesen** | | **3** |

---

## Változásnapló

| Verzió | Dátum | Változás |
|--------|-------|----------|
| 3.0 | 2025-12-08 | Diagram-specifikus frissítési terv (CSV megjegyzések alapján) |
| 4.0 | 2025-12-09 | ADR döntések integrálása, Sprint ütemezés, HTML jelölések |
