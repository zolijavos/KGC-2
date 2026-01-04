#!/usr/bin/env node
/**
 * KGC ERP Wireframes Portable HTML Generator
 * Generates a fully self-contained HTML file with ALL wireframe SVGs embedded inline
 *
 * Usage: node generate-portable-html.js
 */

const fs = require('fs');
const path = require('path');

const BASE_DIR = __dirname;
const OUTPUT_FILE = path.join(BASE_DIR, '..', 'KGC-Wireframes-Portable-2026-01-04.html');

// Category definitions with their wireframes and descriptions
const CATEGORIES = {
    'core': {
        name: 'Core Modulok',
        icon: '🏠',
        description: 'Alap rendszer wireframe-ek: Dashboard, Bérlés, Szerviz, Készlet, Pénztár',
        wireframes: [
            {
                id: 'dashboard',
                title: 'Dashboard',
                description: 'Fő vezérlőpult KPI widgetekkel, napi összesítőkkel és gyors művelet gombokkal. Szerepkör-adaptív layout: Operátor vs Boltvezető nézet.',
                steps: [
                    '1. Belépés után automatikusan megjelenik a szerepkörnek megfelelő dashboard',
                    '2. KPI kártyák: Aktív bérlések, Mai bevétel, Nyitott munkalapok, Lejáró kauciók',
                    '3. Quick Action gombok: Új bérlés, Új eladás, Új munkalap, Szkennelés',
                    '4. Értesítések panel: Szinkron státusz, figyelmeztetések, teendők',
                    '5. Widget drag & drop: Személyre szabható elrendezés (Boltvezető+)'
                ],
                isDarkEn: false
            },
            { id: 'dashboard-dark-en', title: 'Dashboard (Dark/EN)', description: '', isDarkEn: true },
            {
                id: 'berles-wizard',
                title: 'Bérlés Wizard',
                description: '5 lépéses bérlési folyamat: Partner → Gépek → Kaució → Összegzés → Nyomtatás. Scan-first paradigma vonalkód olvasással. < 10 perc teljes bérlés felvétel.',
                steps: [
                    '1. PARTNER: Vonalkód scan VAGY telefon/név keresés → Törzsvendég felismerés → Új partner felvétel ha szükséges',
                    '2. GÉPEK: Vonalkód scan → Gép hozzáadás kosárhoz → Tartozékok kiválasztása → Bérlési időszak megadása',
                    '3. KAUCIÓ: Automatikus kalkuláció gép kategória alapján → MyPos terminál fizetés (+2% díj) VAGY készpénz',
                    '4. ÖSSZEGZÉS: Teljes bérlés áttekintés → Kedvezmény alkalmazás (Boltvezető: ±20%) → E-aláírás tablet-en',
                    '5. NYOMTATÁS: Szerződés nyomtatás → Kiadási bizonylat → SMS visszaigazolás küldése'
                ],
                isDarkEn: false
            },
            { id: 'berles-wizard-dark-en', title: 'Rental Wizard (Dark/EN)', description: '', isDarkEn: true },
            {
                id: 'berles-visszavetel',
                title: 'Bérlés Visszavétel',
                description: 'Gép visszavétel flow állapot ellenőrzéssel. Kaució visszaadás vagy kártérítés kalkuláció. Szerviz munkalap trigger sérülés esetén.',
                steps: [
                    '1. AZONOSÍTÁS: Bérlési szerződés vonalkód scan VAGY partner keresés → Aktív bérlések listázása',
                    '2. GÉP ELLENŐRZÉS: Visszavett gépek kijelölése → Állapot felmérés (Ép/Sérült/Hiányos)',
                    '3. FOTÓ DOKUMENTÁCIÓ: 360° fotó készítés (opcionális) → AI-alapú sérülés detektálás',
                    '4. KAUCIÓ DÖNTÉS: Teljes visszaadás | Részleges levonás | Teljes visszatartás → Ok megadás kötelező',
                    '5. SZERVIZ TRIGGER: Sérülés esetén automatikus munkalap létrehozás → Technikus értesítés',
                    '6. LEZÁRÁS: Kaució visszafizetés (készpénz/MyPos) → Bizonylat nyomtatás → Gép újra készleten'
                ],
                isDarkEn: false
            },
            {
                id: 'munkalap',
                title: 'Szerviz Munkalap',
                description: 'Split View layout: lista + részletek egyszerre. Diagnosztika, árajánlat, tárolási díj (30/90 nap), megsemmisítés döntés flow.',
                steps: [
                    '1. FELVÉTEL: Intake típus választás (Garanciális/Fizetős/Árajánlat) → Partner azonosítás → Gép adatok',
                    '2. DIAGNOSZTIKA: Hiba leírás → Fotók csatolás → Becsült javítási idő → Alkatrész igény',
                    '3. ÁRAJÁNLAT: Robbantott ábra alkatrész kiválasztás → Munkadíj (Makita norma) → Ügyfél értesítés',
                    '4. JÓVÁHAGYÁS: Ügyfél döntés (Elfogad/Elutasít/Módosít) → Jóváhagyás rögzítés',
                    '5. JAVÍTÁS: Technikus hozzárendelés → Munkaidő tracking → Státusz frissítés',
                    '6. TÁROLÁSI DÍJ: 30 nap ingyenes → 31-90 nap: 500 Ft/nap → 90+ nap: Megsemmisítés flow',
                    '7. LEZÁRÁS: Végső ellenőrzés → Számla készítés → Ügyfél értesítés → Kiadás'
                ],
                isDarkEn: false
            },
            { id: 'munkalap-dark-en', title: 'Service Workorder (Dark/EN)', description: '', isDarkEn: true },
            {
                id: 'keszlet',
                title: 'Készlet Kezelés',
                description: 'K-P-D kód rendszer (Készlet-Partner-Dokumentum). Multi-location raktárkezelés, vonalkód scan, gyors árumozgatás < 30 mp.',
                steps: [
                    '1. KERESÉS: Vonalkód scan VAGY cikkszám/név keresés → Azonnali készlet megjelenítés',
                    '2. LOKÁCIÓ VÁLASZTÁS: Multi-location nézet (Központ/Bolt/Raktár) → Készlet per lokáció',
                    '3. BEVÉTELEZÉS: Szállítólevél scan → Mennyiség ellenőrzés → Tárhely kiválasztás → Címke nyomtatás',
                    '4. KIADÁS: R.1/R.2 javaslat (legközelebbi tárhely) → Felülbírálás audit trail-lel',
                    '5. ÁTCSOPORTOSÍTÁS: Forrás → Cél lokáció → Mennyiség → Mozgás rögzítés',
                    '6. LELTÁR: Cikkcsoportonkénti leltár → Eltérés kezelés → Leltárív nyomtatás'
                ],
                isDarkEn: false
            },
            { id: 'keszlet-dark-en', title: 'Inventory (Dark/EN)', description: '', isDarkEn: true },
            {
                id: 'penztar',
                title: 'Pénztár',
                description: 'Scanner Focus layout központi scan területtel (60%). Gyors pénztáros műveletek, MyPos integráció, kaució kezelés (+2% díj).',
                steps: [
                    '1. SCAN ZÓNA: Központi vonalkód scan terület (60% képernyő) → Automatikus kontextus felismerés',
                    '2. TRANZAKCIÓ TÍPUS: Eladás | Bérlés kaució | Szerviz díj | Készpénz be/ki',
                    '3. TÉTEL HOZZÁADÁS: Scan → Mennyiség → Kosárba → Folytatás vagy Lezárás',
                    '4. FIZETÉS: Készpénz | Bankkártya (MyPos) | Vegyes → Visszajáró kalkuláció',
                    '5. KAUCIÓ KEZELÉS: MyPos token tárolás (+2% díj) VAGY készpénz → Bizonylat',
                    '6. NAPI ZÁRÁS: Kasszaegyenleg → Készpénz megszámolás → Eltérés kezelés → Zárás'
                ],
                isDarkEn: false
            },
            { id: 'penztar-dark-en', title: 'Cashier (Dark/EN)', description: '', isDarkEn: true },
            {
                id: 'partner-kezelo',
                title: 'Partner Kezelő',
                description: 'Ügyfél/Cég azonosítás törzsvendég kártyával. Loyalty tier megjelenítés (Bronz/Ezüst/Arany). Előzmények és kedvenc gépek.',
                steps: [
                    '1. KERESÉS: Törzsvendég kártya scan | Telefon | Név | Cégnév | Adószám',
                    '2. PROFIL MEGJELENÍTÉS: Személyes adatok → Loyalty tier badge → Kedvenc gépek',
                    '3. ELŐZMÉNYEK: Bérlések | Vásárlások | Szerviz | Reklamációk → Timeline nézet',
                    '4. ÚJ PARTNER: Gyors felvétel (név + telefon) VAGY teljes adatlap (cég, adószám)',
                    '5. MEGHATALMAZOTT: Céges partnernél meghatalmazott személyek kezelése',
                    '6. LOYALTY: Automatikus tier számítás (3+/10+/20+ bérlés) → Kedvezmények'
                ],
                isDarkEn: false
            },
            {
                id: 'arajanlat',
                title: 'Árajánlat',
                description: 'Robbantott ábra tap-to-select alkatrész kiválasztás. Automatikus munkadíj kalkuláció Makita norma szerint. Konverzió követés.',
                steps: [
                    '1. PARTNER VÁLASZTÁS: Meglévő partner kiválasztás VAGY új partner gyors felvétel',
                    '2. GÉP AZONOSÍTÁS: Típus/modell kiválasztás → Robbantott ábra betöltés',
                    '3. ALKATRÉSZ KIVÁLASZTÁS: SVG hotspot tap → Alkatrész hozzáadás → Mennyiség',
                    '4. MUNKADÍJ: Makita normaóra alapján automatikus kalkuláció → Kézi módosítás',
                    '5. ÁRAJÁNLAT GENERÁLÁS: PDF létrehozás → Email küldés → Érvényesség (30 nap)',
                    '6. KONVERZIÓ: Elfogadás → Munkalap létrehozás | Elutasítás → Ok rögzítés'
                ],
                isDarkEn: false
            },
            {
                id: 'riportok',
                title: 'Riportok',
                description: 'Franchise-specifikus dashboard widgetek. Real-time KPI-k, napi/havi összesítők, CSV export funkció.',
                steps: [
                    '1. IDŐSZAK VÁLASZTÁS: Ma | Hét | Hónap | Egyedi dátum tartomány',
                    '2. RIPORT TÍPUS: Bevétel | Bérlés | Szerviz | Készlet | Partner',
                    '3. SZŰRŐK: Bolt/Lokáció | Kategória | Felhasználó | Státusz',
                    '4. VIZUALIZÁCIÓ: Táblázat | Grafikon | KPI kártyák → Interaktív drill-down',
                    '5. EXPORT: CSV | Excel | PDF → Email küldés opcionális',
                    '6. ÜTEMEZÉS: Automata napi/heti riport email (Boltvezető+)'
                ],
                isDarkEn: false
            },
            {
                id: 'login-session',
                title: 'Login & Session',
                description: 'PIN-alapú belépés megosztott pultnál. Kiosk mód választás (közös PIN / egyéni login). 5 perc auto-lock, session kezelés.',
                steps: [
                    '1. ESZKÖZ AZONOSÍTÁS: Kiosk mód (megosztott tablet) VAGY egyéni eszköz',
                    '2. KIOSK BELÉPÉS: 4-6 jegyű PIN kód → Gyors váltás felhasználók között',
                    '3. EGYÉNI BELÉPÉS: Email + jelszó VAGY biometrikus (ujjlenyomat/FaceID)',
                    '4. SESSION KEZELÉS: 5 perc inaktivitás → Auto-lock → PIN újra megadás',
                    '5. ELEVATED ACCESS: Kritikus műveletek (törlés, kedvezmény) → Újra hitelesítés',
                    '6. KIJELENTKEZÉS: Explicit logout VAGY műszakzáráskor automatikus'
                ],
                isDarkEn: false
            },
            {
                id: 'bevasarlolista-widget',
                title: 'Bevásárlólista Widget',
                description: 'Dashboard widget hiányzó alkatrészek gyűjtéséhez. Egy kattintásos hozzáadás munkalapról, szerviz kontextus.',
                steps: [
                    '1. WIDGET MEGNYITÁS: Dashboard-on mini nézet → Kattintás: teljes lista',
                    '2. TÉTEL HOZZÁADÁS: Munkalapról "Bevásárlólistára" gomb → Alkatrész + mennyiség',
                    '3. LISTA SZŰRÉS: Sürgős | Normál | Beszállítónként csoportosítva',
                    '4. RENDELÉS: Beszállító kiválasztás → Rendelés összeállítás → Email/API küldés',
                    '5. BEÉRKEZÉS: Szállítólevél scan → Tételek kipipálás → Lista frissítés',
                    '6. ÉRTESÍTÉS: Munkalap tulajdonos értesítés alkatrész beérkezéskor'
                ],
                isDarkEn: false
            }
        ]
    },
    'admin': {
        name: 'Admin & Konfiguráció',
        icon: '⚙️',
        description: 'Rendszer adminisztráció, franchise konfiguráció, RBAC jogosultságok',
        wireframes: [
            {
                id: 'beallitasok',
                title: 'Beállítások',
                description: 'Rendszer konfiguráció: bolt adatok, nyomtatók, MyPos integráció. Franchise-specifikus paraméterek.',
                steps: [
                    '1. BOLT ADATOK: Név, cím, adószám, elérhetőségek → Számlán megjelenő adatok',
                    '2. NYOMTATÓK: Thermal (nyugta) | A4 (szerződés) | Címke → Teszt nyomtatás',
                    '3. MYPOS: Terminál párosítás → API kulcs → Kaució % beállítás',
                    '4. SZÁMLÁZZ.HU: API integráció → NAV adatszolgáltatás beállítás',
                    '5. ÉRTESÍTÉSEK: SMS/Email sablonok → Küldési szabályok',
                    '6. MENTÉS/VISSZAÁLLÍTÁS: Konfiguráció export/import JSON formátumban'
                ],
                isDarkEn: false
            },
            {
                id: 'felhasznalo-rbac',
                title: 'Felhasználó RBAC',
                description: '7 szerepkör kezelés: Operátor, Technikus, Boltvezető, Franchise Admin, Könyvelő, Super Admin. ±20% kedvezmény jogkör.',
                steps: [
                    '1. FELHASZNÁLÓ LISTA: Aktív/Inaktív szűrés → Szerepkör badge → Utolsó belépés',
                    '2. ÚJ FELHASZNÁLÓ: Alapadatok → Szerepkör hozzárendelés → Bolt hozzárendelés',
                    '3. SZEREPKÖR RÉSZLETEK: Operátor (alap) | Technikus (+szerviz) | Boltvezető (+kedvezmény ±20%)',
                    '4. JOGOSULTSÁGOK: Modul hozzáférés | Művelet engedélyek | Adat láthatóság',
                    '5. PIN KEZELÉS: PIN generálás/reset → Kiosk módhoz',
                    '6. AUDIT: Felhasználói tevékenység napló → Exportálható'
                ],
                isDarkEn: false
            },
            {
                id: 'franchise-config',
                title: 'Franchise Konfiguráció',
                description: 'Multi-tenant beállítások, white label testreszabás, bolt-specifikus árazás és kedvezmények.',
                steps: [
                    '1. TENANT VÁLASZTÁS: Franchise partner kiválasztás → Bolt lista',
                    '2. BRANDING: Logo feltöltés → Színséma (primary/secondary) → Dokumentum fejléc',
                    '3. ÁRAZÁS: Bérlési díjak módosítók → Kedvezmény keretek → Kaució szabályok',
                    '4. MODULOK: Aktív/Inaktív modulok → Feature flag-ek',
                    '5. INTEGRÁCIÓ: Egyedi API végpontok → Webhook-ok → SSO beállítás',
                    '6. LIMITER: Felhasználó limit | Tranzakció limit | Tároló limit'
                ],
                isDarkEn: false
            },
            {
                id: 'koko-admin',
                title: 'Koko AI Admin',
                description: 'AI chatbot konfiguráció, prompt finomhangolás, tudásbázis kezelés, válasz statisztikák.',
                steps: [
                    '1. PERSONA BEÁLLÍTÁS: Név (Koko) → Hangnem → Nyelv → Avatar',
                    '2. TUDÁSBÁZIS: Dokumentumok feltöltés → Indexelés → Frissítés ütemezés',
                    '3. PROMPT ENGINEERING: System prompt szerkesztés → Teszt chat',
                    '4. TILTOTT TÉMÁK: Konkurencia | Árak | Belső folyamatok → Fallback válasz',
                    '5. STATISZTIKÁK: Használat | Legnépszerűbb kérdések | Sikertelenségi ráta',
                    '6. ESCALATION: Emberi támogatásra átadás szabályok'
                ],
                isDarkEn: false
            },
            {
                id: 'rendszer-monitoring',
                title: 'Rendszer Monitoring',
                description: 'Real-time rendszer állapot, offline sync státusz, hiba naplók, teljesítmény metrikák.',
                steps: [
                    '1. DASHBOARD: Rendszer egészség → Zöld/Sárga/Piros státusz per szolgáltatás',
                    '2. SYNC MONITOR: Offline eszközök → Pending sync queue → Last sync time',
                    '3. HIBA NAPLÓ: Error log → Severity szűrés → Stack trace → Értesítés szabályok',
                    '4. TELJESÍTMÉNY: API response time → DB query time → Memory/CPU',
                    '5. AUDIT LOG: Kritikus műveletek → Ki/Mikor/Mit → Export',
                    '6. ALERTING: Slack/Email értesítés küszöbértékeknél'
                ],
                isDarkEn: false
            }
        ]
    },
    'design-system': {
        name: 'Design System',
        icon: '🎨',
        description: 'UI komponensek, színpaletták, gombok, ikonok - konzisztens dizájn alapok',
        wireframes: [
            {
                id: 'color-palette-comparison',
                title: 'Színpaletta',
                description: 'KGC brand színek: Primary (narancs #BF4400), Success (zöld), Warning (sárga), Error (piros). Light/Dark mód változatok.',
                steps: [
                    'PRIMARY: #BF4400 (KGC narancs) → Gombok, linkek, kijelölés',
                    'SUCCESS: #276749 (zöld) → Sikeres műveletek, készleten státusz',
                    'WARNING: #B7791F (sárga) → Figyelmeztetések, lejáró határidők',
                    'ERROR: #C53030 (piros) → Hibák, hiányzó készlet, kritikus',
                    'NEUTRAL: #1A2634 → #F8F9FA (szürke skála) → Háttér, szöveg',
                    'DARK MODE: Invertált színek magas kontraszttal'
                ],
                isDarkEn: false
            },
            {
                id: 'button-styles',
                title: 'Gomb Stílusok',
                description: '60x60px minimum touch target tablet-re. Primary, Secondary, Ghost, Danger variánsok. Disabled és loading állapotok.',
                steps: [
                    'PRIMARY: Teli narancs háttér → Fehér szöveg → Fő műveletek',
                    'SECONDARY: Narancs keret → Narancs szöveg → Másodlagos műveletek',
                    'GHOST: Átlátszó háttér → Szürke szöveg → Tercier műveletek',
                    'DANGER: Piros háttér → Fehér szöveg → Destruktív műveletek',
                    'DISABLED: Halvány színek → cursor: not-allowed',
                    'LOADING: Spinner ikon → Szöveg elhalványul'
                ],
                isDarkEn: false
            },
            {
                id: 'button-styles-3d',
                title: 'Gomb Stílusok (3D)',
                description: '3D hatású gombok kiemelkedő interakciókhoz. Aktív/inaktív állapot vizuális megkülönböztetés.',
                steps: [
                    '3D HATÁS: box-shadow → Kiemelkedő megjelenés',
                    'HOVER: Enyhe emelkedés → shadow növelés',
                    'ACTIVE: Benyomott állapot → shadow csökkentés → transform: translateY(2px)',
                    'FOCUS: Outline ring → Accessibility',
                    'ICON GOMBOK: Négyzet alakú → Központi ikon → Tooltip'
                ],
                isDarkEn: false
            },
            {
                id: 'icon-library-comparison',
                title: 'Ikon Könyvtár',
                description: 'Lucide/Heroicons összehasonlítás. Konzisztens 24px méret, 2px vonalvastagság, rounded corners.',
                steps: [
                    'MÉRET: 16px (inline) | 24px (standard) | 32px (feature)',
                    'STÍLUS: Outline (alapértelmezett) | Solid (kiválasztott állapot)',
                    'VONALVASTAGSÁG: 2px konzisztens minden ikonnál',
                    'SZÍNEZÉS: currentColor → Szöveg színt követi',
                    'ANIMÁCIÓ: Hover scale | Loading spin | Success check'
                ],
                isDarkEn: false
            },
            {
                id: 'ui-components',
                title: 'UI Komponensek',
                description: 'Form elemek, kártyák, táblázatok, modálok. shadcn/ui alapú komponens könyvtár.',
                steps: [
                    'INPUT: Text | Number | Date | Select → Konzisztens 44px magasság',
                    'KÁRTYA: Fehér háttér → Árnyék → 8px border-radius',
                    'TÁBLÁZAT: Sortable fejléc → Hover sor → Pagination',
                    'MODAL: Overlay → Centered → Max 600px szélesség',
                    'TOAST: Jobb alsó sarok → Auto-dismiss 5s → Swipe to close',
                    'SKELETON: Loading placeholder → Pulse animáció'
                ],
                isDarkEn: false
            },
            {
                id: 'light-dark-mode-comparison',
                title: 'Light/Dark Mód',
                description: 'Automatikus téma váltás rendszerbeállítás alapján. Magas kontraszt változat opcionális.',
                steps: [
                    'AUTO DETEKT: prefers-color-scheme media query',
                    'MANUÁLIS: Toggle gomb header-ben → localStorage mentés',
                    'LIGHT: Világos háttér (#F8F9FA) → Sötét szöveg (#1A2634)',
                    'DARK: Sötét háttér (#1A2634) → Világos szöveg (#F8F9FA)',
                    'KONTRASZT: WCAG AA minimum → AAA ajánlott',
                    'ÁTMENET: 200ms transition → Smooth váltás'
                ],
                isDarkEn: false
            }
        ]
    },
    'integracios': {
        name: 'Integrációk',
        icon: '🔗',
        description: 'Külső rendszer integrációk: CRM, AI chatbot, email feldolgozás, audit',
        wireframes: [
            {
                id: 'koko-chatbot',
                title: 'Koko AI Chatbot',
                description: 'Floating AI widget jobb alsó sarokban. Természetes nyelvi keresés ("Kovács úr bérlései"). Context-aware ajánlások.',
                steps: [
                    '1. WIDGET MEGJELENÉS: Jobb alsó sarok → Floating gomb → Koko avatar',
                    '2. CHAT MEGNYITÁS: Kattintás → Chat ablak kinyílik → Üdvözlő üzenet',
                    '3. KÉRDÉS FELTEVÉS: Természetes nyelvi input → "Kovács úr bérlései" típusú',
                    '4. VÁLASZ: Strukturált válasz → Kártyák | Lista | Link a részletekhez',
                    '5. KONTEXTUS: Aktuális képernyő alapján releváns javaslatok',
                    '6. ESCALATION: "Segítséget kérek" → Chatwoot ticket létrehozás'
                ],
                isDarkEn: false
            },
            {
                id: 'crm-twenty',
                title: 'Twenty CRM',
                description: 'Ügyfélkapcsolat kezelés iframe integrációval. Sales pipeline, lead tracking, ügyfél interakciók.',
                steps: [
                    '1. INTEGRÁCIÓ: iframe beágyazás → SSO belépés → Kontextus átadás',
                    '2. PARTNER SZINKRON: KGC partner → Twenty contact → Kétirányú sync',
                    '3. PIPELINE: Lead → Opportunity → Quote → Won/Lost',
                    '4. INTERAKCIÓK: Hívások | Emailek | Találkozók → Timeline',
                    '5. RIPORTOK: Sales dashboard → Konverziós ráták → Forecast',
                    '6. AUTOMATIZÁCIÓ: Workflow triggers → Email szekvenciák'
                ],
                isDarkEn: false
            },
            {
                id: 'email-feldolgozas',
                title: 'Email Feldolgozás',
                description: 'Bejövő email szálak automatikus feldolgozása. Partner azonosítás, téma kategorizálás, ticket létrehozás.',
                steps: [
                    '1. BEÉRKEZÉS: IMAP/webhook → Email beolvasás → Queue-ba helyezés',
                    '2. PARTNER AZONOSÍTÁS: Feladó email → Partner keresés → Létrehozás ha új',
                    '3. KATEGORIZÁLÁS: AI-alapú téma felismerés → Érdeklődés | Reklamáció | Szerviz',
                    '4. TICKET LÉTREHOZÁS: Chatwoot ticket → Prioritás beállítás → Hozzárendelés',
                    '5. SZÁL KÖVETÉS: Conversation thread → Válasz összekapcsolás',
                    '6. VÁLASZ: Template-ek → Személyre szabás → Küldés tracking'
                ],
                isDarkEn: false
            },
            {
                id: '3d-photo',
                title: '3D Fotó & AI',
                description: '360° termék fotózás sérülés dokumentáláshoz. AI-alapú állapot elemzés, automatikus kár detektálás.',
                steps: [
                    '1. FOTÓ INDÍTÁS: Kamera megnyitás → 360° útmutató overlay',
                    '2. KÉPKÉSZÍTÉS: 8-12 kép körbeforgás közben → Auto-capture',
                    '3. AI ELEMZÉS: Képek feltöltés → Sérülés detektálás → Annotáció',
                    '4. EREDMÉNY: Sérülés típus | Súlyosság | Lokáció → Vizuális jelölés',
                    '5. ÖSSZEHASONLÍTÁS: Kiadáskori vs visszavételi állapot',
                    '6. RIPORT: PDF generálás → Kártérítés alátámasztás'
                ],
                isDarkEn: false
            },
            {
                id: 'audit-log',
                title: 'Audit Log',
                description: 'Minden művelet naplózása compliance céljából. Felhasználó, időpont, művelet típus, előtte/utána értékek.',
                steps: [
                    '1. AUTOMATIKUS NAPLÓZÁS: Minden CRUD művelet → Timestamp + User ID',
                    '2. ADAT SNAPSHOT: Módosítás előtti + utáni érték → JSON diff',
                    '3. SZŰRÉS: Időszak | Felhasználó | Entitás típus | Művelet típus',
                    '4. KERESÉS: Full-text search → Partner név, vonalkód, stb.',
                    '5. EXPORT: CSV | JSON → Könyvelő/NAV ellenőrzéshez',
                    '6. MEGŐRZÉS: 7 év retention → Archiválás → Törlés védelem'
                ],
                isDarkEn: false
            }
        ]
    },
    'uj-modulok': {
        name: 'Új Modulok',
        icon: '🆕',
        description: 'v7.0 új funkciók: ÁFA döntés, avizó, jármű nyilvántartás, tárolási díj',
        wireframes: [
            {
                id: 'afa-dontes',
                title: 'ÁFA Döntés',
                description: 'Nulla százalék ÁFA kezelés export esetén. Automatikus ÁFA kategória javaslat, manuális felülbírálás audit trail-lel.',
                steps: [
                    '1. SZÁMLA LÉTREHOZÁS: Partner ország ellenőrzés → EU/Nem-EU meghatározás',
                    '2. AUTO JAVASLAT: Belföldi: 27% | EU B2B: 0% (reverse charge) | Export: 0%',
                    '3. DOKUMENTUM ELLENŐRZÉS: EU adószám validálás VIES-en → Érvényesség',
                    '4. FELÜLBÍRÁLÁS: Manuális ÁFA módosítás → Ok megadás kötelező',
                    '5. AUDIT TRAIL: Minden ÁFA döntés naplózva → Ki/Mikor/Miért',
                    '6. NAV ADATSZOLGÁLTATÁS: Automatikus beküldés → Státusz követés'
                ],
                isDarkEn: false
            },
            {
                id: 'avizo-feldolgozas',
                title: 'Avizó Feldolgozás',
                description: 'Banki avizó PDF upload és automatikus párosítás. ±0.5% tolerancia, kézi egyeztetés felület eltérés esetén.',
                steps: [
                    '1. PDF FELTÖLTÉS: Banki kivonat drag & drop → OCR feldolgozás',
                    '2. TRANZAKCIÓ KINYERÉS: Dátum | Összeg | Közlemény | Partner',
                    '3. AUTO PÁROSÍTÁS: P5 algoritmus (40+35+15+10 pont) → Match score',
                    '4. TOLERANCIA: ±0.5% eltérés elfogadott → Auto-match',
                    '5. KÉZI EGYEZTETÉS: Nem egyező tételek listázása → Manuális párosítás',
                    '6. LEZÁRÁS: Minden tétel párosítva → Időszak zárás → Riport'
                ],
                isDarkEn: false
            },
            {
                id: 'jarmu-nyilvantartas',
                title: 'Jármű Nyilvántartás',
                description: 'Céges járművek kezelése: rendszám, km óra, szerviz előzmények, biztosítás lejárat figyelmeztetés.',
                steps: [
                    '1. JÁRMŰ FELVÉTEL: Rendszám | Típus | Alvázszám | Forgalmi érvényesség',
                    '2. KM ÓRA KÖVETÉS: Tankoláskor rögzítés → Fogyasztás számítás',
                    '3. SZERVIZ ELŐZMÉNYEK: Olajcsere | Gumi | Fék | Egyéb → Határidő figyelmeztetés',
                    '4. BIZTOSÍTÁS: Kötelező | Casco → Lejárat előtt 30 nap értesítés',
                    '5. KÖLTSÉG KÖVETÉS: Tankolás | Szerviz | Biztosítás → Jármű per költség',
                    '6. SOFŐR HOZZÁRENDELÉS: Ki használja → Használati napló'
                ],
                isDarkEn: false
            },
            {
                id: 'tarolasi-dij',
                title: 'Tárolási Díj',
                description: 'Szerviz tárolási díj: 30 nap ingyenes → 31-90 nap fizetős → 90+ megsemmisítés. 3x értesítés (14/7/1 nap), timer display.',
                steps: [
                    '1. TIMER INDÍTÁS: Munkalap "Vár ügyfélre" státusz → Számláló indul',
                    '2. INGYENES IDŐSZAK: 0-30 nap → Nincs díj → Zöld státusz',
                    '3. FIZETŐS IDŐSZAK: 31-90 nap → 500 Ft/nap → Sárga státusz',
                    '4. ÉRTESÍTÉSEK: 14 nap | 7 nap | 1 nap a fizetős időszak előtt → SMS/Email',
                    '5. MEGSEMMISÍTÉS FLOW: 90+ nap → Boltvezető javaslat → Admin jóváhagyás',
                    '6. DÖNTÉS: SOLD (eladás) | PARTS (alkatrész) | WASTE (hulladék) → Dokumentálás'
                ],
                isDarkEn: false
            }
        ]
    }
};

// Read all SVG files from a category directory
function loadCategorySVGs(categoryId) {
    const svgs = {};
    const categoryDir = path.join(BASE_DIR, categoryId);

    if (!fs.existsSync(categoryDir)) {
        console.warn(`Warning: Directory ${categoryDir} does not exist`);
        return svgs;
    }

    const files = fs.readdirSync(categoryDir).filter(f => f.endsWith('.svg'));

    for (const file of files) {
        const id = file.replace('.svg', '');
        const content = fs.readFileSync(path.join(categoryDir, file), 'utf8');
        // Clean SVG: remove XML declaration and make it inline-friendly
        let cleanSvg = content
            .replace(/<\?xml[^?]*\?>/g, '')
            .replace(/<!DOCTYPE[^>]*>/g, '')
            .trim();

        // Add unique ID to SVG root element
        cleanSvg = cleanSvg.replace('<svg', `<svg id="svg-${categoryId}-${id}"`);

        svgs[id] = cleanSvg;
    }

    return svgs;
}

// Load all SVGs from all categories
function loadAllSVGs() {
    const allSvgs = {};

    for (const categoryId of Object.keys(CATEGORIES)) {
        allSvgs[categoryId] = loadCategorySVGs(categoryId);
    }

    return allSvgs;
}

// Count wireframes
function countWireframes() {
    let total = 0;
    let magyar = 0;
    let darkEn = 0;

    for (const category of Object.values(CATEGORIES)) {
        for (const wf of category.wireframes) {
            total++;
            if (wf.isDarkEn) darkEn++;
            else magyar++;
        }
    }

    return { total, magyar, darkEn };
}

// Generate the HTML
function generateHTML(allSvgs) {
    const counts = countWireframes();
    const today = new Date().toISOString().split('T')[0];

    return `<!DOCTYPE html>
<html lang="hu" x-data="appData()" :class="{ 'dark': darkMode }">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>KGC ERP v7.0 - Wireframes (${today})</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script defer src="https://cdn.jsdelivr.net/npm/@alpinejs/collapse@3.x.x/dist/cdn.min.js"></script>
    <script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"></script>
    <script>tailwind.config = { darkMode: 'class' }</script>
    <style>
        body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; }
        .dark { background-color: rgb(17 24 39); color: rgb(243 244 246); }
        .sticky-sidebar { position: sticky; top: 1.5rem; max-height: calc(100vh - 3rem); overflow-y: auto; }
        .wireframe-container { background: white; border: 2px solid #e5e7eb; border-radius: 12px; padding: 1.5rem; margin: 1.5rem 0; }
        .dark .wireframe-container { background: rgb(31 41 55); border-color: rgb(55 65 81); }
        .wireframe-wrapper { background: #f9fafb; border-radius: 0.5rem; padding: 1rem; overflow: auto; }
        .dark .wireframe-wrapper { background: #2d3748; }
        .wireframe-wrapper svg { display: block; margin: 0 auto; max-width: 100%; height: auto; }
        .description-box { background: linear-gradient(to right, #eff6ff, #dbeafe); border-left: 4px solid #3b82f6; padding: 1rem; border-radius: 8px; }
        .dark .description-box { background: linear-gradient(to right, rgb(30 58 138 / 0.5), rgb(29 78 216 / 0.5)); }
        .notes-box { background: #fefce8; border: 1px solid #fde047; padding: 0.75rem; border-radius: 8px; margin-top: 0.75rem; }
        .dark .notes-box { background: rgb(113 63 18 / 0.3); border-color: rgb(202 138 4); }
        @media print { .no-print { display: none !important; } }
    </style>
</head>
<body class="bg-gray-50 dark:bg-gray-900">
    <header class="bg-gradient-to-r from-orange-500 via-orange-600 to-red-600 text-white shadow-lg no-print">
        <div class="container mx-auto px-4 py-6">
            <div class="flex flex-col lg:flex-row justify-between items-center">
                <div class="text-center lg:text-left mb-4 lg:mb-0">
                    <h1 class="text-3xl font-bold">KGC ERP v7.0 - Wireframes</h1>
                    <p class="mt-1 text-orange-100">UX Design Specification | PWA Tablet-First | Scan-First Paradigma</p>
                    <p class="text-sm mt-2">
                        <span class="bg-white/20 px-2 py-1 rounded mr-2">📐 ${counts.total} wireframe</span>
                        <span class="bg-blue-500 px-2 py-1 rounded mr-2">🇭🇺 ${counts.magyar} magyar</span>
                        <span class="bg-gray-600 px-2 py-1 rounded mr-2">🌙 ${counts.darkEn} dark/EN</span>
                        <span class="bg-green-500 px-2 py-1 rounded">📅 ${today}</span>
                    </p>
                </div>
                <div class="flex space-x-3">
                    <button @click="darkMode = !darkMode" class="p-3 bg-white/20 hover:bg-white/30 rounded-lg transition-colors" title="Sötét/Világos mód">
                        <span x-text="darkMode ? '☀️' : '🌙'"></span>
                    </button>
                    <button @click="exportNotes()" class="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors">�� Megjegyzések Export</button>
                </div>
            </div>
        </div>
    </header>

    <!-- UX Summary Banner -->
    <div class="bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 border-b border-blue-200 dark:border-blue-800 no-print">
        <div class="container mx-auto px-4 py-4">
            <h2 class="text-lg font-bold text-blue-800 dark:text-blue-200 mb-2">🎯 UX Design Prioritások</h2>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div class="bg-white/50 dark:bg-gray-800/50 p-3 rounded-lg">
                    <h3 class="font-bold text-orange-600">⚡ Gyorsaság</h3>
                    <ul class="mt-1 text-gray-700 dark:text-gray-300">
                        <li>• < 10 perc bérlés felvétel</li>
                        <li>• < 30 mp árumozgatás</li>
                        <li>• 3 tap maximum tranzakció</li>
                    </ul>
                </div>
                <div class="bg-white/50 dark:bg-gray-800/50 p-3 rounded-lg">
                    <h3 class="font-bold text-green-600">📱 Scan-First</h3>
                    <ul class="mt-1 text-gray-700 dark:text-gray-300">
                        <li>• Minden vonalkóddal kezdődik</li>
                        <li>• Auto kontextus felismerés</li>
                        <li>• K-P-D kód rendszer</li>
                    </ul>
                </div>
                <div class="bg-white/50 dark:bg-gray-800/50 p-3 rounded-lg">
                    <h3 class="font-bold text-purple-600">📴 Offline-Ready</h3>
                    <ul class="mt-1 text-gray-700 dark:text-gray-300">
                        <li>• PWA Service Worker</li>
                        <li>• Background sync</li>
                        <li>• Zéró adatvesztés</li>
                    </ul>
                </div>
            </div>
        </div>
    </div>

    <div class="container mx-auto px-4 py-8">
        <div class="grid grid-cols-12 gap-6">
            <aside class="col-span-12 lg:col-span-3 no-print">
                <div class="sticky-sidebar bg-white dark:bg-gray-800 p-4 rounded-xl shadow-lg">
                    <h2 class="text-lg font-bold mb-4 flex items-center">
                        <span class="mr-2">📂</span> Kategóriák
                    </h2>
                    <div class="space-y-2">
${Object.entries(CATEGORIES).map(([id, cat]) => `                        <button @click="activeTab = '${id}'"
                            :class="activeTab === '${id}' ? 'bg-orange-600 text-white' : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'"
                            class="w-full text-left px-3 py-2 rounded-lg text-sm transition-colors">
                            ${cat.icon} ${cat.name} (${cat.wireframes.length})
                        </button>`).join('\n')}
                    </div>
                    <p class="mt-4 text-xs text-gray-500 dark:text-gray-400">💡 Megjegyzések localStorage-ban mentődnek</p>
                </div>
            </aside>

            <main class="col-span-12 lg:col-span-9">
${Object.entries(CATEGORIES).map(([categoryId, category]) => {
    const catSvgs = allSvgs[categoryId] || {};
    return `
                <!-- ${category.name.toUpperCase()} SECTION -->
                <div x-show="activeTab === '${categoryId}'" class="space-y-6">
                    <div class="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border-l-4 border-orange-500">
                        <div class="flex justify-between items-start">
                            <div>
                                <h2 class="text-2xl font-bold">${category.icon} ${category.name} <span class="ml-2 px-2 py-1 bg-orange-500 text-white text-xs rounded-full">${category.wireframes.length} wireframe</span></h2>
                                <p class="text-gray-600 dark:text-gray-400 mt-2">${category.description}</p>
                            </div>
                            <div class="flex gap-2">
                                <button @click="expandAllInTab('${categoryId}')"
                                        class="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition-colors">
                                    ➕ Összes megnyitása
                                </button>
                                <button @click="collapseAllInTab('${categoryId}')"
                                        class="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white text-sm rounded-lg transition-colors">
                                    ➖ Összes bezárása
                                </button>
                            </div>
                        </div>
                    </div>

${category.wireframes.map(wf => {
    const svg = catSvgs[wf.id];
    if (!svg) {
        console.warn(`Warning: SVG not found for ${categoryId}/${wf.id}`);
        return '';
    }

    const wireframeId = `${categoryId}-${wf.id}`;
    const badgeClass = wf.isDarkEn ? 'bg-gray-600' : 'bg-blue-500';
    const badgeText = wf.isDarkEn ? '🌙 Dark/EN' : '🇭🇺 Magyar';

    return `
                    <!-- Wireframe: ${wf.title} -->
                    <div class="wireframe-container" id="${wireframeId}">
                        <div class="flex justify-between items-start mb-4">
                            <h3 class="text-xl font-semibold">
                                ${wf.title}
                                <span class="ml-2 px-3 py-1 ${badgeClass} text-white text-sm rounded-full">${badgeText}</span>
                            </h3>
                            <button @click="expanded['${wireframeId}'] = !expanded['${wireframeId}']"
                                    class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors">
                                <span x-text="expanded['${wireframeId}'] ? '➖ Bezár' : '➕ Megnyit'"></span>
                            </button>
                        </div>
${wf.description ? `
                        <div class="description-box mb-3">
                            <p class="text-sm"><strong>📋 Leírás:</strong> ${wf.description}</p>
${wf.steps && wf.steps.length > 0 ? `
                            <details class="mt-3">
                                <summary class="cursor-pointer font-medium text-blue-700 dark:text-blue-300 hover:text-blue-900">
                                    📝 Lépések megjelenítése (${wf.steps.length} lépés)
                                </summary>
                                <ul class="mt-2 space-y-1 text-sm text-gray-700 dark:text-gray-300 pl-4">
${wf.steps.map(step => `                                    <li class="border-l-2 border-blue-300 pl-3 py-1">${step}</li>`).join('\n')}
                                </ul>
                            </details>
` : ''}
                        </div>
` : ''}
                        <div x-show="expanded['${wireframeId}']" x-collapse>
                            <div class="wireframe-wrapper">
                                ${svg}
                            </div>

                            <!-- Notes Section -->
                            <div class="notes-box">
                                <label class="block text-sm font-medium mb-1">📝 Megjegyzések:</label>
                                <textarea
                                    x-model="notes['${wireframeId}']"
                                    @input="saveNotes()"
                                    class="w-full p-2 border rounded-lg bg-white dark:bg-gray-700 dark:border-gray-600 text-sm"
                                    rows="2"
                                    placeholder="Írj ide megjegyzést ehhez a wireframe-hez..."
                                ></textarea>
                            </div>
                        </div>
                    </div>`;
}).join('\n')}
                </div>`;
}).join('\n')}
            </main>
        </div>
    </div>

    <!-- Footer -->
    <footer class="bg-gray-800 text-white py-6 mt-8 no-print">
        <div class="container mx-auto px-4 text-center">
            <p class="text-gray-400">KGC ERP v7.0 Wireframes | Generálva: ${today}</p>
            <p class="text-sm text-gray-500 mt-1">UX Designer: Sally | Based on UX Design Specification v2.0</p>
        </div>
    </footer>

    <script>
        function appData() {
            return {
                darkMode: window.matchMedia('(prefers-color-scheme: dark)').matches,
                activeTab: 'core',
                expanded: {},
                notes: JSON.parse(localStorage.getItem('kgc-wireframe-notes') || '{}'),

                init() {
                    // Initialize expanded state for all wireframes
                    const wireframeIds = ${JSON.stringify(
                        Object.entries(CATEGORIES).flatMap(([catId, cat]) =>
                            cat.wireframes.map(wf => `${catId}-${wf.id}`)
                        )
                    )};
                    wireframeIds.forEach(id => {
                        if (this.expanded[id] === undefined) {
                            this.expanded[id] = false;
                        }
                    });
                },

                expandAllInTab(tabId) {
                    const category = ${JSON.stringify(Object.fromEntries(
                        Object.entries(CATEGORIES).map(([id, cat]) => [id, cat.wireframes.map(wf => `${id}-${wf.id}`)])
                    ))}[tabId] || [];
                    category.forEach(id => this.expanded[id] = true);
                },

                collapseAllInTab(tabId) {
                    const category = ${JSON.stringify(Object.fromEntries(
                        Object.entries(CATEGORIES).map(([id, cat]) => [id, cat.wireframes.map(wf => `${id}-${wf.id}`)])
                    ))}[tabId] || [];
                    category.forEach(id => this.expanded[id] = false);
                },

                saveNotes() {
                    localStorage.setItem('kgc-wireframe-notes', JSON.stringify(this.notes));
                },

                exportNotes() {
                    const data = Object.entries(this.notes)
                        .filter(([_, note]) => note && note.trim())
                        .map(([id, note]) => \`"\${id}","\${note.replace(/"/g, '""')}"\`)
                        .join('\\n');

                    const csv = 'Wireframe ID,Megjegyzés\\n' + data;
                    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = 'kgc-wireframe-notes-${today}.csv';
                    link.click();
                }
            };
        }
    </script>
</body>
</html>`;
}

// Main execution
console.log('🎨 KGC ERP Wireframes Portable HTML Generator');
console.log('=' .repeat(50));

const allSvgs = loadAllSVGs();
const counts = countWireframes();

console.log(`📊 Loaded ${counts.total} wireframes (${counts.magyar} magyar, ${counts.darkEn} dark/EN)`);

for (const [catId, cat] of Object.entries(CATEGORIES)) {
    const loaded = Object.keys(allSvgs[catId] || {}).length;
    const expected = cat.wireframes.length;
    const status = loaded === expected ? '✅' : '⚠️';
    console.log(`   ${status} ${cat.name}: ${loaded}/${expected} SVG`);
}

const html = generateHTML(allSvgs);
fs.writeFileSync(OUTPUT_FILE, html, 'utf8');

console.log('');
console.log(`✅ Generated: ${OUTPUT_FILE}`);
console.log(`📏 File size: ${(fs.statSync(OUTPUT_FILE).size / 1024 / 1024).toFixed(2)} MB`);
