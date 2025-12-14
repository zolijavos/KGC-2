# 5. Pénzügy - Számla Archiválás

## Diagram Alapinformációk

| Tulajdonság | Érték |
|-------------|-------|
| **Fájlnév** | `5-penzugy-archivalas.excalidraw` |
| **Típus** | Rendszer Diagram |
| **Modul** | Pénzügy / Dokumentum kezelés |
| **Verzió** | v1.0 |
| **Kategória** | 5. rész - Pénzügy és Riportok |

---

## Részletes Leírás

Ez a diagram a KGC ERP rendszer **dokumentum archiválási struktúráját** mutatja be. Minden üzleti dokumentum (számla, árajánlat, munkalap, stb.) a szerveren tárolódik strukturált mapparendszerben.

---

## Szerver Mappastruktúra

### Gyökér mappa: `/bizonylatok/`

```
SZERVER
└── /bizonylatok/
    ├── /szamlak/
    ├── /arajanaltok/
    ├── /dokumentumok/
    │   └── /[szamla_sorszam]/
    │       └── /mellekletek/
    ├── /tervek/
    ├── /feladas/
    ├── /havizaras/
    └── /napizaras/
```

---

## Mappák Részletes Leírása

### 1. `/szamlak/` - Számlamásolatok

```
┌─────────────────────────────────────────────────────────────────┐
│                      /szamlak/ MAPPA                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Tartalom: Számlamásolatok PDF formátumban                      │
│                                                                 │
│  Fájl névkonvenció:                                             │
│  └─ SZAMLA_[sorszam]_[peldany].pdf                              │
│                                                                 │
│  Példa:                                                         │
│  ├─ SZAMLA_2024-00001_1.pdf    (1. példány)                     │
│  ├─ SZAMLA_2024-00001_2.pdf    (2. példány)                     │
│  └─ SZAMLA_2024-00001_DUB.pdf  (Duplikátum jelölés)             │
│                                                                 │
│  Megjegyzések:                                                  │
│  • 2 példány esetén 2 fájl                                      │
│  • Elszámolás: több példány                                     │
│  • DUB jelölés = duplikátum nyomtatás                           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Színkód:** Zöld

---

### 2. `/arajanaltok/` - Hivatalos Árajánlatok

```
┌─────────────────────────────────────────────────────────────────┐
│                   /arajanaltok/ MAPPA                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Tartalom: Nagy cégeknek küldött hivatalos árajánlatok          │
│                                                                 │
│  Fájl névkonvenció:                                             │
│  └─ ARAJANALT_[hivatkozas]_[datum].pdf                          │
│                                                                 │
│  Példa:                                                         │
│  └─ ARAJANALT_HU-2024-0056_20240215.pdf                         │
│                                                                 │
│  Tartalom részletei:                                            │
│  • Szerződés szerinti óradíj                                    │
│  • Tételek részletezése                                         │
│  • Hivatkozási szám (nagy cég belső azonosító)                  │
│  • PDF formátum                                                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Színkód:** Narancssárga

---

### 3. `/dokumentumok/` - Számla Mellékletek

```
┌─────────────────────────────────────────────────────────────────┐
│                  /dokumentumok/ MAPPA                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Tartalom: Számlákhoz tartozó mellékletek                       │
│                                                                 │
│  Struktúra:                                                     │
│  /dokumentumok/                                                 │
│  └── /[szamla_sorszam]/                                         │
│      └── /mellekletek/                                          │
│          ├─ fénykép.jpg                                         │
│          ├─ munkalap_scan.pdf                                   │
│          └─ egyeb_dokumentum.pdf                                │
│                                                                 │
│  Melléklet típusok:                                             │
│  • PDF dokumentumok                                             │
│  • Képfájlok (JPG, PNG)                                         │
│  • Scannelt dokumentumok                                        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Színkód:** Lila

---

### 4. `/tervek/` - Munkalap PDF-ek

```
┌─────────────────────────────────────────────────────────────────┐
│                     /tervek/ MAPPA                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Tartalom: Szerviz munkalap PDF-ek                              │
│                                                                 │
│  Generálás:                                                     │
│  • Árajánlat státuszból automatikusan                           │
│  • Opcionálisan kinyomtatható                                   │
│                                                                 │
│  Fájl névkonvenció:                                             │
│  └─ MUNKALAP_[szam].pdf                                         │
│                                                                 │
│  Példa:                                                         │
│  └─ MUNKALAP_ML-2024-00123.pdf                                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Színkód:** Világoskék

---

### 5. `/feladas/` - NAV Feladás

```
┌─────────────────────────────────────────────────────────────────┐
│                     /feladas/ MAPPA                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Tartalom: NAV-nak küldött adatszolgáltatások                   │
│                                                                 │
│  Formátum: XML                                                  │
│                                                                 │
│  Generálás:                                                     │
│  • Automatikus a számla kiállításakor                           │
│  • Visszakereshető bármikor                                     │
│                                                                 │
│  Fájl névkonvenció:                                             │
│  └─ NAV_[szamla_sorszam]_[timestamp].xml                        │
│                                                                 │
│  Példa:                                                         │
│  └─ NAV_2024-00001_20240215103045.xml                           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Színkód:** Piros

---

### 6. `/havizaras/` - Havi Zárások

```
┌─────────────────────────────────────────────────────────────────┐
│                    /havizaras/ MAPPA                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Tartalom: Havi zárási dokumentumok                             │
│                                                                 │
│  Típusok:                                                       │
│  • NAV listák                                                   │
│  • Bizonylat összesítők                                         │
│  • ÁFA kimutatások                                              │
│                                                                 │
│  Struktúra:                                                     │
│  /havizaras/                                                    │
│  └── /2024_02/                                                  │
│      ├─ afa_osszesito.xlsx                                      │
│      ├─ szamla_lista.xlsx                                       │
│      └─ penzjelentes.xlsx                                       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Színkód:** Barna

---

### 7. `/napizaras/` - Napi Zárások

```
┌─────────────────────────────────────────────────────────────────┐
│                    /napizaras/ MAPPA                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Tartalom: Napi zárási dokumentumok                             │
│                                                                 │
│  Fájl névkonvenció:                                             │
│  └─ [EV]_[HO]_[NAP]/ mappa                                      │
│                                                                 │
│  Példa struktúra:                                               │
│  /napizaras/                                                    │
│  └── /25_02_06/                                                 │
│      ├─ berleti_dij.xlsx                                        │
│      ├─ szerviz.xlsx                                            │
│      └─ eladas.xlsx                                             │
│                                                                 │
│  Tartalom kategóriák:                                           │
│  • Bérleti díj                                                  │
│  • Szerviz                                                      │
│  • Eladás                                                       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Színkód:** Szürke

---

## Dokumentum Áramlás

### Automatikus Mentések

| Forrás művelet | Cél mappa | Fájl típus |
|----------------|-----------|------------|
| Számlázás | `/szamlak/` | PDF |
| Szerviz munkalap (árajánlat) | `/tervek/` | PDF |
| NAV feladás | `/feladas/` | XML |
| Napi zárás | `/napizaras/` | Excel |

```
┌──────────────┐        ┌──────────────┐
│  Számlázás   │───────>│  /szamlak/   │
└──────────────┘        └──────────────┘

┌──────────────┐        ┌──────────────┐
│   Szerviz    │───────>│   /tervek/   │
│  (Árajánlat) │        │              │
└──────────────┘        └──────────────┘

┌──────────────┐        ┌──────────────┐
│ NAV feladás  │───────>│  /feladas/   │
└──────────────┘  XML   └──────────────┘

┌──────────────┐        ┌──────────────┐
│ Napi zárás   │───────>│ /napizaras/  │
└──────────────┘        └──────────────┘
```

---

## Hozzáférés

### Helyi Hálózat

```
┌────────────────────────────────────────────────────────────────┐
│  ✅ ELÉRHETŐ                                                   │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  A helyi hálózaton (boltban) mindenki eléri a                  │
│  /bizonylatok/ mappát.                                         │
│                                                                │
│  Elérési út: \\SZERVER\bizonylatok\                            │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### Távoli Elérés

```
┌────────────────────────────────────────────────────────────────┐
│  ⚠️ NEM MEGOLDOTT                                              │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  A távoli elérés jelenleg NINCS megoldva.                      │
│                                                                │
│  Státusz: Fejlesztés alatt                                     │
│  Felelős: Szoftverfejlesztő                                    │
│                                                                │
│  Lehetséges megoldások:                                        │
│  • VPN kapcsolat                                               │
│  • Felhő alapú tárolás                                         │
│  • Web-es felület                                              │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

---

## Jelmagyarázat

| Szín | Mappa | Tartalom |
|------|-------|----------|
| Zöld | /szamlak/ | Számlamásolatok |
| Narancssárga | /arajanaltok/ | Hivatalos árajánlatok |
| Lila | /dokumentumok/ | Számla mellékletek |
| Világoskék | /tervek/ | Munkalap PDF-ek |
| Piros | /feladas/ | NAV XML-ek |
| Barna | /havizaras/ | Havi zárások |
| Szürke | /napizaras/ | Napi zárások |

---

## Kapcsolódó Dokumentumok

- [05-penzugy-folyamat.md](05-penzugy-folyamat.md) - Pénzügyi folyamatok
- [04-szerviz-folyamat.md](04-szerviz-folyamat.md) - Szerviz munkalap
- [02-ertekesites-folyamat.md](02-ertekesites-folyamat.md) - Számlázás
