# Fizetési Fegyelem Döntési Fa

## Diagram Információk

| Tulajdonság | Érték |
|-------------|-------|
| **Fájlnév** | 7-fizetesi-fegyelem.excalidraw |
| **Típus** | Döntési Fa (Decision Tree) |
| **Kategória** | 7. Új Funkciók |
| **Modul** | Pénzügyi Kontroll |
| **Verzió** | KGC ERP v2 |

---

## Áttekintés

A fizetési fegyelem döntési fa szabályozza, hogy egy ügyfél számára kiállítható-e új számla, figyelembe véve a lejárt tartozásokat, a cég státuszát és a vezetői feloldási lehetőségeket. A rendszer biztosítja a követelések kezelését és a kockázatcsökkentést.

---

## Döntési Folyamat

### Teljes Döntési Fa

```
                         ┌─────────────────┐
                         │ Számla kiállítás│
                         │    indítása     │
                         └────────┬────────┘
                                  │
                                  ▼
                         ┌─────────────────┐
                         │ Ügyfél adatok   │
                         │  lekérdezése    │
                         └────────┬────────┘
                                  │
                                  ▼
                    ┌─────────────────────────┐
                    │   Van LEJÁRT tartozás?  │
                    └────────────┬────────────┘
                          ┌──────┴──────┐
                          │             │
                        IGEN          NEM
                          │             │
                          ▼             ▼
               ┌──────────────────┐    │
               │  🚫 BLOKKOLÁS!   │    │
               │  "Ügyfélnek      │    │
               │  {összeg} Ft     │    │
               │  lejárt tartozás"│    │
               └────────┬─────────┘    │
                        │              │
                        ▼              │
               ┌─────────────────┐     │
               │ Vezetői feloldás│     │
               │    kérés?       │     │
               └────────┬────────┘     │
                 ┌──────┴──────┐       │
                 │             │       │
               IGEN          NEM       │
                 │             │       │
                 ▼             ▼       │
          ┌──────────┐  ┌──────────┐   │
          │ Feloldás │  │ Művelet  │   │
          │ naplózás │  │megtagadva│   │
          └────┬─────┘  └──────────┘   │
               │                       │
               └───────────────────────┼──────────────────┐
                                       │                  │
                                       ▼                  │
                          ┌─────────────────────────┐     │
                          │ Cég nevére számlázás?   │     │
                          └────────────┬────────────┘     │
                                ┌──────┴──────┐           │
                                │             │           │
                              IGEN        NEM (magán)     │
                                │             │           │
                                ▼             │           │
                       ┌─────────────────┐    │           │
                       │ NAV Adószám     │    │           │
                       │ ellenőrzés      │    │           │
                       │ (Online API)    │    │           │
                       └────────┬────────┘    │           │
                                │             │           │
                                ▼             │           │
                       ┌─────────────────┐    │           │
                       │ Cég működik?    │    │           │
                       └────────┬────────┘    │           │
                         ┌──────┴──────┐      │           │
                         │             │      │           │
                       IGEN          NEM      │           │
                         │             │      │           │
                         │             ▼      │           │
                         │    ┌──────────────┐│           │
                         │    │⚠️FIGYELMEZTET││           │
                         │    │"Cég nem      ││           │
                         │    │működik!"     ││           │
                         │    └──────────────┘│           │
                         │                    │           │
                         └──────────┬─────────┘           │
                                    │                     │
                                    ▼                     │
                           ┌─────────────────┐            │
                           │ ✅ Számlázás    │◄───────────┘
                           │   engedélyezve  │
                           └────────┬────────┘
                                    │
                                    ▼
                              ┌──────────┐
                              │ Számla   │
                              │ kiállítás│
                              └──────────┘
```

---

## Döntési Pontok Részletezése

### D1: Lejárt Tartozás Ellenőrzés

| Kérdés | Van lejárt tartozás? |
|--------|---------------------|
| **Ellenőrzés** | `SELECT SUM(tartozas) FROM szamla WHERE ugyfél_id = ? AND lejarat < NOW() AND fizetve = FALSE` |
| **IGEN ág** | Blokkolás + vezetői feloldás lehetőség |
| **NEM ág** | Tovább a cég ellenőrzésre |

**Fontos szabály:**
```
⚠️ Csak UTALÁSOS ügyfelekre vonatkozik!
   Készpénzes vevőknél nincs blokk.
```

### D2: Vezetői Feloldás

| Kérdés | Vezető feloldja a blokkolást? |
|--------|-------------------------------|
| **Jogosultság** | ADMIN vagy MANAGER szerepkör |
| **IGEN ág** | Feloldás naplózása + folytatás |
| **NEM ág** | Művelet megtagadva |

**Naplózandó adatok:**
```
┌────────────────────────────────────────┐
│         FELOLDÁS NAPLÓ                  │
├────────────────────────────────────────┤
│  Ki:     {felhasználó_név}             │
│  Mikor:  {timestamp}                   │
│  Miért:  {indoklás - KÖTELEZŐ}         │
│  Ügyfél: {ügyfél_id}                   │
│  Összeg: {tartozás_összeg}             │
└────────────────────────────────────────┘
```

### D3: Cég Nevére Számlázás

| Kérdés | Cég nevére kell a számla? |
|--------|--------------------------|
| **IGEN ág** | NAV adószám ellenőrzés |
| **NEM ág** | Magánszemélyre → folytatás |

### D4: NAV Ellenőrzés

| Kérdés | Működik a cég? |
|--------|---------------|
| **API** | NAV Online Számla API |
| **Ellenőrzés** | Adószám érvényesség, cég státusz |
| **IGEN ág** | Számla kiállítás engedélyezve |
| **NEM ág** | Figyelmeztetés, magánszemélyre állítás javaslat |

---

## Blokkolási Logika

### Mikor Blokkol a Rendszer?

```
┌─────────────────────────────────────────────────────────────────┐
│                    BLOKKOLÁSI FELTÉTELEK                         │
├─────────────────────────────────────────────────────────────────┤
│  ✅ Blokkol:                                                     │
│     • Lejárt tartozás > 0 Ft                                    │
│     • Utalásos fizetési mód beállítva                           │
│     • Nincs aktív részletfizetési megállapodás                  │
│                                                                  │
│  ❌ NEM blokkol:                                                 │
│     • Készpénzes ügyfél (nincs behajtási kockázat)             │
│     • Aktív részletfizetési megállapodás van                    │
│     • Vezetői feloldás történt (max 24 órára)                   │
└─────────────────────────────────────────────────────────────────┘
```

### Blokkolás Üzenet

```
┌────────────────────────────────────────────────────────────────┐
│                      🚫 BLOKKOLÁS                               │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Az ügyfélnek {összeg} Ft lejárt tartozása van!                │
│                                                                 │
│  Lejárt számlák:                                               │
│  ─────────────────────────────────────────                     │
│  • SZ-2024-0123  |  45.000 Ft  |  15 napja lejárt             │
│  • SZ-2024-0156  |  28.500 Ft  |   8 napja lejárt             │
│  ─────────────────────────────────────────                     │
│  Összesen:         73.500 Ft                                   │
│                                                                 │
│  ⚠️ Számla NEM állítható ki!                                   │
│                                                                 │
│  [ Vezetői Feloldás Kérése ]    [ Mégse ]                      │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

---

## NAV Ellenőrzés Részletei

### API Hívás

```javascript
// NAV Online Számla API - Adószám ellenőrzés
async function checkCompanyStatus(taxNumber) {
  const response = await navApi.queryTaxpayer({
    taxNumber: taxNumber
  });

  return {
    valid: response.taxpayerValidity === 'VALID',
    name: response.taxpayerName,
    status: response.incorporation,
    address: response.taxpayerAddress
  };
}
```

### Lehetséges Státuszok

| NAV Válasz | Rendszer Reakció |
|------------|------------------|
| `VALID` + `OPERATING` | ✅ Számlázás engedélyezve |
| `VALID` + `SUSPENDED` | ⚠️ Figyelmeztetés |
| `VALID` + `TERMINATED` | ❌ Nem működik - figyelmeztetés |
| `INVALID` | ❌ Érvénytelen adószám |

### Figyelmeztetés Dialógus

```
┌────────────────────────────────────────────────────────────────┐
│                   ⚠️ FIGYELMEZTETÉS                            │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  A megadott cég NEM MŰKÖDIK a NAV nyilvántartása szerint!      │
│                                                                 │
│  Cég neve:    {cég_név}                                        │
│  Adószám:     {adószám}                                        │
│  Státusz:     MEGSZŰNT                                         │
│                                                                 │
│  Javaslat: Állítsa át a számlát MAGÁNSZEMÉLY névre!           │
│                                                                 │
│  [ Magánszemélyre Átállít ]    [ Folytatás Mindenképp ]        │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

---

## Szabályok Összefoglalása

### 1. Lejárt Tartozás Kezelése

| Szabály | Leírás |
|---------|--------|
| **Blokkolás** | Lejárt tartozás esetén automatikus |
| **Kivétel** | Készpénzes ügyfelek mentesülnek |
| **Feloldás** | Csak vezető teheti meg |
| **Naplózás** | Minden feloldás auditálva |

### 2. NAV Ellenőrzés

| Szabály | Leírás |
|---------|--------|
| **Kötelező** | Céges számlánál mindig |
| **Online** | NAV API real-time hívás |
| **Offline** | Cache alapján (max 24h) |
| **Figyelmeztetés** | Nem működő cégnél |

### 3. Audit Trail

| Esemény | Naplózott Adatok |
|---------|------------------|
| **Blokkolás** | Ügyfél, összeg, időpont |
| **Feloldás** | Ki, miért, mikor |
| **NAV hiba** | Adószám, hiba típus |
| **Átállítás** | Eredeti → új típus |

---

## Jogosultsági Mátrix

| Művelet | VIEWER | SALES | ADMIN | MANAGER | SUPER_ADMIN |
|---------|--------|-------|-------|---------|-------------|
| Blokkolás látása | ✅ | ✅ | ✅ | ✅ | ✅ |
| Feloldás kérése | ❌ | ✅ | ✅ | ✅ | ✅ |
| Feloldás jóváhagyása | ❌ | ❌ | ✅ | ✅ | ✅ |
| Audit log megtekintése | ❌ | ❌ | ✅ | ✅ | ✅ |
| Szabályok módosítása | ❌ | ❌ | ❌ | ❌ | ✅ |

---

## Technikai Megvalósítás

### Adatbázis Lekérdezés

```sql
-- Lejárt tartozás ellenőrzés
SELECT
    p.partner_id,
    p.nev,
    p.fizetesi_mod,
    SUM(s.brutto - COALESCE(s.fizetve_osszeg, 0)) as tartozas,
    COUNT(*) as lejart_szamlak
FROM partner p
JOIN szamla s ON p.partner_id = s.partner_id
WHERE p.partner_id = ?
  AND s.lejarat < CURRENT_DATE
  AND s.statusz != 'FIZETVE'
  AND p.tenant_id = ?  -- ADR-001
GROUP BY p.partner_id, p.nev, p.fizetesi_mod
HAVING SUM(s.brutto - COALESCE(s.fizetve_osszeg, 0)) > 0;
```

### Feloldás Naplózás

```sql
INSERT INTO audit_log (
    tenant_id,
    esemeny_tipus,
    felhasznalo_id,
    ugyfél_id,
    indoklas,
    osszeg,
    timestamp
) VALUES (
    ?,              -- tenant_id (ADR-001)
    'TARTOZAS_FELOLDAS',
    ?,              -- ki oldotta fel
    ?,              -- melyik ügyfélnél
    ?,              -- indoklás szövege
    ?,              -- tartozás összege
    NOW()
);
```

---

## Kapcsolódó Dokumentumok

- [05-penzugy-folyamat.md](05-penzugy-folyamat.md) - Pénzügyi folyamatok
- [07-ertesitesek-folyamat.md](07-ertesitesek-folyamat.md) - Fizetési emlékeztetők
- [06-egyeb-felhasznalo.md](06-egyeb-felhasznalo.md) - RBAC jogosultságok

---

## Jelmagyarázat

| Szín/Szimbólum | Jelentés |
|----------------|----------|
| 🔴 Piros | Blokkolás (lejárt tartozás) |
| 🟠 Narancs | Figyelmeztetés (döntés kell) |
| 🟢 Zöld | Engedélyezve (folytatható) |
| 🟣 Lila | NAV ellenőrzés |
| 🔵 Kék | Döntési pont |
| ⚠️ | Minden feloldás naplózásra kerül! |
| 🚫 | Blokkolás aktív |
| ✅ | Engedélyezve |
| ❌ | Megtagadva |
