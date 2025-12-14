# 1. Ügyfél Felvétel és Bérlés - DFD (Adatfolyam Diagram)

## Diagram Alapinformációk

| Tulajdonság | Érték |
|-------------|-------|
| **Fájlnév** | `1-ugyfelfelvitel-dfd.excalidraw` |
| **Típus** | DFD (Data Flow Diagram) |
| **Szint** | Level 1 |
| **Modul** | Partner & Bérlés |
| **Verzió** | v1.0 |
| **Kategória** | 1. rész - Ügyfél Felvétel és Bérlés |

---

## Részletes Leírás

Ez a DFD (Data Flow Diagram) az **adatfolyamokat** és **adatáramlási irányokat** mutatja be a bérlési folyamatban. A diagram feltérképezi, hogy milyen adatok hogyan áramlanak a rendszer különböző komponensei között.

---

## Külső Entitások (External Entities)

A rendszer külső szereplői, akik adatot adnak vagy kapnak.

### 1. ÜGYFÉL (Bérlő)
```
┌─────────────────────────────────┐
│           ÜGYFÉL                │
├─────────────────────────────────┤
│  Szerepe:                       │
│  • Adatokat szolgáltat          │
│  • Szerződést kap               │
│  • Kauciót fizet                │
│  • Géppel távozik               │
└─────────────────────────────────┘
```

**Input adatok az ügyféltől:**
- Személyes adatok (név, cím, igazolvány)
- Céges adatok (opcionális)
- Kaució összege
- Gép visszahozása

**Output adatok az ügyfélnek:**
- Szerződés (nyomtatott)
- Nyugta/számla
- Kaució visszaadása

### 2. KEZELŐ (Felhasználó)
```
┌─────────────────────────────────┐
│           KEZELŐ                │
├─────────────────────────────────┤
│  Szerepe:                       │
│  • Rendszert működteti          │
│  • Döntéseket hoz               │
│  • Adatokat rögzít              │
│  • Gépet kiadja/visszaveszi     │
└─────────────────────────────────┘
```

**Input adatok a kezelőtől:**
- Bejelentkezési adatok
- Kiválasztások (partner, gép, időtartam)
- Jóváhagyások

**Output adatok a kezelőnek:**
- Rendszer válaszok
- Listák, keresési eredmények
- Nyomtatási előnézet

---

## Folyamatok (Processes)

A rendszer belső műveletei, amelyek adatot alakítanak át.

### P1: PARTNER KEZELÉS
```
┌─────────────────────────────────┐
│       P1: PARTNER KEZELÉS       │
├─────────────────────────────────┤
│  Input:                         │
│  • Ügyfél adatok                │
│  • Keresési feltételek          │
│                                 │
│  Feldolgozás:                   │
│  • Keresés meglévő partnerek    │
│  • Új partner validálás         │
│  • Partner mentés/módosítás     │
│                                 │
│  Output:                        │
│  • Partner rekord               │
│  • Keresési találatok           │
│  • Validációs eredmény          │
└─────────────────────────────────┘
```

### P2: CÉG KEZELÉS
```
┌─────────────────────────────────┐
│       P2: CÉG KEZELÉS           │
├─────────────────────────────────┤
│  Input:                         │
│  • Adószám                      │
│  • Partner azonosító            │
│                                 │
│  Feldolgozás:                   │
│  • NAV API hívás                │
│  • Adószám validálás            │
│  • Cégadatok betöltés           │
│                                 │
│  Output:                        │
│  • Cég rekord                   │
│  • NAV státusz                  │
│  • Hibakezelés                  │
└─────────────────────────────────┘
```

### P3: BÉRLÉS INDÍTÁS
```
┌─────────────────────────────────┐
│      P3: BÉRLÉS INDÍTÁS         │
├─────────────────────────────────┤
│  Input:                         │
│  • Partner ID                   │
│  • Cég ID (opcionális)          │
│  • Gép kiválasztás              │
│  • Időtartam                    │
│  • Kaució                       │
│                                 │
│  Feldolgozás:                   │
│  • Gép elérhetőség ellenőrzés   │
│  • Díjkalkuláció                │
│  • Bérlés rekord létrehozás     │
│  • Gép státusz frissítés        │
│                                 │
│  Output:                        │
│  • Bérlés rekord                │
│  • Szerződés adat               │
│  • Vonalkód generálás           │
└─────────────────────────────────┘
```

### P4: SZERZŐDÉS GENERÁLÁS
```
┌─────────────────────────────────┐
│    P4: SZERZŐDÉS GENERÁLÁS      │
├─────────────────────────────────┤
│  Input:                         │
│  • Bérlés adatok                │
│  • Partner adatok               │
│  • Gép adatok                   │
│                                 │
│  Feldolgozás:                   │
│  • Sablon betöltés              │
│  • Adatok behelyettesítés       │
│  • Vonalkód generálás           │
│  • PDF létrehozás               │
│                                 │
│  Output:                        │
│  • Nyomtatható szerződés        │
│  • Vonalkód (bolti példány)     │
└─────────────────────────────────┘
```

### P5: BÉRLÉS LEZÁRÁS
```
┌─────────────────────────────────┐
│      P5: BÉRLÉS LEZÁRÁS         │
├─────────────────────────────────┤
│  Input:                         │
│  • Vonalkód beolvasás           │
│  • Visszavétel időpont          │
│                                 │
│  Feldolgozás:                   │
│  • Bérlés azonosítás            │
│  • Késés kalkulálás             │
│  • Státusz frissítés            │
│  • Gép visszavétel              │
│                                 │
│  Output:                        │
│  • Lezárt bérlés                │
│  • Késési díj (ha van)          │
│  • Kaució visszaadás            │
└─────────────────────────────────┘
```

---

## Adattárak (Data Stores)

Az adatok perzisztens tárolási helyei.

### D1: Partner Adatbázis
```
┌─────────────────────────────────┐
│     D1: PARTNER ADATBÁZIS       │
├─────────────────────────────────┤
│  Tárolt adatok:                 │
│  • Partner alapadatok           │
│  • Kapcsolt cégek               │
│  • Bérlési előzmények           │
│                                 │
│  Kapcsolódó folyamatok:         │
│  • P1 - Írás/Olvasás            │
│  • P3 - Olvasás                 │
│  • P5 - Olvasás                 │
└─────────────────────────────────┘
```

### D2: Cikk (Készlet) Adatbázis
```
┌─────────────────────────────────┐
│     D2: CIKK ADATBÁZIS          │
├─────────────────────────────────┤
│  Tárolt adatok:                 │
│  • Gép alapadatok               │
│  • Árazás                       │
│  • Státusz (bent/kint/szerviz)  │
│                                 │
│  Kapcsolódó folyamatok:         │
│  • P3 - Olvasás/Írás            │
│  • P5 - Írás                    │
└─────────────────────────────────┘
```

### D3: Bérlés Adatbázis
```
┌─────────────────────────────────┐
│     D3: BÉRLÉS ADATBÁZIS        │
├─────────────────────────────────┤
│  Tárolt adatok:                 │
│  • Aktív bérlések               │
│  • Lezárt bérlések              │
│  • Kaució információk           │
│                                 │
│  Kapcsolódó folyamatok:         │
│  • P3 - Írás                    │
│  • P4 - Olvasás                 │
│  • P5 - Olvasás/Írás            │
└─────────────────────────────────┘
```

### D4: Felhasználó Adatbázis
```
┌─────────────────────────────────┐
│   D4: FELHASZNÁLÓ ADATBÁZIS     │
├─────────────────────────────────┤
│  Tárolt adatok:                 │
│  • Bejelentkezési adatok        │
│  • Jogosultságok                │
│  • Tevékenység napló            │
│                                 │
│  Kapcsolódó folyamatok:         │
│  • Minden folyamat - Olvasás    │
│  • Audit logging                │
└─────────────────────────────────┘
```

---

## Adatfolyamok (Data Flows)

### Bejövő Adatfolyamok

| Forrás | Cél | Adat | Leírás |
|--------|-----|------|--------|
| Ügyfél | P1 | Személyes adatok | Ügyfél regisztráció |
| Ügyfél | P2 | Adószám | Céges számlázás |
| Ügyfél | P3 | Kaució | Készpénz átvétel |
| Kezelő | P1 | Keresési feltétel | Partner keresés |
| Kezelő | P3 | Gép kiválasztás | Bérlés indítás |
| Kezelő | P5 | Vonalkód | Gép visszavétel |

### Kimenő Adatfolyamok

| Forrás | Cél | Adat | Leírás |
|--------|-----|------|--------|
| P4 | Ügyfél | Szerződés | Nyomtatott példány |
| P5 | Ügyfél | Kaució | Készpénz visszaadás |
| P1 | Kezelő | Partner lista | Keresési eredmény |
| P3 | Kezelő | Megerősítés | Sikeres bérlés |

### Belső Adatfolyamok

| Forrás | Cél | Adat |
|--------|-----|------|
| P1 → D1 | Partner adatok | Mentés |
| D1 → P3 | Partner rekord | Lekérdezés |
| P2 → NAV API | Adószám | Ellenőrzés |
| NAV API → P2 | Cégadatok | Válasz |
| P3 → D2 | Gép státusz | Frissítés |
| P3 → D3 | Bérlés rekord | Létrehozás |
| D3 → P4 | Bérlés adatok | Szerződéshez |
| P5 → D3 | Lezárás | Frissítés |
| P5 → D2 | Gép státusz | Visszavétel |

---

## Adatfolyam Diagram Vizualizáció

```
                    ┌─────────┐
                    │ ÜGYFÉL  │
                    └────┬────┘
                         │
    Személyes adatok ────┼──── Szerződés
    Kaució               │     Kaució vissza
                         ▼
              ┌─────────────────────┐
              │   P1: PARTNER       │◄────► D1: Partner DB
              │      KEZELÉS        │
              └──────────┬──────────┘
                         │
                         ▼
              ┌─────────────────────┐
              │   P2: CÉG           │◄────► NAV API
              │      KEZELÉS        │
              └──────────┬──────────┘
                         │
    ┌─────────┐          ▼
    │ KEZELŐ  │──► ┌─────────────────────┐
    └─────────┘    │   P3: BÉRLÉS        │◄────► D2: Cikk DB
                   │      INDÍTÁS        │◄────► D3: Bérlés DB
                   └──────────┬──────────┘
                              │
                              ▼
              ┌─────────────────────┐
              │   P4: SZERZŐDÉS     │──────► Nyomtató
              │      GENERÁLÁS      │
              └──────────┬──────────┘
                         │
                         ▼
              ┌─────────────────────┐
              │   P5: BÉRLÉS        │◄────► D2: Cikk DB
              │      LEZÁRÁS        │◄────► D3: Bérlés DB
              └─────────────────────┘
```

---

## Jelmagyarázat

| Szimbólum | Jelentés | Szín |
|-----------|----------|------|
| ▭ (Téglalap) | Külső entitás | Szürke |
| ○ (Kör) | Folyamat | Zöld |
| ═══ (Dupla vonal) | Adattár | Narancssárga |
| → (Nyíl) | Adatfolyam | Kék |

---

## Kapcsolódó Dokumentumok

- [01-ugyfelfelvitel-folyamat.md](01-ugyfelfelvitel-folyamat.md) - Folyamatábra
- [01-ugyfelfelvitel-erd.md](01-ugyfelfelvitel-erd.md) - Entitás diagram
- [01-ugyfelfelvitel-dontesi-fa.md](01-ugyfelfelvitel-dontesi-fa.md) - Döntési fa
