# Feature Architektúra: Lista Ár - Kedvezmény Kezelés Számlán

**Dokumentum verziója:** 1.0
**Létrehozva:** 2025-12-29
**Szerző:** Winston (Architect Agent, BMAD Method)
**Prioritás:** 🟡 MAGAS
**Kapcsolódó Fit-Gap:** #7

---

## 📋 Executive Summary

### Üzleti Probléma

**Jelenlegi állapot:**
- CIKK táblában van `beszerzesi_ar` és `eladasi_ar` mező
- Számlán csak a végső egységár jelenik meg
- Nincs láthatóság a kedvezményre: lista ár vs. kedvezményes ár

**Üzleti igény** (KGC-notes-01, sor 445-467):
> "A rendszer tudja kezelni a számlán lévő lista ár mínusz kedvezmény ára... a beszállás és a listát pedig az eladási ár legyen."

**GAP típusa:** ⚠️ RÉSZLEGES - Árképzés van, kedvezmény láthatóság nincs

### Javasolt Megoldás

**Transzparens árazás számlán:**
- **Lista ár**: Eredeti eladási ár (ajánlott)
- **Kedvezmény**: Százalék vagy összeg formában
- **Egységár**: Lista ár - kedvezmény (végső ár)
- **Megtakarítás**: Összesített kedvezmény összeg számla végén

**ROI:**
- Marketing előny: "Ön megtakarított: 5.000 Ft!"
- Átláthatóság: ügyfél látja az értéket
- NAV compliance: lista ár vs. kedvezmény tisztán elválik

---

## 🏗️ Technikai Architektúra

### Adatmodell

#### MÓDOSÍTOTT: SZÁMLA_TÉTEL

```sql
ALTER TABLE kgc.szamla_tetel
  ADD COLUMN listar DECIMAL(12, 2),  -- Eredeti eladási ár
  ADD COLUMN kedvezmeny_szazalek DECIMAL(5, 2) DEFAULT 0,  -- 0-100%
  ADD COLUMN kedvezmeny_osszeg DECIMAL(12, 2) DEFAULT 0,  -- Kalkulált: listar * kedvezmeny%
  ADD COLUMN vegso_egysegar DECIMAL(12, 2);  -- listar - kedvezmeny_osszeg

-- Constraint: vegso_egysegar >= 0
ALTER TABLE kgc.szamla_tetel
  ADD CONSTRAINT check_vegso_egysegar_pozitiv CHECK (vegso_egysegar >= 0);

-- Constraint: kedvezmeny_szazalek 0-100 között
ALTER TABLE kgc.szamla_tetel
  ADD CONSTRAINT check_kedvezmeny_szazalek CHECK (kedvezmeny_szazalek BETWEEN 0 AND 100);
```

#### MÓDOSÍTOTT: ÉRTÉKESÍTÉS_TÉTEL (hasonló logika)

```sql
ALTER TABLE kgc.ertekesites_tetel
  ADD COLUMN listar DECIMAL(12, 2),
  ADD COLUMN kedvezmeny_szazalek DECIMAL(5, 2) DEFAULT 0,
  ADD COLUMN kedvezmeny_osszeg DECIMAL(12, 2) DEFAULT 0,
  ADD COLUMN vegso_egysegar DECIMAL(12, 2);

-- Constraints (ugyanaz mint számla_tetel)
ALTER TABLE kgc.ertekesites_tetel
  ADD CONSTRAINT check_ertekesites_vegso_egysegar_pozitiv CHECK (vegso_egysegar >= 0),
  ADD CONSTRAINT check_ertekesites_kedvezmeny_szazalek CHECK (kedvezmeny_szazalek BETWEEN 0 AND 100);
```

#### ÚJ: RENDSZERBEÁLLÍTÁS (konfiguráció)

```sql
CREATE TABLE IF NOT EXISTS kgc.rendszerbeallitas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kategoria VARCHAR(50) NOT NULL,
  kulcs VARCHAR(100) NOT NULL UNIQUE,
  ertek TEXT NOT NULL,
  tipus VARCHAR(20) CHECK (tipus IN ('BOOLEAN', 'INTEGER', 'STRING', 'JSON')) NOT NULL,
  leiras TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Számla megjelenés beállítások
INSERT INTO kgc.rendszerbeallitas (kategoria, kulcs, ertek, tipus, leiras) VALUES
  ('SZAMLA', 'MUTASD_LISTAR', 'true', 'BOOLEAN', 'Lista ár megjelenítése számlán'),
  ('SZAMLA', 'MUTASD_KEDVEZMENYT', 'true', 'BOOLEAN', 'Kedvezmény % megjelenítése'),
  ('SZAMLA', 'MUTASD_MEGTAKARITAST', 'true', 'BOOLEAN', 'Összesített megtakarítás lábléchez');
```

---

### Üzleti Logika

#### Számítási Szabályok

```typescript
// backend/src/services/szamla.service.ts

interface SzamlaTetelInput {
  cikk_id: string;
  mennyiseg: number;
  kedvezmeny_szazalek?: number;  // Opcionális, alapértelmezett: 0
}

class SzamlaService {
  async createSzamlaTetel(input: SzamlaTetelInput): Promise<SzamlaTetel> {
    const cikk = await this.cikkRepo.findOne({ where: { id: input.cikk_id } });

    if (!cikk) {
      throw new NotFoundException('Cikk nem található');
    }

    // Lista ár = CIKK eladási ár
    const listar = cikk.eladasi_ar;

    // Kedvezmény kalkuláció
    const kedvezmeny_szazalek = input.kedvezmeny_szazalek || 0;
    const kedvezmeny_osszeg = (listar * kedvezmeny_szazalek) / 100;

    // Végső egységár
    const vegso_egysegar = listar - kedvezmeny_osszeg;

    // Tétel létrehozása
    const tetel = this.szamlaTetelRepo.create({
      cikk_id: cikk.id,
      cikk_nev: cikk.nev,
      mennyiseg: input.mennyiseg,
      listar,
      kedvezmeny_szazalek,
      kedvezmeny_osszeg,
      vegso_egysegar,
      // Összegek
      netto_osszeg: vegso_egysegar * input.mennyiseg,
      afa_szazalek: cikk.afa_szazalek,
      afa_osszeg: (vegso_egysegar * input.mennyiseg * cikk.afa_szazalek) / 100,
      brutto_osszeg: vegso_egysegar * input.mennyiseg * (1 + cikk.afa_szazalek / 100),
    });

    await this.szamlaTetelRepo.save(tetel);
    return tetel;
  }

  /**
   * Számla összesített megtakarításának kalkulációja
   */
  async calculateOsszesitettMegtakaritas(szamla_id: string): Promise<number> {
    const tetelek = await this.szamlaTetelRepo.find({
      where: { szamla_id },
    });

    const osszMegtakaritas = tetelek.reduce((sum, tetel) => {
      return sum + tetel.kedvezmeny_osszeg * tetel.mennyiseg;
    }, 0);

    return osszMegtakaritas;
  }
}
```

---

### Példa Kalkuláció

#### Példa 1: Egyszerű kedvezmény

**Tétel:**
- Makita fúró
- Lista ár: 50.000 Ft
- Kedvezmény: 10%
- Mennyiség: 1 db

**Kalkuláció:**
```
kedvezmeny_osszeg = 50.000 × 0.10 = 5.000 Ft
vegso_egysegar = 50.000 - 5.000 = 45.000 Ft
netto_osszeg = 45.000 × 1 = 45.000 Ft
afa_osszeg (27%) = 45.000 × 0.27 = 12.150 Ft
brutto_osszeg = 45.000 + 12.150 = 57.150 Ft
```

**Számla megjelenés:**
```
┌──────────────────────────────────────────────────────────────┐
│ SZÁMLA #INV-2025-000123                                      │
├──────────────────────────────────────────────────────────────┤
│ Tétel        Menny. | Lista Ár  | Kedv. | Egységár | Összeg │
│ Makita fúró     1 db| 50.000 Ft |  10%  | 45.000 Ft| 45.000 │
│ Tartozék        1 db|  5.000 Ft |   0%  |  5.000 Ft|  5.000 │
├──────────────────────────────────────────────────────────────┤
│ Nettó összesen:                                    50.000 Ft │
│ ÁFA (27%):                                         13.500 Ft │
│ Bruttó összesen:                                   63.500 Ft │
│                                                              │
│ 🎉 Ön megtakarított (kedvezmény):                  5.000 Ft │
└──────────────────────────────────────────────────────────────┘
```

---

## 🎨 UI/UX Komponensek

### 1. Számla Tétel Dialógus - Kedvezmény Választó

```tsx
// frontend/src/components/szamla/SzamlaTetelDialog.tsx

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Typography,
  Box,
  InputAdornment,
  Alert,
} from '@mui/material';

interface SzamlaTetelDialogProps {
  cikk: Cikk;
  onSave: (tetel: SzamlaTetelInput) => void;
  onClose: () => void;
}

export function SzamlaTetelDialog({ cikk, onSave, onClose }: SzamlaTetelDialogProps) {
  const [mennyiseg, setMennyiseg] = useState<number>(1);
  const [kedvezmeny, setKedvezmeny] = useState<number>(0);

  // Kalkulációk
  const listar = cikk.eladasi_ar;
  const kedvezmenyOsszeg = (listar * kedvezmeny) / 100;
  const vegsoAr = listar - kedvezmenyOsszeg;
  const osszeg = vegsoAr * mennyiseg;
  const megtakaritas = kedvezmenyOsszeg * mennyiseg;

  const handleSave = () => {
    onSave({
      cikk_id: cikk.id,
      mennyiseg,
      kedvezmeny_szazalek: kedvezmeny,
    });
    onClose();
  };

  return (
    <Dialog open onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Tétel hozzáadása</DialogTitle>
      <DialogContent>
        <Typography variant="h6" gutterBottom>
          {cikk.nev}
        </Typography>

        <TextField
          label="Mennyiség"
          type="number"
          value={mennyiseg}
          onChange={(e) => setMennyiseg(parseInt(e.target.value) || 0)}
          fullWidth
          margin="normal"
          inputProps={{ min: 1 }}
        />

        <TextField
          label="Kedvezmény"
          type="number"
          value={kedvezmeny}
          onChange={(e) => setKedvezmeny(parseFloat(e.target.value) || 0)}
          fullWidth
          margin="normal"
          InputProps={{
            endAdornment: <InputAdornment position="end">%</InputAdornment>,
          }}
          inputProps={{ min: 0, max: 100, step: 0.1 }}
        />

        {/* Előnézet */}
        <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Lista ár: {listar.toLocaleString('hu-HU')} Ft
          </Typography>
          {kedvezmeny > 0 && (
            <>
              <Typography variant="body2" color="error">
                Kedvezmény ({kedvezmeny}%): -{kedvezmenyOsszeg.toLocaleString('hu-HU')} Ft
              </Typography>
              <Typography variant="body2" fontWeight="bold">
                Egységár: {vegsoAr.toLocaleString('hu-HU')} Ft
              </Typography>
            </>
          )}
          <Typography variant="h6" sx={{ mt: 1 }}>
            Összeg: {osszeg.toLocaleString('hu-HU')} Ft
          </Typography>
          {megtakaritas > 0 && (
            <Alert severity="success" sx={{ mt: 1 }}>
              Megtakarítás: {megtakaritas.toLocaleString('hu-HU')} Ft
            </Alert>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Mégse</Button>
        <Button onClick={handleSave} variant="contained" disabled={mennyiseg < 1}>
          Hozzáadás
        </Button>
      </DialogActions>
    </Dialog>
  );
}
```

---

### 2. Számla Nyomtatási Sablon

```tsx
// frontend/src/components/szamla/SzamlaNyomtatas.tsx

import React from 'react';
import { Box, Table, TableHead, TableBody, TableRow, TableCell, Typography } from '@mui/material';

interface SzamlaNyomtatasProps {
  szamla: Szamla;
  config: SzamlaKonfiguracio;
}

export function SzamlaNyomtatas({ szamla, config }: SzamlaNyomtatasProps) {
  const osszMegtakaritas = szamla.tetelek.reduce((sum, t) => sum + t.kedvezmeny_osszeg * t.mennyiseg, 0);

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" gutterBottom>
        SZÁMLA
      </Typography>
      <Typography variant="subtitle1">Számlaszám: {szamla.szamlaszam}</Typography>
      <Typography variant="subtitle2">Kiállítás dátuma: {szamla.kiallitas_datum}</Typography>

      <Table sx={{ mt: 3 }}>
        <TableHead>
          <TableRow>
            <TableCell>Tétel</TableCell>
            <TableCell align="right">Menny.</TableCell>
            {config.MUTASD_LISTAR && <TableCell align="right">Lista ár</TableCell>}
            {config.MUTASD_KEDVEZMENYT && <TableCell align="right">Kedv.</TableCell>}
            <TableCell align="right">Egységár</TableCell>
            <TableCell align="right">Összeg</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {szamla.tetelek.map((tetel) => (
            <TableRow key={tetel.id}>
              <TableCell>{tetel.cikk_nev}</TableCell>
              <TableCell align="right">{tetel.mennyiseg} db</TableCell>
              {config.MUTASD_LISTAR && (
                <TableCell align="right">{tetel.listar.toLocaleString('hu-HU')} Ft</TableCell>
              )}
              {config.MUTASD_KEDVEZMENYT && (
                <TableCell align="right" sx={{ color: tetel.kedvezmeny_szazalek > 0 ? 'error.main' : 'inherit' }}>
                  {tetel.kedvezmeny_szazalek > 0 ? `${tetel.kedvezmeny_szazalek}%` : '-'}
                </TableCell>
              )}
              <TableCell align="right">{tetel.vegso_egysegar.toLocaleString('hu-HU')} Ft</TableCell>
              <TableCell align="right">{tetel.netto_osszeg.toLocaleString('hu-HU')} Ft</TableCell>
            </TableRow>
          ))}
          <TableRow>
            <TableCell colSpan={config.MUTASD_LISTAR && config.MUTASD_KEDVEZMENYT ? 5 : 3} align="right">
              <strong>Nettó összesen:</strong>
            </TableCell>
            <TableCell align="right">
              <strong>{szamla.netto_osszeg.toLocaleString('hu-HU')} Ft</strong>
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell colSpan={config.MUTASD_LISTAR && config.MUTASD_KEDVEZMENYT ? 5 : 3} align="right">
              ÁFA (27%):
            </TableCell>
            <TableCell align="right">{szamla.afa_osszeg.toLocaleString('hu-HU')} Ft</TableCell>
          </TableRow>
          <TableRow>
            <TableCell colSpan={config.MUTASD_LISTAR && config.MUTASD_KEDVEZMENYT ? 5 : 3} align="right">
              <strong>Bruttó összesen:</strong>
            </TableCell>
            <TableCell align="right">
              <strong>{szamla.brutto_osszeg.toLocaleString('hu-HU')} Ft</strong>
            </TableCell>
          </TableRow>
          {config.MUTASD_MEGTAKARITAST && osszMegtakaritas > 0 && (
            <TableRow>
              <TableCell colSpan={config.MUTASD_LISTAR && config.MUTASD_KEDVEZMENYT ? 5 : 3} align="right">
                <Typography variant="body2" color="success.main">
                  🎉 Ön megtakarított (kedvezmény):
                </Typography>
              </TableCell>
              <TableCell align="right">
                <Typography variant="body2" color="success.main" fontWeight="bold">
                  {osszMegtakaritas.toLocaleString('hu-HU')} Ft
                </Typography>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </Box>
  );
}
```

---

## 📊 Implementációs Terv

### MVP Scope (2 story, ~3 SP)

#### Story 1: Adatmodell bővítés (1 SP)
- SZÁMLA_TÉTEL és ÉRTÉKESÍTÉS_TÉTEL ALTER TABLE
- RENDSZERBEÁLLÍTÁS tábla létrehozása
- Migráció: meglévő tételek backfill (listar = vegso_egysegar, kedvezmeny = 0)
- Unit tesztek

#### Story 2: UI/Logika (2 SP)
- SzamlaTetelDialog komponens kedvezmény mezővel
- Számla nyomtatás frissítése (listar, kedvezmény, megtakarítás)
- Konfiguráció API endpoint
- Integrációs teszt

---

### V2 Bővítések (opcionális)

#### V2.1: Törzsvásárlói kedvezmény automatizmus (2 SP)
- Partner törzsvásárlói szint (Bronze/Silver/Gold)
- Automatikus kedvezmény % javaslat
- UI: "Ajánlott kedvezmény: 10% (törzsvendég)"

#### V2.2: Kedvezmény jogosultság RBAC (1 SP)
- Csak MANAGER+ adhat >20% kedvezményt
- Audit log: ki, mikor, mennyi kedvezményt adott

---

## 🎯 Üzleti Érték (ROI)

### Kvalitatív Előnyök

✅ **Marketing érték**: "Ön megtakarított X Ft!" üzenet növeli elégedettséget
✅ **Átláthatóság**: NAV audit során tisztán elkülönül lista ár vs. kedvezmény
✅ **Compliance**: Fogyasztóvédelmi szabályoknak megfelelő transzparens árazás

### Kvantitatív Előnyök

**Jelenlegi állapot:**
- Ügyfél nem látja a kedvezményt → nincs "meglepetés faktor"
- Marketing kampányok nehézkesek ("10% kedvezmény" nem látható számlán)

**Új állapot:**
- Számla lábléc: "Ön megtakarított: 5.000 Ft!"
- Ügyfél érzi az értéket → magasabb visszatérési arány (+5-10%)

**Implementációs költség:**
- 3 SP × 100.000 Ft/SP = **300.000 Ft**
- Megtérülés: ~3-6 hónap (marketing hatékonyság növekedés)

---

## ⚠️ Kockázatok és Kihívások

### Kockázat 1: Meglévő számlák backfill
**Mitigation:** Migráció script: `listar = vegso_egysegar, kedvezmeny = 0` (nincs adat veszteség)

### Kockázat 2: Túl magas kedvezmény visszaélés
**Mitigation:** RBAC + Audit log (V2.2 scope)

---

## 📚 Függelékek

### Kapcsolódó Dokumentumok
- [KGC-ERP-v3-Fit-Gap-Analízis-2025-12-29.md](../KGC-ERP-v3-Fit-Gap-Analízis-2025-12-29.md) - #7 követelmény

### Technológiai Stack
- **Backend:** NestJS (TypeScript)
- **Frontend:** React + MUI
- **Adatbázis:** PostgreSQL
- **Számla generálás:** PDF.js vagy server-side PDF generation

### Fejlesztői Jegyzetek
- **Backward compatibility:** Meglévő számlák 0% kedvezménnyel jelennek meg
- **Validation:** kedvezmeny_szazalek BETWEEN 0 AND 100
- **Performance:** Index a `szamla_id` mezőn a gyorsabb összesítéshez
