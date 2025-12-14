#!/usr/bin/env node
/**
 * KGC ERP Diagram HTML Generator - 2025-12-12 Update
 * Generates a portable HTML file with ONLY the 2025-12-12 diagrams
 *
 * Usage: node generate-html-2025-12-12.js
 */

const fs = require('fs');
const path = require('path');

const DIAGRAMS_DIR = path.join(__dirname, '..', 'diagrams');
const OUTPUT_FILE = path.join(__dirname, '..', 'KGC-ERP-v3-Diagramok-2025-12-12.html');

// Diagram configuration for 2025-12-12 updates only - ALL 10 DIAGRAMS
const DIAGRAM_CONFIG = {
    categories: [
        {
            id: 'cat-keszlet',
            name: '1. Készletkezelés - Multi-location',
            description: 'Új multi-location készletkezelés - egy cikk több fizikai tárhelyen, kiadási prioritással.',
            diagrams: [
                {
                    id: '2-keszlet-multi-location-erd-2025-12-12',
                    title: 'Multi-location ERD',
                    description: 'KÉSZLET_HELY entitás - cikk több tárhelyen, prioritással.',
                    status: 'new',
                    changes: [
                        { section: 'ÚJ', change: 'KÉSZLET_HELY entitás', adr: 'Fit-Gap R.1' },
                        { section: 'KÉSZLET_HELY', change: 'tarhely_kod, mennyiseg, kiadasi_prioritas', adr: 'Fit-Gap R.1' },
                        { section: 'CIKK', change: 'keszlet → kalkulált mező (SUM)', adr: 'Fit-Gap R.1' },
                        { section: 'CIKK', change: 'tarhely → alap_tarhely átnevezés', adr: 'Fit-Gap R.1' },
                        { section: 'KÉSZLET_MOZGÁS', change: 'tarhely_kod, forras_tarhely, cel_tarhely', adr: 'Fit-Gap R.1' }
                    ]
                },
                {
                    id: '02-ertekesites-erd-2025-12-12',
                    title: 'Értékesítés ERD (Módosítások)',
                    description: 'CIKK és KÉSZLET_MOZGÁS entitások módosításai a multi-location támogatáshoz.',
                    status: 'modified',
                    changes: [
                        { section: 'CIKK', change: 'keszlet → kalkulált mező (SUM)', adr: 'Fit-Gap R.1' },
                        { section: 'CIKK', change: 'tarhely → alap_tarhely átnevezés', adr: 'Fit-Gap R.1' },
                        { section: 'KÉSZLET_MOZGÁS', change: '+tarhely_kod mező', adr: 'Fit-Gap R.1' },
                        { section: 'KÉSZLET_MOZGÁS', change: '+forras_tarhely, cel_tarhely (átcsoportosítás)', adr: 'Fit-Gap R.1' },
                        { section: 'KÉSZLET_MOZGÁS', change: 'tipus ENUM: +T (átcsoportosítás)', adr: 'Fit-Gap R.1' }
                    ]
                },
                {
                    id: '2-kiadasi-optimalizacio-folyamat-2025-12-12',
                    title: 'Kiadási Optimalizáció Folyamat',
                    description: 'R.1/R.2 algoritmus - automatikus tárhely javaslat kiadáshoz.',
                    status: 'new',
                    changes: [
                        { section: 'R.1', change: 'Raktári kiadási javaslat algoritmus', adr: 'Fit-Gap R.1' },
                        { section: 'R.2', change: 'Javaslat megerősítése/felülbírálása', adr: 'Fit-Gap R.2' },
                        { section: 'SQL', change: 'Window function prioritás szerinti kiadás', adr: 'Fit-Gap R.1' },
                        { section: 'Audit', change: 'KIADASI_AUDIT tábla felülbíráláshoz', adr: 'Fit-Gap R.2' },
                        { section: 'Indoklás', change: 'SERULT/LELTARELTERES/UGYFEL_KERES/stb.', adr: 'Fit-Gap R.2' }
                    ]
                }
            ]
        },
        {
            id: 'cat-folyamatok',
            name: '2. Üzleti Folyamatok (R.1/R.2)',
            description: 'Módosított értékesítési és bérlési folyamatok az R.1/R.2 kiadási javaslat integrációval.',
            diagrams: [
                {
                    id: '01-ugyfelfelvitel-folyamat-2025-12-12',
                    title: 'Ügyfél Felvétel Folyamat',
                    description: 'Bérlés indítási folyamat R.1/R.2 kiadási javaslat integrációval.',
                    status: 'modified',
                    changes: [
                        { section: 'R.1', change: 'Automatikus tárhely javaslat bérgéphez', adr: 'Fit-Gap R.1' },
                        { section: 'R.2', change: 'Kezelő elfogadás/felülbírálás', adr: 'Fit-Gap R.2' },
                        { section: 'Audit', change: 'KIADASI_AUDIT felülbírálás naplózás', adr: 'Fit-Gap R.2' },
                        { section: 'Indoklás', change: 'Kötelező indoklás (SERULT/EGYEB/stb.)', adr: 'Fit-Gap R.2' },
                        { section: 'Készlet', change: 'KÉSZLET_HELY frissítés + KÉSZLET_MOZGÁS log', adr: 'Fit-Gap R.1' }
                    ]
                },
                {
                    id: '02-ertekesites-folyamat-2025-12-12',
                    title: 'Értékesítés Folyamat',
                    description: 'Bevételezés és értékesítés folyamatok multi-location támogatással.',
                    status: 'modified',
                    changes: [
                        { section: 'Bevételezés', change: 'Kötelező tárhely megadás minden tételnél', adr: 'Fit-Gap R.1' },
                        { section: 'Bevételezés', change: 'KÉSZLET_HELY.mennyiseg növelés', adr: 'Fit-Gap R.1' },
                        { section: 'Értékesítés', change: 'R.1 automatikus kiadási javaslat', adr: 'Fit-Gap R.1' },
                        { section: 'Értékesítés', change: 'R.2 megerősítés/felülbírálás', adr: 'Fit-Gap R.2' },
                        { section: 'Prioritás', change: '1=Pult, 2=Eladótér, 3=Raktár eleje, 4=Hátsó, 5=Távoli', adr: 'Fit-Gap R.1' }
                    ]
                }
            ]
        },
        {
            id: 'cat-penzugy',
            name: '3. Pénzügy - Automatizált Elszámolás',
            description: 'Banki/futár tranzakciók automatikus párosítása nyitott számlákkal - pontozási rendszer.',
            diagrams: [
                {
                    id: '5-automatizalt-elszamolas-erd-2025-12-12',
                    title: 'Elszámolás ERD',
                    description: 'BANK_TRANZAKCIÓ, KÜLSŐ_PARTNER_API, PÁROSÍTÁS_LOG entitások.',
                    status: 'new',
                    changes: [
                        { section: 'ÚJ', change: 'BANK_TRANZAKCIÓ entitás', adr: 'Fit-Gap P.1' },
                        { section: 'ÚJ', change: 'KÜLSŐ_PARTNER_API entitás', adr: 'Fit-Gap P.2' },
                        { section: 'ÚJ', change: 'PÁROSÍTÁS_LOG entitás (audit)', adr: 'Fit-Gap P.3' },
                        { section: 'Score', change: 'parositas_score (0-100%)', adr: 'Fit-Gap P.3' },
                        { section: 'Partnerek', change: 'OTP, K&H, Erste, GLS, DPD, MPL, MyPos', adr: 'Fit-Gap P.2' }
                    ]
                },
                {
                    id: '5-automatizalt-elszamolas-folyamat-2025-12-12',
                    title: 'Elszámolás Folyamat',
                    description: 'P5 pontozási algoritmus - automatikus/javasolt/kézi párosítás.',
                    status: 'new',
                    changes: [
                        { section: 'P5.1-P5.2', change: 'Import és BANK_TRANZAKCIÓ létrehozás', adr: 'Fit-Gap P.1' },
                        { section: 'P5.3', change: 'Pontozás (osszeg+kozlemeny+partner+datum)', adr: 'Fit-Gap P.3' },
                        { section: 'Súlyok', change: '40+35+15+10 = 100 pont', adr: 'Fit-Gap P.3' },
                        { section: '≥90', change: 'Automatikus párosítás', adr: 'Fit-Gap P.3' },
                        { section: '70-89', change: 'Javaslat, kézi megerősítés', adr: 'Fit-Gap P.3' },
                        { section: '<70', change: 'Kézi párosítás szükséges', adr: 'Fit-Gap P.3' }
                    ]
                },
                {
                    id: '05-penzugy-folyamat-2025-12-12',
                    title: 'Pénzügy Folyamat (P5 Integráció)',
                    description: 'Pénzügyi folyamatok bővítése P5 Automatizált Elszámolás modullal.',
                    status: 'modified',
                    changes: [
                        { section: 'P5', change: 'Új Automatizált Elszámolás modul', adr: 'Fit-Gap P.1' },
                        { section: 'P5.1', change: 'Adatfogadás (Bank CSV / Futár API)', adr: 'Fit-Gap P.1' },
                        { section: 'P5.2', change: 'BANK_TRANZAKCIÓ létrehozás', adr: 'Fit-Gap P.1' },
                        { section: 'P5.3', change: 'Pontozás (40+35+15+10=100)', adr: 'Fit-Gap P.3' },
                        { section: 'P5.4-5', change: 'Párosítás és SZÁMLA.fizetve=TRUE', adr: 'Fit-Gap P.3' }
                    ]
                }
            ]
        },
        {
            id: 'cat-ertesites',
            name: '4. Értesítések - PWA Push',
            description: 'Push értesítések PWA Service Worker-rel és Firebase Cloud Messaging-gel.',
            diagrams: [
                {
                    id: '07-ertesitesek-erd-2025-12-12',
                    title: 'Értesítések ERD',
                    description: 'ÉRTESÍTÉS bővítés, új PUSH_SUBSCRIPTION entitás, ÉRTESÍTÉS_BEÁLLÍTÁS módosítás.',
                    status: 'modified',
                    changes: [
                        { section: 'ÉRTESÍTÉS', change: 'csatorna ENUM bővítés: +push', adr: 'Fit-Gap N.1' },
                        { section: 'ÉRTESÍTÉS', change: 'tipus ENUM: +PAROSITAS_VARAKOZIK', adr: 'Fit-Gap N.1' },
                        { section: 'ÚJ', change: 'PUSH_SUBSCRIPTION entitás', adr: 'Fit-Gap N.1' },
                        { section: 'PUSH_SUBSCRIPTION', change: 'endpoint, p256dh_key, auth_key', adr: 'Fit-Gap N.1' },
                        { section: 'ÉRTESÍTÉS_BEÁLLÍTÁS', change: '+push_engedelyezett, +push_subscription_json', adr: 'Fit-Gap N.1' }
                    ]
                },
                {
                    id: '7-ertesitesek-folyamat-2025-12-12',
                    title: 'PWA Push Értesítések Folyamat',
                    description: 'N.3 Push csatorna - Firebase FCM, Service Worker, offline működés.',
                    status: 'new',
                    changes: [
                        { section: 'N.3', change: 'Push értesítés csatorna hozzáadása', adr: 'Fit-Gap N.1' },
                        { section: 'ÚJ', change: 'PUSH_SUBSCRIPTION entitás', adr: 'Fit-Gap N.1' },
                        { section: 'FCM', change: 'Firebase Cloud Messaging integráció', adr: 'Fit-Gap N.1' },
                        { section: 'SW', change: 'Service Worker push handler', adr: 'ADR-002' },
                        { section: 'Offline', change: 'Értesítések offline is működnek', adr: 'ADR-002' },
                        { section: 'Típusok', change: 'BERLES_LEJAR, SZAMLA_KESZULT, PAROSITAS_VARAKOZIK', adr: 'Fit-Gap N.1' }
                    ]
                }
            ]
        }
    ]
};

// Generate status badge HTML
function generateStatusBadge(status) {
    if (status === 'new') {
        return '<span class="ml-2 px-3 py-1 bg-green-500 text-white text-sm rounded-full font-bold animate-pulse">ÚJ</span>';
    }
    if (status === 'modified') {
        return '<span class="ml-2 px-3 py-1 bg-orange-500 text-white text-sm rounded-full font-bold">MÓDOSÍTOTT</span>';
    }
    return '';
}

// Generate changes table HTML
function generateChangesTable(diagram) {
    if (!diagram.changes || diagram.changes.length === 0) return '';

    const rows = diagram.changes.map((c, i) => `
        <tr class="${i % 2 === 0 ? 'bg-green-50 dark:bg-green-900/20' : ''}">
            <td class="px-2 py-1 text-sm">${i + 1}</td>
            <td class="px-2 py-1 text-sm font-medium">${c.section}</td>
            <td class="px-2 py-1 text-sm">${c.change}</td>
            <td class="px-2 py-1 text-sm text-blue-600 dark:text-blue-400">${c.adr}</td>
        </tr>
    `).join('');

    return `
        <details class="mb-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg" open>
            <summary class="px-4 py-2 cursor-pointer font-semibold text-green-700 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-900/40 rounded-lg">
                 Részletek (${diagram.changes.length} változás)
            </summary>
            <div class="px-4 pb-3">
                <table class="w-full mt-2 text-left border-collapse">
                    <thead class="bg-green-100 dark:bg-green-900/40">
                        <tr>
                            <th class="px-2 py-1 text-sm">#</th>
                            <th class="px-2 py-1 text-sm">Szekció</th>
                            <th class="px-2 py-1 text-sm">Változás</th>
                            <th class="px-2 py-1 text-sm">Forrás</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-green-200 dark:divide-green-800">
                        ${rows}
                    </tbody>
                </table>
            </div>
        </details>`;
}

// Generate diagram HTML
function generateDiagramHTML(diagram) {
    const svgPath = path.join(DIAGRAMS_DIR, `${diagram.id}.svg`);
    let svgContent = '';

    if (fs.existsSync(svgPath)) {
        svgContent = fs.readFileSync(svgPath, 'utf8');
    } else {
        svgContent = `<div class="p-8 text-center text-gray-500">
            <p> SVG nem található: ${diagram.id}.svg</p>
        </div>`;
    }

    return `
        <div class="diagram-container" id="${diagram.id}">
            <div class="flex justify-between items-start mb-4">
                <h3 class="text-xl font-semibold">
                    ${diagram.title}
                    ${generateStatusBadge(diagram.status)}
                </h3>
                <button @click="expanded['${diagram.id}'] = !expanded['${diagram.id}']"
                        class="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm transition-colors">
                    <span x-text="expanded['${diagram.id}'] ? ' Bezár' : ' Megnyit'"></span>
                </button>
            </div>
            <div class="explanation-box mb-3">
                <p class="text-sm"><strong></strong> ${diagram.description}</p>
            </div>
            ${generateChangesTable(diagram)}
            <div x-show="expanded['${diagram.id}']" x-collapse>
                <div class="diagram-wrapper mb-4">${svgContent}</div>
            </div>
        </div>`;
}

// Generate category content HTML
function generateCategoryContent(cat) {
    const diagrams = cat.diagrams.map(d => generateDiagramHTML(d)).join('\n');

    return `
        <div x-show="activeTab === '${cat.id}'" class="space-y-6">
            <div class="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border-l-4 border-green-500">
                <h2 class="text-2xl font-bold">${cat.name}</h2>
                <p class="text-gray-600 dark:text-gray-400 mt-2">${cat.description}</p>
            </div>
            ${diagrams}
        </div>`;
}

// Generate full HTML
function generateHTML() {
    let totalDiagrams = 0;
    DIAGRAM_CONFIG.categories.forEach(cat => {
        totalDiagrams += cat.diagrams.length;
    });

    const categoryButtons = DIAGRAM_CONFIG.categories.map(cat => `
            <button @click="activeTab = '${cat.id}'"
                :class="activeTab === '${cat.id}' ? 'bg-green-600 text-white' : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'"
                class="w-full text-left px-3 py-2 rounded-lg text-sm transition-colors border-2 border-green-400 bg-green-50 dark:bg-green-900/30">
                ${cat.name}
                <span class="float-right opacity-70">${cat.diagrams.length}</span>
            </button>
        `).join('\n');

    const categoryContents = DIAGRAM_CONFIG.categories.map(cat => generateCategoryContent(cat)).join('\n');

    return `<!DOCTYPE html>
<html lang="hu" x-data="appData()" :class="{ 'dark': darkMode }">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>KGC ERP v3.0 - Új Diagramok (2025-12-12)</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <script src="https://cdn.tailwindcss.com"></script>
    <script defer src="https://cdn.jsdelivr.net/npm/@alpinejs/collapse@3.x.x/dist/cdn.min.js"></script>
    <script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"></script>
    <script>tailwind.config = { darkMode: 'class' }</script>
    <style>
        body { font-family: 'Inter', sans-serif; }
        .dark { background-color: rgb(17 24 39); color: rgb(243 244 246); }
        .sticky-sidebar { position: sticky; top: 1.5rem; max-height: calc(100vh - 3rem); overflow-y: auto; }
        .diagram-container { background: white; border: 2px solid #22c55e; border-radius: 12px; padding: 1.5rem; margin: 1.5rem 0; }
        .dark .diagram-container { background: rgb(31 41 55); border-color: rgb(34 197 94); }
        .diagram-wrapper { background: #f9fafb; border-radius: 0.5rem; padding: 1rem; overflow: auto; }
        .dark .diagram-wrapper { background: #2d3748; }
        .diagram-wrapper svg { display: block; margin: 0 auto; max-width: 100%; height: auto; }
        .dark .diagram-wrapper svg { filter: invert(0.9) hue-rotate(180deg); }
        .explanation-box { background: linear-gradient(to right, #f0fdf4, #dcfce7); border-left: 4px solid #22c55e; padding: 1rem; border-radius: 8px; }
        .dark .explanation-box { background: linear-gradient(to right, rgb(20 83 45 / 0.5), rgb(22 101 52 / 0.5)); }
        @media print { .no-print { display: none !important; } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.7; } }
        .animate-pulse { animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
    </style>
</head>
<body class="bg-gray-50 dark:bg-gray-900">
    <header class="bg-gradient-to-r from-green-600 via-green-700 to-green-800 text-white shadow-lg no-print">
        <div class="container mx-auto px-4 py-6">
            <div class="flex flex-col lg:flex-row justify-between items-center">
                <div class="text-center lg:text-left mb-4 lg:mb-0">
                    <h1 class="text-3xl font-bold"> KGC ERP v3.0 - Új Diagramok</h1>
                    <p class="mt-1 text-green-100">Multi-location Készlet | Automatizált Elszámolás | PWA Push</p>
                    <p class="text-sm mt-2">
                        <span class="bg-white/20 px-2 py-1 rounded mr-2"> ${totalDiagrams} új diagram</span>
                        <span class="bg-green-500 px-2 py-1 rounded mr-2"> 3 modul</span>
                        <span class="bg-purple-500 px-2 py-1 rounded"> 2025-12-12</span>
                    </p>
                </div>
                <div class="flex space-x-3">
                    <button @click="darkMode = !darkMode" class="p-3 bg-white/20 hover:bg-white/30 rounded-lg transition-colors" title="Sötét/Világos mód">
                        <span x-text="darkMode ? '' : ''"></span>
                    </button>
                    <button onclick="window.print()" class="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"> Nyomtatás</button>
                </div>
            </div>
        </div>
    </header>

    <!-- Summary Banner -->
    <div class="bg-gradient-to-r from-green-100 to-blue-100 dark:from-green-900/30 dark:to-blue-900/30 border-b border-green-200 dark:border-green-800 no-print">
        <div class="container mx-auto px-4 py-4">
            <h2 class="text-lg font-bold text-green-800 dark:text-green-200 mb-2"> Fit-Gap Analysis alapján (2025-12-12)</h2>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div class="bg-white/50 dark:bg-gray-800/50 p-3 rounded-lg">
                    <h3 class="font-bold text-green-600"> Multi-location Készlet</h3>
                    <ul class="mt-1 text-gray-700 dark:text-gray-300">
                        <li>• KÉSZLET_HELY entitás</li>
                        <li>• Kiadási prioritás (1-5)</li>
                        <li>• R.1/R.2 algoritmus</li>
                        <li>• Felülbírálás audit log</li>
                    </ul>
                </div>
                <div class="bg-white/50 dark:bg-gray-800/50 p-3 rounded-lg">
                    <h3 class="font-bold text-blue-600"> Automatizált Elszámolás</h3>
                    <ul class="mt-1 text-gray-700 dark:text-gray-300">
                        <li>• BANK_TRANZAKCIÓ entitás</li>
                        <li>• Pontozási rendszer (0-100)</li>
                        <li>• OTP/K&H/GLS/DPD integráció</li>
                        <li>• Auto/Javasolt/Kézi párosítás</li>
                    </ul>
                </div>
                <div class="bg-white/50 dark:bg-gray-800/50 p-3 rounded-lg">
                    <h3 class="font-bold text-purple-600"> PWA Push Értesítések</h3>
                    <ul class="mt-1 text-gray-700 dark:text-gray-300">
                        <li>• Firebase Cloud Messaging</li>
                        <li>• PUSH_SUBSCRIPTION entitás</li>
                        <li>• Service Worker</li>
                        <li>• Offline működés (ADR-002)</li>
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
                        <span class="mr-2"></span> Modulok
                    </h2>
                    <div class="space-y-2">
                        ${categoryButtons}
                    </div>
                    <div class="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <h3 class="text-sm font-bold mb-2">Forrás dokumentumok:</h3>
                        <div class="space-y-1 text-xs text-gray-600 dark:text-gray-400">
                            <p> fit-gap-analysis-2025-12-12.md</p>
                            <p> KGC-notes-2025-12-12-01.md</p>
                            <p> KGC-notes-2025-12-12-02.md</p>
                        </div>
                    </div>
                </div>
            </aside>

            <main class="col-span-12 lg:col-span-9">
                ${categoryContents}
            </main>
        </div>
    </div>

    <footer class="bg-gray-800 text-white py-6 mt-8 no-print">
        <div class="container mx-auto px-4 text-center">
            <p>KGC ERP v3.0 - Új Diagramok | Generálva: 2025-12-12</p>
            <p class="text-sm text-gray-400 mt-1"> ${totalDiagrams} új diagram |  ${DIAGRAM_CONFIG.categories.length} modul</p>
        </div>
    </footer>

    <script>
        function appData() {
            return {
                darkMode: localStorage.getItem('darkMode') === 'true',
                activeTab: 'cat-keszlet',
                expanded: {
                    '2-keszlet-multi-location-erd-2025-12-12': true,
                    '02-ertekesites-erd-2025-12-12': true,
                    '2-kiadasi-optimalizacio-folyamat-2025-12-12': true,
                    '01-ugyfelfelvitel-folyamat-2025-12-12': true,
                    '02-ertekesites-folyamat-2025-12-12': true,
                    '5-automatizalt-elszamolas-erd-2025-12-12': true,
                    '5-automatizalt-elszamolas-folyamat-2025-12-12': true,
                    '05-penzugy-folyamat-2025-12-12': true,
                    '07-ertesitesek-erd-2025-12-12': true,
                    '7-ertesitesek-folyamat-2025-12-12': true
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

// Main execution
console.log('Generating HTML file for 2025-12-12 diagrams...');
const html = generateHTML();
fs.writeFileSync(OUTPUT_FILE, html);
let totalDiagrams = 0;
DIAGRAM_CONFIG.categories.forEach(cat => {
    totalDiagrams += cat.diagrams.length;
});
console.log(`Generated: ${OUTPUT_FILE}`);
console.log(`  - ${DIAGRAM_CONFIG.categories.length} categories`);
console.log(`  - ${totalDiagrams} new diagrams`);
