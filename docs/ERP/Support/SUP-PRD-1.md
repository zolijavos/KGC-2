# Product Requirements Document (PRD)

## Kokó - AI Ügyfélszolgálati Asszisztens

**Verzió:** 2.0
**Dátum:** 2025-12-27
**Státusz:** Production

---

## 1. Termék áttekintés

### 1.1 Vízió

Intelligens, skálázható ügyfélszolgálati rendszer, ahol:
- Minden projekt/cég saját elkülönített tudásbázissal rendelkezik
- A Gemini Long Context (2M token) kiváltja a hagyományos vektor DB-t
- Real-time válaszadás Chatwoot csatornákon keresztül
- Önfejlesztő memória - hosszú távú emlékezet a beszélgetésekről

### 1.2 Célközönség

- **Elsődleges:** MyForge Labs ügyfelei (KKV szektor)
- **Másodlagos:** Belső support csapat
- **Harmadlagos:** Partner cégek

### 1.3 Üzleti célok

1. Support költségek 70%-os csökkentése
2. 24/7 elérhetőség biztosítása
3. Átlagos válaszidő < 3 másodperc
4. Ügyfél elégedettség > 90%

---

## 2. Funkcionális követelmények

### 2.1 Intelligens válaszadás (FR1)

| ID | Követelmény | Prioritás | Státusz |
|----|-------------|-----------|---------|
| FR1.1 | AI válasz generálás Gemini 2.0 Flash Exp-vel | P0 | ✅ Kész |
| FR1.2 | Context Caching implementáció | P0 | ✅ Kész |
| FR1.3 | Confidence score minden válaszhoz | P1 | ✅ Kész |
| FR1.4 | Typing indicator válasz közben | P2 | ✅ Kész |

**Acceptance Criteria:**
- [ ] AI válasz < 5 másodperc
- [ ] Confidence score 0-100% között
- [ ] Confidence emoji megjelenítés (🟢🟡🔴)
- [ ] Private note az operátornak

### 2.2 Többnyelvű támogatás (FR2)

| ID | Követelmény | Prioritás | Státusz |
|----|-------------|-----------|---------|
| FR2.1 | Automatikus nyelvfelismerés | P0 | ✅ Kész |
| FR2.2 | Magyar nyelv támogatás | P0 | ✅ Kész |
| FR2.3 | Angol nyelv támogatás | P0 | ✅ Kész |
| FR2.4 | Nyelv-specifikus system prompt | P1 | ✅ Kész |

**Acceptance Criteria:**
- [ ] Nyelvfelismerés pontosság > 95%
- [ ] Válasz a felismert nyelven
- [ ] Árak automatikus konverziója

### 2.3 Időpontfoglalás (FR3)

| ID | Követelmény | Prioritás | Státusz |
|----|-------------|-----------|---------|
| FR3.1 | Google Calendar integráció | P0 | ✅ Kész |
| FR3.2 | Szabad időpontok lekérdezése | P0 | ✅ Kész |
| FR3.3 | Foglalás létrehozása | P0 | ✅ Kész |
| FR3.4 | Email visszaigazolás | P1 | ✅ Kész |

**Acceptance Criteria:**
- [ ] Valós idejű naptár szinkron
- [ ] Minimum 1 óra előre foglalás
- [ ] Foglalás visszaigazolás emailben

### 2.4 Hangüzenet feldolgozás (FR4)

| ID | Követelmény | Prioritás | Státusz |
|----|-------------|-----------|---------|
| FR4.1 | Hangfájl detektálás | P1 | ✅ Kész |
| FR4.2 | Whisper API transzkripció | P1 | ✅ Kész |
| FR4.3 | Transzkripció megjelenítés | P1 | ✅ Kész |
| FR4.4 | AI válasz a tartalomra | P1 | ✅ Kész |

### 2.5 Hosszú távú memória (FR5)

| ID | Követelmény | Prioritás | Státusz |
|----|-------------|-----------|---------|
| FR5.1 | Ügyfél adatok automatikus mentése | P0 | ✅ Kész |
| FR5.2 | Beszélgetés előzmények | P0 | ✅ Kész |
| FR5.3 | Preferenciák tárolása | P1 | ✅ Kész |
| FR5.4 | GDPR-kompatibilis törlés | P0 | ✅ Kész |

**Acceptance Criteria:**
- [ ] Név, email automatikus kinyerés
- [ ] Memória perzisztencia Redis-ben
- [ ] /forget endpoint a törléshez

### 2.6 Multi-csatorna támogatás (FR6)

| ID | Követelmény | Prioritás | Státusz |
|----|-------------|-----------|---------|
| FR6.1 | Chatwoot widget | P0 | ✅ Kész |
| FR6.2 | Email integráció | P0 | ✅ Kész |
| FR6.3 | Discord bridge | P1 | ✅ Kész |
| FR6.4 | Email loop prevention | P0 | ✅ Kész |

### 2.7 Admin felület (FR7)

| ID | Követelmény | Prioritás | Státusz |
|----|-------------|-----------|---------|
| FR7.1 | Dashboard | P1 | ✅ Kész |
| FR7.2 | Tudásbázis kezelő | P1 | ✅ Kész |
| FR7.3 | Cache kezelő | P1 | ✅ Kész |
| FR7.4 | Memory kezelő | P1 | ✅ Kész |
| FR7.5 | Statisztikák | P2 | ✅ Kész |

---

## 3. Nem-funkcionális követelmények

### 3.1 Teljesítmény (NFR1)

| ID | Követelmény | Cél | Aktuális |
|----|-------------|-----|----------|
| NFR1.1 | Válaszidő | < 5s | ~3s |
| NFR1.2 | Uptime | 99.5% | 99.9% |
| NFR1.3 | Concurrent users | 100 | 100+ |

### 3.2 Biztonság (NFR2)

| ID | Követelmény | Státusz |
|----|-------------|---------|
| NFR2.1 | API kulcsok .env-ben | ✅ |
| NFR2.2 | HTTPS kommunikáció | ✅ |
| NFR2.3 | Bounce email szűrés | ✅ |
| NFR2.4 | Rate limiting | ✅ |

### 3.3 Skálázhatóság (NFR3)

| ID | Követelmény | Státusz |
|----|-------------|---------|
| NFR3.1 | Docker containerizáció | ✅ |
| NFR3.2 | Horizontális skálázás | ✅ |
| NFR3.3 | Redis cache | ✅ |

---

## 4. User Stories

### Epic 1: Ügyfél interakció

**US1.1** - Mint ügyfél, szeretnék kérdést feltenni a chatbot-nak, hogy gyors választ kapjak.

**US1.2** - Mint ügyfél, szeretném ha a bot az anyanyelvemen válaszolna.

**US1.3** - Mint ügyfél, szeretnék időpontot foglalni konzultációra.

**US1.4** - Mint ügyfél, hangüzenetben szeretném feltenni a kérdésem.

### Epic 2: Operátor támogatás

**US2.1** - Mint operátor, szeretném látni a bot válaszainak megbízhatóságát.

**US2.2** - Mint operátor, szeretném átvenni a beszélgetést ha szükséges.

**US2.3** - Mint operátor, szeretném látni az ügyfél előzményeit.

### Epic 3: Admin funkciók

**US3.1** - Mint admin, szeretném szerkeszteni a tudásbázist.

**US3.2** - Mint admin, szeretném látni a használati statisztikákat.

**US3.3** - Mint admin, szeretném frissíteni a cache-t változások után.

---

## 5. Költségbecslés

### Gemini API költségek

| Típus | Ár | Cache-elt ár |
|-------|-----|--------------|
| Input token | Változó | Cache-elt: 75% kedvezmény |
| Output token | Változó | - |

### Becsült havi költség

- ~10,000 beszélgetés/hó
- ~500 token/beszélgetés átlag
- **Becsült költség:** ~$15-30/hó

---

## 6. Kockázatok és mitigáció

| Kockázat | Valószínűség | Hatás | Mitigáció |
|----------|--------------|-------|-----------|
| Gemini API leállás | Alacsony | Magas | Fallback üzenet |
| Email loop | Közepes | Magas | ✅ Megoldva (bounce filter) |
| Túl magas költség | Alacsony | Közepes | Context caching, monitoring |
| Helytelen válasz | Közepes | Közepes | Confidence score, human handover |

---

## 7. Roadmap

### Q4 2025 (Befejezve)
- [x] Alaprendszer felépítése
- [x] Gemini integráció
- [x] Context caching
- [x] Többnyelvű támogatás
- [x] Időpontfoglalás
- [x] Admin UI
- [x] E2E tesztek

### Q1 2026 (Tervezett)
- [ ] RAG implementáció nagy tudásbázisokhoz
- [ ] Több ügyfél onboarding
- [ ] Response streaming
- [ ] Proaktív üdvözlés (loop-mentes)

### Q2 2026 (Tervezett)
- [ ] Multimodális input (kép, video)
- [ ] Podcast generálás (NotebookLM stílus)
- [ ] Advanced analytics dashboard

---

## 8. Függelékek

### A. API Endpoints

Lásd: [ARCHITECTURE.md](ARCHITECTURE.md)

### B. Tesztelési eredmények

- Context-manager: 22 teszt ✅
- Teljes ecosystem: 45 teszt ✅
- Playwright UI: 9 teszt ✅

### C. Kapcsolódó dokumentumok

- [ARCHITECTURE.md](ARCHITECTURE.md)
- [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md)
- [koko/KOKO_PROJECT_STATUS.md](../koko/KOKO_PROJECT_STATUS.md)
