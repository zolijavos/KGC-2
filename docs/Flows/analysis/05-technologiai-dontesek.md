# Technológiai Döntések Elemzése

## KGC ERP Infrastruktúra és Architektúra

---

## 1. Fő Döntési Pontok

### 1.1 Infrastruktúra: Felhő vs. Hibrid vs. On-Premise

```
┌─────────────────────────────────────────────────────────────────┐
│                    INFRASTRUKTÚRA OPCIÓK                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  OPCIÓ A: TISZTÁN FELHŐ                                         │
│  ┌────────────────────────────────────────────┐                 │
│  │  ☁️ AWS / Google Cloud / Azure              │                 │
│  │  • Minden adat a felhőben                  │                 │
│  │  • Internet KÖTELEZŐ a működéshez          │                 │
│  │  • Nincs helyi szerver                     │                 │
│  └────────────────────────────────────────────┘                 │
│                                                                  │
│  OPCIÓ B: HIBRID (JAVASOLT)                                     │
│  ┌────────────────────────────────────────────┐                 │
│  │  ☁️ Felhő + 📱 PWA Offline                  │                 │
│  │  • Fő adatok felhőben                      │                 │
│  │  • Kritikus funkciók offline is működnek   │                 │
│  │  • Szinkronizálás internettel              │                 │
│  └────────────────────────────────────────────┘                 │
│                                                                  │
│  OPCIÓ C: ON-PREMISE (lokális szerver)                          │
│  ┌────────────────────────────────────────────┐                 │
│  │  🖥️ Saját szerver minden telephelyen        │                 │
│  │  • Minden adat helyben                     │                 │
│  │  • Internet NEM szükséges                  │                 │
│  │  • Magas karbantartási igény               │                 │
│  └────────────────────────────────────────────┘                 │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 Összehasonlító Táblázat

| Szempont | Felhő | Hibrid | On-Premise |
|----------|-------|--------|------------|
| **Internet nélküli működés** | ❌ Nem | ✅ Részleges | ✅ Teljes |
| **Karbantartás** | ✅ Minimális | ⚠️ Közepes | ❌ Magas |
| **Skálázhatóság** | ✅ Kiváló | ✅ Jó | ❌ Korlátozott |
| **Kezdeti költség** | ✅ Alacsony | ⚠️ Közepes | ❌ Magas |
| **Üzemeltetési költség** | ⚠️ Folyamatos | ⚠️ Közepes | ✅ Alacsony* |
| **Adatbiztonság** | ✅ Jó | ✅ Jó | ⚠️ Függ a megvalósítástól |
| **Franchise támogatás** | ✅ Kiváló | ✅ Jó | ❌ Bonyolult |
| **Multi-tenant** | ✅ Natív | ✅ Megoldható | ❌ Nehézkes |

*Ha van IT kompetencia

---

## 2. Offline Működés Kérdése

### 2.1 Jelenlegi Helyzet

A megbeszélésen elhangzott:
> "Működik internet nélkül is a rendszer?" → "Igen, működik, mert a szerverről fut."

### 2.2 Offline Követelmények Elemzése

```
┌─────────────────────────────────────────────────────────────────┐
│                    OFFLINE SZCENÁRIÓK                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. Internet kiesés (átmeneti)                                  │
│     • Valószínűség: Közepes (havi 1-2x előfordulhat)           │
│     • Időtartam: Általában percek-órák                         │
│     • Kritikusság: KÖZEPES                                      │
│                                                                  │
│  2. Hosszú internet kiesés                                      │
│     • Valószínűség: Alacsony                                   │
│     • Időtartam: Napok                                         │
│     • Kritikusság: MAGAS (bevételkiesés)                       │
│                                                                  │
│  3. Terepi használat (nincs fix internet)                       │
│     • Valószínűség: Alacsony (fix telephely)                   │
│     • Kritikusság: ALACSONY                                     │
│                                                                  │
│  KONKLÚZIÓ: Hibrid megoldás elegendő                            │
│  → Kritikus funkciók offline, többi felhő                       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 2.3 Hibrid Megoldás (PWA Offline)

```
                    NORMÁL MŰKÖDÉS (Online)
                    ─────────────────────────
                         ┌─────────────┐
                         │   FELHŐ     │
                         │  (Master)   │
                         └──────┬──────┘
                                │
                    ┌───────────┴───────────┐
                    │                       │
                    ▼                       ▼
              ┌──────────┐           ┌──────────┐
              │ Telephely│           │ Telephely│
              │    A     │           │    B     │
              │  (PWA)   │           │  (PWA)   │
              └──────────┘           └──────────┘


                    OFFLINE MŰKÖDÉS
                    ────────────────
                         ┌─────────────┐
                         │   FELHŐ     │  ← Nem elérhető
                         │  (Master)   │
                         └──────┬──────┘
                                ✕
                    ┌───────────┴───────────┐
                    │                       │
                    ▼                       ▼
              ┌──────────┐           ┌──────────┐
              │ Telephely│           │ Telephely│
              │    A     │           │    B     │
              │ IndexedDB│           │ IndexedDB│
              │ (lokális)│           │ (lokális)│
              └──────────┘           └──────────┘
                    │                       │
                    └───────────┬───────────┘
                                │
                    SYNC amikor internet visszatér
```

### 2.4 Offline Támogatott Funkciók

| Funkció | Offline | Online | Megjegyzés |
|---------|---------|--------|------------|
| **Bérlés indítása** | ✅ | ✅ | Lokálisan rögzítve, sync később |
| **Visszavétel** | ✅ | ✅ | Lokálisan rögzítve |
| **Készlet lekérdezés** | ✅ | ✅ | Utolsó sync alapján |
| **Készlet módosítás** | ✅ | ✅ | Sync konfliktus kezelés |
| **Számlázás** | ⚠️ | ✅ | NAV miatt online kell |
| **E-számla fogadás** | ❌ | ✅ | Internet szükséges |
| **Riportok** | ⚠️ | ✅ | Korlátozott offline |
| **Partner keresés** | ✅ | ✅ | Lokális cache |

---

## 3. Multi-Tenant Architektúra

### 3.1 Franchise Támogatás

```
┌─────────────────────────────────────────────────────────────────┐
│                    MULTI-TENANT MODELL                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Egy adatbázis, elkülönített adatok (Row Level Security)        │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                    KÖZÖS ADATBÁZIS                       │    │
│  │  ┌──────────┬──────────┬──────────┬──────────┐          │    │
│  │  │ tenant_1 │ tenant_2 │ tenant_3 │ tenant_N │          │    │
│  │  │ (KGC)    │ (Fran.1) │ (Fran.2) │ (...)    │          │    │
│  │  └──────────┴──────────┴──────────┴──────────┘          │    │
│  │                                                          │    │
│  │  RLS: Minden lekérdezés automatikusan szűr tenant_id-re │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  Előnyök:                                                       │
│  • Egyszerűbb karbantartás                                      │
│  • Központi frissítések                                         │
│  • Költséghatékony                                              │
│                                                                  │
│  Hátrányok:                                                     │
│  • Komplexebb adatmodell                                        │
│  • Teljesítmény figyelés szükséges                             │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 Adatelkülönítés

```sql
-- Példa: Row Level Security PostgreSQL-ben

-- Policy létrehozás
CREATE POLICY tenant_isolation ON partner
    USING (tenant_id = current_setting('app.tenant_id')::uuid);

-- Minden lekérdezésnél automatikus szűrés
SELECT * FROM partner;
-- Csak az adott tenant partnerei látszanak
```

---

## 4. Technológia Stack Javaslat

### 4.1 Frontend

| Technológia | Választás | Indoklás |
|-------------|-----------|----------|
| **Framework** | React / Next.js | PWA támogatás, nagy közösség |
| **UI Library** | Tailwind + shadcn/ui | Modern, gyors fejlesztés |
| **State Management** | TanStack Query | Server state, cache |
| **Offline Storage** | IndexedDB (Dexie.js) | PWA offline támogatás |

### 4.2 Backend

| Technológia | Választás | Indoklás |
|-------------|-----------|----------|
| **Runtime** | Node.js | TypeScript, gyors fejlesztés |
| **Framework** | NestJS / Hono | Strukturált, skálázható |
| **API** | REST + tRPC | Típusbiztos, egyszerű |
| **Auth** | Clerk / Auth.js | Beépített multi-tenant |

### 4.3 Adatbázis

| Technológia | Választás | Indoklás |
|-------------|-----------|----------|
| **Fő DB** | PostgreSQL | RLS, megbízható, feature-rich |
| **Hosting** | Supabase / Neon | Managed, edge functions |
| **Cache** | Redis (opcionális) | Session, gyors lekérdezések |

### 4.4 Infrastruktúra

| Komponens | Választás | Indoklás |
|-----------|-----------|----------|
| **Hosting** | Vercel / Railway | Egyszerű deploy, skálázás |
| **CDN** | Cloudflare | Gyors, biztonságos |
| **File Storage** | S3 / R2 | Képek, dokumentumok |
| **Email** | SendGrid / Resend | Értesítések |
| **SMS** | Twilio / Nexmo | SMS értesítések |

---

## 5. Biztonsági Megfontolások

### 5.1 Felhő Biztonság

```
┌─────────────────────────────────────────────────────────────────┐
│                    BIZTONSÁGI RÉTEGEK                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. Hálózati szint                                              │
│     • HTTPS mindenhol                                           │
│     • WAF (Web Application Firewall)                            │
│     • DDoS védelem (Cloudflare)                                 │
│                                                                  │
│  2. Alkalmazás szint                                            │
│     • JWT token alapú autentikáció                              │
│     • RBAC (Role-Based Access Control)                          │
│     • Input validáció                                           │
│     • SQL injection védelem (ORM)                               │
│                                                                  │
│  3. Adat szint                                                  │
│     • Titkosított adatbázis kapcsolat                           │
│     • Row Level Security                                        │
│     • Audit log minden módosításról                             │
│     • Rendszeres backup                                         │
│                                                                  │
│  4. Compliance                                                  │
│     • GDPR megfelelőség                                         │
│     • NAV követelmények                                         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 5.2 Backup Stratégia

| Típus | Gyakoriság | Megőrzés |
|-------|------------|----------|
| **Teljes backup** | Naponta | 30 nap |
| **Inkrementális** | Óránként | 7 nap |
| **Point-in-time recovery** | Folyamatos | 7 nap |
| **Geo-redundáns** | Real-time | Másodlagos régió |

---

## 6. Integráció Kérdések

### 6.1 NAV Online Számla

```
┌─────────────────────────────────────────────────────────────────┐
│                    NAV INTEGRÁCIÓ                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Követelmény: Minden számla bejelentése a NAV-nak               │
│                                                                  │
│  Megoldás:                                                      │
│  ┌──────────┐      ┌──────────┐      ┌──────────┐              │
│  │  Számla  │ ───▶ │  NAV     │ ───▶ │   NAV    │              │
│  │ generálás│      │  Modul   │      │  API     │              │
│  └──────────┘      └──────────┘      └──────────┘              │
│                                                                  │
│  Offline eset:                                                  │
│  • Számla lokálisan tárolva                                     │
│  • NAV küldés pending státuszban                                │
│  • Online visszatéréskor automatikus küldés                     │
│  • 5 napos határidő betartása                                   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 6.2 E-számla Fogadás

| Lépés | Online | Offline |
|-------|--------|---------|
| Email fogadás | ✅ | ❌ |
| XML parsing | ✅ | ❌ |
| Előzetes bevételezés | ✅ | ❌ (sync után) |
| Véglegesítés | ✅ | ✅ |

---

## 7. Teljesítmény és Skálázhatóság

### 7.1 Várható Terhelés

| Metrika | Induló | 1 év | 3 év |
|---------|--------|------|------|
| **Felhasználók** | 5-10 | 50-100 | 200-500 |
| **Tranzakciók/nap** | 50-100 | 500-1000 | 2000-5000 |
| **Adatmennyiség** | 1-5 GB | 20-50 GB | 100-500 GB |
| **API hívások/perc** | 10-50 | 100-500 | 500-2000 |

### 7.2 Skálázási Stratégia

```
Vertikális skálázás (kezdetben)
─────────────────────────────
• Nagyobb szerver instance
• Több memória, CPU
• Egyszerű, költséghatékony

        ↓ Amikor szükséges

Horizontális skálázás (később)
──────────────────────────────
• Több szerver instance
• Load balancer
• Read replica adatbázisok
• Edge caching
```

---

## 8. Költségbecslés

### 8.1 Felhő Költségek (havi)

| Szolgáltatás | Induló | 1 év | Megjegyzés |
|--------------|--------|------|------------|
| **Hosting (Vercel)** | 20 USD | 50 USD | Pro tier |
| **Database (Supabase)** | 25 USD | 75 USD | Growth |
| **Storage (R2)** | 5 USD | 20 USD | Képek, docs |
| **Email (SendGrid)** | 15 USD | 30 USD | 10k email/hó |
| **SMS (Twilio)** | 20 USD | 50 USD | Forgalomtól függ |
| **Domain, SSL** | 5 USD | 5 USD | Fix |
| **Összesen** | **~90 USD** | **~230 USD** | ~35.000-90.000 Ft |

### 8.2 On-Premise Költségek (összehasonlításként)

| Tétel | Egyszeri | Éves |
|-------|----------|------|
| **Szerver hardver** | 500.000 Ft | - |
| **Licencek** | 200.000 Ft | 100.000 Ft |
| **UPS, hálózat** | 150.000 Ft | 20.000 Ft |
| **IT üzemeltetés** | - | 600.000+ Ft |
| **Összesen** | 850.000 Ft | 720.000+ Ft |

---

## 9. Ajánlás

### Javasolt Megoldás: HIBRID FELHŐ

```
┌─────────────────────────────────────────────────────────────────┐
│                    JAVASOLT ARCHITEKTÚRA                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ☁️ FELHŐ (Supabase + Vercel)                                   │
│  ├── PostgreSQL adatbázis (master)                              │
│  ├── API szerver                                                │
│  ├── File storage                                               │
│  └── Központi funkciók                                          │
│                                                                  │
│  📱 PWA KLIENS (minden telephelyen)                             │
│  ├── IndexedDB (offline cache)                                  │
│  ├── Service Worker (háttér sync)                               │
│  ├── Offline-first kritikus funkciók                            │
│  └── Automatikus szinkronizálás                                 │
│                                                                  │
│  🔄 SZINKRONIZÁCIÓ                                              │
│  ├── Conflict resolution (timestamp based)                      │
│  ├── Delta sync (csak változások)                               │
│  └── Background sync API                                        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Döntési Javaslat

| Kérdés | Javaslat |
|--------|----------|
| Felhő vagy On-Premise? | **Hibrid felhő (PWA offline)** |
| Melyik cloud provider? | **Supabase + Vercel** (kezdetben) |
| Offline szükséges? | **Igen, kritikus funkciókhoz** |
| Multi-tenant? | **Igen, RLS-sel** |

---

## 10. Következő Lépések

1. **Offline követelmények pontosítása** (KGC feladata)
   - Mely funkciók kritikusak?
   - Milyen gyakori az internet kiesés?

2. **POC (Proof of Concept)** (My Forge feladata)
   - PWA offline demo
   - Multi-tenant demo

3. **Végleges döntés** (Közös)
   - Architektúra véglegesítése
   - Technológia stack jóváhagyása

---

*Dokumentum verzió: 1.0*
*Készült: 2025.12.02.*
