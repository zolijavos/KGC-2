# Kaució Visszatartás Sérülésnél - Feature Architektúra

**Feature ID:** FIT-GAP-002
**Prioritás:** 🔴 KRITIKUS
**Komplexitás:** KÖZEPES
**Becsült Effort:** 5 story (~8 SP)
**Verzió:** 1.0
**Dátum:** 2025-12-29
**Architect:** Winston 🏗️

---

## 📋 Executive Summary

Ez a feature-specifikus architektúra dokumentum a **Kaució Visszatartás Sérülésnél** követelmény teljes technikai megoldását írja le. A megoldás három core modul integrációját igényli: **Bérlés**, **Szerviz**, és **Pénzügy**.

### Architekturális Elvek

1. **Unalmas technológia** - Meglévő adatmodell bővítése, új táblák minimalizálása
2. **Transzparencia** - Minden státusz változás auditálható
3. **Fail-safe** - Kaució nem adható ki, amíg elszámolás nincs lezárva
4. **Separation of concerns** - Bérlés, Szerviz, Pénzügy modulok tiszta felelősségi körrel

---

## 🎯 Üzleti Követelmény Összefoglaló

**Forrás:** Fit-Gap Analízis #2, KGC-notes-2025-12-16-01.md (sor 304-426)

### Probléma (As-Is)

Jelenlegi folyamat (01-ugyfelfelvitel-folyamat.md, 2.4):
```
Gép visszavétele → 2.4 Kaució visszaadása (teljes, készpénz)
```

**Hiányosság:**
- ❌ Nincs blokkolási mechanizmus sérült gép esetén
- ❌ Nincs kapcsolat BÉRLÉS → MUNKALAP között
- ❌ Kaució azonnal visszaadandó, még vizsgálat előtt

### Megoldás (To-Be)

Új workflow:
```
Gép visszavétele → Sérülés?
  ├─ NEM  → Kaució visszaadása (teljes)
  └─ IGEN → P6: Káresemény kezelés
            ├─ Kaució blokkolva (BÉRLÉS.kaucio_statusz = 'VISSZATARTVA')
            ├─ MUNKALAP generálás (szerviz)
            ├─ Diagnosztika + árajánlat
            └─ Pénzügy elszámolás → Kaució maradék visszaadása
```

---

## 🗂️ Adatmodell Módosítások

### 1. BÉRLÉS Entitás Bővítése (Core)

**Tábla:** `kgc.rentals` (bérlések)

```sql
-- ÚJ MEZŐK
ALTER TABLE kgc.rentals
  ADD COLUMN kaucio_statusz TEXT DEFAULT 'PENDING'
    CHECK (kaucio_statusz IN (
      'PENDING',                    -- Alapértelmezett (még nincs visszaadva)
      'VISSZATARTVA',               -- Sérülés miatt blokkolva
      'VISSZAADVA',                 -- Teljes kaució visszaadva
      'RÉSZLEGESEN_ELSZÁMOLVA'      -- Kár levonva, maradék visszaadva
    )),

  ADD COLUMN visszatartott_osszeg DECIMAL(10,2) DEFAULT 0.00,
    -- A blokk alatt lévő kaució összege

  ADD COLUMN munkalap_id UUID REFERENCES kgc.service_jobs(id) ON DELETE SET NULL,
    -- FK a szerviz munkalaphoz (ha sérült gép)

  ADD COLUMN kaucio_megjegyzes TEXT;
    -- Miért lett visszatartva (pl. "Sérült üzemóra számláló")

-- INDEX
CREATE INDEX idx_rentals_kaucio_statusz ON rentals(kaucio_statusz);
CREATE INDEX idx_rentals_munkalap ON rentals(munkalap_id) WHERE munkalap_id IS NOT NULL;
```

**Üzleti szabály:**
- Új bérlés: `kaucio_statusz = 'PENDING'`
- Visszavétel sérülés nélkül: `kaucio_statusz = 'VISSZAADVA'`
- Visszavétel sérüléssel: `kaucio_statusz = 'VISSZATARTVA'`, `visszatartott_osszeg = kaució összege`

---

### 2. BÉRLÉS Státusz Bővítése

**Tábla:** `kgc.rentals`

```sql
-- MÓDOSÍTOTT: status mező értékei
ALTER TABLE kgc.rentals
  DROP CONSTRAINT IF EXISTS check_rental_status,
  ADD CONSTRAINT check_rental_status
    CHECK (status IN (
      'active',              -- Aktív bérlés (gép kint)
      'completed',           -- Lezárt (gép vissza, kaució kiadva)
      'elszamolas_fuggben'   -- 🆕 ÚJ: Elszámolás folyamatban (kaució blokkolva)
    ));
```

**Workflow szabály:**
```typescript
// Sérülés esetén:
rental.status = 'elszamolas_fuggben'
rental.kaucio_statusz = 'VISSZATARTVA'

// Blokkolás hatása:
if (rental.status === 'elszamolas_fuggben') {
  throw new Error('Kaució nem adható ki - elszámolás folyamatban')
}
```

---

### 3. MUNKALAP (Service Job) Kapcsolat

**Tábla:** `kgc.service_jobs`

```sql
-- ÚJ MEZŐ (már javasolt Fit-Gap #4-ben)
ALTER TABLE kgc.service_jobs
  ADD COLUMN berles_id UUID REFERENCES kgc.rentals(id) ON DELETE SET NULL,
    -- FK a bérléshez (ha bérléshez kapcsolódó javítás)

  ADD COLUMN munkalap_tipus TEXT DEFAULT 'Ügyfél'
    CHECK (munkalap_tipus IN (
      'Ügyfél',                    -- Ügyfél saját gépe
      'Bérgép_bérléshez',          -- 🆕 Bérgép, bérléshez kapcsolódó sérülés
      'Bérgép_karbantartás'        -- Bérgép, rendszeres karbantartás
    ));

-- INDEX
CREATE INDEX idx_service_jobs_berles ON service_jobs(berles_id) WHERE berles_id IS NOT NULL;
CREATE INDEX idx_service_jobs_tipus ON service_jobs(munkalap_tipus);
```

---

## 🔄 Folyamat Módosítások

### 1. Bérlés Visszavétel Workflow (Módosított)

**Forrás folyamat:** 01-ugyfelfelvitel-folyamat.md, 2. FÁZIS: GÉP VISSZAHOZÁSA

#### Jelenlegi Lépések (As-Is)

```
2.1 Vonalkód beolvasás
  ↓
2.2 Késés ellenőrzés
  ↓
2.3 Gép visszavétele (státusz: bent)
  ↓
2.4 Kaució visszaadása (teljes, készpénz)
  ↓
2.5 Vége
```

#### Új Lépések (To-Be)

```
2.1 Vonalkód beolvasás
  ↓
2.2 Késés ellenőrzés
  ├─ Késett? IGEN → Késési díj számla
  └─ NEM → Folytatás
  ↓
🆕 2.2b Sérülés Vizsgálat [DÖNTÉSI PONT #6]
  ├─────────────────────────────────────────────────────────────┐
  │                                                             │
  │ NEM - Sértetlen gép                 IGEN - Sérült gép      │
  │                                                             │
  ↓                                     ↓                       │
2.3 Gép visszavétele (standard)    🆕 P6: Káresemény Kezelés   │
  │                                     ↓                       │
  │                                 P6.1 Kaució blokkolása      │
  │                                   rental.status =           │
  │                                     'elszamolas_fuggben'    │
  │                                   rental.kaucio_statusz =   │
  │                                     'VISSZATARTVA'          │
  │                                   rental.visszatartott_osszeg = │
  │                                     kaució összege          │
  │                                     ↓                       │
  │                                 P6.2 Gép → Szerviz          │
  │                                   bergep.status = 'szerviz' │
  │                                     ↓                       │
  │                                 P6.3 Munkalap generálás     │
  │                                   service_job.berles_id =   │
  │                                     rental.id               │
  │                                   service_job.munkalap_tipus=│
  │                                     'Bérgép_bérléshez'      │
  │                                   rental.munkalap_id =      │
  │                                     service_job.id          │
  │                                     ↓                       │
  │                                 P6.4 Ügyfél tájékoztatás    │
  │                                   • Átvételi elismervény    │
  │                                   • Kaució blokkolva: XXX Ft│
  │                                   • Munkalap #: XXXXX       │
  │                                   • Email + SMS értesítés   │
  │                                     ↓                       │
  │                                 P6.5 STOP                   │
  │                                   (Folytatás: Szerviz)      │
  ↓                                                             │
2.4 Kaució visszaadása (teljes)                                │
  rental.kaucio_statusz = 'VISSZAADVA'                         │
  rental.status = 'completed'                                  │
  ↓                                                             │
2.5 Vége ←───────────────────────────────────────────────────────┘
       (Csak P7 Pénzügy elszámolás után)
```

---

### 2. Szerviz Folyamat (Módosított)

**Forrás folyamat:** 04-szerviz-folyamat.md

#### Kárfelmérés Workflow

```
[Bérlés → P6.3 Munkalap generálás után]
  ↓
S1. Munkalap Felvéve (FELVÉVE státusz)
  • Gép átvétel dátum/idő
  • Sérülés leírása (notes mező)
  • Fotó csatolása (opcionális, lehetőség szerint)
  ↓
S2. Diagnosztika (2. FÁZIS)
  • Technikus vizsgálat
  • Alkatrész igény felmérés
  • Munkadíj becslés
  ↓
S3. Árajánlat Készítés
  • Munkalap tételek rögzítése (MUNKALAP_TÉTEL)
    ├─ Alkatrész (pl. Üzemóra számláló: 7000 Ft)
    ├─ Munkadíj (pl. Javítás: 3000 Ft)
    └─ Összesen: 10.000 Ft
  • service_job.status = 'SZÁMLÁZHATÓ'
  ↓
S4. Értesítés → Pénzügy
  • Email/SMS ügyfélnek: "Árajánlat kész"
  • Webhook → Pénzügy modul
  • Trigger: P7 Pénzügy Elszámolás
```

---

### 3. Pénzügy Elszámolás Workflow (ÚJ)

**Új folyamat:** P7: Kaució Elszámolás

```
[Szerviz → S4 Értesítés után]
  ↓
P7.1 Árajánlat Review
  • Pénzügyes ellenőrzi:
    - Munkalap státusz = 'SZÁMLÁZHATÓ'?
    - Kárösszeg (sum(munkalap_tételek))
    - Kaució összege (rental.visszatartott_osszeg)
  ↓
P7.2 Számla Kiállítása
  • Számla típus: Javítási díj (bérgép kár)
  • Vevő: PARTNER (bérlő)
  • Tételek: MUNKALAP_TÉTEL-ekből
  • Összeg: Kárösszeg (pl. 10.000 Ft)
  ↓
P7.3 Kaució Elszámolás

  Algoritmus:
  ───────────────────────────────────────────────────────
  kaució = rental.visszatartott_osszeg  // pl. 50.000 Ft
  kár = számla.osszeg                   // pl. 10.000 Ft

  IF kár <= kaució THEN:
    maradék = kaució - kár              // 40.000 Ft
    rental.kaucio_statusz = 'RÉSZLEGESEN_ELSZÁMOLVA'

    // Maradék visszaadása
    cash_return = maradék

  ELSE IF kár > kaució THEN:
    rental.kaucio_statusz = 'RÉSZLEGESEN_ELSZÁMOLVA'
    maradék = 0
    cash_return = 0

    // Ügyfél tartozása
    tartozás = kár - kaució             // pl. 60K kár - 50K kaució = 10K tartozás

    // Számla módosítás vagy új számla
    számla.tartozas = tartozás
  ───────────────────────────────────────────────────────

  ↓
P7.4 Kaució Kiadás/Követelés

  IF maradék > 0 THEN:
    • Pénztár: Készpénz kiadás (maradék összeg)
    • Nyugta kiállítás
    • Ügyfél aláírás (átvételi elismervény)

  IF tartozás > 0 THEN:
    • Követelés könyvelése
    • Fizetési határidő megadása
    • Email értesítés ügyfélnek

  ↓
P7.5 Bérlés Végleges Lezárása
  • rental.status = 'completed'
  • bergep.status = 'bent' (ha javítás kész)
  • Audit log bejegyzés:
    - Eredeti kaució: XXX Ft
    - Kár levonva: XXX Ft
    - Visszaadva: XXX Ft
    - Munkalap: #XXXXX
    - Kezelő: {user_id}
    - Időpont: {timestamp}
  ↓
P7.6 Vége
```

---

## 🔌 API Interfészek

### 1. RentalService (Bérlés Modul)

#### Új/Módosított Metódusok

```typescript
interface RentalService {
  /**
   * Bérlés visszavétel sérülés nélkül (standard)
   */
  async returnRental(
    rentalId: string,
    returnData: {
      returnedAt: Date;
      actualCondition: 'SÉRTETLEN' | 'SÉRÜLT';
      notes?: string;
    }
  ): Promise<RentalReturnResult>;

  /**
   * 🆕 ÚJ: Sérült gép visszavétel (kaució blokkolás)
   */
  async returnRentalWithDamage(
    rentalId: string,
    damageData: {
      damageDescription: string;
      estimatedCost?: number;
      photos?: string[];  // Base64 vagy file paths
    }
  ): Promise<DamageReturnResult>;

  /**
   * 🆕 ÚJ: Kaució elszámolás (Pénzügy által hívva)
   */
  async settleDeposit(
    rentalId: string,
    settlementData: {
      serviceCost: number;  // Munkalapból
      refundAmount: number; // Visszaadandó
      invoiceId: string;
    }
  ): Promise<DepositSettlementResult>;

  /**
   * Kaució státusz lekérdezés
   */
  async getDepositStatus(rentalId: string): Promise<DepositStatus>;
}
```

#### Return Types

```typescript
interface DamageReturnResult {
  rental: Rental;
  serviceJob: ServiceJob;  // Generált munkalap
  depositBlocked: {
    amount: number;
    status: 'VISSZATARTVA';
    serviceJobId: string;
  };
  notification: {
    email: boolean;
    sms: boolean;
    receiptGenerated: string;  // PDF path
  };
}

interface DepositSettlementResult {
  rental: Rental;
  deposit: {
    original: number;
    deducted: number;
    refunded: number;
    remaining: number;
  };
  invoice: Invoice;
  receipt?: string;  // PDF path (ha készpénz visszaadás)
}

interface DepositStatus {
  rentalId: string;
  status: 'PENDING' | 'VISSZATARTVA' | 'VISSZAADVA' | 'RÉSZLEGESEN_ELSZÁMOLVA';
  depositAmount: number;
  blockedAmount: number;
  serviceJobId?: string;
  canRelease: boolean;  // false if status = VISSZATARTVA
}
```

---

### 2. ServiceService (Szerviz Modul)

#### Új/Módosított Metódusok

```typescript
interface ServiceService {
  /**
   * 🆕 ÚJ: Bérléshez kapcsolódó munkalap generálás
   */
  async createServiceJobFromRental(
    rentalId: string,
    bergepId: string,
    damageInfo: {
      description: string;
      photos?: string[];
    }
  ): Promise<ServiceJob>;

  /**
   * Munkalap lezárás → trigger pénzügy elszámolás
   */
  async finalizeServiceJob(
    serviceJobId: string
  ): Promise<ServiceJobFinalizeResult>;
}
```

#### Return Types

```typescript
interface ServiceJobFinalizeResult {
  serviceJob: ServiceJob;
  totalCost: number;
  rentalId?: string;  // Ha bérléshez kapcsolódik
  triggerFinanceSettlement: boolean;  // true ha bérléshez kapcsolódik
  webhookSent: boolean;
}
```

---

### 3. FinanceService (Pénzügy Modul)

#### Új Metódusok

```typescript
interface FinanceService {
  /**
   * 🆕 ÚJ: Kaució elszámolás workflow
   */
  async processDepositSettlement(
    rentalId: string,
    serviceJobId: string
  ): Promise<DepositSettlementWorkflow>;

  /**
   * 🆕 ÚJ: Kaució levonás számlázása
   */
  async createDamageInvoice(
    rentalId: string,
    serviceJobId: string,
    items: InvoiceItem[]
  ): Promise<Invoice>;
}
```

#### Return Types

```typescript
interface DepositSettlementWorkflow {
  steps: {
    reviewComplete: boolean;
    invoiceCreated: boolean;
    depositCalculated: boolean;
    refundProcessed: boolean;
    rentalClosed: boolean;
  };
  amounts: {
    depositOriginal: number;
    serviceCost: number;
    refund: number;
    outstanding: number;  // Ha kár > kaució
  };
  documents: {
    invoiceId: string;
    receiptPath?: string;
  };
}
```

---

## 🎨 UI/UX Módosítások

### 1. Bérlés Visszavétel Screen (Módosított)

**Hely:** Frontend - Rental Return Component

#### Új UI Elemek

```tsx
// Pszeudo-kód (React/Vue komponens)
<RentalReturnScreen>
  {/* STEP 1: Vonalkód beolvasás */}
  <BarcodeScanner onScan={loadRental} />

  {/* STEP 2: Késés ellenőrzés */}
  {rental.isLate && <LateFeesCalculator rental={rental} />}

  {/* 🆕 STEP 2b: Sérülés vizsgálat */}
  <DamageInspection>
    <RadioGroup>
      <Radio value="SÉRTETLEN">
        Sértetlen állapot - Kaució visszaadható
      </Radio>
      <Radio value="SÉRÜLT">
        Sérült gép - Vizsgálat szükséges
      </Radio>
    </RadioGroup>

    {/* Ha SÉRÜLT kiválasztva */}
    {isDamaged && (
      <DamageForm>
        <TextArea
          label="Sérülés leírása"
          placeholder="Pl. Üzemóra számláló letört, vízbeázás..."
          required
        />

        <FileUpload
          label="Fotók (opcionális)"
          accept="image/*"
          multiple
          maxFiles={5}
        />

        <NumberInput
          label="Becsült kárösszeg (Ft)"
          placeholder="Technikus kitölti vizsgálat után"
          disabled={!isTechnician}
        />

        <Button
          onClick={handleDamageReturn}
          variant="warning"
        >
          Kaució Blokkolása és Szervizbe Küldés
        </Button>
      </DamageForm>
    )}
  </DamageInspection>

  {/* STEP 3: Standard visszavétel vagy blokkolás */}
  {!isDamaged && (
    <Button onClick={handleStandardReturn}>
      Gép Visszavétele - Kaució Kiadása
    </Button>
  )}
</RentalReturnScreen>
```

#### Confirmation Modal (Kaució Blokkolás)

```tsx
<Modal title="Kaució Blokkolása" show={showDepositBlockConfirm}>
  <Alert variant="warning">
    ⚠️ A kaució ({formatCurrency(rental.depositAmount)}) blokkolva lesz,
    amíg a szerviz kárfelmérés be nem fejeződik.
  </Alert>

  <InfoPanel>
    <InfoRow label="Bérlés ID">{rental.id}</InfoRow>
    <InfoRow label="Bérlő">{rental.customer.name}</InfoRow>
    <InfoRow label="Kaució">{formatCurrency(rental.depositAmount)}</InfoRow>
    <InfoRow label="Sérülés">{damageDescription}</InfoRow>
  </InfoPanel>

  <Checkbox required>
    Megerősítem, hogy a gép sérült, és szerviz vizsgálat szükséges.
  </Checkbox>

  <ButtonGroup>
    <Button onClick={confirmBlock} variant="danger">
      Kaució Blokkolása
    </Button>
    <Button onClick={cancel} variant="secondary">
      Mégse
    </Button>
  </ButtonGroup>
</Modal>
```

---

### 2. Szerviz Munkalap Screen (Módosított)

**Hely:** Frontend - Service Job Component

#### Bérléshez Kapcsolódó Jelzések

```tsx
<ServiceJobDetails job={serviceJob}>
  {/* 🆕 Bérlés kapcsolat badge */}
  {serviceJob.berles_id && (
    <Alert variant="info">
      🔗 Ez a javítás bérléshez kapcsolódik
      <Link to={`/rentals/${serviceJob.berles_id}`}>
        Bérlés #{serviceJob.berles_id}
      </Link>

      <Badge variant="warning">
        Kaució blokkolva: {formatCurrency(rental.depositAmount)}
      </Badge>
    </Alert>
  )}

  {/* Munkalap tételek */}
  <ServiceItemsTable items={serviceJob.items} />

  {/* Összesítés */}
  <Summary>
    <SummaryRow label="Alkatrészek">{formatCurrency(partsCost)}</SummaryRow>
    <SummaryRow label="Munkadíj">{formatCurrency(laborCost)}</SummaryRow>
    <SummaryRow label="Összesen" bold>{formatCurrency(totalCost)}</SummaryRow>

    {/* 🆕 Kaució fedezet kalkuláció */}
    {serviceJob.berles_id && (
      <>
        <Divider />
        <SummaryRow label="Kaució" variant="muted">
          {formatCurrency(rental.depositAmount)}
        </SummaryRow>
        <SummaryRow
          label="Visszajár ügyfélnek"
          variant={totalCost > rental.depositAmount ? 'danger' : 'success'}
        >
          {formatCurrency(Math.max(0, rental.depositAmount - totalCost))}
        </SummaryRow>

        {totalCost > rental.depositAmount && (
          <Alert variant="danger">
            ⚠️ A kár ({{formatCurrency(totalCost)}}) meghaladja a kauciót!
            Ügyfél tartozása: {formatCurrency(totalCost - rental.depositAmount)}
          </Alert>
        )}
      </>
    )}
  </Summary>

  {/* Munkalap lezárás gomb */}
  <Button onClick={finalizeServiceJob} disabled={!canFinalize}>
    Munkalap Lezárása és Számlázás Indítása
  </Button>
</ServiceJobDetails>
```

---

### 3. Pénzügy Elszámolás Screen (ÚJ)

**Hely:** Frontend - Finance → Deposit Settlement Component

```tsx
<DepositSettlementScreen rentalId={rentalId}>
  {/* Header */}
  <PageHeader>
    <Title>Kaució Elszámolás</Title>
    <Subtitle>Bérlés #{rental.id} - {rental.customer.name}</Subtitle>
  </PageHeader>

  {/* Bérlés információk */}
  <Card title="Bérlés Adatok">
    <DataGrid>
      <DataRow label="Bérlő">{rental.customer.name}</DataRow>
      <DataRow label="Bérgép">{rental.bergep.name}</DataRow>
      <DataRow label="Kaució összege">{formatCurrency(rental.depositAmount)}</DataRow>
      <DataRow label="Visszavétel dátuma">{formatDate(rental.returnedAt)}</DataRow>
    </DataGrid>
  </Card>

  {/* Munkalap információk */}
  <Card title="Szerviz Munkalap">
    <Link to={`/service/${serviceJob.id}`}>
      Munkalap #{serviceJob.id} megtekintése
    </Link>

    <ServiceItemsList items={serviceJob.items} compact />

    <TotalRow>
      Javítási költség: <strong>{formatCurrency(serviceJob.totalCost)}</strong>
    </TotalRow>
  </Card>

  {/* 🆕 Elszámolás kalkulátor */}
  <Card title="Kaució Elszámolás" variant="primary">
    <CalculationPanel>
      <CalcRow>
        <Label>Eredeti kaució</Label>
        <Amount positive>{formatCurrency(rental.depositAmount)}</Amount>
      </CalcRow>

      <CalcRow>
        <Label>Javítási költség (levonva)</Label>
        <Amount negative>- {formatCurrency(serviceJob.totalCost)}</Amount>
      </CalcRow>

      <Divider />

      <CalcRow variant="result">
        <Label bold>
          {settlement.refund > 0 ? 'Visszajár ügyfélnek' : 'Ügyfél tartozása'}
        </Label>
        <Amount
          variant={settlement.refund > 0 ? 'success' : 'danger'}
          size="large"
          bold
        >
          {formatCurrency(Math.abs(settlement.refund || settlement.outstanding))}
        </Amount>
      </CalcRow>
    </CalculationPanel>
  </Card>

  {/* Műveletek */}
  <ActionPanel>
    {settlement.refund > 0 && (
      <RefundSection>
        <h3>Készpénz Kiadás</h3>
        <Alert variant="info">
          Készpénz kiadása a pénztárból: {formatCurrency(settlement.refund)}
        </Alert>

        <Checkbox required onChange={setRefundConfirmed}>
          Megerősítem, hogy a pénzt kiadtam az ügyfélnek
        </Checkbox>

        <Checkbox onChange={setReceiptSigned}>
          Ügyfél aláírta az átvételi elismervényt
        </Checkbox>
      </RefundSection>
    )}

    {settlement.outstanding > 0 && (
      <OutstandingSection>
        <h3>Követelés Kezelése</h3>
        <Alert variant="warning">
          Az ügyfélnek további {formatCurrency(settlement.outstanding)} tartozása van.
        </Alert>

        <Select label="Fizetési mód">
          <Option value="cash">Készpénz (azonnal)</Option>
          <Option value="transfer">Átutalás (határidővel)</Option>
          <Option value="installment">Részletfizetés</Option>
        </Select>

        {paymentMethod === 'transfer' && (
          <DatePicker label="Fizetési határidő" />
        )}
      </OutstandingSection>
    )}

    <ButtonGroup>
      <Button
        onClick={processSettlement}
        disabled={!canProcess}
        variant="primary"
        size="large"
      >
        Elszámolás Véglegesítése
      </Button>

      <Button onClick={cancel} variant="secondary">
        Mégse
      </Button>
    </ButtonGroup>
  </ActionPanel>
</DepositSettlementScreen>
```

---

## 🧪 Tesztelési Forgatókönyvek

### 1. Unit Tesztek

```typescript
describe('RentalService - Deposit Settlement', () => {
  test('sérült gép visszavétel - kaució blokkolás', async () => {
    const rental = await createTestRental({ depositAmount: 50000 });

    const result = await rentalService.returnRentalWithDamage(rental.id, {
      damageDescription: 'Üzemóra számláló letört',
      estimatedCost: 7000
    });

    expect(result.rental.status).toBe('elszamolas_fuggben');
    expect(result.rental.kaucio_statusz).toBe('VISSZATARTVA');
    expect(result.rental.visszatartott_osszeg).toBe(50000);
    expect(result.serviceJob).toBeDefined();
    expect(result.serviceJob.munkalap_tipus).toBe('Bérgép_bérléshez');
  });

  test('kaució elszámolás - kár < kaució', async () => {
    const rental = await setupRentalWithDamage({
      depositAmount: 50000,
      serviceCost: 10000
    });

    const result = await rentalService.settleDeposit(rental.id, {
      serviceCost: 10000,
      refundAmount: 40000,
      invoiceId: 'INV-123'
    });

    expect(result.deposit.refunded).toBe(40000);
    expect(result.rental.kaucio_statusz).toBe('RÉSZLEGESEN_ELSZÁMOLVA');
    expect(result.rental.status).toBe('completed');
  });

  test('kaució elszámolás - kár > kaució', async () => {
    const rental = await setupRentalWithDamage({
      depositAmount: 50000,
      serviceCost: 60000
    });

    const result = await rentalService.settleDeposit(rental.id, {
      serviceCost: 60000,
      refundAmount: 0,
      invoiceId: 'INV-456'
    });

    expect(result.deposit.refunded).toBe(0);
    expect(result.deposit.remaining).toBe(-10000);  // Tartozás
    expect(result.rental.kaucio_statusz).toBe('RÉSZLEGESEN_ELSZÁMOLVA');
  });
});
```

---

### 2. Integrácios Tesztek

```typescript
describe('Full Deposit Settlement Workflow', () => {
  test('E2E: Sérült gép → Szerviz → Elszámolás', async () => {
    // 1. Bérlés indítása
    const rental = await createRental({
      customerId: testCustomer.id,
      bergepId: testBergep.id,
      depositAmount: 50000
    });

    // 2. Sérült visszavétel
    const damageReturn = await rentalService.returnRentalWithDamage(
      rental.id,
      { damageDescription: 'Motor problémák' }
    );

    expect(damageReturn.rental.status).toBe('elszamolas_fuggben');

    // 3. Szerviz diagnosztika
    const serviceJob = damageReturn.serviceJob;
    await serviceService.addServiceItem(serviceJob.id, {
      type: 'part',
      description: 'Motor csere',
      cost: 30000
    });
    await serviceService.addServiceItem(serviceJob.id, {
      type: 'labor',
      description: 'Javítás',
      cost: 5000
    });

    // 4. Munkalap lezárás
    const finalized = await serviceService.finalizeServiceJob(serviceJob.id);
    expect(finalized.totalCost).toBe(35000);
    expect(finalized.triggerFinanceSettlement).toBe(true);

    // 5. Pénzügy elszámolás
    const settlement = await financeService.processDepositSettlement(
      rental.id,
      serviceJob.id
    );

    expect(settlement.amounts.depositOriginal).toBe(50000);
    expect(settlement.amounts.serviceCost).toBe(35000);
    expect(settlement.amounts.refund).toBe(15000);
    expect(settlement.steps.rentalClosed).toBe(true);

    // 6. Ellenőrzés
    const updatedRental = await rentalService.findOne(rental.id);
    expect(updatedRental.status).toBe('completed');
    expect(updatedRental.kaucio_statusz).toBe('RÉSZLEGESEN_ELSZÁMOLVA');
  });
});
```

---

## 📋 Acceptance Criteria

### Feature Acceptance

✅ **AC1:** Sérült gép visszavételnél a kaució automatikusan blokkolva (UI gomb disabled)
✅ **AC2:** Munkalap automatikusan generálódik `berles_id` FK-val
✅ **AC3:** Bérlés státusz `elszamolas_fuggben` → kaució nem adható ki
✅ **AC4:** Szerviz munkalap lezárás → email/SMS ügyfélnek az árajánlatról
✅ **AC5:** Pénzügy elszámolás kalkulátor: kaució - kár = visszajár/tartozás
✅ **AC6:** Ha maradék > 0 → készpénz kiadás + nyugta
✅ **AC7:** Ha kár > kaució → követelés könyvelése
✅ **AC8:** Teljes audit trail minden státusz változásról
✅ **AC9:** Offline támogatás (PWA cache frissítés szinkron után)
✅ **AC10:** RBAC: Csak MANAGER felülbírálhatja a kaució blokkot

---

## 🚀 Implementációs Ütemterv

### Sprint Breakdown (4 hét)

#### Hét 1: Adatmodell + Backend Core
- [ ] BÉRLÉS tábla módosítás (`kaucio_statusz`, `visszatartott_osszeg`, `munkalap_id`)
- [ ] MUNKALAP tábla módosítás (`berles_id`, `munkalap_tipus`)
- [ ] Migration scriptek (up/down)
- [ ] Unit tesztek (adatmodell validációk)

#### Hét 2: RentalService + ServiceService API
- [ ] `returnRentalWithDamage()` implementáció
- [ ] `settleDeposit()` implementáció
- [ ] `createServiceJobFromRental()` implementáció
- [ ] Webhook setup (Szerviz → Pénzügy)
- [ ] API tesztek

#### Hét 3: FinanceService + UI Components
- [ ] `processDepositSettlement()` implementáció
- [ ] `createDamageInvoice()` implementáció
- [ ] Frontend: Damage Inspection form
- [ ] Frontend: Deposit Settlement screen
- [ ] Integrácios tesztek

#### Hét 4: Tesztelés + Deployment
- [ ] E2E tesztek (teljes workflow)
- [ ] UAT (User Acceptance Testing)
- [ ] Offline szinkron tesztelés (PWA)
- [ ] Production deployment
- [ ] Dokumentáció véglegesítés

---

## 🔒 Biztonsági Megfontolások

### 1. RBAC (Role-Based Access Control)

```typescript
// Kaució blokkolás feloldása - csak MANAGER
@RequireRole(['MANAGER', 'ADMIN'])
async overrideDepositBlock(rentalId: string, reason: string) {
  await auditLog.log({
    action: 'OVERRIDE_DEPOSIT_BLOCK',
    rentalId,
    reason,
    userId: currentUser.id,
    timestamp: new Date()
  });

  // ... override logic
}
```

### 2. Audit Trail

Minden művelet kötelező naplózása:
- Kaució blokkolás (ki, mikor, miért)
- Munkalap generálás (bérlés hivatkozással)
- Elszámolás végrehajtás (összegek, kezelő)
- Készpénz kiadás (nyugta aláírás)

### 3. Transaction Integrity

```typescript
async returnRentalWithDamage(rentalId, damageData) {
  const transaction = await db.transaction();

  try {
    // 1. Bérlés státusz
    await updateRentalStatus(transaction, rentalId, 'elszamolas_fuggben');

    // 2. Kaució blokkolás
    await blockDeposit(transaction, rentalId);

    // 3. Munkalap generálás
    const serviceJob = await createServiceJob(transaction, rentalId, damageData);

    // 4. FK kapcsolat
    await linkRentalToServiceJob(transaction, rentalId, serviceJob.id);

    await transaction.commit();

  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}
```

---

## 📈 Success Metrics (KPI)

Post-launch monitoring:

| Metrika | Cél | Mérés |
|---------|-----|-------|
| **Kaució visszatartás aránya** | <15% bérlésekből | `COUNT(kaucio_statusz='VISSZATARTVA') / COUNT(rentals)` |
| **Átlagos elszámolási idő** | <48 óra | `AVG(elszámolás_dátum - visszavétel_dátum)` |
| **Pénzügyi veszteség** | 0 Ft (kaució fedezi) | `SUM(MAX(0, kár - kaució))` |
| **Ügyfél elégedettség** | >80% (survey) | Post-damage survey score |
| **Audit compliance** | 100% | Minden műveletet naplózása |

---

## 🔗 Függőségek

### Előfeltételek (Blockers)

- ✅ Inventory modul (bérgép státusz: `szerviz`)
- ✅ Szerviz modul (MUNKALAP entitás)
- ✅ Pénzügy modul (számla kiállítás)

### Kapcsolódó Feature-ök

- 🔗 Fit-Gap #4: Munkalap-Bérlés kapcsolat (párhuzamosan implementálva)
- 🔗 Inventory v2.0: Multi-location (független)

---

**Dokumentum Vége**

_🏗️ Prepared by Winston, System Architect_
_Boring technology. Reliable solutions._
