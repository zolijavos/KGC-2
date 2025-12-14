# 1. Ügyfél Felvétel és Bérlés - ERD (Entitás-Kapcsolat Diagram)

## Diagram Alapinformációk

| Tulajdonság | Érték |
|-------------|-------|
| **Fájlnév** | `1-ugyfelfelvitel-erd-2025-12-11.excalidraw` |
| **Típus** | ERD (Entity-Relationship Diagram) |
| **Modul** | Partner & Bérlés |
| **Verzió** | v3.0 (Multi-tenant + Fit-Gap frissítés) |
| **Dátum** | 2025-12-11 |
| **Kategória** | 1. rész - Ügyfél Felvétel és Bérlés |
| **Forrás ADR-ek** | ADR-013, ADR-014 |

---

## Részletes Leírás

Ez az ERD diagram a KGC ERP rendszer **adatmodelljét** mutatja be az ügyfélkezelés és bérlés modulhoz. A v3.0 verzió tartalmazza:
- **Multi-tenant** (ADR-001) támogatás
- **PWA offline** (ADR-002) támogatás
- **Fit-Gap analízis** (2025-12-07) alapján bővített mezők
- **ADR-013** döntések (kaució visszatérítés, meghatalmazottak)

---

## Entitások Részletes Leírása

### 1. PARTNER Entitás

A rendszer központi entitása, amely minden ügyfél (bérlő) alapadatait tárolja.

```
┌─────────────────────────────────────┐
│            PARTNER                  │
├─────────────────────────────────────┤
│ PK  partner_id (INT)                │
│     tenant_id (UUID) 🏢             │  ← Multi-tenant azonosító
├─────────────────────────────────────┤
│     nev (VARCHAR)                   │  ← Teljes név (kötelező)
│     cim (VARCHAR)                   │  ← Állandó lakcím (kötelező)
│     igazolvanyszam (VARCHAR)        │  ← Személyi/útlevél (kötelező)
│     telefon (VARCHAR)               │  ← Telefonszám
│     email (VARCHAR)                 │  ← E-mail cím
│     e_szamla (BOOLEAN)              │  ← E-számla igénylés
│ FK  rogzito_id (INT)                │  → FELHASZNÁLÓ
│     rogzites_datum (DATETIME)       │
│     tipus (ENUM: magan/ceg)         │  ← Partner típusa
├─────────────────────────────────────┤
│ 🆕 mothers_name (VARCHAR)           │  ← Anyja neve
│ 🆕 birth_place (VARCHAR)            │  ← Születési hely
│ 🆕 birth_date (DATE)                │  ← Születési idő
│ 🆕 temporary_address (VARCHAR)      │  ← Tartózkodási hely (ha eltér)
│ 🆕 address_type (ENUM)              │  ← permanent/temporary/both
│ 🆕 is_employee (BOOLEAN)            │  ← Dolgozó-e (kedvezmény)
│ ❌ taj_szam (VARCHAR)               │  ← TÖRÖLVE - nem szükséges
└─────────────────────────────────────┘
```

**Fit-Gap változások (2025-12-07):**
- `taj_szam` mező törölve - nem szükséges
- `mothers_name`, `birth_place`, `birth_date` - személyi adatok
- `temporary_address`, `address_type` - lakcímkártya adatok
- `is_employee` - dolgozói kedvezmény jelző

**Indexek:**
- `idx_partner_tenant_nev`: (tenant_id, nev) - Gyors keresés
- `idx_partner_igazolvany`: (igazolvanyszam) - Egyedi azonosítás

---

### 2. CÉG Entitás

Opcionális entitás céges számlázáshoz. Egy partnerhez több cég is tartozhat.

```
┌─────────────────────────────────────┐
│              CÉG                    │
├─────────────────────────────────────┤
│ PK  ceg_id (INT)                    │
│     tenant_id (UUID) 🏢             │
├─────────────────────────────────────┤
│ FK  partner_id (INT)                │  → PARTNER
│     cegnev (VARCHAR)                │  ← Hivatalos cégnév
│     adoszam (VARCHAR)               │  ← Adószám (8+1+2)
│     cim (VARCHAR)                   │  ← Székhely
│     mukodo (BOOLEAN)                │  ← NAV státusz
│     nav_ellenorzott (DATETIME)      │  ← Utolsó NAV ellenőrzés
├─────────────────────────────────────┤
│ 🆕 vat_zone (ENUM)                  │  ← HU/EU/NON_EU (ÁFA típus)
└─────────────────────────────────────┘
```

**Fit-Gap változás:**
- `vat_zone` - Automatikus ÁFA típus adószám alapján:
  - `HU`: Magyar cég (8+1+2 adószám)
  - `EU`: EU-n belüli (EU adószám formátum)
  - `NON_EU`: Harmadik ország

**Üzleti szabály:**
> A céges számlázás NEM változtatja meg a szerződéses viszonyt!
> A szerződés mindig a magánszemély (PARTNER) nevére szól.

---

### 3. CÉG_MEGHATALMAZOTT Entitás 🆕

Átutalásos fizetésre jogosult személyek nyilvántartása cégenként. **(ADR-013)**

```
┌─────────────────────────────────────┐
│       CÉG_MEGHATALMAZOTT 🆕         │
├─────────────────────────────────────┤
│ PK  meghatalmazott_id (INT)         │
│     tenant_id (UUID) 🏢             │
├─────────────────────────────────────┤
│ FK  ceg_id (INT)                    │  → CÉG
│ FK  partner_id (INT)                │  → PARTNER (a meghatalmazott személy)
│     ervenyesseg_kezdete (DATE)      │  ← Mikor lett felvéve
│     ervenyesseg_vege (DATE)         │  ← Meddig érvényes (NULL = határozatlan)
│     dokumentum_url (VARCHAR)        │  ← Csatolt meghatalmazás
│     aktiv (BOOLEAN)                 │  ← Aktív-e
│     created_at (DATETIME)           │
│     created_by (INT)                │  → FELHASZNÁLÓ
└─────────────────────────────────────┘
```

**ADR-013 döntés:**
- Céges ügyfélnél aki a listán szerepel, az átveheti a gépet kaució visszatérítéssel
- Magánszemélynél mindig meghatalmazás szükséges

---

### 4. BÉRLÉS Entitás

A legfontosabb tranzakciós entitás, amely egy bérlési eseményt reprezentál.

```
┌─────────────────────────────────────┐
│            BÉRLÉS                   │
├─────────────────────────────────────┤
│ PK  berles_id (INT)                 │
│     tenant_id (UUID) 🏢             │
├─────────────────────────────────────┤
│ FK  partner_id (INT)                │  → PARTNER (kötelező)
│ FK  ceg_id (INT) [nullable]         │  → CÉG (opcionális)
│ FK  cikk_id (INT)                   │  → CIKK (bérgép)
│ FK  rogzito_id (INT)                │  → FELHASZNÁLÓ (rendszerben)
│ FK  visszavevo_id (INT)             │  → FELHASZNÁLÓ (rendszerben)
│     kezdes (DATETIME)               │  ← Bérlés kezdete
│     vart_befejezes (DATETIME)       │  ← Tervezett visszahozás
│     befejezes (DATETIME)            │  ← Tényleges visszahozás
│     idotartam (ENUM)                │  ← felnap/1nap/hetvege/0
│     kaucio (DECIMAL)                │  ← Kaució összege
│     megjegyzes (TEXT)               │  ← Szabad megjegyzés
│     statusz (ENUM: aktiv/lezart)    │  ← Bérlés státusza
│     offline_sync (BOOLEAN) 📶       │  ← PWA offline jelzés
├─────────────────────────────────────┤
│ 🆕 kiadta_fizikai_user_id (INT)     │  → FELHASZNÁLÓ (fizikailag átadó)
│ 🆕 visszavette_fizikai_user_id (INT)│  → FELHASZNÁLÓ (fizikailag átvevő)
│ 🆕 kaucio_tipus (ENUM)              │  ← cash/transfer/card
│ 🆕 payment_token (VARCHAR)          │  ← MyPos token (kártyás)
│ 🆕 kaucio_visszafizetes (DECIMAL)   │  ← Visszafizetett összeg
│ 🆕 kaució_kenyelmi_dij (DECIMAL)    │  ← 2% díj (kártyás)
└─────────────────────────────────────┘
```

**Fit-Gap változások:**
- `kiadta_fizikai_user_id`, `visszavette_fizikai_user_id` - Ki adta ki/vette vissza fizikailag
- `kaucio_tipus` - Kaució fizetés módja (MyPos integráció)
- `payment_token` - Kártyás visszatérítéshez
- `kaucio_visszafizetes` - Tényleges visszafizetett összeg (kártyánál: kaució × 0.98)
- `kaució_kenyelmi_dij` - 2% kényelmi díj kártyás fizetésnél

**Időtartam értékek:**
| Kód | Jelentés | Díjszámítás |
|-----|----------|-------------|
| `felnap` | Fél nap (5 óra) | 50% napi díj |
| `1nap` | 1 teljes nap | 100% napi díj |
| `hetvege` 🆕 | Hétvége (szo-hé) | 150% (1.5 nap) |
| `0` | Szállítólevél | Később elszámolva |

---

### 5. BÉRLÉS_TARTOZÉK Entitás 🆕

Kiadott kellékek és tartozékok strukturált nyilvántartása.

```
┌─────────────────────────────────────┐
│        BÉRLÉS_TARTOZÉK 🆕           │
├─────────────────────────────────────┤
│ PK  tartozek_id (INT)               │
├─────────────────────────────────────┤
│ FK  berles_id (INT)                 │  → BÉRLÉS
│     tartozek_nev (VARCHAR)          │  ← Pl. "védőszemüveg", "kesztyű"
│ FK  cikk_id (INT) [nullable]        │  → CIKK (ha készletes)
│     mennyiseg (INT)                 │  ← Kiadott darabszám
│     kiadva (BOOLEAN)                │  ← Kiadáskor bepipálva
│     visszahozva (BOOLEAN)           │  ← Visszavételkor bepipálva
│     megjegyzes (VARCHAR)            │  ← Állapot megjegyzés
│     szamlazando (BOOLEAN)           │  ← Ha nem hozta vissza
│     ar (DECIMAL)                    │  ← Számlázandó ár
└─────────────────────────────────────┘
```

**Használat:**
- Bérléskor: kellékek és fizetős tartozékok pipálása
- Visszavételkor: visszahozva checkbox
- Ha nem hozta vissza: automatikusan számlázásra kerül

---

### 6. KAUCIÓ_JEGYZŐKÖNYV Entitás 🆕

Benntartott kaució dokumentálása kár esetén. **(ADR-013)**

```
┌─────────────────────────────────────┐
│      KAUCIÓ_JEGYZŐKÖNYV 🆕          │
├─────────────────────────────────────┤
│ PK  jegyzokonyv_id (INT)            │
│     tenant_id (UUID) 🏢             │
├─────────────────────────────────────┤
│ FK  berles_id (INT)                 │  → BÉRLÉS
│     kar_leiras (TEXT)               │  ← Kár részletes leírása
│     becsult_koltseg (DECIMAL)       │  ← Becsült javítási költség
│     benntartott_kaucio (DECIMAL)    │  ← Benntartott összeg
│     fotok_url (JSONB)               │  ← Fotó dokumentáció
│     kesz_datum (DATETIME)           │  ← Jegyzőkönyv dátuma
│ FK  keszitette_user_id (INT)        │  → FELHASZNÁLÓ
│     partner_alairas (BOOLEAN)       │  ← Ügyfél aláírta-e
│     szamla_kiallitva (BOOLEAN)      │  ← Számla kiállítva-e
│ FK  szamla_id (INT)                 │  → SZÁMLA [nullable]
└─────────────────────────────────────┘
```

---

### 7. CIKK Entitás

A bérlésre kínált gépek (bérgépek) nyilvántartása.

```
┌─────────────────────────────────────┐
│              CIKK                   │
├─────────────────────────────────────┤
│ PK  cikk_id (INT)                   │
│     tenant_id (UUID) 🏢             │
├─────────────────────────────────────┤
│ FK  kategoria_id (INT)              │  → KATEGÓRIA
│     megnevezes (VARCHAR)            │  ← Gép megnevezése
│     gyarto (VARCHAR)                │  ← Gyártó neve
│     tipus (VARCHAR)                 │  ← Típusjelzés
│     vonalkod (VARCHAR)              │  ← Vonalkód
│     sorozatszam (VARCHAR)           │  ← Sorozatszám
│     napi_dij (DECIMAL)              │  ← Bérlési díj/nap
│     kaucio_alap (DECIMAL)           │  ← Alapértelmezett kaució
│     statusz (ENUM)                  │  ← bent/kint/szerviz
│     allapot (VARCHAR)               │  ← Műszaki állapot
│     megjegyzes (TEXT)               │
├─────────────────────────────────────┤
│ 🆕 pricing_unit (ENUM)              │  ← hour/day/weekend
│ 🆕 weekend_multiplier (DECIMAL)     │  ← 1.5 (hétvégére)
└─────────────────────────────────────┘
```

---

### 8. FELHASZNÁLÓ Entitás

Rendszer felhasználók (dolgozók) nyilvántartása.

```
┌─────────────────────────────────────┐
│          FELHASZNÁLÓ                │
├─────────────────────────────────────┤
│ PK  felhasznalo_id (INT)            │
│     tenant_id (UUID) 🏢             │
├─────────────────────────────────────┤
│     felhasznalonev (VARCHAR)        │  ← Bejelentkezési név
│     jelszo_hash (VARCHAR)           │  ← Titkosított jelszó
│     nev (VARCHAR)                   │  ← Teljes név
│ 🆕 pin_kod (VARCHAR)                │  ← 4 számjegyű PIN (ADR-013)
│     szerep (ENUM: RBAC) 🔐          │  ← Jogosultsági szint
│     aktiv (BOOLEAN)                 │  ← Aktív felhasználó
└─────────────────────────────────────┘
```

**RBAC Szintek (ADR-013):**
| Szint | Név | Hozzáférés | PIN szükséges? |
|-------|-----|------------|----------------|
| 0 | Alap (Ügyféltér) | Bérlés, Szerviz felvétel, Eladás | NEM |
| 1 | Emelt | Bevételezés, Statisztikák, Ügyfél részletek | IGEN (4 számjegy) |
| 2 | Admin | Ár módosítás, Pénzügy, Riportok, Beállítások | IGEN (4 számjegy + jogosultság) |

---

## Kapcsolatok (Relationships)

### Kapcsolati Diagram

```
PARTNER ─────────< BÉRLÉS ─────────< BÉRLÉS_TARTOZÉK
   │                  │
   └──< CÉG ──────────┘
   │     │
   │     └──< CÉG_MEGHATALMAZOTT
   │
   └──────< PARTNER (meghatalmazott)

BÉRLÉS ────────────< KAUCIÓ_JEGYZŐKÖNYV

FELHASZNÁLÓ ─────< BÉRLÉS (rogzito)
       │
       └─────────< BÉRLÉS (visszavevo)
       │
       └─────────< BÉRLÉS (kiadta_fizikai) 🆕
       │
       └─────────< BÉRLÉS (visszavette_fizikai) 🆕

CIKK ────────────< BÉRLÉS
```

### Kapcsolat Részletek

| Kapcsolat | Típus | Leírás |
|-----------|-------|--------|
| PARTNER → BÉRLÉS | 1:N | Egy partner több bérlést indíthat |
| PARTNER → CÉG | 1:N | Egy partnerhez több cég tartozhat |
| CÉG → BÉRLÉS | 1:N | Egy cég több bérlés számlázottja |
| CÉG → CÉG_MEGHATALMAZOTT | 1:N | Egy céghez több meghatalmazott |
| PARTNER → CÉG_MEGHATALMAZOTT | 1:N | Egy partner több cégnél lehet meghatalmazott |
| BÉRLÉS → BÉRLÉS_TARTOZÉK | 1:N | Egy bérléshez több tartozék |
| BÉRLÉS → KAUCIÓ_JEGYZŐKÖNYV | 1:1 | Egy bérléshez max egy jegyzőkönyv |
| CIKK → BÉRLÉS | 1:N | Egy gép többször kiadható |
| FELHASZNÁLÓ → BÉRLÉS | 1:N | Rögzítő, visszavevő, fizikai kiadó/átvevő |

---

## Multi-tenant Architektúra (ADR-014)

```
┌─────────────────────────────────────────────────────┐
│             SÉMA STRUKTÚRA (ADR-014)                │
├─────────────────────────────────────────────────────┤
│                                                     │
│  public séma (KÖZÖS):                               │
│  ├─ CORE: tenants, users, roles, permissions        │
│  ├─ PARTNER: partner, ceg, ceg_meghatalmazott      │
│  └─ KÉSZLET: cikk, cikkcsoport, beszallito         │
│                                                     │
│  tenant_X séma (BOLT-SPECIFIKUS):                   │
│  ├─ BÉRLÉS: berles, berles_tartozek, kaucio_jkv   │
│  ├─ SZERVIZ: munkalap, munkalap_tetel              │
│  └─ ÉRTÉKESÍTÉS: keszlet, eladas, szamla           │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## PWA Offline Támogatás (ADR-002)

```
┌─────────────────────────────────────────────────────┐
│                  offline_sync                       │
├─────────────────────────────────────────────────────┤
│  • BÉRLÉS, BÉRLÉS_TARTOZÉK táblákban jelzés        │
│  • Offline módban rögzített tranzakciók             │
│  • Szinkronizáláskor automatikusan false lesz       │
│  • Konfliktus kezelés: timestamp alapú              │
└─────────────────────────────────────────────────────┘
```

---

## Adatbázis Indexek

```sql
-- Partner keresés
CREATE INDEX idx_partner_tenant_nev ON PARTNER(tenant_id, nev);
CREATE INDEX idx_partner_igazolvany ON PARTNER(igazolvanyszam);
CREATE INDEX idx_partner_employee ON PARTNER(tenant_id, is_employee);

-- Bérlés keresés
CREATE INDEX idx_berles_tenant_statusz ON BERLES(tenant_id, statusz);
CREATE INDEX idx_berles_partner ON BERLES(partner_id);
CREATE INDEX idx_berles_cikk ON BERLES(cikk_id);
CREATE INDEX idx_berles_kaucio_tipus ON BERLES(kaucio_tipus);

-- Cikk keresés
CREATE INDEX idx_cikk_tenant_statusz ON CIKK(tenant_id, statusz);
CREATE INDEX idx_cikk_vonalkod ON CIKK(vonalkod);

-- Meghatalmazott keresés
CREATE INDEX idx_meghatalmazott_ceg ON CEG_MEGHATALMAZOTT(ceg_id, aktiv);
CREATE INDEX idx_meghatalmazott_partner ON CEG_MEGHATALMAZOTT(partner_id);

-- Tartozék keresés
CREATE INDEX idx_tartozek_berles ON BERLES_TARTOZEK(berles_id);
```

---

## Jelmagyarázat

| Jelölés | Jelentés |
|---------|----------|
| 🏢 | Multi-tenant mező (ADR-001) |
| 📶 | Offline sync mező (ADR-002) |
| 🔐 | RBAC szerepkör (ADR-003) |
| 🆕 | Új mező (Fit-Gap 2025-12-07) |
| ❌ | Törölt mező |
| PK | Primary Key (elsődleges kulcs) |
| FK | Foreign Key (idegen kulcs) |

---

## Változásnapló

| Verzió | Dátum | Változás |
|--------|-------|----------|
| v1.0 | 2024-11 | Eredeti verzió |
| v2.0 | 2024-12 | Multi-tenant (ADR-001), PWA (ADR-002) |
| v3.0 | 2025-12-11 | Fit-Gap frissítés, ADR-013/014 döntések |

---

## Kapcsolódó Dokumentumok

| Dokumentum | Leírás |
|------------|--------|
| [ADR-013-fit-gap-dontesek.md](../../architecture/ADR-013-fit-gap-dontesek.md) | Kaució és meghatalmazás döntések |
| [ADR-014-modular-architektura-vegleges.md](../../architecture/ADR-014-modular-architektura-vegleges.md) | Séma struktúra |
| [FIT-GAP-ANALYSIS.md](../FIT-GAP-ANALYSIS.md) | Teljes Fit-Gap elemzés |
| [01-ugyfelfelvitel-folyamat.md](01-ugyfelfelvitel-folyamat.md) | Bérlési folyamat |
