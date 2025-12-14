# 5. Pénzügy - Folyamatábra

## Diagram Alapinformációk

| Tulajdonság | Érték |
|-------------|-------|
| **Fájlnév** | `5-penzugy-folyamat.excalidraw` |
| **Típus** | Folyamatábra (Flowchart) |
| **Modul** | Pénzügy |
| **Verzió** | v2.0 (Multi-tenant 🏢) |
| **Kategória** | 5. rész - Pénzügy és Riportok |

---

## Részletes Leírás

Ez a diagram a KGC ERP rendszer **négy fő pénzügyi folyamatát** mutatja be:
1. **Napi befizetések** - Vevői tartozások kezelése
2. **Havi zárás** - Könyvelési célú riportok
3. **Szállítólevél számlázás** - Halasztott számlázás
4. **Éves leltár** - Készlet egyeztetés

---

## 1. NAPI BEFIZETÉSEK

### Folyamat Lépései

```
┌─────────────────────────────────────────────────────────────────┐
│                   NAPI BEFIZETÉSEK FOLYAMAT                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Trigger: Bankkivonat megérkezett                               │
│                                                                 │
│  1. Teljesítések menüpont megnyitása                            │
│     └─ Itt jelennek meg a vevői tartozások                      │
│                                                                 │
│  2. Nyitott vevői tartozások listája                            │
│     └─ Színkódolás:                                             │
│        • Rózsaszín = LEJÁRT (fizetési határidő túllépve)        │
│        • Fehér = Határidőn belül                                │
│                                                                 │
│  3. Döntési pont: Teljes vagy rész fizetés?                     │
│     ├─ TELJES: Pipa rárakása → Tétel rendezettnek jelölve       │
│     └─ RÉSZ: Összeg megadása + megjegyzés                       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Teljes vs. Rész Fizetés

| Típus | Művelet | Eredmény |
|-------|---------|----------|
| **Teljes** | Pipa rárakása a tételre | Tétel eltűnik a listából |
| **Rész** | Összeg beírása + megjegyzés | Maradék továbbra is látható |

### Megjegyzések Rész Fizetéshez

```
Példa megjegyzések:
├─ "10.000 Ft előleg fizetve - 2024.02.15"
├─ "Részlet 1/3 - utalással érkezett"
└─ "Átutalás - hiányzik még 5.000 Ft"
```

---

## 2. HAVI ZÁRÁS

### Folyamat Lépései

```
┌─────────────────────────────────────────────────────────────────┐
│                     HAVI ZÁRÁS FOLYAMAT                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Trigger: Hónap vége (tipikusan 1-5. között)                    │
│                                                                 │
│  1. Időszaki pénzjelentés                                       │
│     └─ Bevételek/kiadások összesítése időszakra                 │
│                                                                 │
│  2. ÁFA tábla lekérdezés                                        │
│     └─ ÁFA adatok összesítése a könyvelőnek                     │
│                                                                 │
│  3. Excel export                                                │
│     └─ Táblázatos formátumban letöltés                          │
│                                                                 │
│  4. Küldés könyvelőnek                                          │
│     └─ E-mail mellékletként vagy megosztott mappába             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Riportok Részletei

| Riport | Tartalom | Formátum |
|--------|----------|----------|
| **Időszaki pénzjelentés** | Bevétel, kiadás, egyenleg | Excel |
| **ÁFA tábla** | Nettó, ÁFA, bruttó bontásban | Excel |
| **Számla lista** | Kiállított számlák | Excel |

---

## 3. SZÁLLÍTÓLEVÉL SZÁMLÁZÁS

### Folyamat Lépései

```
┌─────────────────────────────────────────────────────────────────┐
│              SZÁLLÍTÓLEVÉL SZÁMLÁZÁS FOLYAMAT                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Trigger: Szállítólevelek összegyűltek (pl. heti/havi)          │
│                                                                 │
│  1. Ügyfél keresése                                             │
│     └─ Partner azonosítás                                       │
│                                                                 │
│  2. Nyitott szállítólevelek kijelölése                          │
│     └─ Több szállítólevél összevonható                          │
│                                                                 │
│  3. Számla generálás                                            │
│     └─ Összevont számla a kijelölt szállítólevelekről           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### FONTOS Szabály

```
┌────────────────────────────────────────────────────────────────┐
│  ⚠️ KRITIKUS INFORMÁCIÓ                                        │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  A szállítólevél számlák CSAK itt kezelhetők!                  │
│                                                                │
│  A normál számlázás modulban NEM jelennek meg a                │
│  szállítóleveles tételek.                                      │
│                                                                │
│  Oka: A szállítólevél "0 napos" bérlés, amely külön            │
│  folyamatban kerül elszámolásra.                               │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

---

## 4. ÉVES LELTÁR

### Folyamat Lépései

```
┌─────────────────────────────────────────────────────────────────┐
│                     ÉVES LELTÁR FOLYAMAT                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Trigger: Év vége (december/január)                             │
│                                                                 │
│  1. Cikkarton szerinti leltár                                   │
│     └─ Rendszerből kinyomtatott készletlista                    │
│                                                                 │
│  2. Program vs. valós összehasonlítás                           │
│     └─ Fizikai számlálás és összevetés                          │
│                                                                 │
│  3. Eltérések átfésülése                                        │
│     └─ Hibák, hiányok azonosítása                               │
│                                                                 │
│  4. Készlet feltöltés (Laci)                                    │
│     └─ Korrekciós mozgások rögzítése                            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Ismert Probléma

```
┌────────────────────────────────────────────────────────────────┐
│  ⚠️ PROBLÉMA                                                   │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  A program készlet gyakran NEM STIMMEL a valósággal!           │
│                                                                │
│  Lehetséges okok:                                              │
│  • Bevételezés nélküli eladás                                  │
│  • Hibás készletmozgás                                         │
│  • Selejt nem rögzítve                                         │
│  • "Céges használat" nem követett                              │
│                                                                │
│  Megoldás: Éves leltár korrekció                               │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

---

## Jelmagyarázat

| Szín | Jelentés | Folyamat |
|------|----------|----------|
| Kék (#e3f2fd) | Napi feladatok | Befizetések |
| Lila (#f3e5f5) | Havi feladatok | Havi zárás |
| Narancssárga (#fff3e0) | Szállítólevél | Számlázás |
| Piros (#ffcdd2) | Éves feladatok | Leltár |
| Zöld (#c8e6c9) | Sikeres lépés | - |

---

## Összefoglaló Táblázat

| Folyamat | Gyakoriság | Felelős | Output |
|----------|------------|---------|--------|
| Napi befizetések | Naponta | Pénzügyes | Rendezett számlák |
| Havi zárás | Havonta | Pénzügyes | Excel riportok |
| Szállítólevél számlázás | Heti/Havi | Számlázó | Összevont számlák |
| Éves leltár | Évente | Mindenki | Korrigált készlet |
| **Részletfizetés** 🆕 | Folyamatos | Pénzügyes | Előleg + Törlesztések |

---

## 5. RÉSZLETFIZETÉS (8. rész bővítés) 🆕

### Folyamat Lépései

```
┌─────────────────────────────────────────────────────────────────┐
│                   RÉSZLETFIZETÉS FOLYAMAT                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Trigger: Nagy összegű megrendelés (pl. 200.000 Ft felett)      │
│                                                                  │
│  1. Előleg számla kiállítása                                    │
│     └─ Tipikusan 30% előleg (konfigurálható)                    │
│     └─ Előlegszámla azonnal kiküldve                            │
│                                                                  │
│  2. Részletfizetési terv készítése                              │
│     └─ Maximálisan 12 hónapra bontható                          │
│     └─ Törlesztési összeg = (Teljes ár - Előleg) / Hónapok      │
│                                                                  │
│  3. Havi díjbekérők automatikus küldése                         │
│     └─ Minden hónap elején automatikusan                        │
│     └─ Email + SMS emlékeztető                                  │
│                                                                  │
│  4. Végszámla kiállítása                                        │
│     └─ Utolsó részlet beérkezésekor                            │
│     └─ Előleg + összes törlesztés = Teljes ár                   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Részletfizetés Üzleti Szabályok

| Szabály | Érték |
|---------|-------|
| Minimum összeg | 200.000 Ft |
| Előleg mértéke | 30% (konfig.) |
| Max futamidő | 12 hónap |
| Késedelmi kamat | 0% (nincs) |
| Díjbekérő küldés | Automatikus |

---

## Kapcsolódó Dokumentumok

- [05-penzugy-archivalas.md](05-penzugy-archivalas.md) - Számla archiválás
- [02-ertekesites-folyamat.md](02-ertekesites-folyamat.md) - Értékesítés
- [01-ugyfelfelvitel-folyamat.md](01-ugyfelfelvitel-folyamat.md) - Bérlés (szállítólevél)
- [08-reszletfizetes-folyamat.md](08-reszletfizetes-folyamat.md) - Részletfizetés részletes folyamat 🆕
