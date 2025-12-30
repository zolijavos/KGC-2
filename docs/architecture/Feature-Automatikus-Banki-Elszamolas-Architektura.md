# Feature: Automatikus Banki/Futár Elszámolás - Architektúra Dokumentum

**Verzió:** 1.0
**Dátum:** 2025-12-29
**Szerző:** Winston (Architect), BMAD Method
**Fit-Gap ID:** #3 (CRITICAL Priority)
**Story Pont Becslés:** 13-21 SP
**Implementációs Idő:** 5 hét

---

## 📋 Executive Summary

### Probléma
A KGC ERP jelenlegi pénzügyi folyamata **manuális párosítást** igényel a beérkező banki/futár tranzakciók és kiállított számlák között. Ez:
- **Napi 2 óra munkát** jelent a pénzügyes számára
- **Hibaarány 15-20%** (emberi tévesztés)
- **Késleltetett cash flow** láthatóság

### Megoldás
**Intelligens automatizált párosítási rendszer** pontozási algoritmussal:
- **90-100% pontszám** → Automatikus párosítás (zöld jelzés)
- **70-89% pontszám** → Eltérés, gyors review szükséges (sárga)
- **<70% pontszám** → Manuális feldolgozás (piros)

### Értékajánlat
- ⏱️ **Időmegtakarítás:** 60% (2h → 45 perc/nap)
- ✅ **Pontosság:** Hibaarány 80%-kal csökken
- 💰 **Cash flow:** Real-time láthatóság a befizetésekről
- 🔗 **Integráció:** OTP, K&H, Raiffeisen bankok + GLS, MPL futárok

---

## 🎯 Üzleti Követelmények

### Forrás
**KGC-notes-01, sor 140-176:**
> "Be van pontozva a beérkező a bankoktól a beérkező pénz... pontozási rendszer alapján összepárosítani és esetlegesen csak az eltérést mutassa."

### Jelenlegi Állapot (AS-IS)
**Folyamat:** [05-penzugy-folyamat.md](../Flows/05-penzugy-folyamat.md)

**Manuális munkafolyamat:**
```
1. Pénzügyes letölti banki kivonatot (OTP Internetbank CSV)
2. Excel táblázatban megnyitja
3. Egyesével kézi párosítás:
   - CTRL+F számlaszám keresés az ERP-ben
   - Összeg egyeztetés
   - Dátum ellenőrzés
   - Pipálás: "Fizetve"
4. Eltérések eseti vizsgálata (pl. részletfizetés, elírás)
5. Futár elszámolás: külön folyamat, GLS/MPL paperlapok alapján
```

**Problémák:**
- ❌ Időigényes (10-15 tranzakció/óra)
- ❌ Hibalehetőség (dupla könyvelés, nem egyező összegek)
- ❌ Nincs audit trail (ki, mikor párosította?)
- ❌ Futár elszámolás teljesen manuális

### Elvárt Állapot (TO-BE)

**Automatizált munkafolyamat:**
```
1. Bank API automatikusan szinkronizál (óránként)
   → BANK_TRANZAKCIÓ tábla frissül

2. Párosítási motor fut (háttérben, async)
   → Pontozási algoritmus értékel minden új tranzakciót

3. Dashboard megjelenítés:
   ✅ Zöld (90-100%): "23 tranzakció automatikusan párosítva"
   ⚠️ Sárga (70-89%): "3 eltérés vizsgálatra vár" → kattintás → részletek
   ❌ Piros (<70%): "1 ismeretlen tranzakció" → manuális link

4. Pénzügyes csak az eltéréseket ellenőrzi (gyors approve/reject)
5. Automatikus lezárás: SZÁMLA.statusz = 'Fizetve'
```

**Előnyök:**
- ✅ **Real-time:** Óránként szinkronizál
- ✅ **Átlátható:** Dashboard színkódokkal
- ✅ **Auditálható:** Minden párosítás logolva (ki, mikor, pontszám)
- ✅ **Skálázható:** 100+ tranzakció/nap kezelése

---

## 🏗️ Adatmodell

### Új Entitások

#### 1. `bank_tranzakcio` Tábla

Tárolja az összes beérkező pénzügyi tranzakciót (bank, futár, POS).

```sql
CREATE TABLE kgc.bank_tranzakcio (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Alapadatok
  kulso_tranzakcio_id VARCHAR(100) UNIQUE NOT NULL,  -- Bank saját ID
  osszeg DECIMAL(12, 2) NOT NULL,
  deviza VARCHAR(3) DEFAULT 'HUF',
  datum DATE NOT NULL,
  erteknap DATE,

  -- Partner azonosítás
  kulso_partner_nev VARCHAR(255),  -- "KOVÁCS JÁNOS" a banki kivonatból
  kulso_partner_szamlaszam VARCHAR(50),  -- IBAN vagy számlaszám
  kozlemeny TEXT,  -- Kulcs a párosításhoz! "Számla: INV-2025-001234"

  -- Forrás
  forras VARCHAR(20) NOT NULL CHECK (forras IN ('Bank', 'Futár', 'POS', 'Készpénz')),
  forras_api_id UUID REFERENCES kgc.kulso_partner_api(id),

  -- Párosítás
  statusz VARCHAR(20) NOT NULL DEFAULT 'Párosítatlan'
    CHECK (statusz IN ('Párosítatlan', 'Párosított', 'Eltérés', 'Manuális')),
  parositas_pontszam INTEGER DEFAULT 0 CHECK (parositas_pontszam BETWEEN 0 AND 100),
  parositas_reszletek JSONB,  -- {"kritérium": "pontszám", ...}

  -- Kapcsolat
  szamla_id UUID REFERENCES kgc.szamla(id) ON DELETE SET NULL,
  parositas_datum TIMESTAMP,
  parositas_felhasznalo_id UUID REFERENCES kgc.felhasznalo(id),

  -- Audit
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  -- Indexek
  INDEX idx_bank_trx_statusz (statusz),
  INDEX idx_bank_trx_datum (datum),
  INDEX idx_bank_trx_szamla (szamla_id),
  INDEX idx_bank_trx_kozlemeny (kozlemeny)  -- Full-text search
);

-- Trigger: updated_at automatikus frissítés
CREATE TRIGGER trg_bank_tranzakcio_updated
  BEFORE UPDATE ON kgc.bank_tranzakcio
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

**Példa rekordok:**

```sql
-- Automatikusan párosított (zöld)
INSERT INTO bank_tranzakcio VALUES (
  gen_random_uuid(),
  'OTP-TRX-20250129-001',
  125000.00,
  'HUF',
  '2025-01-29',
  '2025-01-29',
  'KOVÁCS JÁNOS',
  'HU12345678901234567890123456',
  'Számla: INV-2025-001234',  -- ← Egyértelmű számlaszám!
  'Bank',
  'otp-api-uuid',
  'Párosított',  -- ← Automatikus
  95,  -- ← Magas pontszám
  '{"kozlemeny_match": 50, "osszeg_match": 30, "partner_match": 15}',
  'szamla-uuid-001234',
  NOW(),
  NULL,  -- ← Automatikus, nincs user
  NOW(),
  NOW()
);

-- Eltérés (sárga) - részletfizetés
INSERT INTO bank_tranzakcio VALUES (
  gen_random_uuid(),
  'OTP-TRX-20250129-002',
  50000.00,  -- ← Számla 125.000 Ft, de csak 50.000 érkezett
  'HUF',
  '2025-01-29',
  '2025-01-29',
  'NAGY PÉTER',
  'HU98765432109876543210987654',
  'INV-2025-005678 részlet 1/3',
  'Bank',
  'otp-api-uuid',
  'Eltérés',  -- ← Manuális review szükséges
  75,  -- ← Közepes pontszám
  '{"kozlemeny_match": 50, "osszeg_match": 0, "partial_payment": true}',
  NULL,  -- ← Még nincs párosítva
  NULL,
  NULL,
  NOW(),
  NOW()
);

-- Párosítatlan (piros) - ismeretlen
INSERT INTO bank_tranzakcio VALUES (
  gen_random_uuid(),
  'OTP-TRX-20250129-003',
  15000.00,
  'HUF',
  '2025-01-29',
  '2025-01-29',
  'ISMERETLEN BEFIZETÖ',
  NULL,
  'Tévedés?',  -- ← Nincs értelmes közlemény
  'Bank',
  'otp-api-uuid',
  'Párosítatlan',
  25,  -- ← Alacsony pontszám
  '{"kozlemeny_match": 0, "osszeg_match": 0}',
  NULL,
  NULL,
  NULL,
  NOW(),
  NOW()
);
```

---

#### 2. `kulso_partner_api` Tábla

Tárolja a külső rendszerek (bankok, futárok) API konfigurációját.

```sql
CREATE TABLE kgc.kulso_partner_api (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  partner_nev VARCHAR(100) NOT NULL UNIQUE,  -- "OTP Bank", "GLS Futár"
  api_type VARCHAR(20) NOT NULL CHECK (api_type IN ('Bank', 'Futár', 'POS')),

  -- API kapcsolat
  api_url VARCHAR(500),  -- "https://api.otpbank.hu/v1/transactions"
  auth_type VARCHAR(20) CHECK (auth_type IN ('OAuth2', 'API_Key', 'Certificate')),
  credentials JSONB,  -- Encrypted! {"client_id": "...", "client_secret": "..."}

  -- Konfiguráció
  aktiv BOOLEAN DEFAULT TRUE,
  szinkronizalas_gyakorisag INTEGER DEFAULT 60,  -- perc
  utolso_szinkronizalas TIMESTAMP,

  -- Audit
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Példa adatok
INSERT INTO kulso_partner_api VALUES
  ('otp-api-uuid', 'OTP Bank', 'Bank',
   'https://api.otpbank.hu/v1/transactions',
   'OAuth2',
   '{"client_id": "kgc_prod", "client_secret": "ENCRYPTED"}',
   TRUE, 60, NULL, NOW(), NOW()),

  ('kh-api-uuid', 'K&H Bank', 'Bank',
   'https://api.kh.hu/corporate/statements',
   'Certificate',
   '{"cert_path": "/secure/kh.pem"}',
   TRUE, 120, NULL, NOW(), NOW()),

  ('gls-api-uuid', 'GLS Futár', 'Futár',
   'https://api.gls-group.eu/parcelshop/settlement',
   'API_Key',
   '{"api_key": "ENCRYPTED"}',
   TRUE, 1440, NULL, NOW(), NOW());  -- Naponta egyszer
```

**Biztonsági követelmény:**
- `credentials` mező **TITKOSÍTVA** tárolva (AES-256)
- Csak backend olvashatja (environment variable kulccsal)
- Frontend **SOHA** nem látja

---

#### 3. `parositas_audit_log` Tábla

Minden párosítási művelet naplózása (compliance, audit trail).

```sql
CREATE TABLE kgc.parositas_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  bank_tranzakcio_id UUID NOT NULL REFERENCES kgc.bank_tranzakcio(id) ON DELETE CASCADE,
  szamla_id UUID REFERENCES kgc.szamla(id) ON DELETE SET NULL,

  akcio VARCHAR(50) NOT NULL,  -- "AUTO_PAIRED", "MANUAL_APPROVED", "UNPAIRED"
  regi_statusz VARCHAR(20),
  uj_statusz VARCHAR(20),

  pontszam INTEGER,
  reszletek JSONB,  -- Pontszám komponensek

  felhasznalo_id UUID REFERENCES kgc.felhasznalo(id),  -- NULL = automatikus
  megjegyzes TEXT,

  timestamp TIMESTAMP DEFAULT NOW(),

  INDEX idx_audit_trx (bank_tranzakcio_id),
  INDEX idx_audit_timestamp (timestamp)
);
```

---

### Módosított Entitások

#### `szamla` Tábla Bővítése

```sql
ALTER TABLE kgc.szamla
  ADD COLUMN fizetve_mod VARCHAR(20)
    CHECK (fizetve_mod IN ('Készpénz', 'Banki átutalás', 'Kártya', 'Futár', 'Vegyes')),

  ADD COLUMN fizetve_bank_tranzakcio_id UUID
    REFERENCES kgc.bank_tranzakcio(id) ON DELETE SET NULL,

  ADD COLUMN fizetve_datum DATE,

  ADD COLUMN reszletfizetes_aktiv BOOLEAN DEFAULT FALSE;

-- Index gyorsabb párosításhoz
CREATE INDEX idx_szamla_osszeg ON kgc.szamla(vegosszeg);
CREATE INDEX idx_szamla_szamlaszam ON kgc.szamla(szamlaszam);
```

**Példa:**
```sql
-- Előtte: manuális pipálás
UPDATE szamla SET statusz = 'Fizetve' WHERE id = 'xyz';

-- Utána: automatikus linkelt párosítás
UPDATE szamla
SET
  statusz = 'Fizetve',
  fizetve_mod = 'Banki átutalás',
  fizetve_bank_tranzakcio_id = 'bank-trx-uuid',
  fizetve_datum = '2025-01-29'
WHERE id = 'xyz';
```

---

## 🧠 Párosítási Algoritmus

### Pontozási Rendszer (Weighted Scoring)

**Cél:** Minden `bank_tranzakcio` rekordhoz számolunk egy **0-100 közötti pontszámot**, amely megmutatja, mennyire valószínű a sikeres párosítás egy számlával.

#### Kritériumok és Súlyok

| Kritérium | Súly | Pontszám | Feltétel | Példa |
|-----------|------|----------|----------|-------|
| **Közlemény tartalmaz számlaszámot** | 50% | 50 | Regex match: `INV-\d{4}-\d{6}` | "Számla: INV-2025-001234" → +50 |
| **Összeg pontosan megegyezik** | 30% | 30 | `bank_tranzakcio.osszeg = szamla.vegosszeg` | 125.000 Ft = 125.000 Ft → +30 |
| **Partner név egyezés** | 15% | 0-15 | Fuzzy match (Levenshtein distance) | "KOVÁCS JÁNOS" ~ "Kovács János Kft" → +12 |
| **Dátum közelsége** | 5% | 0-5 | ±3 napon belül | Számla: 2025-01-27, Beérkezés: 2025-01-29 → +5 |

**Összesen:** 100 pont

---

### Implementáció (TypeScript/NestJS)

#### Service Layer: `BankReconciliationService`

```typescript
import Fuse from 'fuse.js';  // Fuzzy matching library

interface MatchingScore {
  szamla_id: string;
  pontszam: number;
  reszletek: {
    kozlemeny_match: number;
    osszeg_match: number;
    partner_match: number;
    datum_match: number;
  };
}

@Injectable()
export class BankReconciliationService {

  /**
   * Fő párosítási függvény: kiértékel egy banki tranzakciót
   */
  async matchTransaction(
    bankTrxId: string
  ): Promise<MatchingScore | null> {

    const bankTrx = await this.bankTranzakcioRepo.findOne({
      where: { id: bankTrxId }
    });

    if (!bankTrx) throw new Error('Tranzakció nem található');

    // 1️⃣ Közlemény alapú keresés (50 pont)
    const kozlemenyMatch = this.extractInvoiceNumber(bankTrx.kozlemeny);

    if (kozlemenyMatch) {
      const szamla = await this.szamlaRepo.findOne({
        where: { szamlaszam: kozlemenyMatch }
      });

      if (szamla) {
        const score = this.calculateScore(bankTrx, szamla);

        if (score.pontszam >= 90) {
          // Automatikus párosítás
          await this.autoPair(bankTrx, szamla, score);
        }

        return score;
      }
    }

    // 2️⃣ Fuzzy matching: ha nincs egyértelmű számlaszám
    const candidates = await this.findCandidates(bankTrx);
    const bestMatch = this.getBestMatch(bankTrx, candidates);

    if (bestMatch && bestMatch.pontszam >= 70) {
      return bestMatch;
    }

    // 3️⃣ Nincs jó párosítás
    await this.markAsUnmatched(bankTrx);
    return null;
  }

  /**
   * Regex: számlaszám kinyerése közleményből
   */
  private extractInvoiceNumber(kozlemeny: string): string | null {
    const regex = /INV-\d{4}-\d{6}/i;
    const match = kozlemeny?.match(regex);
    return match ? match[0].toUpperCase() : null;
  }

  /**
   * Pontszám számítás
   */
  private calculateScore(
    bankTrx: BankTranzakcio,
    szamla: Szamla
  ): MatchingScore {

    const reszletek = {
      kozlemeny_match: 0,
      osszeg_match: 0,
      partner_match: 0,
      datum_match: 0,
    };

    // Közlemény (50 pont)
    if (this.extractInvoiceNumber(bankTrx.kozlemeny) === szamla.szamlaszam) {
      reszletek.kozlemeny_match = 50;
    }

    // Összeg (30 pont)
    if (Math.abs(bankTrx.osszeg - szamla.vegosszeg) < 1) {  // ±1 Ft tolerancia
      reszletek.osszeg_match = 30;
    } else if (bankTrx.osszeg < szamla.vegosszeg) {
      // Részletfizetés detektálás
      const ratio = bankTrx.osszeg / szamla.vegosszeg;
      if ([0.25, 0.33, 0.5].some(r => Math.abs(ratio - r) < 0.01)) {
        reszletek.osszeg_match = 15;  // Fél pont részletfizetésért
      }
    }

    // Partner név (15 pont)
    reszletek.partner_match = this.fuzzyMatchPartner(
      bankTrx.kulso_partner_nev,
      szamla.ugyfelnev
    );

    // Dátum (5 pont)
    const dateDiff = Math.abs(
      differenceInDays(bankTrx.datum, szamla.kiallitas_datum)
    );

    if (dateDiff === 0) reszletek.datum_match = 5;
    else if (dateDiff <= 3) reszletek.datum_match = 3;
    else if (dateDiff <= 7) reszletek.datum_match = 1;

    const pontszam = Object.values(reszletek).reduce((sum, val) => sum + val, 0);

    return {
      szamla_id: szamla.id,
      pontszam,
      reszletek,
    };
  }

  /**
   * Fuzzy matching: név hasonlóság (0-15 pont)
   */
  private fuzzyMatchPartner(bankName: string, szamlaName: string): number {
    if (!bankName || !szamlaName) return 0;

    const fuse = new Fuse([szamlaName], {
      includeScore: true,
      threshold: 0.4,  // 60% hasonlóság minimum
    });

    const result = fuse.search(bankName);

    if (result.length > 0) {
      const similarity = 1 - result[0].score;  // 0-1 skála
      return Math.round(similarity * 15);
    }

    return 0;
  }

  /**
   * Automatikus párosítás (90-100 pont)
   */
  private async autoPair(
    bankTrx: BankTranzakcio,
    szamla: Szamla,
    score: MatchingScore
  ): Promise<void> {

    await this.entityManager.transaction(async transactionalEM => {

      // 1. Banki tranzakció frissítése
      bankTrx.statusz = 'Párosított';
      bankTrx.szamla_id = szamla.id;
      bankTrx.parositas_pontszam = score.pontszam;
      bankTrx.parositas_reszletek = score.reszletek;
      bankTrx.parositas_datum = new Date();
      bankTrx.parositas_felhasznalo_id = null;  // Automatikus

      await transactionalEM.save(bankTrx);

      // 2. Számla lezárása
      szamla.statusz = 'Fizetve';
      szamla.fizetve_mod = 'Banki átutalás';
      szamla.fizetve_bank_tranzakcio_id = bankTrx.id;
      szamla.fizetve_datum = bankTrx.datum;

      await transactionalEM.save(szamla);

      // 3. Audit log
      await transactionalEM.save(ParositasAuditLog, {
        bank_tranzakcio_id: bankTrx.id,
        szamla_id: szamla.id,
        akcio: 'AUTO_PAIRED',
        regi_statusz: 'Párosítatlan',
        uj_statusz: 'Párosított',
        pontszam: score.pontszam,
        reszletek: score.reszletek,
        felhasznalo_id: null,
        megjegyzes: `Automatikusan párosítva (pontszám: ${score.pontszam})`,
      });

      // 4. Email értesítés (opcionális)
      await this.emailService.sendPaymentConfirmation(szamla);
    });
  }

  /**
   * Jelölés párosítatlanként
   */
  private async markAsUnmatched(bankTrx: BankTranzakcio): Promise<void> {
    bankTrx.statusz = 'Párosítatlan';
    bankTrx.parositas_pontszam = 0;
    await this.bankTranzakcioRepo.save(bankTrx);
  }

  /**
   * Kandidáns számlák keresése (fuzzy)
   */
  private async findCandidates(
    bankTrx: BankTranzakcio
  ): Promise<Szamla[]> {

    // Összeg ±10% toleranciával
    const minAmount = bankTrx.osszeg * 0.9;
    const maxAmount = bankTrx.osszeg * 1.1;

    return await this.szamlaRepo
      .createQueryBuilder('sz')
      .where('sz.statusz = :statusz', { statusz: 'Függőben' })
      .andWhere('sz.vegosszeg BETWEEN :min AND :max', {
        min: minAmount,
        max: maxAmount
      })
      .andWhere('sz.kiallitas_datum >= :minDate', {
        minDate: subDays(bankTrx.datum, 30)  //Max 30 napos számla
      })
      .orderBy('sz.kiallitas_datum', 'DESC')
      .limit(10)
      .getMany();
  }

  /**
   * Legjobb kandidáns kiválasztása
   */
  private getBestMatch(
    bankTrx: BankTranzakcio,
    candidates: Szamla[]
  ): MatchingScore | null {

    const scores = candidates.map(szamla =>
      this.calculateScore(bankTrx, szamla)
    );

    scores.sort((a, b) => b.pontszam - a.pontszam);

    return scores[0]?.pontszam >= 70 ? scores[0] : null;
  }
}
```

---

### Döntési Logika (State Machine)

```typescript
enum TranzakcioStatusz {
  PAROSÍTATLAN = 'Párosítatlan',   // < 70 pont
  ELTÉRÉS = 'Eltérés',               // 70-89 pont
  PÁROSÍTOTT = 'Párosított',         // >= 90 pont
  MANUÁLIS = 'Manuális',             // User manuálisan linkelte
}

async processTransaction(bankTrxId: string): Promise<void> {
  const matchResult = await this.matchTransaction(bankTrxId);

  if (!matchResult) {
    // Nincs egyáltalán jelölt → Párosítatlan
    await this.updateStatus(bankTrxId, TranzakcioStatusz.PAROSÍTATLAN);
    await this.notifyAdmin('Új párosítatlan tranzakció');
    return;
  }

  if (matchResult.pontszam >= 90) {
    // Automatikus párosítás már megtörtént a matchTransaction() függvényben
    await this.updateStatus(bankTrxId, TranzakcioStatusz.PÁROSÍTOTT);
    // Email ügyfélnek: "Fizetése megérkezett"

  } else if (matchResult.pontszam >= 70) {
    // Eltérés → manuális review szükséges
    await this.updateStatus(bankTrxId, TranzakcioStatusz.ELTÉRÉS);
    await this.notifyFinance(`Eltérés vizsgálat: ${matchResult.szamla_id}`);

  } else {
    // Gyenge egyezés → párosítatlan
    await this.updateStatus(bankTrxId, TranzakcioStatusz.PAROSÍTATLAN);
  }
}
```

---

## 🔄 Folyamat (P5 - Automatizált Elszámolás)

### P5.1 Adatfogadás (Bank/Futár API Szinkronizálás)

#### Cron Job: Óránkénti Szinkronizálás

```typescript
@Cron('0 */1 * * *')  // Óránként egyszer
async syncBankTransactions(): Promise<void> {

  const apis = await this.kulsoPartnerApiRepo.find({
    where: { aktiv: true, api_type: 'Bank' }
  });

  for (const api of apis) {
    try {
      const transactions = await this.fetchTransactions(api);

      for (const trx of transactions) {
        await this.importTransaction(trx, api);
      }

      api.utolso_szinkronizalas = new Date();
      await this.kulsoPartnerApiRepo.save(api);

    } catch (error) {
      this.logger.error(`Szinkronizálás hiba: ${api.partner_nev}`, error);
    }
  }
}

async fetchTransactions(api: KulsoPartnerApi): Promise<any[]> {
  switch (api.partner_nev) {
    case 'OTP Bank':
      return await this.otpService.getStatements(api.credentials);
    case 'K&H Bank':
      return await this.khService.getStatements(api.credentials);
    default:
      throw new Error(`Nem támogatott API: ${api.partner_nev}`);
  }
}
```

#### OTP Bank API Integráció (Példa)

```typescript
@Injectable()
export class OtpBankService {

  async getStatements(credentials: any): Promise<BankStatement[]> {
    // OAuth2 token lekérés
    const token = await this.getOAuthToken(
      credentials.client_id,
      credentials.client_secret
    );

    // API hívás
    const response = await axios.get(
      'https://api.otpbank.hu/v1/accounts/12345678/statements',
      {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          from: subDays(new Date(), 1),  // Tegnap óta
          to: new Date(),
        }
      }
    );

    // Normalize data
    return response.data.transactions.map(trx => ({
      kulso_tranzakcio_id: trx.transactionId,
      osszeg: trx.amount,
      datum: new Date(trx.valueDate),
      kulso_partner_nev: trx.counterpartyName,
      kulso_partner_szamlaszam: trx.counterpartyAccount,
      kozlemeny: trx.remittanceInfo,
      forras: 'Bank',
    }));
  }

  private async getOAuthToken(clientId: string, clientSecret: string): Promise<string> {
    const response = await axios.post(
      'https://auth.otpbank.hu/oauth2/token',
      new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: clientId,
        client_secret: clientSecret,
      })
    );

    return response.data.access_token;
  }
}
```

---

### P5.2 Automatikus Párosítás (Háttérfolyamat)

```typescript
@Injectable()
export class ReconciliationWorker {

  @Cron('*/5 * * * *')  // 5 percenként
  async processUnmatchedTransactions(): Promise<void> {

    const unmatchedTrx = await this.bankTranzakcioRepo.find({
      where: {
        statusz: 'Párosítatlan',
        created_at: MoreThan(subDays(new Date(), 30))  // Max 30 napos
      },
      order: { created_at: 'DESC' },
      take: 50,  // Batch processing
    });

    for (const trx of unmatchedTrx) {
      await this.bankReconciliationService.processTransaction(trx.id);
    }
  }
}
```

---

### P5.3 Dashboard UI (Eltérések Megjelenítése)

#### React Frontend Komponens

```tsx
import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Button,
  Alert,
} from '@mui/material';
import { CheckCircle, Warning, Error } from '@mui/icons-material';

interface ReconciliationDashboardProps {}

export function ReconciliationDashboard() {
  const [summary, setSummary] = useState({
    paired: 0,
    deviation: 0,
    unmatched: 0,
  });

  const [transactions, setTransactions] = useState<BankTranzakcio[]>([]);

  useEffect(() => {
    fetchSummary();
    fetchTransactions();
  }, []);

  const fetchSummary = async () => {
    const response = await api.get('/bank-reconciliation/summary');
    setSummary(response.data);
  };

  const fetchTransactions = async () => {
    const response = await api.get('/bank-reconciliation/transactions', {
      params: { statusz: 'Eltérés' }  // Csak eltérések
    });
    setTransactions(response.data);
  };

  const getStatusChip = (statusz: string, pontszam: number) => {
    switch (statusz) {
      case 'Párosított':
        return <Chip icon={<CheckCircle />} label={`${pontszam}% - Párosítva`} color="success" />;
      case 'Eltérés':
        return <Chip icon={<Warning />} label={`${pontszam}% - Ellenőrzés`} color="warning" />;
      case 'Párosítatlan':
        return <Chip icon={<Error />} label={`${pontszam}% - Ismeretlen`} color="error" />;
      default:
        return <Chip label="Manuális" />;
    }
  };

  const handleApprove = async (trxId: string, szamlaId: string) => {
    await api.post(`/bank-reconciliation/${trxId}/approve`, { szamlaId });
    fetchSummary();
    fetchTransactions();
  };

  return (
    <Box>
      {/* Summary Cards */}
      <Box display="flex" gap={2} mb={3}>
        <Card sx={{ flex: 1, p: 2, bgcolor: '#e8f5e9' }}>
          <Typography variant="h4">{summary.paired}</Typography>
          <Typography variant="body2">✅ Automatikusan párosítva</Typography>
        </Card>

        <Card sx={{ flex: 1, p: 2, bgcolor: '#fff3e0' }}>
          <Typography variant="h4">{summary.deviation}</Typography>
          <Typography variant="body2">⚠️ Eltérés (vizsgálat szükséges)</Typography>
        </Card>

        <Card sx={{ flex: 1, p: 2, bgcolor: '#ffebee' }}>
          <Typography variant="h4">{summary.unmatched}</Typography>
          <Typography variant="body2">❌ Párosítatlan (manuális)</Typography>
        </Card>
      </Box>

      {/* Deviation Table */}
      {summary.deviation > 0 && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {summary.deviation} tranzakció vár manuális ellenőrzésre!
        </Alert>
      )}

      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Dátum</TableCell>
            <TableCell>Partner</TableCell>
            <TableCell>Közlemény</TableCell>
            <TableCell align="right">Összeg</TableCell>
            <TableCell>Javasolt Számla</TableCell>
            <TableCell>Státusz</TableCell>
            <TableCell>Művelet</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {transactions.map(trx => (
            <TableRow key={trx.id}>
              <TableCell>{format(new Date(trx.datum), 'yyyy-MM-dd')}</TableCell>
              <TableCell>{trx.kulso_partner_nev}</TableCell>
              <TableCell>{trx.kozlemeny}</TableCell>
              <TableCell align="right">
                {trx.osszeg.toLocaleString()} Ft
              </TableCell>
              <TableCell>
                {trx.suggested_szamla?.szamlaszam || '—'}
              </TableCell>
              <TableCell>
                {getStatusChip(trx.statusz, trx.parositas_pontszam)}
              </TableCell>
              <TableCell>
                {trx.suggested_szamla && (
                  <Button
                    size="small"
                    variant="contained"
                    onClick={() => handleApprove(trx.id, trx.suggested_szamla.id)}
                  >
                    Jóváhagyás
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Box>
  );
}
```

---

### P5.4 Manuális Rögzítés (Admin UI)

```tsx
export function ManualMatchingDialog({ trxId, onClose }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [invoices, setInvoices] = useState<Szamla[]>([]);

  const handleSearch = async () => {
    const response = await api.get('/szamla/search', {
      params: { q: searchTerm, statusz: 'Függőben' }
    });
    setInvoices(response.data);
  };

  const handleLink = async (szamlaId: string) => {
    await api.post(`/bank-reconciliation/${trxId}/manual-link`, { szamlaId });
    onClose();
  };

  return (
    <Dialog open onClose={onClose}>
      <DialogTitle>Manuális Párosítás</DialogTitle>
      <DialogContent>
        <TextField
          label="Számlaszám keresés"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
        />

        <List>
          {invoices.map(inv => (
            <ListItem key={inv.id}>
              <ListItemText
                primary={inv.szamlaszam}
                secondary={`${inv.vegosszeg} Ft - ${inv.ugyfelnev}`}
              />
              <Button onClick={() => handleLink(inv.id)}>
                Párosítás
              </Button>
            </ListItem>
          ))}
        </List>
      </DialogContent>
    </Dialog>
  );
}
```

---

### P5.5 Automatikus Lezárás

A `BankReconciliationService.autoPair()` metódus már implementálja (lásd fent).

---

## 🔌 Külső Integrációk

### Támogatott Bankok (MVP)

#### 1. **OTP Bank**
- **API:** [OTP Developer Portal](https://developer.otpbank.hu/)
- **Auth:** OAuth 2.0 (Client Credentials)
- **Endpoint:** `/v1/accounts/{accountId}/statements`
- **Format:** JSON
- **Limit:** 1000 tranzakció/request

#### 2. **K&H Bank**
- **API:** [K&H Corporate API](https://www.kh.hu/vallalatok/api)
- **Auth:** X.509 Certificate (mTLS)
- **Endpoint:** `/corporate/statements`
- **Format:** XML (ISO 20022 CAMT.053)
- **Limit:** 500 tranzakció/request

#### 3. **Raiffeisen Bank**
- **API:** Custom REST API (szerződéses)
- **Auth:** API Key
- **Format:** CSV export via SFTP
- **Limit:** Naponta 1x automatikus letöltés

---

### Támogatott Futárok (V2)

#### 1. **GLS Futár**
- **API:** [GLS ParcelShop API](https://gls-group.eu/api)
- **Endpoint:** `/settlement/cod-payments`
- **Format:** JSON
- **Gyakoriság:** Naponta 1x (COD elszámolás)

#### 2. **MPL (Magyar Posta Logisztika)**
- **API:** Email alapú CSV export
- **Feldolgozás:** Email attachment parser
- **Gyakoriság:** Heti 1x

---

### Fallback: CSV Import

Ha nincs API elérhető:

```typescript
@Post('/import-csv')
@UseInterceptors(FileInterceptor('file'))
async importCsv(@UploadedFile() file: Express.Multer.File) {

  const csvData = await this.parseCsv(file.buffer);

  for (const row of csvData) {
    await this.bankTranzakcioRepo.create({
      kulso_tranzakcio_id: row['Tranzakció ID'],
      osszeg: parseFloat(row['Összeg']),
      datum: new Date(row['Dátum']),
      kulso_partner_nev: row['Partner'],
      kozlemeny: row['Közlemény'],
      forras: 'Bank',
      statusz: 'Párosítatlan',
    }).save();
  }

  return { success: true, imported: csvData.length };
}
```

---

## 📊 Riportok és KPI-k

### 1. Napi Összefoglaló Email

```typescript
@Cron('0 8 * * *')  // Reggel 8:00
async sendDailyReport(): Promise<void> {

  const yesterday = subDays(new Date(), 1);

  const stats = await this.bankTranzakcioRepo
    .createQueryBuilder('bt')
    .select('bt.statusz, COUNT(*) as count, SUM(bt.osszeg) as total')
    .where('bt.datum = :date', { date: yesterday })
    .groupBy('bt.statusz')
    .getRawMany();

  const emailBody = `
    <h2>Banki Elszámolás - Napi Riport (${format(yesterday, 'yyyy-MM-dd')})</h2>
    <ul>
      <li>✅ Automatikusan párosítva: ${stats['Párosított']?.count || 0} db (${stats['Párosított']?.total || 0} Ft)</li>
      <li>⚠️ Eltérés (review): ${stats['Eltérés']?.count || 0} db</li>
      <li>❌ Párosítatlan: ${stats['Párosítatlan']?.count || 0} db</li>
    </ul>
    <p>Ellenőrzéshez: <a href="https://erp.kgc.hu/penzugy/reconciliation">Dashboard megnyitása</a></p>
  `;

  await this.emailService.send({
    to: 'penzugy@kgc.hu',
    subject: `Banki Elszámolás Riport - ${format(yesterday, 'MMM dd')}`,
    html: emailBody,
  });
}
```

---

### 2. Performance Metrics Dashboard

```sql
-- Párosítási pontosság (utolsó 30 nap)
SELECT
  DATE(created_at) as datum,
  COUNT(*) as osszes,
  SUM(CASE WHEN statusz = 'Párosított' THEN 1 ELSE 0 END) as auto_parosított,
  ROUND(
    SUM(CASE WHEN statusz = 'Párosított' THEN 1 ELSE 0 END)::DECIMAL / COUNT(*) * 100,
    2
  ) as pontossag_szazalek
FROM bank_tranzakcio
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY datum DESC;

-- Átlagos párosítási pontszám státuszonként
SELECT
  statusz,
  COUNT(*) as db,
  ROUND(AVG(parositas_pontszam), 1) as atlag_pontszam,
  MIN(parositas_pontszam) as min_pontszam,
  MAX(parositas_pontszam) as max_pontszam
FROM bank_tranzakcio
WHERE parositas_pontszam > 0
GROUP BY statusz;
```

---

## 🧪 Tesztelési Stratégia

### Unit Tesztek

```typescript
describe('BankReconciliationService', () => {

  describe('calculateScore', () => {
    it('should give 95 points for perfect match', () => {
      const bankTrx = {
        osszeg: 125000,
        datum: new Date('2025-01-29'),
        kozlemeny: 'Számla: INV-2025-001234',
        kulso_partner_nev: 'KOVÁCS JÁNOS',
      };

      const szamla = {
        szamlaszam: 'INV-2025-001234',
        vegosszeg: 125000,
        kiallitas_datum: new Date('2025-01-29'),
        ugyfelnev: 'Kovács János',
      };

      const score = service.calculateScore(bankTrx, szamla);

      expect(score.pontszam).toBe(95);
      expect(score.reszletek.kozlemeny_match).toBe(50);
      expect(score.reszletek.osszeg_match).toBe(30);
      expect(score.reszletek.datum_match).toBe(5);
    });

    it('should detect partial payment (50%)', () => {
      const bankTrx = { osszeg: 50000, kozlemeny: 'INV-2025-001234 részlet' };
      const szamla = { szamlaszam: 'INV-2025-001234', vegosszeg: 100000 };

      const score = service.calculateScore(bankTrx, szamla);

      expect(score.reszletek.osszeg_match).toBe(15);  // Fél pont részletfizetésért
    });
  });

  describe('extractInvoiceNumber', () => {
    it('should extract invoice number from common formats', () => {
      expect(service.extractInvoiceNumber('Számla: INV-2025-001234')).toBe('INV-2025-001234');
      expect(service.extractInvoiceNumber('inv-2025-999999 fizetés')).toBe('INV-2025-999999');
      expect(service.extractInvoiceNumber('Random text')).toBeNull();
    });
  });
});
```

---

### Integration Tesztek

```typescript
describe('Bank API Integration', () => {

  it('should fetch OTP Bank transactions', async () => {
    const mockApi = {
      partner_nev: 'OTP Bank',
      credentials: { client_id: 'test', client_secret: 'secret' },
    };

    const transactions = await otpService.getStatements(mockApi.credentials);

    expect(transactions).toBeInstanceOf(Array);
    expect(transactions[0]).toHaveProperty('kulso_tranzakcio_id');
    expect(transactions[0]).toHaveProperty('osszeg');
  });
});
```

---

### E2E Teszt Szcenáriók

#### Szcenárió 1: Tökéletes Egyezés (Auto-Pair)

```gherkin
Feature: Automatikus párosítás

  Scenario: Banki tranzakció érkezik egyértelmű számlaszámmal
    Given van egy "Függőben" státuszú számla "INV-2025-001234" számlaszámmal
    And a számla összege 125000 Ft
    When beérkezik egy banki tranzakció:
      | Összeg    | 125000 Ft                 |
      | Közlemény | "Számla: INV-2025-001234" |
      | Dátum     | 2025-01-29                |
    Then a párosítási pontszám 95
    And a banki tranzakció státusza "Párosított"
    And a számla státusza "Fizetve"
    And email megy az ügyfélnek "Fizetése megérkezett"
```

#### Szcenárió 2: Részletfizetés (Eltérés)

```gherkin
  Scenario: Ügyfél részletfizetést teljesít
    Given van egy "Függőben" státuszú számla "INV-2025-005678" számlaszámmal
    And a számla összege 300000 Ft
    When beérkezik egy banki tranzakció:
      | Összeg    | 100000 Ft                    |
      | Közlemény | "INV-2025-005678 részlet 1/3"|
    Then a párosítási pontszám 65
    And a banki tranzakció státusza "Eltérés"
    And a pénzügyes kap emailt "Részletfizetés vizsgálat"
```

#### Szcenárió 3: Ismeretlen Tranzakció

```gherkin
  Scenario: Tévedésből érkező befizetés
    When beérkezik egy banki tranzakció:
      | Összeg    | 15000 Ft         |
      | Közlemény | "Tévedés?"       |
      | Partner   | "ISMERETLEN"     |
    Then a párosítási pontszám 0
    And a banki tranzakció státusza "Párosítatlan"
    And megjelenik az admin dashboard "Párosítatlan" listában
```

---

## 🔒 Biztonsági Megfontolások

### 1. API Credential Titkosítás

```typescript
import * as crypto from 'crypto';

@Injectable()
export class EncryptionService {

  private algorithm = 'aes-256-cbc';
  private key = process.env.ENCRYPTION_KEY;  // 32 byte környezeti változó

  encrypt(text: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.algorithm, Buffer.from(this.key), iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    return `${iv.toString('hex')}:${encrypted}`;
  }

  decrypt(encryptedText: string): string {
    const [ivHex, encrypted] = encryptedText.split(':');
    const iv = Buffer.from(ivHex, 'hex');

    const decipher = crypto.createDecipheriv(this.algorithm, Buffer.from(this.key), iv);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }
}

// Használat
await this.kulsoPartnerApiRepo.save({
  partner_nev: 'OTP Bank',
  credentials: this.encryptionService.encrypt(JSON.stringify({
    client_id: 'kgc_prod',
    client_secret: 'supersecret123',
  })),
});
```

---

### 2. Role-Based Access Control (RBAC)

```typescript
@Controller('/bank-reconciliation')
@UseGuards(RoleGuard)
export class BankReconciliationController {

  @Get('/dashboard')
  @Roles('Pénzügyes', 'Admin')
  async getDashboard() {
    // Csak pénzügyes és admin láthatja
  }

  @Post('/:id/approve')
  @Roles('Pénzügyes_Vezető', 'Admin')
  async approveMatch(@Param('id') id: string) {
    // Csak vezető pénzügyes hagyhatja jóvá
  }
}
```

---

### 3. Audit Trail

Minden művelet naplózva a `parositas_audit_log` táblában:
- Ki (felhasznalo_id)
- Mikor (timestamp)
- Mit (akcio, regi_statusz → uj_statusz)
- Miért (megjegyzes, reszletek)

---

## 📐 Teljesítmény Optimalizálás

### 1. Indexelés

```sql
-- Gyors párosítás keresés
CREATE INDEX idx_szamla_szamlaszam_statusz ON kgc.szamla(szamlaszam, statusz);
CREATE INDEX idx_szamla_osszeg_datum ON kgc.szamla(vegosszeg, kiallitas_datum);

-- Full-text search a közleményre
CREATE INDEX idx_bank_trx_kozlemeny_gin ON kgc.bank_tranzakcio USING GIN(to_tsvector('hungarian', kozlemeny));

-- Gyors összesítés a dashboard-hoz
CREATE INDEX idx_bank_trx_statusz_datum ON kgc.bank_tranzakcio(statusz, datum);
```

---

### 2. Batch Processing

Nem egyesével, hanem 50-es csomagokban dolgozzuk fel a tranzakciókat:

```typescript
const unmatched = await this.repo.find({
  where: { statusz: 'Párosítatlan' },
  take: 50  // Batch size
});

await Promise.all(
  unmatched.map(trx => this.processTransaction(trx.id))
);
```

---

### 3. Caching

```typescript
@Injectable()
export class SzamlaCacheService {

  @Cache('pending-invoices', 60)  // 60 sec TTL
  async getPendingInvoices(): Promise<Szamla[]> {
    return await this.szamlaRepo.find({
      where: { statusz: 'Függőben' }
    });
  }
}
```

---

## 📅 Implementációs Ütemterv

### Sprint Breakdown (5 hét, 21 SP)

#### **Sprint 1: Alapinfrastruktúra (Hét 1, 5 SP)**
- ✅ Adatmodell létrehozása (`bank_tranzakcio`, `kulso_partner_api`)
- ✅ Encryption service implementáció
- ✅ Basic CRUD API-k
- ✅ Unit tesztek (párosítási logika)

#### **Sprint 2: OTP Bank API Integráció (Hét 2, 5 SP)**
- ✅ OAuth 2.0 authentication
- ✅ Statements lekérés implementáció
- ✅ Cron job szinkronizálás
- ✅ Error handling + retry logika
- ✅ CSV fallback import

#### **Sprint 3: Párosítási Motor (Hét 3, 5 SP)**
- ✅ Pontozási algoritmus (weighted scoring)
- ✅ Fuzzy matching (partner név)
- ✅ Részletfizetés detektálás
- ✅ State machine (Párosítatlan → Eltérés → Párosított)
- ✅ Automatikus lezárás (számla státusz frissítés)

#### **Sprint 4: Dashboard UI (Hét 4, 3 SP)**
- ✅ Summary Cards (zöld/sárga/piros)
- ✅ Eltérések táblázat
- ✅ Manuális párosítás modal
- ✅ Approve/Reject akciók
- ✅ Real-time frissítés (WebSocket vagy polling)

#### **Sprint 5: Riportok + Testing (Hét 5, 3 SP)**
- ✅ Napi összefoglaló email
- ✅ Performance metrics dashboard
- ✅ E2E tesztek (Playwright)
- ✅ Load testing (100 tranzakció/perc)
- ✅ Dokumentáció frissítés

---

### MVP Scope (Week 1-3)

**IN:**
- ✅ OTP Bank API integráció
- ✅ Alapvető párosítás (számlaszám + összeg)
- ✅ Dashboard (summary + eltérések lista)
- ✅ CSV import fallback

**OUT (V2):**
- ⏳ K&H Bank, Raiffeisen API
- ⏳ Futár elszámolás (GLS, MPL)
- ⏳ AI-powered fuzzy matching (ML model)
- ⏳ Részletfizetés automatikus kezelése

---

## 💰 ROI Kalkuláció

### Jelenlegi Állapot (Manuális)

| Metrika | Érték |
|---------|-------|
| Pénzügyes időráfordítás | 2 óra/nap |
| Havi munkaidő | 40 óra/hó (20 munkanap) |
| Átlagos órabér | 4000 Ft/óra |
| **Havi költség** | **160.000 Ft** |
| Hibaarány | 15-20% |
| Átlagos hiba költsége | 10.000 Ft (utólagos javítás) |
| Havi hibák száma | ~5-8 db |
| **Hiba költség/hó** | **60.000 Ft** |
| **ÖSSZES KÖLTSÉG/HÓ** | **220.000 Ft** |

---

### Jövőbeni Állapot (Automatizált)

| Metrika | Érték |
|---------|-------|
| Pénzügyes időráfordítás | 45 perc/nap (csak eltérések) |
| Havi munkaidő | 15 óra/hó |
| **Havi költség** | **60.000 Ft** |
| Hibaarány | 3-5% (automatizált pontosság) |
| Havi hibák száma | ~1-2 db |
| **Hiba költség/hó** | **15.000 Ft** |
| **ÖSSZES KÖLTSÉG/HÓ** | **75.000 Ft** |

---

### Megtakarítás

| Metrika | Érték |
|---------|-------|
| **Havi megtakarítás** | **145.000 Ft** |
| **Éves megtakarítás** | **1.740.000 Ft** |
| Fejlesztési költség (5 hét, 2 dev) | ~2.500.000 Ft |
| **Megtérülési idő** | **17 hónap** |

---

## 🎯 Sikerkritériumok

### Acceptance Criteria

1. ✅ **90%+ automatikus párosítás:** A tranzakciók legalább 90%-a automatikusan párosítva (≥90 pont)
2. ✅ **<10% eltérés:** Maximum 10% igényel manuális review (70-89 pont)
3. ✅ **Real-time szinkronizálás:** Banki tranzakciók max 1 órás késéssel jelennek meg
4. ✅ **<1% hibaarány:** Automatikus párosítások pontossága 99%+
5. ✅ **Gyors review:** Pénzügyes egy eltérést max 2 perc alatt ellenőriz
6. ✅ **Audit trail:** Minden párosítás 100%-ban naplózva (ki, mikor, pontszám)

---

### KPI Tracking (3 hónapos pilot)

| KPI | Cél | Mérés |
|-----|-----|-------|
| Automatikus párosítási arány | ≥90% | `COUNT(Párosított) / COUNT(*)` |
| Átlagos párosítási pontszám | ≥85 | `AVG(parositas_pontszam)` |
| Pénzügyes review idő | <30 perc/nap | Manuális mérés |
| Hibák száma | <2 db/hó | Audit log elemzés |
| Felhasználói elégedettség | ≥4.5/5 | Survey |

---

## 🚀 Kockázatok és Mitigáció

| Kockázat | Valószínűség | Hatás | Mitigáció |
|----------|--------------|-------|-----------|
| **Bank API változás** | Közepes | Magas | Verzió pinning, notification webhook, fallback CSV |
| **Rossz párosítás (false positive)** | Alacsony | Magas | 90%-os threshold, audit log, email értesítés |
| **API downtime** | Közepes | Közepes | CSV fallback, retry logika, monitoring + alert |
| **Performance degradáció (sok tranzakció)** | Alacsony | Közepes | Batch processing, indexelés, async queue (Bull) |
| **Biztonsági incidens (API credential leak)** | Alacsony | Kritikus | Titkosítás (AES-256), role-based access, audit log |

---

## 📚 Kapcsolódó Dokumentumok

- **Folyamat:** [05-penzugy-folyamat.md](../Flows/05-penzugy-folyamat.md)
- **Fit-Gap Analízis:** [KGC-ERP-v3-Fit-Gap-Analízis-2025-12-29.md](../KGC-ERP-v3-Fit-Gap-Analízis-2025-12-29.md), sor 225-332
- **API Dokumentáció:** [OTP Developer Portal](https://developer.otpbank.hu/), [K&H API](https://www.kh.hu/vallalatok/api)

---

## 🏁 Összefoglalás

Az **Automatikus Banki/Futár Elszámolás** feature **kritikus üzleti értéket** képvisel a KGC ERP számára:

- 🎯 **60% időmegtakarítás** a pénzügyi folyamatokban (2h → 45 perc/nap)
- ✅ **80% hibaarány csökkenés** (automatizált pontosság)
- 💰 **1.74M Ft/év megtakarítás** (17 hónap ROI)
- 🔄 **Real-time cash flow** láthatóság
- 🔗 **Skálázható architektúra** (100+ tranzakció/nap)

**Technikai megvalósítás:**
- Intelligens **pontozási algoritmus** (weighted scoring: 0-100)
- **Multi-bank integráció** (OTP, K&H, Raiffeisen + CSV fallback)
- **3-szintű döntési logika** (Zöld/Sárga/Piros)
- Teljes **audit trail** és szerepkör-alapú hozzáférés

**Implementáció:** 5 hét, 13-21 SP, 2 fejlesztő

---

**Következő lépés:** Excalidraw flowchart diagram készítése a P5 folyamatról.
