#!/usr/bin/env node
/**
 * Generate Feature Diagrams Portable HTML
 * Embeds all Feature-*.svg diagrams into a single portable HTML file
 */

const fs = require('fs');
const path = require('path');

const featuresMetadata = {
  'Feature-Torzsvendeg-Szemelyazonositás-Flowchart': {
    title: 'Törzsvendég Személyazonosítás',
    category: 'Ügyfélkezelés',
    description: 'Cégek meghatalmazottjainak személyazonosítása PIN kóddal, opcionálisan személyi igazolvánnyal. Biztosítja a jogosult képviselők azonosítását és a biztonságos átvételt.',
    priority: 'HIGH',
    fitGapId: '#5'
  },
  'Feature-Hetvege-Unnepnap-Kezeles-Flowchart': {
    title: 'Hétvége/Ünnepnap Kezelés',
    category: 'Díjszámítás',
    description: 'Naptár alapú díjszámítás súlyozott napokkal: hétvége (1.5 nap = szombat + vasárnap), ünnepnapok (0.5 nap), munkanapok (1.0 nap). Igazságosabb árazás az ügyfelek számára.',
    priority: 'HIGH',
    fitGapId: '#6'
  },
  'Feature-Listar-Kedvezmeny-Flowchart': {
    title: 'Lista Ár - Kedvezmény',
    category: 'Számlázás',
    description: 'Transzparens árazás számlán: lista ár, kedvezmény százalék, végső egységár külön oszlopokban. Számla láblécen összesített megtakarítás megjelenítése marketing célokra.',
    priority: 'HIGH',
    fitGapId: '#7'
  },
  'Feature-Kartya-Kaucio-Flowchart': {
    title: 'Kártya Alapú Kaució',
    category: 'Pénzügy',
    description: 'Hibrid stratégiás kaució kezelés: ≤7 nap → HOLD (pre-auth), 7-30 nap → CHARGE+REFUND, >30 nap → csak készpénz. Teljes POS terminál integráció banki tranzakciókkal.',
    priority: 'HIGH',
    fitGapId: '#8'
  },
  'Feature-Kaució-Visszatartás-Flowchart': {
    title: 'Kaució Visszatartás',
    category: 'Pénzügy',
    description: 'Részleges vagy teljes kaució visszatartás kár esetén. Jegyzőkönyv készítés, fotódokumentáció, ügyfél jóváhagyás vagy fellebbezés lehetőség.',
    priority: 'MEDIUM',
    fitGapId: '#4'
  },
  'Feature-Munkalap-Berles-Kapcsolat-Flowchart': {
    title: 'Munkalap-Bérlés Kapcsolat',
    category: 'Szerviz',
    description: 'Szerviz munkalapok összekapcsolása bérlésekkel. Visszahozás előtti javítások automatikus számlázása, bérlési időszak alatti karbantartás nyomon követése.',
    priority: 'MEDIUM',
    fitGapId: '#3'
  },
  'Feature-Multi-Location-Kiadas-Flowchart': {
    title: 'Multi-Location Kiadás',
    category: 'Készletkezelés',
    description: 'Bérlés kiadása másik telephelyről mint ahol foglalták. Készletlekötés szinkronizáció, inter-location transzfer kezelés, központi láthatóság.',
    priority: 'MEDIUM',
    fitGapId: '#1'
  },
  'Feature-Multi-Location-Bevetelezes-Flowchart': {
    title: 'Multi-Location Bevételezés',
    category: 'Készletkezelés',
    description: 'Eszközök visszavétele másik telephelyen mint ahol kiadták. Készletmozgás automatikus rögzítése, túlóra-kötbér számítás indulási telephely szerint.',
    priority: 'MEDIUM',
    fitGapId: '#2'
  },
  'Feature-Automatikus-Banki-Elszamolas-Flowchart': {
    title: 'Automatikus Banki Elszámolás',
    category: 'Pénzügy',
    description: 'Napi banki tételek automatikus párosítása számlákkal. Befizetés-azonosítás (ügyfél név, számla szám, összeg), bevételezési bizonylat generálás, párosítatlan tételek kezelése.',
    priority: 'LOW',
    fitGapId: '#11'
  }
};

// Sort features by priority and category
const priorityOrder = { 'HIGH': 1, 'MEDIUM': 2, 'LOW': 3 };
const sortedFeatures = Object.keys(featuresMetadata).sort((a, b) => {
  const metaA = featuresMetadata[a];
  const metaB = featuresMetadata[b];

  // Sort by priority first
  const priDiff = priorityOrder[metaA.priority] - priorityOrder[metaB.priority];
  if (priDiff !== 0) return priDiff;

  // Then by category
  if (metaA.category !== metaB.category) {
    return metaA.category.localeCompare(metaB.category, 'hu');
  }

  // Then by title
  return metaA.title.localeCompare(metaB.title, 'hu');
});

// Group by category
const categories = {};
sortedFeatures.forEach(key => {
  const meta = featuresMetadata[key];
  if (!categories[meta.category]) {
    categories[meta.category] = [];
  }
  categories[meta.category].push({ key, ...meta });
});

// Read SVG files
const svgData = {};
sortedFeatures.forEach(key => {
  const svgPath = path.join(__dirname, `${key}.svg`);
  if (fs.existsSync(svgPath)) {
    svgData[key] = fs.readFileSync(svgPath, 'utf8');
  } else {
    console.warn(`Warning: ${svgPath} not found`);
  }
});

// Count statistics
const highCount = sortedFeatures.filter(k => featuresMetadata[k].priority === 'HIGH').length;
const mediumCount = sortedFeatures.filter(k => featuresMetadata[k].priority === 'MEDIUM').length;
const lowCount = sortedFeatures.filter(k => featuresMetadata[k].priority === 'LOW').length;

// Generate HTML
const html = `<!DOCTYPE html>
<html lang="hu" x-data="appData()" :class="{ 'dark': darkMode }">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>KGC ERP v3.0 - Feature Flowcharts (2025-12-29)</title>
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
        .explanation-box { background: linear-gradient(to right, #eff6ff, #dbeafe); border-left: 4px solid #3b82f6; padding: 1rem; border-radius: 8px; margin-top: 1rem; }
        .dark .explanation-box { background: linear-gradient(to right, rgb(30 58 138 / 0.5), rgb(29 78 216 / 0.5)); }
        .priority-badge { display: inline-block; padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 600; }
        .priority-high { background-color: #fecaca; color: #991b1b; }
        .dark .priority-high { background-color: #7f1d1d; color: #fecaca; }
        .priority-medium { background-color: #fed7aa; color: #9a3412; }
        .dark .priority-medium { background-color: #7c2d12; color: #fed7aa; }
        .priority-low { background-color: #d1fae5; color: #065f46; }
        .dark .priority-low { background-color: #064e3b; color: #d1fae5; }
        @media print { .no-print { display: none !important; } }
        .category-header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 1rem; border-radius: 8px; margin: 2rem 0 1rem 0; }
        .nav-item { cursor: pointer; padding: 0.5rem 0.75rem; border-radius: 6px; transition: all 0.2s; }
        .nav-item:hover { background-color: rgb(243 244 246); }
        .dark .nav-item:hover { background-color: rgb(55 65 81); }
        .nav-item.active { background-color: #3b82f6; color: white; }
    </style>
</head>
<body class="bg-gray-50 dark:bg-gray-900">
    <header class="bg-gradient-to-r from-purple-600 via-purple-700 to-indigo-800 text-white shadow-lg no-print">
        <div class="container mx-auto px-4 py-6">
            <div class="flex flex-col lg:flex-row justify-between items-center">
                <div class="text-center lg:text-left mb-4 lg:mb-0">
                    <h1 class="text-3xl font-bold">KGC ERP v3.0 - Feature Flowcharts</h1>
                    <p class="mt-1 text-purple-100">Fit-Gap Követelmények | Folyamatábrák</p>
                    <p class="text-sm mt-2">
                        <span class="bg-white/20 px-2 py-1 rounded mr-2">📊 ${sortedFeatures.length} diagram</span>
                        <span class="bg-red-500 px-2 py-1 rounded mr-2">🔴 ${highCount} HIGH</span>
                        <span class="bg-orange-500 px-2 py-1 rounded mr-2">🟠 ${mediumCount} MEDIUM</span>
                        <span class="bg-green-500 px-2 py-1 rounded">🟢 ${lowCount} LOW</span>
                        <span class="bg-purple-500 px-2 py-1 rounded ml-2">📅 2025-12-29</span>
                    </p>
                </div>
                <div class="flex space-x-3">
                    <button @click="darkMode = !darkMode" class="p-3 bg-white/20 hover:bg-white/30 rounded-lg transition-colors" title="Sötét/Világos mód">
                        <span x-text="darkMode ? '☀️' : '🌙'"></span>
                    </button>
                    <button onclick="window.print()" class="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors">🖨️ Nyomtatás</button>
                </div>
            </div>
        </div>
    </header>

    <!-- Summary Banner -->
    <div class="bg-gradient-to-r from-purple-100 to-indigo-100 dark:from-purple-900/30 dark:to-indigo-900/30 border-b border-purple-200 dark:border-purple-800 no-print">
        <div class="container mx-auto px-4 py-4">
            <h2 class="text-lg font-bold text-purple-800 dark:text-purple-200 mb-2">📋 Feature Összefoglaló</h2>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div class="bg-white/50 dark:bg-gray-800/50 p-3 rounded-lg">
                    <h3 class="font-bold text-red-600">🔴 HIGH Priority (${highCount})</h3>
                    <ul class="mt-1 text-gray-700 dark:text-gray-300">
${sortedFeatures.filter(k => featuresMetadata[k].priority === 'HIGH').map(k =>
`                        <li>• ${featuresMetadata[k].fitGapId} ${featuresMetadata[k].title}</li>`
).join('\n')}
                    </ul>
                </div>
                <div class="bg-white/50 dark:bg-gray-800/50 p-3 rounded-lg">
                    <h3 class="font-bold text-orange-600">🟠 MEDIUM Priority (${mediumCount})</h3>
                    <ul class="mt-1 text-gray-700 dark:text-gray-300">
${sortedFeatures.filter(k => featuresMetadata[k].priority === 'MEDIUM').map(k =>
`                        <li>• ${featuresMetadata[k].fitGapId} ${featuresMetadata[k].title}</li>`
).join('\n')}
                    </ul>
                </div>
                <div class="bg-white/50 dark:bg-gray-800/50 p-3 rounded-lg">
                    <h3 class="font-bold text-green-600">🟢 LOW Priority (${lowCount})</h3>
                    <ul class="mt-1 text-gray-700 dark:text-gray-300">
${sortedFeatures.filter(k => featuresMetadata[k].priority === 'LOW').map(k =>
`                        <li>• ${featuresMetadata[k].fitGapId} ${featuresMetadata[k].title}</li>`
).join('\n')}
                    </ul>
                </div>
            </div>
        </div>
    </div>

    <div class="container mx-auto px-4 py-8">
        <div class="grid grid-cols-12 gap-6">
            <!-- Sidebar Navigation -->
            <aside class="col-span-12 lg:col-span-3 no-print">
                <div class="sticky-sidebar bg-white dark:bg-gray-800 p-4 rounded-xl shadow-lg">
                    <h2 class="text-lg font-bold mb-4 flex items-center">
                        <span class="mr-2">📋</span> Kategóriák
                    </h2>
                    <div class="space-y-2">
${Object.keys(categories).map(cat => `
                        <div>
                            <h3 class="font-semibold text-sm text-gray-500 dark:text-gray-400 mb-1">${cat}</h3>
${categories[cat].map(feature => `
                            <div class="nav-item" @click="scrollToSection('${feature.key}')">
                                <div class="flex items-center justify-between">
                                    <span class="text-sm">${feature.fitGapId} ${feature.title}</span>
                                    <span class="priority-badge priority-${feature.priority.toLowerCase()}">${feature.priority}</span>
                                </div>
                            </div>
`).join('')}
                        </div>
`).join('')}
                    </div>
                </div>
            </aside>

            <!-- Main Content -->
            <main class="col-span-12 lg:col-span-9">
${Object.keys(categories).map(cat => `
                <div class="category-header">
                    <h2 class="text-2xl font-bold">${cat}</h2>
                </div>
${categories[cat].map(feature => `
                <div class="diagram-container" id="${feature.key}">
                    <div class="flex justify-between items-start mb-3">
                        <div>
                            <h3 class="text-xl font-bold text-gray-800 dark:text-gray-100">
                                ${feature.fitGapId} ${feature.title}
                            </h3>
                            <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">${feature.category}</p>
                        </div>
                        <span class="priority-badge priority-${feature.priority.toLowerCase()}">${feature.priority}</span>
                    </div>

                    <div class="explanation-box">
                        <p class="text-sm text-gray-700 dark:text-gray-300">${feature.description}</p>
                    </div>

                    <div class="diagram-wrapper mt-4">
                        ${svgData[feature.key] || '<p class="text-red-500">SVG not found</p>'}
                    </div>
                </div>
`).join('')}
`).join('')}
            </main>
        </div>
    </div>

    <footer class="bg-gray-800 text-white py-6 mt-12">
        <div class="container mx-auto px-4 text-center">
            <p class="text-sm">
                KGC ERP v3.0 Feature Flowcharts | Generálva: ${new Date().toLocaleString('hu-HU')}
            </p>
            <p class="text-xs text-gray-400 mt-2">
                🤖 Portable HTML (All SVGs embedded) | BMAD Method Workflow
            </p>
        </div>
    </footer>

    <script>
        function appData() {
            return {
                darkMode: false,
                scrollToSection(id) {
                    const element = document.getElementById(id);
                    if (element) {
                        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                }
            };
        }
    </script>
</body>
</html>`;

// Write HTML file
const outputPath = path.join(__dirname, '../Feature-Diagramok-2025-12-29.html');
fs.writeFileSync(outputPath, html);

console.log(`✅ Feature Diagrams HTML generated: ${outputPath}`);
console.log(`   📊 Total diagrams: ${sortedFeatures.length}`);
console.log(`   🔴 HIGH priority: ${highCount}`);
console.log(`   🟠 MEDIUM priority: ${mediumCount}`);
console.log(`   🟢 LOW priority: ${lowCount}`);
console.log(`   📂 Categories: ${Object.keys(categories).join(', ')}`);
