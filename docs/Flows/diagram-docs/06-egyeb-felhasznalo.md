# 6. Egyéb - Felhasználók és Jogosultságok

## Diagram Alapinformációk

| Tulajdonság | Érték |
|-------------|-------|
| **Fájlnév** | `6-egyeb-felhasznalo.excalidraw` |
| **Típus** | Rendszer Diagram |
| **Modul** | Adminisztráció |
| **Verzió** | v2.0 (RBAC 🔐) |
| **Kategória** | 6. rész - Egyéb funkciók |

---

## Részletes Leírás

Ez a diagram a KGC ERP rendszer **felhasználó kezelését és jogosultsági rendszerét** mutatja be. A v2.0 verzió **RBAC (Role-Based Access Control)** jogosultság-kezelést tartalmaz 6 szinttel (ADR-003).

---

## Felhasználók Kezelése

### Hozzáférés

```
Menüpont: Törzsadatok → Felhasználók
```

### Funkciók

```
┌─────────────────────────────────────────────────────────────────┐
│                   FELHASZNÁLÓ KEZELÉS                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Elérhető műveletek:                                            │
│                                                                 │
│  • Felhasználók listázása                                       │
│    └─ Összes aktív/inaktív felhasználó                          │
│                                                                 │
│  • Keresés név alapján                                          │
│    └─ Részleges egyezés támogatott                              │
│                                                                 │
│  • Jogosultságok kezelése                                       │
│    └─ Szerepkör hozzárendelés                                   │
│                                                                 │
│  • Hozzáférési szintek beállítása                               │
│    └─ Modul szintű engedélyek                                   │
│                                                                 │
│  • Új felhasználó hozzáadása                                    │
│    └─ Teljes regisztráció                                       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Felhasználó Adatok

```
Kötelező mezők:
├─ Felhasználó ID (automatikus)
├─ Név (teljes név)
├─ Kód (bejelentkezéshez - rövid azonosító)
└─ Szerepkör (RBAC szint)

Opcionális:
├─ E-mail (értesítésekhez)
├─ Telefon
└─ Megjegyzés
```

---

## RBAC Jogosultsági Rendszer (ADR-003)

### 6 Szintű Szerepkör Hierarchia

```
┌─────────────────────────────────────────────────────────────────┐
│                  RBAC SZEREPKÖR HIERARCHIA                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Szint 1: SUPER_ADMIN                                           │
│  ├─ Teljes rendszer hozzáférés                                  │
│  ├─ Minden tenant kezelése                                      │
│  └─ Rendszer konfiguráció                                       │
│                                                                 │
│  Szint 2: TENANT_ADMIN                                          │
│  ├─ Franchise partner admin                                     │
│  ├─ Saját tenant teljes kezelése                                │
│  └─ Felhasználók kezelése                                       │
│                                                                 │
│  Szint 3: BRANCH_MANAGER                                        │
│  ├─ Telephely vezető                                            │
│  ├─ Teljes üzleti műveletek                                     │
│  └─ Riportok, statisztikák                                      │
│                                                                 │
│  Szint 4: SENIOR_OPERATOR                                       │
│  ├─ Tapasztalt kezelő                                           │
│  ├─ Speciális műveletek (pl. késés kezelés)                     │
│  └─ Árajánlat készítés                                          │
│                                                                 │
│  Szint 5: OPERATOR                                              │
│  ├─ Normál kezelő                                               │
│  ├─ Alapvető műveletek                                          │
│  └─ Bérlés, értékesítés                                         │
│                                                                 │
│  Szint 6: VIEWER                                                │
│  ├─ Csak olvasás                                                │
│  ├─ Lekérdezések                                                │
│  └─ Riportok megtekintése                                       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Jogosultsági Területek

| Terület | SUPER | TENANT | BRANCH | SENIOR | OPERATOR | VIEWER |
|---------|-------|--------|--------|--------|----------|--------|
| Számlázás | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Bevételezés | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Szerviz kezelés | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Bérlés | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Készletmozgás | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Pénzügyi funkciók | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Törzsadatok módosítás | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Lekérdezések | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| "Céges használat" levétel | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Riportok exportálása | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |

---

## Ismert Problémák

```
┌────────────────────────────────────────────────────────────────┐
│  ⚠️ ISMERT PROBLÉMÁK                                           │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  1. "Céges használatra" tétel levétele                         │
│     └─ Nincs egyértelmű nyomkövetés                            │
│     └─ Ki, mikor, mit vett le?                                 │
│                                                                │
│  2. Jogosultság tisztázatlansága                               │
│     └─ "Ki mit csinálhat?" - nem mindig egyértelmű             │
│     └─ Átfogó tervezés szükséges                               │
│                                                                │
│  3. Sok beállítási lehetőség                                   │
│     └─ Komplex jogosultsági mátrix                             │
│     └─ Dokumentáció szükséges                                  │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

---

## Vonalkód Nyomtatás

### Hozzáférés

```
Menüpont: Törzsadatok → Vonalkód
```

### Eszköz

```
Nyomtató: Zebra címkenyomtató
```

### Használat

```
┌─────────────────────────────────────────────────────────────────┐
│                  VONALKÓD NYOMTATÁS                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Lépések:                                                       │
│                                                                 │
│  1. Cikkszám beírása                                            │
│     └─ Meglévő cikkszám kiválasztása                            │
│                                                                 │
│  2. Darabszám megadása                                          │
│     └─ Hány címke szükséges                                     │
│                                                                 │
│  3. Nyomtatás                                                   │
│     └─ Zebra nyomtató outputra küld                             │
│                                                                 │
│  Címke tartalma:                                                │
│  • Cikkszám (vonalkód formátumban)                              │
│  • Megnevezés                                                   │
│  • Ár (opcionális)                                              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Fejlesztési Javaslat

```
┌────────────────────────────────────────────────────────────────┐
│  💡 FEJLESZTÉSI JAVASLAT                                       │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Személyi igazolvány / Lakcímkártya vonalkód beolvasása        │
│  mobil olvasóval → Automatikus ügyfél felvétel                 │
│                                                                │
│  Előnyök:                                                      │
│  • Csak email + telefon kézi bevitel                           │
│  • "Hihetetlenül gyorsítaná a folyamatot"                      │
│  • Kevesebb hibalehetőség                                      │
│                                                                │
│  ⚠️ KÉRDÉS: GDPR megfelelőség?                                 │
│  └─ További vizsgálat szükséges!                               │
│  └─ Adatvédelmi tisztviselő bevonása                           │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

---

## Lekérdezések

```
┌────────────────────────────────────────────────────────────────┐
│  📊 LEKÉRDEZÉSEK                                               │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  "Mindent le lehet kérdezni - egy cikkre az egész folyamatot,  │
│  ki mit csinált, minden. Így szoktunk nyomozgatni, amikor      │
│  gyűjtögetjük a dolgokat."                                     │
│                                                                │
│  Elérhető lekérdezések:                                        │
│  • Cikk története                                              │
│  • Felhasználói tevékenység                                    │
│  • Partner előzmények                                          │
│  • Bérlési statisztikák                                        │
│  • Készletmozgások                                             │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

---

## Jelmagyarázat

| Szín | Jelentés |
|------|----------|
| Kék (#e3f2fd) | Felhasználó kezelés |
| Lila (#f3e5f5) | Jogosultságok |
| Narancssárga (#fbe9e7) | Figyelmeztetés/Probléma |
| Zöld (#c8e6c9) | Vonalkód nyomtatás |
| Világoskék (#e1f5fe) | Fejlesztési javaslat |
| Barna (#efebe9) | Lekérdezések |

---

## Kapcsolódó Dokumentumok

- [01-ugyfelfelvitel-erd.md](01-ugyfelfelvitel-erd.md) - Felhasználó entitás
- [06-egyeb-rendeles.md](06-egyeb-rendeles.md) - Megrendelés folyamat
- [04-szerviz-folyamat.md](04-szerviz-folyamat.md) - Szerviz jogosultságok
