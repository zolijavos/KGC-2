# 5. Automatizált Elszámolás ERD

## Diagram Alapinformációk

| Tulajdonság | Érték |
|-------------|-------|
| **Fájlnév** | `5-automatizalt-elszamolas-erd-2025-12-12.excalidraw` |
| **Típus** | ERD (Entity-Relationship Diagram) |
| **Modul** | Pénzügy |
| **Verzió** | v3.0 |
| **Dátum** | 2025-12-12 |
| **Státusz** | ÚJ |
| **Forrás** | fit-gap-analysis-2025-12-12.md |

---

## Részletes Leírás

Ez az ERD diagram az **automatizált banki/futár elszámolási rendszer** adatmodelljét mutatja be. Az új entitások lehetővé teszik a külső pénzügyi tranzakciók automatikus párosítását a nyitott számlákkal.

---

## Új Entitás: BANK_TRANZAKCIÓ

Külső rendszerekből beérkező pénzmozgások nyilvántartása.

```
┌─────────────────────────────────────────────────────────────┐
│                    BANK_TRANZAKCIÓ                          │
│               (Financial Transaction)                        │
├─────────────────────────────────────────────────────────────┤
│ PK  tranzakcio_id      INT           Egyedi azonosító       │
│     tenant_id          UUID          Multi-tenant azonosító │
├─────────────────────────────────────────────────────────────┤
│     kulso_azonosito    VARCHAR(100)  Bank/futár ref. szám   │
│     osszeg             DECIMAL(12,2) Beérkezett összeg      │
│     penznem            ENUM          HUF/EUR                │
│     datum              DATE          Tranzakció dátuma      │
│     erkezes_datum      DATETIME      Rendszerbe érkezés     │
├─────────────────────────────────────────────────────────────┤
│     partner_nev        VARCHAR(200)  Befizető neve          │
│     partner_szamlaszam VARCHAR(50)   Befizető bankszámlája  │
│     kozlemeny          TEXT          Közlemény (kulcs!)     │
├─────────────────────────────────────────────────────────────┤
│ FK  forras_id          INT           → KÜLSŐ_PARTNER_API    │
│     forras_tipus       ENUM          Bank/Futár/POS/Egyéb   │
│     import_batch_id    VARCHAR(50)   Import köteg azonosító │
├─────────────────────────────────────────────────────────────┤
│     statusz            ENUM          Párosítatlan/Párosított│
│                                      /Eltérés/Kézi/Elutasított│
│ FK  parositas_szamla   INT           → SZÁMLA (ha párosított)│
│     parositas_datum    DATETIME      Párosítás időpontja    │
│     parositas_mod      ENUM          Auto/Kézi              │
│     parositas_score    INT           Egyezési pontszám (%)  │
│     elutasitas_ok      TEXT          Elutasítás indoklása   │
├─────────────────────────────────────────────────────────────┤
│     created_at         DATETIME      Létrehozás             │
│     updated_at         DATETIME      Módosítás              │
│ FK  kezelo_id          INT           → FELHASZNÁLÓ          │
└─────────────────────────────────────────────────────────────┘
```

### Mezők Részletezése

| Mező | Típus | Kötelező | Leírás |
|------|-------|----------|--------|
| `tranzakcio_id` | INT | PK | Auto-increment azonosító |
| `tenant_id` | UUID | Igen | Franchise partner azonosító |
| `kulso_azonosito` | VARCHAR(100) | Nem | Bank vagy futár referencia szám |
| `osszeg` | DECIMAL(12,2) | Igen | Beérkezett összeg |
| `penznem` | ENUM | Igen | HUF vagy EUR |
| `datum` | DATE | Igen | Banki/futár tranzakció dátuma |
| `partner_nev` | VARCHAR(200) | Nem | Ki utalta (bankból) |
| `kozlemeny` | TEXT | Nem | Közlemény - párosítás kulcs! |
| `forras_tipus` | ENUM | Igen | Bank/Futár/POS/Egyéb |
| `statusz` | ENUM | Igen | Feldolgozási állapot |
| `parositas_score` | INT | Nem | 0-100% egyezési pontszám |

### Státusz Értékek

| Státusz | Jelentés | Következő lépés |
|---------|----------|-----------------|
| `PAROSITATLAN` | Beérkezett, feldolgozásra vár | Automatikus párosítás |
| `PAROSÍTOTT` | Sikeresen hozzárendelve számlához | Lezárt |
| `ELTERES` | Részben egyezik (összeg/partner) | Kézi ellenőrzés |
| `KEZI` | Manuálisan párosítva | Lezárt |
| `ELUTASITOTT` | Nem kapcsolható számlához | Költségként könyvelendő |

### Forrás Típusok

| Típus | Leírás | Példa |
|-------|--------|-------|
| `BANK` | Banki átutalás | OTP, K&H, Erste kivonat |
| `FUTAR` | Futár utánvét | GLS, DPD, MPL elszámolás |
| `POS` | Kártyaterminál | MyPos elszámolás |
| `EGYEB` | Egyéb befizetés | Manuális rögzítés |

---

## Új Entitás: KÜLSŐ_PARTNER_API

Bankok és futárcégek integrációs adatai.

```
┌─────────────────────────────────────────────────────────────┐
│                   KÜLSŐ_PARTNER_API                         │
│                 (External Partner API)                       │
├─────────────────────────────────────────────────────────────┤
│ PK  partner_api_id     INT           Egyedi azonosító       │
│     tenant_id          UUID          Multi-tenant azonosító │
├─────────────────────────────────────────────────────────────┤
│     nev                VARCHAR(100)  Partner neve           │
│     kod                VARCHAR(20)   Rövid kód              │
│     tipus              ENUM          Bank/Futár/POS         │
├─────────────────────────────────────────────────────────────┤
│     api_url            VARCHAR(500)  API végpont            │
│     api_key            VARCHAR(500)  API kulcs (titkosított)│
│     api_secret         VARCHAR(500)  API titok (titkosított)│
│     auth_tipus         ENUM          Basic/OAuth/ApiKey     │
├─────────────────────────────────────────────────────────────┤
│     import_formatum    ENUM          CSV/XML/JSON/API       │
│     export_formatum    ENUM          CSV/XML/JSON           │
│     mezomapping_json   JSONB         Mező leképezés         │
├─────────────────────────────────────────────────────────────┤
│     aktiv              BOOLEAN       Használható-e          │
│     utolso_import      DATETIME      Utolsó sikeres import  │
│     created_at         DATETIME      Létrehozás             │
│     updated_at         DATETIME      Módosítás              │
└─────────────────────────────────────────────────────────────┘
```

### Előre Definiált Partnerek

| Kód | Név | Típus | Formátum |
|-----|-----|-------|----------|
| `OTP` | OTP Bank | Bank | CSV |
| `KH` | K&H Bank | Bank | CSV |
| `ERSTE` | Erste Bank | Bank | CSV |
| `GLS` | GLS Hungary | Futár | CSV/API |
| `DPD` | DPD Hungary | Futár | CSV/API |
| `MPL` | Magyar Posta | Futár | CSV |
| `MYPOS` | MyPos | POS | API |

### Mező Mapping Példa (JSON)

```json
{
  "partner": "OTP",
  "mapping": {
    "osszeg": "Összeg",
    "datum": "Könyvelés dátuma",
    "partner_nev": "Partner neve",
    "partner_szamlaszam": "Ellenszámla",
    "kozlemeny": "Közlemény",
    "kulso_azonosito": "Tranzakció azonosító"
  },
  "delimiter": ";",
  "encoding": "UTF-8",
  "skip_rows": 1
}
```

---

## Új Entitás: PÁROSÍTÁS_LOG

Párosítási kísérletek naplózása (audit).

```
┌─────────────────────────────────────────────────────────────┐
│                     PÁROSÍTÁS_LOG                           │
│                   (Matching Log)                             │
├─────────────────────────────────────────────────────────────┤
│ PK  log_id             INT           Egyedi azonosító       │
│     tenant_id          UUID          Multi-tenant azonosító │
├─────────────────────────────────────────────────────────────┤
│ FK  tranzakcio_id      INT           → BANK_TRANZAKCIÓ      │
│ FK  szamla_id          INT           → SZÁMLA               │
│     kiserlet_datum     DATETIME      Párosítási kísérlet    │
├─────────────────────────────────────────────────────────────┤
│     osszeg_match       BOOLEAN       Összeg egyezik?        │
│     kozlemeny_match    BOOLEAN       Számlaszám a közl.-ben?│
│     partner_match      BOOLEAN       Partner név egyezik?   │
│     datum_match        BOOLEAN       Dátum közelségben?     │
│     score              INT           Összes pontszám (0-100)│
├─────────────────────────────────────────────────────────────┤
│     eredmeny           ENUM          Elfogadva/Elutasítva   │
│     mod                ENUM          Auto/Kézi              │
│ FK  kezelo_id          INT           → FELHASZNÁLÓ (ha kézi)│
│     megjegyzes         TEXT          Kezelő megjegyzése     │
└─────────────────────────────────────────────────────────────┘
```

### Pontszám Számítás

| Kritérium | Súly | Leírás |
|-----------|------|--------|
| `osszeg_match` | 40 pont | Összeg pontosan egyezik |
| `kozlemeny_match` | 35 pont | Számlaszám megtalálható a közleményben |
| `partner_match` | 15 pont | Partner név hasonlósági algoritmus |
| `datum_match` | 10 pont | Dátum ±7 napon belül |
| **Összesen** | **100 pont** | |

### Elfogadási Küszöb

| Score | Eredmény |
|-------|----------|
| 90-100 | Automatikus párosítás |
| 70-89 | Javaslat, kézi megerősítés |
| 50-69 | Eltérés jelzés |
| 0-49 | Párosítatlan marad |

---

## Kapcsolati Diagram

```
┌─────────────────┐         ┌─────────────────┐
│ KÜLSŐ_PARTNER   │         │     SZÁMLA      │
│     _API        │         │   (meglévő)     │
└────────┬────────┘         └────────┬────────┘
         │ 1                         │ 1
         │                           │
         │ N                         │ N
┌────────┴────────┐         ┌────────┴────────┐
│ BANK_TRANZAKCIÓ │─────────│  PÁROSÍTÁS_LOG  │
│  (tranzakciók)  │    N:N  │    (audit)      │
└────────┬────────┘         └─────────────────┘
         │ 1
         │
         │ N
┌────────┴────────┐
│    PARTNER      │
│   (meglévő)     │
└─────────────────┘
```

### Kapcsolatok

| Kapcsolat | Típus | Kardinalitás |
|-----------|-------|--------------|
| KÜLSŐ_PARTNER_API → BANK_TRANZAKCIÓ | 1:N | Egy forrásból több tranzakció |
| BANK_TRANZAKCIÓ → SZÁMLA | N:1 | Több tranzakció egy számlához (részletfizetés) |
| BANK_TRANZAKCIÓ ↔ PÁROSÍTÁS_LOG | 1:N | Egy tranzakcióhoz több kísérlet |
| SZÁMLA ↔ PÁROSÍTÁS_LOG | 1:N | Egy számlához több kísérlet |

---

## Indexek

```sql
-- Gyors keresés státusz alapján
CREATE INDEX idx_bank_trx_statusz
    ON BANK_TRANZAKCIO(tenant_id, statusz);

-- Közlemény keresés (full-text)
CREATE INDEX idx_bank_trx_kozlemeny
    ON BANK_TRANZAKCIO USING gin(to_tsvector('hungarian', kozlemeny));

-- Dátum szerinti keresés
CREATE INDEX idx_bank_trx_datum
    ON BANK_TRANZAKCIO(datum, tenant_id);

-- Összeg szerinti keresés
CREATE INDEX idx_bank_trx_osszeg
    ON BANK_TRANZAKCIO(osszeg, statusz);

-- Párosítás log
CREATE INDEX idx_parositas_log_trx
    ON PAROSITAS_LOG(tranzakcio_id);
```

---

## Üzleti Szabályok

1. **Egyedi tranzakció:** `kulso_azonosito + forras_id` kombináció egyedi
2. **Automatikus párosítás:** Score >= 90 esetén automatikus
3. **Részletfizetés:** Egy számlához több tranzakció is tartozhat
4. **Audit kötelező:** Minden párosítási kísérlet naplózandó
5. **Elutasítás:** Párosítatlan tranzakció költségként könyvelhető

---

## Kapcsolódó Dokumentumok

- [05-automatizalt-elszamolas-folyamat-2025-12-12.md](05-automatizalt-elszamolas-folyamat-2025-12-12.md) - P5 folyamat
- [05-penzugy-folyamat.md](05-penzugy-folyamat.md) - Meglévő pénzügyi folyamatok
- [fit-gap-analysis-2025-12-12.md](../fit-gap-analysis-2025-12-12.md) - Követelmény forrás
