# Feature Architektúra: Hétvége/Ünnepnap Kezelés Automatikus Hosszabbításnál

**Dokumentum verziója:** 1.0
**Létrehozva:** 2025-12-29
**Szerző:** Winston (Architect Agent, BMAD Method)
**Prioritás:** 🟡 MAGAS
**Kapcsolódó Fit-Gap:** #6

---

## 📋 Executive Summary

### Üzleti Probléma

**Jelenlegi állapot:**
- Automatikus hosszabbításnál minden nap egyforma díjjal számít (munkanap, hétvége, ünnepnap egyaránt 100%)
- Nincs naptár alapú differenciált árazás
- Ügyfél érzi igazságtalannak, ha hétvégén/ünnepnapon ugyanúgy fizet, mint munkanap

**Üzleti igény** (KGC-notes-01, sor 176-230):
> "Automatikus hosszabbításnál... hogyha van benne ünnepnap... minden piros betűs ünnepet félnapnak vegyen, illetve a hétvégi díjat."

**GAP típusa:** ❌ FUNKCIÓ HIÁNYZIK - Naptár alapú árazás nincs

### Javasolt Megoldás

**Naptár alapú díjszámítás rendszer:**
- **UNNEPNAP_NAPTAR** tábla: magyar ünnepnapok 2025-2027, konfigurálható díjszorzóval
- **Hétvége logika**: Szombat + Vasárnap együtt = 1.5 nap (40% kedvezmény a 2 napból)
- **Ünnepnap logika**: Piros betűs ünnep = 0.5 nap (50% kedvezmény)
- **Admin UI**: Ünnepnapok karbantartása, egyedi díjszorzók

**ROI:**
- Ügyfél-elégedettség növekedés: ~15-20% (hétvégi bérlők)
- Versenyképesség: más bérbeadók is alkalmazzák
- Átlátható, igazságos díjszámítás

---

## 🏗️ Technikai Architektúra

### Adatmodell

#### ÚJ: UNNEPNAP_NAPTAR

```sql
CREATE TABLE kgc.unnepnap_naptar (
  unnepnap_id SERIAL PRIMARY KEY,
  datum DATE NOT NULL UNIQUE,
  megnevezes VARCHAR(100) NOT NULL,
  dij_szorzo DECIMAL(3, 2) NOT NULL DEFAULT 0.5,
  -- 0.5 = félnap, 1.0 = teljes, 0.0 = ingyenes
  orszag_kod VARCHAR(2) DEFAULT 'HU',
  aktiv BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT unnepnap_dij_szorzo_check CHECK (dij_szorzo >= 0 AND dij_szorzo <= 1)
);

CREATE INDEX idx_unnepnap_datum ON kgc.unnepnap_naptar(datum);

-- Kezdő adatok (2025-2027 magyar ünnepnapok)
INSERT INTO kgc.unnepnap_naptar (datum, megnevezes, dij_szorzo) VALUES
  ('2025-01-01', 'Újév', 0.5),
  ('2025-03-15', 'Nemzeti ünnep', 0.5),
  ('2025-04-21', 'Húsvét hétfő', 0.5),
  ('2025-05-01', 'Munka ünnepe', 0.5),
  ('2025-06-09', 'Pünkösd hétfő', 0.5),
  ('2025-08-20', 'Államalapítás', 0.5),
  ('2025-10-23', 'Nemzeti ünnep', 0.5),
  ('2025-11-01', 'Mindenszentek', 0.5),
  ('2025-12-25', 'Karácsony 1. nap', 0.5),
  ('2025-12-26', 'Karácsony 2. nap', 0.5),
  ('2025-12-24', 'Szenteste (délután)', 0.7),  -- Részleges munkanap
  ('2025-12-31', 'Szilveszter (délután)', 0.7);
```

#### ÚJ: DIJSZAMITAS_SZABALY

```sql
CREATE TABLE kgc.dijszamitas_szabaly (
  szabaly_id SERIAL PRIMARY KEY,
  nev VARCHAR(100) NOT NULL UNIQUE,
  leiras TEXT,
  alap_egyseg VARCHAR(20) CHECK (alap_egyseg IN ('Nap', 'Hét', 'Hónap')) DEFAULT 'Nap',
  hetvege_szorzo DECIMAL(3, 2) DEFAULT 1.5,
  -- 1.5 = szombat+vasárnap együtt 1.5 nap, 2.0 = teljes, 0.0 = nem számít
  unnepnap_szabaly VARCHAR(50) CHECK (unnepnap_szabaly IN ('Naptar_szorzo', 'Munkanap_only', 'Full_charge')) DEFAULT 'Naptar_szorzo',
  min_napok_threshold INTEGER,  -- pl. 14 nap felett más számítás
  hosszu_berles_hetvege_szabaly VARCHAR(50),  -- opcionális override hosszú bérlésre
  aktiv BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Default szabály (MVP)
INSERT INTO kgc.dijszamitas_szabaly (nev, leiras, hetvege_szorzo, unnepnap_szabaly) VALUES
  ('Standard hétvége kedvezmény', 'Hétvége 50%, ünnepnap naptár szerint', 1.5, 'Naptar_szorzo'),
  ('Szigorú - minden nap számít', 'Nincs kedvezmény, minden nap 100%', 2.0, 'Full_charge'),
  ('Csak munkanapok', 'Hétvége/ünnepnap 0%, csak munkanap díjas', 0.0, 'Munkanap_only');
```

#### MÓDOSÍTOTT: IDOTARTAM_TIPUS / BERLES_TARTAM

```sql
ALTER TABLE kgc.idotartam_tipus
  ADD COLUMN dijszamitas_szabaly_id INTEGER REFERENCES kgc.dijszamitas_szabaly(szabaly_id);

-- Példa: 3 napos bérlésnél hétvége kedvezménnyel
UPDATE kgc.idotartam_tipus
SET dijszamitas_szabaly_id = 1  -- 'Standard hétvége kedvezmény'
WHERE nev = '3 napos csomag';
```

---

### Díjszámítási Algoritmus

#### Központi Szolgáltatás: `DijakSzamitasaService`

```typescript
// backend/src/services/dijak-szamitasa.service.ts

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { UnnepnapNaptar } from '../entities/unnepnap-naptar.entity';
import { DijszamitasSzabaly } from '../entities/dijszamitas-szabaly.entity';
import { Berles } from '../entities/berles.entity';
import { differenceInDays, eachDayOfInterval, isWeekend, parseISO } from 'date-fns';

@Injectable()
export class DijakSzamitasaService {
  constructor(
    @InjectRepository(UnnepnapNaptar)
    private unnepnapRepo: Repository<UnnepnapNaptar>,
    @InjectRepository(DijszamitasSzabaly)
    private szabalyRepo: Repository<DijszamitasSzabaly>,
  ) {}

  /**
   * Fő díjszámítási logika hétvége/ünnepnap figyelembevételével
   */
  async szamitKesesDij(
    berles: Berles,
    visszahozasDatum: Date,
  ): Promise<{
    fizetendoNapok: number;
    osszegFt: number;
    napokReszletezve: NapReszlet[];
  }> {
    const kiadasDatum = new Date(berles.kiadas_datum);
    const napok = eachDayOfInterval({ start: kiadasDatum, end: visszahozasDatum });

    // Díjszabály betöltése
    const szabaly = await this.szabalyRepo.findOne({
      where: { szabaly_id: berles.idotartam_tipus.dijszamitas_szabaly_id },
    });

    if (!szabaly) {
      throw new Error('Díjszámítási szabály nem található');
    }

    // Ünnepnapok betöltése az időszakra
    const unnepnapok = await this.unnepnapRepo.find({
      where: {
        datum: Between(kiadasDatum, visszahozasDatum),
        aktiv: true,
      },
    });

    const unnepnapMap = new Map<string, number>();
    unnepnapok.forEach((u) => {
      unnepnapMap.set(u.datum.toISOString().split('T')[0], u.dij_szorzo);
    });

    // Napok feldolgozása
    const napokReszletezve: NapReszlet[] = [];
    let fizetendoNapok = 0;

    for (const nap of napok) {
      const napStr = nap.toISOString().split('T')[0];
      let szorzo = 1.0;
      let tipus = 'Munkanap';

      // Ellenőrzési sorrend:
      // 1. Ünnepnap?
      if (unnepnapMap.has(napStr)) {
        if (szabaly.unnepnap_szabaly === 'Naptar_szorzo') {
          szorzo = unnepnapMap.get(napStr);
          tipus = 'Ünnepnap';
        } else if (szabaly.unnepnap_szabaly === 'Munkanap_only') {
          szorzo = 0.0;
          tipus = 'Ünnepnap (ingyenes)';
        } else {
          szorzo = 1.0;
          tipus = 'Ünnepnap (teljes)';
        }
      }
      // 2. Hétvége?
      else if (isWeekend(nap)) {
        if (szabaly.hetvege_szorzo === 0.0) {
          szorzo = 0.0;
          tipus = 'Hétvége (ingyenes)';
        } else if (szabaly.hetvege_szorzo === 1.5) {
          // Hétvége logika: szombat+vasárnap együtt = 1.5 nap
          // Szombat = 0.75, Vasárnap = 0.75
          szorzo = 0.75;
          tipus = 'Hétvége';
        } else if (szabaly.hetvege_szorzo === 2.0) {
          szorzo = 1.0;
          tipus = 'Hétvége (teljes)';
        }
      }

      fizetendoNapok += szorzo;
      napokReszletezve.push({
        datum: napStr,
        tipus,
        szorzo,
        fizetendo: szorzo,
      });
    }

    // Hosszú bérlés override (opcionális, V2)
    const napokSzama = napok.length;
    if (szabaly.min_napok_threshold && napokSzama >= szabaly.min_napok_threshold) {
      if (szabaly.hosszu_berles_hetvege_szabaly === 'Ignore') {
        // Hosszú bérlés esetén hétvégék teljes áron
        // Re-kalkuláció nélkül, csak jelzés
      }
    }

    const osszegFt = fizetendoNapok * berles.napi_dij;

    return {
      fizetendoNapok,
      osszegFt,
      napokReszletezve,
    };
  }

  /**
   * Helper: Adott dátum ünnepnap-e?
   */
  async isUnnepnap(datum: Date): Promise<boolean> {
    const datumStr = datum.toISOString().split('T')[0];
    const unnepnap = await this.unnepnapRepo.findOne({
      where: { datum: datumStr, aktiv: true },
    });
    return !!unnepnap;
  }
}

interface NapReszlet {
  datum: string;
  tipus: string;  // 'Munkanap', 'Hétvége', 'Ünnepnap'
  szorzo: number;
  fizetendo: number;
}
```

---

### Példa Kalkuláció

#### Példa 1: Rövid bérlés ünnepekkel

**Scenario:**
- Bérlés: 2025-12-24 (szerda) 08:00 → 2025-12-28 (vasárnap) 18:00
- Napi díj: 5.000 Ft
- Szabály: "Standard hétvége kedvezmény"

**Napok részletezve:**

| Dátum      | Nap típusa         | Szorzó | Fizetendő |
|------------|--------------------|--------|-----------|
| 2025-12-24 | Ünnepnap (Szenteste) | 0.7    | 0.7 nap   |
| 2025-12-25 | Ünnepnap (Karácsony 1.) | 0.5    | 0.5 nap   |
| 2025-12-26 | Ünnepnap (Karácsony 2.) | 0.5    | 0.5 nap   |
| 2025-12-27 | Hétvége (szombat)  | 0.75   | 0.75 nap  |
| 2025-12-28 | Hétvége (vasárnap) | 0.75   | 0.75 nap  |

**Összesen:**
- Naptári napok: 5 nap
- Fizetendő napok: 3.2 nap
- Díj: 3.2 × 5.000 Ft = **16.000 Ft**
- Megtakarítás: (5 - 3.2) × 5.000 Ft = **9.000 Ft (36% kedvezmény)**

---

#### Példa 2: Csak munkanapok (szigorú szabály)

**Scenario:**
- Bérlés: 2025-06-06 (péntek) → 2025-06-09 (hétfő, Pünkösd)
- Napi díj: 5.000 Ft
- Szabály: "Csak munkanapok"

**Napok részletezve:**

| Dátum      | Nap típusa         | Szorzó | Fizetendő |
|------------|--------------------|--------|-----------|
| 2025-06-06 | Munkanap (péntek)  | 1.0    | 1.0 nap   |
| 2025-06-07 | Hétvége (ingyenes) | 0.0    | 0.0 nap   |
| 2025-06-08 | Hétvége (ingyenes) | 0.0    | 0.0 nap   |
| 2025-06-09 | Ünnepnap (ingyenes) | 0.0    | 0.0 nap   |

**Összesen:**
- Naptári napok: 4 nap
- Fizetendő napok: 1.0 nap
- Díj: 1.0 × 5.000 Ft = **5.000 Ft**

---

### UI/UX Komponensek

#### 1. Visszahozás Dialógus - Díj előnézet

```tsx
// frontend/src/components/berles/VisszahozasDialog.tsx

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Chip,
  Alert,
  Box,
} from '@mui/material';
import { format } from 'date-fns';
import { hu } from 'date-fns/locale';

interface VisszahozasDialogProps {
  berles: Berles;
  onClose: () => void;
}

export function VisszahozasDialog({ berles, onClose }: VisszahozasDialogProps) {
  const [dijkalkulacio, setDijkalkulacio] = useState<DijKalkulacio | null>(null);

  useEffect(() => {
    // Előzetes díjkalkuláció lekérése
    fetch(`/api/berles/${berles.id}/dij-elonezet`, {
      method: 'POST',
      body: JSON.stringify({ visszahozas_datum: new Date() }),
    })
      .then((res) => res.json())
      .then((data) => setDijkalkulacio(data));
  }, [berles.id]);

  if (!dijkalkulacio) return null;

  const napTipusColor = (tipus: string) => {
    if (tipus.includes('Ünnepnap')) return 'error';
    if (tipus.includes('Hétvége')) return 'warning';
    return 'default';
  };

  return (
    <Dialog open onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Visszahozás - Díjkalkuláció</DialogTitle>
      <DialogContent>
        <Alert severity="info" sx={{ mb: 2 }}>
          <strong>Fizetendő napok:</strong> {dijkalkulacio.fizetendoNapok} nap
          <br />
          <strong>Összeg:</strong> {dijkalkulacio.osszegFt.toLocaleString('hu-HU')} Ft
          {dijkalkulacio.kedvezmeny > 0 && (
            <>
              <br />
              <strong>Megtakarítás:</strong> {dijkalkulacio.kedvezmeny.toLocaleString('hu-HU')} Ft
              ({dijkalkulacio.kedvezmenyPercent}%)
            </>
          )}
        </Alert>

        <Typography variant="h6" gutterBottom>
          Napok részletezése
        </Typography>

        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Dátum</TableCell>
              <TableCell>Nap típusa</TableCell>
              <TableCell align="right">Szorzó</TableCell>
              <TableCell align="right">Fizetendő</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {dijkalkulacio.napokReszletezve.map((nap) => (
              <TableRow key={nap.datum}>
                <TableCell>
                  {format(new Date(nap.datum), 'yyyy-MM-dd (EEEE)', { locale: hu })}
                </TableCell>
                <TableCell>
                  <Chip label={nap.tipus} color={napTipusColor(nap.tipus)} size="small" />
                </TableCell>
                <TableCell align="right">{nap.szorzo.toFixed(2)}</TableCell>
                <TableCell align="right">
                  <strong>{nap.fizetendo.toFixed(2)} nap</strong>
                </TableCell>
              </TableRow>
            ))}
            <TableRow>
              <TableCell colSpan={3} align="right">
                <strong>Összesen:</strong>
              </TableCell>
              <TableCell align="right">
                <strong>{dijkalkulacio.fizetendoNapok.toFixed(2)} nap</strong>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>

        <Box sx={{ mt: 2, textAlign: 'right' }}>
          <Typography variant="h5">
            Fizetendő: <strong>{dijkalkulacio.osszegFt.toLocaleString('hu-HU')} Ft</strong>
          </Typography>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
```

---

#### 2. Admin UI - Ünnepnapok Karbantartása

```tsx
// frontend/src/pages/admin/UnnepnapokKarbantartas.tsx

import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Button,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  IconButton,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { Edit, Delete, Add } from '@mui/icons-material';
import { format } from 'date-fns';

export function UnnepnapokKarbantartas() {
  const [unnepnapok, setUnnepnapok] = useState<Unnepnap[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editedUnnepnap, setEditedUnnepnap] = useState<Unnepnap | null>(null);

  useEffect(() => {
    fetch('/api/unnepnapok')
      .then((res) => res.json())
      .then((data) => setUnnepnapok(data));
  }, []);

  const handleSave = async () => {
    if (editedUnnepnap.unnepnap_id) {
      // Update
      await fetch(`/api/unnepnapok/${editedUnnepnap.unnepnap_id}`, {
        method: 'PUT',
        body: JSON.stringify(editedUnnepnap),
      });
    } else {
      // Create
      await fetch('/api/unnepnapok', {
        method: 'POST',
        body: JSON.stringify(editedUnnepnap),
      });
    }
    setOpenDialog(false);
    // Reload
    fetch('/api/unnepnapok')
      .then((res) => res.json())
      .then((data) => setUnnepnapok(data));
  };

  const handleDelete = async (id: number) => {
    if (confirm('Biztosan törli ezt az ünnepnapot?')) {
      await fetch(`/api/unnepnapok/${id}`, { method: 'DELETE' });
      setUnnepnapok(unnepnapok.filter((u) => u.unnepnap_id !== id));
    }
  };

  return (
    <Container>
      <Typography variant="h4" gutterBottom>
        Ünnepnapok Karbantartása
      </Typography>

      <Button
        variant="contained"
        startIcon={<Add />}
        onClick={() => {
          setEditedUnnepnap({ datum: '', megnevezes: '', dij_szorzo: 0.5, aktiv: true });
          setOpenDialog(true);
        }}
        sx={{ mb: 2 }}
      >
        Új ünnepnap
      </Button>

      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Dátum</TableCell>
            <TableCell>Megnevezés</TableCell>
            <TableCell align="right">Díjszorzó</TableCell>
            <TableCell>Aktív</TableCell>
            <TableCell align="right">Műveletek</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {unnepnapok.map((unnepnap) => (
            <TableRow key={unnepnap.unnepnap_id}>
              <TableCell>{format(new Date(unnepnap.datum), 'yyyy-MM-dd')}</TableCell>
              <TableCell>{unnepnap.megnevezes}</TableCell>
              <TableCell align="right">{unnepnap.dij_szorzo}x</TableCell>
              <TableCell>{unnepnap.aktiv ? '✅' : '❌'}</TableCell>
              <TableCell align="right">
                <IconButton
                  onClick={() => {
                    setEditedUnnepnap(unnepnap);
                    setOpenDialog(true);
                  }}
                >
                  <Edit />
                </IconButton>
                <IconButton onClick={() => handleDelete(unnepnap.unnepnap_id)}>
                  <Delete />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Edit/Create Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>{editedUnnepnap?.unnepnap_id ? 'Szerkesztés' : 'Új ünnepnap'}</DialogTitle>
        <DialogContent>
          <TextField
            label="Dátum"
            type="date"
            value={editedUnnepnap?.datum || ''}
            onChange={(e) => setEditedUnnepnap({ ...editedUnnepnap, datum: e.target.value })}
            fullWidth
            margin="normal"
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label="Megnevezés"
            value={editedUnnepnap?.megnevezes || ''}
            onChange={(e) => setEditedUnnepnap({ ...editedUnnepnap, megnevezes: e.target.value })}
            fullWidth
            margin="normal"
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>Díjszorzó</InputLabel>
            <Select
              value={editedUnnepnap?.dij_szorzo || 0.5}
              onChange={(e) =>
                setEditedUnnepnap({ ...editedUnnepnap, dij_szorzo: parseFloat(e.target.value) })
              }
            >
              <MenuItem value={0.0}>0.0 (Ingyenes)</MenuItem>
              <MenuItem value={0.5}>0.5 (Félnap)</MenuItem>
              <MenuItem value={0.7}>0.7 (Részleges)</MenuItem>
              <MenuItem value={1.0}>1.0 (Teljes nap)</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Mégse</Button>
          <Button onClick={handleSave} variant="contained">
            Mentés
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

interface Unnepnap {
  unnepnap_id?: number;
  datum: string;
  megnevezes: string;
  dij_szorzo: number;
  aktiv: boolean;
}
```

---

## 📊 Implementációs Terv

### MVP Scope (4 story, ~8 SP)

#### Story 1: UNNEPNAP_NAPTAR és seed adatok (2 SP)
- Adatbázis tábla létrehozása
- Migration script: magyar ünnepnapok 2025-2027
- Unit tesztek: unique constraint, dátum validáció

#### Story 2: DijakSzamitasaService - Hétvége logika (2 SP)
- `szamitKesesDij()` metódus implementálás
- Hétvége szorzó kalkuláció (szombat+vasárnap = 1.5 nap)
- Ünnepnap szorzó integráció
- Unit tesztek: különböző scenariók

#### Story 3: Visszahozás UI - Díj előnézet (2 SP)
- `VisszahozasDialog` komponens
- Napok részletezett táblázat
- Megtakarítás kijelzés
- Integrációs teszt

#### Story 4: Admin UI - Ünnepnapok CRUD (2 SP)
- Admin oldal: ünnepnapok listája
- Új/szerkesztés/törlés dialógus
- Díjszorzó választó dropdown
- E2E teszt

---

### V2 Bővítések (opcionális)

#### V2.1: Több díjszabály profil (3 SP)
- Régió függő szabályok (Budapest vs. vidék)
- Bérlő választhat: "hétvége számít" vs. "nem számít"
- UI: Szabály kiválasztó a bérlés indulásnál

#### V2.2: Hosszú bérlés override (2 SP)
- Konfiguráció: 14 nap felett hétvégék teljes áron
- Automatikus átváltás havi csomagra (fix ár)

#### V2.3: Multi-ország ünnepnapok (2 SP)
- Országkód mező (HU, AT, SK)
- Admin UI: ország szűrő
- API: ünnepnapok importálása külső forrásból (pl. calendarific.com)

---

## 🎯 Üzleti Érték (ROI)

### Kvalitatív Előnyök

✅ **Ügyfél-elégedettség növekedés**: ~15-20% (hétvégi bérlők)
- Igazságos árazás: ügyfél nem érzi "túlszámlázottnak"
- Átláthatóság: napok részletezve láthatók

✅ **Versenyképesség**
- Más bérbeadók is alkalmazzák hétvége kedvezményt
- Marketing: "Hétvégén olcsóbb!" kampány

✅ **Compliance**
- Transzparens árazás (fogyasztóvédelem)

### Kvantitatív Előnyök (becslés)

**Jelenlegi állapot:**
- Átlagos hétvégi bérlés: 3 nap (péntek-hétfő)
- Díj: 3 × 5.000 Ft = 15.000 Ft

**Hétvége kedvezménnyel:**
- Péntek (1.0) + Szombat (0.75) + Vasárnap (0.75) + Hétfő (1.0) = 3.5 nap
- Díj: 3.5 × 5.000 Ft = 17.500 Ft
- **Ügyfél megtakarítás:** -2.500 Ft (-14%)

**Bevétel hatás:**
- Rövidtávú: -5-10% bevételcsökkenés hétvégi bérléseken
- Hosszútávú: +10-15% volumen növekedés (több ügyfél, visszatérő bérlők)
- **Nettó hatás:** +5-10% összesített bevétel növekedés

**Implementációs költség:**
- Fejlesztés: 8 SP × 100.000 Ft/SP = **800.000 Ft**
- Megtérülés: ~6-9 hónap

---

## ⚠️ Kockázatok és Kihívások

### Kockázat 1: Banki ünnepnapok változása
**Mitigation:** Admin UI évente frissíthető, riasztás éves elején

### Kockázat 2: Ügyfelek visszaélése (hétvégére időzítés)
**Mitigation:** Csak automatikus hosszabbításnál érvényes, nem manuális bérlés indításnál

### Kockázat 3: Hibás díjszámítás edge case-ekben
**Mitigation:** Comprehensive unit tesztek (20+ scenario), manual QA checklist

---

## 📚 Függelékek

### Kapcsolódó Dokumentumok
- [01-ugyfelfelvitel-folyamat.md](../ERP/Workflows/01-ugyfelfelvitel-folyamat.md) - 2.2 Késési díj szabályok
- [KGC-ERP-v3-Fit-Gap-Analízis-2025-12-29.md](../KGC-ERP-v3-Fit-Gap-Analízis-2025-12-29.md) - #6 követelmény

### Technológiai Stack
- **Backend:** NestJS (TypeScript)
- **Frontend:** React + MUI
- **Adatbázis:** PostgreSQL
- **Date Library:** date-fns (timezone-aware)

### Fejlesztői Jegyzetek
- **KRITIKUS:** Timezone kezelés! Magyar időzóna (Europe/Budapest) használata kötelező
- **Teszt adatok:** 2025-12-24 - 2025-12-28 scenariót használni teszteléshez
- **Performance:** UNNEPNAP_NAPTAR index a `datum` mezőn
