# 1. Ügyfél Felvétel és Bérlés - ERD (Entitás-Kapcsolat Diagram)

## Diagram Alapinformációk

| Tulajdonság | Érték |
|-------------|-------|
| **Fájlnév** | `1-ugyfelfelvitel-erd.excalidraw` |
| **Típus** | ERD (Entity-Relationship Diagram) |
| **Modul** | Partner & Bérlés |
| **Verzió** | v2.0 (Multi-tenant) |
| **Kategória** | 1. rész - Ügyfél Felvétel és Bérlés |

---

## Részletes Leírás

Ez az ERD diagram a KGC ERP rendszer **adatmodelljét** mutatja be az ügyfélkezelés és bérlés modulhoz. A v2.0 verzió tartalmazza a **multi-tenant** (ADR-001) és **PWA offline** (ADR-002) támogatást.

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
│     cim (VARCHAR)                   │  ← Lakcím (kötelező)
│     igazolvanyszam (VARCHAR)        │  ← Személyi/útlevél (kötelező)
│     taj_szam (VARCHAR)              │  ← TAJ szám (opcionális)
│     telefon (VARCHAR)               │  ← Telefonszám
│     email (VARCHAR)                 │  ← E-mail cím
│     e_szamla (BOOLEAN)              │  ← E-számla igénylés
│ FK  rogzito_id (INT)                │  → FELHASZNÁLÓ
│     rogzites_datum (DATETIME)       │
│     tipus (ENUM: magan/ceg)         │  ← Partner típusa
└─────────────────────────────────────┘
```

**Mezők magyarázata:**
- `partner_id`: Egyedi azonosító (auto-increment)
- `tenant_id`: Franchise partner azonosító (multi-tenant elkülönítés)
- `nev`: Az ügyfél teljes neve
- `cim`: Lakcím vagy székhely
- `igazolvanyszam`: Személyazonosító okmány száma
- `taj_szam`: TAJ szám (opcionális biztosítási célokra)
- `telefon`: Kapcsolattartási telefonszám
- `email`: E-mail cím (e-számla küldéshez kötelező)
- `e_szamla`: Elektronikus számla igénylése
- `rogzito_id`: Ki rögzítette a partnert
- `rogzites_datum`: Rögzítés időpontja
- `tipus`: Magánszemély vagy céges partner

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
└─────────────────────────────────────┘
```

**Mezők magyarázata:**
- `ceg_id`: Egyedi azonosító
- `partner_id`: Kapcsolt partner (FK)
- `cegnev`: A cég hivatalos neve (NAV-ból)
- `adoszam`: 11 karakteres magyar adószám
- `cim`: Cég székhelye
- `mukodo`: NAV szerinti működési státusz
- `nav_ellenorzott`: Mikor volt utoljára NAV-nál ellenőrizve

**Üzleti szabály:**
> A céges számlázás NEM változtatja meg a szerződéses viszonyt!
> A szerződés mindig a magánszemély (PARTNER) nevére szól.

---

### 3. BÉRLÉS Entitás

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
│ FK  rogzito_id (INT)                │  → FELHASZNÁLÓ (ki adta ki)
│ FK  visszavevo_id (INT)             │  → FELHASZNÁLÓ (ki vette vissza)
│     kezdes (DATETIME)               │  ← Bérlés kezdete
│     vart_befejezes (DATETIME)       │  ← Tervezett visszahozás
│     befejezes (DATETIME)            │  ← Tényleges visszahozás
│     idotartam (ENUM)                │  ← 3ora/felnap/1nap/0
│     kaucio (DECIMAL)                │  ← Kaució összege
│     megjegyzes (TEXT)               │  ← Szabad megjegyzés
│     statusz (ENUM: aktiv/lezart)    │  ← Bérlés státusza
│     offline_sync (BOOLEAN) 📶       │  ← PWA offline jelzés
└─────────────────────────────────────┘
```

**Időtartam értékek:**
| Kód | Jelentés | Díjszámítás |
|-----|----------|-------------|
| `3ora` | 3 óra | NEM HASZNÁLT |
| `felnap` | Fél nap (5 óra) | 50% napi díj |
| `1nap` | 1 teljes nap | 100% napi díj |
| `0` | Szállítólevél | Később elszámolva |

**Státusz értékek:**
| Státusz | Jelentés |
|---------|----------|
| `aktiv` | Gép kint van az ügyfélnél |
| `lezart` | Gép visszahozva |

**Offline sync jelzés:**
- `true`: Offline módban rögzített (szinkronizálásra vár)
- `false`: Online rögzített

---

### 4. CIKK Entitás

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
└─────────────────────────────────────┘
```

**Státusz értékek:**
| Státusz | Jelentés |
|---------|----------|
| `bent` | Boltban, kiadható |
| `kint` | Kiadva ügyfélnek |
| `szerviz` | Szervizben, nem kiadható |

---

### 5. FELHASZNÁLÓ Entitás

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
│     kod (VARCHAR)                   │  ← Gyors azonosító kód
│     szerep (ENUM: RBAC) 🔐          │  ← Jogosultsági szint
│     aktiv (BOOLEAN)                 │  ← Aktív felhasználó
└─────────────────────────────────────┘
```

**RBAC Szerepkörök (6 szint):**
| Szint | Szerepkör | Jogosultságok |
|-------|-----------|---------------|
| 1 | SUPER_ADMIN | Teljes rendszer hozzáférés |
| 2 | TENANT_ADMIN | Franchise partner admin |
| 3 | BRANCH_MANAGER | Telephely vezető |
| 4 | SENIOR_OPERATOR | Tapasztalt kezelő |
| 5 | OPERATOR | Normál kezelő |
| 6 | VIEWER | Csak olvasás |

---

## Kapcsolatok (Relationships)

### 1:N Kapcsolatok

```
PARTNER ─────────< BÉRLÉS
   │                  │
   └──< CÉG ──────────┘
           (opcionális)

FELHASZNÁLÓ ─────< BÉRLÉS (rogzito)
       │
       └─────────< BÉRLÉS (visszavevo)

CIKK ────────────< BÉRLÉS
```

### Kapcsolat Részletek

| Kapcsolat | Típus | Leírás |
|-----------|-------|--------|
| PARTNER → BÉRLÉS | 1:N | Egy partner több bérlést indíthat |
| PARTNER → CÉG | 1:N | Egy partnerhez több cég tartozhat |
| CÉG → BÉRLÉS | 1:N | Egy cég több bérlés számlázottja |
| CIKK → BÉRLÉS | 1:N | Egy gép többször kiadható |
| FELHASZNÁLÓ → BÉRLÉS | 1:N | Rögzítő és visszavevő |

---

## Multi-tenant Architektúra (ADR-001)

```
┌─────────────────────────────────────────────────────┐
│                    tenant_id                        │
├─────────────────────────────────────────────────────┤
│  • Minden táblában jelen van                        │
│  • UUID formátum (36 karakter)                      │
│  • Franchise partner azonosító                      │
│  • Adatok elkülönítése tenant szinten               │
│  • Composite indexek (tenant_id + pk)               │
└─────────────────────────────────────────────────────┘
```

---

## PWA Offline Támogatás (ADR-002)

```
┌─────────────────────────────────────────────────────┐
│                  offline_sync                       │
├─────────────────────────────────────────────────────┤
│  • BÉRLÉS táblában jelzés                           │
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

-- Bérlés keresés
CREATE INDEX idx_berles_tenant_statusz ON BERLES(tenant_id, statusz);
CREATE INDEX idx_berles_partner ON BERLES(partner_id);
CREATE INDEX idx_berles_cikk ON BERLES(cikk_id);

-- Cikk keresés
CREATE INDEX idx_cikk_tenant_statusz ON CIKK(tenant_id, statusz);
CREATE INDEX idx_cikk_vonalkod ON CIKK(vonalkod);
```

---

## Jelmagyarázat

| Jelölés | Jelentés |
|---------|----------|
| 🏢 | Multi-tenant mező (ADR-001) |
| 📶 | Offline sync mező (ADR-002) |
| 🔐 | RBAC szerepkör (ADR-003) |
| PK | Primary Key (elsődleges kulcs) |
| FK | Foreign Key (idegen kulcs) |

---

## Technikai Megjegyzések

- Az ERD v2.0-ra frissítve a multi-tenant támogatással
- Minden entitás tartalmazza a `tenant_id` mezőt
- A BÉRLÉS entitás tartalmazza az `offline_sync` jelzőt
- RBAC 6 szintű jogosultsági rendszer implementálva
