# 7. Értesítések Folyamat (Push Bővítés)

## Diagram Alapinformációk

| Tulajdonság | Érték |
|-------------|-------|
| **Fájlnév** | `7-ertesitesek-folyamat-2025-12-12.excalidraw` |
| **Típus** | Folyamatábra (Flowchart) |
| **Modul** | Értesítési Rendszer |
| **Verzió** | v3.0 |
| **Dátum** | 2025-12-12 |
| **Státusz** | FRISSÍTVE |
| **Forrás** | fit-gap-analysis-2025-12-12.md |

---

## Változások a v2.0-hoz képest

| Változás | Leírás |
|----------|--------|
| **ÚJ** | PWA Push Notification csatorna |
| **ÚJ** | Firebase Cloud Messaging integráció |
| **ÚJ** | Push subscription kezelés |
| **MÓDOSÍTVA** | D3 döntési pont: +Push opció |
| **MÓDOSÍTVA** | ÉRTESÍTÉS entitás: csatorna bővítés |

---

## Értesítési Csatornák (v3.0)

```
┌─────────────────────────────────────────────────────────────────────┐
│                    ÉRTESÍTÉSI CSATORNÁK v3.0                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  1. SMS                                                             │
│     └─ Provider: Twilio / Nexmo                                    │
│     └─ Használat: Sürgős értesítések, lejárat, késés               │
│                                                                     │
│  2. EMAIL                                                           │
│     └─ Provider: SendGrid / SMTP                                   │
│     └─ Használat: Rendelés, számla, részletes info                 │
│                                                                     │
│  3. PUSH (ÚJ!)                                                     │
│     └─ Provider: Firebase Cloud Messaging (FCM)                    │
│     └─ Használat: PWA app értesítések, real-time                   │
│     └─ Előny: Ingyenes, azonnali, interaktív                       │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Csatorna Összehasonlítás

| Tulajdonság | SMS | Email | Push |
|-------------|-----|-------|------|
| **Költség** | ~15 Ft/db | ~0.5 Ft/db | Ingyenes |
| **Sebesség** | Azonnali | 1-5 perc | Azonnali |
| **Kézbesítés** | 98% | 85% | 95%* |
| **Interaktív** | Nem | Link | Igen |
| **Offline** | Igen | Igen | Nem** |
| **Preferált** | Sürgős | Részletes | Gyors |

*Ha a PWA telepítve van
**Várólistára kerül

---

## Push Notification Architektúra

```
┌─────────────────────────────────────────────────────────────────────┐
│                    PUSH NOTIFICATION FLOW                           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────┐      ┌─────────┐      ┌─────────┐      ┌─────────┐   │
│  │  KGC    │      │  FCM    │      │  PWA    │      │ Ügyfél  │   │
│  │ Server  │─────>│ Server  │─────>│  App    │─────>│ Eszköz  │   │
│  └─────────┘      └─────────┘      └─────────┘      └─────────┘   │
│       │                │                │                │         │
│       │  1. Push küldés│                │                │         │
│       │  (FCM token)   │                │                │         │
│       │                │  2. FCM push   │                │         │
│       │                │  üzenet        │                │         │
│       │                │                │  3. Service    │         │
│       │                │                │  Worker fogad  │         │
│       │                │                │                │  4.     │
│       │                │                │                │  Notif. │
│       │                │                │                │  megj.  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Technikai Komponensek

| Komponens | Leírás |
|-----------|--------|
| **FCM Server Key** | Firebase projekt API kulcs (szerver oldal) |
| **FCM Token** | Eszköz egyedi azonosító (felhasználónként) |
| **Service Worker** | PWA háttér script push fogadáshoz |
| **Push Subscription** | Felhasználó feliratkozás objektum |

---

## ÉRTESÍTÉS Entitás (Módosítva)

```sql
CREATE TABLE ertesites (
    ertesites_id    SERIAL PRIMARY KEY,
    tenant_id       UUID NOT NULL,
    tipus           VARCHAR(50) NOT NULL,    -- rendeles/lejarat/keses/fizetes
    ugyfel_id       INTEGER REFERENCES partner(partner_id),

    -- Csatorna (BŐVÍTVE!)
    csatorna        VARCHAR(20) NOT NULL,    -- sms/email/push  ← ÚJ: push

    tartalom        TEXT NOT NULL,
    cim             VARCHAR(200),            -- ÚJ: Push notification címe

    kuldve          TIMESTAMP,
    statusz         VARCHAR(30) NOT NULL,    -- pending/küldött/kézbesített/hiba
    hiba_uzenet     TEXT,

    -- Push specifikus mezők (ÚJ!)
    push_token      VARCHAR(500),            -- FCM device token
    push_data       JSONB,                   -- Extra adatok (action buttons)
    push_clicked    BOOLEAN DEFAULT FALSE,   -- Rákattintott-e
    push_click_time TIMESTAMP,               -- Mikor kattintott

    offline_sync    BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMP DEFAULT NOW(),
    updated_at      TIMESTAMP DEFAULT NOW()
);
```

### Új Mezők

| Mező | Típus | Leírás |
|------|-------|--------|
| `cim` | VARCHAR(200) | Push notification címe (title) |
| `push_token` | VARCHAR(500) | Eszköz FCM token |
| `push_data` | JSONB | Extra payload (gombok, URL) |
| `push_clicked` | BOOLEAN | Engagement tracking |
| `push_click_time` | TIMESTAMP | Kattintás időpontja |

---

## Új Entitás: PUSH_SUBSCRIPTION

Felhasználók push feliratkozásainak kezelése.

```sql
CREATE TABLE push_subscription (
    subscription_id  SERIAL PRIMARY KEY,
    tenant_id        UUID NOT NULL,
    felhasznalo_id   INTEGER REFERENCES felhasznalo(felhasznalo_id),
    partner_id       INTEGER REFERENCES partner(partner_id),

    -- FCM adatok
    fcm_token        VARCHAR(500) NOT NULL UNIQUE,
    endpoint         TEXT,                    -- Web Push endpoint
    p256dh_key       TEXT,                    -- Encryption key
    auth_key         TEXT,                    -- Auth key

    -- Eszköz info
    eszkoz_tipus     VARCHAR(50),             -- mobile/desktop/tablet
    bongeszo         VARCHAR(100),            -- Chrome/Firefox/Safari
    os               VARCHAR(50),             -- Android/iOS/Windows

    -- Státusz
    aktiv            BOOLEAN DEFAULT TRUE,
    utolso_hasznalat TIMESTAMP,
    letrehozva       TIMESTAMP DEFAULT NOW(),

    CONSTRAINT fk_user_or_partner CHECK (
        (felhasznalo_id IS NOT NULL AND partner_id IS NULL) OR
        (felhasznalo_id IS NULL AND partner_id IS NOT NULL)
    )
);
```

---

## Módosított Döntési Fa (D3)

```
                    ┌─────────────────────┐
                    │ D3: Preferált       │
                    │ csatorna?           │
                    └──────────┬──────────┘
                               │
               ┌───────────────┼───────────────┐
               │               │               │
              SMS           EMAIL           PUSH (ÚJ!)
               │               │               │
               ▼               ▼               ▼
          ┌────────┐     ┌────────┐     ┌────────┐
          │ Twilio │     │SendGrid│     │  FCM   │
          │ küldés │     │ küldés │     │ küldés │
          └───┬────┘     └───┬────┘     └───┬────┘
              │              │              │
              │              │              │
              └──────────────┼──────────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │    Naplózás     │
                    │  (DB + audit)   │
                    └─────────────────┘
```

---

## Push Notification Típusok

### 1. Rendelés Beérkezett

```json
{
  "title": "Rendelés beérkezett! 📦",
  "body": "Az Ön által rendelt Makita fúró megérkezett.",
  "icon": "/icons/order-192.png",
  "badge": "/icons/badge-72.png",
  "data": {
    "tipus": "rendeles",
    "rendeles_id": 12345,
    "url": "/rendeles/12345"
  },
  "actions": [
    { "action": "view", "title": "Megtekintés" },
    { "action": "directions", "title": "Útvonal" }
  ]
}
```

### 2. Bérlés Lejár (1 nap)

```json
{
  "title": "Bérlés holnap lejár! ⏰",
  "body": "A Makita DDF481 bérlése 2024-12-13-án lejár.",
  "icon": "/icons/warning-192.png",
  "badge": "/icons/badge-72.png",
  "tag": "berles-lejarat-12345",
  "requireInteraction": true,
  "data": {
    "tipus": "lejarat",
    "berles_id": 12345,
    "url": "/berles/12345"
  },
  "actions": [
    { "action": "extend", "title": "Hosszabbítás" },
    { "action": "call", "title": "Hívás" }
  ]
}
```

### 3. Bérlés Lejárt (Késés)

```json
{
  "title": "🚨 BÉRLÉS LEJÁRT!",
  "body": "Késedelmi díj: 5.000 Ft/nap. Kérjük hozza vissza!",
  "icon": "/icons/alert-192.png",
  "badge": "/icons/badge-72.png",
  "tag": "berles-keses-12345",
  "requireInteraction": true,
  "vibrate": [200, 100, 200],
  "data": {
    "tipus": "keses",
    "berles_id": 12345,
    "kesedelmi_dij": 5000,
    "url": "/berles/12345"
  },
  "actions": [
    { "action": "call", "title": "Hívás azonnal" }
  ]
}
```

### 4. Fizetési Emlékeztető

```json
{
  "title": "Fizetési emlékeztető 💳",
  "body": "45.000 Ft tartozás - KGC-2024-00123",
  "icon": "/icons/payment-192.png",
  "badge": "/icons/badge-72.png",
  "data": {
    "tipus": "fizetes",
    "szamla_id": 123,
    "osszeg": 45000,
    "url": "/szamla/123"
  },
  "actions": [
    { "action": "pay", "title": "Fizetés" },
    { "action": "details", "title": "Részletek" }
  ]
}
```

---

## Service Worker Implementáció

```javascript
// service-worker.js

// Push esemény kezelése
self.addEventListener('push', function(event) {
    const data = event.data.json();

    const options = {
        body: data.body,
        icon: data.icon || '/icons/default-192.png',
        badge: data.badge || '/icons/badge-72.png',
        tag: data.tag,
        requireInteraction: data.requireInteraction || false,
        vibrate: data.vibrate,
        data: data.data,
        actions: data.actions || []
    };

    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});

// Notification kattintás kezelése
self.addEventListener('notificationclick', function(event) {
    event.notification.close();

    const action = event.action;
    const data = event.notification.data;

    // Kattintás naplózása
    fetch('/api/push/clicked', {
        method: 'POST',
        body: JSON.stringify({
            ertesites_id: data.ertesites_id,
            action: action
        })
    });

    // Action kezelés
    if (action === 'view' || action === 'details') {
        event.waitUntil(clients.openWindow(data.url));
    } else if (action === 'call') {
        event.waitUntil(clients.openWindow('tel:+3612345678'));
    } else if (action === 'extend') {
        event.waitUntil(clients.openWindow(data.url + '/hosszabbitas'));
    } else {
        // Default: megnyitás
        event.waitUntil(clients.openWindow(data.url || '/'));
    }
});
```

---

## Feliratkozás Kezelés (PWA)

```javascript
// Push subscription kezelése a PWA-ban

async function subscribeToPush() {
    // Service Worker regisztráció
    const registration = await navigator.serviceWorker.ready;

    // Push subscription
    const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
    });

    // Küldés a szerverre
    await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            subscription: subscription,
            eszkoz_tipus: detectDeviceType(),
            bongeszo: detectBrowser()
        })
    });

    console.log('Push subscription successful');
}

async function unsubscribeFromPush() {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
        await subscription.unsubscribe();
        await fetch('/api/push/unsubscribe', {
            method: 'POST',
            body: JSON.stringify({ endpoint: subscription.endpoint })
        });
    }
}
```

---

## Üzleti Szabályok (Frissítve)

1. **Csatorna preferencia:** Push > Email > SMS (költség alapján)
2. **Fallback logika:** Ha Push nem elérhető → Email → SMS
3. **Rate limiting:** Max 5 push/nap/felhasználó
4. **Quiet hours:** 22:00-07:00 között nincs push (kivéve kritikus)
5. **Opt-out:** Felhasználó leiratkozhat push-ról külön
6. **Engagement tracking:** Push kattintások naplózása
7. **Token refresh:** FCM token frissítés kezelése

---

## Kapcsolódó Dokumentumok

- [07-ertesitesek-folyamat.md](07-ertesitesek-folyamat.md) - Eredeti v2.0
- [07-erd-uj-entitasok.md](07-erd-uj-entitasok.md) - ÉRTESÍTÉS entitás
- [fit-gap-analysis-2025-12-12.md](../fit-gap-analysis-2025-12-12.md) - Követelmény forrás
