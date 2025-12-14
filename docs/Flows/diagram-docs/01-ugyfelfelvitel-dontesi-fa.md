# 1. Ügyfél Felvétel és Bérlés - Döntési Fa

## Diagram Alapinformációk

| Tulajdonság | Érték |
|-------------|-------|
| **Fájlnév** | `1-ugyfelfelvitel-dontesi-fa.excalidraw` |
| **Típus** | Döntési Fa (Decision Tree) |
| **Modul** | Partner & Bérlés |
| **Verzió** | v1.0 |
| **Kategória** | 1. rész - Ügyfél Felvétel és Bérlés |

---

## Részletes Leírás

Ez a döntési fa diagram a **bérlési folyamat kritikus döntési pontjait** ábrázolja. Minden döntési pont (rombusz) egy kérdést jelent, amelyre a válasz meghatározza a folyamat következő lépését.

A diagram két fő szakaszra oszlik:
1. **Gép kiadása** - A bérlés indítása
2. **Gép visszavétele** - A bérlés lezárása

---

## Döntési Pontok Részletesen

### DÖNTÉS #1: Meglévő ügyfél?

```
         ┌───────────────────┐
         │  Ügyfél Beérkezik │
         └─────────┬─────────┘
                   │
                   ▼
         ┌─────────────────────┐
         │   MEGLÉVŐ ÜGYFÉL?   │
         │       (D1)          │
         └──────────┬──────────┘
                    │
        ┌───────────┴───────────┐
        │                       │
       IGEN                    NEM
        │                       │
        ▼                       ▼
┌───────────────┐     ┌──────────────────┐
│    Ügyfél     │     │   Új Partner     │
│  Kiválasztása │     │    Felvétele     │
└───────────────┘     └──────────────────┘
```

**Döntési logika:**
| Válasz | Következő lépés | Leírás |
|--------|-----------------|--------|
| **IGEN** | Ügyfél keresése és kiválasztása | Meglévő partner keresése név, telefon, igazolvány alapján |
| **NEM** | Új partner adatfelvétel | Teljes regisztrációs folyamat: név, cím, igazolvány, stb. |

**Keresési módok meglévő ügyfélnél:**
- Név alapján (részleges egyezés)
- Telefonszám alapján
- Igazolványszám alapján (pontos egyezés)
- Vonalkódos partnerkártya

---

### DÖNTÉS #2: Magánszemély vagy Cég?

```
        ┌────────────────────────┐
        │  Partner kiválasztva/  │
        │     létrehozva         │
        └───────────┬────────────┘
                    │
                    ▼
         ┌─────────────────────┐
         │    MAGÁNSZEMÉLY     │
         │      VAGY CÉG?      │
         │        (D2)         │
         └──────────┬──────────┘
                    │
        ┌───────────┴───────────┐
        │                       │
   MAGÁNSZEMÉLY               CÉG
        │                       │
        ▼                       ▼
┌──────────────────┐   ┌────────────────────┐
│    Közvetlen     │   │  Adószám beírása   │
│   szerződés      │   │  NAV ellenőrzés    │
│                  │   │  Cégadatok betöltés│
└──────────────────┘   └────────────────────┘
```

**Döntési logika:**
| Válasz | Következő lépés | Következmény |
|--------|-----------------|--------------|
| **MAGÁNSZEMÉLY** | Közvetlen szerződés | Számla a magánszemély nevére |
| **CÉG** | NAV adószám ellenőrzés | Számla a cég nevére, de szerződés a magánszeméllyel |

**FONTOS ÜZLETI SZABÁLY:**
```
┌────────────────────────────────────────────────────────────┐
│  ⚠️ A SZERZŐDÉS MINDIG A MAGÁNSZEMÉLLYEL KÖTTETIK!         │
│                                                            │
│  A cég csak a számla címzettje.                            │
│  A jogi felelősség a magánszemélyé.                        │
│  Ez biztosítja a követelések érvényesíthetőségét.          │
└────────────────────────────────────────────────────────────┘
```

**Céges folyamat lépései:**
1. Adószám beírása (11 karakter)
2. NAV API hívás - Online adószám ellenőrzés
3. Cégadatok automatikus betöltése (név, cím)
4. Működési státusz ellenőrzése
5. Cég hozzárendelése a partnerhez

---

### DÖNTÉS #3: Bérlési Időtartam?

```
         ┌────────────────────────┐
         │   Partner és (opció)   │
         │   Cég kiválasztva      │
         └───────────┬────────────┘
                     │
                     ▼
         ┌─────────────────────┐
         │   BÉRLÉSI IDŐTARTAM? │
         │        (D3)          │
         └──────────┬───────────┘
                    │
    ┌───────┬───────┼───────┬───────┐
    │       │       │       │       │
  3 óra   Fél nap  1 nap    0
    │       │       │       │
    ▼       ▼       ▼       ▼
┌───────┐ ┌──────┐ ┌──────┐ ┌─────────────┐
│(nem   │ │ 50%  │ │ 100% │ │Szállítólevél│
│haszn.)│ │ díj  │ │ díj  │ │ (törzsügyf.)│
└───────┘ └──────┘ └──────┘ └─────────────┘
```

**Időtartam opciók:**

| Opció | Kód | Díjszámítás | Státusz |
|-------|-----|-------------|---------|
| **3 óra** | `3ora` | - | ⚠️ NEM HASZNÁLT |
| **Fél nap** | `felnap` | 50% napi díj | ✅ Aktív |
| **1 nap** | `1nap` | 100% napi díj | ✅ Aktív (alapértelmezett) |
| **0** | `0` | Később | ⚠️ Csak törzsügyfél |

**"0" (Szállítólevél) használata:**
```
┌────────────────────────────────────────────────────────────┐
│  A "0" időtartam speciális eset:                           │
│                                                            │
│  • Nincs azonnali díjfizetés                               │
│  • Szállítólevél kerül kiállításra                         │
│  • Elszámolás később történik                              │
│  • CSAK megbízható törzsügyfeleknek!                       │
│  • Kezelő felelőssége a döntés                             │
└────────────────────────────────────────────────────────────┘
```

---

### DÖNTÉS #4: Fizetési Mód?

```
         ┌────────────────────────┐
         │   Gép kiválasztva és   │
         │   kaució megadva       │
         └───────────┬────────────┘
                     │
                     ▼
         ┌─────────────────────┐
         │    FIZETÉSI MÓD?    │
         │        (D4)         │
         └──────────┬──────────┘
                    │
        ┌───────────┼───────────┐
        │           │           │
    Készpénz     Kártya     Átutalás
        │           │           │
        ▼           ▼           ▼
  ┌──────────┐ ┌──────────┐ ┌──────────┐
  │ Számla   │ │ Nincs    │ │ Számla   │
  │ kiállít. │ │ számla   │ │ kiállít. │
  └──────────┘ └──────────┘ └──────────┘
```

**Fizetési módok:**

| Mód | Számla | Megjegyzés |
|-----|--------|------------|
| **Készpénz** | Automatikus nyugta/számla | Leggyakoribb |
| **Kártya** | Nincs rendszer számla | Terminál bizonylat |
| **Átutalás** | Számla kötelező | Céges ügyfeleknél gyakori |

**KAUCIÓ SPECIÁLIS SZABÁLY:**
```
┌────────────────────────────────────────────────────────────┐
│  ⚠️ KAUCIÓ KEZELÉS                                         │
│                                                            │
│  A kaució CSAK KÉSZPÉNZBEN fogadható el!                   │
│                                                            │
│  Indoklás:                                                 │
│  • Azonnali visszaadhatóság biztosítása                    │
│  • Kártya esetén visszaterhelési problémák                 │
│  • Egyszerűbb adminisztráció                               │
└────────────────────────────────────────────────────────────┘
```

---

### DÖNTÉS #5: Késés van? (Visszavételkor)

```
         ┌────────────────────────┐
         │   Vonalkód beolvasva   │
         │   Bérlés azonosítva    │
         └───────────┬────────────┘
                     │
                     ▼
         ┌─────────────────────┐
         │    KÉSÉS VAN?       │
         │       (D5)          │
         └──────────┬──────────┘
                    │
        ┌───────────┴───────────┐
        │                       │
       IGEN                    NEM
        │                       │
        ▼                       ▼
┌──────────────────┐   ┌──────────────────┐
│  Késési díj      │   │   Nincs késés    │
│  felszámítása    │   │   → Gép          │
│  (F + napok)     │   │   visszavétele   │
└────────┬─────────┘   └────────┬─────────┘
         │                      │
         └──────────┬───────────┘
                    │
                    ▼
         ┌─────────────────────┐
         │  KAUCIÓ VISSZAADÁS  │
         └─────────────────────┘
```

**Késési díj számítás:**

| Késés mértéke | Díj | Példa |
|---------------|-----|-------|
| 0.5 nap | 50% napi díj | Délelőtt helyett délután |
| 1 nap | 100% napi díj | 1 napot késett |
| N nap | N × 100% napi díj | Többnapos késés |

**Késés kezelési folyamat:**
1. Rendszer automatikusan kiszámítja a késést
2. Kezelő "F" billentyűvel jelzi a késést
3. Napok számának megadása
4. Késési díj automatikus kalkulálása
5. Számla/nyugta kiállítása a különbözetről

---

## Döntési Fa Összesítő Táblázat

| # | Döntési pont | Opciók | Alapértelmezett |
|---|-------------|--------|-----------------|
| D1 | Meglévő ügyfél? | IGEN / NEM | - |
| D2 | Magánszemély vagy Cég? | Magán / Cég | Magánszemély |
| D3 | Bérlési időtartam? | 3óra/Fél nap/1 nap/0 | 1 nap |
| D4 | Fizetési mód? | KP/Kártya/Átutalás | Készpénz |
| D5 | Késés van? | IGEN / NEM | NEM |

---

## Jelmagyarázat

| Szimbólum | Jelentés | Szín |
|-----------|----------|------|
| ◯ (Ellipszis) | Kezdő/Záró pont | Kék |
| ◇ (Rombusz) | Döntési pont | Narancssárga |
| ▭ (Téglalap - kék) | Folyamat lépés | Kék |
| ▭ (Téglalap - zöld) | Ajánlott/Gyakori opció | Zöld |
| ▭ (Téglalap - piros) | Figyelmeztetés/Ritka | Piros |
| ▭ (Téglalap - lila) | Cég-specifikus | Lila |
| ▭ (Téglalap - szürke) | Nem használt funkció | Szürke |
| → (Zöld nyíl) | IGEN ág | Zöld |
| → (Piros nyíl) | NEM ág | Piros |

---

## Kapcsolódó Dokumentumok

- [01-ugyfelfelvitel-folyamat.md](01-ugyfelfelvitel-folyamat.md) - Teljes folyamatábra
- [01-ugyfelfelvitel-erd.md](01-ugyfelfelvitel-erd.md) - Entitás diagram
- [01-ugyfelfelvitel-rendszer.md](01-ugyfelfelvitel-rendszer.md) - Rendszer architektúra
