# Automatikus Értesítések Folyamat

## Diagram Információk

| Tulajdonság | Érték |
|-------------|-------|
| **Fájlnév** | 7-ertesitesek-folyamat.excalidraw |
| **Típus** | Folyamatábra (Flowchart) |
| **Kategória** | 7. Új Funkciók |
| **Modul** | Értesítési Rendszer |
| **Verzió** | KGC ERP v2 |

---

## Áttekintés

Az automatikus értesítési rendszer biztosítja az ügyfelek proaktív tájékoztatását különböző üzleti eseményekről. A rendszer SMS és Email csatornákon keresztül működik, offline támogatással.

---

## Folyamat Lépései

### 1. Esemény Trigger (Kiváltó Események)

```
┌─────────────────────────────────────────────────────────────────┐
│                      ESEMÉNY TRIGGER                             │
├─────────────────────────────────────────────────────────────────┤
│  • Bevételezés történt (rendelés beérkezett)                    │
│  • Bérlés lejárati dátum közeleg                                │
│  • Bérlés lejárt (késésben)                                     │
│  • Számla fizetési határidő lejárt                              │
└─────────────────────────────────────────────────────────────────┘
```

### 2. Esemény Típusok Részletesen

#### 2.1 Rendelés Beérkezett
| Mező | Érték |
|------|-------|
| **Kiváltó** | Bevételezés véglegesítése |
| **Cél** | Ügyfél értesítése, hogy átvehető |
| **Prioritás** | Közepes |
| **Csatorna** | Email preferált |

#### 2.2 Bérlés Lejárat Előtt
| Mező | Érték |
|------|-------|
| **Kiváltó** | Automatikus ütemező (1 nap előtte) |
| **Cél** | Emlékeztetés visszahozatalra/hosszabbításra |
| **Prioritás** | Magas |
| **Csatorna** | SMS preferált |

#### 2.3 Bérlés Lejárt (Késésben)
| Mező | Érték |
|------|-------|
| **Kiváltó** | Lejárati dátum túllépése |
| **Cél** | Sürgős visszahozatal kérése |
| **Prioritás** | Kritikus |
| **Csatorna** | SMS + Email |

#### 2.4 Fizetési Emlékeztető
| Mező | Érték |
|------|-------|
| **Kiváltó** | Számla fizetési határidő lejárt |
| **Cél** | Fizetésre felszólítás |
| **Prioritás** | Magas |
| **Csatorna** | Email preferált |

---

## Döntési Pontok

### D1: Esemény Típusa
```
                    ┌─────────────┐
                    │  Esemény    │
                    │  típusa?    │
                    └──────┬──────┘
           ┌───────────────┼───────────────┬───────────────┐
           ▼               ▼               ▼               ▼
    ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
    │ Rendelés │    │ Lejárat  │    │ Késés    │    │ Fizetés  │
    │beérkezett│    │ előtt    │    │          │    │emlékeztet│
    └──────────┘    └──────────┘    └──────────┘    └──────────┘
```

### D2: Van Email/Telefon?
```
    ┌─────────────────────┐
    │ Van email vagy      │
    │ telefonszám?        │
    └──────────┬──────────┘
               │
       ┌───────┴───────┐
       │               │
       ▼               ▼
     IGEN            NEM
       │               │
       ▼               ▼
  Folytatás      Ügyintéző
                 értesítése
```

### D3: Preferált Csatorna
```
    ┌─────────────────────┐
    │ Ügyfél preferált    │
    │ csatornája?         │
    └──────────┬──────────┘
               │
       ┌───────┴───────┐
       │               │
       ▼               ▼
      SMS           EMAIL
       │               │
       ▼               ▼
   Twilio/        SendGrid/
   Nexmo          SMTP
```

---

## Üzenet Sablonok

### Rendelés Beérkezett
```
Kedves {név}!

Az Ön által rendelt {termék} megérkezett.
Átvehető: {bolt_cím}

Nyitvatartás: H-P 7-16, Szo 7-11

Üdvözlettel,
KisGépCentrum
```

### Bérlés Lejárat Előtt (1 nap)
```
Kedves {név}!

A(z) {gép} bérlése HOLNAP lejár ({dátum}).

Kérjük hozza vissza, vagy hosszabbítson:
Tel: {telefon}

KisGépCentrum
```

### Bérlés Lejárt (Késésben)
```
Kedves {név}!

A(z) {gép} bérlése LEJÁRT!
Késedelmi díj: {díj} Ft/nap

Kérjük MIELŐBB hozza vissza a gépet!
Tel: {telefon}

KisGépCentrum
```

### Fizetési Emlékeztető
```
{cég} részére

{összeg} Ft összegű számla fizetési
határideje LEJÁRT!

Számla szám: {szamla_szam}
Lejárat: {datum}

Kérjük mielőbbi rendezését!
```

---

## Technikai Megvalósítás

### Csatorna Integráció

| Csatorna | Provider | API |
|----------|----------|-----|
| **SMS** | Twilio / Nexmo | REST API |
| **Email** | SendGrid / SMTP | SMTP / API |

### Offline Működés (ADR-002)

```
┌─────────────────────────────────────────────────────────────────┐
│                    OFFLINE MÓD                                   │
├─────────────────────────────────────────────────────────────────┤
│  1. Értesítés létrehozása → "pending" státusz                   │
│  2. Tárolás: IndexedDB queue-ban                                │
│  3. Online visszatéréskor → automatikus küldés                  │
│  4. Státusz frissítés: "küldött" / "kézbesített" / "hiba"      │
└─────────────────────────────────────────────────────────────────┘
```

---

## ÉRTESÍTÉS Entitás

```sql
CREATE TABLE ertesites (
    ertesites_id    SERIAL PRIMARY KEY,
    tenant_id       UUID NOT NULL,           -- ADR-001 multi-tenant
    tipus           VARCHAR(50) NOT NULL,    -- rendeles/lejarat/keses/fizetes
    ugyfél_id       INTEGER REFERENCES partner(partner_id),
    csatorna        VARCHAR(20) NOT NULL,    -- sms/email
    tartalom        TEXT NOT NULL,
    kuldve          TIMESTAMP,
    statusz         VARCHAR(30) NOT NULL,    -- pending/küldött/kézbesített/hiba
    hiba_uzenet     TEXT,
    offline_sync    BOOLEAN DEFAULT FALSE,   -- ADR-002
    created_at      TIMESTAMP DEFAULT NOW(),
    updated_at      TIMESTAMP DEFAULT NOW()
);
```

### Státusz Értékek

| Státusz | Leírás |
|---------|--------|
| `pending` | Várakozik küldésre (offline is) |
| `küldött` | Sikeresen elküldve |
| `kézbesített` | Provider visszajelzés: kézbesítve |
| `hiba` | Sikertelen küldés |

---

## Folyamatábra ASCII

```
                              ┌─────────┐
                              │ Kezdet  │
                              └────┬────┘
                                   │
                                   ▼
                         ┌─────────────────┐
                         │ Esemény Trigger │
                         │ (bev/lejárat/   │
                         │  késés/fizetés) │
                         └────────┬────────┘
                                  │
                                  ▼
                           ┌──────────────┐
                           │   Esemény    │
                           │   típusa?    │
                           └──────┬───────┘
          ┌──────────┬───────────┼───────────┬──────────┐
          ▼          ▼           ▼           ▼          │
    ┌──────────┐┌──────────┐┌──────────┐┌──────────┐   │
    │ Rendelés ││ Lejárat  ││  Késés   ││ Fizetés  │   │
    │beérkezett││  előtt   ││          ││emlékeztet│   │
    └────┬─────┘└────┬─────┘└────┬─────┘└────┬─────┘   │
         │           │           │           │          │
         └───────────┴─────┬─────┴───────────┘          │
                           │                            │
                           ▼                            │
                  ┌─────────────────┐                   │
                  │ Ügyfél adatok   │                   │
                  │ lekérdezése     │                   │
                  └────────┬────────┘                   │
                           │                            │
                           ▼                            │
                    ┌─────────────┐                     │
                    │ Van email/  │                     │
                    │ telefon?    │                     │
                    └──────┬──────┘                     │
                   ┌───────┴───────┐                    │
                   │               │                    │
                  IGEN            NEM                   │
                   │               │                    │
                   ▼               ▼                    │
            ┌──────────┐   ┌──────────────┐            │
            │ Preferált│   │ Ügyintéző    │            │
            │ csatorna?│   │ értesítése   │            │
            └────┬─────┘   └──────────────┘            │
            ┌────┴────┐                                 │
            │         │                                 │
           SMS      EMAIL                               │
            │         │                                 │
            ▼         ▼                                 │
       ┌────────┐ ┌────────┐                           │
       │ Twilio │ │SendGrid│                           │
       │ küldés │ │ küldés │                           │
       └───┬────┘ └───┬────┘                           │
           │          │                                 │
           └────┬─────┘                                 │
                │                                       │
                ▼                                       │
        ┌───────────────┐                              │
        │ Naplózás      │                              │
        │ (DB + audit)  │                              │
        └───────┬───────┘                              │
                │                                       │
                ▼                                       │
           ┌─────────┐                                 │
           │  Vége   │                                 │
           └─────────┘                                 │
```

---

## Üzleti Szabályok

1. **Ügyfél preferencia tiszteletben tartása** - Ha van beállított preferált csatorna, azt használjuk
2. **Fallback logika** - Ha SMS nem elérhető, Email-re váltás
3. **Rate limiting** - Egy ügyfélnek max 3 értesítés/nap
4. **Quiet hours** - Éjszaka (22:00-07:00) nem küldünk SMS-t
5. **Opt-out** - Ügyfél leiratkozhat az értesítésekről
6. **Audit** - Minden küldés naplózásra kerül

---

## Kapcsolódó Dokumentumok

- [07-erd-uj-entitasok.md](07-erd-uj-entitasok.md) - ÉRTESÍTÉS entitás
- [07-fizetesi-fegyelem.md](07-fizetesi-fegyelem.md) - Fizetési emlékeztetők kontextus
- [01-ugyfelfelvitel-erd.md](01-ugyfelfelvitel-erd.md) - PARTNER entitás (FK)

---

## Jelmagyarázat

| Szimbólum | Jelentés |
|-----------|----------|
| `○` | Kezdet/Vége |
| `□` | Folyamat lépés |
| `◇` | Döntési pont |
| `→` | Folyamat irány |
| `📦` | Rendelés beérkezett |
| `⏰` | Lejárat előtt |
| `🚨` | Késésben |
| `💳` | Fizetési emlékeztető |
| `📱` | SMS csatorna |
| `📧` | Email csatorna |
