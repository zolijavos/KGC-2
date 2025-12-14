#!/usr/bin/env node
/**
 * KGC ERP Diagram HTML Generator v3.0
 * Generates a portable HTML file with all diagrams embedded
 * Includes both original and updated diagrams with proper status badges
 *
 * Usage: node generate-html.js
 */

const fs = require('fs');
const path = require('path');

const DIAGRAMS_DIR = path.join(__dirname, '..', 'diagrams');
const OUTPUT_FILE = path.join(__dirname, '..', 'KGC-ERP-v3-Diagramok-2025-12-12.html');

// Full diagram configuration with ALL diagrams
const DIAGRAM_CONFIG = {
    categories: [
        {
            id: 'cat-0',
            name: '0. Master Áttekintés',
            description: 'Teljes KGC ERP v3.0 rendszer átfogó folyamatábrája - minden modul egy diagramon.',
            diagrams: [
                {
                    id: '00-kgc-erp-master-flow-2025-12-12',
                    title: 'KGC ERP Master Flow',
                    description: 'Ügyfélközpontú áttekintés: Bérlés, Eladás, Szerviz, Visszavétel, Árajánlat, Leltár, Átcsoportosítás, Bevételezés + P5 Elszámolás + N.3 Értesítések.',
                    status: 'new',
                    changes: [
                        { section: 'R.1/R.2', change: 'Kiadási javaslat algoritmus (készlet optimalizáció)', adr: 'ADR-016' },
                        { section: 'P5', change: 'Automatizált elszámolás pontozással (40+35+15+10)', adr: 'ADR-015' },
                        { section: 'N.3', change: 'PWA Push értesítések (Firebase FCM)', adr: 'ADR-014' },
                        { section: 'KÉSZLET_HELY', change: 'Multi-lokációs készletkezelés', adr: 'ADR-016' },
                        { section: 'Ágak', change: '8 fő üzleti folyamat egyetlen diagramon', adr: 'Master' }
                    ]
                }
            ]
        },
        {
            id: 'cat-1',
            name: '1. Ugyfél Felvétel és Bérlés',
            description: 'Az ügyfél regisztrációtól a bérleti szerződés kiállításáig tartó teljes folyamat.',
            diagrams: [
                {
                    id: '1-ugyfelfelvitel-folyamat-2025-12-11',
                    title: 'Folyamatábra',
                    description: 'Teljes ügyfél felvétel folyamata MyPos kaucióval és tartozék checklisttel.',
                    status: 'updated',
                    changes: [
                        { section: 'Kaució', change: 'MyPos kártyás fizetés (+2% díj)', adr: 'ADR-013' },
                        { section: 'Tartozék', change: 'BÉRLÉS_TARTOZÉK checklist (tok, töltő, akku)', adr: 'ADR-013' },
                        { section: 'Kiadás', change: 'kiadta_fizikai_user_id rögzítés', adr: 'ADR-013' },
                        { section: 'Visszavétel', change: 'visszavette_fizikai_user_id rögzítés', adr: 'ADR-013' },
                        { section: 'Cég', change: 'vat_zone (HU/EU/NON_EU) mező', adr: 'Fit-Gap' },
                        { section: 'Meghatalmazott', change: 'CÉG_MEGHATALMAZOTT entitás', adr: 'ADR-013' }
                    ]
                },
                {
                    id: '1-ugyfelfelvitel-dontesi-fa-2025-12-11',
                    title: 'Döntési Fa',
                    description: 'Kaució fizetési mód és meghatalmazott ellenőrzés döntési pontok.',
                    status: 'updated',
                    changes: [
                        { section: 'D4', change: 'Kaució fizetési mód (készpénz/kártya)', adr: 'ADR-013' },
                        { section: 'D7', change: 'Van kár visszahozáskor?', adr: 'ADR-013' },
                        { section: 'D9', change: 'Visszafizetés módja (A1+A3+B2 szabály)', adr: 'ADR-013' },
                        { section: 'D3', change: 'Van meghatalmazott? ellenőrzés', adr: 'ADR-013' }
                    ]
                },
                {
                    id: '1-ugyfelfelvitel-dfd',
                    title: 'Adatfolyam (DFD)',
                    description: 'Adatok mozgása a rendszerben - bemenetek, kimenetek, NAV és nyomtató integráció.',
                    status: null
                },
                {
                    id: '1-ugyfelfelvitel-erd-2025-12-11',
                    title: 'ERD Diagram',
                    description: 'Entitás-kapcsolat diagram az új entitásokkal és mezőkkel.',
                    status: 'updated',
                    changes: [
                        { section: 'PARTNER', change: 'mothers_name, birth_place, birth_date, is_employee', adr: 'Fit-Gap' },
                        { section: 'CÉG', change: 'vat_zone (HU/EU/NON_EU)', adr: 'Fit-Gap' },
                        { section: 'ÚJ', change: 'CÉG_MEGHATALMAZOTT entitás', adr: 'ADR-013' },
                        { section: 'ÚJ', change: 'BÉRLÉS_TARTOZÉK entitás', adr: 'ADR-013' },
                        { section: 'ÚJ', change: 'KAUCIÓ_JEGYZŐKÖNYV entitás', adr: 'ADR-013' },
                        { section: 'BÉRLÉS', change: 'MyPos mezők (kaucio_tipus, payment_token)', adr: 'ADR-013' },
                        { section: 'FELHASZNÁLÓ', change: 'pin_kod (4-jegyű)', adr: 'ADR-013' }
                    ]
                },
                {
                    id: '1-ugyfelfelvitel-rendszer',
                    title: 'Rendszer Áttekintés',
                    description: 'Teljes rendszer komponens áttekintés - PWA, API, adatbázis.',
                    status: null
                }
            ]
        },
        {
            id: 'cat-2',
            name: '2. Értékesítés és Készlet',
            description: 'Értékesítési folyamatok és készletgazdálkodás.',
            diagrams: [
                {
                    id: '2-ertekesites-folyamat',
                    title: 'Értékesítési Folyamat',
                    description: 'Értékesítés teljes folyamata a számla kiállításáig.',
                    status: null
                },
                {
                    id: '2-ertekesites-erd',
                    title: 'Értékesítési ERD',
                    description: 'Értékesítés adatmodellje - ügyfelek, termékek, rendelések.',
                    status: null
                },
                {
                    id: '2-ertekesites-keszlet',
                    title: 'Készlet Kezelés',
                    description: 'Készlet mozgások és nyilvántartás.',
                    status: null
                }
            ]
        },
        {
            id: 'cat-3',
            name: '3. Bérgép Kezelés',
            description: 'Bérgépek nyilvántartása, árazás és tartozékok kezelése.',
            diagrams: [
                {
                    id: '3-bergep-folyamat-2025-12-11',
                    title: 'Bérgép Folyamat',
                    description: 'Bérgép kiválasztás, hétvége árazás és tartozékok.',
                    status: 'updated',
                    changes: [
                        { section: 'Árazás', change: 'Hétvége opció (weekend_multiplier: 1.5)', adr: 'Fit-Gap' },
                        { section: 'pricing_unit', change: 'hour/day/weekend enum', adr: 'Fit-Gap' },
                        { section: 'ÚJ', change: 'BÉRGÉP_TARTOZÉK entitás', adr: 'Fit-Gap' },
                        { section: 'ÚJ', change: 'BÉRGÉP_JAVÍTÁS_CIKK entitás', adr: 'Fit-Gap' }
                    ]
                }
            ]
        },
        {
            id: 'cat-4',
            name: '4. Szerviz Folyamatok',
            description: 'Szerviz munkalapok, garanciális javítások és tartozék kezelés.',
            diagrams: [
                {
                    id: '4-szerviz-folyamat',
                    title: 'Szerviz Folyamat',
                    description: 'Szerviz munkalap felvételtől a lezárásig.',
                    status: null
                },
                {
                    id: '4-szerviz-erd-2025-12-11',
                    title: 'Szerviz ERD',
                    description: 'Szerviz entitások intake_type-pal és tartozék checklisttel.',
                    status: 'updated',
                    changes: [
                        { section: 'MUNKALAP', change: 'intake_type (warranty/repair/quote)', adr: 'ADR-013' },
                        { section: 'MUNKALAP', change: 'bevizsgalasi_dij (0 Ft warranty-nél)', adr: 'ADR-013' },
                        { section: 'MUNKALAP', change: 'internal_notes (indoklás mező)', adr: 'ADR-013' },
                        { section: 'ÚJ', change: 'SZERVIZ_TARTOZÉK entitás', adr: 'ADR-013' },
                        { section: 'ÚJ', change: 'MUNKALAP_CSATOLMÁNY entitás', adr: 'ADR-013' }
                    ]
                },
                {
                    id: '4-szerviz-munkalap',
                    title: 'Munkalap Részletek',
                    description: 'Munkalap struktúra és státusz kezelés.',
                    status: null
                }
            ]
        },
        {
            id: 'cat-5',
            name: '5. Pénzügy',
            description: 'Pénzügyi folyamatok és archiválás.',
            diagrams: [
                {
                    id: '5-penzugy-folyamat',
                    title: 'Pénzügyi Folyamat',
                    description: 'Számlázás, fizetések kezelése, pénzügyi lezárások.',
                    status: null
                },
                {
                    id: '5-penzugy-archivalas',
                    title: 'Archiválási Folyamat',
                    description: 'Dokumentumok archiválása és visszakeresése.',
                    status: null
                }
            ]
        },
        {
            id: 'cat-6',
            name: '6. Felhasználó Kezelés',
            description: 'Felhasználók, jogosultságok és egyéb funkciók.',
            diagrams: [
                {
                    id: '6-egyeb-rendeles',
                    title: 'Rendelés Kezelés',
                    description: 'Beszerzési rendelések és szállítók.',
                    status: null
                },
                {
                    id: '6-egyeb-felhasznalo-2025-12-11',
                    title: 'Felhasználó Kezelés',
                    description: '3-szintű login rendszer PIN kóddal.',
                    status: 'updated',
                    changes: [
                        { section: 'Login', change: '3-szintű rendszer (Szint 0/1/2)', adr: 'ADR-013' },
                        { section: 'PIN', change: '4-jegyű PIN kód bejelentkezés', adr: 'ADR-013' },
                        { section: 'Szint 0', change: 'Csak PIN (kiosk mód)', adr: 'ADR-013' },
                        { section: 'Szint 1', change: 'Email + PIN (normál)', adr: 'ADR-013' },
                        { section: 'Szint 2', change: 'Email + jelszó + 2FA (admin)', adr: 'ADR-013' }
                    ]
                }
            ]
        },
        {
            id: 'cat-7',
            name: '7. Új Funkciók (2025)',
            description: 'Új és tervezett fejlesztések 2025-re.',
            diagrams: [
                {
                    id: '7-ertesitesek-folyamat',
                    title: 'Értesítések',
                    description: 'Email és push értesítések kezelése.',
                    status: null
                },
                {
                    id: '7-fizetesi-fegyelem',
                    title: 'Fizetési Fegyelem',
                    description: 'Lejárt számlák kezelése, felszólítások.',
                    status: null
                },
                {
                    id: '7-e-szamla-folyamat',
                    title: 'E-Számla Folyamat',
                    description: 'Elektronikus számlázás NAV integrációval.',
                    status: null
                },
                {
                    id: '7-arrazas-automatizalas',
                    title: 'Árazás Automatizálás',
                    description: 'Dinamikus árazási szabályok és kedvezmények.',
                    status: null
                },
                {
                    id: '7-erd-uj-entitasok',
                    title: 'Új Entitások ERD',
                    description: '2025-ös bővítések adatmodellje.',
                    status: null
                }
            ]
        },
        {
            id: 'cat-8',
            name: '8. Legújabb Követelmények',
            description: 'Holding struktúra, részletfizetés és garanciális javítás.',
            diagrams: [
                {
                    id: '8-holding-struktura',
                    title: 'Holding Struktúra',
                    description: 'Multi-tenant holding architektúra.',
                    status: null
                },
                {
                    id: '8-reszletfizetes-folyamat',
                    title: 'Részletfizetés',
                    description: 'Részletfizetési konstrukciók kezelése.',
                    status: null
                },
                {
                    id: '8-garancialis-javitas-2025-12-11',
                    title: 'Garanciális Javítás',
                    description: 'Garanciális javítás folyamat intake_type-pal.',
                    status: 'updated',
                    changes: [
                        { section: 'intake_type', change: 'warranty típus = 0 Ft bevizsgálási díj', adr: 'ADR-013' },
                        { section: 'Döntés', change: 'Garancia érvényes? ellenőrzés', adr: 'ADR-013' },
                        { section: 'Tartozék', change: 'SZERVIZ_TARTOZÉK checklist', adr: 'ADR-013' },
                        { section: 'Csatolmány', change: 'Garancialevél fotó feltöltés', adr: 'ADR-013' }
                    ]
                },
                {
                    id: '8-deployment-architektura',
                    title: 'Deployment Architektúra',
                    description: 'Telepítési és infrastruktúra diagram.',
                    status: null
                },
                {
                    id: '8-keszlet-szinkron',
                    title: 'Készlet Szinkronizáció',
                    description: 'Multi-site készlet szinkronizáció.',
                    status: null
                }
            ]
        },
        {
            id: 'cat-9',
            name: '9. Architektúra (ADR)',
            description: 'Architektúra döntési rekordok és technikai dokumentáció.',
            diagrams: [
                {
                    id: '11-multi-tenant-sema-struktura-2025-12-11',
                    title: 'Multi-tenant Séma',
                    description: 'Multi-tenant adatbázis séma struktúra (A+B hibrid).',
                    status: 'new',
                    changes: [
                        { section: 'Központi', change: 'company, partner, shared_product táblák', adr: 'ADR-014' },
                        { section: 'Tenant', change: 'company_{id} sémák lokális adatokkal', adr: 'ADR-014' },
                        { section: 'Partner', change: 'Központi regisztráció, lokális bővítés', adr: 'ADR-014' },
                        { section: 'Hibrid', change: 'A+B architektúra (közös + tenant)', adr: 'ADR-014' }
                    ]
                },
                {
                    id: '10-arastrategia-hierarchia',
                    title: 'Árstratégia Hierarchia',
                    description: 'Árazási hierarchia és kedvezmény rendszer.',
                    status: null
                }
            ]
        }
    ]
};

// Calculate summary stats
function calculateStats() {
    let total = 0, updated = 0, newDiagrams = 0;
    DIAGRAM_CONFIG.categories.forEach(cat => {
        cat.diagrams.forEach(d => {
            total++;
            if (d.status === 'updated') updated++;
            if (d.status === 'new') newDiagrams++;
        });
    });
    return { total, updated, new: newDiagrams };
}

// Generate category button HTML
function generateCategoryButton(cat, hasChanges) {
    const changeClass = hasChanges ? 'border-2 border-orange-400 bg-orange-50 dark:bg-orange-900/30' : '';
    const changeIcon = hasChanges ? '<span class="ml-1 text-orange-600 dark:text-orange-400">🔄</span>' : '';

    return `
            <button @click="activeTab = '${cat.id}'"
                :class="activeTab === '${cat.id}' ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'"
                class="w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${changeClass}">
                ${cat.name}
                <span class="float-right opacity-70">${cat.diagrams.length}</span>
                ${changeIcon}
            </button>
        `;
}

// Generate status badge HTML
function generateStatusBadge(status) {
    if (status === 'updated') {
        return '<span class="ml-2 px-3 py-1 bg-orange-500 text-white text-sm rounded-full font-bold animate-pulse">🔄 FRISSÍTVE</span>';
    } else if (status === 'new') {
        return '<span class="ml-2 px-3 py-1 bg-green-500 text-white text-sm rounded-full font-bold animate-pulse">🆕 ÚJ</span>';
    }
    return '';
}

// Generate changes table HTML
function generateChangesTable(diagram) {
    if (!diagram.changes || diagram.changes.length === 0) return '';

    const rows = diagram.changes.map((c, i) => `
        <tr class="${i % 2 === 0 ? 'bg-orange-50 dark:bg-orange-900/20' : ''}">
            <td class="px-2 py-1 text-sm">${i + 1}</td>
            <td class="px-2 py-1 text-sm font-medium">${c.section}</td>
            <td class="px-2 py-1 text-sm">${c.change}</td>
            <td class="px-2 py-1 text-sm text-blue-600 dark:text-blue-400">${c.adr}</td>
        </tr>
    `).join('');

    return `
        <details class="mb-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
            <summary class="px-4 py-2 cursor-pointer font-semibold text-orange-700 dark:text-orange-300 hover:bg-orange-100 dark:hover:bg-orange-900/40 rounded-lg">
                📝 Változások (${diagram.changes.length} módosítás) - Kattints a részletekért
            </summary>
            <div class="px-4 pb-3">
                <table class="w-full mt-2 text-left border-collapse">
                    <thead class="bg-orange-100 dark:bg-orange-900/40">
                        <tr>
                            <th class="px-2 py-1 text-sm">#</th>
                            <th class="px-2 py-1 text-sm">Szekció</th>
                            <th class="px-2 py-1 text-sm">Változás</th>
                            <th class="px-2 py-1 text-sm">Forrás</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-orange-200 dark:divide-orange-800">
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
            <p>📄 SVG nem található: ${diagram.id}.svg</p>
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
                        class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors">
                    <span x-text="expanded['${diagram.id}'] ? '➖ Bezár' : '➕ Megnyit'"></span>
                </button>
            </div>
            <div class="explanation-box mb-3">
                <p class="text-sm"><strong>📋</strong> ${diagram.description}</p>
            </div>
            ${generateChangesTable(diagram)}
            <div x-show="expanded['${diagram.id}']" x-collapse>
                <div class="diagram-wrapper mb-4">${svgContent}</div>
            </div>
            <div class="border-t pt-4 mt-4">
                <label class="text-sm font-semibold">💬 Megjegyzések:</label>
                <textarea x-model="notes['${diagram.id}']" @input="saveNotes()" rows="2"
                    class="w-full mt-2 p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                    placeholder="Írj ide megjegyzést..."></textarea>
            </div>
        </div>`;
}

// Generate category content HTML
function generateCategoryContent(cat) {
    const updatedCount = cat.diagrams.filter(d => d.status === 'updated').length;
    const newCount = cat.diagrams.filter(d => d.status === 'new').length;

    let badge = '';
    if (updatedCount > 0 && newCount > 0) {
        badge = `<span class="ml-2 px-2 py-1 bg-orange-500 text-white text-xs rounded-full">${updatedCount} frissítve</span>
                 <span class="ml-1 px-2 py-1 bg-green-500 text-white text-xs rounded-full">${newCount} új</span>`;
    } else if (updatedCount > 0) {
        badge = `<span class="ml-2 px-2 py-1 bg-orange-500 text-white text-xs rounded-full">${updatedCount} frissítve</span>`;
    } else if (newCount > 0) {
        badge = `<span class="ml-2 px-2 py-1 bg-green-500 text-white text-xs rounded-full">${newCount} új</span>`;
    }

    const diagrams = cat.diagrams.map(d => generateDiagramHTML(d)).join('\n');

    return `
        <div x-show="activeTab === '${cat.id}'" class="space-y-6">
            <div class="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border-l-4 border-blue-500">
                <h2 class="text-2xl font-bold">${cat.name} ${badge}</h2>
                <p class="text-gray-600 dark:text-gray-400 mt-2">${cat.description}</p>
            </div>
            ${diagrams}
        </div>`;
}

// Generate full HTML
function generateHTML() {
    const stats = calculateStats();

    const categoryButtons = DIAGRAM_CONFIG.categories.map(cat => {
        const hasChanges = cat.diagrams.some(d => d.status === 'updated' || d.status === 'new');
        return generateCategoryButton(cat, hasChanges);
    }).join('\n');

    const categoryContents = DIAGRAM_CONFIG.categories.map(cat => generateCategoryContent(cat)).join('\n');

    return `<!DOCTYPE html>
<html lang="hu" x-data="appData()" :class="{ 'dark': darkMode }">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>KGC ERP v3.0 - Rendszer Diagramok (2025-12-11)</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <script src="https://cdn.tailwindcss.com"></script>
    <script defer src="https://cdn.jsdelivr.net/npm/@alpinejs/collapse@3.x.x/dist/cdn.min.js"></script>
    <script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"></script>
    <script>tailwind.config = { darkMode: 'class' }</script>
    <style>
        body { font-family: 'Inter', sans-serif; }
        .dark { background-color: rgb(17 24 39); color: rgb(243 244 246); }
        .sticky-sidebar { position: sticky; top: 1.5rem; max-height: calc(100vh - 3rem); overflow-y: auto; }
        .diagram-container { background: white; border: 2px solid #e5e7eb; border-radius: 12px; padding: 1.5rem; margin: 1.5rem 0; }
        .dark .diagram-container { background: rgb(31 41 55); border-color: rgb(55 65 81); }
        .diagram-wrapper { background: #f9fafb; border-radius: 0.5rem; padding: 1rem; overflow: auto; }
        .dark .diagram-wrapper { background: #2d3748; }
        .diagram-wrapper svg { display: block; margin: 0 auto; max-width: 100%; height: auto; }
        .dark .diagram-wrapper svg { filter: invert(0.9) hue-rotate(180deg); }
        .explanation-box { background: linear-gradient(to right, #eff6ff, #dbeafe); border-left: 4px solid #3b82f6; padding: 1rem; border-radius: 8px; }
        .dark .explanation-box { background: linear-gradient(to right, rgb(30 58 138 / 0.5), rgb(29 78 216 / 0.5)); }
        @media print { .no-print { display: none !important; } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.7; } }
        .animate-pulse { animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
    </style>
</head>
<body class="bg-gray-50 dark:bg-gray-900">
    <header class="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 text-white shadow-lg no-print">
        <div class="container mx-auto px-4 py-6">
            <div class="flex flex-col lg:flex-row justify-between items-center">
                <div class="text-center lg:text-left mb-4 lg:mb-0">
                    <h1 class="text-3xl font-bold">KGC ERP v3.0 - Rendszer Diagramok</h1>
                    <p class="mt-1 text-blue-100">Multi-tenant | PWA Offline | RBAC | ADR-013/014</p>
                    <p class="text-sm mt-2">
                        <span class="bg-white/20 px-2 py-1 rounded mr-2">📊 ${stats.total} diagram</span>
                        <span class="bg-orange-500 px-2 py-1 rounded mr-2">🔄 ${stats.updated} frissítve</span>
                        <span class="bg-green-500 px-2 py-1 rounded mr-2">🆕 ${stats.new} új</span>
                        <span class="bg-purple-500 px-2 py-1 rounded">📅 2025-12-11</span>
                    </p>
                </div>
                <div class="flex space-x-3">
                    <button @click="darkMode = !darkMode" class="p-3 bg-white/20 hover:bg-white/30 rounded-lg transition-colors" title="Sötét/Világos mód">
                        <span x-text="darkMode ? '☀️' : '🌙'"></span>
                    </button>
                    <button @click="exportNotes()" class="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors">📥 CSV Export</button>
                    <button @click="$refs.fileInput.click()" class="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors">📤 CSV Import</button>
                    <input type="file" x-ref="fileInput" @change="importNotes($event)" accept=".csv" class="hidden">
                </div>
            </div>
        </div>
    </header>

    <!-- Summary Banner -->
    <div class="bg-gradient-to-r from-orange-100 to-green-100 dark:from-orange-900/30 dark:to-green-900/30 border-b border-orange-200 dark:border-orange-800 no-print">
        <div class="container mx-auto px-4 py-4">
            <h2 class="text-lg font-bold text-orange-800 dark:text-orange-200 mb-2">📋 Változások összefoglalója (2025-12-11)</h2>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div class="bg-white/50 dark:bg-gray-800/50 p-3 rounded-lg">
                    <h3 class="font-bold text-orange-600">🔄 ADR-013 Döntések</h3>
                    <ul class="mt-1 text-gray-700 dark:text-gray-300">
                        <li>• 4-jegyű PIN kód bejelentkezés</li>
                        <li>• MyPos kártyás kaució</li>
                        <li>• Bevizsgálási díj szabályok</li>
                        <li>• Meghatalmazott kezelés</li>
                    </ul>
                </div>
                <div class="bg-white/50 dark:bg-gray-800/50 p-3 rounded-lg">
                    <h3 class="font-bold text-green-600">🆕 Új Entitások</h3>
                    <ul class="mt-1 text-gray-700 dark:text-gray-300">
                        <li>• CÉG_MEGHATALMAZOTT</li>
                        <li>• BÉRLÉS_TARTOZÉK</li>
                        <li>• SZERVIZ_TARTOZÉK</li>
                        <li>• MUNKALAP_CSATOLMÁNY</li>
                        <li>• KAUCIÓ_JEGYZŐKÖNYV</li>
                    </ul>
                </div>
                <div class="bg-white/50 dark:bg-gray-800/50 p-3 rounded-lg">
                    <h3 class="font-bold text-blue-600">📊 Egyéb Változások</h3>
                    <ul class="mt-1 text-gray-700 dark:text-gray-300">
                        <li>• Hétvége árazás (1.5x)</li>
                        <li>• intake_type mező szervizben</li>
                        <li>• VAT zone (HU/EU/NON_EU)</li>
                        <li>• 3-szintű login rendszer</li>
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
                        <span class="mr-2">📋</span> Kategóriák
                    </h2>
                    <div class="space-y-2">
                        ${categoryButtons}
                    </div>
                    <div class="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <h3 class="text-sm font-bold mb-2">Jelmagyarázat:</h3>
                        <div class="space-y-1 text-xs">
                            <p><span class="inline-block w-3 h-3 bg-green-500 rounded mr-2"></span> 🆕 Új diagram</p>
                            <p><span class="inline-block w-3 h-3 bg-orange-500 rounded mr-2"></span> 🔄 Frissített</p>
                        </div>
                    </div>
                    <p class="mt-4 text-xs text-gray-500 dark:text-gray-400">💡 Megjegyzések localStorage-ban mentődnek</p>
                </div>
            </aside>

            <main class="col-span-12 lg:col-span-9">
                ${categoryContents}
            </main>
        </div>
    </div>

    <footer class="bg-gray-800 text-white py-6 mt-8 no-print">
        <div class="container mx-auto px-4 text-center">
            <p>KGC ERP v3.0 - Rendszer Diagramok | Generálva: 2025-12-11</p>
            <p class="text-sm text-gray-400 mt-1">📊 ${stats.total} diagram | 🔄 ${stats.updated} frissítve | 🆕 ${stats.new} új</p>
        </div>
    </footer>

    <script>
        function appData() {
            return {
                darkMode: localStorage.getItem('darkMode') === 'true',
                activeTab: 'cat-1',
                expanded: {},
                notes: JSON.parse(localStorage.getItem('diagramNotes') || '{}'),

                saveNotes() {
                    localStorage.setItem('diagramNotes', JSON.stringify(this.notes));
                },

                exportNotes() {
                    const csv = Object.entries(this.notes)
                        .filter(([_, v]) => v)
                        .map(([k, v]) => \`"\${k}","\${v.replace(/"/g, '""')}"\`)
                        .join('\\n');
                    const blob = new Blob(['Diagram,Megjegyzés\\n' + csv], { type: 'text/csv' });
                    const a = document.createElement('a');
                    a.href = URL.createObjectURL(blob);
                    a.download = 'kgc-diagram-notes-' + new Date().toISOString().slice(0, 10) + '.csv';
                    a.click();
                },

                importNotes(event) {
                    const file = event.target.files[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        const lines = e.target.result.split('\\n').slice(1);
                        lines.forEach(line => {
                            const match = line.match(/"([^"]+)","([^"]*)"/);
                            if (match) this.notes[match[1]] = match[2].replace(/""/g, '"');
                        });
                        this.saveNotes();
                    };
                    reader.readAsText(file);
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
console.log('Generating HTML file...');
const html = generateHTML();
fs.writeFileSync(OUTPUT_FILE, html);
const stats = calculateStats();
console.log(`✓ Generated: ${OUTPUT_FILE}`);
console.log(`  - ${DIAGRAM_CONFIG.categories.length} categories`);
console.log(`  - ${stats.total} diagrams (${stats.updated} updated, ${stats.new} new)`);
