const fs = require('fs');
const path = require('path');

// SVG fájlok beolvasása
const svgDir = path.join(__dirname, '../../ERP/Inventory/flowcharts');
const outputFile = path.join(__dirname, '../KGC-ERP-v6-Diagramok-2025-12-29.html');

const diagrams = [
    {
        id: 'inv-01-business-process-berles',
        file: 'kgc-business-process-berles.svg',
        title: 'Bérlési Folyamat',
        badge: '🆕 ÚJ',
        badgeClass: 'bg-green-500 text-white',
        description: 'Ügyfél bérlési igény → készlet ellenőrzés → jóváhagyás → szerződés → kiszállítás (8 lépés, 2 döntés)',
        changes: [
            { section: 'v2.0', change: 'Multi-Location picking javaslat algoritmus', source: 'ADR-016' },
            { section: 'UI', change: 'Picking lista generálás (melyik polcról?)', source: 'Feature' }
        ]
    },
    {
        id: 'inv-02-algorithm-api',
        file: 'kgc-algorithm-inventory-api.svg',
        title: 'Inventory API - checkBergepAvailability()',
        badge: '🆕 ÚJ',
        badgeClass: 'bg-green-500 text-white',
        description: 'API függvény belső működése: validációk, státusz ellenőrzések, error handling (7 lépés, 4 döntés)',
        changes: [
            { section: 'Query', change: 'SELECT FROM cikk_location ORDER BY kiadasi_prioritas', source: 'v2.0' },
            { section: 'Multi-lokáció', change: 'N tárolóhely támogatás egy cikkhez', source: 'ADR-016' }
        ]
    },
    {
        id: 'inv-03-user-journey',
        file: 'kgc-user-journey-berles.svg',
        title: 'Ügyfél Bérlési Út',
        badge: '🆕 ÚJ',
        badgeClass: 'bg-green-500 text-white',
        description: 'Ügyfél perspektívából a bérlési folyamat: igény felmérés → készlet → választás → szerződés → átvétel (6 lineáris lépés)',
        changes: [
            { section: 'UX', change: 'Raktáros picking lista UI bővítés', source: 'v2.0' }
        ]
    },
    {
        id: 'inv-04-webhook-sync',
        file: 'kgc-data-pipeline-webhook-sync.svg',
        title: 'Webhook Szinkronizáció',
        badge: null,
        badgeClass: null,
        description: 'Webhook event → HMAC ellenőrzés → adatkinyerés → Inventory API hívás → logging (7 lépés, 2 döntés)',
        changes: []
    },
    {
        id: 'inv-05-status-transitions',
        file: 'kgc-bergep-status-transitions.svg',
        title: 'Bérgép Státusz Átmenetek',
        badge: null,
        badgeClass: null,
        description: 'Bérgép életciklus: bent ↔ kint ↔ szerviz, terminal státuszok: sold, lost, destroyed (6 állapot, 8 átmenet)',
        changes: []
    }
];

// SVG-k beolvasása
const svgContents = {};
diagrams.forEach(diagram => {
    const svgPath = path.join(svgDir, diagram.file);
    svgContents[diagram.id] = fs.readFileSync(svgPath, 'utf8');
});

// HTML generálás
const html = `<!DOCTYPE html>
<html lang="hu" x-data="appData()" :class="{ 'dark': darkMode }">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>KGC ERP v6.0 - Inventory Modul Diagramok (2025-12-29)</title>
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
    <header class="bg-gradient-to-r from-green-600 via-green-700 to-green-800 text-white shadow-lg no-print">
        <div class="container mx-auto px-4 py-6">
            <div class="flex flex-col lg:flex-row justify-between items-center">
                <div class="text-center lg:text-left mb-4 lg:mb-0">
                    <h1 class="text-3xl font-bold">KGC ERP v6.0 - Inventory / Raktárkezelés Modul</h1>
                    <p class="mt-1 text-green-100">Multi-Warehouse | Serial Number Tracking | State Machine | v1.0 + v2.0 Feature</p>
                    <p class="text-sm mt-2">
                        <span class="bg-white/20 px-2 py-1 rounded mr-2">📊 5 diagram</span>
                        <span class="bg-green-500 px-2 py-1 rounded mr-2">🆕 5 új</span>
                        <span class="bg-purple-500 px-2 py-1 rounded">📅 2025-12-29</span>
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
    <div class="bg-gradient-to-r from-green-100 to-blue-100 dark:from-green-900/30 dark:to-blue-900/30 border-b border-green-200 dark:border-green-800 no-print">
        <div class="container mx-auto px-4 py-4">
            <h2 class="text-lg font-bold text-green-800 dark:text-green-200 mb-2">📋 Inventory Modul Áttekintés</h2>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div class="bg-white/50 dark:bg-gray-800/50 p-3 rounded-lg">
                    <h3 class="font-bold text-green-600">🎯 Core Funkciók (v1.0)</h3>
                    <ul class="mt-1 text-gray-700 dark:text-gray-300">
                        <li>• Központosított CIKK entitás</li>
                        <li>• Multi-Warehouse támogatás (2-5 raktár)</li>
                        <li>• Serial Number tracking (bérgépek)</li>
                        <li>• Bérgép státusz workflow (bent/kint/szerviz)</li>
                        <li>• Real-time készletfrissítés</li>
                    </ul>
                </div>
                <div class="bg-white/50 dark:bg-gray-800/50 p-3 rounded-lg">
                    <h3 class="font-bold text-blue-600">🚀 v2.0 Feature (Multi-Location)</h3>
                    <ul class="mt-1 text-gray-700 dark:text-gray-300">
                        <li>• Új: CIKK_LOCATION tábla</li>
                        <li>• Picking javaslat algoritmus</li>
                        <li>• Kiadási prioritás (pörgős készlet)</li>
                        <li>• Multi-lokációs készletkezelés</li>
                        <li>• Polc választó UI</li>
                    </ul>
                </div>
                <div class="bg-white/50 dark:bg-gray-800/50 p-3 rounded-lg">
                    <h3 class="font-bold text-purple-600">🔗 Integrációk</h3>
                    <ul class="mt-1 text-gray-700 dark:text-gray-300">
                        <li>• Bérlés modul (checkBergepAvailability)</li>
                        <li>• Szerviz modul (useServicePart)</li>
                        <li>• Értékesítés modul (decreaseStock)</li>
                        <li>• Pénzügy modul (getStockValuation)</li>
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
                        <span class="mr-2">📋</span> Diagramok
                    </h2>
                    <div class="space-y-2">
${diagrams.map((d, i) => `
                        <button @click="activeTab = 'inv-${i + 1}'"
                            :class="activeTab === 'inv-${i + 1}' ? 'bg-green-600 text-white' : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'"
                            class="w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${d.badge ? 'border-2 border-green-400 bg-green-50 dark:bg-green-900/30' : ''}">
                            ${i + 1}. ${d.title}
                            ${d.badge ? `<span class="ml-1 text-green-600 dark:text-green-400">🆕</span>` : ''}
                        </button>
`).join('')}
                    </div>
                    <div class="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <h3 class="text-sm font-bold mb-2">Jelmagyarázat:</h3>
                        <div class="space-y-1 text-xs">
                            <p><span class="inline-block w-3 h-3 bg-green-500 rounded mr-2"></span> 🆕 Új diagram</p>
                            <p><span class="inline-block w-3 h-3 bg-blue-500 rounded mr-2"></span> v1.0 alapfunkció</p>
                            <p><span class="inline-block w-3 h-3 bg-orange-500 rounded mr-2"></span> v2.0 bővítés</p>
                        </div>
                    </div>
                    <p class="mt-4 text-xs text-gray-500 dark:text-gray-400">💡 Megjegyzések localStorage-ban mentődnek</p>
                </div>
            </aside>

            <main class="col-span-12 lg:col-span-9">
                <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
                    <h3 class="font-bold text-blue-800 dark:text-blue-200 mb-2">📖 Kapcsolódó Dokumentáció</h3>
                    <ul class="text-sm space-y-1">
                        <li>• <a href="../ERP/Inventory/README.md" class="text-blue-600 hover:underline">Inventory Modul README</a> - Teljes áttekintés</li>
                        <li>• <a href="../ERP/Inventory/INVENTORY-INTEGRATION-ARCHITECTURE.md" class="text-blue-600 hover:underline">Integration Architecture</a> - Részletes specifikáció (~25 oldal)</li>
                        <li>• <a href="../ERP/Inventory/INVENTORY-FEATURE-MAPPING.md" class="text-blue-600 hover:underline">Feature Mapping</a> - v1.0 vs v2.0 különbségek</li>
                        <li>• <a href="../architecture/Feature-Multi-Location-Raktarkezeles-Architektura.md" class="text-blue-600 hover:underline">Multi-Location Feature</a> - v2.0 architektúra</li>
                    </ul>
                </div>

${diagrams.map((diagram, index) => `
                <div x-show="activeTab === 'inv-${index + 1}'" x-transition:enter.duration.300ms>
                    <div class="diagram-container" id="${diagram.id}">
                        <div class="flex justify-between items-start mb-4">
                            <h3 class="text-xl font-semibold">
                                ${diagram.title}
                                ${diagram.badge ? `<span class="ml-2 px-3 py-1 ${diagram.badgeClass} text-sm rounded-full font-bold animate-pulse">${diagram.badge}</span>` : ''}
                            </h3>
                            <button @click="expanded['${diagram.id}'] = !expanded['${diagram.id}']"
                                    class="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm transition-colors">
                                <span x-text="expanded['${diagram.id}'] ? '➖ Bezár' : '➕ Megnyit'"></span>
                            </button>
                        </div>
                        <div class="explanation-box mb-3">
                            <p class="text-sm"><strong>📋</strong> ${diagram.description}</p>
                        </div>

${diagram.changes.length > 0 ? `
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
${diagram.changes.map((change, i) => `
                                        <tr class="${i % 2 === 0 ? 'bg-orange-50 dark:bg-orange-900/20' : ''}">
                                            <td class="px-2 py-1 text-sm">${i + 1}</td>
                                            <td class="px-2 py-1 text-sm font-medium">${change.section}</td>
                                            <td class="px-2 py-1 text-sm">${change.change}</td>
                                            <td class="px-2 py-1 text-sm text-blue-600 dark:text-blue-400">${change.source}</td>
                                        </tr>
`).join('')}
                                    </tbody>
                                </table>
                            </div>
                        </details>
` : ''}
                        <div x-show="expanded['${diagram.id}']" x-collapse>
                            <div class="diagram-wrapper mb-4">${svgContents[diagram.id]}</div>

                            <div class="bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
                                <label class="block text-sm font-medium mb-2">📝 Megjegyzések:</label>
                                <textarea
                                    x-model="notes['${diagram.id}']"
                                    @input="saveNotes()"
                                    rows="3"
                                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-green-500"
                                    placeholder="Add meg a megjegyzéseidet erről a diagramról..."></textarea>
                            </div>
                        </div>
                    </div>
                </div>
`).join('')}
            </main>
        </div>
    </div>

    <footer class="bg-gray-800 text-white py-6 mt-12">
        <div class="container mx-auto px-4 text-center">
            <p class="text-sm">KGC ERP v6.0 - Inventory Modul Diagramok | Generálva: 2025-12-29</p>
            <p class="text-xs mt-2 text-gray-400">
                Dokumentáció hely: <code>docs/ERP/Inventory/</code> |
                Excalidraw source: <code>docs/ERP/Inventory/flowcharts/*.excalidraw</code>
            </p>
        </div>
    </footer>

    <script>
        function appData() {
            return {
                darkMode: localStorage.getItem('darkMode') === 'true',
                activeTab: 'inv-1',
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
                    a.download = 'kgc-inventory-notes-' + new Date().toISOString().slice(0, 10) + '.csv';
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

// HTML fájl írása
fs.writeFileSync(outputFile, html, 'utf8');
console.log(`✓ HTML generálva: ${outputFile}`);
console.log(`  - ${diagrams.length} diagram beágyazva`);
console.log(`  - Fájl méret: ${Math.round(html.length / 1024)} KB`);
