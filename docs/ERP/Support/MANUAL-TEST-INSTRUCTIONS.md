# Support Modul - E2E Manual Teszt Instrukciók

**Verzió**: 1.0
**Dátum**: 2025-12-28
**Rendszer**: Kokó AI Chatbot (Chatwoot + Gemini 2.0 Flash)
**Tesztelő**: _________________

---

## 📋 Tartalomjegyzék

1. [Előfeltételek](#előfeltételek)
2. [Chatwoot Widget Tesztek](#1-chatwoot-widget-tesztek)
3. [Email Inbound Tesztek](#2-email-inbound-tesztek)
4. [Discord Integration Tesztek](#3-discord-integration-tesztek)
5. [AI Válaszgenerálás Tesztek](#4-ai-válaszgenerálás-tesztek)
6. [Context Caching Tesztek](#5-context-caching-tesztek)
7. [Multi-language Támogatás Tesztek](#6-multi-language-támogatás-tesztek)
8. [Appointment Booking Tesztek](#7-appointment-booking-tesztek)
9. [Voice Message Tesztek](#8-voice-message-tesztek)
10. [Memory Management Tesztek](#9-memory-management-tesztek)
11. [Email Loop Prevention Tesztek](#10-email-loop-prevention-tesztek)
12. [Performance és Load Tesztek](#11-performance-és-load-tesztek)

---

## Előfeltételek

### Rendszer komponensek ellenőrzése

Minden teszt előtt győződj meg róla, hogy az alábbi szolgáltatások futnak:

```bash
# 1. Chatwoot Core (Rails)
curl http://localhost:3000/api
# Várt válasz: 200 OK

# 2. ai-chatbot (Python)
curl http://localhost:5001/health
# Várt válasz: {"status": "healthy"}

# 3. context-manager (Python)
curl http://localhost:5004/health
# Várt válasz: {"status": "healthy"}

# 4. gemini-proxy (Python)
curl http://localhost:5000/health
# Várt válasz: {"status": "healthy"}

# 5. calendar-service (Python)
curl http://localhost:5002/health
# Várt válasz: {"status": "healthy"}

# 6. discord-bridge (Python)
curl http://localhost:8080/health
# Várt válasz: {"status": "healthy"}

# 7. Redis
redis-cli ping
# Várt válasz: PONG

# 8. PostgreSQL
psql -h localhost -U chatwoot -d chatwoot_production -c "SELECT 1;"
# Várt válasz: 1
```

### Teszt felhasználók és adatok

- **Admin felhasználó**: admin@kgc.hu / Admin123!
- **Teszt ügyfél email**: test.customer@example.com
- **Discord teszt szerver**: #test-support channel
- **Teszt Knowledge Base**: `/knowledge-bases/_global/faq.md`

---

## 1. Chatwoot Widget Tesztek

### Test Case 1.1: Widget alapvető működés

**Cél**: Ellenőrizni, hogy a Chatwoot widget megfelelően betöltődik és működik

**Lépések**:

1. Nyisd meg a tesztoldalat böngészőben: `http://localhost:3000/demo`
2. Ellenőrizd, hogy a widget ikon megjelenik a jobb alsó sarokban
3. Kattints a widget ikonra
4. Ellenőrizd, hogy a chat ablak kinyílik
5. Ellenőrizd, hogy az üdvözlő üzenet megjelenik:
   ```
   "Üdvözöllek! 👋 Miben segíthetek?"
   ```

**Várt eredmény**:
- ✅ Widget ikon látható (kék kör, chat ikon)
- ✅ Kattintásra kinyílik a chat ablak
- ✅ Üdvözlő üzenet azonnal megjelenik
- ✅ Input mező aktív és írható

**Hiba esetén ellenőrizd**:
- Chatwoot Core fut-e (port 3000)
- JavaScript console hibák
- Network tab: `widget.js` betöltődik-e

---

### Test Case 1.2: Egyszerű kérdés küldése és AI válasz

**Cél**: Tesztelni a teljes user → AI → user folyamatot

**Lépések**:

1. Nyisd meg a widget-et (Test Case 1.1 szerint)
2. Írj be egy egyszerű kérdést: **"Mi a nyitvatartásotok?"**
3. Nyomd meg az Enter billentyűt vagy kattints a Küldés gombra
4. Figyeld meg:
   - Az üzenet azonnal megjelenik a chat-ben (user bubble, jobb oldal)
   - "Gépel..." jelzés megjelenik (Kokó gépel)
   - AI válasz megérkezik 3-5 másodpercen belül

**Várt válasz tartalma**:
```
A Knowledge Base-ben található információk alapján válaszol.
Például: "Hétfőtől péntekig 9:00-17:00 között vagyunk nyitva."
```

**Ellenőrizendő részletek**:
- ✅ User üzenet látható a jobb oldalon (kék bubble)
- ✅ "Gépel..." animáció aktív
- ✅ AI válasz bal oldalon jelenik meg (szürke bubble)
- ✅ Válasz releváns és értelmes
- ✅ Válaszidő < 5 másodperc

**Hiba esetén nézd meg**:

```bash
# ai-chatbot log
docker logs -f ai-chatbot

# context-manager log
docker logs -f context-manager

# gemini-proxy log
docker logs -f gemini-proxy
```

---

### Test Case 1.3: Több egymást követő üzenet

**Cél**: Tesztelni a context megőrzést több üzenet során

**Lépések**:

1. Widget megnyitva (Test Case 1.1)
2. **1. üzenet**: "Milyen szolgáltatásokat kínáltok?"
   - Várd meg a választ
3. **2. üzenet**: "És mennyi az ára?"
   - Várd meg a választ (a "mennyi az ára" kontextusa az előző kérdésre utal)
4. **3. üzenet**: "Tudok online időpontot foglalni?"
   - Várd meg a választ

**Várt eredmény**:
- ✅ Minden válasz releváns
- ✅ 2. kérdés válasza utal az 1. kérdésre ("A korábban említett szolgáltatások ára...")
- ✅ Context folyamatos, nem "felejti el" az előző üzeneteket
- ✅ Minden válasz 3-5 másodpercen belül érkezik

**Ellenőrizd a context-manager log-ot**:
```bash
# Nézd meg, hogy betölti-e az előző üzeneteket
docker logs -f context-manager | grep "conversation_history"
```

---

### Test Case 1.4: Felhasználó információk megőrzése

**Cél**: Tesztelni a long-term memory funkciót

**Lépések**:

1. **Első beszélgetés**:
   - Widget megnyitása
   - Üzenet: "Szia! A nevem Teszt János."
   - Várd meg a választ (pl. "Üdvözöllek, János!")
   - Zárj be a widget-et

2. **Második beszélgetés** (5 perc múlva):
   - Nyisd meg újra a widget-et
   - Üzenet: "Visszajöttem"
   - Várd meg a választ

**Várt eredmény**:
- ✅ 2. beszélgetésben a bot emlékszik a névre: "Üdv újra, János!"
- ✅ Memory file létrejön: `/memory/{customer_id}.json`

**Ellenőrizd a memory file-t**:
```bash
# Nézd meg, hogy létrejött-e a memory file
ls -la /path/to/memory/

# Olvasd be a tartalmat
cat /path/to/memory/{customer_id}.json
```

Várt tartalom:
```json
{
  "customer_id": "...",
  "preferences": {
    "name": "Teszt János",
    "language": "hu"
  },
  "conversation_history": [
    {
      "timestamp": "2025-12-28T14:00:00Z",
      "message": "Szia! A nevem Teszt János."
    }
  ]
}
```

---

## 2. Email Inbound Tesztek

### Test Case 2.1: Email fogadás és AI válasz

**Cél**: Tesztelni az email csatornán történő kommunikációt

**Lépések**:

1. Küldj egy email-t a Chatwoot inbox címére:
   - **Címzett**: `support@kgc.hu`
   - **Tárgy**: "Kérdés a szolgáltatásokról"
   - **Tartalom**: "Sziasztok! Szeretnék többet tudni az ERP rendszeretekről."

2. Várd meg az automatikus választ (max 30 másodperc)

3. Ellenőrizd az email-t a feladó postafiókjában

**Várt eredmény**:
- ✅ Email megérkezik < 30 másodperc alatt
- ✅ Feladó: `Kokó AI Support <support@kgc.hu>`
- ✅ Tárgy tartalmazza az eredeti tárgyat: `Re: Kérdés a szolgáltatásokról`
- ✅ Email body tartalmaz AI választ a Knowledge Base alapján
- ✅ Email aláírás tartalmazza: "Powered by Kokó AI"

**Ellenőrizd a Chatwoot admin felületen**:

1. Jelentkezz be: `http://localhost:3000/app/login`
2. Menj az Inbox-ra
3. Keresd meg a beszélgetést
4. Ellenőrizd:
   - ✅ Conversation létrejött
   - ✅ User üzenet látható (incoming)
   - ✅ AI válasz látható (outgoing)
   - ✅ Channel: Email

---

### Test Case 2.2: Email loop prevention - Bounce email

**Cél**: Tesztelni, hogy a rendszer nem reagál bounce email-ekre

**Lépések**:

1. Szimulálj egy bounce email-t (vagy küldd invalid címre):
   - **Feladó**: `mailer-daemon@kgc.hu`
   - **Tárgy**: "Undelivered Mail Returned to Sender"
   - **Tartalom**: "This is the mail system at host..."

2. Várj 1 percet

**Várt eredmény**:
- ✅ **NINCS** automatikus válasz
- ✅ Chatwoot-ban **NINCS** új beszélgetés létrehozva
- ✅ ai-chatbot log mutatja: `"Bounce email detected, skipping processing"`

**Ellenőrizd a log-ot**:
```bash
docker logs -f ai-chatbot | grep -i "bounce"
```

Várt log:
```
[INFO] Received webhook: message_created
[INFO] Checking email sender: mailer-daemon@kgc.hu
[INFO] Bounce email detected, skipping processing
```

---

### Test Case 2.3: Email loop prevention - Auto-reply email

**Cél**: Tesztelni, hogy a rendszer nem reagál auto-reply email-ekre

**Lépések**:

1. Szimulálj egy auto-reply email-t:
   - **Feladó**: `someone@example.com`
   - **Tárgy**: "Automatic reply: Out of office"
   - **Tartalom**: "I am currently out of office..."
   - **Header**: `Auto-Submitted: auto-replied`

2. Várj 1 percet

**Várt eredmény**:
- ✅ **NINCS** automatikus válasz
- ✅ ai-chatbot log mutatja: `"Auto-reply detected, skipping processing"`

---

## 3. Discord Integration Tesztek

### Test Case 3.1: Discord üzenet szinkronizálás

**Cél**: Tesztelni a Discord és Chatwoot közötti szinkronizációt

**Lépések**:

1. Csatlakozz a Discord teszt szerverhez
2. Menj a `#support` csatornára
3. Írj egy üzenetet: **"!help Mi az ERP rendszer?"**
4. Várd meg a bot válaszát (max 5 másodperc)

**Várt eredmény**:
- ✅ Kokó AI bot reagál Discordon < 5 másodperc alatt
- ✅ Válasz releváns és AI-generált
- ✅ Chatwoot-ban létrejön egy új beszélgetés a Discord user-rel
- ✅ Channel: Discord

**Ellenőrizd Chatwoot-ban**:

1. Jelentkezz be admin-ként
2. Inbox → Discord channel
3. Keresd meg a beszélgetést
4. Ellenőrizd:
   - ✅ User név megegyezik a Discord username-mel
   - ✅ User avatar szinkronizálva
   - ✅ Üzenetek kétirányúan szinkronizálva

---

### Test Case 3.2: Discord ticket létrehozás

**Cél**: Tesztelni a Discord ticket rendszert

**Lépések**:

1. Discord `#support` csatornán írj: **"!ticket Szükségem van segítségre az ERP-vel"**
2. Várd meg a bot válaszát
3. Kattints a "Create Ticket" gombra (reakció emoji vagy button)

**Várt eredmény**:
- ✅ Bot létrehoz egy privát thread-et vagy DM-et
- ✅ Chatwoot-ban új beszélgetés jön létre "Ticket" címkével
- ✅ Ticket ID generálódik (pl. `TICKET-001`)

---

## 4. AI Válaszgenerálás Tesztek

### Test Case 4.1: Knowledge Base alapú válaszadás

**Cél**: Tesztelni, hogy az AI a Knowledge Base-ből válaszol

**Lépések**:

1. Ellenőrizd a Knowledge Base tartalmát:
   ```bash
   cat /knowledge-bases/_global/faq.md
   ```

2. Widget-en keresztül kérdezz olyat, ami a KB-ben van:
   - **Kérdés**: "Mik az ERP rendszer főbb moduljai?"

**Várt eredmény**:
- ✅ Válasz tartalmazza a KB-ben szereplő modulokat
- ✅ Válasz pontos és releváns
- ✅ Válasz formázott (bullet points, ha a KB-ben is az van)

**Ellenőrizd a gemini-proxy log-ot**:
```bash
docker logs -f gemini-proxy | grep "cache_hit"
```

Ha cache hit van, akkor a válasz gyorsabb és olcsóbb.

---

### Test Case 4.2: Knowledge Base nélküli kérdés

**Cél**: Tesztelni, hogy az AI mi történik, ha nincs KB-ben a válasz

**Lépések**:

1. Kérdezz olyat, ami **nincs** a Knowledge Base-ben:
   - **Kérdés**: "Mi a Föld és a Hold távolsága?"

**Várt eredmény**:
- ✅ AI válaszol, de jelzi, hogy ez nem a KB alapján van:
   ```
   "Sajnálom, de ez az információ nincs a tudásbázisomban.
   A Föld és a Hold távolsága átlagosan 384,400 km,
   de a KGC termékekkel kapcsolatban tudok segíteni."
   ```
- ✅ AI visszairányít a KGC-hez kapcsolódó témákhoz

---

### Test Case 4.3: Conversation history figyelembevétele

**Cél**: Tesztelni, hogy az AI emlékszik a korábbi üzenetekre

**Lépések**:

1. **1. üzenet**: "Milyen ERP modulok vannak?"
2. Várd meg a választ
3. **2. üzenet**: "Melyik a legfontosabb ezek közül?"
   - Figyelem: "ezek közül" utal az előző válaszra

**Várt eredmény**:
- ✅ 2. válasz helyesen értelmezi a kontextust
- ✅ "Ezek közül" → az előző válaszban említett modulokra utal
- ✅ Válasz releváns

**Ellenőrizd a prompt-ot** (debug mode):
```bash
# context-manager log
docker logs -f context-manager | grep "conversation_history"
```

Várt log részlet:
```json
{
  "conversation_history": [
    {"role": "user", "content": "Milyen ERP modulok vannak?"},
    {"role": "assistant", "content": "..."},
    {"role": "user", "content": "Melyik a legfontosabb ezek közül?"}
  ]
}
```

---

## 5. Context Caching Tesztek

### Test Case 5.1: Cache létrehozás első kérésnél

**Cél**: Tesztelni a Gemini context cache létrehozását

**Előkészület**:
```bash
# Töröld a Redis cache-t
redis-cli FLUSHALL
```

**Lépések**:

1. Widget-en keresztül küldj egy üzenetet: **"Hello"**
2. Várd meg a választ
3. Ellenőrizd a válaszidőt (első kérés lassabb: 4-6 másodperc)

**Várt eredmény**:
- ✅ Válasz megérkezik 4-6 másodpercen belül
- ✅ Redis-ben létrejön a cache key

**Ellenőrizd a Redis-t**:
```bash
# Nézd meg a cache key-eket
redis-cli KEYS "*gemini*"

# Nézd meg egy cache tartalmát
redis-cli GET "gemini:cache:{conversation_id}"
```

**Ellenőrizd a context-manager log-ot**:
```bash
docker logs -f context-manager | grep "cache"
```

Várt log:
```
[INFO] Cache miss for conversation {id}
[INFO] Creating new Gemini cache
[INFO] Cache created successfully, TTL: 3600s
```

---

### Test Case 5.2: Cache hit második kérésnél

**Cél**: Tesztelni a cache újrafelhasználását és 75% költségmegtakarítást

**Lépések**:

1. Ugyanabban a beszélgetésben (Test Case 5.1 után)
2. Küldj újabb üzenetet: **"Mi a nyitvatartásotok?"**
3. Ellenőrizd a válaszidőt (gyorsabb: 2-3 másodperc)

**Várt eredmény**:
- ✅ Válasz gyorsabb: 2-3 másodperc
- ✅ Cache hit történt

**Ellenőrizd a log-ot**:
```bash
docker logs -f context-manager | grep "cache"
```

Várt log:
```
[INFO] Cache hit for conversation {id}
[INFO] Using existing Gemini cache
[INFO] Cache TTL remaining: 3400s
[INFO] Cost savings: 75%
```

---

### Test Case 5.3: Cache TTL lejárat

**Cél**: Tesztelni, hogy a cache 1 óra után lejár

**Lépések**:

1. Várj 1 órát (vagy gyorsítsd fel a TTL-t teszteléshez):
   ```bash
   # Állítsd be a TTL-t 60 másodpercre debug módban
   # Módosítsd a context-manager konfigot
   ```

2. 60 másodperc után küldj új üzenetet

**Várt eredmény**:
- ✅ Cache miss történik
- ✅ Új cache jön létre
- ✅ Válaszidő lassabb (4-6 másodperc)

---

## 6. Multi-language Támogatás Tesztek

### Test Case 6.1: Magyar nyelvű kommunikáció

**Lépések**:

1. Widget megnyitása
2. Üzenet: **"Szia! Milyen szolgáltatásokat kínáltok?"**

**Várt eredmény**:
- ✅ AI válasz magyarul
- ✅ Nyelvtan és helyesírás helyes
- ✅ Szakszavak helyesen használva

---

### Test Case 6.2: Angol nyelvű kommunikáció

**Lépések**:

1. Widget megnyitása (új beszélgetés)
2. Üzenet: **"Hello! What services do you offer?"**

**Várt eredmény**:
- ✅ AI válasz angolul
- ✅ Nyelvtan helyes
- ✅ Professzionális angol stílus

---

### Test Case 6.3: Nyelv váltás beszélgetés közben

**Lépések**:

1. Widget megnyitása
2. **1. üzenet (magyar)**: "Szia!"
   - Várt válasz: Magyarul
3. **2. üzenet (angol)**: "Can you speak English?"
   - Várt válasz: Angolul
4. **3. üzenet (magyar)**: "Köszönöm, akkor maradok a magyarnál."
   - Várt válasz: Magyarul

**Várt eredmény**:
- ✅ AI automatikusan detektálja a nyelvet
- ✅ Nyelvváltás zökkenőmentes
- ✅ Context megmarad nyelv váltás után is

---

## 7. Appointment Booking Tesztek

### Test Case 7.1: Időpont foglalás kérése

**Cél**: Tesztelni a Google Calendar integrációt

**Előfeltétel**:
- Google Calendar API engedélyezve
- OAuth token érvényes

**Lépések**:

1. Widget-en keresztül üzenet: **"Szeretnék időpontot foglalni konzultációra."**
2. Várd meg az AI válaszát
3. AI kérdezi: "Mikor szeretnél időpontot? (pl. holnap 14:00)"
4. Válaszolj: **"Holnap 14:00"**
5. AI visszaigazol és elküld egy Google Calendar link-et

**Várt eredmény**:
- ✅ AI felismeri az időpont foglalási szándékot
- ✅ AI kérdez visszaigazolásért
- ✅ Google Calendar esemény létrejön
- ✅ Calendar meghívó email kiküldésre kerül
- ✅ Widget-ben megjelenik a foglalás összefoglalója

**Ellenőrizd a calendar-service log-ot**:
```bash
docker logs -f calendar-service | grep "booking"
```

Várt log:
```
[INFO] Booking request received
[INFO] Checking availability for: 2025-12-29 14:00
[INFO] Slot available
[INFO] Creating Google Calendar event
[INFO] Event created: event_id=xyz123
[INFO] Sending confirmation email
```

---

### Test Case 7.2: Foglalt időpont kezelése

**Lépések**:

1. Próbálj időpontot foglalni egy már foglalt időre:
   - **Üzenet**: "Szeretnék időpontot holnap 10:00-ra"
   - (Ha 10:00 már foglalt)

**Várt eredmény**:
- ✅ AI jelzi, hogy az időpont foglalt
- ✅ AI alternatív időpontokat ajánl:
   ```
   "Sajnos holnap 10:00 már foglalt.
   Elérhető időpontok:
   - Holnap 11:00
   - Holnap 14:00
   - Holnap 16:00"
   ```

---

## 8. Voice Message Tesztek

### Test Case 8.1: Voice message feldolgozás

**Cél**: Tesztelni az OpenAI Whisper API integrációt

**Előfeltétel**:
- Whisper API kulcs beállítva
- Chatwoot támogatja a voice message-eket

**Lépések**:

1. Küldj egy hangüzenetet a Widget-en keresztül:
   - Kattints a mikrofon ikonra
   - Mondj be: **"Szia! Milyen modulokat tartalmaz az ERP rendszer?"**
   - Küldd el a hangüzenetet

2. Várd meg a feldolgozást (5-10 másodperc)

**Várt eredmény**:
- ✅ Hangüzenet feltöltődik
- ✅ Whisper API átírja szöveggé
- ✅ Átírt szöveg megjelenik a chat-ben: "Átírt szöveg: Szia! Milyen modulokat tartalmaz az ERP rendszer?"
- ✅ AI válaszol a szöveg alapján

**Ellenőrizd a log-ot**:
```bash
docker logs -f ai-chatbot | grep "voice"
```

Várt log:
```
[INFO] Voice message received: audio.ogg
[INFO] Sending to Whisper API
[INFO] Transcription: "Szia! Milyen modulokat tartalmaz az ERP rendszer?"
[INFO] Processing transcribed text
```

---

## 9. Memory Management Tesztek

### Test Case 9.1: Preferenciák mentése

**Lépések**:

1. **1. beszélgetés**:
   - Widget megnyitása
   - Üzenet: **"Szia! A nevem Teszt János és az Értékesítés modulra vagyok kíváncsi."**
   - Várd meg a választ

2. **2. beszélgetés** (másik nap):
   - Widget megnyitása (ugyanaz a user)
   - Üzenet: **"Szia újra!"**

**Várt eredmény**:
- ✅ 2. beszélgetésben az AI emlékszik:
   ```
   "Üdv újra, János!
   Legutóbb az Értékesítés modulról beszéltünk.
   Van még kérdésed ezzel kapcsolatban?"
   ```

**Ellenőrizd a memory file-t**:
```bash
cat /memory/{customer_id}.json
```

Várt tartalom:
```json
{
  "customer_id": "...",
  "preferences": {
    "name": "Teszt János",
    "interested_in": ["Értékesítés modul"],
    "language": "hu"
  },
  "conversation_history": [...]
}
```

---

### Test Case 9.2: GDPR compliance - Adatok törlése

**Cél**: Tesztelni az adattörlési funkciót

**Lépések**:

1. Widget-ben kérj adattörlést:
   - Üzenet: **"Szeretném törölni az adataimat."**

2. AI visszakérdez megerősítésért:
   - Üzenet: **"Igen, töröld az adataimat."**

**Várt eredmény**:
- ✅ AI megerősítést kér
- ✅ Adatok törlődnek a `/memory/{customer_id}.json` file-ból
- ✅ Conversation history is törlődik
- ✅ Visszaigazoló üzenet: "Az adataid sikeresen törölve lettek."

**Ellenőrizd**:
```bash
# Memory file törölve vagy üres
cat /memory/{customer_id}.json
# Üres vagy nem létezik
```

---

## 10. Email Loop Prevention Tesztek

### Test Case 10.1: Mailer-daemon detektálás

**Lásd Test Case 2.2**

---

### Test Case 10.2: Auto-reply detektálás

**Lásd Test Case 2.3**

---

### Test Case 10.3: Noreply címek kiszűrése

**Lépések**:

1. Szimulálj email-t noreply címről:
   - **Feladó**: `noreply@example.com`
   - **Tárgy**: "Newsletter"
   - **Tartalom**: "Check out our new products..."

**Várt eredmény**:
- ✅ **NINCS** automatikus válasz
- ✅ ai-chatbot log: `"Noreply sender detected, skipping"`

---

## 11. Performance és Load Tesztek

### Test Case 11.1: Válaszidő teszt (single user)

**Lépések**:

1. Küldj 10 üzenetet egymás után (mindegyikre várd meg a választ):
   - Üzenet 1-10: "Teszt üzenet {n}"

2. Mérj minden válaszidőt

**Várt eredmény**:
- ✅ Első válasz: < 5 másodperc (cache miss)
- ✅ 2-10. válasz: < 3 másodperc (cache hit)
- ✅ Átlagos válaszidő: < 3.5 másodperc

---

### Test Case 11.2: Concurrent users teszt

**Eszköz**: Apache Bench vagy k6

**Lépések**:

```bash
# Indíts 10 concurrent request-et
ab -n 100 -c 10 http://localhost:5001/webhook
```

**Várt eredmény**:
- ✅ Mind a 100 request sikeres (200 OK)
- ✅ Átlagos válaszidő < 5 másodperc
- ✅ Nincs 5xx hiba
- ✅ Redis connection pool nem merül ki

---

### Test Case 11.3: Redis cache teljesítmény

**Lépések**:

1. Küldj 100 üzenetet cache-elt beszélgetésben
2. Mérj minden válaszidőt

**Várt eredmény**:
- ✅ Mind a 100 válasz cache hit
- ✅ Átlagos válaszidő < 2.5 másodperc
- ✅ Redis memory használat < 100 MB

**Ellenőrizd**:
```bash
# Redis memory
redis-cli INFO memory | grep used_memory_human

# Redis key count
redis-cli DBSIZE
```

---

## 12. Teszt Összefoglaló és Jelentés

### Teszt eredmények rögzítése

Minden teszt után töltsd ki az alábbi táblázatot:

| Test Case ID | Teszt Név | Státusz | Hiba leírás | Tesztelő | Dátum |
|--------------|-----------|---------|-------------|----------|-------|
| 1.1 | Widget alapvető működés | ✅ PASS | - | | |
| 1.2 | Egyszerű kérdés-válasz | ✅ PASS | - | | |
| 1.3 | Több egymást követő üzenet | ❌ FAIL | Context elveszett 3. üzenetnél | | |
| ... | ... | ... | ... | ... | ... |

### Kritikus hibák prioritása

- **P0 (Blocker)**: Rendszer nem indul, crash, adatvesztés
- **P1 (Critical)**: AI nem válaszol, cache nem működik
- **P2 (Major)**: Lassú válaszidő, memory leak
- **P3 (Minor)**: UI hiba, helyesírás

### Teszt környezet információk

```bash
# Verzió információk
docker ps --format "table {{.Names}}\t{{.Image}}\t{{.Status}}"

# System resources
free -h
df -h

# Service health
curl http://localhost:5001/health
curl http://localhost:5004/health
curl http://localhost:5000/health
```

---

## 13. Troubleshooting

### Gyakori problémák és megoldások

#### 1. AI nem válaszol

**Ellenőrizd**:
```bash
# Gemini API kulcs érvényes?
curl -H "Authorization: Bearer $GEMINI_API_KEY" \
  https://generativelanguage.googleapis.com/v1/models

# gemini-proxy fut?
curl http://localhost:5000/health

# context-manager fut?
curl http://localhost:5004/health
```

#### 2. Cache nem működik

**Ellenőrizd**:
```bash
# Redis fut?
redis-cli ping

# Redis kapcsolat OK?
redis-cli INFO clients

# Cache TTL
redis-cli TTL "gemini:cache:{conversation_id}"
```

#### 3. Email nem érkezik

**Ellenőrizd**:
```bash
# Chatwoot email settings
# Admin → Settings → Inboxes → Email

# SMTP konfiguráció
# Check docker-compose.yml vagy .env
```

---

## 14. Sign-off

**Tesztelő neve**: _________________
**Dátum**: _________________
**Aláírás**: _________________

**Test Manager jóváhagyás**: _________________
**Dátum**: _________________

---

**Verzió történet**:
- v1.0 (2025-12-28): Első verzió - Teljes E2E teszt csomag
