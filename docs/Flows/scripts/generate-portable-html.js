#!/usr/bin/env node
/**
 * KGC ERP Portable Interactive HTML Generator
 * Generates a fully self-contained HTML file with ALL SVGs embedded inline
 * No external dependencies - completely portable
 *
 * Usage: node generate-portable-html.js
 */

const fs = require('fs');
const path = require('path');

const DIAGRAMS_DIR = path.join(__dirname, '..', 'diagrams');
const OUTPUT_FILE = path.join(__dirname, '..', 'KGC-ERP-Portable-2025-12-14.html');

// Read all SVG files and store them
function loadAllSVGs() {
    const svgs = {};
    const files = fs.readdirSync(DIAGRAMS_DIR).filter(f => f.endsWith('.svg'));

    for (const file of files) {
        const id = file.replace('.svg', '');
        const content = fs.readFileSync(path.join(DIAGRAMS_DIR, file), 'utf8');
        // Clean SVG: remove XML declaration and make it inline-friendly
        let cleanSvg = content
            .replace(/<\?xml[^?]*\?>/g, '')
            .replace(/<!DOCTYPE[^>]*>/g, '')
            .trim();

        // Add unique ID to SVG root element
        cleanSvg = cleanSvg.replace('<svg', `<svg id="svg-${id}"`);

        svgs[id] = cleanSvg;
    }

    return svgs;
}

// Module definitions with their diagrams
const MODULES = {
    'master': {
        name: 'Master Áttekintés',
        description: 'KGC ERP v3.0 teljes rendszer átfogó folyamatábrája',
        isNew: true,
        related: ['berles', 'eladas', 'p5', 'ertesitesek'],
        diagrams: [
            { id: '00-kgc-erp-master-flow-2025-12-12', title: 'KGC ERP Master Flow', description: 'Teljes rendszer egy diagramon', status: 'new' }
        ]
    },
    'berles': {
        name: 'Bérlés',
        description: 'Bérgép kiadás, kaució kezelés, MyPos integráció, tartozék checklist',
        isNew: false,
        related: ['eladas', 'kiadasi', 'visszavetel'],
        diagrams: [
            { id: '1-ugyfelfelvitel-folyamat', title: 'Bérlési Folyamat (Alap)', description: 'Eredeti bérlési folyamat', status: null },
            { id: '1-ugyfelfelvitel-folyamat-2025-12-11', title: 'Bérlési Folyamat v3.0', description: 'MyPos kaució integrációval', status: 'modified' },
            { id: '01-ugyfelfelvitel-folyamat-2025-12-12', title: 'Bérlés + R.1/R.2', description: 'Kiadási javaslat integrációval', status: 'new' },
            { id: '1-ugyfelfelvitel-erd', title: 'Bérlés ERD (Alap)', description: 'Eredeti adatmodell', status: null },
            { id: '1-ugyfelfelvitel-erd-2025-12-11', title: 'Bérlés ERD v3.0', description: 'Új entitásokkal', status: 'modified' },
            { id: '1-ugyfelfelvitel-dontesi-fa', title: 'Döntési Fa (Alap)', description: 'Eredeti döntési logika', status: null },
            { id: '1-ugyfelfelvitel-dontesi-fa-2025-12-11', title: 'Döntési Fa v3.0', description: 'Kaució és meghatalmazott döntések', status: 'modified' },
            { id: '1-ugyfelfelvitel-dfd', title: 'Adatfolyam (DFD)', description: 'Adatok mozgása a rendszerben', status: null },
            { id: '1-ugyfelfelvitel-rendszer', title: 'Rendszer Áttekintés', description: 'Teljes rendszer komponensek', status: null }
        ]
    },
    'eladas': {
        name: 'Eladás',
        description: 'Termék értékesítés, számlázás, NAV integráció',
        isNew: false,
        related: ['berles', 'kiadasi', 'bevetelezes'],
        diagrams: [
            { id: '2-ertekesites-folyamat', title: 'Értékesítési Folyamat', description: 'Alap értékesítési folyamat', status: null },
            { id: '02-ertekesites-folyamat-2025-12-12', title: 'Értékesítés + R.1/R.2', description: 'Multi-location támogatással', status: 'new' },
            { id: '2-ertekesites-erd', title: 'Értékesítés ERD', description: 'Alap adatmodell', status: null },
            { id: '02-ertekesites-erd-2025-12-12', title: 'Értékesítés ERD v3.0', description: 'CIKK, KÉSZLET_MOZGÁS módosítások', status: 'modified' },
            { id: '2-ertekesites-keszlet', title: 'Készlet Kezelés', description: 'Készlet mozgások', status: null }
        ]
    },
    'szerviz': {
        name: 'Szerviz',
        description: 'Munkalap felvétel, javítás, intake_type kezelés (warranty/repair/quote)',
        isNew: false,
        related: ['garancia', 'ertesitesek'],
        diagrams: [
            { id: '4-szerviz-folyamat', title: 'Szerviz Folyamat', description: 'Munkalap felvételtől lezárásig', status: null },
            { id: '4-szerviz-erd', title: 'Szerviz ERD', description: 'Alap adatmodell', status: null },
            { id: '4-szerviz-erd-2025-12-11', title: 'Szerviz ERD v3.0', description: 'intake_type és tartozék checklist', status: 'modified' },
            { id: '4-szerviz-munkalap', title: 'Munkalap Részletek', description: 'Munkalap struktúra és státusz', status: null }
        ]
    },
    'bergep': {
        name: 'Bérgép Kezelés',
        description: 'Bérgépek nyilvántartása, árazás, tartozékok',
        isNew: false,
        related: ['berles', 'szerviz'],
        diagrams: [
            { id: '3-bergep-folyamat', title: 'Bérgép Folyamat', description: 'Alap bérgép kezelés', status: null },
            { id: '3-bergep-folyamat-2025-12-11', title: 'Bérgép v3.0', description: 'Hétvége árazás, tartozékok', status: 'modified' }
        ]
    },
    'arajanlat': {
        name: 'Árajánlat',
        description: 'Árkalkuláció, ajánlat készítés, konverzió rendelésre',
        isNew: true,
        related: ['eladas', 'szerviz'],
        diagrams: []
    },
    'visszavetel': {
        name: 'Visszavétel',
        description: 'Bérlés lezárás, kaució visszaadás, kár ellenőrzés',
        isNew: false,
        related: ['berles', 'p5'],
        diagrams: [
            { id: '1-ugyfelfelvitel-dontesi-fa-2025-12-11', title: 'Visszavétel Döntési Fa', description: 'Kaució visszafizetés szabályok', status: 'modified' }
        ]
    },
    'kiadasi': {
        name: 'R.1/R.2 Kiadási Javaslat',
        description: 'Automatikus tárhely optimalizáció, készlet prioritás, felülbírálás audit',
        isNew: true,
        related: ['berles', 'eladas', 'leltar', 'atcsoportositas'],
        diagrams: [
            { id: '2-keszlet-multi-location-erd-2025-12-12', title: 'Multi-location ERD', description: 'KÉSZLET_HELY entitás', status: 'new' },
            { id: '2-kiadasi-optimalizacio-folyamat-2025-12-12', title: 'Kiadási Optimalizáció', description: 'R.1/R.2 algoritmus folyamat', status: 'new' }
        ]
    },
    'leltar': {
        name: 'Leltár',
        description: 'Készlet ellenőrzés, eltérés kezelés, riportok',
        isNew: true,
        related: ['kiadasi', 'atcsoportositas', 'bevetelezes'],
        diagrams: []
    },
    'atcsoportositas': {
        name: 'Átcsoportosítás',
        description: 'Tárhely közötti mozgatás, KÉSZLET_MOZGÁS típus: T',
        isNew: true,
        related: ['kiadasi', 'leltar', 'bevetelezes'],
        diagrams: []
    },
    'bevetelezes': {
        name: 'Bevételezés',
        description: 'Készlet feltöltés, tárhely megadás, KÉSZLET_HELY növelés',
        isNew: true,
        related: ['kiadasi', 'eladas', 'atcsoportositas'],
        diagrams: []
    },
    'p5': {
        name: 'P5 Elszámolás',
        description: 'Bank/Futár tranzakció párosítás, pontozási rendszer (40+35+15+10=100)',
        isNew: true,
        related: ['ertesitesek', 'berles', 'eladas'],
        diagrams: [
            { id: '5-automatizalt-elszamolas-erd-2025-12-12', title: 'Elszámolás ERD', description: 'BANK_TRANZAKCIÓ, PÁROSÍTÁS_LOG', status: 'new' },
            { id: '5-automatizalt-elszamolas-folyamat-2025-12-12', title: 'Elszámolás Folyamat', description: 'P5.1-P5.5 lépések', status: 'new' },
            { id: '05-penzugy-folyamat-2025-12-12', title: 'Pénzügy Folyamat', description: 'P5 integráció', status: 'modified' },
            { id: '5-penzugy-folyamat', title: 'Pénzügy Alap', description: 'Alap pénzügyi folyamat', status: null },
            { id: '5-penzugy-archivalas', title: 'Archiválás', description: 'Dokumentum archiválás', status: null }
        ]
    },
    'ertesitesek': {
        name: 'N.3 Értesítések',
        description: 'SMS, Email, PWA Push - Firebase FCM, Service Worker, offline',
        isNew: true,
        related: ['p5', 'szerviz'],
        diagrams: [
            { id: '07-ertesitesek-erd-2025-12-12', title: 'Értesítések ERD', description: 'PUSH_SUBSCRIPTION entitás', status: 'modified' },
            { id: '7-ertesitesek-folyamat-2025-12-12', title: 'Push Értesítések', description: 'N.3 PWA Push folyamat', status: 'new' },
            { id: '7-ertesitesek-folyamat', title: 'Értesítések Alap', description: 'Alap értesítési rendszer', status: null }
        ]
    },
    'partner': {
        name: 'Partner Kezelés',
        description: 'Ügyfél/Cég azonosítás, meghatalmazott kezelés',
        isNew: false,
        related: ['berles', 'eladas'],
        diagrams: [
            { id: '1-ugyfelfelvitel-erd-2025-12-11', title: 'Partner ERD', description: 'PARTNER, CÉG, MEGHATALMAZOTT', status: 'modified' },
            { id: '1-ugyfelfelvitel-erd', title: 'Partner ERD Alap', description: 'Alap partner adatmodell', status: null }
        ]
    },
    'garancia': {
        name: 'Garanciális Javítás',
        description: 'intake_type=warranty, 0 Ft bevizsgálási díj',
        isNew: false,
        related: ['szerviz'],
        diagrams: [
            { id: '8-garancialis-javitas-2025-12-11', title: 'Garanciális Folyamat', description: 'Garanciális javítás intake_type-pal', status: 'modified' },
            { id: '8-garancialis-javitas', title: 'Garanciális Alap', description: 'Alap garanciális folyamat', status: null }
        ]
    },
    'felhasznalo': {
        name: 'Felhasználó Kezelés',
        description: '3-szintű login rendszer, PIN kód',
        isNew: false,
        related: ['partner'],
        diagrams: [
            { id: '6-egyeb-felhasznalo-2025-12-11', title: 'Felhasználó v3.0', description: '3-szintű login, PIN kód', status: 'modified' },
            { id: '6-egyeb-felhasznalo', title: 'Felhasználó Alap', description: 'Alap felhasználó kezelés', status: null },
            { id: '6-egyeb-rendeles', title: 'Rendelés Kezelés', description: 'Beszerzési rendelések', status: null }
        ]
    },
    'architektura': {
        name: 'Architektúra',
        description: 'Multi-tenant, holding struktúra, deployment',
        isNew: false,
        related: ['p5', 'ertesitesek'],
        diagrams: [
            { id: '11-multi-tenant-sema-struktura-2025-12-11', title: 'Multi-tenant Séma', description: 'A+B hibrid architektúra', status: 'new' },
            { id: '10-arastrategia-hierarchia', title: 'Árstratégia', description: 'Árazási hierarchia', status: null },
            { id: '8-holding-struktura', title: 'Holding Struktúra', description: 'Multi-tenant holding', status: null },
            { id: '8-deployment-architektura', title: 'Deployment', description: 'Telepítési diagram', status: null },
            { id: '8-keszlet-szinkron', title: 'Készlet Szinkron', description: 'Multi-site szinkronizáció', status: null },
            { id: '8-reszletfizetes-folyamat', title: 'Részletfizetés', description: 'Részletfizetési konstrukciók', status: null }
        ]
    },
    'extras': {
        name: 'További Funkciók',
        description: 'E-számla, árazás automatizálás, fizetési fegyelem',
        isNew: false,
        related: ['p5', 'eladas'],
        diagrams: [
            { id: '7-e-szamla-folyamat', title: 'E-Számla', description: 'NAV e-számla integráció', status: null },
            { id: '7-arrazas-automatizalas', title: 'Árazás Automatizálás', description: 'Dinamikus árazás', status: null },
            { id: '7-fizetesi-fegyelem', title: 'Fizetési Fegyelem', description: 'Lejárt számlák kezelése', status: null },
            { id: '7-erd-uj-entitasok', title: 'Új Entitások ERD', description: '2025-ös bővítések', status: null }
        ]
    }
};

// Interactive Master SVG with clickable modules
const INTERACTIVE_MASTER_SVG = `
<svg viewBox="0 0 1400 900" class="w-full min-w-[1000px]" xmlns="http://www.w3.org/2000/svg">
    <defs>
        <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="#1976d2"/>
        </marker>
        <marker id="arrowhead-green" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="#388e3c"/>
        </marker>
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="2" dy="2" stdDeviation="3" flood-opacity="0.3"/>
        </filter>
    </defs>

    <!-- Background -->
    <rect width="1400" height="900" fill="#fafafa"/>

    <!-- Title -->
    <text x="700" y="40" text-anchor="middle" font-size="24" font-weight="bold" fill="#1976d2">
        KGC ERP v3.0 - Teljes Üzleti Folyamat
    </text>
    <text x="700" y="65" text-anchor="middle" font-size="14" fill="#666">
        Kattints a modulokra a részletekért
    </text>

    <!-- START -->
    <g class="module-box" @click="currentView = 'master'">
        <ellipse cx="700" cy="120" rx="80" ry="35" fill="#e3f2fd" stroke="#1976d2" stroke-width="3" filter="url(#shadow)"/>
        <text x="700" y="125" text-anchor="middle" font-size="16" font-weight="bold" fill="#1976d2">Ügyfél Belép</text>
    </g>

    <!-- Arrow: Start -> Partner -->
    <path d="M700,155 L700,180" stroke="#1976d2" stroke-width="2" marker-end="url(#arrowhead)" class="arrow-path"/>

    <!-- PARTNER AZONOSÍTÁS -->
    <g class="module-box" @click="currentView = 'partner'">
        <rect x="600" y="190" width="200" height="60" rx="10" fill="#e3f2fd" stroke="#1976d2" stroke-width="2" filter="url(#shadow)"/>
        <text x="700" y="225" text-anchor="middle" font-size="14" font-weight="bold" fill="#1e1e1e">Partner Azonosítás</text>
    </g>

    <!-- Arrow: Partner -> Decision -->
    <path d="M700,250 L700,280" stroke="#1976d2" stroke-width="2" marker-end="url(#arrowhead)" class="arrow-path"/>

    <!-- DECISION: Mit szeretne? -->
    <g class="module-box">
        <polygon points="700,290 800,350 700,410 600,350" fill="#fff3e0" stroke="#f57c00" stroke-width="2" filter="url(#shadow)"/>
        <text x="700" y="345" text-anchor="middle" font-size="12" font-weight="bold" fill="#1e1e1e">Mit szeretne</text>
        <text x="700" y="360" text-anchor="middle" font-size="12" font-weight="bold" fill="#1e1e1e">az ügyfél?</text>
    </g>

    <!-- ============ ROW 1: Main Business Modules ============ -->

    <!-- Arrow to BÉRLÉS -->
    <path d="M600,350 L200,350 L200,450" stroke="#1976d2" stroke-width="2" marker-end="url(#arrowhead)" class="arrow-path"/>
    <text x="300" y="340" font-size="11" fill="#1976d2">Bérel</text>

    <!-- Arrow to ELADÁS -->
    <path d="M620,370 L350,450" stroke="#1976d2" stroke-width="2" marker-end="url(#arrowhead)" class="arrow-path"/>
    <text x="430" y="400" font-size="11" fill="#1976d2">Vásárol</text>

    <!-- Arrow to SZERVIZ -->
    <path d="M700,410 L700,450" stroke="#1976d2" stroke-width="2" marker-end="url(#arrowhead)" class="arrow-path"/>
    <text x="720" y="435" font-size="11" fill="#1976d2">Javíttat</text>

    <!-- Arrow to ÁRAJÁNLAT -->
    <path d="M780,370 L1050,450" stroke="#1976d2" stroke-width="2" marker-end="url(#arrowhead)" class="arrow-path"/>
    <text x="920" y="400" font-size="11" fill="#1976d2">Árajánlat</text>

    <!-- Arrow to VISSZAVÉTEL -->
    <path d="M800,350 L1200,350 L1200,450" stroke="#1976d2" stroke-width="2" marker-end="url(#arrowhead)" class="arrow-path"/>
    <text x="1050" y="340" font-size="11" fill="#1976d2">Visszahoz</text>

    <!-- BÉRLÉS Module -->
    <g class="module-box" @click="currentView = 'berles'">
        <rect x="100" y="460" width="200" height="80" rx="10" fill="#e3f2fd" stroke="#1976d2" stroke-width="3" filter="url(#shadow)"/>
        <text x="200" y="490" text-anchor="middle" font-size="16" font-weight="bold" fill="#1976d2">BÉRLÉS</text>
        <text x="200" y="510" text-anchor="middle" font-size="11" fill="#666">Bérgép kiadás</text>
        <text x="200" y="525" text-anchor="middle" font-size="11" fill="#666">+ kaució kezelés</text>
    </g>

    <!-- ELADÁS Module -->
    <g class="module-box" @click="currentView = 'eladas'">
        <rect x="320" y="460" width="200" height="80" rx="10" fill="#e3f2fd" stroke="#1976d2" stroke-width="3" filter="url(#shadow)"/>
        <text x="420" y="490" text-anchor="middle" font-size="16" font-weight="bold" fill="#1976d2">ELADÁS</text>
        <text x="420" y="510" text-anchor="middle" font-size="11" fill="#666">Termék értékesítés</text>
        <text x="420" y="525" text-anchor="middle" font-size="11" fill="#666">+ számlázás</text>
    </g>

    <!-- SZERVIZ Module -->
    <g class="module-box" @click="currentView = 'szerviz'">
        <rect x="540" y="460" width="200" height="80" rx="10" fill="#e3f2fd" stroke="#1976d2" stroke-width="3" filter="url(#shadow)"/>
        <text x="640" y="490" text-anchor="middle" font-size="16" font-weight="bold" fill="#1976d2">SZERVIZ</text>
        <text x="640" y="510" text-anchor="middle" font-size="11" fill="#666">Munkalap felvétel</text>
        <text x="640" y="525" text-anchor="middle" font-size="11" fill="#666">+ javítás</text>
    </g>

    <!-- ÁRAJÁNLAT Module (NEW) -->
    <g class="module-box" @click="currentView = 'arajanlat'">
        <rect x="880" y="460" width="200" height="80" rx="10" fill="#e8f5e9" stroke="#388e3c" stroke-width="3" filter="url(#shadow)"/>
        <text x="980" y="485" text-anchor="middle" font-size="16" font-weight="bold" fill="#388e3c">ÁRAJÁNLAT</text>
        <text x="980" y="505" text-anchor="middle" font-size="11" fill="#666">Árkalkuláció</text>
        <text x="980" y="520" text-anchor="middle" font-size="11" fill="#666">+ konverzió</text>
        <text x="1060" y="475" font-size="10" fill="#388e3c" font-weight="bold">ÚJ</text>
    </g>

    <!-- VISSZAVÉTEL Module -->
    <g class="module-box" @click="currentView = 'visszavetel'">
        <rect x="1100" y="460" width="200" height="80" rx="10" fill="#e3f2fd" stroke="#1976d2" stroke-width="3" filter="url(#shadow)"/>
        <text x="1200" y="490" text-anchor="middle" font-size="16" font-weight="bold" fill="#1976d2">VISSZAVÉTEL</text>
        <text x="1200" y="510" text-anchor="middle" font-size="11" fill="#666">Bérlés lezárás</text>
        <text x="1200" y="525" text-anchor="middle" font-size="11" fill="#666">+ kaució visszaadás</text>
    </g>

    <!-- ============ ROW 2: R.1/R.2 Integration ============ -->

    <!-- Arrow: BÉRLÉS -> R.1 -->
    <path d="M200,540 L200,580" stroke="#388e3c" stroke-width="2" marker-end="url(#arrowhead-green)" class="arrow-path"/>

    <!-- Arrow: ELADÁS -> R.1 -->
    <path d="M420,540 L420,580" stroke="#388e3c" stroke-width="2" marker-end="url(#arrowhead-green)" class="arrow-path"/>

    <!-- R.1/R.2 Kiadási Javaslat (spans across) -->
    <g class="module-box" @click="currentView = 'kiadasi'">
        <rect x="100" y="590" width="480" height="60" rx="10" fill="#e8f5e9" stroke="#388e3c" stroke-width="3" filter="url(#shadow)"/>
        <text x="340" y="620" text-anchor="middle" font-size="14" font-weight="bold" fill="#388e3c">R.1/R.2 Kiadási Javaslat Algoritmus</text>
        <text x="340" y="638" text-anchor="middle" font-size="11" fill="#666">Automatikus tárhely optimalizáció | Készlet: KÉSZLET_HELY</text>
        <text x="560" y="600" font-size="10" fill="#388e3c" font-weight="bold">ÚJ v3.0</text>
    </g>

    <!-- SZERVIZ -> Szerviz Folyamat -->
    <path d="M640,540 L640,590" stroke="#1976d2" stroke-width="2" marker-end="url(#arrowhead)" class="arrow-path"/>

    <!-- Szerviz Folyamat Box -->
    <g class="module-box" @click="currentView = 'szerviz'">
        <rect x="540" y="590" width="200" height="60" rx="10" fill="#e3f2fd" stroke="#1976d2" stroke-width="2" filter="url(#shadow)"/>
        <text x="640" y="615" text-anchor="middle" font-size="12" font-weight="bold" fill="#1e1e1e">Munkalap Kezelés</text>
        <text x="640" y="632" text-anchor="middle" font-size="10" fill="#666">intake_type: warranty/repair/quote</text>
    </g>

    <!-- ============ ROW 3: Backend Operations ============ -->

    <!-- Arrow: R.1 -> KÉSZLET -->
    <path d="M340,650 L340,700" stroke="#388e3c" stroke-width="2" marker-end="url(#arrowhead-green)" class="arrow-path"/>

    <!-- LELTÁR Module -->
    <g class="module-box" @click="currentView = 'leltar'">
        <rect x="100" y="710" width="160" height="60" rx="10" fill="#e8f5e9" stroke="#388e3c" stroke-width="2" filter="url(#shadow)"/>
        <text x="180" y="735" text-anchor="middle" font-size="14" font-weight="bold" fill="#388e3c">LELTÁR</text>
        <text x="180" y="755" text-anchor="middle" font-size="10" fill="#666">Készlet ellenőrzés</text>
    </g>

    <!-- ÁTCSOPORTOSÍTÁS Module -->
    <g class="module-box" @click="currentView = 'atcsoportositas'">
        <rect x="280" y="710" width="160" height="60" rx="10" fill="#e8f5e9" stroke="#388e3c" stroke-width="2" filter="url(#shadow)"/>
        <text x="360" y="735" text-anchor="middle" font-size="12" font-weight="bold" fill="#388e3c">ÁTCSOPORTOSÍTÁS</text>
        <text x="360" y="755" text-anchor="middle" font-size="10" fill="#666">Tárhely mozgatás</text>
    </g>

    <!-- BEVÉTELEZÉS Module -->
    <g class="module-box" @click="currentView = 'bevetelezes'">
        <rect x="460" y="710" width="160" height="60" rx="10" fill="#e8f5e9" stroke="#388e3c" stroke-width="2" filter="url(#shadow)"/>
        <text x="540" y="735" text-anchor="middle" font-size="14" font-weight="bold" fill="#388e3c">BEVÉTELEZÉS</text>
        <text x="540" y="755" text-anchor="middle" font-size="10" fill="#666">Készlet feltöltés</text>
    </g>

    <!-- ============ ROW 3 RIGHT: Financial ============ -->

    <!-- All modules flow to P5 -->
    <path d="M300,540 L860,700" stroke="#388e3c" stroke-width="1.5" stroke-dasharray="5,5" class="arrow-path"/>
    <path d="M520,540 L880,700" stroke="#388e3c" stroke-width="1.5" stroke-dasharray="5,5" class="arrow-path"/>
    <path d="M740,650 L900,700" stroke="#388e3c" stroke-width="1.5" stroke-dasharray="5,5" class="arrow-path"/>
    <path d="M1100,540 L960,700" stroke="#388e3c" stroke-width="1.5" stroke-dasharray="5,5" class="arrow-path"/>

    <!-- P5 Automatizált Elszámolás -->
    <g class="module-box" @click="currentView = 'p5'">
        <rect x="800" y="710" width="280" height="80" rx="10" fill="#e8f5e9" stroke="#388e3c" stroke-width="3" filter="url(#shadow)"/>
        <text x="940" y="735" text-anchor="middle" font-size="16" font-weight="bold" fill="#388e3c">P5 Automatizált Elszámolás</text>
        <text x="940" y="755" text-anchor="middle" font-size="11" fill="#666">Bank/Futár → Számla párosítás</text>
        <text x="940" y="775" text-anchor="middle" font-size="11" fill="#666">Pontozás: 40+35+15+10 = 100</text>
        <text x="1060" y="720" font-size="10" fill="#388e3c" font-weight="bold">ÚJ v3.0</text>
    </g>

    <!-- ============ ROW 4: Notifications ============ -->

    <!-- Arrow: P5 -> N.3 -->
    <path d="M940,790 L940,820" stroke="#388e3c" stroke-width="2" marker-end="url(#arrowhead-green)" class="arrow-path"/>

    <!-- N.3 Értesítések -->
    <g class="module-box" @click="currentView = 'ertesitesek'">
        <rect x="700" y="830" width="480" height="55" rx="10" fill="#e8f5e9" stroke="#388e3c" stroke-width="3" filter="url(#shadow)"/>
        <text x="940" y="855" text-anchor="middle" font-size="14" font-weight="bold" fill="#388e3c">N.3 Értesítések (SMS / Email / PWA Push)</text>
        <text x="940" y="873" text-anchor="middle" font-size="11" fill="#666">Firebase FCM | Service Worker | Offline működés</text>
        <text x="1160" y="840" font-size="10" fill="#388e3c" font-weight="bold">ÚJ v3.0</text>
    </g>

    <!-- ============ LEGEND ============ -->
    <g transform="translate(50, 800)">
        <text x="0" y="0" font-size="12" font-weight="bold" fill="#333">Jelmagyarázat:</text>

        <rect x="0" y="15" width="20" height="15" fill="#e3f2fd" stroke="#1976d2" stroke-width="2"/>
        <text x="30" y="27" font-size="11" fill="#333">Meglévő modul</text>

        <rect x="130" y="15" width="20" height="15" fill="#e8f5e9" stroke="#388e3c" stroke-width="2"/>
        <text x="160" y="27" font-size="11" fill="#333">Új v3.0 funkció</text>

        <polygon points="280,15 295,22 280,30 265,22" fill="#fff3e0" stroke="#f57c00" stroke-width="1"/>
        <text x="305" y="27" font-size="11" fill="#333">Döntési pont</text>

        <line x1="400" y1="22" x2="440" y2="22" stroke="#1976d2" stroke-width="2"/>
        <text x="450" y="27" font-size="11" fill="#333">Folyamat</text>

        <line x1="510" y1="22" x2="550" y2="22" stroke="#388e3c" stroke-width="2" stroke-dasharray="5,5"/>
        <text x="560" y="27" font-size="11" fill="#333">Pénzügyi kapcsolat</text>
    </g>
</svg>
`;

function generateHTML(svgs) {
    // Generate SVG storage section
    const svgStorage = Object.entries(svgs).map(([id, svg]) => {
        return `<div id="svg-container-${id}" class="hidden">${svg}</div>`;
    }).join('\n');

    // Generate modules JSON
    const modulesJSON = JSON.stringify(MODULES, null, 2);

    return `<!DOCTYPE html>
<html lang="hu">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>KGC ERP v3.0 - Interaktív Folyamatábra (Portable)</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"></script>
    <style>
        [x-cloak] { display: none !important; }
        .module-box { cursor: pointer; transition: all 0.3s ease; }
        .module-box:hover { filter: brightness(1.1); transform: scale(1.02); }
        .arrow-path { stroke-dasharray: 1000; stroke-dashoffset: 1000; animation: drawArrow 2s ease forwards; }
        @keyframes drawArrow { to { stroke-dashoffset: 0; } }
        .fade-in { animation: fadeIn 0.5s ease; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .svg-diagram { max-width: 100%; height: auto; }
        .svg-diagram svg { max-width: 100%; height: auto; }
    </style>
</head>
<body class="bg-gray-100 min-h-screen" x-data="appData()" x-cloak>

    <!-- Hidden SVG Storage -->
    <div id="svg-storage" class="hidden">
        ${svgStorage}
    </div>

    <!-- Header -->
    <header class="bg-blue-800 text-white py-4 px-6 shadow-lg sticky top-0 z-50">
        <div class="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-4">
            <div class="flex items-center gap-4">
                <h1 class="text-2xl font-bold">KGC ERP v3.0</h1>
                <span class="text-blue-200 text-sm">Portable Interaktív - ${new Date().toISOString().split('T')[0]}</span>
            </div>
            <nav class="flex items-center gap-2 text-sm">
                <button @click="currentView = 'master'" :class="currentView === 'master' ? 'text-white font-bold' : 'text-blue-300 hover:text-white'" class="transition-colors">
                    Master Áttekintés
                </button>
                <template x-if="currentView !== 'master'">
                    <span class="flex items-center gap-2">
                        <span class="text-blue-400">→</span>
                        <span class="text-white font-bold" x-text="modules[currentView]?.name || currentView"></span>
                    </span>
                </template>
            </nav>
            <button @click="darkMode = !darkMode" class="p-2 rounded-lg hover:bg-blue-700 transition-colors">
                <svg x-show="!darkMode" class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/>
                </svg>
                <svg x-show="darkMode" class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"/>
                </svg>
            </button>
        </div>
    </header>

    <main class="max-w-7xl mx-auto p-6" :class="darkMode ? 'bg-gray-900 text-white' : 'bg-gray-100'">

        <!-- MASTER VIEW -->
        <div x-show="currentView === 'master'" x-transition:enter="fade-in" class="space-y-6">
            <div class="bg-white rounded-xl shadow-lg p-6" :class="darkMode ? 'bg-gray-800' : ''">
                <h2 class="text-xl font-bold mb-2">KGC ERP Teljes Folyamat - Ügyfélközpontú Nézet</h2>
                <p class="text-gray-600 mb-4" :class="darkMode ? 'text-gray-300' : ''">Kattints bármelyik modulra a részletes folyamatábra megtekintéséhez</p>

                <!-- Interactive Master SVG with clickable modules -->
                <div class="overflow-x-auto">
                    ${INTERACTIVE_MASTER_SVG}
                </div>
            </div>

            <!-- Quick Module Cards -->
            <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                <template x-for="(mod, key) in modules" :key="key">
                    <button @click="currentView = key"
                            class="p-4 rounded-xl shadow-md transition-all hover:shadow-lg hover:scale-105 text-left"
                            :class="mod.isNew ? 'bg-green-50 border-2 border-green-500' : (darkMode ? 'bg-gray-700 border border-gray-600' : 'bg-white border border-gray-200')">
                        <div class="flex items-center gap-2 mb-1">
                            <span class="font-bold text-sm" :class="mod.isNew ? 'text-green-700' : (darkMode ? 'text-blue-300' : 'text-blue-700')" x-text="mod.name"></span>
                            <span x-show="mod.isNew" class="px-2 py-0.5 bg-green-500 text-white text-xs rounded-full">ÚJ</span>
                        </div>
                        <p class="text-xs text-gray-600" :class="darkMode ? 'text-gray-400' : ''" x-text="mod.description.substring(0, 50) + '...'"></p>
                        <p class="text-xs text-gray-400 mt-1" x-text="mod.diagrams?.length + ' diagram' || '0 diagram'"></p>
                    </button>
                </template>
            </div>

            <!-- Statistics -->
            <div class="bg-white rounded-xl shadow-lg p-6 grid grid-cols-2 md:grid-cols-4 gap-4" :class="darkMode ? 'bg-gray-800' : ''">
                <div class="text-center">
                    <div class="text-3xl font-bold text-blue-600" x-text="Object.keys(modules).length"></div>
                    <div class="text-sm text-gray-500">Modul</div>
                </div>
                <div class="text-center">
                    <div class="text-3xl font-bold text-green-600" x-text="Object.values(modules).filter(m => m.isNew).length"></div>
                    <div class="text-sm text-gray-500">Új v3.0</div>
                </div>
                <div class="text-center">
                    <div class="text-3xl font-bold text-purple-600" x-text="Object.values(modules).reduce((sum, m) => sum + (m.diagrams?.length || 0), 0)"></div>
                    <div class="text-sm text-gray-500">Diagram</div>
                </div>
                <div class="text-center">
                    <div class="text-3xl font-bold text-orange-600">46</div>
                    <div class="text-sm text-gray-500">Beágyazott SVG</div>
                </div>
            </div>
        </div>

        <!-- DETAIL VIEW -->
        <div x-show="currentView !== 'master'" x-transition:enter="fade-in" class="space-y-6">
            <button @click="currentView = 'master'" class="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
                </svg>
                Vissza a Master Áttekintéshez
            </button>

            <div class="bg-white rounded-xl shadow-lg overflow-hidden" :class="darkMode ? 'bg-gray-800' : ''">
                <div class="p-6 border-b" :class="modules[currentView]?.isNew ? 'bg-green-50 border-green-200' : 'bg-blue-50 border-blue-200'">
                    <div class="flex items-center gap-3 flex-wrap">
                        <h2 class="text-2xl font-bold" :class="modules[currentView]?.isNew ? 'text-green-800' : 'text-blue-800'" x-text="modules[currentView]?.name"></h2>
                        <span x-show="modules[currentView]?.isNew" class="px-3 py-1 bg-green-500 text-white text-sm rounded-full font-bold animate-pulse">ÚJ v3.0</span>
                    </div>
                    <p class="text-gray-600 mt-2" x-text="modules[currentView]?.description"></p>
                </div>

                <div class="p-6 space-y-8">
                    <template x-if="modules[currentView]?.diagrams?.length > 0">
                        <div class="space-y-8">
                            <template x-for="diag in modules[currentView].diagrams" :key="diag.id">
                                <div class="border rounded-lg overflow-hidden" :class="darkMode ? 'border-gray-600' : 'border-gray-200'">
                                    <div class="p-4 bg-gray-50 border-b flex items-center justify-between flex-wrap gap-2" :class="darkMode ? 'bg-gray-700 border-gray-600' : ''">
                                        <div>
                                            <h3 class="font-bold" :class="darkMode ? 'text-white' : 'text-gray-800'" x-text="diag.title"></h3>
                                            <p class="text-sm text-gray-500" x-text="diag.description"></p>
                                        </div>
                                        <div class="flex gap-2">
                                            <span x-show="diag.status === 'new'" class="px-2 py-1 bg-green-500 text-white text-xs rounded-full">ÚJ</span>
                                            <span x-show="diag.status === 'modified'" class="px-2 py-1 bg-orange-500 text-white text-xs rounded-full">MÓDOSÍTOTT</span>
                                        </div>
                                    </div>
                                    <div class="p-4 bg-white overflow-x-auto svg-diagram" :class="darkMode ? 'bg-gray-800' : ''" x-html="getSvgContent(diag.id)"></div>
                                </div>
                            </template>
                        </div>
                    </template>

                    <template x-if="!modules[currentView]?.diagrams?.length">
                        <div class="text-center py-12 text-gray-500">
                            <svg class="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                            </svg>
                            <p>Ehhez a modulhoz még nincsenek részletes diagramok.</p>
                            <p class="text-sm mt-2">Nézd meg a kapcsolódó modulokat lent.</p>
                        </div>
                    </template>
                </div>

                <div class="p-6 bg-gray-50 border-t" :class="darkMode ? 'bg-gray-700 border-gray-600' : ''">
                    <h4 class="font-bold text-gray-700 mb-3" :class="darkMode ? 'text-gray-200' : ''">Kapcsolódó modulok:</h4>
                    <div class="flex flex-wrap gap-2">
                        <template x-for="rel in (modules[currentView]?.related || [])" :key="rel">
                            <button @click="currentView = rel" class="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm hover:bg-blue-200 transition-colors">
                                <span x-text="modules[rel]?.name || rel"></span>
                            </button>
                        </template>
                    </div>
                </div>
            </div>
        </div>
    </main>

    <footer class="text-center py-4 text-gray-500 text-sm">
        KGC ERP v3.0 | Portable Interaktív Folyamatábra | Generálva: ${new Date().toISOString().split('T')[0]} | 46 SVG beágyazva
    </footer>

    <script>
        function appData() {
            return {
                darkMode: localStorage.getItem('darkMode') === 'true',
                currentView: 'master',
                modules: ${modulesJSON},

                getSvgContent(id) {
                    const container = document.getElementById('svg-container-' + id);
                    if (container) {
                        return container.innerHTML;
                    }
                    return '<div class="p-8 text-center text-gray-400">Diagram nem található: ' + id + '</div>';
                },

                init() {
                    this.$watch('darkMode', v => localStorage.setItem('darkMode', v));
                }
            }
        }
    </script>
</body>
</html>`;
}

// Main
console.log('Loading SVG files...');
const svgs = loadAllSVGs();
console.log(`Loaded ${Object.keys(svgs).length} SVG files`);

console.log('Generating portable HTML...');
const html = generateHTML(svgs);

fs.writeFileSync(OUTPUT_FILE, html);
const stats = fs.statSync(OUTPUT_FILE);
const sizeMB = (stats.size / 1024 / 1024).toFixed(2);

console.log(`✓ Generated: ${OUTPUT_FILE}`);
console.log(`  - ${Object.keys(svgs).length} SVG diagrams embedded`);
console.log(`  - ${Object.keys(MODULES).length} modules defined`);
console.log(`  - File size: ${sizeMB} MB`);
console.log('  - Fully portable: NO external dependencies for diagrams');
