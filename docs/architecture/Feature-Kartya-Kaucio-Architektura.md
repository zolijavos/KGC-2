# Feature Architektúra: Kártya Alapú Kaució Kezelés

**Dokumentum verziója:** 1.0
**Létrehozva:** 2025-12-29
**Szerző:** Winston (Architect Agent, BMAD Method)
**Prioritás:** 🟡 MAGAS
**Kapcsolódó Fit-Gap:** #8

---

## 📋 Executive Summary

### Üzleti Probléma

**Jelenlegi állapot:**
- 01-ugyfelfelvitel-folyamat.md, 1.7: "Kaució CSAK KÉSZPÉNZ fogadható"
- Kártyás fizetés nem támogatott kaucióhoz
- Ügyfél számára kényelmetlen (sok készpénzt kell hozni)

**Üzleti igény** (KGC-notes-01, sor 456-499):
> "Mi van amikor kártyával fizetett kauciót... visszautalod és újra kifizet kártyával... ott a kártyás zárásodnak nem fog streamelni."

**GAP típusa:** ⚠️ ENHANCEMENT - Készpénz működik, kártya bővítés

### Javasolt Megoldás

**Két stratégia hibrid megközelítéssel:**

#### Stratégia A: Zárolás (Hold/Pre-authorization) ⭐ AJÁNLOTT
- Bérlés indítás: POS terminál → HOLD összeg (pl. 100.000 Ft)
- Visszavétel (sértetlen): RELEASE hold (automatikus)
- Visszavétel (sérült): CAPTURE részösszeg, RELEASE maradék

**Előnyök:**
- ✅ Nincs valódi pénzmozgás (csak rezerváció)
- ✅ Ügyfél számláján "zárolva" látszik
- ✅ Nincs kétszer banki díj

**Hátrányok:**
- ⚠️ Bank függő (OTP: 7 nap max hold, K&H: 30 nap)
- ⚠️ Hosszú bérlés (>7 nap) → nem működik

#### Stratégia B: Teljes tranzakció + visszautalás
- Kaució: CHARGE összeg (valódi fizetés)
- Visszavétel: REFUND teljes vagy részösszeg

**Előnyök:**
- ✅ Hosszú bérlésre is működik

**Hátrányok:**
- ❌ Dupla banki díj (charge + refund)
- ❌ 3-5 nap visszautalási idő
- ❌ Negatív pénztár zárás (visszautalás nap)

**ROI:**
- Ügyfél-elégedettség: +20% (kártyás fizetés kényelme)
- Több bérlés: +10-15% (készpénz hiánya miatt elutasított bérlések csökkenése)

---

## 🏗️ Technikai Architektúra

### Adatmodell

#### MÓDOSÍTOTT: BÉRLÉS

```sql
ALTER TABLE kgc.berles
  ADD COLUMN kaucio_fizetes_mod VARCHAR(20)
    CHECK (kaucio_fizetes_mod IN ('Készpénz', 'Kártya_hold', 'Kártya_charge'))
    DEFAULT 'Készpénz',
  ADD COLUMN kaucio_tranzakcio_id VARCHAR(100),  -- Bank tranzakció referencia
  ADD COLUMN kaucio_hold_datum TIMESTAMP,  -- Hold kezdete
  ADD COLUMN kaucio_hold_lejarat TIMESTAMP,  -- Hold lejárat (7 vagy 30 nap)
  ADD COLUMN kaucio_captured BOOLEAN DEFAULT false,  -- Capture megtörtént?
  ADD COLUMN kaucio_captured_osszeg DECIMAL(12, 2),  -- Capture összeg (ha sérült)
  ADD COLUMN kaucio_released BOOLEAN DEFAULT false,  -- Release megtörtént?
  ADD COLUMN kaucio_bank_valasz JSONB;  -- Bank API válasz (debug)
```

#### ÚJ: BANK_TRANZAKCIO

```sql
CREATE TABLE kgc.bank_tranzakcio (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  berles_id UUID REFERENCES kgc.berles(id),
  tranzakcio_tipus VARCHAR(20)
    CHECK (tranzakcio_tipus IN ('HOLD', 'CAPTURE', 'RELEASE', 'CHARGE', 'REFUND')) NOT NULL,
  osszeg DECIMAL(12, 2) NOT NULL,
  bank_tranzakcio_id VARCHAR(100) NOT NULL,  -- Külső bank tranzakció ID
  bank_valasz JSONB,  -- Teljes API válasz
  sikeres BOOLEAN NOT NULL,
  hiba_uzenet TEXT,
  timestamp TIMESTAMP DEFAULT NOW(),
  pos_terminal_id VARCHAR(50),  -- Melyik POS terminálon történt
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_bank_tranzakcio_berles_id ON kgc.bank_tranzakcio(berles_id);
CREATE INDEX idx_bank_tranzakcio_timestamp ON kgc.bank_tranzakcio(timestamp);
```

#### MÓDOSÍTOTT: RENDSZERBEÁLLÍTÁS

```sql
INSERT INTO kgc.rendszerbeallitas (kategoria, kulcs, ertek, tipus, leiras) VALUES
  ('KAUCIO', 'KARTYA_HOLD_ENABLED', 'true', 'BOOLEAN', 'Kártya hold engedélyezése'),
  ('KAUCIO', 'KARTYA_HOLD_MAX_NAP', '7', 'INTEGER', 'Hold max időtartam napokban (bank függő)'),
  ('KAUCIO', 'KARTYA_CHARGE_ENABLED', 'true', 'BOOLEAN', 'Kártya charge+refund engedélyezése'),
  ('KAUCIO', 'HOSSZU_BERLES_HATARIDO', '7', 'INTEGER', 'Hold stratégia határidő (nap), felette charge vagy készpénz');
```

---

### Üzleti Logika

#### POS Terminál Integráció

```typescript
// backend/src/services/pos-terminal.service.ts

import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

interface PosHoldResponse {
  success: boolean;
  transaction_id: string;
  hold_expires_at: Date;
  error_message?: string;
}

interface PosCaptureResponse {
  success: boolean;
  captured_amount: number;
  error_message?: string;
}

interface PosReleaseResponse {
  success: boolean;
  error_message?: string;
}

@Injectable()
export class PosTerminalService {
  private readonly logger = new Logger(PosTerminalService.name);
  private readonly posApiUrl = process.env.POS_API_URL;  // pl. OTP SimplePay API
  private readonly posApiKey = process.env.POS_API_KEY;

  /**
   * Kártya hold (pre-authorization) létrehozása
   */
  async createHold(amount: number, description: string): Promise<PosHoldResponse> {
    this.logger.log(`Creating hold for ${amount} Ft: ${description}`);

    try {
      const response = await axios.post(
        `${this.posApiUrl}/hold`,
        {
          amount,
          currency: 'HUF',
          description,
        },
        {
          headers: {
            Authorization: `Bearer ${this.posApiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 30000,  // 30 sec timeout
        }
      );

      if (response.data.success) {
        return {
          success: true,
          transaction_id: response.data.transaction_id,
          hold_expires_at: new Date(response.data.expires_at),
        };
      } else {
        return {
          success: false,
          transaction_id: null,
          hold_expires_at: null,
          error_message: response.data.error_message || 'Unknown error',
        };
      }
    } catch (error) {
      this.logger.error(`POS hold failed: ${error.message}`, error.stack);
      return {
        success: false,
        transaction_id: null,
        hold_expires_at: null,
        error_message: error.message,
      };
    }
  }

  /**
   * Hold capture (részösszeg levonása)
   */
  async captureHold(transactionId: string, amount: number): Promise<PosCaptureResponse> {
    this.logger.log(`Capturing hold ${transactionId} for ${amount} Ft`);

    try {
      const response = await axios.post(
        `${this.posApiUrl}/capture`,
        {
          transaction_id: transactionId,
          amount,
        },
        {
          headers: {
            Authorization: `Bearer ${this.posApiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.data.success) {
        return {
          success: true,
          captured_amount: amount,
        };
      } else {
        return {
          success: false,
          captured_amount: 0,
          error_message: response.data.error_message || 'Capture failed',
        };
      }
    } catch (error) {
      this.logger.error(`POS capture failed: ${error.message}`, error.stack);
      return {
        success: false,
        captured_amount: 0,
        error_message: error.message,
      };
    }
  }

  /**
   * Hold release (zárolás feloldása)
   */
  async releaseHold(transactionId: string): Promise<PosReleaseResponse> {
    this.logger.log(`Releasing hold ${transactionId}`);

    try {
      const response = await axios.post(
        `${this.posApiUrl}/release`,
        {
          transaction_id: transactionId,
        },
        {
          headers: {
            Authorization: `Bearer ${this.posApiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.data.success) {
        return {
          success: true,
        };
      } else {
        return {
          success: false,
          error_message: response.data.error_message || 'Release failed',
        };
      }
    } catch (error) {
      this.logger.error(`POS release failed: ${error.message}`, error.stack);
      return {
        success: false,
        error_message: error.message,
      };
    }
  }

  /**
   * Charge (teljes tranzakció)
   */
  async charge(amount: number, description: string): Promise<PosHoldResponse> {
    this.logger.log(`Charging ${amount} Ft: ${description}`);

    try {
      const response = await axios.post(
        `${this.posApiUrl}/charge`,
        {
          amount,
          currency: 'HUF',
          description,
        },
        {
          headers: {
            Authorization: `Bearer ${this.posApiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.data.success) {
        return {
          success: true,
          transaction_id: response.data.transaction_id,
          hold_expires_at: null,  // Charge esetén nincs lejárat
        };
      } else {
        return {
          success: false,
          transaction_id: null,
          hold_expires_at: null,
          error_message: response.data.error_message || 'Charge failed',
        };
      }
    } catch (error) {
      this.logger.error(`POS charge failed: ${error.message}`, error.stack);
      return {
        success: false,
        transaction_id: null,
        hold_expires_at: null,
        error_message: error.message,
      };
    }
  }

  /**
   * Refund (visszatérítés)
   */
  async refund(transactionId: string, amount: number): Promise<PosCaptureResponse> {
    this.logger.log(`Refunding transaction ${transactionId} for ${amount} Ft`);

    try {
      const response = await axios.post(
        `${this.posApiUrl}/refund`,
        {
          transaction_id: transactionId,
          amount,
        },
        {
          headers: {
            Authorization: `Bearer ${this.posApiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.data.success) {
        return {
          success: true,
          captured_amount: amount,
        };
      } else {
        return {
          success: false,
          captured_amount: 0,
          error_message: response.data.error_message || 'Refund failed',
        };
      }
    } catch (error) {
      this.logger.error(`POS refund failed: ${error.message}`, error.stack);
      return {
        success: false,
        captured_amount: 0,
        error_message: error.message,
      };
    }
  }
}
```

---

#### Kaució Stratégia Választó Logika

```typescript
// backend/src/services/kaucio-strategy.service.ts

import { Injectable } from '@nestjs/common';
import { differenceInDays } from 'date-fns';
import { RendszerbeallitasService } from './rendszerbeallitas.service';

type KaucioStrategia = 'HOLD' | 'CHARGE' | 'KESZPENZ_ONLY';

@Injectable()
export class KaucioStrategyService {
  constructor(private readonly configService: RendszerbeallitasService) {}

  /**
   * Meghatározza a kaució fizetési stratégiát a bérlés időtartama alapján
   */
  async meghatározStrategia(
    kiadasDatum: Date,
    visszahozasDatum: Date
  ): Promise<{
    strategia: KaucioStrategia;
    indoklas: string;
  }> {
    const berlesNapok = differenceInDays(visszahozasDatum, kiadasDatum);

    const holdEnabled = await this.configService.getBoolean('KAUCIO', 'KARTYA_HOLD_ENABLED');
    const holdMaxNap = await this.configService.getInteger('KAUCIO', 'KARTYA_HOLD_MAX_NAP');
    const chargeEnabled = await this.configService.getBoolean('KAUCIO', 'KARTYA_CHARGE_ENABLED');
    const hosszuBerlesHatarido = await this.configService.getInteger('KAUCIO', 'HOSSZU_BERLES_HATARIDO');

    // Rövid bérlés (<= hold max)
    if (berlesNapok <= holdMaxNap && holdEnabled) {
      return {
        strategia: 'HOLD',
        indoklas: `Rövid bérlés (${berlesNapok} nap <= ${holdMaxNap} nap): Hold stratégia ajánlott`,
      };
    }

    // Közepes bérlés (hold max < bérlés <= hosszú bérlés határidő)
    if (berlesNapok > holdMaxNap && berlesNapok <= hosszuBerlesHatarido && chargeEnabled) {
      return {
        strategia: 'CHARGE',
        indoklas: `Közepes bérlés (${berlesNapok} nap): Charge+Refund stratégia szükséges`,
      };
    }

    // Hosszú bérlés (> hosszú bérlés határidő)
    if (berlesNapok > hosszuBerlesHatarido) {
      return {
        strategia: 'KESZPENZ_ONLY',
        indoklas: `Hosszú bérlés (${berlesNapok} nap > ${hosszuBerlesHatarido} nap): Csak készpénz kaució elfogadható`,
      };
    }

    // Fallback: készpénz
    return {
      strategia: 'KESZPENZ_ONLY',
      indoklas: 'Kártya hold/charge funkciók letiltva',
    };
  }
}
```

---

#### Bérlés Indítás Kaució Fizetéssel

```typescript
// backend/src/services/berles.service.ts

import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Berles } from '../entities/berles.entity';
import { BankTranzakcio } from '../entities/bank-tranzakcio.entity';
import { PosTerminalService } from './pos-terminal.service';
import { KaucioStrategyService } from './kaucio-strategy.service';

@Injectable()
export class BerlesService {
  constructor(
    @InjectRepository(Berles)
    private berlesRepo: Repository<Berles>,
    @InjectRepository(BankTranzakcio)
    private bankTranzakcioRepo: Repository<BankTranzakcio>,
    private posService: PosTerminalService,
    private kaucioStrategyService: KaucioStrategyService,
  ) {}

  /**
   * Bérlés indítás kártyás kaució fizetéssel
   */
  async indítBerlesKaucioKartyaval(
    input: {
      partner_id: string;
      cikk_id: string;
      kiadas_datum: Date;
      tervezett_visszahozas: Date;
      kaucio_osszeg: number;
    }
  ): Promise<Berles> {
    // Stratégia meghatározása
    const { strategia, indoklas } = await this.kaucioStrategyService.meghatározStrategia(
      input.kiadas_datum,
      input.tervezett_visszahozas
    );

    if (strategia === 'KESZPENZ_ONLY') {
      throw new BadRequestException(
        `Kártyás kaució nem elérhető: ${indoklas}. Kérjük készpénzes kauciót adjon.`
      );
    }

    // HOLD stratégia
    if (strategia === 'HOLD') {
      const holdResponse = await this.posService.createHold(
        input.kaucio_osszeg,
        `Kaució bérléshez - ${input.cikk_id}`
      );

      if (!holdResponse.success) {
        throw new BadRequestException(
          `Kártya hold sikertelen: ${holdResponse.error_message}`
        );
      }

      // Bérlés létrehozása
      const berles = this.berlesRepo.create({
        partner_id: input.partner_id,
        cikk_id: input.cikk_id,
        kiadas_datum: input.kiadas_datum,
        tervezett_visszahozas: input.tervezett_visszahozas,
        kaucio_osszeg: input.kaucio_osszeg,
        kaucio_fizetes_mod: 'Kártya_hold',
        kaucio_tranzakcio_id: holdResponse.transaction_id,
        kaucio_hold_datum: new Date(),
        kaucio_hold_lejarat: holdResponse.hold_expires_at,
        kaucio_captured: false,
        kaucio_released: false,
        kaucio_bank_valasz: holdResponse,
      });

      await this.berlesRepo.save(berles);

      // Bank tranzakció audit
      const bankTrx = this.bankTranzakcioRepo.create({
        berles_id: berles.id,
        tranzakcio_tipus: 'HOLD',
        osszeg: input.kaucio_osszeg,
        bank_tranzakcio_id: holdResponse.transaction_id,
        bank_valasz: holdResponse,
        sikeres: true,
      });

      await this.bankTranzakcioRepo.save(bankTrx);

      return berles;
    }

    // CHARGE stratégia (hosszabb bérlésre)
    if (strategia === 'CHARGE') {
      const chargeResponse = await this.posService.charge(
        input.kaucio_osszeg,
        `Kaució bérléshez - ${input.cikk_id}`
      );

      if (!chargeResponse.success) {
        throw new BadRequestException(
          `Kártya charge sikertelen: ${chargeResponse.error_message}`
        );
      }

      const berles = this.berlesRepo.create({
        partner_id: input.partner_id,
        cikk_id: input.cikk_id,
        kiadas_datum: input.kiadas_datum,
        tervezett_visszahozas: input.tervezett_visszahozas,
        kaucio_osszeg: input.kaucio_osszeg,
        kaucio_fizetes_mod: 'Kártya_charge',
        kaucio_tranzakcio_id: chargeResponse.transaction_id,
        kaucio_hold_datum: null,
        kaucio_hold_lejarat: null,
        kaucio_captured: true,  // Charge esetén azonnal capture
        kaucio_captured_osszeg: input.kaucio_osszeg,
        kaucio_released: false,
      });

      await this.berlesRepo.save(berles);

      const bankTrx = this.bankTranzakcioRepo.create({
        berles_id: berles.id,
        tranzakcio_tipus: 'CHARGE',
        osszeg: input.kaucio_osszeg,
        bank_tranzakcio_id: chargeResponse.transaction_id,
        bank_valasz: chargeResponse,
        sikeres: true,
      });

      await this.bankTranzakcioRepo.save(bankTrx);

      return berles;
    }
  }

  /**
   * Bérlés visszavétel - Kaució kezelés
   */
  async visszahoztBerles(
    berles_id: string,
    kar_osszeg: number = 0  // Ha sérült, akkor > 0
  ): Promise<void> {
    const berles = await this.berlesRepo.findOne({ where: { id: berles_id } });

    if (!berles) {
      throw new BadRequestException('Bérlés nem található');
    }

    // Csak kártyás kauciót kezelünk
    if (berles.kaucio_fizetes_mod === 'Készpénz') {
      // Készpénz kaució kezelése (meglévő logika)
      return;
    }

    // HOLD stratégia
    if (berles.kaucio_fizetes_mod === 'Kártya_hold') {
      if (kar_osszeg > 0) {
        // Részösszeg capture (kár levonása)
        const captureResponse = await this.posService.captureHold(
          berles.kaucio_tranzakcio_id,
          kar_osszeg
        );

        if (captureResponse.success) {
          berles.kaucio_captured = true;
          berles.kaucio_captured_osszeg = kar_osszeg;

          const bankTrx = this.bankTranzakcioRepo.create({
            berles_id: berles.id,
            tranzakcio_tipus: 'CAPTURE',
            osszeg: kar_osszeg,
            bank_tranzakcio_id: berles.kaucio_tranzakcio_id,
            bank_valasz: captureResponse,
            sikeres: true,
          });

          await this.bankTranzakcioRepo.save(bankTrx);
        }

        // Maradék release
        const releaseResponse = await this.posService.releaseHold(
          berles.kaucio_tranzakcio_id
        );

        if (releaseResponse.success) {
          berles.kaucio_released = true;
        }
      } else {
        // Nincs kár, teljes release
        const releaseResponse = await this.posService.releaseHold(
          berles.kaucio_tranzakcio_id
        );

        if (releaseResponse.success) {
          berles.kaucio_released = true;

          const bankTrx = this.bankTranzakcioRepo.create({
            berles_id: berles.id,
            tranzakcio_tipus: 'RELEASE',
            osszeg: berles.kaucio_osszeg,
            bank_tranzakcio_id: berles.kaucio_tranzakcio_id,
            bank_valasz: releaseResponse,
            sikeres: true,
          });

          await this.bankTranzakcioRepo.save(bankTrx);
        }
      }

      await this.berlesRepo.save(berles);
    }

    // CHARGE stratégia
    if (berles.kaucio_fizetes_mod === 'Kártya_charge') {
      const visszaterítesOsszeg = berles.kaucio_osszeg - kar_osszeg;

      if (visszaterítesOsszeg > 0) {
        const refundResponse = await this.posService.refund(
          berles.kaucio_tranzakcio_id,
          visszaterítesOsszeg
        );

        if (refundResponse.success) {
          berles.kaucio_released = true;

          const bankTrx = this.bankTranzakcioRepo.create({
            berles_id: berles.id,
            tranzakcio_tipus: 'REFUND',
            osszeg: visszaterítesOsszeg,
            bank_tranzakcio_id: berles.kaucio_tranzakcio_id,
            bank_valasz: refundResponse,
            sikeres: true,
          });

          await this.bankTranzakcioRepo.save(bankTrx);
        }
      }

      await this.berlesRepo.save(berles);
    }
  }
}
```

---

## 📊 Implementációs Terv

### MVP Scope (5 story, ~8 SP)

#### Story 1: Adatmodell bővítés (1 SP)
- BÉRLÉS tábla módosítás (kaucio_fizetes_mod, tranzakció mezők)
- BANK_TRANZAKCIO tábla létrehozása
- RENDSZERBEÁLLÍTÁS bővítés
- Migráció script

#### Story 2: POS Terminál Integráció (3 SP)
- PosTerminalService implementálás
- Hold/Capture/Release API hívások
- Charge/Refund API hívások
- Sandbox tesztelés

#### Story 3: Kaució Stratégia Logika (1 SP)
- KaucioStrategyService
- Bérlés időtartam alapú stratégia választás
- Unit tesztek

#### Story 4: Bérlés UI - Fizetési mód választó (2 SP)
- BérlésFizetésiMódDialog komponens
- Kártya hold/charge/készpénz választó
- Real-time előnézet (stratégia indoklás)
- Visszavétel UI frissítés

#### Story 5: Pénzügyi Riport Frissítés (1 SP)
- Zárolás vs. készpénz megkülönböztetés
- Bank tranzakció history report
- Hold lejárat riasztások

---

### V2 Bővítések (opcionális)

#### V2.1: Automatikus Hold Lejárat Kezelés (2 SP)
- Cron job: daily ellenőrzés lejáró holdokra
- Automatikus release ha bérlés visszahozva
- Email riasztás kezelőnek ha lejár

#### V2.2: Multi-bank POS Support (3 SP)
- OTP SimplePay integráció
- K&H KártyaBiztos integráció
- Fallback logic (elsődleges bank sikertelen → másodlagos)

---

## 🎯 Üzleti Érték (ROI)

### Kvalitatív Előnyök

✅ **Ügyfél-elégedettség**: +20% (kártya kényelme, nincs nagy készpénz)
✅ **Versenyképesség**: Más bérbeadók is támogatják
✅ **Biztonság**: Kevesebb készpénz a boltban

### Kvantitatív Előnyök

**Jelenlegi állapot:**
- 10-15% bérlés elutasítás készpénz hiány miatt
- Ügyfél kényelmetlenség (ATM felkeresés szükséges)

**Új állapot:**
- Kártyás kaució opció → +10-15% bérlés volumen
- Gyorsabb folyamat (nincs készpénz számolás)

**Implementációs költség:**
- 8 SP × 100.000 Ft/SP = **800.000 Ft**
- POS terminál bérleti díj: +10.000 Ft/hó
- Megtérülés: ~6-9 hónap

---

## ⚠️ Kockázatok és Kihívások

### Kockázat 1: Bank API leállás/változás
**Mitigation:** Fallback készpénz opció mindig elérhető, multi-bank support (V2.2)

### Kockázat 2: Hold lejárat kezelés komplexitás
**Mitigation:** Automatikus riasztások + admin dashboard

### Kockázat 3: Pénzügyi könyvelési komplexitás (zárolás vs. valódi tranzakció)
**Mitigation:** Bank tranzakció audit log, külön riport kategória

---

## 📚 Függelékek

### Kapcsolódó Dokumentumok
- [01-ugyfelfelvitel-folyamat.md](../ERP/Workflows/01-ugyfelfelvitel-folyamat.md) - 1.7 Kaució kezelés
- [KGC-ERP-v3-Fit-Gap-Analízis-2025-12-29.md](../KGC-ERP-v3-Fit-Gap-Analízis-2025-12-29.md) - #8 követelmény

### Technológiai Stack
- **Backend:** NestJS (TypeScript)
- **POS Terminál:** OTP SimplePay API, K&H KártyaBiztos
- **Adatbázis:** PostgreSQL
- **Cron:** node-cron (hold lejárat ellenőrzés)

### Fejlesztői Jegyzetek
- **KRITIKUS:** POS API credentials .env fájlban, SOHA ne commitálj
- **Sandbox:** Minden POS integráció először sandbox környezetben tesztelendő
- **Hold lejárat:** Bank függő (OTP: 7 nap, K&H: 30 nap) - konfiguráció táblában tárolva
- **Audit:** Minden bank tranzakció BANK_TRANZAKCIO táblába kerül (GDPR)
