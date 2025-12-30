# Feature: Törzsvendég Személyazonosítás - Architektúra Dokumentum

**Verzió:** 1.0
**Dátum:** 2025-12-29
**Szerző:** Winston (Architect), BMAD Method
**Fit-Gap ID:** #5 (HIGH Priority)
**Story Pont Becslés:** 5-8 SP
**Implementációs Idő:** 2 hét

---

## 📋 Executive Summary

### Probléma
KGC bérgép kölcsönzőnél **törzsvendégek megsértődnek**, ha minden alkalommal kérik a személyi igazolványukat, miközben már évek óta vásárolnak. Ugyanakkor **üzleti kockázat**:
- Lejárt személyi igazolványok (érvénytelen azonosító)
- Megváltozott cím, telefonszám (elérhetőség problémák)
- Fraud esetek (más néven bérel)

**Jelenleg:** Nincs rendszerszintű szabályozás - kezelő döntése alapján néha kérik, néha nem.

### Megoldás
**Intelligens, időalapú validációs rendszer** színkóddal:
- 🟢 **Zöld (friss):** <90 nap → Nincs ellenőrzés
- 🟡 **Sárga (ajánlott):** 90-180 nap → Figyelmeztetés, de opcionális
- 🔴 **Piros (lejárt):** >180 nap → Erős figyelmeztetés, audit log ha kihagyják

**Konfiguráció:** Rugalmas (ajánlott) / Szigorú (fraud esetén) / Hibrid (törzsvendég kivétel)

### Értékajánlat
- 😊 **UX javulás:** Törzsvendég nem sértődik meg
- 🔒 **Compliance:** Rendszeres adatfrissítés (GDPR)
- 🛡️ **Fraud védelem:** Lejárt igazolvány/változott adat detektálás
- 📊 **Audit trail:** Ki, mikor, miért hagyta ki az ellenőrzést

---

## 🎯 Üzleti Követelmények

### Forrás
**KGC-notes-01, sor 9-120:**
> "Bejön az ügyfél... elvárás vagyon szólítsuk törz vendégként... de közben lejárhatott a szeméigazolványa, megváltoztatott a címe... ő erről nem szól."

### Jelenlegi Állapot (AS-IS)
**Folyamat:** [01-ugyfelfelvitel-folyamat.md](../Flows/01-ugyfelfelvitel-folyamat.md), 1.2 Ügyfél Azonosítás

**Manuális munkafolyamat:**
```
1. Ügyfél belép: "Szia, jöttem Makitáért!"
2. Kezelő keres: CTRL+F "Kovács"
   → 5 találat: Kovács János, Kovács Péter, Kovács Bt., ...
3. Kezelő kérdez: "Melyik utcában laksz?"
4. Partner kiválasztás: Kovács János (Fő utca 12.)
5. Kezelő döntése:
   IF ismerős arcú:
      ├─ "Rendben, tovább" (nincs igazolvány kérés)
   ELSE:
      ├─ "Kérhetem a személyi igazolványát?" (ügyfél megsértődik)
```

**Problémák:**
- ❌ **Nincs szabályzat:** Kezelő szubjektív döntése
- ❌ **Lejárt adatok:** Partner 2020-ban költözött, régi cím
- ❌ **Fraud kockázat:** Más bérel a nevére (nincs validáció)
- ❌ **GDPR compliance:** Adatfrissítési kötelezettség nincs követve
- ❌ **Törzsvendég UX:** Megsértődnek ("Miért kéred minden alkalommal?")

### Elvárt Állapot (TO-BE)

**Intelligens, időalapú munkafolyamat:**
```
1. Ügyfél belép: "Szia, jöttem Makitáért!"
2. Kezelő keres: "Kovács János"
   → Rendszer megjeleníti:

   ┌─────────────────────────────────────────┐
   │ Kovács János                            │
   │ Fő utca 12., Budapest                   │
   │ +36 20 123 4567                         │
   ├─────────────────────────────────────────┤
   │ 🟢 Adatellenőrzés: 45 napja (friss)    │ ← ZÖLD
   │ Személyi ig. lejárat: 2027-05-12       │
   │                                         │
   │ [✓ Kiválaszt]                          │
   └─────────────────────────────────────────┘

3. Kezelő kattint: "Kiválaszt" → Folytatás (nincs kérdés)
```

**VS. Lejárt adat esetén:**
```
   ┌─────────────────────────────────────────┐
   │ Nagy Péter                              │
   │ Kossuth utca 5., Debrecen               │
   │ +36 30 999 8888                         │
   ├─────────────────────────────────────────┤
   │ 🔴 ADATELLENŐRZÉS LEJÁRT!              │ ← PIROS
   │ Utolsó ellenőrzés: 2023-01-10           │
   │ (560 napja!)                            │
   │                                         │
   │ Kérem a személyi igazolványát:          │
   │ [📸 Scan/Fotó] [✏️ Kézi javítás]       │
   │                                         │
   │ ─────────────────────────────────────   │
   │ 🚨 Admin override (audit log):         │
   │ [⚠️ Kihagyom] (magyarázat kötelező)   │
   └─────────────────────────────────────────┘
```

**Előnyök:**
- ✅ **Szabályozottság:** Rendszer diktálja, nem a kezelő szubjektivitása
- ✅ **Törzsvendég UX:** Zöld státusz = nincs kérdés (felismerés)
- ✅ **Adatfrissítés:** Rendszeres 180 napos ciklus
- ✅ **Fraud védelem:** Lejárt igazolvány/változott adat kiszűrése
- ✅ **Audit trail:** Minden override logolva (compliance)

---

## 🏗️ Adatmodell

### Módosított Entitások

#### 1. `partner` Tábla Bővítése

```sql
ALTER TABLE kgc.partner
  -- Adatellenőrzés tracking
  ADD COLUMN utolso_adatellenorzes DATE,
  ADD COLUMN adatellenorzes_gyakorisag INTEGER DEFAULT 180,  -- napokban

  -- Személyi igazolvány tracking
  ADD COLUMN szemelyig_szam VARCHAR(20),  -- "123456AA" (opcionális)
  ADD COLUMN szemelyig_lejarat DATE,

  -- Törzsvendég státusz
  ADD COLUMN torzsvendeg BOOLEAN DEFAULT FALSE,
  ADD COLUMN torzsvendeg_kivetelek JSONB DEFAULT '{}';

-- Indexek gyorsabb lekérdezéshez
CREATE INDEX idx_partner_adatellenorzes ON kgc.partner(utolso_adatellenorzes);
CREATE INDEX idx_partner_szemelyig_lejarat ON kgc.partner(szemelyig_lejarat);
CREATE INDEX idx_partner_torzsvendeg ON kgc.partner(torzsvendeg);

-- Trigger: Automatikus adatellenőrzés mentése
CREATE OR REPLACE FUNCTION set_utolso_adatellenorzes()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.nev IS DISTINCT FROM OLD.nev
     OR NEW.cim IS DISTINCT FROM OLD.cim
     OR NEW.telefonszam IS DISTINCT FROM OLD.telefonszam THEN
    NEW.utolso_adatellenorzes = CURRENT_DATE;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_partner_adatellenorzes
  BEFORE UPDATE ON kgc.partner
  FOR EACH ROW
  EXECUTE FUNCTION set_utolso_adatellenorzes();
```

**Példa adatok:**

```sql
-- Friss adatellenőrzés (zöld)
INSERT INTO partner VALUES (
  gen_random_uuid(),
  'Kovács János',
  'Fő utca 12., Budapest',
  '+36 20 123 4567',
  '123456AA',
  '2027-05-12',  -- Személyi ig. lejárat
  CURRENT_DATE - INTERVAL '45 days',  -- 45 napja ellenőrizve
  180,  -- 180 naponként
  FALSE,  -- Nem törzsvendég
  '{}'
);

-- Közeli ellenőrzés (sárga)
INSERT INTO partner VALUES (
  gen_random_uuid(),
  'Szabó Mária',
  'Kossuth utca 3., Győr',
  '+36 30 555 1234',
  '987654BB',
  '2026-08-20',
  CURRENT_DATE - INTERVAL '120 days',  -- 120 napja ellenőrizve (sárga zóna)
  180,
  FALSE,
  '{}'
);

-- Lejárt ellenőrzés (piros)
INSERT INTO partner VALUES (
  gen_random_uuid(),
  'Nagy Péter',
  'Petőfi utca 7., Debrecen',
  '+36 30 999 8888',
  NULL,  -- Nincs tárolva igazolvány szám
  NULL,
  '2023-01-10',  -- 560+ napja ellenőrizve! (PIROS)
  180,
  FALSE,
  '{}'
);

-- Törzsvendég kivétel
INSERT INTO partner VALUES (
  gen_random_uuid(),
  'Varga István (KGC_2019)',
  'Arany János utca 15., Szeged',
  '+36 70 222 3333',
  '555666CC',
  '2028-12-05',
  '2024-06-01',  -- Régen ellenőrizve, de törzsvendég
  365,  -- Ritkább ellenőrzés (1 év)
  TRUE,  -- Törzsvendég státusz
  '{"auto_approve": true, "reason": "5+ éves ügyfél, VIP státusz"}'
);
```

---

#### 2. `rendszerbeallitas` Tábla (Konfiguráció)

```sql
CREATE TABLE kgc.rendszerbeallitas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kategoria VARCHAR(50) NOT NULL,
  kulcs VARCHAR(100) NOT NULL UNIQUE,
  ertek TEXT NOT NULL,
  tipus VARCHAR(20) NOT NULL CHECK (tipus IN ('BOOLEAN', 'INTEGER', 'STRING', 'JSON')),
  leiras TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  INDEX idx_rendszerbeallitas_kulcs (kulcs)
);

-- Törzsvendég azonosítás beállítások
INSERT INTO rendszerbeallitas (kategoria, kulcs, ertek, tipus, leiras) VALUES
  ('PARTNER', 'KOTELEZO_SZEMELYAZONOSITAS', 'false', 'BOOLEAN',
   'Ha true: minden alkalommal kötelező igazolvány, nincs override'),

  ('PARTNER', 'ADATELLENORZES_CIKLUS_NAP', '180', 'INTEGER',
   'Hány nap után javasolt az adatellenőrzés (alapértelmezett: 180 nap = 6 hónap)'),

  ('PARTNER', 'FIGYELMEZTES_HATARIDO_NAP', '90', 'INTEGER',
   'Hány nap után kezdődik a sárga figyelmeztetés (alapértelmezett: 90 nap)'),

  ('PARTNER', 'TORZSVENDEG_AUTO_APPROVE', 'true', 'BOOLEAN',
   'Törzsvendégeknél automatikus jóváhagyás (nincs figyelmeztetés)'),

  ('PARTNER', 'OVERRIDE_AUDIT_KOTELEZO', 'true', 'BOOLEAN',
   'Override esetén kötelező-e az indoklás (audit log)');
```

---

#### 3. `partner_adatellenorzes_audit` Tábla (Audit Trail)

```sql
CREATE TABLE kgc.partner_adatellenorzes_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES kgc.partner(id) ON DELETE CASCADE,

  ellenorzes_tipus VARCHAR(50) NOT NULL
    CHECK (ellenorzes_tipus IN ('AUTO_APPROVED', 'MANUAL_VERIFIED', 'OVERRIDE_SKIPPED')),

  regi_adatok JSONB,  -- Snapshot before change
  uj_adatok JSONB,    -- Snapshot after change

  felhasznalo_id UUID REFERENCES kgc.felhasznalo(id),
  override_indoklas TEXT,

  timestamp TIMESTAMP DEFAULT NOW(),

  INDEX idx_audit_partner (partner_id),
  INDEX idx_audit_timestamp (timestamp),
  INDEX idx_audit_tipus (ellenorzes_tipus)
);
```

**Példa audit rekordok:**

```sql
-- Automatikus jóváhagyás (zöld státusz)
INSERT INTO partner_adatellenorzes_audit VALUES (
  gen_random_uuid(),
  'partner-uuid-kovacs-janos',
  'AUTO_APPROVED',
  NULL,
  NULL,
  NULL,  -- Nincs user interaction
  'Adatellenőrzés: 45 napja (zöld). Automatikusan jóváhagyva.',
  NOW()
);

-- Manuális ellenőrzés (személyi ig. scan)
INSERT INTO partner_adatellenorzes_audit VALUES (
  gen_random_uuid(),
  'partner-uuid-nagy-peter',
  'MANUAL_VERIFIED',
  '{"nev": "Nagy Péter", "cim": "Régi cím", "telefonszam": "+36 30 999 8888"}',
  '{"nev": "Nagy Péter", "cim": "ÚJ CÍM: Kossuth utca 10.", "telefonszam": "+36 30 111 2222"}',
  'felhasznalo-uuid-maria',
  'Személyi igazolvány ellenőrizve. Cím és telefonszám frissítve.',
  NOW()
);

-- Override (admin kihagyta)
INSERT INTO partner_adatellenorzes_audit VALUES (
  gen_random_uuid(),
  'partner-uuid-nagy-peter',
  'OVERRIDE_SKIPPED',
  NULL,
  NULL,
  'felhasznalo-uuid-admin',
  'Ügyfél sietett, nem volt idő ellenőrzésre. Következő alkalommal kötelező.',
  NOW()
);
```

---

## 🎨 UI/UX Változások

### 1. Partner Kártya - Színkódos Jelzés

#### React Komponens: `PartnerCard`

```tsx
import React from 'react';
import { Card, Chip, Typography, Box, Alert } from '@mui/material';
import { CheckCircle, Warning, Error } from '@mui/icons-material';
import { differenceInDays } from 'date-fns';

interface PartnerCardProps {
  partner: Partner;
  onSelect: (partner: Partner) => void;
}

export function PartnerCard({ partner, onSelect }: PartnerCardProps) {
  const validationStatus = getValidationStatus(partner);

  return (
    <Card
      sx={{
        p: 2,
        border: `2px solid ${validationStatus.color}`,
        cursor: 'pointer',
        '&:hover': { boxShadow: 3 },
      }}
      onClick={() => handleClick()}
    >
      {/* Partner adatok */}
      <Typography variant="h6">{partner.nev}</Typography>
      <Typography variant="body2">{partner.cim}</Typography>
      <Typography variant="body2">{partner.telefonszam}</Typography>

      <Box mt={2}>
        {/* Státusz chip */}
        <Chip
          icon={validationStatus.icon}
          label={validationStatus.label}
          color={validationStatus.chipColor}
          size="small"
        />

        {/* Részletes info */}
        <Typography variant="caption" display="block" mt={1}>
          Utolsó ellenőrzés: {partner.utolso_adatellenorzes || 'Soha'}
          {partner.utolso_adatellenorzes && ` (${validationStatus.daysAgo} napja)`}
        </Typography>

        {partner.szemelyig_lejarat && (
          <Typography variant="caption" display="block">
            Személyi ig. lejárat: {partner.szemelyig_lejarat}
          </Typography>
        )}

        {/* Figyelmeztetés (sárga/piros) */}
        {validationStatus.showWarning && (
          <Alert severity={validationStatus.severity} sx={{ mt: 1 }}>
            {validationStatus.warningMessage}
          </Alert>
        )}
      </Box>
    </Card>
  );
}

function getValidationStatus(partner: Partner) {
  const config = useConfig();  // ADATELLENORZES_CIKLUS_NAP, FIGYELMEZTES_HATARIDO_NAP

  if (!partner.utolso_adatellenorzes) {
    // Nincs még ellenőrizve
    return {
      color: '#d32f2f',
      icon: <Error />,
      label: 'Nincs ellenőrizve',
      chipColor: 'error',
      severity: 'error',
      showWarning: true,
      warningMessage: 'Kérem a személyi igazolványát!',
      daysAgo: null,
    };
  }

  const daysAgo = differenceInDays(new Date(), new Date(partner.utolso_adatellenorzes));

  if (daysAgo < config.FIGYELMEZTES_HATARIDO_NAP) {
    // Zöld: friss adat
    return {
      color: '#4caf50',
      icon: <CheckCircle />,
      label: 'Friss adat',
      chipColor: 'success',
      severity: 'success',
      showWarning: false,
      daysAgo,
    };
  } else if (daysAgo < config.ADATELLENORZES_CIKLUS_NAP) {
    // Sárga: ellenőrzés ajánlott
    return {
      color: '#ff9800',
      icon: <Warning />,
      label: 'Ellenőrzés ajánlott',
      chipColor: 'warning',
      severity: 'warning',
      showWarning: true,
      warningMessage: `${daysAgo} napja nem ellenőriztük. Kérem frissítse az adatokat!`,
      daysAgo,
    };
  } else {
    // Piros: lejárt ellenőrzés
    return {
      color: '#d32f2f',
      icon: <Error />,
      label: 'LEJÁRT ELLENŐRZÉS',
      chipColor: 'error',
      severity: 'error',
      showWarning: true,
      warningMessage: `${daysAgo} napja nem ellenőriztük! Kötelező személyi igazolvány!`,
      daysAgo,
    };
  }
}

function handleClick() {
  const validationStatus = getValidationStatus(partner);

  if (validationStatus.showWarning && !partner.torzsvendeg) {
    // Figyelmeztetés modal megjelenítése
    openValidationDialog(partner);
  } else {
    // Automatikus jóváhagyás
    onSelect(partner);
  }
}
```

---

### 2. Validációs Dialog (Piros/Sárga esetén)

```tsx
function PartnerValidationDialog({ partner, onConfirm, onCancel }) {
  const [validationMethod, setValidationMethod] = useState('scan');
  const [overrideReason, setOverrideReason] = useState('');
  const [updatedData, setUpdatedData] = useState({
    nev: partner.nev,
    cim: partner.cim,
    telefonszam: partner.telefonszam,
  });

  const handleVerify = async () => {
    if (validationMethod === 'scan') {
      // Személyi igazolvány OCR scan (Felhő service)
      const scannedData = await ocrService.scanID();
      setUpdatedData(scannedData);
    }

    // Adatok mentése
    await api.put(`/partner/${partner.id}/validate`, {
      ...updatedData,
      utolso_adatellenorzes: new Date(),
    });

    // Audit log
    await api.post('/partner-audit', {
      partner_id: partner.id,
      ellenorzes_tipus: 'MANUAL_VERIFIED',
      regi_adatok: { ...partner },
      uj_adatok: updatedData,
    });

    onConfirm(partner);
  };

  const handleOverride = async () => {
    if (!overrideReason.trim()) {
      alert('Indoklás kötelező!');
      return;
    }

    // Audit log (override)
    await api.post('/partner-audit', {
      partner_id: partner.id,
      ellenorzes_tipus: 'OVERRIDE_SKIPPED',
      override_indoklas: overrideReason,
    });

    onConfirm(partner);
  };

  return (
    <Dialog open onClose={onCancel} maxWidth="sm" fullWidth>
      <DialogTitle>🔴 Adatellenőrzés Szükséges</DialogTitle>
      <DialogContent>
        <Alert severity="error" sx={{ mb: 2 }}>
          Utolsó ellenőrzés: {partner.utolso_adatellenorzes} (
          {differenceInDays(new Date(), new Date(partner.utolso_adatellenorzes))} napja)
        </Alert>

        <Typography variant="h6" gutterBottom>
          Partner: {partner.nev}
        </Typography>

        {/* Validációs módszer választó */}
        <FormControl component="fieldset" sx={{ mt: 2 }}>
          <FormLabel>Ellenőrzési Módszer:</FormLabel>
          <RadioGroup value={validationMethod} onChange={(e) => setValidationMethod(e.target.value)}>
            <FormControlLabel
              value="scan"
              control={<Radio />}
              label="📸 Személyi igazolvány scan (OCR)"
            />
            <FormControlLabel
              value="manual"
              control={<Radio />}
              label="✏️ Kézi adatfrissítés"
            />
          </RadioGroup>
        </FormControl>

        {/* Kézi adatbevitel */}
        {validationMethod === 'manual' && (
          <Box mt={2}>
            <TextField
              fullWidth
              label="Név"
              value={updatedData.nev}
              onChange={(e) => setUpdatedData({ ...updatedData, nev: e.target.value })}
              margin="dense"
            />
            <TextField
              fullWidth
              label="Cím"
              value={updatedData.cim}
              onChange={(e) => setUpdatedData({ ...updatedData, cim: e.target.value })}
              margin="dense"
            />
            <TextField
              fullWidth
              label="Telefonszám"
              value={updatedData.telefonszam}
              onChange={(e) => setUpdatedData({ ...updatedData, telefonszam: e.target.value })}
              margin="dense"
            />
          </Box>
        )}

        {/* Admin override */}
        <Divider sx={{ my: 2 }} />
        <Typography variant="body2" color="error">
          🚨 Admin Override (audit napló kötelező):
        </Typography>
        <TextField
          fullWidth
          multiline
          rows={2}
          placeholder="Indoklás (pl. 'Ügyfél sietett, nincs nála igazolvány')"
          value={overrideReason}
          onChange={(e) => setOverrideReason(e.target.value)}
          margin="dense"
        />
      </DialogContent>

      <DialogActions>
        <Button onClick={onCancel}>Mégse</Button>
        <Button
          onClick={handleOverride}
          disabled={!overrideReason.trim()}
          color="warning"
        >
          ⚠️ Kihagyom (override)
        </Button>
        <Button
          onClick={handleVerify}
          variant="contained"
          color="success"
        >
          ✅ Ellenőrzés Befejezve
        </Button>
      </DialogActions>
    </Dialog>
  );
}
```

---

### 3. Admin Dashboard - Lejárt Ellenőrzések Listája

```tsx
function ExpiredValidationsReport() {
  const [expiredPartners, setExpiredPartners] = useState([]);
  const config = useConfig();

  useEffect(() => {
    fetchExpiredPartners();
  }, []);

  const fetchExpiredPartners = async () => {
    const response = await api.get('/partner/expired-validations', {
      params: {
        threshold_days: config.ADATELLENORZES_CIKLUS_NAP
      }
    });
    setExpiredPartners(response.data);
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        📋 Lejárt Adatellenőrzések ({expiredPartners.length} db)
      </Typography>

      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Partner</TableCell>
            <TableCell>Utolsó ellenőrzés</TableCell>
            <TableCell>Napok óta</TableCell>
            <TableCell>Státusz</TableCell>
            <TableCell>Művelet</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {expiredPartners.map(partner => {
            const daysAgo = differenceInDays(
              new Date(),
              new Date(partner.utolso_adatellenorzes)
            );

            return (
              <TableRow key={partner.id}>
                <TableCell>{partner.nev}</TableCell>
                <TableCell>{partner.utolso_adatellenorzes || '—'}</TableCell>
                <TableCell>
                  <Chip
                    label={`${daysAgo} nap`}
                    color={daysAgo > 365 ? 'error' : 'warning'}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  {daysAgo > 365 ? '🔴 Kritikus' : '🟡 Figyelmeztetés'}
                </TableCell>
                <TableCell>
                  <Button
                    size="small"
                    onClick={() => openValidationDialog(partner)}
                  >
                    Ellenőrzés
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </Box>
  );
}
```

---

## 🧠 Üzleti Logika

### Backend Service: `PartnerValidationService`

```typescript
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Partner, PartnerAdatellenorzesAudit, Rendszerbeallitas } from './entities';
import { differenceInDays } from 'date-fns';

@Injectable()
export class PartnerValidationService {

  constructor(
    @InjectRepository(Partner)
    private partnerRepo: Repository<Partner>,

    @InjectRepository(PartnerAdatellenorzesAudit)
    private auditRepo: Repository<PartnerAdatellenorzesAudit>,

    @InjectRepository(Rendszerbeallitas)
    private configRepo: Repository<Rendszerbeallitas>,
  ) {}

  /**
   * Partner validációs státusz ellenőrzése
   */
  async getValidationStatus(partnerId: string): Promise<ValidationStatus> {
    const partner = await this.partnerRepo.findOne({ where: { id: partnerId } });
    if (!partner) throw new Error('Partner nem található');

    const config = await this.getConfig();

    // Törzsvendég automatikus jóváhagyás
    if (partner.torzsvendeg && config.TORZSVENDEG_AUTO_APPROVE) {
      return {
        status: 'AUTO_APPROVED',
        color: 'green',
        requiresAction: false,
        message: 'Törzsvendég - automatikus jóváhagyás',
      };
    }

    // Kötelező azonosítás mód
    if (config.KOTELEZO_SZEMELYAZONOSITAS) {
      return {
        status: 'MANDATORY',
        color: 'red',
        requiresAction: true,
        message: 'Kötelező személyazonosítás (rendszerbeállítás)',
      };
    }

    // Nincs még ellenőrizve
    if (!partner.utolso_adatellenorzes) {
      return {
        status: 'NEVER_VERIFIED',
        color: 'red',
        requiresAction: true,
        message: 'Még soha nem ellenőriztük az adatokat',
      };
    }

    // Időalapú logika
    const daysAgo = differenceInDays(new Date(), new Date(partner.utolso_adatellenorzes));

    if (daysAgo < config.FIGYELMEZTES_HATARIDO_NAP) {
      // Zöld: friss
      return {
        status: 'FRESH',
        color: 'green',
        requiresAction: false,
        message: `Utolsó ellenőrzés: ${daysAgo} napja`,
        daysAgo,
      };
    } else if (daysAgo < config.ADATELLENORZES_CIKLUS_NAP) {
      // Sárga: ajánlott
      return {
        status: 'RECOMMENDED',
        color: 'yellow',
        requiresAction: false,
        message: `Ellenőrzés ajánlott (${daysAgo} napja)`,
        daysAgo,
        showWarning: true,
      };
    } else {
      // Piros: lejárt
      return {
        status: 'EXPIRED',
        color: 'red',
        requiresAction: true,
        message: `LEJÁRT ellenőrzés (${daysAgo} napja)!`,
        daysAgo,
        showWarning: true,
      };
    }
  }

  /**
   * Partner adatok manuális validálása
   */
  async validatePartner(
    partnerId: string,
    updatedData: Partial<Partner>,
    userId: string
  ): Promise<void> {

    const partner = await this.partnerRepo.findOne({ where: { id: partnerId } });
    const oldData = { ...partner };

    // Adatok frissítése
    Object.assign(partner, updatedData);
    partner.utolso_adatellenorzes = new Date();

    await this.partnerRepo.save(partner);

    // Audit log
    await this.auditRepo.save({
      partner_id: partnerId,
      ellenorzes_tipus: 'MANUAL_VERIFIED',
      regi_adatok: oldData,
      uj_adatok: updatedData,
      felhasznalo_id: userId,
      override_indoklas: 'Személyi igazolvány ellenőrizve és adatok frissítve.',
    });
  }

  /**
   * Override (admin kihagyja az ellenőrzést)
   */
  async overrideValidation(
    partnerId: string,
    reason: string,
    userId: string
  ): Promise<void> {

    if (!reason || reason.trim().length < 10) {
      throw new Error('Indoklás kötelező (min. 10 karakter)');
    }

    const config = await this.getConfig();

    if (!config.OVERRIDE_AUDIT_KOTELEZO) {
      throw new Error('Override nem engedélyezett (rendszerbeállítás)');
    }

    // Csak audit log, nem frissítjük az adatokat
    await this.auditRepo.save({
      partner_id: partnerId,
      ellenorzes_tipus: 'OVERRIDE_SKIPPED',
      regi_adatok: null,
      uj_adatok: null,
      felhasznalo_id: userId,
      override_indoklas: reason,
    });

    // Email értesítés adminnak
    await this.emailService.sendAdminAlert({
      subject: 'Partner validáció kihagyva (override)',
      body: `Partner: ${partnerId}\nUser: ${userId}\nIndok: ${reason}`,
    });
  }

  /**
   * Lejárt ellenőrzések lekérdezése (riport)
   */
  async getExpiredValidations(thresholdDays: number = 180): Promise<Partner[]> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - thresholdDays);

    return await this.partnerRepo
      .createQueryBuilder('p')
      .where('p.utolso_adatellenorzes < :cutoffDate', { cutoffDate })
      .orWhere('p.utolso_adatellenorzes IS NULL')
      .orderBy('p.utolso_adatellenorzes', 'ASC')
      .getMany();
  }

  /**
   * Konfiguráció lekérése
   */
  private async getConfig() {
    const config = await this.configRepo.find({
      where: { kategoria: 'PARTNER' }
    });

    return {
      KOTELEZO_SZEMELYAZONOSITAS: config.find(c => c.kulcs === 'KOTELEZO_SZEMELYAZONOSITAS')?.ertek === 'true',
      ADATELLENORZES_CIKLUS_NAP: parseInt(config.find(c => c.kulcs === 'ADATELLENORZES_CIKLUS_NAP')?.ertek || '180'),
      FIGYELMEZTES_HATARIDO_NAP: parseInt(config.find(c => c.kulcs === 'FIGYELMEZTES_HATARIDO_NAP')?.ertek || '90'),
      TORZSVENDEG_AUTO_APPROVE: config.find(c => c.kulcs === 'TORZSVENDEG_AUTO_APPROVE')?.ertek === 'true',
      OVERRIDE_AUDIT_KOTELEZO: config.find(c => c.kulcs === 'OVERRIDE_AUDIT_KOTELEZO')?.ertek === 'true',
    };
  }
}
```

---

## 📊 Konfiguráció Stratégiák

### Stratégia 1: Rugalmas (AJÁNLOTT Induláshoz)

```yaml
Beállítások:
  KOTELEZO_SZEMELYAZONOSITAS: false
  ADATELLENORZES_CIKLUS_NAP: 180  # 6 hónap
  FIGYELMEZTES_HATARIDO_NAP: 90   # 3 hónap
  TORZSVENDEG_AUTO_APPROVE: true
  OVERRIDE_AUDIT_KOTELEZO: true

Működés:
  - Zöld (<90 nap): Automatikus jóváhagyás
  - Sárga (90-180 nap): Figyelmeztetés, de folytatható
  - Piros (>180 nap): Erős figyelmeztetés, de override-olható

Előny:
  ✅ Felhasználóbarát (törzsvendég nem sértődik)
  ✅ Flexibilis (kezelő dönthet)

Hátrány:
  ⚠️ Fraud kockázat (ha túl sok override)
```

---

### Stratégia 2: Szigorú (Fraud Probléma Esetén)

```yaml
Beállítások:
  KOTELEZO_SZEMELYAZONOSITAS: true  # ← Minden alkalommal kötelező!
  ADATELLENORZES_CIKLUS_NAP: 90     # Gyakoribb ellenőrzés
  FIGYELMEZTES_HATARIDO_NAP: 30
  TORZSVENDEG_AUTO_APPROVE: false   # ← Törzsvendég sem kivétel!
  OVERRIDE_AUDIT_KOTELEZO: true

Működés:
  - MINDEN alkalommal kell személyi igazolvány
  - Nincs színkód (mindig kötelező)
  - Override csak MANAGER joggal

Előny:
  ✅ Maximális biztonság
  ✅ Fraud kockázat minimális

Hátrány:
  ❌ Rossz UX (törzsvendég is kell igazolványt mutassa)
  ❌ Lassabb kiszolgálás
```

---

### Stratégia 3: Hibrid (Törzsvendég Kivétel)

```yaml
Beállítások:
  KOTELEZO_SZEMELYAZONOSITAS: false
  ADATELLENORZES_CIKLUS_NAP: 180
  FIGYELMEZTES_HATARIDO_NAP: 90
  TORZSVENDEG_AUTO_APPROVE: true    # ← Törzsvendég automatikus
  OVERRIDE_AUDIT_KOTELEZO: true

+ Törzsvendég jelölés feltétele:
  - 5+ éves ügyfél
  - Minimum 10 bérlés
  - 0 fraud eset
  - Manuális jóváhagyás (admin)

Működés:
  IF partner.torzsvendeg = true:
    → Automatikus jóváhagyás (nincs figyelmeztetés)
  ELSE:
    → Szigorú ellenőrzés (időalapú logika)

Előny:
  ✅ Törzsvendég VIP kezelés
  ✅ Új/ismeretlen ügyféleknél szigorú

Hátrány:
  ⚠️ Törzsvendég státusz karbantartása
```

---

## 🧪 Tesztelési Stratégia

### Unit Tesztek

```typescript
describe('PartnerValidationService', () => {

  describe('getValidationStatus', () => {

    it('should return FRESH for recent validation (<90 days)', async () => {
      const partner = {
        id: 'uuid',
        utolso_adatellenorzes: subDays(new Date(), 45),  // 45 napja
        torzsvendeg: false,
      };

      const status = await service.getValidationStatus(partner.id);

      expect(status.status).toBe('FRESH');
      expect(status.color).toBe('green');
      expect(status.requiresAction).toBe(false);
    });

    it('should return RECOMMENDED for 90-180 days (yellow)', async () => {
      const partner = {
        utolso_adatellenorzes: subDays(new Date(), 120),  // 120 napja
      };

      const status = await service.getValidationStatus(partner.id);

      expect(status.status).toBe('RECOMMENDED');
      expect(status.color).toBe('yellow');
      expect(status.showWarning).toBe(true);
    });

    it('should return EXPIRED for >180 days (red)', async () => {
      const partner = {
        utolso_adatellenorzes: subDays(new Date(), 250),  // 250 napja
      };

      const status = await service.getValidationStatus(partner.id);

      expect(status.status).toBe('EXPIRED');
      expect(status.color).toBe('red');
      expect(status.requiresAction).toBe(true);
    });

    it('should AUTO_APPROVE for törzsvendég', async () => {
      const partner = {
        utolso_adatellenorzes: subDays(new Date(), 300),  // Régi, de törzsvendég
        torzsvendeg: true,
      };

      const status = await service.getValidationStatus(partner.id);

      expect(status.status).toBe('AUTO_APPROVED');
      expect(status.requiresAction).toBe(false);
    });
  });

  describe('overrideValidation', () => {

    it('should throw error if reason is too short', async () => {
      await expect(
        service.overrideValidation('uuid', 'rövid', 'user-id')
      ).rejects.toThrow('Indoklás kötelező (min. 10 karakter)');
    });

    it('should create audit log for valid override', async () => {
      await service.overrideValidation(
        'partner-uuid',
        'Ügyfél sietett, nincs nála igazolvány',
        'user-uuid'
      );

      const audit = await auditRepo.findOne({
        where: { partner_id: 'partner-uuid', ellenorzes_tipus: 'OVERRIDE_SKIPPED' }
      });

      expect(audit).toBeDefined();
      expect(audit.override_indoklas).toContain('sietett');
    });
  });
});
```

---

### E2E Teszt Szcenáriók

#### Szcenárió 1: Zöld Státusz (Automatikus Jóváhagyás)

```gherkin
Feature: Törzsvendég automatikus jóváhagyás

  Scenario: Partner kiválasztása zöld státusszal
    Given van egy partner "Kovács János"
    And utolsó_adatellenorzes = 45 napja
    When kezelő kiválasztja a partnert
    Then nincs validációs dialog
    And partner automatikusan jóváhagyva
    And audit log: "AUTO_APPROVED"
```

---

#### Szcenárió 2: Sárga Státusz (Figyelmeztetés)

```gherkin
  Scenario: Partner kiválasztása sárga státusszal
    Given van egy partner "Szabó Mária"
    And utolsó_adatellenorzes = 120 napja
    When kezelő kiválasztja a partnert
    Then megjelenik figyelmeztetés: "Ellenőrzés ajánlott (120 napja)"
    And van "Folytatás" gomb (opcionális)
    And van "Ellenőrzés Most" gomb (javasolt)
```

---

#### Szcenárió 3: Piros Státusz (Kötelező Ellenőrzés)

```gherkin
  Scenario: Partner kiválasztása piros státusszal
    Given van egy partner "Nagy Péter"
    And utolsó_adatellenorzes = 560 napja
    When kezelő kiválasztja a partnert
    Then megjelenik PIROS figyelmeztetés: "LEJÁRT ELLENŐRZÉS (560 napja)!"
    And van "Személyi Igazolvány Scan" opció
    And van "Kézi Adatfrissítés" opció
    And van "Admin Override" (indoklás kötelező)
```

---

#### Szcenárió 4: Override Audit Trail

```gherkin
  Scenario: Admin override audit napló
    Given piros státuszú partner
    When admin kattint "Kihagyom (override)"
    And beírja indoklást: "Ügyfél sietett, nincs nála igazolvány"
    Then létrejön audit log rekord:
      | partner_id       | nagy-peter-uuid          |
      | ellenorzes_tipus | OVERRIDE_SKIPPED         |
      | override_indoklas| Ügyfél sietett...        |
      | felhasznalo_id   | admin-uuid               |
    And admin kap email értesítést
```

---

## 📅 Implementációs Ütemterv

### Sprint Breakdown (2 hét, 5-8 SP)

#### **Sprint 1: Backend + Adatmodell (Hét 1, 3 SP)**
- ✅ Adatmodell módosítás (`partner`, `rendszerbeallitas`, `audit`)
- ✅ Migration script (meglévő partnerek → `utolso_adatellenorzes` = NULL)
- ✅ `PartnerValidationService` implementáció
- ✅ API végpontok (`/partner/:id/validation-status`, `/partner/:id/validate`, `/partner/:id/override`)
- ✅ Unit tesztek (validation logic)

#### **Sprint 2: Frontend UI (Hét 2, 3 SP)**
- ✅ `PartnerCard` komponens (színkódos megjelenítés)
- ✅ `PartnerValidationDialog` (scan/manual/override)
- ✅ Admin dashboard (lejárt ellenőrzések riport)
- ✅ E2E tesztek (Playwright)

#### **Sprint 3 (Opcionális): OCR Integráció (V2, 2 SP)**
- ⏳ Személyi igazolvány OCR service (Felhő API)
- ⏳ Automatikus adatkinyerés (név, cím, születési dátum)
- ⏳ Képfeldolgozás (kép → szöveg)

---

### MVP Scope (Hét 1-2)

**IN:**
- ✅ Időalapú validáció (zöld/sárga/piros)
- ✅ Színkódos UI jelzés
- ✅ Validációs dialog (kézi adatfrissítés)
- ✅ Admin override (audit log)
- ✅ Konfiguráció (Rugalmas/Szigorú/Hibrid)
- ✅ Lejárt ellenőrzések riport

**OUT (V2):**
- ⏳ OCR scan (személyi igazolvány automatikus olvasás)
- ⏳ Törzs vendég automatikus detektálás (gépi tanulás: 5+ éves ügyfél)
- ⏳ SMS értesítés (személyi ig. lejárat előtt 30 nappal)

---

## 💰 ROI Kalkuláció

### Jelenlegi Állapot (Manuális)

| Metrika | Érték |
|---------|-------|
| Napi ügyfélforgalom | 30 ügyfél/nap |
| Átlagos azonosítási idő | 2 perc/ügyfél (kérdezés + igazolvány) |
| **Napi időráfordítás** | **60 perc** |
| Havi munkaidő | 20 óra (20 munkanap) |
| Átlagos órabér | 3000 Ft/óra |
| **Havi költség** | **60.000 Ft** |
| Ügyfél elégedetlenség | 10-15% (törzsvendég megsértődik) |
| Churn rate | ~5% (megsértődés miatti elvándorlás) |
| **Veszteség/év** | ~200.000 Ft (elvesztett ügyfelek) |

---

### Jövőbeni Állapot (Automatizált)

| Metrika | Érték |
|---------|-------|
| Automatikus jóváhagyás (zöld) | 70% (21 ügyfél) |
| Sárga figyelmeztetés (gyors) | 20% (6 ügyfél, 30 sec/fő) |
| Piros ellenőrzés (teljes) | 10% (3 ügyfél, 2 perc/fő) |
| **Napi időráfordítás** | **9 perc** (0 + 3 + 6 perc) |
| Havi munkaidő | 3 óra |
| **Havi költség** | **9.000 Ft** |
| Ügyfél elégedetlenség | <3% (törzsvendég elégedett) |
| Churn rate | ~1% |
| **Megtakarított veszteség** | ~160.000 Ft/év |

---

### Megtakarítás

| Metrika | Érték |
|---------|-------|
| **Havi megtakarítás (idő)** | **51.000 Ft** (60k → 9k) |
| **Éves megtakarítás (idő)** | **612.000 Ft** |
| **Churn csökkenés** | **160.000 Ft/év** |
| **ÖSSZES ÉVES HASZON** | **772.000 Ft** |
| Fejlesztési költség (2 hét, 1 dev) | ~1.000.000 Ft |
| **Megtérülési idő** | **16 hónap** |

---

## 🎯 Sikerkritériumok

### Acceptance Criteria

1. ✅ **Színkódos megjelenítés:** Partner kártyán látható zöld/sárga/piros jelzés
2. ✅ **Automatikus jóváhagyás:** Zöld státusz esetén nincs kérdés (70%+ ügyféleknél)
3. ✅ **Figyelmeztetés (sárga):** Opcionális ellenőrzés, de folytatható
4. ✅ **Kötelező ellenőrzés (piros):** Dialog megjelenítés, csak validálás vagy override után folytatható
5. ✅ **Audit trail:** Minden override 100%-ban naplózva (ki, mikor, miért)
6. ✅ **Admin riport:** Lejárt ellenőrzések listája naprakészen

---

### KPI Tracking (3 hónapos pilot)

| KPI | Cél | Mérés |
|-----|-----|-------|
| Automatikus jóváhagyási arány | ≥70% | `COUNT(zöld) / COUNT(*)` |
| Override használat | <5% | `COUNT(override) / COUNT(piros)` |
| Átlagos validációs idő | <30 sec | Manuális mérés (sárga/piros esetén) |
| Ügyfél elégedetlenség | <3% | Survey ("Megkérdezték az igazolványomat?") |
| Adatok naprakészsége | ≥80% | `COUNT(zöld+sárga) / COUNT(*)` |

---

## 🚀 Kockázatok és Mitigáció

| Kockázat | Valószínűség | Hatás | Mitigáció |
|----------|--------------|-------|-----------|
| **Túl sok override** | Közepes | Közepes | Email alert admin-nak, ha >10 override/hét |
| **Törzsvendég sérelmet érez** | Alacsony | Alacsony | Törzsvendég auto-approve (Hibrid stratégia) |
| **GDPR panasz** | Alacsony | Magas | Audit trail + adatvédelmi tájékoztató |
| **Kezelő ellenállás** | Közepes | Közepes | Képzés, UX egyszerűsítés (1-kattintásos validáció) |

---

## 📚 Kapcsolódó Dokumentumok

- **Folyamat:** [01-ugyfelfelvitel-folyamat.md](../Flows/01-ugyfelfelvitel-folyamat.md), 1.2 Ügyfél Azonosítás
- **Fit-Gap Analízis:** [KGC-ERP-v3-Fit-Gap-Analízis-2025-12-29.md](../KGC-ERP-v3-Fit-Gap-Analízis-2025-12-29.md), sor 382-462
- **GDPR Compliance:** [Adatvédelmi Irányelvek](../Legal/GDPR.md)

---

## 🏁 Összefoglalás

A **Törzsvendég Személyazonosítás** feature **kiegyensúlyozott megoldást** nyújt az ügyfélélmény és a biztonság között:

- 😊 **UX javulás:** Törzsvendég nem sértődik meg (zöld státusz → automatikus)
- 🔒 **Biztonság:** Rendszeres adatfrissítés (180 napos ciklus)
- 📊 **Audit trail:** Minden override nyomon követhető
- ⚙️ **Konfiguráció:** Rugalmas/Szigorú/Hibrid stratégiák

**Technikai megvalósítás:**
- **Időalapú validáció** (utolso_adatellenorzes + threshold)
- **Színkódos UI** (zöld/sárga/piros)
- **3-szintű döntési logika** (auto-approve / warning / mandatory)
- **Audit log** minden művelethez

**Implementáció:** 2 hét, 5-8 SP, 1 fejlesztő

**ROI:** 772.000 Ft/év megtakarítás (16 hónap megtérülés)

---

**Következő lépés:** Excalidraw flowchart diagram készítése az azonosítási folyamatról.
