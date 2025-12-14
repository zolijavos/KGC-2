# Prompt: Interaktív Diagram HTML Készítése

> Használd ezt a promptot bármely projektben, ahol SVG/Excalidraw diagramokból interaktív HTML oldalt szeretnél készíteni.

---

## A Prompt (másolható)

```
Készíts egy interaktív HTML oldalt a projekt diagramjaihoz az alábbi követelmények szerint:

## Bemenet
- Diagramok helye: [MAPPA_ÚTVONAL, pl: docs/diagrams/]
- Diagram formátum: [SVG / Excalidraw / mindkettő]
- Projekt neve: [PROJEKT_NÉV]
- Nyelv: [magyar / angol]

## Elvárt Funkciók

### 1. Master Áttekintés (főoldal)
- Egy átfogó SVG diagram ami mutatja a teljes rendszert
- Modulok kattintható dobozokként
- Nyilak a modulok között (folyamat irány)
- Színkódolás:
  - Kék (#1976d2) = meglévő modulok
  - Zöld (#388e3c) = új funkciók (ÚJ badge)
  - Narancs (#f57c00) = döntési pontok
- Jelmagyarázat

### 2. Részletes Nézetek
- Minden modulnak saját részletes oldala
- Modul kattintáskor átnavigál a részletekhez
- "Vissza a Master-hez" gomb
- Kapcsolódó modulok linkjei

### 3. Navigáció
- Breadcrumb: Master → Modul
- Gyors modul kártyák a Master alatt
- Modul közötti kereszthivatkozások

### 4. Technikai Követelmények
- Egyetlen HTML fájl (hordozható)
- Alpine.js interaktivitáshoz
- TailwindCSS (CDN)
- Dark mode támogatás
- Responsive design
- SVG inline vagy img src-ként

### 5. Modul Struktúra
Definiáld a modulokat így:

```javascript
modules: {
    'modul-id': {
        name: 'Modul Neve',
        description: 'Rövid leírás',
        isNew: true/false,  // ÚJ badge
        related: ['másik-modul-id', ...],  // kapcsolódó modulok
        diagrams: [
            {
                id: 'diagram-fájlnév-kiterjesztés-nélkül',
                title: 'Diagram címe',
                description: 'Leírás',
                status: 'new' / 'modified' / null
            }
        ]
    }
}
```

## Modul Lista (töltsd ki a projektedhez):

| Modul ID | Név | Leírás | Új? | Kapcsolódó |
|----------|-----|--------|-----|------------|
| [id1] | [Név] | [Leírás] | [igen/nem] | [id2, id3] |
| [id2] | [Név] | [Leírás] | [igen/nem] | [id1] |
| ... | ... | ... | ... | ... |

## Master Diagram Struktúra (töltsd ki):

```
[Kezdőpont]
    ↓
[Belépési pont]
    ↓
◇ Döntési pont ◇
  ↓     ↓     ↓
[M1]  [M2]  [M3]  ← fő modulok
  ↓     ↓
[M4]  [M5]        ← al-modulok
    ↓
[Végpont]
```

## Fájl Elnevezés
- Kimenet: [PROJEKT]-Interaktiv-[DÁTUM].html
- Mappa: [KIMENETI_MAPPA]
```

---

## Használati Példa

```
Készíts egy interaktív HTML oldalt a projekt diagramjaihoz az alábbi követelmények szerint:

## Bemenet
- Diagramok helye: docs/architecture/diagrams/
- Diagram formátum: SVG
- Projekt neve: WebShop Pro
- Nyelv: magyar

## Modul Lista:

| Modul ID | Név | Leírás | Új? | Kapcsolódó |
|----------|-----|--------|-----|------------|
| auth | Authentikáció | Bejelentkezés, regisztráció | nem | user, order |
| user | Felhasználó | Profil kezelés | nem | auth, order |
| product | Termékek | Katalógus, készlet | nem | order, cart |
| cart | Kosár | Kosár kezelés | nem | product, order |
| order | Rendelés | Rendelés folyamat | nem | cart, payment |
| payment | Fizetés | Online fizetés | igen | order, notification |
| notification | Értesítések | Email, push | igen | payment, order |

## Master Diagram Struktúra:

[Látogató]
    ↓
[Landing Page]
    ↓
◇ Bejelentkezett? ◇
  ↓           ↓
[Auth]    [Termékek]
  ↓           ↓
[User]    [Kosár]
              ↓
          [Rendelés]
              ↓
          [Fizetés]
              ↓
          [Értesítések]

## Fájl Elnevezés
- Kimenet: WebShop-Interaktiv-2025-12-14.html
- Mappa: docs/
```

---

## Tippek

1. **Meglévő diagramok felhasználása**: Ha már vannak SVG fájljaid, a prompt automatikusan beépíti őket
2. **Excalidraw konverzió**: Ha .excalidraw fájlok vannak, kérd az SVG konverziót is
3. **Testreszabás**: A színkódokat módosíthatod a projekt arculatához
4. **Bővítés**: Új modulokat könnyen hozzáadhatsz a JavaScript objektumhoz

---

## Kapcsolódó Fájlok (KGC projekt)

| Fájl | Leírás |
|------|--------|
| `/home/javo/DEV/KGC-2/docs/Flows/KGC-ERP-Interaktiv-2025-12-14.html` | Referencia implementáció |
| `/home/javo/DEV/KGC-2/docs/Flows/diagrams/` | SVG diagramok |
| `/home/javo/DEV/KGC-2/docs/Flows/scripts/convert-to-svg.js` | Excalidraw → SVG konverter |
