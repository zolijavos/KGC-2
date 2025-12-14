# KGC ERP v3 - Technikai Review (Architect Ügynök)

**Készítette:** Architect (BMAD)
**Dátum:** 2025-12-08
**Verzió:** 1.0
**Forrás:** diagram-update-plan-v3.md + CSV megjegyzések

---

## Executive Summary

A frissítési terv áttekintése után **javasolt továbbhaladás Sprint beosztás szerint**, de **8 kritikus technikai pontot azonosítottam**, amelyek döntést vagy módosítást igényelnek az implementáció előtt.

**Általános értékelés:**
- ✅ **67%** - Helyesen megtervezett módosítások
- ⚠️ **25%** - Módosítási javaslat szükséges
- 🔴 **8%** - Kockázatos vagy hiányzó elemek

---

## 1. Séma Módosítások Elemzése

### 1.1 PARTNER Entitás Módosítások

#### ✅ Jóváhagyott módosítások:

```sql
ALTER TABLE PARTNER
  ADD COLUMN mothers_name VARCHAR(255),
  ADD COLUMN birth_place VARCHAR(255),
  ADD COLUMN birth_date DATE,
  ADD COLUMN temporary_address VARCHAR(500);
```

**Indoklás:** Az ügyfél által megadott adatigény (személyi + lakcímkártya adatok) teljes körűen lefedve.

#### 🔴 KRITIKUS: TAJ szám mezővel kapcsolatos döntés

**Jelenlegi terv:** Törlés vagy opcionális jelzés
**Probléma:** A CSV egyértelműen írja: "TAJ szám nem kell", de a jelenlegi ERD-ben már `taj_szam (VARCHAR) opcionális` formában szerepel.

**Javasolt döntés:**
```sql
-- OPCIÓ A: Teljes törlés (ha soha nem használták)
ALTER TABLE PARTNER DROP COLUMN taj_szam;

-- OPCIÓ B: Megtartás de deprecated jelölés (ha már vannak adatok)
-- Nem kell semmit módosítani, csak dokumentálni hogy "nem kell"
```

**Kérdés az ügyfélnek:** Van-e jelenleg TAJ szám adat a rendszerben? Ha igen, megtartjuk, ha nem, töröljük.

---

### 1.2 CÉG Entitás Módosítások

#### ✅ Jóváhagyott:

```sql
ALTER TABLE CÉG
  ADD COLUMN vat_zone ENUM('HU', 'EU', 'NON_EU') DEFAULT 'HU',
  ADD INDEX idx_ceg_vat_zone (vat_zone);
```

#### ⚠️ Módosítási javaslat:

**Probléma:** Az automatikus ÁFA tartalom logikát nem specifikálta a terv.

**Javasolt bővítés:**
```sql
ALTER TABLE CÉG
  ADD COLUMN vat_zone ENUM('HU', 'EU', 'NON_EU') DEFAULT 'HU',
  ADD COLUMN vat_auto_calculated BOOLEAN DEFAULT TRUE,
  ADD COLUMN vat_override_reason VARCHAR(255) NULL,
  ADD INDEX idx_ceg_vat_zone (vat_zone);
```

---

### 1.3 CÉG_MEGHATALMAZOTT Új Entitás

#### 🔴 KRITIKUS - Részletes Tervezés

```sql
CREATE TABLE CÉG_MEGHATALMAZOTT (
  meghatalmazott_id INT AUTO_INCREMENT PRIMARY KEY,
  tenant_id UUID NOT NULL,
  ceg_id INT NOT NULL,
  partner_id INT NOT NULL,
  meghatalmazas_tipus ENUM('berles', 'atveteles', 'mindketto') DEFAULT 'mindketto',
  ervenyesseg_kezdete DATE,
  ervenyesseg_vege DATE NULL,
  dokumentum_url VARCHAR(500),
  aktiv BOOLEAN DEFAULT TRUE,
  rogzites_datum DATETIME DEFAULT CURRENT_TIMESTAMP,
  rogzito_id INT,
  FOREIGN KEY (ceg_id) REFERENCES CÉG(ceg_id),
  FOREIGN KEY (partner_id) REFERENCES PARTNER(partner_id),
  FOREIGN KEY (rogzito_id) REFERENCES FELHASZNÁLÓ(felhasznalo_id),
  INDEX idx_meghatalmazott_ceg (ceg_id),
  INDEX idx_meghatalmazott_partner (partner_id),
  INDEX idx_meghatalmazott_aktiv (aktiv)
);
```

---

## 2. BÉRLÉS Entitás Módosítások

### 2.1 Fizikai kiadó/visszavevő + Audit

```sql
ALTER TABLE BÉRLÉS
  ADD COLUMN kiadta_fizikai_user_id INT,
  ADD COLUMN kiadta_datum DATETIME,
  ADD COLUMN visszavette_fizikai_user_id INT,
  ADD COLUMN visszavette_datum DATETIME,
  ADD COLUMN kar_jegyzokonyv_url VARCHAR(500),
  ADD COLUMN kar_osszeg DECIMAL(10,2) DEFAULT 0,
  ADD FOREIGN KEY (kiadta_fizikai_user_id) REFERENCES FELHASZNÁLÓ(felhasznalo_id),
  ADD FOREIGN KEY (visszavette_fizikai_user_id) REFERENCES FELHASZNÁLÓ(felhasznalo_id);
```

### 2.2 🔴 KRITIKUS: Audit Log Tábla

```sql
CREATE TABLE BÉRLÉS_AUDIT_LOG (
  log_id INT AUTO_INCREMENT PRIMARY KEY,
  berles_id INT NOT NULL,
  event_type ENUM('kiadas', 'visszavetel', 'kar_megjegyzes', 'statusz_valtozas') NOT NULL,
  event_timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  user_id INT NOT NULL,
  event_description TEXT,
  foto_url VARCHAR(500),
  kar_osszeg DECIMAL(10,2),
  FOREIGN KEY (berles_id) REFERENCES BÉRLÉS(berles_id),
  FOREIGN KEY (user_id) REFERENCES FELHASZNÁLÓ(felhasznalo_id),
  INDEX idx_audit_berles (berles_id),
  INDEX idx_audit_timestamp (event_timestamp)
);
```

---

## 3. MyPos Integráció - Payment Token

### 🔴 KRITIKUS: Biztonsági Követelmények

```sql
CREATE TABLE MYPOS_PAYMENT (
  payment_id INT AUTO_INCREMENT PRIMARY KEY,
  tenant_id UUID NOT NULL,
  berles_id INT NOT NULL,
  transaction_id VARCHAR(100) NOT NULL UNIQUE,
  payment_token VARCHAR(500) NOT NULL, -- ⚠️ TITKOSÍTVA (AES-256)
  payment_method ENUM('card') DEFAULT 'card',
  amount DECIMAL(10,2) NOT NULL,
  fee_amount DECIMAL(10,2) DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  refund_status ENUM('pending', 'refunded', 'failed') DEFAULT 'pending',
  refunded_at DATETIME NULL,
  refund_amount DECIMAL(10,2) NULL,
  token_expiry DATE,
  FOREIGN KEY (berles_id) REFERENCES BÉRLÉS(berles_id),
  INDEX idx_mypos_berles (berles_id),
  INDEX idx_mypos_transaction (transaction_id)
);
```

**Kiegészítő követelmények:**
- Alkalmazás szintű titkosítás: AES-256-GCM
- Key management: Környezeti változó vagy vault
- Token expiry: 30-180 nap

**ADR szükséges:** "ADR-005: MyPos Payment Token Storage Strategy"

---

## 4. Device-based Auth (Kiosk Mód)

### 4.1 DEVICE_REGISTRATION

```sql
CREATE TABLE DEVICE_REGISTRATION (
  device_id INT AUTO_INCREMENT PRIMARY KEY,
  tenant_id UUID NOT NULL,
  device_name VARCHAR(100) NOT NULL,
  device_type ENUM('kiosk', 'backoffice', 'mobile') DEFAULT 'kiosk',
  device_pin_hash VARCHAR(255),
  default_role ENUM('OPERATOR', 'VIEWER') DEFAULT 'OPERATOR',
  mac_address VARCHAR(17) UNIQUE,
  last_login DATETIME,
  aktiv BOOLEAN DEFAULT TRUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_device_tenant (tenant_id),
  INDEX idx_device_type (device_type)
);
```

### 4.2 Elevated Session (Manager PIN)

```sql
CREATE TABLE DEVICE_ELEVATED_SESSION (
  session_id INT AUTO_INCREMENT PRIMARY KEY,
  device_id INT NOT NULL,
  elevated_user_id INT NOT NULL,
  started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  ended_at DATETIME NULL,
  operation_performed VARCHAR(255),
  FOREIGN KEY (device_id) REFERENCES DEVICE_REGISTRATION(device_id),
  FOREIGN KEY (elevated_user_id) REFERENCES FELHASZNÁLÓ(felhasznalo_id),
  INDEX idx_elevated_device (device_id),
  INDEX idx_elevated_user (elevated_user_id)
);
```

---

## 5. Tartozék Kezelés

### 5.1 BÉRGÉP_TARTOZÉK

```sql
CREATE TABLE BÉRGÉP_TARTOZÉK (
  tartozek_id INT AUTO_INCREMENT PRIMARY KEY,
  tenant_id UUID NOT NULL,
  bergep_cikk_id INT NOT NULL,
  tartozek_cikk_id INT NOT NULL,
  tipus ENUM('szukseges_kellek', 'fizetos_tartozek') DEFAULT 'fizetos_tartozek',
  alapertelmezett BOOLEAN DEFAULT FALSE,
  FOREIGN KEY (bergep_cikk_id) REFERENCES CIKK(cikk_id),
  FOREIGN KEY (tartozek_cikk_id) REFERENCES CIKK(cikk_id),
  INDEX idx_tartozek_bergep (bergep_cikk_id)
);
```

### 5.2 BÉRLÉS_TARTOZÉK_KIADOTT

```sql
CREATE TABLE BÉRLÉS_TARTOZÉK_KIADOTT (
  kiadott_id INT AUTO_INCREMENT PRIMARY KEY,
  berles_id INT NOT NULL,
  tartozek_cikk_id INT NOT NULL,
  mennyiseg INT DEFAULT 1,
  visszahozva BOOLEAN DEFAULT FALSE,
  eladasi_ar DECIMAL(10,2),
  FOREIGN KEY (berles_id) REFERENCES BÉRLÉS(berles_id),
  FOREIGN KEY (tartozek_cikk_id) REFERENCES CIKK(cikk_id),
  INDEX idx_kiadott_berles (berles_id)
);
```

### 5.3 SZERVIZ_TARTOZÉK

```sql
CREATE TABLE SZERVIZ_TARTOZÉK (
  tartozek_id INT AUTO_INCREMENT PRIMARY KEY,
  munkalap_id VARCHAR(50) NOT NULL,
  tartozek_nev VARCHAR(255),
  beadva BOOLEAN DEFAULT FALSE,
  megjegyzes TEXT,
  FOREIGN KEY (munkalap_id) REFERENCES MUNKALAP(munkalap_szam),
  INDEX idx_szerviz_tartozek_munkalap (munkalap_id)
);
```

---

## 6. Hiányzó Elemek - Kiegészítések

### 6.1 🔴 Dolgozói Kedvezmény Rendszer

```sql
CREATE TABLE KEDVEZMÉNY_SZABÁLY (
  kedvezmeny_id INT AUTO_INCREMENT PRIMARY KEY,
  tenant_id UUID NOT NULL,
  nev VARCHAR(100),
  tipus ENUM('berles', 'ertekesites', 'mindketto') DEFAULT 'mindketto',
  kedvezmeny_szazalek DECIMAL(5,2) DEFAULT 0,
  fix_osszeg DECIMAL(10,2) DEFAULT 0,
  ervenyesseg_kezdete DATE,
  ervenyesseg_vege DATE NULL,
  jogosultak_szerepkor ENUM('ALL', 'EMPLOYEE', 'MANAGER', 'ADMIN'),
  aktiv BOOLEAN DEFAULT TRUE,
  INDEX idx_kedvezmeny_tipus (tipus),
  INDEX idx_kedvezmeny_aktiv (aktiv)
);

CREATE TABLE KEDVEZMÉNY_IGÉNYBEVÉTEL (
  igenybevel_id INT AUTO_INCREMENT PRIMARY KEY,
  kedvezmeny_id INT NOT NULL,
  berles_id INT NULL,
  szamla_id INT NULL,
  user_id INT NOT NULL,
  kedvezmeny_osszeg DECIMAL(10,2),
  igenybevel_datum DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (kedvezmeny_id) REFERENCES KEDVEZMÉNY_SZABÁLY(kedvezmeny_id),
  FOREIGN KEY (berles_id) REFERENCES BÉRLÉS(berles_id),
  FOREIGN KEY (user_id) REFERENCES FELHASZNÁLÓ(felhasznalo_id),
  INDEX idx_igenybevel_kedvezmeny (kedvezmeny_id),
  INDEX idx_igenybevel_user (user_id)
);
```

### 6.2 Hétvége Opció

```sql
ALTER TABLE BÉRLÉS
  MODIFY COLUMN idotartam ENUM('3ora', 'felnap', '1nap', 'hetvege', '0') DEFAULT '1nap';
```

**Díjszámítás:** `hetvege` = 1.5 × napi_dij

### 6.3 Háttér Szállítólevél

```sql
CREATE TABLE SZÁLLÍTÓLEVÉL (
  szallitolevel_id INT AUTO_INCREMENT PRIMARY KEY,
  tenant_id UUID NOT NULL,
  szallitolevel_szam VARCHAR(50) UNIQUE,
  berles_id INT NULL,
  partner_id INT NOT NULL,
  kiallitas_datum DATETIME DEFAULT CURRENT_TIMESTAMP,
  tetelek JSON,
  osszeg DECIMAL(10,2),
  elszamolva BOOLEAN DEFAULT FALSE,
  szamla_id INT NULL,
  FOREIGN KEY (berles_id) REFERENCES BÉRLÉS(berles_id),
  FOREIGN KEY (partner_id) REFERENCES PARTNER(partner_id),
  INDEX idx_szallitolevel_partner (partner_id),
  INDEX idx_szallitolevel_elszamolva (elszamolva)
);
```

### 6.4 Szerviz Kiegészítések

```sql
-- Felvételi típus
ALTER TABLE MUNKALAP
  ADD COLUMN intake_type ENUM('garancialis', 'javitas', 'arajanlat') DEFAULT 'javitas';

-- Csatolmányok
CREATE TABLE MUNKALAP_CSATOLMÁNY (
  csatolmany_id INT AUTO_INCREMENT PRIMARY KEY,
  munkalap_id VARCHAR(50) NOT NULL,
  fajl_tipus ENUM('foto', 'garancialevel', 'szamla', 'egyeb') NOT NULL,
  fajl_url VARCHAR(500) NOT NULL,
  fajl_nev VARCHAR(255),
  feltoltes_datum DATETIME DEFAULT CURRENT_TIMESTAMP,
  feltoltotte_user_id INT,
  FOREIGN KEY (munkalap_id) REFERENCES MUNKALAP(munkalap_szam),
  FOREIGN KEY (feltoltotte_user_id) REFERENCES FELHASZNÁLÓ(felhasznalo_id),
  INDEX idx_csatolmany_munkalap (munkalap_id)
);

-- Belső üzenetek
CREATE TABLE MUNKALAP_BELSŐ_ÜZENET (
  uzenet_id INT AUTO_INCREMENT PRIMARY KEY,
  munkalap_id VARCHAR(50) NOT NULL,
  uzenet TEXT NOT NULL,
  kuldte_user_id INT NOT NULL,
  kuldes_datum DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (munkalap_id) REFERENCES MUNKALAP(munkalap_szam),
  FOREIGN KEY (kuldte_user_id) REFERENCES FELHASZNÁLÓ(felhasznalo_id),
  INDEX idx_belso_uzenet_munkalap (munkalap_id)
);
```

---

## 7. Javasolt ADR-ek

| ADR | Téma | Prioritás |
|-----|------|-----------|
| ADR-005 | MyPos Payment Token Storage Strategy | 🔴 Sprint 1 előtt |
| ADR-006 | Bérlés Audit Trail Strategy | 🔴 Sprint 1 előtt |
| ADR-007 | Employee Discount Management | 🟠 Sprint 2 előtt |
| ADR-008 | Device-based Authentication Elevated Permissions | 🟠 Sprint 2 előtt |

---

## 8. Kockázatok és Figyelmeztetések

| # | Kockázat | Hatás | Megoldás |
|---|----------|-------|----------|
| 1 | PCI-DSS Compliance (MyPos) | 🔴 Audit kötelezettség | Token titkosítás + KMS |
| 2 | GDPR (személyes adatok bővülése) | 🟠 Jogi követelmény | Adatkezelési tájékoztató |
| 3 | Offline Sync konfliktus | 🟡 Adatvesztés | Conflict resolution UI |
| 4 | Tartozék készletkezelés | 🟡 Készlet pontatlanság | Trigger/alkalmazás logika |

---

## 9. Kritikus Kérdések az Ügyfélnek

1. **TAJ szám:** Van-e jelenleg TAJ szám adat? Töröljük vagy megtartjuk?
2. **MyPos compliance:** PCI-DSS audit követelmények?
3. **Dolgozói kedvezmény limit:** Van-e havi/éves limit?
4. **Kaució visszatérítési határidő:** Max időtartam? (token 30-180 nap)
5. **Meghatalmazott érvényesség:** Lejár-e valaha?
6. **Audit log megőrzés:** Meddig tároljuk?

---

## 10. Összesített Pontszám

**67/100** - Jó alapok, **8 kritikus hiányosság** javítást igényel.

---

## 11. Sprint Beosztás (Módosított)

### Sprint 1 (Kritikus)
- PARTNER: új mezők
- CÉG: vat_zone + CÉG_MEGHATALMAZOTT
- BÉRLÉS: fizikai kiadó/visszavevő + audit log
- MYPOS_PAYMENT tábla
- DEVICE_REGISTRATION tábla

### Sprint 2 (Magas)
- BÉRGÉP_TARTOZÉK + BÉRLÉS_TARTOZÉK_KIADOTT
- SZERVIZ_TARTOZÉK + MUNKALAP_CSATOLMÁNY
- KEDVEZMÉNY_SZABÁLY + KEDVEZMÉNY_IGÉNYBEVÉTEL
- DEVICE_ELEVATED_SESSION
- SZÁLLÍTÓLEVÉL

### Sprint 3 (Közepes)
- Értékesítés ERD dokumentáció frissítés
- Hétvége opció implementálás

---

**Készítette:** Architect (BMAD Team)
**Státusz:** Review Complete - Jóváhagyásra vár
**Következő lépés:** PM döntés a kritikus kérdésekről + ADR készítés
