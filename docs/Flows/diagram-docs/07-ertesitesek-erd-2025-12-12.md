# 7. Értesítések ERD v3.0

## Diagram Alapinformációk

| Tulajdonság | Érték |
|-------------|-------|
| **Fájlnév** | `07-ertesitesek-erd-2025-12-12.excalidraw` |
| **Típus** | ERD (Entity-Relationship Diagram) |
| **Modul** | Értesítések |
| **Verzió** | v3.0 |
| **Dátum** | 2025-12-12 |
| **Státusz** | MÓDOSÍTOTT |
| **Forrás** | fit-gap-analysis-2025-12-12.md |

---

## Részletes Leírás

Ez az ERD diagram az **értesítési rendszer** bővítését mutatja be a **PWA Push értesítések** támogatásához. Új entitás a `PUSH_SUBSCRIPTION` és módosul az `ÉRTESÍTÉS` valamint az `ÉRTESÍTÉS_BEÁLLÍTÁS` entitás.

---

## Módosított Entitás: ÉRTESÍTÉS

```
┌─────────────────────────────────────────────────────────────┐
│                   ÉRTESÍTÉS (bővített) 🔄                   │
├─────────────────────────────────────────────────────────────┤
│ PK  ertesites_id       INT           Egyedi azonosító       │
│     tenant_id          UUID          Multi-tenant azonosító │
│ FK  felhasznalo_id     INT           → FELHASZNÁLÓ          │
├─────────────────────────────────────────────────────────────┤
│     tipus              ENUM          Értesítés típusa       │
│                        (BERLES_LEJAR/SZAMLA/stb.)           │
├─────────────────────────────────────────────────────────────┤
│ 🔄  csatorna           ENUM          Küldési csatorna       │
│                        (sms/email/push) ◄── BŐVÍTVE!        │
├─────────────────────────────────────────────────────────────┤
│     targy              VARCHAR       Értesítés tárgya       │
│     tartalom           TEXT          Üzenet szövege         │
│     statusz            ENUM          Küldési állapot        │
│                        (varakozik/kuldve/sikertelen)        │
│     kuldesi_datum      DATETIME      Tényleges küldés       │
│     hiba_uzenet        TEXT          Hiba esetén részletek  │
│     created_at         DATETIME      Létrehozás időpontja   │
└─────────────────────────────────────────────────────────────┘
```

### Csatorna ENUM Bővítés

| Érték | Leírás | Technológia |
|-------|--------|-------------|
| `sms` | SMS üzenet | SMS Gateway |
| `email` | E-mail üzenet | SMTP/SendGrid |
| `push` | PWA Push értesítés | FCM (Firebase) |

---

## Új Entitás: PUSH_SUBSCRIPTION

```
┌─────────────────────────────────────────────────────────────┐
│                   PUSH_SUBSCRIPTION 🆕                      │
├─────────────────────────────────────────────────────────────┤
│ PK  subscription_id    INT           Egyedi azonosító       │
│     tenant_id          UUID          Multi-tenant azonosító │
│ FK  felhasznalo_id     INT           → FELHASZNÁLÓ          │
├─────────────────────────────────────────────────────────────┤
│     endpoint           TEXT          Push szolgáltatás URL  │
│     p256dh_key         VARCHAR(200)  P-256 Diffie-Hellman   │
│     auth_key           VARCHAR(100)  Auth titkosító kulcs   │
├─────────────────────────────────────────────────────────────┤
│     user_agent         VARCHAR(500)  Böngésző/app info      │
│     eszkoz_tipus       ENUM          Eszköz típusa          │
│                        (desktop/mobile/tablet)              │
│     aktiv              BOOLEAN       Aktív feliratkozás     │
│     utolso_hasznalat   DATETIME      Utolsó sikeres push    │
│     letrehozva         DATETIME      Feliratkozás időpontja │
├─────────────────────────────────────────────────────────────┤
│ UNIQUE(felhasznalo_id, endpoint)                            │
└─────────────────────────────────────────────────────────────┘
```

### Mezők Részletezése

| Mező | Típus | Kötelező | Leírás |
|------|-------|----------|--------|
| `subscription_id` | INT | PK | Auto-increment azonosító |
| `tenant_id` | UUID | Igen | Franchise partner azonosító |
| `felhasznalo_id` | INT (FK) | Igen | Feliratkozott felhasználó |
| `endpoint` | TEXT | Igen | Push szolgáltatás URL (egyedi böngészőnként) |
| `p256dh_key` | VARCHAR(200) | Igen | Titkosításhoz szükséges publikus kulcs |
| `auth_key` | VARCHAR(100) | Igen | Auth kulcs a titkosításhoz |
| `user_agent` | VARCHAR(500) | Nem | Böngésző/eszköz azonosító |
| `eszkoz_tipus` | ENUM | Nem | desktop/mobile/tablet |
| `aktiv` | BOOLEAN | Igen | TRUE = aktív feliratkozás |
| `utolso_hasznalat` | DATETIME | Nem | Sikeres küldés időpontja |

---

## Módosított Entitás: ÉRTESÍTÉS_BEÁLLÍTÁS

```
┌─────────────────────────────────────────────────────────────┐
│              ÉRTESÍTÉS_BEÁLLÍTÁS (bővített)                 │
├─────────────────────────────────────────────────────────────┤
│ PK  beallitas_id       INT           Egyedi azonosító       │
│ FK  felhasznalo_id     INT           → FELHASZNÁLÓ          │
├─────────────────────────────────────────────────────────────┤
│     email_engedelyezett  BOOLEAN     E-mail engedélyezve    │
│     sms_engedelyezett    BOOLEAN     SMS engedélyezve       │
├─────────────────────────────────────────────────────────────┤
│ 🆕  push_engedelyezett   BOOLEAN     Push engedélyezve      │
│ 🆕  push_subscription_json JSONB     Feliratkozás adatok    │
├─────────────────────────────────────────────────────────────┤
│     ertesites_tipusok  JSONB         Mely típusokra kér     │
│                                      értesítést             │
└─────────────────────────────────────────────────────────────┘
```

### Új Mezők

| Mező | Típus | Leírás |
|------|-------|--------|
| `push_engedelyezett` | BOOLEAN | Felhasználó engedélyezte-e a push értesítéseket |
| `push_subscription_json` | JSONB | Gyors hozzáférés a subscription adatokhoz |

---

## Értesítés Típusok

```
┌─────────────────────────────────────────────────────────────┐
│                   ÉRTESÍTÉS TÍPUSOK                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  BERLES_LEJAR                                               │
│    Bérlés lejárat figyelmeztetés                           │
│    (1/3/7 nap előtte küldés)                               │
│                                                             │
│  SZAMLA_KESZULT                                            │
│    Új számla készült értesítés                             │
│    (PDF csatolva email esetén)                             │
│                                                             │
│  KESZLET_ALACSONY                                          │
│    Készlet figyelmeztetés                                  │
│    (minimális szint alatt)                                 │
│                                                             │
│  🆕 PAROSITAS_VARAKOZIK                                    │
│    Kézi párosítás szükséges                                │
│    (Bank/futár elszámoláshoz)                              │
│                                                             │
│  RENDSZER_UZENET                                            │
│    Általános rendszer értesítés                            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Kapcsolati Diagram

```
            ┌─────────────────────┐
            │    FELHASZNÁLÓ      │
            └──────────┬──────────┘
                       │ 1
           ┌───────────┼───────────┐
           │           │           │
           │ N         │ 1         │ N
  ┌────────▼────┐ ┌────▼────┐ ┌────▼────────────┐
  │  ÉRTESÍTÉS  │ │ÉRTESÍTÉS│ │PUSH_SUBSCRIPTION│
  │  (csatorna: │ │BEÁLLÍTÁS│ │    (endpoint,   │
  │  sms/email/ │ │  (push_ │ │    p256dh,      │
  │   push)     │ │engedly.)│ │    auth_key)    │
  └─────────────┘ └─────────┘ └─────────────────┘
```

### Kapcsolatok

| Kapcsolat | Típus | Leírás |
|-----------|-------|--------|
| FELHASZNÁLÓ → ÉRTESÍTÉS | 1:N | Egy felhasználónak több értesítése |
| FELHASZNÁLÓ → ÉRTESÍTÉS_BEÁLLÍTÁS | 1:1 | Egy beállítás rekordonként |
| FELHASZNÁLÓ → PUSH_SUBSCRIPTION | 1:N | Több eszközön feliratkozhat |

---

## Firebase Cloud Messaging Konfiguráció

```
┌─────────────────────────────────────────────────────────────┐
│               FIREBASE CLOUD MESSAGING                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Konfiguráció (.env):                                       │
│    FCM_PROJECT_ID=kgc-erp-prod                             │
│    FCM_PRIVATE_KEY=*** (titkos)                            │
│    FCM_CLIENT_EMAIL=fcm@...                                │
│                                                             │
│  VAPID kulcsok:                                             │
│    VAPID_PUBLIC_KEY=B...                                   │
│    VAPID_PRIVATE_KEY=***                                   │
│                                                             │
│  Service Worker:                                            │
│    self.registration                                        │
│      .showNotification(title, opts)                        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Push Küldés SQL + Node.js

```javascript
// Push értesítés küldése
const webpush = require('web-push');

webpush.setVapidDetails(
  'mailto:support@kgc.hu',
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

async function sendPush(subscriptionId, payload) {
  const subscription = await db.query(`
    SELECT endpoint, p256dh_key, auth_key
    FROM PUSH_SUBSCRIPTION
    WHERE subscription_id = $1 AND aktiv = TRUE
  `, [subscriptionId]);

  const pushSubscription = {
    endpoint: subscription.endpoint,
    keys: {
      p256dh: subscription.p256dh_key,
      auth: subscription.auth_key
    }
  };

  await webpush.sendNotification(pushSubscription, JSON.stringify(payload));

  // Utolsó használat frissítése
  await db.query(`
    UPDATE PUSH_SUBSCRIPTION
    SET utolso_hasznalat = NOW()
    WHERE subscription_id = $1
  `, [subscriptionId]);
}
```

---

## Változások Összefoglalója

| Entitás | Változás | Leírás |
|---------|----------|--------|
| ÉRTESÍTÉS | csatorna ENUM | + `push` érték |
| ÉRTESÍTÉS | tipus ENUM | + `PAROSITAS_VARAKOZIK` |
| ÉRTESÍTÉS_BEÁLLÍTÁS | + push_engedelyezett | Push engedély mező |
| ÉRTESÍTÉS_BEÁLLÍTÁS | + push_subscription_json | Gyors elérés |
| PUSH_SUBSCRIPTION | ÚJ ENTITÁS | Teljes push feliratkozás kezelés |

---

## Jelmagyarázat

| Szimbólum | Jelentés |
|-----------|----------|
| 🔄 | Módosított entitás/mező |
| 🆕 | Új entitás/mező |
| PK | Primary Key |
| FK | Foreign Key |

---

## Kapcsolódó Dokumentumok

- [07-ertesitesek-folyamat-2025-12-12.md](07-ertesitesek-folyamat-2025-12-12.md) - Értesítés küldési folyamat
- [07-ertesitesek-folyamat.md](07-ertesitesek-folyamat.md) - Eredeti értesítési folyamat
- [fit-gap-analysis-2025-12-12.md](../fit-gap-analysis-2025-12-12.md) - Követelmény forrás
