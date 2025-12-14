# 4. Szerviz Modul - Munkalap Életciklus

## Diagram Alapinformációk

| Tulajdonság | Érték |
|-------------|-------|
| **Fájlnév** | `4-szerviz-munkalap.excalidraw` |
| **Típus** | Állapotátmenet Diagram (State Machine) |
| **Modul** | Szerviz |
| **Verzió** | v1.0 |
| **Kategória** | 4. rész - Szerviz Modul |

---

## Részletes Leírás

Ez a diagram a **szerviz munkalap teljes életciklusát** mutatja be állapotátmenet diagramként. A munkalap különböző státuszokon megy keresztül a felvételtől a lezárásig.

---

## Állapotok (States)

### 1. FELVÉVE (Kezdeti állapot)

```
┌─────────────────────────────────────────────────────────────────┐
│                        FELVÉVE                                  │
│                    (Kezdeti státusz)                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Mi történik ebben az állapotban:                               │
│  • Gép beérkezett a szervizbe                                   │
│  • Munkalap automatikusan generálódott                          │
│  • Vonalkód kiadva (matricán a gépen)                           │
│  • Partner adatok rögzítve                                      │
│                                                                 │
│  Lehetséges átmenetek:                                          │
│  • → JAVÍTÁS ALATT (diagnosztika után, ha nem drága)            │
│  • → ÁRAJÁNLAT (diagnosztika után, ha drága)                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Színkód:** Kék (#e3f2fd)

---

### 2. JAVÍTÁS ALATT

```
┌─────────────────────────────────────────────────────────────────┐
│                    JAVÍTÁS ALATT                                │
│                   (Munka státusz)                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Mi történik ebben az állapotban:                               │
│  • Diagnosztika elkészült                                       │
│  • Alkatrészek meghatározva                                     │
│  • Munka folyamatban                                            │
│  • Szervizes dolgozik a gépen                                   │
│                                                                 │
│  Lehetséges átmenetek:                                          │
│  • → ELKÉSZÜLT (javítás befejezve)                              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Színkód:** Narancssárga (#fff3e0)

---

### 3. ELKÉSZÜLT

```
┌─────────────────────────────────────────────────────────────────┐
│                       ELKÉSZÜLT                                 │
│                    (Átmeneti státusz)                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Mi történik ebben az állapotban:                               │
│  • Javítás befejezve                                            │
│  • Tesztelés kész                                               │
│  • Várja a számlázási ellenőrzést                               │
│                                                                 │
│  Lehetséges átmenetek:                                          │
│  • → SZÁMLÁZHATÓ (ellenőrzés OK)                                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Színkód:** Zöld (#c8e6c9)

---

### 4. ÁRAJÁNLAT (Várakozó állapot)

```
┌─────────────────────────────────────────────────────────────────┐
│                       ÁRAJÁNLAT                                 │
│                   (Várakozó státusz)                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Mi történik ebben az állapotban:                               │
│  • Drága javítás szükséges                                      │
│  • Ügyfél döntésére vár                                         │
│  • Árajánlat elküldve az ügyfélnek                              │
│                                                                 │
│  Lehetséges átmenetek:                                          │
│  • → SZÁMLÁZHATÓ (árajánlat elfogadva)                          │
│  • → VISSZAADÁS JAVÍTÁS NÉLKÜL (árajánlat elutasítva)           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Színkód:** Sárga (#fff8e1)

---

### 5. SZÁMLÁZHATÓ

```
┌─────────────────────────────────────────────────────────────────┐
│                      SZÁMLÁZHATÓ                                │
│                    (Kritikus státusz)                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Mi történik ebben az állapotban:                               │
│  • Számla kiállítható                                           │
│  • Ügyfél értesítve                                             │
│  • Gép kiadható                                                 │
│                                                                 │
│  ⚠️ FONTOS SZABÁLY:                                             │
│  Számlázni CSAK ebben a státuszban lehet!                       │
│  Más státuszban a számlázás blokkolva.                          │
│                                                                 │
│  Lehetséges átmenetek:                                          │
│  • → LEZÁRVA (számla kiállítva, gép kiadva)                     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Színkód:** Lila (#f3e5f5)

---

### 6. LEZÁRVA (Végállapot)

```
┌─────────────────────────────────────────────────────────────────┐
│                        LEZÁRVA                                  │
│                    (Végső státusz)                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Mi történik ebben az állapotban:                               │
│  • Számla kiállítva                                             │
│  • Gép kiadva az ügyfélnek                                      │
│  • Munkalap archivált                                           │
│                                                                 │
│  Ez a folyamat VÉGÁLLAPOTA.                                     │
│  Nincs további átmenet.                                         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Színkód:** Piros (#ffcdd2)

---

### 7. VISSZAADÁS JAVÍTÁS NÉLKÜL (Alternatív végállapot)

```
┌─────────────────────────────────────────────────────────────────┐
│               VISSZAADÁS JAVÍTÁS NÉLKÜL                         │
│                (Alternatív végállapot)                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Mi történik ebben az állapotban:                               │
│  • Ügyfél elutasította az árajánlatot                           │
│  • Gép visszaadva javítás nélkül                                │
│  • Diagnosztikai díj felszámítható                              │
│                                                                 │
│  Ez a folyamat ALTERNATÍV VÉGÁLLAPOTA.                          │
│  Nincs további átmenet.                                         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Színkód:** Piros (#ffcdd2)

---

## Állapotátmenetek (Transitions)

### Átmenet Diagram

```
                    ┌──────────────────┐
                    │      START       │
                    └────────┬─────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │     FELVÉVE      │
                    └────────┬─────────┘
                             │
             ┌───────────────┴───────────────┐
             │ Diagnosztika                  │ Drága javítás
             ▼                               ▼
    ┌──────────────────┐           ┌──────────────────┐
    │  JAVÍTÁS ALATT   │           │    ÁRAJÁNLAT     │
    └────────┬─────────┘           └────────┬─────────┘
             │                               │
             │ Javítás kész       ┌──────────┴──────────┐
             ▼                    │                     │
    ┌──────────────────┐    Elfogadva            Elutasítva
    │    ELKÉSZÜLT     │          │                     │
    └────────┬─────────┘          │                     ▼
             │                    │           ┌─────────────────┐
             │ Ellenőrzés OK      │           │   VISSZAADÁS    │
             ▼                    │           │ JAVÍTÁS NÉLKÜL  │
    ┌──────────────────┐          │           └─────────────────┘
    │   SZÁMLÁZHATÓ    │◄─────────┘
    └────────┬─────────┘
             │
             │ Számla kész
             ▼
    ┌──────────────────┐
    │     LEZÁRVA      │
    └──────────────────┘
```

### Átmenet Részletek

| # | Kiinduló | Cél | Trigger | Feltétel |
|---|----------|-----|---------|----------|
| 1 | START | FELVÉVE | Gép beérkezése | Munkalap generálás |
| 2 | FELVÉVE | JAVÍTÁS ALATT | Diagnosztika | Nem drága javítás |
| 3 | FELVÉVE | ÁRAJÁNLAT | Diagnosztika | Drága javítás |
| 4 | JAVÍTÁS ALATT | ELKÉSZÜLT | Javítás kész | Teszt OK |
| 5 | ELKÉSZÜLT | SZÁMLÁZHATÓ | Ellenőrzés | Minden OK |
| 6 | ÁRAJÁNLAT | SZÁMLÁZHATÓ | Elfogadás | Ügyfél elfogadta |
| 7 | ÁRAJÁNLAT | VISSZAADÁS | Elutasítás | Ügyfél elutasította |
| 8 | SZÁMLÁZHATÓ | LEZÁRVA | Számlázás | Számla kiállítva |

---

## Jelmagyarázat

| Szín | Státusz típus | Leírás |
|------|---------------|--------|
| Kék (#e3f2fd) | Kezdeti | Folyamat kezdete |
| Narancssárga (#fff3e0) | Munka | Aktív munka folyamatban |
| Sárga (#fff8e1) | Várakozó | Döntésre/inputra vár |
| Zöld (#c8e6c9) | Átmeneti | Rövid ideig tartó állapot |
| Lila (#f3e5f5) | Számlázható | Kritikus - számlázás engedélyezett |
| Piros (#ffcdd2) | Végállapot | Folyamat vége |

---

## Fontos Üzleti Szabályok

### 1. Számlázási korlátozás

```
┌─────────────────────────────────────────────────────────────────┐
│                  ⚠️ KRITIKUS SZABÁLY                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Számla kiállítása CSAK "Számlázható" státuszban lehetséges!    │
│                                                                 │
│  Ez a szabály biztosítja:                                       │
│  • A folyamat betartását                                        │
│  • A minőségellenőrzés megtörténtét                             │
│  • Az ügyfél-jóváhagyás meglétét (ha szükséges)                 │
│                                                                 │
│  Ha más státuszban próbálnak számlázni:                         │
│  → A rendszer BLOKKOLJA a műveletet                             │
│  → Hibaüzenet jelenik meg                                       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 2. Státusz visszalépés

- Normál esetben a státusz csak **előre** haladhat
- Kivétel: Admin jogosultsággal visszaállítható
- Minden státuszváltás naplózva

### 3. Automatikus értesítések

| Állapot | Értesítés |
|---------|-----------|
| ÁRAJÁNLAT | E-mail az ügyfélnek |
| ELKÉSZÜLT | Belső értesítés |
| SZÁMLÁZHATÓ | Ügyfél értesítés (gép átvehető) |

---

## Kapcsolódó Dokumentumok

- [04-szerviz-folyamat.md](04-szerviz-folyamat.md) - Teljes szerviz folyamat
- [04-szerviz-erd.md](04-szerviz-erd.md) - Adatmodell
- [07-ertesitesek-folyamat.md](07-ertesitesek-folyamat.md) - Értesítési rendszer
